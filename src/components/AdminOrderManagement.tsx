import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Star, AlertTriangle, Settings, Edit, Trash2, DollarSign } from 'lucide-react';
import { getOrderTimeRemaining, getPriorityColor, getPriorityText } from '@/hooks/useOrderSorting';
import { formatRubles } from '@/utils/currency';

interface Order {
  id: string;
  title: string;
  description: string;
  priority: string;
  admin_priority_override?: string;
  admin_modified_by?: string;
  admin_modified_at?: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  status: string;
  price: number;
  client_id: string;
  category: string;
  start_time?: string;
  people_needed: number;
  people_accepted: number;
  order_number: string;
}

interface AdminOrderManagementProps {
  orders: Order[];
  onOrderUpdate: () => void;
}

export const AdminOrderManagement: React.FC<AdminOrderManagementProps> = ({ 
  orders, 
  onOrderUpdate 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [priorityCosts, setPriorityCosts] = useState({ normal: 15, high: 35, urgent: 55 });
  const [editingCosts, setEditingCosts] = useState({ normal: 15, high: 35, urgent: 55 });
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    category: '',
    price: '',
    people_needed: '1',
    start_time: '',
    admin_priority_override: 'none'
  });

  useEffect(() => {
    loadPriorityCosts();
  }, []);

  const loadPriorityCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'priority_costs')
        .single();

      if (error) throw error;
      if (data?.setting_value) {
        const costs = data.setting_value as any;
        setPriorityCosts(costs);
        setEditingCosts(costs);
      }
    } catch (error) {
      console.error('Error loading priority costs:', error);
    }
  };

  const updatePriorityCosts = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: editingCosts,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'priority_costs');

      if (error) throw error;

      setPriorityCosts(editingCosts);
      setIsPriceModalOpen(false);
      toast({
        title: "Цены обновлены",
        description: "Стоимость приоритетов успешно изменена"
      });
    } catch (error) {
      console.error('Error updating priority costs:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить стоимость приоритетов",
        variant: "destructive"
      });
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditData({
      title: order.title,
      description: order.description,
      priority: order.priority,
      category: order.category,
      price: order.price.toString(),
      people_needed: order.people_needed.toString(),
      start_time: order.start_time || '',
      admin_priority_override: order.admin_priority_override || 'none'
    });
    setIsEditModalOpen(true);
  };

  const saveOrderChanges = async () => {
    if (!selectedOrder || !user?.id) return;

    try {
      const updateData: any = {
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        category: editData.category,
        price: parseFloat(editData.price),
        people_needed: parseInt(editData.people_needed),
        start_time: editData.start_time || null,
        admin_modified_by: user.id,
        admin_modified_at: new Date().toISOString()
      };

      // Добавляем админский приоритет, если он отличается от обычного и не равен "none"
      if (editData.admin_priority_override && editData.admin_priority_override !== 'none' && editData.admin_priority_override !== editData.priority) {
        updateData.admin_priority_override = editData.admin_priority_override;
      } else {
        updateData.admin_priority_override = null;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Заказ обновлен",
        description: "Изменения успешно сохранены"
      });

      setIsEditModalOpen(false);
      onOrderUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ",
        variant: "destructive"
      });
    }
  };

  const extendOrderExpiration = async (orderId: string) => {
    try {
      const { error } = await supabase.rpc('extend_order_expiration', {
        order_id: orderId
      });

      if (error) throw error;

      toast({
        title: "Срок продлен",
        description: "Заказ активен еще 24 часа"
      });

      onOrderUpdate();
    } catch (error) {
      console.error('Error extending order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось продлить срок заказа",
        variant: "destructive"
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Заказ удален",
        description: "Заказ успешно удален"
      });

      onOrderUpdate();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Управление ценами на приоритеты */}
      <Card className="card-steel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-steel-100 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span>Стоимость приоритетов</span>
          </h3>
          <Dialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Изменить цены
              </Button>
            </DialogTrigger>
            <DialogContent className="card-steel-dialog">
              <DialogHeader>
                <DialogTitle>Настройка стоимости приоритетов</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Обычный приоритет (GT)</Label>
                  <Input
                    type="number"
                    value={editingCosts.normal}
                    onChange={(e) => setEditingCosts(prev => ({ ...prev, normal: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Высокий приоритет (GT)</Label>
                  <Input
                    type="number"
                    value={editingCosts.high}
                    onChange={(e) => setEditingCosts(prev => ({ ...prev, high: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Срочный приоритет (GT)</Label>
                  <Input
                    type="number"
                    value={editingCosts.urgent}
                    onChange={(e) => setEditingCosts(prev => ({ ...prev, urgent: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <Button onClick={updatePriorityCosts} className="w-full">
                  Сохранить изменения
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-green-400 font-bold">{priorityCosts.normal} GT</div>
            <div className="text-sm text-steel-300">Обычный</div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-yellow-400 font-bold">{priorityCosts.high} GT</div>
            <div className="text-sm text-steel-300">Высокий</div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-red-400 font-bold">{priorityCosts.urgent} GT</div>
            <div className="text-sm text-steel-300">Срочно</div>
          </div>
        </div>
      </Card>

      {/* Список заказов */}
      <div className="space-y-4">
        {orders.map((order) => {
          const timeRemaining = getOrderTimeRemaining(order.expires_at);
          const displayPriority = order.admin_priority_override || order.priority;
          
          return (
            <Card key={order.id} className="card-steel p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-steel-100">{order.title}</h3>
                    <Badge className={getPriorityColor(displayPriority)}>
                      {getPriorityText(displayPriority)}
                      {order.admin_priority_override && <Star className="w-3 h-3 ml-1" />}
                    </Badge>
                    <Badge variant="outline" className="text-steel-300">
                      {order.order_number}
                    </Badge>
                  </div>
                  
                  <p className="text-steel-300 mb-3 line-clamp-2">{order.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-steel-400">
                    <span>{formatRubles(order.price)}</span>
                    <span>Нужно: {order.people_accepted}/{order.people_needed} чел.</span>
                    <span className="capitalize">{order.category}</span>
                    {order.start_time && <span>Начало: {order.start_time}</span>}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    {timeRemaining.expired ? (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Истек</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center space-x-1 text-steel-300">
                        <Clock className="w-3 h-3" />
                        <span>{timeRemaining.hours}ч {timeRemaining.minutes}м</span>
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-steel-300">
                      {order.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditOrder(order)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {order.is_expired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => extendOrderExpiration(order.id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteOrder(order.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Модал редактирования заказа */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="card-steel-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать заказ</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Название заказа</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Описание</Label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Категория</Label>
                <Input
                  value={editData.category}
                  onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Цена (₽)</Label>
                <Input
                  type="number"
                  value={editData.price}
                  onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Приоритет</Label>
                <Select
                  value={editData.priority}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Админский приоритет</Label>
                <Select
                  value={editData.admin_priority_override}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, admin_priority_override: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Не задан" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не задан</SelectItem>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Нужно людей</Label>
                <Input
                  type="number"
                  min="1"
                  value={editData.people_needed}
                  onChange={(e) => setEditData(prev => ({ ...prev, people_needed: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Время начала</Label>
                <Input
                  type="time"
                  value={editData.start_time}
                  onChange={(e) => setEditData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={saveOrderChanges}>
                Сохранить изменения
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};