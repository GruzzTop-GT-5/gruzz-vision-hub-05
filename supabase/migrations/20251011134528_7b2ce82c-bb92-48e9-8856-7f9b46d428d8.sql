-- Добавляем RLS политику для удаления профилей администраторами
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role])
);

-- Комментарий
COMMENT ON POLICY "Admins can delete profiles" ON public.profiles IS 'Позволяет администраторам удалять профили пользователей';