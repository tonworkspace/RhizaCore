-- Daily Rewards System Database Schema
-- This script creates the necessary tables and functions for daily rewards and Twitter engagement tracking
-- Run this in your Supabase SQL editor

-- Daily Rewards table to track user daily reward claims
CREATE TABLE IF NOT EXISTS daily_rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    claim_date DATE NOT NULL,
    reward_amount NUMERIC(18,8) NOT NULL DEFAULT 1000, -- Base daily reward in RZC
    streak_count INTEGER DEFAULT 1,
    bonus_multiplier NUMERIC(3,2) DEFAULT 1.0, -- Multiplier for streak bonuses
    total_reward NUMERIC(18,8) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, claim_date)
);

-- Twitter Engagement Tasks table
CREATE TABLE IF NOT EXISTS twitter_engagement_tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    tweet_url TEXT NOT NULL,
    engagement_type VARCHAR(20) NOT NULL CHECK (engagement_type IN ('like', 'retweet', 'reply', 'follow')),
    reward_amount NUMERIC(18,8) NOT NULL DEFAULT 10, -- 10 RZC per engagement
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Reward Streaks table to track consecutive daily claims
CREATE TABLE IF NOT EXISTS daily_reward_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_claim_date DATE,
    streak_start_date DATE,
    total_days_claimed INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

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

-- Function to claim daily reward
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
    
    -- Record in earning logs
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

-- Function to complete Twitter engagement task
CREATE OR REPLACE FUNCTION complete_twitter_engagement(
    p_user_id BIGINT,
    p_tweet_url TEXT,
    p_engagement_type VARCHAR
) RETURNS JSON AS $$
DECLARE
    reward_amount NUMERIC(18,8) := 10; -- 10 RZC per engagement
    result JSON;
BEGIN
    -- Check if user already completed this specific engagement
    IF EXISTS (
        SELECT 1 FROM twitter_engagement_tasks 
        WHERE user_id = p_user_id 
        AND tweet_url = p_tweet_url 
        AND engagement_type = p_engagement_type
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'This engagement has already been completed!'
        );
    END IF;
    
    -- Record the engagement
    INSERT INTO twitter_engagement_tasks (user_id, tweet_url, engagement_type, reward_amount, verified)
    VALUES (p_user_id, p_tweet_url, p_engagement_type, reward_amount, true);
    
    -- Add reward to user's airdrop balance (SBT)
    UPDATE users 
    SET total_sbt = total_sbt + reward_amount,
        last_active = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Record in earning logs
    INSERT INTO earning_logs (user_id, type, amount, metadata)
    VALUES (p_user_id, 'twitter_engagement', reward_amount, json_build_object(
        'tweet_url', p_tweet_url,
        'engagement_type', p_engagement_type
    ));
    
    RETURN json_build_object(
        'success', true,
        'message', 'Twitter engagement completed!',
        'reward_amount', reward_amount,
        'engagement_type', p_engagement_type
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_claim_date ON daily_rewards(claim_date);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_date ON daily_rewards(user_id, claim_date);

CREATE INDEX IF NOT EXISTS idx_twitter_engagement_user_id ON twitter_engagement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_twitter_engagement_completed_at ON twitter_engagement_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_twitter_engagement_url_type ON twitter_engagement_tasks(tweet_url, engagement_type);

CREATE INDEX IF NOT EXISTS idx_daily_reward_streaks_user_id ON daily_reward_streaks(user_id);

-- Insert some sample Twitter engagement tasks
INSERT INTO tasks (id, title, description, reward, reward_type, difficulty, status, requirements) VALUES
(100, 'Daily Reward Bonus', 'Claim your daily RZC bonus! Come back every 24 hours to maintain your streak and earn bonus multipliers.', 1000, 'RZC', 'EASY', 'ACTIVE', '{"type": "daily_claim", "cooldown_hours": 24}'),
(101, 'Twitter Like Engagement', 'Like our latest tweet to earn 10 RZC! Help us grow our community.', 10, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "like", "reward": 10}'),
(102, 'Twitter Retweet Engagement', 'Retweet our latest tweet to earn 10 RZC! Spread the word about RZC.', 10, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "retweet", "reward": 10}'),
(103, 'Twitter Reply Engagement', 'Reply to our latest tweet to earn 10 RZC! Share your thoughts with the community.', 10, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "reply", "reward": 10}'),
(104, 'Twitter Follow Engagement', 'Follow our Twitter account to earn 10 RZC! Stay updated with the latest news.', 10, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "follow", "reward": 10}');

-- Update existing tasks to use new task IDs
UPDATE tasks SET id = id + 10 WHERE id <= 5;
