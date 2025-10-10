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
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Plus, Eye, ToggleLeft, ToggleRight, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string;
  bonus_amount: number;
  usage_limit: number | null;
  usage_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  distribution_method: string;
}

export const PromoCodeManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('create');
  const { toast } = useToast();
  const { userRole } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bonus_amount: '',
    usage_limit: '',
    expires_at: '',
    distribution_method: 'manual'
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
      setPromoCodes(data || []);
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

    if (!formData.name || !formData.bonus_amount || !formData.expires_at) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
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
          bonus_amount: parseFloat(formData.bonus_amount),
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          expires_at: formData.expires_at,
          distribution_method: formData.distribution_method,
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
        bonus_amount: '',
        usage_limit: '',
        expires_at: '',
        distribution_method: 'manual'
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
      
      const message = `🎉 *Новый промокод!*\n\n` +
        `📝 *${promoCode.name}*\n` +
        `💰 Бонус: ${promoCode.bonus_amount} ₽\n` +
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

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название промокода *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Скидка 10%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus_amount">Сумма бонуса (₽) *</Label>
                <Input
                  id="bonus_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.bonus_amount}
                  onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage_limit">Лимит использования</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Оставьте пустым для безлимитного"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Дата окончания *</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distribution_method">Способ распространения</Label>
                <Select 
                  value={formData.distribution_method} 
                  onValueChange={(value) => setFormData({ ...formData, distribution_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Ручная раздача</SelectItem>
                    <SelectItem value="notification">Уведомления в приложении</SelectItem>
                    <SelectItem value="telegram">Telegram группа</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Дополнительная информация о промокоде"
                rows={3}
              />
            </div>

            <Button 
              onClick={createPromoCode} 
              disabled={loading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Создание...' : 'Создать промокод'}
            </Button>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4">
              {promoCodes.map((promoCode) => (
                <Card key={promoCode.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{promoCode.name}</h3>
                          {getStatusBadge(promoCode)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Код: <span className="font-mono bg-muted px-1 py-0.5 rounded">{promoCode.code}</span></p>
                          <p>Бонус: {promoCode.bonus_amount} ₽</p>
                          <p>Использований: {promoCode.usage_count} {promoCode.usage_limit ? `/ ${promoCode.usage_limit}` : ''}</p>
                          <p>Истекает: {format(new Date(promoCode.expires_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                          {promoCode.description && <p>{promoCode.description}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(promoCode.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendToTelegram(promoCode)}
                          disabled={loading}
                        >
                          <Send className="w-4 h-4" />
                        </Button>

                        <Button
                          variant={promoCode.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => togglePromoCode(promoCode.id, promoCode.is_active)}
                        >
                          {promoCode.is_active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {promoCodes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Промокоды не найдены
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};