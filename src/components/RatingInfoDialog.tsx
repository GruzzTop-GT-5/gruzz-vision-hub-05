import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserBadge, getBadgeByLevel } from '@/utils/userBadge';
import { Info, Star, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RatingInfoDialogProps {
  currentRating?: number;
  trigger?: React.ReactNode;
}

export const RatingInfoDialog = ({ currentRating, trigger }: RatingInfoDialogProps) => {
  const [open, setOpen] = useState(false);
  const badges = [1, 2, 3, 4, 5].map(level => getBadgeByLevel(level));
  const currentBadge = currentRating ? getUserBadge(currentRating) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Info className="h-4 w-4 text-steel-400 hover:text-primary transition-colors" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Award className="w-6 h-6 text-primary" />
            Система рейтингов
          </DialogTitle>
          <DialogDescription>
            Узнайте, как работает рейтинг и какие значки вы можете получить
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Badge */}
          {currentRating !== undefined && currentBadge && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-electric-600/10 border border-primary/20">
              <p className="text-sm text-steel-400 mb-2">Ваш текущий уровень</p>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{
                    backgroundColor: `${currentBadge.color}20`,
                    border: `2px solid ${currentBadge.color}40`
                  }}
                >
                  {currentBadge.icon}
                </div>
                <div>
                  <h3 
                    className="text-2xl font-bold"
                    style={{ color: currentBadge.color }}
                  >
                    {currentBadge.name}
                  </h3>
                  <p className="text-steel-300">{currentBadge.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-steel-100 font-medium">{currentRating.toFixed(1)}</span>
                    <Badge variant="outline" className="text-xs">
                      Уровень {currentBadge.level}/5
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Badges */}
          <div>
            <h3 className="font-semibold text-lg text-steel-100 mb-3">Уровни достижений</h3>
            <div className="space-y-3">
              {badges.reverse().map((badge) => {
                const isCurrentLevel = currentBadge?.level === badge.level;
                return (
                  <div 
                    key={badge.level}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCurrentLevel 
                        ? 'bg-primary/10 border-2 border-primary/30' 
                        : 'bg-steel-800/30 border border-steel-700/30'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        backgroundColor: `${badge.color}20`,
                        border: `2px solid ${badge.color}40`
                      }}
                    >
                      {badge.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 
                          className="font-semibold"
                          style={{ color: badge.color }}
                        >
                          {badge.name}
                        </h4>
                        {isCurrentLevel && (
                          <Badge variant="default" className="text-xs">
                            Ваш уровень
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-steel-400">{badge.description}</p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-steel-100 font-medium">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-sm">
                          {badge.level === 5 ? '4.8+' : 
                           badge.level === 4 ? '4.5-4.7' :
                           badge.level === 3 ? '4.0-4.4' :
                           badge.level === 2 ? '3.5-3.9' :
                           '< 3.5'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info */}
          <div className="p-4 rounded-lg bg-steel-800/30 border border-steel-700/30 space-y-2">
            <h4 className="font-semibold text-steel-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Как повысить рейтинг?
            </h4>
            <ul className="text-sm text-steel-300 space-y-1 ml-6 list-disc">
              <li>Качественно выполняйте заказы</li>
              <li>Соблюдайте сроки и договоренности</li>
              <li>Общайтесь вежливо с клиентами</li>
              <li>Просите оставлять отзывы после работы</li>
            </ul>
          </div>

          {/* Link to full info */}
          <div className="text-center">
            <Link to="/rules">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Подробнее о системе рейтингов
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
