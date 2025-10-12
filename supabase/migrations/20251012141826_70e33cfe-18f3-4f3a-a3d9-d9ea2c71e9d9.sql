-- Allow authenticated users to view available orders (pending status, no executor assigned)
CREATE POLICY "Anyone can view available orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  status = 'pending' 
  AND executor_id IS NULL
);