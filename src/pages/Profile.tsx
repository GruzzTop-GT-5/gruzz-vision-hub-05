import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { User, Edit, Star, MapPin, Calendar, Briefcase, Phone, Save, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  id?: string;
  display_name?: string;
  full_name?: string;
  age?: number;
  citizenship?: string;
  qualification?: string;
  bio?: string;
  phone?: string;
  telegram_username?: string;
  telegram_photo_url?: string;
  rating?: number;
  balance?: number;
  created_at?: string;
}

const Profile = () => {
  const { user, userRole, signOut } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile data
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        toast.error('Ошибка загрузки профиля');
        return;
      }

      if (data) {
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          full_name: profileData.full_name,
          age: profileData.age,
          citizenship: profileData.citizenship,
          qualification: profileData.qualification,
          bio: profileData.bio,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving profile:', error);
        toast.error('Ошибка сохранения профиля');
        return;
      }

      toast.success('Профиль успешно сохранен');
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка сохранения профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: fullStars }, (_, index) => (
          <Star key={index} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        )}
        <span className="text-steel-300 ml-2">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
          <div className="text-steel-300">Загрузка профиля...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-glow">Мой профиль</h1>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Отмена</span>
                  </Button>
                  <Button 
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Сохранить</span>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Редактировать</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="card-steel">
                <CardHeader>
                  <CardTitle className="text-steel-100">Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      {profileData.telegram_photo_url ? (
                        <AvatarImage src={profileData.telegram_photo_url} alt="Profile" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600 text-steel-900 text-xl font-bold">
                        {(profileData.full_name || profileData.display_name || 'User')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="display_name" className="text-steel-400">Отображаемое имя</Label>
                            <Input
                              id="display_name"
                              value={profileData.display_name || ''}
                              onChange={(e) => handleInputChange('display_name', e.target.value)}
                              className="bg-steel-700 border-steel-600 text-steel-100"
                              placeholder="Введите отображаемое имя"
                            />
                          </div>
                          <div>
                            <Label htmlFor="full_name" className="text-steel-400">Полное имя</Label>
                            <Input
                              id="full_name"
                              value={profileData.full_name || ''}
                              onChange={(e) => handleInputChange('full_name', e.target.value)}
                              className="bg-steel-700 border-steel-600 text-steel-100"
                              placeholder="Введите полное имя"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-bold text-steel-100">
                            {profileData.display_name || profileData.full_name || 'Не указано'}
                          </h2>
                          {profileData.full_name && profileData.display_name && (
                            <p className="text-steel-300">{profileData.full_name}</p>
                          )}
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4 text-steel-400" />
                            <span className="text-steel-300">
                              {profileData.qualification || 'Специализация не указана'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Возраст</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={profileData.age || ''}
                          onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                          className="bg-steel-700 border-steel-600 text-steel-100"
                          placeholder="Введите возраст"
                          min="16"
                          max="100"
                        />
                      ) : (
                        <p className="text-steel-100">
                          {profileData.age ? `${profileData.age} лет` : 'Не указано'}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Гражданство</Label>
                      {isEditing ? (
                        <Input
                          value={profileData.citizenship || ''}
                          onChange={(e) => handleInputChange('citizenship', e.target.value)}
                          className="bg-steel-700 border-steel-600 text-steel-100"
                          placeholder="Введите гражданство"
                        />
                      ) : (
                        <p className="text-steel-100">{profileData.citizenship || 'Не указано'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Телефон</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-steel-400" />
                        <p className="text-steel-100">{profileData.phone || 'Не указан'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Telegram</Label>
                      <p className="text-steel-100">
                        {profileData.telegram_username 
                          ? `@${profileData.telegram_username}` 
                          : 'Не подключен'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-steel-400 text-sm">Специализация</Label>
                    {isEditing ? (
                      <Input
                        value={profileData.qualification || ''}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        className="bg-steel-700 border-steel-600 text-steel-100"
                        placeholder="Введите вашу специализацию"
                      />
                    ) : (
                      <p className="text-steel-100">{profileData.qualification || 'Не указана'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-steel-400 text-sm">О себе</Label>
                    {isEditing ? (
                      <Textarea
                        value={profileData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="bg-steel-700 border-steel-600 text-steel-100 min-h-[100px]"
                        placeholder="Расскажите о себе, своем опыте и навыках..."
                      />
                    ) : (
                      <p className="text-steel-200 leading-relaxed">
                        {profileData.bio || 'Информация не указана'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Статистика */}
            <div className="space-y-6">
              <Card className="card-steel">
                <CardHeader>
                  <CardTitle className="text-steel-100">Статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {profileData.balance?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-steel-300 text-sm">GT Coins</div>
                  </div>

                  <div className="text-center">
                    <div className="mb-1">
                      {renderStars(profileData.rating || 0)}
                    </div>
                    <div className="text-steel-300 text-sm">Рейтинг</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-steel-400" />
                      <span className="text-steel-300">
                        {profileData.created_at 
                          ? new Date(profileData.created_at).toLocaleDateString('ru-RU')
                          : 'Не указано'}
                      </span>
                    </div>
                    <div className="text-steel-400 text-sm">Дата регистрации</div>
                  </div>
                </CardContent>
              </Card>

              {/* Роль пользователя */}
              {userRole && userRole !== 'user' && (
                <Card className="card-steel">
                  <CardHeader>
                    <CardTitle className="text-steel-100">Статус</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      variant="outline" 
                      className={`w-full justify-center py-2 ${
                        userRole === 'system_admin' 
                          ? 'text-red-400 border-red-400'
                          : userRole === 'admin'
                          ? 'text-primary border-primary'
                          : userRole === 'moderator'
                          ? 'text-yellow-400 border-yellow-400'
                          : 'text-green-400 border-green-400'
                      }`}
                    >
                      {userRole === 'system_admin' && 'Системный администратор'}
                      {userRole === 'admin' && 'Администратор'}
                      {userRole === 'moderator' && 'Модератор'}
                      {userRole === 'support' && 'Поддержка'}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;