-- Add missing columns to users table for daily login rewards system
-- These columns track daily login streaks and claim history

-- Add last_daily_claim_date column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_daily_claim_date TIMESTAMP WITH TIME ZONE;

-- Add daily_streak_count column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS daily_streak_count INTEGER DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN users.last_daily_claim_date IS 'Timestamp of the last daily login reward claim by the user';
COMMENT ON COLUMN users.daily_streak_count IS 'Current consecutive daily login streak count for the user';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_daily_claim_date ON users(last_daily_claim_date);
CREATE INDEX IF NOT EXISTS idx_users_daily_streak_count ON users(daily_streak_count);

-- Optional: Add a check constraint to ensure streak count is not negative
-- (This is optional and can be removed if not needed)
-- ALTER TABLE users
-- ADD CONSTRAINT chk_daily_streak_count_non_negative
-- CHECK (daily_streak_count >= 0);