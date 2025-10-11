-- Улучшаем таблицу промокодов
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS promo_type TEXT DEFAULT 'bonus' CHECK (promo_type IN ('bonus', 'discount_percent', 'discount_fixed'));

ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;

ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC DEFAULT 0;

ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS max_discount NUMERIC;

-- Комментарии для полей
COMMENT ON COLUMN public.promo_codes.promo_type IS 'Тип промокода: bonus (бонус на баланс), discount_percent (процентная скидка), discount_fixed (фиксированная скидка)';
COMMENT ON COLUMN public.promo_codes.discount_value IS 'Значение скидки (процент или фиксированная сумма)';
COMMENT ON COLUMN public.promo_codes.min_order_amount IS 'Минимальная сумма заказа для применения промокода';
COMMENT ON COLUMN public.promo_codes.max_discount IS 'Максимальная сумма скидки для процентных промокодов';

-- Улучшаем функцию использования промокода
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
  
  -- Calculate bonus based on promo type
  CASE promo_record.promo_type
    WHEN 'bonus' THEN
      bonus_amount := promo_record.bonus_amount;
    WHEN 'discount_percent' THEN
      -- For discount promosodes, we'll just give the bonus amount for now
      -- The actual discount will be applied at checkout
      bonus_amount := promo_record.bonus_amount;
    WHEN 'discount_fixed' THEN
      bonus_amount := promo_record.bonus_amount;
    ELSE
      bonus_amount := promo_record.bonus_amount;
  END CASE;
  
  -- Insert usage record
  INSERT INTO public.promo_code_usage (promo_code_id, user_id, bonus_received)
  VALUES (promo_record.id, p_user_id, bonus_amount);
  
  -- Update usage count
  UPDATE public.promo_codes 
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = promo_record.id;
  
  -- Create transaction record for bonus type only
  IF promo_record.promo_type = 'bonus' THEN
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
        'promo_name', promo_record.name,
        'promo_type', promo_record.promo_type
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'bonus', bonus_amount,
    'name', promo_record.name,
    'description', promo_record.description,
    'promo_type', promo_record.promo_type,
    'discount_value', promo_record.discount_value
  );
END;
$$;

-- Создаем функцию для получения активных промокодов пользователя
CREATE OR REPLACE FUNCTION public.get_user_active_promos(p_user_id uuid)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  description TEXT,
  promo_type TEXT,
  bonus_amount NUMERIC,
  discount_value NUMERIC,
  expires_at TIMESTAMPTZ,
  used BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pc.code,
    pc.name,
    pc.description,
    pc.promo_type,
    pc.bonus_amount,
    pc.discount_value,
    pc.expires_at,
    EXISTS (
      SELECT 1 FROM public.promo_code_usage pcu 
      WHERE pcu.promo_code_id = pc.id AND pcu.user_id = p_user_id
    ) as used
  FROM public.promo_codes pc
  WHERE pc.is_active = true
    AND pc.expires_at > now()
    AND (pc.usage_limit IS NULL OR pc.usage_count < pc.usage_limit)
  ORDER BY pc.created_at DESC
  LIMIT 10;
$$;