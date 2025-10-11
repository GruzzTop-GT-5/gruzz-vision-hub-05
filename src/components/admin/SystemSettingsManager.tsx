import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, AlertTriangle, Info, Coins, 
  Shield, Users, Bell, HelpCircle, ShieldCheck, Clock, MessageSquare, Database, Zap
 } from 'lucide-react';
import { PromoCodeManagement } from './PromoCodeManagement';
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
        description: 'Отображаемое название платформы в интерфейсе',
        is_editable: true
      },
      {
        setting_key: 'maintenance_mode',
        setting_value: false,
        setting_type: 'boolean',
        category: 'general',
        display_name: 'Режим обслуживания',
        description: 'Включить режим технического обслуживания (пользователи не смогут пользоваться платформой)',
        is_editable: true
      },
      {
        setting_key: 'user_registration_enabled',
        setting_value: true,
        setting_type: 'boolean',
        category: 'general',
        display_name: 'Регистрация пользователей',
        description: 'Разрешить регистрацию новых пользователей на платформе',
        is_editable: true
      },
      {
        setting_key: 'welcome_message',
        setting_value: 'Добро пожаловать на GruzzTop! Найдите исполнителей для любых задач.',
        setting_type: 'string',
        category: 'general',
        display_name: 'Приветственное сообщение',
        description: 'Сообщение для новых пользователей при регистрации',
        is_editable: true
      },

      // Финансовые настройки (GT коины)
      {
        setting_key: 'min_deposit_amount',
        setting_value: 100,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Минимальное пополнение GT коинов (₽)',
        description: 'Минимальная сумма для пополнения баланса (1 GT коин = 1 рубль)',
        min_value: 50,
        max_value: 1000,
        is_editable: true
      },
      {
        setting_key: 'max_deposit_amount',
        setting_value: 100000,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Максимальное пополнение GT коинов (₽)',
        description: 'Максимальная сумма для единовременного пополнения баланса',
        min_value: 1000,
        max_value: 500000,
        is_editable: true
      },
      {
        setting_key: 'min_order_amount',
        setting_value: 100,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Минимальная сумма заказа (GT коинов)',
        description: 'Минимальная стоимость для размещения заказа',
        min_value: 50,
        max_value: 1000,
        is_editable: true
      },
      {
        setting_key: 'max_order_amount',
        setting_value: 50000,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Максимальная сумма заказа (GT коинов)',
        description: 'Максимальная стоимость для размещения заказа',
        min_value: 1000,
        max_value: 100000,
        is_editable: true
      },
      {
        setting_key: 'platform_commission_rate',
        setting_value: 10,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Комиссия платформы (%)',
        description: 'Процент комиссии с каждого завершенного заказа',
        min_value: 0,
        max_value: 50,
        is_editable: true
      },
      {
        setting_key: 'min_withdrawal_amount',
        setting_value: 500,
        setting_type: 'number',
        category: 'financial',
        display_name: 'Минимальная сумма вывода (GT коинов)',
        description: 'Минимальная сумма для вывода GT коинов в рубли',
        min_value: 100,
        max_value: 5000,
        is_editable: true
      },

      // Настройки времени и сроков
      {
        setting_key: 'order_expiration_hours',
        setting_value: 24,
        setting_type: 'number',
        category: 'timing',
        display_name: 'Срок действия заказа (часы)',
        description: 'Через сколько часов неактивный заказ автоматически закрывается',
        min_value: 1,
        max_value: 168,
        is_editable: true
      },
      {
        setting_key: 'review_edit_time_minutes',
        setting_value: 60,
        setting_type: 'number',
        category: 'timing',
        display_name: 'Время редактирования отзыва (минуты)',
        description: 'Сколько минут пользователь может редактировать отзыв после публикации',
        min_value: 5,
        max_value: 1440,
        is_editable: true
      },
      {
        setting_key: 'transaction_processing_time_hours',
        setting_value: 2,
        setting_type: 'number',
        category: 'timing',
        display_name: 'Время обработки пополнений (часы)',
        description: 'Стандартное время обработки пополнений GT коинов администратором',
        min_value: 1,
        max_value: 72,
        is_editable: true
      },

      // Модерация и безопасность
      {
        setting_key: 'auto_moderation_enabled',
        setting_value: true,
        setting_type: 'boolean',
        category: 'moderation',
        display_name: 'Автоматическая модерация',
        description: 'Включить автоматическую проверку контента на спам и нарушения',
        is_editable: true
      },
      {
        setting_key: 'max_reports_before_hide',
        setting_value: 3,
        setting_type: 'number',
        category: 'moderation',
        display_name: 'Жалоб до автоскрытия',
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
        display_name: 'Антиспам система',
        description: 'Включить автоматическое обнаружение и блокировку спама',
        is_editable: true
      },
      {
        setting_key: 'max_orders_per_day',
        setting_value: 10,
        setting_type: 'number',
        category: 'moderation',
        display_name: 'Лимит заказов в день',
        description: 'Максимальное количество заказов от одного пользователя за 24 часа',
        min_value: 1,
        max_value: 50,
        is_editable: true
      },

      // Уведомления
      {
        setting_key: 'admin_email_notifications',
        setting_value: true,
        setting_type: 'boolean',
        category: 'notifications',
        display_name: 'Email уведомления админам',
        description: 'Отправлять уведомления о важных событиях на email администраторов',
        is_editable: true
      },
      {
        setting_key: 'telegram_notifications_enabled',
        setting_value: false,
        setting_type: 'boolean',
        category: 'notifications',
        display_name: 'Telegram уведомления',
        description: 'Отправлять системные уведомления в Telegram чат админов',
        is_editable: true
      },
      {
        setting_key: 'user_notification_frequency',
        setting_value: 'immediate',
        setting_type: 'string',
        category: 'notifications',
        display_name: 'Частота уведомлений пользователям',
        description: 'Как часто отправлять уведомления пользователям (immediate/hourly/daily)',
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

    let currentValue;
    try {
      currentValue = typeof setting.setting_value === 'string' 
        ? JSON.parse(setting.setting_value) 
        : setting.setting_value;
    } catch (error) {
      // Если не удается парсить JSON, используем значение как есть
      console.warn(`Failed to parse setting value for ${setting.setting_key}:`, error);
      currentValue = setting.setting_value;
    }

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
    let currentValue;
    try {
      currentValue = typeof setting.setting_value === 'string' 
        ? JSON.parse(setting.setting_value) 
        : setting.setting_value;
    } catch (error) {
      // Если не удается парсить JSON, используем значение как есть
      console.warn(`Failed to parse setting value for ${setting.setting_key}:`, error);
      currentValue = setting.setting_value;
    }
    
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
            value={displayValue || ''}
            onChange={(e) => handleSettingChange(setting, e.target.value)}
            disabled={!setting.is_editable}
            className="w-full"
          />
        );

      default:
        let jsonDisplayValue;
        try {
          jsonDisplayValue = typeof displayValue === 'string' ? displayValue : JSON.stringify(displayValue);
        } catch (error) {
          jsonDisplayValue = String(displayValue);
        }
        
        return (
          <Input
            value={jsonDisplayValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(setting, parsed);
              } catch {
                // Если не JSON, сохраняем как строку
                handleSettingChange(setting, e.target.value);
              }
            }}
            disabled={!setting.is_editable}
            className="w-full font-mono text-sm"
          />
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'general': <Settings className="w-5 h-5" />,
      'financial': <Coins className="w-5 h-5" />,
      'timing': <Clock className="w-5 h-5" />,
      'moderation': <Shield className="w-5 h-5" />,
      'notifications': <Bell className="w-5 h-5" />,
      'security': <Shield className="w-5 h-5" />
    };
    return icons[category as keyof typeof icons] || <Settings className="w-5 h-5" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'general': 'Общие настройки',
      'financial': 'GT коины и финансы',
      'timing': 'Время и сроки',
      'moderation': 'Модерация и безопасность',
      'notifications': 'Уведомления и связь',
      'security': 'Безопасность системы'
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
            <h3 className="font-semibold text-yellow-400">⚠️ Осторожно!</h3>
            <p className="text-steel-300 text-sm mb-2">
              Изменение настроек влияет на всю платформу и всех пользователей мгновенно.
            </p>
            <ul className="text-steel-400 text-xs space-y-1">
              <li>• GT коины: 1 GT коин = 1 рубль реальных денег</li>
              <li>• Финансовые лимиты влияют на пополнения и заказы</li>
              <li>• Настройки модерации могут заблокировать пользователей</li>
              <li>• При сомнениях консультируйтесь с главным администратором</li>
            </ul>
          </div>
        </div>
      </Card>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <div className="mb-6">
          <TabsList className="grid grid-cols-4 gap-3 w-full bg-steel-800 p-3 rounded-lg h-auto">
            {categories.map(category => (
              <TabsTrigger 
                key={category} 
                value={category} 
                className="flex items-center justify-center space-x-2 px-4 py-3 text-center font-medium rounded-md data-[state=active]:bg-steel-700 data-[state=active]:text-steel-100 text-steel-400 hover:text-steel-200 hover:bg-steel-700/50 transition-colors"
              >
                {getCategoryIcon(category)}
                <span className="text-sm">{getCategoryLabel(category)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Добавляем раздел справки перед контентом */}
        {activeCategory === 'help' && (
          <div className="space-y-6">
            <Card className="card-steel-lighter p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Info className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-steel-100">Подробная справка по системным настройкам</h3>
              </div>
              
              <div className="space-y-6">
                {/* Общие настройки */}
                <div>
                  <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Общие настройки платформы
                  </h4>
                  <div className="bg-steel-900 p-4 rounded-lg space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-steel-200">Название платформы:</span>
                      <p className="text-steel-400 mt-1">Отображается в заголовке сайта, уведомлениях и документах. Изменение влияет на весь интерфейс пользователей.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Приветственное сообщение:</span>
                      <p className="text-steel-400 mt-1">Первое что видят новые пользователи после регистрации. Должно быть коротким и информативным (до 200 символов).</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Режим обслуживания:</span>
                      <p className="text-steel-400 mt-1">⚠️ КРИТИЧНО: Отключает доступ ко всему сайту кроме админпанели. Используйте только при технических работах!</p>
                    </div>
                  </div>
                </div>

                {/* Финансовые настройки */}
                <div>
                  <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
                    <Coins className="w-5 h-5 mr-2" />
                    Финансовые настройки (GT коины)
                  </h4>
                  <div className="bg-steel-900 p-4 rounded-lg space-y-3 text-sm">
                    <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                      <p className="text-red-300 font-medium">⚠️ ВНИМАНИЕ: 1 GT коин = 1 рубль реальных денег!</p>
                      <p className="text-red-400 text-xs mt-1">Любые изменения влияют на реальные финансы пользователей.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Минимальное пополнение (50-1000₽):</span>
                      <p className="text-steel-400 mt-1">Слишком малые суммы создают много мелких транзакций. Слишком большие - отпугивают новых пользователей.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Максимальное пополнение (1000-500000₽):</span>
                      <p className="text-steel-400 mt-1">Защита от мошенничества и отмывания денег. Большие суммы требуют дополнительных проверок.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Лимиты заказов (50-100000 GT):</span>
                      <p className="text-steel-400 mt-1">Мин. сумма предотвращает спам-заказы. Макс. сумма защищает от крупного мошенничества.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Комиссия платформы (5-25%):</span>
                      <p className="text-steel-400 mt-1">Основной доход платформы. Учитывайте конкурентов: 10-15% - стандарт рынка.</p>
                    </div>
                  </div>
                </div>

                {/* Лимиты */}
                <div>
                  <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Лимиты и ограничения
                  </h4>
                  <div className="bg-steel-900 p-4 rounded-lg space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-steel-200">Максимум заказов в день:</span>
                      <p className="text-steel-400 mt-1">Защита от спама. Новые пользователи: 3-5, проверенные: 10-20 заказов.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Максимум сообщений в час:</span>
                      <p className="text-steel-400 mt-1">Антиспам в чатах. 50-100 сообщений для обычных пользователей.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Время жизни заказа (часы):</span>
                      <p className="text-steel-400 mt-1">Автоматическое закрытие неактивных заказов. 24-168 часов (1-7 дней).</p>
                    </div>
                  </div>
                </div>

                {/* Модерация */}
                <div>
                  <h4 className="text-lg font-semibold text-orange-400 mb-3 flex items-center">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Модерация и безопасность
                  </h4>
                  <div className="bg-steel-900 p-4 rounded-lg space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-steel-200">Автомодерация:</span>
                      <p className="text-steel-400 mt-1">ИИ проверяет контент на нарушения. Включайте осторожно - может блокировать нормальный контент.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Предварительная модерация:</span>
                      <p className="text-steel-400 mt-1">Все заказы проходят проверку до публикации. Замедляет работу, но повышает качество.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Стоп-слова:</span>
                      <p className="text-steel-400 mt-1">Автоматическая блокировка контента с запрещенными словами. Обновляйте регулярно.</p>
                    </div>
                  </div>
                </div>

                {/* Уведомления */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Настройки уведомлений
                  </h4>
                  <div className="bg-steel-900 p-4 rounded-lg space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-steel-200">Email уведомления:</span>
                      <p className="text-steel-400 mt-1">Отправка важных уведомлений на почту. Проверьте настройки SMTP-сервера.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Push уведомления:</span>
                      <p className="text-steel-400 mt-1">Мгновенные уведомления в браузере. Требуют разрешения пользователя.</p>
                    </div>
                    <div>
                      <span className="font-medium text-steel-200">Telegram боты:</span>
                      <p className="text-steel-400 mt-1">Интеграция с Telegram для уведомлений. Нужен токен бота и настройка вебхуков.</p>
                    </div>
                  </div>
                </div>

                {/* Рекомендации */}
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-300 mb-3">💡 Рекомендации по настройке</h4>
                  <ul className="space-y-2 text-sm text-blue-200">
                    <li>• <strong>Тестируйте изменения</strong> на небольшой группе пользователей</li>
                    <li>• <strong>Ведите логи изменений</strong> - все действия записываются в системе</li>
                    <li>• <strong>Консультируйтесь с командой</strong> перед изменением финансовых настроек</li>
                    <li>• <strong>Мониторьте метрики</strong> после изменений настроек</li>
                    <li>• <strong>Делайте резервные копии</strong> перед критическими изменениями</li>
                  </ul>
                </div>

                {/* Критические предупреждения */}
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-red-300 mb-3">🚨 Критические предупреждения</h4>
                  <ul className="space-y-2 text-sm text-red-200">
                    <li>• <strong>НЕ ВКЛЮЧАЙТЕ режим обслуживания</strong> без предупреждения пользователей</li>
                    <li>• <strong>НЕ ИЗМЕНЯЙТЕ комиссию</strong> для активных заказов</li>
                    <li>• <strong>НЕ СНИЖАЙТЕ лимиты</strong> ниже текущих активных операций</li>
                    <li>• <strong>НЕ ОТКЛЮЧАЙТЕ автомодерацию</strong> в пиковые часы</li>
                    <li>• <strong>ВСЕГДА проверяйте</strong> воздействие изменений на пользователей</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

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