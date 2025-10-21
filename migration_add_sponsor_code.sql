-- Migration script to add sponsor_code column to users table
-- Run this script in your Supabase SQL editor

-- Step 1: Add sponsor_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS sponsor_code TEXT UNIQUE;

-- Step 2: Add index for sponsor_code for better performance
CREATE INDEX IF NOT EXISTS idx_users_sponsor_code ON users(sponsor_code);

-- Step 3: Update existing users with generated sponsor codes
-- This will generate sponsor codes for existing users
UPDATE users 
SET sponsor_code = UPPER(SUBSTRING(username, 1, 3) || '-' || LPAD(id::text, 4, '0') || SUBSTRING(MD5(RANDOM()::text), 1, 3))
WHERE sponsor_code IS NULL;

-- Step 4: Ensure all users have unique sponsor codes
-- If there are any duplicates, regenerate them
WITH duplicates AS (
  SELECT id, sponsor_code, ROW_NUMBER() OVER (PARTITION BY sponsor_code ORDER BY id) as rn
  FROM users 
  WHERE sponsor_code IS NOT NULL
)
UPDATE users 
SET sponsor_code = UPPER(SUBSTRING(username, 1, 3) || '-' || LPAD(id::text, 4, '0') || SUBSTRING(MD5(RANDOM()::text), 1, 3))
FROM duplicates 
WHERE users.id = duplicates.id AND duplicates.rn > 1;

-- Step 5: Add constraint to ensure sponsor_code is always unique
ALTER TABLE users ADD CONSTRAINT unique_sponsor_code UNIQUE (sponsor_code);

-- Note: After running this migration, all users will have unique sponsor codes
-- The format will be: USER-1234ABC (3 letters from username + 4 digit ID + 3 random chars)
