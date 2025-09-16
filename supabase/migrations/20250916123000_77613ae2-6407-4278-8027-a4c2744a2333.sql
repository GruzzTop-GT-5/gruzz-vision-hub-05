-- Создаем функцию для предотвращения самоизменения роли system_admin
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем, если пользователь пытается изменить свою роль с system_admin на что-то другое
  IF OLD.role = 'system_admin'::user_role 
     AND NEW.role != 'system_admin'::user_role 
     AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'Системный администратор не может снять свою роль самостоятельно';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для проверки изменений ролей
CREATE TRIGGER prevent_self_admin_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_change();