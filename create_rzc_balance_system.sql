-- Create RZC Balance System
-- This file creates the necessary tables and functions for RZC mining and claiming

-- RZC Balances table
CREATE TABLE IF NOT EXISTS rzc_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    claimable_rzc NUMERIC(18,8) DEFAULT 0,
    total_rzc_earned NUMERIC(18,8) DEFAULT 0,
    last_claim_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Mining Sessions table
CREATE TABLE IF NOT EXISTS mining_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR DEFAULT 'active',
    rzc_earned NUMERIC(18,8) DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Free Mining Periods table
CREATE TABLE IF NOT EXISTS free_mining_periods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sessions_used INTEGER DEFAULT 0,
    max_sessions INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Function to increment RZC balance
CREATE OR REPLACE FUNCTION increment_rzc_balance(
    p_user_id INTEGER,
    p_amount NUMERIC(18,8)
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update RZC balance
    INSERT INTO rzc_balances (user_id, claimable_rzc, total_rzc_earned, updated_at)
    VALUES (p_user_id, p_amount, p_amount, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        claimable_rzc = rzc_balances.claimable_rzc + p_amount,
        total_rzc_earned = rzc_balances.total_rzc_earned + p_amount,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to process RZC claim
CREATE OR REPLACE FUNCTION process_rzc_claim(
    p_user_id INTEGER,
    p_amount NUMERIC(18,8)
)
RETURNS VOID AS $$
DECLARE
    current_balance NUMERIC(18,8);
BEGIN
    -- Get current claimable balance
    SELECT claimable_rzc INTO current_balance
    FROM rzc_balances
    WHERE user_id = p_user_id;
    
    -- Check if user has enough balance
    IF current_balance IS NULL OR current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient RZC balance';
    END IF;
    
    -- Deduct from claimable balance and update last claim time
    UPDATE rzc_balances 
    SET 
        claimable_rzc = claimable_rzc - p_amount,
        last_claim_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    
    -- Update user's total_earned in users table
    UPDATE users 
    SET total_earned = total_earned + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize free mining period for new users
CREATE OR REPLACE FUNCTION initialize_free_mining_period(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Insert free mining period if it doesn't exist
    INSERT INTO free_mining_periods (user_id, start_date, end_date, sessions_used, max_sessions, is_active)
    VALUES (
        p_user_id, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP + INTERVAL '7 days',
        0,
        7,
        true
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to update free mining session count
CREATE OR REPLACE FUNCTION update_free_mining_session_count(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Increment sessions used
    UPDATE free_mining_periods 
    SET sessions_used = sessions_used + 1
    WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rzc_balances_user_id ON rzc_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_user_id ON mining_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_status ON mining_sessions(status);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_user_id ON free_mining_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_free_mining_periods_active ON free_mining_periods(is_active);

-- Add RLS policies for security
ALTER TABLE rzc_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_mining_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for rzc_balances
CREATE POLICY "Users can view their own RZC balance" ON rzc_balances
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own RZC balance" ON rzc_balances
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS policies for mining_sessions
CREATE POLICY "Users can view their own mining sessions" ON mining_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own mining sessions" ON mining_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own mining sessions" ON mining_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS policies for free_mining_periods
CREATE POLICY "Users can view their own free mining periods" ON free_mining_periods
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own free mining periods" ON free_mining_periods
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own free mining periods" ON free_mining_periods
    FOR UPDATE USING (auth.uid()::text = user_id::text);
