import { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { TelegramAuthForm } from './TelegramAuthForm';
import { TermsAcceptance } from './TermsAcceptance';
import { useTelegram } from '@/hooks/useTelegram';

interface AuthFormProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export const AuthForm = ({ onSuccess, onBack }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const { toast } = useToast();
  const { isInTelegram } = useTelegram();
  const [showTermsAcceptance, setShowTermsAcceptance] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<any>(null);

  // If running in Telegram, use Telegram auth
  if (isInTelegram) {
    return (
      <AnimatedBackground className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {onBack && <BackButton onClick={onBack} />}
          <TelegramAuthForm onSuccess={onSuccess} />
        </div>
      </AnimatedBackground>
    );
  }
  
  const handleTermsAccept = async (agreements: Record<string, boolean>) => {
    if (!pendingSignup) return;
    
    try {
      // Генерируем email из номера телефона для внутренней аутентификации
      const email = `${pendingSignup.cleanPhone}@gruzztop.local`;
      
      const { error } = await supabase.auth.signUp({
        email: email,
        password: pendingSignup.password,
        options: {
          data: {
            phone: `+${pendingSignup.cleanPhone}`,
            terms_accepted: true,
            terms_version: "2.1.0",
            agreements: agreements
          }
        }
      });

      if (error) {
        toast({
          title: "Ошибка регистрации",
          description: "Проверьте правильность данных",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Регистрация успешна",
        description: "Добро пожаловать в GruzzTop!"
      });

      setShowTermsAcceptance(false);
      setPendingSignup(null);
      onSuccess();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
        variant: "destructive"
      });
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const getCleanPhone = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanPhone = getCleanPhone(formData.phone);
      
      if (cleanPhone.length !== 11) {
        toast({
          title: "Ошибка",
          description: "Введите корректный номер телефона",
          variant: "destructive"
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Ошибка", 
          description: "Пароль должен содержать минимум 6 символов",
          variant: "destructive"
        });
        return;
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        toast({
          title: "Ошибка", 
          description: "Пароли не совпадают",
          variant: "destructive"
        });
        return;
      }

      if (isLogin) {
        // Логин - генерируем email из телефона
        const email = `${cleanPhone}@gruzztop.local`;
        
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: formData.password
        });

        if (error) {
          toast({
            title: "Ошибка входа",
            description: "Неверный номер телефона или пароль",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Успешный вход",
          description: "Добро пожаловать в GruzzTop!"
        });
      } else {
        // Registration - show terms acceptance first
        setPendingSignup({
          cleanPhone,
          password: formData.password
        });
        setShowTermsAcceptance(true);
        return;
      }

      if (!showTermsAcceptance) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {onBack && <BackButton onClick={onBack} />}
        <Card className="card-steel p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-electric-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-steel-900" />
          </div>
          <h1 className="text-2xl font-bold text-glow">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h1>
          <p className="text-steel-400">
            {isLogin ? 'Войдите в ваш аккаунт' : 'Создайте новый аккаунт для работы'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel-200">
              Номер телефона
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="+7 XXX-XXX-XX-XX"
                className="w-full pl-10 pr-4 py-3 input-steel rounded-lg"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel-200">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 6 символов"
                className="w-full pl-10 pr-12 py-3 input-steel rounded-lg"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-steel-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input (only for registration) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-steel-200">
                Повторите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Повторите пароль"
                  className="w-full pl-10 pr-4 py-3 input-steel rounded-lg"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full btn-3d py-3 text-lg font-bold bg-gradient-to-r from-primary to-electric-600 text-steel-900"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-steel-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              isLogin ? 'Войти' : 'Зарегистрироваться'
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-4 border-t border-steel-600">
          <p className="text-steel-400 mb-2">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          </p>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-electric-400 font-medium transition-colors"
          >
            {isLogin ? 'Создать аккаунт' : 'Войти в систему'}
          </button>
        </div>
      </Card>
      </div>
      
      {/* Terms Acceptance Modal */}
      <TermsAcceptance
        isOpen={showTermsAcceptance}
        onAccept={handleTermsAccept}
        onCancel={() => {
          setShowTermsAcceptance(false);
          setPendingSignup(null);
        }}
      />
    </AnimatedBackground>
  );
};