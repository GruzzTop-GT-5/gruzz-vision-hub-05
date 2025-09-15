-- Fix security issue: Remove public access to user profiles and implement proper access control

-- First, drop the overly permissive policy that allows anyone to read profile data
DROP POLICY IF EXISTS "Anyone can read public profile data" ON public.profiles;

-- Create a new policy that only allows users to see limited public profile info (excluding sensitive data)
-- This policy allows viewing only non-sensitive profile fields for public purposes (like user ratings)
CREATE POLICY "Public can view limited profile info" ON public.profiles
FOR SELECT USING (true)
WITH CHECK (false);

-- However, we need to ensure users can still see their own full profile data
-- The existing "Users can read their own profile" policy should handle this

-- Let's also ensure the other policies are properly restrictive
-- Re-create policies with explicit column access if needed

-- Create a view for public profile information that excludes sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  created_at,
  rating
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add RLS to the view (though views inherit from base table)
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Update the profiles table policies to be more explicit about what can be accessed
-- Drop and recreate the public policy to be more restrictive
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;

-- Create a policy that allows NO public access to the profiles table directly
-- All public access should go through the public_profiles view
CREATE POLICY "No public access to profiles" ON public.profiles
FOR SELECT USING (false);

-- Ensure authenticated users can only see their own profiles or authorized staff can see others
CREATE POLICY "Users can view own profile or staff can view all" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role, 'support'::user_role])
);