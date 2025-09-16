import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Plus, Calendar, MapPin, DollarSign, User, Info, HelpCircle, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { AdDetailsModal } from '@/components/AdDetailsModal';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  created_at: string;
  user_id: string;
  status: string;
}

const categories = [
  'Все категории',
  'Грузчики',
  'Разнорабочие',
  'Квартирный переезд',
  'Офисный переезд',
  'Погрузка/разгрузка',
  'Сборка мебели',
  'Уборка помещений',
  'Строительные работы',
  'Ремонтные работы',
  'Демонтаж',
  'Подсобные работы',
  'Складские работы',
  'Курьерские услуги',
  'Садовые работы',
  'Другое'
];

const sortOptions = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'price_asc', label: 'По цене: сначала дешевые' },
  { value: 'price_desc', label: 'По цене: сначала дорогие' }
];

export default function Ads() {
  const { user, userRole, loading, signOut } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    filterAndSortAds();
  }, [ads, searchQuery, selectedCategory, sortBy]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortAds = () => {
    let filtered = [...ads];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad =>
        ad.title.toLowerCase().includes(query) ||
        ad.description.toLowerCase().includes(query) ||
        ad.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(ad => ad.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredAds(filtered);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-steel-600/10 text-steel-400 border-steel-600/20';
    }
  };

  if (loading || isLoading) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-steel-300">Загрузка объявлений...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton onClick={() => window.history.back()} />
            <h1 className="text-3xl font-bold text-glow">Доска объявлений</h1>
            <Link to="/create-ad">
              <Button className="bg-primary hover:bg-primary/80">
                <Plus className="w-4 h-4 mr-2" />
                Разместить
              </Button>
            </Link>
          </div>

          {/* Information Banner */}
          <Card className="card-steel border-primary/20">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-steel-100 mb-2">Что такое доска объявлений?</h3>
                    <Link to="/orders" className="text-primary hover:text-primary/80 text-sm font-medium">
                      Перейти к заказам →
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-steel-300">
                    <div className="space-y-2">
                      <p className="flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        <span><strong>Объявления</strong> - это долгосрочные предложения услуг</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>Рабочие размещают: "Грузчик, работаю по выходным"</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span><strong>Заказы</strong> - это конкретные задания с дедлайном</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span>Заказчики создают: "Нужен переезд 20 января"</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Navigation */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="card-steel p-4 hover:border-primary/40 transition-colors">
              <Link to="/orders" className="block">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-steel-100">Заказы</h3>
                    <p className="text-sm text-steel-400">Разовые задания на работу</p>
                  </div>
                  <div className="text-primary">→</div>
                </div>
              </Link>
            </Card>
            
            <Card className="card-steel p-4 border-primary/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-steel-100">Объявления</h3>
                  <p className="text-sm text-steel-400">Резюме рабочих</p>
                </div>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="card-steel p-6">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-steel-400" />
                <Input
                  placeholder="Поиск объявлений..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="flex items-center justify-center">
                <span className="text-steel-300 text-sm">
                  Найдено: {filteredAds.length} объявлений
                </span>
              </div>
            </div>
          </Card>

          {/* Ads Grid */}
          {filteredAds.length === 0 ? (
            <Card className="card-steel p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-steel-600/20 rounded-full flex items-center justify-center mx-auto">
                  <HelpCircle className="w-8 h-8 text-steel-400" />
                </div>
                <h3 className="text-xl font-semibold text-steel-100">Объявлений не найдено</h3>
                <p className="text-steel-300 max-w-md mx-auto">
                  {searchQuery || selectedCategory !== 'Все категории'
                    ? 'Попробуйте изменить параметры поиска или стать первым в этой категории'
                    : 'Станьте первым, кто разместит объявление на платформе!'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Link to="/create-ad">
                    <Button className="bg-primary hover:bg-primary/80">
                      <Plus className="w-4 h-4 mr-2" />
                      Разместить объявление
                    </Button>
                  </Link>
                  <Link to="/orders">
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Перейти к заказам
                    </Button>
                  </Link>
                </div>
                <div className="mt-6 p-4 bg-steel-800/30 rounded-lg text-left">
                  <h4 className="font-semibold text-steel-100 mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                    Подсказка
                  </h4>
                  <p className="text-sm text-steel-300">
                    <strong>Объявления</strong> подходят для постоянных услуг: "Грузчик на выходные", "Бригада разнорабочих". 
                    <strong> Заказы</strong> - для разовых задач: "Переезд 20 января", "Разгрузка фуры завтра".
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <Card key={ad.id} className="card-steel hover:border-primary/40 transition-all duration-200">
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <Badge className={getStatusColor(ad.status)}>
                        {ad.status === 'active' ? 'Активно' : ad.status}
                      </Badge>
                      <span className="text-xs text-steel-400">
                        {format(new Date(ad.created_at), 'dd MMM yyyy', { locale: ru })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-steel-100 line-clamp-2">
                      {ad.title}
                    </h3>

                    {/* Category */}
                    <Badge variant="outline" className="w-fit">
                      {ad.category}
                    </Badge>

                    {/* Description */}
                    <p className="text-steel-300 text-sm line-clamp-3 leading-relaxed">
                      {ad.description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(ad.price)} GT
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-steel-600">
                      <Link 
                        to={`/profile/${ad.user_id}`}
                        className="flex items-center space-x-1 text-xs text-steel-400 hover:text-primary transition-colors"
                      >
                        <User className="w-3 h-3" />
                        <span>ID: {ad.user_id.slice(0, 8)}...</span>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedAd(ad);
                          setIsModalOpen(true);
                        }}
                      >
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Ad Details Modal */}
          <AdDetailsModal
            ad={selectedAd}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedAd(null);
            }}
          />
        </div>
      </div>
    </Layout>
  );
}