import React from 'react';
import { Layout } from '@/components/Layout';
import { AuthForm } from '@/components/AuthForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldAlert } from 'lucide-react';

interface AuthRequiredProps {
  user?: any;
  userRole?: string;
  onSignOut?: () => void;
  title?: string;
  description?: string;
  showAuthForm?: boolean;
  onShowAuth?: () => void;
  onAuthSuccess?: () => void;
  onAuthBack?: () => void;
}

export const AuthRequired: React.FC<AuthRequiredProps> = ({
  user,
  userRole,
  onSignOut,
  title = "Требуется авторизация",
  description = "Для размещения заказов необходимо войти в систему",
  showAuthForm = false,
  onShowAuth,
  onAuthSuccess,
  onAuthBack
}) => {
  if (showAuthForm) {
    return <AuthForm onSuccess={onAuthSuccess} onBack={onAuthBack} />;
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={onSignOut} onShowAuth={onShowAuth}>
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="card-steel p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-yellow-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-steel-100 mb-3">{title}</h1>
          <p className="text-steel-400 mb-6">{description}</p>
          
          <Button 
            className="btn-3d w-full"
            onClick={onShowAuth}
          >
            <User className="w-4 h-4 mr-2" />
            Войти в аккаунт
          </Button>
        </Card>
      </div>
    </Layout>
  );
};