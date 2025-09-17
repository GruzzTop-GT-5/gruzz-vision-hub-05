import React from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from '@/components/BackButton';
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

export const AdminPanelNew = () => {
  const { user, userRole, loading, signOut } = useAuth();

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

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Красивый заголовок */}
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BackButton />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Административная панель
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Полное управление платформой и мониторинг системы
                  </p>
                </div>
              </div>
              
              {/* Статус системы */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-2 rounded-lg border border-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Система работает</span>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            {/* Первый ряд основных функций */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <TabsList className="bg-card/80 backdrop-blur border border-border/50 shadow-lg p-1 rounded-xl">
                  <TabsTrigger 
                    value="dashboard" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    📊 Дашборд
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    👥 Пользователи
                  </TabsTrigger>
                  <TabsTrigger 
                    value="roles" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🔐 Роли
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    📋 Заказы
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transactions" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    💳 Платежи
                  </TabsTrigger>
                </TabsList>
                
                <TabsList className="bg-card/80 backdrop-blur border border-border/50 shadow-lg p-1 rounded-xl">
                  <TabsTrigger 
                    value="categories" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🏷️ Категории
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    ⭐ Отзывы
                  </TabsTrigger>
                  <TabsTrigger 
                    value="support" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🎧 Поддержка
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bans" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🚫 Блокировки
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Второй ряд модерация и аналитика */}
              <div className="flex flex-wrap gap-3">
                <TabsList className="bg-card/80 backdrop-blur border border-border/50 shadow-lg p-1 rounded-xl">
                  <TabsTrigger 
                    value="moderation" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🛡️ Модерация
                  </TabsTrigger>
                  <TabsTrigger 
                    value="auto-rules" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🤖 Авто-правила
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    📈 Аналитика
                  </TabsTrigger>
                  <TabsTrigger 
                    value="performance" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    ⚡ Мониторинг
                  </TabsTrigger>
                </TabsList>
                
                <TabsList className="bg-card/80 backdrop-blur border border-border/50 shadow-lg p-1 rounded-xl">
                  <TabsTrigger 
                    value="notifications" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🔔 Уведомления
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    🔒 Безопасность
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                  >
                    ⚙️ Настройки
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Контент с красивым фоном */}
            <div className="bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 shadow-xl">
              <TabsContent value="dashboard">
                <AdminDashboard />
              </TabsContent>

              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              <TabsContent value="roles">
                <RoleManagement />
              </TabsContent>

              <TabsContent value="orders">
                <OrderManagement />
              </TabsContent>

              <TabsContent value="transactions">
                <TransactionManagement />
              </TabsContent>

              <TabsContent value="categories">
                <CategoriesManagement />
              </TabsContent>

              <TabsContent value="reviews">
                <AdminReviewModeration />
              </TabsContent>

              <TabsContent value="support">
                <AdminTicketManagement />
              </TabsContent>

              <TabsContent value="bans">
                <BanManagementSection />
              </TabsContent>

              <TabsContent value="moderation">
                <ContentModerationQueue />
              </TabsContent>

              <TabsContent value="auto-rules">
                <AutoModerationRules />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="performance">
                <PerformanceMonitor />
              </TabsContent>

              <TabsContent value="notifications">
                <NotificationCenter />
              </TabsContent>

              <TabsContent value="security">
                <SecurityLogsViewer />
              </TabsContent>

              <TabsContent value="settings">
                <SystemSettingsManager />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanelNew;