import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { AuthRequired } from '@/components/AuthRequired';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Coins, AlertCircle, Calendar, MapPin, Wrench, Truck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { BackButton } from '@/components/BackButton';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_active: boolean;
}

// Updated to use dynamic priority costs

const orderFormSchema = z.object({
  title: z.string().min(5, 'Название заказа должно содержать минимум 5 символов').max(100, 'Название слишком длинное'),
  description: z.string().min(20, 'Описание должно содержать минимум 20 символов').max(1000, 'Описание слишком длинное'),
  category: z.string().min(1, 'Выберите категорию работы'),
  address: z.string().min(5, 'Укажите адрес объекта').max(200, 'Адрес слишком длинный'),
  hourly_rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 400, 'Минимум 400₽/час'),
  work_hours: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 4;
  }, 'Минимум 4 часа'),
  priority: z.enum(['normal', 'high', 'urgent'], { required_error: 'Выберите приоритет' }),
  deadline: z.date().optional(),
  start_time: z.string().optional(),
  people_needed: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, 'Минимум 1 человек'),
  compressor_rent: z.boolean().optional(),
  garbage_removal: z.boolean().optional()
});

type OrderFormData = z.infer<typeof orderFormSchema>;


const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Обычный (15 GT)', cost: 15 },
  { value: 'high', label: 'Высокий (35 GT)', cost: 35 },
  { value: 'urgent', label: 'Срочно (55 GT)', cost: 55 }
];

