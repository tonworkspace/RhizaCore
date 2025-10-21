-- Withdrawal Approval System - Complete SQL Schema
-- This script provides all necessary functions and procedures for withdrawal approval

-- =============================================
-- 1. ENSURE REQUIRED COLUMNS EXIST
-- =============================================

-- Add total_payout column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_payout NUMERIC(18,8) DEFAULT 0;

-- Add withdrawal tracking columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_weekly_withdrawal TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS weekly_withdrawal_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_weekly_withdrawn NUMERIC(18,8) DEFAULT 0;

-- =============================================
-- 2. WITHDRAWAL APPROVAL FUNCTIONS
-- =============================================

-- Function to approve a withdrawal and update balances
CREATE OR REPLACE FUNCTION approve_withdrawal(
    withdrawal_id_param INTEGER,
    admin_user_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    withdrawal_record RECORD;
    result JSON;
BEGIN
    -- Get withdrawal details
    SELECT * INTO withdrawal_record
    FROM withdrawals 
    WHERE id = withdrawal_id_param;
    
    -- Check if withdrawal exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Withdrawal not found',
            'withdrawal_id', withdrawal_id_param
        );
    END IF;
    
    -- Check if withdrawal is pending
    IF withdrawal_record.status != 'PENDING' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Withdrawal is not pending',
            'current_status', withdrawal_record.status,
            'withdrawal_id', withdrawal_id_param
        );
    END IF;
    
    -- Update withdrawal status to COMPLETED
    UPDATE withdrawals 
    SET 
        status = 'COMPLETED',
        processed_at = NOW()
    WHERE id = withdrawal_id_param;
    
    -- Update user balances
    UPDATE users 
    SET 
        total_withdrawn = total_withdrawn - withdrawal_record.amount,
        total_payout = total_payout + withdrawal_record.amount
    WHERE id = withdrawal_record.user_id;
    
    -- Create activity record
    INSERT INTO activities (
        user_id, 
        type, 
        amount, 
        status, 
        created_at
    ) VALUES (
        withdrawal_record.user_id,
        'withdrawal',
        withdrawal_record.amount,
        'COMPLETED',
        NOW()
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'message', 'Withdrawal approved successfully',
        'withdrawal_id', withdrawal_id_param,
        'user_id', withdrawal_record.user_id,
        'amount', withdrawal_record.amount,
        'processed_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Revert withdrawal status if error occurs
        UPDATE withdrawals 
        SET status = 'PENDING' 
        WHERE id = withdrawal_id_param;
        
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'withdrawal_id', withdrawal_id_param
        );
END;
$$ LANGUAGE plpgsql;

-- Function to reject a withdrawal
CREATE OR REPLACE FUNCTION reject_withdrawal(
    withdrawal_id_param INTEGER,
    reason_param TEXT DEFAULT NULL,
    admin_user_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    withdrawal_record RECORD;
BEGIN
    -- Get withdrawal details
    SELECT * INTO withdrawal_record
    FROM withdrawals 
    WHERE id = withdrawal_id_param;
    
    -- Check if withdrawal exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Withdrawal not found',
            'withdrawal_id', withdrawal_id_param
        );
    END IF;
    
    -- Check if withdrawal is pending
    IF withdrawal_record.status != 'PENDING' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Withdrawal is not pending',
            'current_status', withdrawal_record.status,
            'withdrawal_id', withdrawal_id_param
        );
    END IF;
    
    -- Update withdrawal status to FAILED
    UPDATE withdrawals 
    SET 
        status = 'FAILED',
        processed_at = NOW()
    WHERE id = withdrawal_id_param;
    
    -- Create activity record
    INSERT INTO activities (
        user_id, 
        type, 
        amount, 
        status, 
        created_at
    ) VALUES (
        withdrawal_record.user_id,
        'withdrawal_rejected',
        withdrawal_record.amount,
        'FAILED',
        NOW()
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'message', 'Withdrawal rejected successfully',
        'withdrawal_id', withdrawal_id_param,
        'user_id', withdrawal_record.user_id,
        'amount', withdrawal_record.amount,
        'reason', reason_param,
        'processed_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'withdrawal_id', withdrawal_id_param
        );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. ADMIN QUERY FUNCTIONS
-- =============================================

