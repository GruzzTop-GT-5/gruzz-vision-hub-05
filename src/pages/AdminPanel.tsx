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
  Filter,
  Banknote,
  BarChart3,
  Activity,
  DollarSign,
  TrendingUp,
  UserCheck,
  Settings,
  Percent,
  Sliders,
  Tag,
  Plus,
  Minus,
  UserX,
  Clock,
  Trash2
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { StarRating } from '@/components/StarRating';
import { CategoriesManagement } from '@/components/CategoriesManagement';
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

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_details: any;
  created_at: string;
  processed_by: string | null;
  admin_notes: string | null;
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

interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  totalTransactions: number;
  pendingTransactions: number;
  totalAds: number;
  activeAds: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  category: string;
  display_name: string;
  description: string | null;
  is_editable: boolean;
  min_value: number | null;
  max_value: number | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface AdminLog {
  id: string;
  action: string;
  user_id: string;
  target_id: string | null;
  target_type: string | null;
  timestamp: string;
  profiles?: {
    display_name: string | null;
    full_name: string | null;
    phone: string;
  };
}

interface UserBan {
  id: string;
  user_id: string;
  ban_type: 'order_mute' | 'payment_mute' | 'account_block';
  duration_minutes: number;
  reason: string | null;
  issued_by: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  client_requirements: any;
  profiles?: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export default function AdminPanel() {
  const { user, userRole, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  // States for different admin sections
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [reportedReviews, setReportedReviews] = useState<ReportedReview[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    totalAds: 0,
    activeAds: 0,
    recentActivity: []
  });
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  
  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingAdminLogs, setIsLoadingAdminLogs] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  
  // Filter states
  const [userFilter, setUserFilter] = useState('');
  const [adStatusFilter, setAdStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [logFilter, setLogFilter] = useState('');
  
  // Balance management state
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'subtract'>('add');
  
  // Ban management state
  const [userBans, setUserBans] = useState<UserBan[]>([]);
  const [isLoadingBans, setIsLoadingBans] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banType, setBanType] = useState<'order_mute' | 'payment_mute' | 'account_block'>('order_mute');
  const [banDuration, setBanDuration] = useState('60'); // in minutes
  const [banReason, setBanReason] = useState('');
  const [banFilter, setBanFilter] = useState('');

  // Clear filter functions
  const clearUserFilter = () => setUserFilter('');
  const clearAdFilter = () => setAdStatusFilter('all');
  const clearOrderFilter = () => setOrderStatusFilter('all');
  const clearTransactionFilter = () => setTransactionStatusFilter('all');
  const clearLogFilter = () => setLogFilter('');
  const clearBanFilter = () => setBanFilter('');

  const isAdmin = userRole && ['system_admin', 'admin', 'moderator'].includes(userRole);

