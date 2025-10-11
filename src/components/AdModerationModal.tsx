import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Clock,
  User,
  Calendar,
  Coins,
  MessageSquare,
  FileText,
  Tag,
  Star,
  MapPin,
  Phone,
  Mail,
  History,
  TrendingUp,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
  user_id: string;
  moderation_comment?: string;
  moderated_at?: string;
  moderated_by?: string;
  category_id?: string;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  phone: string | null;
  rating: number;
  created_at: string;
  role: string;
  age?: number;
  citizenship?: string;
  qualification?: string;
}

interface ModerationHistory {
  id: string;
  action: string;
  timestamp: string;
  moderator: {
    display_name: string | null;
    full_name: string | null;
  };
  comment?: string;
}

interface AdModerationModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
  onAdUpdate: () => void;
}

export const AdModerationModal = ({ ad, isOpen, onClose, onAdUpdate }: AdModerationModalProps) => {
  const { toast } = useToast();
  const [moderationComment, setModerationComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userAdsCount, setUserAdsCount] = useState(0);
  const [moderationHistory, setModerationHistory] = useState<ModerationHistory[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    if (ad && isOpen) {
      setModerationComment(ad.moderation_comment || '');
      setNewCategory(ad.category);
      setNewPrice(ad.price.toString());
      fetchUserProfile();
      fetchUserAdsCount();
      fetchModerationHistory();
      fetchCategories();
    }
  }, [ad, isOpen]);

  const fetchUserProfile = async () => {
    if (!ad?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ad.user_id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserAdsCount = async () => {
    if (!ad?.user_id) return;

    try {
      const { count, error } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ad.user_id);

      if (error) throw error;
      setUserAdsCount(count || 0);
    } catch (error) {
      console.error('Error fetching user ads count:', error);
    }
  };

  const fetchModerationHistory = async () => {
    if (!ad?.id) return;

    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          profiles!user_id (
            display_name,
            full_name
          )
        `)
        .eq('target_id', ad.id)
        .eq('target_type', 'ad')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setModerationHistory(data as any || []);
    } catch (error) {
      console.error('Error fetching moderation history:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (!ad) {
    return null;
  }

  const handleStatusChange = async (status: string) => {
    if (!moderationComment.trim() && status !== 'active') {
      toast({
        title: "Ошибка",
        description: "Комментарий обязателен при изменении статуса",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = { 
        status: status,
        moderated_at: new Date().toISOString(),
        moderated_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (moderationComment.trim()) {
        updateData.moderation_comment = moderationComment;
      }

      if (newCategory !== ad.category) {
        updateData.category = newCategory;
      }

      if (parseFloat(newPrice) !== ad.price) {
        updateData.price = parseFloat(newPrice);
      }

      const { error } = await supabase
        .from('ads')
        .update(updateData)
        .eq('id', ad.id);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_logs')
        .insert({
          action: `moderate_ad_${status}`,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          target_id: ad.id,
          target_type: 'ad'
        });

      // Send notification to user
      const statusMessages = {
        'active': 'Ваше объявление одобрено и опубликовано',
        'rejected': 'Ваше объявление отклонено',
        'pending': 'Ваше объявление требует дополнительной проверки',
        'suspended': 'Ваше объявление приостановлено',
        'inactive': 'Ваше объявление деактивировано'
      };

      await supabase
        .from('notifications')
        .insert({
          user_id: ad.user_id,
          type: 'ad_moderation',
          title: 'Модерация объявления',
          content: `${statusMessages[status as keyof typeof statusMessages]}${moderationComment ? '. Комментарий модератора: ' + moderationComment : ''}`
        });

      toast({
        title: "Успешно",
        description: "Статус объявления обновлен"
      });

      onAdUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Ошибка", 
        description: "Не удалось обновить статус объявления",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'suspended': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'inactive': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-steel-400 bg-steel-400/10 border-steel-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активно';
      case 'pending': return 'На проверке';
      case 'rejected': return 'Отклонено';
      case 'suspended': return 'Приостановлено';
      case 'inactive': return 'Неактивно';
      default: return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'admin': return 'text-primary bg-primary/10 border-primary/20';
      case 'moderator': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'support': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-steel-400 bg-steel-400/10 border-steel-400/20';
    }
  };

  
  return (
    <Dialog open={isOpen && !!ad} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Модерация объявления</span>
            <Badge className={getStatusColor(ad.status)}>
              {getStatusLabel(ad.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="author">Автор</TabsTrigger>
            <TabsTrigger value="moderation">Модерация</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          {/* Ad Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card className="card-steel-lighter p-4">
                <h3 className="text-lg font-semibold text-steel-100 mb-4">Основная информация</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-steel-300">Заголовок</Label>
                    <p className="text-steel-100 font-medium mt-1">{ad.title}</p>
                  </div>
                  
                  <div>
                    <Label className="text-steel-300">Категория</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Tag className="w-4 h-4 text-steel-400" />
                      <span className="text-steel-100">{ad.category}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-steel-300">Цена</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Coins className="w-4 h-4 text-green-400" />
                      <span className="text-steel-100 font-medium">{ad.price.toLocaleString()} GT Coins</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-steel-300">Дата создания</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-steel-400" />
                      <span className="text-steel-100">
                        {format(new Date(ad.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Description */}
              <Card className="card-steel-lighter p-4">
                <h3 className="text-lg font-semibold text-steel-100 mb-4">Описание</h3>
                <ScrollArea className="h-40">
                  <p className="text-steel-100 bg-steel-700 p-3 rounded leading-relaxed">
                    {ad.description || 'Описание отсутствует'}
                  </p>
                </ScrollArea>
              </Card>
            </div>

            {/* Current Moderation Info */}
            {ad.moderation_comment && (
              <Card className="card-steel-lighter p-4">
                <h3 className="text-lg font-semibold text-steel-100 mb-4">Предыдущая модерация</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-steel-400" />
                    <span className="text-steel-300">
                      {ad.moderated_at && format(new Date(ad.moderated_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-steel-100 bg-steel-700 p-3 rounded">
                    {ad.moderation_comment}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Author Tab */}
          <TabsContent value="author" className="space-y-4">
            {userProfile && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-steel-lighter p-4">
                  <h3 className="text-lg font-semibold text-steel-100 mb-4">Информация об авторе</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-steel-400" />
                      <div>
                        <p className="text-steel-100 font-medium">
                          {userProfile.display_name || userProfile.full_name || 'Имя не указано'}
                        </p>
                        <Badge className={getRoleColor(userProfile.role)}>
                          {userProfile.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-steel-400" />
                      <span className="text-steel-100">{userProfile.phone || 'Не указан'}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-steel-100">
                        Рейтинг: {userProfile.rating?.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-steel-400" />
                      <span className="text-steel-100">
                        Регистрация: {format(new Date(userProfile.created_at), 'dd.MM.yyyy', { locale: ru })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-steel-400" />
                      <span className="text-steel-100">
                        Всего объявлений: {userAdsCount}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="card-steel-lighter p-4">
                  <h3 className="text-lg font-semibold text-steel-100 mb-4">Дополнительно</h3>
                  <div className="space-y-3">
                    {userProfile.age && (
                      <div>
                        <Label className="text-steel-300">Возраст</Label>
                        <p className="text-steel-100">{userProfile.age} лет</p>
                      </div>
                    )}
                    
                    {userProfile.citizenship && (
                      <div>
                        <Label className="text-steel-300">Гражданство</Label>
                        <p className="text-steel-100">{userProfile.citizenship}</p>
                      </div>
                    )}
                    
                    {userProfile.qualification && (
                      <div>
                        <Label className="text-steel-300">Квалификация</Label>
                        <p className="text-steel-100">{userProfile.qualification}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Edit Fields */}
              <Card className="card-steel-lighter p-4">
                <h3 className="text-lg font-semibold text-steel-100 mb-4">Редактирование</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-steel-300">Категория</Label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full mt-1 bg-steel-700 border border-steel-600 rounded-md p-2 text-steel-100"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-steel-300">Цена (GT Coins)</Label>
                    <Input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="card-steel-lighter p-4">
                <h3 className="text-lg font-semibold text-steel-100 mb-4">Быстрые действия</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleStatusChange('active')}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Одобрить
                  </Button>

                  <Button
                    onClick={() => handleStatusChange('rejected')}
                    disabled={loading || !moderationComment.trim()}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Отклонить
                  </Button>

                  <Button
                    onClick={() => handleStatusChange('pending')}
                    disabled={loading || !moderationComment.trim()}
                    variant="outline"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    На доработку
                  </Button>

                  <Button
                    onClick={() => handleStatusChange('suspended')}
                    disabled={loading || !moderationComment.trim()}
                    variant="outline"
                    className="text-orange-400 border-orange-400/20 hover:bg-orange-400/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Приостановить
                  </Button>
                </div>
              </Card>
            </div>

            {/* Moderation Comment */}
            <Card className="card-steel-lighter p-4">
              <h3 className="text-lg font-semibold text-steel-100 mb-4">Комментарий модератора</h3>
              <Textarea
                value={moderationComment}
                onChange={(e) => setModerationComment(e.target.value)}
                placeholder="Укажите причину изменения статуса, рекомендации для пользователя..."
                rows={4}
                className="w-full mb-4"
              />

              {/* Quick Reasons */}
              <div className="space-y-2">
                <Label className="text-steel-300">Быстрые причины:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    "Неподходящий контент",
                    "Нарушение правил платформы", 
                    "Недостаточно информации",
                    "Неверная категория",
                    "Подозрительная активность",
                    "Спам или дублирование",
                    "Некорректная цена",
                    "Низкое качество описания",
                    "Требует уточнения",
                    "Нарушение авторских прав"
                  ].map((reason) => (
                    <Button
                      key={reason}
                      variant="ghost"
                      size="sm"
                      onClick={() => setModerationComment(reason)}
                      className="text-left justify-start text-steel-300 hover:text-steel-100 hover:bg-steel-700"
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="card-steel-lighter p-4">
              <h3 className="text-lg font-semibold text-steel-100 mb-4">История модерации</h3>
              {moderationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                  <p className="text-steel-400">История модерации пуста</p>
                </div>
              ) : (
                <ScrollArea className="h-60">
                  <div className="space-y-3">
                    {moderationHistory.map((entry) => (
                      <div key={entry.id} className="bg-steel-700 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-steel-100">{entry.action}</span>
                          <span className="text-steel-400 text-sm">
                            {format(new Date(entry.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </span>
                        </div>
                        <p className="text-steel-300 text-sm">
                          Модератор: {entry.moderator?.display_name || entry.moderator?.full_name || 'Системный'}
                        </p>
                        {entry.comment && (
                          <p className="text-steel-200 text-sm mt-1">{entry.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};