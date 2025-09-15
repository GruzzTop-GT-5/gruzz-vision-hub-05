-- Enhance reviews system - Part 2: Functions and triggers with proper search path

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic rating updates
DROP TRIGGER IF EXISTS update_user_rating_trigger ON public.reviews;
CREATE TRIGGER update_user_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();