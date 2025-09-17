import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Ban,
  UserX,
  Clock,
  Shield,
  MessageSquare,
  Search,
  Filter,
  X,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
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
  profiles?: {
    display_name: string | null;
    full_name: string | null;
    phone: string | null;
  } | null;
  issued_by_profile?: {
    display_name: string | null;
    full_name: string | null;
  } | null;
}

export const BanManagementSection = () => {
  const { toast } = useToast();
  const [userBans, setUserBans] = useState<UserBan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'order_mute' | 'payment_mute' | 'account_block'>('all');
  
  // Unban modal state
  const [unbanReason, setUnbanReason] = useState('');
  const [selectedBanId, setSelectedBanId] = useState<string>('');

  useEffect(() => {
    fetchUserBans();
  }, []);

  const fetchUserBans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_bans')
        .select(`
          *,
          profiles!user_id (
            display_name,
            full_name,
            phone
          ),
          issued_by_profile:profiles!issued_by (
            display_name,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // If the table doesn't exist, just set empty array
        if (error.code === 'PGRST200') {
          setUserBans([]);
          setIsLoading(false);
          return;
        }
        throw error;
      }
      setUserBans((data as any) || []);
    } catch (error) {
      console.error('Error fetching user bans:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список банов",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbanUser = async (banId: string) => {
    if (!unbanReason.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите причину снятия ограничения",
        variant: "destructive"
      });
      return;
    }

    try {
      const ban = userBans.find(b => b.id === banId);
      if (!ban) return;

      // Deactivate the ban
      const { error: updateError } = await supabase
        .from('user_bans')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', banId);

      if (updateError) throw updateError;

      // Log admin action
      await supabase
        .from('admin_logs')
        .insert({
          action: 'unban_user',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          target_id: ban.user_id,
          target_type: 'user'
        });

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: ban.user_id,
          type: 'ban_removed',
          title: 'Ограничение снято',
          content: `Ограничение "${getBanTypeLabel(ban.ban_type)}" было снято. Причина: ${unbanReason}`
        });

      toast({
        title: "Успешно",
        description: "Ограничение снято"
      });

      setUnbanReason('');
      setSelectedBanId('');
      fetchUserBans();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось снять ограничение",
        variant: "destructive"
      });
    }
  };

  const getBanTypeLabel = (type: string) => {
    switch (type) {
      case 'order_mute': return 'Запрет на заказы';
      case 'payment_mute': return 'Запрет на платежи';
      case 'account_block': return 'Блокировка аккаунта';
      default: return type;
    }
  };

  const getBanTypeIcon = (type: string) => {
    switch (type) {
      case 'order_mute': return <Ban className="w-4 h-4" />;
      case 'payment_mute': return <Shield className="w-4 h-4" />;
      case 'account_block': return <UserX className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getBanTypeColor = (type: string) => {
    switch (type) {
      case 'order_mute': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'payment_mute': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'account_block': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-steel-500/10 text-steel-400 border-steel-500/20';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  const filteredBans = userBans.filter(ban => {
    const matchesSearch = !searchFilter || 
      ban.profiles?.display_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ban.profiles?.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ban.profiles?.phone?.includes(searchFilter) ||
      ban.reason?.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && ban.is_active && !isExpired(ban.expires_at)) ||
      (statusFilter === 'expired' && (!ban.is_active || isExpired(ban.expires_at)));

    const matchesType = typeFilter === 'all' || ban.ban_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Ban className="w-6 h-6 text-red-400" />
          <h2 className="text-2xl font-bold text-steel-100">Бан Зона</h2>
          <Badge variant="outline" className="text-steel-300">
            {filteredBans.length} записей
          </Badge>
        </div>
        <Button onClick={fetchUserBans} disabled={isLoading}>
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <Card className="card-steel-lighter p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4" />
            <Input
              placeholder="Поиск по пользователю..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="expired">Неактивные/Истекшие</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Тип ограничения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="order_mute">Запрет на заказы</SelectItem>
              <SelectItem value="payment_mute">Запрет на платежи</SelectItem>
              <SelectItem value="account_block">Блокировка аккаунта</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchFilter('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Сбросить</span>
          </Button>
        </div>
      </Card>

      {/* Bans List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {isLoading ? (
            <Card className="card-steel-lighter p-6 text-center">
              <p className="text-steel-300">Загрузка...</p>
            </Card>
          ) : filteredBans.length === 0 ? (
            <Card className="card-steel-lighter p-6 text-center">
              <Ban className="w-12 h-12 text-steel-400 mx-auto mb-2" />
              <p className="text-steel-300">Ограничения не найдены</p>
            </Card>
          ) : (
            filteredBans.map((ban) => (
              <Card key={ban.id} className="card-steel-lighter p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-steel-100">
                            {ban.profiles?.display_name || ban.profiles?.full_name || 'Пользователь'}
                          </h3>
                          <Badge className={getBanTypeColor(ban.ban_type)}>
                            {getBanTypeIcon(ban.ban_type)}
                            <span className="ml-1">{getBanTypeLabel(ban.ban_type)}</span>
                          </Badge>
                          {ban.is_active && !isExpired(ban.expires_at) ? (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Активно
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Неактивно
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-steel-300">
                          Телефон: {ban.profiles?.phone || 'Не указан'}
                        </p>
                      </div>
                    </div>

                    {/* Ban Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-steel-400">Причина:</span>
                        <p className="text-steel-200 bg-steel-700 p-2 rounded mt-1">
                          {ban.reason || 'Не указана'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-steel-400">Выдан:</span>
                          <p className="text-steel-200">
                            {format(new Date(ban.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </p>
                        </div>
                        <div>
                          <span className="text-steel-400">Истекает:</span>
                          <p className="text-steel-200">
                            {format(new Date(ban.expires_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </p>
                        </div>
                        <div>
                          <span className="text-steel-400">Выдал:</span>
                          <p className="text-steel-200">
                            {ban.issued_by_profile?.display_name || ban.issued_by_profile?.full_name || 'Системный администратор'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {ban.is_active && !isExpired(ban.expires_at) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setSelectedBanId(ban.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Разбанить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Снятие ограничения</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите снять ограничение с пользователя?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="my-4">
                            <Textarea
                              placeholder="Причина снятия ограничения (обязательно)"
                              value={unbanReason}
                              onChange={(e) => setUnbanReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnbanUser(selectedBanId)}
                              disabled={!unbanReason.trim()}
                            >
                              Снять ограничение
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Детали
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};