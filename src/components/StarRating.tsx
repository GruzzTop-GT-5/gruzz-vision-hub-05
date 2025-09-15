import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating = ({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false,
  onRatingChange,
  className 
}: StarRatingProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1;
        const isFullStar = starRating <= Math.floor(rating);
        const isHalfStar = starRating === Math.ceil(rating) && rating % 1 !== 0;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starRating)}
            disabled={!interactive}
            className={cn(
              sizes[size],
              interactive 
                ? "cursor-pointer hover:scale-110 transition-transform duration-200" 
                : "cursor-default",
              "relative"
            )}
            aria-label={`${starRating} star${starRating !== 1 ? 's' : ''}`}
          >
            <Star 
              className={cn(
                "w-full h-full transition-colors duration-200",
                isFullStar 
                  ? "text-yellow-500 fill-yellow-500" 
                  : isHalfStar
                  ? "text-yellow-500 fill-yellow-500/50"
                  : interactive 
                  ? "text-steel-400 hover:text-yellow-400" 
                  : "text-steel-500"
              )}
            />
          </button>
        );
      })}
      <span className="text-sm text-steel-300 ml-2">
        {rating.toFixed(1)} / {maxRating}
      </span>
    </div>
  );
};