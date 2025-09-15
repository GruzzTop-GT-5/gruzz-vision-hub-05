import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { User, Phone, MessageSquare, FileText, Users, Flag } from 'lucide-react';

const qualifications = [
  'Грузчик',
  'Экспедитор', 
  'Водитель',
  'Мувер',
  'Упаковщик',
  'Разнорабочий',
  'Бригадир',
  'Другое'
];

const countries = [
  'Россия',
  'Беларусь',
  'Казахстан',
  'Кыргызстан',
  'Таджикистан',
  'Узбекистан',
  'Армения',
  'Азербайджан',
  'Молдова',
  'Другое'
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: '',
    telegram_username: '',
    phone: '',
    full_name: '',
    age: '',
    citizenship: '',
    qualification: '',
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
        .select('display_name, telegram_username, phone, full_name, age, citizenship, qualification, bio')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          telegram_username: data.telegram_username || '',
          phone: data.phone || '',
          full_name: data.full_name || '',
          age: data.age?.toString() || '',
          citizenship: data.citizenship || '',
          qualification: data.qualification || '',
          bio: data.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (profile.age && (parseInt(profile.age) < 16 || parseInt(profile.age) > 100)) {
        toast({
          title: "Ошибка",
          description: "Возраст должен быть от 16 до 100 лет",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          telegram_username: profile.telegram_username,
          full_name: profile.full_name,
          age: profile.age ? parseInt(profile.age) : null,
          citizenship: profile.citizenship,
          qualification: profile.qualification,
          bio: profile.bio
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены"
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AnimatedBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <BackButton onClick={() => navigate('/profile')} />
        
        <Card className="card-steel p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-electric-600 rounded-2xl flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-steel-900" />
            </div>
            <h1 className="text-2xl font-bold text-glow">Редактировать профиль</h1>
            <p className="text-steel-400">Обновите информацию о себе для лучшего отклика</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-steel-200 border-b border-steel-600 pb-2">
                Основная информация
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-steel-200">
                  Номер телефона
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    disabled
                    className="pl-10 input-steel opacity-60 cursor-not-allowed"
                    placeholder="Телефон нельзя изменить"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-steel-200">
                  Отображаемое имя
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
                  <Input
                    id="display_name"
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    className="pl-10 input-steel"
                    placeholder="Как вас называть"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-steel-200">
                  ФИО <span className="text-electric-400">*</span>
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
                  <Input
                    id="full_name"
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="pl-10 input-steel"
                    placeholder="Фамилия Имя Отчество"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-steel-200">
                    Возраст
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="16"
                    max="100"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className="input-steel"
                    placeholder="Лет"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citizenship" className="text-steel-200">
                    Гражданство
                  </Label>
                  <div className="relative">
                    <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5 z-10" />
                    <Select value={profile.citizenship} onValueChange={(value) => setProfile({ ...profile, citizenship: value })}>
                      <SelectTrigger className="pl-10 input-steel">
                        <SelectValue placeholder="Выберите страну" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Профессиональная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-steel-200 border-b border-steel-600 pb-2">
                Профессиональная информация
              </h3>

              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-steel-200">
                  Квалификация <span className="text-electric-400">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5 z-10" />
                  <Select value={profile.qualification} onValueChange={(value) => setProfile({ ...profile, qualification: value })}>
                    <SelectTrigger className="pl-10 input-steel">
                      <SelectValue placeholder="Выберите специализацию" />
                    </SelectTrigger>
                    <SelectContent>
                      {qualifications.map((qual) => (
                        <SelectItem key={qual} value={qual}>
                          {qual}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-steel-200">
                  О себе
                </Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="input-steel min-h-[100px] resize-none"
                  placeholder="Расскажите о своем опыте, навыках и преимуществах..."
                  maxLength={500}
                />
                <p className="text-xs text-steel-400">
                  {profile.bio.length}/500 символов
                </p>
              </div>
            </div>

            {/* Контакты */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-steel-200 border-b border-steel-600 pb-2">
                Контакты
              </h3>

              <div className="space-y-2">
                <Label htmlFor="telegram_username" className="text-steel-200">
                  Telegram username
                </Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel-400 w-5 h-5" />
                  <Input
                    id="telegram_username"
                    type="text"
                    value={profile.telegram_username}
                    onChange={(e) => setProfile({ ...profile, telegram_username: e.target.value })}
                    className="pl-10 input-steel"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-3d bg-gradient-to-r from-primary to-electric-600 text-steel-900"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </form>
        </Card>
      </div>
    </AnimatedBackground>
  );
};

export default EditProfile;