import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Zap, Trophy } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  const features = [
    {
      icon: Shield,
      title: 'Безопасные сделки',
      description: 'Полная защита покупателей и продавцов через систему гарантий'
    },
    {
      icon: Users,
      title: 'Проверенные пользователи',
      description: 'Система рейтингов и отзывов для надежных партнеров'
    },
    {
      icon: Zap,
      title: 'Быстрые операции',
      description: 'Мгновенные уведомления и быстрая обработка заказов'
    },
    {
      icon: Trophy,
      title: 'Лучшие цены',
      description: 'Конкурентные цены и выгодные предложения каждый день'
    }
  ];

  const rules = [
    'Запрещены мошеннические схемы любого вида',
    'Обязательна взаимная вежливость между пользователями',
    'Запрещена продажа запрещенных товаров и услуг',
    'Все споры решаются через службу поддержки',
    'Соблюдение конфиденциальности личных данных',
    'Ответственность за качество товаров лежит на продавце'
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center p-4">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-electric-600 rounded-2xl flex items-center justify-center animate-glow">
              <span className="text-steel-900 font-bold text-3xl">GT</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-glow">
            GruzzTop GT-V5
          </h1>
          <p className="text-xl text-steel-300 max-w-2xl mx-auto leading-relaxed">
            Современная платформа для безопасных сделок и торговли. 
            Присоединяйтесь к сообществу надежных пользователей.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="card-steel p-6 text-center space-y-4 hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-steel-100">{feature.title}</h3>
              <p className="text-sm text-steel-400 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Rules Section */}
        <Card className="card-steel p-8">
          <h2 className="text-2xl font-bold text-steel-100 mb-6 text-center">Правила платформы</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-steel-300 text-sm leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={onGetStarted}
            className="btn-3d px-8 py-4 text-lg font-bold bg-gradient-to-r from-primary to-electric-600 hover:from-electric-600 hover:to-primary text-steel-900"
          >
            Начать использование
          </Button>
          <p className="mt-4 text-steel-400 text-sm">
            Нажимая "Начать использование", вы соглашаетесь с правилами платформы
          </p>
        </div>
      </div>
    </div>
  );
};