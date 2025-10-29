-- TEST: Fix for timestamp comparison issue
-- This script tests the fixed functions

DO $$
DECLARE
    test_user_id BIGINT;
    test_result RECORD;
BEGIN
    -- Get the first user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testing timestamp fix with User ID: %', test_user_id;
        
        -- Test get_free_mining_status function
        SELECT * INTO test_result FROM get_free_mining_status(test_user_id);
        
        RAISE NOTICE '   ✅ Can Mine: %', test_result.can_mine;
        RAISE NOTICE '   ✅ Reason: %', test_result.reason;
        RAISE NOTICE '   ✅ Days Remaining: %', test_result.days_remaining;
        RAISE NOTICE '   ✅ Sessions Remaining: %', test_result.sessions_remaining;
        RAISE NOTICE '   ✅ Is In Grace Period: %', test_result.is_in_grace_period;
        
        IF test_result.can_mine IS NOT NULL THEN
            RAISE NOTICE '🎉 SUCCESS! Timestamp comparison issue fixed!';
        ELSE
            RAISE NOTICE '❌ Function test failed!';
        END IF;
    ELSE
        RAISE NOTICE '❌ No users found to test with';
    END IF;
END $$;

-- Test the can_user_mine_free function as well
DO $$
DECLARE
    test_user_id BIGINT;
    test_result RECORD;
BEGIN
    -- Get the first user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testing can_user_mine_free function with User ID: %', test_user_id;
        
        -- Test can_user_mine_free function
        SELECT * INTO test_result FROM can_user_mine_free(test_user_id);
        
        RAISE NOTICE '   ✅ Can Mine: %', test_result.can_mine;
        RAISE NOTICE '   ✅ Reason: %', test_result.reason;
        RAISE NOTICE '   ✅ Days Remaining: %', test_result.days_remaining;
        RAISE NOTICE '   ✅ Sessions Remaining: %', test_result.sessions_remaining;
        RAISE NOTICE '   ✅ Grace Period End: %', test_result.grace_period_end;
        RAISE NOTICE '   ✅ Is In Grace Period: %', test_result.is_in_grace_period;
        
        IF test_result.can_mine IS NOT NULL THEN
            RAISE NOTICE '🎉 SUCCESS! Both functions working correctly!';
        ELSE
            RAISE NOTICE '❌ can_user_mine_free function test failed!';
        END IF;
    ELSE
        RAISE NOTICE '❌ No users found to test with';
    END IF;
END $$;
