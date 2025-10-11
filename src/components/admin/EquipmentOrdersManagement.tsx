import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Phone, Calendar, Clock, MapPin, Coins, Wrench, MessageSquare, Send, ChevronDown, ChevronUp, User } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EquipmentOrder {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  last_message_at: string;
  status: string;
  creator_profile: {
    display_name: string;
    phone: string;
    telegram_username: string;
    role: string;
  };
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_profile?: {
    display_name: string;
    role: string;
  };
}

export const EquipmentOrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<EquipmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  useEffect(() => {
    fetchEquipmentOrders();

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
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to equipment orders changes');
        }
        if (err) {
          console.error('Error subscribing to equipment orders:', err);
          toast({
            title: 'Ошибка подписки',
            description: 'Не удалось подключиться к обновлениям в реальном времени',
            variant: 'destructive'
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchMessages(selectedOrderId);
      subscribeToMessages(selectedOrderId);
    }
    return () => {
      if (selectedOrderId) {
        supabase.removeChannel(supabase.channel(`messages-${selectedOrderId}`));
      }
    };
  }, [selectedOrderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchEquipmentOrders = async () => {
    try {
      setLoading(true);

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, title, created_by, created_at, last_message_at, status')
        .eq('title', 'Аренда компрессора')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const creatorIds = conversations?.map(c => c.created_by) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, phone, telegram_username, role')
        .in('id', creatorIds);

      const ordersWithProfiles = conversations?.map(conv => ({
        ...conv,
        creator_profile: profiles?.find(p => p.id === conv.created_by) || {
          display_name: 'Неизвестный',
          phone: '',
          telegram_username: '',
          role: 'user'
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

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Получаем профили отправителей
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('id', senderIds);

      const messagesWithProfiles = messagesData?.map(msg => ({
        ...msg,
        sender_profile: profiles?.find(p => p.id === msg.sender_id) || {
          display_name: 'Система',
          role: 'system'
        }
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          try {
            const newMsg = payload.new as Message;
            
            // Получаем профиль отправителя
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('display_name, role')
              .eq('id', newMsg.sender_id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching sender profile:', error);
            }

            setMessages(prev => [...prev, {
              ...newMsg,
              sender_profile: profile || { display_name: 'Система', role: 'system' }
            }]);
          } catch (error) {
            console.error('Error processing new message:', error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to messages for conversation ${conversationId}`);
        }
        if (err) {
          console.error('Error subscribing to messages:', err);
          toast({
            title: 'Ошибка подписки',
            description: 'Не удалось подключиться к сообщениям в реальном времени',
            variant: 'destructive'
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (conversationId: string) => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          content: newMessage,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

      // Добавляем сообщение сразу в UI
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user?.id)
        .single();

      if (messageData) {
        setMessages(prev => [...prev, {
          ...messageData,
          sender_profile: profile || { display_name: 'Админ', role: userRole || 'admin' }
        }]);
      }

      setNewMessage('');
      
      // Создаем уведомление для пользователя
      await supabase
        .from('notifications')
        .insert({
          user_id: orders.find(o => o.id === conversationId)?.created_by,
          type: 'message',
          title: 'Новое сообщение от администрации',
          content: newMessage.substring(0, 100),
          conversation_id: conversationId,
          message_id: messageData.id
        });

      toast({
        title: 'Сообщение отправлено',
        description: 'Пользователь получит уведомление'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
      if (selectedOrderId === orderId) {
        setSelectedOrderId(null);
      }
    } else {
      newExpanded.add(orderId);
      setSelectedOrderId(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const extractOrderDetails = (content: string) => {
    const details: any = {};
    const dateMatch = content.match(/На какое время: (.+)/);
    if (dateMatch) details.datetime = dateMatch[1];
    const hoursMatch = content.match(/Время аренды: (\d+) ч/);
    if (hoursMatch) details.hours = hoursMatch[1];
    const locationMatch = content.match(/Локация: (.+)/);
    if (locationMatch) details.location = locationMatch[1];
    const priceMatch = content.match(/Итого к оплате: ([\d\s]+) ₽/);
    if (priceMatch) details.price = priceMatch[1];
    const paymentMatch = content.match(/Тип оплаты: (.+)/);
    if (paymentMatch) details.paymentType = paymentMatch[1];
    return details;
  };

  const renderMessage = (message: Message, orderCreatorId: string) => {
    // Проверяем, является ли отправитель обычным пользователем (не админ/система)
    const senderRole = message.sender_profile?.role || 'user';
    const isSystemOrAdmin = ['system_admin', 'admin', 'moderator', 'support'].includes(senderRole);
    
    // Сообщения от пользователя (заказчика) - справа
    // Сообщения от системы/администрации - слева
    const isUserMessage = message.sender_id === orderCreatorId && !isSystemOrAdmin;

    // Извлекаем детали если это структурированное сообщение
    const details = message.content.includes('Контакты для аренды') 
      ? extractOrderDetails(message.content) 
      : null;

    return (
      <div
        key={message.id}
        className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className={`max-w-[75%] ${isUserMessage ? 'order-1' : 'order-2'}`}>
          <div className="flex items-end gap-2 mb-1">
            {isSystemOrAdmin && (
              <Badge variant="outline" className="text-xs">
                {message.sender_profile?.role === 'system_admin' ? 'Администрация' : 
                 message.sender_profile?.role === 'admin' ? 'Админ' :
                 message.sender_profile?.role === 'support' ? 'Поддержка' : 'Система'}
              </Badge>
            )}
            <span className="text-xs text-steel-400">
              {format(new Date(message.created_at), 'HH:mm', { locale: ru })}
            </span>
          </div>

          <div
            className={`rounded-xl p-3 shadow-md ${
              isUserMessage
                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                : 'bg-gradient-to-br from-steel-700 to-steel-800 text-steel-50 border border-steel-600'
            }`}
          >
            {details ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold mb-2">📞 Контакты для аренды компрессора</p>
                {details.datetime && <p>🕐 На какое время: <strong>{details.datetime}</strong></p>}
                {details.hours && <p>⏱ Время аренды: <strong>{details.hours} ч</strong></p>}
                {details.location && <p>📍 Локация: <strong>{details.location}</strong></p>}
                {details.price && <p>💰 Итого: <strong>{details.price} ₽</strong></p>}
                {details.paymentType && <p>💳 Оплата: <strong>{details.paymentType}</strong></p>}
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
        </div>

        {isUserMessage && (
          <div className="w-8 h-8 ml-2 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            const firstMessage = messages.find(m => m.content.includes('Контакты для аренды'));
            const details = firstMessage ? extractOrderDetails(firstMessage.content) : {};

            return (
              <Card key={order.id} className="card-steel overflow-hidden">
                {/* Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-steel-700/20 transition-colors"
                  onClick={() => toggleOrderExpanded(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-steel-100 truncate">
                          {order.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-steel-400 mt-1">
                          <span>{order.creator_profile.display_name || 'Без имени'}</span>
                          {order.creator_profile.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.creator_profile.phone}
                            </span>
                          )}
                          {details.datetime && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {details.datetime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {order.status === 'active' ? 'Активен' : 'Неактивен'}
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-steel-400" /> : <ChevronDown className="w-5 h-5 text-steel-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded content with chat */}
                {isExpanded && selectedOrderId === order.id && (
                  <div className="border-t border-steel-600">
                    {/* Messages area */}
                    <div className="h-96 overflow-y-auto p-4 bg-steel-900/20">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-steel-400">
                          <p>Нет сообщений</p>
                        </div>
                      ) : (
                        <>
                          {messages.map(msg => renderMessage(msg, order.created_by))}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Input area */}
                    <div className="p-4 border-t border-steel-600 bg-steel-800/30">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(order.id)}
                          placeholder="Написать сообщение..."
                          className="flex-1"
                          disabled={isSending}
                        />
                        <Button
                          onClick={() => handleSendMessage(order.id)}
                          disabled={isSending || !newMessage.trim()}
                          size="icon"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
