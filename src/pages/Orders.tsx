import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderCard } from '@/components/OrderCard';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { SimpleOrderFilters, type OrderFilters as OrderFiltersType } from '@/components/SimpleOrderFilters';
import { BackButton } from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Loader2 } from 'lucide-react';

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
}

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telegram_photo_url: string | null;
  role: string;
}

const Orders = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id, filters]);

  const fetchOrders = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Build query - показываем только заказы пользователя
      let query = supabase
        .from('orders')
        .select('*');

      // Показываем заказы где пользователь участвует как клиент или исполнитель
      query = query.or(`client_id.eq.${user.id},executor_id.eq.${user.id}`);

      // Apply role filter for more specific filtering
      if (filters.role === 'client') {
        query = supabase.from('orders').select('*').eq('client_id', user.id);
      } else if (filters.role === 'executor') {
        query = supabase.from('orders').select('*').eq('executor_id', user.id);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply category filter
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Apply priority filter
      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      // Apply price range filters
      if (filters.priceMin) {
        query = query.gte('price', parseFloat(filters.priceMin));
      }
      if (filters.priceMax) {
        query = query.lte('price', parseFloat(filters.priceMax));
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      const { data: ordersData, error } = await query;

      if (error) throw error;

      setOrders(ordersData || []);

      // Fetch profiles for all participants
      if (ordersData && ordersData.length > 0) {
        const userIds = Array.from(new Set([
          ...ordersData.map(order => order.client_id),
          ...ordersData.filter(order => order.executor_id).map(order => order.executor_id!)
        ]));

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, avatar_url, telegram_photo_url, role')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
        setProfiles(profilesMap);
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
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length
    };
  };

  const stats = getOrderStats();

  if (!user) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <Package className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Требуется авторизация</h2>
            <p className="text-steel-300">Для работы с заказами необходимо войти в систему</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton onClick={() => window.history.back()} />
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-glow">Мои заказы</h1>
              </div>
              <p className="text-steel-400 text-sm mt-1">
                Заказы, где вы участвуете как клиент или исполнитель
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать заказ
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-steel-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-steel-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.total}</p>
                  <p className="text-sm text-steel-400">Всего заказов</p>
                </div>
              </div>
            </Card>

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.pending}</p>
                  <p className="text-sm text-steel-400">Ожидают</p>
                </div>
              </div>
            </Card>

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.in_progress}</p>
                  <p className="text-sm text-steel-400">В работе</p>
                </div>
              </div>
            </Card>

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.completed}</p>
                  <p className="text-sm text-steel-400">Завершены</p>
                </div>
              </div>
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
          ) : orders.length === 0 ? (
            <Card className="card-steel p-8 text-center space-y-4">
              <Package className="w-16 h-16 text-steel-500 mx-auto" />
              <h3 className="text-xl font-bold text-steel-300">
                {Object.values(filters).some(v => v !== '' && v !== 'all' && v !== 'created_at' && v !== 'desc') 
                  ? 'Заказы не найдены' 
                  : 'Нет заказов'
                }
              </h3>
              <p className="text-steel-400">
                {Object.values(filters).some(v => v !== '' && v !== 'all' && v !== 'created_at' && v !== 'desc')
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Ваши заказы будут отображаться здесь'
                }
              </p>
              {!Object.values(filters).some(v => v !== '' && v !== 'all' && v !== 'created_at' && v !== 'desc') && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первый заказ
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  clientProfile={profiles[order.client_id]}
                  executorProfile={order.executor_id ? profiles[order.executor_id] : undefined}
                  onUpdate={handleOrderUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrderCreated={handleOrderUpdate}
      />
    </Layout>
  );
};

export default Orders;