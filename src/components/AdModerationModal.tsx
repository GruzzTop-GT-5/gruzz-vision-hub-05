import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Clock,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
  user_id: string;
  user?: {
    display_name: string | null;
    phone: string | null;
    rating: number;
  };
}

interface AdModerationModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
  onAdUpdate: () => void;
}

export const AdModerationModal = ({ ad, isOpen, onClose, onAdUpdate }: AdModerationModalProps) => {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState('');
  const [moderationComment, setModerationComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!ad) return null;

  const handleStatusChange = async (status: string) => {
    if (!moderationComment.trim() && status !== 'active') {
      toast({
        title: "Ошибка",
        description: "Комментарий обязателен при изменении статуса",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Direct update with any status type
      const { error } = await supabase
        .from('ads')
        .update({ 
          status: status as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', ad.id);

      if (error) throw error;

      // Создаем уведомление для пользователя
      const statusMessages = {
        'active': 'Ваше объявление одобрено и опубликовано',
        'rejected': 'Ваше объявление отклонено',
        'pending_review': 'Ваше объявление требует дополнительной проверки',
        'suspended': 'Ваше объявление приостановлено'
      };

      await supabase
        .from('notifications')
        .insert({
          user_id: ad.user_id,
          type: 'ad_moderation',
          title: 'Модерация объявления',
          content: `${statusMessages[status as keyof typeof statusMessages]}${moderationComment ? '. Комментарий: ' + moderationComment : ''}`
        });

      toast({
        title: "Успешно",
        description: "Статус объявления обновлен"
      });

      onAdUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Ошибка", 
        description: "Не удалось обновить статус объявления",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'suspended': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-steel-400 bg-steel-400/10 border-steel-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активно';
      case 'pending': return 'На проверке';
      case 'rejected': return 'Отклонено';
      case 'suspended': return 'Приостановлено';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Модерация объявления</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ad Information */}
          <Card className="card-steel-lighter p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-steel-300">Заголовок</label>
                <p className="text-steel-100 font-medium">{ad.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-steel-300">Категория</label>
                <p className="text-steel-100">{ad.category}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-steel-300">Цена</label>
                <p className="text-steel-100 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {ad.price} GT Coins
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-steel-300">Текущий статус</label>
                <Badge className={getStatusColor(ad.status)}>
                  {getStatusLabel(ad.status)}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-steel-300">Автор</label>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-steel-400" />
                  <span className="text-steel-100">{ad.user?.display_name || ad.user?.phone || 'Неизвестен'}</span>
                  {ad.user?.rating && (
                    <span className="text-yellow-400">★ {ad.user.rating.toFixed(1)}</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-steel-300">Дата создания</label>
                <p className="text-steel-100 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(ad.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                </p>
              </div>
            </div>
            
            {ad.description && (
              <div className="mt-4">
                <label className="text-sm font-medium text-steel-300">Описание</label>
                <p className="text-steel-100 bg-steel-700 p-3 rounded mt-1">{ad.description}</p>
              </div>
            )}
          </Card>

          {/* Moderation Actions */}
          <Card className="card-steel-lighter p-4">
            <h3 className="text-lg font-semibold text-steel-100 mb-4">Действия модерации</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-steel-300 mb-2 block">
                  Комментарий модератора *
                </label>
                <Textarea
                  value={moderationComment}
                  onChange={(e) => setModerationComment(e.target.value)}
                  placeholder="Укажите причину изменения статуса, рекомендации для пользователя..."
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => handleStatusChange('active')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Одобрить</span>
                </Button>

                <Button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={loading || !moderationComment.trim()}
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Отклонить</span>
                </Button>

                <Button
                  onClick={() => handleStatusChange('pending_review')}
                  disabled={loading || !moderationComment.trim()}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>На доработку</span>
                </Button>

                <Button
                  onClick={() => handleStatusChange('suspended')}
                  disabled={loading || !moderationComment.trim()}
                  variant="outline"
                  className="flex items-center space-x-2 text-orange-400 border-orange-400/20 hover:bg-orange-400/10"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Приостановить</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Rejection Reasons */}
          <Card className="card-steel-lighter p-4">
            <h4 className="text-md font-medium text-steel-100 mb-3">Быстрые причины отклонения</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "Неподходящий контент",
                "Нарушение правил платформы", 
                "Недостаточно информации",
                "Неверная категория",
                "Подозрительная активность",
                "Спам или дублирование",
                "Некорректная цена",
                "Низкое качество описания"
              ].map((reason) => (
                <Button
                  key={reason}
                  variant="ghost"
                  size="sm"
                  onClick={() => setModerationComment(reason)}
                  className="text-left justify-start text-steel-300 hover:text-steel-100 hover:bg-steel-700"
                >
                  {reason}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};