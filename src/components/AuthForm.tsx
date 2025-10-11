import { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, User, Globe, Calendar, MessageCircle, Briefcase, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectSpecializations } from '@/components/MultiSelectSpecializations';
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

const countriesList = [
  'Россия',
  'Украина',
  'Беларусь',
  'Казахстан',
  'Узбекистан',
  'Кыргызстан',
  'Таджикистан',
  'Туркменистан',
  'Азербайджан',
  'Армения',
  'Грузия',
  'Молдова',
  'Латвия',
  'Литва',
  'Эстония',
  'Польша',
  'Германия',
  'Франция',
  'Италия',
  'Испания',
  'США',
  'Великобритания',
  'Канада',
  'Австралия',
  'Китай',
  'Индия',
  'Турция',
  'Израиль',
  'Другое'
];

// Специализации для исполнителей (рабочие)
const executorSpecializations = [
  'Грузчик',
  'Разнорабочий',
  'Сборка мебели',
  'Уборка помещений',
  'Строительные работы',
  'Ремонтные работы',
  'Демонтаж',
  'Подсобные работы',
  'Складские работы',
  'Курьерские услуги',
  'Садовые работы',
  'Водитель',
  'Другое'
];

// Специализации для заказчиков (организаторы)
const clientSpecializations = [
  'Логист',
  'Менеджер',
  'Прораб',
  'Снабженец',
  'Управляющий недвижимостью',
  'Представитель компании',
  'Частное лицо',
  'Директор',
  'Предприниматель',
  'Другое'
];

