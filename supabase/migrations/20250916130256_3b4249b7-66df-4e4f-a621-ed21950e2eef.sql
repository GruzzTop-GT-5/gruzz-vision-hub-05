-- Создаем политики для доступа к файлам заказов

-- Политика для просмотра файлов заказов участниками заказа
CREATE POLICY "Order participants can view order files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'order-files' 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[1] 
    AND (
      auth.uid() = orders.client_id 
      OR auth.uid() = orders.executor_id
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('system_admin', 'admin', 'moderator')
      )
    )
  )
);

-- Политика для загрузки файлов заказов участниками заказа
CREATE POLICY "Order participants can upload order files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'order-files' 
  AND auth.uid()::text = (storage.foldername(name))[1] 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[1] 
    AND (auth.uid() = orders.client_id OR auth.uid() = orders.executor_id)
  )
);

-- Включаем RLS для storage.objects если еще не включено
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;