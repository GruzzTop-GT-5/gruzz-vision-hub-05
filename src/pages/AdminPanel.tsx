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
  Home,
  MessageSquare,
  Send
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
import { DeletedConversationsManager } from '@/components/admin/DeletedConversationsManager';
import { BroadcastMessagePanel } from '@/components/admin/BroadcastMessagePanel';
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
  | 'security'
  | 'deleted-chats'
  | 'broadcast';

interface NavigationItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Панель управления', icon: LayoutDashboard, description: 'Общая статистика и активность' },
  { id: 'broadcast', label: 'Рассылка сообщений', icon: Send, description: 'Массовая рассылка системных сообщений' },
  { id: 'users', label: 'Пользователи', icon: Users, description: 'Управление пользователями' },
  { id: 'orders', label: 'Заказы', icon: ShoppingCart, description: 'Управление заказами' },
  { id: 'transactions', label: 'Транзакции', icon: CreditCard, description: 'Финансовые операции' },
  { id: 'reviews', label: 'Отзывы', icon: Star, description: 'Модерация отзывов' },
  { id: 'ads', label: 'Объявления', icon: Megaphone, description: 'Модерация объявлений' },
  { id: 'support', label: 'Поддержка', icon: HelpCircle, description: 'Тикеты поддержки' },
  { id: 'deleted-chats', label: 'Удаленные чаты', icon: MessageSquare, description: 'Управление удаленными чатами' },
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
      case 'broadcast':
        return <BroadcastMessagePanel />;
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
      case 'deleted-chats':
        return <DeletedConversationsManager />;
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
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-gradient-to-b from-card via-card to-card/95 border-r border-border/50 backdrop-blur-xl transition-all duration-300 z-50 shadow-xl",
          sidebarOpen ? "w-72" : "w-20"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
          {sidebarOpen && (
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Админ Панель
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Управление системой</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto hover:bg-primary/10 transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5 overflow-y-auto h-[calc(100vh-88px)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const notificationCount = getNotificationCount(item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all relative group",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                    : "hover:bg-accent/50 hover:shadow-md hover:scale-[1.01]",
                  !sidebarOpen && "justify-center px-2"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center rounded-lg p-1.5",
                  isActive ? "bg-white/20" : "bg-primary/10 group-hover:bg-primary/15"
                )}>
                  <Icon className={cn("flex-shrink-0", sidebarOpen ? "h-5 w-5" : "h-6 w-6")} />
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-semibold truncate">{item.label}</span>
                      {notificationCount > 0 && (
                        <Badge 
                          variant={isActive ? "secondary" : "destructive"} 
                          className="ml-auto text-xs px-2 py-0.5 h-5 shadow-sm animate-pulse"
                        >
                          {notificationCount}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs opacity-70 truncate w-full mt-0.5">
                      {item.description}
                    </span>
                  </div>
                )}
                {!sidebarOpen && notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] shadow-lg animate-pulse"
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
          sidebarOpen ? "ml-72" : "ml-20"
        )}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              {(() => {
                const activeItem = navigationItems.find(item => item.id === activeSection);
                if (!activeItem) return null;
                const Icon = activeItem.icon;
                return (
                  <>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {activeItem.label}
                      </h1>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {activeItem.description}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center gap-3">
              {!notificationsLoading && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">Система активна</span>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <Home className="h-4 w-4" />
                На главную
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
