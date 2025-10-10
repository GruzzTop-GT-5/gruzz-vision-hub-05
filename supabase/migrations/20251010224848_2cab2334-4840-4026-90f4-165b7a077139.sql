-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

-- Create new policy that allows participants to see all messages in their conversations
CREATE POLICY "Participants can view all messages in conversation"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND auth.uid() = ANY(conversations.participants)
  )
  OR
  get_user_role(auth.uid()) = ANY(ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role, 'support'::user_role])
);