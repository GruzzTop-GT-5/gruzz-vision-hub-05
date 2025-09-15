import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { UserReviews } from '@/components/UserReviews';
import { BackButton } from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Calendar, Award, AlertCircle, Edit, MessageCircle, Users, Flag, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserProfile {
  id: string;
  phone: string | null;
  display_name: string | null;
  telegram_username: string | null;
  rating: number | null;
  created_at: string;
  role: string | null;
  balance: number;
  full_name: string | null;
  age: number | null;
  citizenship: string | null;
  qualification: string | null;
  bio: string | null;
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
    } else if (currentUser) {
      // If no userId in URL, show current user's profile
      fetchCurrentUserProfile();
    } else {
      setError('Пользователь не найден');
      setIsLoading(false);
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, phone, display_name, telegram_username, rating, created_at, role, balance, full_name, age, citizenship, qualification, bio')
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

  const fetchCurrentUserProfile = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, phone, display_name, telegram_username, rating, created_at, role, balance, full_name, age, citizenship, qualification, bio')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching current user profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
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
            <Button onClick={() => navigate(-1)}>
              Вернуться назад
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === (userId || currentUser?.id);
  const roleDisplay = getRoleDisplayName(profile.role);

  return (
    <Layout user={currentUser} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton onClick={() => navigate(-1)} />
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
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold">
                        {profile.display_name || profile.full_name || `Пользователь ${profile.id.slice(0, 8)}`}
                      </h2>
                      {roleDisplay && (
                        <Badge className={getRoleBadgeColor(profile.role)}>
                          {roleDisplay}
                        </Badge>
                      )}
                    </div>
                    
                    {profile.full_name && profile.display_name !== profile.full_name && (
                      <p className="text-lg text-steel-300 mb-2">
                        {profile.full_name}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-steel-400 text-sm mb-3">
                      {profile.qualification && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {profile.qualification}
                        </span>
                      )}
                      
                      {profile.age && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {profile.age} лет
                        </span>
                      )}
                      
                      {profile.citizenship && (
                        <span className="flex items-center gap-1">
                          <Flag className="w-4 h-4" />
                          {profile.citizenship}
                        </span>
                      )}
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-4">
                      <StarRating rating={profile.rating || 0} size="md" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/edit-profile')}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/balance')}
                        >
                          Баланс: {profile.balance.toFixed(2)} ₽
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/chat-system')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Написать
                      </Button>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.phone && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile.telegram_username && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span>{profile.telegram_username}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Регистрация: {format(new Date(profile.created_at), 'dd MMM yyyy', { locale: ru })}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center space-x-6 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Рейтинг: {(profile.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {profile.id.slice(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Bio Section */}
          {profile.bio && (
            <Card className="card-steel p-6">
              <h3 className="text-lg font-semibold text-steel-200 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                О себе
              </h3>
              <p className="text-steel-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </Card>
          )}

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