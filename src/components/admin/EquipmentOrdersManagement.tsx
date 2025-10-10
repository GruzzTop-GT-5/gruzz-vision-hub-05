import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Truck, Phone, Calendar, Clock, MapPin, DollarSign, Wrench, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EquipmentOrder {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  last_message_at: string;
  status: string;
  messages: Array<{
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  }>;
  creator_profile: {
    display_name: string;
    phone: string;
    telegram_username: string;
  };
}

export const EquipmentOrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<EquipmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipmentOrders();

    // Подписываемся на изменения в conversations
    const channel = supabase
      .channel('equipment-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: 'title=eq.Аренда компрессора'
        },
        () => {
          fetchEquipmentOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEquipmentOrders = async () => {
    try {
      setLoading(true);

      // Получаем все conversations с title "Аренда компрессора"
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_by,
          created_at,
          last_message_at,
          status,
          messages (
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .eq('title', 'Аренда компрессора')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Получаем профили создателей
      const creatorIds = conversations?.map(c => c.created_by) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, phone, telegram_username')
        .in('id', creatorIds);

      const ordersWithProfiles = conversations?.map(conv => ({
        ...conv,
        creator_profile: profiles?.find(p => p.id === conv.created_by) || {
          display_name: 'Неизвестный',
          phone: '',
          telegram_username: ''
        }
      })) || [];

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching equipment orders:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказы спецтехники',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const extractOrderDetails = (content: string) => {
    const details: any = {};
    
    // Извлекаем дату и время
    const dateMatch = content.match(/На какое время: (.+)/);
    if (dateMatch) details.datetime = dateMatch[1];
    
    // Извлекаем время аренды
    const hoursMatch = content.match(/Время аренды: (\d+) ч/);
    if (hoursMatch) details.hours = hoursMatch[1];
    
    // Извлекаем локацию
    const locationMatch = content.match(/Локация: (.+)/);
    if (locationMatch) details.location = locationMatch[1];
    
    // Извлекаем стоимость
    const priceMatch = content.match(/Итого к оплате: ([\d\s]+) ₽/);
    if (priceMatch) details.price = priceMatch[1];
    
    // Извлекаем тип оплаты
    const paymentMatch = content.match(/Тип оплаты: (.+)/);
    if (paymentMatch) details.paymentType = paymentMatch[1];
    
    return details;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-steel-100">Заказы спецтехники</h2>
          <p className="text-steel-400 text-sm mt-1">
            Всего заказов: {orders.length}
          </p>
        </div>
        <Button onClick={fetchEquipmentOrders} variant="outline" size="sm">
          Обновить
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <Truck className="w-12 h-12 text-steel-600 mx-auto mb-3" />
          <p className="text-steel-400">Нет заказов спецтехники</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const lastMessage = order.messages?.[0];
            const details = lastMessage ? extractOrderDetails(lastMessage.content) : {};

            return (
              <Card key={order.id} className="card-steel p-6 hover:border-primary/30 transition-colors">
                <div className="space-y-4">
                  {/* Заголовок */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-steel-100">
                          {order.title}
                        </h3>
                        <p className="text-sm text-steel-400">
                          Создан: {new Date(order.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={order.status === 'active' ? 'default' : 'secondary'}>
                      {order.status === 'active' ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>

                  {/* Информация о заказчике */}
                  <div className="bg-steel-700/30 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-steel-200 mb-2">Заказчик:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-steel-300">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>{order.creator_profile.phone || 'Не указан'}</span>
                      </div>
                      {order.creator_profile.telegram_username && (
                        <div className="flex items-center gap-2 text-steel-300">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <span>@{order.creator_profile.telegram_username}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-steel-300">
                        <span className="font-medium">{order.creator_profile.display_name || 'Без имени'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Детали заказа */}
                  {Object.keys(details).length > 0 && (
                    <div className="bg-steel-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-steel-200 mb-3">Детали заказа:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {details.datetime && (
                          <div className="flex items-center gap-2 text-steel-300">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{details.datetime}</span>
                          </div>
                        )}
                        {details.hours && (
                          <div className="flex items-center gap-2 text-steel-300">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{details.hours} часов</span>
                          </div>
                        )}
                        {details.location && (
                          <div className="flex items-center gap-2 text-steel-300">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{details.location}</span>
                          </div>
                        )}
                        {details.price && (
                          <div className="flex items-center gap-2 text-steel-300">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span>{details.price} ₽</span>
                          </div>
                        )}
                        {details.paymentType && (
                          <div className="flex items-center gap-2 text-steel-300">
                            <Wrench className="w-4 h-4 text-primary" />
                            <span>{details.paymentType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Кнопка для перехода в чат */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => navigate('/chat-system')}
                      size="sm"
                      className="gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Открыть чат
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
