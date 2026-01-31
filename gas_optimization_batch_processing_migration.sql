-- Gas Optimization and Batch Processing Migration
-- This migration creates tables and functions for gas optimization and batch processing

-- Gas Optimization Data Table
CREATE TABLE IF NOT EXISTS gas_optimization_data (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    gas_price_gwei NUMERIC(10,2) NOT NULL,
    network_congestion VARCHAR(20) CHECK (network_congestion IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    recommended_action VARCHAR(50) CHECK (recommended_action IN ('PROCESS_NOW', 'WAIT', 'BATCH', 'DELAY')),
    batch_savings_percentage NUMERIC(5,2),
    average_processing_time_minutes INTEGER,
    network VARCHAR(20) DEFAULT 'TON',
    block_number BIGINT,
    transaction_success_rate NUMERIC(5,2),
    mempool_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for gas_optimization_data table
CREATE INDEX IF NOT EXISTS idx_gas_optimization_timestamp ON gas_optimization_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_gas_optimization_network ON gas_optimization_data(network);
CREATE INDEX IF NOT EXISTS idx_gas_optimization_congestion ON gas_optimization_data(network_congestion);

-- Batch Processing Table
CREATE TABLE IF NOT EXISTS batch_processing (
    batch_id VARCHAR(50) PRIMARY KEY,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    total_claims INTEGER DEFAULT 0,
    total_amount NUMERIC(18,8) DEFAULT 0,
    total_usd_value NUMERIC(12,2) DEFAULT 0,
    estimated_gas_savings NUMERIC(10,2),
    actual_gas_used NUMERIC(18,0),
    actual_gas_saved NUMERIC(10,2),
    processing_tier VARCHAR(20) DEFAULT 'INSTANT',
    network VARCHAR(20) DEFAULT 'TON',
    batch_type VARCHAR(20) DEFAULT 'WEEKLY' CHECK (batch_type IN ('WEEKLY', 'DAILY', 'EMERGENCY', 'CUSTOM')),
    min_participants INTEGER DEFAULT 5,
    max_participants INTEGER DEFAULT 1000,
    gas_price_at_creation NUMERIC(10,2),
    gas_price_at_processing NUMERIC(10,2),
    transaction_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for batch_processing table
CREATE INDEX IF NOT EXISTS idx_batch_processing_scheduled_date ON batch_processing(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_batch_processing_status ON batch_processing(status);
CREATE INDEX IF NOT EXISTS idx_batch_processing_type ON batch_processing(batch_type);

-- Batch Participants Table (linking claims to batches)
CREATE TABLE IF NOT EXISTS batch_participants (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) REFERENCES batch_processing(batch_id) ON DELETE CASCADE,
    claim_request_id BIGINT REFERENCES claim_requests(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18,8) NOT NULL,
    usd_value NUMERIC(10,2) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_order INTEGER,
    individual_gas_estimate NUMERIC(10,2),
    batch_gas_share NUMERIC(10,2),
    UNIQUE(batch_id, claim_request_id)
);

-- Indexes for batch_participants table
CREATE INDEX IF NOT EXISTS idx_batch_participants_batch_id ON batch_participants(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_participants_claim_id ON batch_participants(claim_request_id);
CREATE INDEX IF NOT EXISTS idx_batch_participants_user_id ON batch_participants(user_id);

-- Gas Price History Table for trend analysis
CREATE TABLE IF NOT EXISTS gas_price_history (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    network VARCHAR(20) DEFAULT 'TON',
    gas_price_gwei NUMERIC(10,2) NOT NULL,
    price_change_percentage NUMERIC(5,2),
    volume_24h NUMERIC(18,8),
    average_block_time NUMERIC(5,2),
    network_utilization NUMERIC(5,2),
    data_source VARCHAR(50) DEFAULT 'INTERNAL'
);

-- Indexes for gas_price_history table
CREATE INDEX IF NOT EXISTS idx_gas_price_history_timestamp ON gas_price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_gas_price_history_network ON gas_price_history(network);

-- User Batch Preferences Table
CREATE TABLE IF NOT EXISTS user_batch_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    auto_batch_enabled BOOLEAN DEFAULT FALSE,
    min_batch_savings_percentage NUMERIC(5,2) DEFAULT 15.0,
    max_wait_hours INTEGER DEFAULT 168, -- 1 week default
    preferred_batch_day VARCHAR(10) DEFAULT 'FRIDAY',
    gas_price_threshold NUMERIC(10,2) DEFAULT 50.0,
    notification_preferences JSONB DEFAULT '{"batch_ready": true, "savings_alert": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to generate batch ID
CREATE OR REPLACE FUNCTION generate_batch_id(batch_type VARCHAR DEFAULT 'WEEKLY')
RETURNS VARCHAR(50) AS $$
DECLARE
    batch_id VARCHAR(50);
    date_part VARCHAR(20);
BEGIN
    date_part := TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD');
    
    CASE batch_type
        WHEN 'WEEKLY' THEN
            batch_id := 'BATCH-W-' || date_part || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
        WHEN 'DAILY' THEN
            batch_id := 'BATCH-D-' || date_part || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
        WHEN 'EMERGENCY' THEN
            batch_id := 'BATCH-E-' || date_part || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
        ELSE
            batch_id := 'BATCH-C-' || date_part || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
    END CASE;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM batch_processing WHERE batch_id = batch_id) LOOP
        batch_id := batch_id || FLOOR(RANDOM() * 10)::TEXT;
    END LOOP;
    
    RETURN batch_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate gas savings for batch processing
CREATE OR REPLACE FUNCTION calculate_batch_gas_savings(
    p_individual_claims INTEGER,
    p_current_gas_price NUMERIC DEFAULT NULL
)
RETURNS TABLE(
    individual_gas_cost NUMERIC,
    batch_gas_cost NUMERIC,
    total_savings NUMERIC,
    savings_percentage NUMERIC,
    recommended BOOLEAN
) AS $$
DECLARE
    base_gas_per_claim NUMERIC := 21000; -- Base gas cost per transaction
    batch_overhead NUMERIC := 50000; -- Additional gas for batch processing
    current_gas_price NUMERIC;
    individual_total NUMERIC;
    batch_total NUMERIC;
    savings NUMERIC;
    savings_pct NUMERIC;
BEGIN
    -- Get current gas price if not provided
    IF p_current_gas_price IS NULL THEN
        SELECT gas_price_gwei INTO current_gas_price
        FROM gas_optimization_data
        WHERE network = 'TON'
        ORDER BY timestamp DESC
        LIMIT 1;
        
        current_gas_price := COALESCE(current_gas_price, 20.0); -- Default fallback
    ELSE
        current_gas_price := p_current_gas_price;
    END IF;
    
    -- Calculate costs
    individual_total := p_individual_claims * base_gas_per_claim * current_gas_price / 1000000000; -- Convert to RZC
    batch_total := (batch_overhead + (p_individual_claims * base_gas_per_claim * 0.7)) * current_gas_price / 1000000000; -- 30% savings per claim
    
    savings := individual_total - batch_total;
    savings_pct := CASE WHEN individual_total > 0 THEN (savings / individual_total * 100) ELSE 0 END;
    
    RETURN QUERY SELECT
        individual_total,
        batch_total,
        savings,
        savings_pct,
        savings_pct >= 15.0; -- Recommend if savings >= 15%
END;
$$ LANGUAGE plpgsql;

-- Create function to get optimal batch timing
CREATE OR REPLACE FUNCTION get_optimal_batch_timing(
    p_network VARCHAR DEFAULT 'TON',
    p_look_ahead_hours INTEGER DEFAULT 168
)
RETURNS TABLE(
    optimal_time TIMESTAMP WITH TIME ZONE,
    expected_gas_price NUMERIC,
    estimated_savings_percentage NUMERIC,
    confidence_level VARCHAR(20)
) AS $$
DECLARE
    avg_gas_price NUMERIC;
    min_gas_price NUMERIC;
    optimal_timestamp TIMESTAMP WITH TIME ZONE;
    confidence VARCHAR(20);
BEGIN
    -- Analyze historical gas price patterns
    SELECT 
        AVG(gas_price_gwei),
        MIN(gas_price_gwei)
    INTO avg_gas_price, min_gas_price
    FROM gas_price_history
    WHERE network = p_network
    AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Simple heuristic: Friday evening typically has lower gas prices
    optimal_timestamp := DATE_TRUNC('week', CURRENT_TIMESTAMP) + INTERVAL '4 days 18 hours'; -- Friday 6 PM
    
    -- If we're past this week's Friday, move to next week
    IF optimal_timestamp <= CURRENT_TIMESTAMP THEN
        optimal_timestamp := optimal_timestamp + INTERVAL '7 days';
    END IF;
    
    -- Determine confidence based on data availability
    confidence := CASE 
        WHEN avg_gas_price IS NOT NULL AND min_gas_price IS NOT NULL THEN 'HIGH'
        WHEN avg_gas_price IS NOT NULL THEN 'MEDIUM'
        ELSE 'LOW'
    END;
    
    RETURN QUERY SELECT
        optimal_timestamp,
        COALESCE(min_gas_price * 1.1, 20.0), -- Expect slightly higher than historical minimum
        CASE WHEN avg_gas_price > 0 THEN ((avg_gas_price - min_gas_price) / avg_gas_price * 100) ELSE 20.0 END,
        confidence;
END;
$$ LANGUAGE plpgsql;

-- Create function to create a new batch
CREATE OR REPLACE FUNCTION create_batch(
    p_batch_type VARCHAR DEFAULT 'WEEKLY',
    p_scheduled_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_network VARCHAR DEFAULT 'TON'
)
RETURNS VARCHAR(50) AS $$
DECLARE
    new_batch_id VARCHAR(50);
    scheduled_time TIMESTAMP WITH TIME ZONE;
    current_gas_price NUMERIC;
BEGIN
    -- Generate batch ID
    new_batch_id := generate_batch_id(p_batch_type);
    
    -- Set scheduled date
    IF p_scheduled_date IS NULL THEN
        SELECT optimal_time INTO scheduled_time
        FROM get_optimal_batch_timing(p_network);
    ELSE
        scheduled_time := p_scheduled_date;
    END IF;
    
    -- Get current gas price
    SELECT gas_price_gwei INTO current_gas_price
    FROM gas_optimization_data
    WHERE network = p_network
    ORDER BY timestamp DESC
    LIMIT 1;
    
    -- Create batch record
    INSERT INTO batch_processing (
        batch_id,
        scheduled_date,
        batch_type,
        network,
        gas_price_at_creation
    ) VALUES (
        new_batch_id,
        scheduled_time,
        p_batch_type,
        p_network,
        current_gas_price
    );
    
    RETURN new_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to add claim to batch
CREATE OR REPLACE FUNCTION add_claim_to_batch(
    p_batch_id VARCHAR(50),
    p_claim_request_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    claim_info RECORD;
    batch_info RECORD;
    individual_gas_cost NUMERIC;
BEGIN
    -- Get claim information
    SELECT user_id, amount, usd_value INTO claim_info
    FROM claim_requests
    WHERE id = p_claim_request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get batch information
    SELECT total_claims, max_participants INTO batch_info
    FROM batch_processing
    WHERE batch_id = p_batch_id AND status = 'SCHEDULED';
    
    IF NOT FOUND OR batch_info.total_claims >= batch_info.max_participants THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate individual gas estimate
    SELECT individual_gas_cost INTO individual_gas_cost
    FROM calculate_batch_gas_savings(1);
    
    -- Add to batch
    INSERT INTO batch_participants (
        batch_id,
        claim_request_id,
        user_id,
        amount,
        usd_value,
        individual_gas_estimate,
        processing_order
    ) VALUES (
        p_batch_id,
        p_claim_request_id,
        claim_info.user_id,
        claim_info.amount,
        claim_info.usd_value,
        individual_gas_cost,
        batch_info.total_claims + 1
    );
    
    -- Update batch totals
    UPDATE batch_processing SET
        total_claims = total_claims + 1,
        total_amount = total_amount + claim_info.amount,
        total_usd_value = total_usd_value + claim_info.usd_value
    WHERE batch_id = p_batch_id;
    
    -- Update claim status
    UPDATE claim_requests SET
        status = 'BATCHED',
        batch_id = p_batch_id
    WHERE id = p_claim_request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get gas optimization recommendations
CREATE OR REPLACE FUNCTION get_gas_optimization_recommendation(
    p_claim_amount_usd NUMERIC,
    p_user_id BIGINT DEFAULT NULL
)
RETURNS TABLE(
    recommendation VARCHAR(50),
    current_gas_price NUMERIC,
    estimated_cost NUMERIC,
    batch_savings_available BOOLEAN,
    batch_savings_percentage NUMERIC,
    optimal_timing TIMESTAMP WITH TIME ZONE,
    reasoning TEXT
) AS $$
DECLARE
    current_gas NUMERIC;
    gas_trend VARCHAR(20);
    user_preferences RECORD;
    batch_available BOOLEAN := FALSE;
    savings_pct NUMERIC := 0;
    optimal_time TIMESTAMP WITH TIME ZONE;
    rec VARCHAR(50);
    reason TEXT;
BEGIN
    -- Get current gas price and trend
    SELECT 
        gas_price_gwei,
        recommended_action
    INTO current_gas, rec
    FROM gas_optimization_data
    WHERE network = 'TON'
    ORDER BY timestamp DESC
    LIMIT 1;
    
    current_gas := COALESCE(current_gas, 20.0);
    rec := COALESCE(rec, 'PROCESS_NOW');
    
    -- Get user preferences if provided
    IF p_user_id IS NOT NULL THEN
        SELECT * INTO user_preferences
        FROM user_batch_preferences
        WHERE user_id = p_user_id;
    END IF;
    
    -- Check for batch availability for small claims
    IF p_claim_amount_usd < 100 THEN
        SELECT 
            recommended,
            savings_percentage
        INTO batch_available, savings_pct
        FROM calculate_batch_gas_savings(1, current_gas);
    END IF;
    
    -- Get optimal timing
    SELECT optimal_time INTO optimal_time
    FROM get_optimal_batch_timing();
    
    -- Generate reasoning
    reason := CASE rec
        WHEN 'PROCESS_NOW' THEN 'Gas prices are currently favorable for immediate processing'
        WHEN 'WAIT' THEN 'Gas prices are high, consider waiting for better conditions'
        WHEN 'BATCH' THEN 'Batch processing recommended for significant gas savings'
        ELSE 'Standard processing recommended'
    END;
    
    RETURN QUERY SELECT
        rec,
        current_gas,
        p_claim_amount_usd * 0.001, -- Estimated gas cost as percentage of claim
        batch_available,
        savings_pct,
        optimal_time,
        reason;
END;
$$ LANGUAGE plpgsql;

-- Create view for batch processing analytics
CREATE OR REPLACE VIEW batch_analytics AS
SELECT 
    DATE_TRUNC('week', scheduled_date) as batch_week,
    batch_type,
    status,
    COUNT(*) as batch_count,
    SUM(total_claims) as total_claims_processed,
    SUM(total_amount) as total_rzc_amount,
    SUM(total_usd_value) as total_usd_value,
    AVG(estimated_gas_savings) as avg_estimated_savings,
    AVG(actual_gas_saved) as avg_actual_savings,
    AVG(gas_price_at_processing) as avg_gas_price
FROM batch_processing
WHERE scheduled_date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', scheduled_date), batch_type, status
ORDER BY batch_week DESC;

-- Create view for gas optimization insights
CREATE OR REPLACE VIEW gas_optimization_insights AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour_timestamp,
    network,
    AVG(gas_price_gwei) as avg_gas_price,
    MIN(gas_price_gwei) as min_gas_price,
    MAX(gas_price_gwei) as max_gas_price,
    MODE() WITHIN GROUP (ORDER BY network_congestion) as typical_congestion,
    MODE() WITHIN GROUP (ORDER BY recommended_action) as typical_recommendation,
    AVG(batch_savings_percentage) as avg_batch_savings
FROM gas_optimization_data
WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp), network
ORDER BY hour_timestamp DESC;

COMMENT ON TABLE gas_optimization_data IS 'Real-time gas price and network congestion monitoring';
COMMENT ON TABLE batch_processing IS 'Batch processing management for gas cost optimization';
COMMENT ON TABLE batch_participants IS 'Individual claims participating in batch processing';
COMMENT ON TABLE gas_price_history IS 'Historical gas price data for trend analysis';
COMMENT ON FUNCTION calculate_batch_gas_savings IS 'Calculates potential gas savings from batch processing';
COMMENT ON FUNCTION get_optimal_batch_timing IS 'Determines optimal timing for batch processing';
COMMENT ON FUNCTION create_batch IS 'Creates a new batch processing job';
COMMENT ON FUNCTION add_claim_to_batch IS 'Adds a claim request to an existing batch';