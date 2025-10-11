import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Flag, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';

interface Review {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  author_id: string;
  target_user_id: string;
  is_reported: boolean;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  admin_bonus_points?: number;
}

interface ReviewCardProps {
  review: Review;
  onReviewReported?: () => void;
}

interface AuthorProfile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  phone: string | null;
}

export const ReviewCard = ({ review, onReviewReported }: ReviewCardProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);

  useEffect(() => {
    fetchAuthorProfile();
  }, [review.author_id]);

  const fetchAuthorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, phone')
        .eq('id', review.author_id)
        .single();

      if (error) throw error;
      setAuthorProfile(data);
    } catch (error) {
      console.error('Error fetching author profile:', error);
    }
  };

  const getAuthorDisplayName = () => {
    if (!authorProfile) return `ID: ${review.author_id.slice(0, 8)}...`;
    return authorProfile.display_name || authorProfile.full_name || `ID: ${review.author_id.slice(0, 8)}...`;
  };

  const handleReportReview = async () => {
    if (!user?.id || !reportReason.trim()) return;

    setIsReporting(true);
    try {
      const { error } = await supabase
        .from('review_reports')
        .insert({
          review_id: review.id,
          reporter_id: user.id,
          reason: reportReason.trim()
        });

      if (error) throw error;

      // Mark review as reported
      await supabase
        .from('reviews')
        .update({ is_reported: true })
        .eq('id', review.id);

      toast({
        title: "Жалоба отправлена",
        description: "Модераторы рассмотрят ваше обращение в ближайшее время."
      });

      setReportReason('');
      onReviewReported?.();
    } catch (error) {
      console.error('Error reporting review:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить жалобу. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Card className="card-steel p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-steel-900" />
          </div>
          <div>
            <p className="text-steel-200 font-medium">
              {getAuthorDisplayName()}
            </p>
            <div className="flex items-center space-x-2 text-xs text-steel-400">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(review.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}</span>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center space-x-2">
          {review.moderation_status === 'rejected' && (
            <Badge variant="outline" className="text-red-400 border-red-400/20">
              Отклонен
            </Badge>
          )}
          {review.is_reported && review.moderation_status !== 'rejected' && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400/20">
              На модерации
            </Badge>
          )}
        </div>
      </div>

      {/* Rating */}
      {review.rating && (
        <div className="flex items-center space-x-2">
          <StarRating rating={review.rating} size="md" />
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <div className="bg-steel-800/50 rounded-lg p-4">
          <p className="text-steel-200 leading-relaxed">
            {review.comment}
          </p>
        </div>
      )}

      {/* Actions */}
      {user && user.id !== review.author_id && !review.is_reported && (
        <div className="flex justify-end pt-2 border-t border-steel-600">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-400 border-red-400/20 hover:bg-red-400/10">
                <Flag className="w-4 h-4 mr-2" />
                Пожаловаться
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="card-steel">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-steel-100">Пожаловаться на отзыв</AlertDialogTitle>
                <AlertDialogDescription className="text-steel-300">
                  Укажите причину жалобы. Модераторы рассмотрят ваше обращение.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4">
                <Textarea
                  placeholder="Опишите причину жалобы (нецензурная лексика, ложная информация, спам и т.д.)"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReportReview}
                  disabled={!reportReason.trim() || isReporting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isReporting ? "Отправка..." : "Отправить жалобу"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
};