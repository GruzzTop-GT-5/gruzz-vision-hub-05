import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Plus, Calendar, MapPin, DollarSign, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
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
  'Услуги',
  'Работа',
  'Образование',
  'Репетиторство',
  'IT и программирование',
  'Дизайн',
  'Маркетинг',
  'Строительство',
  'Ремонт',
  'Транспорт',
  'Доставка',
  'Домашние услуги',
  'Красота и здоровье',
  'Переводы',
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
            <Card className="card-steel p-12 text-center">
              <div className="space-y-4">
                <Search className="w-16 h-16 text-steel-500 mx-auto" />
                <h3 className="text-xl font-bold text-steel-300">Объявления не найдены</h3>
                <p className="text-steel-400">
                  {searchQuery || selectedCategory !== 'Все категории'
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Пока нет активных объявлений'}
                </p>
                {user && (
                  <Link to="/create-ad">
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Разместить первое объявление
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <Card key={ad.id} className="card-steel hover:scale-105 transition-transform duration-300">
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
                    <h3 className="text-lg font-bold text-steel-100 line-clamp-2 hover:text-primary transition-colors">
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
                        {formatPrice(ad.price)} ₽
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-steel-600">
                      <div className="flex items-center space-x-1 text-xs text-steel-400">
                        <User className="w-3 h-3" />
                        <span>ID: {ad.user_id.slice(0, 8)}...</span>
                      </div>
                      <Button size="sm" variant="outline">
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}