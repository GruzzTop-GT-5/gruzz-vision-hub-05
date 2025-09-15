import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { User, Save, Loader2, Phone, IdCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  display_name: string | null;
  phone: string | null;
  telegram_username: string | null;
  bio?: string | null;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    display_name: '',
    phone: '',
    telegram_username: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, phone, telegram_username')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные профиля",
          variant: "destructive",
        });
        return;
      }

      setFormData({
        display_name: data.display_name || '',
        phone: data.phone || '',
        telegram_username: data.telegram_username || '',
        bio: ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке профиля",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);

    try {
      const updateData: any = {
        display_name: formData.display_name?.trim() || null,
        telegram_username: formData.telegram_username?.trim() || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Успешно",
        description: "Профиль обновлен",
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Загрузка профиля...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton onClick={() => navigate('/profile')} />
            <h1 className="text-3xl font-bold">Редактировать профиль</h1>
            <div></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Информация профиля
              </CardTitle>
              <CardDescription>
                Обновите информацию о вашем профиле
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Отображаемое имя</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Введите ваше имя"
                    value={formData.display_name || ''}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Это имя будет отображаться в объявлениях и отзывах
                  </p>
                </div>

                {/* Phone (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="text"
                      value={formData.phone || ''}
                      readOnly
                      className="pl-10 bg-muted/50"
                      placeholder="Номер не указан"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Номер телефона нельзя изменить
                  </p>
                </div>

                {/* Telegram Username */}
                <div className="space-y-2">
                  <Label htmlFor="telegramUsername">Telegram @никнейм</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telegramUsername"
                      type="text"
                      placeholder="@username"
                      value={formData.telegram_username || ''}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('@')) {
                          value = '@' + value;
                        }
                        handleInputChange('telegram_username', value);
                      }}
                      className="pl-10"
                      maxLength={33}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ваш никнейм в Telegram для связи
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Сохранить изменения
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    disabled={isSaving}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* User ID Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Информация аккаунта</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">ID пользователя:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {user?.id?.slice(0, 8)}...
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}