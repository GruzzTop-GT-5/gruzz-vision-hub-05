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
            {/* Навигация по вкладкам */}
            <div className="overflow-x-auto">
              <TabsList className="bg-card/80 backdrop-blur border border-border/50 shadow-lg p-1 rounded-xl inline-flex">
                <TabsTrigger value="dashboard" className="px-4 py-2 rounded-lg font-medium">
                  📊 Дашборд
                </TabsTrigger>
                <TabsTrigger value="users" className="px-4 py-2 rounded-lg font-medium">
                  👥 Пользователи
                </TabsTrigger>
                <TabsTrigger value="roles" className="px-4 py-2 rounded-lg font-medium">
                  🔐 Роли
                </TabsTrigger>
                <TabsTrigger value="orders" className="px-4 py-2 rounded-lg font-medium">
                  📋 Заказы
                </TabsTrigger>
                <TabsTrigger value="transactions" className="px-4 py-2 rounded-lg font-medium">
                  💳 Транзакции
                </TabsTrigger>
                <TabsTrigger value="analytics" className="px-4 py-2 rounded-lg font-medium">
                  📈 Аналитика
                </TabsTrigger>
                <TabsTrigger value="moderation" className="px-4 py-2 rounded-lg font-medium">
                  🛡️ Модерация
                </TabsTrigger>
                <TabsTrigger value="support" className="px-4 py-2 rounded-lg font-medium">
                  🎧 Поддержка
                </TabsTrigger>
                <TabsTrigger value="performance" className="px-4 py-2 rounded-lg font-medium">
                  ⚡ Производительность
                </TabsTrigger>
                <TabsTrigger value="notifications" className="px-4 py-2 rounded-lg font-medium">
                  🔔 Уведомления
                </TabsTrigger>
                <TabsTrigger value="security" className="px-4 py-2 rounded-lg font-medium">
                  🔒 Безопасность
                </TabsTrigger>
                <TabsTrigger value="settings" className="px-4 py-2 rounded-lg font-medium">
                  ⚙️ Настройки
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Содержимое вкладок */}
            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
              <TabsContent value="dashboard" className="space-y-6 m-0">
                <AdminDashboard />
              </TabsContent>

              <TabsContent value="users" className="space-y-6 m-0">
                <UserManagement />
              </TabsContent>

              <TabsContent value="roles" className="space-y-6 m-0">
                <RoleManagement />
              </TabsContent>

              <TabsContent value="orders" className="space-y-6 m-0">
                <OrderManagement />
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6 m-0">
                <TransactionManagement />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 m-0">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="moderation" className="space-y-6 m-0">
                <div className="space-y-6">
                  <ContentModerationQueue />
                  <AutoModerationRules />
                  <AdminReviewModeration />
                  <BanManagementSection />
                  <CategoriesManagement />
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-6 m-0">
                <AdminTicketManagement />
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 m-0">
                <PerformanceMonitor />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 m-0">
                <NotificationCenter />
              </TabsContent>

              <TabsContent value="security" className="space-y-6 m-0">
                <SecurityLogsViewer />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 m-0">
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