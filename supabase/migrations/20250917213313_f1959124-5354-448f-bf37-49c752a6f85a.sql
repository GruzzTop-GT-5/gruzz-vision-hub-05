-- Создаем таблицу system_settings, если её еще нет
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}',
    setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    category TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    min_value NUMERIC,
    max_value NUMERIC,
    is_editable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

-- Включаем RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Политики безопасности - только админы могут управлять настройками
CREATE POLICY "System admins can read settings" ON public.system_settings
    FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

CREATE POLICY "System admins can insert settings" ON public.system_settings
    FOR INSERT WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

CREATE POLICY "System admins can update settings" ON public.system_settings
    FOR UPDATE USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

-- Триггер для обновления времени изменения
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Добавляем базовые настройки системы
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, display_name, description, min_value, max_value, is_editable) VALUES
-- Общие настройки
('platform_name', '"GruzzTop"', 'string', 'general', 'Название платформы', 'Отображаемое название платформы', NULL, NULL, true),
('maintenance_mode', 'false', 'boolean', 'general', 'Режим обслуживания', 'Включить режим технического обслуживания', NULL, NULL, true),
('user_registration_enabled', 'true', 'boolean', 'general', 'Регистрация пользователей', 'Разрешить регистрацию новых пользователей', NULL, NULL, true),

-- Финансовые настройки  
('min_order_amount', '100', 'number', 'financial', 'Минимальная сумма заказа', 'Минимальная сумма для размещения заказа (₽)', 50, 1000, true),
('max_order_amount', '50000', 'number', 'financial', 'Максимальная сумма заказа', 'Максимальная сумма для размещения заказа (₽)', 1000, 100000, true),
('commission_rate', '10', 'number', 'financial', 'Комиссия платформы (%)', 'Процент комиссии с каждого заказа', 0, 50, true),
('min_withdrawal_amount', '500', 'number', 'financial', 'Минимальная сумма вывода', 'Минимальная сумма для вывода средств (₽)', 100, 5000, true),

-- Настройки времени
('order_expiration_hours', '24', 'number', 'timing', 'Срок действия заказа (часы)', 'Через сколько часов заказ становится неактивным', 1, 168, true),
('review_edit_time_minutes', '60', 'number', 'timing', 'Время редактирования отзыва (мин)', 'Сколько минут можно редактировать отзыв после создания', 5, 1440, true),

-- Модерация
('auto_moderation_enabled', 'true', 'boolean', 'moderation', 'Автомодерация', 'Включить автоматическую модерацию контента', NULL, NULL, true),
('max_reports_before_hide', '3', 'number', 'moderation', 'Жалоб до скрытия', 'Количество жалоб для автоматического скрытия контента', 1, 10, true),
('spam_detection_enabled', 'true', 'boolean', 'moderation', 'Детекция спама', 'Включить автоматическое обнаружение спама', NULL, NULL, true),

-- Уведомления
('email_notifications_enabled', 'true', 'boolean', 'notifications', 'Email уведомления', 'Отправлять уведомления по email', NULL, NULL, true),
('telegram_notifications_enabled', 'false', 'boolean', 'notifications', 'Telegram уведомления', 'Отправлять уведомления в Telegram', NULL, NULL, true)

ON CONFLICT (setting_key) DO NOTHING;