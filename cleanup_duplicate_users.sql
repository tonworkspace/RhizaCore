-- Cleanup Duplicate Users Script
-- Run this in your Supabase SQL editor to clean up any duplicate users

-- Find and display duplicate users
SELECT 
    telegram_id,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as user_ids,
    array_agg(created_at ORDER BY created_at) as creation_dates
FROM users 
GROUP BY telegram_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Optional: Delete duplicate users (keeping the oldest one)
-- Uncomment the lines below if you want to automatically clean up duplicates

-- WITH duplicates AS (
--     SELECT 
--         id,
--         ROW_NUMBER() OVER (PARTITION BY telegram_id ORDER BY created_at ASC) as rn
--     FROM users
-- ),
-- users_to_delete AS (
--     SELECT id FROM duplicates WHERE rn > 1
-- )
-- DELETE FROM users WHERE id IN (SELECT id FROM users_to_delete);

-- Success message
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT telegram_id 
        FROM users 
        GROUP BY telegram_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % telegram_ids with duplicate users. Review the query results above.';
        RAISE NOTICE 'Uncomment the cleanup section to automatically remove duplicates (keeping oldest).';
    ELSE
        RAISE NOTICE 'No duplicate users found. Your database is clean!';
    END IF;
END
$$;
