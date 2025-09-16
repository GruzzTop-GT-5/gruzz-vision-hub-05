import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { BalanceCard } from '@/components/BalanceCard';
import { TopUpModal } from '@/components/TopUpModal';
import { TransactionHistory } from '@/components/TransactionHistory';
import { BackButton } from '@/components/BackButton';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Info, Shield, Zap, TrendingUp } from 'lucide-react';

const Balance = () => {
  const { user, userRole, signOut } = useAuth();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!user) {
    return (
      <AnimatedBackground className="min-h-screen flex items-center justify-center">
        <Card className="card-steel p-8 text-center">
          <h2 className="text-2xl font-bold text-glow mb-4">Вход требуется</h2>
          <p className="text-steel-400">Войдите в систему для просмотра баланса</p>
        </Card>
      </AnimatedBackground>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <AnimatedBackground className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <BackButton onClick={() => window.history.back()} />
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-glow">GT Coins</h1>
            <p className="text-steel-300">Внутренняя валюта платформы GruzzTop</p>
          </div>

          {/* Balance Card */}
          <BalanceCard
            userId={user.id}
            onTopUpClick={() => setShowTopUp(true)}
            onHistoryClick={() => setShowHistory(true)}
          />

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="card-steel p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-steel-100">Как это работает</h3>
              </div>
              <ul className="text-sm text-steel-300 space-y-1">
                <li>• 1 GT Coin = 1 ₽</li>
                <li>• Пополнение от 100 GT</li>
                <li>• Комиссия за размещение объявлений</li>
                <li>• Быстрое подтверждение платежей</li>
              </ul>
            </Card>

            <Card className="card-steel p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <h3 className="font-medium text-steel-100">Безопасность</h3>
              </div>
              <ul className="text-sm text-steel-300 space-y-1">
                <li>• Защищенные транзакции</li>
                <li>• Контроль администрации</li>
                <li>• История всех операций</li>
                <li>• Возврат при ошибках</li>
              </ul>
            </Card>
          </div>

          {/* Payment Methods Info */}
          <Card className="card-steel p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-electric-400" />
              <h3 className="font-medium text-steel-100">Способы пополнения</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2 opacity-50">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-steel-200">Банковская карта</h4>
                <p className="text-xs text-steel-400">В разработке</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-steel-200">ЮMoney</h4>
                <p className="text-xs text-steel-400">Быстрое пополнение</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-steel-200">Ozon</h4>
                <p className="text-xs text-steel-400">Удобно и просто</p>
              </div>
            </div>
          </Card>

          {/* Terms */}
          <Card className="card-steel p-4">
            <h3 className="font-medium text-steel-100 mb-2">Условия использования</h3>
            <div className="text-xs text-steel-400 space-y-1">
              <p>• GT Coins используются только внутри платформы GruzzTop</p>
              <p>• Минимальная сумма пополнения: 100 GT</p>
              <p>• Максимальная сумма пополнения: 50,000 GT за раз</p>
              <p>• Все транзакции проверяются администрацией</p>
              <p>• Возврат возможен только при технических ошибках</p>
            </div>
          </Card>
        </div>

        {/* Modals */}
        <TopUpModal
          isOpen={showTopUp}
          onClose={() => setShowTopUp(false)}
          userId={user.id}
          onSuccess={() => {
            // Refresh balance card
            window.location.reload();
          }}
        />

        <TransactionHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          userId={user.id}
        />
      </AnimatedBackground>
    </Layout>
  );
};

export default Balance;