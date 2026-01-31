-- Method 2: Using existing process_wallet_activation function
-- This uses your existing function but with dummy/manual data

-- Replace USER_ID with the actual user ID
-- Example: Activate user ID 123
SELECT process_wallet_activation(
    123,                                    -- p_user_id
    0.0,                                   -- p_ton_amount (0 for manual)
    6.0,                                   -- p_ton_price (dummy price)
    'MANUAL_ADMIN_' || 123 || '_' || extract(epoch from now())::text,  -- unique transaction hash
    'MANUAL_ACTIVATION',                   -- p_sender_address
    'ADMIN_OVERRIDE'                       -- p_receiver_address
);

-- For multiple users, you can run multiple calls:
-- SELECT process_wallet_activation(123, 0.0, 6.0, 'MANUAL_ADMIN_123_' || extract(epoch from now())::text, 'MANUAL_ACTIVATION', 'ADMIN_OVERRIDE');
-- SELECT process_wallet_activation(124, 0.0, 6.0, 'MANUAL_ADMIN_124_' || extract(epoch from now())::text, 'MANUAL_ACTIVATION', 'ADMIN_OVERRIDE');
-- SELECT process_wallet_activation(125, 0.0, 6.0, 'MANUAL_ADMIN_125_' || extract(epoch from now())::text, 'MANUAL_ACTIVATION', 'ADMIN_OVERRIDE');