-- Добавляем системные настройки для курса валюты
INSERT INTO public.system_settings (
  setting_key,
  category,
  display_name,
  setting_type,
  setting_value,
  description,
  min_value,
  max_value,
  is_editable
) VALUES 
(
  'gt_coin_rate',
  'currency',
  'Курс GT Coin к рублю',
  'number',
  '1.00'::jsonb,
  'Курс обмена 1 GT Coin в рублях',
  0.01,
  1000.00,
  true
),
(
  'currency_symbol',
  'currency', 
  'Символ валюты',
  'string',
  '"₽"'::jsonb,
  'Символ валюты для отображения',
  null,
  null,
  true
),
(
  'currency_name',
  'currency',
  'Название валюты',
  'string', 
  '"рубль"'::jsonb,
  'Полное название валюты',
  null,
  null,
  true
) ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description;