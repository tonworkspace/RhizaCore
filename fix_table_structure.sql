-- Safe Table Migration - Add Missing Columns
-- This script safely adds missing columns to existing free_mining_periods table
-- Run this BEFORE running the safe_free_mining_migration.sql

-- Step 1: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add sessions_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'sessions_used'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN sessions_used INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added sessions_used column';
    ELSE
        RAISE NOTICE 'ℹ️  sessions_used column already exists';
    END IF;
    
    -- Add max_sessions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'max_sessions'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN max_sessions INTEGER DEFAULT 100;
        RAISE NOTICE '✅ Added max_sessions column';
    ELSE
        RAISE NOTICE 'ℹ️  max_sessions column already exists';
    END IF;
    
    -- Add grace_period_end column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'grace_period_end'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN grace_period_end TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added grace_period_end column';
    ELSE
        RAISE NOTICE 'ℹ️  grace_period_end column already exists';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Added updated_at column';
    ELSE
        RAISE NOTICE 'ℹ️  updated_at column already exists';
    END IF;
    
    -- Update grace_period_end for existing rows if it's NULL
    UPDATE free_mining_periods 
    SET grace_period_end = end_date + INTERVAL '7 days'
    WHERE grace_period_end IS NULL;
    
    RAISE NOTICE '✅ Updated grace_period_end for existing rows';
END $$;

-- Step 2: Verify the table structure
DO $$
DECLARE
    column_info TEXT;
BEGIN
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    INTO column_info
    FROM information_schema.columns 
    WHERE table_name = 'free_mining_periods';
    
    RAISE NOTICE '📋 Updated table structure: %', column_info;
END $$;

-- Step 3: Show sample data
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM free_mining_periods;
    RAISE NOTICE '📊 Table now has % rows', row_count;
    
    IF row_count > 0 THEN
        RAISE NOTICE '✅ Table migration completed successfully!';
        RAISE NOTICE 'You can now run the safe_free_mining_migration.sql script.';
    ELSE
        RAISE NOTICE '⚠️  Table is empty - this is normal if no users have been processed yet.';
    END IF;
END $$;
