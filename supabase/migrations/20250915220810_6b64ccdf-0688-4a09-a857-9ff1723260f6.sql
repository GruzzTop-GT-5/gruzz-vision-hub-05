-- Enhance reviews system with transaction constraints and moderation

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

-- Create constraint to ensure users can only review after completed transactions
CREATE OR REPLACE FUNCTION public.validate_review_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- If transaction_id is provided, validate it
  IF NEW.transaction_id IS NOT NULL THEN
    -- Check if transaction exists and is completed
    IF NOT EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE id = NEW.transaction_id 
      AND status = 'completed'
      AND (user_id = NEW.author_id OR user_id = NEW.target_user_id)
    ) THEN
      RAISE EXCEPTION 'Reviews can only be created for completed transactions where the reviewer was involved';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for review validation
DROP TRIGGER IF EXISTS validate_review_transaction_trigger ON public.reviews;
CREATE TRIGGER validate_review_transaction_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_transaction();

-- Create function to update user rating when reviews change
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rating for the target user
  UPDATE public.profiles 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)::numeric(3,2)
    FROM public.reviews 
    WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
    AND rating IS NOT NULL
    AND is_moderated = false -- Only count non-moderated reviews
  )
  WHERE id = COALESCE(NEW.target_user_id, OLD.target_user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic rating updates
DROP TRIGGER IF EXISTS update_user_rating_trigger ON public.reviews;
CREATE TRIGGER update_user_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();

-- Create table for review reports
CREATE TABLE IF NOT EXISTS public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  processed_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS on review_reports
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_reports
CREATE POLICY "Users can report reviews" ON public.review_reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Staff can view reports" ON public.review_reports
FOR SELECT USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);

CREATE POLICY "Staff can update reports" ON public.review_reports
FOR UPDATE USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);