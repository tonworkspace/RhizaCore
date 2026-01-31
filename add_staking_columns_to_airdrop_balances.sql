-- Add staking columns to airdrop_balances table
-- This migration adds the staked_balance and last_stake_date columns needed for the staking feature

-- Add staked_balance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'airdrop_balances' 
        AND column_name = 'staked_balance'
    ) THEN
        ALTER TABLE airdrop_balances 
        ADD COLUMN staked_balance DECIMAL(20, 8) NOT NULL DEFAULT 0;
        
        COMMENT ON COLUMN airdrop_balances.staked_balance IS 'Amount currently staked (70% of available balance when staking)';
        
        RAISE NOTICE 'Added staked_balance column to airdrop_balances table';
    ELSE
        RAISE NOTICE 'staked_balance column already exists in airdrop_balances table';
    END IF;
END $$;

-- Add last_stake_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'airdrop_balances' 
        AND column_name = 'last_stake_date'
    ) THEN
        ALTER TABLE airdrop_balances 
        ADD COLUMN last_stake_date TIMESTAMPTZ;
        
        COMMENT ON COLUMN airdrop_balances.last_stake_date IS 'Last time user staked their airdrop balance';
        
        RAISE NOTICE 'Added last_stake_date column to airdrop_balances table';
    ELSE
        RAISE NOTICE 'last_stake_date column already exists in airdrop_balances table';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'airdrop_balances' 
AND column_name IN ('staked_balance', 'last_stake_date')
ORDER BY column_name;

-- Show a sample of the updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'airdrop_balances' 
ORDER BY ordinal_position;