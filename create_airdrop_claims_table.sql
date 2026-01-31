-- Create airdrop_claims table
CREATE TABLE IF NOT EXISTS airdrop_claims (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    liquid_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    locked_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    claim_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validation_end_time TIMESTAMPTZ,
    node_alias VARCHAR(100),
    destination_address VARCHAR(200),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_user_id ON airdrop_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_status ON airdrop_claims(status);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_created_at ON airdrop_claims(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE airdrop_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own claims
CREATE POLICY "Users can view own airdrop claims" ON airdrop_claims
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own claims
CREATE POLICY "Users can create own airdrop claims" ON airdrop_claims
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own claims (for status changes)
CREATE POLICY "Users can update own airdrop claims" ON airdrop_claims
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_airdrop_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_airdrop_claims_updated_at
    BEFORE UPDATE ON airdrop_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_airdrop_claims_updated_at();

-- Add constraint to ensure only one pending claim per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_airdrop_claims_user_pending 
ON airdrop_claims(user_id) 
WHERE status = 'pending';

-- Add comments for documentation
COMMENT ON TABLE airdrop_claims IS 'Stores airdrop claim requests and their status';
COMMENT ON COLUMN airdrop_claims.user_id IS 'Reference to the user making the claim';
COMMENT ON COLUMN airdrop_claims.total_amount IS 'Total amount being claimed';
COMMENT ON COLUMN airdrop_claims.liquid_amount IS 'Amount available immediately (30%)';
COMMENT ON COLUMN airdrop_claims.locked_amount IS 'Amount locked in vault (70%)';
COMMENT ON COLUMN airdrop_claims.status IS 'Current status of the claim';
COMMENT ON COLUMN airdrop_claims.validation_end_time IS 'When the validation period ends';
COMMENT ON COLUMN airdrop_claims.node_alias IS 'User-provided node alias';
COMMENT ON COLUMN airdrop_claims.destination_address IS 'Wallet address for the claim';