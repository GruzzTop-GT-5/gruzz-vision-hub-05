import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Upload, Copy, Check, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { validateAmount, formatBalance, formatRubles } from '@/utils/currency';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

interface PaymentDetails {
  card_number?: string;
  cardholder?: string;
  account?: string;
  phone?: string;
  recipient?: string;
  payment_reference: string;
  amount: number;
  instructions: string;
}

export const TopUpModal = ({ isOpen, onClose, userId, onSuccess }: TopUpModalProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const { toast } = useToast();

  const paymentMethods = [
    { id: 'bank_card', name: 'Банковская карта', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
    { id: 'yoomoney', name: 'ЮMoney', icon: CreditCard, color: 'from-purple-500 to-purple-600' }
  ];

  const generatePaymentDetails = async (method: string) => {
    const amountNum = parseFloat(amount);
    const validation = validateAmount(amountNum);
    
    if (!validation.isValid) {
      toast({
        title: "Ошибка",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setSelectedPaymentMethod(method);
      const { data, error } = await supabase.rpc('generate_payment_details', {
        p_user_id: userId,
        p_amount: parseFloat(amount),
        p_method: method as any
      });

      if (error) throw error;

      setPaymentDetails(data as unknown as PaymentDetails);
    } catch (error) {
      console.error('Error generating payment details:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать реквизиты",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Скопировано",
        description: "Данные скопированы в буфер обмена"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 10MB",
          variant: "destructive"
        });
        return;
      }
      setProofImage(file);
    }
  };

  const submitTransaction = async (method: string, isManual: boolean = false) => {
    // Validate payment method
    if (!method || !['bank_card', 'yoomoney', 'ozon', 'manual_transfer'].includes(method)) {
      toast({
        title: "Ошибка",
        description: "Выберите способ оплаты",
        variant: "destructive"
      });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму",
        variant: "destructive"
      });
      return;
    }

    if (isManual && !proofImage) {
      toast({
        title: "Ошибка",
        description: "Загрузите скриншот перевода",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      let proofImageUrl = '';

      // Upload proof image if provided
      if (proofImage) {
        const fileExt = proofImage.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, proofImage);

        if (uploadError) throw uploadError;
        proofImageUrl = fileName;
      }

      // Mark promo as used if applied
      if (appliedPromo) {
        const { error: promoError } = await supabase
          .from('promo_code_usage')
          .insert({
            promo_code_id: appliedPromo.id,
            user_id: userId,
            bonus_received: 0 // For deposit promos, no direct bonus
          });

        if (promoError) throw promoError;

        // Update promo usage count
        await supabase
          .from('promo_codes')
          .update({ usage_count: (appliedPromo.usage_count || 0) + 1 })
          .eq('id', appliedPromo.id);
      }

      const finalAmount = calculateFinalAmount();
      
      // Create transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit' as Database['public']['Enums']['transaction_type'],
          amount: finalAmount,
          payment_method: method as 'bank_card' | 'yoomoney' | 'ozon' | 'manual_transfer',
          proof_image: proofImageUrl || null,
          payment_details: appliedPromo 
            ? { 
                ...paymentDetails, 
                promo_code: appliedPromo.code,
                original_amount: parseFloat(amount),
                discount_applied: parseFloat(amount) - finalAmount
              }
            : (paymentDetails ? JSON.parse(JSON.stringify(paymentDetails)) : null)
        });

      if (error) throw error;

      toast({
        title: "Заявка создана",
        description: isManual 
          ? "Ваша заявка отправлена на проверку администратору"
          : "Переведите средства по указанным реквизитам и загрузите скриншот"
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заявку",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setCheckingPromo(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Ошибка",
          description: "Промокод не найден или неактивен",
          variant: "destructive"
        });
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) <= new Date()) {
        toast({
          title: "Ошибка",
          description: "Промокод истёк",
          variant: "destructive"
        });
        return;
      }

      // Check if user already used it
      const { data: usageData } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code_id', data.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (usageData) {
        toast({
          title: "Ошибка",
          description: "Вы уже использовали этот промокод",
          variant: "destructive"
        });
        return;
      }

      // Check if it's a deposit promo (only for balance top-ups)
      if (data.promo_type !== 'bonus') {
        setAppliedPromo(data);
        toast({
          title: "Промокод применён!",
          description: `Скидка ${data.promo_type === 'discount_percent' ? data.discount_value + '%' : data.discount_value + ' GT'} будет применена`,
        });
      } else {
        toast({
          title: "Неверный тип промокода",
          description: "Этот промокод предназначен для прямого начисления бонусов, а не для пополнений",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking promo:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось проверить промокод",
        variant: "destructive"
      });
    } finally {
      setCheckingPromo(false);
    }
  };

  const calculateFinalAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    if (!appliedPromo) return baseAmount;

    if (appliedPromo.promo_type === 'discount_percent') {
      return baseAmount * (1 - appliedPromo.discount_value / 100);
    } else if (appliedPromo.promo_type === 'discount_fixed') {
      return Math.max(0, baseAmount - appliedPromo.discount_value);
    }
    return baseAmount;
  };

  const resetForm = () => {
    setAmount('');
    setPaymentDetails(null);
    setProofImage(null);
    setCopiedField(null);
    setSelectedPaymentMethod('');
    setPromoCode('');
    setAppliedPromo(null);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="h-8 w-8 p-0"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-steel-800 border-steel-600 data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
        <DialogHeader>
          <DialogTitle className="text-glow">Пополнение GT Coins</DialogTitle>
          <DialogDescription>
            Выберите способ пополнения баланса
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Сумма пополнения (GT Coins)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAppliedPromo(null); // Reset promo when amount changes
              }}
              placeholder="Введите сумму в GT Coins"
              min="1"
              step="0.01"
              className="input-steel"
            />
            {amount && parseFloat(amount) > 0 && (
              <div className="text-xs text-steel-400 space-y-1">
                {appliedPromo && (
                  <div className="p-2 bg-primary/10 border border-primary/20 rounded text-primary flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      <span>Промокод применён: {appliedPromo.code}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCode('');
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Удалить
                    </Button>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Исходная сумма: {formatRubles(parseFloat(amount))}</span>
                  <span>1 GT = 1 ₽</span>
                </div>
                {appliedPromo && (
                  <>
                    <div className="flex justify-between text-green-400">
                      <span>Скидка:</span>
                      <span>-{formatRubles(parseFloat(amount) - calculateFinalAmount())}</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary">
                      <span>К оплате:</span>
                      <span>{formatRubles(calculateFinalAmount())}</span>
                    </div>
                  </>
                )}
              </div>
            )}
            <p className="text-xs text-steel-400">
              Минимальная сумма: 100 GT • Максимальная: 50,000 GT
            </p>
          </div>

          {/* Promo Code Input */}
          <div className="space-y-2">
            <Label htmlFor="promo">Промокод (необязательно)</Label>
            <div className="flex gap-2">
              <Input
                id="promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="ВВЕДИТЕ ПРОМОКОД"
                className="input-steel font-mono"
                disabled={!!appliedPromo}
              />
              <Button
                onClick={checkPromoCode}
                disabled={!promoCode.trim() || checkingPromo || !!appliedPromo}
                variant="outline"
                className="whitespace-nowrap"
              >
                {checkingPromo ? 'Проверка...' : 'Применить'}
              </Button>
            </div>
            <p className="text-xs text-steel-400">
              Промокоды на скидку можно применить только при пополнении баланса
            </p>
          </div>

          {!paymentDetails ? (
            <div className="space-y-3">
              <Label>Способы пополнения</Label>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className="card-steel p-4 cursor-pointer hover:bg-steel-700 hover:scale-105 transition-all duration-300"
                  onClick={() => generatePaymentDetails(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${method.color} rounded-lg flex items-center justify-center`}>
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-steel-100">{method.name}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-steel-100">Реквизиты для перевода</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPaymentDetails(null);
                    setSelectedPaymentMethod('');
                    setProofImage(null);
                  }}
                  className="text-primary hover:text-primary-hover"
                >
                  Выбрать другой способ
                </Button>
              </div>

              <Card className="card-steel p-4 space-y-3">
                
                {paymentDetails.card_number && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-steel-400">Номер карты</p>
                      <p className="font-mono">2204 3204 7436 8950</p>
                    </div>
                    <CopyButton text={paymentDetails.card_number} field="card" />
                  </div>
                )}
                
                {paymentDetails.account && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-steel-400">Счет</p>
                      <p className="font-mono">{paymentDetails.account}</p>
                    </div>
                    <CopyButton text={paymentDetails.account} field="account" />
                  </div>
                )}
                
                {paymentDetails.phone && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-steel-400">Номер телефона</p>
                      <p className="font-mono">{paymentDetails.phone}</p>
                    </div>
                    <CopyButton text={paymentDetails.phone} field="phone" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-steel-400">Код платежа</p>
                    <p className="font-mono font-bold text-primary">{paymentDetails.payment_reference}</p>
                  </div>
                  <CopyButton text={paymentDetails.payment_reference} field="reference" />
                </div>
                
                <div className="pt-2 border-t border-steel-600">
                  <p className="text-xs text-steel-400">{paymentDetails.instructions}</p>
                </div>
              </Card>

              {/* Proof Upload */}
              <div className="space-y-2">
                <Label htmlFor="proof">Скриншот перевода</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="proof"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="input-steel"
                  />
                  <Upload className="w-5 h-5 text-steel-400" />
                </div>
                {proofImage && (
                  <p className="text-xs text-green-400">
                    Файл загружен: {proofImage.name}
                  </p>
                )}
              </div>

              <Button
                onClick={() => submitTransaction(selectedPaymentMethod)}
                disabled={loading || !proofImage || !selectedPaymentMethod}
                className="w-full btn-3d"
              >
                {loading ? "Отправка..." : "Подтвердить платеж"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};