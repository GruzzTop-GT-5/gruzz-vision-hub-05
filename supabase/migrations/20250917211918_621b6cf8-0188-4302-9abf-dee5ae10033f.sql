-- Включаем REPLICA IDENTITY FULL для всех таблиц для полной передачи данных в real-time
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.ads REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.user_bans REPLICA IDENTITY FULL;
ALTER TABLE public.moderation_rules REPLICA IDENTITY FULL;
ALTER TABLE public.admin_logs REPLICA IDENTITY FULL;
ALTER TABLE public.security_logs REPLICA IDENTITY FULL;

-- Добавляем таблицы в публикацию supabase_realtime для активации real-time функциональности
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moderation_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;