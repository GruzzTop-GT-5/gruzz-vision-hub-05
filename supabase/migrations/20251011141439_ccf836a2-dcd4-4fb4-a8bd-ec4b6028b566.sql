-- Fix storage policies for payment-proofs bucket to allow signed URL generation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;

-- Create updated policies with proper permissions
CREATE POLICY "Users can upload their payment proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-proofs' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    get_user_role(auth.uid()) IN ('admin', 'system_admin', 'support')
  )
);

CREATE POLICY "Admins can manage all payment proofs" 
ON storage.objects 
FOR ALL
USING (
  bucket_id = 'payment-proofs' AND 
  get_user_role(auth.uid()) IN ('admin', 'system_admin')
)
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  get_user_role(auth.uid()) IN ('admin', 'system_admin')
);