import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { AuthRequired } from '@/components/AuthRequired';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { CreateCompressorRentModal } from '@/components/CreateCompressorRentModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Truck, Wrench } from 'lucide-react';

interface CompressorRentData {
  hours: number;
  location: 'city' | 'suburb' | 'far';
  equipment: string[];
  paymentType: 'cash' | 'vat';
  datetime: string;
  totalHours: number;
  totalPrice: number;
}

export default function SpecialEquipment() {
  const { user, userRole, signOut } = useAuth();
  const [showCompressorModal, setShowCompressorModal] = useState(false);
  const [compressorData, setCompressorData] = useState<CompressorRentData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCompressorOrder = async () => {
    if (!compressorData) {
      toast({
        title: "Ошибка",
        description: "Заполните данные аренды компрессора",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create conversation for compressor rental
      const conversationData = await createConversation();

      if (conversationData) {
        // Send automated message with contact information
        const orderDateTime = compressorData.datetime 
          ? new Date(compressorData.datetime).toLocaleString('ru-RU', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Не указано';
          
        const contactMessage = `📞 Контакты для аренды компрессора на базе газель с машинистом:\n\n` +
          `Телефон: +7 911 552-27-27\n` +
          `Telegram: @OOO_DIAL\n\n` +
          `📋 Детали заказа:\n` +
          `• На какое время: ${orderDateTime}\n` +
          `• Время аренды: ${compressorData.totalHours} ч\n` +
          `• Локация: ${compressorData.location === 'city' ? 'В городе' : compressorData.location === 'suburb' ? 'Загородом' : 'Далеко (договорное время)'}\n\n` +
          `💰 Стоимость:\n` +
          `• Тип оплаты: ${compressorData.paymentType === 'cash' ? 'За наличку (1500 ₽/час)' : 'С НДС (1800 ₽/час)'}\n` +
          `• Итого к оплате: ${compressorData.totalPrice.toLocaleString('ru-RU')} ₽\n\n` +
          `⚠️ ВАЖНО: При звонке обязательно представьтесь:\n` +
          `"Здравствуйте! Заказываю технику через GruzzTop на ${orderDateTime}"\n\n` +
          `Это нужно, чтобы они понимали откуда вы и по какому заказу обращаетесь.`;

        const { data: messageData } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationData.id,
            sender_id: user?.id,
            content: contactMessage,
            message_type: 'text'
          })
          .select()
          .single();

        // Create notification for the user
        if (messageData) {
          await supabase
            .from('notifications')
            .insert({
              user_id: user?.id,
              type: 'equipment_order',
              title: 'Заказ спецтехники создан',
              content: 'Контакты для аренды компрессора отправлены в чат',
              conversation_id: conversationData.id,
              message_id: messageData.id
            });
        }

        toast({
          title: "Заказ создан!",
          description: "Контакты для аренды компрессора отправлены в чат.",
        });

        navigate('/chat-system');
      }
    } catch (error) {
      console.error('Error creating compressor order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
  };

  const createConversation = async () => {
    try {
      const { data: existingConversation, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('created_by', user?.id)
        .eq('type', 'chat')
        .eq('title', 'Аренда компрессора')
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingConversation) {
        return existingConversation;
      }

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          created_by: user?.id,
          participants: [user?.id],
          type: 'chat',
          title: 'Аренда компрессора',
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;

      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  return (
    <AuthRequired>
      <Layout user={user} userRole={userRole} onSignOut={signOut}>
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <BackButton />
              <h1 className="text-3xl font-bold text-glow">Спецтехника</h1>
              <div></div>
            </div>

            <Card className="card-steel p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-steel-100">Аренда спецтехники</h2>
                    <p className="text-sm text-steel-400">Закажите необходимую технику для ваших работ</p>
                  </div>
                </div>

                {/* Compressor Card */}
                <Card
                  className="border-steel-600/50 bg-steel-700/30 hover:bg-steel-700/40 transition-colors cursor-pointer p-4"
                  onClick={() => setShowCompressorModal(true)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-steel-100 mb-2">
                        Аренда Компрессора на базе газель с машинистом
                      </h3>
                      <p className="text-sm text-steel-400 mb-3">
                        Компрессор для пневмоинструмента с оборудованием: отбойные молотки, продувочные шланги
                      </p>
                      
                      {compressorData ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <span>✓ Заполнено</span>
                          </div>
                          <div className="text-xs text-steel-300 space-y-1">
                            <div>• Время аренды: {compressorData.totalHours} ч</div>
                            <div>• Стоимость: {compressorData.totalPrice.toLocaleString('ru-RU')} ₽</div>
                            <div>• Дата: {new Date(compressorData.datetime).toLocaleString('ru-RU', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</div>
                          </div>
                          <Button 
                            size="sm" 
                            className="mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompressorOrder();
                            }}
                          >
                            Заказать
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-steel-400">
                          Нажмите, чтобы заполнить данные заказа
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="text-sm text-steel-400 mt-6">
                  <p>💡 После заполнения формы вам будут отправлены контакты для связи в личные сообщения</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <CreateCompressorRentModal
          open={showCompressorModal}
          onOpenChange={setShowCompressorModal}
          initialData={compressorData}
          onConfirm={(data) => {
            setCompressorData(data);
            toast({
              title: "Данные сохранены!",
              description: "Теперь нажмите кнопку 'Заказать'",
            });
          }}
        />
      </Layout>
    </AuthRequired>
  );
}
