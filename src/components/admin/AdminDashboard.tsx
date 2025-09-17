import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, Users, CreditCard, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';
import { statsAPI } from '@/lib/optimizedApi';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  pendingTransactions: number;
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  totalTickets: number;
  openTickets: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    totalRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalTickets: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const result = await statsAPI.getDashboardStats();
      if (result) {
        setStats(result);
      }
    } catch (error) {
      handleError(error, { component: 'AdminDashboard', action: 'fetchStats' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <Card className="card-steel p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-steel-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-steel-100">{value}</p>
          {subtitle && <p className="text-steel-500 text-sm">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-steel-100">Дашборд администратора</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Общее количество пользователей"
          value={stats.totalUsers}
          subtitle={`${stats.activeUsers} активных за месяц`}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />

        <StatCard
          title="Транзакции"
          value={stats.totalTransactions}
          subtitle={`${stats.pendingTransactions} ожидают обработки`}
          icon={<CreditCard className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />

        <StatCard
          title="Общая выручка"
          value={`${stats.totalRevenue.toLocaleString()}₽`}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />

        <StatCard
          title="Заказы"
          value={stats.totalOrders}
          subtitle={`${stats.activeOrders} активных`}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />

        <StatCard
          title="Поддержка"
          value={stats.totalTickets}
          subtitle={`${stats.openTickets} открытых тикетов`}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          color="bg-red-500"
        />

        <StatCard
          title="Конверсия"
          value={`${((stats.activeOrders / Math.max(stats.totalOrders, 1)) * 100).toFixed(1)}%`}
          subtitle="Активных заказов"
          icon={<BarChart3 className="w-6 h-6 text-white" />}
          color="bg-cyan-500"
        />
      </div>
    </div>
  );
};