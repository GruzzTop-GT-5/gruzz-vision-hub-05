-- Update the trigger function to save phone from user metadata
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update profile with phone from auth metadata
  INSERT INTO public.profiles (id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone)
  )
  ON CONFLICT (id) DO UPDATE
  SET phone = COALESCE(EXCLUDED.phone, profiles.phone);
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();