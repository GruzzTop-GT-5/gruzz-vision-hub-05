-- Разрешаем пользователям обновлять статус своих pending транзакций на completed
CREATE POLICY "Users can complete their pending transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'completed'
);