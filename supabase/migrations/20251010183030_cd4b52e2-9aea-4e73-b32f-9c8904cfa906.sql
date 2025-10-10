-- Fix search_path for get_user_badge function
CREATE OR REPLACE FUNCTION public.get_user_badge(p_rating numeric)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
DECLARE
  badge_info jsonb;
BEGIN
  -- Determine badge based on rating
  IF p_rating >= 4.8 THEN
    badge_info := jsonb_build_object(
      'name', 'Платина',
      'level', 5,
      'color', '#E5E4E2',
      'icon', '💎',
      'description', 'Выдающийся исполнитель'
    );
  ELSIF p_rating >= 4.5 THEN
    badge_info := jsonb_build_object(
      'name', 'Золото',
      'level', 4,
      'color', '#FFD700',
      'icon', '🥇',
      'description', 'Отличный исполнитель'
    );
  ELSIF p_rating >= 4.0 THEN
    badge_info := jsonb_build_object(
      'name', 'Серебро',
      'level', 3,
      'color', '#C0C0C0',
      'icon', '🥈',
      'description', 'Хороший исполнитель'
    );
  ELSIF p_rating >= 3.5 THEN
    badge_info := jsonb_build_object(
      'name', 'Бронза',
      'level', 2,
      'color', '#CD7F32',
      'icon', '🥉',
      'description', 'Надежный исполнитель'
    );
  ELSE
    badge_info := jsonb_build_object(
      'name', 'Новичок',
      'level', 1,
      'color', '#94A3B8',
      'icon', '⭐',
      'description', 'Начинающий исполнитель'
    );
  END IF;
  
  RETURN badge_info;
END;
$$;