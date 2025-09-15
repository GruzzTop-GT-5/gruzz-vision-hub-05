-- Update user roles enum to include all required roles
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('user', 'system_admin', 'admin', 'moderator', 'support');

-- Update profiles table to use new role enum
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS role CASCADE;

ALTER TABLE public.profiles 
ADD COLUMN role public.user_role DEFAULT 'user';

-- Update the security definer function for roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

-- Update RLS policies for new roles
DROP POLICY IF EXISTS "System admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Moderators can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Support can read all profiles" ON public.profiles;

CREATE POLICY "System admins can read all profiles" 
ON public.profiles FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'system_admin');

CREATE POLICY "Admins can read all profiles" 
ON public.profiles FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Moderators can read profiles for moderation" 
ON public.profiles FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'moderator');

CREATE POLICY "Support can read profiles for support" 
ON public.profiles FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'support');

-- Update admin policies for other tables
CREATE POLICY "System admins can manage all transactions" 
ON public.transactions FOR ALL 
USING (public.get_user_role(auth.uid()) = 'system_admin');

CREATE POLICY "Support can update transaction status" 
ON public.transactions FOR UPDATE 
USING (public.get_user_role(auth.uid()) IN ('support', 'admin', 'system_admin'));

CREATE POLICY "Moderators can view ads for moderation" 
ON public.ads FOR SELECT 
USING (public.get_user_role(auth.uid()) IN ('moderator', 'admin', 'system_admin'));

CREATE POLICY "Moderators can update ad status" 
ON public.ads FOR UPDATE 
USING (public.get_user_role(auth.uid()) IN ('moderator', 'admin', 'system_admin'));

-- Update admin logs policies
DROP POLICY IF EXISTS "Only admins can read admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Only admins can insert admin logs" ON public.admin_logs;

CREATE POLICY "Staff can read admin logs" 
ON public.admin_logs FOR SELECT 
USING (public.get_user_role(auth.uid()) IN ('system_admin', 'admin', 'moderator', 'support'));

CREATE POLICY "Staff can insert admin logs" 
ON public.admin_logs FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) IN ('system_admin', 'admin', 'moderator', 'support'));

-- Update function to handle new user registration with phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, role, rating)
  VALUES (
    NEW.id,
    NEW.phone,
    'user',
    0.00
  );
  RETURN NEW;
END;
$$;