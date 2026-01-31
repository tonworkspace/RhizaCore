-- Ensure Users Table Has Squad Mining Columns
-- This script adds missing columns to the users table for squad mining

-- Add available_balance column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'available_balance') THEN
        ALTER TABLE users ADD COLUMN available_balance DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE 'Added available_balance column to users table';
    ELSE
        RAISE NOTICE 'available_balance column already exists in users table';
    END IF;
END $$;

-- Add total_earned column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_earned') THEN
        ALTER TABLE users ADD COLUMN total_earned DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE 'Added total_earned column to users table';
    ELSE
        RAISE NOTICE 'total_earned column already exists in users table';
    END IF;
END $$;

-- Add last_squad_claim_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_squad_claim_at') THEN
        ALTER TABLE users ADD COLUMN last_squad_claim_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_squad_claim_at column to users table';
    ELSE
        RAISE NOTICE 'last_squad_claim_at column already exists in users table';
    END IF;
END $$;

-- Add total_squad_rewards column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_squad_rewards') THEN
        ALTER TABLE users ADD COLUMN total_squad_rewards DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE 'Added total_squad_rewards column to users table';
    ELSE
        RAISE NOTICE 'total_squad_rewards column already exists in users table';
    END IF;
END $$;

-- Add squad_mining_rate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'squad_mining_rate') THEN
        ALTER TABLE users ADD COLUMN squad_mining_rate DECIMAL(10, 2) DEFAULT 2.0;
        RAISE NOTICE 'Added squad_mining_rate column to users table';
    ELSE
        RAISE NOTICE 'squad_mining_rate column already exists in users table';
    END IF;
END $$;

-- Show current users table structure for squad mining columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('available_balance', 'total_earned', 'last_squad_claim_at', 'total_squad_rewards', 'squad_mining_rate')
ORDER BY column_name;