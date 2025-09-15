-- RLS Policies for chat and support system

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = ANY(participants) OR 
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role, 'support'::user_role])
);

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND 
  auth.uid() = ANY(participants)
);

CREATE POLICY "Participants can update conversations" ON public.conversations
FOR UPDATE USING (
  auth.uid() = ANY(participants) OR 
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'support'::user_role])
);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (auth.uid() = ANY(participants) OR 
         get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role, 'support'::user_role]))
  )
);

CREATE POLICY "Users can send messages to their conversations" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND auth.uid() = ANY(participants)
  )
);

CREATE POLICY "Users can update their own messages" ON public.messages
FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Staff can moderate messages" ON public.messages
FOR UPDATE USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);

-- Message reactions policies
CREATE POLICY "Users can view reactions in their conversations" ON public.message_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = message_id 
    AND auth.uid() = ANY(c.participants)
  )
);

CREATE POLICY "Users can add reactions to accessible messages" ON public.message_reactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = message_id 
    AND auth.uid() = ANY(c.participants)
  )
);

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view their support tickets" ON public.support_tickets
FOR SELECT USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'support'::user_role])
);

CREATE POLICY "Users can create support tickets" ON public.support_tickets
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Staff can update support tickets" ON public.support_tickets
FOR UPDATE USING (
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'support'::user_role])
);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);