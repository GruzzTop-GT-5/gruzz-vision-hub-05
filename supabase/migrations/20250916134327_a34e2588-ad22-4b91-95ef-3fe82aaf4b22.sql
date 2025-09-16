-- Добавляем права администраторам на удаление объявлений
CREATE POLICY "Moderators can delete ads" 
ON public.ads 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['moderator'::user_role, 'admin'::user_role, 'system_admin'::user_role]));

-- Добавляем права администраторам на удаление заказов
CREATE POLICY "Moderators can delete orders" 
ON public.orders 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role]));

-- Добавляем права пользователям удалять свои заказы
CREATE POLICY "Users can delete their own orders" 
ON public.orders 
FOR DELETE 
USING (auth.uid() = client_id);