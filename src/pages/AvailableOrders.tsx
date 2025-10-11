import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Loader2, 
  Clock, 
  MapPin, 
  Users, 
  Coins,
  MessageSquare,
  Calendar,
  Plus,
  Search,
  X,
  HelpCircle,
  Star,
  Award,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Resume {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  hourly_rate: number;
  experience_years: number;
  skills: string[];
  location: string | null;
  contact_info: string;
  status: string;
  user_id: string;
  created_at: string;
  categories?: {
    name: string;
  };
}

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telegram_photo_url: string | null;
  role: string;
  rating: number;
}

interface Category {
  id: string;
  name: string;
}

const AvailableOrders = () => {
  const { user, userRole, signOut } = useAuthContext();
  const { toast } = useToast();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterResumes();
  }, [resumes, searchQuery, selectedCategory]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch active resumes with category info
      const { data: resumesData, error } = await supabase
        .from('resumes')
        .select(`
          *,
          categories!inner (
            name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResumes(resumesData || []);

      // Fetch user profiles
      if (resumesData && resumesData.length > 0) {
        const userIds = Array.from(new Set(resumesData.map(resume => resume.user_id)));

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, avatar_url, telegram_photo_url, role, rating')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить резюме",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterResumes = () => {
    let filtered = [...resumes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resume =>
        resume.title.toLowerCase().includes(query) ||
        (resume.description && resume.description.toLowerCase().includes(query)) ||
        (resume.location && resume.location.toLowerCase().includes(query)) ||
        resume.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resume => resume.category_id === selectedCategory);
    }

    setFilteredResumes(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all';

  if (!user) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <Briefcase className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Требуется авторизация</h2>
            <p className="text-steel-300">Для просмотра вакансий необходимо войти в систему</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-2 sm:p-4">
        <div className="max-w-7xl mx-auto space-y-2 sm:space-y-4">
          {/* Header - Очень компактный для мобильных */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 text-steel-900" />
              </div>
              <div>
                <h1 className="text-base sm:text-3xl font-bold text-glow bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent leading-tight">
                  Поиск исполнителей
                </h1>
                <p className="text-[10px] sm:text-sm text-steel-400">Резюме специалистов и исполнителей</p>
              </div>
            </div>
            
            <Link to="/create-ad">
              <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-500/80 hover:to-blue-600/80 shadow-lg text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-auto">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Разместить
              </Button>
            </Link>
          </div>

          {/* Information Banner - Минималистичный для мобильных */}
          <Card className="card-steel border-primary/20">
            <div className="p-2.5 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-lg font-semibold text-steel-100 mb-1">Резюме исполнителей</h3>
                  <p className="text-steel-300 text-[10px] sm:text-sm leading-tight mb-1.5 sm:mb-3">
                    Здесь исполнители размещают свои резюме и предлагают свои услуги. Найдите подходящего специалиста для вашей задачи.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
                    <div className="flex items-center space-x-1.5 text-steel-400">
                      <Award className="w-3 h-3 text-yellow-400" />
                      <span>Проверенные специалисты с опытом работы</span>
                    </div>
                    <Link to="/ads" className="text-primary hover:text-primary/80 font-medium">
                      Нужен исполнитель? Разместить заказ →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Filters - Минималистичные для мобильных */}
          <Card className="card-steel p-2 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                  {/* Search */}
                  <div className="relative sm:col-span-2">
                    <Search className="absolute left-2.5 top-2 sm:top-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-steel-400" />
                    <Input
                      placeholder="Найти исполнителя по навыкам..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="shrink-0 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Сбросить
                    <Badge className="ml-1 sm:ml-2 bg-primary/20 text-primary border-primary/20 text-[10px] sm:text-xs">
                      {[searchQuery.trim() !== '', selectedCategory !== 'all'].filter(Boolean).length}
                    </Badge>
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Resumes List - Минималистичный для мобильных */}
          {isLoading ? (
            <Card className="card-steel p-6 sm:p-8 text-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin mx-auto mb-3 sm:mb-4" />
              <p className="text-steel-300 text-xs sm:text-base">Загрузка резюме...</p>
            </Card>
          ) : filteredResumes.length === 0 ? (
            <Card className="card-steel p-4 sm:p-8 text-center space-y-2 sm:space-y-4">
              <HelpCircle className="w-12 h-12 sm:w-16 sm:h-16 text-steel-500 mx-auto" />
              <h3 className="text-sm sm:text-xl font-bold text-steel-300">Резюме не найдены</h3>
              <p className="text-steel-400 text-xs sm:text-base leading-tight">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Пока что специалисты не разместили свои резюме'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-3 sm:mt-6">
                <Link to="/create-ad" className="w-full sm:w-auto">
                  <Button className="w-full bg-primary hover:bg-primary/80 text-xs sm:text-sm h-9 sm:h-10">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Смотреть заказы
                  </Button>
                </Link>
                <Link to="/orders" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Мои заказы
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-2 xs:space-y-3 sm:space-y-4">
              {filteredResumes.map((resume) => {
                const profile = profiles[resume.user_id];
                return (
                  <Card key={resume.id} className="card-steel p-3 xs:p-4 sm:p-6">
                    <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                      {/* Header - Компактный для мобильных */}
                      <div className="flex flex-col xs:flex-row items-start justify-between gap-2 xs:gap-3">
                        <div className="space-y-1 xs:space-y-1.5 sm:space-y-2 flex-1 w-full">
                          <div className="flex items-center space-x-1.5 xs:space-x-2">
                            <Award className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                            <h3 className="text-sm xs:text-base sm:text-xl font-bold text-steel-100 leading-tight">{resume.title}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 xs:gap-x-3 gap-y-1 text-[10px] xs:text-xs sm:text-sm text-steel-400">
                            <span>{resume.categories?.name || 'Без категории'}</span>
                            {resume.experience_years > 0 && (
                              <>
                                <span className="hidden xs:inline">•</span>
                                <span>Опыт: {resume.experience_years} лет</span>
                              </>
                            )}
                            {resume.location && (
                              <>
                                <span className="hidden xs:inline">•</span>
                                <div className="flex items-center space-x-0.5 xs:space-x-1">
                                  <MapPin className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                                  <span>{resume.location}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-left xs:text-right space-y-1 xs:space-y-1.5 sm:space-y-2 w-full xs:w-auto">
                          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-primary">
                            {resume.hourly_rate.toLocaleString('ru-RU')} ₽/час
                          </div>
                          <Badge className="text-green-400 bg-green-400/10 border-green-400/20 text-[10px] xs:text-xs">
                            Активное резюме
                          </Badge>
                        </div>
                      </div>

                      {/* Skills - Компактные для мобильных */}
                      {resume.skills && resume.skills.length > 0 && (
                        <div>
                          <div className="flex flex-wrap gap-1 xs:gap-1.5 sm:gap-2">
                            {resume.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-steel-300 border-steel-500 text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5">
                                {skill}
                              </Badge>
                            ))}
                            {resume.skills.length > 5 && (
                              <Badge variant="outline" className="text-steel-400 border-steel-600 text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5">
                                +{resume.skills.length - 5} еще
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Description - Компактный для мобильных */}
                      {resume.description && (
                        <p className="text-steel-200 line-clamp-2 xs:line-clamp-3 text-xs xs:text-sm leading-tight">{resume.description}</p>
                      )}

                      {/* Profile Info - Компактный для мобильных */}
                      <div className="flex items-center justify-between pt-2 xs:pt-3 sm:pt-4 border-t border-steel-600">
                        <div className="flex items-center space-x-2 xs:space-x-2.5 sm:space-x-3">
                          <Avatar className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12">
                            <AvatarImage src={profile?.avatar_url || profile?.telegram_photo_url} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600 text-xs xs:text-sm">
                              {(profile?.display_name || profile?.full_name || 'И').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs xs:text-sm sm:text-base font-medium text-steel-100 leading-tight">
                              {profile?.display_name || profile?.full_name || 'Исполнитель'}
                            </p>
                            <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2">
                              <div className="flex items-center space-x-0.5 xs:space-x-1">
                                {Array.from({ length: 5 }, (_, index) => (
                                  <Star
                                    key={index}
                                    className={`w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 ${
                                      index < Math.floor(profile?.rating || 0) ? 'text-yellow-400 fill-current' : 'text-steel-500'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] xs:text-xs text-steel-500 hidden xs:inline">•</span>
                              <p className="text-[10px] xs:text-xs text-steel-400 hidden xs:block">
                                {format(new Date(resume.created_at), 'dd.MM.yyyy', { locale: ru })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Написать
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-primary hover:bg-primary/80"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AvailableOrders;