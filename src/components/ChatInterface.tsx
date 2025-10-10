import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, validateFileUpload } from '@/utils/security';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  File, 
  Download,
  Phone,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  is_edited: boolean;
  is_deleted: boolean;
}

interface Conversation {
  id: string;
  type: string;
  title: string | null;
  participants: string[];
  status: string;
  last_message_at: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  onClose?: () => void;
}

export const ChatInterface = ({ conversationId, onClose }: ChatInterfaceProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversation();
    fetchMessages();
    subscribeToMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Ошибка",
          description: "Разговор не найден",
          variant: "destructive"
        });
        return;
      }
      
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить чат",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!user?.id || (!newMessage.trim() && !selectedFile) || isSending) return;

    setIsSending(true);

    try {
      let messageData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        message_type: 'text'
      };

      if (selectedFile) {
        // Upload file first
        const fileValidation = validateFileUpload(selectedFile);
        if (!fileValidation.isValid) {
          toast({
            title: "Ошибка файла",
            description: fileValidation.error,
            variant: "destructive"
          });
          return;
        }

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `chat-files/${conversationId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);

        messageData = {
          ...messageData,
          message_type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          content: newMessage.trim() || null
        };
      } else {
        messageData.content = sanitizeInput(newMessage.trim());
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateFileUpload(file);
      if (validation.isValid) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Ошибка файла",
          description: validation.error,
          variant: "destructive"
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteConversation = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'deleted' })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Чат удален",
        description: "Чат успешно удален"
      });

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чат",
        variant: "destructive"
      });
    }
  };

  const getMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ru });
  };

  const parseStructuredMessage = (content: string) => {
    const phoneMatch = content.match(/Телефон:\s*([\+\d\s\-]+)/);
    const telegramMatch = content.match(/Telegram:\s*(@[\w_]+)/);
    const durationMatch = content.match(/Время аренды:\s*([\dа-я\s]+)/i);
    const locationMatch = content.match(/Локация:\s*(.+?)(?=\n|$)/);
    const titleMatch = content.match(/^📞\s*(.+?):/);
    
    if (phoneMatch || telegramMatch || durationMatch) {
      return {
        isStructured: true,
        title: titleMatch?.[1] || null,
        phone: phoneMatch?.[1]?.trim() || null,
        telegram: telegramMatch?.[1] || null,
        duration: durationMatch?.[1]?.trim() || null,
        location: locationMatch?.[1]?.trim() || null,
        rawContent: content
      };
    }
    
    return { isStructured: false, rawContent: content };
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    const structuredData = message.content ? parseStructuredMessage(message.content) : null;
    
    return (
      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
          <div
            className={`rounded-xl p-4 shadow-lg ${
              isOwnMessage
                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                : 'bg-gradient-to-br from-steel-700 to-steel-800 text-steel-50 border border-steel-600'
            }`}
          >
            {/* File/Image content */}
            {message.file_url && (
              <div className="mb-3">
                {message.message_type === 'image' ? (
                  <img
                    src={message.file_url}
                    alt={message.file_name || 'Изображение'}
                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.file_url!, '_blank')}
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                    <File className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">{message.file_name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-white/10"
                      onClick={() => window.open(message.file_url!, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Structured content */}
            {message.content && structuredData?.isStructured ? (
              <div className="space-y-3">
                {structuredData.title && (
                  <div className="flex items-center space-x-2 pb-2 border-b border-current/20">
                    <Phone className="w-4 h-4" />
                    <h4 className="font-semibold">{structuredData.title}</h4>
                  </div>
                )}
                
                {structuredData.phone && (
                  <div className="flex items-start space-x-2">
                    <span className="text-xs opacity-70 min-w-[80px]">Телефон:</span>
                    <a href={`tel:${structuredData.phone}`} className="font-mono text-sm font-medium hover:underline">
                      {structuredData.phone}
                    </a>
                  </div>
                )}
                
                {structuredData.telegram && (
                  <div className="flex items-start space-x-2">
                    <span className="text-xs opacity-70 min-w-[80px]">Telegram:</span>
                    <a href={`https://t.me/${structuredData.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm font-medium hover:underline">
                      {structuredData.telegram}
                    </a>
                  </div>
                )}
                
                {(structuredData.duration || structuredData.location) && (
                  <div className="pt-2 border-t border-current/20 space-y-2">
                    <p className="text-xs font-semibold opacity-90">Детали заказа:</p>
                    {structuredData.duration && (
                      <div className="flex items-start space-x-2">
                        <span className="text-xs opacity-70">•</span>
                        <span className="text-sm">Время аренды: <strong>{structuredData.duration}</strong></span>
                      </div>
                    )}
                    {structuredData.location && (
                      <div className="flex items-start space-x-2">
                        <span className="text-xs opacity-70">•</span>
                        <span className="text-sm">Локация: <strong>{structuredData.location}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Regular text content */
              message.content && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              )
            )}
          </div>
          
          <div className={`flex items-center mt-1.5 text-xs text-steel-400 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span>{getMessageTime(message.created_at)}</span>
            {message.is_edited && <span className="ml-2 opacity-70">(изменено)</span>}
          </div>
        </div>
        
        {!isOwnMessage && (
          <Avatar className="w-8 h-8 mr-3 order-1">
            <AvatarFallback className="bg-steel-600 text-steel-200">
              {message.sender_id.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="card-steel h-96 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-steel-300">Загрузка чата...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-steel flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-steel-600">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-steel-100">
              {conversation?.title || 
               (conversation?.type === 'support' ? 'Техподдержка' : 'Чат')}
            </h3>
            {conversation?.type === 'support' && (
              <Badge variant="outline" className="text-primary border-primary/20">
                Поддержка
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-600 cursor-pointer"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить чат
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-steel-400 py-8">
              <p>Пока нет сообщений</p>
              <p className="text-sm">Начните разговор!</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="px-4 py-2 border-t border-steel-600">
            <div className="flex items-center space-x-2 p-2 bg-steel-700 rounded">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <File className="w-4 h-4" />
              )}
              <span className="flex-1 text-sm">{selectedFile.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedFile(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-steel-600">
          <div className="flex items-end space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="mb-1"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              disabled={isSending}
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || isSending}
              size="sm"
              className="mb-1"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить чат?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот чат? Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConversation}
              className="bg-red-500 hover:bg-red-600"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};