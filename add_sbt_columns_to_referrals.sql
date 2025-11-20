-- Migration to add SBT-related columns to referrals table
-- These columns track SBT token amounts for referrals

ALTER TABLE referrals ADD COLUMN sbt_amount NUMERIC(18,8) DEFAULT 0;
ALTER TABLE referrals ADD COLUMN total_sbt_earned NUMERIC(18,8) DEFAULT 0;

-- Add indexes for better query performance on SBT amounts
CREATE INDEX IF NOT EXISTS idx_referrals_sbt_amount ON referrals(sbt_amount);
CREATE INDEX IF NOT EXISTS idx_referrals_total_sbt_earned ON referrals(total_sbt_earned);

-- Optional: Add comments to the columns for documentation
COMMENT ON COLUMN referrals.sbt_amount IS 'Current SBT token amount for this referral';
COMMENT ON COLUMN referrals.total_sbt_earned IS 'Total SBT tokens earned from this referral';