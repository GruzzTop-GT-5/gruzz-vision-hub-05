import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Settings,
  BarChart3,
  Shield,
  Package,
  MessageSquare,
  CreditCard,
  Activity,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Eye,
  Ban,
  Check,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  activeOrders: number;
  totalRevenue: number;
  pendingReports: number;
  onlineUsers: number;
}

export default function AdminPanelSimple() {
  const { user, userRole, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingReports: 0,
    onlineUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = userRole && ['system_admin', 'admin', 'moderator', 'support'].includes(userRole);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch total revenue from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'completed')
        .eq('type', 'deposit');

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch pending reports count
      const { count: reportsCount } = await supabase
        .from('review_reports')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      setStats({
        totalUsers: usersCount || 0,
        activeOrders: ordersCount || 0,
        totalRevenue,
        pendingReports: reportsCount || 0,
        onlineUsers: Math.floor(Math.random() * 50) + 10 // Mock data
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-steel-300">Загрузка панели администратора...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <Shield className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Доступ запрещен</h2>
            <p className="text-steel-300">У вас нет прав для доступа к административной панели</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-steel-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-glow bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  Административная панель
                </h1>
                <p className="text-steel-400">Управление платформой GruzzTop</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
              {userRole === 'system_admin' ? 'Системный администратор' :
               userRole === 'admin' ? 'Администратор' :
               userRole === 'moderator' ? 'Модератор' : 'Поддержка'}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="card-steel border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-steel-400 text-sm">Всего пользователей</p>
                    <p className="text-2xl font-bold text-steel-100">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-steel border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-steel-400 text-sm">Активные заказы</p>
                    <p className="text-2xl font-bold text-steel-100">{stats.activeOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-steel border-yellow-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-steel-400 text-sm">Доходы</p>
                    <p className="text-2xl font-bold text-steel-100">{stats.totalRevenue.toLocaleString('ru-RU')}₽</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-steel border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-steel-400 text-sm">Жалобы</p>
                    <p className="text-2xl font-bold text-steel-100">{stats.pendingReports}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-steel border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-steel-400 text-sm">Онлайн</p>
                    <p className="text-2xl font-bold text-steel-100">{stats.onlineUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users Management */}
            <Card className="card-steel border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-steel-100 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Управление пользователями</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20">
                    <Users className="w-4 h-4 mr-2" />
                    Список пользователей
                  </Button>
                </Link>
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-red-500/10 hover:bg-red-500/20 border border-red-500/20">
                    <Ban className="w-4 h-4 mr-2" />
                    Управление банами
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Orders Management */}
            <Card className="card-steel border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-steel-100 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-green-400" />
                  <span>Управление заказами</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-green-500/10 hover:bg-green-500/20 border border-green-500/20">
                    <Package className="w-4 h-4 mr-2" />
                    Все заказы
                  </Button>
                </Link>
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Спорные заказы
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Finance Management */}
            <Card className="card-steel border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-steel-100 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-yellow-400" />
                  <span>Финансы</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Транзакции
                  </Button>
                </Link>
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Выводы средств
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Moderation */}
            <Card className="card-steel border-red-500/20 hover:border-red-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-steel-100 flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-red-400" />
                  <span>Модерация</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-red-500/10 hover:bg-red-500/20 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Жалобы ({stats.pendingReports})
                  </Button>
                </Link>
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Сообщения
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="card-steel border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-steel-100 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span>Аналитика</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20"
                  disabled
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Отчеты (скоро)
                </Button>
                <Button 
                  className="w-full justify-start bg-green-500/10 hover:bg-green-500/20 border border-green-500/20"
                  disabled
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Графики (скоро)
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="card-steel border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-steel-100 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <span>Настройки</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20">
                    <Settings className="w-4 h-4 mr-2" />
                    Системные настройки
                  </Button>
                </Link>
                <Link to="/admin" className="block">
                  <Button className="w-full justify-start bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20">
                    <Activity className="w-4 h-4 mr-2" />
                    Логи системы
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="card-steel border-primary/20">
            <CardHeader>
              <CardTitle className="text-steel-100 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <span>Быстрые действия</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin">
                  <Button className="w-full h-16 bg-gradient-to-br from-primary/10 to-electric-600/10 border border-primary/20 hover:border-primary/40">
                    <div className="text-center">
                      <Settings className="w-6 h-6 mx-auto mb-1 text-primary" />
                      <span className="text-sm">Полная панель</span>
                    </div>
                  </Button>
                </Link>
                <Button 
                  className="w-full h-16 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 hover:border-green-500/40"
                  onClick={fetchStats}
                >
                  <div className="text-center">
                    <Activity className="w-6 h-6 mx-auto mb-1 text-green-400" />
                    <span className="text-sm">Обновить данные</span>
                  </div>
                </Button>
                <Button 
                  className="w-full h-16 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/20 hover:border-blue-500/40"
                  disabled
                >
                  <div className="text-center">
                    <MessageSquare className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                    <span className="text-sm">Уведомления</span>
                  </div>
                </Button>
                <Button 
                  className="w-full h-16 bg-gradient-to-br from-red-500/10 to-pink-600/10 border border-red-500/20 hover:border-red-500/40"
                  disabled
                >
                  <div className="text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-400" />
                    <span className="text-sm">Экстренные</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}