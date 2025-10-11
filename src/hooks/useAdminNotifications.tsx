import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminNotificationCounts {
  users: number;
  orders: number;
  transactions: number;
  reviews: number;
  ads: number;
  support: number;
  security: number;
}

export const useAdminNotifications = () => {
  const [counts, setCounts] = useState<AdminNotificationCounts>({
    users: 0,
    orders: 0,
    transactions: 0,
    reviews: 0,
    ads: 0,
    support: 0,
    security: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

      // Новые пользователи за последние 24 часа
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);
      
      // Активные заказы
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Транзакции в ожидании
      const { count: transactionsCount, error: transactionsError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Отзывы на модерации
      const { count: reviewsCount, error: reviewsError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'pending');
      
      // Объявления на модерации - временно отключено из-за проблем с типами
      const adsCount = 0;
      
      // Открытые тикеты поддержки
      const { count: supportCount, error: supportError } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.open,status.eq.in_progress');
      
      // Критические события безопасности за последний час
      const { count: securityCount, error: securityError } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .gte('created_at', oneHourAgo);

      setCounts({
        users: usersCount || 0,
        orders: ordersCount || 0,
        transactions: transactionsCount || 0,
        reviews: reviewsCount || 0,
        ads: adsCount || 0,
        support: supportCount || 0,
        security: securityCount || 0,
      });
    } catch (error) {
      console.error('Error fetching admin notification counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Обновление каждые 30 секунд
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { counts, loading, refresh: fetchCounts };
};
