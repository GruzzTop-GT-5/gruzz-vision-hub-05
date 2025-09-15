-- Add balance column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'balance') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;
    END IF;
END $$;

-- Create payment methods enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE public.payment_method AS ENUM (
          'bank_card',
          'yoomoney',
          'ozon',
          'manual_transfer'
        );
    END IF;
END $$;

-- Update transactions table structure
DO $$
BEGIN
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'transactions' AND column_name = 'payment_method') THEN
        ALTER TABLE public.transactions 
        ADD COLUMN payment_method payment_method;
    END IF;
    
    -- Add payment_details column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'transactions' AND column_name = 'payment_details') THEN
        ALTER TABLE public.transactions 
        ADD COLUMN payment_details JSONB;
    END IF;
    
    -- Add admin_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'transactions' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.transactions 
        ADD COLUMN admin_notes TEXT;
    END IF;
    
    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'transactions' AND column_name = 'completed_at') THEN
        ALTER TABLE public.transactions 
        ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create function to update balance after transaction completion
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balance when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update user balance based on transaction type
    IF NEW.type IN ('topup_direct', 'topup_manual', 'refund', 'admin_adjustment') THEN
      UPDATE public.profiles 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.user_id;
    ELSIF NEW.type = 'purchase' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for balance updates if it doesn't exist
DROP TRIGGER IF EXISTS update_balance_on_transaction_complete ON public.transactions;
CREATE TRIGGER update_balance_on_transaction_complete
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_balance();

-- Create storage bucket for payment proof images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
SELECT 'payment-proofs', 'payment-proofs', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs');

-- Create storage policies for payment proof images
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can upload their payment proofs" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their payment proofs" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Users can upload their payment proofs" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (
      bucket_id = 'payment-proofs' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );

    CREATE POLICY "Users can view their payment proofs" 
    ON storage.objects 
    FOR SELECT 
    USING (
      bucket_id = 'payment-proofs' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );

    CREATE POLICY "Admins can view all payment proofs" 
    ON storage.objects 
    FOR SELECT 
    USING (
      bucket_id = 'payment-proofs' AND 
      get_user_role(auth.uid()) IN ('admin', 'system_admin')
    );
END $$;

-- Create function to generate unique payment details
CREATE OR REPLACE FUNCTION public.generate_payment_details(
  p_user_id UUID,
  p_amount DECIMAL,
  p_method payment_method
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_code TEXT;
  payment_details JSONB;
BEGIN
  -- Generate user-specific code (first 8 chars of user ID)
  user_code := UPPER(LEFT(REPLACE(p_user_id::text, '-', ''), 8));
  
  CASE p_method
    WHEN 'bank_card' THEN
      payment_details := jsonb_build_object(
        'card_number', '4274 3200 2456 8901',
        'cardholder', 'GRUZZTOP PAYMENTS',
        'payment_reference', 'GT-' || user_code,
        'amount', p_amount,
        'instructions', 'Укажите в комментарии: GT-' || user_code
      );
    WHEN 'yoomoney' THEN
      payment_details := jsonb_build_object(
        'account', '410012345678901',
        'recipient', 'GruzzTop Platform',
        'payment_reference', 'GT-' || user_code,
        'amount', p_amount,
        'instructions', 'Обязательно укажите номер: GT-' || user_code
      );
    WHEN 'ozon' THEN
      payment_details := jsonb_build_object(
        'phone', '+7 999 123-45-67',
        'recipient', 'GruzzTop',
        'payment_reference', 'GT-' || user_code,
        'amount', p_amount,
        'instructions', 'Переведите на номер с комментарием: GT-' || user_code
      );
    ELSE
      payment_details := jsonb_build_object(
        'payment_reference', 'GT-' || user_code,
        'amount', p_amount
      );
  END CASE;
  
  RETURN payment_details;
END;
$$;