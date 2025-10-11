import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Pause,
  XCircle,
  AlertTriangle,
  Settings,
  Bell,
  Reply
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  urgency: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  response_time_minutes: number | null;
  creator?: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
  };
  assignee?: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
  };
}

interface AdminCall {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  conversation_id: string | null;
  is_read: boolean;
  created_at: string;
  caller_id?: string;
  user?: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
  };
}

export const AdminTicketManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [adminCalls, setAdminCalls] = useState<AdminCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Admin actions
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchTickets();
    fetchAdminCalls();
    subscribeToAdminCalls();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          creator:profiles!support_tickets_created_by_fkey(
            display_name,
            full_name,
            phone
          ),
          assignee:profiles!support_tickets_assigned_to_fkey(
            display_name,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить тикеты",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *
        `)
        .eq('type', 'admin_call')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Получаем данные пользователей из разговоров
      const callsWithUsers = await Promise.all(
        (data || []).map(async (call) => {
          if (call.conversation_id) {
            const { data: conv } = await supabase
              .from('conversations')
              .select('created_by, participants')
              .eq('id', call.conversation_id)
              .single();

            if (conv) {
              // Находим пользователя, который НЕ является текущим админом (получателем уведомления)
              const callerIds = conv.participants.filter((id: string) => id !== call.user_id);
              const callerId = callerIds[0] || conv.created_by;

              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, full_name, phone')
                .eq('id', callerId)
                .single();

              return {
                ...call,
                caller_id: callerId,
                user: profile
              };
            }
          }
          return call;
        })
      );

      setAdminCalls(callsWithUsers);
    } catch (error) {
      console.error('Error fetching admin calls:', error);
    }
  };

  const subscribeToAdminCalls = () => {
    const channel = supabase
      .channel('admin-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.admin_call'
        },
        () => {
          fetchAdminCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRespondToCall = async (call: AdminCall) => {
    if (call.conversation_id) {
      navigate(`/chat-system?conversation=${call.conversation_id}`);
      
      // Mark as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', call.id);
      
      fetchAdminCalls();
    }
  };

  const handleMarkAsResolved = async (callId: string) => {
    try {
      // Отмечаем уведомление как прочитанное
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', callId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Отмечено как решено",
        description: "Вызов помечен как решенный"
      });

      // Обновляем список вызовов
      setAdminCalls(prev => 
        prev.map(call => 
          call.id === callId ? { ...call, is_read: true } : call
        )
      );
    } catch (error) {
      console.error('Error marking call as resolved:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive"
      });
    }
  };

  const handleCloseCall = async (callId: string) => {
    try {
      // Удаляем уведомление
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', callId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      toast({
        title: "Вызов закрыт",
        description: "Вызов успешно закрыт"
      });

      // Удаляем вызов из локального состояния
      setAdminCalls(prev => prev.filter(call => call.id !== callId));
    } catch (error) {
      console.error('Error closing call:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось закрыть вызов",
        variant: "destructive"
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string, note?: string) => {
    try {
      const updates: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      // Create notification for user
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        await supabase
          .from('notifications')
          .insert({
            user_id: ticket.created_by,
            type: 'support_ticket',
            title: 'Обновление тикета',
            content: `Статус вашего тикета ${ticket.ticket_number} изменен на: ${getStatusLabel(status)}${note ? `. Комментарий: ${note}` : ''}`
          });
      }

      toast({
        title: "Успешно",
        description: "Статус тикета обновлен"
      });

      fetchTickets();
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус тикета",
        variant: "destructive"
      });
    }
  };

  const assignTicket = async (ticketId: string, assigneeId: string | null) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          assigned_to: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: assigneeId ? "Тикет назначен" : "Назначение снято"
      });

      fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить тикет",
        variant: "destructive"
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Открыт';
      case 'in_progress': return 'В работе';
      case 'resolved': return 'Решен';
      case 'closed': return 'Закрыт';
      case 'active': return 'Активен';
      default: return status || 'Неизвестно';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'in_progress': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'resolved': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'closed': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-steel-400 bg-steel-400/10 border-steel-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'normal': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'urgent': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-steel-400 bg-steel-400/10 border-steel-400/20';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'Низкая';
      case 'normal': return 'Обычная';
      case 'high': return 'Высокая';
      case 'urgent': return 'Срочная';
      default: return urgency;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesUrgency = urgencyFilter === 'all' || ticket.urgency === urgencyFilter;
    const matchesSearch = searchFilter === '' || 
      ticket.ticket_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ticket.creator?.display_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ticket.creator?.phone?.includes(searchFilter);

    return matchesStatus && matchesPriority && matchesUrgency && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calls" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Вызовы ({adminCalls.length})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Тикеты ({tickets.length})
          </TabsTrigger>
        </TabsList>

        {/* Admin Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <Card className="card-steel">
            <ScrollArea className="h-[600px] p-4">
              <div className="space-y-4">
                {adminCalls.length === 0 ? (
                  <div className="text-center py-8 text-steel-400">Нет активных вызовов</div>
                ) : (
                  adminCalls.map((call) => (
                    <Card key={call.id} className={`card-steel-lighter p-4 ${!call.is_read ? 'border-2 border-red-500/50' : ''}`}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="text-red-400 bg-red-400/10 border-red-400/20 animate-pulse">
                                🚨 Вызов администратора
                              </Badge>
                              {!call.is_read && (
                                <Badge variant="default">Новый</Badge>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-steel-100 mb-2">
                              {call.title}
                            </h3>
                            
                            {call.content && (
                              <p className="text-steel-300 text-sm mb-3">
                                {call.content}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-steel-400">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {call.user?.display_name || call.user?.phone || 'Неизвестен'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(call.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t border-steel-600">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRespondToCall(call)}
                            className="flex items-center gap-2"
                          >
                            <Reply className="w-4 h-4" />
                            Ответить
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsResolved(call.id)}
                            disabled={call.is_read}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Решено
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCloseCall(call.id)}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300"
                          >
                            <XCircle className="w-4 h-4" />
                            Закрыть
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          {/* Filters */}
          <Card className="card-steel p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4" />
            <Input
              placeholder="Поиск по номеру, теме, пользователю..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="open">Открыт</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="resolved">Решен</SelectItem>
              <SelectItem value="closed">Закрыт</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              <SelectItem value="low">Низкий</SelectItem>
              <SelectItem value="normal">Обычный</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
              <SelectItem value="urgent">Срочный</SelectItem>
            </SelectContent>
          </Select>

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Срочность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Вся срочность</SelectItem>
              <SelectItem value="low">Низкая</SelectItem>
              <SelectItem value="normal">Обычная</SelectItem>
              <SelectItem value="high">Высокая</SelectItem>
              <SelectItem value="urgent">Срочная</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tickets List */}
      <Card className="card-steel">
        <ScrollArea className="h-[600px] p-4">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-steel-400">Загрузка тикетов...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-steel-400">Тикеты не найдены</div>
            ) : (
              filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="card-steel-lighter p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {ticket.ticket_number && (
                          <span className="font-mono text-sm text-primary">
                            {ticket.ticket_number}
                          </span>
                        )}
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className="text-purple-400 bg-purple-400/10 border-purple-400/20">
                          {getUrgencyLabel(ticket.urgency)}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-steel-100 mb-2">
                        {ticket.subject}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-steel-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {ticket.creator?.display_name || ticket.creator?.phone || 'Неизвестен'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(ticket.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </div>
                        {ticket.assigned_to && (
                          <div className="flex items-center gap-1">
                            <Settings className="w-4 h-4" />
                            {ticket.assignee?.display_name || 'Назначен'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog open={detailsOpen && selectedTicket?.id === ticket.id} onOpenChange={setDetailsOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Детали тикета {ticket.ticket_number}</DialogTitle>
                            <DialogDescription>
                              Подробная информация об обращении в поддержку
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-steel-300">Статус</label>
                                <Select value={newStatus || ticket.status} onValueChange={setNewStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Открыт</SelectItem>
                                    <SelectItem value="in_progress">В работе</SelectItem>
                                    <SelectItem value="resolved">Решен</SelectItem>
                                    <SelectItem value="closed">Закрыт</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-steel-300">Приоритет</label>
                                <Badge className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-steel-300">Описание</label>
                              <p className="text-steel-100 bg-steel-700 p-3 rounded">
                                {ticket.description || 'Нет описания'}
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-steel-300">Комментарий администратора</label>
                              <Textarea
                                placeholder="Добавить комментарий..."
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                rows={3}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateTicketStatus(ticket.id, newStatus || ticket.status, adminNote)}
                                disabled={!newStatus || newStatus === ticket.status}
                              >
                                Обновить статус
                              </Button>
                              
                              {ticket.status !== 'in_progress' && (
                                <Button
                                  variant="outline"
                                  onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  В работу
                                </Button>
                              )}
                              
                              {ticket.status !== 'resolved' && (
                                <Button
                                  variant="outline"
                                  onClick={() => updateTicketStatus(ticket.id, 'resolved', adminNote)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Решить
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {ticket.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                        >
                          В работу
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};