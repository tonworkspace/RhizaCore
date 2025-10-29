-- STEP 3: Create all required functions
-- Run this after step 2 is complete

-- Function 1: Initialize or update free mining period
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
            grace_period_end,
            days_remaining
        )
        VALUES (
            p_user_id, 
            user_created_at, 
            new_end_date,
            0,
            100,
            true,
            grace_end_date,
            GREATEST(0, EXTRACT(DAY FROM (new_end_date - CURRENT_TIMESTAMP)))::INTEGER
        );
    ELSE
        -- Update existing period to ensure 100-day period (only if needed)
        IF existing_period.end_date < new_end_date THEN
            UPDATE free_mining_periods 
            SET 
                end_date = new_end_date,
                grace_period_end = grace_end_date,
                days_remaining = GREATEST(0, EXTRACT(DAY FROM (new_end_date - CURRENT_TIMESTAMP)))::INTEGER,
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

-- Function 2: Check if user can mine
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
    IF NOW() > period_record.end_date AND NOW() <= period_record.grace_period_end THEN
        RETURN QUERY SELECT 
            true as can_mine,
            'In grace period - limited mining available'::TEXT as reason,
            0 as days_remaining,
            GREATEST(0, period_record.max_sessions - period_record.sessions_used) as sessions_remaining,
            true as is_in_grace_period;
        RETURN;
    END IF;
    
    -- Check if period has expired (including grace period)
    IF NOW() > period_record.grace_period_end THEN
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
            GREATEST(0, EXTRACT(DAY FROM (period_record.end_date - NOW())))::INTEGER as days_remaining,
            0 as sessions_remaining,
            false as is_in_grace_period;
        RETURN;
    END IF;
    
    -- User can mine
    RETURN QUERY SELECT 
        true as can_mine,
        'Free mining period active'::TEXT as reason,
        GREATEST(0, EXTRACT(DAY FROM (period_record.end_date - NOW())))::INTEGER as days_remaining,
        period_record.max_sessions - period_record.sessions_used as sessions_remaining,
        false as is_in_grace_period;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Increment session count
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

-- Function 4: Get comprehensive status (this is the one your app is calling)
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
        period_record.end_date::TIMESTAMP WITH TIME ZONE as end_date,
        period_record.grace_period_end::TIMESTAMP WITH TIME ZONE as grace_period_end,
        mining_check.is_in_grace_period as is_in_grace_period,
        mining_check.reason as reason;
END;
$$ LANGUAGE plpgsql;

-- Verify functions were created
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines 
    WHERE routine_name IN (
        'initialize_or_update_free_mining_period',
        'can_user_mine_free', 
        'increment_mining_session_count',
        'get_free_mining_status'
    );
    
    IF func_count = 4 THEN
        RAISE NOTICE '✅ All 4 functions created successfully';
    ELSE
        RAISE NOTICE '❌ Only % out of 4 functions created', func_count;
    END IF;
END $$;
