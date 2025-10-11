import { useState, useEffect } from 'react';
import { StarRating } from '@/components/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { UserBadge } from '@/components/UserBadge';
import { Star, Award, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface UserRatingDisplayProps {
  userId: string;
  showDetails?: boolean;
  showDistribution?: boolean;
  className?: string;
}

interface UserRatingData {
  rating: number;
  totalReviews: number;
  verifiedReviews: number;
  ratingDistribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

export function UserRatingDisplay({ 
  userId, 
  showDetails = false, 
  showDistribution = false,
  className = "" 
}: UserRatingDisplayProps) {
  const [ratingData, setRatingData] = useState<UserRatingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRating();
  }, [userId]);

  const fetchUserRating = async () => {
    try {
      setLoading(true);
      
      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rating')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Получаем количество отзывов о пользователе
      const { count: totalReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('target_user_id', userId)
        .eq('is_hidden', false);

      // Получаем распределение оценок
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('target_user_id', userId)
        .eq('is_hidden', false);

      const distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      reviews?.forEach(review => {
        if (review.rating) {
          distribution[review.rating.toString() as keyof typeof distribution]++;
        }
      });

      setRatingData({
        rating: profile?.rating || 5.0,
        totalReviews: totalReviews || 0,
        verifiedReviews: 0, // Пока не реализовано
        ratingDistribution: distribution
      });
    } catch (error) {
      console.error('Error fetching user rating:', error);
      setRatingData({
        rating: 5.0,
        totalReviews: 0,
        verifiedReviews: 0,
        ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-20 h-5 bg-steel-700 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!ratingData) {
    return (
      <div className={`flex items-center space-x-2 text-steel-400 ${className}`}>
        <span>Нет рейтинга</span>
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-400';
    if (rating >= 4.0) return 'text-blue-400';
    if (rating >= 3.5) return 'text-yellow-400';
    if (rating >= 3.0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRatingLabel = (rating: number, reviewCount: number) => {
    if (reviewCount < 5) return 'Новичок';
    if (rating >= 4.8) return 'Выдающийся';
    if (rating >= 4.5) return 'Отличный';
    if (rating >= 4.0) return 'Хороший';
    if (rating >= 3.5) return 'Приемлемый';
    return 'Требует улучшения';
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Основной рейтинг */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <Star className={`w-5 h-5 fill-current ${getRatingColor(ratingData.rating)}`} />
                <span className={`text-xl font-bold ${getRatingColor(ratingData.rating)}`}>
                  {ratingData.rating.toFixed(2)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                {getRatingLabel(ratingData.rating, ratingData.totalReviews)}
              </p>
              {ratingData.totalReviews < 5 && (
                <p className="text-xs text-steel-400 mt-1">
                  Нужно минимум 5 отзывов для стабильного рейтинга
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Бейдж уровня */}
        <UserBadge rating={ratingData.rating} size="sm" showDescription={false} />
        
        {/* Количество отзывов */}
        <div className="flex items-center gap-1 text-sm text-steel-300">
          <BarChart3 className="w-4 h-4" />
          <span>
            {ratingData.totalReviews} отзыв{
              ratingData.totalReviews === 1 ? '' : 
              ratingData.totalReviews < 5 ? 'а' : 'ов'
            }
          </span>
        </div>

        {/* Проверенные отзывы */}
        {ratingData.verifiedReviews > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1 cursor-help">
                  <Shield className="w-3 h-3" />
                  <span>{ratingData.verifiedReviews} проверенных</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Отзывы от пользователей с завершенными заказами</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Индикатор надежности */}
        {ratingData.totalReviews >= 5 && (
          <Badge 
            variant={ratingData.rating >= 4.5 ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Надежный</span>
          </Badge>
        )}
      </div>

      {/* Распределение оценок */}
      {showDistribution && ratingData.totalReviews > 0 && (
        <div className="space-y-1 mt-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingData.ratingDistribution[stars.toString() as keyof typeof ratingData.ratingDistribution] || 0;
            const percentage = ratingData.totalReviews > 0 
              ? (count / ratingData.totalReviews) * 100 
              : 0;
            
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-steel-300">{stars}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2 flex-1"
                />
                <span className="text-steel-400 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}