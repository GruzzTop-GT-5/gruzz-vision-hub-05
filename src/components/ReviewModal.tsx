import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewModal = ({ 
  isOpen, 
  onClose, 
  orderId, 
  reviewedUserId, 
  reviewedUserName,
  onReviewSubmitted 
}: ReviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id || rating === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, поставьте оценку",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('order_reviews')
        .insert({
          order_id: orderId,
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Отзыв отправлен",
        description: "Спасибо за ваш отзыв!"
      });

      onReviewSubmitted?.();
      onClose();
      
      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить отзыв",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isActive = starNumber <= (hoverRating || rating);
      
      return (
        <button
          key={starNumber}
          type="button"
          className={`text-2xl transition-colors ${
            isActive ? 'text-yellow-400' : 'text-steel-500 hover:text-yellow-300'
          }`}
          onMouseEnter={() => setHoverRating(starNumber)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(starNumber)}
        >
          <Star className={`w-8 h-8 ${isActive ? 'fill-current' : ''}`} />
        </button>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel-dialog max-w-md">
        <DialogHeader>
          <DialogTitle className="text-steel-100">Оценить работу</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-steel-300 mb-4">
              Как вы оцениваете работу пользователя <span className="font-medium text-steel-100">{reviewedUserName}</span>?
            </p>
            
            <div className="flex justify-center space-x-1 mb-2">
              {renderStars()}
            </div>
            
            <p className="text-sm text-steel-400">
              {rating > 0 && (
                <>
                  {rating === 1 && "Очень плохо"}
                  {rating === 2 && "Плохо"}
                  {rating === 3 && "Удовлетворительно"}
                  {rating === 4 && "Хорошо"}
                  {rating === 5 && "Отлично"}
                </>
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="comment">Комментарий (необязательно)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о своем опыте работы..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              Отправить отзыв
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};