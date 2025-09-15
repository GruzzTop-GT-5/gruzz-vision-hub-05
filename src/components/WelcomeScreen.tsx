import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Shield, Users, Zap, Trophy, Star } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  const features = [
    {
      icon: Shield,
      title: 'Простота и удобство',
      description: 'Легкое размещение объявлений и быстрый поиск подходящих вариантов'
    },
    {
      icon: Users,
      title: 'Широкая аудитория',
      description: 'Большая база исполнителей и работодателей для быстрого поиска'
    },
    {
      icon: Zap,
      title: 'Быстрый отклик',
      description: 'Мгновенные уведомления и оперативная связь между сторонами'
    },
    {
      icon: Trophy,
      title: 'Справедливая комиссия',
      description: 'Низкая комиссия за размещение объявлений о поиске людей'
    },
    {
      icon: Star,
      title: 'Система рейтингов',
      description: 'Каждый пользователь имеет рейтинг, что исключает мошенников и повышает доверие'
    }
  ];

  const rules = [
    'Запрещены мошеннические схемы любого вида',
    'Обязательная взаимная вежливость между пользователями',
    'Комиссия взимается только за размещение объявлений о поиске',
    'Все споры решаются сторонами самостоятельно',
    'Соблюдение конфиденциальности личных данных',
    'Платформа не несет ответственности за результат сделок'
  ];

  return (
    <AnimatedBackground className="min-h-screen flex flex-col justify-center p-4">
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
            🚀 Революционная платформа для поиска талантов и возможностей! 
            Соединяем мечты с реальностью. Находите идеальных исполнителей или работу мечты за считанные минуты. 
            💰 Платите только за результат — справедливая комиссия только за успешное размещение!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
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
    </AnimatedBackground>
  );
};