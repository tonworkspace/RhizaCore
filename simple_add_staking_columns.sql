-- Simple migration to add staking columns to airdrop_balances table
-- Run this if the airdrop_balances table already exists but is missing the staking columns

ALTER TABLE airdrop_balances 
ADD COLUMN IF NOT EXISTS staked_balance DECIMAL(20, 8) NOT NULL DEFAULT 0;

ALTER TABLE airdrop_balances 
ADD COLUMN IF NOT EXISTS last_stake_date TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN airdrop_balances.staked_balance IS 'Amount currently staked (70% of available balance when staking)';
COMMENT ON COLUMN airdrop_balances.last_stake_date IS 'Last time user staked their airdrop balance';