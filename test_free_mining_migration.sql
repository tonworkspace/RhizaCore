-- Test Script for Free Mining Migration
-- Run this AFTER running the safe_free_mining_migration.sql
-- This will verify everything is working correctly

-- Test 1: Check if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mining_periods') THEN
        RAISE NOTICE '✅ free_mining_periods table exists';
    ELSE
        RAISE NOTICE '❌ free_mining_periods table does NOT exist';
    END IF;
END $$;

-- Test 2: Check if functions exist
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines 
    WHERE routine_name IN (
        'initialize_or_update_free_mining_period',
        'can_user_mine_free', 
        'increment_mining_session_count',
        'get_free_mining_status'
    );
    
    IF func_count = 4 THEN
        RAISE NOTICE '✅ All 4 functions exist';
    ELSE
        RAISE NOTICE '❌ Only % out of 4 functions exist', func_count;
    END IF;
END $$;

-- Test 3: Check user count vs period count
DO $$
DECLARE
    user_count INTEGER;
    period_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO period_count FROM free_mining_periods;
    
    RAISE NOTICE '📊 Users: %, Free Mining Periods: %', user_count, period_count;
    
    IF period_count = user_count THEN
        RAISE NOTICE '✅ All users have free mining periods';
    ELSE
        RAISE NOTICE '⚠️  % users missing free mining periods', (user_count - period_count);
    END IF;
END $$;

-- Test 4: Test function with first user
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
        
        RAISE NOTICE '🧪 Test User ID: %', test_user_id;
        RAISE NOTICE '   Can Mine: %', test_result.can_mine;
        RAISE NOTICE '   Days Remaining: %', test_result.days_remaining;
        RAISE NOTICE '   Sessions Remaining: %', test_result.sessions_remaining;
        RAISE NOTICE '   Reason: %', test_result.reason;
        
        IF test_result.can_mine IS NOT NULL THEN
            RAISE NOTICE '✅ Function test successful';
        ELSE
            RAISE NOTICE '❌ Function test failed';
        END IF;
    ELSE
        RAISE NOTICE '❌ No users found to test with';
    END IF;
END $$;

-- Test 5: Check RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'free_mining_periods';
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✅ RLS policies exist (% policies)', policy_count;
    ELSE
        RAISE NOTICE '❌ RLS policies missing (% policies)', policy_count;
    END IF;
END $$;

-- Test 6: Check indexes
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'free_mining_periods';
    
    IF index_count >= 3 THEN
        RAISE NOTICE '✅ Indexes exist (% indexes)', index_count;
    ELSE
        RAISE NOTICE '❌ Indexes missing (% indexes)', index_count;
    END IF;
END $$;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration Test Complete!';
    RAISE NOTICE 'If you see all ✅ checkmarks above, the migration was successful.';
    RAISE NOTICE 'If you see any ❌ or ⚠️, there may be issues to investigate.';
END $$;
