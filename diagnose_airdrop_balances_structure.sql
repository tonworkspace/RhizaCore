-- Diagnose Airdrop Balances Table Structure
-- This script checks the current structure of the airdrop_balances table

-- Check if airdrop_balances table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'airdrop_balances' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'airdrop_balances'
) as table_exists;

-- Show sample data if table exists and has data
DO $
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'airdrop_balances') THEN
        RAISE NOTICE 'Airdrop balances table exists. Showing sample data:';
        -- This will show in the query results if run manually
    ELSE
        RAISE NOTICE 'Airdrop balances table does not exist!';
    END IF;
END $;

-- Check for any existing airdrop balances (limit to 5 for safety)
SELECT 
    id,
    user_id,
    total_claimed_to_airdrop,
    available_balance,
    withdrawn_balance,
    created_at,
    updated_at
FROM airdrop_balances 
LIMIT 5;