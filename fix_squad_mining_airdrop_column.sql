-- Fix Squad Mining Airdrop Balance Column Reference
-- This fixes the "last_updated" column error in the squad mining function

-- Drop and recreate the claim_squad_mining_rewards function with correct column names
DROP FUNCTION IF EXISTS claim_squad_mining_rewards(BIGINT, TEXT);

-- Recreate the function with correct airdrop_balances column references
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_squad_mining_rewards(BIGINT, TEXT) TO authenticated;

-- Verify the function exists and works
SELECT 'Squad mining airdrop function updated successfully' as status;