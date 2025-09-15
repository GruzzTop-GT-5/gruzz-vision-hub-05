-- Create custom types
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.ad_status AS ENUM ('active', 'inactive', 'sold');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'payment');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'rejected');

-- Create users table (note: using profiles pattern for Supabase auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  role public.user_role DEFAULT 'user',
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  status public.ad_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type public.transaction_type NOT NULL,
  status public.transaction_status DEFAULT 'pending',
  proof_image TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_logs table
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can read their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Anyone can read public profile data" 
ON public.profiles FOR SELECT 
USING (true);

-- RLS Policies for ads
CREATE POLICY "Ads are public for reading" 
ON public.ads FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own ads" 
ON public.ads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" 
ON public.ads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" 
ON public.ads FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can read their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all transactions" 
ON public.transactions FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update transactions" 
ON public.transactions FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for reviews
CREATE POLICY "Reviews are public for reading" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can insert reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = author_id);

-- RLS Policies for admin_logs
CREATE POLICY "Only admins can read admin logs" 
ON public.admin_logs FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can insert admin logs" 
ON public.admin_logs FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, role, rating)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'phone',
    'user',
    0.00
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();