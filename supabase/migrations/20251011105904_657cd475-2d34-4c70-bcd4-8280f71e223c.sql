-- Изменяем qualification на массив для поддержки множественного выбора
ALTER TABLE public.profiles 
ALTER COLUMN qualification TYPE TEXT[] USING 
  CASE 
    WHEN qualification IS NULL THEN NULL
    WHEN qualification = '' THEN NULL
    ELSE ARRAY[qualification]
  END;

-- Добавляем комментарий
COMMENT ON COLUMN public.profiles.qualification IS 'Массив специализаций пользователя';