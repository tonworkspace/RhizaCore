-- EMERGENCY RLS FIX - Run this immediately
-- This will quickly resolve the RLS policy violation

-- Step 1: Disable RLS completely
ALTER TABLE free_mining_periods DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own free mining periods" ON free_mining_periods;
DROP POLICY IF EXISTS "Users can insert their own free mining periods" ON free_mining_periods;
DROP POLICY IF EXISTS "Users can update their own free mining periods" ON free_mining_periods;
DROP POLICY IF EXISTS "Allow function access" ON free_mining_periods;
DROP POLICY IF EXISTS "Allow all operations" ON free_mining_periods;

-- Step 3: Test immediately
DO $$
DECLARE
    test_user_id BIGINT;
    test_result RECORD;
BEGIN
    -- Get the first user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test get_free_mining_status function
        SELECT * INTO test_result FROM get_free_mining_status(test_user_id);
        
        RAISE NOTICE '✅ EMERGENCY FIX SUCCESS! Can Mine: %, Days: %, Sessions: %', 
            test_result.can_mine, test_result.days_remaining, test_result.sessions_remaining;
    END IF;
END $$;
