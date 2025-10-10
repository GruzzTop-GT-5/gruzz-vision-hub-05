import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Plus, 
  Send, 
  Users, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Trash2,
  Edit,
  Filter,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthContext } from '@/contexts/AuthContext';

interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  content: string;
  user_id?: string;
  is_read: boolean;
  created_at: string;
  conversation_id?: string;
  message_id?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'system' | 'marketing' | 'security';
  subject: string;
  content: string;
  target_audience: 'all' | 'admins' | 'users' | 'moderators';
  is_active: boolean;
  created_at: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  
  const [notificationForm, setNotificationForm] = useState({
    type: 'info' as const,
    title: '',
    content: '',
    target_audience: 'all' as const,
    send_immediately: true
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'system' as const,
    subject: '',
    content: '',
    target_audience: 'all' as const,
    is_active: true
  });

  const { toast } = useToast();
  const { user } = useAuthContext();

  const notificationTypes = {
    info: { label: 'Информация', icon: Info, color: 'blue' },
    warning: { label: 'Предупреждение', icon: AlertTriangle, color: 'yellow' },
    error: { label: 'Ошибка', icon: AlertTriangle, color: 'red' },
    success: { label: 'Успех', icon: CheckCircle, color: 'green' }
  };

  const audienceOptions = {
    all: 'Все пользователи',
    users: 'Обычные пользователи',
    admins: 'Администраторы',
    moderators: 'Модераторы'
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Получаем уведомления
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications((notificationsData || []).map(n => ({
        ...n,
        type: (n.type as 'info' | 'warning' | 'error' | 'success') || 'info'
      })));

    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить уведомления",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // В реальном приложении здесь был бы запрос к таблице шаблонов
      // Пока используем моковые данные
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Добро пожаловать',
          type: 'marketing',
          subject: 'Добро пожаловать на платформу!',
          content: 'Спасибо за регистрацию. Вот что вы можете сделать далее...',
          target_audience: 'users',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Техническое обслуживание',
          type: 'system',
          subject: 'Плановое техническое обслуживание',
          content: 'Уведомляем о плановом техническом обслуживании системы...',
          target_audience: 'all',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchTemplates();
  }, []);

  const sendNotification = async () => {
    try {
      if (!notificationForm.title.trim() || !notificationForm.content.trim()) {
        toast({
          title: "Ошибка",
          description: "Заполните все обязательные поля",
          variant: "destructive"
        });
        return;
      }

      // В реальном приложении здесь был бы вызов API для массовой отправки
      // Пока создаем одно уведомление для демонстрации
      if (user?.id) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: notificationForm.type,
            title: notificationForm.title,
            content: notificationForm.content
          });

        if (error) throw error;

        // Логируем действие
        await supabase.from('admin_logs').insert({
          user_id: user.id,
          action: 'sent_notification',
          target_type: 'notification',
          target_id: crypto.randomUUID()
        });

        toast({
          title: "Успешно",
          description: `Уведомление отправлено`
        });

        setDialogOpen(false);
        resetNotificationForm();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление",
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: "Успешно",
        description: "Уведомление удалено"
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить уведомление",
        variant: "destructive"
      });
    }
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      type: 'info',
      title: '',
      content: '',
      target_audience: 'all',
      send_immediately: true
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      type: 'system',
      subject: '',
      content: '',
      target_audience: 'all',
      is_active: true
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'read' && notification.is_read) ||
                         (statusFilter === 'unread' && !notification.is_read);
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getNotificationIcon = (type: string) => {
    const config = notificationTypes[type as keyof typeof notificationTypes];
    const IconComponent = config?.icon || Info;
    return <IconComponent className="w-4 h-4" />;
  };

  const getNotificationColor = (type: string) => {
    const config = notificationTypes[type as keyof typeof notificationTypes];
    return config?.color || 'blue';
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    today: notifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.created_at);
      return notificationDate.toDateString() === today.toDateString();
    }).length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Bell className="w-6 h-6 animate-pulse mr-2" />
          Загрузка уведомлений...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Центр уведомлений</h2>
          <p className="text-muted-foreground">Управление уведомлениями пользователей</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetTemplateForm}>
                <Settings className="w-4 h-4 mr-2" />
                Шаблоны
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Шаблоны уведомлений</DialogTitle>
                <DialogDescription>
                  Управление шаблонами для массовых уведомлений
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{template.type}</Badge>
                            <Badge variant="secondary">{audienceOptions[template.target_audience as keyof typeof audienceOptions]}</Badge>
                            {template.is_active ? (
                              <Badge variant="default">Активен</Badge>
                            ) : (
                              <Badge variant="secondary">Неактивен</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetNotificationForm}>
                <Plus className="w-4 h-4 mr-2" />
                Создать уведомление
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Новое уведомление</DialogTitle>
                <DialogDescription>
                  Создайте и отправьте уведомление пользователям
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Тип уведомления</label>
                    <Select
                      value={notificationForm.type}
                      onValueChange={(value: any) => 
                        setNotificationForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(notificationTypes).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Аудитория</label>
                    <Select
                      value={notificationForm.target_audience}
                      onValueChange={(value: any) => 
                        setNotificationForm(prev => ({ ...prev, target_audience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(audienceOptions).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Заголовок</label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Заголовок уведомления"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Содержание</label>
                  <Textarea
                    value={notificationForm.content}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Текст уведомления..."
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={notificationForm.send_immediately}
                    onCheckedChange={(checked) => 
                      setNotificationForm(prev => ({ ...prev, send_immediately: checked }))}
                  />
                  <label className="text-sm font-medium">Отправить немедленно</label>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={sendNotification}>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Всего уведомлений</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Непрочитанных</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Сегодня</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск уведомлений..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="read">Прочитанные</SelectItem>
                <SelectItem value="unread">Непрочитанные</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(notificationTypes).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет уведомлений для отображения</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className={`border ${!notification.is_read ? 'bg-muted/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getNotificationIcon(notification.type)}
                          <h4 className="font-medium">{notification.title}</h4>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">Новое</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {notificationTypes[notification.type as keyof typeof notificationTypes]?.label}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.content}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить уведомление?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить. Уведомление будет удалено навсегда.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteNotification(notification.id)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};