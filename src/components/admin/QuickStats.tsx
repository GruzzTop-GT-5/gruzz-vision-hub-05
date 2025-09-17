import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, DollarSign, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay } from 'date-fns';

interface QuickStatsProps {
  stats?: {
    totalUsers: number;
    activeUsers: number;
    totalOrders: number;
    activeOrders: number;
    totalRevenue: number;
    pendingTransactions: number;
  };
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats: propStats }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchRealStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfToday = startOfDay(now);

      console.log('QuickStats: Fetching real-time data...');

      // Получаем данные параллельно для быстрой загрузки
      const [usersData, ordersData, revenueData, pendingData] = await Promise.all([
        // Общее количество пользователей
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        
        // Заказы
        supabase.from('orders').select('status', { count: 'exact' }),
        
        // Выручка от пополнений GT коинов
        supabase.from('transactions')
          .select('amount')
          .eq('type', 'deposit')
          .eq('status', 'completed'),
        
        // Ожидающие пополнения
        supabase.from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'deposit')
          .eq('status', 'pending')
      ]);

      // Активные пользователи (отправляли сообщения сегодня)
      const { data: activeUsersData } = await supabase
        .from('messages')
        .select('sender_id')
        .gte('created_at', startOfToday.toISOString());
      
      const activeUsers = new Set(activeUsersData?.map(m => m.sender_id) || []).size;

      // Подсчитываем статистику
      const totalUsers = usersData.count || 0;
      const totalOrders = ordersData.count || 0;
      
      const activeOrders = ordersData.data?.filter(o => 
        o.status === 'pending' || o.status === 'in_progress'
      ).length || 0;

      const totalRevenue = revenueData.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const pendingTransactions = pendingData.count || 0;

      const newStats = {
        totalUsers,
        activeUsers,
        totalOrders,
        activeOrders,
        totalRevenue,
        pendingTransactions
      };

      setStats(newStats);
      console.log('QuickStats loaded:', newStats);

    } catch (error) {
      console.error('Error fetching real stats:', error);
      // В случае ошибки устанавливаем базовые значения
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalOrders: 0,
        activeOrders: 0,
        totalRevenue: 0,
        pendingTransactions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propStats) {
      fetchRealStats();
      
      // Обновляем каждые 10 секунд для реального времени
      const interval = setInterval(fetchRealStats, 10000);
      
      // Подписка на изменения в реальном времени
      const channels = [
        supabase
          .channel('quickstats-users')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            console.log('QuickStats: Users updated');
            fetchRealStats();
          })
          .subscribe(),
          
        supabase
          .channel('quickstats-orders')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            console.log('QuickStats: Orders updated');
            fetchRealStats();
          })
          .subscribe(),
          
        supabase
          .channel('quickstats-transactions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
            console.log('QuickStats: Transactions updated');
            fetchRealStats();
          })
          .subscribe()
      ];
      
      return () => {
        clearInterval(interval);
        channels.forEach(channel => supabase.removeChannel(channel));
      };
    } else {
      setStats(propStats);
      setLoading(false);
    }
  }, [propStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="card-steel p-4">
            <div className="flex items-center justify-center h-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-steel-400">Загрузка...</p>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="card-steel p-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel-400">Пользователи</p>
            <p className="text-lg font-bold text-steel-100">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <Badge variant="secondary" className="text-xs mt-2">
          {stats.activeUsers} активных
        </Badge>
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </Card>

      <Card className="card-steel p-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel-400">Заказы</p>
            <p className="text-lg font-bold text-steel-100">{stats.totalOrders.toLocaleString()}</p>
          </div>
          <Activity className="w-5 h-5 text-purple-400" />
        </div>
        <Badge variant="secondary" className="text-xs mt-2">
          {stats.activeOrders} активных
        </Badge>
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </Card>

      <Card className="card-steel p-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel-400">Реальная выручка</p>
            <p className="text-lg font-bold text-steel-100">{stats.totalRevenue.toLocaleString()}₽</p>
          </div>
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
        <Badge variant="secondary" className="text-xs mt-2">
          От GT коинов
        </Badge>
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </Card>

      <Card className="card-steel p-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel-400">Ожидают</p>
            <p className="text-lg font-bold text-steel-100">{stats.pendingTransactions}</p>
          </div>
          <Clock className="w-5 h-5 text-yellow-400" />
        </div>
        <Badge variant="outline" className="text-xs mt-2 border-yellow-400 text-yellow-400">
          Пополнений
        </Badge>
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </Card>
    </div>
  );
};