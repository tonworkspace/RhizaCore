-- STEP 2: Create table if it doesn't exist
-- Run this ONLY if step 1 showed the table doesn't exist

-- Create the free_mining_periods table
CREATE TABLE IF NOT EXISTS free_mining_periods (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    days_remaining INTEGER NOT NULL DEFAULT 100,
    sessions_used INTEGER DEFAULT 0,
    max_sessions INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    grace_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add missing columns if they don't exist (for existing tables)
DO $$
BEGIN
    -- Add days_remaining column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'days_remaining'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN days_remaining INTEGER NOT NULL DEFAULT 100;
        RAISE NOTICE '✅ Added days_remaining column';
    END IF;
    
    -- Add sessions_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'sessions_used'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN sessions_used INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added sessions_used column';
    END IF;
    
    -- Add max_sessions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'max_sessions'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN max_sessions INTEGER DEFAULT 100;
        RAISE NOTICE '✅ Added max_sessions column';
    END IF;
    
    -- Add grace_period_end column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'grace_period_end'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN grace_period_end TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added grace_period_end column';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'free_mining_periods' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE free_mining_periods ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Added updated_at column';
    END IF;
    
    -- Update grace_period_end for existing rows if it's NULL
    UPDATE free_mining_periods 
    SET grace_period_end = end_date + INTERVAL '7 days'
    WHERE grace_period_end IS NULL;
    
    -- Update days_remaining for existing rows if it's NULL or 0
    UPDATE free_mining_periods 
    SET days_remaining = GREATEST(0, EXTRACT(DAY FROM (end_date - CURRENT_TIMESTAMP)))::INTEGER
    WHERE days_remaining IS NULL OR days_remaining = 0;
    
    RAISE NOTICE '✅ Updated grace_period_end and days_remaining for existing rows';
    
    RAISE NOTICE '✅ Table structure is now correct';
END $$;
