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
import { CategoriesManagement } from '@/components/CategoriesManagement';
import { AdminReviewModeration } from '@/components/AdminReviewModeration';
import { AdminTicketManagement } from '@/components/AdminTicketManagement';
import { BanManagementSection } from '@/components/BanManagementSection';
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <BackButton />
            <h1 className="text-3xl font-bold text-steel-100">
              Административная панель
            </h1>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-9 bg-steel-800">
              <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="roles">Роли</TabsTrigger>
              <TabsTrigger value="orders">Заказы</TabsTrigger>
              <TabsTrigger value="transactions">Платежи</TabsTrigger>
              <TabsTrigger value="categories">Категории</TabsTrigger>
              <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              <TabsTrigger value="support">Поддержка</TabsTrigger>
              <TabsTrigger value="bans">Блокировки</TabsTrigger>
            </TabsList>

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
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanelNew;