import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/StarRating';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { sanitizeInput, detectSuspiciousInput } from '@/utils/security';

interface ReviewFormProps {
  targetUserId: string;
  transactionId?: string;
  onReviewSubmitted?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ 
  targetUserId, 
  transactionId, 
  onReviewSubmitted, 
  onCancel 
}: ReviewFormProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, поставьте оценку",
        variant: "destructive"
      });
      return;
    }

    // Security: Check for suspicious content
    const sanitizedComment = sanitizeInput(comment);
    if (detectSuspiciousInput(comment)) {
      toast({
        title: "Подозрительный контент",
        description: "Ваш комментарий содержит подозрительный контент и будет проверен модераторами",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: any = {
        author_id: user.id,
        target_user_id: targetUserId,
        rating,
        comment: sanitizedComment.trim() || null
      };

      if (transactionId) {
        reviewData.transaction_id = transactionId;
      }

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) {
        if (error.message.includes('Reviews can only be created for completed transactions')) {
          toast({
            title: "Ошибка",
            description: "Отзывы можно оставлять только после завершенных транзакций",
            variant: "destructive"
          });
        } else if (error.code === '23505') {
          toast({
            title: "Ошибка",
            description: "Вы уже оставляли отзыв по этой транзакции",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Отзыв отправлен!",
        description: "Спасибо за ваш отзыв. Он поможет другим пользователям."
      });

      setRating(0);
      setComment('');
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить отзыв. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="card-steel p-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-steel-100">Оставить отзыв</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-steel-200">Оценка *</Label>
            <StarRating
              rating={rating}
              interactive={true}
              onRatingChange={setRating}
              size="lg"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-steel-200">
              Комментарий
            </Label>
            <Textarea
              id="comment"
              placeholder="Расскажите о вашем опыте работы с этим пользователем..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-steel-400">
              {comment.length}/1000 символов
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            )}
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? "Отправка..." : "Оставить отзыв"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};