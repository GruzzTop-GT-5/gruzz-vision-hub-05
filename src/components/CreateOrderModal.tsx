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

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Обычный (15 GT)', cost: 15 },
  { value: 'high', label: 'Высокий (35 GT)', cost: 35 },
  { value: 'urgent', label: 'Срочно (55 GT)', cost: 55 }
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
  const [priorityCosts, setPriorityCosts] = useState({ normal: 15, high: 35, urgent: 55 });
  
  const [orderData, setOrderData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    payment_type: 'daily', // hourly, daily, project
    priority: 'normal',
    deadline: null as Date | null,
    work_format: '',
    people_needed: '1',
    start_time: '',
    work_duration: '',
    client_requirements: {
      specifications: '',
      location: '',
      additional_notes: '',
      preferred_communication: 'chat'
    },
    // Дополнительные услуги
    additional_services: {
      compressor_rent: {
        enabled: false,
        hours: 8,
        delivery_hours: 1,
        work_type: '',
        equipment: [] as string[]
      },
      garbage_removal: {
        enabled: false,
        waste_type: '',
        volume: '',
        needs_loading: false
      }
    }
  });

  // Загружаем баланс пользователя и стоимость публикации при открытии модала
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

  const loadPriorityCosts = async () => {
    try {
      const { data: setting, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'priority_costs')
        .single();

      if (error) throw error;
      if (setting?.setting_value) {
        setPriorityCosts(setting.setting_value as any);
      }
    } catch (error) {
      console.error('Error loading priority costs:', error);
    }
  };

  // Загружаем баланс и стоимость публикации при открытии модала
  if (isOpen && user?.id && userBalance === 0) {
    loadUserBalance();
    loadPriorityCosts();
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

    // Проверка на дублирование - ищем похожие активные заказы пользователя
    try {
      const { data: existingOrders, error: checkError } = await supabase
        .from('orders')
        .select('id, title, order_number')
        .eq('client_id', user.id)
        .in('status', ['pending', 'accepted', 'in_progress']) // Активные заказы
        .ilike('title', `%${orderData.title.substring(0, 20)}%`); // Проверяем по первым 20 символам заголовка

      if (checkError) throw checkError;

      if (existingOrders && existingOrders.length > 0) {
        const existingTitle = existingOrders[0].title;
        const similarity = orderData.title.toLowerCase().includes(existingTitle.toLowerCase().substring(0, 15)) ||
                          existingTitle.toLowerCase().includes(orderData.title.toLowerCase().substring(0, 15));
        
        if (similarity) {
          toast({
            title: "Похожий заказ уже существует",
            description: `У вас уже есть активный заказ: "${existingTitle}" (${existingOrders[0].order_number}). Нельзя создавать дубликаты заказов.`,
            variant: "destructive"
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking for duplicate orders:', error);
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

    // Общая стоимость = стоимость по приоритету
    const totalCost = priorityCosts[orderData.priority as keyof typeof priorityCosts] || 15;

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
          description: `Необходимо ${formatBalance(totalCost).gtCoins} для публикации заказа. Пополните баланс.`,
          variant: "destructive"
        });
        return;
      }

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
          max_revisions: 3,
          people_needed: parseInt(orderData.people_needed),
          people_accepted: 0,
          start_time: orderData.start_time || null,
          commission_rate: 0,
          platform_fee: 0,
          payment_method: orderData.payment_type,
          client_requirements: {
            ...orderData.client_requirements,
            payment_type: orderData.payment_type,
            work_duration: orderData.work_duration,
            people_needed: orderData.people_needed,
            specifications: sanitizeInput(orderData.client_requirements.specifications),
            location: sanitizeInput(orderData.client_requirements.location),
            additional_notes: sanitizeInput(orderData.client_requirements.additional_notes),
            additional_services: orderData.additional_services
          }
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Создаем чат для заказа автоматически
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

      if (conversationError) {
        console.error('Conversation creation error:', conversationError);
        // Не бросаем ошибку, так как заказ уже создан
        toast({
          title: "Заказ создан",
          description: "Заказ создан, но возникла проблема с созданием чата",
          variant: "default"
        });
      }

      // Создаем транзакцию для списания фиксированной платы за публикацию
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
            description: `Плата за публикацию заказа: ${sanitizeInput(orderData.title)}`,
            priority: orderData.priority,
            breakdown: {
              priority_fee: totalCost,
              total: totalCost
            }
          }
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      // Обновляем статус транзакции на completed для автоматического списания средств
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Transaction update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Заказ создан",
        description: `Заказ успешно создан. Списано ${formatBalance(totalCost).gtCoins} за публикацию`
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
        people_needed: '1',
        start_time: '',
        work_duration: '',
        client_requirements: {
          specifications: '',
          location: '',
          additional_notes: '',
          preferred_communication: 'chat'
        },
        additional_services: {
          compressor_rent: {
            enabled: false,
            hours: 8,
            delivery_hours: 1,
            work_type: '',
            equipment: []
          },
          garbage_removal: {
            enabled: false,
            waste_type: '',
            volume: '',
            needs_loading: false
          }
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

  const getCurrentPriorityCost = () => {
    return priorityCosts[orderData.priority as keyof typeof priorityCosts] || 15;
  };

  const calculateAdditionalServicesCost = () => {
    let totalCost = 0;
    
    // Аренда компрессора
    if (orderData.additional_services.compressor_rent.enabled) {
      const compressorHours = orderData.additional_services.compressor_rent.hours + orderData.additional_services.compressor_rent.delivery_hours;
      totalCost += compressorHours * 1500; // 1500₽ за час
    }
    
    // Вывоз мусора
    if (orderData.additional_services.garbage_removal.enabled) {
      const volume = orderData.additional_services.garbage_removal.volume;
      switch (volume) {
        case '1-2_containers':
          totalCost += 4000;
          break;
        case '1_gazelle':
          totalCost += 6500;
          break;
        case '1_kamaz':
          totalCost += 11500;
          break;
        case 'multiple':
          totalCost += 20000;
          break;
      }
    }
    
    return totalCost;
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
          {/* Balance Display */}
          <div className="p-4 bg-steel-900/50 rounded-lg border border-steel-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-steel-300">Ваш баланс:</span>
                <span className="font-bold text-primary">{userBalance} GT Coins</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-steel-400">Стоимость размещения:</p>
                <p className="font-bold text-primary">{getCurrentPriorityCost()} GT Coins</p>
                {calculateAdditionalServicesCost() > 0 && (
                  <>
                    <p className="text-sm text-steel-400 mt-1">Доп. услуги (примерно):</p>
                    <p className="font-bold text-primary">{calculateAdditionalServicesCost().toLocaleString()} ₽</p>
                  </>
                )}
              </div>
            </div>
            {userBalance < getCurrentPriorityCost() && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  Недостаточно средств. Пополните баланс.
                </p>
              </div>
            )}
          </div>

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
                <Label htmlFor="category">Категория работы</Label>
                <Input
                  id="category"
                  value={orderData.category}
                  onChange={(e) => setOrderData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Например: Разнорабочие, Грузчики, Переезд"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <Select
                  value={orderData.priority}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
                <Label htmlFor="people_needed">Нужно людей</Label>
                <Input
                  id="people_needed"
                  type="number"
                  min="1"
                  value={orderData.people_needed}
                  onChange={(e) => setOrderData(prev => ({ ...prev, people_needed: e.target.value }))}
                  placeholder="1"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="start_time">Время начала работы</Label>
              <Input
                id="start_time"
                type="time"
                value={orderData.start_time}
                onChange={(e) => setOrderData(prev => ({ ...prev, start_time: e.target.value }))}
                className="mt-1"
                placeholder="Когда нужно быть готовым к работе"
              />
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
                    <SelectValue placeholder="Выберите продолжительность" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2 часа">1-2 часа</SelectItem>
                    <SelectItem value="3-4 часа">3-4 часа</SelectItem>
                    <SelectItem value="Полдня">Полдня</SelectItem>
                    <SelectItem value="Полный день">Полный день</SelectItem>
                    <SelectItem value="Несколько дней">Несколько дней</SelectItem>
                    <SelectItem value="Неделя">Неделя</SelectItem>
                    <SelectItem value="Больше недели">Больше недели</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          </div>

          {/* Additional Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-steel-100">Дополнительные услуги</h3>
            
            {/* Compressor Rent */}
            <div className="p-4 bg-steel-900/30 rounded-lg border border-steel-700">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="compressor_enabled"
                  checked={orderData.additional_services.compressor_rent.enabled}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    additional_services: {
                      ...prev.additional_services,
                      compressor_rent: { ...prev.additional_services.compressor_rent, enabled: e.target.checked }
                    }
                  }))}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="compressor_enabled" className="text-steel-200 font-medium">
                  🔨 Аренда компрессора (7+1: 7 часов работы + 1 час подачи)
                </Label>
              </div>
              
              {orderData.additional_services.compressor_rent.enabled && (
                <div className="space-y-4 pl-7">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Часов работы</Label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        value={orderData.additional_services.compressor_rent.hours}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          additional_services: {
                            ...prev.additional_services,
                            compressor_rent: { ...prev.additional_services.compressor_rent, hours: parseInt(e.target.value) || 8 }
                          }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Часов подачи</Label>
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        value={orderData.additional_services.compressor_rent.delivery_hours}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          additional_services: {
                            ...prev.additional_services,
                            compressor_rent: { ...prev.additional_services.compressor_rent, delivery_hours: parseInt(e.target.value) || 1 }
                          }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Тип работ</Label>
                    <Select
                      value={orderData.additional_services.compressor_rent.work_type}
                      onValueChange={(value) => setOrderData(prev => ({
                        ...prev,
                        additional_services: {
                          ...prev.additional_services,
                          compressor_rent: { ...prev.additional_services.compressor_rent, work_type: value }
                        }
                      }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Выберите тип работ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demolition">Демонтаж</SelectItem>
                        <SelectItem value="blowing">Продувка</SelectItem>
                        <SelectItem value="painting">Покраска</SelectItem>
                        <SelectItem value="other">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-steel-400">
                    Примерная стоимость: <span className="text-primary font-medium">
                      {(orderData.additional_services.compressor_rent.hours + orderData.additional_services.compressor_rent.delivery_hours) * 1500} ₽
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Garbage Removal */}
            <div className="p-4 bg-steel-900/30 rounded-lg border border-steel-700">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="garbage_enabled"
                  checked={orderData.additional_services.garbage_removal.enabled}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    additional_services: {
                      ...prev.additional_services,
                      garbage_removal: { ...prev.additional_services.garbage_removal, enabled: e.target.checked }
                    }
                  }))}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="garbage_enabled" className="text-steel-200 font-medium">
                  🚛 Вывоз мусора (стоимость от объёма)
                </Label>
              </div>
              
              {orderData.additional_services.garbage_removal.enabled && (
                <div className="space-y-4 pl-7">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Тип мусора</Label>
                      <Select
                        value={orderData.additional_services.garbage_removal.waste_type}
                        onValueChange={(value) => setOrderData(prev => ({
                          ...prev,
                          additional_services: {
                            ...prev.additional_services,
                            garbage_removal: { ...prev.additional_services.garbage_removal, waste_type: value }
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Выберите тип мусора" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="construction">Строительный мусор</SelectItem>
                          <SelectItem value="household">Бытовой мусор</SelectItem>
                          <SelectItem value="bulky">Крупногабаритный мусор</SelectItem>
                          <SelectItem value="mixed">Смешанный</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Объём</Label>
                      <Select
                        value={orderData.additional_services.garbage_removal.volume}
                        onValueChange={(value) => setOrderData(prev => ({
                          ...prev,
                          additional_services: {
                            ...prev.additional_services,
                            garbage_removal: { ...prev.additional_services.garbage_removal, volume: value }
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Выберите объём" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2_containers">1-2 контейнера</SelectItem>
                          <SelectItem value="1_gazelle">1 Газель</SelectItem>
                          <SelectItem value="1_kamaz">1 КамАЗ</SelectItem>
                          <SelectItem value="multiple">Больше 1 КамАЗа</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="needs_loading"
                      checked={orderData.additional_services.garbage_removal.needs_loading}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        additional_services: {
                          ...prev.additional_services,
                          garbage_removal: { ...prev.additional_services.garbage_removal, needs_loading: e.target.checked }
                        }
                      }))}
                      className="w-4 h-4 text-primary"
                    />
                    <Label htmlFor="needs_loading" className="text-steel-300">
                      Нужна погрузка грузчиками
                    </Label>
                  </div>
                  <div className="text-sm text-steel-400">
                    Примерная стоимость: <span className="text-primary font-medium">
                      {orderData.additional_services.garbage_removal.volume === '1-2_containers' ? '3000-5000' :
                       orderData.additional_services.garbage_removal.volume === '1_gazelle' ? '5000-8000' :
                       orderData.additional_services.garbage_removal.volume === '1_kamaz' ? '8000-15000' :
                       '15000+'} ₽
                    </span>
                    {orderData.additional_services.garbage_removal.needs_loading && ' + стоимость погрузки'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location and Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-steel-100">Место работы и требования</h3>
            
            <div>
              <Label htmlFor="location">Адрес объекта *</Label>
              <Textarea
                id="location"
                value={orderData.client_requirements.location}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: { ...prev.client_requirements, location: e.target.value }
                }))}
                placeholder="Укажите полный адрес или ближайшую станцию метро"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="specifications">Технические требования и детали</Label>
              <Textarea
                id="specifications"
                value={orderData.client_requirements.specifications}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: { ...prev.client_requirements, specifications: e.target.value }
                }))}
                placeholder="Опишите специфические требования к работе, инструменты, опыт работы"
                className="mt-1 min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="additional_notes">Дополнительные пожелания</Label>
              <Textarea
                id="additional_notes"
                value={orderData.client_requirements.additional_notes}
                onChange={(e) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: { ...prev.client_requirements, additional_notes: e.target.value }
                }))}
                placeholder="Любые дополнительные комментарии или пожелания"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="preferred_communication">Предпочитаемый способ связи</Label>
              <Select
                value={orderData.client_requirements.preferred_communication}
                onValueChange={(value) => setOrderData(prev => ({
                  ...prev,
                  client_requirements: { ...prev.client_requirements, preferred_communication: value }
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Чат в приложении</SelectItem>
                  <SelectItem value="phone">Телефонный звонок</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="any">Любой удобный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={onClose}
              variant="outline" 
              className="flex-1"
              disabled={isCreating}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleCreateOrder}
              className="flex-1"
              disabled={isCreating || !orderData.title.trim() || !orderData.description.trim() || !orderData.price.trim() || userBalance < getCurrentPriorityCost()}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Создание...
                </>
              ) : (
                `Создать заказ за ${getCurrentPriorityCost()} GT`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};