import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, CheckCircle, XCircle, Flag, Clock, RefreshCw, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface ModerationItem {
  id: string;
  type: 'ad' | 'review' | 'message' | 'order';
  content: string;
  title?: string;
  author_id: string;
  author_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reports_count?: number;
  auto_flagged?: boolean;
  flagged_reasons?: string[];
}

export const ContentModerationQueue = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchModerationQueue = async () => {
    try {
      setLoading(true);
      
      // Получаем объявления на модерации
      const { data: ads } = await supabase
        .from('ads')
        .select('id, title, description, status, created_at, user_id')
        .in('status', ['active', 'inactive'])
        .eq('is_reported', true)
        .order('created_at', { ascending: false });

      // Получаем отзывы на модерации
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, comment, rating, created_at, author_id, is_reported')
        .eq('is_moderated', false)
        .order('created_at', { ascending: false });

      // Получаем сообщения с жалобами
      const { data: reportedMessages } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('is_reported', true)
        .order('created_at', { ascending: false });

      const moderationItems: ModerationItem[] = [];

      // Добавляем объявления
      ads?.forEach(ad => {
        moderationItems.push({
          id: ad.id,
          type: 'ad',
          content: ad.description || '',
          title: ad.title,
          author_id: ad.user_id,
          author_name: 'Пользователь',
          status: 'pending',
          created_at: ad.created_at,
          priority: 'normal',
          auto_flagged: false
        });
      });

      // Добавляем отзывы
      reviews?.forEach(review => {
        moderationItems.push({
          id: review.id,
          type: 'review',
          content: review.comment || '',
          title: `Отзыв (${review.rating}/5)`,
          author_id: review.author_id,
          author_name: 'Пользователь',
          status: 'pending',
          created_at: review.created_at,
          priority: review.is_reported ? 'high' : 'normal',
          reports_count: review.is_reported ? 1 : 0,
          auto_flagged: review.is_reported
        });
      });

      // Добавляем сообщения с жалобами
      reportedMessages?.forEach(message => {
        moderationItems.push({
          id: message.id,
          type: 'message',
          content: message.content || '',
          title: 'Сообщение с жалобой',
          author_id: message.sender_id,
          author_name: 'Пользователь',
          status: 'pending',
          created_at: message.created_at,
          priority: 'high',
          reports_count: 1,
          auto_flagged: true,
          flagged_reasons: ['user_report']
        });
      });

      // Сортируем по приоритету и времени
      moderationItems.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setItems(moderationItems);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить очередь модерации",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationQueue();
  }, []);

  const handleModeration = async () => {
    if (!selectedItem || !moderationAction) return;

    try {
      let updateData: any = {};
      let logAction = '';

      if (selectedItem.type === 'ad') {
        updateData = { 
          status: moderationAction === 'approve' ? 'active' : 'rejected'
        };
        logAction = `${moderationAction === 'approve' ? 'approved' : 'rejected'}_ad`;
        
        const { error } = await supabase
          .from('ads')
          .update(updateData)
          .eq('id', selectedItem.id);

        if (error) throw error;
      } else if (selectedItem.type === 'review') {
        updateData = { 
          is_moderated: moderationAction === 'reject',
          admin_comment: moderationNote || null
        };
        logAction = `${moderationAction === 'approve' ? 'approved' : 'rejected'}_review`;
        
        const { error } = await supabase
          .from('reviews')
          .update(updateData)
          .eq('id', selectedItem.id);

        if (error) throw error;
      } else if (selectedItem.type === 'message') {
        updateData = { 
          is_deleted: moderationAction === 'reject'
        };
        logAction = `${moderationAction === 'approve' ? 'approved' : 'deleted'}_message`;
        
        const { error } = await supabase
          .from('messages')
          .update(updateData)
          .eq('id', selectedItem.id);

        if (error) throw error;
      }

      // Логируем действие
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          user_id: user.id,
          action: logAction,
          target_type: selectedItem.type,
          target_id: selectedItem.id
        });
      }

      // Логируем в security_logs
      await supabase.rpc('log_security_event', {
        p_event_type: 'content_moderation',
        p_details: {
          action: moderationAction,
          content_type: selectedItem.type,
          content_id: selectedItem.id,
          note: moderationNote
        },
        p_severity: 'info'
      });

      toast({
        title: "Успешно",
        description: `Контент ${moderationAction === 'approve' ? 'одобрен' : 'отклонён'}`,
      });

      setSelectedItem(null);
      setModerationAction(null);
      setModerationNote('');
      fetchModerationQueue();
    } catch (error) {
      console.error('Error moderating content:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить модерацию",
        variant: "destructive"
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ad': return '📢';
      case 'review': return '⭐';
      case 'message': return '💬';
      case 'order': return '📋';
      default: return '📄';
    }
  };

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    urgent: items.filter(i => i.priority === 'urgent').length,
    reported: items.filter(i => i.reports_count && i.reports_count > 0).length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Загрузка очереди модерации...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Всего в очереди</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ожидает модерации</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Срочные</p>
                <p className="text-2xl font-bold">{stats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">С жалобами</p>
                <p className="text-2xl font-bold">{stats.reported}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основная карточка */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Очередь модерации контента
            </CardTitle>
            <Button onClick={fetchModerationQueue} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Фильтры */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по содержимому, названию, автору..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">В ожидании</SelectItem>
                <SelectItem value="approved">Одобрено</SelectItem>
                <SelectItem value="rejected">Отклонено</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="ad">Объявления</SelectItem>
                <SelectItem value="review">Отзывы</SelectItem>
                <SelectItem value="message">Сообщения</SelectItem>
                <SelectItem value="order">Заказы</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                <SelectItem value="urgent">Срочный</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="normal">Обычный</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Список элементов */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Нет элементов для модерации</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        {item.auto_flagged && (
                          <Badge variant="destructive">
                            <Flag className="w-3 h-3 mr-1" />
                            Авто-флаг
                          </Badge>
                        )}
                        {item.reports_count && item.reports_count > 0 && (
                          <Badge variant="outline">
                            {item.reports_count} жалоб
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Автор: {item.author_name}</span>
                        <span>
                          {formatDistanceToNow(new Date(item.created_at), { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Просмотр
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setModerationAction('approve');
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Одобрить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Одобрить контент</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите одобрить этот контент?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleModeration}>
                              Одобрить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setModerationAction('reject');
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Отклонить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Отклонить контент</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите отклонить этот контент?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Причина отклонения (необязательно):
                            </label>
                            <Textarea
                              value={moderationNote}
                              onChange={(e) => setModerationNote(e.target.value)}
                              placeholder="Укажите причину отклонения..."
                              rows={3}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleModeration}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Отклонить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};