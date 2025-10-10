-- Fix use_promo_code function to rely on trigger for balance update
CREATE OR REPLACE FUNCTION public.use_promo_code(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Create transaction record - trigger will update balance automatically
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