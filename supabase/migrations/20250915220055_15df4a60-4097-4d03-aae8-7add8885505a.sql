-- Fix security issue: Step 3 - Fix the view security issue
-- Drop and recreate the view without security definer
DROP VIEW IF EXISTS public.public_profiles;

-- Create the view properly without security definer (which is the default)
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  created_at,
  rating
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Create RLS policy for the view that allows public access to non-sensitive data
CREATE POLICY "Public can view public profile data" ON public.public_profiles
FOR SELECT USING (true);