import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimpleOrderFilters, type OrderFilters as OrderFiltersType } from '@/components/SimpleOrderFilters';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Loader2, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  MessageSquare,
  Calendar,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  created_at: string;
  payment_method: string | null;
  client_requirements: any;
  max_revisions: number;
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

const AvailableOrders = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFiltersType>({
    search: '',
    status: 'pending', // По умолчанию показываем только доступные заказы
    category: 'all',
    priority: 'all',
    role: 'all',
    priceMin: '',
    priceMax: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchAvailableOrders();
  }, [filters]);

  const fetchAvailableOrders = async () => {
    try {
      setIsLoading(true);

      // Fetch only available orders (pending status, no executor assigned)
      let query = supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .is('executor_id', null);

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
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      const { data: ordersData, error } = await query;

      if (error) throw error;

      setOrders(ordersData || []);

      // Fetch client profiles
      if (ordersData && ordersData.length > 0) {
        const clientIds = Array.from(new Set(ordersData.map(order => order.client_id)));

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, avatar_url, telegram_photo_url, role, rating')
          .in('id', clientIds);

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить доступные заказы",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeOrder = async (orderId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          executor_id: user.id,
          status: 'accepted'
        })
        .eq('id', orderId)
        .eq('status', 'pending') // Double check it's still pending
        .is('executor_id', null); // Double check no one else took it

      if (error) throw error;

      toast({
        title: "Заказ принят",
        description: "Вы успешно приняли заказ к выполнению"
      });

      fetchAvailableOrders(); // Refresh list
    } catch (error) {
      console.error('Error taking order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось принять заказ. Возможно, его уже взял другой исполнитель",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    console.log('clearFilters called');
    setFilters({
      search: '',
      status: 'pending',
      category: 'all',
      priority: 'all',
      role: 'all',
      priceMin: '',
      priceMax: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const getPaymentTypeLabel = (paymentMethod: string | null, requirements: any) => {
    if (requirements?.payment_type) {
      switch (requirements.payment_type) {
        case 'hourly': return 'Почасовая оплата';
        case 'daily': return 'Дневная оплата';
        case 'project': return 'За весь объем';
        default: return 'Договорная';
      }
    }
    return 'Договорная';
  };

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

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-glow">Вакансии</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/create-ad">
                <Button className="bg-primary hover:bg-primary/80">
                  <Plus className="w-4 h-4 mr-2" />
                  Разместить резюме
                </Button>
              </Link>
              <div className="text-sm text-steel-400">
                Найдено: {orders.length} заказов
              </div>
            </div>
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
              <h3 className="text-xl font-bold text-steel-300">Нет доступных заказов</h3>
              <p className="text-steel-400">
                Попробуйте изменить параметры поиска или зайдите позже
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const clientProfile = profiles[order.client_id];
                return (
                  <Card key={order.id} className="card-steel p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Package className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-bold text-steel-100">{order.title}</h3>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-steel-400">
                            <span>#{order.order_number}</span>
                            <span>•</span>
                            <span>{order.category || 'Без категории'}</span>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold text-primary">
                            {order.price.toLocaleString('ru-RU')} ₽
                          </div>
                          <Badge className="text-green-400 bg-green-400/10 border-green-400/20">
                            {getPaymentTypeLabel(order.payment_method, order.client_requirements)}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      {order.description && (
                        <p className="text-steel-200">{order.description}</p>
                      )}

                      {/* Requirements */}
                      {order.client_requirements && (
                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-steel-800/30 rounded-lg">
                          {order.client_requirements.location && (
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-4 h-4 text-steel-400 mt-1" />
                              <div>
                                <p className="text-sm font-medium text-steel-300">Адрес:</p>
                                <p className="text-sm text-steel-200">{order.client_requirements.location}</p>
                              </div>
                            </div>
                          )}
                          
                          {order.client_requirements.people_count && (
                            <div className="flex items-start space-x-2">
                              <Users className="w-4 h-4 text-steel-400 mt-1" />
                              <div>
                                <p className="text-sm font-medium text-steel-300">Требуется:</p>
                                <p className="text-sm text-steel-200">{order.client_requirements.people_count} человек</p>
                              </div>
                            </div>
                          )}
                          
                          {order.client_requirements.work_duration && (
                            <div className="flex items-start space-x-2">
                              <Clock className="w-4 h-4 text-steel-400 mt-1" />
                              <div>
                                <p className="text-sm font-medium text-steel-300">Продолжительность:</p>
                                <p className="text-sm text-steel-200">{order.client_requirements.work_duration}</p>
                              </div>
                            </div>
                          )}
                          
                          {order.deadline && (
                            <div className="flex items-start space-x-2">
                              <Calendar className="w-4 h-4 text-steel-400 mt-1" />
                              <div>
                                <p className="text-sm font-medium text-steel-300">Срок:</p>
                                <p className="text-sm text-steel-200">
                                  {format(new Date(order.deadline), 'dd.MM.yyyy', { locale: ru })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Client Info */}
                      <div className="flex items-center justify-between pt-4 border-t border-steel-600">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={clientProfile?.avatar_url || clientProfile?.telegram_photo_url} />
                            <AvatarFallback>
                              {(clientProfile?.display_name || clientProfile?.full_name || 'К').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-steel-100">
                              {clientProfile?.display_name || clientProfile?.full_name || 'Заказчик'}
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-steel-400">
                                Рейтинг: {clientProfile?.rating || 0}
                              </p>
                              <span className="text-xs text-steel-500">•</span>
                              <p className="text-xs text-steel-400">
                                {format(new Date(order.created_at), 'dd.MM.yyyy', { locale: ru })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Написать
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleTakeOrder(order.id)}
                            className="bg-primary hover:bg-primary/80"
                          >
                            Взять заказ
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AvailableOrders;