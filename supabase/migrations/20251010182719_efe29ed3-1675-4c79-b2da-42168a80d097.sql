-- Fix existing completed transactions to trigger balance update
DO $$
DECLARE
  transaction_record RECORD;
  balance_change NUMERIC;
BEGIN
  -- Process all completed transactions that haven't updated balance yet
  FOR transaction_record IN 
    SELECT id, user_id, amount, type
    FROM transactions 
    WHERE status = 'completed' 
    AND completed_at IS NULL
    ORDER BY created_at ASC
  LOOP
    -- Calculate balance change
    IF transaction_record.type = 'deposit' THEN
      balance_change := transaction_record.amount;
    ELSIF transaction_record.type IN ('purchase', 'payment', 'withdrawal') THEN
      balance_change := -transaction_record.amount;
    ELSE
      balance_change := 0;
    END IF;
    
    -- Update user balance directly
    UPDATE profiles 
    SET balance = balance + balance_change
    WHERE id = transaction_record.user_id;
    
    -- Mark transaction as completed
    UPDATE transactions
    SET completed_at = now()
    WHERE id = transaction_record.id;
    
    RAISE NOTICE 'Fixed transaction % for user %, balance change: %', 
      transaction_record.id, transaction_record.user_id, balance_change;
  END LOOP;
END $$;