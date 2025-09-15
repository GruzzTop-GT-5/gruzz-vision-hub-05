-- Enhance reviews system - Part 3: Review reports table
-- Create table for review reports
CREATE TABLE IF NOT EXISTS public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  processed_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS on review_reports
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_reports (drop existing ones first)
DROP POLICY IF EXISTS "Users can report reviews" ON public.review_reports;
DROP POLICY IF EXISTS "Staff can view reports" ON public.review_reports;
DROP POLICY IF EXISTS "Staff can update reports" ON public.review_reports;

CREATE POLICY "Users can report reviews" ON public.review_reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Staff can view reports" ON public.review_reports
FOR SELECT USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);

CREATE POLICY "Staff can update reports" ON public.review_reports
FOR UPDATE USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);