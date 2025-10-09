-- Создание таблицы откликов на заказы
CREATE TABLE IF NOT EXISTS public.order_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  executor_id UUID NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, executor_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_order_bids_order_id ON public.order_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_order_bids_executor_id ON public.order_bids(executor_id);
CREATE INDEX IF NOT EXISTS idx_order_bids_status ON public.order_bids(status);

-- Включаем RLS
ALTER TABLE public.order_bids ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
-- Исполнители могут создавать отклики
CREATE POLICY "Executors can create bids"
ON public.order_bids
FOR INSERT
WITH CHECK (auth.uid() = executor_id);

-- Исполнители могут видеть свои отклики
CREATE POLICY "Executors can view their bids"
ON public.order_bids
FOR SELECT
USING (auth.uid() = executor_id);

-- Заказчики могут видеть отклики на свои заказы
CREATE POLICY "Clients can view bids on their orders"
ON public.order_bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_bids.order_id
    AND orders.client_id = auth.uid()
  )
);

-- Заказчики могут обновлять статус откликов на свои заказы
CREATE POLICY "Clients can update bid status"
ON public.order_bids
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_bids.order_id
    AND orders.client_id = auth.uid()
  )
);

-- Администраторы могут управлять всеми откликами
CREATE POLICY "Admins can manage all bids"
ON public.order_bids
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['system_admin'::user_role, 'admin'::user_role, 'moderator'::user_role]));

-- Триггер для обновления updated_at
CREATE TRIGGER update_order_bids_updated_at
BEFORE UPDATE ON public.order_bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Комментарии
COMMENT ON TABLE public.order_bids IS 'Отклики исполнителей на заказы';
COMMENT ON COLUMN public.order_bids.status IS 'Статус отклика: pending, accepted, rejected';