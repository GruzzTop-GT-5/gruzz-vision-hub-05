// Страница заказов на работу - где заказчики размещают задания, требующие исполнителей
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { OrderBidForm } from '@/components/OrderBidForm';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Plus, Calendar, MapPin, Coins, User, Info, HelpCircle, Lightbulb, X, Package, Clock, Send } from 'lucide-react';
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
  equipment_details?: any;
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
  const { user, userRole, loading, signOut } = useAuthContext();
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
      <div className="min-h-screen p-2 xs:p-3 sm:p-4">
        <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4">
          {/* Compact Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 xs:gap-3 min-w-0">
              <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-steel-900" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg xs:text-xl sm:text-3xl font-bold text-glow bg-gradient-to-r from-primary to-electric-400 bg-clip-text text-transparent truncate">
                  Заказы на работу
                </h1>
                <p className="text-xs xs:text-sm text-steel-400 hidden xs:block truncate">Найдите подходящую работу от заказчиков</p>
              </div>
            </div>
            <Link to="/create-order" className="flex-shrink-0">
              <Button className="bg-gradient-to-r from-primary to-electric-600 hover:from-primary/80 hover:to-electric-600/80 shadow-lg h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4 text-xs xs:text-sm">
                <Plus className="w-3 h-3 xs:w-4 xs:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Разместить заказ</span>
              </Button>
            </Link>
          </div>

          {/* Compact Information Card */}
          <Card className="card-steel border-primary/20">
            <div className="p-3 xs:p-4">
              <div className="flex items-start gap-2 xs:gap-3 mb-2">
                <Package className="w-5 h-5 xs:w-6 xs:h-6 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-steel-100 mb-1">Заказы на работу</h3>
                  <p className="text-xs xs:text-sm text-steel-300 leading-relaxed">
                    Здесь размещаются заказы на различные виды работ от заказчиков. Найдите подходящую работу или разместите свой заказ.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 xs:gap-2.5 text-xs xs:text-sm mt-3">
                <div className="flex items-center gap-2 text-steel-400">
                  <Lightbulb className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-yellow-400 flex-shrink-0" />
                  <span className="line-clamp-1">Пример: "Нужен грузчик для переезда в субботу"</span>
                </div>
                <div className="flex flex-wrap gap-2 xs:gap-3">
                  <Link to="/available-orders" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1">
                    <span>Смотреть вакансии →</span>
                  </Link>
                  <Link to="/my-ads" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1">
                    <span>Управлять публикациями →</span>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Compact Filters */}
          <Card className="card-steel p-2.5 xs:p-3 sm:p-4">
            <div className="space-y-2.5 xs:space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 xs:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xs:w-4 xs:h-4 text-steel-400 pointer-events-none" />
                <Input
                  placeholder="Найти заказ по описанию работы..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 xs:pl-10 h-9 xs:h-10 text-xs xs:text-sm"
                />
              </div>

              {/* Filters Row */}
              <div className="flex gap-2 xs:gap-2.5">
                <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                  <SelectTrigger className="h-9 xs:h-10 text-xs xs:text-sm flex-1">
                    <SelectValue placeholder="Тип услуги" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs xs:text-sm">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 xs:h-10 text-xs xs:text-sm flex-1">
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="text-xs xs:text-sm">
                        {category === 'Все категории' ? 'Все категории' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-9 xs:h-10 px-2 xs:px-3 flex-shrink-0"
                    size="sm"
                  >
                    <X className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    <span className="hidden xs:inline ml-1.5">Сбросить</span>
                  </Button>
                )}
              </div>
              
              {/* Results Count */}
              {filteredOrders.length > 0 && (
                <div className="text-center pt-1">
                  <span className="text-steel-400 text-xs xs:text-sm">
                    Найдено {filteredOrders.length} {filteredOrders.length === 1 ? 'заказ' : filteredOrders.length < 5 ? 'заказа' : 'заказов'}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <Card className="card-steel p-4 xs:p-6 sm:p-8 text-center">
              <div className="space-y-3 xs:space-y-4">
                <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-steel-600/20 rounded-full flex items-center justify-center mx-auto">
                  <HelpCircle className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-steel-400" />
                </div>
                <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-steel-100">Заказы не найдены</h3>
                <p className="text-xs xs:text-sm sm:text-base text-steel-300 max-w-md mx-auto">
                  {searchQuery || selectedCategory !== 'Все категории'
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Пока что заказчики не разместили заказы на работу'}
                </p>
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 justify-center mt-4 xs:mt-6">
                  <Link to="/create-order">
                    <Button className="bg-primary hover:bg-primary/80 w-full xs:w-auto h-9 xs:h-10 text-xs xs:text-sm">
                      <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
                      Разместить заказ
                    </Button>
                  </Link>
                  <Link to="/available-orders">
                    <Button variant="outline" className="w-full xs:w-auto h-9 xs:h-10 text-xs xs:text-sm">
                      <Calendar className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
                      Смотреть вакансии
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
              {filteredOrders.map((order) => {
                const client = profiles[order.client_id];
                return (
                  <Card 
                    key={order.id} 
                    className="card-steel border border-steel-600 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 flex flex-col h-[420px]"
                  >
                    <div className="p-6 flex flex-col h-full">
                      {/* Header - Fixed Height */}
                      <div className="flex items-start justify-between mb-4 min-h-[32px]">
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            Доступен
                          </Badge>
                          <Badge className={`${getPriorityColor(order.priority)} text-xs`}>
                            {order.priority === 'urgent' ? 'Срочно' :
                             order.priority === 'high' ? 'Высокий' :
                             order.priority === 'low' ? 'Низкий' : 'Обычный'}
                          </Badge>
                        </div>
                        <span className="text-xs text-steel-400 whitespace-nowrap ml-2">
                          {format(new Date(order.created_at), 'dd MMM', { locale: ru })}
                        </span>
                      </div>

                      {/* Title - Fixed Height */}
                      <h3 className="text-lg font-bold text-steel-100 line-clamp-2 mb-3 min-h-[56px]">
                        {order.title}
                      </h3>

                      {/* Description - Fixed Height */}
                      <p className="text-steel-300 text-sm line-clamp-3 mb-4 min-h-[60px]">
                        {order.description || 'Описание не указано'}
                      </p>

                      {/* Service Info - Fixed Height */}
                      <div className="space-y-2 mb-4 min-h-[60px]">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 text-steel-400">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{order.category || 'Не указано'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-lg">
                            {order.service_type === 'compressor_rent' && <span title="Аренда компрессора">🔨</span>}
                            {order.service_type === 'garbage_removal' && <span title="Вывоз мусора">🚛</span>}
                            {order.service_type === 'complex_service' && <span title="Комплексная услуга">🧩</span>}
                            {(!order.service_type || order.service_type === 'workers') && <span title="Работники">👷</span>}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-steel-400">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client?.display_name || client?.full_name || 'Аноним'}</span>
                        </div>

                        {order.deadline && (
                          <div className="flex items-center space-x-2 text-sm text-steel-400">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>До: {format(new Date(order.deadline), 'dd MMM yyyy', { locale: ru })}</span>
                          </div>
                        )}
                      </div>

                      {/* Spacer to push bottom content down */}
                      <div className="flex-1"></div>

                      {/* Price and Actions - Fixed at Bottom */}
                      <div className="pt-4 border-t border-steel-600/50">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-xl font-bold text-steel-100 whitespace-nowrap">
                              {order.price.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(order)}
                            className="flex-1 hover:bg-steel-700/50"
                          >
                            <Info className="w-4 h-4 mr-1" />
                            Подробнее
                          </Button>
                          {user && (
                            <Button 
                              size="sm" 
                              className="flex-1 bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20"
                              onClick={() => handleBidClick(order)}
                            >
                              <Send className="w-4 h-4 mr-1" />
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