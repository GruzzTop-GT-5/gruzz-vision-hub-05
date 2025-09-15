-- Fix security issue: Step 1 - Remove the problematic public access policy
DROP POLICY IF EXISTS "Anyone can read public profile data" ON public.profiles;