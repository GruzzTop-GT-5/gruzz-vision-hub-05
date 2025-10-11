-- Add new columns to profiles table for enhanced registration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS citizenship TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS user_subtype TEXT;

-- Update user_type constraint if needed
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- No constraints needed - user_type can be 'client' or 'executor' or NULL