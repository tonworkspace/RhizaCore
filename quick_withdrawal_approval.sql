-- Quick Withdrawal Approval - Simple SQL Commands
-- Use these commands in your SQL editor for quick withdrawal management

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
-- 2. APPROVE SINGLE WITHDRAWAL
-- =============================================

-- Replace 123 with actual withdrawal ID
-- This will approve withdrawal ID 123
SELECT approve_withdrawal(123, 1);

-- =============================================
-- 3. REJECT SINGLE WITHDRAWAL
-- =============================================

-- Replace 124 with actual withdrawal ID and add reason
-- This will reject withdrawal ID 124
SELECT reject_withdrawal(124, 'Invalid wallet address', 1);

-- =============================================
-- 4. APPROVE MULTIPLE WITHDRAWALS
-- =============================================

-- Approve multiple withdrawals at once
-- Replace the array with actual withdrawal IDs
SELECT approve_multiple_withdrawals(ARRAY[123, 124, 125], 1);

-- =============================================
-- 5. GET WITHDRAWAL STATISTICS
-- =============================================

-- View withdrawal statistics
SELECT * FROM get_withdrawal_stats();

-- =============================================
-- 6. GET USER WITHDRAWAL HISTORY
-- =============================================

-- Replace 1 with actual user ID
-- View withdrawal history for user ID 1
SELECT * FROM get_user_withdrawal_history(1);

-- =============================================
-- 7. GET WITHDRAWAL DETAILS
-- =============================================

-- Replace 123 with actual withdrawal ID
-- Get detailed information for withdrawal ID 123
SELECT * FROM get_withdrawal_details(123);

-- =============================================
-- 8. MANUAL APPROVAL (if functions don't exist)
-- =============================================

-- Manual approval process (use if functions are not available)
-- Step 1: Update withdrawal status
UPDATE withdrawals 
SET 
    status = 'COMPLETED',
    processed_at = NOW()
WHERE id = 123; -- Replace 123 with withdrawal ID

-- Step 2: Update user balances
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
-- 9. QUICK CHECKS
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
-- 10. BULK OPERATIONS
-- =============================================

-- Approve all pending withdrawals older than 1 day
UPDATE withdrawals 
SET 
    status = 'COMPLETED',
    processed_at = NOW()
WHERE status = 'PENDING' 
AND created_at < NOW() - INTERVAL '1 day';

-- Update user balances for bulk approvals
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
