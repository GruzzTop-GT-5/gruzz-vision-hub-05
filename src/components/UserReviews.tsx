import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRatingDisplay } from '@/components/UserRatingDisplay';
import { ReviewCard } from '@/components/ReviewCard';
import { ReviewForm } from '@/components/ReviewForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Users } from 'lucide-react';

interface Review {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  author_id: string;
  target_user_id: string;
  is_reported: boolean;
  is_moderated: boolean;
  transaction_id: string | null;
}

interface UserProfile {
  id: string;
  rating: number | null;
}

interface UserReviewsProps {
  userId: string;
  canLeaveReview?: boolean;
  transactionId?: string;
}

export const UserReviews = ({ userId, canLeaveReview = false, transactionId }: UserReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchReviews();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, rating')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('target_user_id', userId)
        .eq('is_moderated', false) // Only show non-moderated reviews
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    fetchUserData();
    fetchReviews();
  };

  const handleReviewReported = () => {
    fetchReviews();
  };

  const averageRating = userProfile?.rating || 0;
  const totalReviews = reviews.length;

  if (isLoading) {
    return (
      <Card className="card-steel p-6">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-steel-300">Загрузка отзывов...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="card-steel p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-steel-100">Отзывы и рейтинг</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <UserRatingDisplay userId={userId} showDetails={true} />
              <p className="text-steel-300">
                {totalReviews === 0 
                  ? "Пока нет отзывов" 
                  : `${totalReviews} отзыв${totalReviews === 1 ? '' : totalReviews < 5 ? 'а' : 'ов'}`
                }
              </p>
            </div>

            {canLeaveReview && user && user.id !== userId && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-primary hover:bg-primary/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Оставить отзыв
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          targetUserId={userId}
          transactionId={transactionId}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="card-steel p-8 text-center">
          <div className="space-y-4">
            <Users className="w-16 h-16 text-steel-500 mx-auto" />
            <h3 className="text-xl font-bold text-steel-300">Пока нет отзывов</h3>
            <p className="text-steel-400">
              {user && user.id === userId 
                ? "У вас пока нет отзывов от других пользователей"
                : "Этот пользователь пока не получал отзывов"
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-steel-100">
            Все отзывы ({reviews.length})
          </h3>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onReviewReported={handleReviewReported}
            />
          ))}
        </div>
      )}
    </div>
  );
};