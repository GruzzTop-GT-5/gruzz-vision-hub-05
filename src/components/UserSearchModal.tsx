import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, Star } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telegram_photo_url: string | null;
  rating: number;
  role: string;
  bio: string | null;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
}

export const UserSearchModal = ({ isOpen, onClose, onStartChat }: UserSearchModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setUsers([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user?.id) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('profiles')
        .select('id, display_name, full_name, avatar_url, telegram_photo_url, rating, role, bio')
        .neq('id', user.id)
        .limit(20);

      // Search by display name or full name
      if (searchQuery.trim()) {
        query = query.or(`display_name.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Ошибка поиска",
        description: "Не удалось найти пользователей",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    onStartChat(targetUserId);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'admin':
        return 'bg-primary/20 text-primary border-primary/20';
      case 'moderator':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      case 'support':
        return 'bg-green-500/20 text-green-400 border-green-500/20';
      default:
        return 'bg-steel-500/20 text-steel-400 border-steel-500/20';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'system_admin': return 'Системный администратор';
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      case 'support': return 'Поддержка';
      default: return 'Пользователь';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel-dialog max-w-md">
        <DialogHeader>
          <DialogTitle className="text-steel-100">Поиск пользователей</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-steel-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите имя пользователя..."
                className="pl-10"
              />
            </div>
            <Button onClick={searchUsers} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Поиск'
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-steel-300">Поиск пользователей...</p>
              </div>
            ) : hasSearched && users.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                <p className="text-steel-300">Пользователи не найдены</p>
                <p className="text-steel-400 text-sm">Попробуйте изменить запрос</p>
              </div>
            ) : !hasSearched ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                <p className="text-steel-300">Введите имя для поиска</p>
              </div>
            ) : (
              users.map((profile) => (
                <Card key={profile.id} className="card-steel p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt="Profile" />
                      ) : profile.telegram_photo_url ? (
                        <AvatarImage src={profile.telegram_photo_url} alt="Profile" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600">
                          {(profile.display_name || profile.full_name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-steel-100">
                          {profile.display_name || profile.full_name || 'Пользователь'}
                        </h3>
                        {profile.role !== 'user' && (
                          <Badge className={`text-xs ${getRoleColor(profile.role)}`}>
                            {getRoleDisplayName(profile.role)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-steel-300">{Number(profile.rating).toFixed(1)}</span>
                        </div>
                      </div>

                      {profile.bio && (
                        <p className="text-xs text-steel-400 line-clamp-2">{profile.bio}</p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleStartChat(profile.id)}
                      className="shrink-0"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Чат
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};