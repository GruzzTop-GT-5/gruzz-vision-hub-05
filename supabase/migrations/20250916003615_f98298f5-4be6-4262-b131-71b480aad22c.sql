-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  deadline TIMESTAMP WITH TIME ZONE,
  client_id UUID NOT NULL,
  executor_id UUID,
  ad_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  client_requirements JSONB,
  executor_proposal JSONB,
  delivery_format TEXT,
  revision_count INTEGER DEFAULT 0,
  max_revisions INTEGER DEFAULT 3,
  escrow_amount NUMERIC(10,2),
  commission_rate NUMERIC(3,2) DEFAULT 10.00,
  platform_fee NUMERIC(10,2)
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() = client_id OR 
  auth.uid() = executor_id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);

CREATE POLICY "Clients can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Participants can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = client_id OR 
  auth.uid() = executor_id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);

-- Create order status history table
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  changed_by UUID NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for order status history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order status history" 
ON public.order_status_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND (
      auth.uid() = client_id OR 
      auth.uid() = executor_id OR 
      get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
    )
  )
);

CREATE POLICY "System can log status changes" 
ON public.order_status_history 
FOR INSERT 
WITH CHECK (auth.uid() = changed_by);

-- Create order files table for deliverables
CREATE TABLE public.order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID NOT NULL,
  file_category TEXT DEFAULT 'deliverable',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for order files
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order participants can view files" 
ON public.order_files 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND (
      auth.uid() = client_id OR 
      auth.uid() = executor_id
    )
  )
);

CREATE POLICY "Order participants can upload files" 
ON public.order_files 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND (
      auth.uid() = client_id OR 
      auth.uid() = executor_id
    )
  )
);

-- Create order reviews table
CREATE TABLE public.order_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT true,
  UNIQUE(order_id, reviewer_id)
);

-- Enable RLS for order reviews
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public for reading" 
ON public.order_reviews 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Order participants can create reviews" 
ON public.order_reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND 
    status = 'completed' AND (
      (auth.uid() = client_id AND reviewed_user_id = executor_id) OR
      (auth.uid() = executor_id AND reviewed_user_id = client_id)
    )
  )
);

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  order_number TEXT;
BEGIN
  order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) % 10000)::text, 4, '0');
  RETURN order_number;
END;
$function$;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION public.auto_assign_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_auto_assign_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_order_number();

-- Function to log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log status change if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      status_from,
      status_to,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'completed' THEN 'Order marked as completed'
        WHEN NEW.status = 'cancelled' THEN 'Order cancelled'
        WHEN NEW.status = 'in_progress' THEN 'Work started'
        WHEN NEW.status = 'review' THEN 'Work submitted for review'
        ELSE 'Status updated'
      END
    );
  END IF;

  -- Update timestamps
  NEW.updated_at = now();
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_log_order_status_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();