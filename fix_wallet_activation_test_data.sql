-- Fix for wallet activation system - Remove problematic test data insertion
-- This removes the test data that was causing the foreign key constraint error

-- Check if the wallet_activations table exists and has the problematic test record
DO $$
BEGIN
    -- Remove any test records that might be causing issues
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_activations') THEN
        DELETE FROM wallet_activations WHERE transaction_hash = 'test_hash_123';
        RAISE NOTICE 'Removed test activation records if they existed';
    END IF;
    
    -- Verify the table structure is correct
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_activations') THEN
        RAISE NOTICE 'wallet_activations table exists and is ready for use';
    ELSE
        RAISE NOTICE 'wallet_activations table does not exist - please run the main creation script';
    END IF;
    
    -- Check if users table has the new columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_activated') THEN
        RAISE NOTICE 'users table has wallet_activated column';
    ELSE
        RAISE NOTICE 'Adding wallet_activated column to users table';
        ALTER TABLE users ADD COLUMN wallet_activated BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN wallet_activated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Verify the functions exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_wallet_activation') 
        THEN 'process_wallet_activation function exists' 
        ELSE 'process_wallet_activation function missing - please run creation script'
    END as activation_function_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_wallet_activation_status') 
        THEN 'get_wallet_activation_status function exists' 
        ELSE 'get_wallet_activation_status function missing - please run creation script'
    END as status_function_status;

SELECT 'Wallet activation system fix completed!' as result;