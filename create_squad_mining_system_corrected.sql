-- Squad Mining System Schema - CORRECTED for BIGINT user IDs
-- This system allows users to claim rewards every 8 hours based on their squad size

-- Create squad_mining_claims table to track claim history
CREATE TABLE IF NOT EXISTS squad_mining_claims (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    squad_size INTEGER NOT NULL DEFAULT 0,
    reward_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id TEXT UNIQUE,
    
    -- Indexes for performance
    CONSTRAINT unique_user_claim_per_period UNIQUE (user_id, claimed_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_squad_claims_user_id ON squad_mining_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_claims_claimed_at ON squad_mining_claims(claimed_at);
CREATE INDEX IF NOT EXISTS idx_squad_claims_user_time ON squad_mining_claims(user_id, claimed_at DESC);

-- Add squad mining related columns to users table if they don't exist
DO $$
BEGIN
    -- Add last squad claim timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_squad_claim_at') THEN
        ALTER TABLE users ADD COLUMN last_squad_claim_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add total squad rewards earned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_squad_rewards') THEN
        ALTER TABLE users ADD COLUMN total_squad_rewards DECIMAL(20, 8) DEFAULT 0;
    END IF;
    
    -- Add squad mining rate (RZC per squad member per claim)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'squad_mining_rate') THEN
        ALTER TABLE users ADD COLUMN squad_mining_rate DECIMAL(10, 2) DEFAULT 2.0;
    END IF;
END $$;

-- Function to calculate squad size (active referrals)
CREATE OR REPLACE FUNCTION get_user_squad_size(user_id_param BIGINT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM referrals r
        JOIN users u ON u.id = r.referred_id
        WHERE r.sponsor_id = user_id_param 
        AND r.status = 'active'
        AND u.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can claim squad rewards (8 hour cooldown)
CREATE OR REPLACE FUNCTION can_claim_squad_rewards(user_id_param BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    last_claim_time TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT last_squad_claim_at INTO last_claim_time
    FROM users 
    WHERE id = user_id_param;
    
    -- If never claimed before, can claim
    IF last_claim_time IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if 8 hours have passed
    RETURN (NOW() - last_claim_time) >= INTERVAL '8 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate squad mining reward
CREATE OR REPLACE FUNCTION calculate_squad_reward(user_id_param BIGINT)
RETURNS DECIMAL(20, 8) AS $$
DECLARE
    squad_size INTEGER;
    mining_rate DECIMAL(10, 2);
    total_reward DECIMAL(20, 8);
BEGIN
    -- Get squad size
    SELECT get_user_squad_size(user_id_param) INTO squad_size;
    
    -- Get user's mining rate (default 2 RZC per squad member)
    SELECT COALESCE(squad_mining_rate, 2.0) INTO mining_rate
    FROM users 
    WHERE id = user_id_param;
    
    -- Calculate total reward
    total_reward := squad_size * mining_rate;
    
    RETURN total_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim squad mining rewards
CREATE OR REPLACE FUNCTION claim_squad_mining_rewards(
    user_id_param BIGINT,
    transaction_id_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    squad_size INTEGER;
    reward_amount DECIMAL(20, 8);
    can_claim BOOLEAN;
    result JSON;
BEGIN
    -- Check if user can claim
    SELECT can_claim_squad_rewards(user_id_param) INTO can_claim;
    
    IF NOT can_claim THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Must wait 8 hours between claims',
            'next_claim_available', (
                SELECT last_squad_claim_at + INTERVAL '8 hours'
                FROM users WHERE id = user_id_param
            )
        );
    END IF;
    
    -- Get squad size and calculate reward
    SELECT get_user_squad_size(user_id_param) INTO squad_size;
    SELECT calculate_squad_reward(user_id_param) INTO reward_amount;
    
    -- If no squad members, no reward
    IF squad_size = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No active squad members to claim rewards from'
        );
    END IF;
    
    -- Generate transaction ID if not provided
    IF transaction_id_param IS NULL THEN
        transaction_id_param := 'squad_' || user_id_param || '_' || extract(epoch from now())::bigint;
    END IF;
    
    -- Insert claim record
    INSERT INTO squad_mining_claims (
        user_id, 
        squad_size, 
        reward_amount, 
        transaction_id
    ) VALUES (
        user_id_param, 
        squad_size, 
        reward_amount, 
        transaction_id_param
    );
    
    -- Add rewards to user's available_balance instead of separate airdrop_balances table
    UPDATE users 
    SET 
        available_balance = COALESCE(available_balance, 0) + reward_amount,
        total_earned = COALESCE(total_earned, 0) + reward_amount,
        last_squad_claim_at = NOW(),
        total_squad_rewards = COALESCE(total_squad_rewards, 0) + reward_amount
    WHERE id = user_id_param;
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'squad_size', squad_size,
        'reward_amount', reward_amount,
        'transaction_id', transaction_id_param,
        'claimed_at', NOW()
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get squad mining stats for a user
CREATE OR REPLACE FUNCTION get_squad_mining_stats(user_id_param BIGINT)
RETURNS JSON AS $$
DECLARE
    squad_size INTEGER;
    potential_reward DECIMAL(20, 8);
    can_claim BOOLEAN;
    last_claim TIMESTAMP WITH TIME ZONE;
    next_claim TIMESTAMP WITH TIME ZONE;
    total_rewards DECIMAL(20, 8);
    total_claims INTEGER;
BEGIN
    -- Get basic stats
    SELECT get_user_squad_size(user_id_param) INTO squad_size;
    SELECT calculate_squad_reward(user_id_param) INTO potential_reward;
    SELECT can_claim_squad_rewards(user_id_param) INTO can_claim;
    
    -- Get claim history
    SELECT 
        last_squad_claim_at,
        COALESCE(total_squad_rewards, 0)
    INTO last_claim, total_rewards
    FROM users 
    WHERE id = user_id_param;
    
    -- Calculate next claim time
    IF last_claim IS NOT NULL THEN
        next_claim := last_claim + INTERVAL '8 hours';
    END IF;
    
    -- Get total claims count
    SELECT COUNT(*)::INTEGER INTO total_claims
    FROM squad_mining_claims
    WHERE user_id = user_id_param;
    
    RETURN json_build_object(
        'squad_size', squad_size,
        'potential_reward', potential_reward,
        'can_claim', can_claim,
        'last_claim_at', last_claim,
        'next_claim_at', next_claim,
        'total_rewards_earned', total_rewards,
        'total_claims', total_claims,
        'hours_until_next_claim', 
        CASE 
            WHEN can_claim THEN 0
            WHEN last_claim IS NULL THEN 0
            ELSE GREATEST(0, EXTRACT(EPOCH FROM (next_claim - NOW())) / 3600)
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for squad_mining_claims
ALTER TABLE squad_mining_claims ENABLE ROW LEVEL SECURITY;

-- Users can only see their own claims
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'squad_mining_claims' 
        AND policyname = 'Users can view own squad claims'
    ) THEN
        CREATE POLICY "Users can view own squad claims" ON squad_mining_claims
            FOR SELECT USING (auth.uid()::text::bigint = user_id);
    END IF;
END $$;

-- Users can insert their own claims (through function)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'squad_mining_claims' 
        AND policyname = 'Users can insert own squad claims'
    ) THEN
        CREATE POLICY "Users can insert own squad claims" ON squad_mining_claims
            FOR INSERT WITH CHECK (auth.uid()::text::bigint = user_id);
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT ON squad_mining_claims TO authenticated;
GRANT USAGE ON SEQUENCE squad_mining_claims_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_squad_size(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_claim_squad_rewards(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_squad_reward(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_squad_mining_rewards(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_squad_mining_stats(BIGINT) TO authenticated;

-- Create view for easy squad mining dashboard
CREATE OR REPLACE VIEW squad_mining_dashboard AS
SELECT 
    u.id as user_id,
    u.username,
    u.telegram_id,
    get_user_squad_size(u.id) as squad_size,
    calculate_squad_reward(u.id) as potential_reward,
    can_claim_squad_rewards(u.id) as can_claim,
    u.last_squad_claim_at,
    u.total_squad_rewards,
    CASE 
        WHEN u.last_squad_claim_at IS NULL THEN NOW()
        ELSE u.last_squad_claim_at + INTERVAL '8 hours'
    END as next_claim_at
FROM users u
WHERE u.id = auth.uid()::text::bigint;

-- Grant access to the view
GRANT SELECT ON squad_mining_dashboard TO authenticated;

COMMENT ON TABLE squad_mining_claims IS 'Tracks squad mining reward claims with 8-hour intervals';
COMMENT ON FUNCTION get_user_squad_size(BIGINT) IS 'Returns the number of active referrals (squad members) for a user';
COMMENT ON FUNCTION can_claim_squad_rewards(BIGINT) IS 'Checks if user can claim squad rewards (8-hour cooldown)';
COMMENT ON FUNCTION calculate_squad_reward(BIGINT) IS 'Calculates potential squad mining reward based on squad size';
COMMENT ON FUNCTION claim_squad_mining_rewards(BIGINT, TEXT) IS 'Claims squad mining rewards and updates user balance';
COMMENT ON FUNCTION get_squad_mining_stats(BIGINT) IS 'Returns comprehensive squad mining statistics for a user';