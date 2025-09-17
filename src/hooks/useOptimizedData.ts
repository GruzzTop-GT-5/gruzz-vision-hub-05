import { useMemo } from 'react';
import type { Order, User, Transaction, Review } from '@/types/common';

// Хук для оптимизации сортировки заказов
export const useOptimizedOrderSorting = (orders: Order[], sortBy: string, sortDirection: 'asc' | 'desc') => {
  return useMemo(() => {
    const sortedOrders = [...orders].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'expires_at':
          aValue = new Date(a.expires_at).getTime();
          bValue = new Date(b.expires_at).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedOrders;
  }, [orders, sortBy, sortDirection]);
};

// Хук для фильтрации заказов
export const useOptimizedOrderFiltering = (
  orders: Order[], 
  filters: {
    search?: string;
    category?: string;
    status?: string[];
    priceMin?: number;
    priceMax?: number;
    isExpired?: boolean;
  }
) => {
  return useMemo(() => {
    return orders.filter(order => {
      // Поиск по тексту
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = `${order.title} ${order.description}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Фильтр по категории
      if (filters.category && order.category !== filters.category) {
        return false;
      }

      // Фильтр по статусу
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(order.status)) return false;
      }

      // Фильтр по цене
      if (filters.priceMin !== undefined && order.price < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== undefined && order.price > filters.priceMax) {
        return false;
      }

      // Фильтр по просроченности
      if (filters.isExpired !== undefined) {
        if (filters.isExpired !== order.is_expired) return false;
      }

      return true;
    });
  }, [orders, filters]);
};

// Хук для статистики пользователя
export const useUserStats = (user: User, reviews: Review[], orders: Order[], transactions: Transaction[]) => {
  return useMemo(() => {
    const userReviews = reviews.filter(r => r.target_user_id === user.id);
    const userOrders = orders.filter(o => o.client_id === user.id || o.executor_id === user.id);
    const userTransactions = transactions.filter(t => t.user_id === user.id);

    const completedOrders = userOrders.filter(o => o.status === 'completed');
    const averageRating = userReviews.length > 0 
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length 
      : 0;

    const totalEarned = userTransactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = userTransactions
      .filter(t => ['payment', 'purchase'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalReviews: userReviews.length,
      averageRating: Math.round(averageRating * 100) / 100,
      totalOrders: userOrders.length,
      completedOrders: completedOrders.length,
      successRate: userOrders.length > 0 ? Math.round((completedOrders.length / userOrders.length) * 100) : 0,
      totalEarned,
      totalSpent,
      netBalance: totalEarned - totalSpent,
    };
  }, [user.id, reviews, orders, transactions]);
};

// Хук для оптимизации поиска пользователей
export const useOptimizedUserSearch = (users: User[], searchTerm: string) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      return (
        user.display_name?.toLowerCase().includes(term) ||
        user.full_name?.toLowerCase().includes(term) ||
        user.phone?.includes(term) ||
        user.telegram_username?.toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);
};

// Хук для группировки данных по периодам
export const useGroupedByPeriod = <T extends { created_at: string }>(
  data: T[], 
  period: 'day' | 'week' | 'month' | 'year'
) => {
  return useMemo(() => {
    const grouped: Record<string, T[]> = {};

    data.forEach(item => {
      const date = new Date(item.created_at);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }, [data, period]);
};