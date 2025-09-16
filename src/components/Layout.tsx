import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Menu, X, User as UserIcon, ShoppingBag, CreditCard, History, MessageCircle, FileText, Settings, LogOut, Megaphone, Search, Plus, Wallet } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Link, useLocation } from 'react-router-dom';
import { TelegramLayout } from './TelegramLayout';
import { useTelegram } from '@/hooks/useTelegram';
import logoImage from '@/assets/logo-round.png';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  userRole?: string | null;
  onSignOut?: () => void;
}

export const Layout = ({ children, user, userRole, onSignOut }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isInTelegram, hapticFeedback } = useTelegram();

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
    { icon: Megaphone, label: 'Доска объявлений', href: '/ads' },
    { icon: MessageCircle, label: 'Чаты и поддержка', href: '/chat-system' },
    { icon: UserIcon, label: 'Профиль', href: '/profile' },
    { icon: ShoppingBag, label: 'Мои заказы', href: '/orders' },
    { icon: CreditCard, label: 'Баланс + Пополнение', href: '/balance' },
    { icon: History, label: 'История работ', href: '/history' },
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
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between p-4 border-b border-steel-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary to-electric-600">
            <img src={logoImage} alt="GruzzTop Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-glow">GruzzTop</h1>
            <p className="text-xs text-steel-300">GT-V5</p>
          </div>
        </div>

        {/* Hamburger Menu */}
        <button
          onClick={toggleMenu}
          className={`relative z-50 w-8 h-8 flex flex-col justify-center items-center space-y-1 transition-all duration-300 ${
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

      {/* Slide-down Menu */}
      <div
        className={`fixed top-0 right-0 z-40 w-80 max-w-full h-screen card-steel transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 pt-20">
          {/* User Info */}
          {user && (
            <div className="mb-8 pb-6 border-b border-steel-600">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-steel-900" />
                </div>
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
                className="flex items-center space-x-3 p-3 rounded-lg text-steel-100 hover:bg-steel-700 transition-colors duration-200 group"
                onClick={handleMenuClick}
              >
                <item.icon className="w-5 h-5 text-steel-400 group-hover:text-primary transition-colors" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          {user && (
            <div className="mt-8 pt-6 border-t border-steel-600">
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
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
      
      {/* Mobile bottom navigation for Telegram */}
      {isInTelegram && (
        <nav className="fixed bottom-0 left-0 right-0 bg-steel-800/95 backdrop-blur border-t border-steel-600 md:hidden z-50">
          <div className="flex items-center justify-around py-2">
            <Link 
              to="/ads" 
              onClick={handleMenuClick}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                location.pathname === '/ads' ? 'text-primary' : 'text-steel-400'
              }`}
            >
              <Search className="h-5 w-5 mb-1" />
              Объявления
            </Link>
            <Link 
              to="/create-ad" 
              onClick={handleMenuClick}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                location.pathname === '/create-ad' ? 'text-primary' : 'text-steel-400'
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              Создать
            </Link>
            <Link 
              to="/chat-system" 
              onClick={handleMenuClick}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                location.pathname === '/chat-system' ? 'text-primary' : 'text-steel-400'
              }`}
            >
              <MessageCircle className="h-5 w-5 mb-1" />
              Чаты
            </Link>
            <Link 
              to="/balance" 
              onClick={handleMenuClick}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
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