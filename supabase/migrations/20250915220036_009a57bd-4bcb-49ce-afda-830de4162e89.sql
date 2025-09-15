-- Fix security issue: Step 2 - Create public view for non-sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  created_at,
  rating
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;