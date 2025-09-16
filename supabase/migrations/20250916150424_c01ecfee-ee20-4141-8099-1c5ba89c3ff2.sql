-- Настройка pg_cron для автоматического истечения заказов
-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Создаем cron job для автоматического истечения заказов каждый час
SELECT cron.schedule(
  'expire-orders-hourly',
  '0 * * * *', -- каждый час
  $$
  SELECT public.mark_expired_orders();
  $$
);