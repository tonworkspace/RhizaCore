-- Regenerate Users Table Schema
-- This script recreates the users table with all necessary fields and constraints
-- Run this in your Supabase SQL editor to restore the users table

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";

-- Drop existing users table if it exists (CAREFUL - this will delete all user data!)
-- Uncomment the next line only if you want to completely recreate the table
-- DROP TABLE IF EXISTS users CASCADE;

-- Users table (complete schema with all fields)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    wallet_address VARCHAR,
    whitelisted_wallet TEXT,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    language_code VARCHAR,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    balance NUMERIC(18,8) DEFAULT 0,
    current_deposit NUMERIC(18,8) DEFAULT 0,
    total_deposit NUMERIC(18,8) DEFAULT 0,
    total_withdrawn NUMERIC(18,8) DEFAULT 0,
    team_volume NUMERIC(18,8) DEFAULT 0,
    total_referral_earnings NUMERIC(18,8) DEFAULT 0,
    rank VARCHAR DEFAULT 'NOVICE',
    referral_level INTEGER DEFAULT 0,
    last_active TIMESTAMP,
    last_claim_time TIMESTAMP,
    last_sync TIMESTAMP WITH TIME ZONE,
    total_earned NUMERIC(18,8) DEFAULT 0,
    total_sbt NUMERIC(18,8) DEFAULT 0,
    claimed_milestones INTEGER[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    has_nft BOOLEAN DEFAULT false,
    speed_boost_active BOOLEAN DEFAULT false,
    speed_boost_activated_at TIMESTAMP WITH TIME ZONE,
    fast_start_bonus_claimed BOOLEAN DEFAULT false,
    reinvestment_balance NUMERIC(18,8) DEFAULT 0,
    available_earnings NUMERIC(18,8) DEFAULT 0,
    expected_rank_bonus NUMERIC(18,8) DEFAULT 0,
    stake NUMERIC(18,8) DEFAULT 0,
    stake_date TIMESTAMP WITH TIME ZONE,
    current_stake_date TIMESTAMP WITH TIME ZONE,
    login_streak INTEGER DEFAULT 0,
    last_login_date TIMESTAMP WITH TIME ZONE,
    last_deposit_date TIMESTAMP,
    last_deposit_time TIMESTAMP WITH TIME ZONE,
    direct_referrals INTEGER DEFAULT 0,
    referrer_id BIGINT REFERENCES users(id),
    sponsor_id BIGINT REFERENCES users(id), -- Added from migration
    sponsor_code TEXT UNIQUE, -- Added from migration
    rank_updated_at TIMESTAMP WITH TIME ZONE
);

-- Create all necessary indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_available_earnings ON users(available_earnings);
CREATE INDEX IF NOT EXISTS idx_users_expected_rank_bonus ON users(expected_rank_bonus);
CREATE INDEX IF NOT EXISTS idx_users_last_deposit_time ON users(last_deposit_time);
CREATE INDEX IF NOT EXISTS idx_users_last_sync ON users(last_sync);
CREATE INDEX IF NOT EXISTS idx_users_team_volume ON users(team_volume);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_code ON users(sponsor_code);
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_key ON users(telegram_id);

-- Create trigger function to automatically create user_earnings record
CREATE OR REPLACE FUNCTION create_user_earnings()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
    INSERT INTO user_earnings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create user_earnings when user is created
-- Drop trigger if it exists first, then create it
DROP TRIGGER IF EXISTS create_user_earnings_trigger ON users;
CREATE TRIGGER create_user_earnings_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_earnings();

-- Function to generate sponsor codes for existing users
CREATE OR REPLACE FUNCTION generate_sponsor_codes()
RETURNS void AS $$
BEGIN
    -- Generate sponsor codes for users that don't have them
    -- First user gets special admin code, others get regular codes
    UPDATE users 
    SET sponsor_code = CASE 
        WHEN id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1) THEN
            'ADMIN-' || LPAD(id::text, 4, '0')
        ELSE
            UPPER(
                COALESCE(SUBSTRING(username, 1, 3), 'USR') || '-' || 
                LPAD(id::text, 4, '0') || 
                SUBSTRING(MD5(RANDOM()::text), 1, 3)
            )
        END
    WHERE sponsor_code IS NULL;
    
    -- Handle any potential duplicates by regenerating
    WITH duplicates AS (
        SELECT id, sponsor_code, ROW_NUMBER() OVER (PARTITION BY sponsor_code ORDER BY id) as rn
        FROM users 
        WHERE sponsor_code IS NOT NULL
    )
    UPDATE users 
    SET sponsor_code = CASE 
        WHEN users.id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1) THEN
            'ADMIN-' || LPAD(users.id::text, 4, '0')
        ELSE
            UPPER(
                COALESCE(SUBSTRING(username, 1, 3), 'USR') || '-' || 
                LPAD(users.id::text, 4, '0') || 
                SUBSTRING(MD5(RANDOM()::text), 1, 3)
            )
        END
    FROM duplicates 
    WHERE users.id = duplicates.id AND duplicates.rn > 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is the first user
CREATE OR REPLACE FUNCTION is_first_user(p_user_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    first_user_id BIGINT;
BEGIN
    SELECT id INTO first_user_id 
    FROM users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    RETURN p_user_id = first_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate default sponsor code for first user
CREATE OR REPLACE FUNCTION generate_default_sponsor_code(p_user_id BIGINT)
RETURNS TEXT AS $$
DECLARE
    default_code TEXT;
BEGIN
    -- Check if user is the first user
    IF NOT is_first_user(p_user_id) THEN
        RAISE EXCEPTION 'Default sponsor codes are only available for the first user';
    END IF;
    
    -- Generate default admin code
    default_code := 'ADMIN-' || LPAD(p_user_id::text, 4, '0');
    
    -- Update user with default code
    UPDATE users 
    SET sponsor_code = default_code 
    WHERE id = p_user_id;
    
    RETURN default_code;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Users table has been successfully created with all fields and constraints!';
    RAISE NOTICE 'Sponsor code and sponsor ID features are included.';
    RAISE NOTICE 'All necessary indexes have been created for optimal performance.';
    RAISE NOTICE 'Trigger functions have been set up for automatic user_earnings creation.';
    RAISE NOTICE 'Sponsor code generation functions are available.';
END
$$;
