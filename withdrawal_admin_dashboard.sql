-- Withdrawal Admin Dashboard Queries
-- Use these queries to monitor and manage withdrawals

-- =============================================
-- 1. DASHBOARD OVERVIEW
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
AND DATE(processed_at) = CURRENT_DATE

UNION ALL

SELECT 
    'Total Platform Payouts' as metric,
    COUNT(DISTINCT user_id) as count,
    COALESCE(SUM(total_payout), 0) as total_amount
FROM users 
WHERE total_payout > 0;

-- =============================================
-- 2. PENDING WITHDRAWALS TABLE
-- =============================================

-- Get detailed pending withdrawals table
SELECT 
    w.id as "Withdrawal ID",
    u.username as "Username",
    CONCAT(u.first_name, ' ', u.last_name) as "Full Name",
    w.amount as "Amount (TAPPs)",
    u.wallet_address as "Wallet Address",
    w.created_at as "Request Date",
    EXTRACT(DAY FROM (NOW() - w.created_at))::INTEGER as "Days Pending",
    CASE 
        WHEN EXTRACT(DAY FROM (NOW() - w.created_at)) > 7 THEN '⚠️ Overdue'
        WHEN EXTRACT(DAY FROM (NOW() - w.created_at)) > 3 THEN '🟡 Old'
        ELSE '🟢 Recent'
    END as "Priority"
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status = 'PENDING'
ORDER BY w.created_at ASC;

-- =============================================
-- 3. RECENT ACTIVITY
-- =============================================

-- Get recent withdrawal activity
SELECT 
    w.id as "Withdrawal ID",
    u.username as "Username",
    w.amount as "Amount",
    w.status as "Status",
    w.created_at as "Request Date",
    w.processed_at as "Processed Date",
    CASE 
        WHEN w.processed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (w.processed_at - w.created_at))/3600 
        ELSE NULL 
    END as "Processing Time (Hours)"
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.created_at >= NOW() - INTERVAL '7 days'
ORDER BY w.created_at DESC
LIMIT 20;

-- =============================================
-- 4. USER WITHDRAWAL STATISTICS
-- =============================================

-- Get users with most withdrawals
SELECT 
    u.id as "User ID",
    u.username as "Username",
    COUNT(w.id) as "Total Withdrawals",
    COALESCE(SUM(w.amount) FILTER (WHERE w.status = 'COMPLETED'), 0) as "Total Withdrawn",
    COALESCE(SUM(w.amount) FILTER (WHERE w.status = 'PENDING'), 0) as "Pending Amount",
    u.total_payout as "Total Payouts",
    u.total_withdrawn as "Current Claimable"
FROM users u
LEFT JOIN withdrawals w ON u.id = w.user_id
WHERE w.id IS NOT NULL
GROUP BY u.id, u.username, u.total_payout, u.total_withdrawn
ORDER BY "Total Withdrawn" DESC
LIMIT 10;

-- =============================================
-- 5. DAILY WITHDRAWAL TRENDS
-- =============================================

-- Get daily withdrawal trends for the last 7 days
SELECT 
    DATE(w.created_at) as "Date",
    COUNT(*) as "Total Requests",
    COUNT(*) FILTER (WHERE w.status = 'COMPLETED') as "Completed",
    COUNT(*) FILTER (WHERE w.status = 'PENDING') as "Pending",
    COUNT(*) FILTER (WHERE w.status = 'FAILED') as "Failed",
    COALESCE(SUM(w.amount) FILTER (WHERE w.status = 'COMPLETED'), 0) as "Amount Completed",
    COALESCE(SUM(w.amount) FILTER (WHERE w.status = 'PENDING'), 0) as "Amount Pending"
FROM withdrawals w
WHERE w.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(w.created_at)
ORDER BY "Date" DESC;

-- =============================================
-- 6. QUICK APPROVAL QUERIES
-- =============================================

-- Get withdrawals ready for approval (older than 1 hour)
SELECT 
    w.id,
    u.username,
    w.amount,
    w.created_at,
    'Ready for approval' as status
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status = 'PENDING'
AND w.created_at < NOW() - INTERVAL '1 hour'
ORDER BY w.created_at ASC;

-- Get high-value withdrawals that need attention
SELECT 
    w.id,
    u.username,
    w.amount,
    w.created_at,
    'High value - review needed' as status
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status = 'PENDING'
AND w.amount > 100 -- Adjust threshold as needed
ORDER BY w.amount DESC;

-- =============================================
-- 7. VALIDATION QUERIES
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
-- 8. BULK OPERATIONS
-- =============================================

-- Approve all withdrawals older than 24 hours (be careful!)
-- Uncomment and modify as needed
/*
UPDATE withdrawals 
SET 
    status = 'COMPLETED',
    processed_at = NOW()
WHERE status = 'PENDING' 
AND created_at < NOW() - INTERVAL '24 hours'
AND amount <= 50; -- Only approve small amounts automatically
*/

-- =============================================
-- 9. EXPORT QUERIES
-- =============================================

-- Export pending withdrawals for external processing
SELECT 
    w.id,
    u.username,
    u.first_name,
    u.last_name,
    u.wallet_address,
    w.amount,
    w.created_at,
    EXTRACT(DAY FROM (NOW() - w.created_at))::INTEGER as days_pending
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status = 'PENDING'
ORDER BY w.created_at ASC;

-- Export completed withdrawals for accounting
SELECT 
    w.id,
    u.username,
    w.amount,
    w.created_at as request_date,
    w.processed_at as completion_date,
    EXTRACT(EPOCH FROM (w.processed_at - w.created_at))/3600 as processing_hours
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status = 'COMPLETED'
AND w.processed_at >= NOW() - INTERVAL '30 days'
ORDER BY w.processed_at DESC;
