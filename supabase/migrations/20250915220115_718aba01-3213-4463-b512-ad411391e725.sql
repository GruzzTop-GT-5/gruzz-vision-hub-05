-- Fix security issue: Step 3 (corrected) - Create a simple public view
-- Drop and recreate the view properly
DROP VIEW IF EXISTS public.public_profiles;

-- Create the view for public access to non-sensitive profile data
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  created_at,
  rating
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;