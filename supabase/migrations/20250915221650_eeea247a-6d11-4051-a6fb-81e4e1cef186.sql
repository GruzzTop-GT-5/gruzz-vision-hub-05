-- Add security logging and audit trail
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- LOGIN_ATTEMPT, FAILED_LOGIN, SUSPICIOUS_ACTIVITY, etc.
  user_id uuid REFERENCES public.profiles(id),
  ip_address text,
  user_agent text,
  details jsonb,
  severity text DEFAULT 'info', -- info, warning, error, critical
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read security logs
CREATE POLICY "Admins can view security logs" ON public.security_logs
FOR SELECT USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role])
);

-- System can insert security logs
CREATE POLICY "System can insert security logs" ON public.security_logs
FOR INSERT WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_severity text DEFAULT 'info'
) RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    ip_address,
    user_agent,
    details,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_details,
    p_severity
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;