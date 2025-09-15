import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupportSystem } from '@/components/SupportSystem';
import { ChatInterface } from '@/components/ChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import { 
  MessageSquare, 
  Plus, 
  Users, 
  Bell,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Conversation {
  id: string;
  type: string;
  title: string | null;
  participants: string[];
  status: string;
  last_message_at: string;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  conversation_id: string | null;
  is_read: boolean;
  created_at: string;
}

export default function ChatSystem() {
  const { user, userRole, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id])
        .eq('status', 'active')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить чаты",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const notifications = data || [];
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.content || undefined
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const startNewChat = async (targetUserId: string) => {
    if (!user?.id) return;

    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'chat')
        .contains('participants', [user.id, targetUserId])
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingConversation) {
        setSelectedConversation(existingConversation.id);
        return;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'chat',
          participants: [user.id, targetUserId],
          created_by: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;

      setSelectedConversation(newConversation.id);
      fetchConversations();
    } catch (error) {
      console.error('Error starting new chat:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать чат",
        variant: "destructive"
      });
    }
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
            <MessageSquare className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Требуется авторизация</h2>
            <p className="text-steel-300">Для доступа к чатам необходимо войти в систему</p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (selectedConversation) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setSelectedConversation(null)}
              >
                ← Назад
              </Button>
              <h1 className="text-3xl font-bold text-glow">Чат</h1>
            </div>
            
            <ChatInterface
              conversationId={selectedConversation}
              onClose={() => setSelectedConversation(null)}
            />
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
          <div className="flex items-center justify-between">
            <BackButton onClick={() => window.history.back()} />
            <h1 className="text-3xl font-bold text-glow">Чаты и поддержка</h1>
            <div className="relative">
              <Bell className="w-6 h-6 text-steel-300" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 px-1 min-w-[1.2rem] h-5 text-xs bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="support" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="support" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Поддержка</span>
              </TabsTrigger>
              <TabsTrigger value="chats" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Чаты</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Уведомления</span>
                {unreadCount > 0 && (
                  <Badge className="ml-1 px-1 min-w-[1rem] h-4 text-xs bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Support Tab */}
            <TabsContent value="support">
              <SupportSystem />
            </TabsContent>

            {/* Chats Tab */}
            <TabsContent value="chats" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-steel-100">Мои чаты</h2>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Новый чат
                </Button>
              </div>

              {isLoading ? (
                <Card className="card-steel p-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-steel-300">Загрузка чатов...</p>
                </Card>
              ) : conversations.length === 0 ? (
                <Card className="card-steel p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-steel-300 mb-2">Нет активных чатов</h3>
                  <p className="text-steel-400">Начните общение с другими пользователями</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conversation) => (
                    <Card 
                      key={conversation.id} 
                      className="card-steel p-4 hover:bg-steel-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium text-steel-100">
                            {conversation.title || 
                             (conversation.type === 'support' ? 'Техподдержка' : 'Чат')}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-steel-400">
                            <span>Участников: {conversation.participants.length}</span>
                            <span>•</span>
                            <span>{format(new Date(conversation.last_message_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {conversation.type === 'support' && (
                            <Badge variant="outline" className="text-primary border-primary/20">
                              Поддержка
                            </Badge>
                          )}
                          <Button variant="outline" size="sm">
                            Открыть
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <h2 className="text-xl font-bold text-steel-100">Уведомления</h2>

              {notifications.length === 0 ? (
                <Card className="card-steel p-8 text-center">
                  <Bell className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-steel-300 mb-2">Нет уведомлений</h3>
                  <p className="text-steel-400">Здесь будут отображаться ваши уведомления</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card 
                      key={notification.id}
                      className={`card-steel p-4 cursor-pointer transition-colors ${
                        !notification.is_read ? 'border-primary/20 bg-primary/5' : 'hover:bg-steel-800/50'
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markNotificationAsRead(notification.id);
                        }
                        if (notification.conversation_id) {
                          setSelectedConversation(notification.conversation_id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-steel-100">{notification.title}</h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          {notification.content && (
                            <p className="text-steel-300 text-sm">{notification.content}</p>
                          )}
                          <p className="text-xs text-steel-400">
                            {format(new Date(notification.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}