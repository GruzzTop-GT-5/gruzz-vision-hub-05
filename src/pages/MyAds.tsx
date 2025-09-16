import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/BackButton';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit3, Trash2, Search, Filter, DollarSign, Calendar, Clock, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  status: string;
  created_at: string;
  user_id: string;
  type: 'ad'; // Маркер типа
}

interface Vacancy {
  id: string;
  order_number: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  status: string;
  priority: string;
  deadline: string | null;
  client_id: string;
  created_at: string;
  type: 'vacancy'; // Маркер типа
}

type MyItem = Ad | Vacancy;

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

// Fixed handleEditAd reference error - cache refresh
const MyAds = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<MyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateVacancyModal, setShowCreateVacancyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchItems();
    }
  }, [user?.id]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, selectedStatus, selectedType]);

  const fetchItems = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch user's ads
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (adsError) throw adsError;

      // Fetch user's created orders (vacancies)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Combine and mark with type
      const allItems: MyItem[] = [
        ...(adsData || []).map(ad => ({ ...ad, type: 'ad' as const })),
        ...(ordersData || []).map(order => ({ ...order, type: 'vacancy' as const }))
      ];

      // Sort by creation date
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить объявления и вакансии",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.type === 'vacancy' && (item as Vacancy).order_number.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    setFilteredItems(filtered);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      price: ''
    });
  };

  const handleCreateAd = async () => {
    if (!user?.id || !formData.title || !formData.category || !formData.price) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, find the category_id for the selected category
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', formData.category)
        .single();

      const { error } = await supabase
        .from('ads')
        .insert({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          category_id: categoryData?.id || null,
          price: parseFloat(formData.price),
          user_id: user.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Объявление создано",
        description: "Ваше объявление было успешно создано"
      });

      resetForm();
      setShowCreateModal(false);
      fetchItems();
    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать объявление",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async () => {
    if (!selectedItem || !formData.title || !formData.category || !formData.price) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedItem?.type === 'ad') {
        // First, find the category_id for the selected category
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('name', formData.category)
          .single();

        const { error } = await supabase
          .from('ads')
          .update({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            category_id: categoryData?.id || null,
            price: parseFloat(formData.price)
          })
          .eq('id', selectedItem.id)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else if (selectedItem?.type === 'vacancy') {
        const { error } = await supabase
          .from('orders')
          .update({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            price: parseFloat(formData.price)
          })
          .eq('id', selectedItem.id)
          .eq('client_id', user?.id);

        if (error) throw error;
      }

      toast({
        title: "Успешно обновлено",
        description: selectedItem?.type === 'ad' ? "Объявление обновлено" : "Вакансия обновлена"
      });

      resetForm();
      setShowEditModal(false);
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error('Error updating ad:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить объявление",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      if (selectedItem.type === 'ad') {
        const { error } = await supabase
          .from('ads')
          .delete()
          .eq('id', selectedItem.id)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else if (selectedItem.type === 'vacancy') {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', selectedItem.id)
          .eq('client_id', user?.id);

        if (error) throw error;
      }

      toast({
        title: selectedItem.type === 'ad' ? "Объявление удалено" : "Вакансия удалена",
        description: selectedItem.type === 'ad' ? "Объявление успешно удалено" : "Вакансия успешно удалена"
      });

      setShowDeleteDialog(false);
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить объявление",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (item: MyItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      price: item.price.toString()
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (item: MyItem) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const getStatusBadge = (status: string, type: 'ad' | 'vacancy') => {
    if (type === 'ad') {
      switch (status) {
        case 'active':
          return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Активно</Badge>;
        case 'inactive':
          return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Неактивно</Badge>;
        case 'pending':
          return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">На модерации</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'pending':
          return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Ожидает исполнителя</Badge>;
        case 'accepted':
          return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Принята</Badge>;
        case 'in_progress':
          return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">В работе</Badge>;
        case 'review':
          return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">На проверке</Badge>;
        case 'completed':
          return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Завершена</Badge>;
        case 'cancelled':
          return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Отклонена</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    }
  };

  const getItemStats = () => {
    return {
      total: items.length,
      ads: items.filter(item => item.type === 'ad').length,
      vacancies: items.filter(item => item.type === 'vacancy').length,
      active: items.filter(item => 
        (item.type === 'ad' && item.status === 'active') || 
        (item.type === 'vacancy' && ['pending', 'accepted', 'in_progress'].includes(item.status))
      ).length,
      completed: items.filter(item => 
        (item.type === 'ad' && item.status === 'inactive') || 
        (item.type === 'vacancy' && ['completed', 'cancelled'].includes(item.status))
      ).length
    };
  };

  const stats = getItemStats();

  if (!user) {
    return (
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="card-steel max-w-md w-full p-8 text-center space-y-6">
            <Package className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-steel-100">Требуется авторизация</h2>
            <p className="text-steel-300">Для управления объявлениями необходимо войти в систему</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton onClick={() => window.history.back()} />
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-glow">Мои публикации</h1>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-primary hover:bg-primary/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать объявление
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowCreateVacancyModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать вакансию
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-steel-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-steel-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.total}</p>
                  <p className="text-sm text-steel-400">Всего публикаций</p>
                </div>
              </div>
            </Card>

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.ads}</p>
                  <p className="text-sm text-steel-400">Объявлений</p>
                </div>
              </div>
            </Card>

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.vacancies}</p>
                  <p className="text-sm text-steel-400">Вакансий</p>
                </div>
              </div>
            </Card>

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.active}</p>
                  <p className="text-sm text-steel-400">Активных</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="card-steel p-4">
            <div className="grid md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-steel-400" />
                <Input
                  placeholder="Поиск по названию или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="ad">Объявления</SelectItem>
                  <SelectItem value="vacancy">Вакансии</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="pending">Ожидающие</SelectItem>
                  <SelectItem value="completed">Завершенные</SelectItem>
                  <SelectItem value="cancelled">Отмененные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Items List */}
          {isLoading ? (
            <Card className="card-steel p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-steel-300">Загрузка...</p>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="card-steel p-8 text-center space-y-4">
              <Package className="w-16 h-16 text-steel-500 mx-auto" />
              <h3 className="text-xl font-bold text-steel-300">
                {items.length === 0 ? 'Нет публикаций' : 'Ничего не найдено'}
              </h3>
              <p className="text-steel-400">
                {items.length === 0 
                  ? 'Создайте ваше первое объявление или вакансию' 
                  : 'Попробуйте изменить параметры поиска'
                }
              </p>
              {items.length === 0 && (
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать объявление
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateVacancyModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать вакансию
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={`${item.type}-${item.id}`} className="card-steel border border-steel-600 h-full">
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2">
                        {getStatusBadge(item.status, item.type)}
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'ad' ? 'Объявление' : 'Вакансия'}
                        </Badge>
                      </div>
                      <span className="text-xs text-steel-400">
                        {format(new Date(item.created_at), 'dd MMM yyyy', { locale: ru })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-steel-100 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Order Number for vacancies */}
                    {item.type === 'vacancy' && (
                      <p className="text-xs text-steel-400">
                        № {(item as Vacancy).order_number}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-steel-300 text-sm line-clamp-3">
                      {item.description || 'Описание не указано'}
                    </p>

                    {/* Category */}
                    <div className="flex items-center space-x-2 text-sm text-steel-400">
                      <Package className="w-4 h-4" />
                      <span>{item.category || 'Не указано'}</span>
                    </div>

                    {/* Deadline for vacancies */}
                    {item.type === 'vacancy' && (item as Vacancy).deadline && (
                      <div className="flex items-center space-x-2 text-sm text-steel-400">
                        <Clock className="w-4 h-4" />
                        <span>До: {format(new Date((item as Vacancy).deadline!), 'dd MMM yyyy', { locale: ru })}</span>
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-steel-600">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-lg font-bold text-steel-100">
                          {item.price} {item.type === 'ad' ? '₽' : 'GT'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link to={`/ad/${item.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Ad Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="card-steel-dialog max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать объявление</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Название *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название объявления"
              />
            </div>

            <div>
              <Label htmlFor="category">Категория *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Цена *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Введите цену в рублях"
              />
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Опишите ваше объявление"
                rows={4}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateAd}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Создать
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowCreateModal(false);
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Ad Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="card-steel-dialog max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать объявление</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Название *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название объявления"
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Категория *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-price">Цена *</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Введите цену в рублях"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Опишите ваше объявление"
                rows={4}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleEditItem}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Edit3 className="w-4 h-4 mr-2" />
                )}
                Сохранить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="card-steel-dialog max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить объявление</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-steel-300">
              Вы уверены, что хотите удалить {selectedItem?.type === 'ad' ? 'объявление' : 'вакансию'} "{selectedItem?.title}"?
            </p>
            <p className="text-steel-400 text-sm">
              Это действие нельзя отменить.
            </p>
            
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={handleDeleteItem}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Удалить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedItem(null);
                }}
                disabled={isDeleting}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Create Vacancy Modal */}
      {showCreateVacancyModal && (
        <CreateOrderModal
          isOpen={showCreateVacancyModal}
          onClose={() => setShowCreateVacancyModal(false)}
          onOrderCreated={() => {
            setShowCreateVacancyModal(false);
            fetchItems();
          }}
        />
      )}
    </Layout>
  );
};

// Cache refresh fix for handleEditAd reference error
export default MyAds;