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
import { ScrollArea } from '@/components/ui/scroll-area';

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
      if (diffHours === 1) return 'Истекает через 1 час';
      if (diffHours < 5) return `Истекает через ${diffHours} часа`;
      return `Истекает через ${diffHours} часов`;
    } else if (diffDays === 1) {
      return 'Истекает завтра';
    } else {
      // Russian pluralization rules
      if (diffDays % 10 === 1 && diffDays % 100 !== 11) {
        return `Истекает через ${diffDays} день`;
      } else if (diffDays % 10 >= 2 && diffDays % 10 <= 4 && (diffDays % 100 < 10 || diffDays % 100 >= 20)) {
        return `Истекает через ${diffDays} дня`;
      } else {
        return `Истекает через ${diffDays} дней`;
      }
    }
  };

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Promo Code Input Section */}
      <Card className="card-steel overflow-hidden">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>Промокод</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-foreground/90">
              Введите промокод и получите бонусы!
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Input
              id="promo-code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="ВВЕДИТЕ КОД"
              className="w-full font-mono text-center text-sm tracking-widest h-10 bg-card/50 border-2 border-border focus:border-primary transition-colors"
              maxLength={20}
              disabled={loading}
            />
            <Button 
              onClick={activatePromoCode}
              disabled={loading || !promoCode.trim()}
              className="w-full h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium text-sm shadow-lg hover:shadow-glow-soft transition-all"
            >
              {loading ? 'Проверка...' : 'Активировать'}
            </Button>
          </div>

          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              <span className="text-primary">💡</span> <strong className="text-foreground">Подсказка:</strong> Промокоды можно получить в Telegram группе, 
              через уведомления или от администраторов. Каждый промокод можно использовать только один раз.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Promos Section */}
      {!loadingPromos && activePromos.length > 0 && (
        <Card className="card-steel overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Доступные промокоды</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2.5">
                {activePromos.map((promo, index) => (
                  <div 
                    key={index}
                    className={`rounded-lg overflow-hidden transition-all ${
                      promo.used 
                        ? 'bg-muted/20 border border-border/50' 
                        : 'bg-gradient-to-br from-card to-card/80 border border-primary/20 shadow-md'
                    }`}
                  >
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Badge variant={promo.used ? "secondary" : "default"} className="text-[10px] font-medium mb-1.5 h-5">
                            {promo.used ? (
                              <><Check className="w-2.5 h-2.5 mr-1" /> Использован</>
                            ) : (
                              <>{getPromoIcon(promo.promo_type)} {getPromoTypeName(promo.promo_type)}</>
                            )}
                          </Badge>
                          <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{promo.name}</h3>
                          {promo.description && (
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{promo.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {promo.promo_type === 'bonus' && (
                            <div className="text-lg font-bold text-green-500">
                              +{promo.bonus_amount} GT
                            </div>
                          )}
                          {promo.promo_type === 'discount_percent' && (
                            <div className="text-lg font-bold text-orange-500">
                              -{promo.discount_value}%
                            </div>
                          )}
                          {promo.promo_type === 'discount_fixed' && (
                            <div className="text-lg font-bold text-orange-500">
                              -{promo.discount_value} GT
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                        <code className="font-mono font-bold text-sm px-3 py-1.5 rounded-md bg-background/50 border border-primary/30 text-primary w-fit">
                          {promo.code}
                        </code>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{formatExpiryDate(promo.expires_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};