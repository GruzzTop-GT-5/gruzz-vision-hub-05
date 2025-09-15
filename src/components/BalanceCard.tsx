import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Plus, History, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BalanceCardProps {
  userId: string;
  onTopUpClick: () => void;
  onHistoryClick: () => void;
}

interface UserProfile {
  balance: number;
}

export const BalanceCard = ({ userId, onTopUpClick, onHistoryClick }: BalanceCardProps) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setBalance(data.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить баланс",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="card-steel p-6">
        <div className="animate-pulse">
          <div className="h-16 bg-steel-700 rounded-lg"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-steel p-6 space-y-4">
      {/* Balance Display */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-electric-600 rounded-full flex items-center justify-center">
            <Coins className="w-6 h-6 text-steel-900" />
          </div>
          <div>
            <h3 className="text-sm text-steel-400">Баланс GT Coins</h3>
            <p className="text-2xl font-bold text-glow">{balance.toFixed(2)}</p>
          </div>
        </div>
        <div className="text-xs text-steel-500">
          ≈ {balance.toFixed(2)} ₽
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onTopUpClick}
          className="btn-3d text-sm py-2 bg-gradient-to-r from-primary to-electric-600 text-steel-900"
        >
          <Plus className="w-4 h-4 mr-1" />
          Пополнить
        </Button>
        <Button
          onClick={onHistoryClick}
          variant="outline"
          className="text-sm py-2 border-steel-600 hover:border-primary hover:bg-steel-700"
        >
          <History className="w-4 h-4 mr-1" />
          История
        </Button>
      </div>

      {/* Info */}
      <div className="pt-3 border-t border-steel-600">
        <div className="flex items-center justify-between text-xs text-steel-400">
          <span>1 GT Coin = 1 ₽</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Стабильный курс</span>
          </div>
        </div>
      </div>
    </Card>
  );
};