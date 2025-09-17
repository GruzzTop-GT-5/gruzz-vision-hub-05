import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Clock, DollarSign, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorHandler';
import { formatRubles } from '@/utils/currency';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Order {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  client_id: string;
  executor_id?: string;
  priority: string;
  client_profile?: {
    phone: string;
    display_name: string;
  };
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Получаем заказы без JOIN, затем отдельно профили
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Получаем уникальные client_id для загрузки профилей
      const clientIds = [...new Set(ordersData?.map(order => order.client_id).filter(Boolean))];
      
      let profilesMap = new Map();
      if (clientIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, phone, display_name')
          .in('id', clientIds);

        if (!profilesError && profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // Объединяем данные
      const ordersWithProfiles = ordersData?.map(order => ({
        ...order,
        client_profile: profilesMap.get(order.client_id) || null
      })) || [];

      setOrders(ordersWithProfiles);
    } catch (error) {
      handleError(error, { component: 'OrderManagement', action: 'fetchOrders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_profile?.phone?.includes(searchTerm) ||
      order.client_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Ожидает</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 text-white">В работе</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">Завершен</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Отменен</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500 text-white">Неактивен</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500 text-white">Срочно</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">Высокий</Badge>;
      case 'normal':
        return <Badge className="bg-blue-500 text-white">Обычный</Badge>;
      case 'low':
        return <Badge className="bg-gray-500 text-white">Низкий</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{priority}</Badge>;
    }
  };

  return (
    <Card className="card-steel p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-steel-100">Управление заказами</h3>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4" />
          <Input
            placeholder="Поиск по названию или клиенту..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="completed">Завершен</SelectItem>
            <SelectItem value="cancelled">Отменен</SelectItem>
            <SelectItem value="inactive">Неактивен</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-steel-800 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-steel-100">{order.title}</h4>
                      {getStatusBadge(order.status)}
                      {getPriorityBadge(order.priority)}
                    </div>
                    <p className="text-sm text-steel-400 mb-2 line-clamp-2">
                      {order.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-steel-100">
                      <DollarSign className="w-4 h-4" />
                      {formatRubles(order.price)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-steel-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>
                        {order.client_profile?.display_name || order.client_profile?.phone || 'Неизвестен'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                    </div>
                  </div>
                  
                  {order.is_expired && (
                    <Badge className="bg-red-500 text-white text-xs">
                      Просрочен
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {filteredOrders.length === 0 && !loading && (
              <div className="text-center py-8 text-steel-400">
                Заказы не найдены
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};