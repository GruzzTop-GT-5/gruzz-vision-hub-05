import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface OrderBidFormProps {
  orderId: string;
  orderTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OrderBidForm({ orderId, orderTitle, isOpen, onClose, onSuccess }: OrderBidFormProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, напишите сопроводительное сообщение",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Ошибка",
          description: "Необходима авторизация",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('order_bids')
        .insert({
          order_id: orderId,
          executor_id: user.id,
          message: message.trim(),
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Ошибка",
            description: "Вы уже откликнулись на этот заказ",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Успешно",
        description: "Ваш отклик отправлен заказчику"
      });

      setMessage('');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить отклик",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-steel-100">
            Откликнуться на заказ
          </DialogTitle>
          <DialogDescription className="text-steel-300">
            {orderTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel-200">
              Сопроводительное сообщение
            </label>
            <Textarea
              placeholder="Расскажите заказчику о своем опыте и почему вы подходите для этой работы..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-steel-400">
              Опишите ваш опыт и предложите свои условия выполнения заказа
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex-1 bg-primary hover:bg-primary/80"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Отправить отклик
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
