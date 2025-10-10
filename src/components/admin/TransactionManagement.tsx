import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Search, Check, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorHandler';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'purchase';
  status: 'pending' | 'completed' | 'rejected';
  payment_method: string | null;
  proof_image: string | null;
  created_at: string;
  admin_notes: string | null;
  profiles?: {
    phone: string;
    display_name: string;
  } | null;
}

export const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuthContext();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Загружаем транзакции
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'deposit') // Показываем только пополнения
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        setTransactions([]);
        return;
      }

      if (!transactionsData || transactionsData.length === 0) {
        setTransactions([]);
        return;
      }

      // Получаем уникальные user_id
      const userIds = [...new Set(transactionsData.map(t => t.user_id))];

      // Загружаем профили пользователей
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, phone, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Объединяем данные
      const transactionsWithProfiles = transactionsData.map(transaction => ({
        ...transaction,
        profiles: profilesData?.find(p => p.id === transaction.user_id) || null
      }));

      setTransactions(transactionsWithProfiles);
    } catch (error) {
      handleError(error, { component: 'TransactionManagement', action: 'fetchTransactions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const updateTransactionStatus = async (transactionId: string, newStatus: 'pending' | 'completed' | 'rejected', adminNotes?: string) => {
    try {
      // Проверка прав доступа
      if (!userRole || !['system_admin', 'admin', 'support'].includes(userRole)) {
        toast({
          title: "Ошибка доступа",
          description: "У вас недостаточно прав для выполнения этой операции",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes,
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Статус транзакции обновлен на "${newStatus}"`,
      });

      fetchTransactions();
    } catch (error) {
      handleError(error, { component: 'TransactionManagement', action: 'updateTransactionStatus' });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.profiles?.phone?.includes(searchTerm) ||
      transaction.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Выполнено</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Ожидает</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Отклонено</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Пополнение';
      case 'withdrawal': return 'Вывод';
      case 'payment': return 'Оплата';
      case 'purchase': return 'Покупка';
      default: return type;
    }
  };

  return (
    <Card className="card-steel p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-steel-100">Пополнения GT коинов</h3>
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
          1 GT коин = 1₽
        </Badge>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4" />
          <Input
            placeholder="Поиск по пользователю или ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="completed">Выполнено</SelectItem>
            <SelectItem value="rejected">Отклонено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 bg-steel-800 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-steel-100">
                      {transaction.profiles?.display_name || transaction.profiles?.phone}
                    </span>
                    {getStatusBadge(transaction.status)}
                    <span className="text-sm text-steel-400">
                      {getTypeLabel(transaction.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-steel-100">
                      {transaction.amount}₽
                    </span>
                    {transaction.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateTransactionStatus(transaction.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateTransactionStatus(transaction.id, 'rejected')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-steel-400">
                  <div className="flex items-center gap-4">
                    <span>ID: {transaction.id.slice(0, 8)}...</span>
                    <span>{format(new Date(transaction.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                    {transaction.payment_method && (
                      <span>Метод: {transaction.payment_method}</span>
                    )}
                  </div>
                  {transaction.proof_image && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(transaction.proof_image!, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Чек
                    </Button>
                  )}
                </div>
                
                {transaction.admin_notes && (
                  <div className="mt-2 p-2 bg-steel-700 rounded text-sm text-steel-300">
                    <strong>Заметки:</strong> {transaction.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};