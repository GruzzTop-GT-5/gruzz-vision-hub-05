import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Menu, X, User as UserIcon, ShoppingBag, CreditCard, History, MessageCircle, FileText, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  isAdmin?: boolean;
}

export const Layout = ({ children, user, isAdmin = false }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuItems = [
    { icon: UserIcon, label: 'Профиль', href: '/profile' },
    { icon: ShoppingBag, label: 'Мои заказы', href: '/orders' },
    { icon: CreditCard, label: 'Баланс + Пополнение', href: '/balance' },
    { icon: History, label: 'История заказов', href: '/history' },
    { icon: MessageCircle, label: 'Поддержка', href: '/support' },
    { icon: FileText, label: 'Политика приложения', href: '/policy' },
  ];

  // Add admin panel for admin users
  if (isAdmin) {
    menuItems.unshift({ icon: Settings, label: 'Админ панель', href: '/admin' });
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between p-4 border-b border-steel-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-electric-600 rounded-lg flex items-center justify-center">
            <span className="text-steel-900 font-bold text-lg">GT</span>
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
                  <p className="text-steel-100 font-medium">{user.email}</p>
                  {isAdmin && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
                      Администратор
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center space-x-3 p-3 rounded-lg text-steel-100 hover:bg-steel-700 transition-colors duration-200 group"
                onClick={toggleMenu}
              >
                <item.icon className="w-5 h-5 text-steel-400 group-hover:text-primary transition-colors" />
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </nav>

          {/* Logout Button */}
          {user && (
            <div className="mt-8 pt-6 border-t border-steel-600">
              <button
                className="w-full p-3 text-left text-steel-300 hover:text-red-400 transition-colors duration-200"
                onClick={toggleMenu}
              >
                Выйти из аккаунта
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
};