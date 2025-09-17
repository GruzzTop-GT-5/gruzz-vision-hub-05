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

  const fetchRealStats = async () => {
    try {
      const now = new Date();
      const startOfToday = startOfDay(now);

      // Общее количество пользователей
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Активные пользователи (отправляли сообщения сегодня)
      const { data: activeUsersData } = await supabase
        .from('messages')
        .select('sender_id')
        .gte('created_at', startOfToday.toISOString());
      
      const activeUsers = new Set(activeUsersData?.map(m => m.sender_id)).size;

      // Общее количество заказов
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Активные заказы
      const { count: activeOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress']);

      // Реальная выручка от пополнений
      const { data: revenueData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'deposit')
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Ожидающие транзакции (пополнения)
      const { count: pendingTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'deposit')
        .eq('status', 'pending');

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers,
        totalOrders: totalOrders || 0,
        activeOrders: activeOrders || 0,
        totalRevenue,
        pendingTransactions: pendingTransactions || 0
      });
    } catch (error) {
      console.error('Error fetching real stats:', error);
    }
  };

  useEffect(() => {
    if (!propStats) {
      fetchRealStats();
      // Обновляем каждые 30 секунд
      const interval = setInterval(fetchRealStats, 30000);
      return () => clearInterval(interval);
    } else {
      setStats(propStats);
    }
  }, [propStats]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="card-steel p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel-400">Пользователи</p>
            <p className="text-lg font-bold text-steel-100">{stats.totalUsers}</p>
          </div>
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <Badge variant="secondary" className="text-xs mt-2">
          {stats.activeUsers} активных
        </Badge>
      </Card>

      <Card className="card-steel p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel-400">Заказы</p>
            <p className="text-lg font-bold text-steel-100">{stats.totalOrders}</p>
          </div>
          <Activity className="w-5 h-5 text-purple-400" />
        </div>
        <Badge variant="secondary" className="text-xs mt-2">
          {stats.activeOrders} активных
        </Badge>
      </Card>

      <Card className="card-steel p-4">
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
      </Card>

      <Card className="card-steel p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel-400">Ожидают</p>
            <p className="text-lg font-bold text-steel-100">{stats.pendingTransactions}</p>
          </div>
          <Clock className="w-5 h-5 text-yellow-400" />
        </div>
        <Badge variant="outline" className="text-xs mt-2 border-yellow-400 text-yellow-400">
          Транзакций
        </Badge>
      </Card>
    </div>
  );
};