-- Добавляем новые категории услуг
INSERT INTO public.categories (name, description, icon, color, sort_order) VALUES
('Аренда компрессора', 'Аренда компрессорного оборудования для различных работ', '🔨', '#FF6B35', 2),
('Вывоз мусора', 'Услуги по вывозу строительного и бытового мусора', '🚛', '#4ECDC4', 3),
('Комплексная услуга', 'Заказ нескольких услуг одновременно', '🧩', '#9B59B6', 4)
ON CONFLICT (name) DO NOTHING;

-- Добавляем новые типы заказов и поля для специфической информации
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'workers',
ADD COLUMN IF NOT EXISTS equipment_details JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS waste_details JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rental_duration_hours INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS additional_equipment TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS waste_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS waste_volume TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS needs_loading BOOLEAN DEFAULT NULL;

-- Создаем индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON public.orders(service_type);

-- Обновляем функцию генерации номера заказа для включения типа услуги
CREATE OR REPLACE FUNCTION public.generate_order_number_with_type(p_service_type TEXT DEFAULT 'workers')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_number TEXT;
  type_prefix TEXT;
BEGIN
  CASE p_service_type
    WHEN 'compressor_rent' THEN type_prefix := 'COMP';
    WHEN 'garbage_removal' THEN type_prefix := 'GARB';
    WHEN 'complex_service' THEN type_prefix := 'CPLX';
    ELSE type_prefix := 'WORK';
  END CASE;
  
  order_number := type_prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) % 10000)::text, 4, '0');
  RETURN order_number;
END;
$function$;