-- Manual User Activation Script
-- Use this to manually activate users who made mistakes or need special handling

-- Method 1: Complete Manual Activation (Recommended)
-- Replace USER_ID with the actual user ID you want to activate
CREATE OR REPLACE FUNCTION manual_activate_user(
    p_user_id INTEGER,
    p_reason TEXT DEFAULT 'Manual activation by admin'
) RETURNS JSON AS $$
DECLARE
    v_user_exists BOOLEAN;
    v_already_activated BOOLEAN;
    v_activation_id INTEGER;
    v_rzc_amount DECIMAL(20, 6) := 150.0;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if already activated
    SELECT wallet_activated INTO v_already_activated FROM users WHERE id = p_user_id;
    IF v_already_activated THEN
        RETURN json_build_object('success', false, 'error', 'User already activated');
    END IF;
    
    -- Create manual activation record
    INSERT INTO wallet_activations (
        user_id, ton_amount, usd_amount, ton_price_at_payment, rzc_awarded,
        transaction_hash, ton_sender_address, ton_receiver_address, status, payment_verified_at
    ) VALUES (
        p_user_id, 0, 15.00, 0, v_rzc_amount,
        'MANUAL_' || p_user_id || '_' || extract(epoch from now())::text,
        'MANUAL_ACTIVATION', 'ADMIN_OVERRIDE', 'confirmed', NOW()
    ) RETURNING id INTO v_activation_id;
    
    -- Mark user as activated
    UPDATE users SET 
        wallet_activated = TRUE,
        wallet_activated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create or update airdrop balance with 150 RZC
    INSERT INTO airdrop_balances (
        user_id, total_claimed_to_airdrop, available_balance, 
        withdrawn_balance, staked_balance, created_at, updated_at
    ) VALUES (
        p_user_id, v_rzc_amount, v_rzc_amount, 0, 0, NOW(), NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_claimed_to_airdrop = airdrop_balances.total_claimed_to_airdrop + v_rzc_amount,
        available_balance = airdrop_balances.available_balance + v_rzc_amount,
        updated_at = NOW();
    
    -- Record activity
    INSERT INTO activities (user_id, type, amount, status, metadata, created_at) VALUES (
        p_user_id, 'manual_wallet_activation', v_rzc_amount, 'completed',
        json_build_object(
            'activation_id', v_activation_id,
            'reason', p_reason,
            'admin_override', true
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true, 
        'activation_id', v_activation_id,
        'rzc_awarded', v_rzc_amount,
        'message', 'User manually activated successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Usage Examples:

-- 1. Activate user ID 123 with default reason
SELECT manual_activate_user(123);

-- 2. Activate user ID 456 with custom reason
SELECT manual_activate_user(456, 'Payment failed but verified manually');

-- 3. Activate multiple users (replace with actual user IDs)
-- SELECT manual_activate_user(123, 'Batch activation - payment verified');
-- SELECT manual_activate_user(124, 'Batch activation - payment verified');
-- SELECT manual_activate_user(125, 'Batch activation - payment verified');

-- Method 2: Quick Direct SQL (if you prefer direct commands)
-- Replace 123 with the actual user ID
/*
BEGIN;

-- Mark user as activated
UPDATE users SET 
    wallet_activated = TRUE,
    wallet_activated_at = NOW(),
    updated_at = NOW()
WHERE id = 123;

-- Create manual activation record
INSERT INTO wallet_activations (
    user_id, ton_amount, usd_amount, ton_price_at_payment, rzc_awarded,
    transaction_hash, ton_sender_address, ton_receiver_address, status, payment_verified_at
) VALUES (
    123, 0, 15.00, 0, 150.0,
    'MANUAL_123_' || extract(epoch from now())::text,
    'MANUAL_ACTIVATION', 'ADMIN_OVERRIDE', 'confirmed', NOW()
);

-- Add 150 RZC to airdrop balance
INSERT INTO airdrop_balances (
    user_id, total_claimed_to_airdrop, available_balance, 
    withdrawn_balance, staked_balance, created_at, updated_at
) VALUES (
    123, 150.0, 150.0, 0, 0, NOW(), NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    total_claimed_to_airdrop = airdrop_balances.total_claimed_to_airdrop + 150.0,
    available_balance = airdrop_balances.available_balance + 150.0,
    updated_at = NOW();

-- Record activity
INSERT INTO activities (user_id, type, amount, status, metadata, created_at) VALUES (
    123, 'manual_wallet_activation', 150.0, 'completed',
    json_build_object('admin_override', true, 'reason', 'Manual activation'),
    NOW()
);

COMMIT;
*/

-- Method 3: Check activation status
CREATE OR REPLACE FUNCTION check_user_activation_status(p_user_id INTEGER)
RETURNS TABLE (
    user_id INTEGER,
    username TEXT,
    wallet_activated BOOLEAN,
    wallet_activated_at TIMESTAMP WITH TIME ZONE,
    airdrop_balance DECIMAL,
    activation_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.wallet_activated,
        u.wallet_activated_at,
        COALESCE(ab.available_balance, 0) as airdrop_balance,
        COALESCE(wa_count.count, 0)::INTEGER as activation_count
    FROM users u
    LEFT JOIN airdrop_balances ab ON u.id = ab.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count 
        FROM wallet_activations 
        WHERE status = 'confirmed' 
        GROUP BY user_id
    ) wa_count ON u.id = wa_count.user_id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Usage: Check user status before and after activation
-- SELECT * FROM check_user_activation_status(123);

-- Method 4: Bulk activation for multiple users
CREATE OR REPLACE FUNCTION bulk_activate_users(
    p_user_ids INTEGER[],
    p_reason TEXT DEFAULT 'Bulk manual activation'
) RETURNS JSON AS $$
DECLARE
    v_user_id INTEGER;
    v_results JSON[] := '{}';
    v_result JSON;
BEGIN
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        SELECT manual_activate_user(v_user_id, p_reason) INTO v_result;
        v_results := array_append(v_results, json_build_object('user_id', v_user_id, 'result', v_result));
    END LOOP;
    
    RETURN json_build_object('results', v_results);
END;
$$ LANGUAGE plpgsql;

-- Usage: Activate multiple users at once
-- SELECT bulk_activate_users(ARRAY[123, 124, 125], 'Payment verification completed');

-- Method 5: Find users who need manual activation (troubleshooting)
CREATE OR REPLACE VIEW users_needing_activation AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.telegram_id,
    u.wallet_activated,
    u.created_at,
    wa.transaction_hash,
    wa.status as payment_status,
    CASE 
        WHEN u.wallet_activated = FALSE AND wa.id IS NULL THEN 'No payment attempt'
        WHEN u.wallet_activated = FALSE AND wa.status = 'pending' THEN 'Payment pending'
        WHEN u.wallet_activated = FALSE AND wa.status = 'failed' THEN 'Payment failed'
        WHEN u.wallet_activated = TRUE THEN 'Already activated'
        ELSE 'Unknown status'
    END as activation_status
FROM users u
LEFT JOIN wallet_activations wa ON u.id = wa.user_id
WHERE u.wallet_activated = FALSE
ORDER BY u.created_at DESC;

-- Usage: Find users who might need manual activation
-- SELECT * FROM users_needing_activation;