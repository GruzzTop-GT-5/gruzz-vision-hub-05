import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  MessageSquare, 
  Crown, 
  Shield, 
  Headphones,
  Wrench
} from 'lucide-react';

interface OnlineUser {
  user_id: string;
  online_at: string;
  presence_ref: string;
  profile?: {
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    telegram_photo_url: string | null;
    role: string;
  };
}

interface OnlineUsersWidgetProps {
  onStartChat: (userId: string) => void;
}

export const OnlineUsersWidget = ({ onStartChat }: OnlineUsersWidgetProps) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Create presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track user presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        updateOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // User joined
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // User left
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send user's presence
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    setPresenceChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  const updateOnlineUsers = async (presenceState: any) => {
    const users: OnlineUser[] = [];
    
    Object.keys(presenceState).forEach((userId) => {
      const presences = presenceState[userId];
      if (presences.length > 0 && userId !== user?.id) {
        users.push({
          user_id: userId,
          online_at: presences[0].online_at,
          presence_ref: presences[0].presence_ref,
        });
      }
    });

    // Fetch user profiles
    if (users.length > 0) {
      const userIds = users.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, avatar_url, telegram_photo_url, role')
        .in('id', userIds);

      // Attach profiles to users
      const usersWithProfiles = users.map(user => ({
        ...user,
        profile: profiles?.find(p => p.id === user.user_id),
      }));

      setOnlineUsers(usersWithProfiles);
    } else {
      setOnlineUsers([]);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'system_admin':
        return <Crown className="w-3 h-3 text-red-400" />;
      case 'admin':
        return <Shield className="w-3 h-3 text-primary" />;
      case 'moderator':
        return <Wrench className="w-3 h-3 text-yellow-400" />;
      case 'support':
        return <Headphones className="w-3 h-3 text-green-400" />;
      default:
        return null;
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

  const getUserName = (profile: any) => {
    return profile?.display_name || profile?.full_name || 'Пользователь';
  };

  if (onlineUsers.length === 0) {
    return (
      <Card className="card-steel p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Users className="w-4 h-4 text-steel-400" />
          <h3 className="font-medium text-steel-100">Онлайн пользователи</h3>
          <Badge variant="outline" className="text-xs">
            0
          </Badge>
        </div>
        <p className="text-sm text-steel-400 text-center py-4">
          Никого нет в сети
        </p>
      </Card>
    );
  }

  return (
    <Card className="card-steel p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Users className="w-4 h-4 text-green-400" />
        <h3 className="font-medium text-steel-100">Онлайн пользователи</h3>
        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/20">
          {onlineUsers.length}
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {onlineUsers.map((onlineUser) => (
          <div
            key={onlineUser.user_id}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-steel-700/30 transition-colors"
          >
            <div className="relative">
              <Avatar className="w-8 h-8">
                {onlineUser.profile?.avatar_url ? (
                  <AvatarImage src={onlineUser.profile.avatar_url} />
                ) : onlineUser.profile?.telegram_photo_url ? (
                  <AvatarImage src={onlineUser.profile.telegram_photo_url} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600 text-xs">
                    {getUserName(onlineUser.profile).charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-steel-800" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-steel-100 truncate">
                  {getUserName(onlineUser.profile)}
                </p>
                {onlineUser.profile?.role !== 'user' && (
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(onlineUser.profile?.role || 'user')}
                  </div>
                )}
              </div>
              {onlineUser.profile?.role !== 'user' && (
                <Badge className={`text-xs ${getRoleColor(onlineUser.profile?.role || 'user')}`}>
                  {onlineUser.profile?.role === 'system_admin' && 'Системный админ'}
                  {onlineUser.profile?.role === 'admin' && 'Администратор'}
                  {onlineUser.profile?.role === 'moderator' && 'Модератор'}
                  {onlineUser.profile?.role === 'support' && 'Поддержка'}
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartChat(onlineUser.user_id)}
              className="shrink-0"
            >
              <MessageSquare className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};