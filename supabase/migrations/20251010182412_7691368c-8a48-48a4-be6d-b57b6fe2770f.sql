-- Create admin function to update user rating
CREATE OR REPLACE FUNCTION public.admin_update_user_rating(
  p_user_id uuid,
  p_new_rating numeric,
  p_reason text,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  old_rating numeric;
  result jsonb;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_admin_id 
    AND role IN ('system_admin', 'admin', 'moderator')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Недостаточно прав'
    );
  END IF;

  -- Get old rating
  SELECT rating INTO old_rating
  FROM profiles
  WHERE id = p_user_id;

  -- Update rating
  UPDATE profiles
  SET rating = p_new_rating
  WHERE id = p_user_id;

  -- Log admin action
  INSERT INTO admin_logs (action, user_id, target_id, target_type)
  VALUES ('update_rating', p_admin_id, p_user_id, 'user');

  -- Create notification
  INSERT INTO notifications (user_id, type, title, content)
  VALUES (
    p_user_id,
    'rating_update',
    'Рейтинг изменен',
    'Ваш рейтинг был изменен на ' || p_new_rating || '. Причина: ' || p_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_rating', old_rating,
    'new_rating', p_new_rating
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.admin_update_user_rating IS 'Allows admins to update user rating with proper permissions';