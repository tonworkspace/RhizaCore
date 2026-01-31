-- Create staking locks table to track lock periods and prevent early unstaking
CREATE TABLE IF NOT EXISTS staking_locks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staked_amount DECIMAL(20, 8) NOT NULL,
    lock_period_years INTEGER NOT NULL,
    apy_rate DECIMAL(5, 2) NOT NULL,
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unlocked', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staking_locks_user_id ON staking_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_locks_status ON staking_locks(status);
CREATE INDEX IF NOT EXISTS idx_staking_locks_unlock_date ON staking_locks(unlock_date);

-- Add staking columns to airdrop_balances if they don't exist
ALTER TABLE airdrop_balances 
ADD COLUMN IF NOT EXISTS staked_balance DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_staked_amount DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_staking_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to calculate unlock date
CREATE OR REPLACE FUNCTION calculate_unlock_date(lock_years INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() + (lock_years || ' years')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can unstake
CREATE OR REPLACE FUNCTION can_unstake(p_user_id INTEGER, p_amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    unlocked_amount DECIMAL := 0;
    requested_amount DECIMAL := p_amount;
BEGIN
    -- Calculate total unlocked amount (locks that have expired)
    SELECT COALESCE(SUM(staked_amount), 0) INTO unlocked_amount
    FROM staking_locks 
    WHERE user_id = p_user_id 
    AND status = 'active' 
    AND unlock_date <= NOW();
    
    -- Check if requested amount is available for unstaking
    RETURN unlocked_amount >= requested_amount;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's staking summary
CREATE OR REPLACE FUNCTION get_user_staking_summary(p_user_id INTEGER)
RETURNS TABLE(
    total_staked DECIMAL,
    total_locked DECIMAL,
    total_unlocked DECIMAL,
    active_locks INTEGER,
    next_unlock_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(sl.staked_amount), 0) as total_staked,
        COALESCE(SUM(CASE WHEN sl.unlock_date > NOW() THEN sl.staked_amount ELSE 0 END), 0) as total_locked,
        COALESCE(SUM(CASE WHEN sl.unlock_date <= NOW() THEN sl.staked_amount ELSE 0 END), 0) as total_unlocked,
        COUNT(CASE WHEN sl.status = 'active' THEN 1 END)::INTEGER as active_locks,
        MIN(CASE WHEN sl.unlock_date > NOW() THEN sl.unlock_date END) as next_unlock_date
    FROM staking_locks sl
    WHERE sl.user_id = p_user_id AND sl.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create function to stake tokens with lock period
CREATE OR REPLACE FUNCTION stake_tokens_with_lock(
    p_user_id INTEGER,
    p_amount DECIMAL,
    p_lock_years INTEGER,
    p_apy_rate DECIMAL
)
RETURNS JSON AS $$
DECLARE
    current_balance DECIMAL;
    stake_amount DECIMAL;
    unlock_date TIMESTAMP WITH TIME ZONE;
    new_lock_id UUID;
BEGIN
    -- Get current available balance
    SELECT available_balance INTO current_balance
    FROM airdrop_balances 
    WHERE user_id = p_user_id;
    
    -- Calculate 70% of available balance
    stake_amount := current_balance * 0.70;
    
    -- Check if user has sufficient balance
    IF current_balance < stake_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient balance for staking'
        );
    END IF;
    
    -- Calculate unlock date
    unlock_date := calculate_unlock_date(p_lock_years);
    
    -- Create staking lock record
    INSERT INTO staking_locks (
        user_id, 
        staked_amount, 
        lock_period_years, 
        apy_rate, 
        unlock_date
    ) VALUES (
        p_user_id, 
        stake_amount, 
        p_lock_years, 
        p_apy_rate, 
        unlock_date
    ) RETURNING id INTO new_lock_id;
    
    -- Update airdrop_balances
    UPDATE airdrop_balances 
    SET 
        available_balance = available_balance - stake_amount,
        staked_balance = COALESCE(staked_balance, 0) + stake_amount,
        total_staked_amount = COALESCE(total_staked_amount, 0) + stake_amount,
        last_staking_update = NOW()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'lock_id', new_lock_id,
        'staked_amount', stake_amount,
        'unlock_date', unlock_date,
        'lock_period_years', p_lock_years,
        'apy_rate', p_apy_rate
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to unstake tokens (only if lock period expired)
CREATE OR REPLACE FUNCTION unstake_tokens(
    p_user_id INTEGER,
    p_lock_id UUID
)
RETURNS JSON AS $$
DECLARE
    lock_record RECORD;
    unstake_amount DECIMAL;
BEGIN
    -- Get lock record and check if it can be unstaked
    SELECT * INTO lock_record
    FROM staking_locks 
    WHERE id = p_lock_id 
    AND user_id = p_user_id 
    AND status = 'active';
    
    -- Check if lock exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Staking lock not found or already withdrawn'
        );
    END IF;
    
    -- Check if lock period has expired
    IF lock_record.unlock_date > NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lock period has not expired yet',
            'unlock_date', lock_record.unlock_date,
            'time_remaining', lock_record.unlock_date - NOW()
        );
    END IF;
    
    unstake_amount := lock_record.staked_amount;
    
    -- Update staking lock status
    UPDATE staking_locks 
    SET 
        status = 'withdrawn',
        updated_at = NOW()
    WHERE id = p_lock_id;
    
    -- Update airdrop_balances
    UPDATE airdrop_balances 
    SET 
        available_balance = available_balance + unstake_amount,
        staked_balance = COALESCE(staked_balance, 0) - unstake_amount,
        last_staking_update = NOW()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'unstaked_amount', unstake_amount,
        'lock_id', p_lock_id
    );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on staking_locks table
ALTER TABLE staking_locks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staking_locks
CREATE POLICY "Users can view their own staking locks" ON staking_locks
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own staking locks" ON staking_locks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own staking locks" ON staking_locks
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON staking_locks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_unlock_date(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION can_unstake(INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_staking_summary(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION stake_tokens_with_lock(INTEGER, DECIMAL, INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION unstake_tokens(INTEGER, UUID) TO authenticated;