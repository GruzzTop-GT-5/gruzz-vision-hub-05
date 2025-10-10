-- Update trigger to set rating to 5 for new users
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert or update profile with phone from auth metadata and rating 5
  INSERT INTO public.profiles (id, phone, rating)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    5.00
  )
  ON CONFLICT (id) DO UPDATE
  SET phone = COALESCE(EXCLUDED.phone, profiles.phone),
      rating = COALESCE(profiles.rating, 5.00);
  
  RETURN NEW;
END;
$$;

-- Create function to get user badge based on rating
CREATE OR REPLACE FUNCTION public.get_user_badge(p_rating numeric)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
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

COMMENT ON FUNCTION public.get_user_badge IS 'Returns badge information based on user rating';

-- Update default rating for profiles table
ALTER TABLE public.profiles 
ALTER COLUMN rating SET DEFAULT 5.00;