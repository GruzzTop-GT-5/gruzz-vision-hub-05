-- Fix the rating field precision to allow higher values
ALTER TABLE public.profiles 
ALTER COLUMN rating TYPE numeric(5,2);