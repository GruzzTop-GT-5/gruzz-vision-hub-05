-- Add RLS policy to allow admins to update any user profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);