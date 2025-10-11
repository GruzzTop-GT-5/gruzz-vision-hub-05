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
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Promo Code Input Section */}
      <Card className="card-steel overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-glow-soft">
              <Gift className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>Промокод</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-foreground/90">
              Введите промокод и получите бонусы!
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="promo-code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="ВВЕДИТЕ КОД"
                className="flex-1 font-mono text-center text-lg tracking-widest h-12 bg-card/50 border-2 border-border focus:border-primary transition-colors"
                maxLength={20}
                disabled={loading}
              />
              <Button 
                onClick={activatePromoCode}
                disabled={loading || !promoCode.trim()}
                className="h-12 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-lg hover:shadow-glow-soft transition-all"
              >
                {loading ? 'Проверка...' : 'Активировать'}
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="text-primary">💡</span> <strong className="text-foreground">Подсказка:</strong> Промокоды можно получить в Telegram группе, 
              через уведомления или от администраторов. Каждый промокод можно использовать только один раз.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Promos Section */}
      {!loadingPromos && activePromos.length > 0 && (
        <Card className="card-steel overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <span>Доступные промокоды</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePromos.map((promo, index) => (
              <div 
                key={index}
                className={`rounded-xl overflow-hidden transition-all ${
                  promo.used 
                    ? 'bg-muted/20 border-2 border-border/50' 
                    : 'bg-gradient-to-br from-card to-card/80 border-2 border-primary/20 shadow-lg'
                }`}
              >
                <div className="p-4">
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-[1fr,auto,auto] md:gap-6 md:items-center">
                    {/* Left: Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={promo.used ? "secondary" : "default"} className="text-xs font-medium">
                          {promo.used ? (
                            <><Check className="w-3 h-3 mr-1" /> Использован</>
                          ) : (
                            <>{getPromoIcon(promo.promo_type)} {getPromoTypeName(promo.promo_type)}</>
                          )}
                        </Badge>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-1.5 truncate">{promo.name}</h3>
                      {promo.description && (
                        <p className="text-sm text-muted-foreground leading-snug line-clamp-2">{promo.description}</p>
                      )}
                    </div>
                    
                    {/* Center: Code */}
                    <div className="flex items-center justify-center px-4">
                      <code className="font-mono font-bold text-base px-4 py-2 rounded-lg bg-background/50 border-2 border-primary/30 text-primary whitespace-nowrap">
                        {promo.code}
                      </code>
                    </div>
                    
                    {/* Right: Bonus & Expiry */}
                    <div className="flex flex-col items-end gap-2 min-w-[140px]">
                      {promo.promo_type === 'bonus' && (
                        <div className="text-2xl font-bold text-green-500 whitespace-nowrap">
                          +{promo.bonus_amount} GT
                        </div>
                      )}
                      {promo.promo_type === 'discount_percent' && (
                        <div className="text-2xl font-bold text-orange-500 whitespace-nowrap">
                          -{promo.discount_value}%
                        </div>
                      )}
                      {promo.promo_type === 'discount_fixed' && (
                        <div className="text-2xl font-bold text-orange-500 whitespace-nowrap">
                          -{promo.discount_value} GT
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatExpiryDate(promo.expires_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Badge variant={promo.used ? "secondary" : "default"} className="text-xs font-medium mb-2">
                          {promo.used ? (
                            <><Check className="w-3 h-3 mr-1" /> Использован</>
                          ) : (
                            <>{getPromoIcon(promo.promo_type)} {getPromoTypeName(promo.promo_type)}</>
                          )}
                        </Badge>
                        <h3 className="text-sm font-semibold text-foreground mb-1">{promo.name}</h3>
                        {promo.description && (
                          <p className="text-xs text-muted-foreground leading-snug">{promo.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {promo.promo_type === 'bonus' && (
                          <div className="text-xl font-bold text-green-500">
                            +{promo.bonus_amount} GT
                          </div>
                        )}
                        {promo.promo_type === 'discount_percent' && (
                          <div className="text-xl font-bold text-orange-500">
                            -{promo.discount_value}%
                          </div>
                        )}
                        {promo.promo_type === 'discount_fixed' && (
                          <div className="text-xl font-bold text-orange-500">
                            -{promo.discount_value} GT
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
                      <code className="font-mono font-bold text-sm px-3 py-1.5 rounded-lg bg-background/50 border border-primary/30 text-primary">
                        {promo.code}
                      </code>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="whitespace-nowrap">{formatExpiryDate(promo.expires_at)}</span>
                      </div>
                    </div>
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