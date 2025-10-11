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
    <div className="space-y-4 md:space-y-6">
      {/* Promo Code Input Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg md:text-xl text-purple-700 dark:text-purple-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span>Промокод</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-3 text-sm md:text-base text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 p-3 md:p-4 rounded-lg">
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">Введите промокод и получите бонусы!</span>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="promo-code" className="text-sm md:text-base font-medium">
              Промокод
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="promo-code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="ВВЕДИТЕ КОД"
                className="flex-1 font-mono text-center text-lg md:text-xl tracking-widest border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400 h-12 md:h-14"
                maxLength={20}
                disabled={loading}
              />
              <Button 
                onClick={activatePromoCode}
                disabled={loading || !promoCode.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 h-12 md:h-14 text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? 'Проверка...' : 'Активировать'}
              </Button>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-black/30 rounded-xl p-4 md:p-5 border border-purple-200 dark:border-purple-700">
            <p className="text-sm md:text-base text-purple-700 dark:text-purple-300 leading-relaxed">
              <span className="text-lg mr-2">💡</span>
              <strong className="font-semibold">Подсказка:</strong> Промокоды можно получить в Telegram группе, 
              через уведомления или от администраторов. Каждый промокод можно использовать только один раз.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Promos */}
      {!loadingPromos && activePromos.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg md:text-xl text-blue-700 dark:text-blue-300">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span>Доступные промокоды</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {activePromos.map((promo, index) => (
              <div 
                key={index}
                className={`rounded-xl border-2 overflow-hidden transition-all ${
                  promo.used 
                    ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700' 
                    : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-900/20 dark:via-background dark:to-purple-900/20 border-blue-300 dark:border-blue-600 shadow-md hover:shadow-lg'
                }`}
              >
                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_auto] md:gap-6 p-5">
                  {/* Left: Info Section */}
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant={promo.used ? "secondary" : "default"} 
                        className="text-sm px-3 py-1 flex items-center gap-1.5"
                      >
                        {promo.used ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Использован</span>
                          </>
                        ) : (
                          <>
                            {getPromoIcon(promo.promo_type)}
                            <span>{getPromoTypeName(promo.promo_type)}</span>
                          </>
                        )}
                      </Badge>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-1.5 leading-tight">
                      {promo.name}
                    </h3>
                    {promo.description && (
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {promo.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Center: Promo Code */}
                  <div className="flex items-center justify-center px-4 border-l-2 border-r-2 border-dashed border-blue-200 dark:border-blue-700">
                    <div className="text-center">
                      <div className="text-xs md:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                        Промокод
                      </div>
                      <code className="font-mono font-bold text-xl md:text-2xl bg-white dark:bg-black/40 px-6 py-3 rounded-lg border-2 border-blue-400 dark:border-blue-500 inline-block shadow-sm">
                        {promo.code}
                      </code>
                    </div>
                  </div>
                  
                  {/* Right: Bonus & Time */}
                  <div className="flex flex-col items-center justify-center gap-3 min-w-[140px]">
                    {promo.promo_type === 'bonus' && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Бонус</div>
                        <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                          +{promo.bonus_amount} GT
                        </div>
                      </div>
                    )}
                    {promo.promo_type === 'discount_percent' && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Скидка</div>
                        <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                          -{promo.discount_value}%
                        </div>
                      </div>
                    )}
                    {promo.promo_type === 'discount_fixed' && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Скидка</div>
                        <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                          -{promo.discount_value} GT
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-full">
                      <Clock className="w-4 h-4" />
                      <span className="whitespace-nowrap">{formatExpiryDate(promo.expires_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden p-4 space-y-4">
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={promo.used ? "secondary" : "default"} 
                      className="text-xs px-2.5 py-1 flex items-center gap-1.5"
                    >
                      {promo.used ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Использован</span>
                        </>
                      ) : (
                        <>
                          {getPromoIcon(promo.promo_type)}
                          <span>{getPromoTypeName(promo.promo_type)}</span>
                        </>
                      )}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatExpiryDate(promo.expires_at)}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5 leading-tight">
                      {promo.name}
                    </h3>
                    {promo.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {promo.description}
                      </p>
                    )}
                  </div>

                  {/* Promo Code */}
                  <div className="bg-white dark:bg-black/30 p-4 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600">
                    <div className="text-xs text-muted-foreground mb-2 text-center font-medium uppercase tracking-wide">
                      Промокод
                    </div>
                    <code className="font-mono font-bold text-lg text-center bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded border border-blue-400 dark:border-blue-500 block">
                      {promo.code}
                    </code>
                  </div>

                  {/* Bonus */}
                  <div className="text-center">
                    {promo.promo_type === 'bonus' && (
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        +{promo.bonus_amount} GT
                      </div>
                    )}
                    {promo.promo_type === 'discount_percent' && (
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        -{promo.discount_value}%
                      </div>
                    )}
                    {promo.promo_type === 'discount_fixed' && (
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        -{promo.discount_value} GT
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};