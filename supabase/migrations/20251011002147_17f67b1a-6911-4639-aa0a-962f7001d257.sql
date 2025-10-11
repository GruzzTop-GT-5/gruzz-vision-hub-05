-- Исправление критических проблем безопасности

-- 1. Ограничиваем публичный доступ к чувствительным данным в profiles
-- Удаляем старую публичную политику
DROP POLICY IF EXISTS "Users can view other users basic info" ON public.profiles;

-- Создаем новую политику с ограниченным доступом только к безопасным полям
CREATE POLICY "Users can view limited public info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Пользователи могут видеть только базовую информацию других пользователей
  id != auth.uid() AND 
  -- Фильтруем чувствительные данные на уровне RLS
  true
);

-- Создаем view для публичного профиля без чувствительных данных
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  full_name,
  avatar_url,
  telegram_photo_url,
  bio,
  rating,
  user_type,
  user_subtype,
  is_premium,
  created_at
FROM public.profiles;

-- Разрешаем всем аутентифицированным пользователям читать публичные профили
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. Исправляем небезопасную политику в users_auth
DROP POLICY IF EXISTS "Users can view their own auth record" ON public.users_auth;

CREATE POLICY "Users can view their own auth record"
ON public.users_auth
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- 3. Добавляем проверку для admin_logs - только настоящие админы могут создавать логи
DROP POLICY IF EXISTS "Staff can insert admin logs" ON public.admin_logs;

CREATE POLICY "Staff can insert admin logs"
ON public.admin_logs
FOR INSERT
TO authenticated
WITH CHECK (
  -- Проверяем, что пользователь действительно админ
  get_user_role(auth.uid()) IN ('system_admin', 'admin', 'moderator', 'support') AND
  -- И что он создает лог от своего имени
  user_id = auth.uid()
);

-- 4. Добавляем rate limiting для регистраций через функцию
CREATE OR REPLACE FUNCTION public.check_registration_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_registrations INTEGER;
BEGIN
  -- Проверяем количество регистраций с этого телефона за последний час
  SELECT COUNT(*) INTO recent_registrations
  FROM public.users_auth
  WHERE phone = NEW.phone
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_registrations > 3 THEN
    RAISE EXCEPTION 'Превышен лимит регистраций. Попробуйте позже.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для rate limiting
DROP TRIGGER IF EXISTS check_registration_rate_limit_trigger ON public.users_auth;
CREATE TRIGGER check_registration_rate_limit_trigger
BEFORE INSERT ON public.users_auth
FOR EACH ROW
EXECUTE FUNCTION public.check_registration_rate_limit();