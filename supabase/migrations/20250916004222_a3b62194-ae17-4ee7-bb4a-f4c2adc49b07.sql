-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public) VALUES ('order-files', 'order-files', false);

-- Create storage policies for order files
CREATE POLICY "Order participants can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND (auth.uid() = orders.client_id OR auth.uid() = orders.executor_id)
  )
);

CREATE POLICY "Order participants can view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND (auth.uid() = orders.client_id OR auth.uid() = orders.executor_id)
  )
);

CREATE POLICY "Order participants can update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND (auth.uid() = orders.client_id OR auth.uid() = orders.executor_id)
  )
);

CREATE POLICY "Order participants can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND (auth.uid() = orders.client_id OR auth.uid() = orders.executor_id)
  )
);