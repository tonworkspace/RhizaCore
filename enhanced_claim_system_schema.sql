-- Enhanced Professional RZC Claim System Database Schema
-- This schema supports tiered processing, reputation management, gas optimization, and batch processing

-- Enhanced Claim Requests Table with Tiered Processing Support
CREATE TABLE IF NOT EXISTS claim_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    tracking_id VARCHAR(20) UNIQUE NOT NULL,
    amount NUMERIC(18,8) NOT NULL,
    usd_value NUMERIC(10,2) NOT NULL, -- USD value at time of claim
    processing_tier VARCHAR(20) NOT NULL CHECK (processing_tier IN ('INSTANT', 'EXPRESS', 'STANDARD')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'BATCHED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_date TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    gas_price_gwei NUMERIC(10,2), -- Gas price at time of processing
    batch_id VARCHAR(50), -- For batch processing
    risk_score NUMERIC(3,2) CHECK (risk_score >= 0.00 AND risk_score <= 1.00), -- AI-calculated risk score (0.00-1.00)
    user_reputation_score INTEGER, -- User reputation at time of claim
    wallet_address VARCHAR(100), -- Destination wallet address
    network VARCHAR(20) DEFAULT 'TON', -- Blockchain network
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for enhanced claim_requests table
CREATE INDEX IF NOT EXISTS idx_claim_requests_user_id ON claim_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_processing_tier ON claim_requests(processing_tier);
CREATE INDEX IF NOT EXISTS idx_claim_requests_processing_date ON claim_requests(processing_date);
CREATE INDEX IF NOT EXISTS idx_claim_requests_batch_id ON claim_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_risk_score ON claim_requests(risk_score);
CREATE INDEX IF NOT EXISTS idx_claim_requests_tracking_id ON claim_requests(tracking_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_submitted_at ON claim_requests(submitted_at);

-- User Reputation System Table
CREATE TABLE IF NOT EXISTS user_reputation (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reputation_score INTEGER DEFAULT 100 CHECK (reputation_score >= 0 AND reputation_score <= 1000), -- 0-1000 scale
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_reputation table
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(reputation_score);
CREATE INDEX IF NOT EXISTS idx_user_reputation_last_claim ON user_reputation(last_claim_date);

-- Gas Optimization Data Table
CREATE TABLE IF NOT EXISTS gas_optimization_data (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    gas_price_gwei NUMERIC(10,2) NOT NULL,
    network_congestion VARCHAR(20) CHECK (network_congestion IN ('LOW', 'MEDIUM', 'HIGH')),
    recommended_action VARCHAR(50) CHECK (recommended_action IN ('PROCESS_NOW', 'WAIT', 'BATCH')),
    batch_savings_percentage NUMERIC(5,2),
    average_processing_time_minutes INTEGER,
    network VARCHAR(20) DEFAULT 'TON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for gas_optimization_data table
CREATE INDEX IF NOT EXISTS idx_gas_optimization_timestamp ON gas_optimization_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_gas_optimization_network ON gas_optimization_data(network);

-- Batch Processing Table
CREATE TABLE IF NOT EXISTS batch_processing (
    batch_id VARCHAR(50) PRIMARY KEY,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    total_claims INTEGER DEFAULT 0,
    total_amount NUMERIC(18,8) DEFAULT 0,
    total_usd_value NUMERIC(12,2) DEFAULT 0,
    estimated_gas_savings NUMERIC(10,2),
    actual_gas_used NUMERIC(18,0),
    processing_tier VARCHAR(20) DEFAULT 'INSTANT',
    network VARCHAR(20) DEFAULT 'TON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for batch_processing table
CREATE INDEX IF NOT EXISTS idx_batch_processing_scheduled_date ON batch_processing(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_batch_processing_status ON batch_processing(status);

-- Claim Status History Table (Enhanced)
CREATE TABLE IF NOT EXISTS claim_status_history (
    id BIGSERIAL PRIMARY KEY,
    claim_request_id BIGINT REFERENCES claim_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    reason TEXT,
    changed_by VARCHAR(50), -- 'SYSTEM' or admin user ID
    gas_price_at_change NUMERIC(10,2),
    system_load_percentage NUMERIC(5,2),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for claim_status_history table
CREATE INDEX IF NOT EXISTS idx_claim_status_history_claim_id ON claim_status_history(claim_request_id);
CREATE INDEX IF NOT EXISTS idx_claim_status_history_changed_at ON claim_status_history(changed_at);

-- User Achievements Table for Gamification
CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reward_amount NUMERIC(18,8) DEFAULT 0,
    is_milestone BOOLEAN DEFAULT FALSE
);

-- Indexes for user_achievements table
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_claim_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    prefer_batch_processing BOOLEAN DEFAULT FALSE,
    gas_price_alert_threshold NUMERIC(10,2) DEFAULT 50.00,
    auto_claim_enabled BOOLEAN DEFAULT FALSE,
    auto_claim_threshold NUMERIC(18,8) DEFAULT 100.00,
    preferred_network VARCHAR(20) DEFAULT 'TON',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Activities Table (Add claim_request_id if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'claim_request_id') THEN
        ALTER TABLE activities ADD COLUMN claim_request_id BIGINT REFERENCES claim_requests(id);
        CREATE INDEX idx_activities_claim_request_id ON activities(claim_request_id);
    END IF;
END $$;

-- System Configuration Table for Dynamic Parameters
CREATE TABLE IF NOT EXISTS system_configuration (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) DEFAULT 'STRING' CHECK (config_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system configuration
INSERT INTO system_configuration (config_key, config_value, config_type, description) VALUES
('INSTANT_CLAIM_THRESHOLD_USD', '50.00', 'NUMBER', 'USD threshold for instant claim processing'),
('EXPRESS_CLAIM_THRESHOLD_USD', '500.00', 'NUMBER', 'USD threshold for express claim processing'),
('BATCH_PROCESSING_DAY', 'FRIDAY', 'STRING', 'Day of week for batch processing'),
('GAS_PRICE_HIGH_THRESHOLD', '100.00', 'NUMBER', 'Gas price threshold considered high (gwei)'),
('REPUTATION_BONUS_THRESHOLD', '750', 'NUMBER', 'Reputation score for bonus limits'),
('MAX_DAILY_CLAIMS_PER_USER', '10', 'NUMBER', 'Maximum claims per user per day'),
('FRAUD_DETECTION_ENABLED', 'true', 'BOOLEAN', 'Enable AI fraud detection'),
('BATCH_SAVINGS_MIN_PERCENTAGE', '15.0', 'NUMBER', 'Minimum gas savings percentage to recommend batching')
ON CONFLICT (config_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_claim_requests_updated_at BEFORE UPDATE ON claim_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reputation_updated_at BEFORE UPDATE ON user_reputation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_claim_preferences_updated_at BEFORE UPDATE ON user_claim_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at BEFORE UPDATE ON system_configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique tracking IDs
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    tracking_id VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        tracking_id := 'RZC-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
                      LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
        
        -- Check if tracking_id already exists
        IF NOT EXISTS (SELECT 1 FROM claim_requests WHERE tracking_id = tracking_id) THEN
            RETURN tracking_id;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique tracking ID after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate processing tier based on USD value
CREATE OR REPLACE FUNCTION calculate_processing_tier(usd_amount NUMERIC)
RETURNS VARCHAR(20) AS $$
DECLARE
    instant_threshold NUMERIC;
    express_threshold NUMERIC;
BEGIN
    -- Get current thresholds from configuration
    SELECT config_value::NUMERIC INTO instant_threshold 
    FROM system_configuration 
    WHERE config_key = 'INSTANT_CLAIM_THRESHOLD_USD' AND is_active = TRUE;
    
    SELECT config_value::NUMERIC INTO express_threshold 
    FROM system_configuration 
    WHERE config_key = 'EXPRESS_CLAIM_THRESHOLD_USD' AND is_active = TRUE;
    
    -- Default values if configuration not found
    instant_threshold := COALESCE(instant_threshold, 50.00);
    express_threshold := COALESCE(express_threshold, 500.00);
    
    IF usd_amount < instant_threshold THEN
        RETURN 'INSTANT';
    ELSIF usd_amount < express_threshold THEN
        RETURN 'EXPRESS';
    ELSE
        RETURN 'STANDARD';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user reputation after claim
CREATE OR REPLACE FUNCTION update_user_reputation_after_claim(
    p_user_id BIGINT,
    p_claim_success BOOLEAN,
    p_claim_amount_usd NUMERIC
)
RETURNS VOID AS $$
DECLARE
    current_reputation INTEGER;
    reputation_change INTEGER := 0;
BEGIN
    -- Get current reputation or create new record
    INSERT INTO user_reputation (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT reputation_score INTO current_reputation
    FROM user_reputation WHERE user_id = p_user_id;
    
    -- Calculate reputation change
    IF p_claim_success THEN
        reputation_change := CASE 
            WHEN p_claim_amount_usd < 50 THEN 1
            WHEN p_claim_amount_usd < 500 THEN 2
            ELSE 3
        END;
        
        UPDATE user_reputation SET
            successful_claims = successful_claims + 1,
            consecutive_successful_claims = consecutive_successful_claims + 1,
            reputation_score = LEAST(1000, reputation_score + reputation_change),
            total_claimed_usd = total_claimed_usd + p_claim_amount_usd,
            last_claim_date = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    ELSE
        reputation_change := -5;
        
        UPDATE user_reputation SET
            failed_claims = failed_claims + 1,
            consecutive_successful_claims = 0,
            reputation_score = GREATEST(0, reputation_score + reputation_change)
        WHERE user_id = p_user_id;
    END IF;
    
    -- Update total claims
    UPDATE user_reputation SET
        total_claims = total_claims + 1,
        average_claim_size = (total_claimed_usd / GREATEST(1, successful_claims))
    WHERE user_id = p_user_id;
    
    -- Update limits based on reputation
    UPDATE user_reputation SET
        instant_claim_limit_usd = CASE 
            WHEN reputation_score >= 750 THEN 100.00
            WHEN reputation_score >= 500 THEN 75.00
            ELSE 50.00
        END,
        express_claim_limit_usd = CASE 
            WHEN reputation_score >= 750 THEN 1000.00
            WHEN reputation_score >= 500 THEN 750.00
            ELSE 500.00
        END
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for claim analytics
CREATE OR REPLACE VIEW claim_analytics AS
SELECT 
    DATE_TRUNC('day', submitted_at) as claim_date,
    processing_tier,
    status,
    COUNT(*) as claim_count,
    SUM(amount) as total_rzc_amount,
    SUM(usd_value) as total_usd_value,
    AVG(risk_score) as avg_risk_score,
    AVG(EXTRACT(EPOCH FROM (processed_at - submitted_at))/3600) as avg_processing_hours
FROM claim_requests
WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', submitted_at), processing_tier, status
ORDER BY claim_date DESC, processing_tier;

-- Create view for user reputation summary
CREATE OR REPLACE VIEW user_reputation_summary AS
SELECT 
    ur.user_id,
    u.wallet_address,
    ur.reputation_score,
    ur.total_claims,
    ur.successful_claims,
    CASE 
        WHEN ur.total_claims > 0 THEN (ur.successful_claims::FLOAT / ur.total_claims * 100)
        ELSE 0 
    END as success_rate_percentage,
    ur.instant_claim_limit_usd,
    ur.express_claim_limit_usd,
    ur.total_claimed_usd,
    ur.last_claim_date,
    COUNT(ua.id) as total_achievements
FROM user_reputation ur
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN user_achievements ua ON ur.user_id = ua.user_id
GROUP BY ur.user_id, u.wallet_address, ur.reputation_score, ur.total_claims, 
         ur.successful_claims, ur.instant_claim_limit_usd, ur.express_claim_limit_usd,
         ur.total_claimed_usd, ur.last_claim_date;

COMMENT ON TABLE claim_requests IS 'Enhanced claim requests with tiered processing support';
COMMENT ON TABLE user_reputation IS 'User reputation system for dynamic limits and fraud prevention';
COMMENT ON TABLE gas_optimization_data IS 'Real-time gas price and network congestion data';
COMMENT ON TABLE batch_processing IS 'Batch processing management for gas optimization';
COMMENT ON TABLE user_achievements IS 'Gamification achievements for user engagement';
COMMENT ON TABLE user_claim_preferences IS 'User preferences for claim processing';