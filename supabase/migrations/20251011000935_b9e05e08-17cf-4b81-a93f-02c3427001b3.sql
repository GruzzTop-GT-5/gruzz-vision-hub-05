-- Создаем функцию для байесовского сглаживания рейтинга
CREATE OR REPLACE FUNCTION public.calculate_bayesian_rating(
  raw_rating NUMERIC,
  review_count INTEGER,
  min_reviews_for_stable INTEGER DEFAULT 5,
  global_average NUMERIC DEFAULT 4.0
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Байесовское среднее: (C × m + n × R) / (C + n)
  -- где:
  -- C = минимальное количество отзывов для стабильного рейтинга
  -- m = средний рейтинг по платформе
  -- n = количество отзывов пользователя
  -- R = средний рейтинг пользователя
  
  IF review_count = 0 THEN
    RETURN global_average;
  END IF;
  
  RETURN (
    (min_reviews_for_stable * global_average + review_count * raw_rating) / 
    (min_reviews_for_stable + review_count)
  )::NUMERIC(3,2);
END;
$$;