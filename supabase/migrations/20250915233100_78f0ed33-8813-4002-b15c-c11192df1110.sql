-- Add new profile fields for better user information
ALTER TABLE public.profiles 
ADD COLUMN full_name text,
ADD COLUMN age integer,
ADD COLUMN citizenship text,
ADD COLUMN qualification text,
ADD COLUMN bio text;

-- Add constraints for data validation
ALTER TABLE public.profiles 
ADD CONSTRAINT age_check CHECK (age >= 16 AND age <= 100),
ADD CONSTRAINT full_name_length CHECK (length(full_name) >= 2);

-- Create index for better search performance
CREATE INDEX idx_profiles_qualification ON public.profiles(qualification);
CREATE INDEX idx_profiles_citizenship ON public.profiles(citizenship);