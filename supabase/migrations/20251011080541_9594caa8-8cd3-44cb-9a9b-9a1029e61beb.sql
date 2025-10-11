-- Добавляем поля для отслеживания удаления чатов
ALTER TABLE public.conversations 
ADD COLUMN deleted_by uuid[] DEFAULT '{}',
ADD COLUMN deleted_at timestamp with time zone,
ADD COLUMN permanently_deleted boolean DEFAULT false,
ADD COLUMN permanently_deleted_by uuid,
ADD COLUMN permanently_deleted_at timestamp with time zone;

-- Комментарии для документации
COMMENT ON COLUMN public.conversations.deleted_by IS 'Массив UUID пользователей, которые удалили этот чат';
COMMENT ON COLUMN public.conversations.deleted_at IS 'Время последнего удаления чата пользователем';
COMMENT ON COLUMN public.conversations.permanently_deleted IS 'Чат полностью удален (недоступен никому кроме админов)';
COMMENT ON COLUMN public.conversations.permanently_deleted_by IS 'Кто полностью удалил чат';
COMMENT ON COLUMN public.conversations.permanently_deleted_at IS 'Когда чат был полностью удален';

-- Функция для автоматического удаления, когда все участники удалили чат
CREATE OR REPLACE FUNCTION public.check_conversation_full_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Если все участники удалили чат, помечаем его как permanently_deleted
  IF array_length(NEW.participants, 1) IS NOT NULL AND
     array_length(NEW.deleted_by, 1) = array_length(NEW.participants, 1) AND
     NEW.participants <@ NEW.deleted_by THEN
    NEW.permanently_deleted := true;
    NEW.permanently_deleted_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Триггер для автоматической проверки полного удаления
CREATE TRIGGER trigger_check_conversation_deletion
  BEFORE UPDATE OF deleted_by ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_conversation_full_deletion();

-- Обновляем RLS политики для учета удаления
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    (
      -- Пользователь является участником
      auth.uid() = ANY (participants) 
      -- И не удалил чат (или чат не помечен как удаленный этим пользователем)
      AND (deleted_by IS NULL OR NOT (auth.uid() = ANY (deleted_by)))
    )
    OR 
    -- Или пользователь - администратор (видят все чаты, даже удаленные)
    (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role, 'support'::user_role]))
  );