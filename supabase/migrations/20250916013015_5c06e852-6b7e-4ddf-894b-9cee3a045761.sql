-- Create categories table for ad categories management
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- icon name for UI
  color TEXT DEFAULT '#3B82F6', -- color for category display
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role]));

-- Add trigger for updating timestamps
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description, icon, color, sort_order) VALUES
('Веб-разработка', 'Создание сайтов, веб-приложений, лендингов', 'Code', '#3B82F6', 1),
('Мобильная разработка', 'Разработка мобильных приложений для iOS и Android', 'Smartphone', '#10B981', 2),
('Дизайн', 'UI/UX дизайн, графический дизайн, логотипы', 'Palette', '#F59E0B', 3),
('Копирайтинг', 'Написание текстов, статей, описаний товаров', 'PenTool', '#EF4444', 4),
('Маркетинг', 'SMM, реклама, продвижение, аналитика', 'TrendingUp', '#8B5CF6', 5),
('Переводы', 'Перевод текстов, локализация, корректура', 'Languages', '#06B6D4', 6),
('Видео и анимация', 'Монтаж видео, анимация, 3D моделирование', 'Video', '#EC4899', 7),
('Консультации', 'Экспертные консультации, обучение, менторство', 'MessageCircle', '#84CC16', 8);

-- Enable realtime for categories
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- Add category_id column to ads table and migrate existing data
ALTER TABLE public.ads ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Migrate existing category data (text to category_id)
-- Update ads with category names to use category IDs
UPDATE public.ads 
SET category_id = c.id 
FROM public.categories c 
WHERE ads.category = c.name;

-- For ads without matching categories, set to the first category
UPDATE public.ads 
SET category_id = (SELECT id FROM public.categories ORDER BY sort_order LIMIT 1)
WHERE category_id IS NULL;

-- Make category_id required after migration
ALTER TABLE public.ads ALTER COLUMN category_id SET NOT NULL;

-- Remove old category column after successful migration
-- ALTER TABLE public.ads DROP COLUMN category;