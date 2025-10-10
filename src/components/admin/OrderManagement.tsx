import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Search, Clock, DollarSign, User, Edit, Trash2, RefreshCw, Eye, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorHandler';
import { formatRubles } from '@/utils/currency';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ExecutorSelectionModal } from '@/components/ExecutorSelectionModal';

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
  admin_priority_override?: string;
  category?: string;
  people_needed?: number;
  people_accepted?: number;
  order_number: string;
  client_profile?: {
    phone: string;
    display_name: string;
    full_name?: string;
  };
  executor_profile?: {
    phone: string;
    display_name: string;
    full_name?: string;
  };
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignExecutorModalOpen, setAssignExecutorModalOpen] = useState(false);
  const { toast } = useToast();

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    priority: '',
    status: '',
    admin_priority_override: ''
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Получаем заказы без JOIN, затем отдельно профили
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Получаем уникальные client_id и executor_id для загрузки профилей
      const clientIds = [...new Set(ordersData?.map(order => order.client_id).filter(Boolean))];
      const executorIds = [...new Set(ordersData?.map(order => order.executor_id).filter(Boolean))];
      const allUserIds = [...new Set([...clientIds, ...executorIds])];
      
      let profilesMap = new Map();
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, phone, display_name, full_name')
          .in('id', allUserIds);

        if (!profilesError && profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // Объединяем данные
      const ordersWithProfiles = ordersData?.map(order => ({
        ...order,
        client_profile: profilesMap.get(order.client_id) || null,
        executor_profile: order.executor_id ? profilesMap.get(order.executor_id) || null : null
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

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      title: order.title,
      description: order.description || '',
      price: order.price.toString(),
      priority: order.priority,
      status: order.status,
      admin_priority_override: order.admin_priority_override || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          title: editForm.title,
          description: editForm.description,
          price: parseFloat(editForm.price),
          priority: editForm.priority,
          status: editForm.status,
          admin_priority_override: editForm.admin_priority_override || null,
          admin_modified_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Заказ обновлен",
        description: "Изменения успешно сохранены"
      });

      setEditModalOpen(false);
      fetchOrders();
    } catch (error) {
      handleError(error, { component: 'OrderManagement', action: 'handleSaveEdit' });
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ",
        variant: "destructive"
      });
    }
  };

  const handleExtendExpiration = async (orderId: string) => {
    try {
      const { error } = await supabase.rpc('extend_order_expiration', {
        order_id: orderId
      });

      if (error) throw error;

      toast({
        title: "Срок продлен",
        description: "Срок действия заказа продлен на 24 часа"
      });

      fetchOrders();
    } catch (error) {
      handleError(error, { component: 'OrderManagement', action: 'handleExtendExpiration' });
      toast({
        title: "Ошибка",
        description: "Не удалось продлить срок",
        variant: "destructive"
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Заказ удален",
        description: "Заказ успешно удален из системы"
      });

      fetchOrders();
    } catch (error) {
      handleError(error, { component: 'OrderManagement', action: 'handleDeleteOrder' });
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ",
        variant: "destructive"
      });
    }
  };

  const handleAssignExecutor = (order: Order) => {
    setSelectedOrder(order);
    setAssignExecutorModalOpen(true);
  };

  const handleExecutorSelected = async (userId: string) => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          executor_id: userId,
          status: 'in_progress'
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Исполнитель назначен",
        description: "Заказ переведен в статус 'В работе'"
      });

      setAssignExecutorModalOpen(false);
      fetchOrders();
    } catch (error) {
      handleError(error, { component: 'OrderManagement', action: 'handleExecutorSelected' });
      toast({
        title: "Ошибка",
        description: "Не удалось назначить исполнителя",
        variant: "destructive"
      });
    }
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Статус изменен",
        description: `Статус заказа изменен на "${getStatusLabel(newStatus)}"`
      });

      fetchOrders();
    } catch (error) {
      handleError(error, { component: 'OrderManagement', action: 'handleQuickStatusChange' });
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус",
        variant: "destructive"
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      case 'inactive': return 'Неактивен';
      default: return status;
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
                
                <div className="flex items-center justify-between text-sm text-steel-400 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>
                        {order.client_profile?.display_name || order.client_profile?.phone || 'Неизвестен'}
                      </span>
                    </div>
                    {order.executor_profile && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>
                          {order.executor_profile.display_name || order.executor_profile.phone}
                        </span>
                      </div>
                    )}
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

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-steel-700">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditOrder(order)}
                    className="gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Редактировать
                  </Button>

                  {order.status === 'pending' && !order.executor_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignExecutor(order)}
                      className="gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Назначить
                    </Button>
                  )}

                  {order.is_expired && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExtendExpiration(order.id)}
                      className="gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Продлить
                    </Button>
                  )}

                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusChange(order.id, 'in_progress')}
                      className="gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      В работу
                    </Button>
                  )}

                  {order.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusChange(order.id, 'completed')}
                      className="gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Завершить
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </Button>
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

      {/* Edit Order Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать заказ</DialogTitle>
            <DialogDescription>
              Измените параметры заказа и сохраните изменения
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Описание</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Цена (₽)</Label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>

              <div>
                <Label>Статус</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="completed">Завершен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Базовый приоритет</Label>
                <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Админский приоритет (переопределение)</Label>
                <Select 
                  value={editForm.admin_priority_override || 'none'} 
                  onValueChange={(value) => setEditForm({ ...editForm, admin_priority_override: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Без переопределения" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без переопределения</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveEdit}>
                Сохранить изменения
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Executor Modal */}
      {selectedOrder && (
        <ExecutorSelectionModal
          isOpen={assignExecutorModalOpen}
          onClose={() => setAssignExecutorModalOpen(false)}
          onSelectExecutor={handleExecutorSelected}
          title="Назначить исполнителя"
        />
      )}
    </Card>
  );
};