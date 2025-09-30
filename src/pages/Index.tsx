import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthForm } from '@/components/AuthForm';
import { LegalFooter } from '@/components/LegalFooter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter, Calendar, User, Settings, Wrench, Truck, Package, Shield, Clock, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { CreateOrderModal } from '@/components/CreateOrderModal';

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const handleBackToMain = () => {
    setShowAuth(false);
  };

  if (loading) {
    return (
      <AnimatedBackground className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </AnimatedBackground>
    );
  }

  
  // Показываем приветственный экран при первом посещении
  if (showWelcome && !user) {
    return (
      <WelcomeScreen 
        onGetStarted={() => setShowWelcome(false)} 
      />
    );
  }

  if (showAuth) {
    return <AuthForm onSuccess={handleAuthSuccess} onBack={handleBackToMain} />;
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="p-4 space-y-6">
        {/* Показать кнопку "Войти" если пользователь не авторизован */}
        {!user && (
          <div className="text-center mb-6">
            <Link to="/auth">
              <Button className="btn-3d px-8 py-3">
                <User className="w-4 h-4 mr-2" />
                Войти в аккаунт
              </Button>
            </Link>
          </div>
        )}

        {/* Показать админ панель если пользователь администратор */}
        {user && userRole && ['admin', 'system_admin', 'moderator', 'support'].includes(userRole) && (
          <div className="text-center mb-6">
            <Link to="/admin">
              <Button className="btn-3d px-8 py-3 bg-gradient-to-r from-red-500 to-red-600">
                <Settings className="w-4 h-4 mr-2" />
                Административная панель
              </Button>
            </Link>
          </div>
        )}
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-glow bg-gradient-to-r from-primary to-electric-400 bg-clip-text text-transparent">
              GruzzTop
            </h1>
            <p className="text-xl text-steel-200 font-medium">
              Сервис поиска надежных исполнителей
            </p>
            <p className="text-steel-400 max-w-2xl mx-auto">
              Мы соединяем заказчиков с проверенными специалистами для выполнения различных задач. 
              Все платежи проходят через нашу платформу с фиксированными тарифами для безопасности сделок.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-sm">
            <div className="bg-steel-800/50 p-4 rounded-lg border border-steel-600">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <h3 className="font-semibold text-steel-100 mb-1">Проверенные исполнители</h3>
              <p className="text-steel-400">Все специалисты проходят модерацию</p>
            </div>
            
            <div className="bg-steel-800/50 p-4 rounded-lg border border-steel-600">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <h3 className="font-semibold text-steel-100 mb-1">Фиксированные тарифы</h3>
              <p className="text-steel-400">Прозрачная система оплаты</p>
            </div>
            
            <div className="bg-steel-800/50 p-4 rounded-lg border border-steel-600">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-steel-100 mb-1">Быстрый поиск</h3>
              <p className="text-steel-400">Найдите исполнителя за минуты</p>
            </div>
          </div>
        </div>


        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Создать объявление */}
          {user ? (
            <Card className="card-steel group hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => setShowCreateOrder(true)}>
              <div className="p-6 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-electric-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-8 h-8 text-steel-900" />
                  </div>
                  <h3 className="text-xl font-bold text-steel-100 mb-2">Создать заказ</h3>
                  <p className="text-steel-400">Опубликуйте задание и найдите исполнителей</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="card-steel group hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => setShowAuth(true)}>
              <div className="p-6 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-electric-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-8 h-8 text-steel-900" />
                  </div>
                  <h3 className="text-xl font-bold text-steel-100 mb-2">Создать заказ</h3>
                  <p className="text-steel-400">Опубликуйте задание и найдите исполнителей</p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Мои задания */}
          {user ? (
            <Link to="/orders">
              <Card className="card-steel group hover:border-green-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="p-6 text-center space-y-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="w-8 h-8 text-steel-900" />
                    </div>
                    <h3 className="text-xl font-bold text-steel-100 mb-2">Мои заказы</h3>
                    <p className="text-steel-400">Управляйте размещенными заказами</p>
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="card-steel group hover:border-green-500/50 transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => setShowAuth(true)}>
              <div className="p-6 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-8 h-8 text-steel-900" />
                  </div>
                  <h3 className="text-xl font-bold text-steel-100 mb-2">Мои заказы</h3>
                  <p className="text-steel-400">Управляйте размещенными заказами</p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Найти работу */}
          {user ? (
            <Link to="/ads">
              <Card className="card-steel group hover:border-orange-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="p-6 text-center space-y-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Search className="w-8 h-8 text-steel-900" />
                    </div>
                    <h3 className="text-xl font-bold text-steel-100 mb-2">Найти работу</h3>
                    <p className="text-steel-400">Просматривайте доступные заказы</p>
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="card-steel group hover:border-orange-500/50 transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => setShowAuth(true)}>
              <div className="p-6 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Search className="w-8 h-8 text-steel-900" />
                  </div>
                  <h3 className="text-xl font-bold text-steel-100 mb-2">Найти работу</h3>
                  <p className="text-steel-400">Просматривайте доступные заказы</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Additional Information */}
        {user && (
          <Card className="card-steel p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-steel-100">Как это работает?</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-semibold text-steel-100">Создайте заказ</h4>
                  <p className="text-sm text-steel-400">Опишите задачу, укажите бюджет и сроки выполнения</p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl font-bold text-green-400">2</span>
                  </div>
                  <h4 className="font-semibold text-steel-100">Выберите исполнителя</h4>
                  <p className="text-sm text-steel-400">Получите отклики и выберите подходящего специалиста</p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl font-bold text-blue-400">3</span>
                  </div>
                  <h4 className="font-semibold text-steel-100">Получите результат</h4>
                  <p className="text-sm text-steel-400">Безопасная оплата после выполнения работы</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Authentication prompt for non-logged users */}
        {!user && (
          <Card className="card-steel p-6 text-center">
            <h2 className="text-xl font-bold text-steel-100 mb-3">Войдите в систему</h2>
            <p className="text-steel-400 mb-4">Для размещения заданий и откликов</p>
            <Button 
              className="btn-3d"
              onClick={() => setShowAuth(true)}
            >
              Войти / Регистрация
            </Button>
          </Card>
        )}
        
        {/* Legal Footer */}
        <LegalFooter />
      </div>

      {/* Service Modals */}
      <CreateOrderModal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        onOrderCreated={() => setShowCreateOrder(false)}
      />
    </Layout>
  );
};

export default Index;
