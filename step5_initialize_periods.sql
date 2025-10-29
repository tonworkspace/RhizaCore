-- STEP 5: Initialize free mining periods for existing users
-- Run this after step 4 is complete

-- Initialize free mining periods for all existing users
DO $$
DECLARE
    user_record RECORD;
    processed_count INTEGER := 0;
    total_users INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM users;
    RAISE NOTICE '📊 Found % total users', total_users;
    
    -- Process users who don't have free mining periods yet
    FOR user_record IN 
        SELECT u.id 
        FROM users u 
        LEFT JOIN free_mining_periods fmp ON u.id = fmp.user_id 
        WHERE fmp.user_id IS NULL
    LOOP
        PERFORM initialize_or_update_free_mining_period(user_record.id);
        processed_count := processed_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Initialized free mining periods for % users', processed_count;
    
    -- Verify results
    DECLARE
        final_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO final_count FROM free_mining_periods;
        RAISE NOTICE '📊 Total free mining periods: %', final_count;
        
        IF final_count = total_users THEN
            RAISE NOTICE '✅ All users now have free mining periods';
        ELSE
            RAISE NOTICE '⚠️  % users still missing periods', (total_users - final_count);
        END IF;
    END;
END $$;
