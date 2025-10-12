import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthForm } from '@/components/AuthForm';
import { LegalFooter } from '@/components/LegalFooter';
import { RoleSelection } from '@/components/RoleSelection';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter, Calendar, User, Settings, Wrench, Truck, Package, Shield, Clock, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  // Все хуки должны быть вызваны до любых условных return
  const { user, userRole, userType, userSubtype, loading, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Check if user needs to complete profile
  useEffect(() => {
    if (user && (!userType || !userSubtype)) {
      setShowRoleSelection(true);
    }
  }, [user, userType, userSubtype]);

  // Scroll to top when changing screens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showWelcome, showAuth]);

  const handleAuthSuccess = () => {
    setShowAuth(false);
    // RoleSelection will be shown automatically by the effect above
  };

  const handleBackToMain = () => {
    setShowAuth(false);
  };

  const handleRoleSelectionComplete = async () => {
    setShowRoleSelection(false);
    // Refresh auth context to get updated user data
    window.location.reload();
  };

  // Условные return только после всех хуков
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

  // Show role selection modal if user hasn't completed profile
  if (user && showRoleSelection) {
    return <RoleSelection isOpen={showRoleSelection} onComplete={handleRoleSelectionComplete} />;
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Кнопка "Назад к приветственному экрану" - только для незарегистрированных */}
        {!user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWelcome(true)}
            className="text-xs xs:text-sm hover:bg-primary/10"
          >
            ← Вернуться к приветственному экрану
          </Button>
        )}
        {/* Hero Section - Компактная версия для мобильных */}
        <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6 mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-primary via-electric-400 to-primary bg-clip-text text-transparent animate-glow leading-tight">
              GruzzTop
            </h1>
            <p className="text-base xs:text-lg sm:text-xl lg:text-2xl xl:text-3xl text-foreground/90 font-semibold px-3">
              Сервис поиска надежных исполнителей
            </p>
            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl lg:max-w-4xl mx-auto leading-relaxed px-3">
              Соединяем заказчиков с проверенными специалистами. Прозрачная оплата через платформу с фиксированными тарифами.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-4xl lg:max-w-5xl mx-auto px-2">
            <div className="bg-card/50 backdrop-blur-sm hover:bg-accent/5 p-4 sm:p-5 lg:p-6 rounded-xl border border-border/50 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-green-500/30">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-full flex items-center justify-center ring-2 ring-green-500/20">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1 text-center text-sm sm:text-base">Проверенные специалисты</h3>
              <p className="text-muted-foreground text-xs text-center leading-tight">Все исполнители проходят модерацию</p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm hover:bg-accent/5 p-4 sm:p-5 lg:p-6 rounded-xl border border-border/50 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/30">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1 text-center text-sm sm:text-base">Быстрые сделки</h3>
              <p className="text-muted-foreground text-xs text-center leading-tight">Находите исполнителя за минуты</p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm hover:bg-accent/5 p-4 sm:p-5 lg:p-6 rounded-xl border border-border/50 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-blue-500/30">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-full flex items-center justify-center ring-2 ring-blue-500/20">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1 text-center text-sm sm:text-base">Фиксированные тарифы</h3>
              <p className="text-muted-foreground text-xs text-center leading-tight">Прозрачная система оплаты</p>
            </div>
          </div>
        </div>


        {/* Main Navigation Cards - Компактная сетка */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          {/* Создать объявление */}
          {user ? (
            <Card className="group cursor-pointer overflow-hidden bg-gradient-to-br from-card to-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 backdrop-blur-sm" onClick={() => navigate('/create-order')}>
              <div className="p-5 sm:p-6 lg:p-7 text-center space-y-2 sm:space-y-3 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl group-hover:shadow-primary/50">
                    <Plus className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-primary-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Создать заказ</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-tight">Разместите задание для исполнителей</p>
                </div>
              </div>
            </Card>
          ) : null}
          
          {/* Мои задания */}
          {user ? (
            <Link to="/orders">
              <Card className="group cursor-pointer overflow-hidden bg-gradient-to-br from-card to-card/50 border-border hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 backdrop-blur-sm">
                <div className="p-5 sm:p-6 lg:p-7 text-center space-y-2 sm:space-y-3 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl group-hover:shadow-green-500/50">
                      <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground mb-1 group-hover:text-green-500 transition-colors">Мои заказы</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-tight">Управление размещенными заказами</p>
                  </div>
                </div>
              </Card>
            </Link>
          ) : null}
          
          {/* Найти работу */}
          {user ? (
            <Link to="/ads">
              <Card className="group cursor-pointer overflow-hidden bg-gradient-to-br from-card to-card/50 border-border hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 backdrop-blur-sm">
                <div className="p-5 sm:p-6 lg:p-7 text-center space-y-2 sm:space-y-3 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl group-hover:shadow-orange-500/50">
                      <Search className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground mb-1 group-hover:text-orange-500 transition-colors">Найти работу</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-tight">Просмотр доступных заказов</p>
                  </div>
                </div>
              </Card>
            </Link>
          ) : null}
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

            {/* How it works - Адаптивная сетка */}
            <Card className="bg-card border-border">
              <div className="p-4 sm:p-6 lg:p-8 xl:p-10 3xl:p-12 text-center space-y-4 sm:space-y-6 lg:space-y-8">
                <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl font-bold text-foreground">Как это работает?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
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

      {/* Service Modals - removed, redirecting to /create-order page */}
    </Layout>
  );
};

export default Index;
