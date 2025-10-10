import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Star, 
  User, 
  Calendar,
  MessageSquare,
  Shield,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  admin_bonus_points: number;
  transaction_id?: string;
  author: {
    id: string;
    display_name?: string;
    phone?: string;
    rating: number;
  };
  target_user: {
    id: string;
    display_name?: string;
    phone?: string;
    rating: number;
  };
}

export function ReviewModerationQueue() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [bonusPoints, setBonusPoints] = useState(0);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    fetchReviews();
    subscribeToReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('reviews')
        .select(`
          *,
          author:profiles!reviews_author_id_fkey(id, display_name, phone, rating),
          target_user:profiles!reviews_target_user_id_fkey(id, display_name, phone, rating)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('moderation_status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить отзывы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToReviews = () => {
    const channel = supabase
      .channel('review-moderation')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleApprove = async (review: Review) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          moderation_status: 'approved',
          admin_bonus_points: bonusPoints,
          moderated_by: (await supabase.auth.getUser()).data.user?.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', review.id);

      if (error) throw error;

      // Уведомляем автора отзыва
      await supabase.from('notifications').insert({
        user_id: review.author.id,
        type: 'review_approved',
        title: 'Отзыв одобрен',
        content: `Ваш отзыв был проверен и одобрен${bonusPoints !== 0 ? ` с бонусом ${bonusPoints > 0 ? '+' : ''}${bonusPoints} баллов` : ''}`
      });

      toast({
        title: 'Отзыв одобрен',
        description: 'Отзыв успешно одобрен и влияет на рейтинг'
      });

      setBonusPoints(0);
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось одобрить отзыв',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async () => {
    if (!selectedReview || !rejectionReason.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите причину отклонения',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          moderation_status: 'rejected',
          rejection_reason: rejectionReason,
          moderated_by: (await supabase.auth.getUser()).data.user?.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      // Уведомляем автора
      await supabase.from('notifications').insert({
        user_id: selectedReview.author.id,
        type: 'review_rejected',
        title: 'Отзыв отклонен',
        content: `Ваш отзыв был отклонен. Причина: ${rejectionReason}`
      });

      toast({
        title: 'Отзыв отклонен',
        description: 'Отзыв отклонен и не влияет на рейтинг'
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отклонить отзыв',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ожидает проверки</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Одобрен</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонен</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="card-steel p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-steel-700 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-steel">
        <div className="p-6 border-b border-steel-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-steel-100">Модерация отзывов</h2>
              <p className="text-sm text-steel-400 mt-1">
                Проверка и одобрение отзывов перед публикацией
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
              >
                Ожидают ({reviews.filter(r => r.moderation_status === 'pending').length})
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                Все
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-steel-400 mx-auto mb-4" />
                <p className="text-steel-300">
                  {filter === 'pending' ? 'Нет отзывов на модерации' : 'Отзывы не найдены'}
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="card-steel p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(review.moderation_status)}
                        {review.transaction_id && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Проверенный заказ
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-steel-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-steel-400 mb-1">Автор отзыва:</p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-steel-400" />
                          <span className="text-steel-100">
                            {review.author.display_name || review.author.phone}
                          </span>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-steel-300">{review.author.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-steel-400 mb-1">Оценивает:</p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-steel-400" />
                          <span className="text-steel-100">
                            {review.target_user.display_name || review.target_user.phone}
                          </span>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-steel-300">{review.target_user.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="bg-steel-700/30 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-steel-400" />
                          <span className="text-sm text-steel-400">Комментарий:</span>
                        </div>
                        <p className="text-steel-200">{review.comment}</p>
                      </div>
                    )}

                    {review.rejection_reason && (
                      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
                        <p className="text-sm text-red-400">
                          <strong>Причина отклонения:</strong> {review.rejection_reason}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-steel-400">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(review.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </div>

                    {review.moderation_status === 'pending' && (
                      <div className="flex gap-2 pt-3 border-t border-steel-600">
                        <div className="flex-1">
                          <Label className="text-xs text-steel-400 mb-1">Бонусные баллы</Label>
                          <Input
                            type="number"
                            value={selectedReview?.id === review.id ? bonusPoints : 0}
                            onChange={(e) => {
                              setSelectedReview(review);
                              setBonusPoints(parseInt(e.target.value) || 0);
                            }}
                            className="w-full"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex gap-2 items-end">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              handleApprove(review);
                            }}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Одобрить
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setShowRejectDialog(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Диалог отклонения */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить отзыв</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения. Автор отзыва получит уведомление.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Причина отклонения</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Например: Нарушение правил, оскорбления, недостоверная информация..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Отклонить отзыв
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}