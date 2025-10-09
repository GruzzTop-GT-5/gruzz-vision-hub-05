import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, CheckCircle, XCircle, Star, MessageSquare } from 'lucide-react';

interface Bid {
  id: string;
  order_id: string;
  executor_id: string;
  message: string;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telegram_photo_url: string | null;
  rating: number;
}

interface OrderBidsListProps {
  orderId: string;
  onBidAccepted?: () => void;
}

export function OrderBidsList({ orderId, onBidAccepted }: OrderBidsListProps) {
  const { toast } = useToast();
  const [bids, setBids] = useState<Bid[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);

  useEffect(() => {
    fetchBids();
  }, [orderId]);

  const fetchBids = async () => {
    try {
      const { data: bidsData, error } = await supabase
        .from('order_bids')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBids(bidsData || []);

      if (bidsData && bidsData.length > 0) {
        const executorIds = Array.from(new Set(bidsData.map(bid => bid.executor_id)));
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, avatar_url, telegram_photo_url, rating')
          .in('id', executorIds);

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отклики",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: string, executorId: string) => {
    setProcessingBidId(bidId);

    try {
      // Обновляем статус отклика
      const { error: bidError } = await supabase
        .from('order_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // Назначаем исполнителя на заказ
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          executor_id: executorId,
          status: 'in_progress'
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Отклоняем остальные отклики
      const { error: rejectError } = await supabase
        .from('order_bids')
        .update({ status: 'rejected' })
        .eq('order_id', orderId)
        .neq('id', bidId);

      if (rejectError) throw rejectError;

      toast({
        title: "Успешно",
        description: "Исполнитель назначен на заказ"
      });

      fetchBids();
      onBidAccepted?.();
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось принять отклик",
        variant: "destructive"
      });
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleRejectBid = async (bidId: string) => {
    setProcessingBidId(bidId);

    try {
      const { error } = await supabase
        .from('order_bids')
        .update({ status: 'rejected' })
        .eq('id', bidId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Отклик отклонен"
      });

      fetchBids();
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить отклик",
        variant: "destructive"
      });
    } finally {
      setProcessingBidId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Принят</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Отклонен</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Ожидает</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="card-steel p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-steel-300">Загрузка откликов...</p>
      </Card>
    );
  }

  if (bids.length === 0) {
    return (
      <Card className="card-steel p-8 text-center">
        <MessageSquare className="w-16 h-16 text-steel-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-steel-300 mb-2">Пока нет откликов</h3>
        <p className="text-steel-400">Исполнители еще не откликнулись на этот заказ</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-steel-100">
          Отклики исполнителей ({bids.length})
        </h3>
      </div>

      {bids.map((bid) => {
        const profile = profiles[bid.executor_id];
        const isProcessing = processingBidId === bid.id;

        return (
          <Card key={bid.id} className="card-steel p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile?.avatar_url || profile?.telegram_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600">
                      {(profile?.display_name || profile?.full_name || 'И').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-steel-100">
                      {profile?.display_name || profile?.full_name || 'Исполнитель'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`w-3 h-3 ${
                              index < Math.floor(profile?.rating || 0) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-steel-500'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-steel-400">
                        {profile?.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  {getStatusBadge(bid.status)}
                  <p className="text-xs text-steel-400">
                    {format(new Date(bid.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-steel-700/20 rounded-lg p-4">
                <p className="text-steel-200 whitespace-pre-wrap">{bid.message}</p>
              </div>

              {/* Actions */}
              {bid.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleAcceptBid(bid.id, bid.executor_id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-600/80"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Принять
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRejectBid(bid.id)}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Отклонить
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
