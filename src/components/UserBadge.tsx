import { getUserBadge } from '@/utils/userBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserBadgeProps {
  rating: number;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const UserBadge = ({ rating, showDescription = true, size = 'md' }: UserBadgeProps) => {
  const badge = getUserBadge(rating);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };
  
  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div 
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses[size]} transition-all hover:scale-105`}
            style={{
              backgroundColor: `${badge.color}20`,
              border: `1px solid ${badge.color}40`,
              color: badge.color
            }}
          >
            <span className={iconSizes[size]}>{badge.icon}</span>
            <span>{badge.name}</span>
          </div>
        </TooltipTrigger>
        {showDescription && (
          <TooltipContent>
            <div className="text-center">
              <p className="font-semibold">{badge.description}</p>
              <p className="text-xs text-steel-400 mt-1">
                Уровень {badge.level} из 5
              </p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
