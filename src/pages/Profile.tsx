import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { UserRatingDisplay } from '@/components/UserRatingDisplay';
import { RatingInfoDialog } from '@/components/RatingInfoDialog';
import { PromoCodeSection } from '@/components/PromoCodeSection';
import { UserReviews } from '@/components/UserReviews';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Edit, Star, MapPin, Calendar, Briefcase, Phone, Save, Check, X, Camera, Upload, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  id?: string;
  display_name?: string;
  full_name?: string;
  age?: number;
  citizenship?: string;
  qualification?: string[] | null;
  bio?: string;
  phone?: string;
  telegram_username?: string;
  telegram_photo_url?: string;
  avatar_url?: string;
  rating?: number;
  balance?: number;
  created_at?: string;
  registration_number?: number;
}

const Profile = () => {
  const { user, userRole, userType, userSubtype, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  // Load profile data
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else if (!loading) {
      // Если пользователь не авторизован, перенаправляем на главную
      navigate('/');
    }
  }, [user?.id, loading, navigate]);

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
        // Get registration number (how many users registered before this user)
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', data.created_at);

        const registrationNumber = (count || 0) + 1;

        setProfileData({
          ...data,
          registration_number: registrationNumber
        });
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
          phone: profileData.phone,
          telegram_username: profileData.telegram_username,
          avatar_url: profileData.avatar_url,
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

  // Форматирование номера телефона
  const formatPhoneNumber = (value: string) => {
    // Удаляем все символы кроме цифр
    const cleaned = value.replace(/\D/g, '');
    
    // Ограничиваем до 11 цифр (1 + 10)
    const limited = cleaned.slice(0, 11);
    
    // Добавляем +7 если номер начинается с 8 или пустой
    let formatted = limited;
    if (formatted.startsWith('8')) {
      formatted = '7' + formatted.slice(1);
    } else if (formatted.length > 0 && !formatted.startsWith('7')) {
      formatted = '7' + formatted;
    }
    
    // Форматируем как +7 XXX-XXX-XX-XX
    if (formatted.length >= 1) {
      let result = '+7';
      if (formatted.length > 1) {
        result += ' ' + formatted.slice(1, 4);
      }
      if (formatted.length > 4) {
        result += '-' + formatted.slice(4, 7);
      }
      if (formatted.length > 7) {
        result += '-' + formatted.slice(7, 9);
      }
      if (formatted.length > 9) {
        result += '-' + formatted.slice(9, 11);
      }
      return result;
    }
    
    return '+7 ';
  };

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setProfileData(prev => ({
      ...prev,
      phone: formatted
    }));
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5 МБ');
      return;
    }

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (profileData.avatar_url) {
        const oldPath = profileData.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Ошибка загрузки изображения');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile data
      setProfileData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));

      // Save to database immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        toast.error('Ошибка сохранения в базе данных');
        return;
      }

      toast.success('Фотография успешно обновлена');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  if (showAuth) {
    return <AuthForm onSuccess={() => setShowAuth(false)} onBack={() => setShowAuth(false)} />;
  }

  if (loading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={handleSignOut}>
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
          <div className="text-steel-300">Загрузка профиля...</div>
        </div>
      </Layout>
    );
  }

  // Если пользователь не авторизован, не показываем ничего (произойдет редирект)
  if (!user) {
    return null;
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={handleSignOut}>
      <div className="min-h-screen bg-background p-3 xs:p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-6 xs:mb-8 gap-4">
            <div className="flex items-center gap-3 xs:gap-4">
              <div className="w-12 h-12 xs:w-14 xs:h-14 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 xs:w-7 xs:h-7 text-steel-900" />
              </div>
              <div>
                <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-glow bg-gradient-to-r from-primary to-electric-400 bg-clip-text text-transparent">
                  Мой профиль
                </h1>
                <p className="text-xs xs:text-sm text-steel-400">Управление личной информацией</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full xs:w-auto">
              <Button 
                variant={showReviews ? "default" : "outline"}
                onClick={() => setShowReviews(!showReviews)}
                className="flex items-center gap-2 flex-1 xs:flex-none"
                size="sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Отзывы</span>
              </Button>
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 flex-1 xs:flex-none"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">Отмена</span>
                  </Button>
                  <Button 
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 flex-1 xs:flex-none"
                    size="sm"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="text-sm">Сохранить</span>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 flex-1 xs:flex-none"
                  size="sm"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Редактировать</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-4 xs:space-y-6">
              <Card className="card-steel border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-electric-600/10 border-b border-steel-600 p-4 xs:p-5 sm:p-6">
                  <CardTitle className="text-steel-100 flex items-center gap-2 text-base xs:text-lg">
                    <User className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                    <span>Основная информация</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 xs:space-y-5 p-4 xs:p-5 sm:p-6">
                  <div className="flex items-center gap-3 xs:gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-20 h-20 xs:w-24 xs:h-24">
                        {profileData.avatar_url ? (
                          <AvatarImage src={profileData.avatar_url} alt="Profile" />
                        ) : profileData.telegram_photo_url ? (
                          <AvatarImage src={profileData.telegram_photo_url} alt="Profile" />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600 text-steel-900 text-xl xs:text-2xl font-bold">
                          {(profileData.full_name || profileData.display_name || 'User')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Photo upload button */}
                      <div className="absolute -bottom-1 xs:-bottom-2 -right-1 xs:-right-2">
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <div className="w-8 h-8 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center transition-colors">
                            {uploading ? (
                              <div className="w-4 h-4 border-2 border-steel-900 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4 text-steel-900" />
                            )}
                          </div>
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={uploadAvatar}
                          className="hidden"
                          disabled={uploading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="display_name" className="text-steel-400 text-sm">Отображаемое имя</Label>
                            <Input
                              id="display_name"
                              value={profileData.display_name || ''}
                              onChange={(e) => handleInputChange('display_name', e.target.value)}
                              className="bg-steel-700 border-steel-600 text-steel-100 text-base"
                              placeholder="Введите отображаемое имя"
                            />
                          </div>
                          <div>
                            <Label htmlFor="full_name" className="text-steel-400 text-sm">Полное имя</Label>
                            <Input
                              id="full_name"
                              value={profileData.full_name || ''}
                              onChange={(e) => handleInputChange('full_name', e.target.value)}
                              className="bg-steel-700 border-steel-600 text-steel-100 text-base"
                              placeholder="Введите полное имя"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-steel-100 break-words">
                            {profileData.display_name || profileData.full_name || 'Не указано'}
                          </h2>
                          {profileData.full_name && profileData.display_name && (
                            <p className="text-sm xs:text-base text-steel-300 break-words">{profileData.full_name}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-steel-400 flex-shrink-0" />
                            <span className="text-sm xs:text-base text-steel-300 break-words">
                              {profileData.qualification || 'Специализация не указана'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Возраст</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={profileData.age || ''}
                          onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                          className="bg-steel-700 border-steel-600 text-steel-100 text-base"
                          placeholder="Введите возраст"
                          min="16"
                          max="100"
                        />
                      ) : (
                        <p className="text-sm xs:text-base text-steel-100">
                          {profileData.age ? `${profileData.age} лет` : 'Не указано'}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Гражданство</Label>
                      {isEditing ? (
                        <Select
                          value={profileData.citizenship || ''}
                          onValueChange={(value) => handleInputChange('citizenship', value)}
                        >
                          <SelectTrigger className="bg-steel-700 border-steel-600 text-steel-100">
                            <SelectValue placeholder="Выберите страну" />
                          </SelectTrigger>
                          <SelectContent className="bg-steel-800 border-steel-600 text-steel-100">
                            <SelectItem value="Россия">🇷🇺 Россия</SelectItem>
                            <SelectItem value="Казахстан">🇰🇿 Казахстан</SelectItem>
                            <SelectItem value="Узбекистан">🇺🇿 Узбекистан</SelectItem>
                            <SelectItem value="Кыргызстан">🇰🇬 Кыргызстан</SelectItem>
                            <SelectItem value="Таджикистан">🇹🇯 Таджикистан</SelectItem>
                            <SelectItem value="Беларусь">🇧🇾 Беларусь</SelectItem>
                            <SelectItem value="Украина">🇺🇦 Украина</SelectItem>
                            <SelectItem value="Азербайджан">🇦🇿 Азербайджан</SelectItem>
                            <SelectItem value="Армения">🇦🇲 Армения</SelectItem>
                            <SelectItem value="Грузия">🇬🇪 Грузия</SelectItem>
                            <SelectItem value="Молдова">🇲🇩 Молдова</SelectItem>
                            <SelectItem value="Туркменистан">🇹🇲 Туркменистан</SelectItem>
                            <SelectItem value="Турция">🇹🇷 Турция</SelectItem>
                            <SelectItem value="Польша">🇵🇱 Польша</SelectItem>
                            <SelectItem value="Германия">🇩🇪 Германия</SelectItem>
                            <SelectItem value="США">🇺🇸 США</SelectItem>
                            <SelectItem value="Другое">🌍 Другое</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm xs:text-base text-steel-100">{profileData.citizenship || 'Не указано'}</p>
                      )}
                    </div>

                   <div className="space-y-2">
                     <Label className="text-steel-400 text-sm">№ пользователя</Label>
                     <div className="flex items-center gap-2">
                       <User className="w-4 h-4 text-steel-400 flex-shrink-0" />
                       <p className="text-sm xs:text-base text-steel-100 font-mono bg-steel-800 px-2 xs:px-3 py-1.5 xs:py-2 rounded">
                         #{profileData.registration_number || 'N/A'}
                       </p>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <Label className="text-steel-400 text-sm">ID аккаунта</Label>
                     <div className="flex items-center gap-2">
                       <User className="w-4 h-4 text-steel-400 flex-shrink-0" />
                       <p className="text-xs xs:text-sm text-steel-100 font-mono bg-steel-800 px-2 xs:px-3 py-1.5 xs:py-2 rounded break-all">
                         {profileData.id?.substring(0, 8) || 'N/A'}...
                       </p>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <Label className="text-steel-400 text-sm">Логин аккаунта</Label>
                     <div className="flex items-center gap-2">
                       <User className="w-4 h-4 text-steel-400 flex-shrink-0" />
                       <p className="text-sm xs:text-base text-steel-100 font-mono bg-steel-800 px-2 xs:px-3 py-1.5 xs:py-2 rounded break-all">
                         {profileData.phone || profileData.id || 'Не определен'}
                       </p>
                     </div>
                   </div>

                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Телефон</Label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={profileData.phone || '+7 '}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="bg-steel-700 border-steel-600 text-steel-100"
                          placeholder="+7 XXX-XXX-XX-XX"
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-steel-400" />
                          <p className="text-steel-100">{profileData.phone || 'Не указан'}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-steel-400 text-sm">Telegram</Label>
                      {isEditing ? (
                        <Input
                          value={profileData.telegram_username || ''}
                          onChange={(e) => handleInputChange('telegram_username', e.target.value)}
                          className="bg-steel-700 border-steel-600 text-steel-100"
                          placeholder="Введите ник в Telegram"
                        />
                      ) : (
                        <p className="text-steel-100">
                          {profileData.telegram_username 
                            ? `@${profileData.telegram_username}` 
                            : 'Не подключен'}
                        </p>
                      )}
                    </div>
                  </div>

                   <div className="space-y-2">
                     <Label className="text-steel-400 text-sm">Тип профиля</Label>
                     <div className="flex items-center gap-2">
                       {userType === 'executor' ? (
                         <Badge className="bg-primary/20 text-primary border-primary/30">
                           Исполнитель
                         </Badge>
                       ) : userType === 'client' ? (
                         <Badge className="bg-electric-500/20 text-electric-400 border-electric-500/30">
                           Заказчик
                         </Badge>
                       ) : (
                         <span className="text-steel-400 text-sm">Не выбрано</span>
                       )}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <Label className="text-steel-400 text-sm">Роль</Label>
                     <p className="text-steel-100">
                       {userSubtype ? (
                         userSubtype === 'loader' ? 'Грузчик' :
                         userSubtype === 'cleaner' ? 'Уборщик' :
                         userSubtype === 'handyman' ? 'Разнорабочий' :
                         userSubtype === 'builder' ? 'Строитель' :
                         userSubtype === 'logistician' ? 'Логист' :
                         userSubtype === 'client' ? 'Заказчик' :
                         userSubtype === 'foreman' ? 'Прораб' :
                         userSubtype === 'manager' ? 'Менеджер' :
                         userSubtype
                       ) : 'Не выбрана'}
                     </p>
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
            <div className="space-y-4 xs:space-y-6">
              {/* Промокод */}
              <PromoCodeSection />

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
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {user?.id && <UserRatingDisplay userId={user.id} showDetails={false} />}
                      <RatingInfoDialog currentRating={profileData.rating} />
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

          {/* Раздел отзывов */}
          {showReviews && user?.id && (
            <div className="mt-8">
              <UserReviews userId={user.id} canLeaveReview={false} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;