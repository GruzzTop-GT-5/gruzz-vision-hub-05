import React, { memo, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageCircle, Flag, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Review, User } from '@/types/common';

interface OptimizedReviewCardProps {
  review: Review;
  author?: User;
  targetUser?: User;
  showActions?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  currentUserId?: string;
}

export const OptimizedReviewCard = memo<OptimizedReviewCardProps>(({
  review,
  author,
  targetUser,
  showActions = true,
  onEdit,
  onDelete,
  onReport,
  currentUserId
}) => {
  // Мемоизируем рейтинг звездочки
  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < review.rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-steel-500'
        }`}
      />
    ));
  }, [review.rating]);

  // Мемоизируем финальный рейтинг с бонусными баллами
  const finalRating = useMemo(() => {
    return Math.min(5, review.rating + (review.admin_bonus_points || 0));
  }, [review.rating, review.admin_bonus_points]);

  // Мемоизируем форматированную дату
  const formattedDate = useMemo(() => {
    return format(new Date(review.created_at), 'dd.MM.yyyy', { locale: ru });
  }, [review.created_at]);

  // Мемоизируем статус пользователя (автор ли)
  const isAuthor = useMemo(() => {
    return currentUserId === review.author_id;
  }, [currentUserId, review.author_id]);

  // Оптимизируем callback функции
  const handleEdit = useCallback(() => {
    onEdit?.(review);
  }, [onEdit, review]);

  const handleDelete = useCallback(() => {
    onDelete?.(review.id);
  }, [onDelete, review.id]);

  const handleReport = useCallback(() => {
    onReport?.(review.id);
  }, [onReport, review.id]);

  return (
    <Card className="card-steel p-4">
      <div className="flex items-start gap-3">
        {/* Аватар автора */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={author?.avatar_url || ''} />
          <AvatarFallback className="bg-steel-600 text-steel-200">
            {author?.display_name?.[0] || author?.phone?.[0] || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Заголовок отзыва */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-steel-100">
                {author?.display_name || author?.phone || 'Аноним'}
              </span>
              {review.is_moderated && (
                <Badge className="bg-blue-500 text-white text-xs">Проверен</Badge>
              )}
              {review.admin_bonus_points > 0 && (
                <Badge className="bg-purple-500 text-white text-xs">
                  +{review.admin_bonus_points} бонус
                </Badge>
              )}
            </div>
            <span className="text-steel-500 text-sm">{formattedDate}</span>
          </div>

          {/* Рейтинг */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">{stars}</div>
            <span className="text-steel-300 font-medium">{finalRating}/5</span>
            {review.admin_bonus_points > 0 && (
              <span className="text-purple-400 text-sm">
                (базовый {review.rating})
              </span>
            )}
          </div>

          {/* Комментарий */}
          {review.comment && (
            <p className="text-steel-300 mb-3 whitespace-pre-wrap">
              {review.comment}
            </p>
          )}

          {/* Целевой пользователь */}
          {targetUser && (
            <div className="text-sm text-steel-400 mb-3">
              Отзыв о пользователе: {targetUser.display_name || targetUser.phone}
            </div>
          )}

          {/* Административный комментарий */}
          {review.admin_comment && (
            <div className="bg-steel-700 rounded p-2 mb-3">
              <p className="text-steel-300 text-sm">
                <strong>Комментарий модератора:</strong> {review.admin_comment}
              </p>
            </div>
          )}

          {/* Действия */}
          {showActions && (
            <div className="flex items-center gap-2 pt-2 border-t border-steel-600">
              <Button
                variant="ghost"
                size="sm"
                className="text-steel-400 hover:text-steel-200"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Полезно
              </Button>

              {!isAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReport}
                  className="text-steel-400 hover:text-red-400"
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Пожаловаться
                </Button>
              )}

              {isAuthor && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="text-steel-400 hover:text-blue-400"
                >
                  Редактировать
                </Button>
              )}

              {isAuthor && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-steel-400 hover:text-red-400"
                >
                  Удалить
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-steel-400 hover:text-steel-200 ml-auto"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Ответить
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

OptimizedReviewCard.displayName = 'OptimizedReviewCard';