-- Add balance column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;

-- Create transaction types enum
CREATE TYPE public.transaction_type AS ENUM (
  'topup_direct',
  'topup_manual', 
  'purchase',
  'refund',
  'admin_adjustment'
);

-- Create transaction statuses enum
CREATE TYPE public.transaction_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'cancelled'
);

-- Create payment methods enum
CREATE TYPE public.payment_method AS ENUM (
  'bank_card',
  'yoomoney',
  'ozon',
  'manual_transfer'
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  proof_image TEXT,
  payment_details JSONB,
  processed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (get_user_role(auth.uid()) IN ('admin', 'system_admin'));

CREATE POLICY "Admins can update transaction status" 
ON public.transactions 
FOR UPDATE 
USING (get_user_role(auth.uid()) IN ('admin', 'system_admin'));

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

-- Create trigger for balance updates
CREATE TRIGGER update_balance_on_transaction_complete
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_balance();

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payment proof images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false);

-- Create storage policies for payment proof images
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