  // Realtime presence for online users
  useEffect(() => {
    if (!isAdmin || !user?.id) return;

    const channel = supabase.channel('admin_presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set(Object.keys(state));
        setOnlineUserIds(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            role: userRole,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [isAdmin, user?.id, userRole]);

  // Setup realtime subscriptions for data changes
  useEffect(() => {
    if (!isAdmin) return;

    const transactionsChannel = supabase
      .channel('admin_transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
      }, (payload) => {
        console.log('Transaction change:', payload);
        fetchTransactions();
        fetchDashboardStats();
        
        if (payload.eventType === 'INSERT') {
          toast({
            title: "Новая транзакция",
            description: `Поступила новая транзакция на ${payload.new.amount} GT Coins`,
          });
        }
      })
      .subscribe();

    const adsChannel = supabase
      .channel('admin_ads')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ads',
      }, (payload) => {
        console.log('Ad change:', payload);
        fetchAds();
        fetchDashboardStats();
        
        if (payload.eventType === 'INSERT') {
          toast({
            title: "Новое объявление",
            description: "Опубликовано новое объявление",
          });
        }
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin_profiles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        console.log('Profile change:', payload);
        fetchUsers();
        fetchDashboardStats();
        
        if (payload.eventType === 'INSERT') {
          toast({
            title: "Новый пользователь",
            description: "Зарегистрировался новый пользователь",
          });
        }
      })
      .subscribe();

    return () => {
      transactionsChannel.unsubscribe();
      adsChannel.unsubscribe();
      profilesChannel.unsubscribe();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAds();
      fetchOrders();
      fetchTransactions();
      fetchWithdrawals();
      fetchReportedReviews();
      fetchSystemSettings();
      fetchDashboardStats();
      fetchAdminLogs();
      fetchUserBans();
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

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*,
          profiles!orders_client_id_fkey (
            display_name,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as any || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказы",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOrders(false);
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

  const fetchWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      // For now, filter withdrawals from transactions table
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить выводы",
        variant: "destructive"
      });
    } finally {
      setIsLoadingWithdrawals(false);
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

  const fetchDashboardStats = async () => {
    try {
      // Get all stats in parallel
      const [
        { count: totalUsers },
        { data: recentTransactions },
        { count: totalTransactions },
        { count: pendingTransactions },
        { count: totalAds },
        { count: activeAds }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('ads').select('*', { count: 'exact', head: true }),
        supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      // Create recent activity from transactions
      const recentActivity = (recentTransactions || []).map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        description: `${transaction.type === 'deposit' ? 'Пополнение' : 
                     transaction.type === 'withdrawal' ? 'Вывод' : 'Платеж'} на ${transaction.amount} GT Coins`,
        timestamp: transaction.created_at
      }));

      setDashboardStats({
        totalUsers: totalUsers || 0,
        onlineUsers: onlineUserIds.size,
        totalTransactions: totalTransactions || 0,
        pendingTransactions: pendingTransactions || 0,
        totalAds: totalAds || 0,
        activeAds: activeAds || 0,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchSystemSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_type, category, display_name');

      if (error) throw error;
      setSystemSettings(data || []);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить системные настройки",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchAdminLogs = async () => {
    setIsLoadingAdminLogs(true);
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          profiles!admin_logs_user_id_fkey (
            display_name,
            full_name,
            phone
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAdminLogs(data || []);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить историю действий",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAdminLogs(false);
    }
  };

  const logAdminAction = async (action: string, targetId?: string, targetType?: string) => {
    try {
      await supabase
        .from('admin_logs')
        .insert({
          action,
          user_id: user?.id,
          target_id: targetId || null,
          target_type: targetType || null
        });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const updateSystemSetting = async (settingId: string, newValue: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: newValue,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingId);

      if (error) throw error;

      toast({
        title: "Настройка обновлена",
        description: "Системная настройка успешно изменена"
      });

      // Log admin action
      await logAdminAction(`Изменение системной настройки: ${settingId}`, settingId, 'system_setting');

      fetchSystemSettings();
      fetchAdminLogs();
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройку",
        variant: "destructive"
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await logAdminAction(`Изменение роли пользователя на ${newRole}`, userId, 'user');

      toast({
        title: "Роль обновлена",
        description: "Роль пользователя успешно изменена"
      });

      fetchUsers();
      fetchAdminLogs();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive"
      });
    }
  };

  const handleBalanceChange = async () => {
    if (!selectedUserId || !balanceAmount) {
      toast({
        title: "Ошибка",
        description: "Выберите пользователя и укажите сумму",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Ошибка", 
        description: "Введите корректную сумму",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create transaction record
      const transactionType = balanceOperation === 'add' ? 'deposit' : 'withdrawal';
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedUserId,
          amount: Math.abs(amount),
          type: transactionType,
          status: 'completed',
          admin_notes: `Админ ${balanceOperation === 'add' ? 'начислил' : 'списал'} ${amount} GT Coins`,
          processed_by: user?.id,
          completed_at: new Date().toISOString(),
          payment_method: 'manual_transfer'
        });

      if (transactionError) throw transactionError;

      // Get current balance first
      const { data: userProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', selectedUserId)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = userProfile.balance || 0;
      const newBalance = balanceOperation === 'add' 
        ? currentBalance + amount 
        : currentBalance - amount;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', selectedUserId);

      if (balanceError) throw balanceError;

      // Log admin action
      await logAdminAction(
        `${balanceOperation === 'add' ? 'Начисление' : 'Списание'} баланса: ${amount} GT Coins`, 
        selectedUserId, 
        'user'
      );

      toast({
        title: "Баланс обновлен",
        description: `${balanceOperation === 'add' ? 'Начислено' : 'Списано'} ${amount} GT Coins`
      });

      // Reset form and close modal
      setBalanceModalOpen(false);
      setSelectedUserId('');
      setBalanceAmount('');
      setBalanceOperation('add');
      
      // Refresh data
      fetchUsers();
      fetchTransactions();
      fetchAdminLogs();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить баланс пользователя",
        variant: "destructive"
      });
    }
  };

