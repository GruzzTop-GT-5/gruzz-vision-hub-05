import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, UserCheck, UserX, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserManagementModal } from '@/components/UserManagementModal';
import { UserRatingDisplay } from '@/components/UserRatingDisplay';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface User {
  id: string;
  phone: string | null;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  role: string;
  rating: number | null;
  balance: number;
  created_at: string;
  age: number | null;
  citizenship: string | null;
  qualification: string[] | null;
  user_type: string | null;
  user_subtype: string | null;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'needs_attention'>('all');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles from secure user_roles table
      const userIds = data?.map(u => u.id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);
      
      const usersWithRoles = data?.map(user => ({
        ...user,
        role: rolesMap.get(user.id) || 'user'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Настройка real-time обновлений для пользователей
    const channel = supabase
      .channel('user-management')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        console.log('Profile changed:', payload);
        fetchUsers(); // Перезагружаем список пользователей
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Пользователи, требующие внимания (без выбранного типа)
  const usersNeedingAttention = users.filter(user => 
    !user.user_type || !user.user_subtype
  );

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.phone?.includes(searchTerm) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterTab === 'needs_attention') {
      return matchesSearch && (!user.user_type || !user.user_subtype);
    }
    
    return matchesSearch;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin': return 'bg-red-500';
      case 'admin': return 'bg-purple-500';
      case 'moderator': return 'bg-blue-500';
      case 'support': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUserUpdate = () => {
    fetchUsers();
    setShowUserModal(false);
    setSelectedUser(null);
  };

  return (
    <Card className="card-steel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-steel-100">Управление пользователями</h3>
          {usersNeedingAttention.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {usersNeedingAttention.length} требуют внимания
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as 'all' | 'needs_attention')} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Все пользователи ({users.length})
          </TabsTrigger>
          <TabsTrigger value="needs_attention" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Требуют внимания ({usersNeedingAttention.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4" />
          <Input
            placeholder="Поиск по телефону или имени..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-steel-400">
                {filterTab === 'needs_attention' 
                  ? '✅ Все пользователи настроили свои профили'
                  : 'Пользователи не найдены'
                }
              </div>
            ) : (
              filteredUsers.map((user) => {
                const needsAttention = !user.user_type || !user.user_subtype;
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg hover:bg-steel-700 transition-colors cursor-pointer ${
                      needsAttention 
                        ? 'bg-orange-500/10 border border-orange-500/30' 
                        : 'bg-steel-800'
                    }`}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {needsAttention && (
                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 animate-pulse" />
                      )}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-steel-100 truncate">
                            {user.display_name || user.full_name || user.phone}
                          </span>
                          <Badge className={`${getRoleColor(user.role)} text-white text-xs`}>
                            {user.role}
                          </Badge>
                          {needsAttention && (
                            <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                              Не завершил регистрацию
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-steel-400 flex-wrap">
                          <span>{user.phone}</span>
                          <UserRatingDisplay userId={user.id} className="text-sm" />
                          <span>{user.balance.toFixed(2)} GT</span>
                          <span>{format(new Date(user.created_at), 'dd.MM.yyyy', { locale: ru })}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-2 flex-shrink-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}

      {selectedUser && (
        <UserManagementModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </Card>
  );
};