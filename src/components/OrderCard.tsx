import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { ReviewModal } from '@/components/ReviewModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  User,
  Calendar,
  CreditCard,
  MessageSquare,
  Upload,
  Star,
  FileText,
  Play,
  Pause
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Order {
  id: string;
  order_number: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  status: string;
  priority: string;
  deadline: string | null;
  client_id: string;
  executor_id: string | null;
  ad_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  payment_status: string;
  payment_method: string | null;
  client_requirements: any;
  executor_proposal: any;
  delivery_format: string | null;
  revision_count: number;
  max_revisions: number;
  escrow_amount: number | null;
  commission_rate: number;
  platform_fee: number | null;
}

interface OrderCardProps {
  order: Order;
  clientProfile?: any;
  executorProfile?: any;
  onUpdate: () => void;
}

export const OrderCard = ({ order, clientProfile, executorProfile, onUpdate }: OrderCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const isClient = user?.id === order.client_id;
  const isExecutor = user?.id === order.executor_id;
  const canManageOrder = isClient || isExecutor;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        icon: Clock, 
        color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
        label: 'Ожидает'
      },
      accepted: { 
        icon: CheckCircle, 
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        label: 'Принят'
      },
      in_progress: { 
        icon: Play, 
        color: 'text-primary bg-primary/10 border-primary/20',
        label: 'В работе'
      },
      review: { 
        icon: AlertCircle, 
        color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        label: 'На проверке'
      },
      revision: { 
        icon: AlertCircle, 
        color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        label: 'Доработка'
      },
      completed: { 
        icon: CheckCircle, 
        color: 'text-green-400 bg-green-400/10 border-green-400/20',
        label: 'Завершен'
      },
      cancelled: { 
        icon: XCircle, 
        color: 'text-red-400 bg-red-400/10 border-red-400/20',
        label: 'Отменен'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">Неизвестно</Badge>;

    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'text-green-400 bg-green-400/10 border-green-400/20', label: 'Низкий' },
      normal: { color: 'text-steel-400 bg-steel-400/10 border-steel-400/20', label: 'Обычный' },
      high: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', label: 'Высокий' },
      urgent: { color: 'text-red-400 bg-red-400/10 border-red-400/20', label: 'Срочный' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      pending: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', label: 'Ожидает' },
      paid: { color: 'text-green-400 bg-green-400/10 border-green-400/20', label: 'Оплачено' },
      escrow: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'В эскроу' },
      refunded: { color: 'text-red-400 bg-red-400/10 border-red-400/20', label: 'Возвращено' }
    };

    const config = statusConfig[paymentStatus as keyof typeof statusConfig];
    if (!config) return null;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const updateOrderStatus = async (status: string, reason?: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Статус обновлен",
        description: `Заказ переведен в статус: ${getStatusLabel(status)}`
      });

      onUpdate();
      setShowStatusDialog(false);
      setStatusReason('');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Ожидает',
      accepted: 'Принят',
      in_progress: 'В работе',
      review: 'На проверке',
      revision: 'Доработка',
      completed: 'Завершен',
      cancelled: 'Отменен'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getAvailableStatusTransitions = () => {
    if (!canManageOrder) return [];

    switch (order.status) {
      case 'pending':
        return isExecutor ? [
          { status: 'accepted', label: 'Принять заказ', variant: 'default' },
          { status: 'cancelled', label: 'Отклонить', variant: 'destructive' }
        ] : [];
      
      case 'accepted':
        return isExecutor ? [
          { status: 'in_progress', label: 'Начать работу', variant: 'default' }
        ] : isClient ? [
          { status: 'cancelled', label: 'Отменить заказ', variant: 'destructive' }
        ] : [];
      
      case 'in_progress':
        return isExecutor ? [
          { status: 'review', label: 'Сдать на проверку', variant: 'default' }
        ] : [];
      
      case 'review':
        return isClient ? [
          { status: 'completed', label: 'Принять работу', variant: 'default' },
          { status: 'revision', label: 'Отправить на доработку', variant: 'outline' }
        ] : [];
      
      case 'revision':
        return isExecutor ? [
          { status: 'review', label: 'Сдать на проверку', variant: 'default' }
        ] : [];
      
      default:
        return [];
    }
  };

  const handleChatClick = async () => {
    if (!user?.id) return;
    
    setIsCreatingChat(true);
    try {
      // Ищем существующую беседу для этого заказа
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [user.id])
        .eq('type', 'chat')
        .ilike('title', `%${order.order_number}%`)
        .limit(1);

      if (searchError) throw searchError;

      let conversationId = null;

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Создаем новую беседу
        const participants = [order.client_id];
        if (order.executor_id && !participants.includes(order.executor_id)) {
          participants.push(order.executor_id);
        }

        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            type: 'chat',
            title: `Чат по заказу ${order.order_number}`,
            participants: participants,
            created_by: user.id,
            status: 'active'
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }

      // Переходим к чату
      window.location.href = `/chat?conversation=${conversationId}`;
      
    } catch (error) {
      console.error('Error creating/finding chat:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось открыть чат",
        variant: "destructive"
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const statusTransitions = getAvailableStatusTransitions();

  return (
    <Card className="card-steel">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl text-steel-100">{order.title}</CardTitle>
            </div>
            <div className="flex items-center space-x-2 text-sm text-steel-400">
              <span>#{order.order_number}</span>
              <span>•</span>
              <span>{order.category || 'Без категории'}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(order.status)}
            {order.priority !== 'normal' && getPriorityBadge(order.priority)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {order.description && (
          <p className="text-steel-200 line-clamp-3">{order.description}</p>
        )}

        {/* Participants */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-steel-400" />
              <span className="text-sm text-steel-300">Клиент:</span>
              <Avatar className="w-6 h-6">
                <AvatarImage src={clientProfile?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {(clientProfile?.display_name || clientProfile?.full_name || 'K').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-steel-100">
                {clientProfile?.display_name || clientProfile?.full_name || 'Клиент'}
              </span>
            </div>
          </div>

          {order.executor_id && executorProfile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-steel-300">Исполнитель:</span>
              <Avatar className="w-6 h-6">
                <AvatarImage src={executorProfile?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {(executorProfile?.display_name || executorProfile?.full_name || 'И').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-steel-100">
                {executorProfile?.display_name || executorProfile?.full_name || 'Исполнитель'}
              </span>
            </div>
          )}
        </div>

        {/* Price and Payment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-primary">
              {order.price.toLocaleString('ru-RU')} GT
            </div>
            {order.payment_status && (
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-steel-400" />
                {getPaymentStatusBadge(order.payment_status)}
              </div>
            )}
          </div>

          {order.deadline && (
            <div className="flex items-center space-x-2 text-steel-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Срок: {format(new Date(order.deadline), 'dd.MM.yyyy', { locale: ru })}
              </span>
            </div>
          )}
        </div>

        {/* Revision Info */}
        {order.revision_count > 0 && (
          <div className="flex items-center space-x-2 text-sm text-steel-400">
            <AlertCircle className="w-4 h-4" />
            <span>Доработок: {order.revision_count} из {order.max_revisions}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-steel-600">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleChatClick}
              disabled={isCreatingChat}
            >
              {isCreatingChat ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-1" />
              )}
              Чат
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetailsModal(true)}
            >
              <FileText className="w-4 h-4 mr-1" />
              Детали
            </Button>

            {order.status === 'completed' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowReviewModal(true)}
              >
                <Star className="w-4 h-4 mr-1" />
                Оценить
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {statusTransitions.map((transition) => (
              <Dialog key={transition.status} open={showStatusDialog && newStatus === transition.status} onOpenChange={(open) => {
                setShowStatusDialog(open);
                if (open) setNewStatus(transition.status);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    variant={transition.variant as any} 
                    size="sm"
                    disabled={isUpdating}
                  >
                    {transition.label}
                  </Button>
                </DialogTrigger>
                <DialogContent className="card-steel-dialog max-w-md data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
                  <DialogHeader>
                    <DialogTitle>Подтверждение действия</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <p className="text-steel-300">
                      Вы уверены, что хотите {transition.label.toLowerCase()}?
                    </p>
                    
                    {(transition.status === 'cancelled' || transition.status === 'revision') && (
                      <div>
                        <Label htmlFor="reason">Причина (необязательно)</Label>
                        <Textarea
                          id="reason"
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="Укажите причину..."
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => updateOrderStatus(transition.status, statusReason)}
                        disabled={isUpdating}
                        className="flex-1"
                        variant={transition.variant as any}
                      >
                        {isUpdating ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        Подтвердить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowStatusDialog(false)}
                        className="flex-1"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-steel-400 space-y-1">
          <div>Создан: {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</div>
          {order.completed_at && (
            <div>Завершен: {format(new Date(order.completed_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</div>
          )}
          {order.cancelled_at && (
            <div>Отменен: {format(new Date(order.cancelled_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</div>
          )}
        </div>

        {/* Order Details Modal */}
        <OrderDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          order={order}
          clientProfile={clientProfile}
          executorProfile={executorProfile}
          onUpdate={onUpdate}
        />

        {/* Review Modal */}
        {showReviewModal && (
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            orderId={order.id}
            reviewedUserId={isClient ? order.executor_id! : order.client_id}
            reviewedUserName={
              isClient 
                ? (executorProfile?.display_name || executorProfile?.full_name || 'Исполнитель')
                : (clientProfile?.display_name || clientProfile?.full_name || 'Клиент')
            }
            onReviewSubmitted={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
};