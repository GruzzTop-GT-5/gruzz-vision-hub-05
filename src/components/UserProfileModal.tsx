import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRatingDisplay } from '@/components/UserRatingDisplay';
import { UserReviews } from '@/components/UserReviews';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { User, Phone, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserProfile {
  id: string;
  phone: string | null;
  rating: number | null;
  created_at: string;
  role: string | null;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal = ({ userId, open, onOpenChange }: UserProfileModalProps) => {
  const { user: currentUser } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserProfile();
    }
  }, [userId, open]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, phone, rating, created_at, role, display_name, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    if (!role || role === 'user') return null;
    
    switch (role) {
      case 'system_admin': return 'Системный администратор';
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      case 'support': return 'Поддержка';
      default: return null;
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'system_admin': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'admin': return 'text-primary bg-primary/10 border-primary/20';
      case 'moderator': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'support': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-steel-400 bg-steel-400/10 border-steel-400/20';
    }
  };

  const getUserDisplayName = () => {
    if (!profile) return 'Пользователь';
    return profile.display_name || profile.full_name || `ID: ${profile.id.slice(0, 8)}...`;
  };

  const isOwnProfile = currentUser?.id === userId;
  const roleDisplay = profile ? getRoleDisplayName(profile.role) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-steel max-w-2xl max-h-[90vh] overflow-y-auto !transition-none !duration-0">
        <DialogHeader className="!transition-none !duration-0">
          <DialogTitle className="text-2xl font-bold text-steel-100 !transition-none !duration-0">
            {isOwnProfile ? 'Мой профиль' : 'Профиль пользователя'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-steel-300">Загрузка профиля...</p>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-6 !transition-none !duration-0">
            {/* Profile Info */}
            <Card className="bg-steel-800/50 border-steel-600 p-6 !transition-none !duration-0">
              <div className="flex items-start space-x-4 !transition-none !duration-0">
                {/* Avatar */}
                <Avatar className="w-16 h-16 border-2 border-primary/20 !transition-none !duration-0">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={getUserDisplayName()} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600 text-steel-900">
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Info */}
                <div className="flex-1 space-y-3 !transition-none !duration-0">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-bold text-steel-100">
                        {getUserDisplayName()}
                      </h3>
                      {roleDisplay && (
                        <Badge className={getRoleBadgeColor(profile.role)}>
                          {roleDisplay}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Rating */}
                    <UserRatingDisplay userId={profile.id} showDetails={true} />
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    {profile.phone && (
                      <div className="flex items-center space-x-2 text-steel-300 text-sm">
                        <Phone className="w-4 h-4 text-steel-400" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-steel-300 text-sm">
                      <Calendar className="w-4 h-4 text-steel-400" />
                      <span>
                        На платформе с {format(new Date(profile.created_at), 'dd MMM yyyy', { locale: ru })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-steel-300 text-sm">
                      <Award className="w-4 h-4 text-primary" />
                      <span>
                        Рейтинг: <span className="font-semibold text-primary">
                          {(profile.rating || 0).toFixed(1)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reviews Section */}
            <div>
              <h4 className="text-lg font-bold text-steel-100 mb-3">Отзывы</h4>
              <UserReviews
                userId={profile.id}
                canLeaveReview={!isOwnProfile && !!currentUser}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-steel-300">Профиль не найден</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
