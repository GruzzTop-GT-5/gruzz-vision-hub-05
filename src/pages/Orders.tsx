import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
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
  const { user, userRole, loading, signOut } = useAuthContext();
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
      <div className="min-h-screen p-2 xs:p-3 sm:p-4">
        <div className="max-w-7xl mx-auto space-y-3 xs:space-y-4 sm:space-y-6">
          {/* Compact Header */}
          <div className="flex items-center gap-2 xs:gap-3">
            <BackButton />
            <Package className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-glow truncate">Мои задания</h1>
              <p className="text-xs xs:text-sm text-steel-400 hidden xs:block truncate">
                Управляйте своими заказами
              </p>
            </div>
          </div>

          {/* Premium Stats Grid with Gradients */}
          <div className="grid grid-cols-5 gap-1.5 xs:gap-2 sm:gap-3">
            <Card className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-2 xs:p-3 sm:p-4 text-center">
                <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-primary via-electric-400 to-primary bg-clip-text text-transparent">
                  {stats.total}
                </div>
                <div className="text-[10px] xs:text-xs text-steel-400 mt-0.5 xs:mt-1">Всего</div>
              </div>
            </Card>
            
            <Card className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-2 xs:p-3 sm:p-4 text-center">
                <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                  {stats.pending}
                </div>
                <div className="text-[10px] xs:text-xs text-steel-400 mt-0.5 xs:mt-1">Ожидают</div>
              </div>
            </Card>
            
            <Card className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-2 xs:p-3 sm:p-4 text-center">
                <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                  {stats.in_progress}
                </div>
                <div className="text-[10px] xs:text-xs text-steel-400 mt-0.5 xs:mt-1">В работе</div>
              </div>
            </Card>
            
            <Card className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-2 xs:p-3 sm:p-4 text-center">
                <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-green-400 via-green-300 to-green-400 bg-clip-text text-transparent">
                  {stats.completed}
                </div>
                <div className="text-[10px] xs:text-xs text-steel-400 mt-0.5 xs:mt-1">Завершены</div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-2 xs:p-3 sm:p-4 text-center">
                <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
                  {stats.expired}
                </div>
                <div className="text-[10px] xs:text-xs text-steel-400 mt-0.5 xs:mt-1">Истекли</div>
              </div>
            </Card>
          </div>

          {/* Premium Search & Filters */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-electric-600/5 opacity-50"></div>
            <div className="relative p-2.5 xs:p-3 sm:p-4">
              <div className="space-y-2.5 xs:space-y-3">
                {/* Search with gradient border effect */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-electric-400 to-primary rounded-lg opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                  <input
                    type="text"
                    placeholder="Поиск заказов..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="relative w-full bg-steel-800/50 border border-steel-600 focus:border-primary/50 rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 text-xs xs:text-sm text-steel-100 placeholder-steel-500 focus:outline-none transition-all duration-300"
                  />
                </div>

                {/* Filters Row with gradient effects */}
                <div className="flex gap-2 xs:gap-2.5">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-electric-600/20 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="relative w-full bg-steel-800/50 border border-steel-600 hover:border-primary/50 rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 text-xs xs:text-sm text-steel-100 focus:outline-none transition-all duration-300"
                    >
                      <option value="all">Все статусы</option>
                      <option value="pending">Ожидают</option>
                      <option value="accepted">Приняты</option>
                      <option value="in_progress">В работе</option>
                      <option value="completed">Завершены</option>
                      <option value="cancelled">Отменены</option>
                    </select>
                  </div>
                  
                  {(filters.search || filters.status !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="h-9 xs:h-10 px-3 text-xs xs:text-sm bg-steel-800/50 border-steel-600 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                    >
                      Сбросить
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Premium Orders List */}
          {isLoading ? (
            <Card className="relative overflow-hidden p-6 xs:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-electric-600/5"></div>
              <div className="relative text-center">
                <Loader2 className="w-6 h-6 xs:w-8 xs:h-8 text-primary animate-spin mx-auto mb-3 xs:mb-4" />
                <p className="text-xs xs:text-sm text-steel-300">Загрузка заказов...</p>
              </div>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="relative overflow-hidden p-6 xs:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-steel-800/50 via-steel-700/30 to-steel-800/50"></div>
              <div className="relative text-center space-y-3 xs:space-y-4">
                <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-steel-600/20 to-steel-700/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                  <Package className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-steel-400" />
                </div>
                <h3 className="text-base xs:text-lg sm:text-xl font-bold text-steel-100">
                  {orders.length === 0 ? 'У вас пока нет заказов' : 'Ничего не найдено'}
                </h3>
                <p className="text-xs xs:text-sm sm:text-base text-steel-400">
                  {orders.length === 0 
                    ? 'Создайте заказ через главную страницу' 
                    : 'Попробуйте изменить параметры фильтрации'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2 xs:space-y-2.5 sm:space-y-3">
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