// Страница "Мои заказы" - где пользователи видят свои размещенные заказы
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderCard } from '@/components/OrderCard';
import { SimpleOrderFilters, type OrderFilters as OrderFiltersType } from '@/components/SimpleOrderFilters';
import { BackButton } from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrderSorting } from '@/hooks/useOrderSorting';
import { formatRubles } from '@/utils/currency';
import { Package, Loader2, Clock, AlertTriangle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  status: string;
  priority: string;
  deadline: string | null;
  client_id: string;
  executor_id: string | null;
  ad_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  is_expired: boolean;
  completed_at: string | null;
  cancelled_at: string | null;
  payment_status: string;
  payment_method: string | null;
  client_requirements: any;
  executor_proposal: any;
  delivery_format: string | null;
  revision_count: number;
  max_revisions: number;
  escrow_amount: number | null;
  commission_rate: number;
  platform_fee: number | null;
  people_needed: number;
  people_accepted: number;
  is_auto_closed: boolean;
  start_time: string | null;
  admin_priority_override?: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telegram_photo_url: string | null;
  role: string;
  rating: number;
}

export default function Orders() {
  const { user, userRole, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFiltersType>({
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
    role: 'all',
    priceMin: '',
    priceMax: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const { sortedOrders, statistics } = useOrderSorting(orders as any, {
    includeExpired: true, // Показываем истекшие в "Моих заказах"
    includeInactive: true 
  });

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Получаем заказы пользователя (где он клиент)
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_client_id_fkey (
            display_name,
            full_name,
            avatar_url,
            telegram_photo_url,
            role,
            rating
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(ordersData as Order[] || []);

      // Получаем профили исполнителей
      if (ordersData && ordersData.length > 0) {
        const executorIds = ordersData
          .filter(order => order.executor_id)
          .map(order => order.executor_id);

        if (executorIds.length > 0) {
          const { data: executorProfiles, error: executorError } = await supabase
            .from('profiles')
            .select('id, display_name, full_name, avatar_url, telegram_photo_url, role, rating')
            .in('id', executorIds);

          if (executorError) throw executorError;

          const profilesMap: Record<string, Profile> = {};
          executorProfiles?.forEach(profile => {
            profilesMap[profile.id] = profile;
          });
          setProfiles(profilesMap);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказы",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderUpdate = () => {
    fetchOrders();
  };

  const handleOrderCreated = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      priority: 'all',
      role: 'all',
      priceMin: '',
      priceMax: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const getOrderStats = () => {
    return {
      total: sortedOrders.length,
      pending: sortedOrders.filter(order => order.status === 'pending').length,
      in_progress: sortedOrders.filter(order => order.status === 'in_progress').length,
      completed: sortedOrders.filter(order => order.status === 'completed').length,
      expired: sortedOrders.filter(order => order.is_expired).length
    };
  };

  if (loading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-steel-300">Загрузка...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <Package className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Требуется авторизация</h2>
            <p className="text-steel-300">Для просмотра заказов необходимо войти в систему</p>
          </Card>
        </div>
      </Layout>
    );
  }

  const stats = getOrderStats();

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BackButton />
              <Package className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-glow">Мои задания</h1>
            </div>
            
            <div className="text-sm text-steel-400">
              Всего: {statistics.total} | Активных: {statistics.active} | Истекших: {statistics.expired}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="card-steel p-4 text-center">
              <Package className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-steel-100">{stats.total}</div>
              <div className="text-sm text-steel-400">Всего</div>
            </Card>
            
            <Card className="card-steel p-4 text-center">
              <Package className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-steel-100">{stats.pending}</div>
              <div className="text-sm text-steel-400">Ожидают</div>
            </Card>
            
            <Card className="card-steel p-4 text-center">
              <Package className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-steel-100">{stats.in_progress}</div>
              <div className="text-sm text-steel-400">В работе</div>
            </Card>
            
            <Card className="card-steel p-4 text-center">
              <Package className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-steel-100">{stats.completed}</div>
              <div className="text-sm text-steel-400">Завершены</div>
            </Card>

            <Card className="card-steel p-4 text-center">
              <Clock className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-steel-100">{stats.expired}</div>
              <div className="text-sm text-steel-400">Истекли</div>
            </Card>
          </div>

          {/* Filters */}
          <SimpleOrderFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />

          {/* Orders List */}
          {isLoading ? (
            <Card className="card-steel p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-steel-300">Загрузка заказов...</p>
            </Card>
          ) : sortedOrders.length === 0 ? (
            <Card className="card-steel p-8 text-center space-y-4">
              <Package className="w-16 h-16 text-steel-500 mx-auto" />
              <h3 className="text-xl font-bold text-steel-300">У вас пока нет заказов</h3>
              <p className="text-steel-400">Создайте заказ через главную страницу или специальную кнопку "Создать заказ"</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Группировка по приоритетам */}
              {statistics.urgent > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-red-400">Срочные заказы ({statistics.urgent})</h2>
                  </div>
                  {sortedOrders.filter(order => (order.admin_priority_override || order.priority) === 'urgent').map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order as any}
                      clientProfile={order.client_id === user.id ? { id: user.id, display_name: user.phone, full_name: null, avatar_url: null, role: userRole || 'user' } : null}
                      executorProfile={order.executor_id ? profiles[order.executor_id] : null}
                      onUpdate={handleOrderUpdate}
                    />
                  ))}
                </div>
              )}

              {statistics.high > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-semibold text-yellow-400">Высокий приоритет ({statistics.high})</h2>
                  </div>
                  {sortedOrders.filter(order => (order.admin_priority_override || order.priority) === 'high').map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order as any}
                      clientProfile={order.client_id === user.id ? { id: user.id, display_name: user.phone, full_name: null, avatar_url: null, role: userRole || 'user' } : null}
                      executorProfile={order.executor_id ? profiles[order.executor_id] : null}
                      onUpdate={handleOrderUpdate}
                    />
                  ))}
                </div>
              )}

              {statistics.normal > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-semibold text-green-400">Обычные заказы ({statistics.normal})</h2>
                  </div>
                  {sortedOrders.filter(order => (order.admin_priority_override || order.priority) === 'normal').map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order as any}
                      clientProfile={order.client_id === user.id ? { id: user.id, display_name: user.phone, full_name: null, avatar_url: null, role: userRole || 'user' } : null}
                      executorProfile={order.executor_id ? profiles[order.executor_id] : null}
                      onUpdate={handleOrderUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
}