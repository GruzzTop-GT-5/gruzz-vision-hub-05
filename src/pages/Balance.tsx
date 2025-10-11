import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { BalanceCard } from '@/components/BalanceCard';
import { TopUpModal } from '@/components/TopUpModal';
import { TransactionHistory } from '@/components/TransactionHistory';
import { BackButton } from '@/components/BackButton';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Zap, TrendingUp } from 'lucide-react';

const Balance = () => {
  const { user, userRole, signOut } = useAuthContext();
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
      <AnimatedBackground className="min-h-screen p-2 xs:p-3 sm:p-4">
        <div className="max-w-2xl mx-auto space-y-3 xs:space-y-4 sm:space-y-6">
          <BackButton />
          
          {/* Compact Header */}
          <div className="text-center space-y-1 xs:space-y-2">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-glow">GT Coins</h1>
            <p className="text-xs xs:text-sm text-steel-300">Внутренняя валюта платформы GruzzTop</p>
          </div>

          {/* Balance Card */}
          <BalanceCard
            userId={user.id}
            onTopUpClick={() => setShowTopUp(true)}
            onHistoryClick={() => setShowHistory(true)}
          />

          {/* Compact Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4">
            <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-3 xs:p-4 sm:p-6 space-y-2 xs:space-y-3 border border-primary/20">
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-steel-100 text-sm xs:text-base sm:text-lg">Как это работает</h3>
                </div>
                <ul className="text-xs xs:text-sm text-steel-300 space-y-1.5 xs:space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary mr-1.5 xs:mr-2">•</span>
                    <span><span className="font-semibold text-primary">1 GT Coin = 1 ₽</span> (рубль)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-1.5 xs:mr-2">•</span>
                    <span>Пополнение от <span className="font-semibold">100 GT</span></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-1.5 xs:mr-2">•</span>
                    <span>Стоимость: <span className="font-semibold text-primary">15-55 GT (₽)</span></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-1.5 xs:mr-2">•</span>
                    <span>Быстрое подтверждение</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-3 xs:p-4 sm:p-6 space-y-2 xs:space-y-3 border border-green-500/20">
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-steel-100 text-sm xs:text-base sm:text-lg">Безопасность</h3>
                </div>
                <ul className="text-xs xs:text-sm text-steel-300 space-y-1.5 xs:space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-1.5 xs:mr-2">✓</span>
                    <span>Защищенные транзакции</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-1.5 xs:mr-2">✓</span>
                    <span>Контроль администрации</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-1.5 xs:mr-2">✓</span>
                    <span>История всех операций</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-1.5 xs:mr-2">✓</span>
                    <span>Возврат при ошибках</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Payment Methods Info */}
          <Card className="card-steel p-6 space-y-5 border-electric-400/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-electric-400/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-electric-400" />
              </div>
              <h3 className="font-semibold text-steel-100 text-lg">Способы пополнения</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Bank Card - Active */}
              <Card className="card-steel p-4 space-y-3 border-blue-500/30 hover:border-blue-500/50 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-semibold text-steel-100">Банковская карта</h4>
                  <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-400/20">
                    Активно
                  </Badge>
                  <p className="text-xs text-steel-400 pt-1">Быстрое пополнение</p>
                </div>
              </Card>
              
              {/* YooMoney - Active */}
              <Card className="card-steel p-4 space-y-3 border-purple-500/30 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-semibold text-steel-100">ЮMoney</h4>
                  <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-400/20">
                    Активно
                  </Badge>
                  <p className="text-xs text-steel-400 pt-1">Быстрое пополнение</p>
                </div>
              </Card>
            </div>
          </Card>

          {/* Terms */}
          <Card className="card-steel p-5 border-steel-600/50">
            <h3 className="font-semibold text-steel-100 mb-3 text-lg">Условия использования</h3>
            <div className="text-sm text-steel-400 space-y-2">
              <p className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>GT Coins используются только внутри платформы GruzzTop</span>
              </p>
              <p className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Минимальная сумма пополнения: <span className="text-steel-200 font-semibold">100 GT (₽)</span></span>
              </p>
              <p className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Максимальная сумма пополнения: <span className="text-steel-200 font-semibold">50,000 GT (₽)</span> за раз</span>
              </p>
              <p className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Все транзакции проверяются администрацией</span>
              </p>
              <p className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Возврат возможен только при технических ошибках</span>
              </p>
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