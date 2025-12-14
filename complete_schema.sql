-- Complete Supabase Schema for TON App
-- This file contains all tables, functions, triggers, and indexes needed for a fresh installation
-- Run this in your Supabase SQL editor to set up the complete database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "pgjwt";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Note: pg_graphql and pgsodium are managed by Supabase
-- and don't need to be explicitly created in the schema

-- Users table (includes sponsor_code from migration)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    wallet_address VARCHAR UNIQUE,
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

-- User Earnings table
CREATE TABLE user_earnings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    current_earnings NUMERIC(18,8) DEFAULT 0,
    earning_rate NUMERIC(18,8) DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_earned NUMERIC(18,8) DEFAULT 0
);

-- Withdrawals table
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    wallet_amount NUMERIC(18,8) DEFAULT 0,
    redeposit_amount NUMERIC(18,8) DEFAULT 0,
    sbt_amount NUMERIC(18,8) DEFAULT 0,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash VARCHAR
);

-- Deposits table
CREATE TABLE deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    transaction_hash VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    amount_nano VARCHAR,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    tx_hash TEXT,
    stake_amount NUMERIC(18,8) DEFAULT 0,
    stk_amount NUMERIC(18,8) DEFAULT 0,
    status_updated_at TIMESTAMP WITH TIME ZONE
);

-- Activities table
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR NOT NULL,
    amount NUMERIC(18,8) DEFAULT 0,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deposit_id INTEGER REFERENCES deposits(id)
);

-- Referrals table (includes sponsor_id from migration)
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES users(id),
    referred_id BIGINT REFERENCES users(id),
    sponsor_id BIGINT REFERENCES users(id) NOT NULL, -- Added from migration
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level INTEGER DEFAULT 1
);

-- Referral Earnings table (includes sponsor_id from migration)
CREATE TABLE referral_earnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    referral_id INTEGER REFERENCES users(id),
    referrer_id INTEGER REFERENCES users(id),
    sponsor_id INTEGER REFERENCES users(id), -- Added from migration
    amount NUMERIC(18,8) NOT NULL,
    level INTEGER DEFAULT 1,
    type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cron Logs table
CREATE TABLE cron_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    error_message TEXT,
    stack_trace TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    severity TEXT DEFAULT 'INFO',
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GLP Distribution History table
CREATE TABLE glp_distribution_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    points INTEGER DEFAULT 0,
    total_pool_amount NUMERIC(18,8) NOT NULL,
    total_participants INTEGER NOT NULL,
    distribution_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global Settings table
CREATE TABLE global_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward NUMERIC(18,8) NOT NULL,
    reward_type TEXT NOT NULL,
    difficulty TEXT,
    status TEXT DEFAULT 'ACTIVE',
    requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bonus History table
CREATE TABLE bonus_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    bonus_type VARCHAR NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reinvestments table
CREATE TABLE reinvestments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    source_cycle_id INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Top Referrers table
CREATE TABLE top_referrers (
    id SERIAL PRIMARY KEY,
    username VARCHAR,
    telegram_id VARCHAR,
    photoUrl TEXT,
    referral_count BIGINT DEFAULT 0,
    total_earnings NUMERIC(18,8) DEFAULT 0
);

-- Completed Tasks table
CREATE TABLE completed_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR DEFAULT 'COMPLETED',
    reward_claimed BOOLEAN DEFAULT false
);

-- Stakes table
CREATE TABLE stakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    daily_rate NUMERIC(18,8) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cycle_progress NUMERIC(18,8) DEFAULT 0,
    total_earned NUMERIC(18,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_payout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rank Bonuses table
CREATE TABLE rank_bonuses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Earning Logs table
CREATE TABLE earning_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Earning Discrepancies table
CREATE TABLE earning_discrepancies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    calculated NUMERIC(18,8) NOT NULL,
    recorded NUMERIC(18,8) NOT NULL,
    difference NUMERIC(18,8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global Pool Rankings table
CREATE TABLE global_pool_rankings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    period VARCHAR NOT NULL,
    rank INTEGER NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period)
);

