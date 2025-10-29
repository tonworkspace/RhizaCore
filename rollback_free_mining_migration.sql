-- ROLLBACK SCRIPT for Free Mining Period Migration
-- Use this ONLY if you need to revert the free mining period changes
-- This script will remove the new table and functions safely

-- WARNING: This will remove all free mining period data!
-- Make sure to backup your data before running this rollback

-- Step 1: Drop the functions first (to avoid dependency issues)
DROP FUNCTION IF EXISTS get_free_mining_status(BIGINT);
DROP FUNCTION IF EXISTS increment_mining_session_count(BIGINT);
DROP FUNCTION IF EXISTS can_user_mine_free(BIGINT);
DROP FUNCTION IF EXISTS initialize_or_update_free_mining_period(BIGINT);

-- Step 2: Drop the table (this will remove all data!)
DROP TABLE IF EXISTS free_mining_periods CASCADE;

-- Step 3: Verify cleanup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mining_periods') THEN
        RAISE NOTICE 'Successfully removed free_mining_periods table';
    ELSE
        RAISE NOTICE 'WARNING: free_mining_periods table still exists!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_free_mining_status') THEN
        RAISE NOTICE 'Successfully removed free mining period functions';
    ELSE
        RAISE NOTICE 'WARNING: Some functions may still exist!';
    END IF;
END $$;

-- Note: After running this rollback, you'll need to:
-- 1. Update your TypeScript code to use the old free mining system
-- 2. Or implement a different free mining approach
-- 3. Test thoroughly to ensure the app still works
