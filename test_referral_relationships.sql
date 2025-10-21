-- Test Referral Relationships
-- This script tests if the foreign key relationships are working properly
-- Run this after creating the referrals tables to verify everything is working

-- Test 1: Check if we can query referrals with user relationships
-- This should work if the foreign keys are properly set up
SELECT 
    'Testing referrals table relationships...' as test_status;

-- Test 2: Try to select from referrals with user joins
-- This simulates what the ReferralSystem component is trying to do
SELECT 
    r.id,
    r.sponsor_id,
    r.referred_id,
    sponsor.username as sponsor_username,
    referred.username as referred_username
FROM referrals r
LEFT JOIN users sponsor ON r.sponsor_id = sponsor.id
LEFT JOIN users referred ON r.referred_id = referred.id
LIMIT 5;

-- Test 3: Check foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('referrals', 'referral_earnings')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- Test 4: Check if the specific relationships used by ReferralSystem exist
SELECT 
    'Checking for sponsor_id relationship...' as check_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'referrals' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%sponsor_id%'
        ) THEN 'FOUND'
        ELSE 'MISSING'
    END as sponsor_relationship;

SELECT 
    'Checking for referred_id relationship...' as check_2,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'referrals' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%referred_id%'
        ) THEN 'FOUND'
        ELSE 'MISSING'
    END as referred_relationship;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== RELATIONSHIP TEST COMPLETE ===';
    RAISE NOTICE 'If you see foreign key constraints above, the relationships are working.';
    RAISE NOTICE 'If the ReferralSystem is still giving errors, try refreshing the Supabase schema cache.';
END $$;
