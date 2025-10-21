-- Migration script to add sponsor_id column and migrate existing data
-- Run this script in your Supabase SQL editor

-- Step 1: Add sponsor_id column to referrals table
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS sponsor_id BIGINT REFERENCES users(id);

-- Step 2: Copy existing referrer_id data to sponsor_id
UPDATE referrals SET sponsor_id = referrer_id WHERE sponsor_id IS NULL;

-- Step 3: Make sponsor_id NOT NULL after data migration
ALTER TABLE referrals ALTER COLUMN sponsor_id SET NOT NULL;

-- Step 4: Add index for sponsor_id
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_id ON referrals(sponsor_id);

-- Step 5: Update referral_earnings table to use sponsor_id
ALTER TABLE referral_earnings ADD COLUMN IF NOT EXISTS sponsor_id INTEGER REFERENCES users(id);

-- Step 6: Copy existing referrer_id data to sponsor_id in referral_earnings
UPDATE referral_earnings SET sponsor_id = referrer_id WHERE sponsor_id IS NULL;

-- Step 7: Add index for sponsor_id in referral_earnings
CREATE INDEX IF NOT EXISTS idx_referral_earnings_sponsor_id ON referral_earnings(sponsor_id);

-- Step 8: Update users table to add sponsor_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS sponsor_id BIGINT REFERENCES users(id);

-- Step 9: Copy existing referrer_id data to sponsor_id in users
UPDATE users SET sponsor_id = referrer_id WHERE sponsor_id IS NULL;

-- Step 10: Add index for sponsor_id in users
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);

-- Note: You may want to keep referrer_id columns for backward compatibility
-- or drop them after confirming everything works with sponsor_id
-- To drop old columns (uncomment when ready):
-- ALTER TABLE referrals DROP COLUMN IF EXISTS referrer_id;
-- ALTER TABLE referral_earnings DROP COLUMN IF EXISTS referrer_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS referrer_id;
