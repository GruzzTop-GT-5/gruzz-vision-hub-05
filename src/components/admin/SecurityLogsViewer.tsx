import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { handleError } from '@/lib/errorHandler';
import {
  Shield,
  Search,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  User,
  Filter,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SecurityLog {
  id: string;
  event_type: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
  user_profile?: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export const SecurityLogsViewer: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_logs')
        .select(`
          *,
          user_profile:profiles!user_id (
            display_name,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Ограничиваем для производительности

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error) {
      handleError(error, { component: 'SecurityLogsViewer', action: 'fetchLogs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string): string => {
    const colors = {
      'info': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'warning': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'error': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'critical': 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      'info': <Info className="w-4 h-4" />,
      'warning': <AlertTriangle className="w-4 h-4" />,
      'error': <AlertCircle className="w-4 h-4" />,
      'critical': <AlertTriangle className="w-4 h-4" />
    };
    return icons[severity as keyof typeof icons] || <Info className="w-4 h-4" />;
  };

  const getEventTypeLabel = (eventType: string): string => {
    const labels = {
      'role_change': 'Изменение роли',
      'login_attempt': 'Попытка входа',
      'failed_login': 'Неудачный вход',
      'password_change': 'Смена пароля',
      'user_ban': 'Блокировка пользователя',
      'admin_action': 'Админское действие',
      'data_export': 'Экспорт данных',
      'suspicious_activity': 'Подозрительная активность'
    };
    return labels[eventType as keyof typeof labels] || eventType;
  };

  const exportLogs = async () => {
    try {
      const filteredLogs = getFilteredLogs();
      const csvContent = [
        ['Время', 'Тип события', 'Пользователь', 'Уровень', 'IP адрес', 'Детали'].join(','),
        ...filteredLogs.map(log => [
          format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru }),
          getEventTypeLabel(log.event_type),
          log.user_profile?.display_name || log.user_profile?.phone || 'Система',
          log.severity,
          log.ip_address || 'N/A',
          JSON.stringify(log.details || {}).replace(/,/g, ';')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `security_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      link.click();

      toast({
        title: "Успешно",
        description: "Логи экспортированы в CSV файл"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать логи",
        variant: "destructive"
      });
    }
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_profile?.phone?.includes(searchTerm) ||
        log.ip_address?.includes(searchTerm) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEventType = eventTypeFilter === 'all' || log.event_type === eventTypeFilter;
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

      return matchesSearch && matchesEventType && matchesSeverity;
    });
  };

  const filteredLogs = getFilteredLogs();

  // Группировка событий по типам для статистики
  const eventStats = logs.reduce((acc, log) => {
    acc[log.event_type] = (acc[log.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityStats = logs.reduce((acc, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-steel-100">Логи безопасности</h2>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            {filteredLogs.length} записей
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Button onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-steel-lighter p-4">
          <h3 className="text-lg font-semibold text-steel-100 mb-3">Типы событий</h3>
          <div className="space-y-2">
            {Object.entries(eventStats).slice(0, 5).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-steel-300">{getEventTypeLabel(type)}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-steel-lighter p-4">
          <h3 className="text-lg font-semibold text-steel-100 mb-3">Уровни важности</h3>
          <div className="space-y-2">
            {Object.entries(severityStats).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getSeverityIcon(severity)}
                  <span className="text-steel-300 capitalize">{severity}</span>
                </div>
                <Badge className={getSeverityColor(severity)}>{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="card-steel-lighter p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4" />
            <Input
              placeholder="Поиск в логах..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Тип события" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все события</SelectItem>
              {Object.keys(eventStats).map(type => (
                <SelectItem key={type} value={type}>
                  {getEventTypeLabel(type)} ({eventStats[type]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Уровень важности" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setEventTypeFilter('all');
              setSeverityFilter('all');
            }}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Сбросить</span>
          </Button>
        </div>
      </Card>

      {/* Список логов */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {loading ? (
            <Card className="card-steel-lighter p-6 text-center">
              <p className="text-steel-300">Загрузка логов...</p>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card className="card-steel-lighter p-6 text-center">
              <Shield className="w-12 h-12 text-steel-400 mx-auto mb-2" />
              <p className="text-steel-300">Логи не найдены</p>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="card-steel-lighter p-3 hover:bg-steel-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(log.severity)}
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-steel-100">
                          {getEventTypeLabel(log.event_type)}
                        </span>
                        <span className="text-steel-400 text-sm">
                          от {log.user_profile?.display_name || log.user_profile?.phone || 'Система'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-steel-400">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                        </span>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span>+{Object.keys(log.details).length} деталей</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Dialog open={detailsOpen && selectedLog?.id === log.id} onOpenChange={setDetailsOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          {getSeverityIcon(log.severity)}
                          <span>Детали события: {getEventTypeLabel(log.event_type)}</span>
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-steel-400">ID события:</span>
                            <p className="text-steel-200 font-mono text-xs">{log.id}</p>
                          </div>
                          <div>
                            <span className="text-steel-400">Время:</span>
                            <p className="text-steel-200">
                              {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                            </p>
                          </div>
                          <div>
                            <span className="text-steel-400">Пользователь:</span>
                            <p className="text-steel-200">
                              {log.user_profile?.display_name || log.user_profile?.phone || 'Система'}
                            </p>
                          </div>
                          <div>
                            <span className="text-steel-400">IP адрес:</span>
                            <p className="text-steel-200">{log.ip_address || 'Не указан'}</p>
                          </div>
                        </div>

                        {log.user_agent && (
                          <div>
                            <span className="text-steel-400 text-sm">User Agent:</span>
                            <p className="text-steel-200 text-xs bg-steel-700 p-2 rounded mt-1 break-all">
                              {log.user_agent}
                            </p>
                          </div>
                        )}

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div>
                            <span className="text-steel-400 text-sm">Дополнительные данные:</span>
                            <pre className="text-steel-200 text-xs bg-steel-700 p-3 rounded mt-1 overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};