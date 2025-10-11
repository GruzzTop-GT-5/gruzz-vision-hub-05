import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, FileImage, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatBalance } from '@/utils/currency';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  payment_method?: string;
  proof_image?: string;
  created_at: string;
  completed_at?: string;
  admin_notes?: string;
}

export const TransactionHistory = ({ isOpen, onClose, userId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, userId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить историю транзакций",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-400/20">Завершено</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/20">В обработке</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-400/20">Отклонено</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-400/20">Отменено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return <ArrowUpCircle className="w-5 h-5 text-green-400" />;
      case 'purchase':
      case 'payment':
      case 'withdrawal':
        return <ArrowDownCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Пополнение баланса';
      case 'payment':
        return 'Размещение заказа';
      case 'purchase':
        return 'Покупка услуги';
      case 'withdrawal':
        return 'Вывод средств';
      case 'refund':
        return 'Возврат средств';
      default:
        return 'Транзакция';
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'bank_card':
        return 'Банковская карта';
      case 'yoomoney':
        return 'ЮMoney';
      case 'ozon':
        return 'Ozon';
      case 'manual_transfer':
        return 'Ручной перевод';
      default:
        return method || 'Не указан';
    }
  };

  const viewProofImage = async (imagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(imagePath, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }

      if (data?.signedUrl) {
        setProofImageUrl(data.signedUrl);
        setShowProofModal(true);
      } else {
        throw new Error('Signed URL not generated');
      }
    } catch (error) {
      console.error('Error viewing proof:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось открыть изображение",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-steel-800 border-steel-600 data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
          <DialogHeader>
            <DialogTitle className="text-glow">История транзакций</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-steel-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-steel-800 border-steel-600 max-h-[80vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
        <DialogHeader>
          <DialogTitle className="text-glow">История транзакций</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {transactions.length === 0 ? (
            <Card className="card-steel p-8 text-center">
              <Clock className="w-12 h-12 text-steel-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-steel-200 mb-2">Нет транзакций</h3>
              <p className="text-steel-400">Ваши транзакции будут отображаться здесь</p>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction.id} className="card-steel p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(transaction.type)}
                    <div className="space-y-1">
                      <h4 className="font-medium text-steel-100">
                        {getTypeLabel(transaction.type)}
                      </h4>
                      <p className="text-sm text-steel-400">
                        {getPaymentMethodLabel(transaction.payment_method)}
                      </p>
                      <p className="text-xs text-steel-500">
                        {new Date(transaction.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-lg font-bold ${
                        transaction.type === 'purchase' || transaction.type === 'payment' || transaction.type === 'withdrawal' 
                          ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {transaction.type === 'purchase' || transaction.type === 'payment' || transaction.type === 'withdrawal' ? '-' : '+'}
                        {formatBalance(transaction.amount).gtCoins}
                      </span>
                      <span className="text-xs text-steel-500">
                        ≈ {formatBalance(transaction.amount).rubles}
                      </span>
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>

                {/* Additional Info */}
                {(transaction.proof_image || transaction.admin_notes) && (
                  <div className="mt-4 pt-4 border-t border-steel-600 space-y-2">
                    {transaction.proof_image && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewProofImage(transaction.proof_image!)}
                        className="text-xs"
                      >
                        <FileImage className="w-4 h-4 mr-1" />
                        Просмотреть скриншот
                      </Button>
                    )}
                    {transaction.admin_notes && (
                      <div className="bg-steel-700 p-2 rounded text-xs">
                        <p className="text-steel-400 mb-1">Комментарий администратора:</p>
                        <p className="text-steel-200">{transaction.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Proof Image Modal */}
        <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
          <DialogContent className="max-w-4xl bg-steel-800 border-steel-600 p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-steel-900/80 hover:bg-steel-900"
                onClick={() => setShowProofModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              {proofImageUrl && (
                <img 
                  src={proofImageUrl} 
                  alt="Чек об оплате" 
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};