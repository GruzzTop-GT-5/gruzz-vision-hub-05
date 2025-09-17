import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthRequiredProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthRequired: React.FC<AuthRequiredProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AnimatedBackground className="min-h-screen flex items-center justify-center p-4">
        <Card className="card-steel p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-electric-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-steel-900" />
          </div>
          
          <h2 className="text-2xl font-bold text-glow mb-4">
            Требуется авторизация
          </h2>
          
          <p className="text-steel-400 mb-6">
            Войдите в систему для просмотра этой страницы
          </p>
          
          <Link to="/auth">
            <Button className="w-full btn-3d py-3 text-lg font-bold bg-gradient-to-r from-primary to-electric-600 text-steel-900">
              <LogIn className="w-5 h-5 mr-2" />
              Войти в аккаунт
            </Button>
          </Link>
        </Card>
      </AnimatedBackground>
    );
  }

  return <>{children}</>;
};