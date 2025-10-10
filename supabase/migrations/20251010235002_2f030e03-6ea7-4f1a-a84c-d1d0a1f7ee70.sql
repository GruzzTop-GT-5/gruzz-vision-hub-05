-- Система премодерации отзывов
-- Добавляем поле статуса модерации
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'review_moderation_status'
  ) THEN
    CREATE TYPE review_moderation_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS moderation_status review_moderation_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Обновляем существующие отзывы
-- Те что is_moderated = false и is_hidden = false считаем одобренными
UPDATE public.reviews 
SET moderation_status = CASE 
  WHEN is_moderated = false AND is_hidden = false THEN 'approved'::review_moderation_status
  WHEN is_hidden = true THEN 'rejected'::review_moderation_status
  ELSE 'pending'::review_moderation_status
END
WHERE moderation_status IS NULL;

-- Обновляем функцию расчета рейтинга - учитываем только одобренные отзывы
CREATE OR REPLACE FUNCTION public.update_user_rating_with_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  visible_reviews_count INTEGER;
  verified_reviews INTEGER;
  raw_rating NUMERIC(3,2);
  final_rating NUMERIC(3,2);
  rating_dist JSONB;
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
  
  -- Распределение только одобренных отзывов
  WITH rating_counts AS (
    SELECT 
      rating,
      COUNT(*) as count
    FROM public.reviews
    WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
    AND rating IS NOT NULL
    AND moderation_status = 'approved'
    GROUP BY rating
  )
  SELECT jsonb_object_agg(rating::text, count)
  INTO rating_dist
  FROM rating_counts;
  
  IF rating_dist IS NULL THEN
    rating_dist := '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb;
  ELSE
    rating_dist := rating_dist || 
      jsonb_build_object(
        '1', COALESCE((rating_dist->>'1')::integer, 0),
        '2', COALESCE((rating_dist->>'2')::integer, 0),
        '3', COALESCE((rating_dist->>'3')::integer, 0),
        '4', COALESCE((rating_dist->>'4')::integer, 0),
        '5', COALESCE((rating_dist->>'5')::integer, 0)
      );
  END IF;
  
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
  
  -- Обновляем профиль
  UPDATE public.profiles 
  SET 
    rating = final_rating,
    reviews_count = visible_reviews_count,
    verified_reviews_count = verified_reviews,
    rating_distribution = rating_dist
  WHERE id = COALESCE(NEW.target_user_id, OLD.target_user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Создаем индекс для быстрого поиска отзывов на модерации
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status 
ON public.reviews(moderation_status) 
WHERE moderation_status = 'pending';

-- Триггер для уведомления админов о новых отзывах
CREATE OR REPLACE FUNCTION public.notify_admins_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_id uuid;
BEGIN
  -- Уведомляем всех администраторов о новом отзыве на модерации
  FOR admin_id IN 
    SELECT id FROM public.profiles 
    WHERE role IN ('system_admin', 'admin', 'moderator')
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      content
    ) VALUES (
      admin_id,
      'review_moderation',
      'Новый отзыв на модерации',
      'Пользователь оставил отзыв, требуется проверка'
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Создаем триггер только для INSERT
DROP TRIGGER IF EXISTS notify_admins_on_new_review ON public.reviews;
CREATE TRIGGER notify_admins_on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  WHEN (NEW.moderation_status = 'pending')
  EXECUTE FUNCTION public.notify_admins_new_review();