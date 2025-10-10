-- Update existing users with 0 rating to 5
UPDATE public.profiles
SET rating = 5.00
WHERE rating = 0.00 OR rating IS NULL;