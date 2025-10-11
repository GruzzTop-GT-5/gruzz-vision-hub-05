import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo-round.png';
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
      title: 'Фиксированная стоимость',
      description: 'Прозрачная фиксированная оплата за размещение объявлений'
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
    'Фиксированная оплата за размещение объявлений о поиске',
    'Все споры решаются сторонами самостоятельно',
    'Соблюдение конфиденциальности личных данных',
    'Платформа не несет ответственности за результат сделок'
  ];

  return (
    <AnimatedBackground className="min-h-screen flex flex-col justify-center p-2 xs:p-3 sm:p-4">
      <div className="max-w-4xl mx-auto w-full space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 xs:space-y-4 sm:space-y-6">
          <div className="flex justify-center mb-4 xs:mb-6 sm:mb-8">
            <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center animate-glow hover:animate-float shadow-2xl bg-gradient-to-br from-primary to-electric-600">
              <img src={logoImage} alt="GruzzTop Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-glow tracking-tight leading-tight">
            GruzzTop GT-V5
          </h1>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-steel-300 max-w-3xl mx-auto leading-relaxed font-medium px-2">
            Революционная платформа для поиска талантов и возможностей! 
            Соединяем мечты с реальностью. Находите идеальных исполнителей или работу мечты за считанные минуты. 
            Платите фиксированную стоимость за размещение объявлений — без скрытых комиссий!
          </p>
        </div>

        {/* Features Grid - Компактно для мобильных */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 md:gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="card-steel p-3 xs:p-4 sm:p-6 md:p-8 text-center space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6 hover:bg-steel-700 hover:scale-105 transition-all duration-300 group">
              <div className="flex justify-center">
                <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-xs xs:text-sm sm:text-base md:text-xl font-bold text-steel-100 transition-colors duration-300 leading-tight">{feature.title}</h3>
              <p className="text-[10px] xs:text-xs sm:text-sm text-steel-400 leading-tight group-hover:text-steel-300 transition-colors duration-300">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Rules Section - Компактно */}
        <Card className="card-steel p-3 xs:p-4 sm:p-6 md:p-8">
          <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-steel-100 mb-3 xs:mb-4 sm:mb-6 text-center">Правила платформы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-start space-x-2 xs:space-x-3">
                <div className="w-5 h-5 xs:w-6 xs:h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs xs:text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-steel-300 text-xs xs:text-sm sm:text-base leading-tight">{rule}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA Button */}
        <div className="text-center space-y-3 xs:space-y-4 sm:space-y-6">
          <button
            onClick={onGetStarted}
            className="btn-3d px-6 xs:px-8 sm:px-10 md:px-12 py-3 xs:py-4 sm:py-5 md:py-6 text-base xs:text-lg sm:text-xl font-black bg-gradient-to-r from-primary via-electric-500 to-electric-600 hover:from-electric-600 hover:via-primary hover:to-electric-500 text-steel-900 rounded-xl sm:rounded-2xl tracking-wide"
          >
            НАЧАТЬ ИСПОЛЬЗОВАНИЕ
          </button>
          <p className="mt-3 xs:mt-4 sm:mt-6 text-steel-400 text-[10px] xs:text-xs sm:text-sm max-w-md mx-auto leading-tight px-2">
            Нажимая "Начать использование", вы соглашаетесь с правилами платформы и политикой конфиденциальности
          </p>
        </div>
      </div>
    </AnimatedBackground>
  );
};