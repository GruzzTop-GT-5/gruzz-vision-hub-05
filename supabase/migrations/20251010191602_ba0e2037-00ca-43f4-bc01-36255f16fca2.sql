-- Деактивируем ненужные категории (компрессор, вывоз мусора, комплексная услуга)
UPDATE categories 
SET is_active = false
WHERE name IN ('Аренда компрессора', 'Вывоз мусора', 'Комплексная услуга');

-- Деактивируем дублирующиеся категории переездов (оставим только основную)
UPDATE categories 
SET is_active = false
WHERE name IN ('Квартирный переезд', 'Офисный переезд');

-- Деактивируем лишние категории
UPDATE categories 
SET is_active = false
WHERE name IN ('Погрузка/разгрузка', 'Подсобные работы', 'Складские работы', 'Курьерские услуги', 'Строительные работы', 'Ремонтные работы');

-- Обновляем иконы на эмодзи для оставшихся категорий
UPDATE categories SET icon = '📦' WHERE name = 'Грузчики';
UPDATE categories SET icon = '🚚' WHERE name = 'Переезды';
UPDATE categories SET icon = '🔨' WHERE name = 'Ремонт и строительство';
UPDATE categories SET icon = '✨' WHERE name = 'Уборка';
UPDATE categories SET icon = '🔧' WHERE name = 'Сантехника';
UPDATE categories SET icon = '⚡' WHERE name = 'Электрика';
UPDATE categories SET icon = '🛋️' WHERE name = 'Сборка мебели';
UPDATE categories SET icon = '🌳' WHERE name = 'Садовые работы';
UPDATE categories SET icon = '🚗' WHERE name = 'Доставка';
UPDATE categories SET icon = '🔩' WHERE name = 'Разное';
UPDATE categories SET icon = '👷' WHERE name = 'Разнорабочие';
UPDATE categories SET icon = '💥' WHERE name = 'Демонтаж';