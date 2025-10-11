-- Добавляем политику для удаления уведомлений администраторами
CREATE POLICY "Staff can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('system_admin', 'admin', 'support', 'moderator')
);