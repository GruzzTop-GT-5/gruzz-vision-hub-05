import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthForm } from '@/components/AuthForm';
import { RoleSelection } from '@/components/RoleSelection';
import { LegalFooter } from '@/components/LegalFooter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter, Calendar, User, Settings, Wrench, Truck, Package, Shield, Clock, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { CreateOrderModal } from '@/components/CreateOrderModal';

const Index = () => {
  const { user, userRole, needsRoleSelection, loading, signOut } = useAuth();
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
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-electric-400 to-primary bg-clip-text text-transparent animate-glow">
              GruzzTop
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 font-semibold">
              Сервис поиска надежных исполнителей
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Соединяем заказчиков с проверенными специалистами. Прозрачная оплата через платформу с фиксированными тарифами.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card hover:bg-accent/5 p-6 rounded-xl border border-border transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center ring-2 ring-green-500/20">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-center">Проверенные специалисты</h3>
              <p className="text-muted-foreground text-sm text-center">Все исполнители проходят модерацию</p>
            </div>
            
            <div className="bg-card hover:bg-accent/5 p-6 rounded-xl border border-border transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-center">Быстрые сделки</h3>
              <p className="text-muted-foreground text-sm text-center">Находите исполнителя за минуты</p>
            </div>
            
            <div className="bg-card hover:bg-accent/5 p-6 rounded-xl border border-border transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center ring-2 ring-blue-500/20">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-center">Фиксированные тарифы</h3>
              <p className="text-muted-foreground text-sm text-center">Прозрачная система оплаты</p>
            </div>
          </div>
        </div>


        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Создать объявление */}
          {user ? (
            <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10" onClick={() => setShowCreateOrder(true)}>
              <div className="p-8 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                    <Plus className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Создать заказ</h3>
                  <p className="text-muted-foreground text-sm">Разместите задание для исполнителей</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10" onClick={() => setShowAuth(true)}>
              <div className="p-8 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                    <Plus className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Создать заказ</h3>
                  <p className="text-muted-foreground text-sm">Разместите задание для исполнителей</p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Мои задания */}
          {user ? (
            <Link to="/orders">
              <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
                <div className="p-8 text-center space-y-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                      <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-green-500 transition-colors">Мои заказы</h3>
                    <p className="text-muted-foreground text-sm">Управление размещенными заказами</p>
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10" onClick={() => setShowAuth(true)}>
              <div className="p-8 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-green-500 transition-colors">Мои заказы</h3>
                  <p className="text-muted-foreground text-sm">Управление размещенными заказами</p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Найти работу */}
          {user ? (
            <Link to="/ads">
              <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10">
                <div className="p-8 text-center space-y-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                      <Search className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-orange-500 transition-colors">Найти работу</h3>
                    <p className="text-muted-foreground text-sm">Просмотр доступных заказов</p>
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10" onClick={() => setShowAuth(true)}>
              <div className="p-8 text-center space-y-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-orange-500 transition-colors">Найти работу</h3>
                  <p className="text-muted-foreground text-sm">Просмотр доступных заказов</p>
                </div>
              </div>
            </Card>
          )}
        </div>


        {/* Additional Information */}
        {user && (
          <div className="space-y-6">
            {/* Price Info Card */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <div className="p-6 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-3">Стоимость размещения</h3>
                <p className="text-lg text-foreground font-semibold mb-4">
                  Фиксированная стоимость, установленная платформой
                </p>
                <div className="flex items-center justify-center gap-2 py-3 px-6 bg-background/50 rounded-lg inline-flex">
                  <span className="text-2xl font-bold text-primary">1 GT</span>
                  <span className="text-xl text-muted-foreground">=</span>
                  <span className="text-2xl font-bold text-primary">1 рубль</span>
                </div>
              </div>
            </Card>

            {/* How it works */}
            <Card className="bg-card border-border">
              <div className="p-6 text-center space-y-6">
                <h3 className="text-2xl font-bold text-foreground">Как это работает?</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-primary/20">
                      <span className="text-2xl font-bold text-primary">1</span>
                    </div>
                    <h4 className="font-semibold text-foreground">Создайте заказ</h4>
                    <p className="text-sm text-muted-foreground">Опишите задачу, укажите бюджет и условия работы</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-green-500/20">
                      <span className="text-2xl font-bold text-green-500">2</span>
                    </div>
                    <h4 className="font-semibold text-foreground">Выберите исполнителя</h4>
                    <p className="text-sm text-muted-foreground">Получите отклики и выберите подходящего специалиста</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-2 ring-blue-500/20">
                      <span className="text-2xl font-bold text-blue-500">3</span>
                    </div>
                    <h4 className="font-semibold text-foreground">Получите результат</h4>
                    <p className="text-sm text-muted-foreground">Безопасная оплата после выполнения работы</p>
                  </div>
                </div>
              </div>
            </Card>
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

      {/* Service Modals */}
      <CreateOrderModal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        onOrderCreated={() => setShowCreateOrder(false)}
      />

      {/* Role Selection Modal */}
      {user && needsRoleSelection && (
        <RoleSelection
          isOpen={needsRoleSelection}
          onComplete={() => {
            // Reload user data after role selection
            window.location.reload();
          }}
        />
      )}
    </Layout>
  );
};

export default Index;
