import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { handleError } from '@/lib/errorHandler';
import {
  Users,
  Search,
  Crown,
  Shield,
  UserCheck,
  User,
  AlertTriangle,
  Save,
  Eye,
  Clock
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

interface UserProfile {
  id: string;
  phone: string | null;
  display_name: string | null;
  full_name: string | null;
  role: 'user' | 'support' | 'moderator' | 'admin' | 'system_admin';
  rating: number | null;
  balance: number;
  created_at: string;
}

interface RoleChange {
  userId: string;
  fromRole: string;
  toRole: string;
  reason: string;
}

export const RoleManagement: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser, userRole } = useAuthContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, RoleChange>>(new Map());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<RoleChange | null>(null);

  // Матрица прав: кто может назначать какие роли
  const canAssignRole = (currentRole: string, targetRole: string): boolean => {
    const roleHierarchy = {
      'system_admin': 5,
      'admin': 4,
      'moderator': 3,
      'support': 2,
      'user': 1
    };

    const currentLevel = roleHierarchy[currentRole as keyof typeof roleHierarchy] || 0;
    const targetLevel = roleHierarchy[targetRole as keyof typeof roleHierarchy] || 0;

    // Системный админ может назначать любые роли
    if (currentRole === 'system_admin') return true;
    
    // Админ может назначать роли ниже своего уровня
    if (currentRole === 'admin' && targetLevel < 4) return true;
    
    // Модератор может назначать только support и user
    if (currentRole === 'moderator' && ['support', 'user'].includes(targetRole)) return true;

    return false;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, phone, display_name, full_name, rating, balance, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles from user_roles table (using any to bypass type checking)
      const { data: roles, error: rolesError } = await (supabase as any)
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) console.error('Error fetching roles:', rolesError);

      // Merge role data with profiles
      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find((r: any) => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role || 'user') as 'user' | 'support' | 'moderator' | 'admin' | 'system_admin'
        };
      });

      setUsers(usersWithRoles || []);
    } catch (error) {
      handleError(error, { component: 'RoleManagement', action: 'fetchUsers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Проверяем права
    if (!canAssignRole(userRole || '', newRole)) {
      toast({
        title: "Недостаточно прав",
        description: "У вас нет прав для назначения этой роли",
        variant: "destructive"
      });
      return;
    }

    // Нельзя изменять свою собственную роль system_admin
    if (userId === currentUser?.id && user.role === 'system_admin') {
      toast({
        title: "Ошибка",
        description: "Нельзя изменить свою роль системного администратора",
        variant: "destructive"
      });
      return;
    }

    const change: RoleChange = {
      userId,
      fromRole: user.role,
      toRole: newRole,
      reason: ''
    };

    const newPendingChanges = new Map(pendingChanges);
    if (newRole === user.role) {
      newPendingChanges.delete(userId);
    } else {
      newPendingChanges.set(userId, change);
    }
    setPendingChanges(newPendingChanges);
  };

  const confirmRoleChange = async (change: RoleChange, reason: string) => {
    try {
      setLoading(true);

      // Delete old role assignment from user_roles table (using any to bypass type checking)
      await (supabase as any)
        .from('user_roles')
        .delete()
        .eq('user_id', change.userId);

      // Insert new role assignment
      const { error: updateError } = await (supabase as any)
        .from('user_roles')
        .insert({
          user_id: change.userId,
          role: change.toRole,
          assigned_by: currentUser?.id
        });

      if (updateError) throw updateError;

      // Логируем изменение
      await supabase
        .from('admin_logs')
        .insert({
          action: 'role_change',
          user_id: currentUser?.id,
          target_id: change.userId,
          target_type: 'user'
        });

      // Логируем в security_logs
      await supabase.rpc('log_security_event', {
        p_event_type: 'role_change',
        p_user_id: currentUser?.id,
        p_details: {
          target_user_id: change.userId,
          from_role: change.fromRole,
          to_role: change.toRole,
          reason: reason
        },
        p_severity: 'warning'
      });

      // Создаем уведомление для пользователя
      await supabase
        .from('notifications')
        .insert({
          user_id: change.userId,
          type: 'role_change',
          title: 'Роль изменена',
          content: `Ваша роль была изменена с "${getRoleLabel(change.fromRole)}" на "${getRoleLabel(change.toRole)}". Причина: ${reason}`
        });

      toast({
        title: "Успешно",
        description: `Роль пользователя изменена на "${getRoleLabel(change.toRole)}"`
      });

      // Убираем из pending и обновляем список
      const newPendingChanges = new Map(pendingChanges);
      newPendingChanges.delete(change.userId);
      setPendingChanges(newPendingChanges);
      
      fetchUsers();
    } catch (error) {
      handleError(error, { component: 'RoleManagement', action: 'confirmRoleChange' });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
      setSelectedChange(null);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels = {
      'system_admin': 'Системный администратор',
      'admin': 'Администратор',
      'moderator': 'Модератор',
      'support': 'Поддержка',
      'user': 'Пользователь'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string): string => {
    const colors = {
      'system_admin': 'bg-red-500/10 text-red-400 border-red-500/20',
      'admin': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'moderator': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'support': 'bg-green-500/10 text-green-400 border-green-500/20',
      'user': 'bg-steel-500/10 text-steel-400 border-steel-500/20'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      'system_admin': <Crown className="w-4 h-4" />,
      'admin': <Shield className="w-4 h-4" />,
      'moderator': <UserCheck className="w-4 h-4" />,
      'support': <Users className="w-4 h-4" />,
      'user': <User className="w-4 h-4" />
    };
    return icons[role as keyof typeof icons] || <User className="w-4 h-4" />;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.phone?.includes(searchTerm) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-steel-100">Управление ролями</h2>
          {pendingChanges.size > 0 && (
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              {pendingChanges.size} изменений
            </Badge>
          )}
        </div>
        <Button onClick={fetchUsers} disabled={loading}>
          Обновить
        </Button>
      </div>

      {/* Фильтры */}
      <Card className="card-steel-lighter p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4" />
            <Input
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по роли" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="system_admin">Системные администраторы</SelectItem>
              <SelectItem value="admin">Администраторы</SelectItem>
              <SelectItem value="moderator">Модераторы</SelectItem>
              <SelectItem value="support">Поддержка</SelectItem>
              <SelectItem value="user">Пользователи</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center text-sm text-steel-400">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Всего пользователей: {filteredUsers.length}
          </div>
        </div>
      </Card>

      {/* Матрица прав */}
      <Card className="card-steel-lighter p-4">
        <h3 className="text-lg font-semibold text-steel-100 mb-3">Ваши права ({getRoleLabel(userRole || '')})</h3>
        <div className="grid grid-cols-5 gap-2 text-sm">
          {['user', 'support', 'moderator', 'admin', 'system_admin'].map(role => (
            <div key={role} className="flex items-center space-x-1">
              {canAssignRole(userRole || '', role) ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-red-400">✗</span>
              )}
              <span className="text-steel-300">{getRoleLabel(role)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Список пользователей */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {loading ? (
            <Card className="card-steel-lighter p-6 text-center">
              <p className="text-steel-300">Загрузка пользователей...</p>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card className="card-steel-lighter p-6 text-center">
              <Users className="w-12 h-12 text-steel-400 mx-auto mb-2" />
              <p className="text-steel-300">Пользователи не найдены</p>
            </Card>
          ) : (
            filteredUsers.map((user) => {
              const pendingChange = pendingChanges.get(user.id);
              const effectiveRole = pendingChange?.toRole || user.role;
              
              return (
                <Card key={user.id} className="card-steel-lighter p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-steel-100">
                            {user.display_name || user.full_name || 'Пользователь'}
                          </h3>
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1">{getRoleLabel(user.role)}</span>
                          </Badge>
                          {pendingChange && (
                            <>
                              <span className="text-steel-400">→</span>
                              <Badge className={getRoleColor(pendingChange.toRole) + ' border-yellow-500/50'}>
                                {getRoleIcon(pendingChange.toRole)}
                                <span className="ml-1">{getRoleLabel(pendingChange.toRole)}</span>
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-steel-400">
                          <span>{user.phone}</span>
                          <span>{user.balance}₽</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(user.created_at), 'dd.MM.yyyy', { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Select
                        value={effectiveRole}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={user.id === currentUser?.id && user.role === 'system_admin'}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['user', 'support', 'moderator', 'admin', 'system_admin'].map(role => (
                            <SelectItem 
                              key={role} 
                              value={role}
                              disabled={!canAssignRole(userRole || '', role)}
                            >
                              <div className="flex items-center space-x-2">
                                {getRoleIcon(role)}
                                <span>{getRoleLabel(role)}</span>
                                {!canAssignRole(userRole || '', role) && (
                                  <span className="text-red-400 text-xs">(нет прав)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {pendingChange && (
                        <AlertDialog open={confirmDialogOpen && selectedChange?.userId === user.id} onOpenChange={setConfirmDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedChange(pendingChange)}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Сохранить
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Подтверждение изменения роли</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы собираетесь изменить роль пользователя с "{getRoleLabel(pendingChange.fromRole)}" на "{getRoleLabel(pendingChange.toRole)}".
                                <br /><br />
                                Укажите причину изменения:
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input
                              placeholder="Причина изменения роли..."
                              value={pendingChange.reason}
                              onChange={(e) => {
                                const updated = { ...pendingChange, reason: e.target.value };
                                const newPendingChanges = new Map(pendingChanges);
                                newPendingChanges.set(user.id, updated);
                                setPendingChanges(newPendingChanges);
                              }}
                            />
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => confirmRoleChange(pendingChange, pendingChange.reason)}
                                disabled={!pendingChange.reason.trim()}
                              >
                                Подтвердить изменение
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};