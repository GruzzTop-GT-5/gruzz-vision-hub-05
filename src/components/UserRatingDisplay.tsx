import { useState, useEffect } from 'react';
import { StarRating } from '@/components/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { UserBadge } from '@/components/UserBadge';
import { Star, Award, TrendingUp } from 'lucide-react';

interface UserRatingDisplayProps {
  userId: string;
  showDetails?: boolean;
  className?: string;
}

interface UserRatingData {
  rating: number;
  totalReviews: number;
  bonusPoints: number;
  baseRating: number;
}

export function UserRatingDisplay({ userId, showDetails = false, className = "" }: UserRatingDisplayProps) {
  const [ratingData, setRatingData] = useState<UserRatingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRating();
  }, [userId]);

  const fetchUserRating = async () => {
    try {
      setLoading(true);
      
      // Получаем профиль пользователя с текущим рейтингом
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rating')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Получаем детали отзывов с бонусными баллами
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating, admin_bonus_points')
        .eq('target_user_id', userId)
        .eq('is_hidden', false)
        .eq('is_moderated', false)
        .not('rating', 'is', null);

      if (reviewsError) throw reviewsError;

      const totalReviews = reviews?.length || 0;
      const totalBonusPoints = reviews?.reduce((sum, review) => sum + (review.admin_bonus_points || 0), 0) || 0;
      const baseRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      setRatingData({
        rating: profile?.rating || 0,
        totalReviews,
        bonusPoints: totalBonusPoints,
        baseRating
      });
    } catch (error) {
      console.error('Error fetching user rating:', error);
      setRatingData({
        rating: 0,
        totalReviews: 0,
        bonusPoints: 0,
        baseRating: 0
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

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <span className="text-steel-100 font-medium">{ratingData.rating.toFixed(1)}</span>
      </div>
      
      <UserBadge rating={ratingData.rating} size="sm" showDescription={showDetails} />
      
      {showDetails && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-steel-300">
            ({ratingData.totalReviews} отзыв{ratingData.totalReviews !== 1 ? (ratingData.totalReviews < 5 ? 'а' : 'ов') : ''})
          </span>
          
          {ratingData.bonusPoints !== 0 && (
            <Badge 
              variant={ratingData.bonusPoints > 0 ? "default" : "destructive"} 
              className="text-xs flex items-center space-x-1"
            >
              <Award className="w-3 h-3" />
              <span>{ratingData.bonusPoints > 0 ? '+' : ''}{ratingData.bonusPoints}</span>
            </Badge>
          )}
          
          {Math.abs(ratingData.rating - ratingData.baseRating) > 0.1 && (
            <Badge variant="secondary" className="text-xs flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Базовый: {ratingData.baseRating.toFixed(1)}</span>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}