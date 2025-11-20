-- Fix Daily Reward System Errors
-- This script fixes the missing get_daily_reward_status function and ensures earning_logs table exists
-- Run this in your Supabase SQL editor

-- First, ensure earning_logs table exists (it should already exist from complete_schema.sql)
CREATE TABLE IF NOT EXISTS earning_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for earning_logs if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_earning_logs_user_id ON earning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_earning_logs_type ON earning_logs(type);

-- Add the missing get_daily_reward_status function
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
    END IF;
    
    -- Check if user can claim today
    IF NOT EXISTS (
        SELECT 1 FROM daily_rewards 
        WHERE user_id = p_user_id AND claim_date = today_date
    ) THEN
        can_claim := true;
        next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
    ELSE
        next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
    END IF;
    
    RETURN json_build_object(
        'can_claim', can_claim,
        'current_streak', current_streak,
        'longest_streak', longest_streak,
        'total_days_claimed', total_days,
        'next_claim_time', next_claim_time,
        'last_claim_date', last_claim_date,
        'next_reward_amount', calculate_daily_reward(p_user_id, current_streak + 1)
    );
END;
$$ LANGUAGE plpgsql;

-- Also ensure the calculate_daily_reward function exists
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

-- Ensure the claim_daily_reward function exists and is updated to use earning_logs
CREATE OR REPLACE FUNCTION claim_daily_reward(
    p_user_id BIGINT
) RETURNS JSON AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    last_claim_date DATE;
    current_streak INTEGER := 0;
    streak_record RECORD;
    reward_amount NUMERIC(18,8);
    total_reward NUMERIC(18,8);
    multiplier NUMERIC(3,2);
    result JSON;
BEGIN
    -- Check if user already claimed today
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
    
    -- Get or create streak record
    SELECT * INTO streak_record 
    FROM daily_reward_streaks 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create new streak record
        INSERT INTO daily_reward_streaks (user_id, current_streak, longest_streak, last_claim_date, streak_start_date, total_days_claimed)
        VALUES (p_user_id, 1, 1, today_date, today_date, 1);
        current_streak := 1;
        last_claim_date := NULL;
    ELSE
        last_claim_date := streak_record.last_claim_date;
        
        -- Check if streak should continue or reset
        IF last_claim_date IS NULL OR last_claim_date = today_date - INTERVAL '1 day' THEN
            -- Continue streak
            current_streak := streak_record.current_streak + 1;
            UPDATE daily_reward_streaks 
            SET 
                current_streak = current_streak,
                longest_streak = GREATEST(longest_streak, current_streak),
                last_claim_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        ELSE
            -- Reset streak (missed a day)
            current_streak := 1;
            UPDATE daily_reward_streaks 
            SET 
                current_streak = 1,
                last_claim_date = today_date,
                streak_start_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Calculate reward amount
    total_reward := calculate_daily_reward(p_user_id, current_streak);
    
    -- Calculate multiplier for display
    IF current_streak <= 7 THEN
        multiplier := 1.0;
    ELSIF current_streak <= 14 THEN
        multiplier := 1.5;
    ELSIF current_streak <= 21 THEN
        multiplier := 2.0;
    ELSIF current_streak <= 28 THEN
        multiplier := 2.5;
    ELSE
        multiplier := 3.0;
    END IF;
    
    -- Record the claim
    INSERT INTO daily_rewards (user_id, claim_date, reward_amount, streak_count, bonus_multiplier, total_reward)
    VALUES (p_user_id, today_date, 1000, current_streak, multiplier, total_reward);
    
    -- Add reward to user's airdrop balance (SBT)
    UPDATE users 
    SET total_sbt = total_sbt + total_reward,
        last_active = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Record in earning logs (this was causing the error)
    INSERT INTO earning_logs (user_id, type, amount, metadata)
    VALUES (p_user_id, 'daily_reward', total_reward, json_build_object(
        'streak_count', current_streak,
        'multiplier', multiplier,
        'base_reward', 1000
    ));
    
    RETURN json_build_object(
        'success', true,
        'message', 'Daily reward claimed successfully!',
        'reward_amount', total_reward,
        'streak_count', current_streak,
        'multiplier', multiplier,
        'next_claim_time', (today_date + INTERVAL '1 day')::timestamp
    );
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Daily reward system errors have been fixed!';
    RAISE NOTICE 'get_daily_reward_status function has been created.';
    RAISE NOTICE 'earning_logs table has been verified/created.';
    RAISE NOTICE 'claim_daily_reward function has been updated.';
END
$$;
