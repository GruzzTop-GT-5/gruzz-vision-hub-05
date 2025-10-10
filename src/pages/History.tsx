import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AuthRequired } from '@/components/AuthRequired';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Star, Calendar, CheckCircle, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Order {
  id: string;
  title: string;
  price: number;
  category: string;
  completed_at: string;
  client_id: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  payment_details: any;
  completed_at: string;
}

const History = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    completedCount: 0,
    totalEarnings: 0,
    rating: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    }
  }, [user?.id]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Получаем профиль пользователя с рейтингом
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rating, balance')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Получаем завершенные заказы где пользователь executor
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, title, price, category, completed_at, client_id')
        .eq('executor_id', user?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);

      if (ordersError) throw ordersError;
      setCompletedOrders(orders || []);

      // Получаем транзакции пользователя
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Подсчет общего дохода из завершенных заказов
      const totalEarnings = orders?.reduce((sum, order) => sum + Number(order.price || 0), 0) || 0;

      setStats({
        completedCount: orders?.length || 0,
        totalEarnings,
        rating: profile?.rating || 0
      });
    } catch (error) {
      console.error('Error fetching history data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить историю',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-steel-500'
        }`}
      />
    ));
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Пополнение';
      case 'withdrawal': return 'Вывод';
      case 'payment': return 'Оплата';
      case 'purchase': return 'Покупка';
      default: return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit') {
      return <ArrowUpCircle className="w-5 h-5 text-green-400" />;
    }
    return <ArrowDownCircle className="w-5 h-5 text-red-400" />;
  };

  return (
    <AuthRequired>
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <AnimatedBackground className="min-h-screen p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-glow">История работ</h1>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Завершенных работ */}
              <Card className="card-steel border-steel-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-steel-100 mb-1">
                        {loading ? "..." : stats.completedCount}
                      </div>
                      <div className="text-sm text-steel-400">Завершенных работ</div>
                    </div>
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Общий доход */}
              <Card className="card-steel border-steel-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary mb-1">
                        {loading ? "..." : `${stats.totalEarnings.toLocaleString('ru-RU')}₽`}
                      </div>
                      <div className="text-sm text-steel-400">Общий доход</div>
                    </div>
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Средний рейтинг */}
              <Card className="card-steel border-steel-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-2xl font-bold text-yellow-400">
                          {loading ? "..." : stats.rating > 0 ? stats.rating.toFixed(1) : "0.0"}
                        </span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      </div>
                      <div className="text-sm text-steel-400">Средний рейтинг</div>
                    </div>
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Вкладки */}
            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Завершенные работы</TabsTrigger>
                <TabsTrigger value="transactions">Транзакции</TabsTrigger>
              </TabsList>

              {/* Завершенные работы */}
              <TabsContent value="orders" className="space-y-4">
                {!loading && completedOrders.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-steel-300 mb-2">История пуста</h3>
                    <p className="text-steel-400">Ваши завершенные работы будут отображаться здесь</p>
                  </div>
                )}

                {completedOrders.map((order) => (
                  <Card key={order.id} className="card-steel">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-xl text-steel-100">{order.title}</CardTitle>
                          <Badge variant="outline" className="text-primary border-primary">
                            {order.category || 'Без категории'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {Number(order.price || 0).toLocaleString('ru-RU')}₽
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-steel-400" />
                            <span className="text-steel-400 text-sm">
                              {order.completed_at 
                                ? format(new Date(order.completed_at), 'd MMMM yyyy', { locale: ru })
                                : 'Дата неизвестна'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </TabsContent>

              {/* Транзакции */}
              <TabsContent value="transactions" className="space-y-4">
                {!loading && transactions.length === 0 && (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-steel-300 mb-2">Нет транзакций</h3>
                    <p className="text-steel-400">История ваших операций будет отображаться здесь</p>
                  </div>
                )}

                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="card-steel">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="font-semibold text-steel-100">
                              {getTransactionTypeLabel(transaction.type)}
                            </div>
                            <div className="text-sm text-steel-400">
                              {format(new Date(transaction.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                            </div>
                            {transaction.payment_details?.source && (
                              <div className="text-xs text-steel-500 mt-1">
                                {transaction.payment_details.source === 'promo_code' && 'Промокод'}
                                {transaction.payment_details.promo_name && ` - ${transaction.payment_details.promo_name}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${
                          transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'}
                          {Number(transaction.amount || 0).toLocaleString('ru-RU')}₽
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {loading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-steel-400">Загрузка истории...</p>
              </div>
            )}
          </div>
        </AnimatedBackground>
      </Layout>
    </AuthRequired>
  );
};

export default History;
