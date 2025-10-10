-- Исправляем функцию обновления рейтинга
-- При отсутствии видимых отзывов рейтинг должен возвращаться к 5.00
CREATE OR REPLACE FUNCTION public.update_user_rating_with_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  visible_reviews_count INTEGER;
  calculated_rating NUMERIC(3,2);
BEGIN
  -- Подсчитываем количество видимых отзывов с рейтингом
  SELECT COUNT(*) INTO visible_reviews_count
  FROM public.reviews 
  WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
  AND rating IS NOT NULL
  AND is_moderated = false 
  AND is_hidden = false;
  
  -- Если есть видимые отзывы, вычисляем средний рейтинг
  IF visible_reviews_count > 0 THEN
    SELECT (SUM(COALESCE(rating, 0) + COALESCE(admin_bonus_points, 0)) / 
            NULLIF(COUNT(*), 0))::numeric(3,2)
    INTO calculated_rating
    FROM public.reviews 
    WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
    AND rating IS NOT NULL
    AND is_moderated = false 
    AND is_hidden = false;
    
    calculated_rating := COALESCE(calculated_rating, 5.00);
  ELSE
    -- Если нет видимых отзывов, возвращаем начальный рейтинг 5.00
    calculated_rating := 5.00;
  END IF;
  
  -- Обновляем рейтинг пользователя
  UPDATE public.profiles 
  SET rating = calculated_rating
  WHERE id = COALESCE(NEW.target_user_id, OLD.target_user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;