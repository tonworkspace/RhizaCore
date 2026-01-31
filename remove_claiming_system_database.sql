-- =====================================================
-- RZC CLAIMING SYSTEM REMOVAL - DATABASE CLEANUP
-- =====================================================
-- 
-- ⚠️  WARNING: This script will permanently remove all claiming-related
--     data and functionality from the database. This action is irreversible.
--
-- Before running this script:
-- 1. Create a full database backup
-- 2. Ensure all users are aware of the change
-- 3. Consider data export if needed for historical records
--
-- =====================================================

-- Step 1: Remove claiming-related activity records
-- =====================================================

-- Delete all RZC claim activities
DELETE FROM activities 
WHERE type IN ('rzc_claim', 'rzc_unclaim', 'dev_reset_claim_status');

-- Remove claim metadata from mining activities
UPDATE activities 
SET metadata = metadata - 'claimed_to_airdrop' - 'claim_transaction_id' - 'claimed_at' - 'claimed_amount'
WHERE type = 'mining_complete' 
AND metadata ? 'claimed_to_airdrop';

-- Step 2: Remove claim security tables and data
-- =====================================================

-- Drop claim security tables if they exist
DROP TABLE IF EXISTS claim_security_audit CASCADE;
DROP TABLE IF EXISTS claim_locks CASCADE;
DROP TABLE IF EXISTS claim_attempts CASCADE;

-- Step 3: Remove claiming-related columns from users table
-- =====================================================

-- Remove last_claim_time column (if it exists)
ALTER TABLE users DROP COLUMN IF EXISTS last_claim_time;

-- Reset available_balance to 0 for all users (since this was claim balance)
UPDATE users SET available_balance = 0;

-- Step 4: Remove claiming-related functions
-- =====================================================

-- Drop any claiming-related stored procedures/functions
DROP FUNCTION IF EXISTS process_secure_claim(integer, numeric, text);
DROP FUNCTION IF EXISTS claim_rzc_rewards(integer, numeric);
DROP FUNCTION IF EXISTS reset_claim_status(integer);
DROP FUNCTION IF EXISTS unclaim_rzc_rewards(integer);

-- Step 5: Remove airdrop claiming tables (if they exist)
-- =====================================================

-- Drop airdrop claims table
DROP TABLE IF EXISTS airdrop_claims CASCADE;

-- Remove airdrop balance claiming columns
ALTER TABLE airdrop_balances DROP COLUMN IF EXISTS claimed_from_mining;
ALTER TABLE airdrop_balances DROP COLUMN IF EXISTS last_mining_claim_time;

-- Step 6: Remove squad mining claims (if they exist)
-- =====================================================

-- Drop squad mining claims table
DROP TABLE IF EXISTS squad_mining_claims CASCADE;

-- Remove squad claiming columns from users
ALTER TABLE users DROP COLUMN IF EXISTS last_squad_claim_at;

-- Step 7: Clean up any remaining claim-related indexes
-- =====================================================

-- Drop indexes related to claiming
DROP INDEX IF EXISTS idx_activities_claim_type;
DROP INDEX IF EXISTS idx_activities_claimed_metadata;
DROP INDEX IF EXISTS idx_users_last_claim_time;
DROP INDEX IF EXISTS idx_claim_security_audit_user_id;
DROP INDEX IF EXISTS idx_claim_locks_user_id;

-- Step 8: Remove RLS policies related to claiming
-- =====================================================

-- Drop any RLS policies for claim tables
DROP POLICY IF EXISTS "Users can view their own claim audit logs" ON claim_security_audit;
DROP POLICY IF EXISTS "Users can view their own claim locks" ON claim_locks;
DROP POLICY IF EXISTS "Users can view their own claim attempts" ON claim_attempts;

-- Step 9: Verification queries
-- =====================================================

-- Verify no claim activities remain
SELECT COUNT(*) as remaining_claim_activities 
FROM activities 
WHERE type LIKE '%claim%';

-- Verify no claim metadata remains in mining activities
SELECT COUNT(*) as activities_with_claim_metadata
FROM activities 
WHERE type = 'mining_complete' 
AND (metadata ? 'claimed_to_airdrop' OR metadata ? 'claim_transaction_id');

-- Verify all users have zero available_balance
SELECT COUNT(*) as users_with_balance
FROM users 
WHERE available_balance > 0;

-- Step 10: Final cleanup and optimization
-- =====================================================

-- Vacuum tables to reclaim space
VACUUM ANALYZE activities;
VACUUM ANALYZE users;
VACUUM ANALYZE airdrop_balances;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RZC CLAIMING SYSTEM REMOVAL COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'The following has been removed:';
    RAISE NOTICE '- All claim activity records';
    RAISE NOTICE '- Claim metadata from mining activities';
    RAISE NOTICE '- Claim security tables and functions';
    RAISE NOTICE '- User claim balances and timestamps';
    RAISE NOTICE '- Airdrop and squad claiming features';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Remove claiming code from frontend';
    RAISE NOTICE '2. Update UI to remove claim buttons';
    RAISE NOTICE '3. Test application functionality';
    RAISE NOTICE '========================================';
END $$;