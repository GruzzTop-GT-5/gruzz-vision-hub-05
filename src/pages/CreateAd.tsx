import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Coins, AlertCircle } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

const AD_COST = 10; // Cost in GT Coins to post an ad

const adFormSchema = z.object({
  title: z.string().min(5, 'Заголовок должен содержать минимум 5 символов').max(100, 'Заголовок слишком длинный'),
  description: z.string().min(20, 'Описание должно содержать минимум 20 символов').max(1000, 'Описание слишком длинное'),
  category: z.string().min(1, 'Выберите категорию'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Введите корректную цену'),
  contact_info: z.string().min(5, 'Контактная информация обязательна')
});

type AdFormData = z.infer<typeof adFormSchema>;

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_active: boolean;
}

export default function CreateAd() {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<AdFormData>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: '',
      contact_info: ''
    }
  });

  // Fetch user balance and categories
  useEffect(() => {
    if (user?.id) {
      fetchUserBalance();
    }
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

  const onSubmit = async (data: AdFormData) => {
    if (!user?.id) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive"
      });
      return;
    }

    if (userBalance === null || userBalance < AD_COST) {
      toast({
        title: "Недостаточно GT Coins",
        description: `Для размещения объявления нужно ${AD_COST} GT Coins. Пополните баланс.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the ad
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          title: data.title,
          description: data.description,
          category: 'temp', // placeholder for old field
          category_id: data.category,
          price: Number(data.price),
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (adError) {
        throw adError;
      }

      // Create transaction for ad cost
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: AD_COST,
          type: 'payment' as const,
          status: 'completed' as const,
          payment_method: 'bank_card' as const,
          payment_details: {
            description: `Размещение объявления: ${data.title}`,
            ad_id: adData.id
          }
        });

      if (transactionError) {
        throw transactionError;
      }

      toast({
        title: "Заказ создан!",
        description: `Заказ на работу размещен. Списано ${AD_COST} GT Coins.`
      });

      navigate('/ads');
    } catch (error) {
      console.error('Error creating ad:', error);
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
            <p className="text-steel-300">Для размещения объявлений необходимо войти в систему</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <BackButton onClick={() => window.history.back()} />
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
                <p className="font-bold text-primary">{AD_COST} GT Coins</p>
              </div>
            </div>
            {userBalance !== null && userBalance < AD_COST && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  Недостаточно средств. <a href="/balance" className="text-primary hover:underline">Пополнить баланс</a>
                </p>
              </div>
            )}
          </Card>

          {/* Ad Creation Form */}
          <Card className="card-steel p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заголовок объявления</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Грузчик со своим транспортом"
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
                      <FormLabel>Категория</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена за час работы (₽)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Например: 800 (за час)"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Опишите услуги: квартирные переезды, почасовая работа, опыт, наличие транспорта..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Контактная информация</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Telegram: @username или email: example@mail.ru"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || (userBalance !== null && userBalance < AD_COST)}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      Размещение...
                    </>
                  ) : (
                    `Разместить объявление (${AD_COST} GT Coins)`
                  )}
                </Button>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}