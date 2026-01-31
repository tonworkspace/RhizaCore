-- Create user_transfers table for user-to-user RZC transfers
-- Fixed version that doesn't depend on non-existent activity_types table

CREATE TABLE IF NOT EXISTS user_transfers (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 6) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    message TEXT,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_transfers_from_user_id ON user_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_transfers_to_user_id ON user_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_transfers_status ON user_transfers(status);
CREATE INDEX IF NOT EXISTS idx_user_transfers_created_at ON user_transfers(created_at DESC);

-- Create composite index for user transfer history queries
CREATE INDEX IF NOT EXISTS idx_user_transfers_user_history ON user_transfers(from_user_id, to_user_id, created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_transfers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view transfers they are involved in
CREATE POLICY "Users can view their own transfers" ON user_transfers
    FOR SELECT USING (
        auth.uid()::text = from_user_id::text OR 
        auth.uid()::text = to_user_id::text
    );

-- Policy: Users can insert transfers they are sending
CREATE POLICY "Users can create transfers they send" ON user_transfers
    FOR INSERT WITH CHECK (auth.uid()::text = from_user_id::text);

-- Policy: Only system can update transfer status
CREATE POLICY "System can update transfer status" ON user_transfers
    FOR UPDATE USING (false); -- Only allow updates through stored procedures/functions

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_transfers_updated_at
    BEFORE UPDATE ON user_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_user_transfers_updated_at();

-- NOTE: Removed activity_types insertion since this application uses 
-- the activities table directly with VARCHAR type column.
-- The application code in sendRZCToUser() already handles inserting
-- 'rzc_send' and 'rzc_receive' activity types directly into the activities table.

COMMENT ON TABLE user_transfers IS 'User-to-user RZC transfers';
COMMENT ON COLUMN user_transfers.from_user_id IS 'ID of the user sending RZC';
COMMENT ON COLUMN user_transfers.to_user_id IS 'ID of the user receiving RZC';
COMMENT ON COLUMN user_transfers.amount IS 'Amount of RZC being transferred';
COMMENT ON COLUMN user_transfers.status IS 'Transfer status: pending, completed, failed';
COMMENT ON COLUMN user_transfers.message IS 'Optional message from sender';
COMMENT ON COLUMN user_transfers.transaction_hash IS 'Optional blockchain transaction hash';