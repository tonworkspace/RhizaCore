-- Create deposits table for TON deposit tracking
CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    transaction_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    
    -- Indexes for performance
    CONSTRAINT deposits_id_unique UNIQUE (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at);
CREATE INDEX IF NOT EXISTS idx_deposits_transaction_hash ON deposits(transaction_hash);

-- Add RLS (Row Level Security) policies
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own deposits
CREATE POLICY "Users can view own deposits" ON deposits
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own deposits
CREATE POLICY "Users can insert own deposits" ON deposits
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: System can update deposit status (for admin/system operations)
CREATE POLICY "System can update deposits" ON deposits
    FOR UPDATE USING (true);

-- Add a function to automatically update confirmed_at when status changes to confirmed
CREATE OR REPLACE FUNCTION update_deposit_confirmed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        NEW.confirmed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_deposit_confirmed_at ON deposits;
CREATE TRIGGER trigger_update_deposit_confirmed_at
    BEFORE UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_deposit_confirmed_at();

-- Add a function to get user's total confirmed deposits
CREATE OR REPLACE FUNCTION get_user_total_deposits(p_user_id INTEGER)
RETURNS DECIMAL(20, 8) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(amount) 
         FROM deposits 
         WHERE user_id = p_user_id AND status = 'confirmed'),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON deposits TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comment
COMMENT ON TABLE deposits IS 'Tracks TON deposits from users to the platform';
COMMENT ON COLUMN deposits.id IS 'Unique deposit ID (manually generated)';
COMMENT ON COLUMN deposits.user_id IS 'Reference to the user making the deposit';
COMMENT ON COLUMN deposits.amount IS 'Amount of TON deposited';
COMMENT ON COLUMN deposits.status IS 'Deposit status: pending, confirmed, or failed';
COMMENT ON COLUMN deposits.transaction_hash IS 'TON blockchain transaction hash';
COMMENT ON COLUMN deposits.created_at IS 'When the deposit record was created';
COMMENT ON COLUMN deposits.confirmed_at IS 'When the deposit was confirmed on blockchain';
COMMENT ON COLUMN deposits.metadata IS 'Additional metadata for the deposit';