-- Enhance reviews system - Part 1: Table modifications
-- Add transaction_id to reviews table to link reviews to completed transactions
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id);

-- Add moderation fields
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_reported boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_moderated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.profiles(id);

-- Create constraint to ensure one review per transaction
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_transaction 
ON public.reviews(transaction_id) 
WHERE transaction_id IS NOT NULL;