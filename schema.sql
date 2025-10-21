-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "pgjwt";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Note: pg_graphql and pgsodium are managed by Supabase
-- and don't need to be explicitly created in the schema

-- Users table
CREATE TABLE users (
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

-- Referrals table
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES users(id),
    referred_id BIGINT REFERENCES users(id),
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level INTEGER DEFAULT 1
);

-- Referral Earnings table
CREATE TABLE referral_earnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    referral_id INTEGER REFERENCES users(id),
    referrer_id INTEGER REFERENCES users(id),
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

-- Bonus History table (alternative with foreign key)
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

-- Add the missing update_user_stats trigger function
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

-- Primary Key Indexes (automatically created with PRIMARY KEY constraints)
-- activities_pkey
-- bonus_history_pkey
-- completed_tasks_pkey
-- cron_logs_pkey
-- deposits_pkey
-- global_settings_pkey
-- glp_distribution_history_pkey
-- referral_earnings_pkey
-- referrals_pkey
-- reinvestments_pkey
-- tasks_pkey
-- user_earnings_pkey
-- users_pkey
-- withdrawals_pkey

-- Cron Logs Indexes
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_severity ON cron_logs(severity);
CREATE INDEX IF NOT EXISTS idx_cron_logs_timestamp ON cron_logs(timestamp);

-- Referral Earnings Indexes
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral ON referral_earnings(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user ON referral_earnings(user_id);

-- Referrals Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
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
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_key ON users(telegram_id);

-- User Earnings Indexes
CREATE UNIQUE INDEX IF NOT EXISTS user_earnings_user_id_key ON user_earnings(user_id);

-- Completed Tasks Indexes
CREATE UNIQUE INDEX IF NOT EXISTS completed_tasks_user_id_task_id_key ON completed_tasks(user_id, task_id);

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

-- Add stored procedures referenced in the code
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

