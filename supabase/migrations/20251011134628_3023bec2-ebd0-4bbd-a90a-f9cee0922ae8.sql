-- Обновляем foreign key constraints для каскадного удаления при удалении профиля

-- Сначала удаляем старые constraints
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_author_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_user_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_client_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_executor_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_created_by_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.user_bans DROP CONSTRAINT IF EXISTS user_bans_user_id_fkey;
ALTER TABLE public.admin_logs DROP CONSTRAINT IF EXISTS admin_logs_user_id_fkey;
ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_user_id_fkey;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_created_by_fkey;

-- Создаем новые constraints с CASCADE DELETE
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_target_user_id_fkey 
  FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_executor_id_fkey 
  FOREIGN KEY (executor_id) REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.user_bans 
  ADD CONSTRAINT user_bans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.admin_logs 
  ADD CONSTRAINT admin_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.ads 
  ADD CONSTRAINT ads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.support_tickets 
  ADD CONSTRAINT support_tickets_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Комментарий
COMMENT ON CONSTRAINT notifications_user_id_fkey ON public.notifications IS 'Каскадное удаление уведомлений при удалении пользователя';
COMMENT ON CONSTRAINT reviews_author_id_fkey ON public.reviews IS 'Каскадное удаление отзывов автора при удалении пользователя';
COMMENT ON CONSTRAINT reviews_target_user_id_fkey ON public.reviews IS 'Каскадное удаление отзывов о пользователе при его удалении';
COMMENT ON CONSTRAINT orders_client_id_fkey ON public.orders IS 'Каскадное удаление заказов клиента при удалении пользователя';
COMMENT ON CONSTRAINT transactions_user_id_fkey ON public.transactions IS 'Каскадное удаление транзакций при удалении пользователя';
COMMENT ON CONSTRAINT user_bans_user_id_fkey ON public.user_bans IS 'Каскадное удаление банов при удалении пользователя';