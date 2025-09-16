import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { Eye, EyeOff, Plus, Minus, MessageSquare, User, Calendar, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  is_hidden: boolean;
  admin_bonus_points: number;
  admin_comment: string | null;
  author_profile: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
  };
  target_profile: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
    rating: number;
  };
}

export function AdminReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [adminComment, setAdminComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          is_hidden,
          admin_bonus_points,
          admin_comment,
          author_profile:profiles!reviews_author_id_fkey (
            display_name,
            full_name,
            phone
          ),
          target_profile:profiles!reviews_target_user_id_fkey (
            display_name,
            full_name,
            phone,
            rating
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отзывы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openModerationDialog = (review: Review) => {
    setSelectedReview(review);
    setBonusPoints(review.admin_bonus_points);
    setAdminComment(review.admin_comment || '');
  };

  const handleModeration = async () => {
    if (!selectedReview) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          admin_bonus_points: bonusPoints,
          admin_comment: adminComment || null,
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Отзыв обновлен"
      });

      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить отзыв",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleReviewVisibility = async (reviewId: string, currentlyHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_hidden: !currentlyHidden,
          hidden_at: !currentlyHidden ? new Date().toISOString() : null
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: currentlyHidden ? "Отзыв показан" : "Отзыв скрыт"
      });

      fetchReviews();
    } catch (error) {
      console.error('Error toggling review visibility:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить видимость отзыва",
        variant: "destructive"
      });
    }
  };

  const getUserName = (profile: any) => {
    return profile?.display_name || profile?.full_name || profile?.phone || 'Неизвестный пользователь';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-center text-steel-300">Загрузка отзывов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-glow">Модерация отзывов</h2>
        <Badge variant="secondary">
          {reviews.length} отзывов
        </Badge>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id} className="card-steel p-6">
            <div className="space-y-4">
              {/* Header with user info and rating */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-steel-400" />
                    <span className="text-steel-200">
                      {getUserName(review.author_profile)} → {getUserName(review.target_profile)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-steel-400" />
                    <span className="text-sm text-steel-400">
                      {format(new Date(review.created_at), 'dd MMMM yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {review.is_hidden && (
                    <Badge variant="destructive">Скрыт</Badge>
                  )}
                  {review.admin_bonus_points !== 0 && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>{review.admin_bonus_points > 0 ? '+' : ''}{review.admin_bonus_points}</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Rating and comment */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <StarRating rating={review.rating} />
                  <span className="text-steel-300">({review.rating}/5)</span>
                  {review.admin_bonus_points !== 0 && (
                    <span className="text-primary">
                      → Итого: {review.rating + review.admin_bonus_points}
                    </span>
                  )}
                </div>
                
                {review.comment && (
                  <div className="bg-steel-800/30 p-3 rounded-lg">
                    <p className="text-steel-200">{review.comment}</p>
                  </div>
                )}

                {review.admin_comment && (
                  <div className="bg-primary-600/10 border border-primary-600/20 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Комментарий администратора</span>
                    </div>
                    <p className="text-steel-200">{review.admin_comment}</p>
                  </div>
                )}
              </div>

              {/* Target user current rating */}
              <div className="bg-steel-800/20 p-3 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-steel-400">Текущий рейтинг пользователя:</span>
                  <span className="text-primary font-medium">
                    {review.target_profile.rating?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleReviewVisibility(review.id, review.is_hidden)}
                >
                  {review.is_hidden ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Показать
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Скрыть
                    </>
                  )}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openModerationDialog(review)}
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Модерировать
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="card-steel">
                    <DialogHeader>
                      <DialogTitle className="text-glow">Модерация отзыва</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Бонусные баллы</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBonusPoints(Math.max(-5, bonusPoints - 1))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={bonusPoints}
                            onChange={(e) => setBonusPoints(Math.max(-5, Math.min(5, parseInt(e.target.value) || 0)))}
                            className="w-20 text-center"
                            min="-5"
                            max="5"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBonusPoints(Math.min(5, bonusPoints + 1))}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-steel-400 mt-1">
                          От -5 до +5 баллов. Влияет на итоговый рейтинг пользователя.
                        </p>
                      </div>

                      <div>
                        <Label>Комментарий администратора</Label>
                        <Textarea
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          placeholder="Объясните причину корректировки рейтинга..."
                          className="mt-2"
                        />
                      </div>

                      <div className="bg-steel-800/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span>Итоговый балл отзыва:</span>
                          <span className="font-medium text-primary">
                            {review.rating} + {bonusPoints} = {review.rating + bonusPoints}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedReview(null)}
                        >
                          Отмена
                        </Button>
                        <Button
                          onClick={handleModeration}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Сохраняем...' : 'Сохранить'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-steel-400 mx-auto mb-4" />
            <p className="text-steel-300">Отзывы не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}