import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Megaphone,
  CreditCard,
  MessageSquare,
  Shield,
  Eye,
  Ban,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { StarRating } from '@/components/StarRating';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  phone: string | null;
  role: string;
  rating: number | null;
  balance: number;
  created_at: string;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
  user_id: string;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  created_at: string;
  proof_image: string | null;
}

interface Review {
  id: string;
  author_id: string;
  target_user_id: string;
  rating: number | null;
  comment: string | null;
  is_reported: boolean;
  is_moderated: boolean;
  created_at: string;
}

interface ReportedReview extends Review {
  reports: Array<{
    id: string;
    reason: string;
    reporter_id: string;
    created_at: string;
  }>;
}

export default function AdminPanel() {
  const { user, userRole, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  // States for different admin sections
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reportedReviews, setReportedReviews] = useState<ReportedReview[]>([]);
  
  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  
  // Filter states
  const [userFilter, setUserFilter] = useState('');
  const [adStatusFilter, setAdStatusFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');

  const isAdmin = userRole && ['system_admin', 'admin', 'moderator'].includes(userRole);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAds();
      fetchTransactions();
      fetchReportedReviews();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAds = async () => {
    setIsLoadingAds(true);
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить объявления",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAds(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить транзакции",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const fetchReportedReviews = async () => {
    setIsLoadingReviews(true);
    try {
      // Get reported reviews with their reports
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          reports:review_reports(*)
        `)
        .eq('is_reported', true)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReportedReviews(reviews || []);
    } catch (error) {
      console.error('Error fetching reported reviews:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить жалобы на отзывы",
        variant: "destructive"
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Роль обновлена",
        description: "Роль пользователя успешно изменена"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive"
      });
    }
  };

  const moderateAd = async (adId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: status as any })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Объявление обновлено",
        description: `Статус объявления изменен на: ${status}`
      });

      fetchAds();
    } catch (error) {
      console.error('Error moderating ad:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить объявление",
        variant: "destructive"
      });
    }
  };

  const verifyTransaction = async (transactionId: string, status: string, adminNotes?: string) => {
    try {
      const updateData: any = { 
        status,
        processed_by: user?.id 
      };
      
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Транзакция обновлена",
        description: `Статус транзакции изменен на: ${status}`
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error verifying transaction:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить транзакцию",
        variant: "destructive"
      });
    }
  };

  const moderateReview = async (reviewId: string, action: 'approve' | 'block') => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_moderated: action === 'block',
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id,
          is_reported: false
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Отзыв обработан",
        description: action === 'approve' ? "Отзыв одобрен" : "Отзыв заблокирован"
      });

      fetchReportedReviews();
    } catch (error) {
      console.error('Error moderating review:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обработать отзыв",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, type: 'ad' | 'transaction') => {
    const colors = {
      active: 'bg-green-500/10 text-green-400 border-green-500/20',
      inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return <Badge className={colors[status as keyof typeof colors]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-steel-300">Загрузка...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <Shield className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Доступ запрещен</h2>
            <p className="text-steel-300">У вас нет прав для доступа к админ-панели</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton onClick={() => window.history.back()} />
            <h1 className="text-3xl font-bold text-glow">Админ-панель</h1>
            <div></div>
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Пользователи</span>
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4" />
                <span>Объявления</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Транзакции</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Жалобы</span>
              </TabsTrigger>
            </TabsList>

            {/* Users Management */}
            <TabsContent value="users" className="space-y-6">
              <Card className="card-steel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-steel-100">Управление пользователями</h2>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-steel-400" />
                    <Input
                      placeholder="Поиск по ID или телефону..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>

                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users
                      .filter(user => 
                        user.id.includes(userFilter) || 
                        (user.phone && user.phone.includes(userFilter))
                      )
                      .map((userData) => (
                      <div key={userData.id} className="bg-steel-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-steel-100">
                                ID: {userData.id.slice(0, 8)}...
                              </span>
                              <Badge className={
                                userData.role === 'system_admin' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                                userData.role === 'admin' ? 'text-primary bg-primary/10 border-primary/20' :
                                userData.role === 'moderator' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                                userData.role === 'support' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                'text-steel-400 bg-steel-400/10 border-steel-400/20'
                              }>
                                {userData.role}
                              </Badge>
                            </div>
                            <div className="text-sm text-steel-300 space-y-1">
                              <p>Телефон: {userData.phone || 'Не указан'}</p>
                              <p>Баланс: {userData.balance} GT Coins</p>
                              <div className="flex items-center space-x-2">
                                <span>Рейтинг:</span>
                                <StarRating rating={userData.rating || 0} size="sm" />
                              </div>
                              <p>Регистрация: {format(new Date(userData.created_at), 'dd.MM.yyyy', { locale: ru })}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Select
                              value={userData.role}
                              onValueChange={(newRole) => updateUserRole(userData.id, newRole)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Пользователь</SelectItem>
                                <SelectItem value="support">Поддержка</SelectItem>
                                <SelectItem value="moderator">Модератор</SelectItem>
                                <SelectItem value="admin">Админ</SelectItem>
                                {userRole === 'system_admin' && (
                                  <SelectItem value="system_admin">Системный админ</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Ads Management */}
            <TabsContent value="ads" className="space-y-6">
              <Card className="card-steel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-steel-100">Модерация объявлений</h2>
                  <Select value={adStatusFilter} onValueChange={setAdStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="inactive">Неактивные</SelectItem>
                      <SelectItem value="pending">На модерации</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingAds ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ads
                      .filter(ad => adStatusFilter === 'all' || ad.status === adStatusFilter)
                      .map((ad) => (
                      <div key={ad.id} className="bg-steel-800/50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-steel-100">{ad.title}</h3>
                              {getStatusBadge(ad.status, 'ad')}
                            </div>
                            <p className="text-steel-300 text-sm">{ad.description.slice(0, 150)}...</p>
                            <div className="text-xs text-steel-400 space-y-1">
                              <p>Категория: {ad.category}</p>
                              <p>Цена: {ad.price.toLocaleString()} ₽</p>
                              <p>Автор: {ad.user_id.slice(0, 8)}...</p>
                              <p>Создано: {format(new Date(ad.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moderateAd(ad.id, 'active')}
                              className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moderateAd(ad.id, 'inactive')}
                              className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Transactions Management */}
            <TabsContent value="transactions" className="space-y-6">
              <Card className="card-steel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-steel-100">Верификация транзакций</h2>
                  <Select value={transactionStatusFilter} onValueChange={setTransactionStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="pending">На проверке</SelectItem>
                      <SelectItem value="completed">Завершенные</SelectItem>
                      <SelectItem value="rejected">Отклоненные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingTransactions ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions
                      .filter(transaction => transactionStatusFilter === 'all' || transaction.status === transactionStatusFilter)
                      .map((transaction) => (
                      <div key={transaction.id} className="bg-steel-800/50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-steel-100">
                                {transaction.amount} GT Coins
                              </span>
                              {getStatusBadge(transaction.status, 'transaction')}
                              <Badge variant="outline">{transaction.type}</Badge>
                            </div>
                            <div className="text-sm text-steel-300 space-y-1">
                              <p>Пользователь: {transaction.user_id.slice(0, 8)}...</p>
                              <p>Способ оплаты: {transaction.payment_method || 'Не указан'}</p>
                              <p>Дата: {format(new Date(transaction.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                              {transaction.proof_image && (
                                <p className="text-primary">📎 Подтверждение прикреплено</p>
                              )}
                            </div>
                          </div>
                          
                          {transaction.status === 'pending' && (
                            <div className="flex items-center space-x-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="card-steel">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Подтвердить транзакцию</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите подтвердить эту транзакцию?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => verifyTransaction(transaction.id, 'completed')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Подтвердить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="card-steel">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Отклонить транзакцию</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Укажите причину отклонения транзакции:
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <Textarea
                                      placeholder="Причина отклонения..."
                                      id={`rejection-reason-${transaction.id}`}
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        const textarea = document.getElementById(`rejection-reason-${transaction.id}`) as HTMLTextAreaElement;
                                        verifyTransaction(transaction.id, 'rejected', textarea?.value);
                                      }}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Отклонить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Reviews Management */}
            <TabsContent value="reviews" className="space-y-6">
              <Card className="card-steel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-steel-100">Модерация отзывов</h2>
                  <Badge variant="outline" className="text-red-400 border-red-400/20">
                    {reportedReviews.length} жалоб
                  </Badge>
                </div>

                {isLoadingReviews ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : reportedReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                    <p className="text-steel-300">Нет жалоб на отзывы</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportedReviews.map((review) => (
                      <div key={review.id} className="bg-steel-800/50 rounded-lg p-4">
                        <div className="space-y-4">
                          {/* Review Content */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-steel-100">
                                Автор: {review.author_id.slice(0, 8)}...
                              </span>
                              <span className="text-steel-300">→</span>
                              <span className="font-medium text-steel-100">
                                Пользователь: {review.target_user_id.slice(0, 8)}...
                              </span>
                              {review.rating && <StarRating rating={review.rating} size="sm" />}
                            </div>
                            {review.comment && (
                              <div className="bg-steel-700/50 rounded p-3">
                                <p className="text-steel-200 text-sm">{review.comment}</p>
                              </div>
                            )}
                            <p className="text-xs text-steel-400">
                              {format(new Date(review.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </p>
                          </div>

                          {/* Reports */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-steel-200">Жалобы:</h4>
                            {review.reports?.map((report) => (
                              <div key={report.id} className="bg-red-500/10 border border-red-500/20 rounded p-3">
                                <p className="text-red-200 text-sm">{report.reason}</p>
                                <p className="text-xs text-red-400 mt-1">
                                  От: {report.reporter_id.slice(0, 8)}... • {format(new Date(report.created_at), 'dd.MM.yyyy', { locale: ru })}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 pt-2 border-t border-steel-600">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moderateReview(review.id, 'approve')}
                              className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Одобрить
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moderateReview(review.id, 'block')}
                              className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Заблокировать
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}