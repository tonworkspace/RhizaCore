-- ============================================================================
-- COMPLETE DAILY REWARD SYSTEM SETUP
-- ============================================================================
-- This script creates all necessary tables, indexes, and functions for the
-- daily reward system. Run this in your Supabase SQL editor.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create all necessary tables
-- ============================================================================

-- Daily Rewards table to track user daily reward claims
CREATE TABLE IF NOT EXISTS daily_rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    claim_date DATE NOT NULL,
    reward_amount NUMERIC(18,8) NOT NULL DEFAULT 1000, -- Base daily reward in RZC
    streak_count INTEGER DEFAULT 1,
    bonus_multiplier NUMERIC(3,2) DEFAULT 1.0, -- Multiplier for streak bonuses
    total_reward NUMERIC(18,8) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, claim_date)
);

-- Daily Reward Streaks table to track consecutive daily claims
CREATE TABLE IF NOT EXISTS daily_reward_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_claim_date DATE,
    streak_start_date DATE,
    total_days_claimed INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Twitter Engagement Tasks table (optional, for future use)
CREATE TABLE IF NOT EXISTS twitter_engagement_tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    tweet_url TEXT NOT NULL,
    engagement_type VARCHAR(20) NOT NULL CHECK (engagement_type IN ('like', 'retweet', 'reply', 'follow')),
    reward_amount NUMERIC(18,8) NOT NULL DEFAULT 10, -- 10 RZC per engagement
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure earning_logs table exists
CREATE TABLE IF NOT EXISTS earning_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 2: Create all necessary indexes
-- ============================================================================

-- Daily rewards indexes
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_claim_date ON daily_rewards(claim_date);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_date ON daily_rewards(user_id, claim_date);

-- Daily reward streaks indexes
CREATE INDEX IF NOT EXISTS idx_daily_reward_streaks_user_id ON daily_reward_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reward_streaks_last_claim_date ON daily_reward_streaks(last_claim_date);

-- Twitter engagement indexes
CREATE INDEX IF NOT EXISTS idx_twitter_engagement_user_id ON twitter_engagement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_twitter_engagement_completed_at ON twitter_engagement_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_twitter_engagement_url_type ON twitter_engagement_tasks(tweet_url, engagement_type);

-- Earning logs indexes
CREATE INDEX IF NOT EXISTS idx_earning_logs_user_id ON earning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_earning_logs_type ON earning_logs(type);
CREATE INDEX IF NOT EXISTS idx_earning_logs_timestamp ON earning_logs(timestamp);

-- ============================================================================
-- STEP 3: Create all necessary functions
-- ============================================================================

-- Function to calculate daily reward with streak bonus
CREATE OR REPLACE FUNCTION calculate_daily_reward(
    p_user_id BIGINT,
    p_streak_count INTEGER
) RETURNS NUMERIC(18,8) AS $$
DECLARE
    base_reward NUMERIC(18,8) := 1000; -- Base reward in RZC
    multiplier NUMERIC(3,2);
BEGIN
    -- Calculate multiplier based on streak
    IF p_streak_count <= 7 THEN
        multiplier := 1.0;
    ELSIF p_streak_count <= 14 THEN
        multiplier := 1.5;
    ELSIF p_streak_count <= 21 THEN
        multiplier := 2.0;
    ELSIF p_streak_count <= 28 THEN
        multiplier := 2.5;
    ELSE
        multiplier := 3.0; -- Max multiplier for 30+ day streak
    END IF;
    
    RETURN base_reward * multiplier;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily reward status
CREATE OR REPLACE FUNCTION get_daily_reward_status(
    p_user_id BIGINT
) RETURNS JSON AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    last_claim_date DATE;
    streak_record RECORD;
    can_claim BOOLEAN := false;
    next_claim_time TIMESTAMP;
    current_streak INTEGER := 0;
    longest_streak INTEGER := 0;
    total_days INTEGER := 0;
    next_streak INTEGER := 1; -- Default to 1 for new users
    next_reward NUMERIC(18,8);
    result JSON;
BEGIN
    -- Get streak record
    SELECT * INTO streak_record 
    FROM daily_reward_streaks 
    WHERE user_id = p_user_id;
    
    IF FOUND THEN
        current_streak := streak_record.current_streak;
        longest_streak := streak_record.longest_streak;
        total_days := streak_record.total_days_claimed;
        last_claim_date := streak_record.last_claim_date;
        
        -- Calculate what the streak will be after claiming
        -- If last claim was yesterday, continue streak; otherwise reset to 1
        IF last_claim_date IS NULL OR last_claim_date = today_date - INTERVAL '1 day' THEN
            next_streak := current_streak + 1;
        ELSE
            next_streak := 1; -- Streak broken, will reset to 1
        END IF;
    END IF;
    
    -- Check if user can claim today
    IF NOT EXISTS (
        SELECT 1 FROM daily_rewards 
        WHERE user_id = p_user_id AND claim_date = today_date
    ) THEN
        can_claim := true;
        next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
    ELSE
        -- Already claimed today, next claim is tomorrow
        next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
        -- If already claimed, next reward will be based on continuing streak
        IF FOUND AND last_claim_date = today_date THEN
            next_streak := current_streak + 1;
        END IF;
    END IF;
    
    -- Calculate the reward amount for the next claim
    next_reward := calculate_daily_reward(p_user_id, next_streak);
    
    RETURN json_build_object(
        'can_claim', can_claim,
        'current_streak', current_streak,
        'longest_streak', longest_streak,
        'total_days_claimed', total_days,
        'next_claim_time', next_claim_time,
        'last_claim_date', last_claim_date,
        'next_reward_amount', next_reward
    );
