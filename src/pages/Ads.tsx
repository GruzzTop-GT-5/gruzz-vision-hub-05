// Страница заказов на работу - где заказчики размещают задания, требующие исполнителей
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { OrderBidForm } from '@/components/OrderBidForm';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Plus, Calendar, MapPin, DollarSign, User, Info, HelpCircle, Lightbulb, X, Package, Clock, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  service_type?: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telegram_photo_url: string | null;
  role: string;
}

const categories = [
  'Все категории',
  'Грузчики',
  'Разнорабочие',
  'Квартирный переезд',
  'Офисный переезд',
  'Погрузка/разгрузка',
  'Сборка мебели',
  'Уборка помещений',
  'Строительные работы',
  'Ремонтные работы',
  'Демонтаж',
  'Подсобные работы',
  'Складские работы',
  'Курьерские услуги',
  'Садовые работы',
  'Другое'
];

const serviceTypes = [
  'Все типы',
  'Грузчики',
  'Аренда компрессора',
  'Вывоз мусора',
  'Комплексные услуги'
];

const sortOptions = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'price_asc', label: 'По цене: сначала дешевые' },
  { value: 'price_desc', label: 'По цене: сначала дорогие' }
];

export default function Ads() {
  const { user, userRole, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedServiceType, setSelectedServiceType] = useState('Все типы');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedOrderForBid, setSelectedOrderForBid] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchQuery, selectedCategory, selectedServiceType, sortBy]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .is('executor_id', null)
        .neq('status', 'cancelled') // Исключаем отклоненные заказы
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      // Fetch profiles for client info
      if (data && data.length > 0) {
        const clientIds = [...new Set(data.map(order => order.client_id))];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', clientIds);

        if (profileData) {
          const profileMap = profileData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, Profile>);
          setProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.title.toLowerCase().includes(query) ||
        (order.description && order.description.toLowerCase().includes(query)) ||
        order.order_number.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(order => order.category === selectedCategory);
    }

    // Service type filter
    if (selectedServiceType !== 'Все типы') {
      filtered = filtered.filter(order => {
        const serviceType = order.service_type || 'workers';
        switch (selectedServiceType) {
          case 'Грузчики':
            return serviceType === 'workers';
          case 'Аренда компрессора':
            return serviceType === 'compressor_rent';
          case 'Вывоз мусора':
            return serviceType === 'garbage_removal';
          case 'Комплексные услуги':
            return serviceType === 'complex_service';
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Все категории');
    setSelectedServiceType('Все типы');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'Все категории' || selectedServiceType !== 'Все типы' || sortBy !== 'newest';

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleOrderUpdate = () => {
    fetchOrders();
  };

  const handleBidClick = (order: Order) => {
    if (!user) {
      return;
    }
    setSelectedOrderForBid(order);
    setShowBidForm(true);
  };

  const handleBidSuccess = () => {
    setShowBidForm(false);
    setSelectedOrderForBid(null);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-steel-600/10 text-steel-400 border-steel-600/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'normal':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'low':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-steel-600/10 text-steel-400 border-steel-600/20';
    }
  };

  if (loading || isLoading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-steel-300">Загрузка заказов...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-steel-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-glow bg-gradient-to-r from-primary to-electric-400 bg-clip-text text-transparent">
                  Заказы на работу
                </h1>
                <p className="text-steel-400">Найдите подходящую работу от заказчиков</p>
              </div>
            </div>
            <Link to="/create-order">
              <Button className="bg-gradient-to-r from-primary to-electric-600 hover:from-primary/80 hover:to-electric-600/80 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Разместить заказ
              </Button>
            </Link>
          </div>

          {/* Simple Information Banner */}
          <Card className="card-steel border-primary/20">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Package className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-steel-100">Заказы на работу</h3>
              </div>
              <p className="text-steel-300 text-base mb-4">
                Здесь размещаются заказы на различные виды работ от заказчиков. Найдите подходящую работу или разместите свой заказ.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <div className="flex items-center space-x-2 text-steel-400">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span>Пример: "Нужен грузчик для переезда в субботу"</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-steel-500 rounded-full"></div>
                <Link to="/available-orders" className="text-primary hover:text-primary/80 font-medium">
                  Ищете работу? Смотреть вакансии →
                </Link>
                <div className="hidden sm:block w-1 h-1 bg-steel-500 rounded-full"></div>
                <Link to="/my-ads" className="text-primary hover:text-primary/80 font-medium">
                  Управлять публикациями →
                </Link>
              </div>
            </div>
          </Card>

          {/* Simple Filters */}
          <Card className="card-steel p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="grid md:grid-cols-4 gap-4 flex-1">
                  {/* Search */}
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-steel-400" />
                    <Input
                      placeholder="Найти заказ по описанию работы..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Service Type Filter */}
                  <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Тип услуги" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Категория" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === 'Все категории' ? 'Все категории' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Сбросить
                    <Badge className="ml-2 bg-primary/20 text-primary border-primary/20">
                      {[searchQuery.trim() !== '', selectedCategory !== 'Все категории', selectedServiceType !== 'Все типы', sortBy !== 'newest'].filter(Boolean).length}
                    </Badge>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Results Count */}
            {filteredOrders.length > 0 && (
              <div className="mt-3 text-center">
                <span className="text-steel-400 text-sm">
                  Найдено {filteredOrders.length} заказов
                </span>
              </div>
            )}
          </Card>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <Card className="card-steel p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-steel-600/20 rounded-full flex items-center justify-center mx-auto">
                  <HelpCircle className="w-8 h-8 text-steel-400" />
                </div>
                <h3 className="text-xl font-semibold text-steel-100">Заказы не найдены</h3>
                <p className="text-steel-300 max-w-md mx-auto">
                  {searchQuery || selectedCategory !== 'Все категории'
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Пока что заказчики не разместили заказы на работу'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Link to="/create-order">
                    <Button className="bg-primary hover:bg-primary/80">
                      <Plus className="w-4 h-4 mr-2" />
                      Разместить заказ
                    </Button>
                  </Link>
                  <Link to="/available-orders">
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Смотреть вакансии
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => {
                const client = profiles[order.client_id];
                return (
                  <Card key={order.id} className="card-steel border border-steel-600 h-full">
                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            Доступен
                          </Badge>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority === 'urgent' ? 'Срочно' :
                             order.priority === 'high' ? 'Высокий' :
                             order.priority === 'low' ? 'Низкий' : 'Обычный'}
                          </Badge>
                        </div>
                        <span className="text-xs text-steel-400">
                          {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ru })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-steel-100 line-clamp-2">
                        {order.title}
                      </h3>

                      {/* Description */}
                      <p className="text-steel-300 text-sm line-clamp-3">
                        {order.description || 'Описание не указано'}
                      </p>

                      {/* Service Type & Category */}
                      <div className="flex items-center justify-between text-sm text-steel-400">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>{order.category || 'Не указано'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {order.service_type === 'compressor_rent' && <span>🔨</span>}
                          {order.service_type === 'garbage_removal' && <span>🚛</span>}
                          {order.service_type === 'complex_service' && <span>🧩</span>}
                          {(!order.service_type || order.service_type === 'workers') && <span>👷</span>}
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="flex items-center space-x-2 text-sm text-steel-400">
                        <User className="w-4 h-4" />
                        <span>Заказчик: {client?.display_name || client?.full_name || 'Аноним'}</span>
                      </div>

                      {/* Deadline */}
                      {order.deadline && (
                        <div className="flex items-center space-x-2 text-sm text-steel-400">
                          <Clock className="w-4 h-4" />
                          <span>До: {format(new Date(order.deadline), 'dd MMM yyyy', { locale: ru })}</span>
                        </div>
                      )}

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-lg font-bold text-steel-100">{order.price} ₽</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(order)}
                          >
                            Подробнее
                          </Button>
                          {user && (
                            <Button 
                              size="sm" 
                              className="bg-primary hover:bg-primary/80"
                              onClick={() => handleBidClick(order)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Откликнуться
                            </Button>
                          )}
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
      
      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        order={selectedOrder}
        clientProfile={selectedOrder ? profiles[selectedOrder.client_id] : undefined}
        onUpdate={handleOrderUpdate}
      />

      {/* Bid Form Modal */}
      {selectedOrderForBid && (
        <OrderBidForm
          orderId={selectedOrderForBid.id}
          orderTitle={selectedOrderForBid.title}
          isOpen={showBidForm}
          onClose={() => {
            setShowBidForm(false);
            setSelectedOrderForBid(null);
          }}
          onSuccess={handleBidSuccess}
        />
      )}
    </Layout>
  );
}