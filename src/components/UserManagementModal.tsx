import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserRatingDisplay } from '@/components/UserRatingDisplay';
import { 
  User,
  Phone,
  Mail,
  Calendar,
  Wallet,
  Settings,
  Ban,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Shield,
  Award,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserData {
  id: string;
  phone: string | null;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  role: string;
  rating: number | null;
  balance: number;
  created_at: string;
  age: number | null;
  citizenship: string | null;
  qualification: string[] | null;
}

interface UserManagementModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export const UserManagementModal = ({ user, isOpen, onClose, onUserUpdate }: UserManagementModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // User data editing
  const [editedUser, setEditedUser] = useState<Partial<UserData>>({});
  
  // Balance management
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'subtract'>('add');
  const [balanceReason, setBalanceReason] = useState('');
  
  // Rating management
  const [newRating, setNewRating] = useState('');
  const [ratingReason, setRatingReason] = useState('');
  
  // Ban management
  const [banType, setBanType] = useState<'order_mute' | 'payment_mute' | 'account_block'>('order_mute');
  const [banDuration, setBanDuration] = useState('60');
  const [banReason, setBanReason] = useState('');
  
  // Admin actions
  const [adminNote, setAdminNote] = useState('');
  const [userBans, setUserBans] = useState<any[]>([]);
  
  // Quick chat
  const [quickMessage, setQuickMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedUser(user);
      fetchUserBans();
      checkExistingConversation();
    }
  }, [user]);

  const checkExistingConversation = async () => {
    if (!user) return;
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) return;

      const { data } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [currentUser.data.user.id, user.id])
        .eq('type', 'chat')
        .maybeSingle();

      if (data) {
        setConversationId(data.id);
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
    }
  };

  const fetchUserBans = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
        
      if (error) {
        // If the table doesn't exist, just set empty array
        if (error.code === 'PGRST200') {
          setUserBans([]);
          return;
        }
        throw error;
      }
      setUserBans(data || []);
    } catch (error) {
      console.error('Error fetching user bans:', error);
      setUserBans([]);
    }
  };

  const handleUpdateUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Only update allowed fields to avoid role conflicts
      const updateData = {
        display_name: editedUser.display_name,
        full_name: editedUser.full_name,
        bio: editedUser.bio,
        phone: editedUser.phone
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_logs')
        .insert({
          action: 'update_user',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          target_id: user.id,
          target_type: 'user'
        });

      toast({
        title: "Успешно",
        description: "Данные пользователя обновлены"
      });

      setEditMode(false);
      onUserUpdate();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceOperation = async () => {
    if (!user || !balanceAmount.trim() || !balanceReason.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const currentUser = await supabase.auth.getUser();
      const transactionType = balanceOperation === 'add' ? 'deposit' : 'withdrawal';
      
      // Create transaction with completed status - trigger will update balance
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: transactionType,
          amount: amount,
          status: 'completed',
          admin_notes: balanceReason,
          processed_by: currentUser.data.user?.id
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify balance was updated
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'balance_update',
          title: `Баланс ${balanceOperation === 'add' ? 'пополнен' : 'списан'}`,
          content: `${balanceOperation === 'add' ? 'Начислено' : 'Списано'} ${amount} GT Coins. Причина: ${balanceReason}. Текущий баланс: ${updatedProfile.balance.toFixed(2)} GT`
        });

      toast({
        title: "Успешно",
        description: `Баланс обновлен. Новый баланс: ${updatedProfile.balance.toFixed(2)} GT Coins`
      });

      setBalanceAmount('');
      setBalanceReason('');
      onUserUpdate();
    } catch (error: any) {
      console.error('Error updating balance:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить баланс",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!user || !banReason.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите причину бана",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const durationMinutes = parseInt(banDuration);
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: user.id,
          ban_type: banType,
          duration_minutes: durationMinutes,
          reason: banReason,
          issued_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'user_ban',
          title: 'Ограничение активности',
          content: `Наложено ограничение: ${getBanTypeLabel(banType)}. Причина: ${banReason}. Действует до: ${format(expiresAt, 'dd.MM.yyyy HH:mm', { locale: ru })}`
        });

      toast({
        title: "Успешно",
        description: "Ограничение наложено"
      });

      setBanReason('');
      fetchUserBans();
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось наложить ограничение",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async () => {
    if (!user || !newRating.trim() || !ratingReason.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive"
      });
      return;
    }

    const rating = parseFloat(newRating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      toast({
        title: "Ошибка",
        description: "Рейтинг должен быть от 0 до 5",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const currentUser = await supabase.auth.getUser();
      
      // Use RPC function to update rating with proper permissions
      const { data, error: rpcError } = await supabase
        .rpc('admin_update_user_rating', {
          p_user_id: user.id,
          p_new_rating: rating,
          p_reason: ratingReason,
          p_admin_id: currentUser.data.user?.id
        });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; error?: string; old_rating?: number; new_rating: number };
      
      if (!result?.success) {
        throw new Error(result?.error || 'Не удалось обновить рейтинг');
      }

      toast({
        title: "Успешно",
        description: `Рейтинг изменен с ${result.old_rating?.toFixed(2) || '0.00'} на ${result.new_rating.toFixed(2)}`
      });

      setNewRating('');
      setRatingReason('');
      onUserUpdate();
    } catch (error: any) {
      console.error('Error updating rating:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить рейтинг",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast({
          title: "Ошибка",
          description: "Вы не авторизованы",
          variant: "destructive"
        });
        return;
      }

      // Проверяем, есть ли уже разговор между администратором и пользователем
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [currentUser.data.user.id, user.id])
        .eq('type', 'chat')
        .single();

      if (existingConversation) {
        // Открываем существующий чат
        navigate(`/chat?conversation=${existingConversation.id}`);
        onClose();
        return;
      }

      // Создаем новый разговор
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          type: 'chat',
          participants: [currentUser.data.user.id, user.id],
          created_by: currentUser.data.user.id,
          title: `Чат с ${user.display_name || user.full_name || user.phone}`
        })
        .select()
        .single();

      if (error) throw error;

      // Отправляем приветственное сообщение от администратора
      await supabase
        .from('messages')
        .insert({
          conversation_id: newConversation.id,
          sender_id: currentUser.data.user.id,
          content: `Здравствуйте! Администратор связался с вами.`,
          message_type: 'text'
        });

      toast({
        title: "Успешно",
        description: "Чат создан"
      });

      // Переходим в чат
      navigate(`/chat?conversation=${newConversation.id}`);
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать чат",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuickMessage = async () => {
    if (!user || !quickMessage.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите сообщение",
        variant: "destructive"
      });
      return;
    }

    setSendingMessage(true);
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Not authenticated');

      let chatConversationId = conversationId;

      // Создаем разговор, если его нет
      if (!chatConversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            type: 'chat',
            participants: [currentUser.data.user.id, user.id],
            created_by: currentUser.data.user.id,
            title: `Чат с ${user.display_name || user.full_name || user.phone}`
          })
          .select()
          .single();

        if (convError) throw convError;
        chatConversationId = newConversation.id;
        setConversationId(chatConversationId);
      }

      // Отправляем сообщение
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: chatConversationId,
          sender_id: currentUser.data.user.id,
          content: quickMessage,
          message_type: 'text'
        });

      if (messageError) throw messageError;

      toast({
        title: "Успешно",
        description: "Сообщение отправлено"
      });

      setQuickMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getBanTypeLabel = (type: string) => {
    switch (type) {
      case 'order_mute': return 'Запрет на заказы';
      case 'payment_mute': return 'Запрет на платежи';
      case 'account_block': return 'Блокировка аккаунта';
      default: return type;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'admin': return 'text-primary bg-primary/10 border-primary/20';
      case 'moderator': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'support': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-steel-400 bg-steel-400/10 border-steel-400/20';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span className="font-semibold">Управление пользователем</span>
              <Badge className={getRoleColor(user.role)}>
                {user.role === 'system_admin' ? 'Системный администратор' :
                 user.role === 'admin' ? 'Администратор' :
                 user.role === 'moderator' ? 'Модератор' :
                 user.role === 'support' ? 'Поддержка' :
                 'Пользователь'}
              </Badge>
            </div>
            <Button
              onClick={handleOpenChat}
              disabled={loading}
              className="flex items-center gap-2"
              variant="default"
            >
              <MessageSquare className="w-4 h-4" />
              Открыть чат
            </Button>
          </div>
          <DialogDescription>
            Просмотр и редактирование данных пользователя
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-4">
            {/* User Information - компактная версия */}
            <Card className="card-steel-lighter p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-steel-100">Информация о пользователе</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <X className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-steel-400">Телефон</label>
                    {editMode ? (
                      <Input
                        value={editedUser.phone || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <p className="text-steel-100">{user.phone || 'Не указан'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs text-steel-400">Отображаемое имя</label>
                    {editMode ? (
                      <Input
                        value={editedUser.display_name || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, display_name: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <p className="text-steel-100">{user.display_name || 'Не указано'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-steel-400">Рейтинг</label>
                    <UserRatingDisplay userId={user.id} showDetails={false} />
                  </div>
                  
                  <div>
                    <label className="text-xs text-steel-400">Баланс</label>
                    <p className="text-steel-100 font-medium flex items-center text-sm">
                      <Wallet className="w-3 h-3 mr-1" />
                      {user.balance.toFixed(2)} GT
                    </p>
                  </div>
                </div>

                {editMode && (
                  <Button
                    onClick={handleUpdateUser}
                    disabled={loading}
                    className="w-full h-8 text-sm"
                    size="sm"
                  >
                    <Save className="w-3 h-3 mr-2" />
                    Сохранить изменения
                  </Button>
                )}
              </div>
            </Card>

            {/* Управление балансом - компактно */}
            <Card className="card-steel-lighter p-4">
              <h3 className="text-base font-semibold text-steel-100 mb-3">Управление балансом</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant={balanceOperation === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBalanceOperation('add')}
                    className="flex-1 h-8 text-xs"
                  >
                    Начислить
                  </Button>
                  <Button
                    variant={balanceOperation === 'subtract' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBalanceOperation('subtract')}
                    className="flex-1 h-8 text-xs"
                  >
                    Списать
                  </Button>
                </div>
                
                <Input
                  type="number"
                  placeholder="Сумма"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="h-8 text-sm"
                />
                
                <Textarea
                  placeholder="Причина операции (обязательно)"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
                
                <Button
                  onClick={handleBalanceOperation}
                  disabled={loading || !balanceAmount.trim() || !balanceReason.trim()}
                  className="w-full h-8 text-sm"
                  size="sm"
                >
                  Начислить средства
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Быстрый чат внизу */}
        <div className="border-t border-border mt-4 pt-4">
          <h3 className="text-sm font-semibold text-steel-100 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Быстрое сообщение пользователю
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Введите сообщение..."
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuickMessage();
                }
              }}
              className="h-9 text-sm"
              disabled={sendingMessage}
            />
            <Button
              onClick={handleSendQuickMessage}
              disabled={sendingMessage || !quickMessage.trim()}
              size="sm"
              className="h-9 px-3"
            >
              {sendingMessage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-steel-400 mt-2">
            {conversationId ? '✓ Чат уже создан' : 'Чат будет создан автоматически при отправке'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};