import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user) {
      setShowWelcome(false);
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
          <h1 className="text-3xl font-bold text-glow">Поиск работы и исполнителей</h1>
          <p className="text-steel-300">Простая платформа для поиска людей и заработка</p>
        </div>

        {/* Search and Filter Bar */}
        <Card className="card-steel p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Поиск вакансий или исполнителей..."
                className="w-full pl-10 pr-4 py-3 input-steel rounded-lg"
              />
            </div>
            <Button className="btn-3d px-6">
              <Filter className="w-5 h-5 mr-2" />
              Фильтры
            </Button>
            <Button className="btn-3d px-6 bg-gradient-to-r from-primary to-electric-600 text-steel-900">
              <Plus className="w-5 h-5 mr-2" />
              Разместить объявление
            </Button>
          </div>
        </Card>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['Строительство', 'Уборка', 'Грузчики', 'Курьеры', 'Промоутеры', 'Другие'].map((category) => (
            <Button
              key={category}
              variant="outline"
              className="h-20 flex-col space-y-2 border-steel-600 hover:border-primary hover:bg-steel-700"
            >
              <div className="w-8 h-8 bg-primary/20 rounded-lg"></div>
              <span className="text-sm">{category}</span>
            </Button>
          ))}
        </div>

        {/* Jobs Grid Placeholder */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Требуется грузчик', desc: 'Разгрузка товара, 1 день', pay: '₽ 2,500', location: 'Москва' },
            { title: 'Ищу уборщицу', desc: 'Уборка квартиры, 2-3 часа', pay: '₽ 1,200', location: 'СПб' },
            { title: 'Нужен курьер', desc: 'Доставка документов', pay: '₽ 800', location: 'Москва' },
            { title: 'Промоутер на акцию', desc: 'Раздача листовок, 4 часа', pay: '₽ 1,800', location: 'Екб' },
            { title: 'Помощник на дачу', desc: 'Работы по саду, выходные', pay: '₽ 3,000', location: 'МО' },
            { title: 'Переезд квартиры', desc: 'Упаковка и погрузка', pay: '₽ 4,500', location: 'Москва' }
          ].map((job, index) => (
            <Card key={index} className="card-steel p-6 space-y-4 hover:scale-105 transition-transform duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <h3 className="font-bold text-steel-100">{job.title}</h3>
                  <p className="text-steel-400 text-sm">{job.desc}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-primary font-bold">{job.pay}</span>
                    <span className="text-steel-500">{job.location}</span>
                  </div>
                </div>
                <span className="text-steel-500 text-xs bg-steel-700 px-2 py-1 rounded">2ч назад</span>
              </div>
              <div className="pt-3 border-t border-steel-700">
                <Button size="sm" className="btn-3d w-full">
                  Откликнуться
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Authentication prompt for non-logged users */}
        {!user && (
          <Card className="card-steel p-8 text-center">
            <h2 className="text-2xl font-bold text-steel-100 mb-4">Начните зарабатывать с GruzzTop</h2>
            <p className="text-steel-400 mb-6">Найдите работу или разместите объявление о поиске людей</p>
            <div className="space-x-4">
              <Button 
                className="btn-3d"
                onClick={() => setShowAuth(true)}
              >
                Войти / Регистрация
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Index;
