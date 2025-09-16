-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL, -- 'commission', 'limit', 'tariff', 'general'
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_editable BOOLEAN NOT NULL DEFAULT true,
  min_value NUMERIC,
  max_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System admins can read settings" 
ON public.system_settings 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

CREATE POLICY "System admins can update settings" 
ON public.system_settings 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

CREATE POLICY "System admins can insert settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, display_name, description, min_value, max_value) VALUES
-- Commission settings
('platform_commission_rate', '10', 'commission', 'fees', 'Комиссия платформы (%)', 'Процент комиссии с каждой транзакции', 0, 50),
('withdrawal_commission_rate', '5', 'commission', 'fees', 'Комиссия за вывод (%)', 'Процент комиссии при выводе средств', 0, 25),
('payment_processing_fee', '2', 'commission', 'fees', 'Комиссия за обработку платежа (%)', 'Процент за обработку входящих платежей', 0, 10),

-- Limits
('min_withdrawal_amount', '100', 'limit', 'transactions', 'Минимальная сумма вывода', 'Минимальная сумма для вывода средств (GT Coins)', 1, 10000),
('max_withdrawal_amount', '50000', 'limit', 'transactions', 'Максимальная сумма вывода', 'Максимальная сумма для вывода средств (GT Coins)', 100, 1000000),
('min_topup_amount', '50', 'limit', 'transactions', 'Минимальная сумма пополнения', 'Минимальная сумма для пополнения счета (GT Coins)', 1, 1000),
('max_topup_amount', '100000', 'limit', 'transactions', 'Максимальная сумма пополнения', 'Максимальная сумма для пополнения счета (GT Coins)', 1000, 10000000),
('daily_withdrawal_limit', '10000', 'limit', 'transactions', 'Дневной лимит вывода', 'Максимальная сумма вывода в день (GT Coins)', 1000, 1000000),

-- Tariffs
('premium_user_commission_discount', '2', 'tariff', 'premium', 'Скидка премиум пользователям (%)', 'Скидка на комиссию для премиум пользователей', 0, 10),
('vip_user_commission_discount', '5', 'tariff', 'vip', 'Скидка VIP пользователям (%)', 'Скидка на комиссию для VIP пользователей', 0, 20),

-- General settings
('maintenance_mode', 'false', 'general', 'system', 'Режим обслуживания', 'Включить режим технического обслуживания', NULL, NULL),
('max_active_ads_per_user', '10', 'general', 'limits', 'Макс. объявлений на пользователя', 'Максимальное количество активных объявлений на пользователя', 1, 100),
('ad_moderation_required', 'true', 'general', 'moderation', 'Обязательная модерация объявлений', 'Требуется ли модерация новых объявлений', NULL, NULL),
('auto_approve_verified_users', 'true', 'general', 'moderation', 'Автоодобрение для проверенных', 'Автоматически одобрять объявления проверенных пользователей', NULL, NULL);