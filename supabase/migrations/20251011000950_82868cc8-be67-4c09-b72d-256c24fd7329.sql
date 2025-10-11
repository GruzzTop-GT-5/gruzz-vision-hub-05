-- Обновляем триггер для корректной работы с рейтингами
CREATE OR REPLACE FUNCTION public.update_user_rating_with_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  visible_reviews_count INTEGER;
  verified_reviews INTEGER;
  raw_rating NUMERIC(3,2);
  final_rating NUMERIC(3,2);
BEGIN
  -- Подсчитываем только ОДОБРЕННЫЕ отзывы
  SELECT COUNT(*) INTO visible_reviews_count
  FROM public.reviews 
  WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
  AND rating IS NOT NULL
  AND moderation_status = 'approved';
  
  -- Подсчитываем проверенные одобренные отзывы
  SELECT COUNT(*) INTO verified_reviews
  FROM public.reviews 
  WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
  AND rating IS NOT NULL
  AND moderation_status = 'approved'
  AND transaction_id IS NOT NULL;
  
  -- Вычисляем рейтинг только по одобренным отзывам
  IF visible_reviews_count > 0 THEN
    SELECT (SUM(COALESCE(rating, 0) + COALESCE(admin_bonus_points, 0)) / 
            NULLIF(COUNT(*), 0))::numeric(3,2)
    INTO raw_rating
    FROM public.reviews 
    WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
    AND rating IS NOT NULL
    AND moderation_status = 'approved';
    
    raw_rating := COALESCE(raw_rating, 5.00);
    
    -- Применяем байесовское сглаживание
    final_rating := calculate_bayesian_rating(
      raw_rating,
      visible_reviews_count,
      5,
      4.0
    );
  ELSE
    final_rating := 5.00;
  END IF;
  
  -- Обновляем только рейтинг в профиле (убираем несуществующие поля)
  UPDATE public.profiles 
  SET rating = final_rating
  WHERE id = COALESCE(NEW.target_user_id, OLD.target_user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;