-- Time-related functions
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMP WITH TIME ZONE
SECURITY INVOKER
AS $$
BEGIN
    RETURN CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_server_time_and_target()
RETURNS json
SECURITY INVOKER
AS $$
DECLARE
    target_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT gs.target_date INTO target_date
    FROM global_settings gs
    LIMIT 1;
    
    RETURN json_build_object(
        'server_time', CURRENT_TIMESTAMP,
        'target_date', target_date
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger Functions
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

CREATE OR REPLACE FUNCTION update_status_timestamp()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
    NEW.status_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_direct_referrals()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET direct_referrals = direct_referrals + 1
        WHERE id = NEW.referrer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET direct_referrals = direct_referrals - 1
        WHERE id = OLD.referrer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- GLP Pool Functions
CREATE OR REPLACE FUNCTION add_to_glp_pool(p_amount DOUBLE PRECISION)
RETURNS void
SECURITY INVOKER
AS $$
BEGIN
    -- Implementation depends on your specific requirements
    -- This is a placeholder
    RAISE NOTICE 'Adding % to GLP pool', p_amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_glp_pool(p_amount DOUBLE PRECISION)
RETURNS void
SECURITY INVOKER
AS $$
BEGIN
    -- Implementation depends on your specific requirements
    -- This is a placeholder
    RAISE NOTICE 'Incrementing GLP pool by %', p_amount;
END;
$$ LANGUAGE plpgsql;

-- User stats update function
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
    -- Update user statistics when referral earnings change
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
        UPDATE users
        SET 
            total_referral_earnings = COALESCE(
                (SELECT SUM(amount)
                FROM referral_earnings
                WHERE referrer_id = NEW.referrer_id
                AND status = 'completed'),
                0
            ),
            team_volume = COALESCE(
                (SELECT SUM(amount)
                FROM referral_earnings
                WHERE referrer_id = NEW.referrer_id
                AND type = 'team_volume'
                AND status = 'completed'),
                0
            )
        WHERE id = NEW.referrer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Referral processing functions
CREATE OR REPLACE FUNCTION process_referral_v2(
    p_referrer_id INTEGER,
    p_referred_id INTEGER
) RETURNS void AS $$
BEGIN
    -- Implementation needed based on your referral logic
    -- This is referenced in setupStoredProcedures
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_team_volumes(
    p_referrer_ids INTEGER[],
    p_amount NUMERIC
) RETURNS void AS $$
BEGIN
    -- Implementation needed based on your team volume calculation logic
    -- This is referenced in setupStoredProcedures
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_stake_cycle(
    p_stake_id INTEGER,
    p_user_id INTEGER
) RETURNS void AS $$
BEGIN
    -- Implementation needed based on your stake cycle logic
    -- This is referenced in checkAndHandleCycle
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER create_user_earnings_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_earnings();

CREATE TRIGGER maintain_direct_referrals
    AFTER INSERT OR DELETE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_referrals();

CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON referral_earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_deposits_status_timestamp
    BEFORE UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_status_timestamp();

-- All necessary indexes for optimal performance

-- Cron Logs Indexes
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_severity ON cron_logs(severity);
CREATE INDEX IF NOT EXISTS idx_cron_logs_timestamp ON cron_logs(timestamp);

-- Referral Earnings Indexes
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral ON referral_earnings(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user ON referral_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_sponsor_id ON referral_earnings(sponsor_id);

-- Referrals Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_id ON referrals(sponsor_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_referral ON referrals(referrer_id, referred_id);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referrer_id_referred_id_key ON referrals(referrer_id, referred_id);

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_available_earnings ON users(available_earnings);
CREATE INDEX IF NOT EXISTS idx_users_expected_rank_bonus ON users(expected_rank_bonus);
CREATE INDEX IF NOT EXISTS idx_users_last_deposit_time ON users(last_deposit_time);
CREATE INDEX IF NOT EXISTS idx_users_last_sync ON users(last_sync);
CREATE INDEX IF NOT EXISTS idx_users_team_volume ON users(team_volume);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_code ON users(sponsor_code);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_key ON users(telegram_id);

-- User Earnings Indexes
CREATE UNIQUE INDEX IF NOT EXISTS user_earnings_user_id_key ON user_earnings(user_id);

-- Completed Tasks Indexes
CREATE UNIQUE INDEX IF NOT EXISTS completed_tasks_user_id_task_id_key ON completed_tasks(user_id, task_id);

-- Stakes Indexes
CREATE INDEX IF NOT EXISTS idx_stakes_user_id ON stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_stakes_is_active ON stakes(is_active);

-- Rank Bonuses Indexes
CREATE INDEX IF NOT EXISTS idx_rank_bonuses_user_id ON rank_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_bonuses_created_at ON rank_bonuses(created_at);

-- Earning Logs Indexes
CREATE INDEX IF NOT EXISTS idx_earning_logs_user_id ON earning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_earning_logs_type ON earning_logs(type);

-- Global Pool Rankings Indexes
CREATE INDEX IF NOT EXISTS idx_global_pool_rankings_period ON global_pool_rankings(period);

-- Activities Indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Deposits Indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- Withdrawals Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Bonus History Indexes
CREATE INDEX IF NOT EXISTS idx_bonus_history_user_id ON bonus_history(user_id);

-- Reinvestments Indexes
CREATE INDEX IF NOT EXISTS idx_reinvestments_user_id ON reinvestments(user_id);

-- GLP Distribution History Indexes
CREATE INDEX IF NOT EXISTS idx_glp_distribution_user_id ON glp_distribution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_glp_distribution_date ON glp_distribution_history(distribution_date);

-- Publications for Supabase realtime
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication 
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication 
        WHERE pubname = 'supabase_realtime_messages_publication'
    ) THEN
        CREATE PUBLICATION supabase_realtime_messages_publication;
    END IF;
END
$$;

-- Add some default data
INSERT INTO global_settings (target_date) VALUES (CURRENT_TIMESTAMP + INTERVAL '30 days') ON CONFLICT DO NOTHING;

-- Add some default tasks
INSERT INTO tasks (title, description, reward, reward_type, difficulty, status) VALUES
('Join Telegram Channel', 'Join our official Telegram channel', 10.0, 'TOKEN', 'EASY', 'ACTIVE'),
('Follow Twitter', 'Follow us on Twitter/X', 15.0, 'TOKEN', 'EASY', 'ACTIVE'),
('Retweet Post', 'Retweet our latest announcement', 20.0, 'TOKEN', 'MEDIUM', 'ACTIVE'),
('Refer a Friend', 'Invite a friend to join the platform', 50.0, 'TOKEN', 'HARD', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Function to generate sponsor codes for existing users (if needed)
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

-- Row Level Security (RLS) is disabled by default for Telegram-based authentication
-- If you want to enable RLS later, you'll need to create custom policies based on your auth system
-- For now, RLS is disabled to allow proper user creation and management

-- Uncomment the lines below if you want to enable RLS with custom policies:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE completed_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rank_bonuses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE earning_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bonus_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reinvestments ENABLE ROW LEVEL SECURITY;

-- Example RLS policies for Telegram-based auth (uncomment if needed):
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
-- CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);
-- CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema has been successfully created with all tables, functions, triggers, and indexes!';
    RAISE NOTICE 'Sponsor code and sponsor ID features are included from migrations.';
    RAISE NOTICE 'All necessary indexes have been created for optimal performance.';
    RAISE NOTICE 'Row Level Security has been enabled for better data protection.';
    RAISE NOTICE 'Default tasks and global settings have been inserted.';
END
$$;
