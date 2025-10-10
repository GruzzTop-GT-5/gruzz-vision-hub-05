-- Create user type enum
CREATE TYPE user_type AS ENUM ('executor', 'client');

-- Add user_type and user_subtype columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN user_type user_type,
ADD COLUMN user_subtype text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.user_type IS 'Type of user: executor (исполнитель) or client (заказчик)';
COMMENT ON COLUMN public.profiles.user_subtype IS 'For executor: work category. For client: logistician, client, foreman, manager';

-- Set default for existing users (they can change it later)
UPDATE public.profiles 
SET user_type = 'client', 
    user_subtype = 'client'
WHERE user_type IS NULL;