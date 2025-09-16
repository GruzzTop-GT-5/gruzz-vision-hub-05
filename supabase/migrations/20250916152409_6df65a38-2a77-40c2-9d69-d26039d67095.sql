-- Добавляем поля для модерации отзывов
ALTER TABLE public.reviews 
ADD COLUMN admin_bonus_points integer DEFAULT 0,
ADD COLUMN admin_comment text,
ADD COLUMN is_hidden boolean DEFAULT false,
ADD COLUMN hidden_by uuid REFERENCES auth.users(id),
ADD COLUMN hidden_at timestamp with time zone;

-- Добавляем поля для улучшения системы поддержки
ALTER TABLE public.support_tickets
ADD COLUMN urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
ADD COLUMN response_time_minutes integer;

-- Создаем функцию для расчета рейтинга с учетом бонусных баллов
CREATE OR REPLACE FUNCTION public.update_user_rating_with_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Обновляем рейтинг для целевого пользователя с учетом бонусных баллов
  UPDATE public.profiles 
  SET rating = (
    SELECT COALESCE(
      (SUM(COALESCE(rating, 0) + COALESCE(admin_bonus_points, 0)) / 
       NULLIF(COUNT(*), 0))::numeric(3,2), 
      0.00
    )
    FROM public.reviews 
    WHERE target_user_id = COALESCE(NEW.target_user_id, OLD.target_user_id)
    AND rating IS NOT NULL
    AND is_moderated = false 
    AND is_hidden = false -- Исключаем скрытые отзывы
  )
  WHERE id = COALESCE(NEW.target_user_id, OLD.target_user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Создаем триггер для обновления рейтинга с бонусами
DROP TRIGGER IF EXISTS update_user_rating_trigger ON public.reviews;
CREATE TRIGGER update_user_rating_with_bonus_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_user_rating_with_bonus();

-- RLS политики для модерации отзывов
CREATE POLICY "Staff can moderate reviews" 
ON public.reviews 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role]));

CREATE POLICY "Staff can hide reviews" 
ON public.reviews 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role]));

-- Обновляем политику чтения отзывов - скрываем скрытые отзывы от обычных пользователей
DROP POLICY IF EXISTS "Reviews are public for reading" ON public.reviews;
CREATE POLICY "Reviews are public for reading" 
ON public.reviews 
FOR SELECT 
USING (
  is_hidden = false OR 
  get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role])
);

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_reviews_hidden ON public.reviews(is_hidden);
CREATE INDEX IF NOT EXISTS idx_reviews_target_user_rating ON public.reviews(target_user_id, rating) WHERE is_hidden = false AND is_moderated = false;
CREATE INDEX IF NOT EXISTS idx_support_tickets_urgency ON public.support_tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_support_tickets_response_time ON public.support_tickets(response_time_minutes);