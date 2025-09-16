-- Добавляем тип 'purchase' в enum transaction_type
ALTER TYPE transaction_type ADD VALUE 'purchase';

-- Обновляем функцию update_user_balance для обработки типа 'purchase'
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only update balance when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update user balance based on transaction type
    IF NEW.type IN ('topup_direct', 'topup_manual', 'refund', 'admin_adjustment', 'deposit') THEN
      UPDATE public.profiles 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.user_id;
    ELSIF NEW.type IN ('purchase', 'payment', 'withdrawal') THEN
      UPDATE public.profiles 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.user_id;
    END IF;
    
    -- Set completed timestamp
    NEW.completed_at = now();
  END IF;
  
  -- Update timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$;