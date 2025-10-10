import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
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

const RESUME_COST = 5; // Cost in GT Coins to post a resume

const resumeFormSchema = z.object({
  title: z.string().min(5, 'Название специальности должно содержать минимум 5 символов').max(100, 'Название слишком длинное'),
  description: z.string().min(20, 'Описание должно содержать минимум 20 символов').max(1000, 'Описание слишком длинное'),
  category: z.string().min(1, 'Выберите категорию'),
  hourly_rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Введите корректную почасовую ставку'),
  experience_years: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Введите корректный опыт работы'),
  contact_info: z.string().min(5, 'Контактная информация обязательна'),
  skills: z.string().optional(),
  location: z.string().optional()
});

type ResumeFormData = z.infer<typeof resumeFormSchema>;

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_active: boolean;
}

export default function CreateAd() {
  const { user, userRole, loading, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      hourly_rate: '',
      experience_years: '',
      contact_info: '',
      skills: '',
      location: ''
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

  const onSubmit = async (data: ResumeFormData) => {
    if (!user?.id) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive"
      });
      return;
    }

    if (userBalance === null || userBalance < RESUME_COST) {
      toast({
        title: "Недостаточно GT Coins",
        description: `Для размещения резюме нужно ${RESUME_COST} GT Coins. Пополните баланс.`,
        variant: "destructive"
      });
      return;
    }

    // Проверка на дублирование - ищем похожие активные резюме пользователя
    try {
      const { data: existingResumes, error: checkError } = await supabase
        .from('resumes')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .ilike('title', `%${data.title.substring(0, 20)}%`); // Проверяем по первым 20 символам заголовка

      if (checkError) throw checkError;

      if (existingResumes && existingResumes.length > 0) {
        const existingTitle = existingResumes[0].title;
        const similarity = data.title.toLowerCase().includes(existingTitle.toLowerCase().substring(0, 15)) ||
                          existingTitle.toLowerCase().includes(data.title.toLowerCase().substring(0, 15));
        
        if (similarity) {
          toast({
            title: "Похожее резюме уже существует",
            description: `У вас уже есть активное резюме: "${existingTitle}". Отредактируйте существующее или удалите его перед созданием нового.`,
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    }

    setIsSubmitting(true);

    try {
      // Create the resume
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          title: data.title,
          description: data.description,
          category_id: data.category,
          hourly_rate: Number(data.hourly_rate),
          experience_years: Number(data.experience_years) || 0,
          skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],
          contact_info: data.contact_info,
          location: data.location || null,
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (resumeError) {
        throw resumeError;
      }

      // Create transaction for resume cost
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: RESUME_COST,
          type: 'payment' as const,
          status: 'completed' as const,
          payment_method: 'bank_card' as const,
          payment_details: {
            description: `Размещение резюме: ${data.title}`,
            resume_id: resumeData.id
          }
        });

      if (transactionError) {
        throw transactionError;
      }

      toast({
        title: "Резюме создано!",
        description: `Резюме исполнителя размещено. Списано ${RESUME_COST} GT Coins.`
      });

      navigate('/available-orders');
    } catch (error) {
      console.error('Error creating resume:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать резюме. Попробуйте еще раз.",
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
            <p className="text-steel-300">Для размещения резюме необходимо войти в систему</p>
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
            <BackButton />
            <h1 className="text-3xl font-bold text-glow">Создать резюме исполнителя</h1>
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
                <p className="font-bold text-primary">{RESUME_COST} GT Coins</p>
              </div>
            </div>
            {userBalance !== null && userBalance < RESUME_COST && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  Недостаточно средств. <a href="/balance" className="text-primary hover:underline">Пополнить баланс</a>
                </p>
              </div>
            )}
          </Card>

          {/* Resume Creation Form */}
          <Card className="card-steel p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ваша специальность</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Опытный грузчик с собственным транспортом"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Почасовая ставка (₽)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="800"
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
                    name="experience_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Опыт работы (лет)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Навыки и умения (через запятую)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: подъем тяжестей, работа с инструментами, вождение грузовика"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Местоположение</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Москва, готов к выездам в МО"
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
                      <FormLabel>Описание и опыт работы</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Расскажите о своем опыте, достижениях, оборудовании, графике работы..."
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
                          placeholder="Telegram: @username или телефон: +7 999 123-45-67"
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
                  disabled={isSubmitting || (userBalance !== null && userBalance < RESUME_COST)}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      Размещение...
                    </>
                  ) : (
                    `Разместить резюме (${RESUME_COST} GT Coins)`
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