-- Create resumes table for performer profiles/vacancies
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL, 
  description TEXT,
  category_id UUID NOT NULL,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  skills TEXT[],
  education TEXT,
  contact_info TEXT,
  availability TEXT DEFAULT 'available',
  location TEXT,
  portfolio_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_resumes_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT
);

-- Enable Row Level Security
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for resumes
CREATE POLICY "Resumes are viewable by everyone" 
ON public.resumes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own resume" 
ON public.resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume" 
ON public.resumes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume" 
ON public.resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_resumes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_resumes_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_category_id ON public.resumes(category_id);
CREATE INDEX idx_resumes_status ON public.resumes(status);
CREATE INDEX idx_resumes_availability ON public.resumes(availability);