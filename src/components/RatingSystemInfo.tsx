import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBadgeByLevel } from '@/utils/userBadge';
import { Award, Info, Star, TrendingUp } from 'lucide-react';

export const RatingSystemInfo = () => {
  const badges = [1, 2, 3, 4, 5].map(level => getBadgeByLevel(level));

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-steel-100">Система рейтингов и достижений</h2>
        </div>
        <p className="text-steel-300 max-w-2xl mx-auto">
          Рейтинг показывает качество работы исполнителя и формируется на основе отзывов клиентов.
          Чем выше рейтинг, тем выше уровень доверия на платформе.
        </p>
      </div>

      {/* Badge Levels */}
      <Card className="card-steel-lighter p-6">
        <h3 className="text-xl font-semibold text-steel-100 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Уровни достижений
        </h3>
        
        <div className="space-y-4">
          {badges.reverse().map((badge) => (
            <div 
              key={badge.level}
              className="flex items-center justify-between p-4 rounded-lg bg-steel-700/30 border border-steel-600/30 hover:border-steel-500/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: `${badge.color}20`,
                    border: `2px solid ${badge.color}40`
                  }}
                >
                  {badge.icon}
                </div>
                
                <div>
                  <div className="flex items-center gap-3">
                    <h4 
                      className="text-lg font-semibold"
                      style={{ color: badge.color }}
                    >
                      {badge.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      Уровень {badge.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-steel-300 mt-1">{badge.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-steel-100 font-medium">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  {badge.level === 5 ? '4.8+' : 
                   badge.level === 4 ? '4.5 - 4.7' :
                   badge.level === 3 ? '4.0 - 4.4' :
                   badge.level === 2 ? '3.5 - 3.9' :
                   '< 3.5'}
                </div>
                <p className="text-xs text-steel-400 mt-1">Рейтинг</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* How Rating Works */}
      <Card className="card-steel-lighter p-6">
        <h3 className="text-xl font-semibold text-steel-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Как формируется рейтинг
        </h3>
        
        <div className="space-y-4 text-steel-300">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-steel-100 mb-1">Отзывы клиентов</h4>
              <p className="text-sm">
                После завершения заказа клиент может оставить отзыв и оценку от 1 до 5 звезд.
                Средняя оценка всех отзывов формирует базовый рейтинг.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-steel-100 mb-1">Бонусные баллы от администрации</h4>
              <p className="text-sm">
                Администрация платформы может добавить или снять бонусные баллы за:
              </p>
              <ul className="text-sm mt-2 space-y-1 ml-4 list-disc">
                <li>Качественное выполнение работы</li>
                <li>Помощь другим пользователям</li>
                <li>Нарушения правил платформы</li>
                <li>Жалобы клиентов</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-steel-100 mb-1">Стартовый рейтинг</h4>
              <p className="text-sm">
                Все новые пользователи начинают с рейтингом 5.0 (максимальный).
                Это дает возможность начать работу на платформе с доверием клиентов.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Benefits */}
      <Card className="card-steel-lighter p-6">
        <h3 className="text-xl font-semibold text-steel-100 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Преимущества высокого рейтинга
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 text-steel-300">
          <div className="p-4 rounded-lg bg-steel-700/20 border border-steel-600/20">
            <h4 className="font-semibold text-steel-100 mb-2">📈 Больше заказов</h4>
            <p className="text-sm">
              Клиенты чаще выбирают исполнителей с высоким рейтингом и значком
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-steel-700/20 border border-steel-600/20">
            <h4 className="font-semibold text-steel-100 mb-2">💰 Выше оплата</h4>
            <p className="text-sm">
              Вы можете запрашивать более высокую стоимость за свои услуги
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-steel-700/20 border border-steel-600/20">
            <h4 className="font-semibold text-steel-100 mb-2">⚡ Приоритет</h4>
            <p className="text-sm">
              Ваши отклики показываются выше в списке исполнителей
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-steel-700/20 border border-steel-600/20">
            <h4 className="font-semibold text-steel-100 mb-2">🎯 Доверие</h4>
            <p className="text-sm">
              Значки достижений показывают ваш профессионализм и опыт
            </p>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="card-steel-lighter p-6 bg-primary/5 border-primary/20">
        <h3 className="text-xl font-semibold text-steel-100 mb-4">💡 Советы по повышению рейтинга</h3>
        
        <ul className="space-y-3 text-steel-300">
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-sm">
              <strong className="text-steel-100">Качественно выполняйте работу</strong> - это основа хорошего рейтинга
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-sm">
              <strong className="text-steel-100">Общайтесь с клиентами</strong> - отвечайте быстро и вежливо
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-sm">
              <strong className="text-steel-100">Соблюдайте сроки</strong> - выполняйте заказы вовремя
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-sm">
              <strong className="text-steel-100">Следуйте правилам</strong> - избегайте нарушений и жалоб
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-sm">
              <strong className="text-steel-100">Просите отзывы</strong> - напоминайте клиентам оставить отзыв после работы
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
};
