-- Fix the update_user_balance trigger function
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  balance_change NUMERIC := 0;
BEGIN
  -- Log for debugging
  RAISE NOTICE 'Transaction trigger: ID=%, Type=%, Amount=%, Old Status=%, New Status=%', 
    NEW.id, NEW.type, NEW.amount, OLD.status, NEW.status;
  
  -- Update balance only when status changes to completed
  -- For INSERT: OLD is NULL, so check if NEW.status = 'completed'
  -- For UPDATE: check if status changed from non-completed to completed
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed')) THEN
    
    -- Determine balance change based on transaction type
    CASE NEW.type
      -- Credits (increase balance)
      WHEN 'deposit' THEN
        balance_change := NEW.amount;
      
      -- Debits (decrease balance)
      WHEN 'purchase', 'payment', 'withdrawal' THEN
        balance_change := -NEW.amount;
        
      ELSE
        RAISE NOTICE 'Unknown transaction type: %', NEW.type;
    END CASE;
    
    -- Update user balance
    IF balance_change != 0 THEN
      UPDATE public.profiles 
      SET balance = balance + balance_change
      WHERE id = NEW.user_id;
      
      RAISE NOTICE 'Balance updated for user % by %', NEW.user_id, balance_change;
    END IF;
    
    -- Set completion timestamp
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;