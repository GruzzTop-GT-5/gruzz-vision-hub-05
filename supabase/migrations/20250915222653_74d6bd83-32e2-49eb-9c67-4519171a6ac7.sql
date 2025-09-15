-- Add telegram_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN telegram_id BIGINT UNIQUE,
ADD COLUMN telegram_username TEXT,
ADD COLUMN telegram_photo_url TEXT,
ADD COLUMN display_name TEXT,
ADD COLUMN is_premium BOOLEAN DEFAULT false;

-- Create index for telegram_id for faster lookups
CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id);

-- Update RLS policies to allow Telegram authentication
CREATE POLICY "Allow Telegram users to create profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (telegram_id IS NOT NULL);

CREATE POLICY "Allow Telegram users to read their profile" 
ON public.profiles 
FOR SELECT 
USING (telegram_id IS NOT NULL);