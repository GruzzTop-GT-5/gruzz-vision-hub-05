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
            <h1 className="text-3xl font-bold text-glow">Поиск исполнителей</h1>
            <Link to="/create-ad">
              <Button className="bg-primary hover:bg-primary/80">
                <Plus className="w-4 h-4 mr-2" />
                Создать резюме
              </Button>
            </Link>
          </div>

          {/* Simple Information Banner */}
          <Card className="card-steel border-primary/20">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <User className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-steel-100">Резюме исполнителей</h3>
              </div>
              <p className="text-steel-300 text-base mb-4">
                Здесь исполнители размещают свои резюме и предлагают услуги
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <div className="flex items-center space-x-2 text-steel-400">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span>Пример: "Опытный грузчик, работаю по выходным"</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-steel-500 rounded-full"></div>
                <Link to="/available-orders" className="text-primary hover:text-primary/80 font-medium">
                  Ищете конкретную работу? Найти работу →
                </Link>
              </div>
            </div>
          </Card>

          {/* Simple Filters */}
          <Card className="card-steel p-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-steel-400" />
                <Input
                  placeholder="Найти исполнителя по навыкам или опыту..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Все специальности" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'Все категории' ? 'Все специальности' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Results Count */}
            {filteredAds.length > 0 && (
              <div className="mt-3 text-center">
                <span className="text-steel-400 text-sm">
                  Найдено {filteredAds.length} исполнителей
                </span>
              </div>
            )}
          </Card>

          {/* Ads Grid */}
          {filteredAds.length === 0 ? (
            <Card className="card-steel p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-steel-600/20 rounded-full flex items-center justify-center mx-auto">
                  <HelpCircle className="w-8 h-8 text-steel-400" />
                </div>
                <h3 className="text-xl font-semibold text-steel-100">Исполнители не найдены</h3>
                <p className="text-steel-300 max-w-md mx-auto">
                  {searchQuery || selectedCategory !== 'Все категории'
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Пока что исполнители не разместили свои резюме'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Link to="/create-ad">
                    <Button className="bg-primary hover:bg-primary/80">
                      <Plus className="w-4 h-4 mr-2" />
                      Создать резюме
                    </Button>
                  </Link>
                  <Link to="/orders">
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Найти работу
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <Card key={ad.id} className="card-steel hover:border-primary/40 transition-colors duration-200 h-full">
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
                        className="min-w-[100px]"
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