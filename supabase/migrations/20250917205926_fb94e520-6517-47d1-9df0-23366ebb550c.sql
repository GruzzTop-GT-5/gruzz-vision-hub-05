-- Create moderation rules table
CREATE TABLE public.moderation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'keyword', 'pattern', 'ai', 'length'
  content_types TEXT[] NOT NULL, -- ['ads', 'reviews', 'messages']
  criteria JSONB NOT NULL DEFAULT '{}', -- rule-specific criteria
  actions JSONB NOT NULL DEFAULT '{}', -- actions to take
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 5, -- 1-10 priority
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can manage moderation rules"
ON public.moderation_rules
FOR ALL
USING (get_user_role(auth.uid()) = ANY(ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role]));

-- Add is_reported columns to existing tables
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false;  
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_is_reported ON public.ads(is_reported);
CREATE INDEX IF NOT EXISTS idx_reviews_is_reported ON public.reviews(is_reported);
CREATE INDEX IF NOT EXISTS idx_messages_is_reported ON public.messages(is_reported);
CREATE INDEX IF NOT EXISTS idx_moderation_rules_content_types ON public.moderation_rules USING GIN(content_types);
CREATE INDEX IF NOT EXISTS idx_moderation_rules_active ON public.moderation_rules(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_moderation_rules_updated_at
  BEFORE UPDATE ON public.moderation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();