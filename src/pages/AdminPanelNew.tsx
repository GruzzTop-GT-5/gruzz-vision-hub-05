import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { TransactionManagement } from '@/components/admin/TransactionManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { SecurityLogsViewer } from '@/components/admin/SecurityLogsViewer';
import { SystemSettingsManager } from '@/components/admin/SystemSettingsManager';
import { CategoriesManagement } from '@/components/CategoriesManagement';
import { AdminReviewModeration } from '@/components/AdminReviewModeration';
import { AdminTicketManagement } from '@/components/AdminTicketManagement';
import { BanManagementSection } from '@/components/BanManagementSection';
import { ContentModerationQueue } from '@/components/admin/ContentModerationQueue';
import { AutoModerationRules } from '@/components/admin/AutoModerationRules';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { PerformanceMonitor } from '@/components/admin/PerformanceMonitor';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { Navigate } from 'react-router-dom';
import {
  Activity,
  Users,
  Shield,
  ShoppingBag,
  CreditCard,
  BarChart3,
  AlertTriangle,
  Headphones,
  Zap,
  Bell,
  Lock,
  Settings,
  BookOpen,
  CheckCircle,
  TrendingUp,
  UserCheck,
  Clock,
  HelpCircle,
  ArrowLeft,
  DollarSign
} from 'lucide-react';

interface AdminModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  component: React.ReactNode;
  roles: string[];
}

const AdminInstructionsModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-500/30 hover:border-blue-400/50">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-steel-100 mb-2">📖 Инструкция</h3>
            <p className="text-steel-400 text-sm">Руководство по использованию админ-панели</p>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Инструкция по использованию административной панели
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Общие принципы */}
            <Card className="p-4 border-green-500/20 bg-green-500/5">
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Общие принципы работы
              </h3>
              <ul className="space-y-2 text-steel-300">
                <li>• Все действия логируются в системе безопасности</li>
                <li>• Изменения вступают в силу мгновенно</li>
                <li>• При возникновении проблем немедленно сообщайте разработчикам</li>
                <li>• Регулярно проверяйте статистику и аналитику</li>
              </ul>
            </Card>

            {/* Дашборд */}
            <Card className="p-4 border-primary/20">
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                📊 Дашборд
              </h3>
              <p className="text-steel-300 mb-2">Основная страница с общей статистикой платформы:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• Количество пользователей, заказов, транзакций</li>
                <li>• Графики активности в реальном времени</li>
                <li>• Последние события и изменения</li>
                <li>• Статус работы системы</li>
              </ul>
            </Card>

            {/* Пользователи */}
            <Card className="p-4 border-purple-500/20">
              <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                👥 Управление пользователями
              </h3>
              <p className="text-steel-300 mb-2">Полное управление аккаунтами пользователей:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• Просмотр списка всех пользователей</li>
                <li>• Редактирование профилей и данных</li>
                <li>• Управление балансом пользователей</li>
                <li>• Блокировка и разблокировка аккаунтов</li>
                <li>• Просмотр истории активности</li>
              </ul>
            </Card>

            {/* Роли */}
            <Card className="p-4 border-yellow-500/20">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                🔐 Управление ролями
              </h3>
              <p className="text-steel-300 mb-2">Назначение ролей и прав доступа:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• <strong>system_admin</strong> - полный доступ ко всему</li>
                <li>• <strong>admin</strong> - административные функции</li>
                <li>• <strong>moderator</strong> - модерация контента</li>
                <li>• <strong>support</strong> - поддержка пользователей</li>
                <li>• <strong>user</strong> - обычный пользователь</li>
              </ul>
            </Card>

            {/* Заказы */}
            <Card className="p-4 border-blue-500/20">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                📋 Управление заказами
              </h3>
              <p className="text-steel-300 mb-2">Контроль всех заказов на платформе:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• Просмотр всех активных и завершенных заказов</li>
                <li>• Изменение статусов и приоритетов</li>
                <li>• Разрешение спорных ситуаций</li>
                <li>• Продление сроков заказов</li>
              </ul>
            </Card>

            {/* Транзакции */}
            <Card className="p-4 border-green-500/20">
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                💳 Управление транзакциями
              </h3>
              <p className="text-steel-300 mb-2">Контроль финансовых операций:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• Подтверждение пополнений баланса</li>
                <li>• Обработка заявок на вывод средств</li>
                <li>• Просмотр истории платежей</li>
                <li>• Ручное начисление/списание средств</li>
              </ul>
            </Card>

            {/* Модерация */}
            <Card className="p-4 border-red-500/20">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                🛡️ Модерация контента
              </h3>
              <p className="text-steel-300 mb-2">Контроль качества контента:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• Модерация объявлений и заказов</li>
                <li>• Проверка отзывов и жалоб</li>
                <li>• Настройка автоматических правил</li>
                <li>• Управление банами и ограничениями</li>
              </ul>
            </Card>

            {/* Поддержка */}
            <Card className="p-4 border-cyan-500/20">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <Headphones className="w-5 h-5" />
                🎧 Служба поддержки
              </h3>
              <p className="text-steel-300 mb-2">Работа с обращениями пользователей:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• Просмотр и обработка тикетов</li>
                <li>• Ответы на вопросы пользователей</li>
                <li>• Эскалация сложных случаев</li>
                <li>• Статистика времени ответа</li>
              </ul>
            </Card>

            {/* Настройки */}
            <Card className="p-4 border-orange-500/20">
              <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                ⚙️ Системные настройки
              </h3>
              <p className="text-steel-300 mb-2">Конфигурация платформы:</p>
              <ul className="space-y-1 text-steel-400 text-sm">
                <li>• Лимиты и ограничения</li>
                <li>• Комиссии и тарифы</li>
                <li>• Временные настройки</li>
                <li>• Уведомления и оповещения</li>
              </ul>
            </Card>

            {/* Безопасность */}
            <Card className="p-4 border-red-500/20 bg-red-500/5">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                ⚠️ Важные меры безопасности
              </h3>
              <ul className="space-y-2 text-steel-300">
                <li>• <strong>ВСЕГДА</strong> проверяйте изменения перед сохранением</li>
                <li>• <strong>НЕ ДАВАЙТЕ</strong> права админа неизвестным лицам</li>
                <li>• <strong>СООБЩАЙТЕ</strong> о подозрительной активности</li>
                <li>• <strong>ДЕЛАЙТЕ БЭКАПЫ</strong> перед крупными изменениями</li>
              </ul>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export const AdminPanelNew = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !userRole || !['admin', 'system_admin', 'moderator', 'support'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  const adminModules: AdminModule[] = [
    {
      id: 'dashboard',
      title: '📊 Дашборд',
      description: 'Общая статистика и мониторинг системы в реальном времени',
      icon: <Activity className="w-8 h-8" />,
      color: 'text-blue-400',
      bgColor: 'from-blue-500/10 to-blue-600/20 border-blue-500/30 hover:border-blue-400/50',
      component: <AdminDashboard />,
      roles: ['admin', 'system_admin', 'moderator', 'support']
    },
    {
      id: 'users',
      title: '👥 Пользователи',
      description: 'Управление аккаунтами, ролями и профилями пользователей',
      icon: <Users className="w-8 h-8" />,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/10 to-purple-600/20 border-purple-500/30 hover:border-purple-400/50',
      component: <UserManagement />,
      roles: ['admin', 'system_admin', 'moderator']
    },
    {
      id: 'roles',
      title: '🔐 Роли и права',
      description: 'Назначение ролей и управление правами доступа',
      icon: <Shield className="w-8 h-8" />,
      color: 'text-yellow-400',
      bgColor: 'from-yellow-500/10 to-yellow-600/20 border-yellow-500/30 hover:border-yellow-400/50',
      component: <RoleManagement />,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'orders',
      title: '📋 Заказы',
      description: 'Управление заказами, статусами и приоритетами',
      icon: <ShoppingBag className="w-8 h-8" />,
      color: 'text-emerald-400',
      bgColor: 'from-emerald-500/10 to-emerald-600/20 border-emerald-500/30 hover:border-emerald-400/50',
      component: <OrderManagement />,
      roles: ['admin', 'system_admin', 'moderator']
    },
    {
      id: 'transactions',
      title: '💳 Транзакции',
      description: 'Управление платежами, пополнениями и выводами',
      icon: <CreditCard className="w-8 h-8" />,
      color: 'text-green-400',
      bgColor: 'from-green-500/10 to-green-600/20 border-green-500/30 hover:border-green-400/50',
      component: <TransactionManagement />,
      roles: ['admin', 'system_admin', 'support']
    },
    {
      id: 'analytics',
      title: '📈 Аналитика',
      description: 'Подробная аналитика, графики и отчеты',
      icon: <BarChart3 className="w-8 h-8" />,
      color: 'text-indigo-400',
      bgColor: 'from-indigo-500/10 to-indigo-600/20 border-indigo-500/30 hover:border-indigo-400/50',
      component: <AnalyticsDashboard />,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'moderation',
      title: '🛡️ Модерация',
      description: 'Контроль контента, баны и автоматические правила',
      icon: <AlertTriangle className="w-8 h-8" />,
      color: 'text-red-400',
      bgColor: 'from-red-500/10 to-red-600/20 border-red-500/30 hover:border-red-400/50',
      component: (
        <div className="space-y-6">
          <ContentModerationQueue />
          <AutoModerationRules />
          <AdminReviewModeration />
          <BanManagementSection />
          <CategoriesManagement />
        </div>
      ),
      roles: ['admin', 'system_admin', 'moderator']
    },
    {
      id: 'support',
      title: '🎧 Поддержка',
      description: 'Управление тикетами и обращениями пользователей',
      icon: <Headphones className="w-8 h-8" />,
      color: 'text-cyan-400',
      bgColor: 'from-cyan-500/10 to-cyan-600/20 border-cyan-500/30 hover:border-cyan-400/50',
      component: <AdminTicketManagement />,
      roles: ['admin', 'system_admin', 'support']
    },
    {
      id: 'notifications',
      title: '🔔 Уведомления',
      description: 'Управление системными уведомлениями',
      icon: <Bell className="w-8 h-8" />,
      color: 'text-pink-400',
      bgColor: 'from-pink-500/10 to-pink-600/20 border-pink-500/30 hover:border-pink-400/50',
      component: <NotificationCenter />,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'security',
      title: '🔒 Безопасность',
      description: 'Логи безопасности и мониторинг активности',
      icon: <Lock className="w-8 h-8" />,
      color: 'text-red-400',
      bgColor: 'from-red-500/10 to-red-600/20 border-red-500/30 hover:border-red-400/50',
      component: <SecurityLogsViewer />,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'settings',
      title: '⚙️ Настройки',
      description: 'Системные настройки и конфигурация платформы',
      icon: <Settings className="w-8 h-8" />,
      color: 'text-slate-400',
      bgColor: 'from-slate-500/10 to-slate-600/20 border-slate-500/30 hover:border-slate-400/50',
      component: <SystemSettingsManager />,
      roles: ['admin', 'system_admin']
    }
  ];

  const filteredModules = adminModules.filter(module => 
    module.roles.includes(userRole)
  );

  if (selectedModule) {
    const module = adminModules.find(m => m.id === selectedModule);
    if (module) {
      return (
        <Layout user={user} userRole={userRole} onSignOut={signOut}>
          <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
            <div className="max-w-7xl mx-auto">
              {/* Header модуля */}
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedModule(null)}
                      className="shrink-0"
                    >
                      ← Назад
                    </Button>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {module.title}
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-2 rounded-lg border border-green-500/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Активно</span>
                  </div>
                </div>
              </div>

              {/* Содержимое модуля */}
              <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
                {module.component}
              </div>
            </div>
          </div>
        </Layout>
      );
    }
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Главный заголовок */}
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-8 mb-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BackButton />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                    Административная панель
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Полное управление платформой и мониторинг системы
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Роль: {userRole}
                </Badge>
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-lg border border-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Система работает</span>
                </div>
              </div>
            </div>
          </div>

          {/* Предупреждение для новых админов */}
          <Card className="mb-8 p-6 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Важная информация!</h3>
                <p className="text-steel-300 mb-3">
                  Вы работаете с административной панелью. Все ваши действия логируются. 
                  Будьте осторожны при внесении изменений - они могут повлиять на работу всей платформы.
                </p>
                <p className="text-steel-400 text-sm">
                  Если у вас есть вопросы по использованию панели, обязательно прочитайте инструкцию ниже.
                </p>
              </div>
            </div>
          </Card>

          {/* Сетка модулей */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Инструкция - всегда первая */}
            <AdminInstructionsModal />
            
            {/* Остальные модули */}
            {filteredModules.map((module) => (
              <Card 
                key={module.id}
                className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br ${module.bgColor}`}
                onClick={() => setSelectedModule(module.id)}
              >
                <div className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors`}>
                    <div className={module.color}>
                      {module.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-steel-100 mb-2">{module.title}</h3>
                  <p className="text-steel-400 text-sm leading-relaxed">{module.description}</p>
                  
                  {/* Индикатор роли */}
                  <div className="mt-4 flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      {module.roles.includes('system_admin') ? 'Системный доступ' : 
                       module.roles.includes('admin') ? 'Админ доступ' :
                       module.roles.includes('moderator') ? 'Модераторы' : 'Поддержка'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Быстрая статистика */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-steel-400">Пользователи</p>
                  <p className="text-2xl font-bold text-steel-100">Loading...</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-sm text-steel-400">Активные заказы</p>
                  <p className="text-2xl font-bold text-steel-100">Loading...</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-purple-500/5 border-purple-500/20">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-sm text-steel-400">Транзакции</p>
                  <p className="text-2xl font-bold text-steel-100">Loading...</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-orange-500/5 border-orange-500/20">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-sm text-steel-400">Система</p>
                  <p className="text-lg font-bold text-green-400">Работает</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanelNew;