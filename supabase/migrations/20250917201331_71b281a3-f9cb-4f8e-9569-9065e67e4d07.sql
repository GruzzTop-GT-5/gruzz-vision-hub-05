-- Перенос extensions из public схемы в безопасную схему
-- Создаем схему extensions если её нет
CREATE SCHEMA IF NOT EXISTS extensions;

-- Переносим все extensions из public в extensions схему
-- Сначала получаем список extensions в public схеме
DO $$
DECLARE
    ext_name text;
BEGIN
    -- Переносим известные extensions
    FOR ext_name IN 
        SELECT extname 
        FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
    END LOOP;
END $$;

-- Обновляем search_path для функций чтобы они могли найти extensions
ALTER DATABASE postgres SET search_path = public, extensions;