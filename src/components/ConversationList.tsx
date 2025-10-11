import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Search, 
  Users, 
  Clock,
  Pin,
  Archive,
  MoreVertical,
  Trash2,
  X
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  priority?: string;
  category?: string;
}

interface Message {
  id: string;
  content: string | null;
  sender_id: string;
  message_type: string;
  file_name: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telegram_photo_url: string | null;
  role: string;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string | null;
  refreshTrigger?: number;
  onConversationDeleted?: () => void;
}

export const ConversationList = ({ 
  onSelectConversation, 
  selectedConversationId,
  refreshTrigger,
  onConversationDeleted 
}: ConversationListProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, Profile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'chats' | 'support'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id, refreshTrigger]);

  useEffect(() => {
    if (conversations.length > 0) {
      fetchLastMessages();
      fetchParticipantProfiles();
    }
  }, [conversations]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to conversation updates
    const channel = supabase
      .channel(`user-conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participants.cs.{${user.id}}`
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message & { conversation_id: string };
          setLastMessages(prev => ({
            ...prev,
            [newMessage.conversation_id]: newMessage
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const fetchLastMessages = async () => {
    if (conversations.length === 0) return;

    try {
      const conversationIds = conversations.map(c => c.id);
      
      // Get the latest message for each conversation
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, content, sender_id, message_type, file_name, created_at')
        .in('conversation_id', conversationIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation and take the latest one
      const latestMessages: Record<string, Message> = {};
      data?.forEach(message => {
        if (!latestMessages[message.conversation_id]) {
          latestMessages[message.conversation_id] = message;
        }
      });

      setLastMessages(latestMessages);
    } catch (error) {
      console.error('Error fetching last messages:', error);
    }
  };

  const fetchParticipantProfiles = async () => {
    if (conversations.length === 0) return;

    try {
      // Get all unique participant IDs
      const participantIds = Array.from(
        new Set(conversations.flatMap(c => c.participants))
      ).filter(id => id !== user?.id);

      if (participantIds.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, avatar_url, telegram_photo_url, role')
        .in('id', participantIds);

      if (error) throw error;

      const profilesMap: Record<string, Profile> = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      setParticipantProfiles(profilesMap);
    } catch (error) {
      console.error('Error fetching participant profiles:', error);
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    if (conversation.type === 'support') {
      return 'Техподдержка';
    }

    // For chat conversations, show other participant's name
    const otherParticipants = conversation.participants.filter(id => id !== user?.id);
    if (otherParticipants.length === 1) {
      const profile = participantProfiles[otherParticipants[0]];
      return profile?.display_name || profile?.full_name || 'Пользователь';
    }

    return `Групповой чат (${conversation.participants.length})`;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'support') {
      return null; // Will show support icon
    }

    const otherParticipants = conversation.participants.filter(id => id !== user?.id);
    if (otherParticipants.length === 1) {
      const profile = participantProfiles[otherParticipants[0]];
      return profile?.avatar_url || profile?.telegram_photo_url;
    }

    return null;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    const lastMessage = lastMessages[conversation.id];
    if (!lastMessage) return 'Нет сообщений';

    if (lastMessage.message_type === 'image') {
      return '📷 Изображение';
    } else if (lastMessage.message_type === 'file') {
      return `📎 ${lastMessage.file_name || 'Файл'}`;
    }

    return lastMessage.content || 'Сообщение';
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: ru });
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEEEEE', { locale: ru }); // Short day name
    } else {
      return format(date, 'dd.MM', { locale: ru });
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    // Filter by type
    if (filter === 'chats' && conversation.type !== 'chat') return false;
    if (filter === 'support' && conversation.type !== 'support') return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const title = getConversationTitle(conversation).toLowerCase();
      const lastMessage = getLastMessagePreview(conversation).toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return title.includes(query) || lastMessage.includes(query);
    }

    return true;
  });

  const deleteConversation = async (conversationId: string) => {
    if (!user?.id) return;
    
    try {
      // Получаем текущий разговор
      const { data: conv, error: fetchError } = await supabase
        .from('conversations')
        .select('deleted_by, participants')
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      // Добавляем текущего пользователя в список удаливших
      const currentDeletedBy = conv.deleted_by || [];
      const updatedDeletedBy = [...currentDeletedBy, user.id];

      const { error } = await supabase
        .from('conversations')
        .update({ 
          deleted_by: updatedDeletedBy,
          deleted_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      // Удаляем из локального состояния
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // Сбрасываем выделение если этот чат был выбран
      if (selectedConversationId === conversationId) {
        onSelectConversation('');
      }

      toast({
        title: "Успешно",
        description: "Чат удален. Если все участники удалят чат, он будет удален навсегда."
      });

      onConversationDeleted?.();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чат",
        variant: "destructive"
      });
    }
  };

  const clearAllConversations = async () => {
    if (!user?.id) return;

    try {
      const conversationIds = conversations.map(c => c.id);
      
      // Для каждого чата добавляем пользователя в deleted_by
      const updates = conversationIds.map(async (id) => {
        const { data: conv } = await supabase
          .from('conversations')
          .select('deleted_by')
          .eq('id', id)
          .single();

        const currentDeletedBy = conv?.deleted_by || [];
        const updatedDeletedBy = [...currentDeletedBy, user.id];

        return supabase
          .from('conversations')
          .update({ 
            deleted_by: updatedDeletedBy,
            deleted_at: new Date().toISOString()
          })
          .eq('id', id);
      });

      await Promise.all(updates);

      // Очищаем локальное состояние
      setConversations([]);
      setLastMessages({});
      
      // Сбрасываем выделение
      onSelectConversation('');

      toast({
        title: "Успешно",
        description: "Все чаты удалены"
      });

      onConversationDeleted?.();
    } catch (error) {
      console.error('Error clearing conversations:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить чаты",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="card-steel p-6">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-steel-300">Загрузка чатов...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-steel h-full flex flex-col">
      <div className="p-4 border-b border-steel-600 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-steel-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск чатов..."
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilter('all')}
            className="flex-1"
          >
            Все
          </Button>
          <Button
            size="sm"
            variant={filter === 'chats' ? 'default' : 'ghost'}
            onClick={() => setFilter('chats')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-1" />
            Чаты
          </Button>
          <Button
            size="sm"
            variant={filter === 'support' ? 'default' : 'ghost'}
            onClick={() => setFilter('support')}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Поддержка
          </Button>
        </div>

        {/* Clear All Button */}
        {conversations.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Очистить все чаты
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Очистить все чаты?</AlertDialogTitle>
                <AlertDialogDescription>
                  Все чаты будут удалены. Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={clearAllConversations}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Удалить все
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-16 h-16 text-steel-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-steel-300 mb-2">
              {searchQuery ? 'Ничего не найдено' : 'Нет чатов'}
            </h3>
            <p className="text-steel-400">
              {searchQuery 
                ? 'Попробуйте изменить запрос'
                : 'Начните общение с другими пользователями'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`p-3 cursor-pointer transition-colors duration-200 ${
                  selectedConversationId === conversation.id
                    ? 'bg-primary/10 border-primary/20'
                    : 'hover:bg-steel-700/30 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div 
                    className="relative shrink-0"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    {conversation.type === 'support' ? (
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                    ) : (
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={getConversationAvatar(conversation) || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600">
                          {getConversationTitle(conversation).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {/* Content */}
                  <div 
                    className="flex-1 min-w-0 space-y-1"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-steel-100 truncate">
                        {getConversationTitle(conversation)}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {conversation.priority === 'high' && (
                          <Pin className="w-3 h-3 text-red-400" />
                        )}
                        <span className="text-xs text-steel-400">
                          {getTimeAgo(conversation.last_message_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-steel-400 truncate">
                        {getLastMessagePreview(conversation)}
                      </p>
                      
                      <div className="flex items-center space-x-1">
                        {conversation.type === 'support' && (
                          <Badge variant="outline" className="text-xs text-primary border-primary/20">
                            Поддержка
                          </Badge>
                        )}
                        {conversation.priority === 'high' && (
                          <Badge variant="outline" className="text-xs text-red-400 border-red-400/20">
                            Срочно
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить чат
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить чат?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Чат "{getConversationTitle(conversation)}" будет удален. Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteConversation(conversation.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};