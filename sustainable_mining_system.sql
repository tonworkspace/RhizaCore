-- Sustainable Mining System Implementation
-- This script implements the whitepaper formula for sustainable mining

-- Create function to get time multiplier based on days staked
CREATE OR REPLACE FUNCTION get_time_multiplier(days_staked INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    IF days_staked <= 7 THEN
        RETURN 1.0;  -- 1-7 days: 1.0x base rate
    ELSIF days_staked <= 30 THEN
        RETURN 1.1;  -- 8-30 days: 1.1x bonus multiplier
    ELSE
        RETURN 1.25; -- 31+ days: 1.25x maximum multiplier
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get referral boost
CREATE OR REPLACE FUNCTION get_referral_boost(referral_count INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    -- 5% per referral, maximum 50% boost
    RETURN 1 + LEAST(referral_count * 0.05, 0.5);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate network power (total staked amount)
CREATE OR REPLACE FUNCTION calculate_network_power()
RETURNS NUMERIC AS $$
DECLARE
    total_power NUMERIC;
BEGIN
    SELECT COALESCE(SUM(balance), 0) INTO total_power
    FROM users
    WHERE balance > 0;
    
    -- Return at least 1 to prevent division by zero
    RETURN GREATEST(total_power, 1);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate sustainable daily rewards
CREATE OR REPLACE FUNCTION calculate_sustainable_rewards(
    user_id BIGINT,
    user_balance NUMERIC,
    days_staked INTEGER DEFAULT 0,
    referral_count INTEGER DEFAULT 0
)
RETURNS NUMERIC AS $$
DECLARE
    base_roi NUMERIC := 0.01; -- 1% daily base rate
    time_multiplier NUMERIC;
    referral_boost NUMERIC;
    effective_staking_power NUMERIC;
    network_power NUMERIC;
    daily_emission NUMERIC := 1000; -- 1000 TAPPS per day total
    daily_reward NUMERIC;
BEGIN
    -- Get multipliers
    time_multiplier := get_time_multiplier(days_staked);
    referral_boost := get_referral_boost(referral_count);
    
    -- Calculate effective staking power
    effective_staking_power := user_balance * time_multiplier * referral_boost;
    
    -- Get network power
    network_power := calculate_network_power();
    
    -- Calculate daily reward using whitepaper formula
    daily_reward := (effective_staking_power / network_power) * daily_emission;
    
    RETURN daily_reward;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user's referral count
CREATE OR REPLACE FUNCTION update_user_referral_count(user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    referral_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO referral_count
    FROM referrals
    WHERE sponsor_id = user_id AND status = 'active';
    
    -- Update user's referral count
    UPDATE users
    SET direct_referrals = referral_count
    WHERE id = user_id;
    
    RETURN referral_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate days staked for a user
CREATE OR REPLACE FUNCTION calculate_days_staked(user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    days_staked INTEGER;
BEGIN
    SELECT EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - last_deposit_date))::INTEGER
    INTO days_staked
    FROM users
    WHERE id = user_id;
    
    RETURN COALESCE(days_staked, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to process sustainable earnings
CREATE OR REPLACE FUNCTION process_sustainable_earnings(
    p_user_id BIGINT,
    p_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    user_balance NUMERIC;
    days_staked INTEGER;
    referral_count INTEGER;
    daily_reward NUMERIC;
    current_earnings NUMERIC;
BEGIN
    -- Get user data
    SELECT balance, total_sbt INTO user_balance, current_earnings
    FROM users
    WHERE id = p_user_id;
    
    -- Calculate days staked
    days_staked := calculate_days_staked(p_user_id);
    
    -- Get referral count
    referral_count := update_user_referral_count(p_user_id);
    
    -- Calculate sustainable daily reward
    daily_reward := calculate_sustainable_rewards(p_user_id, user_balance, days_staked, referral_count);
    
    -- Update user's earnings
    UPDATE users
    SET total_sbt = COALESCE(total_sbt, 0) + daily_reward
    WHERE id = p_user_id;
    
    -- Log the earning event
    INSERT INTO activities (user_id, type, amount, status, created_at)
    VALUES (p_user_id, 'sustainable_mining', daily_reward, 'completed', CURRENT_TIMESTAMP);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create view for mining statistics
CREATE OR REPLACE VIEW mining_statistics AS
SELECT 
    u.id,
    u.username,
    u.balance,
    calculate_days_staked(u.id) as days_staked,
    get_time_multiplier(calculate_days_staked(u.id)) as time_multiplier,
    update_user_referral_count(u.id) as referral_count,
    get_referral_boost(update_user_referral_count(u.id)) as referral_boost,
    calculate_sustainable_rewards(
        u.id, 
        u.balance, 
        calculate_days_staked(u.id), 
        update_user_referral_count(u.id)
    ) as daily_reward,
    u.total_sbt as total_earned
FROM users u
WHERE u.balance > 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor ON referrals(sponsor_id, status);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_time_multiplier(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_boost(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_network_power() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_sustainable_rewards(BIGINT, NUMERIC, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_referral_count(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_days_staked(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_sustainable_earnings(BIGINT, NUMERIC) TO authenticated;
GRANT SELECT ON mining_statistics TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_time_multiplier(INTEGER) IS 'Returns time multiplier based on days staked: 1-7 days = 1.0x, 8-30 days = 1.1x, 31+ days = 1.25x';
COMMENT ON FUNCTION get_referral_boost(INTEGER) IS 'Returns referral boost: 5% per referral, maximum 50% boost';
COMMENT ON FUNCTION calculate_network_power() IS 'Calculates total network power (sum of all staked amounts)';
COMMENT ON FUNCTION calculate_sustainable_rewards(BIGINT, NUMERIC, INTEGER, INTEGER) IS 'Calculates daily rewards using whitepaper formula: (Effective Staking Power / Network Power) × Daily Emission';
COMMENT ON FUNCTION process_sustainable_earnings(BIGINT, NUMERIC) IS 'Processes sustainable earnings for a user based on their staking power and network participation';
COMMENT ON VIEW mining_statistics IS 'View showing mining statistics for all active users including multipliers and daily rewards';
