-- Make payment-proofs bucket public for viewing signed URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';