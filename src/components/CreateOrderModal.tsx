import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput } from '@/utils/security';
import { Plus, Calendar as CalendarIcon, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ORDER_CATEGORIES = [
  'Грузчики',
  'Разнорабочие',
  'Квартирный переезд',
  'Офисный переезд',
  'Погрузка/разгрузка',
  'Сборка мебели',
  'Уборка',
  'Ремонтные работы',
  'Строительные работы',
  'Другое'
];

const DELIVERY_FORMATS = [
  'Выполнение работ на объекте',
  'Услуга с фотоотчетом',
  'Консультация по телефону',
  'Почасовая работа',
  'Другое'
];

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  adId?: string;
}

export const CreateOrderModal = ({ isOpen, onClose, onOrderCreated, adId }: CreateOrderModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [orderData, setOrderData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    priority: 'normal',
    deadline: null as Date | null,
    delivery_format: '',
    max_revisions: '3',
    client_requirements: {
      specifications: '',
      additional_notes: '',
      preferred_communication: 'chat'
    }
  });

  const handleCreateOrder = async () => {
    if (!user?.id) {
      toast({
        title: "Ошибка авторизации",
        description: "Необходимо войти в систему",
        variant: "destructive"
      });
      return;
    }

    if (!orderData.title.trim() || !orderData.description.trim() || !orderData.price.trim()) {
      toast({
        title: "Заполните обязательные поля",
        description: "Название, описание и цена обязательны",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(orderData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Неверная цена",
        description: "Укажите корректную сумму",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Проверяем баланс пользователя
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData || profileData.balance < price) {
        toast({
          title: "Недостаточно средств",
          description: "Пополните баланс для создания заказа",
          variant: "destructive"
        });
        return;
      }

      // Calculate platform fee (10% commission)
      const commissionRate = 10;
      const platformFee = (price * commissionRate) / 100;

      // Создаем заказ
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          title: sanitizeInput(orderData.title),
          description: sanitizeInput(orderData.description),
          category: orderData.category,
          price: price,
          priority: orderData.priority,
          deadline: orderData.deadline?.toISOString(),
          client_id: user.id,
          ad_id: adId || null,
          delivery_format: orderData.delivery_format,
          max_revisions: parseInt(orderData.max_revisions),
          commission_rate: commissionRate,
          platform_fee: platformFee,
          client_requirements: {
            ...orderData.client_requirements,
            specifications: sanitizeInput(orderData.client_requirements.specifications),
            additional_notes: sanitizeInput(orderData.client_requirements.additional_notes)
          }
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Создаем транзакцию для списания средств (сначала pending, потом completed для срабатывания триггера)
      console.log('Creating transaction for user:', user.id, 'amount:', price);
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: price,
          status: 'pending',
          payment_details: {
            order_id: newOrder.id,
            order_number: newOrder.order_number,
            description: `Оплата заказа: ${sanitizeInput(orderData.title)}`
          }
        })
        .select()
        .single();

      console.log('Transaction creation result:', { error: transactionError, transaction });
      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      // Обновляем статус транзакции на completed для автоматического списания средств
      console.log('Updating transaction status to completed:', transaction.id);
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      console.log('Transaction update result:', { error: updateError });
      if (updateError) {
        console.error('Transaction update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Заказ создан",
        description: "Ваш заказ успешно создан и оплачен с баланса"
      });

      // Reset form
      setOrderData({
        title: '',
        description: '',
        category: '',
        price: '',
        priority: 'normal',
        deadline: null,
        delivery_format: '',
        max_revisions: '3',
        client_requirements: {
          specifications: '',
          additional_notes: '',
          preferred_communication: 'chat'
        }
      });

      onOrderCreated();
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-steel-100">
            <Package className="w-5 h-5 text-primary" />
            <span>Создать заказ</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-steel-100">Основная информация</h3>
            
            <div>
              <Label htmlFor="title">Название заказа *</Label>
              <Input
                id="title"
                value={orderData.title}
                onChange={(e) => setOrderData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Краткое описание того, что нужно сделать"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Подробное описание *</Label>
              <Textarea
                id="description"
                value={orderData.description}
                onChange={(e) => setOrderData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Детальное описание задачи, требований и ожиданий"
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={orderData.category}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Бюджет (GT) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={orderData.price}
                  onChange={(e) => setOrderData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Сумма вознаграждения"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <Select
                  value={orderData.priority}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочный (+20% к стоимости)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Срок выполнения</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderData.deadline ? (
                        format(orderData.deadline, 'dd.MM.yyyy', { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={orderData.deadline || undefined}
                      onSelect={(date) => {
                        setOrderData(prev => ({ ...prev, deadline: date || null }));
                        setShowCalendar(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-steel-100">Требования к выполнению</h3>
            
            <div>
              <Label htmlFor="delivery_format">Формат предоставления результата</Label>
              <Select
                value={orderData.delivery_format}
                onValueChange={(value) => setOrderData(prev => ({ ...prev, delivery_format: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Как должен быть предоставлен результат" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_FORMATS.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="specifications">Технические требования</Label>
              <Textarea
                id="specifications"
                value={orderData.client_requirements.specifications}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: {
                    ...prev.client_requirements,
                    specifications: e.target.value
                  }
                }))}
                placeholder="Технические спецификации, используемые технологии, стандарты и т.д."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="max_revisions">Максимум доработок</Label>
              <Select
                value={orderData.max_revisions}
                onValueChange={(value) => setOrderData(prev => ({ ...prev, max_revisions: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 доработка</SelectItem>
                  <SelectItem value="2">2 доработки</SelectItem>
                  <SelectItem value="3">3 доработки (рекомендуется)</SelectItem>
                  <SelectItem value="5">5 доработок</SelectItem>
                  <SelectItem value="unlimited">Без ограничений</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="additional_notes">Дополнительные замечания</Label>
              <Textarea
                id="additional_notes"
                value={orderData.client_requirements.additional_notes}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: {
                    ...prev.client_requirements,
                    additional_notes: e.target.value
                  }
                }))}
                placeholder="Любая дополнительная информация, которая может быть полезна исполнителю"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="communication">Предпочитаемый способ связи</Label>
              <Select
                value={orderData.client_requirements.preferred_communication}
                onValueChange={(value) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: {
                    ...prev.client_requirements,
                    preferred_communication: value
                  }
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Чат на платформе</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Телефон</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price breakdown */}
          {orderData.price && !isNaN(parseFloat(orderData.price)) && (
            <div className="bg-steel-800/30 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-steel-100">Расчет стоимости:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-steel-300">Вознаграждение исполнителя:</span>
                  <span className="text-steel-100">{parseFloat(orderData.price).toLocaleString('ru-RU')} GT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-300">Комиссия платформы (10%):</span>
                  <span className="text-steel-100">{((parseFloat(orderData.price) * 10) / 100).toLocaleString('ru-RU')} GT</span>
                </div>
                <div className="border-t border-steel-600 pt-1 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-steel-100">Итого к оплате:</span>
                    <span className="text-primary">{(parseFloat(orderData.price) + (parseFloat(orderData.price) * 10) / 100).toLocaleString('ru-RU')} GT</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleCreateOrder}
              disabled={isCreating || !orderData.title.trim() || !orderData.description.trim() || !orderData.price.trim()}
              className="flex-1"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Создать заказ
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};