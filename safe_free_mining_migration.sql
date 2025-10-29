-- SAFE Free Mining Period Migration
-- This migration is designed to be non-disruptive and safe for production databases
-- It will NOT drop existing tables or data

-- Step 1: Check if free_mining_periods table already exists
DO $$
BEGIN
    -- Only create the table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mining_periods') THEN
        -- Create the table only if it doesn't exist
        CREATE TABLE free_mining_periods (
            id SERIAL PRIMARY KEY,
            user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            sessions_used INTEGER DEFAULT 0,
            max_sessions INTEGER DEFAULT 100,
            is_active BOOLEAN DEFAULT true,
            grace_period_end TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id)
        );
        
        RAISE NOTICE 'Created free_mining_periods table';
    ELSE
        RAISE NOTICE 'free_mining_periods table already exists, skipping creation';
    END IF;
END $$;

-- Step 2: Create or replace functions (safe operation)
CREATE OR REPLACE FUNCTION initialize_or_update_free_mining_period(p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE
    user_created_at TIMESTAMP WITH TIME ZONE;
    existing_period RECORD;
    new_end_date TIMESTAMP WITH TIME ZONE;
    grace_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user creation date
    SELECT created_at INTO user_created_at
    FROM users
    WHERE id = p_user_id;
    
    -- Check if user already has a free mining period
    SELECT * INTO existing_period
    FROM free_mining_periods
    WHERE user_id = p_user_id;
    
    -- Calculate end date: 100 days from user creation or current date (whichever is later)
    new_end_date := GREATEST(
        user_created_at + INTERVAL '100 days',
        CURRENT_TIMESTAMP + INTERVAL '100 days'
    );
    
    -- Grace period: 7 days after the free period ends
    grace_end_date := new_end_date + INTERVAL '7 days';
    
    IF existing_period IS NULL THEN
        -- Create new free mining period
        INSERT INTO free_mining_periods (
            user_id, 
            start_date, 
            end_date, 
            sessions_used, 
            max_sessions, 
            is_active,
            grace_period_end
        )
        VALUES (
            p_user_id, 
            user_created_at, 
            new_end_date,
            0,
            100,
            true,
            grace_end_date
        );
    ELSE
        -- Update existing period to ensure 100-day period (only if needed)
        -- Only update if the current period is shorter than 100 days
        IF existing_period.end_date < new_end_date THEN
            UPDATE free_mining_periods 
            SET 
                end_date = new_end_date,
                grace_period_end = grace_end_date,
                is_active = CASE 
                    WHEN CURRENT_TIMESTAMP <= grace_end_date THEN true 
                    ELSE false 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION can_user_mine_free(p_user_id BIGINT)
RETURNS TABLE(
    can_mine BOOLEAN,
    reason TEXT,
    days_remaining INTEGER,
    sessions_remaining INTEGER,
    is_in_grace_period BOOLEAN
) AS $$
DECLARE
    period_record RECORD;
    current_time TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
    -- Get user's free mining period
    SELECT * INTO period_record
    FROM free_mining_periods
    WHERE user_id = p_user_id;
    
    -- If no period exists, initialize one
    IF period_record IS NULL THEN
        PERFORM initialize_or_update_free_mining_period(p_user_id);
        SELECT * INTO period_record
        FROM free_mining_periods
        WHERE user_id = p_user_id;
    END IF;
    
    -- Check if in grace period
    IF current_time > period_record.end_date AND current_time <= period_record.grace_period_end THEN
        RETURN QUERY SELECT 
            true as can_mine,
            'In grace period - limited mining available'::TEXT as reason,
            0 as days_remaining,
            GREATEST(0, period_record.max_sessions - period_record.sessions_used) as sessions_remaining,
            true as is_in_grace_period;
        RETURN;
    END IF;
    
    -- Check if period has expired (including grace period)
    IF current_time > period_record.grace_period_end THEN
        RETURN QUERY SELECT 
            false as can_mine,
            'Free mining period has expired. Please stake TON to continue mining.'::TEXT as reason,
            0 as days_remaining,
            0 as sessions_remaining,
            false as is_in_grace_period;
        RETURN;
    END IF;
    
    -- Check if all sessions used
    IF period_record.sessions_used >= period_record.max_sessions THEN
        RETURN QUERY SELECT 
            false as can_mine,
            'All free mining sessions have been used.'::TEXT as reason,
            GREATEST(0, EXTRACT(DAY FROM (period_record.end_date - current_time)))::INTEGER as days_remaining,
            0 as sessions_remaining,
            false as is_in_grace_period;
        RETURN;
    END IF;
    
    -- User can mine
    RETURN QUERY SELECT 
        true as can_mine,
        'Free mining period active'::TEXT as reason,
        GREATEST(0, EXTRACT(DAY FROM (period_record.end_date - current_time)))::INTEGER as days_remaining,
        period_record.max_sessions - period_record.sessions_used as sessions_remaining,
        false as is_in_grace_period;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_mining_session_count(p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE
    period_record RECORD;
BEGIN
    -- Get current period
    SELECT * INTO period_record
    FROM free_mining_periods
    WHERE user_id = p_user_id;
    
    -- If no period exists, initialize one
    IF period_record IS NULL THEN
        PERFORM initialize_or_update_free_mining_period(p_user_id);
    END IF;
    
    -- Increment session count
    UPDATE free_mining_periods 
    SET 
        sessions_used = sessions_used + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_free_mining_status(p_user_id BIGINT)
RETURNS TABLE(
    is_active BOOLEAN,
    days_remaining INTEGER,
    sessions_used INTEGER,
    max_sessions INTEGER,
    sessions_remaining INTEGER,
    can_mine BOOLEAN,
    end_date TIMESTAMP WITH TIME ZONE,
    grace_period_end TIMESTAMP WITH TIME ZONE,
    is_in_grace_period BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    period_record RECORD;
    mining_check RECORD;
BEGIN
    -- Get user's free mining period
    SELECT * INTO period_record
    FROM free_mining_periods
    WHERE user_id = p_user_id;
    
    -- If no period exists, initialize one
    IF period_record IS NULL THEN
        PERFORM initialize_or_update_free_mining_period(p_user_id);
        SELECT * INTO period_record
        FROM free_mining_periods
        WHERE user_id = p_user_id;
    END IF;
    
    -- Check mining eligibility
    SELECT * INTO mining_check
    FROM can_user_mine_free(p_user_id);
    
    RETURN QUERY SELECT 
        period_record.is_active as is_active,
        mining_check.days_remaining as days_remaining,
        period_record.sessions_used as sessions_used,
        period_record.max_sessions as max_sessions,
        mining_check.sessions_remaining as sessions_remaining,
        mining_check.can_mine as can_mine,
        period_record.end_date as end_date,
        period_record.grace_period_end as grace_period_end,
        mining_check.is_in_grace_period as is_in_grace_period,
        mining_check.reason as reason;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Add indexes only if they don't exist (safe operation)
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_user_id ON free_mining_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_active ON free_mining_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_end_date ON free_mining_periods(end_date);

-- Step 4: Add RLS policies only if table exists and RLS is not already enabled
DO $$
BEGIN
    -- Only enable RLS if the table exists and RLS is not already enabled
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mining_periods') THEN
        -- Check if RLS is already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = 'free_mining_periods' 
            AND relrowsecurity = true
        ) THEN
            ALTER TABLE free_mining_periods ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on free_mining_periods table';
        ELSE
            RAISE NOTICE 'RLS already enabled on free_mining_periods table';
        END IF;
    END IF;
END $$;

-- Step 5: Create RLS policies only if they don't exist
DO $$
BEGIN
    -- Only create policies if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mining_periods') THEN
        -- Create policies only if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'free_mining_periods' 
            AND policyname = 'Users can view their own free mining periods'
        ) THEN
            CREATE POLICY "Users can view their own free mining periods" ON free_mining_periods
                FOR SELECT USING (auth.uid()::text = user_id::text);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'free_mining_periods' 
            AND policyname = 'Users can insert their own free mining periods'
        ) THEN
            CREATE POLICY "Users can insert their own free mining periods" ON free_mining_periods
                FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'free_mining_periods' 
            AND policyname = 'Users can update their own free mining periods'
        ) THEN
            CREATE POLICY "Users can update their own free mining periods" ON free_mining_periods
                FOR UPDATE USING (auth.uid()::text = user_id::text);
        END IF;
        
        RAISE NOTICE 'RLS policies created/verified for free_mining_periods table';
    END IF;
END $$;

-- Step 6: Initialize free mining periods for existing users (safe operation)
-- This will only create periods for users who don't already have them
DO $$
DECLARE
    user_record RECORD;
    period_count INTEGER := 0;
BEGIN
    -- Count existing periods first
    SELECT COUNT(*) INTO period_count FROM free_mining_periods;
    
    RAISE NOTICE 'Found % existing free mining periods', period_count;
    
    -- Only initialize for users who don't have periods yet
    FOR user_record IN 
        SELECT u.id 
        FROM users u 
        LEFT JOIN free_mining_periods fmp ON u.id = fmp.user_id 
        WHERE fmp.user_id IS NULL
    LOOP
        PERFORM initialize_or_update_free_mining_period(user_record.id);
    END LOOP;
    
    RAISE NOTICE 'Initialized free mining periods for users who did not have them';
END $$;

-- Step 7: Verification query (optional - you can run this to check the results)
-- Uncomment the following lines to see the results after migration
/*
SELECT 
    COUNT(*) as total_users,
    COUNT(fmp.user_id) as users_with_periods,
    COUNT(*) - COUNT(fmp.user_id) as users_without_periods
FROM users u
LEFT JOIN free_mining_periods fmp ON u.id = fmp.user_id;
*/
