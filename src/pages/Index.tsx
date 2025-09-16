import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthForm } from '@/components/AuthForm';
import { LegalFooter } from '@/components/LegalFooter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user) {
      setShowWelcome(false);
      setShowAuth(false);
    } else {
      // When user logs out, show welcome screen
      setShowWelcome(true);
      setShowAuth(false);
    }
  }, [user]);

  const handleGetStarted = () => {
    setShowWelcome(false);
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const handleBackToWelcome = () => {
    setShowAuth(false);
    setShowWelcome(true);
  };

  if (loading) {
    return (
      <AnimatedBackground className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </AnimatedBackground>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  if (showAuth) {
    return <AuthForm onSuccess={handleAuthSuccess} onBack={handleBackToWelcome} />;
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="p-4 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-glow">GruzzTop</h1>
          <p className="text-steel-300">Платформа для поиска грузчиков и разнорабочих</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/orders">
            <Button className="btn-3d p-6 h-auto flex-col space-y-2 w-full">
              <User className="w-8 h-8" />
              <div>
                <div className="font-bold">Мои заказы</div>
                <div className="text-sm opacity-70">Созданные мной</div>
              </div>
            </Button>
          </Link>
          <Link to="/available-orders">
            <Button className="btn-3d p-6 h-auto flex-col space-y-2 w-full">
              <Search className="w-8 h-8" />
              <div>
                <div className="font-bold">Найти работу</div>
                <div className="text-sm opacity-70">Доступные заказы</div>
              </div>
            </Button>
          </Link>
          <Link to="/ads">
            <Button className="btn-3d p-6 h-auto flex-col space-y-2 w-full">
              <Plus className="w-8 h-8" />
              <div>
                <div className="font-bold">Мое объявление</div>
                <div className="text-sm opacity-70">Разместить резюме</div>
              </div>
            </Button>
          </Link>
        </div>

        {/* Information Cards */}
        {user && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="card-steel p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-100 mb-1">Мои заказы</h3>
                    <p className="text-sm text-steel-400 mb-2">Заказы которые я создал</p>
                    <p className="text-xs text-steel-500">Создавайте заказы → Получайте отклики → Выбирайте исполнителей</p>
                  </div>
                </div>
              </Card>
              <Card className="card-steel p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-100 mb-1">Поиск работы</h3>
                    <p className="text-sm text-steel-400 mb-2">Доступные заказы от клиентов</p>
                    <p className="text-xs text-steel-500">Просматривайте заказы → Откликайтесь → Получайте работу</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="grid md:grid-cols-1 gap-4">
              <Card className="card-steel p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-100 mb-1">Объявления</h3>
                    <p className="text-sm text-steel-400 mb-2">Разместите свое резюме</p>
                    <p className="text-xs text-steel-500">Создайте объявление → Получайте заказы → Работайте с клиентами</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
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
    </Layout>
  );
};

export default Index;
