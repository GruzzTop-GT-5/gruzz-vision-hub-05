import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthForm } from '@/components/AuthForm';
import { LegalFooter } from '@/components/LegalFooter';
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
          <h1 className="text-3xl font-bold text-glow">GruzzTop</h1>
          <p className="text-steel-300">Найдите работу или исполнителей</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button className="btn-3d p-6 h-auto flex-col space-y-2">
            <Plus className="w-8 h-8" />
            <div>
              <div className="font-bold">Разместить задание</div>
              <div className="text-sm opacity-70">Найти исполнителя</div>
            </div>
          </Button>
          <Button className="btn-3d p-6 h-auto flex-col space-y-2">
            <Search className="w-8 h-8" />
            <div>
              <div className="font-bold">Найти работу</div>
              <div className="text-sm opacity-70">Просмотреть задания</div>
            </div>
          </Button>
        </div>

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
