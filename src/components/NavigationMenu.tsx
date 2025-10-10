import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Menu,
  Home,
  User,
  Package,
  CreditCard,
  MessageSquare,
  Star,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Users,
  Headphones,
  Bell,
  FileText,
  Zap,
  Truck,
  Activity,
  Lock,
  Cog,
  Search,
  Plus,
  Eye,
  CheckCircle
} from 'lucide-react';

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
  description?: string;
  adminOnly?: boolean;
  roles?: string[];
}

const navigationSections = {
  work: [
    {
      id: 'home',
      title: 'Главная',
      icon: <Home className="w-5 h-5" />,
      path: '/',
      description: 'Главная страница платформы'
    },
    {
      id: 'available-orders',
      title: 'Найти работу',
      icon: <Search className="w-5 h-5" />,
      path: '/available-orders',
      description: 'Доступные задания и заказы'
    },
    {
      id: 'create-order',
      title: 'Найти исполнителя',
      icon: <Plus className="w-5 h-5" />,
      path: '/create-order',
      description: 'Разместить задание для специалистов'
    },
    {
      id: 'orders',
      title: 'Мои задания',
      icon: <Package className="w-5 h-5" />,
      path: '/orders',
      description: 'Активные и завершенные задания'
    }
  ],
  equipment: [
    {
      id: 'special-equipment',
      title: 'Спецтехника',
      icon: <Truck className="w-5 h-5" />,
      path: '/special-equipment',
      description: 'Аренда компрессора и другой техники'
    }
  ],
  services: [
    {
      id: 'ads',
      title: 'Услуги специалистов',
      icon: <FileText className="w-5 h-5" />,
      path: '/ads',
      description: 'Каталог услуг и мастеров'
    },
    {
      id: 'my-ads',
      title: 'Мои услуги',
      icon: <Eye className="w-5 h-5" />,
      path: '/my-ads',
      description: 'Мои объявления о услугах'
    },
    {
      id: 'create-ad',
      title: 'Разместить услугу',
      icon: <Plus className="w-5 h-5" />,
      path: '/create-ad',
      description: 'Добавить свою услугу'
    },
    {
      id: 'chat',
      title: 'Сообщения',
      icon: <MessageSquare className="w-5 h-5" />,
      path: '/chat',
      description: 'Переписка с заказчиками',
      badge: 3
    }
  ],
  profile: [
    {
      id: 'profile',
      title: 'Профиль',
      icon: <User className="w-5 h-5" />,
      path: '/profile',
      description: 'Личные данные'
    },
    {
      id: 'balance',
      title: 'Баланс',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/balance',
      description: 'Пополнение и вывод'
    },
    {
      id: 'history',
      title: 'История',
      icon: <Activity className="w-5 h-5" />,
      path: '/history',
      description: 'История операций'
    }
  ],
  admin: [
    {
      id: 'admin-panel',
      title: 'Админ-панель',
      icon: <Shield className="w-5 h-5" />,
      path: '/admin',
      description: 'Управление системой',
      adminOnly: true,
      roles: ['admin', 'system_admin', 'moderator', 'support']
    },
    {
      id: 'users-management',
      title: 'Пользователи',
      icon: <Users className="w-5 h-5" />,
      path: '/admin?tab=users',
      description: 'Управление пользователями',
      adminOnly: true,
      roles: ['admin', 'system_admin', 'moderator']
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/admin?tab=analytics',
      description: 'Статистика и отчеты',
      adminOnly: true,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'support-management',
      title: 'Поддержка',
      icon: <Headphones className="w-5 h-5" />,
      path: '/admin?tab=support',
      description: 'Тикеты поддержки',
      adminOnly: true,
      roles: ['admin', 'system_admin', 'support']
    },
    {
      id: 'notifications',
      title: 'Уведомления',
      icon: <Bell className="w-5 h-5" />,
      path: '/admin?tab=notifications',
      description: 'Управление уведомлениями',
      adminOnly: true,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'performance',
      title: 'Мониторинг',
      icon: <Zap className="w-5 h-5" />,
      path: '/admin?tab=performance',
      description: 'Производительность системы',
      adminOnly: true,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'security',
      title: 'Безопасность',
      icon: <Lock className="w-5 h-5" />,
      path: '/admin?tab=security',
      description: 'Логи безопасности',
      adminOnly: true,
      roles: ['admin', 'system_admin']
    },
    {
      id: 'settings',
      title: 'Настройки',
      icon: <Cog className="w-5 h-5" />,
      path: '/admin?tab=settings',
      description: 'Системные настройки',
      adminOnly: true,
      roles: ['admin', 'system_admin']
    }
  ],
  other: [
    {
      id: 'rules',
      title: 'Правила',
      icon: <CheckCircle className="w-5 h-5" />,
      path: '/rules',
      description: 'Правила платформы'
    },
    {
      id: 'support',
      title: 'Поддержка',
      icon: <Headphones className="w-5 h-5" />,
      path: '/chat',
      description: 'Связаться с поддержкой'
    }
  ]
};

export const NavigationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userRole, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  const isAdminUser = userRole && ['admin', 'system_admin', 'moderator', 'support'].includes(userRole);

  const NavigationSection = ({ title, items, showSeparator = true }: {
    title: string;
    items: NavigationItem[];
    showSeparator?: boolean;
  }) => (
    <>
      <div className="px-3 py-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="space-y-1">
        {items
          .filter(item => !item.adminOnly || (item.adminOnly && isAdminUser))
          .filter(item => !item.roles || (item.roles && userRole && item.roles.includes(userRole)))
          .map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-left"
              onClick={() => handleNavigate(item.path)}
            >
              <div className="flex items-center gap-3 w-full">
                {item.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </Button>
          ))}
      </div>
      {showSeparator && <Separator className="my-4" />}
    </>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="text-left">Навигация</SheetTitle>
            <SheetDescription className="text-left">
              Быстрый доступ ко всем функциям платформы
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-4">
              {/* Профиль пользователя */}
              {user && (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 mx-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.user_metadata?.display_name || user.phone || 'Пользователь'}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {userRole}
                          </Badge>
                          {isAdminUser && (
                            <Badge variant="default" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Админ
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Основные разделы */}
              <NavigationSection title="Работа" items={navigationSections.work} />
              
              {/* Спецтехника - отдельная секция */}
              <NavigationSection title="Спецтехника" items={navigationSections.equipment} />
              
              <NavigationSection title="Услуги" items={navigationSections.services} />
              <NavigationSection title="Профиль" items={navigationSections.profile} />
              
              {/* Админ-панель (только для администраторов) */}
              {isAdminUser && (
                <NavigationSection title="Администрирование" items={navigationSections.admin} />
              )}
              
              <NavigationSection 
                title="Прочее" 
                items={navigationSections.other} 
                showSeparator={false} 
              />
            </div>
          </ScrollArea>

          {/* Кнопка выхода */}
          {user && (
            <div className="p-6 pt-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};