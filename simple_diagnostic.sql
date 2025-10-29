-- Simple Diagnostic Script - Check Current Table Structure
-- Run this FIRST to see what columns actually exist

-- Check if table exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'free_mining_periods'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ free_mining_periods table exists';
    ELSE
        RAISE NOTICE '❌ free_mining_periods table does NOT exist';
        RETURN;
    END IF;
END $$;

-- List all columns in the table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'free_mining_periods'
ORDER BY ordinal_position;

-- Check for specific required columns
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Checking for required columns:';
    
    -- Check sessions_used
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'free_mining_periods' AND column_name = 'sessions_used') THEN
        RAISE NOTICE '✅ sessions_used column exists';
    ELSE
        RAISE NOTICE '❌ sessions_used column MISSING';
    END IF;
    
    -- Check max_sessions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'free_mining_periods' AND column_name = 'max_sessions') THEN
        RAISE NOTICE '✅ max_sessions column exists';
    ELSE
        RAISE NOTICE '❌ max_sessions column MISSING';
    END IF;
    
    -- Check grace_period_end
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'free_mining_periods' AND column_name = 'grace_period_end') THEN
        RAISE NOTICE '✅ grace_period_end column exists';
    ELSE
        RAISE NOTICE '❌ grace_period_end column MISSING';
    END IF;
    
    -- Check updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'free_mining_periods' AND column_name = 'updated_at') THEN
        RAISE NOTICE '✅ updated_at column exists';
    ELSE
        RAISE NOTICE '❌ updated_at column MISSING';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 If you see any ❌ MISSING columns, run fix_table_structure.sql next';
    RAISE NOTICE '📋 If all columns show ✅, you can run safe_free_mining_migration.sql';
END $$;

-- Show row count
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM free_mining_periods;
    RAISE NOTICE '📊 Table has % rows', row_count;
END $$;
