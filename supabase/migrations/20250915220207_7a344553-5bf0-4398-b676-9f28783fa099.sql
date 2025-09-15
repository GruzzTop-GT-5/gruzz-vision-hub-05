-- Fix security: Remove the public view that's bypassing security
DROP VIEW IF EXISTS public.public_profiles;

-- Revoke any public grants on profiles table
REVOKE ALL ON public.profiles FROM anon, public;

-- Ensure only authenticated users can access profiles with proper restrictions
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;