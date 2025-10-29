-- STEP 6: Final verification and test
-- Run this after step 5 is complete

-- Test 1: Verify table structure
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'free_mining_periods';
    
    RAISE NOTICE '📋 Table has % columns', column_count;
    
    IF column_count >= 8 THEN
        RAISE NOTICE '✅ Table structure looks good';
    ELSE
        RAISE NOTICE '❌ Table structure incomplete';
    END IF;
END $$;

-- Test 2: Verify functions exist
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
        RAISE NOTICE '✅ All functions exist';
    ELSE
        RAISE NOTICE '❌ Missing functions (% out of 4)', func_count;
    END IF;
END $$;

-- Test 3: Test function with first user
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
        
        RAISE NOTICE '🧪 Testing with User ID: %', test_user_id;
        RAISE NOTICE '   Can Mine: %', test_result.can_mine;
        RAISE NOTICE '   Days Remaining: %', test_result.days_remaining;
        RAISE NOTICE '   Sessions Remaining: %', test_result.sessions_remaining;
        RAISE NOTICE '   Reason: %', test_result.reason;
        
        IF test_result.can_mine IS NOT NULL THEN
            RAISE NOTICE '✅ Function test successful!';
        ELSE
            RAISE NOTICE '❌ Function test failed!';
        END IF;
    ELSE
        RAISE NOTICE '❌ No users found to test with';
    END IF;
END $$;

-- Test 4: Check RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'free_mining_periods';
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✅ RLS policies configured (% policies)', policy_count;
    ELSE
        RAISE NOTICE '❌ RLS policies missing (% policies)', policy_count;
    END IF;
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 MIGRATION COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ If you see all green checkmarks above, the migration was successful.';
    RAISE NOTICE '✅ Your TypeScript code should now work without errors.';
    RAISE NOTICE '✅ Users can now use the improved free mining system.';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '   1. Test the mining functionality in your app';
    RAISE NOTICE '   2. Verify the UI shows correct status information';
    RAISE NOTICE '   3. Check that session counting works properly';
    RAISE NOTICE '';
    RAISE NOTICE '❌ If you see any red X marks, there are issues to fix.';
    RAISE NOTICE '❌ Check the error messages above for details.';
END $$;
