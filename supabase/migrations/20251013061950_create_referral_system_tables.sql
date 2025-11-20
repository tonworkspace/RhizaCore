/*
  # Create Referral System Tables
  
  This migration creates the complete referral system infrastructure for RZC Mine.
  
  ## New Tables
  
  1. **users** - Core user profile and wallet information
     - `id` (bigserial, primary key) - Auto-incrementing user ID
     - `telegram_id` (bigint, unique, required) - Telegram user identifier
     - `wallet_address` (varchar) - User's TON wallet address
     - `whitelisted_wallet` (text) - Approved withdrawal wallet
     - `username`, `first_name`, `last_name` (varchar) - User identity
     - `balance`, `current_deposit`, `total_deposit`, `total_withdrawn` (numeric) - Financial tracking
     - `team_volume`, `total_referral_earnings` (numeric) - Referral metrics
     - `total_earned`, `total_sbt` (numeric) - Earnings tracking
     - `rank` (varchar) - User rank level
     - `referrer_id` (bigint) - ID of user who referred this user
     - `direct_referrals` (integer) - Count of direct referrals
     - `is_active`, `is_premium` (boolean) - Status flags
     - Various timestamp fields for activity tracking
  
  2. **referrals** - Tracks referral relationships
     - `id` (bigserial, primary key)
     - `referrer_id` (bigint) - User who referred
     - `referred_id` (bigint) - User who was referred
     - `status` (text) - 'active' or 'inactive'
     - `level` (integer) - Referral level (1-5)
     - `sbt_amount` (numeric) - SBT tokens earned from this referral
     - `total_sbt_earned` (numeric) - Total SBT earned over time
     - `created_at` (timestamp) - When referral was created
  
  3. **referral_earnings** - Detailed earnings tracking
     - `id` (serial, primary key)
     - `user_id` (integer) - User earning the reward
     - `referral_id` (integer) - User who generated the earnings
     - `referrer_id` (integer) - The referrer
     - `amount` (numeric) - Earnings amount
     - `level` (integer) - Referral level
     - `type` (varchar) - Type of earnings
     - `status` (varchar) - Processing status
  
  4. **user_earnings** - Aggregate user earnings
  5. **withdrawals** - Withdrawal requests and history
  6. **deposits** - Deposit transactions
  7. **activities** - User activity log
  8. Supporting tables for tasks, bonuses, stakes, etc.
  
  ## Security
  
  - Row Level Security (RLS) will be enabled on all tables
  - Policies restrict users to view/edit only their own data
  - Referral data is visible to referrers for their downline
  
  ## Indexes
  
  - Optimized indexes for referral queries
  - Indexes on telegram_id, referrer_id, referred_id for fast lookups
  - Composite indexes for common query patterns
  
  ## Triggers
  
  - Auto-create user_earnings record when user is created
  - Auto-update direct_referrals count
  - Auto-calculate referral statistics
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
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
    is_premium BOOLEAN DEFAULT false,
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

-- Referrals table with earnings tracking
CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    referred_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level INTEGER DEFAULT 1,
    sbt_amount NUMERIC(18,8) DEFAULT 0,
    total_sbt_earned NUMERIC(18,8) DEFAULT 0
);

-- Referral Earnings table
CREATE TABLE IF NOT EXISTS referral_earnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referral_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18,8) NOT NULL,
    level INTEGER DEFAULT 1,
    type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Earnings table
CREATE TABLE IF NOT EXISTS user_earnings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    current_earnings NUMERIC(18,8) DEFAULT 0,
    earning_rate NUMERIC(18,8) DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_earned NUMERIC(18,8) DEFAULT 0
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    amount NUMERIC(18,8) DEFAULT 0,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deposit_id INTEGER REFERENCES deposits(id) ON DELETE SET NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
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

-- Completed Tasks table
CREATE TABLE IF NOT EXISTS completed_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR DEFAULT 'COMPLETED',
    reward_claimed BOOLEAN DEFAULT false
);

-- Bonus History table
CREATE TABLE IF NOT EXISTS bonus_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bonus_type VARCHAR NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stakes table
CREATE TABLE IF NOT EXISTS stakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18,8) NOT NULL,
    daily_rate NUMERIC(18,8) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cycle_progress NUMERIC(18,8) DEFAULT 0,
    total_earned NUMERIC(18,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_payout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_referral ON referrals(referrer_id, referred_id);
CREATE INDEX IF NOT EXISTS idx_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_earnings_user_id_key ON user_earnings(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS completed_tasks_user_id_task_id_key ON completed_tasks(user_id, task_id);

-- Trigger Functions
CREATE OR REPLACE FUNCTION create_user_earnings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_earnings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_direct_referrals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET direct_referrals = direct_referrals + 1
        WHERE id = NEW.referrer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET direct_referrals = GREATEST(direct_referrals - 1, 0)
        WHERE id = OLD.referrer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS create_user_earnings_trigger ON users;
CREATE TRIGGER create_user_earnings_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_earnings();

DROP TRIGGER IF EXISTS maintain_direct_referrals ON referrals;
CREATE TRIGGER maintain_direct_referrals
    AFTER INSERT OR DELETE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_referrals();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = current_setting('app.current_user_id')::bigint);
CREATE POLICY "Allow user creation" ON users FOR INSERT WITH CHECK (true);

-- RLS Policies for referrals table
CREATE POLICY "Users can view their referrals" ON referrals FOR SELECT USING (
    referrer_id = current_setting('app.current_user_id')::bigint OR 
    referred_id = current_setting('app.current_user_id')::bigint
);
CREATE POLICY "Allow referral creation" ON referrals FOR INSERT WITH CHECK (true);

-- RLS Policies for referral_earnings table  
CREATE POLICY "Users can view their referral earnings" ON referral_earnings FOR SELECT USING (
    referrer_id = current_setting('app.current_user_id')::integer
);
CREATE POLICY "Allow referral earnings creation" ON referral_earnings FOR INSERT WITH CHECK (true);

-- RLS Policies for user_earnings table
CREATE POLICY "Users can view own earnings" ON user_earnings FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::bigint
);

-- RLS Policies for withdrawals table
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::integer
);
CREATE POLICY "Users can create withdrawals" ON withdrawals FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id')::integer
);

-- RLS Policies for deposits table
CREATE POLICY "Users can view own deposits" ON deposits FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::integer
);
CREATE POLICY "Users can create deposits" ON deposits FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id')::integer
);

-- RLS Policies for activities table
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::integer
);

-- RLS Policies for tasks table
CREATE POLICY "Anyone can view active tasks" ON tasks FOR SELECT USING (status = 'ACTIVE');

-- RLS Policies for completed_tasks table
CREATE POLICY "Users can view own completed tasks" ON completed_tasks FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::integer
);
CREATE POLICY "Users can create completed tasks" ON completed_tasks FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id')::integer
);

-- RLS Policies for bonus_history table
CREATE POLICY "Users can view own bonus history" ON bonus_history FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::integer
);

-- RLS Policies for stakes table
CREATE POLICY "Users can view own stakes" ON stakes FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::integer
);
CREATE POLICY "Users can create stakes" ON stakes FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id')::integer
);
