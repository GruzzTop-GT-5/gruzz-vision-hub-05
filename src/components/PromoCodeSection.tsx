import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { Gift, Sparkles, Percent, Coins, Clock, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PromoCode {
  code: string;
  name: string;
  description: string;
  promo_type: string;
  bonus_amount: number;
  discount_value: number;
  expires_at: string;
  used: boolean;
}

export const PromoCodeSection: React.FC = () => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePromos, setActivePromos] = useState<PromoCode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Load active promos
  useEffect(() => {
    if (user) {
      loadActivePromos();
    }
  }, [user]);

  const loadActivePromos = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_active_promos', {
        p_user_id: user.id
      });

      if (error) throw error;
      setActivePromos(data || []);
    } catch (error) {
      console.error('Error loading active promos:', error);
    } finally {
      setLoadingPromos(false);
    }
  };

  const activatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите промокод',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо авторизоваться',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('use_promo_code', {
        p_code: promoCode.toUpperCase().trim(),
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { 
        success: boolean; 
        bonus?: number; 
        error?: string; 
        name?: string;
        promo_type?: string;
        discount_value?: number;
      };
      
      if (result.success) {
        let message = '';
        if (result.promo_type === 'bonus') {
          message = `Вы получили ${result.bonus} GT на баланс!`;
        } else if (result.promo_type === 'discount_percent') {
          message = `Скидка ${result.discount_value}% на следующий заказ!`;
        } else if (result.promo_type === 'discount_fixed') {
          message = `Скидка ${result.discount_value} GT на следующий заказ!`;
        }

        toast({
          title: '🎉 Промокод активирован!',
          description: message
        });
        setPromoCode('');
        loadActivePromos();
        
        // Refresh the page to update balance if it's a bonus type
        if (result.promo_type === 'bonus') {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        toast({
          title: 'Ошибка',
          description: result.error || 'Неизвестная ошибка',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error activating promo code:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось активировать промокод',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      activatePromoCode();
    }
  };

  const getPromoIcon = (type: string) => {
    switch (type) {
      case 'bonus':
        return <Coins className="w-4 h-4" />;
      case 'discount_percent':
        return <Percent className="w-4 h-4" />;
      case 'discount_fixed':
        return <Gift className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getPromoTypeName = (type: string) => {
    switch (type) {
      case 'bonus':
        return 'Бонус';
      case 'discount_percent':
        return 'Скидка %';
      case 'discount_fixed':
        return 'Скидка';
      default:
        return type;
    }
  };

  const formatExpiryDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return `Истекает через ${diffHours} ч`;
    } else if (diffDays === 1) {
      return 'Истекает завтра';
    } else {
      return `Истекает через ${diffDays} дн`;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="card-steel border-purple-500/30">
        <CardHeader className="pb-3 xs:pb-4">
          <CardTitle className="flex items-center gap-2 text-base xs:text-lg text-steel-100">
            <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Gift className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-white" />
            </div>
            <span className="break-words">Промокод</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 xs:space-y-4">
          <div className="flex items-center gap-2 text-xs xs:text-sm text-purple-400">
            <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
            <span className="leading-tight">Введите промокод и получите бонусы!</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="promo-code" className="text-sm text-steel-300">
              Промокод
            </Label>
            <div className="flex flex-col xs:flex-row gap-2">
              <Input
                id="promo-code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="ВВЕДИТЕ КОД"
                className="flex-1 font-mono text-center text-base xs:text-lg tracking-wider input-steel"
                maxLength={20}
                disabled={loading}
              />
              <Button 
                onClick={activatePromoCode}
                disabled={loading || !promoCode.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-5 xs:px-6 w-full xs:w-auto"
              >
                {loading ? 'Проверка...' : 'Активировать'}
              </Button>
            </div>
          </div>

          <div className="bg-steel-900/50 rounded-lg p-2.5 xs:p-3 border border-purple-500/20">
            <p className="text-xs text-purple-400 leading-relaxed">
              💡 <strong>Подсказка:</strong> Промокоды можно получить в Telegram группе, 
              через уведомления или от администраторов. Каждый промокод можно использовать только один раз.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Promos */}
      {!loadingPromos && activePromos.length > 0 && (
        <Card className="card-steel border-blue-500/30">
          <CardHeader className="pb-3 xs:pb-4">
            <CardTitle className="flex items-center gap-2 text-base xs:text-lg text-steel-100">
              <Sparkles className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0 text-blue-400" />
              <span className="break-words">Доступные промокоды</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 xs:space-y-4">
            {activePromos.map((promo, index) => (
              <Card 
                key={index}
                className={`overflow-hidden ${
                  promo.used 
                    ? 'bg-steel-900/30 border-steel-600/50' 
                    : 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50'
                }`}
              >
                <CardContent className="p-4">
                  {/* Мобильная вертикальная раскладка */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-steel-100">
                        {promo.name}
                      </h3>
                      <Badge variant={promo.used ? "secondary" : "default"} className="flex-shrink-0">
                        {promo.used ? (
                          <><Check className="w-3 h-3 mr-1" />Использован</>
                        ) : (
                          <>{getPromoIcon(promo.promo_type)}<span className="ml-1">{getPromoTypeName(promo.promo_type)}</span></>
                        )}
                      </Badge>
                    </div>
                    
                    {promo.description && (
                      <p className="text-sm text-steel-300">{promo.description}</p>
                    )}

                    <div className="bg-steel-900/50 rounded-lg p-3 border border-primary/30">
                      <div className="text-xs text-steel-400 mb-1 text-center">Промокод:</div>
                      <div className="font-mono font-bold text-2xl text-center text-primary tracking-wider">
                        {promo.code}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-steel-700">
                      <div className="flex items-center gap-2">
                        {promo.promo_type === 'bonus' && (
                          <><Coins className="w-5 h-5 text-green-400" /><span className="text-xl font-bold text-green-400">+{promo.bonus_amount} GT</span></>
                        )}
                        {promo.promo_type === 'discount_percent' && (
                          <><Percent className="w-5 h-5 text-orange-400" /><span className="text-xl font-bold text-orange-400">-{promo.discount_value}%</span></>
                        )}
                        {promo.promo_type === 'discount_fixed' && (
                          <><Gift className="w-5 h-5 text-orange-400" /><span className="text-xl font-bold text-orange-400">-{promo.discount_value} GT</span></>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-steel-400">
                        <Clock className="w-4 h-4" /><span>{formatExpiryDate(promo.expires_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Десктопная горизонтальная раскладка */}
                  <div className="hidden md:flex items-center gap-6">
                    {/* Левая часть - информация */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-steel-100">{promo.name}</h3>
                        <Badge variant={promo.used ? "secondary" : "default"}>
                          {promo.used ? (
                            <><Check className="w-3 h-3 mr-1" />Использован</>
                          ) : (
                            <>{getPromoIcon(promo.promo_type)}<span className="ml-1">{getPromoTypeName(promo.promo_type)}</span></>
                          )}
                        </Badge>
                      </div>
                      {promo.description && (
                        <p className="text-sm text-steel-300 line-clamp-2">{promo.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-steel-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatExpiryDate(promo.expires_at)}</span>
                      </div>
                    </div>

                    {/* Центральная часть - код */}
                    <div className="bg-steel-900/50 rounded-lg px-6 py-3 border border-primary/30">
                      <div className="text-xs text-steel-400 mb-1 text-center">Промокод</div>
                      <div className="font-mono font-bold text-3xl text-primary tracking-widest whitespace-nowrap">
                        {promo.code}
                      </div>
                    </div>

                    {/* Правая часть - бонус */}
                    <div className="flex flex-col items-center justify-center min-w-[120px]">
                      {promo.promo_type === 'bonus' && (
                        <>
                          <Coins className="w-8 h-8 text-green-400 mb-1" />
                          <span className="text-2xl font-bold text-green-400">+{promo.bonus_amount}</span>
                          <span className="text-sm text-green-400/70">GT</span>
                        </>
                      )}
                      {promo.promo_type === 'discount_percent' && (
                        <>
                          <Percent className="w-8 h-8 text-orange-400 mb-1" />
                          <span className="text-2xl font-bold text-orange-400">-{promo.discount_value}%</span>
                          <span className="text-sm text-orange-400/70">скидка</span>
                        </>
                      )}
                      {promo.promo_type === 'discount_fixed' && (
                        <>
                          <Gift className="w-8 h-8 text-orange-400 mb-1" />
                          <span className="text-2xl font-bold text-orange-400">-{promo.discount_value}</span>
                          <span className="text-sm text-orange-400/70">GT</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};