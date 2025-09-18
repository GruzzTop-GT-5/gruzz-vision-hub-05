-- Create promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  bonus_amount NUMERIC NOT NULL DEFAULT 0,
  usage_limit INTEGER DEFAULT NULL, -- NULL = unlimited
  usage_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  distribution_method TEXT DEFAULT 'manual', -- manual, notification, telegram
  target_audience JSONB DEFAULT '{}' -- for targeting specific users
);

-- Create promo code usage history
CREATE TABLE public.promo_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL,
  user_id UUID NOT NULL,
  bonus_received NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id) -- prevent duplicate usage by same user
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for promo_codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

CREATE POLICY "Users can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true AND expires_at > now());

-- RLS policies for promo_code_usage
CREATE POLICY "Users can view their own usage"
ON public.promo_code_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage records"
ON public.promo_code_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
ON public.promo_code_usage
FOR SELECT
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

-- Function to validate and use promo code
CREATE OR REPLACE FUNCTION public.use_promo_code(p_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promo_record public.promo_codes%ROWTYPE;
  bonus_amount NUMERIC;
  result JSONB;
BEGIN
  -- Get promo code details
  SELECT * INTO promo_record 
  FROM public.promo_codes 
  WHERE code = p_code 
    AND is_active = true 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Промокод не найден или истек');
  END IF;
  
  -- Check if user already used this promo code
  IF EXISTS (
    SELECT 1 FROM public.promo_code_usage 
    WHERE promo_code_id = promo_record.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы уже использовали этот промокод');
  END IF;
  
  -- Check usage limit
  IF promo_record.usage_limit IS NOT NULL 
     AND promo_record.usage_count >= promo_record.usage_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лимит использования промокода исчерпан');
  END IF;
  
  -- Use the promo code
  bonus_amount := promo_record.bonus_amount;
  
  -- Insert usage record
  INSERT INTO public.promo_code_usage (promo_code_id, user_id, bonus_received)
  VALUES (promo_record.id, p_user_id, bonus_amount);
  
  -- Update usage count
  UPDATE public.promo_codes 
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = promo_record.id;
  
  -- Update user balance
  UPDATE public.profiles 
  SET balance = balance + bonus_amount
  WHERE id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (
    user_id, 
    type, 
    amount, 
    status, 
    payment_details
  ) VALUES (
    p_user_id,
    'deposit',
    bonus_amount,
    'completed',
    jsonb_build_object(
      'source', 'promo_code',
      'promo_code', p_code,
      'promo_name', promo_record.name
    )
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'bonus', bonus_amount,
    'name', promo_record.name,
    'description', promo_record.description
  );
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();