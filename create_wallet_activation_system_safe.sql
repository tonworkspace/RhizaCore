-- Create wallet activation system (Safe version without test data)
-- Users pay $15 in TON to activate wallet and receive 150 RZC

-- Create wallet_activations table to track activation payments
CREATE TABLE IF NOT EXISTS wallet_activations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ton_amount DECIMAL(20, 8) NOT NULL, -- Amount of TON paid
    usd_amount DECIMAL(10, 2) NOT NULL DEFAULT 15.00, -- USD equivalent (always $15)
    ton_price_at_payment DECIMAL(10, 4) NOT NULL, -- TON price when payment was made
    rzc_awarded DECIMAL(20, 6) NOT NULL DEFAULT 150.0, -- RZC given (always 150)
    transaction_hash VARCHAR(255), -- TON blockchain transaction hash
    ton_sender_address VARCHAR(255), -- User's TON wallet address
    ton_receiver_address VARCHAR(255), -- Our receiving TON address
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    payment_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add wallet_activated column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_activated BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_activated_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_activations_user_id ON wallet_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_activations_status ON wallet_activations(status);
CREATE INDEX IF NOT EXISTS idx_wallet_activations_transaction_hash ON wallet_activations(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_users_wallet_activated ON users(wallet_activated);

-- Create function to process wallet activation
CREATE OR REPLACE FUNCTION process_wallet_activation(
    p_user_id INTEGER,
    p_ton_amount DECIMAL(20, 8),
    p_ton_price DECIMAL(10, 4),
    p_transaction_hash VARCHAR(255),
    p_sender_address VARCHAR(255),
    p_receiver_address VARCHAR(255)
) RETURNS JSON AS $$
DECLARE
    v_activation_id INTEGER;
    v_user_exists BOOLEAN;
    v_already_activated BOOLEAN;
    v_usd_amount DECIMAL(10, 2) := 15.00;
    v_rzc_amount DECIMAL(20, 6) := 150.0;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if wallet is already activated
    SELECT wallet_activated INTO v_already_activated FROM users WHERE id = p_user_id;
    IF v_already_activated THEN
        RETURN json_build_object('success', false, 'error', 'Wallet already activated');
    END IF;
    
    -- Check if transaction hash already exists
    IF EXISTS(SELECT 1 FROM wallet_activations WHERE transaction_hash = p_transaction_hash) THEN
        RETURN json_build_object('success', false, 'error', 'Transaction already processed');
    END IF;
    
    -- Create activation record
    INSERT INTO wallet_activations (
        user_id, ton_amount, usd_amount, ton_price_at_payment, rzc_awarded,
        transaction_hash, ton_sender_address, ton_receiver_address, status
    ) VALUES (
        p_user_id, p_ton_amount, v_usd_amount, p_ton_price, v_rzc_amount,
        p_transaction_hash, p_sender_address, p_receiver_address, 'confirmed'
    ) RETURNING id INTO v_activation_id;
    
    -- Mark user as activated
    UPDATE users SET 
        wallet_activated = TRUE,
        wallet_activated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create or update airdrop balance with 150 RZC
    INSERT INTO airdrop_balances (
        user_id, total_claimed_to_airdrop, available_balance, 
        withdrawn_balance, staked_balance, created_at, updated_at
    ) VALUES (
        p_user_id, v_rzc_amount, v_rzc_amount, 0, 0, NOW(), NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_claimed_to_airdrop = airdrop_balances.total_claimed_to_airdrop + v_rzc_amount,
        available_balance = airdrop_balances.available_balance + v_rzc_amount,
        updated_at = NOW();
    
    -- Record activity
    INSERT INTO activities (user_id, type, amount, status, metadata, created_at) VALUES (
        p_user_id, 'wallet_activation', v_rzc_amount, 'completed',
        json_build_object(
            'activation_id', v_activation_id,
            'ton_amount', p_ton_amount,
            'usd_amount', v_usd_amount,
            'transaction_hash', p_transaction_hash
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true, 
        'activation_id', v_activation_id,
        'rzc_awarded', v_rzc_amount,
        'message', 'Wallet activated successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Create function to check activation status
CREATE OR REPLACE FUNCTION get_wallet_activation_status(p_user_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_user_record RECORD;
    v_activation_record RECORD;
BEGIN
    -- Get user info
    SELECT wallet_activated, wallet_activated_at INTO v_user_record
    FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Get latest activation record if exists
    SELECT * INTO v_activation_record
    FROM wallet_activations 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RETURN json_build_object(
        'success', true,
        'wallet_activated', v_user_record.wallet_activated,
        'wallet_activated_at', v_user_record.wallet_activated_at,
        'activation_details', CASE 
            WHEN v_activation_record.id IS NOT NULL THEN
                json_build_object(
                    'id', v_activation_record.id,
                    'ton_amount', v_activation_record.ton_amount,
                    'usd_amount', v_activation_record.usd_amount,
                    'rzc_awarded', v_activation_record.rzc_awarded,
                    'transaction_hash', v_activation_record.transaction_hash,
                    'status', v_activation_record.status,
                    'created_at', v_activation_record.created_at
                )
            ELSE NULL
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for compatibility with current system (same as user_transfers)
ALTER TABLE wallet_activations DISABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_wallet_activations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wallet_activations_updated_at
    BEFORE UPDATE ON wallet_activations
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_activations_updated_at();

COMMENT ON TABLE wallet_activations IS 'Tracks $15 TON payments for wallet activation and 150 RZC rewards';
COMMENT ON COLUMN wallet_activations.ton_amount IS 'Amount of TON paid for activation';
COMMENT ON COLUMN wallet_activations.usd_amount IS 'USD equivalent (always $15)';
COMMENT ON COLUMN wallet_activations.rzc_awarded IS 'RZC tokens awarded (always 150)';
COMMENT ON COLUMN wallet_activations.transaction_hash IS 'TON blockchain transaction hash';

-- Success message
SELECT 'Wallet activation system created successfully!' as result;