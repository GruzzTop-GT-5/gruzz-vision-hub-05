import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Send, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BroadcastMessagePanel = () => {
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'user' | 'executor'>('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent_count?: number; error?: string } | null>(null);
  const { toast } = useToast();

  const audienceOptions = {
    all: 'Все пользователи',
    user: 'Только пользователи',
    executor: 'Только исполнители'
  };

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Не авторизован');
      }

      const response = await supabase.functions.invoke('broadcast-message', {
        body: {
          message: message.trim(),
          target_audience: targetAudience
        }
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data;

      if (data.success) {
        setResult({
          success: true,
          sent_count: data.sent_count
        });

        toast({
          title: "Успешно!",
          description: `Сообщение отправлено ${data.sent_count} пользователям`,
        });

        // Clear form
        setMessage('');
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }

    } catch (error: any) {
      console.error('Broadcast error:', error);
      
      setResult({
        success: false,
        error: error.message || 'Произошла ошибка при отправке'
      });

      toast({
        title: "Ошибка",
        description: error.message || 'Не удалось отправить сообщения',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Megaphone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Массовая рассылка сообщений</CardTitle>
            <CardDescription>
              Отправить системное сообщение всем пользователям платформы
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audience selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Аудитория</label>
          <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(audienceOptions).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Текст сообщения</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите текст системного сообщения, которое получат все пользователи..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Сообщение будет отправлено от вашего имени с пометкой "Системное сообщение"
          </p>
        </div>

        {/* Result alert */}
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success
                ? `✅ Сообщение успешно отправлено ${result.sent_count} пользователям`
                : `❌ ${result.error}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Info alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Важно:</strong> Сообщение будет отправлено в личные чаты всех пользователей.
            Используйте эту функцию только для важных системных уведомлений.
          </AlertDescription>
        </Alert>

        {/* Send button */}
        <Button
          onClick={handleBroadcast}
          disabled={loading || !message.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Отправить всем пользователям
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
