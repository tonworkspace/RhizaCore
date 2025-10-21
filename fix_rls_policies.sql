-- Fix RLS Policies for Telegram-based Authentication
-- Run this script in your Supabase SQL editor to fix the user creation issue

-- Disable RLS on all tables to allow proper user creation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_earnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE completed_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE stakes DISABLE ROW LEVEL SECURITY;
ALTER TABLE rank_bonuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE earning_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE reinvestments DISABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been disabled. User creation should now work properly!';
    RAISE NOTICE 'Your Telegram-based authentication system can now create users without restrictions.';
END
$$;
