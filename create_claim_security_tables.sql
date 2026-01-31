-- Create tables for claim security and audit logging
-- This migration adds comprehensive security measures for RZC claiming

-- Claim audit log table for immutable audit trail
CREATE TABLE IF NOT EXISTS claim_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    operation VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    success BOOLEAN NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suspicious activity log table
CREATE TABLE IF NOT EXISTS suspicious_activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_claim_audit_log_user_id ON claim_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_audit_log_transaction_id ON claim_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_claim_audit_log_created_at ON claim_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_claim_audit_log_operation ON claim_audit_log(operation);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_log_user_id ON suspicious_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_log_activity_type ON suspicious_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_log_created_at ON suspicious_activity_log(created_at);

-- Add transaction_id column to activities table for idempotency
-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add transaction_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE activities ADD COLUMN transaction_id VARCHAR(100);
    END IF;
    
    -- Add security_validated column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'security_validated'
    ) THEN
        ALTER TABLE activities ADD COLUMN security_validated BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create unique index on transaction_id for activities
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_transaction_id 
ON activities(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- RLS policies for security tables
ALTER TABLE claim_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY claim_audit_log_user_policy ON claim_audit_log
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can only view their own suspicious activity logs
CREATE POLICY suspicious_activity_log_user_policy ON suspicious_activity_log
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can insert into audit tables
CREATE POLICY claim_audit_log_service_policy ON claim_audit_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY suspicious_activity_log_service_policy ON suspicious_activity_log
    FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE claim_audit_log IS 'Immutable audit trail for all claim operations';
COMMENT ON TABLE suspicious_activity_log IS 'Log of suspicious claiming activities for monitoring';
COMMENT ON COLUMN claim_audit_log.transaction_id IS 'Unique transaction ID for idempotency';
COMMENT ON COLUMN claim_audit_log.metadata IS 'Additional context including timestamps, user agent, etc.';
COMMENT ON COLUMN suspicious_activity_log.activity_type IS 'Type of suspicious activity detected';
COMMENT ON COLUMN suspicious_activity_log.metadata IS 'Details about the suspicious activity';

-- Create function to validate claim operations
CREATE OR REPLACE FUNCTION validate_claim_operation(
    p_user_id INTEGER,
    p_amount DECIMAL,
    p_operation VARCHAR,
    p_transaction_id VARCHAR
) RETURNS JSONB AS $$
DECLARE
    v_user_balance DECIMAL;
    v_claimable_balance DECIMAL;
    v_recent_claims INTEGER;
    v_result JSONB;
BEGIN
    -- Check if transaction already exists (idempotency)
    IF EXISTS (
        SELECT 1 FROM activities 
        WHERE transaction_id = p_transaction_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction already processed',
            'code', 'DUPLICATE_TRANSACTION'
        );
    END IF;

    -- Get user's current balance
    SELECT available_balance INTO v_user_balance
    FROM users WHERE id = p_user_id;

    -- Calculate claimable balance from activities
    SELECT COALESCE(SUM(amount), 0) INTO v_claimable_balance
    FROM activities
    WHERE user_id = p_user_id
    AND type IN ('mining_complete', 'passive_income')
    AND status = 'completed';

    -- Check if amount is valid
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid claim amount',
            'code', 'INVALID_AMOUNT'
        );
    END IF;

    -- Check if user has sufficient balance
    IF p_amount > v_claimable_balance THEN
        -- Log suspicious activity
        INSERT INTO suspicious_activity_log (user_id, activity_type, metadata)
        VALUES (p_user_id, 'insufficient_balance_claim', jsonb_build_object(
            'requested_amount', p_amount,
            'available_balance', v_claimable_balance,
            'operation', p_operation
        ));

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient balance',
            'code', 'INSUFFICIENT_BALANCE'
        );
    END IF;

    -- Check for recent claims (rate limiting)
    SELECT COUNT(*) INTO v_recent_claims
    FROM activities
    WHERE user_id = p_user_id
    AND type = 'rzc_claim'
    AND created_at > NOW() - INTERVAL '1 minute';

    IF v_recent_claims >= 3 THEN
        -- Log suspicious activity
        INSERT INTO suspicious_activity_log (user_id, activity_type, metadata)
        VALUES (p_user_id, 'rate_limit_exceeded', jsonb_build_object(
            'recent_claims', v_recent_claims,
            'operation', p_operation
        ));

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Rate limit exceeded',
            'code', 'RATE_LIMIT_EXCEEDED'
        );
    END IF;

    -- Validation passed
    RETURN jsonb_build_object(
        'success', true,
        'claimable_balance', v_claimable_balance,
        'user_balance', v_user_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for secure claim processing
CREATE OR REPLACE FUNCTION process_secure_claim(
    p_user_id INTEGER,
    p_amount DECIMAL,
    p_operation VARCHAR,
    p_transaction_id VARCHAR,
    p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
    v_validation_result JSONB;
    v_new_balance DECIMAL;
    v_total_earned DECIMAL;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate the claim operation
        SELECT validate_claim_operation(p_user_id, p_amount, p_operation, p_transaction_id)
        INTO v_validation_result;

        -- Check if validation failed
        IF NOT (v_validation_result->>'success')::BOOLEAN THEN
            RETURN v_validation_result;
        END IF;

        -- Get current totals
        SELECT available_balance, total_earned INTO v_new_balance, v_total_earned
        FROM users WHERE id = p_user_id;

        -- Update user balance
        UPDATE users SET
            available_balance = v_new_balance + p_amount,
            total_earned = v_total_earned + p_amount,
            last_claim_time = NOW()
        WHERE id = p_user_id;

        -- Insert claim activity with security validation
        INSERT INTO activities (
            user_id, 
            type, 
            amount, 
            status, 
            transaction_id,
            security_validated,
            metadata,
            created_at
        ) VALUES (
            p_user_id,
            'rzc_claim',
            p_amount,
            'completed',
            p_transaction_id,
            true,
            p_metadata,
            NOW()
        );

        -- Log successful claim in audit trail
        INSERT INTO claim_audit_log (
            user_id,
            operation,
            amount,
            transaction_id,
            success,
            metadata
        ) VALUES (
            p_user_id,
            p_operation,
            p_amount,
            p_transaction_id,
            true,
            jsonb_build_object(
                'validation_result', v_validation_result,
                'additional_metadata', p_metadata,
                'processed_at', NOW()
            )
        );

        -- Return success
        RETURN jsonb_build_object(
            'success', true,
            'transaction_id', p_transaction_id,
            'amount_claimed', p_amount,
            'new_balance', v_new_balance + p_amount
        );

    EXCEPTION WHEN OTHERS THEN
        -- Log failed claim in audit trail
        INSERT INTO claim_audit_log (
            user_id,
            operation,
            amount,
            transaction_id,
            success,
            metadata
        ) VALUES (
            p_user_id,
            p_operation,
            p_amount,
            p_transaction_id,
            false,
            jsonb_build_object(
                'error', SQLERRM,
                'error_code', SQLSTATE,
                'additional_metadata', p_metadata,
                'failed_at', NOW()
            )
        );

        -- Return error
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction failed: ' || SQLERRM,
            'code', 'TRANSACTION_FAILED'
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_claim_operation TO authenticated;
GRANT EXECUTE ON FUNCTION process_secure_claim TO authenticated;

-- Create view for claim statistics (for monitoring)
CREATE OR REPLACE VIEW claim_security_stats AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_claims,
    COUNT(*) FILTER (WHERE success = true) as successful_claims,
    COUNT(*) FILTER (WHERE success = false) as failed_claims,
    AVG(amount) FILTER (WHERE success = true) as avg_claim_amount,
    COUNT(DISTINCT user_id) as unique_users
FROM claim_audit_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Create view for suspicious activity monitoring
CREATE OR REPLACE VIEW suspicious_activity_stats AS
SELECT 
    activity_type,
    COUNT(*) as occurrence_count,
    COUNT(DISTINCT user_id) as affected_users,
    DATE_TRUNC('hour', created_at) as hour
FROM suspicious_activity_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY activity_type, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, occurrence_count DESC;

COMMENT ON VIEW claim_security_stats IS 'Hourly statistics for claim operations monitoring';
COMMENT ON VIEW suspicious_activity_stats IS 'Statistics for suspicious activity monitoring';