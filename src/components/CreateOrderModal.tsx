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
import { validateAmount, formatBalance, formatRubles } from '@/utils/currency';
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
  'Уборка помещений',
  'Строительные работы',
  'Ремонтные работы',
  'Демонтаж',
  'Подсобные работы',
  'Складские работы',
  'Курьерские услуги',
  'Садовые работы',
  'Другое'
];

const PAYMENT_TYPES = [
  'hourly', // Почасовая оплата
  'daily',  // Дневная оплата  
  'project' // За весь объем работ
];

const WORK_FORMATS = [
  'На объекте заказчика',
  'С проживанием на объекте',
  'Удаленно (если возможно)',
  'По графику заказчика'
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
  const [userBalance, setUserBalance] = useState<number>(0);
  
  const [orderData, setOrderData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    payment_type: 'daily', // hourly, daily, project
    priority: 'normal',
    deadline: null as Date | null,
    work_format: '',
    people_count: '2',
    work_duration: '',
    client_requirements: {
      specifications: '',
      location: '',
      additional_notes: '',
      preferred_communication: 'chat'
    }
  });

  // Загружаем баланс пользователя при открытии модала
  const loadUserBalance = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserBalance(profileData?.balance || 0);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  // Загружаем баланс при открытии модала
  if (isOpen && user?.id && userBalance === 0) {
    loadUserBalance();
  }

  const handleCreateOrder = async () => {
    if (!user?.id) {
      toast({
        title: "Ошибка авторизации",
        description: "Необходимо войти в систему",
        variant: "destructive"
      });
      return;
    }

    if (!orderData.title.trim() || !orderData.description.trim() || !orderData.price.trim() || !orderData.client_requirements.location.trim()) {
      toast({
        title: "Заполните обязательные поля",
        description: "Название, описание, цена и адрес объекта обязательны",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(orderData.price);
    const validation = validateAmount(price);
    
    if (!validation.isValid) {
      toast({
        title: "Неверная цена",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    // Calculate total cost with platform fee
    const commissionRate = 10;
    const platformFee = (price * commissionRate) / 100;
    const totalCost = price + platformFee;

    setIsCreating(true);

    try {
      // Проверяем баланс пользователя
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData || profileData.balance < totalCost) {
        toast({
          title: "Недостаточно средств",
          description: `Необходимо ${formatBalance(totalCost).gtCoins} для создания заказа. Пополните баланс.`,
          variant: "destructive"
        });
        return;
      }

      // Platform fee already calculated above

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
          delivery_format: orderData.work_format,
          max_revisions: parseInt(orderData.people_count),
          commission_rate: commissionRate,
          platform_fee: platformFee,
          payment_method: orderData.payment_type,
          client_requirements: {
            ...orderData.client_requirements,
            payment_type: orderData.payment_type,
            work_duration: orderData.work_duration,
            people_count: orderData.people_count,
            specifications: sanitizeInput(orderData.client_requirements.specifications),
            location: sanitizeInput(orderData.client_requirements.location),
            additional_notes: sanitizeInput(orderData.client_requirements.additional_notes)
          }
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Создаем чат для заказа автоматически
      console.log('Creating conversation for order:', newOrder.id);
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          type: 'chat',
          title: `Чат по заказу: ${sanitizeInput(orderData.title)}`,
          participants: [user.id], // Сначала добавляем только клиента
          created_by: user.id,
          status: 'active'
        })
        .select()
        .single();

      console.log('Conversation creation result:', { error: conversationError, conversation });
      
      if (conversationError) {
        console.error('Conversation creation error:', conversationError);
        // Не бросаем ошибку, так как заказ уже создан
        toast({
          title: "Заказ создан",
          description: "Заказ создан, но возникла проблема с созданием чата",
          variant: "default"
        });
      } else {
        // Обновляем заказ с ID беседы (если есть поле для этого)
        console.log('Conversation created successfully:', conversation.id);
      }

      // Создаем транзакцию для списания средств (сначала pending, потом completed для срабатывания триггера)
      console.log('Creating transaction for user:', user.id, 'amount:', price);
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: totalCost,
          status: 'pending',
          payment_details: {
            order_id: newOrder.id,
            order_number: newOrder.order_number,
            description: `Оплата заказа: ${sanitizeInput(orderData.title)}`,
            breakdown: {
              executor_payment: price,
              platform_fee: platformFee,
              total: totalCost
            }
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
        description: `Заказ успешно создан. Списано ${formatBalance(totalCost).gtCoins} с баланса`
      });

      // Reset form
      setOrderData({
        title: '',
        description: '',
        category: '',
        price: '',
        payment_type: 'daily',
        priority: 'normal',
        deadline: null,
        work_format: '',
        people_count: '2',
        work_duration: '',
        client_requirements: {
          specifications: '',
          location: '',
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
      <DialogContent className="card-steel-dialog max-w-2xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
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
                placeholder="Например: Нужны грузчики для переезда"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Описание работы *</Label>
              <Textarea
                id="description"
                value={orderData.description}
                onChange={(e) => setOrderData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Подробно опишите что нужно сделать, условия работы, требования"
                className="mt-1 min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Тип работы</Label>
                <Select
                  value={orderData.category}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите тип работы" />
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
                <Label htmlFor="payment_type">Тип оплаты</Label>
                <Select
                  value={orderData.payment_type}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, payment_type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Почасовая оплата</SelectItem>
                    <SelectItem value="daily">Дневная оплата</SelectItem>
                    <SelectItem value="project">За весь объем</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">
                  Оплата (₽) * 
                  {orderData.payment_type === 'hourly' && ' за час'}
                  {orderData.payment_type === 'daily' && ' за день'}
                  {orderData.payment_type === 'project' && ' за весь объем'}
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={orderData.price}
                  onChange={(e) => setOrderData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder={
                    orderData.payment_type === 'hourly' ? "Ставка за час" :
                    orderData.payment_type === 'daily' ? "Оплата за день" :
                    "Общая сумма"
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="people_count">Количество рабочих</Label>
                <Select
                  value={orderData.people_count}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, people_count: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 человек</SelectItem>
                    <SelectItem value="2">2 человека</SelectItem>
                    <SelectItem value="3">3 человека</SelectItem>
                    <SelectItem value="4">4 человека</SelectItem>
                    <SelectItem value="5">5 человек</SelectItem>
                    <SelectItem value="6">6 человек</SelectItem>
                    <SelectItem value="10">10+ человек</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Дата начала работы</Label>
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

              <div>
                <Label htmlFor="work_duration">Продолжительность работы</Label>
                <Select
                  value={orderData.work_duration}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, work_duration: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Сколько дней/часов" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-day">1 день</SelectItem>
                    <SelectItem value="2-days">2 дня</SelectItem>
                    <SelectItem value="3-days">3 дня</SelectItem>
                    <SelectItem value="1-week">1 неделя</SelectItem>
                    <SelectItem value="2-weeks">2 недели</SelectItem>
                    <SelectItem value="1-month">1 месяц</SelectItem>
                    <SelectItem value="ongoing">На постоянной основе</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-steel-100">Условия работы</h3>
            
            <div>
              <Label htmlFor="location">Адрес объекта *</Label>
              <Textarea
                id="location"
                value={orderData.client_requirements.location}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: {
                    ...prev.client_requirements,
                    location: e.target.value
                  }
                }))}
                placeholder="Точный адрес, этажность, наличие лифта, особенности объекта"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="work_format">Формат работы</Label>
              <Select
                value={orderData.work_format}
                onValueChange={(value) => setOrderData(prev => ({ ...prev, work_format: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите формат работы" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_FORMATS.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="specifications">Требования к рабочим</Label>
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
                placeholder="Опыт работы, физическая подготовка, наличие инструментов, спецодежды"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="additional_notes">График и условия оплаты</Label>
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
                placeholder="Рабочее время, перерывы, питание, когда и как будет производиться оплата"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="communication">Способ связи</Label>
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
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="phone">Телефон</SelectItem>
                  <SelectItem value="chat">Чат на платформе</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Balance and Price breakdown */}
          <div className="bg-steel-800/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-steel-100">Ваш баланс:</h4>
              <div className="text-right">
                <div className="text-primary font-semibold">{formatBalance(userBalance).gtCoins}</div>
                <div className="text-xs text-steel-400">{formatBalance(userBalance).rubles}</div>
              </div>
            </div>
            
            {orderData.price && !isNaN(parseFloat(orderData.price)) && (
              <>
                <div className="border-t border-steel-600 pt-3">
                  <h4 className="font-semibold text-steel-100 mb-2">Расчет стоимости:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-steel-300">Вознаграждение исполнителя:</span>
                      <div className="text-right">
                        <div className="text-steel-100">{formatBalance(parseFloat(orderData.price)).gtCoins}</div>
                        <div className="text-xs text-steel-400">{formatBalance(parseFloat(orderData.price)).rubles}</div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-steel-300">Комиссия платформы (10%):</span>
                      <div className="text-right">
                        <div className="text-steel-100">{formatBalance((parseFloat(orderData.price) * 10) / 100).gtCoins}</div>
                        <div className="text-xs text-steel-400">{formatBalance((parseFloat(orderData.price) * 10) / 100).rubles}</div>
                      </div>
                    </div>
                    <div className="border-t border-steel-600 pt-1 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-steel-100">Итого к оплате:</span>
                        <div className="text-right">
                          <div className="text-primary">{formatBalance(parseFloat(orderData.price) + (parseFloat(orderData.price) * 10) / 100).gtCoins}</div>
                          <div className="text-xs text-steel-400">{formatBalance(parseFloat(orderData.price) + (parseFloat(orderData.price) * 10) / 100).rubles}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Warning if insufficient balance */}
                    {parseFloat(orderData.price) + (parseFloat(orderData.price) * 10) / 100 > userBalance && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                        ⚠️ Недостаточно средств на балансе. Пополните баланс для создания заказа.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleCreateOrder}
              disabled={isCreating || !orderData.title.trim() || !orderData.description.trim() || !orderData.price.trim() || !orderData.client_requirements.location.trim()}
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