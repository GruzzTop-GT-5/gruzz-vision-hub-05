import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Star,
  Megaphone,
  HelpCircle,
  Settings,
  Tag,
  Shield,
  FileText,
  Menu,
  X,
  Home
} from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { TransactionManagement } from '@/components/admin/TransactionManagement';
import { ReviewModerationQueue } from '@/components/admin/ReviewModerationQueue';
import { ContentModerationQueue } from '@/components/admin/ContentModerationQueue';
import { PromoCodeManagement } from '@/components/admin/PromoCodeManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { SystemSettingsManager } from '@/components/admin/SystemSettingsManager';
import { SecurityLogsViewer } from '@/components/admin/SecurityLogsViewer';
import { CategoriesManagement } from '@/components/CategoriesManagement';
import { AdminTicketManagement } from '@/components/AdminTicketManagement';
import { cn } from '@/lib/utils';

type AdminSection = 
  | 'dashboard'
  | 'users'
  | 'orders'
  | 'transactions'
  | 'reviews'
  | 'ads'
  | 'support'
  | 'categories'
  | 'promo-codes'
  | 'roles'
  | 'settings'
  | 'security';

interface NavigationItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Панель управления', icon: LayoutDashboard, description: 'Общая статистика и активность' },
  { id: 'users', label: 'Пользователи', icon: Users, description: 'Управление пользователями' },
  { id: 'orders', label: 'Заказы', icon: ShoppingCart, description: 'Управление заказами' },
  { id: 'transactions', label: 'Транзакции', icon: CreditCard, description: 'Финансовые операции' },
  { id: 'reviews', label: 'Отзывы', icon: Star, description: 'Модерация отзывов' },
  { id: 'ads', label: 'Объявления', icon: Megaphone, description: 'Модерация объявлений' },
  { id: 'support', label: 'Поддержка', icon: HelpCircle, description: 'Тикеты поддержки' },
  { id: 'categories', label: 'Категории', icon: Tag, description: 'Управление категориями' },
  { id: 'promo-codes', label: 'Промокоды', icon: Tag, description: 'Управление промокодами' },
  { id: 'roles', label: 'Роли', icon: Shield, description: 'Управление ролями' },
  { id: 'settings', label: 'Настройки', icon: Settings, description: 'Системные настройки' },
  { id: 'security', label: 'Безопасность', icon: FileText, description: 'Логи безопасности' }
];

export default function AdminPanel() {
  const { user, userRole, loading } = useAuth();
  const { counts, loading: notificationsLoading } = useAdminNotifications();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Маппинг секций к счетчикам
  const getNotificationCount = (sectionId: AdminSection): number => {
    switch (sectionId) {
      case 'users': return counts.users;
      case 'orders': return counts.orders;
      case 'transactions': return counts.transactions;
      case 'reviews': return counts.reviews;
      case 'ads': return counts.ads;
      case 'support': return counts.support;
      case 'security': return counts.security;
      default: return 0;
    }
  };

  const isAdmin = userRole && ['system_admin', 'admin', 'moderator'].includes(userRole);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'transactions':
        return <TransactionManagement />;
      case 'reviews':
        return <ReviewModerationQueue />;
      case 'ads':
        return <ContentModerationQueue />;
      case 'support':
        return <AdminTicketManagement />;
      case 'categories':
        return <CategoriesManagement />;
      case 'promo-codes':
        return <PromoCodeManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'settings':
        return <SystemSettingsManager />;
      case 'security':
        return <SecurityLogsViewer />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sidebarOpen && (
            <h2 className="font-semibold text-lg">Админ панель</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const notificationCount = getNotificationCount(item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent hover:text-accent-foreground",
                  !sidebarOpen && "justify-center"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", !sidebarOpen && "h-6 w-6")} />
                {sidebarOpen && (
                  <div className="flex flex-col items-start overflow-hidden flex-1">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium">{item.label}</span>
                      {notificationCount > 0 && (
                        <Badge 
                          variant={isActive ? "secondary" : "destructive"} 
                          className="ml-auto text-xs px-1.5 py-0.5 h-5"
                        >
                          {notificationCount}
                        </Badge>
                      )}
                    </div>
                    {isActive && (
                      <span className="text-xs opacity-80 truncate w-full">
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
                {!sidebarOpen && notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        <div className="p-6">
          {/* Page header */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const activeItem = navigationItems.find(item => item.id === activeSection);
                    if (!activeItem) return null;
                    const Icon = activeItem.icon;
                    return (
                      <>
                        <Icon className="h-6 w-6 text-primary" />
                        <div>
                          <div className="text-2xl">{activeItem.label}</div>
                          <div className="text-sm text-muted-foreground font-normal mt-1">
                            {activeItem.description}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  На главную
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Content */}
          <div className="space-y-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
