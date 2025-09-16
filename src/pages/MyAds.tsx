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

const MyAds = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  const [ads, setAds] = useState<Ad[]>([]);
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
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
      fetchAds();
    }
  }, [user?.id]);

  useEffect(() => {
    filterAds();
  }, [ads, searchQuery, selectedCategory, selectedStatus]);

  const fetchAds = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить объявления",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAds = () => {
    let filtered = [...ads];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad =>
        ad.title.toLowerCase().includes(query) ||
        (ad.description && ad.description.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(ad => ad.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(ad => ad.status === selectedStatus);
    }

    setFilteredAds(filtered);
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
      fetchAds();
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

  const handleEditAd = async () => {
    if (!selectedAd || !formData.title || !formData.category || !formData.price) {
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
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          category_id: categoryData?.id || null,
          price: parseFloat(formData.price)
        })
        .eq('id', selectedAd.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Объявление обновлено",
        description: "Ваше объявление было успешно обновлено"
      });

      resetForm();
      setShowEditModal(false);
      setSelectedAd(null);
      fetchAds();
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

  const handleDeleteAd = async () => {
    if (!selectedAd) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', selectedAd.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Объявление удалено",
        description: "Ваше объявление было успешно удалено"
      });

      setShowDeleteDialog(false);
      setSelectedAd(null);
      fetchAds();
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

  const openEditModal = (ad: Ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      category: ad.category,
      price: ad.price.toString()
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (ad: Ad) => {
    setSelectedAd(ad);
    setShowDeleteDialog(true);
  };

  const getStatusBadge = (status: string) => {
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
  };

  const getAdStats = () => {
    return {
      total: ads.length,
      active: ads.filter(ad => ad.status === 'active').length,
      inactive: ads.filter(ad => ad.status === 'inactive').length,
      pending: ads.filter(ad => ad.status === 'pending').length
    };
  };

  const stats = getAdStats();

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
                <h1 className="text-3xl font-bold text-glow">Мои объявления</h1>
              </div>
            </div>
            
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
                  <p className="text-sm text-steel-400">Всего объявлений</p>
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

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.inactive}</p>
                  <p className="text-sm text-steel-400">Неактивных</p>
                </div>
              </div>
            </Card>

            <Card className="card-steel p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-steel-100">{stats.pending}</p>
                  <p className="text-sm text-steel-400">На модерации</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="card-steel p-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-steel-400" />
                <Input
                  placeholder="Поиск по названию или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

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
                  <SelectItem value="inactive">Неактивные</SelectItem>
                  <SelectItem value="pending">На модерации</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Ads List */}
          {isLoading ? (
            <Card className="card-steel p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-steel-300">Загрузка объявлений...</p>
            </Card>
          ) : filteredAds.length === 0 ? (
            <Card className="card-steel p-8 text-center space-y-4">
              <Package className="w-16 h-16 text-steel-500 mx-auto" />
              <h3 className="text-xl font-bold text-steel-300">
                {ads.length === 0 ? 'Нет объявлений' : 'Объявления не найдены'}
              </h3>
              <p className="text-steel-400">
                {ads.length === 0 
                  ? 'Создайте ваше первое объявление' 
                  : 'Попробуйте изменить параметры поиска'
                }
              </p>
              {ads.length === 0 && (
                <Button onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать объявление
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <Card key={ad.id} className="card-steel border border-steel-600 h-full">
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      {getStatusBadge(ad.status)}
                      <span className="text-xs text-steel-400">
                        {format(new Date(ad.created_at), 'dd MMM yyyy', { locale: ru })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-steel-100 line-clamp-2">
                      {ad.title}
                    </h3>

                    {/* Description */}
                    <p className="text-steel-300 text-sm line-clamp-3">
                      {ad.description || 'Описание не указано'}
                    </p>

                    {/* Category */}
                    <div className="flex items-center space-x-2 text-sm text-steel-400">
                      <Package className="w-4 h-4" />
                      <span>{ad.category}</span>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-steel-600">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-lg font-bold text-steel-100">{ad.price} ₽</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link to={`/ad/${ad.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditModal(ad)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => openDeleteDialog(ad)}
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
                onClick={handleEditAd}
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
                  setSelectedAd(null);
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
              Вы уверены, что хотите удалить объявление "{selectedAd?.title}"?
            </p>
            <p className="text-steel-400 text-sm">
              Это действие нельзя отменить.
            </p>
            
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={handleDeleteAd}
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
                  setSelectedAd(null);
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
    </Layout>
  );
};

export default MyAds;