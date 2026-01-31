-- Quick fix for transaction_id column issue
-- Run this if you're getting JSON syntax errors

-- Check if transaction_id column exists and add it if missing
DO $$ 
BEGIN
    -- Add transaction_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE activities ADD COLUMN transaction_id VARCHAR(100);
        RAISE NOTICE 'Added transaction_id column to activities table';
    ELSE
        RAISE NOTICE 'transaction_id column already exists';
    END IF;
    
    -- Add security_validated column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'security_validated'
    ) THEN
        ALTER TABLE activities ADD COLUMN security_validated BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added security_validated column to activities table';
    ELSE
        RAISE NOTICE 'security_validated column already exists';
    END IF;
END $$;

-- Create unique index on transaction_id for activities (if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_transaction_id 
ON activities(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name IN ('transaction_id', 'security_validated')
ORDER BY column_name;