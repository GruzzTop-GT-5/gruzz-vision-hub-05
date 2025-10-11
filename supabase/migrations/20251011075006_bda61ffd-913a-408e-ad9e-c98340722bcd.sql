-- Drop and recreate the generate_ticket_number function with better uniqueness
DROP FUNCTION IF EXISTS public.generate_ticket_number();

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ticket_number text;
  random_suffix text;
  timestamp_part text;
BEGIN
  -- Use microseconds for better precision
  timestamp_part := TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-US');
  
  -- Add random 4-digit suffix for extra uniqueness
  random_suffix := LPAD(floor(random() * 10000)::text, 4, '0');
  
  ticket_number := 'SUP-' || timestamp_part || '-' || random_suffix;
  
  RETURN ticket_number;
END;
$$;