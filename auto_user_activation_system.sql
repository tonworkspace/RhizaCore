-- ===================================================================
-- AUTO USER ACTIVATION SYSTEM
-- Complete database schema functions for automatic user activation
-- ===================================================================

-- 1. AUTO-ACTIVATE USER BY ID (Primary Function)
CREATE OR REPLACE FUNCTION auto_activate_user(
    p_user_id INTEGER,
    p_reason TEXT DEFAULT 'Auto-activation',
    p_rzc_amount DECIMAL(20, 6) DEFAULT 150.0,
    p_skip_checks BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_user_exists BOOLEAN;
    v_already_activated BOOLEAN;
    v_activation_id INTEGER;
    v_username TEXT;
BEGIN
    -- Skip checks if requested (for bulk operations)
    IF NOT p_skip_checks THEN
        -- Check if user exists
        SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id), username, wallet_activated
        INTO v_user_exists, v_username, v_already_activated
        FROM users WHERE id = p_user_id;
        
        IF NOT v_user_exists THEN
            RETURN json_build_object('success', false, 'error', 'User not found', 'user_id', p_user_id);
        END IF;
        
        IF v_already_activated THEN
            RETURN json_build_object('success', false, 'error', 'User already activated', 'user_id', p_user_id, 'username', v_username);
        END IF;
    ELSE
        SELECT username INTO v_username FROM users WHERE id = p_user_id;
    END IF;
    
    -- Create activation record
    INSERT INTO wallet_activations (
        user_id, ton_amount, usd_amount, ton_price_at_payment, rzc_awarded,
        transaction_hash, ton_sender_address, ton_receiver_address, status, payment_verified_at, created_at
    ) VALUES (
        p_user_id, 0, 15.00, 0, p_rzc_amount,
        'AUTO_' || p_user_id || '_' || extract(epoch from now())::text,
        'AUTO_ACTIVATION', 'SYSTEM_OVERRIDE', 'confirmed', NOW(), NOW()
    ) RETURNING id INTO v_activation_id;
    
    -- Mark user as activated
    UPDATE users SET 
        wallet_activated = TRUE,
        wallet_activated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Add RZC to airdrop balance
    INSERT INTO airdrop_balances (
        user_id, total_claimed_to_airdrop, available_balance, 
        withdrawn_balance, staked_balance, created_at, updated_at
    ) VALUES (
        p_user_id, p_rzc_amount, p_rzc_amount, 0, 0, NOW(), NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_claimed_to_airdrop = airdrop_balances.total_claimed_to_airdrop + p_rzc_amount,
        available_balance = airdrop_balances.available_balance + p_rzc_amount,
        updated_at = NOW();
    
    -- Record activity
    INSERT INTO activities (user_id, type, amount, status, metadata, created_at) VALUES (
        p_user_id, 'auto_wallet_activation', p_rzc_amount, 'completed',
        json_build_object(
            'activation_id', v_activation_id,
            'reason', p_reason,
            'auto_activation', true,
            'rzc_amount', p_rzc_amount
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true, 
        'user_id', p_user_id,
        'username', v_username,
        'activation_id', v_activation_id,
        'rzc_awarded', p_rzc_amount,
        'message', 'User auto-activated successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'user_id', p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 2. AUTO-ACTIVATE USER BY USERNAME
CREATE OR REPLACE FUNCTION auto_activate_user_by_username(
    p_username TEXT,
    p_reason TEXT DEFAULT 'Auto-activation by username',
    p_rzc_amount DECIMAL(20, 6) DEFAULT 150.0
) RETURNS JSON AS $$
DECLARE
    v_user_id INTEGER;
    v_result JSON;
BEGIN
    -- Find user by username
    SELECT id INTO v_user_id FROM users WHERE username = p_username;
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found', 'username', p_username);
    END IF;
    
    -- Use the main auto-activation function
    SELECT auto_activate_user(v_user_id, p_reason, p_rzc_amount) INTO v_result;
    
    RETURN json_build_object(
        'success', (v_result->>'success')::boolean,
        'username', p_username,
        'user_id', v_user_id,
        'activation_result', v_result
    );
END;
$$ LANGUAGE plpgsql;

-- 3. AUTO-ACTIVATE USER BY TELEGRAM ID
CREATE OR REPLACE FUNCTION auto_activate_user_by_telegram(
    p_telegram_id BIGINT,
    p_reason TEXT DEFAULT 'Auto-activation by Telegram ID',
    p_rzc_amount DECIMAL(20, 6) DEFAULT 150.0
) RETURNS JSON AS $$
DECLARE
    v_user_id INTEGER;
    v_username TEXT;
    v_result JSON;
BEGIN
    -- Find user by telegram ID
    SELECT id, username INTO v_user_id, v_username FROM users WHERE telegram_id = p_telegram_id;
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found', 'telegram_id', p_telegram_id);
    END IF;
    
    -- Use the main auto-activation function
    SELECT auto_activate_user(v_user_id, p_reason, p_rzc_amount) INTO v_result;
    
    RETURN json_build_object(
        'success', (v_result->>'success')::boolean,
        'telegram_id', p_telegram_id,
        'username', v_username,
        'user_id', v_user_id,
        'activation_result', v_result
    );
END;
$$ LANGUAGE plpgsql;

-- 4. BULK AUTO-ACTIVATE USERS
CREATE OR REPLACE FUNCTION bulk_auto_activate_users(
    p_user_ids INTEGER[],
    p_reason TEXT DEFAULT 'Bulk auto-activation',
    p_rzc_amount DECIMAL(20, 6) DEFAULT 150.0
) RETURNS JSON AS $$
DECLARE
    v_user_id INTEGER;
    v_results JSON[] := '{}';
    v_result JSON;
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        SELECT auto_activate_user(v_user_id, p_reason, p_rzc_amount, true) INTO v_result;
        v_results := array_append(v_results, v_result);
        
        IF (v_result->>'success')::boolean THEN
            v_success_count := v_success_count + 1;
        ELSE
            v_error_count := v_error_count + 1;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'total_processed', array_length(p_user_ids, 1),
        'success_count', v_success_count,
        'error_count', v_error_count,
        'results', v_results
    );
END;
$$ LANGUAGE plpgsql;

-- 5. AUTO-ACTIVATE ALL USERS (Use with caution!)
CREATE OR REPLACE FUNCTION auto_activate_all_users(
    p_reason TEXT DEFAULT 'Mass auto-activation',
    p_rzc_amount DECIMAL(20, 6) DEFAULT 150.0,
    p_limit INTEGER DEFAULT 1000
) RETURNS JSON AS $$
DECLARE
    v_user_ids INTEGER[];
    v_result JSON;
BEGIN
    -- Get all non-activated user IDs
    SELECT array_agg(id) INTO v_user_ids
    FROM (
        SELECT id FROM users 
        WHERE wallet_activated = FALSE 
        ORDER BY created_at ASC 
        LIMIT p_limit
    ) subq;
    
    IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
        RETURN json_build_object('success', true, 'message', 'No users to activate');
    END IF;
    
    -- Use bulk activation
    SELECT bulk_auto_activate_users(v_user_ids, p_reason, p_rzc_amount) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. AUTO-ACTIVATE USERS BY CRITERIA
CREATE OR REPLACE FUNCTION auto_activate_users_by_criteria(
    p_created_after TIMESTAMP DEFAULT NULL,
    p_created_before TIMESTAMP DEFAULT NULL,
    p_username_pattern TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT 'Conditional auto-activation',
    p_rzc_amount DECIMAL(20, 6) DEFAULT 150.0,
    p_limit INTEGER DEFAULT 100
) RETURNS JSON AS $$
DECLARE
    v_user_ids INTEGER[];
    v_result JSON;
BEGIN
    -- Build dynamic query based on criteria
    SELECT array_agg(id) INTO v_user_ids
    FROM (
        SELECT id FROM users 
        WHERE wallet_activated = FALSE
        AND (p_created_after IS NULL OR created_at >= p_created_after)
        AND (p_created_before IS NULL OR created_at <= p_created_before)
        AND (p_username_pattern IS NULL OR username ILIKE '%' || p_username_pattern || '%')
        ORDER BY created_at ASC 
        LIMIT p_limit
    ) subq;
    
    IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
        RETURN json_build_object('success', true, 'message', 'No users match criteria');
    END IF;
    
    -- Use bulk activation
    SELECT bulk_auto_activate_users(v_user_ids, p_reason, p_rzc_amount) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 7. GET AUTO-ACTIVATION STATISTICS
CREATE OR REPLACE FUNCTION get_activation_stats()
RETURNS JSON AS $$
DECLARE
    v_total_users INTEGER;
    v_activated_users INTEGER;
    v_pending_users INTEGER;
    v_today_activations INTEGER;
    v_auto_activations INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_users FROM users;
    SELECT COUNT(*) INTO v_activated_users FROM users WHERE wallet_activated = TRUE;
    SELECT COUNT(*) INTO v_pending_users FROM users WHERE wallet_activated = FALSE;
    
    SELECT COUNT(*) INTO v_today_activations 
    FROM users 
    WHERE wallet_activated = TRUE 
    AND wallet_activated_at >= CURRENT_DATE;
    
    SELECT COUNT(*) INTO v_auto_activations
    FROM wallet_activations 
    WHERE transaction_hash LIKE 'AUTO_%' OR transaction_hash LIKE 'MANUAL_%';
    
    RETURN json_build_object(
        'total_users', v_total_users,
        'activated_users', v_activated_users,
        'pending_users', v_pending_users,
        'activation_rate', ROUND((v_activated_users::DECIMAL / NULLIF(v_total_users, 0)) * 100, 2),
        'today_activations', v_today_activations,
        'auto_activations', v_auto_activations
    );
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- USAGE EXAMPLES
-- ===================================================================

-- 1. Activate single user by ID
-- SELECT auto_activate_user(123);

-- 2. Activate user by username
-- SELECT auto_activate_user_by_username('john_doe');

-- 3. Activate user by Telegram ID
-- SELECT auto_activate_user_by_telegram(123456789);

-- 4. Bulk activate specific users
-- SELECT bulk_auto_activate_users(ARRAY[123, 124, 125]);

-- 5. Activate all users created today
-- SELECT auto_activate_users_by_criteria(CURRENT_DATE, NULL, NULL, 'Daily activation batch');

-- 6. Activate users with specific username pattern
-- SELECT auto_activate_users_by_criteria(NULL, NULL, 'test', 'Test user activation');

-- 7. Activate all pending users (DANGEROUS - use with caution!)
-- SELECT auto_activate_all_users('Mass activation event', 150.0, 1000);

-- 8. Get activation statistics
-- SELECT get_activation_stats();

-- ===================================================================
-- QUICK COMMANDS FOR COMMON SCENARIOS
-- ===================================================================

-- Activate a specific user (replace 123 with actual user ID)
-- SELECT auto_activate_user(123, 'Manual override - payment verified');

-- Activate multiple users at once
-- SELECT bulk_auto_activate_users(ARRAY[123, 124, 125, 126], 'Batch verification complete');

-- Activate all test users
-- SELECT auto_activate_users_by_criteria(NULL, NULL, 'test', 'Test environment setup');

-- Activate users from last 24 hours
-- SELECT auto_activate_users_by_criteria(NOW() - INTERVAL '24 hours', NULL, NULL, 'Recent user activation');

-- Check current stats
-- SELECT get_activation_stats();

-- ===================================================================
-- SAFETY FUNCTIONS
-- ===================================================================

-- Check what users would be affected before bulk operations
CREATE OR REPLACE FUNCTION preview_activation_candidates(
    p_created_after TIMESTAMP DEFAULT NULL,
    p_created_before TIMESTAMP DEFAULT NULL,
    p_username_pattern TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    user_id INTEGER,
    username TEXT,
    display_name TEXT,
    telegram_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.display_name, u.telegram_id, u.created_at
    FROM users u
    WHERE u.wallet_activated = FALSE
    AND (p_created_after IS NULL OR u.created_at >= p_created_after)
    AND (p_created_before IS NULL OR u.created_at <= p_created_before)
    AND (p_username_pattern IS NULL OR u.username ILIKE '%' || p_username_pattern || '%')
    ORDER BY u.created_at ASC 
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Usage: Preview before activating
-- SELECT * FROM preview_activation_candidates(CURRENT_DATE, NULL, 'test');