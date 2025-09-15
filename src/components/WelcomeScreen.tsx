import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen flex flex-col justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-electric-400/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-32 w-3 h-3 bg-primary/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-10 w-1.5 h-1.5 bg-electric-500/20 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 right-1/3 w-2 h-2 bg-primary/15 rounded-full animate-ping" style={{ animationDelay: '4s' }}></div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 right-1/4 w-8 h-8 border border-primary/10 rotate-45 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-6 h-6 border border-electric-400/15 rounded-full animate-float" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute top-2/3 left-10 w-4 h-4 border-l-2 border-primary/20 animate-float" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-primary/5 to-electric-500/5 rounded-full blur-xl animate-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-electric-400/5 to-primary/5 rounded-full blur-2xl animate-glow" style={{ animationDelay: '3s' }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto w-full space-y-8 relative z-10">
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
            Платформа для поиска работы и исполнителей. 
            Найдите нужных людей или подходящую работу. Оплачивайте только комиссию за размещение.
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
    </div>
  );
};