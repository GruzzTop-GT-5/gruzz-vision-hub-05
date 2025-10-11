import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  Eye,
  Archive,
  RefreshCw,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DeletedConversation {
  id: string;
  type: string;
  title: string | null;
  participants: string[];
  deleted_by: string[];
  deleted_at: string | null;
  permanently_deleted: boolean;
  permanently_deleted_by: string | null;
  permanently_deleted_at: string | null;
  created_at: string;
  last_message_at: string;
}

export const DeletedConversationsManager = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<DeletedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<DeletedConversation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    fetchDeletedConversations();
  }, []);

  const fetchDeletedConversations = async () => {
    setLoading(true);
    try {
      // Получаем все чаты, где deleted_by не пустой или permanently_deleted = true
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or('deleted_by.neq.{},permanently_deleted.eq.true')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching deleted conversations:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить удаленные чаты",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const permanentlyDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('conversations')
        .update({
          permanently_deleted: true,
          permanently_deleted_by: user.id,
          permanently_deleted_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Чат помечен как полностью удаленный. Доказательства сохранены."
      });

      fetchDeletedConversations();
      setShowDeleteDialog(false);
      setSelectedConversation(null);
    } catch (error) {
      console.error('Error permanently deleting conversation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чат",
        variant: "destructive"
      });
    }
  };

  const restoreConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          deleted_by: [],
          deleted_at: null,
          permanently_deleted: false,
          permanently_deleted_by: null,
          permanently_deleted_at: null
        })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Чат восстановлен"
      });

      fetchDeletedConversations();
      setShowRestoreDialog(false);
      setSelectedConversation(null);
    } catch (error) {
      console.error('Error restoring conversation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить чат",
        variant: "destructive"
      });
    }
  };

  const viewConversationMessages = (conversation: DeletedConversation) => {
    // Блокируем просмотр полностью удалённых чатов
    if (conversation.permanently_deleted) {
      toast({
        title: "Недоступно",
        description: "Полностью удалённые чаты нельзя просмотреть",
        variant: "destructive"
      });
      return;
    }
    // Navigate to chat with this conversation
    window.location.href = `/chat-system?conversation=${conversation.id}`;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const title = conv.title?.toLowerCase() || '';
    const id = conv.id.toLowerCase();
    
    return title.includes(query) || id.includes(query);
  });

  if (loading) {
    return (
      <Card className="card-steel p-6">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-steel-300">Загрузка...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="card-steel p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-steel-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или ID..."
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchDeletedConversations}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </Button>
        </div>
      </Card>

      <Card className="card-steel">
        <ScrollArea className="h-[600px]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <Archive className="w-16 h-16 text-steel-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-steel-300 mb-2">
                Нет удаленных чатов
              </h3>
              <p className="text-steel-400">
                Удаленные чаты будут отображаться здесь
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="card-steel-lighter p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-steel-100">
                          {conversation.title || `Чат ${conversation.id.substring(0, 8)}`}
                        </h3>
                        <Badge 
                          variant={conversation.type === 'support' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {conversation.type === 'support' ? 'Поддержка' : 'Чат'}
                        </Badge>
                        {conversation.permanently_deleted && (
                          <Badge variant="destructive" className="text-xs">
                            Полностью удален
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-steel-400">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Участников: {conversation.participants.length}</span>
                        </div>
                        <div>
                          Удалили: {conversation.deleted_by?.length || 0} из {conversation.participants.length}
                        </div>
                        {conversation.deleted_at && (
                          <div>
                            Удален: {format(new Date(conversation.deleted_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </div>
                        )}
                        {conversation.permanently_deleted_at && (
                          <div className="text-red-400">
                            Полное удаление: {format(new Date(conversation.permanently_deleted_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewConversationMessages(conversation)}
                        className="flex items-center gap-2"
                        disabled={conversation.permanently_deleted}
                      >
                        <Eye className="w-4 h-4" />
                        Просмотр
                      </Button>

                      {!conversation.permanently_deleted && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setShowRestoreDialog(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Восстановить
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setShowDeleteDialog(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить навсегда
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Пометить чат как удаленный навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              Чат будет помечен как полностью удаленный, но все сообщения останутся в базе данных как доказательства.
              Пользователи не смогут его восстановить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={permanentlyDeleteConversation}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить навсегда
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Восстановить чат?</AlertDialogTitle>
            <AlertDialogDescription>
              Чат будет восстановлен для всех участников.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={restoreConversation}>
              Восстановить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
