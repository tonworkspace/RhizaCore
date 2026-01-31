-- Disable RLS for airdrop tables to match the existing system architecture
-- The application handles user authorization through the custom user system

-- Disable RLS on airdrop tables
ALTER TABLE airdrop_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_withdrawals DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all operations on airdrop_balances" ON airdrop_balances;
DROP POLICY IF EXISTS "Allow all operations on airdrop_withdrawals" ON airdrop_withdrawals;

-- Add comments explaining the security model
COMMENT ON TABLE airdrop_balances IS 'RLS disabled - application handles user authorization through custom user system';
COMMENT ON TABLE airdrop_withdrawals IS 'RLS disabled - application handles user authorization through custom user system';

-- Verify the changes
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('airdrop_balances', 'airdrop_withdrawals');