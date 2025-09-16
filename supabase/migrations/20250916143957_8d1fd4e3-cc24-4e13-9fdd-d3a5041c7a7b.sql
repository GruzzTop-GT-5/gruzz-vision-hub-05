-- Add new fields to orders table for enhanced functionality
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS people_needed INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS people_accepted INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_auto_closed BOOLEAN DEFAULT false;

-- Update priority costs in system_settings
INSERT INTO public.system_settings (
  setting_key, 
  setting_value, 
  setting_type, 
  category, 
  display_name, 
  description,
  is_editable
) VALUES 
(
  'priority_costs', 
  '{"normal": 15, "high": 35, "urgent": 55}'::jsonb,
  'json',
  'orders',
  'Стоимость приоритетов заказов',
  'Стоимость размещения заказов по приоритетам в GT Coins',
  true
) ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Create function to auto-close orders when people_accepted >= people_needed
CREATE OR REPLACE FUNCTION public.auto_close_order_when_full()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if order should be auto-closed
  IF NEW.people_accepted >= NEW.people_needed AND NEW.status = 'pending' THEN
    NEW.status = 'in_progress';
    NEW.is_auto_closed = true;
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-closing orders
DROP TRIGGER IF EXISTS trigger_auto_close_order ON public.orders;
CREATE TRIGGER trigger_auto_close_order
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.people_accepted IS DISTINCT FROM OLD.people_accepted)
  EXECUTE FUNCTION public.auto_close_order_when_full();