-- User Reputation System Migration
-- This migration creates the reputation system for dynamic limits and fraud prevention

-- Create user reputation table with comprehensive tracking
CREATE TABLE IF NOT EXISTS user_reputation (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reputation_score INTEGER DEFAULT 100 CHECK (reputation_score >= 0 AND reputation_score <= 1000),
    total_claims INTEGER DEFAULT 0,
    successful_claims INTEGER DEFAULT 0,
    failed_claims INTEGER DEFAULT 0,
    average_claim_size NUMERIC(18,8) DEFAULT 0,
    account_age_days INTEGER DEFAULT 0,
    last_suspicious_activity TIMESTAMP WITH TIME ZONE,
    instant_claim_limit_usd NUMERIC(10,2) DEFAULT 50.00,
    express_claim_limit_usd NUMERIC(10,2) DEFAULT 500.00,
    total_claimed_usd NUMERIC(12,2) DEFAULT 0,
    last_claim_date TIMESTAMP WITH TIME ZONE,
    consecutive_successful_claims INTEGER DEFAULT 0,
    fraud_flags INTEGER DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    verification_level VARCHAR(20) DEFAULT 'BASIC' CHECK (verification_level IN ('BASIC', 'VERIFIED', 'PREMIUM')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(reputation_score);
CREATE INDEX IF NOT EXISTS idx_user_reputation_last_claim ON user_reputation(last_claim_date);
CREATE INDEX IF NOT EXISTS idx_user_reputation_risk_level ON user_reputation(risk_level);
CREATE INDEX IF NOT EXISTS idx_user_reputation_verification ON user_reputation(verification_level);

-- Create reputation history table for tracking changes
CREATE TABLE IF NOT EXISTS user_reputation_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    old_reputation_score INTEGER,
    new_reputation_score INTEGER,
    change_reason VARCHAR(100),
    change_amount INTEGER,
    triggered_by VARCHAR(50), -- 'CLAIM_SUCCESS', 'CLAIM_FAILURE', 'ADMIN_ADJUSTMENT', etc.
    claim_request_id BIGINT REFERENCES claim_requests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id ON user_reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_history_created_at ON user_reputation_history(created_at);

-- Create reputation milestones table
CREATE TABLE IF NOT EXISTS reputation_milestones (
    id BIGSERIAL PRIMARY KEY,
    milestone_name VARCHAR(100) NOT NULL,
    required_score INTEGER NOT NULL,
    instant_limit_bonus NUMERIC(10,2) DEFAULT 0,
    express_limit_bonus NUMERIC(10,2) DEFAULT 0,
    special_privileges JSONB DEFAULT '{}',
    badge_icon VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default reputation milestones
INSERT INTO reputation_milestones (milestone_name, required_score, instant_limit_bonus, express_limit_bonus, special_privileges, badge_icon, description) VALUES
('Newcomer', 0, 0, 0, '{"early_access": false}', '🌱', 'Welcome to RhizaCore! Start building your reputation.'),
('Trusted User', 250, 25.00, 250.00, '{"priority_support": true}', '⭐', 'Consistent claiming behavior and good standing.'),
('Veteran Claimer', 500, 50.00, 500.00, '{"beta_features": true, "reduced_fees": true}', '🏆', 'Experienced user with excellent track record.'),
('Elite Member', 750, 100.00, 1000.00, '{"instant_large_claims": true, "premium_support": true}', '💎', 'Top-tier user with exceptional reputation.'),
('RZC Champion', 900, 200.00, 2000.00, '{"unlimited_instant": true, "governance_voting": true}', '👑', 'Ultimate recognition for outstanding community members.')
ON CONFLICT DO NOTHING;

-- Create function to calculate reputation score based on various factors
CREATE OR REPLACE FUNCTION calculate_reputation_score(
    p_user_id BIGINT,
    p_total_claims INTEGER DEFAULT NULL,
    p_successful_claims INTEGER DEFAULT NULL,
    p_account_age_days INTEGER DEFAULT NULL,
    p_total_claimed_usd NUMERIC DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    base_score INTEGER := 100;
    success_bonus INTEGER := 0;
    volume_bonus INTEGER := 0;
    age_bonus INTEGER := 0;
    consistency_bonus INTEGER := 0;
    final_score INTEGER;
    success_rate NUMERIC;
BEGIN
    -- Get current values if not provided
    IF p_total_claims IS NULL OR p_successful_claims IS NULL THEN
        SELECT total_claims, successful_claims, account_age_days, total_claimed_usd
        INTO p_total_claims, p_successful_claims, p_account_age_days, p_total_claimed_usd
        FROM user_reputation WHERE user_id = p_user_id;
    END IF;
    
    -- Calculate success rate bonus (0-300 points)
    IF p_total_claims > 0 THEN
        success_rate := p_successful_claims::NUMERIC / p_total_claims;
        success_bonus := FLOOR(success_rate * 300);
    END IF;
    
    -- Calculate volume bonus (0-200 points)
    IF p_total_claimed_usd > 0 THEN
        volume_bonus := LEAST(200, FLOOR(p_total_claimed_usd / 100) * 10);
    END IF;
    
    -- Calculate account age bonus (0-150 points)
    IF p_account_age_days > 0 THEN
        age_bonus := LEAST(150, FLOOR(p_account_age_days / 7) * 5); -- 5 points per week
    END IF;
    
    -- Calculate consistency bonus (0-150 points)
    IF p_total_claims >= 10 THEN
        SELECT consecutive_successful_claims INTO consistency_bonus
        FROM user_reputation WHERE user_id = p_user_id;
        consistency_bonus := LEAST(150, consistency_bonus * 3);
    END IF;
    
    final_score := base_score + success_bonus + volume_bonus + age_bonus + consistency_bonus;
    
    -- Apply penalties for fraud flags
    SELECT fraud_flags INTO success_bonus FROM user_reputation WHERE user_id = p_user_id;
    final_score := final_score - (COALESCE(success_bonus, 0) * 50);
    
    -- Ensure score is within bounds
    RETURN GREATEST(0, LEAST(1000, final_score));
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's current reputation tier
CREATE OR REPLACE FUNCTION get_user_reputation_tier(p_user_id BIGINT)
RETURNS TABLE(
    tier_name VARCHAR(100),
    current_score INTEGER,
    next_milestone VARCHAR(100),
    points_to_next INTEGER,
    instant_limit NUMERIC(10,2),
    express_limit NUMERIC(10,2),
    special_privileges JSONB
) AS $$
DECLARE
    user_score INTEGER;
    current_milestone RECORD;
    next_milestone RECORD;
BEGIN
    -- Get user's current reputation score
    SELECT reputation_score INTO user_score
    FROM user_reputation WHERE user_id = p_user_id;
    
    IF user_score IS NULL THEN
        user_score := 100; -- Default for new users
    END IF;
    
    -- Find current milestone
    SELECT * INTO current_milestone
    FROM reputation_milestones
    WHERE required_score <= user_score AND is_active = TRUE
    ORDER BY required_score DESC
    LIMIT 1;
    
    -- Find next milestone
    SELECT * INTO next_milestone
    FROM reputation_milestones
    WHERE required_score > user_score AND is_active = TRUE
    ORDER BY required_score ASC
    LIMIT 1;
    
    RETURN QUERY SELECT
        COALESCE(current_milestone.milestone_name, 'Newcomer'),
        user_score,
        COALESCE(next_milestone.milestone_name, 'Max Level Reached'),
        COALESCE(next_milestone.required_score - user_score, 0),
        COALESCE(50.00 + current_milestone.instant_limit_bonus, 50.00),
        COALESCE(500.00 + current_milestone.express_limit_bonus, 500.00),
        COALESCE(current_milestone.special_privileges, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create function to detect suspicious claim patterns
CREATE OR REPLACE FUNCTION detect_suspicious_patterns(p_user_id BIGINT)
RETURNS TABLE(
    risk_level VARCHAR(20),
    risk_factors TEXT[],
    recommended_action VARCHAR(50)
) AS $$
DECLARE
    recent_claims INTEGER;
    large_claims_today INTEGER;
    failed_claims_ratio NUMERIC;
    rapid_succession_claims INTEGER;
    risk_factors_array TEXT[] := '{}';
    calculated_risk_level VARCHAR(20) := 'LOW';
    action VARCHAR(50) := 'APPROVE';
BEGIN
    -- Check for rapid succession claims (more than 5 in last hour)
    SELECT COUNT(*) INTO rapid_succession_claims
    FROM claim_requests
    WHERE user_id = p_user_id 
    AND submitted_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour';
    
    IF rapid_succession_claims > 5 THEN
        risk_factors_array := array_append(risk_factors_array, 'Rapid succession claims');
        calculated_risk_level := 'HIGH';
    END IF;
    
    -- Check for unusual large claims (more than 3 standard claims in a day)
    SELECT COUNT(*) INTO large_claims_today
    FROM claim_requests
    WHERE user_id = p_user_id 
    AND processing_tier = 'STANDARD'
    AND submitted_at >= CURRENT_DATE;
    
    IF large_claims_today > 3 THEN
        risk_factors_array := array_append(risk_factors_array, 'Multiple large claims today');
        calculated_risk_level := CASE WHEN calculated_risk_level = 'HIGH' THEN 'CRITICAL' ELSE 'HIGH' END;
    END IF;
    
    -- Check failed claims ratio
    SELECT 
        CASE WHEN total_claims > 0 THEN failed_claims::NUMERIC / total_claims ELSE 0 END
    INTO failed_claims_ratio
    FROM user_reputation WHERE user_id = p_user_id;
    
    IF failed_claims_ratio > 0.3 THEN
        risk_factors_array := array_append(risk_factors_array, 'High failure rate');
        calculated_risk_level := CASE WHEN calculated_risk_level = 'LOW' THEN 'MEDIUM' ELSE calculated_risk_level END;
    END IF;
    
    -- Check for new account with large claims
    SELECT account_age_days INTO recent_claims FROM user_reputation WHERE user_id = p_user_id;
    IF COALESCE(recent_claims, 0) < 7 AND large_claims_today > 0 THEN
        risk_factors_array := array_append(risk_factors_array, 'New account with large claims');
        calculated_risk_level := 'HIGH';
    END IF;
    
    -- Determine recommended action
    action := CASE calculated_risk_level
        WHEN 'CRITICAL' THEN 'BLOCK'
        WHEN 'HIGH' THEN 'MANUAL_REVIEW'
        WHEN 'MEDIUM' THEN 'ADDITIONAL_VERIFICATION'
        ELSE 'APPROVE'
    END;
    
    RETURN QUERY SELECT calculated_risk_level, risk_factors_array, action;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reputation after claim status changes
CREATE OR REPLACE FUNCTION trigger_update_reputation_on_claim_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update reputation when status changes to COMPLETED or FAILED
    IF NEW.status IN ('COMPLETED', 'FAILED') AND OLD.status != NEW.status THEN
        PERFORM update_user_reputation_after_claim(
            NEW.user_id,
            NEW.status = 'COMPLETED',
            NEW.usd_value
        );
        
        -- Log reputation change
        INSERT INTO user_reputation_history (
            user_id, 
            triggered_by, 
            claim_request_id,
            change_reason
        ) VALUES (
            NEW.user_id,
            CASE WHEN NEW.status = 'COMPLETED' THEN 'CLAIM_SUCCESS' ELSE 'CLAIM_FAILURE' END,
            NEW.id,
            'Automatic update after claim ' || NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_reputation_on_claim_status
    AFTER UPDATE ON claim_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_reputation_on_claim_status();

-- Create view for reputation dashboard
CREATE OR REPLACE VIEW reputation_dashboard AS
SELECT 
    ur.user_id,
    u.wallet_address,
    ur.reputation_score,
    rt.tier_name,
    rt.instant_limit,
    rt.express_limit,
    rt.special_privileges,
    ur.total_claims,
    ur.successful_claims,
    CASE 
        WHEN ur.total_claims > 0 THEN ROUND((ur.successful_claims::NUMERIC / ur.total_claims * 100), 2)
        ELSE 0 
    END as success_rate,
    ur.total_claimed_usd,
    ur.last_claim_date,
    ur.risk_level,
    ur.verification_level,
    COUNT(ua.id) as achievement_count
FROM user_reputation ur
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN get_user_reputation_tier(ur.user_id) rt ON true
LEFT JOIN user_achievements ua ON ur.user_id = ua.user_id
GROUP BY ur.user_id, u.wallet_address, ur.reputation_score, rt.tier_name, 
         rt.instant_limit, rt.express_limit, rt.special_privileges,
         ur.total_claims, ur.successful_claims, ur.total_claimed_usd,
         ur.last_claim_date, ur.risk_level, ur.verification_level;

COMMENT ON TABLE user_reputation IS 'Comprehensive user reputation system for dynamic limits and fraud prevention';
COMMENT ON TABLE user_reputation_history IS 'Historical tracking of reputation score changes';
COMMENT ON TABLE reputation_milestones IS 'Reputation milestones and associated benefits';
COMMENT ON FUNCTION calculate_reputation_score IS 'Calculates user reputation score based on multiple factors';
COMMENT ON FUNCTION get_user_reputation_tier IS 'Returns user current tier and benefits';
COMMENT ON FUNCTION detect_suspicious_patterns IS 'Analyzes user behavior for fraud detection';