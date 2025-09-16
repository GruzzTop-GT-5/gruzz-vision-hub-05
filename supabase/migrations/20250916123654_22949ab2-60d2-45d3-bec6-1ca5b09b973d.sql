-- Исправляем функцию update_user_balance - убираем обращение к несуществующему полю updated_at
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  balance_change NUMERIC := 0;
BEGIN
  -- Логирование для отладки
  RAISE NOTICE 'Transaction update: ID=%, Type=%, Amount=%, Old Status=%, New Status=%', 
    NEW.id, NEW.type, NEW.amount, OLD.status, NEW.status;
  
  -- Обновляем баланс только при смене статуса на completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Определяем изменение баланса в зависимости от типа транзакции
    CASE NEW.type
      -- Пополнения (увеличивают баланс)
      WHEN 'deposit' THEN
        balance_change := NEW.amount;
      
      -- Списания (уменьшают баланс)
      WHEN 'purchase', 'payment', 'withdrawal' THEN
        balance_change := -NEW.amount;
        
      ELSE
        RAISE NOTICE 'Unknown transaction type: %', NEW.type;
    END CASE;
    
    -- Обновляем баланс пользователя
    IF balance_change != 0 THEN
      UPDATE public.profiles 
      SET balance = balance + balance_change
      WHERE id = NEW.user_id;
      
      RAISE NOTICE 'Balance updated for user % by %', NEW.user_id, balance_change;
    END IF;
    
    -- Устанавливаем время завершения
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;