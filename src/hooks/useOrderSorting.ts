import { useMemo } from 'react';

export interface Order {
  id: string;
  title: string;
  description: string;
  priority: 'normal' | 'high' | 'urgent';
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  status: string;
  people_needed: number;
  people_accepted: number;
  is_auto_closed: boolean;
  admin_priority_override?: string;
  price: number;
  client_id: string;
  executor_id?: string;
  category: string;
  start_time?: string;
  order_number: string;
}

interface UseOrderSortingOptions {
  includeExpired?: boolean;
  includeInactive?: boolean;
}

export const useOrderSorting = (orders: Order[], options: UseOrderSortingOptions = {}) => {
  const { includeExpired = false, includeInactive = false } = options;

  const sortedOrders = useMemo(() => {
    if (!orders) return [];

    // Фильтруем заказы
    let filteredOrders = orders.filter(order => {
      // Исключаем истекшие заказы, если не требуется их показывать
      if (!includeExpired && order.is_expired) return false;
      
      // Исключаем неактивные заказы, если не требуется их показывать
      if (!includeInactive && order.status === 'inactive') return false;
      
      return true;
    });

    // Сортируем заказы по приоритетам и времени создания
    return filteredOrders.sort((a, b) => {
      // Если у заказа есть админский приоритет, используем его
      const priorityA = a.admin_priority_override || a.priority;
      const priorityB = b.admin_priority_override || b.priority;

      // Приоритеты: urgent > high > normal
      const priorityWeight = {
        urgent: 3,
        high: 2,
        normal: 1
      };

      const weightA = priorityWeight[priorityA as keyof typeof priorityWeight] || 1;
      const weightB = priorityWeight[priorityB as keyof typeof priorityWeight] || 1;

      // Сначала сортируем по приоритету (убывание)
      if (weightA !== weightB) {
        return weightB - weightA;
      }

      // Если приоритеты одинаковые, сортируем по времени создания (новые сначала)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, includeExpired, includeInactive]);

  // Группируем заказы по приоритетам для лучшего отображения
  const groupedOrders = useMemo(() => {
    const groups = {
      urgent: [] as Order[],
      high: [] as Order[],
      normal: [] as Order[]
    };

    sortedOrders.forEach(order => {
      const priority = (order.admin_priority_override || order.priority) as keyof typeof groups;
      if (groups[priority]) {
        groups[priority].push(order);
      }
    });

    return groups;
  }, [sortedOrders]);

  // Статистика заказов
  const statistics = useMemo(() => {
    return {
      total: sortedOrders.length,
      urgent: groupedOrders.urgent.length,
      high: groupedOrders.high.length,
      normal: groupedOrders.normal.length,
      expired: orders.filter(order => order.is_expired).length,
      active: orders.filter(order => !order.is_expired && order.status !== 'inactive').length
    };
  }, [sortedOrders, groupedOrders, orders]);

  return {
    sortedOrders,
    groupedOrders,
    statistics
  };
};

// Утилита для проверки времени до истечения заказа
export const getOrderTimeRemaining = (expiresAt: string) => {
  const now = new Date().getTime();
  const expiryTime = new Date(expiresAt).getTime();
  const timeRemaining = expiryTime - now;

  if (timeRemaining <= 0) {
    return { expired: true, hours: 0, minutes: 0 };
  }

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return { expired: false, hours, minutes };
};

// Утилита для получения цвета приоритета
export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'high':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'normal':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    default:
      return 'text-steel-400 bg-steel-500/10 border-steel-500/20';
  }
};

// Утилита для получения текста приоритета
export const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Срочно';
    case 'high':
      return 'Высокий';
    case 'normal':
      return 'Обычный';
    default:
      return priority;
  }
};