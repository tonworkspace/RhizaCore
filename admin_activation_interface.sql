-- Admin Interface for User Activation Management
-- This provides comprehensive admin functions for managing user activations

-- 1. Search users by various criteria
CREATE OR REPLACE FUNCTION search_users_for_activation(
    p_search_term TEXT DEFAULT NULL,
    p_activation_status TEXT DEFAULT 'all' -- 'activated', 'not_activated', 'all'
) RETURNS TABLE (
    user_id INTEGER,
    username TEXT,
    display_name TEXT,
    telegram_id BIGINT,
    wallet_activated BOOLEAN,
    wallet_activated_at TIMESTAMP WITH TIME ZONE,
    airdrop_balance DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE
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
        COALESCE(ab.available_balance, 0) as airdrop_balance,
        u.created_at,
        u.updated_at as last_activity
    FROM users u
    LEFT JOIN airdrop_balances ab ON u.id = ab.user_id
    WHERE 
        (p_search_term IS NULL OR 
         u.username ILIKE '%' || p_search_term || '%' OR 
         u.display_name ILIKE '%' || p_search_term || '%' OR 
         u.id::text = p_search_term OR
         u.telegram_id::text = p_search_term)
    AND 
        (p_activation_status = 'all' OR
         (p_activation_status = 'activated' AND u.wallet_activated = TRUE) OR
         (p_activation_status = 'not_activated' AND u.wallet_activated = FALSE))
    ORDER BY u.created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- 2. Get detailed user activation info
CREATE OR REPLACE FUNCTION get_user_activation_details(p_user_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_user_info RECORD;
    v_activations JSON;
    v_airdrop_balance RECORD;
    v_activities JSON;
BEGIN
    -- Get user basic info
    SELECT id, username, display_name, telegram_id, wallet_activated, wallet_activated_at, created_at
    INTO v_user_info
    FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Get activation records
    SELECT json_agg(
        json_build_object(
            'id', id,
            'ton_amount', ton_amount,
            'usd_amount', usd_amount,
            'rzc_awarded', rzc_awarded,
            'transaction_hash', transaction_hash,
            'status', status,
            'created_at', created_at
        )
    ) INTO v_activations
    FROM wallet_activations 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
    
    -- Get airdrop balance
    SELECT total_claimed_to_airdrop, available_balance, withdrawn_balance, staked_balance
    INTO v_airdrop_balance
    FROM airdrop_balances WHERE user_id = p_user_id;
    
    -- Get recent activities
    SELECT json_agg(
        json_build_object(
            'type', type,
            'amount', amount,
            'status', status,
            'created_at', created_at
        )
    ) INTO v_activities
    FROM activities 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 10;
    
    RETURN json_build_object(
        'success', true,
        'user_info', json_build_object(
            'id', v_user_info.id,
            'username', v_user_info.username,
            'display_name', v_user_info.display_name,
            'telegram_id', v_user_info.telegram_id,
            'wallet_activated', v_user_info.wallet_activated,
            'wallet_activated_at', v_user_info.wallet_activated_at,
            'created_at', v_user_info.created_at
        ),
        'airdrop_balance', CASE 
            WHEN v_airdrop_balance IS NOT NULL THEN
                json_build_object(
                    'total_claimed', v_airdrop_balance.total_claimed_to_airdrop,
                    'available', v_airdrop_balance.available_balance,
                    'withdrawn', v_airdrop_balance.withdrawn_balance,
                    'staked', v_airdrop_balance.staked_balance
                )
            ELSE NULL
        END,
        'activations', COALESCE(v_activations, '[]'::json),
        'recent_activities', COALESCE(v_activities, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Reverse/Undo activation (for mistakes)
CREATE OR REPLACE FUNCTION reverse_user_activation(
    p_user_id INTEGER,
    p_reason TEXT DEFAULT 'Admin reversal'
) RETURNS JSON AS $$
DECLARE
    v_user_exists BOOLEAN;
    v_is_activated BOOLEAN;
    v_airdrop_balance DECIMAL;
BEGIN
    -- Check if user exists and is activated
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id), wallet_activated
    INTO v_user_exists, v_is_activated
    FROM users WHERE id = p_user_id;
    
    IF NOT v_user_exists THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    IF NOT v_is_activated THEN
        RETURN json_build_object('success', false, 'error', 'User is not activated');
    END IF;
    
    -- Get current airdrop balance
    SELECT available_balance INTO v_airdrop_balance
    FROM airdrop_balances WHERE user_id = p_user_id;
    
    -- Deactivate user
    UPDATE users SET 
        wallet_activated = FALSE,
        wallet_activated_at = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Remove airdrop balance (or set to 0)
    UPDATE airdrop_balances SET
        total_claimed_to_airdrop = 0,
        available_balance = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Mark activation records as reversed
    UPDATE wallet_activations SET
        status = 'reversed',
        updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'confirmed';
    
    -- Record reversal activity
    INSERT INTO activities (user_id, type, amount, status, metadata, created_at) VALUES (
        p_user_id, 'activation_reversal', -150.0, 'completed',
        json_build_object('reason', p_reason, 'admin_action', true),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'User activation reversed successfully',
        'removed_balance', COALESCE(v_airdrop_balance, 0)
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Usage Examples:

-- Search for users
-- SELECT * FROM search_users_for_activation('john'); -- Search by username
-- SELECT * FROM search_users_for_activation('123'); -- Search by user ID
-- SELECT * FROM search_users_for_activation(NULL, 'not_activated'); -- Get all non-activated users

-- Get detailed info about a user
-- SELECT get_user_activation_details(123);

-- Manually activate a user
-- SELECT manual_activate_user(123, 'Payment verified manually');

-- Reverse an activation (if needed)
-- SELECT reverse_user_activation(123, 'Accidental activation');

-- Check activation status
-- SELECT * FROM check_user_activation_status(123);