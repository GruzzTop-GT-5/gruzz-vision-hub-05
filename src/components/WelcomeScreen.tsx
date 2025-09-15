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
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-primary via-electric-500 to-electric-600 rounded-3xl flex items-center justify-center animate-glow hover:animate-float shadow-2xl">
              <span className="text-steel-900 font-black text-4xl tracking-wider">GT</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-glow tracking-tight">
            GruzzTop GT-V5
          </h1>
          <p className="text-xl md:text-2xl text-steel-300 max-w-3xl mx-auto leading-relaxed font-medium">
            Современная платформа для безопасных сделок и торговли. 
            Присоединяйтесь к сообществу надежных пользователей.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-steel p-8 text-center space-y-6 hover:scale-110 hover:-rotate-1 transition-all duration-500 group">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-steel-100 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
              <p className="text-sm text-steel-400 leading-relaxed group-hover:text-steel-300 transition-colors duration-300">{feature.description}</p>
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
        <div className="text-center space-y-6">
          <button
            onClick={onGetStarted}
            className="btn-3d px-12 py-6 text-xl font-black bg-gradient-to-r from-primary via-electric-500 to-electric-600 hover:from-electric-600 hover:via-primary hover:to-electric-500 text-steel-900 rounded-2xl tracking-wide"
          >
            НАЧАТЬ ИСПОЛЬЗОВАНИЕ
          </button>
          <p className="mt-6 text-steel-400 text-sm max-w-md mx-auto leading-relaxed">
            Нажимая "Начать использование", вы соглашаетесь с правилами платформы и политикой конфиденциальности
          </p>
        </div>
      </div>
    </div>
  );
};