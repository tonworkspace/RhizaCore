-- Improved Free Mining Period System
-- This creates a proper 100-day free mining period for all users

-- Drop existing free_mining_periods table if it exists
DROP TABLE IF EXISTS free_mining_periods CASCADE;

-- Create improved Free Mining Periods table
CREATE TABLE free_mining_periods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sessions_used INTEGER DEFAULT 0,
    max_sessions INTEGER DEFAULT 100, -- 100 sessions for 100 days
    is_active BOOLEAN DEFAULT true,
    grace_period_end TIMESTAMP WITH TIME ZONE, -- 7-day grace period after expiry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Function to initialize or update free mining period for users
CREATE OR REPLACE FUNCTION initialize_or_update_free_mining_period(p_user_id INTEGER)
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
        -- Update existing period to ensure 100-day period
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
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can mine (considering both time and sessions)
CREATE OR REPLACE FUNCTION can_user_mine_free(p_user_id INTEGER)
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

-- Function to increment session count when mining starts
CREATE OR REPLACE FUNCTION increment_mining_session_count(p_user_id INTEGER)
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

-- Function to get comprehensive free mining status
CREATE OR REPLACE FUNCTION get_free_mining_status(p_user_id INTEGER)
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_user_id ON free_mining_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_active ON free_mining_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_end_date ON free_mining_periods(end_date);

-- Add RLS policies for security
ALTER TABLE free_mining_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for free_mining_periods
CREATE POLICY "Users can view their own free mining periods" ON free_mining_periods
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own free mining periods" ON free_mining_periods
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own free mining periods" ON free_mining_periods
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Initialize free mining periods for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        PERFORM initialize_or_update_free_mining_period(user_record.id);
    END LOOP;
END $$;