END;
$$ LANGUAGE plpgsql;

-- Function to claim daily reward
CREATE OR REPLACE FUNCTION claim_daily_reward(
    p_user_id BIGINT
) RETURNS JSON AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    last_claim_date DATE;
    current_streak INTEGER := 0;
    streak_record RECORD;
    reward_amount NUMERIC(18,8) := 1000; -- Base reward
    total_reward NUMERIC(18,8);
    multiplier NUMERIC(3,2);
    next_claim_time TIMESTAMP;
    result JSON;
BEGIN
    -- Step 1: Check if user already claimed today (prevent double claims)
    IF EXISTS (
        SELECT 1 FROM daily_rewards 
        WHERE user_id = p_user_id AND claim_date = today_date
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Daily reward already claimed today!',
            'next_claim_time', (today_date + INTERVAL '1 day')::timestamp
        );
    END IF;
    
    -- Step 2: Get or create streak record
    SELECT * INTO streak_record 
    FROM daily_reward_streaks 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- New user - create streak record with day 1
        INSERT INTO daily_reward_streaks (
            user_id, 
            current_streak, 
            longest_streak, 
            last_claim_date, 
            streak_start_date, 
            total_days_claimed
        )
        VALUES (p_user_id, 1, 1, today_date, today_date, 1);
        current_streak := 1;
        last_claim_date := NULL;
    ELSE
        -- Existing user - check if streak continues or resets
        last_claim_date := streak_record.last_claim_date;
        
        -- Check if streak should continue or reset
        IF last_claim_date IS NULL OR last_claim_date = today_date - INTERVAL '1 day' THEN
            -- Continue streak (claimed yesterday or never claimed before)
            current_streak := streak_record.current_streak + 1;
            
            -- Update streak record
            UPDATE daily_reward_streaks 
            SET 
                current_streak = current_streak,
                longest_streak = GREATEST(longest_streak, current_streak),
                last_claim_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        ELSE
            -- Reset streak (missed a day or more)
            current_streak := 1;
            
            UPDATE daily_reward_streaks 
            SET 
                current_streak = 1,
                longest_streak = GREATEST(longest_streak, 1), -- Don't decrease longest_streak
                last_claim_date = today_date,
                streak_start_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Step 3: Calculate reward amount based on current streak
    total_reward := calculate_daily_reward(p_user_id, current_streak);
    
    -- Step 4: Calculate multiplier for display
    IF current_streak <= 7 THEN
        multiplier := 1.0;
    ELSIF current_streak <= 14 THEN
        multiplier := 1.5;
    ELSIF current_streak <= 21 THEN
        multiplier := 2.0;
    ELSIF current_streak <= 28 THEN
        multiplier := 2.5;
    ELSE
        multiplier := 3.0; -- 30+ days
    END IF;
    
    -- Step 5: Record the claim in daily_rewards table
    INSERT INTO daily_rewards (
        user_id, 
        claim_date, 
        reward_amount, 
        streak_count, 
        bonus_multiplier, 
        total_reward
    )
    VALUES (
        p_user_id, 
        today_date, 
        reward_amount, 
        current_streak, 
        multiplier, 
        total_reward
    );
    
    -- Step 6: Add reward to user's airdrop balance (total_sbt)
    UPDATE users 
    SET 
        total_sbt = COALESCE(total_sbt, 0) + total_reward,
        last_active = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Step 7: Record in earning logs for tracking
    INSERT INTO earning_logs (user_id, type, amount, metadata)
    VALUES (
        p_user_id, 
        'daily_reward', 
        total_reward, 
        json_build_object(
            'streak_count', current_streak,
            'multiplier', multiplier,
            'base_reward', reward_amount,
            'claim_date', today_date
        )
    );
    
    -- Step 8: Calculate next claim time (24 hours from now)
    next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
    
    -- Step 9: Return success response with all relevant data
    RETURN json_build_object(
        'success', true,
        'message', 'Daily reward claimed successfully!',
        'reward_amount', total_reward,
        'streak_count', current_streak,
        'multiplier', multiplier,
        'next_claim_time', next_claim_time,
        'base_reward', reward_amount
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Handle any unexpected errors
        RETURN json_build_object(
            'success', false,
            'message', 'An error occurred while claiming the daily reward. Please try again.',
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Daily reward system has been completely set up!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables Created/Verified:';
    RAISE NOTICE '   - daily_rewards';
    RAISE NOTICE '   - daily_reward_streaks';
    RAISE NOTICE '   - twitter_engagement_tasks';
    RAISE NOTICE '   - earning_logs';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Functions Created:';
    RAISE NOTICE '   - get_daily_reward_status()';
    RAISE NOTICE '   - claim_daily_reward()';
    RAISE NOTICE '   - calculate_daily_reward()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Indexes Created for Performance';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your daily reward system is now ready to use!';
END
$$;

