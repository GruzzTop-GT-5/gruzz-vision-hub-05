-- Create enum for ban types
CREATE TYPE public.ban_type AS ENUM (
  'order_mute',
  'payment_mute', 
  'account_block'
);

-- Create user_bans table
CREATE TABLE public.user_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ban_type public.ban_type NOT NULL,
  duration_minutes INTEGER NOT NULL,
  reason TEXT,
  issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can manage bans" 
ON public.user_bans 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role]));

-- Create function to check if user has active ban
CREATE OR REPLACE FUNCTION public.has_active_ban(p_user_id UUID, p_ban_type public.ban_type)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_bans 
    WHERE user_id = p_user_id 
    AND ban_type = p_ban_type 
    AND is_active = true 
    AND expires_at > now()
  );
$$;

-- Create function to deactivate expired bans
CREATE OR REPLACE FUNCTION public.deactivate_expired_bans()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.user_bans 
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND expires_at <= now();
$$;

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_bans_updated_at
  BEFORE UPDATE ON public.user_bans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();