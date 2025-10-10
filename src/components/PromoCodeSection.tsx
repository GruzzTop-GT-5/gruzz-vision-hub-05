import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { Gift, Sparkles } from 'lucide-react';

export const PromoCodeSection: React.FC = () => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

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

      const result = data as { success: boolean; bonus?: number; error?: string; name?: string };
      
      if (result.success) {
        toast({
          title: '🎉 Промокод активирован!',
          description: `Вы получили ${result.bonus} ₽ на баланс!`
        });
        setPromoCode('');
        
        // Refresh the page to update balance
        window.location.reload();
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

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          Промокод
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Введите промокод и получите бонус на баланс!</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="promo-code" className="text-sm font-medium">
            Промокод
          </Label>
          <div className="flex gap-2">
            <Input
              id="promo-code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Введите промокод"
              className="flex-1 font-mono text-center text-lg tracking-wider border-purple-200 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400"
              maxLength={20}
              disabled={loading}
            />
            <Button 
              onClick={activatePromoCode}
              disabled={loading || !promoCode.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
            >
              {loading ? 'Проверка...' : 'Активировать'}
            </Button>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
          <p className="text-xs text-purple-600 dark:text-purple-400 leading-relaxed">
            💡 <strong>Подсказка:</strong> Промокоды можно получить в нашей Telegram группе, 
            через уведомления в приложении или от администраторов. 
            Каждый промокод можно использовать только один раз.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};