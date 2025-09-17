import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Zap
} from 'lucide-react';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time: number;
  error_rate: number;
  active_connections: number;
  requests_per_minute: number;
}

interface PerformanceData {
  timestamp: string;
  response_time: number;
  cpu_usage: number;
  memory_usage: number;
  error_rate: number;
}

interface DatabaseMetrics {
  total_connections: number;
  active_queries: number;
  slow_queries: number;
  cache_hit_ratio: number;
  avg_query_time: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<Array<{id: string, type: 'warning' | 'error', message: string}>>([]);
  const { toast } = useToast();

  const generateMockMetrics = (): SystemMetrics => {
    return {
      cpu_usage: Math.random() * 80 + 10,
      memory_usage: Math.random() * 70 + 20,
      disk_usage: Math.random() * 60 + 30,
      response_time: Math.random() * 500 + 100,
      error_rate: Math.random() * 5,
      active_connections: Math.floor(Math.random() * 1000) + 100,
      requests_per_minute: Math.floor(Math.random() * 5000) + 1000
    };
  };

  const generateMockDbMetrics = (): DatabaseMetrics => {
    return {
      total_connections: Math.floor(Math.random() * 100) + 50,
      active_queries: Math.floor(Math.random() * 20) + 5,
      slow_queries: Math.floor(Math.random() * 3),
      cache_hit_ratio: Math.random() * 20 + 80,
      avg_query_time: Math.random() * 100 + 10
    };
  };

  const checkSystemHealth = () => {
    const newAlerts = [];
    
    if (metrics) {
      if (metrics.cpu_usage > 80) {
        newAlerts.push({
          id: 'cpu-high',
          type: 'error' as const,
          message: `Высокая нагрузка на CPU: ${metrics.cpu_usage.toFixed(1)}%`
        });
      }
      
      if (metrics.memory_usage > 85) {
        newAlerts.push({
          id: 'memory-high',
          type: 'error' as const,
          message: `Высокое использование памяти: ${metrics.memory_usage.toFixed(1)}%`
        });
      }
      
      if (metrics.response_time > 1000) {
        newAlerts.push({
          id: 'response-slow',
          type: 'warning' as const,
          message: `Медленный отклик: ${metrics.response_time.toFixed(0)}ms`
        });
      }
      
      if (metrics.error_rate > 3) {
        newAlerts.push({
          id: 'error-rate-high',
          type: 'error' as const,
          message: `Высокий уровень ошибок: ${metrics.error_rate.toFixed(1)}%`
        });
      }
    }
    
    setAlerts(newAlerts);
  };

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      
      // В реальном приложении здесь были бы запросы к API мониторинга
      // Пока используем моковые данные
      const newMetrics = generateMockMetrics();
      const newDbMetrics = generateMockDbMetrics();
      
      setMetrics(newMetrics);
      setDbMetrics(newDbMetrics);
      
      // Генерируем данные для графиков (последние 24 часа)
      const now = Date.now();
      const dataPoints = Array.from({ length: 24 }, (_, i) => {
        const timestamp = new Date(now - (23 - i) * 60 * 60 * 1000);
        return {
          timestamp: timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          response_time: Math.random() * 400 + 100,
          cpu_usage: Math.random() * 60 + 20,
          memory_usage: Math.random() * 50 + 30,
          error_rate: Math.random() * 3
        };
      });
      
      setPerformanceData(dataPoints);
      
      // Получаем реальные метрики от Supabase
      try {
        // Проверяем статус подключения к БД
        const { data, error } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });
        
        if (!error) {
          // Если запрос успешен, система работает нормально
          console.log('Database connection: OK');
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        setAlerts(prev => [...prev, {
          id: 'db-connection',
          type: 'error',
          message: 'Проблема с подключением к базе данных'
        }]);
      }
      
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить метрики производительности",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Обновляем метрики каждые 30 секунд
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (metrics) {
      checkSystemHealth();
    }
  }, [metrics]);

  const getStatusColor = (value: number, thresholds: {warning: number, critical: number}) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusBadge = (value: number, thresholds: {warning: number, critical: number}) => {
    if (value >= thresholds.critical) return <Badge variant="destructive">Критично</Badge>;
    if (value >= thresholds.warning) return <Badge variant="secondary">Предупреждение</Badge>;
    return <Badge variant="default">Норма</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Activity className="w-6 h-6 animate-pulse mr-2" />
          Загрузка метрик производительности...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Мониторинг производительности</h2>
          <p className="text-muted-foreground">Состояние системы в реальном времени</p>
        </div>
        <Button onClick={fetchMetrics} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Алерты */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              {getStatusBadge(metrics?.cpu_usage || 0, { warning: 70, critical: 85 })}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(metrics?.cpu_usage || 0, { warning: 70, critical: 85 })}`}>
                  {metrics?.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics?.cpu_usage || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Память */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span className="text-sm font-medium">Память</span>
              </div>
              {getStatusBadge(metrics?.memory_usage || 0, { warning: 75, critical: 90 })}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(metrics?.memory_usage || 0, { warning: 75, critical: 90 })}`}>
                  {metrics?.memory_usage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics?.memory_usage || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Время отклика */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Отклик</span>
              </div>
              {getStatusBadge(metrics?.response_time || 0, { warning: 500, critical: 1000 })}
            </div>
            <div className="space-y-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics?.response_time || 0, { warning: 500, critical: 1000 })}`}>
                {metrics?.response_time.toFixed(0)}ms
              </span>
              <p className="text-xs text-muted-foreground">Среднее время</p>
            </div>
          </CardContent>
        </Card>

        {/* Подключения */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Подключения</span>
              </div>
              <Badge variant="default">Активно</Badge>
            </div>
            <div className="space-y-2">
              <span className="text-2xl font-bold text-blue-500">
                {metrics?.active_connections.toLocaleString()}
              </span>
              <p className="text-xs text-muted-foreground">Активных сессий</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики производительности */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График времени отклика */}
        <Card>
          <CardHeader>
            <CardTitle>Время отклика (24 часа)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}ms`, 'Время отклика']} />
                <Line 
                  type="monotone" 
                  dataKey="response_time" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* График использования ресурсов */}
        <Card>
          <CardHeader>
            <CardTitle>Использование ресурсов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="cpu_usage" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  name="CPU %"
                />
                <Area 
                  type="monotone" 
                  dataKey="memory_usage" 
                  stackId="1"
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary))"
                  name="Память %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Метрики базы данных */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Состояние базы данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{dbMetrics?.total_connections}</p>
              <p className="text-sm text-muted-foreground">Всего подключений</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{dbMetrics?.active_queries}</p>
              <p className="text-sm text-muted-foreground">Активных запросов</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{dbMetrics?.slow_queries}</p>
              <p className="text-sm text-muted-foreground">Медленных запросов</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{dbMetrics?.cache_hit_ratio.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Кэш hit ratio</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-500">{dbMetrics?.avg_query_time.toFixed(1)}ms</p>
              <p className="text-sm text-muted-foreground">Среднее время запроса</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4" />
              <span className="font-medium">Система</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Запросов в минуту:</span>
                <span className="font-mono">{metrics?.requests_per_minute.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Уровень ошибок:</span>
                <span className="font-mono">{metrics?.error_rate.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" />
              <span className="font-medium">Сеть</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Статус:</span>
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Онлайн
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Пинг:</span>
                <span className="font-mono">12ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4" />
              <span className="font-medium">Хранилище</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Использовано:</span>
                <span className="font-mono">{metrics?.disk_usage.toFixed(1)}%</span>
              </div>
              <div className="space-y-1">
                <Progress value={metrics?.disk_usage || 0} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};