export const AuthForm = ({ onSuccess, onBack }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(() => {
    const savedPhone = localStorage.getItem('rememberedPhone');
    const savedPassword = localStorage.getItem('rememberedPassword');
    return {
      phone: savedPhone || '',
      password: savedPassword || '',
      confirmPassword: '',
      // Новые поля для регистрации
      firstName: '',
      lastName: '',
      citizenship: '',
      customCitizenship: '',
      age: '',
      telegram: '',
      userType: '', // 'client' или 'executor'
      specializations: [] as string[], // Массив специализаций
      bio: ''
    };
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberedPhone') !== null;
  });
  
  const { toast } = useToast();
  const { isInTelegram } = useTelegram();
  const [showTermsAcceptance, setShowTermsAcceptance] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<any>(null);

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
      const email = `${pendingSignup.cleanPhone}@gruzztop.local`;
      
      const { data: signUpData, error } = await supabase.auth.signUp({
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
          description: error.message || "Проверьте правильность данных",
          variant: "destructive"
        });
        return;
      }

      if (signUpData.user) {
        // Определяем финальное гражданство
        const finalCitizenship = formData.citizenship === 'Другое' 
          ? formData.customCitizenship 
          : formData.citizenship;
        
        // Обновляем профиль с дополнительными данными
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: `${formData.firstName} ${formData.lastName}`,
            display_name: `${formData.firstName} ${formData.lastName}`,
            citizenship: finalCitizenship,
            age: parseInt(formData.age),
            telegram_username: formData.telegram || null,
            bio: formData.bio || null,
            user_type: formData.userType as 'client' | 'executor',
            qualification: formData.specializations.length > 0 ? formData.specializations : null
          })
          .eq('id', signUpData.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }

      toast({
        title: "Регистрация успешна",
        description: "Добро пожаловать на платформу!"
      });

      setShowTermsAcceptance(false);
      setPendingSignup(null);
      onSuccess(); // Сразу перенаправляем на главную
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
        variant: "destructive"
      });
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 11);
    
    let formatted = limited;
    if (formatted.startsWith('8')) {
      formatted = '7' + formatted.slice(1);
    } else if (formatted.length > 0 && !formatted.startsWith('7')) {
      formatted = '7' + formatted;
    }
    
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
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Ошибка", 
          description: "Пароль должен содержать минимум 6 символов",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!isLogin) {
        // Валидация полей регистрации
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          toast({
            title: "Ошибка",
            description: "Укажите имя и фамилию",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (!formData.citizenship.trim()) {
          toast({
            title: "Ошибка",
            description: "Выберите гражданство",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (formData.citizenship === 'Другое' && !formData.customCitizenship.trim()) {
          toast({
            title: "Ошибка",
            description: "Укажите ваше гражданство",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const age = parseInt(formData.age);
        if (!age || age < 18 || age > 100) {
          toast({
            title: "Ошибка",
            description: "Возраст должен быть от 18 до 100 лет",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (!formData.userType) {
          toast({
            title: "Ошибка",
            description: "Выберите тип пользователя",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (!formData.specializations || formData.specializations.length === 0) {
          toast({
            title: "Ошибка",
            description: "Выберите хотя бы одну специализацию",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Ошибка", 
            description: "Пароли не совпадают",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      if (isLogin) {
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
          setIsLoading(false);
          return;
        }

        if (rememberMe) {
          localStorage.setItem('rememberedPhone', formData.phone);
          localStorage.setItem('rememberedPassword', formData.password);
        } else {
          localStorage.removeItem('rememberedPhone');
          localStorage.removeItem('rememberedPassword');
        }

        toast({
          title: "Успешный вход",
          description: "Добро пожаловать в GruzzTop!"
        });
        
        onSuccess();
      } else {
        setPendingSignup({
          cleanPhone,
          password: formData.password
        });
        setShowTermsAcceptance(true);
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
    <AnimatedBackground className="min-h-screen flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        {onBack && <BackButton onClick={onBack} />}
        <Card className="card-steel p-4 sm:p-8 space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-electric-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-steel-900" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-glow">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h1>
          <p className="text-xs sm:text-sm text-steel-400">
            {isLogin ? 'Войдите в ваш аккаунт' : 'Создайте новый аккаунт для работы'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Поля регистрации */}
          {!isLogin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Имя */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-steel-200">
                  Имя <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Иван"
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Фамилия */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-steel-200">
                  Фамилия <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Иванов"
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Гражданство */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-steel-200">
                  Гражданство <span className="text-red-400">*</span>
                </label>
                <Select value={formData.citizenship} onValueChange={(value) => setFormData({ ...formData, citizenship: value })}>
                  <SelectTrigger className="input-steel h-9 sm:h-11 text-xs sm:text-base bg-steel-800/80 border-steel-600 z-50">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-steel-400 mr-2" />
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent className="bg-steel-800 border-steel-600 z-50 max-h-60">
                    {countriesList.map((country) => (
                      <SelectItem key={country} value={country} className="text-steel-100 hover:bg-steel-700 focus:bg-steel-700">
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Свое гражданство если выбрано "Другое" */}
              {formData.citizenship === 'Другое' && (
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-steel-200">
                    Укажите ваше гражданство <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      value={formData.customCitizenship}
                      onChange={(e) => setFormData({ ...formData, customCitizenship: e.target.value })}
                      placeholder="Ваша страна"
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Возраст */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-steel-200">
                  Возраст <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="18"
                    min="18"
                    max="100"
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Telegram */}
              <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-steel-200">
                  Telegram (необязательно)
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    placeholder="@username"
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                  />
                </div>
              </div>

              {/* Тип пользователя */}
              <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-steel-200">
                  Тип пользователя <span className="text-red-400">*</span>
                </label>
                <Select 
                  value={formData.userType} 
                  onValueChange={(value) => {
                    // При смене типа пользователя сбрасываем специализации
                    setFormData({ ...formData, userType: value, specializations: [] });
                  }}
                >
                  <SelectTrigger className="input-steel h-9 sm:h-11 text-xs sm:text-base bg-steel-800/80 border-steel-600 z-50">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent className="bg-steel-800 border-steel-600 z-50">
                    <SelectItem value="client" className="text-steel-100 hover:bg-steel-700 focus:bg-steel-700">Заказчик</SelectItem>
                    <SelectItem value="executor" className="text-steel-100 hover:bg-steel-700 focus:bg-steel-700">Исполнитель</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] sm:text-xs text-steel-500">
                  Заказчик - создает заказы, Исполнитель - выполняет работу
                </p>
              </div>

              {/* Специализации - показываем только после выбора типа пользователя */}
              {formData.userType && (
                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                  <label className="text-xs sm:text-sm font-medium text-steel-200">
                    Специализации <span className="text-red-400">*</span>
                  </label>
                  <p className="text-[10px] sm:text-xs text-steel-500 mb-1">
                    Выберите до 3 специализаций {formData.userType === 'executor' ? 'которые вы выполняете' : 'которые вас интересуют'}
                  </p>
                  <MultiSelectSpecializations
                    value={formData.specializations}
                    onChange={(value) => setFormData({ ...formData, specializations: value })}
                    options={formData.userType === 'executor' ? executorSpecializations : clientSpecializations}
                    maxSelections={3}
                  />
                </div>
              )}

              {/* О себе */}
              <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-steel-200">
                  О себе (необязательно)
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Расскажите о себе, опыте работы и навыках..."
                  className="input-steel min-h-20 text-xs sm:text-base"
                  maxLength={500}
                />
                <p className="text-[10px] sm:text-xs text-steel-500">{formData.bio.length}/500</p>
              </div>
            </div>
          )}

          {/* Номер телефона */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium text-steel-200">
              Номер телефона
            </label>
            <div className="relative">
              <Phone className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="+7 XXX-XXX-XX-XX"
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                required
              />
            </div>
          </div>

          {/* Пароль */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium text-steel-200">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 6 символов"
                className="w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-steel-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* Подтверждение пароля */}
          {!isLogin && (
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-steel-200">
                Повторите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Повторите пароль"
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 input-steel rounded-lg text-xs sm:text-base"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Запомнить меня */}
          {isLogin && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRememberMe(checked);
                  
                  if (!checked) {
                    localStorage.removeItem('rememberedPhone');
                    localStorage.removeItem('rememberedPassword');
                    setFormData({
                      ...formData,
                      phone: '',
                      password: '',
                      confirmPassword: ''
                    });
                  } else {
                    const savedPhone = localStorage.getItem('rememberedPhone');
                    const savedPassword = localStorage.getItem('rememberedPassword');
                    if (savedPhone || savedPassword) {
                      setFormData({
                        ...formData,
                        phone: savedPhone || '',
                        password: savedPassword || ''
                      });
                    }
                  }
                }}
                className="h-4 w-4 rounded border border-steel-600 bg-steel-800 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-steel-900"
              />
              <label
                htmlFor="remember-me"
                className="text-xs sm:text-sm text-steel-200 cursor-pointer"
              >
                Запомнить меня
              </label>
            </div>
          )}

          {/* Кнопка отправки */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full btn-3d py-2.5 sm:py-3 text-sm sm:text-lg font-bold bg-gradient-to-r from-primary to-electric-600 text-steel-900"
          >
            {isLoading ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-steel-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              isLogin ? 'Войти' : 'Зарегистрироваться'
            )}
          </Button>
        </form>

        {/* Переключение режима */}
        <div className="text-center pt-3 sm:pt-4 border-t border-steel-600">
          <p className="text-xs sm:text-sm text-steel-400 mb-2">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              if (!rememberMe) {
                setFormData({ 
                  ...formData, 
                  password: '', 
                  confirmPassword: '' 
                });
              }
            }}
            className="text-primary hover:text-electric-400 font-medium transition-colors text-xs sm:text-sm"
          >
            {isLogin ? 'Создать аккаунт' : 'Войти в систему'}
          </button>
        </div>
      </Card>
      </div>
      
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