import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Plus, Eye, ToggleLeft, ToggleRight, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string;
  promo_type: 'bonus' | 'discount_percent' | 'discount_fixed';
  bonus_amount: number;
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  distribution_method: string;
  target_audience: any;
}

export const PromoCodeManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('create');
  const { toast } = useToast();
  const { userRole } = useAuthContext();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    promo_type: 'bonus' as 'bonus' | 'discount_percent' | 'discount_fixed',
    bonus_amount: '',
    discount_value: '',
    min_order_amount: '',
    max_discount: '',
    usage_limit: '',
    expires_at: '',
    distribution_method: 'manual',
    target_audience: 'all'
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes((data || []) as PromoCode[]);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить промокоды',
        variant: 'destructive'
      });
    }
  };

  const createPromoCode = async () => {
    // Проверка прав доступа
    if (!userRole || !['system_admin', 'admin'].includes(userRole)) {
      toast({
        title: "Ошибка доступа",
        description: "У вас недостаточно прав для создания промокодов",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.expires_at) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    // Validate based on promo type
    if (formData.promo_type === 'bonus' && !formData.bonus_amount) {
      toast({
        title: 'Ошибка',
        description: 'Укажите сумму бонуса',
        variant: 'destructive'
      });
      return;
    }

    if ((formData.promo_type === 'discount_percent' || formData.promo_type === 'discount_fixed') && !formData.discount_value) {
      toast({
        title: 'Ошибка',
        description: 'Укажите размер скидки',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: generateCode(),
          name: formData.name,
          description: formData.description,
          promo_type: formData.promo_type,
          bonus_amount: formData.bonus_amount ? parseFloat(formData.bonus_amount) : 0,
          discount_value: formData.discount_value ? parseFloat(formData.discount_value) : 0,
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          expires_at: formData.expires_at,
          distribution_method: formData.distribution_method,
          target_audience: { type: formData.target_audience },
          created_by: userData.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: `Промокод ${data.code} создан!`
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        promo_type: 'bonus',
        bonus_amount: '',
        discount_value: '',
        min_order_amount: '',
        max_discount: '',
        usage_limit: '',
        expires_at: '',
        distribution_method: 'manual',
        target_audience: 'all'
      });

      fetchPromoCodes();
      setSelectedTab('list');
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePromoCode = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: `Промокод ${!currentStatus ? 'активирован' : 'деактивирован'}`
      });

      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error toggling promo code:', error);
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Скопировано',
        description: 'Промокод скопирован в буфер обмена'
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const sendToTelegram = async (promoCode: PromoCode) => {
    try {
      setLoading(true);
      
      let benefit = '';
      if (promoCode.promo_type === 'bonus') {
        benefit = `💰 Бонус: ${promoCode.bonus_amount} GT`;
      } else if (promoCode.promo_type === 'discount_percent') {
        benefit = `💸 Скидка: ${promoCode.discount_value}%`;
      } else if (promoCode.promo_type === 'discount_fixed') {
        benefit = `💸 Скидка: ${promoCode.discount_value} GT`;
      }

      const message = `🎉 *Новый промокод!*\n\n` +
        `📝 *${promoCode.name}*\n` +
        `${benefit}\n` +
        `🎫 Код: \`${promoCode.code}\`\n` +
        `⏰ Действует до: ${format(new Date(promoCode.expires_at), 'dd.MM.yyyy HH:mm', { locale: ru })}\n\n` +
        `${promoCode.description || 'Активируйте промокод в своем профиле!'}`;

      const { error } = await supabase.functions.invoke('notify-telegram-promo', {
        body: { 
          message,
          promoCodeId: promoCode.id
        }
      });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Промокод отправлен в Telegram группу'
      });
    } catch (error: any) {
      console.error('Error sending to telegram:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить в Telegram',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const getStatusBadge = (promoCode: PromoCode) => {
    const isExpired = new Date(promoCode.expires_at) < new Date();
    const isLimitReached = promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit;
    
    if (!promoCode.is_active) {
      return <Badge variant="secondary">Неактивен</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Истек</Badge>;
    }
    if (isLimitReached) {
      return <Badge variant="destructive">Лимит</Badge>;
    }
    return <Badge variant="default">Активен</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">%</span>
          </div>
          Управление промокодами
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Создать промокод</TabsTrigger>
            <TabsTrigger value="list">Список промокодов</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            {/* Main Info Section */}
            <Card className="card-steel-lighter">
              <CardHeader>
                <CardTitle className="text-lg">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">Название промокода *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Например: Скидка 10%"
                      className="text-base"
                    />
                    <p className="text-xs text-steel-400">Внутреннее название для вашего удобства</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promo_type" className="text-base">Тип промокода *</Label>
                    <Select 
                      value={formData.promo_type} 
                      onValueChange={(value: any) => setFormData({ ...formData, promo_type: value })}
                    >
                      <SelectTrigger className="text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">💰 Бонус на баланс (GT коины)</SelectItem>
                        <SelectItem value="discount_percent">📊 Скидка в процентах (%)</SelectItem>
                        <SelectItem value="discount_fixed">💸 Фиксированная скидка (GT)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-steel-400">
                      {formData.promo_type === 'bonus' && '→ Пользователь получит GT коины на баланс'}
                      {formData.promo_type === 'discount_percent' && '→ Скидка в % от суммы заказа'}
                      {formData.promo_type === 'discount_fixed' && '→ Фиксированная скидка в GT'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base">Описание для пользователей</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Опишите условия и преимущества промокода..."
                    rows={3}
                    className="text-base resize-none"
                  />
                  <p className="text-xs text-steel-400">Это увидят пользователи при активации промокода</p>
                </div>
              </CardContent>
            </Card>

            {/* Benefit Settings */}
            <Card className="card-steel-lighter">
              <CardHeader>
                <CardTitle className="text-lg">
                  {formData.promo_type === 'bonus' && '💰 Настройка бонуса'}
                  {formData.promo_type === 'discount_percent' && '📊 Настройка процентной скидки'}
                  {formData.promo_type === 'discount_fixed' && '💸 Настройка фиксированной скидки'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.promo_type === 'bonus' && (
                  <div className="space-y-2">
                    <Label htmlFor="bonus_amount" className="text-base">Сумма бонуса (GT) *</Label>
                    <Input
                      id="bonus_amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.bonus_amount}
                      onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                      placeholder="100"
                      className="text-base"
                    />
                    <p className="text-xs text-steel-400">
                      Сколько GT коинов получит пользователь на баланс при активации
                    </p>
                  </div>
                )}

                {(formData.promo_type === 'discount_percent' || formData.promo_type === 'discount_fixed') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount_value" className="text-base">
                        {formData.promo_type === 'discount_percent' ? 'Размер скидки (%) *' : 'Размер скидки (GT) *'}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        min="1"
                        step={formData.promo_type === 'discount_percent' ? '1' : '0.01'}
                        max={formData.promo_type === 'discount_percent' ? '100' : undefined}
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        placeholder={formData.promo_type === 'discount_percent' ? '10' : '50'}
                        className="text-base"
                      />
                      <p className="text-xs text-steel-400">
                        {formData.promo_type === 'discount_percent' 
                          ? 'Процент скидки (от 1% до 100%)'
                          : 'Фиксированная скидка в GT коинах'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_order_amount" className="text-base">Минимальная сумма заказа (GT)</Label>
                      <Input
                        id="min_order_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                        placeholder="0"
                        className="text-base"
                      />
                      <p className="text-xs text-steel-400">
                        Минимальная сумма для применения скидки (0 = без ограничений)
                      </p>
                    </div>

                    {formData.promo_type === 'discount_percent' && (
                      <div className="space-y-2">
                        <Label htmlFor="max_discount" className="text-base">Максимальная скидка (GT)</Label>
                        <Input
                          id="max_discount"
                          type="number"
                          min="1"
                          step="0.01"
                          value={formData.max_discount}
                          onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                          placeholder="Оставьте пустым для неограниченной"
                          className="text-base"
                        />
                        <p className="text-xs text-steel-400">
                          Ограничение максимальной скидки в GT (пусто = без ограничений)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Limits and Expiration */}
            <Card className="card-steel-lighter">
              <CardHeader>
                <CardTitle className="text-lg">Ограничения и срок действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usage_limit" className="text-base">Лимит использований</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      placeholder="Оставьте пустым для безлимитного"
                      className="text-base"
                    />
                    <p className="text-xs text-steel-400">
                      Сколько раз можно активировать промокод (пусто = неограниченно)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires_at" className="text-base">Срок действия до *</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      className="text-base"
                    />
                    <p className="text-xs text-steel-400">
                      Дата и время, до которого промокод будет активен
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Settings */}
            <Card className="card-steel-lighter">
              <CardHeader>
                <CardTitle className="text-lg">Параметры распространения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_audience" className="text-base">Целевая аудитория</Label>
                    <Select 
                      value={formData.target_audience} 
                      onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                    >
                      <SelectTrigger className="text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все пользователи</SelectItem>
                        <SelectItem value="new">Новые пользователи</SelectItem>
                        <SelectItem value="active">Активные пользователи</SelectItem>
                        <SelectItem value="premium">Premium пользователи</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-steel-400">
                      Для какой группы пользователей предназначен промокод
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distribution_method" className="text-base">Способ распространения</Label>
                    <Select 
                      value={formData.distribution_method} 
                      onValueChange={(value) => setFormData({ ...formData, distribution_method: value })}
                    >
                      <SelectTrigger className="text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Ручная раздача</SelectItem>
                        <SelectItem value="notification">Уведомления в приложении</SelectItem>
                        <SelectItem value="telegram">Telegram группа</SelectItem>
                        <SelectItem value="email">Email рассылка</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-steel-400">
                      Как пользователи узнают о промокоде
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={createPromoCode} 
              disabled={loading} 
              className="w-full h-auto py-4"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="text-base">Создать промокод</span>
            </Button>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {promoCodes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-steel-400 mb-4">Промокоды пока не созданы</p>
                <Button onClick={() => setSelectedTab('create')} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первый промокод
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {promoCodes.map((promo) => (
                  <Card key={promo.id} className="card-steel-lighter">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-steel-100">{promo.name}</h3>
                                {getStatusBadge(promo)}
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <code className="px-3 py-1 bg-steel-700 rounded-lg text-primary font-mono text-lg">
                                  {promo.code}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(promo.code)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-steel-400">Тип:</span>{' '}
                                  <span className="text-steel-100">
                                    {promo.promo_type === 'bonus' && '💰 Бонус'}
                                    {promo.promo_type === 'discount_percent' && '📊 Скидка %'}
                                    {promo.promo_type === 'discount_fixed' && '💸 Скидка фикс.'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-steel-400">Значение:</span>{' '}
                                  <span className="text-steel-100">
                                    {promo.promo_type === 'bonus' && `${promo.bonus_amount} GT`}
                                    {promo.promo_type === 'discount_percent' && `${promo.discount_value}%`}
                                    {promo.promo_type === 'discount_fixed' && `${promo.discount_value} GT`}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 p-3 bg-steel-700/50 rounded-lg border border-steel-600">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-steel-400 text-sm">Лимит использований:</span>{' '}
                                    <span className="text-steel-100 font-semibold text-base">
                                      {promo.usage_limit ? `${promo.usage_limit} раз` : 'Неограниченно'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-steel-400 text-sm">Уже использовано:</span>{' '}
                                    <span className={`font-semibold text-base ${
                                      promo.usage_limit && promo.usage_count >= promo.usage_limit 
                                        ? 'text-red-400' 
                                        : 'text-green-400'
                                    }`}>
                                      {promo.usage_count} раз
                                    </span>
                                  </div>
                                </div>
                                {promo.usage_limit && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs text-steel-400 mb-1">
                                      <span>Прогресс</span>
                                      <span>{Math.round((promo.usage_count / promo.usage_limit) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-steel-600 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all ${
                                          promo.usage_count >= promo.usage_limit 
                                            ? 'bg-red-500' 
                                            : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min((promo.usage_count / promo.usage_limit) * 100, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {promo.description && (
                                <p className="text-steel-300 text-sm mt-2">{promo.description}</p>
                              )}

                              <p className="text-steel-400 text-xs mt-2">
                                Действует до: {format(new Date(promo.expires_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button 
                            variant={promo.is_active ? "destructive" : "default"}
                            onClick={() => togglePromoCode(promo.id, promo.is_active)}
                            className="w-full md:w-auto"
                            size="sm"
                          >
                            {promo.is_active ? (
                              <>
                                <ToggleRight className="w-4 h-4 mr-2" />
                                Деактивировать
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 mr-2" />
                                Активировать
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => sendToTelegram(promo)}
                            disabled={loading}
                            className="w-full md:w-auto"
                            size="sm"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            В Telegram
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};