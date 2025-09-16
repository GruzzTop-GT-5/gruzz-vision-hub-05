-- Добавляем настройку фиксированной стоимости публикации заказа
INSERT INTO public.system_settings (
  setting_key, 
  setting_value, 
  setting_type, 
  category, 
  display_name, 
  description, 
  is_editable,
  min_value,
  max_value
) VALUES (
  'order_publication_fee',
  '50',
  'fee',
  'Оплата',
  'Стоимость публикации заказа',
  'Фиксированная стоимость за размещение заказа на платформе (в GT Coins)',
  true,
  0,
  500
) ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  category = EXCLUDED.category,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_editable = EXCLUDED.is_editable,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value;