import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { validateAmount, formatBalance } from '@/utils/currency';
import { Plus, Calendar as CalendarIcon, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Обычный (15 GT)', cost: 15 },
  { value: 'high', label: 'Высокий (35 GT)', cost: 35 },
  { value: 'urgent', label: 'Срочно (55 GT)', cost: 55 }
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
  const [currentStep, setCurrentStep] = useState<'service-type' | 'order-details'>('service-type');
  
  const [orderData, setOrderData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    payment_type: 'daily',
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
    additional_services: {
      compressor_rent: {
        enabled: false,
        hours: 8,
        delivery_hours: 1,
        work_type: '',
        equipment: [] as string[],
        hammer_type: 'light',
        hammer_count: 1,
        has_blowing_hoses: false,
        hose_length: 50,
        gas_pipe_testing: false,
        payment_method: 'cash'
      },
      garbage_removal: {
        enabled: false,
        waste_type: '',
        volume: '',
        vehicle_type: 'gazelle_12',
        needs_loading: false
      }
    }
  });

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

    const totalCost = priorityCosts[orderData.priority as keyof typeof priorityCosts] || 15;
    setIsCreating(true);

    try {
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

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

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
            equipment: [],
            hammer_type: 'light',
            hammer_count: 1,
            has_blowing_hoses: false,
            hose_length: 50,
            gas_pipe_testing: false,
            payment_method: 'cash'
          },
          garbage_removal: {
            enabled: false,
            waste_type: '',
            volume: '',
            vehicle_type: 'gazelle_12',
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
      const service = orderData.additional_services.compressor_rent;
      const compressorHours = service.hours + service.delivery_hours;
      
      // Базовая стоимость компрессора (зависит от мощности и типа молотков)
      const baseRates = {
        light: 1200,   // Легкий компрессор для легких молотков
        medium: 1500,  // Средний компрессор для средних молотков
        heavy: 1800    // Мощный компрессор для тяжелых молотков
      };
      
      let baseCost = compressorHours * baseRates[service.hammer_type as keyof typeof baseRates];
      
      // Стоимость молотков (включена в базовую стоимость для первого, доплата за дополнительные)
      if (service.hammer_count > 1) {
        const extraHammerCost = {
          light: 300,   
          medium: 500,  
          heavy: 700    
        };
        baseCost += extraHammerCost[service.hammer_type as keyof typeof extraHammerCost] * (service.hammer_count - 1);
      }
      
      // Продувочные шланги
      if (service.has_blowing_hoses) {
        baseCost += Math.ceil(service.hose_length / 50) * 400; // 400₽ за каждые 50м
      }
      
      // Опрессовка газовых труб
      if (service.gas_pipe_testing) {
        baseCost += 2500;
      }
      
      // НДС (если выбрано)
      if (service.payment_method === 'with_vat') {
        baseCost += 300;
      }
      
      totalCost += baseCost;
    }
    
    // Вывоз мусора
    if (orderData.additional_services.garbage_removal.enabled) {
      const service = orderData.additional_services.garbage_removal;
      const vehicleCosts = {
        gazelle_12: 4500,   // Газель 12 кубов
        gazelle_16: 5500,   // Газель 16 кубов  
        kamaz_20: 8500,     // КамАЗ 20 кубов
        kamaz_30: 12000     // КамАЗ 30 кубов
      };
      
      let garbageCost = vehicleCosts[service.vehicle_type as keyof typeof vehicleCosts] || 4500;
      
      // Доплата за погрузку (зависит от объёма)
      if (service.needs_loading) {
        const loadingCosts = {
          gazelle_12: 1500,
          gazelle_16: 2000,
          kamaz_20: 2500,
          kamaz_30: 3000
        };
        garbageCost += loadingCosts[service.vehicle_type as keyof typeof loadingCosts] || 1500;
      }
      
      totalCost += garbageCost;
    }
    
    return totalCost;
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
                  🔨 Аренда компрессора с оборудованием
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

                  {/* Equipment Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-steel-200">Выбор оборудования</h4>
                      <div className="text-xs text-steel-400 bg-steel-800/30 px-2 py-1 rounded">
                        Стоимость зависит от мощности
                      </div>
                    </div>
                    
                    {/* Hammer Configuration */}
                    <div className="p-3 bg-steel-800/30 rounded-lg border border-steel-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Тип отбойных молотков</Label>
                          <Select
                            value={orderData.additional_services.compressor_rent.hammer_type}
                            onValueChange={(value) => setOrderData(prev => ({
                              ...prev,
                              additional_services: {
                                ...prev.additional_services,
                                compressor_rent: { ...prev.additional_services.compressor_rent, hammer_type: value }
                              }
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Легкий (до 20 кг) - 1200₽/час</SelectItem>
                              <SelectItem value="medium">Средний (20-30 кг) - 1500₽/час</SelectItem>
                              <SelectItem value="heavy">Тяжелый (30+ кг) - 1800₽/час</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Количество молотков (1-3)</Label>
                          <Select
                            value={orderData.additional_services.compressor_rent.hammer_count.toString()}
                            onValueChange={(value) => setOrderData(prev => ({
                              ...prev,
                              additional_services: {
                                ...prev.additional_services,
                                compressor_rent: { ...prev.additional_services.compressor_rent, hammer_count: parseInt(value) }
                              }
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 молоток (базовая цена)</SelectItem>
                              <SelectItem value="2">2 молотка (+доплата)</SelectItem>
                              <SelectItem value="3">3 молотка (+доплата)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Additional Equipment */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-steel-200">Дополнительное оборудование</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-steel-800/20 rounded-lg">
                          <input
                            type="checkbox"
                            id="blowing_hoses"
                            checked={orderData.additional_services.compressor_rent.has_blowing_hoses}
                            onChange={(e) => setOrderData(prev => ({
                              ...prev,
                              additional_services: {
                                ...prev.additional_services,
                                compressor_rent: { ...prev.additional_services.compressor_rent, has_blowing_hoses: e.target.checked }
                              }
                            }))}
                            className="w-4 h-4 text-primary mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor="blowing_hoses" className="text-steel-300 font-medium">
                              Продувочные шланги высокого давления
                            </Label>
                            <p className="text-xs text-steel-400 mt-1">
                              Для очистки поверхностей, продувки труб и каналов
                            </p>
                            {orderData.additional_services.compressor_rent.has_blowing_hoses && (
                              <div className="mt-2">
                                <Label className="text-xs">Общая длина шлангов</Label>
                                <Select
                                  value={orderData.additional_services.compressor_rent.hose_length.toString()}
                                  onValueChange={(value) => setOrderData(prev => ({
                                    ...prev,
                                    additional_services: {
                                      ...prev.additional_services,
                                      compressor_rent: { ...prev.additional_services.compressor_rent, hose_length: parseInt(value) }
                                    }
                                  }))}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="50">50 м (+400₽)</SelectItem>
                                    <SelectItem value="100">100 м (+800₽)</SelectItem>
                                    <SelectItem value="150">150 м (+1200₽)</SelectItem>
                                    <SelectItem value="200">200 м (+1600₽)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-steel-800/20 rounded-lg">
                          <input
                            type="checkbox"
                            id="gas_pipe_testing"
                            checked={orderData.additional_services.compressor_rent.gas_pipe_testing}
                            onChange={(e) => setOrderData(prev => ({
                              ...prev,
                              additional_services: {
                                ...prev.additional_services,
                                compressor_rent: { ...prev.additional_services.compressor_rent, gas_pipe_testing: e.target.checked }
                              }
                            }))}
                            className="w-4 h-4 text-primary mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor="gas_pipe_testing" className="text-steel-300 font-medium">
                              Опрессовка газовых труб (+2500₽)
                            </Label>
                            <p className="text-xs text-steel-400 mt-1">
                              Проверка герметичности газопроводов давлением
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment and Work Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Способ оплаты</Label>
                        <Select
                          value={orderData.additional_services.compressor_rent.payment_method}
                          onValueChange={(value) => setOrderData(prev => ({
                            ...prev,
                            additional_services: {
                              ...prev.additional_services,
                              compressor_rent: { ...prev.additional_services.compressor_rent, payment_method: value }
                            }
                          }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Наличными</SelectItem>
                            <SelectItem value="with_vat">Безналичный с НДС (+300₽)</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="demolition">Демонтаж конструкций</SelectItem>
                            <SelectItem value="road_work">Дорожные работы</SelectItem>
                            <SelectItem value="blowing">Продувка и очистка</SelectItem>
                            <SelectItem value="foundation">Работы с фундаментом</SelectItem>
                            <SelectItem value="renovation">Ремонтные работы</SelectItem>
                            <SelectItem value="other">Другое</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-steel-800/30 to-steel-700/30 rounded-lg border border-steel-600">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-steel-300 font-medium">Общая стоимость аренды:</span>
                          <span className="text-primary font-bold text-xl">
                            {(() => {
                              const service = orderData.additional_services.compressor_rent;
                              const compressorHours = service.hours + service.delivery_hours;
                              const baseRates = { light: 1200, medium: 1500, heavy: 1800 };
                              let baseCost = compressorHours * baseRates[service.hammer_type as keyof typeof baseRates];
                              if (service.hammer_count > 1) {
                                const extraCosts = { light: 300, medium: 500, heavy: 700 };
                                baseCost += extraCosts[service.hammer_type as keyof typeof extraCosts] * (service.hammer_count - 1);
                              }
                              if (service.has_blowing_hoses) baseCost += Math.ceil(service.hose_length / 50) * 400;
                              if (service.gas_pipe_testing) baseCost += 2500;
                              if (service.payment_method === 'with_vat') baseCost += 300;
                              return baseCost;
                            })()} ₽
                          </span>
                        </div>
                        <div className="text-xs text-steel-400">
                          ⏱️ Время: {orderData.additional_services.compressor_rent.hours + orderData.additional_services.compressor_rent.delivery_hours} часов
                          • 🔨 {orderData.additional_services.compressor_rent.hammer_count} молоток(а) • 
                          {orderData.additional_services.compressor_rent.payment_method === 'with_vat' ? ' 💳 С НДС' : ' 💵 Наличные'}
                        </div>
                      </div>
                    </div>
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
                  🚛 Вывоз мусора (12-30 кубов, возможна погрузка)
                </Label>
              </div>
              
              {orderData.additional_services.garbage_removal.enabled && (
                <div className="space-y-4 pl-7">
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
                        <SelectItem value="construction">🧱 Строительный мусор (бетон, кирпич)</SelectItem>
                        <SelectItem value="renovation">🔨 Ремонтный мусор (гипсокартон, обои)</SelectItem>
                        <SelectItem value="household">🏠 Бытовой мусор</SelectItem>
                        <SelectItem value="bulky">📦 Крупногабаритный (мебель, техника)</SelectItem>
                        <SelectItem value="mixed">🔄 Смешанный мусор</SelectItem>
                        <SelectItem value="green">🌿 Растительные отходы</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Выбор транспорта</Label>
                    <div className="mt-2 space-y-2">
                      {[
                        { value: 'gazelle_12', label: 'Газель 12 куб.', price: '4500₽', description: 'Для квартиры, небольшого офиса' },
                        { value: 'gazelle_16', label: 'Газель 16 куб.', price: '5500₽', description: 'Для 1-2 комнатной квартиры' },
                        { value: 'kamaz_20', label: 'КамАЗ 20 куб.', price: '8500₽', description: 'Для большой квартиры, частного дома' },
                        { value: 'kamaz_30', label: 'КамАЗ 30 куб.', price: '12000₽', description: 'Для коттеджа, строительного участка' }
                      ].map((vehicle) => (
                        <div
                          key={vehicle.value}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            orderData.additional_services.garbage_removal.vehicle_type === vehicle.value
                              ? 'border-primary bg-primary/10'
                              : 'border-steel-600 bg-steel-800/20 hover:border-steel-500'
                          }`}
                          onClick={() => setOrderData(prev => ({
                            ...prev,
                            additional_services: {
                              ...prev.additional_services,
                              garbage_removal: { ...prev.additional_services.garbage_removal, vehicle_type: vehicle.value as any }
                            }
                          }))}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-steel-200">{vehicle.label}</div>
                              <div className="text-xs text-steel-400 mt-1">{vehicle.description}</div>
                            </div>
                            <div className="text-primary font-bold">{vehicle.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-steel-800/30 rounded-lg">
                    <div className="flex items-start space-x-3">
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
                        className="w-4 h-4 text-primary mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="needs_loading" className="text-steel-300 font-medium">
                          Погрузка силами грузчиков
                        </Label>
                        <p className="text-xs text-steel-400 mt-1">
                          Доплата: {
                            orderData.additional_services.garbage_removal.vehicle_type === 'gazelle_12' ? '1500₽' :
                            orderData.additional_services.garbage_removal.vehicle_type === 'gazelle_16' ? '2000₽' :
                            orderData.additional_services.garbage_removal.vehicle_type === 'kamaz_20' ? '2500₽' :
                            '3000₽'
                          } за погрузку и вынос мусора
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-steel-800/30 to-steel-700/30 rounded-lg border border-steel-600">
                    <div className="flex justify-between items-center">
                      <span className="text-steel-300 font-medium">Стоимость вывоза:</span>
                      <span className="text-primary font-bold text-xl">
                        {(() => {
                          const service = orderData.additional_services.garbage_removal;
                          const vehicleCosts = { gazelle_12: 4500, gazelle_16: 5500, kamaz_20: 8500, kamaz_30: 12000 };
                          const loadingCosts = { gazelle_12: 1500, gazelle_16: 2000, kamaz_20: 2500, kamaz_30: 3000 };
                          return (vehicleCosts[service.vehicle_type as keyof typeof vehicleCosts] || 4500) + 
                                 (service.needs_loading ? (loadingCosts[service.vehicle_type as keyof typeof loadingCosts] || 1500) : 0);
                        })()} ₽
                      </span>
                    </div>
                    <div className="text-xs text-steel-400 mt-1">
                      🚛 {orderData.additional_services.garbage_removal.vehicle_type === 'gazelle_12' ? '12' : 
                           orderData.additional_services.garbage_removal.vehicle_type === 'gazelle_16' ? '16' :
                           orderData.additional_services.garbage_removal.vehicle_type === 'kamaz_20' ? '20' : '30'} куб.
                      {orderData.additional_services.garbage_removal.needs_loading && ' • 👥 С погрузкой'}
                    </div>
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

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
            <Button 
              onClick={handleCreateOrder} 
              disabled={isCreating || userBalance < getCurrentPriorityCost()}
              className="flex-1"
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
