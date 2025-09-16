import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Smartphone, Upload, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

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
  const { toast } = useToast();

  const paymentMethods = [
    { id: 'bank_card', name: 'Банковская карта', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
    { id: 'yoomoney', name: 'ЮMoney', icon: CreditCard, color: 'from-purple-500 to-purple-600' },
    { id: 'ozon', name: 'Ozon', icon: Smartphone, color: 'from-orange-500 to-orange-600' }
  ];

  const generatePaymentDetails = async (method: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму пополнения",
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

      // Create transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit' as Database['public']['Enums']['transaction_type'],
          amount: parseFloat(amount),
          payment_method: method as 'bank_card' | 'yoomoney' | 'ozon' | 'manual_transfer',
          proof_image: proofImageUrl || null,
          payment_details: paymentDetails ? JSON.parse(JSON.stringify(paymentDetails)) : null
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

  const resetForm = () => {
    setAmount('');
    setPaymentDetails(null);
    setProofImage(null);
    setCopiedField(null);
    setSelectedPaymentMethod('');
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
      <DialogContent className="max-w-md bg-steel-800 border-steel-600">
        <DialogHeader>
          <DialogTitle className="text-glow">Пополнение GT Coins</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="direct" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Прямой платеж</TabsTrigger>
            <TabsTrigger value="manual">Ручной перевод</TabsTrigger>
          </TabsList>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Сумма пополнения (GT)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Введите сумму"
              min="1"
              className="input-steel"
            />
            <p className="text-xs text-steel-400">
              Минимальная сумма: 100 GT • Максимальная: 50,000 GT
            </p>
          </div>

          <TabsContent value="direct" className="space-y-4">
            {!paymentDetails ? (
              <div className="space-y-3">
                <Label>Выберите способ оплаты:</Label>
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className="card-steel p-4 cursor-pointer hover:border-primary transition-colors"
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
                <Card className="card-steel p-4 space-y-3">
                  <h4 className="font-medium text-steel-100">Реквизиты для перевода:</h4>
                  
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
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <Card className="card-steel p-4">
                <h4 className="font-medium text-steel-100 mb-3">Реквизиты для ручного пополнения:</h4>
                
                <div className="space-y-4">
                  {/* Юмани карта */}
                  <div className="border border-steel-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-purple-400">ЮMoney</h5>
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-steel-400">Карта:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">2204 1201 2644 4419</span>
                          <CopyButton text="2204120126444419" field="yoomoney-card" />
                        </div>
                      </div>
                      <p className="text-xs text-steel-400">
                        Переводите с указанием вашего номера телефона в комментарии
                      </p>
                    </div>
                  </div>

                </div>
                
                <div className="mt-4 p-3 bg-steel-900/50 rounded-lg">
                  <p className="text-xs text-steel-300">
                    <strong>Важно:</strong> Обязательно укажите ваш номер телефона в комментарии к переводу для быстрой идентификации платежа.
                  </p>
                </div>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="manual-proof">Скриншот перевода</Label>
                <Input
                  id="manual-proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="input-steel"
                />
                {proofImage && (
                  <p className="text-xs text-green-400">
                    Файл загружен: {proofImage.name}
                  </p>
                )}
              </div>

              <Button
                onClick={() => submitTransaction('manual_transfer', true)}
                disabled={loading || !proofImage || !amount}
                className="w-full btn-3d"
              >
                {loading ? "Отправка..." : "Отправить на проверку"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};