-- Quick User Activation Commands
-- Replace USER_ID with the actual user ID you want to activate

-- === QUICK ACTIVATION (One command) ===
-- Replace 123 with the actual user ID
SELECT manual_activate_user(123, 'Manual activation - payment issue resolved');

-- === MULTIPLE USERS AT ONCE ===
-- Replace with actual user IDs
SELECT bulk_activate_users(ARRAY[123, 124, 125], 'Batch activation - verified payments');

-- === CHECK USER STATUS FIRST ===
-- Replace 123 with user ID to check
SELECT * FROM check_user_activation_status(123);

-- === SEARCH FOR USERS WHO NEED ACTIVATION ===
-- Find users by username/ID
SELECT * FROM search_users_for_activation('username_here');

-- Find all non-activated users
SELECT * FROM search_users_for_activation(NULL, 'not_activated');

-- === DETAILED USER INFO ===
-- Get complete user activation details
SELECT get_user_activation_details(123);

-- === EMERGENCY DIRECT SQL (if functions don't work) ===
-- Replace 123 with actual user ID
/*
BEGIN;

UPDATE users SET wallet_activated = TRUE, wallet_activated_at = NOW() WHERE id = 123;

INSERT INTO airdrop_balances (user_id, total_claimed_to_airdrop, available_balance, withdrawn_balance, staked_balance, created_at, updated_at) 
VALUES (123, 150.0, 150.0, 0, 0, NOW(), NOW()) 
ON CONFLICT (user_id) DO UPDATE SET 
    total_claimed_to_airdrop = airdrop_balances.total_claimed_to_airdrop + 150.0,
    available_balance = airdrop_balances.available_balance + 150.0,
    updated_at = NOW();

INSERT INTO wallet_activations (user_id, ton_amount, usd_amount, ton_price_at_payment, rzc_awarded, transaction_hash, ton_sender_address, ton_receiver_address, status, payment_verified_at) 
VALUES (123, 0, 15.00, 0, 150.0, 'MANUAL_123_' || extract(epoch from now())::text, 'MANUAL_ACTIVATION', 'ADMIN_OVERRIDE', 'confirmed', NOW());

COMMIT;
*/

-- === COMMON SCENARIOS ===

-- 1. User paid but activation failed
-- SELECT manual_activate_user(USER_ID, 'Payment verified - activation failed due to technical issue');

-- 2. User made mistake in payment
-- SELECT manual_activate_user(USER_ID, 'Manual activation - payment corrected');

-- 3. Test user activation
-- SELECT manual_activate_user(USER_ID, 'Test user activation');

-- 4. Bulk activation for verified payments
-- SELECT bulk_activate_users(ARRAY[USER_ID1, USER_ID2, USER_ID3], 'Bulk verification - payments confirmed');

-- === VERIFICATION COMMANDS ===

-- Check if activation worked
-- SELECT wallet_activated, wallet_activated_at FROM users WHERE id = USER_ID;

-- Check airdrop balance was added
-- SELECT * FROM airdrop_balances WHERE user_id = USER_ID;

-- Check activation record was created
-- SELECT * FROM wallet_activations WHERE user_id = USER_ID ORDER BY created_at DESC LIMIT 1;