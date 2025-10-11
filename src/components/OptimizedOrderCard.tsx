import React, { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Truck, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Clock, User, Coins, MapPin, Calendar } from 'lucide-react';
import { formatRubles } from '@/utils/currency';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Order } from '@/types/common';

interface OptimizedOrderCardProps {
  order: Order;
  onOrderClick?: (order: Order) => void;
  showActions?: boolean;
  currentUserId?: string;
}

export const OptimizedOrderCard = memo<OptimizedOrderCardProps>(({ 
  order, 
  onOrderClick, 
  showActions = true, 
  currentUserId 
}) => {
  // Мемоизируем тяжелые вычисления
  const { statusBadge, priorityBadge, timeRemaining, formattedDate } = useMemo(() => {
    const getStatusBadge = (status: string) => {
      const statusConfig = {
        pending: { class: 'bg-yellow-500', text: 'Ожидает' },
        in_progress: { class: 'bg-blue-500', text: 'В работе' },
        completed: { class: 'bg-green-500', text: 'Завершен' },
        cancelled: { class: 'bg-red-500', text: 'Отменен' },
        inactive: { class: 'bg-gray-500', text: 'Неактивен' }
      };
      const config = statusConfig[status as keyof typeof statusConfig] || { class: 'bg-gray-500', text: status };
      return <Badge className={`${config.class} text-white`}>{config.text}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
      const priorityConfig = {
        urgent: { class: 'bg-red-500', text: 'Срочно' },
        high: { class: 'bg-orange-500', text: 'Высокий' },
        normal: { class: 'bg-blue-500', text: 'Обычный' },
        low: { class: 'bg-gray-500', text: 'Низкий' }
      };
      const config = priorityConfig[priority as keyof typeof priorityConfig] || { class: 'bg-gray-500', text: priority };
      return <Badge variant="outline" className={`${config.class} text-white border-current`}>{config.text}</Badge>;
    };

    const getTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(order.expires_at);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) return 'Просрочен';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}д ${hours % 24}ч`;
      }
      
      return `${hours}ч ${minutes}м`;
    };

    return {
      statusBadge: getStatusBadge(order.status),
      priorityBadge: getPriorityBadge(order.priority),
      timeRemaining: getTimeRemaining(),
      formattedDate: format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
    };
  }, [order.status, order.priority, order.expires_at, order.created_at]);

  const isOwner = useMemo(() => currentUserId === order.client_id, [currentUserId, order.client_id]);
  const isExecutor = useMemo(() => currentUserId === order.executor_id, [currentUserId, order.executor_id]);

  const getServiceIcon = useMemo(() => {
    switch (order.service_type) {
      case 'compressor_rent':
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case 'garbage_removal':
        return <Truck className="w-4 h-4 text-green-400" />;
      case 'complex_service':
        return <Package className="w-4 h-4 text-purple-400" />;
      default:
        return <Users className="w-4 h-4 text-blue-400" />;
    }
  }, [order.service_type]);

  const handleClick = useMemo(() => {
    return onOrderClick ? () => onOrderClick(order) : undefined;
  }, [onOrderClick, order]);

  return (
    <Card 
      className="card-steel p-4 hover:bg-steel-700 hover:scale-105 transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getServiceIcon}
            <h3 className="font-semibold text-steel-100 line-clamp-1">{order.title}</h3>
            {statusBadge}
            {priorityBadge}
          </div>
          
          <p className="text-steel-400 text-sm line-clamp-2 mb-3">{order.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-steel-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className={order.is_expired ? 'text-red-400' : ''}>
                {timeRemaining}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{order.people_accepted}/{order.people_needed}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-xl font-bold text-primary mb-1">
            <Coins className="w-5 h-5" />
            {formatRubles(order.price)}
          </div>
          
          {order.category && (
            <Badge variant="secondary" className="text-xs">
              {order.category}
            </Badge>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className="flex justify-between items-center pt-3 border-t border-steel-600">
          <div className="flex gap-2">
            {isOwner && (
              <Badge className="bg-blue-500 text-white text-xs">Заказчик</Badge>
            )}
            {isExecutor && (
              <Badge className="bg-green-500 text-white text-xs">Исполнитель</Badge>
            )}
          </div>
          
          <Button variant="outline" size="sm">
            Подробнее
          </Button>
        </div>
      )}
    </Card>
  );
});

OptimizedOrderCard.displayName = 'OptimizedOrderCard';