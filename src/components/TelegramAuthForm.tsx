import React, { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, User } from 'lucide-react';

interface TelegramAuthFormProps {
  onSuccess: () => void;
}

export const TelegramAuthForm: React.FC<TelegramAuthFormProps> = ({ onSuccess }) => {
  const { user, isInTelegram, initData, hapticFeedback } = useTelegram();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated via Telegram
    if (user && initData) {
      handleTelegramAuth();
    }
  }, [user, initData]);

  const handleTelegramAuth = async () => {
    if (!user || !initData) {
      toast({
        title: "Ошибка аутентификации",
        description: "Не удалось получить данные Telegram",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    hapticFeedback?.impactOccurred('light');

    try {
      // Create or get user profile based on Telegram ID
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!existingProfile) {
        // Create new profile for Telegram user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            telegram_id: user.id,
            phone: '', // Will be updated if user provides
            display_name: `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
            telegram_username: user.username,
            telegram_photo_url: user.photo_url,
            is_premium: user.is_premium || false,
            role: 'user',
            rating: 0.00,
            balance: 0
          });

        if (insertError) {
          throw insertError;
        }
      }

      setIsAuthenticated(true);
      hapticFeedback?.notificationOccurred('success');
      
      toast({
        title: "Добро пожаловать!",
        description: `Привет, ${user.first_name}! Вы успешно вошли через Telegram`,
      });

      onSuccess();
    } catch (error) {
      console.error('Telegram auth error:', error);
      hapticFeedback?.notificationOccurred('error');
      
      toast({
        title: "Ошибка входа",
        description: "Не удалось войти через Telegram. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInTelegram) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <User className="h-6 w-6 text-primary" />
            GruzzTop
          </CardTitle>
          <CardDescription>
            Это приложение предназначено для использования в Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Откройте приложение через Telegram бота @GruzzTopBot
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Вход через Telegram...</p>
        </CardContent>
      </Card>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Добро пожаловать!</CardTitle>
          <CardDescription>Вы успешно вошли в GruzzTop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.photo_url} alt={user.first_name} />
              <AvatarFallback>
                {user.first_name[0]}{user.last_name?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium">
                {user.first_name} {user.last_name}
              </h3>
              {user.username && (
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              )}
              {user.is_premium && (
                <Badge variant="secondary" className="mt-1">
                  <Star className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={onSuccess} className="w-full">
            Продолжить
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Вход в GruzzTop</CardTitle>
        <CardDescription>
          {user ? `Привет, ${user.first_name}!` : 'Подключение к Telegram...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photo_url} alt={user.first_name} />
                <AvatarFallback>
                  {user.first_name[0]}{user.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">
                  {user.first_name} {user.last_name}
                </h4>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>
              {user.is_premium && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <Button onClick={handleTelegramAuth} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Авторизация...
                </>
              ) : (
                'Войти через Telegram'
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">
              Получение данных пользователя...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};