-- Setup Daily Reward System Tables
-- This script ensures all necessary tables for the daily reward system exist
-- Run this in your Supabase SQL editor

-- Daily Rewards table to track user daily reward claims
CREATE TABLE IF NOT EXISTS daily_rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    claim_date DATE NOT NULL,
    reward_amount NUMERIC(18,8) NOT NULL DEFAULT 1000, -- Base daily reward in TAPPS
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

-- Twitter Engagement Tasks table
CREATE TABLE IF NOT EXISTS twitter_engagement_tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    tweet_url TEXT NOT NULL,
    engagement_type VARCHAR(20) NOT NULL CHECK (engagement_type IN ('like', 'retweet', 'reply', 'follow')),
    reward_amount NUMERIC(18,8) NOT NULL DEFAULT 10, -- 10 TAPPs per engagement
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure earning_logs table exists (should already exist from complete_schema.sql)
CREATE TABLE IF NOT EXISTS earning_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_claim_date ON daily_rewards(claim_date);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_date ON daily_rewards(user_id, claim_date);

CREATE INDEX IF NOT EXISTS idx_twitter_engagement_user_id ON twitter_engagement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_twitter_engagement_completed_at ON twitter_engagement_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_twitter_engagement_url_type ON twitter_engagement_tasks(tweet_url, engagement_type);

CREATE INDEX IF NOT EXISTS idx_daily_reward_streaks_user_id ON daily_reward_streaks(user_id);

-- Create indexes for earning_logs if they don't exist
CREATE INDEX IF NOT EXISTS idx_earning_logs_user_id ON earning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_earning_logs_type ON earning_logs(type);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Daily reward system tables have been set up successfully!';
    RAISE NOTICE 'Tables created/verified: daily_rewards, daily_reward_streaks, twitter_engagement_tasks, earning_logs';
    RAISE NOTICE 'All necessary indexes have been created.';
END
$$;
