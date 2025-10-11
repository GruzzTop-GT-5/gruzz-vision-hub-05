-- Обновляем RLS политику для отправки сообщений
-- Администраторы должны иметь возможность отправлять сообщения в любые разговоры поддержки

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = sender_id) 
    AND 
    (
      -- Обычный пользователь - должен быть участником
      EXISTS (
        SELECT 1
        FROM public.conversations
        WHERE conversations.id = messages.conversation_id
        AND auth.uid() = ANY (conversations.participants)
      )
      OR
      -- Администраторы/поддержка могут отправлять сообщения в любые разговоры
      (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'support'::user_role]))
    )
  );

-- Также обновим политику для обновления разговоров
-- чтобы администраторы могли добавлять себя в участники при необходимости
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

CREATE POLICY "Participants can update conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = ANY (participants)) 
    OR 
    (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'support'::user_role]))
  )
  WITH CHECK (
    (auth.uid() = ANY (participants)) 
    OR 
    (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'support'::user_role]))
  );