-- Create airdrop_balances table to store user's airdrop balance
CREATE TABLE IF NOT EXISTS airdrop_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_claimed_to_airdrop DECIMAL(20, 8) NOT NULL DEFAULT 0,
    available_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    withdrawn_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    staked_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    last_claim_from_mining TIMESTAMPTZ,
    last_stake_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create airdrop_withdrawals table to track withdrawals from airdrop balance
CREATE TABLE IF NOT EXISTS airdrop_withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    airdrop_balance_id INTEGER NOT NULL REFERENCES airdrop_balances(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    destination_address VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    transaction_hash VARCHAR(200),
    network VARCHAR(50) DEFAULT 'ethereum',
    gas_fee DECIMAL(20, 8) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_airdrop_balances_user_id ON airdrop_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_withdrawals_user_id ON airdrop_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_withdrawals_status ON airdrop_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_airdrop_withdrawals_created_at ON airdrop_withdrawals(created_at);

-- RLS is disabled to match the existing system architecture
-- The application handles user authorization through the custom user system
-- ALTER TABLE airdrop_balances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE airdrop_withdrawals ENABLE ROW LEVEL SECURITY;

-- If RLS is needed in the future, uncomment the lines above and create appropriate policies

-- Add triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_airdrop_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_airdrop_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_airdrop_balances_updated_at
    BEFORE UPDATE ON airdrop_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_airdrop_balances_updated_at();

CREATE TRIGGER trigger_update_airdrop_withdrawals_updated_at
    BEFORE UPDATE ON airdrop_withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_airdrop_withdrawals_updated_at();

-- Add comments for documentation
COMMENT ON TABLE airdrop_balances IS 'Stores user airdrop balances claimed from mining rewards';
COMMENT ON COLUMN airdrop_balances.user_id IS 'Reference to the user';
COMMENT ON COLUMN airdrop_balances.total_claimed_to_airdrop IS 'Total amount ever claimed from mining to airdrop balance';
COMMENT ON COLUMN airdrop_balances.available_balance IS 'Current available balance for withdrawal';
COMMENT ON COLUMN airdrop_balances.withdrawn_balance IS 'Total amount withdrawn to external wallets';
COMMENT ON COLUMN airdrop_balances.staked_balance IS 'Amount currently staked (70% of available balance when staking)';
COMMENT ON COLUMN airdrop_balances.last_claim_from_mining IS 'Last time user claimed from mining to airdrop balance';
COMMENT ON COLUMN airdrop_balances.last_stake_date IS 'Last time user staked their airdrop balance';

COMMENT ON TABLE airdrop_withdrawals IS 'Tracks withdrawals from airdrop balance to external wallets';
COMMENT ON COLUMN airdrop_withdrawals.user_id IS 'Reference to the user making the withdrawal';
COMMENT ON COLUMN airdrop_withdrawals.airdrop_balance_id IS 'Reference to the airdrop balance';
COMMENT ON COLUMN airdrop_withdrawals.amount IS 'Amount being withdrawn';
COMMENT ON COLUMN airdrop_withdrawals.destination_address IS 'External wallet address';
COMMENT ON COLUMN airdrop_withdrawals.status IS 'Current status of the withdrawal';
COMMENT ON COLUMN airdrop_withdrawals.transaction_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN airdrop_withdrawals.network IS 'Blockchain network (ethereum, polygon, etc.)';