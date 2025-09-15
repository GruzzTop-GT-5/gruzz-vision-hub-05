-- Создаем таблицу для кастомной аутентификации
CREATE TABLE public.users_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Включаем RLS
ALTER TABLE public.users_auth ENABLE ROW LEVEL SECURITY;

-- Политика - пользователи могут видеть только свою запись
CREATE POLICY "Users can view their own auth record" 
ON public.users_auth 
FOR SELECT 
USING (phone = current_setting('app.current_phone', true));

-- Политика для вставки (регистрация)
CREATE POLICY "Anyone can register" 
ON public.users_auth 
FOR INSERT 
WITH CHECK (true);

-- Функция для хеширования паролей
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Простое хеширование с солью (в продакшене лучше использовать bcrypt)
  RETURN encode(digest(password || 'gruzztop_salt_2024', 'sha256'), 'hex');
END;
$$;

-- Функция для проверки пароля
CREATE OR REPLACE FUNCTION public.verify_password(phone_input TEXT, password_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  stored_hash TEXT;
  input_hash TEXT;
BEGIN
  -- Получаем хеш пароля для данного телефона
  SELECT id, password_hash INTO user_id, stored_hash
  FROM public.users_auth 
  WHERE phone = phone_input AND is_active = true;
  
  IF user_id IS NULL THEN
    RETURN NULL; -- Пользователь не найден
  END IF;
  
  -- Хешируем введенный пароль
  input_hash := encode(digest(password_input || 'gruzztop_salt_2024', 'sha256'), 'hex');
  
  -- Сравниваем хеши
  IF stored_hash = input_hash THEN
    RETURN user_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Функция для регистрации пользователя
CREATE OR REPLACE FUNCTION public.register_user(phone_input TEXT, password_input TEXT, user_data JSONB DEFAULT '{}'::jsonb)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  password_hash TEXT;
BEGIN
  -- Проверяем, что пользователь не существует
  IF EXISTS (SELECT 1 FROM public.users_auth WHERE phone = phone_input) THEN
    RAISE EXCEPTION 'Пользователь с таким номером уже существует';
  END IF;
  
  -- Хешируем пароль
  password_hash := encode(digest(password_input || 'gruzztop_salt_2024', 'sha256'), 'hex');
  
  -- Создаем пользователя
  INSERT INTO public.users_auth (phone, password_hash)
  VALUES (phone_input, password_hash)
  RETURNING id INTO new_user_id;
  
  -- Создаем профиль
  INSERT INTO public.profiles (id, phone, role, rating, balance)
  VALUES (new_user_id, phone_input, 'user', 0.00, 0.00);
  
  RETURN new_user_id;
END;
$$;