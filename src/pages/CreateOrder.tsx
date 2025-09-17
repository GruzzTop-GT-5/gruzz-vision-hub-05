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
import { Coins, AlertCircle, Calendar } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Updated to use dynamic priority costs

const orderFormSchema = z.object({
  title: z.string().min(5, 'Название заказа должно содержать минимум 5 символов').max(100, 'Название слишком длинное'),
  description: z.string().min(20, 'Описание должно содержать минимум 20 символов').max(1000, 'Описание слишком длинное'),
  category: z.string().min(1, 'Введите категорию работы'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Введите корректную сумму'),
  priority: z.enum(['normal', 'high', 'urgent'], { required_error: 'Выберите приоритет' }),
  deadline: z.date().optional(),
  delivery_format: z.string().optional(),
  max_revisions: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Введите корректное количество').optional(),
  start_time: z.string().optional(),
  people_needed: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, 'Минимум 1 человек')
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_active: boolean;
}

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

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: '',
      priority: 'normal',
      delivery_format: '',
      max_revisions: '3'
    }
  });

  // Fetch user balance and priority costs
  useEffect(() => {
    if (user?.id) {
      fetchUserBalance();
    }
    fetchPriorityCosts();
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
      // Create the order (order_number will be auto-generated by trigger)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: 'temp', // Will be overridden by trigger
          title: data.title,
          description: data.description,
          category: data.category,
          price: Number(data.price),
          priority: data.priority,
          deadline: data.deadline ? data.deadline.toISOString() : null,
          delivery_format: data.delivery_format || null,
          max_revisions: Number(data.max_revisions) || 3,
          start_time: data.start_time || null,
          people_needed: Number(data.people_needed) || 1,
          people_accepted: 0,
          client_id: user.id,
          status: 'pending',
          payment_status: 'pending'
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
          <Card className="card-steel p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-steel-300">Ваш баланс:</span>
                <span className="font-bold text-primary">{userBalance || 0} GT Coins</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-steel-400">Стоимость размещения:</p>
                <p className="font-bold text-primary">
                  {form.watch('priority') ? priorityCosts[form.watch('priority') as keyof typeof priorityCosts] : 15} GT Coins
                </p>
              </div>
            </div>
            {userBalance !== null && userBalance < (priorityCosts[form.watch('priority') as keyof typeof priorityCosts] || 15) && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  Недостаточно средств. <a href="/balance" className="text-primary hover:underline">Пополнить баланс</a>
                </p>
              </div>
            )}
          </Card>

          {/* Order Creation Form */}
          <Card className="card-steel p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название заказа</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Нужен грузчик для переезда в субботу"
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
                      <FormLabel>Категория работы</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Разнорабочие, Грузчики, Переезд"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Бюджет (₽)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3000"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Приоритет</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel>Время начала работы</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            placeholder="Когда нужно быть готовым к работе"
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
                        <FormLabel>Нужно людей</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            min="1"
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
                      <FormLabel>Срок выполнения (необязательно)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
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
                      <FormLabel>Подробное описание работы</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Опишите что нужно сделать: объем работы, требования к исполнителю, условия..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="delivery_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Формат сдачи (необязательно)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Например: отчет, фото результата"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_revisions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Максимум правок</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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