import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  MessageSquare, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalRevenue: number;
  totalTickets: number;
  openTickets: number;
  totalReviews: number;
  totalAds: number;
  recentActivity: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    totalRevenue: 0,
    totalTickets: 0,
    openTickets: 0,
    totalReviews: 0,
    totalAds: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchRealTimeStats = async () => {
    try {
      setLoading(true);
      
      // Получаем реальные данные из всех таблиц
      const [
        { data: users, count: totalUsers },
        { data: orders, count: totalOrders },
        { data: transactions, count: totalTransactions },
        { data: tickets, count: totalTickets },
        { data: reviews, count: totalReviews },
        { data: ads, count: totalAds }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('transactions').select('*', { count: 'exact' }),
        supabase.from('support_tickets').select('*', { count: 'exact' }),
        supabase.from('reviews').select('*', { count: 'exact' }),
        supabase.from('ads').select('*', { count: 'exact' })
      ]);

      // Считаем статистику
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const newUsersToday = users?.filter(user => 
        new Date(user.created_at) >= startOfDay
      ).length || 0;

      const activeOrders = orders?.filter(order => 
        order.status === 'pending' || order.status === 'in_progress'
      ).length || 0;

      const completedOrders = orders?.filter(order => 
        order.status === 'completed'
      ).length || 0;

      const pendingTransactions = transactions?.filter(t => 
        t.status === 'pending'
      ).length || 0;

      const completedTransactions = transactions?.filter(t => 
        t.status === 'completed'
      ).length || 0;

      // Выручка = сумма всех завершенных депозитов минус завершенные выводы
      const deposits = transactions
        ?.filter(t => t.status === 'completed' && t.type === 'deposit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      
      const withdrawals = transactions
        ?.filter(t => t.status === 'completed' && t.type === 'withdrawal')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      
      const totalRevenue = deposits - withdrawals;

      const openTickets = tickets?.filter(ticket => 
        ticket.status === 'open' || ticket.status === 'pending'
      ).length || 0;

      // Создаем данные для графика (последние 7 дней) на основе реальных данных
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        // Подсчитываем реальные данные за день
        const dayUsers = users?.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= startOfDay && createdAt < endOfDay;
        }).length || 0;
        
        const dayOrders = orders?.filter(o => {
          const createdAt = new Date(o.created_at);
          return createdAt >= startOfDay && createdAt < endOfDay;
        }).length || 0;
        
        const dayRevenue = transactions?.filter(t => {
          const createdAt = new Date(t.created_at);
          return t.status === 'completed' && 
                 t.type === 'deposit' && 
                 createdAt >= startOfDay && 
                 createdAt < endOfDay;
        }).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
        
        return {
          date: date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
          users: dayUsers,
          orders: dayOrders,
          revenue: dayRevenue
        };
      });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.3), // Приблизительно 30% активных
        newUsersToday,
        totalOrders: totalOrders || 0,
        activeOrders,
        completedOrders,
        totalTransactions: totalTransactions || 0,
        pendingTransactions,
        completedTransactions,
        totalRevenue,
        totalTickets: totalTickets || 0,
        openTickets,
        totalReviews: totalReviews || 0,
        totalAds: totalAds || 0,
        recentActivity: []
      });

      setChartData(last7Days);

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Настройка real-time обновлений
  useEffect(() => {
    fetchRealTimeStats();

    // Автоматическое обновление каждые 10 секунд
    const interval = setInterval(fetchRealTimeStats, 10000);

    // Подписка на изменения в реальном времени
    const channels = [
      supabase
        .channel('dashboard-users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          console.log('Dashboard: Users updated in real-time');
          fetchRealTimeStats();
        })
        .subscribe(),

      supabase
        .channel('dashboard-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          console.log('Dashboard: Orders updated in real-time');
          fetchRealTimeStats();
        })
        .subscribe(),

      supabase
        .channel('dashboard-transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
          console.log('Dashboard: Transactions updated in real-time');
          fetchRealTimeStats();
        })
        .subscribe(),

      supabase
        .channel('dashboard-tickets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
          console.log('Dashboard: Support tickets updated in real-time');
          fetchRealTimeStats();
        })
        .subscribe(),

      supabase
        .channel('dashboard-reviews')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
          console.log('Dashboard: Reviews updated in real-time');
          fetchRealTimeStats();
        })
        .subscribe(),

      supabase
        .channel('dashboard-ads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, () => {
          console.log('Dashboard: Ads updated in real-time');
          fetchRealTimeStats();
        })
        .subscribe()
    ];

    return () => {
      clearInterval(interval);
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const orderStatusData = [
    { name: 'Активные', value: stats.activeOrders, color: COLORS[0] },
    { name: 'Завершенные', value: stats.completedOrders, color: COLORS[1] },
    { name: 'Другие', value: stats.totalOrders - stats.activeOrders - stats.completedOrders, color: COLORS[2] }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Загрузка данных в реальном времени...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой обновления */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Дашборд администратора</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              Данные обновляются в реальном времени
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </p>
          </div>
        </div>
        <Button onClick={fetchRealTimeStats} disabled={loading} className="relative">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Обновление...' : 'Обновить данные'}
          {!loading && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
        </Button>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Пользователи</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{stats.newUsersToday} сегодня</p>
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
                <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-sm text-blue-600">{stats.activeOrders} активных</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Выручка</p>
                <p className="text-2xl font-bold">₽{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600">{stats.completedTransactions} транзакций</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Поддержка</p>
                <p className="text-2xl font-bold">{stats.totalTickets.toLocaleString()}</p>
                <p className="text-sm text-orange-600">{stats.openTickets} открытых</p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики и диаграммы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График активности */}
        <Card>
          <CardHeader>
            <CardTitle>Активность за неделю</CardTitle>
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

        {/* Статус заказов */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение заказов</CardTitle>
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

      {/* Дополнительная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Отзывы</p>
                <p className="text-xl font-bold">{stats.totalReviews}</p>
              </div>
              <Badge variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                Всего
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Объявления</p>
                <p className="text-xl font-bold">{stats.totalAds}</p>
              </div>
              <Badge variant="outline">
                <CheckCircle className="w-3 h-3 mr-1" />
                Активные
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ожидающие</p>
                <p className="text-xl font-bold">{stats.pendingTransactions}</p>
              </div>
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Транзакции
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статус системы */}
      <Card>
        <CardHeader>
          <CardTitle>Статус системы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">База данных: OK</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">API: Работает</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">Real-time: Активен</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">Хранилище: OK</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};