-- Fix for UUID compatibility in Squad Mining System
-- This script ensures all functions work correctly with UUID user IDs

-- First, let's check if the users table uses UUID or BIGINT for id
DO $$ 
DECLARE
    user_id_type text;
BEGIN
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    RAISE NOTICE 'Users table ID type: %', user_id_type;
    
    -- If it's not UUID, we need to adjust our approach
    IF user_id_type != 'uuid' THEN
        RAISE NOTICE 'Warning: Users table uses % instead of UUID. You may need to adjust the functions.', user_id_type;
    END IF;
END $$;

-- Alternative functions for BIGINT compatibility (if needed)
-- Uncomment these if your users table uses BIGINT instead of UUID

/*
-- Function to calculate squad size (active referrals) - BIGINT version
CREATE OR REPLACE FUNCTION get_user_squad_size_bigint(user_id_param BIGINT)
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

-- Function to check if user can claim squad rewards (8 hour cooldown) - BIGINT version
CREATE OR REPLACE FUNCTION can_claim_squad_rewards_bigint(user_id_param BIGINT)
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

-- Function to calculate squad mining reward - BIGINT version
CREATE OR REPLACE FUNCTION calculate_squad_reward_bigint(user_id_param BIGINT)
RETURNS DECIMAL(20, 8) AS $$
DECLARE
    squad_size INTEGER;
    mining_rate DECIMAL(10, 2);
    total_reward DECIMAL(20, 8);
BEGIN
    -- Get squad size
    SELECT get_user_squad_size_bigint(user_id_param) INTO squad_size;
    
    -- Get user's mining rate (default 25 RZC per squad member)
    SELECT COALESCE(squad_mining_rate, 25.0) INTO mining_rate
    FROM users 
    WHERE id = user_id_param;
    
    -- Calculate total reward
    total_reward := squad_size * mining_rate;
    
    RETURN total_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim squad mining rewards - BIGINT version
CREATE OR REPLACE FUNCTION claim_squad_mining_rewards_bigint(
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
    SELECT can_claim_squad_rewards_bigint(user_id_param) INTO can_claim;
    
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
    SELECT get_user_squad_size_bigint(user_id_param) INTO squad_size;
    SELECT calculate_squad_reward_bigint(user_id_param) INTO reward_amount;
    
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
    
    -- Insert claim record (need to modify table for BIGINT)
    INSERT INTO squad_mining_claims (
        user_id, 
        squad_size, 
        reward_amount, 
        transaction_id
    ) VALUES (
        user_id_param::text::uuid, -- Convert to UUID if table expects UUID
        squad_size, 
        reward_amount, 
        transaction_id_param
    );
    
    -- Update user's last claim time and total rewards
    UPDATE users 
    SET 
        last_squad_claim_at = NOW(),
        total_squad_rewards = COALESCE(total_squad_rewards, 0) + reward_amount,
        rzc_balance = COALESCE(rzc_balance, 0) + reward_amount
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

-- Function to get squad mining stats for a user - BIGINT version
CREATE OR REPLACE FUNCTION get_squad_mining_stats_bigint(user_id_param BIGINT)
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
    SELECT get_user_squad_size_bigint(user_id_param) INTO squad_size;
    SELECT calculate_squad_reward_bigint(user_id_param) INTO potential_reward;
    SELECT can_claim_squad_rewards_bigint(user_id_param) INTO can_claim;
    
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
    WHERE user_id = user_id_param::text::uuid; -- Convert to UUID if needed
    
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
*/

-- Test the current setup
DO $$
BEGIN
    RAISE NOTICE 'Testing squad mining functions...';
    
    -- Test if functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_squad_size') THEN
        RAISE NOTICE '✅ get_user_squad_size function exists';
    ELSE
        RAISE NOTICE '❌ get_user_squad_size function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_claim_squad_rewards') THEN
        RAISE NOTICE '✅ can_claim_squad_rewards function exists';
    ELSE
        RAISE NOTICE '❌ can_claim_squad_rewards function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_squad_reward') THEN
        RAISE NOTICE '✅ calculate_squad_reward function exists';
    ELSE
        RAISE NOTICE '❌ calculate_squad_reward function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'claim_squad_mining_rewards') THEN
        RAISE NOTICE '✅ claim_squad_mining_rewards function exists';
    ELSE
        RAISE NOTICE '❌ claim_squad_mining_rewards function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_squad_mining_stats') THEN
        RAISE NOTICE '✅ get_squad_mining_stats function exists';
    ELSE
        RAISE NOTICE '❌ get_squad_mining_stats function missing';
    END IF;
    
    -- Test if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'squad_mining_claims') THEN
        RAISE NOTICE '✅ squad_mining_claims table exists';
    ELSE
        RAISE NOTICE '❌ squad_mining_claims table missing';
    END IF;
END $$;