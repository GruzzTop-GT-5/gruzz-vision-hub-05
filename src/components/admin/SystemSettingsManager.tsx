import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { handleError } from '@/lib/errorHandler';
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  DollarSign,
  Clock,
  Shield,
  Users,
  MessageSquare,
  Database,
  Bell,
  Zap
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  display_name: string;
  description: string | null;
  min_value: number | null;
  max_value: number | null;
  is_editable: boolean;
  updated_at: string;
  updated_by: string | null;
}

interface SettingUpdate {
  key: string;
  value: any;
  originalValue: any;
}

export const SystemSettingsManager: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, SettingUpdate>>(new Map());
  const [activeCategory, setActiveCategory] = useState('general');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      setSettings((data as SystemSetting[]) || []);

      // Если настроек нет, создаем базовые
      if (!data || data.length === 0) {
        await createDefaultSettings();
      }
    } catch (error) {
      handleError(error, { component: 'SystemSettingsManager', action: 'fetchSettings' });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    const defaultSettings = [
      // Общие настройки
      {
        setting_key: 'platform_name',
        setting_value: 'GruzzTop',
        setting_type: 'string',
        category: 'general',
        display_name: 'Название платформы',
        description: 'Отображаемое название платформы',
        is_editable: true
      },
      {
        setting_key: 'maintenance_mode',
        setting_value: false,
        setting_type: 'boolean',
        category: 'general',
        display_name: 'Режим обслуживания',
        description: 'Включить режим технического обслуживания',
        is_editable: true
      },
      {
        setting_key: 'user_registration_enabled',
        setting_value: true,
        setting_type: 'boolean',
        category: 'general',
        display_name: 'Регистрация пользователей',
        description: 'Разрешить регистрацию новых пользователей',
        is_editable: true
      },

      // Финансовые настройки
      {
        setting_key: 'min_order_amount',
        setting_value: 100,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Минимальная сумма заказа',
        description: 'Минимальная сумма для размещения заказа (₽)',
        min_value: 50,
        max_value: 1000,
        is_editable: true
      },
      {
        setting_key: 'max_order_amount',
        setting_value: 50000,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Максимальная сумма заказа',
        description: 'Максимальная сумма для размещения заказа (₽)',
        min_value: 1000,
        max_value: 100000,
        is_editable: true
      },
      {
        setting_key: 'commission_rate',
        setting_value: 10,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Комиссия платформы (%)',
        description: 'Процент комиссии с каждого заказа',
        min_value: 0,
        max_value: 50,
        is_editable: true
      },
      {
        setting_key: 'min_withdrawal_amount',
        setting_value: 500,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Минимальная сумма вывода',
        description: 'Минимальная сумма для вывода средств (₽)',
        min_value: 100,
        max_value: 5000,
        is_editable: true
      },

      // Настройки времени
      {
        setting_key: 'order_expiration_hours',
        setting_value: 24,
        setting_type: 'number',
        category: 'timing',
        display_name: 'Срок действия заказа (часы)',
        description: 'Через сколько часов заказ становится неактивным',
        min_value: 1,
        max_value: 168,
        is_editable: true
      },
      {
        setting_key: 'review_edit_time_minutes',
        setting_value: 60,
        setting_type: 'number',
        category: 'timing',
        display_name: 'Время редактирования отзыва (мин)',
        description: 'Сколько минут можно редактировать отзыв после создания',
        min_value: 5,
        max_value: 1440,
        is_editable: true
      },

      // Модерация
      {
        setting_key: 'auto_moderation_enabled',
        setting_value: true,
        setting_type: 'boolean',
        category: 'moderation',
        display_name: 'Автомодерация',
        description: 'Включить автоматическую модерацию контента',
        is_editable: true
      },
      {
        setting_key: 'max_reports_before_hide',
        setting_value: 3,
        setting_type: 'number',
        category: 'moderation',
        display_name: 'Жалоб до скрытия',
        description: 'Количество жалоб для автоматического скрытия контента',
        min_value: 1,
        max_value: 10,
        is_editable: true
      },
      {
        setting_key: 'spam_detection_enabled',
        setting_value: true,
        setting_type: 'boolean',
        category: 'moderation',
        display_name: 'Детекция спама',
        description: 'Включить автоматическое обнаружение спама',
        is_editable: true
      },

      // Уведомления
      {
        setting_key: 'email_notifications_enabled',
        setting_value: true,
        setting_type: 'boolean',
        category: 'notifications',
        display_name: 'Email уведомления',
        description: 'Отправлять уведомления по email',
        is_editable: true
      },
      {
        setting_key: 'telegram_notifications_enabled',
        setting_value: false,
        setting_type: 'boolean',
        category: 'notifications',
        display_name: 'Telegram уведомления',
        description: 'Отправлять уведомления в Telegram',
        is_editable: true
      }
    ];

    try {
      for (const setting of defaultSettings) {
        await supabase
          .from('system_settings')
          .insert({
            ...setting,
            setting_value: JSON.stringify(setting.setting_value)
          });
      }
      
      // Перезагружаем настройки
      fetchSettings();
      
      toast({
        title: "Успешно",
        description: "Созданы настройки по умолчанию"
      });
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingChange = (setting: SystemSetting, newValue: any) => {
    if (!setting.is_editable) return;

    // Валидация числовых значений
    if (setting.setting_type === 'number') {
      const numValue = parseFloat(newValue);
      if (isNaN(numValue)) return;
      
      if (setting.min_value !== null && numValue < setting.min_value) {
        toast({
          title: "Ошибка",
          description: `Значение не может быть меньше ${setting.min_value}`,
          variant: "destructive"
        });
        return;
      }
      
      if (setting.max_value !== null && numValue > setting.max_value) {
        toast({
          title: "Ошибка",
          description: `Значение не может быть больше ${setting.max_value}`,
          variant: "destructive"
        });
        return;
      }
      
      newValue = numValue;
    }

    const currentValue = typeof setting.setting_value === 'string' 
      ? JSON.parse(setting.setting_value) 
      : setting.setting_value;

    const newPendingChanges = new Map(pendingChanges);
    if (JSON.stringify(newValue) === JSON.stringify(currentValue)) {
      newPendingChanges.delete(setting.setting_key);
    } else {
      newPendingChanges.set(setting.setting_key, {
        key: setting.setting_key,
        value: newValue,
        originalValue: currentValue
      });
    }
    setPendingChanges(newPendingChanges);
  };

  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) return;

    setSaving(true);
    try {
      const updates = Array.from(pendingChanges.values());
      
      for (const update of updates) {
        await supabase
          .from('system_settings')
          .update({
            setting_value: JSON.stringify(update.value),
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', update.key);
      }

      // Логируем изменения
      await supabase.rpc('log_security_event', {
        p_event_type: 'system_settings_update',
        p_user_id: user?.id,
        p_details: {
          changed_settings: updates.map(u => ({
            key: u.key,
            old_value: u.originalValue,
            new_value: u.value
          }))
        },
        p_severity: 'warning'
      });

      toast({
        title: "Успешно",
        description: `Сохранено ${updates.length} настроек`
      });

      setPendingChanges(new Map());
      fetchSettings();
    } catch (error) {
      handleError(error, { component: 'SystemSettingsManager', action: 'saveAllChanges' });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const currentValue = typeof setting.setting_value === 'string' 
      ? JSON.parse(setting.setting_value) 
      : setting.setting_value;
    
    const pendingChange = pendingChanges.get(setting.setting_key);
    const displayValue = pendingChange?.value ?? currentValue;

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <Switch
            checked={displayValue}
            onCheckedChange={(checked) => handleSettingChange(setting, checked)}
            disabled={!setting.is_editable}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={displayValue}
            onChange={(e) => handleSettingChange(setting, e.target.value)}
            disabled={!setting.is_editable}
            min={setting.min_value || undefined}
            max={setting.max_value || undefined}
            className="w-32"
          />
        );

      case 'string':
        return setting.description?.includes('большой текст') ? (
          <Textarea
            value={displayValue}
            onChange={(e) => handleSettingChange(setting, e.target.value)}
            disabled={!setting.is_editable}
            rows={3}
          />
        ) : (
          <Input
            value={displayValue}
            onChange={(e) => handleSettingChange(setting, e.target.value)}
            disabled={!setting.is_editable}
          />
        );

      default:
        return (
          <Input
            value={JSON.stringify(displayValue)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(setting, parsed);
              } catch {
                // Ignore invalid JSON
              }
            }}
            disabled={!setting.is_editable}
          />
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'general': <Settings className="w-5 h-5" />,
      'financial': <DollarSign className="w-5 h-5" />,
      'timing': <Clock className="w-5 h-5" />,
      'moderation': <Shield className="w-5 h-5" />,
      'notifications': <Bell className="w-5 h-5" />,
      'security': <Shield className="w-5 h-5" />
    };
    return icons[category as keyof typeof icons] || <Settings className="w-5 h-5" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'general': 'Общие',
      'financial': 'Финансы',
      'timing': 'Время',
      'moderation': 'Модерация',
      'notifications': 'Уведомления',
      'security': 'Безопасность'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const categories = [...new Set(settings.map(s => s.category))];
  const filteredSettings = settings.filter(s => s.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold text-steel-100">Системные настройки</h2>
          {pendingChanges.size > 0 && (
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              {pendingChanges.size} изменений
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {pendingChanges.size > 0 && (
            <Button onClick={saveAllChanges} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить все'}
            </Button>
          )}
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Предупреждения */}
      <Card className="card-steel-lighter p-4 border-yellow-500/20">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-400">Важно!</h3>
            <p className="text-steel-300 text-sm">
              Изменение системных настроек может повлиять на работу всей платформы. 
              Будьте осторожны и тестируйте изменения перед применением в продакшене.
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full auto-cols-fr grid-flow-col bg-steel-800">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex items-center space-x-2 px-4">
              {getCategoryIcon(category)}
              <span className="hidden sm:inline">{getCategoryLabel(category)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredSettings.length === 0 ? (
                  <Card className="card-steel-lighter p-6 text-center">
                    <Info className="w-12 h-12 text-steel-400 mx-auto mb-2" />
                    <p className="text-steel-300">Настройки в этой категории не найдены</p>
                  </Card>
                ) : (
                  filteredSettings.map((setting) => {
                    const pendingChange = pendingChanges.get(setting.setting_key);
                    const hasChanges = pendingChange !== undefined;
                    
                    return (
                      <Card 
                        key={setting.id} 
                        className={`card-steel-lighter p-4 ${hasChanges ? 'border-yellow-500/50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-steel-100">
                                {setting.display_name}
                              </h3>
                              {hasChanges && (
                                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                  Изменено
                                </Badge>
                              )}
                              {!setting.is_editable && (
                                <Badge variant="outline" className="text-steel-400">
                                  Только чтение
                                </Badge>
                              )}
                            </div>
                            {setting.description && (
                              <p className="text-steel-400 text-sm mb-2">
                                {setting.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-steel-500">
                              <span>Ключ: {setting.setting_key}</span>
                              <span>Тип: {setting.setting_type}</span>
                              {setting.min_value !== null && (
                                <span>Мин: {setting.min_value}</span>
                              )}
                              {setting.max_value !== null && (
                                <span>Макс: {setting.max_value}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {renderSettingInput(setting)}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};