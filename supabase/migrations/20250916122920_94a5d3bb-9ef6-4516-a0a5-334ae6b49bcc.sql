-- Выдаем роль системного администратора пользователю с ID 12612b22-2405-424e-92a6-0b82b7a10131
UPDATE public.profiles 
SET role = 'system_admin'::user_role
WHERE id = '12612b22-2405-424e-92a6-0b82b7a10131';