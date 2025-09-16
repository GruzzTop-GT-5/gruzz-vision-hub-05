-- Выдаем роль системного администратора пользователю с ID 0000000000
UPDATE public.profiles 
SET role = 'system_admin'::user_role,
    updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000000';