export default function CreateOrder() {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priorityCosts, setPriorityCosts] = useState({ normal: 15, high: 35, urgent: 55 });
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      address: '',
      hourly_rate: '',
      work_hours: '4',
      priority: 'normal',
      people_needed: '1',
      compressor_rent: false,
      garbage_removal: false
    }
  });

  // Fetch user balance, priority costs, and categories
  useEffect(() => {
    if (user?.id) {
      fetchUserBalance();
    }
    fetchPriorityCosts();
    fetchCategories();
  }, [user?.id]);

  const fetchUserBalance = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching balance:', error);
        return;
      }

      setUserBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchPriorityCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'priority_costs')
        .single();

      if (error) throw error;
      if (data?.setting_value) {
        setPriorityCosts(data.setting_value as any);
      }
    } catch (error) {
      console.error('Error fetching priority costs:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!user?.id) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive"
      });
      return;
    }

    const orderCost = priorityCosts[data.priority as keyof typeof priorityCosts] || 15;
    
    if (userBalance === null || userBalance < orderCost) {
      toast({
        title: "Недостаточно GT Coins",
        description: `Для размещения заказа нужно ${orderCost} GT Coins. Пополните баланс.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalPrice = Number(data.hourly_rate) * Number(data.work_hours) * Number(data.people_needed);
      
      // Create the order (order_number will be auto-generated by trigger)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: 'temp', // Will be overridden by trigger
          title: data.title,
          description: `${data.description}\n\n📍 Адрес: ${data.address}\n💰 Оплата: ${data.hourly_rate}₽/час\n⏱ Продолжительность: ${data.work_hours} ч`,
          category: data.category,
          price: totalPrice,
          priority: data.priority,
          deadline: data.deadline ? data.deadline.toISOString() : null,
          start_time: data.start_time || null,
          people_needed: Number(data.people_needed) || 1,
          people_accepted: 0,
          client_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          client_requirements: {
            address: data.address,
            hourly_rate: Number(data.hourly_rate),
            work_hours: Number(data.work_hours),
            total_cost: totalPrice
          }
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create transaction for order cost
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: orderCost,
          type: 'payment' as const,
          status: 'completed' as const,
          payment_method: 'bank_card' as const,
          payment_details: {
            description: `Размещение заказа: ${data.title}`,
            order_id: orderData.id,
            priority: data.priority
          }
        });

      if (transactionError) {
        throw transactionError;
      }

      // Send Telegram notification for urgent orders
      if (data.priority === 'urgent') {
        try {
          await supabase.functions.invoke('notify-urgent-order', {
            body: { orderId: orderData.id }
          });
        } catch (notificationError) {
          console.error('Error sending Telegram notification:', notificationError);
          // Don't block order creation if notification fails
        }
      }

      toast({
        title: "Заказ создан!",
        description: `Заказ на работу размещен. Списано ${orderCost} GT Coins.${data.priority === 'urgent' ? ' Администраторы уведомлены о срочном заказе.' : ''}`
      });

      navigate('/ads');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-steel-300">Загрузка...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Требуется авторизация</h2>
            <p className="text-steel-300">Для размещения заказов необходимо войти в систему</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <AuthRequired>
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <BackButton />
            <h1 className="text-3xl font-bold text-glow">Разместить заказ на работу</h1>
            <div></div>
          </div>

          {/* Balance Display */}
          <Card className="card-steel p-6 border-primary/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-steel-400">Ваш баланс:</span>
                  <p className="font-bold text-2xl text-primary">{userBalance || 0} GT</p>
                  <p className="text-xs text-steel-500">≈ {userBalance || 0} ₽</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-steel-400 mb-1">Стоимость размещения:</p>
                <p className="font-bold text-xl text-primary">
                  {form.watch('priority') ? priorityCosts[form.watch('priority') as keyof typeof priorityCosts] : 15} GT (₽)
                </p>
              </div>
            </div>
            {userBalance !== null && userBalance < (priorityCosts[form.watch('priority') as keyof typeof priorityCosts] || 15) && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">
                  Недостаточно средств. <a href="/balance" className="text-primary hover:underline font-semibold">Пополнить баланс</a>
                </p>
              </div>
            )}
          </Card>

          {/* Order Creation Form */}
          <Card className="card-steel p-6 border-steel-600/50">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-steel-100 mb-2">Создание заказа</h2>
              <p className="text-sm text-steel-400">Заполните все обязательные поля, отмеченные <span className="text-red-400">*</span></p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-steel-100">Название заказа <span className="text-red-400">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Нужен грузчик для переезда в субботу"
                          className="bg-steel-700/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-steel-100">Категория <span className="text-red-400">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-steel-700/50">
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.icon && <span className="mr-2">{category.icon}</span>}
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-steel-100">📍 Адрес объекта <span className="text-red-400">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: г. Москва, ул. Ленина 15"
                          className="bg-steel-700/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-steel-100">💰 Оплата за 1 час <span className="text-red-400">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            min="400"
                            className="bg-steel-700/50"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-steel-400 mt-1">Минимум 400₽/час</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="work_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-steel-100">⏱ Часов работы <span className="text-red-400">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value="4"
                            readOnly
                            disabled
                            className="bg-steel-700/50 cursor-not-allowed"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-steel-400 mt-1">Минимум 4 часа</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-steel-100">⚡ Приоритет</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-steel-700/50">
                              <SelectValue placeholder="Выберите приоритет" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-steel-400 mt-1">Стоимость размещения объявления</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-steel-100">🕐 Время начала</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="bg-steel-700/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="people_needed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-steel-100">👥 Нужно людей <span className="text-red-400">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            min="1"
                            className="bg-steel-700/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-steel-100">📅 Срок выполнения (необязательно)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal bg-steel-700/50 ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "dd MMMM yyyy", { locale: ru })
                              ) : (
                                <span>Выберите дату</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-steel-100">📝 Подробное описание работы <span className="text-red-400">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Опишите что нужно сделать: объем работы, требования к исполнителю, условия..."
                          className="min-h-[120px] bg-steel-700/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Additional Services Section */}
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-semibold text-steel-100">Дополнительные услуги</h3>
                  
                  <FormField
                    control={form.control}
                    name="compressor_rent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-steel-600/50 p-4 bg-steel-700/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="text-steel-100 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Аренда компрессора с оборудованием
                          </FormLabel>
                          <p className="text-sm text-steel-400">
                            Компрессор для пневмоинструмента, отбойные молотки, продувочные шланги
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="garbage_removal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-steel-600/50 p-4 bg-steel-700/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="text-steel-100 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Вывоз мусора (12-30 кубов, возможна погрузка)
                          </FormLabel>
                          <p className="text-sm text-steel-400">
                            Вывоз строительного мусора, доступны разные объемы транспорта
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Total Cost Display */}
                <Card className="card-steel p-4 border-primary/30">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-steel-200">Итоговая стоимость работы:</h4>
                    <div className="space-y-1 text-sm text-steel-300">
                      <p className="flex justify-between">
                        <span>Оплата за час:</span>
                        <span className="font-semibold">{form.watch('hourly_rate') || 0}₽</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Часов работы:</span>
                        <span className="font-semibold">{form.watch('work_hours') || 0}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Количество человек:</span>
                        <span className="font-semibold">{form.watch('people_needed') || 0}</span>
                      </p>
                      <Separator className="my-2" />
                      <p className="flex justify-between text-lg">
                        <span className="text-steel-100">ИТОГО к оплате исполнителю:</span>
                        <span className="font-bold text-primary">
                          {(Number(form.watch('hourly_rate') || 0) * Number(form.watch('work_hours') || 0) * Number(form.watch('people_needed') || 0)).toLocaleString('ru-RU')}₽
                        </span>
                      </p>
                    </div>
                    <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-xs text-orange-200 leading-relaxed">
                        ⚠️ <strong>Важно:</strong> Оплата исполнителям производится НАПРЯМУЮ на объекте после выполнения работы. 
                        Платформа не участвует в финансовых расчетах между заказчиком и исполнителем.
                      </p>
                    </div>
                  </div>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || (userBalance !== null && userBalance < (priorityCosts[form.watch('priority') as keyof typeof priorityCosts] || 15))}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      Размещение...
                    </>
                  ) : (
                    `Разместить заказ (${priorityCosts[form.watch('priority') as keyof typeof priorityCosts] || 15} GT Coins)`
                  )}
                </Button>
              </form>
            </Form>
          </Card>
        </div>
      </div>
     </Layout>
   </AuthRequired>
  );
};