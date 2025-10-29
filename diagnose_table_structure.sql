-- Diagnostic Script - Check Current Table Structure
-- Run this FIRST to see what columns actually exist

-- Check if table exists and what columns it has
DO $$
DECLARE
    table_exists BOOLEAN;
    column_info TEXT;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'free_mining_periods'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ free_mining_periods table exists';
        
        -- Get column information
        SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
        INTO column_info
        FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods';
        
        RAISE NOTICE '📋 Current columns: %', column_info;
        
        -- Check for specific columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'free_mining_periods' AND column_name = 'sessions_used') THEN
            RAISE NOTICE '✅ sessions_used column exists';
        ELSE
            RAISE NOTICE '❌ sessions_used column does NOT exist';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'free_mining_periods' AND column_name = 'max_sessions') THEN
            RAISE NOTICE '✅ max_sessions column exists';
        ELSE
            RAISE NOTICE '❌ max_sessions column does NOT exist';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'free_mining_periods' AND column_name = 'grace_period_end') THEN
            RAISE NOTICE '✅ grace_period_end column exists';
        ELSE
            RAISE NOTICE '❌ grace_period_end column does NOT exist';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ free_mining_periods table does NOT exist';
    END IF;
END $$;

-- Show sample data if table exists
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mining_periods') THEN
        SELECT COUNT(*) INTO row_count FROM free_mining_periods;
        RAISE NOTICE '📊 Table has % rows', row_count;
        
        IF row_count > 0 THEN
            RAISE NOTICE '📋 Sample row structure:';
            -- This will show the structure of the first row
            PERFORM * FROM free_mining_periods LIMIT 1;
        END IF;
    END IF;
END $$;
