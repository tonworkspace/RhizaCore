-- STEP 4: Add indexes and RLS policies
-- Run this after step 3 is complete

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_user_id ON free_mining_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_active ON free_mining_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_end_date ON free_mining_periods(end_date);

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'free_mining_periods' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE free_mining_periods ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Enabled RLS on free_mining_periods table';
    ELSE
        RAISE NOTICE 'ℹ️  RLS already enabled on free_mining_periods table';
    END IF;
END $$;

-- Create RLS policies (permissive for functions)
DO $$
BEGIN
    -- Drop existing policies first
    DROP POLICY IF EXISTS "Users can view their own free mining periods" ON free_mining_periods;
    DROP POLICY IF EXISTS "Users can insert their own free mining periods" ON free_mining_periods;
    DROP POLICY IF EXISTS "Users can update their own free mining periods" ON free_mining_periods;
    DROP POLICY IF EXISTS "Allow function access" ON free_mining_periods;
    
    -- Create permissive policies that work with functions
    CREATE POLICY "Allow function access" ON free_mining_periods
        FOR ALL USING (true)
        WITH CHECK (true);
    
    RAISE NOTICE '✅ Created permissive RLS policies for functions';
END $$;
