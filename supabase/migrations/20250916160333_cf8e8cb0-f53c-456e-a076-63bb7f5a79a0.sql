-- Add moderation fields to ads table
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS moderation_comment TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moderated_by UUID;

-- Add new ad statuses
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_status') THEN
        CREATE TYPE public.ad_status AS ENUM ('active', 'pending', 'rejected', 'suspended', 'pending_review');
    ELSE
        -- Add new enum values if they don't exist
        BEGIN
            ALTER TYPE public.ad_status ADD VALUE IF NOT EXISTS 'pending_review';
            ALTER TYPE public.ad_status ADD VALUE IF NOT EXISTS 'suspended';
        EXCEPTION WHEN OTHERS THEN
            -- Values might already exist
            NULL;
        END;
    END IF;
END $$;

-- Update ads status column to use enum
ALTER TABLE public.ads ALTER COLUMN status TYPE ad_status USING status::ad_status;
ALTER TABLE public.ads ALTER COLUMN status SET DEFAULT 'pending'::ad_status;

-- Add new transaction types for admin operations
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'admin_credit';
        ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'admin_debit';
    EXCEPTION WHEN OTHERS THEN
        -- Values might already exist
        NULL;
    END;
END $$;