-- Cleanup script to remove any problematic functions and start fresh
-- Run this if the leaderboard stopped working after running the previous script

-- Drop the view first (since it depends on the function)
DROP VIEW IF EXISTS referral_leaderboard;

-- Now drop the functions
DROP FUNCTION IF EXISTS get_accurate_referral_counts();
DROP FUNCTION IF EXISTS clean_duplicate_referrals();
DROP FUNCTION IF EXISTS validate_referral_integrity();

-- Alternative: Use CASCADE to drop everything at once
-- DROP FUNCTION IF EXISTS get_accurate_referral_counts() CASCADE;

-- Keep the useful indexes (these shouldn't cause issues)
-- The indexes are fine and help with performance

-- Test queries to verify everything is working
-- Uncomment these to test after cleanup:

-- Simple query to test if referrals table is accessible
-- SELECT COUNT(*) as total_referrals FROM referrals;

-- Test query to see unique sponsors
-- SELECT COUNT(DISTINCT sponsor_id) as unique_sponsors FROM referrals WHERE sponsor_id IS NOT NULL;

-- Test query to see if the join with users table works
-- SELECT r.sponsor_id, u.username, COUNT(*) as referral_count
-- FROM referrals r
-- JOIN users u ON r.sponsor_id = u.id
-- WHERE r.sponsor_id IS NOT NULL
-- GROUP BY r.sponsor_id, u.username
-- ORDER BY referral_count DESC
-- LIMIT 10;