-- Function to get all pending withdrawals with user details
CREATE OR REPLACE FUNCTION get_pending_withdrawals()
RETURNS TABLE(
    withdrawal_id INTEGER,
    user_id BIGINT,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    amount NUMERIC(18,8),
    wallet_address VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    days_pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id as withdrawal_id,
        w.user_id,
        u.username,
        u.first_name,
        u.last_name,
        w.amount,
        u.wallet_address,
        w.created_at,
        EXTRACT(DAY FROM (NOW() - w.created_at))::INTEGER as days_pending
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    WHERE w.status = 'PENDING'
    ORDER BY w.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get withdrawal statistics
CREATE OR REPLACE FUNCTION get_withdrawal_stats()
RETURNS TABLE(
    total_pending_withdrawals INTEGER,
    total_pending_amount NUMERIC(18,8),
    total_completed_withdrawals INTEGER,
    total_completed_amount NUMERIC(18,8),
    total_failed_withdrawals INTEGER,
    total_failed_amount NUMERIC(18,8),
    average_withdrawal_amount NUMERIC(18,8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING')::INTEGER as total_pending_withdrawals,
        COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) as total_pending_amount,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::INTEGER as total_completed_withdrawals,
        COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) as total_completed_amount,
        COUNT(*) FILTER (WHERE status = 'FAILED')::INTEGER as total_failed_withdrawals,
        COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED'), 0) as total_failed_amount,
        COALESCE(AVG(amount), 0) as average_withdrawal_amount
    FROM withdrawals;
END;
$$ LANGUAGE plpgsql;

-- Function to get user withdrawal history
CREATE OR REPLACE FUNCTION get_user_withdrawal_history(user_id_param BIGINT)
RETURNS TABLE(
    withdrawal_id INTEGER,
    amount NUMERIC(18,8),
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id as withdrawal_id,
        w.amount,
        w.status,
        w.created_at,
        w.processed_at
    FROM withdrawals w
    WHERE w.user_id = user_id_param
    ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. BULK OPERATIONS
-- =============================================

-- Function to approve multiple withdrawals
CREATE OR REPLACE FUNCTION approve_multiple_withdrawals(
    withdrawal_ids INTEGER[],
    admin_user_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    withdrawal_id INTEGER;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    results JSON := '[]'::JSON;
    result JSON;
BEGIN
    -- Loop through each withdrawal ID
    FOREACH withdrawal_id IN ARRAY withdrawal_ids
    LOOP
        -- Try to approve the withdrawal
        SELECT approve_withdrawal(withdrawal_id, admin_user_id) INTO result;
        
        -- Check if successful
        IF (result->>'success')::BOOLEAN THEN
            success_count := success_count + 1;
        ELSE
            error_count := error_count + 1;
        END IF;
        
        -- Add result to results array
        results := results || result;
    END LOOP;
    
    -- Return summary
    RETURN json_build_object(
        'success', true,
        'total_processed', array_length(withdrawal_ids, 1),
        'successful_approvals', success_count,
        'failed_approvals', error_count,
        'results', results
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'withdrawal_ids', withdrawal_ids
        );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. UTILITY FUNCTIONS
-- =============================================

-- Function to update user balance after withdrawal (existing function)
CREATE OR REPLACE FUNCTION update_user_balance_after_withdrawal(
    user_id BIGINT,
    withdrawal_amount NUMERIC(18,8)
)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET 
        total_withdrawn = total_withdrawn - withdrawal_amount,
        total_payout = total_payout + withdrawal_amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get withdrawal details by ID
CREATE OR REPLACE FUNCTION get_withdrawal_details(withdrawal_id_param INTEGER)
RETURNS TABLE(
    withdrawal_id INTEGER,
    user_id BIGINT,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    amount NUMERIC(18,8),
    wallet_amount NUMERIC(18,8),
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id as withdrawal_id,
        w.user_id,
        u.username,
        u.first_name,
        u.last_name,
        w.amount,
        w.wallet_amount,
        w.status,
        w.created_at,
        w.processed_at
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    WHERE w.id = withdrawal_id_param;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. EXAMPLE USAGE QUERIES
-- =============================================

-- Example: Get all pending withdrawals
-- SELECT * FROM get_pending_withdrawals();

-- Example: Approve a single withdrawal
-- SELECT approve_withdrawal(123, 1);

-- Example: Reject a withdrawal with reason
-- SELECT reject_withdrawal(124, 'Invalid wallet address', 1);

-- Example: Get withdrawal statistics
-- SELECT * FROM get_withdrawal_stats();

-- Example: Get user withdrawal history
-- SELECT * FROM get_user_withdrawal_history(1);

-- Example: Approve multiple withdrawals
-- SELECT approve_multiple_withdrawals(ARRAY[123, 124, 125], 1);

-- Example: Get withdrawal details
-- SELECT * FROM get_withdrawal_details(123);

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_at ON withdrawals(processed_at);
CREATE INDEX IF NOT EXISTS idx_users_total_payout ON users(total_payout);
CREATE INDEX IF NOT EXISTS idx_users_total_withdrawn ON users(total_withdrawn);

-- =============================================
-- 8. COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION approve_withdrawal(INTEGER, INTEGER) IS 'Approves a pending withdrawal and updates user balances';
COMMENT ON FUNCTION reject_withdrawal(INTEGER, TEXT, INTEGER) IS 'Rejects a pending withdrawal with optional reason';
COMMENT ON FUNCTION get_pending_withdrawals() IS 'Returns all pending withdrawals with user details';
COMMENT ON FUNCTION get_withdrawal_stats() IS 'Returns comprehensive withdrawal statistics';
COMMENT ON FUNCTION get_user_withdrawal_history(BIGINT) IS 'Returns withdrawal history for a specific user';
COMMENT ON FUNCTION approve_multiple_withdrawals(INTEGER[], INTEGER) IS 'Approves multiple withdrawals in batch';
COMMENT ON FUNCTION get_withdrawal_details(INTEGER) IS 'Returns detailed information for a specific withdrawal';
