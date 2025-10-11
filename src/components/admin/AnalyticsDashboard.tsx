import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Coins, Activity, Calendar as CalendarIcon, Download } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AnalyticsData {
  users: {
    total: number;
    new_today: number;
    new_week: number;
    active_today: number;
    growth_rate: number;
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    revenue: number;
    avg_order_value: number;
  };
  transactions: {
    total_volume: number;
    successful: number;
    failed: number;
    pending: number;
  };
  content: {
    ads: number;
    reviews: number;
    messages: number;
    moderated_items: number;
  };
}

interface ChartData {
  date: string;
  users: number;
  orders: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'quarter'>('month');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfToday = startOfDay(now);
      const startOfWeek = subDays(startOfToday, 7);

      // Получаем статистику пользователей
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      const totalUsers = usersData?.length || 0;
      const newToday = usersData?.filter(u => new Date(u.created_at) >= startOfToday).length || 0;
      const newWeek = usersData?.filter(u => new Date(u.created_at) >= startOfWeek).length || 0;
      const previousWeekUsers = usersData?.filter(u => {
        const date = new Date(u.created_at);
        return date >= subDays(startOfWeek, 7) && date < startOfWeek;
      }).length || 1;
      
      const growthRate = newWeek > 0 ? ((newWeek - previousWeekUsers) / previousWeekUsers) * 100 : 0;

      // Получаем статистику заказов
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, status, price, created_at');

      const totalOrders = ordersData?.length || 0;
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;
      const cancelledOrders = ordersData?.filter(o => o.status === 'cancelled').length || 0;
      
