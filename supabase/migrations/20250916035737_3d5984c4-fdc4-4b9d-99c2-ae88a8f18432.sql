-- Fix numeric fields in orders table to allow larger values
ALTER TABLE public.orders 
ALTER COLUMN price TYPE numeric(10,2),
ALTER COLUMN commission_rate TYPE numeric(5,2),
ALTER COLUMN platform_fee TYPE numeric(10,2),
ALTER COLUMN escrow_amount TYPE numeric(10,2);