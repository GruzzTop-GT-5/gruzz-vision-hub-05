-- Enable realtime for admin panel tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.ads REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;