import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Menu, X, User as UserIcon, ShoppingBag, CreditCard, History, MessageCircle, FileText, Settings, LogOut, Megaphone, Search, Plus, Wallet, Package, Bell, BarChart3, Users, Shield, Activity, Lock, Truck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TelegramLayout } from './TelegramLayout';
import { useTelegram } from '@/hooks/useTelegram';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo-round.png';
import { CONSTANTS } from '@/config';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  userRole?: string | null;
  onSignOut?: () => void;
}

export const Layout = ({ children, user, userRole, onSignOut }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ avatar_url?: string; telegram_photo_url?: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isInTelegram, hapticFeedback } = useTelegram();
  const { unreadCount } = useNotifications();

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, telegram_photo_url')
          .eq('id', user.id)
          .maybeSingle();
        setProfileData(data);
      };
      fetchProfile();
    }
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isInTelegram) {
      hapticFeedback?.selectionChanged();
    }
  };

  const handleMenuClick = () => {
    if (isInTelegram) {
      hapticFeedback?.selectionChanged();
    }
    setIsMenuOpen(false);
  };

  // Check if user has admin privileges
  const isStaff = userRole && ['system_admin', 'admin', 'moderator', 'support'].includes(userRole);
  const isAdmin = userRole && ['system_admin', 'admin'].includes(userRole);

  const menuItems = [
    { icon: UserIcon, label: 'Профиль', href: '/profile' },
    { icon: Package, label: 'Мои задания', href: '/orders' },
    { icon: Search, label: 'Найти исполнителей', href: '/available-orders' },
    { icon: Megaphone, label: 'Доска объявлений', href: '/ads' },
    { icon: Truck, label: 'Спецтехника', href: '/special-equipment' },
    { icon: Plus, label: 'Мои услуги', href: '/my-ads' },
    { icon: MessageCircle, label: 'Сообщения', href: '/chat-system' },
    { icon: CreditCard, label: 'Баланс', href: '/balance' },
    { icon: History, label: 'История операций', href: '/history' },
    { icon: FileText, label: 'Правила платформы', href: '/rules' },
  ];

  // Add admin panel for staff users
  if (isStaff) {
    menuItems.unshift({ icon: Settings, label: 'Панель управления', href: '/admin' });
  }

  // Role display mapping
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'system_admin': return 'Системный администратор';
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      case 'support': return 'Поддержка';
      default: return 'Пользователь';
    }
  };

  return (
    <TelegramLayout>
      <AnimatedBackground className="min-h-screen">
      {/* Header - Адаптивный для всех устройств */}
      <header className="relative z-30 flex items-center justify-between p-3 sm:p-4 md:p-5 lg:p-6 3xl:p-8 border-b border-steel-600">
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 3xl:w-20 3xl:h-20 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary to-electric-600">
            <img src={logoImage} alt="GruzzTop Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl 3xl:text-5xl font-bold text-glow">GruzzTop</h1>
              {CONSTANTS.IS_BETA && (
                <span className="px-1.5 py-0.5 text-[8px] sm:text-[10px] md:text-xs font-semibold bg-primary/20 text-primary-foreground rounded border border-primary/30">
                  BETA
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm 3xl:text-base text-steel-300">v{CONSTANTS.APP_VERSION}</p>
          </div>
        </Link>

        {/* Hamburger Menu */}
        <button
          onClick={toggleMenu}
          className={`relative z-50 w-8 h-8 flex flex-col justify-center items-center space-y-1 ${
            isMenuOpen ? 'hamburger-open' : ''
          }`}
          aria-label="Toggle menu"
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm" onClick={toggleMenu} />
      )}

      {/* Slide-down Menu - Адаптивная ширина */}
      <div
        className={`fixed top-0 right-0 z-40 w-full sm:w-96 md:w-[420px] lg:w-[480px] xl:w-[520px] 3xl:w-[640px] max-w-full h-screen card-steel-menu transition-transform duration-300 overflow-y-auto ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className="sticky top-0 z-50 bg-steel-800/95 backdrop-blur border-b border-steel-600 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-steel-100">Меню</h2>
          <button
            onClick={toggleMenu}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-steel-700 transition-colors"
            aria-label="Закрыть меню"
          >
            <X className="w-6 h-6 text-steel-300" />
          </button>
        </div>

        <div className="p-6 pb-24">
          {/* User Info */}
          {user && (
            <div className="mb-8 pb-6 border-b border-steel-600">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  {profileData?.avatar_url ? (
                    <AvatarImage src={profileData.avatar_url} alt="Profile" />
                  ) : profileData?.telegram_photo_url ? (
                    <AvatarImage src={profileData.telegram_photo_url} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600">
                      <UserIcon className="w-6 h-6 text-steel-900" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-steel-100 font-medium">Мой аккаунт</p>
                  {userRole && userRole !== 'user' && (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                      userRole === 'system_admin' 
                        ? 'text-red-400 bg-red-400/10 border-red-400/20'
                        : userRole === 'admin'
                        ? 'text-primary bg-primary/10 border-primary/20'
                        : userRole === 'moderator'
                        ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                        : 'text-green-400 bg-green-400/10 border-green-400/20'
                    }`}>
                      {getRoleDisplayName(userRole)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="flex items-center justify-between p-3 rounded-lg text-steel-100 hover:bg-steel-700 transition-colors duration-200 group"
                onClick={handleMenuClick}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5 text-steel-400 group-hover:text-primary transition-colors" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {/* Notification badge only for chat */}
                {(item.href === '/chat-system' && unreadCount > 0) && (
                  <div className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </Link>
            ))}
          </nav>

          {/* Login/Logout Button */}
          <div className="mt-8 pt-6 border-t border-steel-600">
            {user ? (
              <button
                className="w-full flex items-center space-x-3 p-3 text-left text-steel-300 hover:text-red-400 hover:bg-steel-700 rounded-lg transition-colors duration-200"
                onClick={() => {
                  onSignOut?.();
                  toggleMenu();
                }}
              >
                <LogOut className="w-5 h-5" />
                <span>Выйти из аккаунта</span>
              </button>
            ) : (
              <Link
                to="/auth"
                className="w-full flex items-center space-x-3 p-3 text-left text-steel-300 hover:text-primary hover:bg-steel-700 rounded-lg transition-colors duration-200"
                onClick={toggleMenu}
              >
                <UserIcon className="w-5 h-5" />
                <span>Войти в аккаунт</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Адаптивные отступы */}
      <main className="relative z-10 pb-20 sm:pb-6 lg:pb-8 xl:pb-10 3xl:pb-12 max-w-[2400px] mx-auto">
        {children}
      </main>
      
      {/* Mobile bottom navigation for Telegram - Улучшенная адаптивность */}
      {isInTelegram && (
        <nav className="fixed bottom-0 left-0 right-0 bg-steel-800/95 backdrop-blur border-t border-steel-600 md:hidden z-50 safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2 px-1">
            <Link 
              to="/ads" 
              onClick={handleMenuClick}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                location.pathname === '/ads' ? 'text-primary' : 'text-steel-400'
              }`}
            >
              <Search className="h-5 w-5 mb-1" />
              Работа
            </Link>
            <Link 
              to="/create-ad" 
              onClick={handleMenuClick}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                location.pathname === '/create-ad' ? 'text-primary' : 'text-steel-400'
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              Услуга
            </Link>
            <Link 
              to="/chat-system" 
              onClick={handleMenuClick}
              className={`relative flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                location.pathname === '/chat-system' ? 'text-primary' : 'text-steel-400'
              }`}
            >
              <MessageCircle className="h-5 w-5 mb-1" />
              Сообщения
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </Link>
            <Link 
              to="/balance" 
              onClick={handleMenuClick}
              className={`relative flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                location.pathname === '/balance' ? 'text-primary' : 'text-steel-400'
              }`}
            >
              <Wallet className="h-5 w-5 mb-1" />
              Баланс
            </Link>
          </div>
        </nav>
      )}
    </AnimatedBackground>
    </TelegramLayout>
  );
};