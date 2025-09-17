import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, DollarSign, Activity } from 'lucide-react';

interface QuickStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalOrders: number;
    activeOrders: number;
    totalRevenue: number;
    pendingTransactions: number;
  };
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
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
            <p className="text-xs text-steel-400">Выручка</p>
            <p className="text-lg font-bold text-steel-100">{stats.totalRevenue.toLocaleString()}₽</p>
          </div>
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
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