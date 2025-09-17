import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search, UserCheck, UserX, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserManagementModal } from '@/components/UserManagementModal';
import { UserRatingDisplay } from '@/components/UserRatingDisplay';
import { handleError } from '@/lib/errorHandler';
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
  qualification: string | null;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      handleError(error, { component: 'UserManagement', action: 'fetchUsers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.phone?.includes(searchTerm) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-steel-100">Управление пользователями</h3>
      </div>

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
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-steel-800 rounded-lg hover:bg-steel-700 transition-colors cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-steel-100">
                        {user.display_name || user.full_name || user.phone}
                      </span>
                      <Badge className={`${getRoleColor(user.role)} text-white text-xs`}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-steel-400">
                      <span>{user.phone}</span>
                      <UserRatingDisplay userId={user.id} className="text-sm" />
                      <span>{user.balance}₽</span>
                      <span>{format(new Date(user.created_at), 'dd.MM.yyyy', { locale: ru })}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
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