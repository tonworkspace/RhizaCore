-- Activate User by Username
-- This function allows you to activate a user using their username instead of user ID

CREATE OR REPLACE FUNCTION activate_user_by_username(
    p_username TEXT,
    p_reason TEXT DEFAULT 'Manual activation by admin'
) RETURNS JSON AS $$
DECLARE
    v_user_id INTEGER;
    v_user_exists BOOLEAN;
    v_already_activated BOOLEAN;
    v_result JSON;
BEGIN
    -- Find user by username
    SELECT id, wallet_activated 
    INTO v_user_id, v_already_activated
    FROM users 
    WHERE username = p_username;
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'User not found with username: ' || p_username
        );
    END IF;
    
    -- Check if already activated
    IF v_already_activated THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'User "' || p_username || '" is already activated',
            'user_id', v_user_id
        );
    END IF;
    
    -- Use existing manual_activate_user function
    SELECT manual_activate_user(v_user_id, p_reason) INTO v_result;
    
    -- Add username to the result
    RETURN json_build_object(
        'success', (v_result->>'success')::boolean,
        'user_id', v_user_id,
        'username', p_username,
        'activation_result', v_result,
        'message', CASE 
            WHEN (v_result->>'success')::boolean THEN 
                'User "' || p_username || '" (ID: ' || v_user_id || ') activated successfully'
            ELSE 
                'Failed to activate user "' || p_username || '": ' || (v_result->>'error')
        END
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', 'Database error: ' || SQLERRM,
        'username', p_username
    );
END;
$$ LANGUAGE plpgsql;

-- Helper function to search users by username pattern
CREATE OR REPLACE FUNCTION find_users_by_username(
    p_username_pattern TEXT
) RETURNS TABLE (
    user_id INTEGER,
    username TEXT,
    display_name TEXT,
    telegram_id BIGINT,
    wallet_activated BOOLEAN,
    wallet_activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.telegram_id,
        u.wallet_activated,
        u.wallet_activated_at,
        u.created_at
    FROM users u
    WHERE u.username ILIKE '%' || p_username_pattern || '%'
    ORDER BY u.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Bulk activate users by username list
CREATE OR REPLACE FUNCTION bulk_activate_users_by_username(
    p_usernames TEXT[],
    p_reason TEXT DEFAULT 'Bulk manual activation'
) RETURNS JSON AS $$
DECLARE
    v_username TEXT;
    v_results JSON[] := '{}';
    v_result JSON;
BEGIN
    FOREACH v_username IN ARRAY p_usernames
    LOOP
        SELECT activate_user_by_username(v_username, p_reason) INTO v_result;
        v_results := array_append(v_results, v_result);
    END LOOP;
    
    RETURN json_build_object(
        'total_processed', array_length(p_usernames, 1),
        'results', v_results
    );
END;
$$ LANGUAGE plpgsql;

-- === USAGE EXAMPLES ===

-- 1. Activate a single user by username
-- SELECT activate_user_by_username('john_doe');

-- 2. Activate with custom reason
-- SELECT activate_user_by_username('jane_smith', 'Payment verified manually - technical issue resolved');

-- 3. Find users by username pattern first
-- SELECT * FROM find_users_by_username('john');

-- 4. Bulk activate multiple users by username
-- SELECT bulk_activate_users_by_username(
--     ARRAY['user1', 'user2', 'user3'], 
--     'Batch activation - payments verified'
-- );

-- 5. Check if user exists before activation
-- SELECT username, wallet_activated FROM users WHERE username = 'target_username';

-- === QUICK COMMANDS FOR COMMON SCENARIOS ===

-- Activate user "testuser123"
-- SELECT activate_user_by_username('testuser123');

-- Find all users with "test" in username
-- SELECT * FROM find_users_by_username('test');

-- Activate multiple test users
-- SELECT bulk_activate_users_by_username(ARRAY['testuser1', 'testuser2', 'testuser3']);

-- === VERIFICATION COMMANDS ===

-- Check activation result
-- SELECT username, wallet_activated, wallet_activated_at 
-- FROM users 
-- WHERE username = 'your_username_here';

-- Check airdrop balance was added
-- SELECT u.username, ab.available_balance 
-- FROM users u 
-- JOIN airdrop_balances ab ON u.id = ab.user_id 
-- WHERE u.username = 'your_username_here';