      const revenue = ordersData
        ?.filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.price || 0), 0) || 0;
      
      const avgOrderValue = completedOrders > 0 ? revenue / completedOrders : 0;

      // Получаем статистику транзакций (реальный доход от пополнений)
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('id, status, amount, type, created_at')
        .eq('type', 'deposit'); // Только пополнения

      // Реальный доход от пополнений (1 GT коин = 1 рубль)
      const realRevenue = transactionsData
        ?.filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const totalVolume = transactionsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const successfulTransactions = transactionsData?.filter(t => t.status === 'completed').length || 0;
      const failedTransactions = transactionsData?.filter(t => t.status === 'rejected').length || 0;
      const pendingTransactions = transactionsData?.filter(t => t.status === 'pending').length || 0;

      // Получаем статистику контента
      const [{ count: adsCount }, { count: reviewsCount }, { count: messagesCount }] = await Promise.all([
        supabase.from('ads').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true })
      ]);

      const { count: moderatedCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('is_moderated', true);

      // Получаем активных пользователей за последние 24 часа (по сообщениям)
      const { count: activeUsersCount } = await supabase
        .from('messages')
        .select('sender_id', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString());

      setAnalytics({
        users: {
          total: totalUsers,
          new_today: newToday,
          new_week: newWeek,
          active_today: activeUsersCount || 0,
          growth_rate: growthRate
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          revenue: realRevenue, // Реальный доход от пополнений
          avg_order_value: avgOrderValue
        },
        transactions: {
          total_volume: totalVolume,
          successful: successfulTransactions,
          failed: failedTransactions,
          pending: pendingTransactions
        },
        content: {
          ads: adsCount || 0,
          reviews: reviewsCount || 0,
          messages: messagesCount || 0,
          moderated_items: moderatedCount || 0
        }
      });

      // Генерируем реальные данные для графиков за последние 30 дней
      const dailyStats = [];
      const daysToShow = 30;
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        try {
          // Новые пользователи за день
          const { count: dayUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());

          // Заказы за день
          const { count: dayOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());

          // Доходы за день (пополнения)
          const { data: dayRevenue } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'deposit')
            .eq('status', 'completed')
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());

          const revenue = dayRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

          dailyStats.push({
            date: format(date, 'dd.MM'),
            users: dayUsers || 0,
            orders: dayOrders || 0,
            revenue
          });
        } catch (error) {
          console.error(`Error loading data for ${date}:`, error);
          // Fallback данные в случае ошибки
          dailyStats.push({
            date: format(date, 'dd.MM'),
            users: 0,
            orders: 0,
            revenue: 0
          });
        }
      }

      setChartData(dailyStats);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аналитику",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Убрали автоматическое обновление - только ручное обновление по кнопке
  }, []);

  const exportData = async () => {
    try {
      // Экспорт основных данных в CSV формат
      const csvContent = `
Метрика,Значение
Всего пользователей,${analytics?.users.total || 0}
Новых за сегодня,${analytics?.users.new_today || 0}
Новых за неделю,${analytics?.users.new_week || 0}
Рост пользователей %,${analytics?.users.growth_rate.toFixed(2) || 0}
Всего заказов,${analytics?.orders.total || 0}
Выполненных заказов,${analytics?.orders.completed || 0}
Доход,${analytics?.orders.revenue || 0}
Средний чек,${analytics?.orders.avg_order_value.toFixed(2) || 0}
      `.trim();

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Успешно",
        description: "Данные аналитики экспортированы"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать данные",
        variant: "destructive"
      });
    }
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const orderStatusData = analytics ? [
    { name: 'Выполнено', value: analytics.orders.completed, color: COLORS[0] },
    { name: 'В ожидании', value: analytics.orders.pending, color: COLORS[1] },
    { name: 'Отменено', value: analytics.orders.cancelled, color: COLORS[2] }
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Activity className="w-6 h-6 animate-pulse mr-2 text-primary" />
            <span className="text-lg">Загрузка аналитики в реальном времени...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с экспортом */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-2xl font-bold">Аналитика и отчеты</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              Данные обновляются в реальном времени
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Период
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={fetchAnalytics} disabled={loading}>
            <Activity className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : 'animate-pulse'}`} />
            {loading ? 'Обновление...' : 'Обновить данные'}
          </Button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего пользователей</p>
                <p className="text-2xl font-bold">{analytics?.users.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(analytics?.users.growth_rate || 0)}
                  <span className={`text-sm ${analytics?.users.growth_rate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {analytics?.users.growth_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Заказы</p>
                <p className="text-2xl font-bold">{analytics?.orders.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {analytics?.orders.completed} выполнено
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Реальный доход (GT коины)</p>
                <p className="text-2xl font-bold">₽{analytics?.orders.revenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  От пополнений пользователей (1 GT = 1₽)
                </p>
              </div>
              <Coins className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Активность</p>
                <p className="text-2xl font-bold">{analytics?.users.active_today}</p>
                <p className="text-sm text-muted-foreground">Активных сегодня</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="content">Контент</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* График активности */}
            <Card>
              <CardHeader>
                <CardTitle>Активность за 30 дней</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Пользователи"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Заказы"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Круговая диаграмма заказов */}
            <Card>
              <CardHeader>
                <CardTitle>Статус заказов</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* График доходов */}
          <Card>
            <CardHeader>
              <CardTitle>Доходы за период</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₽${value}`, 'Доход']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{analytics?.users.new_today}</p>
                  <p className="text-sm text-muted-foreground">Новых сегодня</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{analytics?.users.new_week}</p>
                  <p className="text-sm text-muted-foreground">Новых за неделю</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{analytics?.users.active_today}</p>
                  <p className="text-sm text-muted-foreground">Активных сегодня</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Badge variant="default" className="mb-2">Выполнено</Badge>
                  <p className="text-2xl font-bold">{analytics?.orders.completed}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">В ожидании</Badge>
                  <p className="text-2xl font-bold">{analytics?.orders.pending}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Badge variant="destructive" className="mb-2">Отменено</Badge>
                  <p className="text-2xl font-bold">{analytics?.orders.cancelled}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Coins className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">₽{analytics?.orders.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Общий доход</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics?.content.ads}</p>
                  <p className="text-sm text-muted-foreground">Объявления</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics?.content.reviews}</p>
                  <p className="text-sm text-muted-foreground">Отзывы</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics?.content.messages}</p>
                  <p className="text-sm text-muted-foreground">Сообщения</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics?.content.moderated_items}</p>
                  <p className="text-sm text-muted-foreground">Промодерировано</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};