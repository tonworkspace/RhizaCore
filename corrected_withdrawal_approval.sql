-- CORRECTED Withdrawal Approval - Simple SQL Commands
-- Fixed version without non-existent columns

-- =============================================
-- 1. VIEW PENDING WITHDRAWALS
-- =============================================

-- Get all pending withdrawals with user details
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

-- =============================================
-- 2. APPROVE SINGLE WITHDRAWAL (Manual Method)
-- =============================================

-- Step 1: Update withdrawal status to COMPLETED
UPDATE withdrawals 
SET 
    status = 'COMPLETED',
    processed_at = NOW()
WHERE id = 123; -- Replace 123 with actual withdrawal ID

-- Step 2: Update user balances (subtract from claimable, add to payout)
UPDATE users 
SET 
    total_withdrawn = total_withdrawn - (
        SELECT amount FROM withdrawals WHERE id = 123
    ),
    total_payout = total_payout + (
        SELECT amount FROM withdrawals WHERE id = 123
    )
WHERE id = (
    SELECT user_id FROM withdrawals WHERE id = 123
);

-- Step 3: Create activity record
INSERT INTO activities (
    user_id, 
    type, 
    amount, 
    status, 
    created_at
) 
SELECT 
    user_id,
    'withdrawal',
    amount,
    'COMPLETED',
    NOW()
FROM withdrawals 
WHERE id = 123;

-- =============================================
-- 3. REJECT SINGLE WITHDRAWAL
-- =============================================

-- Update withdrawal status to FAILED
UPDATE withdrawals 
SET 
    status = 'FAILED',
    processed_at = NOW()
WHERE id = 124; -- Replace 124 with actual withdrawal ID

-- Create activity record for rejection
INSERT INTO activities (
    user_id, 
    type, 
    amount, 
    status, 
    created_at
) 
SELECT 
    user_id,
    'withdrawal_rejected',
    amount,
    'FAILED',
    NOW()
FROM withdrawals 
WHERE id = 124;

-- =============================================
-- 4. GET WITHDRAWAL STATISTICS
-- =============================================

-- View withdrawal statistics
SELECT 
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) as pending_amount,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) as completed_amount,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED'), 0) as failed_amount
FROM withdrawals;

-- =============================================
-- 5. GET USER WITHDRAWAL HISTORY
-- =============================================

-- Get withdrawal history for a specific user
SELECT 
    w.id as withdrawal_id,
    w.amount,
    w.status,
    w.created_at,
    w.processed_at
FROM withdrawals w
WHERE w.user_id = 1 -- Replace 1 with actual user ID
ORDER BY w.created_at DESC;

-- =============================================
-- 6. GET WITHDRAWAL DETAILS
-- =============================================

-- Get detailed information for a specific withdrawal
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
WHERE w.id = 123; -- Replace 123 with actual withdrawal ID

-- =============================================
-- 7. QUICK CHECKS
-- =============================================

-- Check if user has sufficient balance before approval
SELECT 
    u.id,
    u.username,
    u.total_withdrawn as claimable_balance,
    w.amount as withdrawal_amount,
    (u.total_withdrawn >= w.amount) as sufficient_balance
FROM users u
JOIN withdrawals w ON u.id = w.user_id
WHERE w.id = 123; -- Replace 123 with withdrawal ID

-- Check withdrawal status
SELECT 
    id,
    user_id,
    amount,
    status,
    created_at,
    processed_at
FROM withdrawals 
WHERE id = 123; -- Replace 123 with withdrawal ID

-- =============================================
-- 8. BULK OPERATIONS
-- =============================================

-- Approve all pending withdrawals older than 1 day (be careful!)
-- Uncomment and modify as needed
/*
-- Step 1: Update withdrawal statuses
UPDATE withdrawals 
SET 
    status = 'COMPLETED',
    processed_at = NOW()
WHERE status = 'PENDING' 
AND created_at < NOW() - INTERVAL '1 day';

-- Step 2: Update user balances for all approved withdrawals
UPDATE users 
SET 
    total_withdrawn = total_withdrawn - (
        SELECT COALESCE(SUM(amount), 0) 
        FROM withdrawals 
        WHERE user_id = users.id 
        AND status = 'COMPLETED' 
        AND processed_at > NOW() - INTERVAL '1 hour'
    ),
    total_payout = total_payout + (
        SELECT COALESCE(SUM(amount), 0) 
        FROM withdrawals 
        WHERE user_id = users.id 
        AND status = 'COMPLETED' 
        AND processed_at > NOW() - INTERVAL '1 hour'
    )
WHERE id IN (
    SELECT DISTINCT user_id 
    FROM withdrawals 
    WHERE status = 'COMPLETED' 
    AND processed_at > NOW() - INTERVAL '1 hour'
);

-- Step 3: Create activity records for all approved withdrawals
INSERT INTO activities (user_id, type, amount, status, created_at)
SELECT 
    user_id,
    'withdrawal',
    amount,
    'COMPLETED',
    NOW()
FROM withdrawals 
WHERE status = 'COMPLETED' 
AND processed_at > NOW() - INTERVAL '1 hour';
*/

-- =============================================
-- 9. VALIDATION QUERIES
-- =============================================

-- Check for users with insufficient balance
SELECT 
    w.id as withdrawal_id,
    u.username,
    u.total_withdrawn as user_balance,
    w.amount as withdrawal_amount,
    (u.total_withdrawn - w.amount) as balance_after,
    CASE 
        WHEN u.total_withdrawn < w.amount THEN '❌ Insufficient'
        ELSE '✅ Sufficient'
    END as validation
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status = 'PENDING'
ORDER BY validation, w.amount DESC;

-- Check for duplicate withdrawals
SELECT 
    user_id,
    amount,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as withdrawal_ids
FROM withdrawals 
WHERE status = 'PENDING'
GROUP BY user_id, amount
HAVING COUNT(*) > 1;

-- =============================================
-- 10. DASHBOARD QUERIES
-- =============================================

-- Get withdrawal dashboard summary
SELECT 
    'Pending Withdrawals' as metric,
    COUNT(*) as count,
    COALESCE(SUM(amount), 0) as total_amount
FROM withdrawals 
WHERE status = 'PENDING'

UNION ALL

SELECT 
    'Completed Today' as metric,
    COUNT(*) as count,
    COALESCE(SUM(amount), 0) as total_amount
FROM withdrawals 
WHERE status = 'COMPLETED' 
AND DATE(processed_at) = CURRENT_DATE

UNION ALL

SELECT 
    'Failed Today' as metric,
    COUNT(*) as count,
    COALESCE(SUM(amount), 0) as total_amount
FROM withdrawals 
WHERE status = 'FAILED' 
AND DATE(processed_at) = CURRENT_DATE;

-- Get recent withdrawal activity
SELECT 
    w.id as withdrawal_id,
    u.username,
    w.amount,
    w.status,
    w.created_at,
    w.processed_at,
    CASE 
        WHEN w.processed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (w.processed_at - w.created_at))/3600 
        ELSE NULL 
    END as processing_time_hours
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.created_at >= NOW() - INTERVAL '7 days'
ORDER BY w.created_at DESC
LIMIT 20;
