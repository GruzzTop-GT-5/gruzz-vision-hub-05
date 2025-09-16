-- Add expiration system for orders
ALTER TABLE public.orders 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
ADD COLUMN is_expired BOOLEAN DEFAULT false;

-- Create function to mark expired orders
CREATE OR REPLACE FUNCTION public.mark_expired_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders 
  SET is_expired = true, 
      status = 'inactive',
      updated_at = now()
  WHERE expires_at <= now() 
    AND is_expired = false 
    AND status != 'inactive';
END;
$$;

-- Create function to extend order expiration (for renewals)
CREATE OR REPLACE FUNCTION public.extend_order_expiration(order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders 
  SET expires_at = now() + INTERVAL '24 hours',
      is_expired = false,
      status = 'pending',
      updated_at = now()
  WHERE id = order_id;
END;
$$;

-- Add admin priority override fields
ALTER TABLE public.orders 
ADD COLUMN admin_priority_override TEXT,
ADD COLUMN admin_modified_by UUID,
ADD COLUMN admin_modified_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to set expiration on new orders
CREATE OR REPLACE FUNCTION public.set_order_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.expires_at = now() + INTERVAL '24 hours';
  NEW.is_expired = false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_expiration_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_expiration();

-- Update system settings for priority costs
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, display_name, description, is_editable)
VALUES 
('priority_costs', '{"normal": 15, "high": 35, "urgent": 55}', 'json', 'orders', 'Стоимость приоритетов', 'Стоимость приоритетов заказов в GT', true)
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = '{"normal": 15, "high": 35, "urgent": 55}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_priority_created ON public.orders(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON public.orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_is_expired ON public.orders(is_expired);