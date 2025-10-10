import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/OrderCard';
import { BackButton } from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrderSorting } from '@/hooks/useOrderSorting';
import { Package, Loader2 } from 'lucide-react';

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

interface OrderFilters {
  search: string;
  status: string;
}

export default function Orders() {
  const { user, userRole, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: 'all'
  });

  const { sortedOrders, statistics } = useOrderSorting(orders as any, {
    includeExpired: true, // Показываем истекшие в "Моих заказах"
    includeInactive: true 
  });

  // Apply filters
  const filteredOrders = sortedOrders.filter(order => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        order.title?.toLowerCase().includes(searchLower) ||
        order.description?.toLowerCase().includes(searchLower) ||
        order.order_number?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }

    return true;
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
        .select('*')
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
      status: 'all'
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <BackButton />
              <Package className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-glow">Мои задания</h1>
                <p className="text-sm text-steel-400 mt-1">
                  Управляйте своими заказами
                </p>
              </div>
            </div>
          </div>

          {/* Simple Stats - Quick View */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="card-steel-dialog p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-steel-400 mt-1">Всего</div>
            </Card>
            
            <Card className="card-steel-dialog p-4 text-center hover:border-yellow-400/50 transition-colors cursor-pointer">
              <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-steel-400 mt-1">Ожидают</div>
            </Card>
            
            <Card className="card-steel-dialog p-4 text-center hover:border-blue-400/50 transition-colors cursor-pointer">
              <div className="text-3xl font-bold text-blue-400">{stats.in_progress}</div>
              <div className="text-xs text-steel-400 mt-1">В работе</div>
            </Card>
            
            <Card className="card-steel-dialog p-4 text-center hover:border-green-400/50 transition-colors cursor-pointer">
              <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-xs text-steel-400 mt-1">Завершены</div>
            </Card>

            <Card className="card-steel-dialog p-4 text-center hover:border-red-400/50 transition-colors cursor-pointer">
              <div className="text-3xl font-bold text-red-400">{stats.expired}</div>
              <div className="text-xs text-steel-400 mt-1">Истекли</div>
            </Card>
          </div>

          {/* Simple Search */}
          <Card className="card-steel-dialog p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Поиск заказов..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex-1 bg-steel-800/50 border border-steel-600 rounded-lg px-4 py-2 text-steel-100 placeholder-steel-500 focus:outline-none focus:border-primary transition-colors"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-steel-800/50 border border-steel-600 rounded-lg px-4 py-2 text-steel-100 focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Ожидают</option>
                <option value="accepted">Приняты</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершены</option>
                <option value="cancelled">Отменены</option>
              </select>
              {(filters.search || filters.status !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Сбросить
                </Button>
              )}
            </div>
          </Card>

          {/* Orders List - Simple View */}
          {isLoading ? (
            <Card className="card-steel-dialog p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-steel-300">Загрузка заказов...</p>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="card-steel-dialog p-8 text-center space-y-4">
              <Package className="w-16 h-16 text-steel-500 mx-auto" />
              <h3 className="text-xl font-bold text-steel-300">
                {orders.length === 0 ? 'У вас пока нет заказов' : 'Ничего не найдено'}
              </h3>
              <p className="text-steel-400">
                {orders.length === 0 
                  ? 'Создайте заказ через главную страницу' 
                  : 'Попробуйте изменить параметры фильтрации'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
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
      </div>
    </Layout>
  );
}