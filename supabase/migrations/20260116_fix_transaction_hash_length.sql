-- Fix transaction hash length limit in wallet_activations table
-- TON BOC (Bag of Cells) can be very long, often over 1000 characters

-- Increase transaction_hash field size to accommodate longer TON transaction hashes
ALTER TABLE wallet_activations 
ALTER COLUMN transaction_hash TYPE TEXT;

-- Also update the function parameter to accept longer hashes
CREATE OR REPLACE FUNCTION process_wallet_activation(
    p_user_id INTEGER,
    p_ton_amount DECIMAL(20, 8),
    p_ton_price DECIMAL(10, 4),
    p_transaction_hash TEXT, -- Changed from VARCHAR(255) to TEXT
    p_sender_address VARCHAR(255),
    p_receiver_address VARCHAR(255)
) RETURNS JSON AS $
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
    
    -- Check if transaction hash already exists (only if not null/empty)
    IF p_transaction_hash IS NOT NULL AND p_transaction_hash != '' AND p_transaction_hash != 'direct_payment' THEN
        IF EXISTS(SELECT 1 FROM wallet_activations WHERE transaction_hash = p_transaction_hash) THEN
            RETURN json_build_object('success', false, 'error', 'Transaction already processed');
        END IF;
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
            'transaction_hash', CASE 
                WHEN LENGTH(p_transaction_hash) > 100 
                THEN LEFT(p_transaction_hash, 100) || '...' 
                ELSE p_transaction_hash 
            END
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
$ LANGUAGE plpgsql;

-- Update other tables that might have the same issue
-- Check if user_transfers table exists and update it too
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_transfers') THEN
        ALTER TABLE user_transfers ALTER COLUMN transaction_hash TYPE TEXT;
    END IF;
END $$;

-- Check if deposits table exists and update it too
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deposits') THEN
        ALTER TABLE deposits ALTER COLUMN transaction_hash TYPE TEXT;
    END IF;
END $$;

-- Add comment explaining the change
COMMENT ON COLUMN wallet_activations.transaction_hash IS 'TON transaction hash (BOC) - can be very long, stored as TEXT';