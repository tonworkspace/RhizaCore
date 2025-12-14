-- SQL Migration: Fix wallet address duplicates and add UNIQUE constraint
-- This handles the case where duplicate wallet addresses exist in the database

-- Step 1: Identify all duplicate wallet addresses
CREATE TEMP TABLE duplicate_wallet_addresses AS
SELECT 
    wallet_address,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as user_ids
FROM users
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Step 2: Display the duplicates for review
SELECT * FROM duplicate_wallet_addresses ORDER BY duplicate_count DESC;

-- Step 3: For each duplicate group, keep the oldest user and nullify others
-- This preserves the first user created while allowing others to set new wallet addresses
UPDATE users u
SET wallet_address = NULL
WHERE u.id IN (
    SELECT unnest(user_ids[2:]) -- Get all user IDs except the first (oldest) one
    FROM duplicate_wallet_addresses
);

-- Step 4: Verify the fix worked
SELECT wallet_address, COUNT(*) as count
FROM users
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Step 5: Now add the UNIQUE constraint
ALTER TABLE users
ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);

-- Step 6: Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Step 7: Verify the constraint was added successfully
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_name = 'users_wallet_address_key';

-- Step 8: Clean up temporary table
DROP TABLE IF EXISTS duplicate_wallet_addresses;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully fixed wallet address duplicates and added UNIQUE constraint!';
    RAISE NOTICE '🔧 Duplicate wallet addresses have been resolved by nullifying duplicates.';
    RAISE NOTICE '💡 The oldest user (by created_at) for each wallet address was preserved.';
    RAISE NOTICE '📝 Users with nullified wallet addresses can now set new unique wallet addresses.';
END
$$;