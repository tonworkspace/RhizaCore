-- Add total_payout column to track approved withdrawals
-- This migration adds payout tracking to the users table

-- Add total_payout column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_payout NUMERIC(18,8) DEFAULT 0;

-- Add comment to document the total_payout column
COMMENT ON COLUMN users.total_payout IS 'Total amount of approved withdrawals sent to user wallet';

-- Create index for efficient querying of payout data
CREATE INDEX IF NOT EXISTS idx_users_total_payout ON users(total_payout);

-- Update the withdrawal approval function to track payouts
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

-- Create a function to get user payout statistics
CREATE OR REPLACE FUNCTION get_user_payout_stats(user_id_param BIGINT)
RETURNS TABLE(
    total_payout NUMERIC(18,8),
    total_withdrawn NUMERIC(18,8),
    pending_withdrawals NUMERIC(18,8),
    last_payout_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.total_payout,
        u.total_withdrawn,
        COALESCE(SUM(w.amount), 0) as pending_withdrawals,
        MAX(w.created_at) as last_payout_date
    FROM users u
    LEFT JOIN withdrawals w ON u.id = w.user_id AND w.status = 'PENDING'
    WHERE u.id = user_id_param
    GROUP BY u.id, u.total_payout, u.total_withdrawn;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get total platform payouts
CREATE OR REPLACE FUNCTION get_platform_payout_stats()
RETURNS TABLE(
    total_platform_payouts NUMERIC(18,8),
    total_pending_withdrawals NUMERIC(18,8),
    total_users_with_payouts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(u.total_payout) as total_platform_payouts,
        COALESCE(SUM(w.amount), 0) as total_pending_withdrawals,
        COUNT(DISTINCT u.id) FILTER (WHERE u.total_payout > 0) as total_users_with_payouts
    FROM users u
    LEFT JOIN withdrawals w ON w.status = 'PENDING';
END;
$$ LANGUAGE plpgsql;