  // Ban management functions
  const fetchUserBans = async () => {
    if (!isAdmin) return;
    
    setIsLoadingBans(true);
    try {
      const { data, error } = await supabase
        .from('user_bans')
        .select(`
          *,
          profiles!user_bans_user_id_fkey (
            display_name,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserBans(data || []);
    } catch (error) {
      console.error('Error fetching user bans:', error);
    } finally {
      setIsLoadingBans(false);
    }
  };

  const createUserBan = async () => {
    if (!selectedUserId || !banDuration) {
      toast({
        title: "Ошибка",
        description: "Выберите пользователя и укажите продолжительность",
        variant: "destructive"
      });
      return;
    }

    const durationMinutes = parseInt(banDuration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную продолжительность",
        variant: "destructive"
      });
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: selectedUserId,
          ban_type: banType,
          duration_minutes: durationMinutes,
          reason: banReason || null,
          issued_by: user?.id,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Log admin action
      const banTypeNames = {
        order_mute: 'Мут на заказы',
        payment_mute: 'Мут на пополнение',
        account_block: 'Блокировка аккаунта'
      };

      await logAdminAction(
        `${banTypeNames[banType]}: ${durationMinutes} мин. Причина: ${banReason || 'Не указана'}`,
        selectedUserId,
        'user'
      );

      toast({
        title: "Бан выдан",
        description: `${banTypeNames[banType]} на ${durationMinutes} минут`
      });

      // Reset form and close modal
      setBanModalOpen(false);
      setSelectedUserId('');
      setBanDuration('60');
      setBanReason('');
      
      // Refresh data
      fetchUserBans();
      fetchAdminLogs();
    } catch (error) {
      console.error('Error creating ban:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось выдать бан",
        variant: "destructive"
      });
    }
  };

  const removeUserBan = async (banId: string) => {
    try {
      const { error } = await supabase
        .from('user_bans')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', banId);

      if (error) throw error;

      toast({
        title: "Бан снят",
        description: "Бан успешно снят с пользователя"
      });

      fetchUserBans();
    } catch (error) {
      console.error('Error removing ban:', error);
      toast({
        title: "Ошибка", 
        description: "Не удалось снять бан",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Deactivate user account instead of deleting
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user', balance: 0 })
        .eq('id', userId);

      if (error) throw error;

      // Create permanent account block
      const { error: banError } = await supabase
        .from('user_bans')
        .insert({
          user_id: userId,
          ban_type: 'account_block',
          duration_minutes: 525600 * 365, // 1 year in minutes
          reason: 'Аккаунт удален администратором',
          issued_by: user?.id,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (banError) throw banError;

      await logAdminAction('Удаление пользователя', userId, 'user');

      toast({
        title: "Пользователь удален",
        description: "Аккаунт пользователя заблокирован"
      });

      fetchUsers();
      fetchUserBans();
      fetchAdminLogs();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive"
      });
    }
  };

  const openBanModal = (userId: string, type: 'order_mute' | 'payment_mute' | 'account_block') => {
    setSelectedUserId(userId);
    setBanType(type);
    setBanModalOpen(true);
  };

  const openBalanceModal = (userId: string, operation: 'add' | 'subtract') => {
    setSelectedUserId(userId);
    setBalanceOperation(operation);
    setBalanceModalOpen(true);
  };

  const moderateAd = async (adId: string, status: string) => {
    try {
      console.log('Moderating ad:', adId, 'to status:', status);
      
      const { error } = await supabase
        .from('ads')
        .update({ status: status as any })
        .eq('id', adId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Log admin action
      await logAdminAction(`Модерация объявления - статус: ${status}`, adId, 'ad');

      const statusText = status === 'active' ? 'одобрено' : status === 'inactive' ? 'отклонено' : status;
      toast({
        title: "Объявление обновлено",
        description: `Объявление ${statusText}`,
      });

      // Refresh data
      fetchAds();
      fetchAdminLogs();
    } catch (error) {
      console.error('Error moderating ad:', error);
      toast({
        title: "Ошибка модерации",
        description: error instanceof Error ? error.message : "Не удалось обновить объявление",
        variant: "destructive"
      });
    }
  };

  const moderateOrder = async (orderId: string, status: string, reason?: string) => {
    try {
      console.log('Moderating order:', orderId, 'to status:', status);
      
      const updateData: any = { status };
      if (reason) {
        updateData.admin_notes = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Log admin action
      await logAdminAction(`Модерация заказа - статус: ${status}`, orderId, 'order');

      const statusText = status === 'pending' ? 'одобрен' : status === 'cancelled' ? 'отклонен' : status;
      toast({
        title: "Заказ обновлен",
        description: `Заказ ${statusText}${reason ? `: ${reason}` : ''}`,
      });

      // Refresh data
      fetchOrders();
      fetchAdminLogs();
    } catch (error) {
      console.error('Error moderating order:', error);
      toast({
        title: "Ошибка модерации",
        description: error instanceof Error ? error.message : "Не удалось обновить заказ",
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

      // Log admin action
      await logAdminAction(`Верификация транзакции - статус: ${status}`, transactionId, 'transaction');

      toast({
        title: "Транзакция обновлена",
        description: `Статус транзакции изменен на: ${status}`
      });

      fetchTransactions();
      fetchAdminLogs();
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

      // Log admin action
      await logAdminAction(`Модерация отзыва - ${action === 'approve' ? 'одобрен' : 'заблокирован'}`, reviewId, 'review');

      toast({
        title: "Отзыв обработан",
        description: action === 'approve' ? "Отзыв одобрен" : "Отзыв заблокирован"
      });

      fetchReportedReviews();
      fetchAdminLogs();
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
    const statusMap = {
      active: { text: 'Активно', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
      inactive: { text: 'Неактивно', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
      pending: { text: 'На модерации', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
      completed: { text: 'Завершено', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
      rejected: { text: 'Отклонено', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-steel-500/10 text-steel-400 border-steel-500/20' };
    return <Badge className={statusInfo.color}>{statusInfo.text}</Badge>;
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
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Дашборд</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Пользователи</span>
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4" />
                <span>Объявления</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Заказы</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Транзакции</span>
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex items-center space-x-2">
                <Banknote className="w-4 h-4" />
                <span>Вывод</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Категории</span>
              </TabsTrigger>
            </TabsList>

            {/* Second Row for Settings and Bans */}
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Настройки</span>
              </TabsTrigger>
              <TabsTrigger value="bans" className="flex items-center space-x-2">
                <UserX className="w-4 h-4" />
                <span>Бан Зона</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-steel p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-steel-400 text-sm">Всего пользователей</p>
                      <p className="text-2xl font-bold text-steel-100">{dashboardStats.totalUsers}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <p className="text-green-400 text-xs">{dashboardStats.onlineUsers} онлайн</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="card-steel p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-steel-400 text-sm">Транзакции</p>
                      <p className="text-2xl font-bold text-steel-100">{dashboardStats.totalTransactions}</p>
                      <p className="text-yellow-400 text-xs">{dashboardStats.pendingTransactions} ожидают</p>
                    </div>
                  </div>
                </Card>

                <Card className="card-steel p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Megaphone className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-steel-400 text-sm">Объявления</p>
                      <p className="text-2xl font-bold text-steel-100">{dashboardStats.totalAds}</p>
                      <p className="text-green-400 text-xs">{dashboardStats.activeAds} активных</p>
                    </div>
                  </div>
                </Card>

                <Card className="card-steel p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-steel-400 text-sm">Активность</p>
                      <p className="text-2xl font-bold text-steel-100">{dashboardStats.recentActivity.length}</p>
                      <p className="text-steel-400 text-xs">последних событий</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Online Users */}
                <Card className="card-steel p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-steel-100">Пользователи онлайн</h3>
                    <Badge variant="outline" className="text-green-400 border-green-400/20">
                      {onlineUserIds.size} онлайн
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {users.filter(user => onlineUserIds.has(user.id)).length === 0 ? (
                      <div className="text-center py-8">
                        <UserCheck className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                        <p className="text-steel-400">Нет пользователей онлайн</p>
                      </div>
                    ) : (
                      users
                        .filter(user => onlineUserIds.has(user.id))
                        .map(user => (
                          <div key={user.id} className="flex items-center space-x-3 p-3 bg-steel-800/30 rounded-lg">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="flex-1">
                              <p className="text-steel-100 font-medium">{user.id.slice(0, 8)}...</p>
                              <p className="text-steel-400 text-sm">{user.phone || 'Без телефона'}</p>
                            </div>
                            <Badge className={
                              user.role === 'system_admin' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                              user.role === 'admin' ? 'text-primary bg-primary/10 border-primary/20' :
                              'text-steel-400 bg-steel-400/10 border-steel-400/20'
                            }>
                              {user.role}
                            </Badge>
                          </div>
                        ))
                    )}
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="card-steel p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-steel-100">Последняя активность</h3>
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {dashboardStats.recentActivity.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                        <p className="text-steel-400">Нет активности</p>
                      </div>
                    ) : (
                      dashboardStats.recentActivity.map(activity => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-steel-800/30 rounded-lg">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-steel-100 text-sm">{activity.description}</p>
                            <p className="text-steel-400 text-xs">
                              {format(new Date(activity.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

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
                    {userFilter && (
                      <Button variant="outline" onClick={clearUserFilter} size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
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
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => openBalanceModal(userData.id, 'add')}
                               className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                               title="Начислить баланс"
                             >
                               <Plus className="w-4 h-4" />
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => openBalanceModal(userData.id, 'subtract')}
                               className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                               title="Списать баланс"
                             >
                               <Minus className="w-4 h-4" />
                             </Button>
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
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/20">
                      {ads.filter(ad => ad.status === 'pending').length} на модерации
                    </Badge>
                    <Select value={adStatusFilter} onValueChange={setAdStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="pending">На модерации</SelectItem>
                        <SelectItem value="active">Активные</SelectItem>
                        <SelectItem value="inactive">Неактивные</SelectItem>
                      </SelectContent>
                    </Select>
                    {adStatusFilter !== 'all' && (
                      <Button variant="outline" onClick={clearAdFilter} size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isLoadingAds ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : ads.filter(ad => adStatusFilter === 'all' || ad.status === adStatusFilter).length === 0 ? (
                  <div className="text-center py-16">
                    <Megaphone className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                    <p className="text-steel-400 text-lg">
                      {adStatusFilter === 'all' ? 'Объявлений нет' : `Нет объявлений со статусом "${adStatusFilter}"`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ads
                      .filter(ad => adStatusFilter === 'all' || ad.status === adStatusFilter)
                      .map((ad) => (
                      <div key={ad.id} className="bg-steel-800/50 rounded-lg p-4 border border-steel-600/30">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-steel-100 text-lg">{ad.title}</h3>
                              {getStatusBadge(ad.status, 'ad')}
                            </div>
                            <p className="text-steel-300 text-sm leading-relaxed">
                              {ad.description.length > 200 ? ad.description.slice(0, 200) + '...' : ad.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-steel-400">
                              <div>
                                <span className="text-steel-500">Категория:</span>
                                <p className="text-steel-300 font-medium">{ad.category}</p>
                              </div>
                              <div>
                                <span className="text-steel-500">Цена:</span>
                                <p className="text-primary font-medium">{ad.price.toLocaleString()} ₽</p>
                              </div>
                              <div>
                                <span className="text-steel-500">Автор:</span>
                                <p className="text-steel-300 font-mono">{ad.user_id.slice(0, 8)}...</p>
                              </div>
                              <div>
                                <span className="text-steel-500">Создано:</span>
                                <p className="text-steel-300">{format(new Date(ad.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-6">
                            {ad.status !== 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moderateAd(ad.id, 'active')}
                                className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                                title="Одобрить объявление"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            {ad.status !== 'inactive' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moderateAd(ad.id, 'inactive')}
                                className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                                title="Отклонить объявление"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/profile/${ad.user_id}`, '_blank')}
                              className="text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
                              title="Профиль автора"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Orders Management */}
            <TabsContent value="orders" className="space-y-6">
              <Card className="card-steel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-steel-100">Модерация заказов</h2>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/20">
                      {orders.filter(order => order.status === 'pending').length} на модерации
                    </Badge>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="pending">На модерации</SelectItem>
                        <SelectItem value="cancelled">Отклоненные</SelectItem>
                        <SelectItem value="accepted">Принятые</SelectItem>
                        <SelectItem value="in_progress">В работе</SelectItem>
                        <SelectItem value="completed">Завершенные</SelectItem>
                      </SelectContent>
                    </Select>
                    {orderStatusFilter !== 'all' && (
                      <Button variant="outline" onClick={clearOrderFilter} size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isLoadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : orders.filter(order => orderStatusFilter === 'all' || order.status === orderStatusFilter).length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                    <p className="text-steel-400 text-lg">
                      {orderStatusFilter === 'all' ? 'Заказов нет' : `Нет заказов со статусом "${orderStatusFilter}"`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.filter(order => orderStatusFilter === 'all' || order.status === orderStatusFilter).map((order) => (
                      <div key={order.id} className="border border-steel-600/20 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-steel-100">{order.title}</h3>
                              <Badge className={
                                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                order.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                order.status === 'in_progress' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                order.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                'bg-steel-600/10 text-steel-400 border-steel-600/20'
                              }>
                                {order.status === 'pending' ? 'На модерации' :
                                 order.status === 'cancelled' ? 'Отклонен' :
                                 order.status === 'accepted' ? 'Принят' :
                                 order.status === 'in_progress' ? 'В работе' :
                                 order.status === 'completed' ? 'Завершен' : order.status}
                              </Badge>
                            </div>
                            <p className="text-steel-300 text-sm">{order.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-steel-400">
                              <span>№ {order.order_number}</span>
                              <span>Цена: {order.price} ₽</span>
                              <span>Категория: {order.category || 'Не указана'}</span>
                              <span>
                                Клиент: {order.profiles?.display_name || order.profiles?.full_name || 'Аноним'}
                              </span>
                              <span>{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moderateOrder(order.id, 'pending')}
                                  className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                                  title="Одобрить заказ"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                                      title="Отклонить заказ"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="card-steel-dialog">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Отклонить заказ</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Укажите причину отклонения заказа:
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                      <Textarea
                                        placeholder="Причина отклонения..."
                                        id={`order-rejection-reason-${order.id}`}
                                      />
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          const textarea = document.getElementById(`order-rejection-reason-${order.id}`) as HTMLTextAreaElement;
                                          moderateOrder(order.id, 'cancelled', textarea?.value);
                                        }}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Отклонить
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/profile/${order.client_id}`, '_blank')}
                              className="text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
                              title="Профиль клиента"
                            >
                              <Eye className="w-4 h-4" />
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
                  <div className="flex items-center space-x-2">
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
                    {transactionStatusFilter !== 'all' && (
                      <Button variant="outline" onClick={clearTransactionFilter} size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
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
                                <AlertDialogContent className="card-steel-dialog">
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

            {/* Withdrawals Management */}
            <TabsContent value="withdrawals" className="space-y-6">
              <Card className="card-steel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-steel-100">Заявки на вывод</h2>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/20">
                    {withdrawals.filter(w => w.status === 'pending').length} на рассмотрении
                  </Badge>
                </div>

                {isLoadingWithdrawals ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-16">
                    <Banknote className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                    <p className="text-steel-400 text-lg">Нет заявок на вывод</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="bg-steel-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-steel-100">
                                {withdrawal.amount} GT Coins
                              </span>
                              {getStatusBadge(withdrawal.status, 'transaction')}
                            </div>
                            <div className="text-sm text-steel-300 space-y-1">
                              <p>Пользователь: {withdrawal.user_id.slice(0, 8)}...</p>
                              <p>Дата заявки: {format(new Date(withdrawal.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                              {withdrawal.payment_details && (
                                <p>Реквизиты: {JSON.stringify(withdrawal.payment_details)}</p>
                              )}
                              {withdrawal.admin_notes && (
                                <p className="text-yellow-400">Примечание: {withdrawal.admin_notes}</p>
                              )}
                            </div>
                          </div>
                          
                          {withdrawal.status === 'pending' && (
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
                                    <AlertDialogTitle>Подтвердить вывод</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите подтвердить вывод {withdrawal.amount} GT Coins?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => verifyTransaction(withdrawal.id, 'completed')}
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
                                    <AlertDialogTitle>Отклонить вывод</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Укажите причину отклонения вывода:
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <Textarea
                                      placeholder="Причина отклонения..."
                                      id={`withdrawal-rejection-${withdrawal.id}`}
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        const textarea = document.getElementById(`withdrawal-rejection-${withdrawal.id}`) as HTMLTextAreaElement;
                                        verifyTransaction(withdrawal.id, 'rejected', textarea?.value);
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

            {/* System Settings */}
            <TabsContent value="settings" className="space-y-6 transform-none">
              <Card className="card-steel p-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Системные настройки</h2>
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    <Badge variant="outline" className="text-primary border-primary/20">
                      {systemSettings.length} настроек
                    </Badge>
                  </div>
                </div>

                {isLoadingSettings ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Commission Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Percent className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Комиссии</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {systemSettings
                          .filter(setting => setting.setting_type === 'commission')
                          .map(setting => (
                            <div key={setting.id} className="bg-steel-800/30 rounded-lg p-4 space-y-3">
                              <div>
                                <label className="text-steel-100 font-medium text-sm">
                                  {setting.display_name}
                                </label>
                                {setting.description && (
                                  <p className="text-steel-400 text-xs mt-1">{setting.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={setting.setting_value}
                                  onChange={(e) => updateSystemSetting(setting.id, e.target.value)}
                                  min={setting.min_value || 0}
                                  max={setting.max_value || 100}
                                  className="bg-steel-700 border-steel-600"
                                  disabled={!setting.is_editable}
                                />
                                <span className="text-steel-400 text-sm">%</span>
                              </div>
                              {setting.min_value !== null && setting.max_value !== null && (
                                <p className="text-steel-500 text-xs">
                                  Диапазон: {setting.min_value}% - {setting.max_value}%
                                </p>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-steel-100">Лимиты</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {systemSettings
                          .filter(setting => setting.setting_type === 'limit')
                          .map(setting => (
                            <div key={setting.id} className="bg-steel-800/30 rounded-lg p-4 space-y-3">
                              <div>
                                <label className="text-steel-100 font-medium text-sm">
                                  {setting.display_name}
                                </label>
                                {setting.description && (
                                  <p className="text-steel-400 text-xs mt-1">{setting.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={setting.setting_value}
                                  onChange={(e) => updateSystemSetting(setting.id, e.target.value)}
                                  min={setting.min_value || 0}
                                  max={setting.max_value || undefined}
                                  className="bg-steel-700 border-steel-600"
                                  disabled={!setting.is_editable}
                                />
                                <span className="text-steel-400 text-sm">GT Coins</span>
                              </div>
                              {setting.min_value !== null && setting.max_value !== null && (
                                <p className="text-steel-500 text-xs">
                                  Диапазон: {setting.min_value} - {setting.max_value}
                                </p>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* Fees */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-steel-100">Платежи</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemSettings
                          .filter(setting => setting.setting_type === 'fee')
                          .map(setting => (
                            <div key={setting.id} className="bg-steel-800/30 rounded-lg p-4 space-y-3">
                              <div>
                                <label className="text-steel-100 font-medium text-sm">
                                  {setting.display_name}
                                </label>
                                {setting.description && (
                                  <p className="text-steel-400 text-xs mt-1">{setting.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={setting.setting_value}
                                  onChange={(e) => updateSystemSetting(setting.id, e.target.value)}
                                  min={setting.min_value || 0}
                                  max={setting.max_value || undefined}
                                  className="bg-steel-700 border-steel-600"
                                  disabled={!setting.is_editable}
                                />
                                <span className="text-steel-400 text-sm">GT</span>
                              </div>
                              {setting.min_value !== null && setting.max_value !== null && (
                                <p className="text-steel-500 text-xs">
                                  Диапазон: {setting.min_value} - {setting.max_value} GT
                                </p>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* Tariffs */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Percent className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-steel-100">Тарифы</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemSettings
                          .filter(setting => setting.setting_type === 'tariff')
                          .map(setting => (
                            <div key={setting.id} className="bg-steel-800/30 rounded-lg p-4 space-y-3">
                              <div>
                                <label className="text-steel-100 font-medium text-sm">
                                  {setting.display_name}
                                </label>
                                {setting.description && (
                                  <p className="text-steel-400 text-xs mt-1">{setting.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={setting.setting_value}
                                  onChange={(e) => updateSystemSetting(setting.id, e.target.value)}
                                  min={setting.min_value || 0}
                                  max={setting.max_value || 100}
                                  className="bg-steel-700 border-steel-600"
                                  disabled={!setting.is_editable}
                                />
                                <span className="text-steel-400 text-sm">%</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* General Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Settings className="w-5 h-5 text-orange-400" />
                        <h3 className="text-lg font-semibold text-steel-100">Общие настройки</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemSettings
                          .filter(setting => setting.setting_type === 'general')
                          .map(setting => (
                            <div key={setting.id} className="bg-steel-800/30 rounded-lg p-4 space-y-3">
                              <div>
                                <label className="text-steel-100 font-medium text-sm">
                                  {setting.display_name}
                                </label>
                                {setting.description && (
                                  <p className="text-steel-400 text-xs mt-1">{setting.description}</p>
                                )}
                              </div>
                              <div>
                                {setting.setting_value === 'true' || setting.setting_value === 'false' ? (
                                  <Button
                                    variant={setting.setting_value === 'true' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => updateSystemSetting(setting.id, setting.setting_value === 'true' ? 'false' : 'true')}
                                    disabled={!setting.is_editable}
                                    className="w-full"
                                  >
                                    {setting.setting_value === 'true' ? 'Включено' : 'Выключено'}
                                  </Button>
                                ) : (
                                  <Input
                                    type="number"
                                    value={setting.setting_value}
                                    onChange={(e) => updateSystemSetting(setting.id, e.target.value)}
                                    min={setting.min_value || 0}
                                    max={setting.max_value || undefined}
                                    className="bg-steel-700 border-steel-600"
                                    disabled={!setting.is_editable}
                                  />
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Ban Zone */}
            <TabsContent value="bans" className="space-y-6">
              <Card className="card-steel p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <UserX className="w-6 h-6 text-red-400" />
                    <h2 className="text-xl font-bold text-steel-100">Бан Зона</h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400" />
                        <Input
                          placeholder="Поиск по ID пользователя..."
                          value={banFilter}
                          onChange={(e) => setBanFilter(e.target.value)}
                          className="w-64 pl-10"
                        />
                      </div>
                      {banFilter && (
                        <Button variant="outline" onClick={clearBanFilter} size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {isLoadingBans ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users
                      .filter(user => 
                        banFilter === '' || 
                        user.id.includes(banFilter) || 
                        (user.phone && user.phone.includes(banFilter))
                      )
                      .map((userData) => {
                        const activeBans = userBans.filter(ban => 
                          ban.user_id === userData.id && 
                          ban.is_active && 
                          new Date(ban.expires_at) > new Date()
                        );

                        return (
                          <div key={userData.id} className="bg-steel-800/50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
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
                                  <p>Регистрация: {format(new Date(userData.created_at), 'dd.MM.yyyy', { locale: ru })}</p>
                                </div>

                                {/* Active Bans Display */}
                                {activeBans.length > 0 && (
                                  <div className="space-y-2 mt-3">
                                    <p className="text-red-400 font-medium text-sm">Активные баны:</p>
                                    {activeBans.map((ban) => (
                                      <div key={ban.id} className="bg-red-900/20 rounded p-2">
                                        <div className="flex items-center justify-between">
                                          <div className="space-y-1">
                                            <Badge className="text-red-400 bg-red-400/10 border-red-400/20">
                                              {ban.ban_type === 'order_mute' ? 'Мут на заказы' :
                                               ban.ban_type === 'payment_mute' ? 'Мут на пополнение' :
                                               'Блокировка аккаунта'}
                                            </Badge>
                                            <p className="text-xs text-steel-400">
                                              До: {format(new Date(ban.expires_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                            </p>
                                            {ban.reason && (
                                              <p className="text-xs text-steel-400">Причина: {ban.reason}</p>
                                            )}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeUserBan(ban.id)}
                                            className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                                          >
                                            Снять
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex flex-col space-y-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openBanModal(userData.id, 'order_mute')}
                                  className="text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10"
                                  title="Мут на создание заказов"
                                >
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Мут заказы
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openBanModal(userData.id, 'payment_mute')}
                                  className="text-orange-400 border-orange-400/20 hover:bg-orange-400/10"
                                  title="Мут на пополнение баланса"
                                >
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Мут пополнение
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openBanModal(userData.id, 'account_block')}
                                  className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                                  title="Блокировка аккаунта"
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Блокировать
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
                                      deleteUser(userData.id);
                                    }
                                  }}
                                  className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                                  title="Удалить пользователя"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Удалить
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Categories Management */}
            <TabsContent value="categories" className="space-y-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
              <CategoriesManagement />
            </TabsContent>
          </Tabs>

          {/* Advanced Admin Functions */}
          <div className="bg-muted/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">🔧 Расширенные функции</h2>
            <Tabs defaultValue="admin-logs" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="admin-logs" className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>История действий</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Модерация отзывов</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Безопасность</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Отчёты</span>
                </TabsTrigger>
              </TabsList>

              {/* Admin Logs */}
              <TabsContent value="admin-logs" className="space-y-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                <Card className="card-steel p-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">📋 История действий администраторов</h3>
                    <Badge variant="outline" className="text-primary border-primary/20">
                      {adminLogs.length} записей
                    </Badge>
                  </div>

                  {/* Search and filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Поиск по действию или пользователю..."
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        className="pl-10 bg-background border-border"
                      />
                    </div>
                    {logFilter && (
                      <Button variant="outline" onClick={clearLogFilter} size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      onClick={fetchAdminLogs}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Обновить</span>
                    </Button>
                  </div>

                  {isLoadingAdminLogs ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminLogs
                        .filter(log => {
                          if (!logFilter) return true;
                          const searchTerm = logFilter.toLowerCase();
                          const adminName = log.profiles?.display_name || log.profiles?.full_name || log.profiles?.phone || 'Неизвестно';
                          return log.action.toLowerCase().includes(searchTerm) || 
                                 adminName.toLowerCase().includes(searchTerm);
                        })
                        .map((log) => {
                          const adminName = log.profiles?.display_name || log.profiles?.full_name || log.profiles?.phone || 'Неизвестно';
                          
                          return (
                            <div key={log.id} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-primary/20 rounded-lg">
                                    <Activity className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{log.action}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Администратор: {adminName}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                  </p>
                                </div>
                              </div>
                              
                              {(log.target_id || log.target_type) && (
                                <div className="mt-3 pt-3 border-t border-border/30">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {log.target_type && (
                                      <div>
                                        <span className="text-muted-foreground">Тип объекта:</span>
                                        <span className="ml-2 text-foreground">{log.target_type}</span>
                                      </div>
                                    )}
                                    {log.target_id && (
                                      <div>
                                        <span className="text-muted-foreground">ID объекта:</span>
                                        <span className="ml-2 text-foreground font-mono text-xs">{log.target_id.slice(0, 8)}...</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      
                      {adminLogs.length === 0 && (
                        <div className="text-center py-16">
                          <Activity className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium text-foreground mb-2">История пуста</h4>
                          <p className="text-muted-foreground">Действия администраторов будут отображаться здесь</p>
                        </div>
                      )}
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
                  <div className="text-center py-16">
                    <MessageSquare className="w-16 h-16 text-steel-500 mx-auto mb-4" />
                    <p className="text-steel-400 text-lg">Нет задач на отзывы</p>
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

              {/* Reviews Management */}
              <TabsContent value="reviews" className="space-y-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                <Card className="card-steel p-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-steel-100">Модерация отзывов</h3>
                    <Badge variant="outline" className="text-red-400 border-red-400/20">
                      {reportedReviews.length} жалоб
                    </Badge>
                  </div>

                  {isLoadingReviews ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : reportedReviews.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageSquare className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium text-foreground mb-2">Нет жалоб</h4>
                      <p className="text-muted-foreground">Жалобы на отзывы будут отображаться здесь</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reportedReviews.map((review) => (
                        <div key={review.id} className="bg-muted/30 rounded-lg p-4 border border-red-500/20">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="destructive" className="text-xs">
                                  {review.reports.length} жалоб
                                </Badge>
                                {review.rating && (
                                  <StarRating rating={review.rating} size="sm" />
                                )}
                              </div>
                              {review.comment && (
                                <p className="text-foreground mb-3">{review.comment}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Создан: {format(new Date(review.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm font-medium text-steel-100 mb-2">Причины жалоб:</p>
                            <div className="space-y-1">
                              {review.reports.map((report: any, index: number) => (
                                <div key={index} className="text-sm text-steel-300 bg-steel-800/30 rounded px-2 py-1">
                                  {report.reason}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              onClick={() => moderateReview(review.id, 'approve')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Одобрить
                            </Button>
                            <Button
                              onClick={() => moderateReview(review.id, 'block')}
                              size="sm"
                              variant="destructive"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Заблокировать
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                <Card className="card-steel p-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">🔒 Безопасность</h3>
                    <Badge variant="outline" className="text-green-400 border-green-400/20">
                      Активно
                    </Badge>
                  </div>
                  
                  <div className="text-center py-16">
                    <Shield className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium text-foreground mb-2">Функции безопасности</h4>
                    <p className="text-muted-foreground">Здесь будут настройки безопасности и мониторинг</p>
                  </div>
                </Card>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                <Card className="card-steel p-6 transform-none !rotate-0 !scale-100 !skew-x-0 !skew-y-0 !translate-x-0 !translate-y-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">📊 Отчёты и аналитика</h3>
                    <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                      Новое
                    </Badge>
                  </div>
                  
                  <div className="text-center py-16">
                    <BarChart3 className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium text-foreground mb-2">Аналитические отчёты</h4>
                    <p className="text-muted-foreground">Здесь будут детальные отчёты и аналитика</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Balance Management Modal */}
      {balanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="card-steel p-6 w-full max-w-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-steel-100">
                  {balanceOperation === 'add' ? 'Начислить баланс' : 'Списать баланс'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBalanceModalOpen(false)}
                  className="text-steel-400 hover:text-steel-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-steel-300 mb-2 block">
                    Сумма GT Coins
                  </label>
                  <Input
                    type="number"
                    placeholder="Введите сумму..."
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="text-sm text-steel-400">
                  Пользователь: {selectedUserId.slice(0, 8)}...
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleBalanceChange}
                    className={
                      balanceOperation === 'add' 
                        ? "bg-green-600 hover:bg-green-700 flex-1" 
                        : "bg-red-600 hover:bg-red-700 flex-1"
                    }
                    disabled={!balanceAmount || parseFloat(balanceAmount) <= 0}
                  >
                    {balanceOperation === 'add' ? (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Начислить
                      </>
                    ) : (
                      <>
                        <Minus className="w-4 h-4 mr-2" />
                        Списать
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBalanceModalOpen(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Ban Management Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="card-steel p-6 w-full max-w-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-steel-100">
                  {banType === 'order_mute' ? 'Мут на заказы' :
                   banType === 'payment_mute' ? 'Мут на пополнение' :
                   'Блокировка аккаунта'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBanModalOpen(false)}
                  className="text-steel-400 hover:text-steel-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-steel-300 mb-2 block">
                    Продолжительность
                  </label>
                  <Select value={banDuration} onValueChange={setBanDuration}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите продолжительность" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 минут</SelectItem>
                      <SelectItem value="60">1 час</SelectItem>
                      <SelectItem value="180">3 часа</SelectItem>
                      <SelectItem value="360">6 часов</SelectItem>
                      <SelectItem value="720">12 часов</SelectItem>
                      <SelectItem value="1440">1 день</SelectItem>
                      <SelectItem value="4320">3 дня</SelectItem>
                      <SelectItem value="10080">7 дней</SelectItem>
                      <SelectItem value="20160">14 дней</SelectItem>
                      <SelectItem value="43200">30 дней</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-steel-300 mb-2 block">
                    Причина (опционально)
                  </label>
                  <Textarea
                    placeholder="Укажите причину бана..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full"
                    rows={3}
                  />
                </div>

                <div className="text-sm text-steel-400">
                  Пользователь: {selectedUserId.slice(0, 8)}...
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={createUserBan}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                    disabled={!banDuration}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Выдать бан
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBanModalOpen(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}