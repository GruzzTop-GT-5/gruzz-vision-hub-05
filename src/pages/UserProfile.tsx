import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRatingDisplay } from '@/components/UserRatingDisplay';
import { UserReviews } from '@/components/UserReviews';
import { BackButton } from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Calendar, Award, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserProfile {
  id: string;
  phone: string | null;
  rating: number | null;
  created_at: string;
  role: string | null;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, userRole, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    } else {
      setError('Пользователь не найден');
      setIsLoading(false);
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, phone, rating, created_at, role')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Пользователь не найден');
        } else {
          throw error;
        }
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Ошибка загрузки профиля');
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

  if (loading || isLoading) {
    return (
      <Layout user={currentUser} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-steel-300">Загрузка профиля...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={currentUser} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">{error}</h2>
            <Button onClick={() => navigate('/')}>
              Вернуться на главную
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === userId;
  const roleDisplay = getRoleDisplayName(profile.role);

  return (
    <Layout user={currentUser} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton />
            <h1 className="text-3xl font-bold text-glow">
              {isOwnProfile ? 'Мой профиль' : 'Профиль пользователя'}
            </h1>
            <div></div>
          </div>

          {/* Profile Card */}
          <Card className="card-steel p-8">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-steel-900" />
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-steel-100">
                      ID: {profile.id.slice(0, 8)}...
                    </h2>
                    {roleDisplay && (
                      <Badge className={getRoleBadgeColor(profile.role)}>
                        {roleDisplay}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-4">
                    <UserRatingDisplay userId={profile.id} showDetails={true} />
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.phone && (
                    <div className="flex items-center space-x-2 text-steel-300">
                      <Phone className="w-4 h-4 text-steel-400" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-steel-300">
                    <Calendar className="w-4 h-4 text-steel-400" />
                    <span>
                      Регистрация: {format(new Date(profile.created_at), 'dd MMM yyyy', { locale: ru })}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center space-x-6 pt-4 border-t border-steel-600">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-steel-300">
                      Рейтинг: {(profile.rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reviews Section */}
          <UserReviews
            userId={profile.id}
            canLeaveReview={!isOwnProfile && !!currentUser}
          />
        </div>
      </div>
    </Layout>
  );
}