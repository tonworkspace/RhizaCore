-- QUICK FIX: Handle existing data with NULL days_remaining
-- Run this if you're getting the NOT NULL constraint error

-- Step 1: Add days_remaining column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'days_remaining'
    ) THEN
        -- Add column with default value first
        ALTER TABLE free_mining_periods ADD COLUMN days_remaining INTEGER DEFAULT 100;
        RAISE NOTICE '✅ Added days_remaining column with default value';
        
        -- Update existing rows to calculate proper days_remaining
        UPDATE free_mining_periods 
        SET days_remaining = GREATEST(0, EXTRACT(DAY FROM (end_date - CURRENT_TIMESTAMP)))::INTEGER
        WHERE days_remaining IS NULL OR days_remaining = 0;
        
        RAISE NOTICE '✅ Updated existing rows with calculated days_remaining';
        
        -- Now make it NOT NULL
        ALTER TABLE free_mining_periods ALTER COLUMN days_remaining SET NOT NULL;
        RAISE NOTICE '✅ Set days_remaining column to NOT NULL';
    ELSE
        RAISE NOTICE 'ℹ️  days_remaining column already exists';
        
        -- Update any NULL values
        UPDATE free_mining_periods 
        SET days_remaining = GREATEST(0, EXTRACT(DAY FROM (end_date - CURRENT_TIMESTAMP)))::INTEGER
        WHERE days_remaining IS NULL;
        
        RAISE NOTICE '✅ Updated NULL days_remaining values';
    END IF;
END $$;

-- Step 2: Verify the fix
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM free_mining_periods;
    SELECT COUNT(*) INTO null_count FROM free_mining_periods WHERE days_remaining IS NULL;
    
    RAISE NOTICE '📊 Total rows: %, NULL days_remaining: %', total_count, null_count;
    
    IF null_count = 0 THEN
        RAISE NOTICE '✅ All rows now have valid days_remaining values';
    ELSE
        RAISE NOTICE '❌ Still have % rows with NULL days_remaining', null_count;
    END IF;
END $$;

-- Step 3: Test the function
DO $$
DECLARE
    test_user_id BIGINT;
    test_result RECORD;
BEGIN
    -- Get the first user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test get_free_mining_status function
        SELECT * INTO test_result FROM get_free_mining_status(test_user_id);
        
        RAISE NOTICE '🧪 Testing with User ID: %', test_user_id;
        RAISE NOTICE '   Can Mine: %', test_result.can_mine;
        RAISE NOTICE '   Days Remaining: %', test_result.days_remaining;
        RAISE NOTICE '   Sessions Remaining: %', test_result.sessions_remaining;
        
        IF test_result.can_mine IS NOT NULL THEN
            RAISE NOTICE '✅ Function test successful!';
        ELSE
            RAISE NOTICE '❌ Function test failed!';
        END IF;
    ELSE
        RAISE NOTICE '❌ No users found to test with';
    END IF;
END $$;
