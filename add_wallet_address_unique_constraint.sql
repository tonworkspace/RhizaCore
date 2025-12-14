-- SQL Migration: Add UNIQUE constraint to wallet_address column
-- This fixes the "no unique or exclusion constraint matching the ON CONFLICT specification" error
-- Run this in your Supabase SQL editor to fix the wallet login issue

-- First, check if there are any duplicate wallet addresses
-- This helps identify potential issues before adding the constraint
SELECT wallet_address, COUNT(*) as count
FROM users
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- If duplicates exist, you may need to clean them up first
-- For example, you could merge the users or set duplicate wallet addresses to NULL

-- Add the UNIQUE constraint to wallet_address column
-- This allows the upsert operation in createOrUpdateUser to work properly
ALTER TABLE users
ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);

-- Create an index on wallet_address for better performance
-- This is optional but recommended for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Verify the constraint was added successfully
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_name = 'users_wallet_address_key';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully added UNIQUE constraint to wallet_address column!';
    RAISE NOTICE '🔧 The wallet login issue should now be resolved.';
    RAISE NOTICE '💡 The createOrUpdateUser function can now properly handle conflicts on wallet_address.';
END
$$;