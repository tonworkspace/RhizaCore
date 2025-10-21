-- Weekly Withdrawal System Migration
-- This migration adds weekly withdrawal tracking to the users table

-- Add weekly withdrawal tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_weekly_withdrawal TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS weekly_withdrawal_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_weekly_withdrawn NUMERIC(18,8) DEFAULT 0;

-- Create index for efficient querying of last withdrawal date
CREATE INDEX IF NOT EXISTS idx_users_last_weekly_withdrawal ON users(last_weekly_withdrawal);

-- Add comment to document the weekly withdrawal system
COMMENT ON COLUMN users.last_weekly_withdrawal IS 'Timestamp of the last weekly withdrawal (resets every Friday)';
COMMENT ON COLUMN users.weekly_withdrawal_count IS 'Number of weekly withdrawals made in current week';
COMMENT ON COLUMN users.total_weekly_withdrawn IS 'Total amount withdrawn in current week';

-- Create a function to check if user can make weekly withdrawal
CREATE OR REPLACE FUNCTION can_make_weekly_withdrawal(user_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    last_withdrawal TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    days_since_withdrawal INTEGER;
BEGIN
    -- Get user's last weekly withdrawal
    SELECT last_weekly_withdrawal INTO last_withdrawal
    FROM users 
    WHERE id = user_id_param;
    
    -- If no previous withdrawal, allow it
    IF last_withdrawal IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate days since last withdrawal
    days_since_withdrawal := EXTRACT(DAY FROM (current_time - last_withdrawal));
    
    -- Allow withdrawal if 7 or more days have passed
    RETURN days_since_withdrawal >= 7;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get next available withdrawal date
CREATE OR REPLACE FUNCTION get_next_withdrawal_date(user_id_param INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    last_withdrawal TIMESTAMP WITH TIME ZONE;
    next_available TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user's last weekly withdrawal
    SELECT last_weekly_withdrawal INTO last_withdrawal
    FROM users 
    WHERE id = user_id_param;
    
    -- If no previous withdrawal, next withdrawal is now
    IF last_withdrawal IS NULL THEN
        RETURN NOW();
    END IF;
    
    -- Calculate next available date (7 days after last withdrawal)
    next_available := last_withdrawal + INTERVAL '7 days';
    
    RETURN next_available;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update weekly withdrawal tracking
CREATE OR REPLACE FUNCTION update_weekly_withdrawal_tracking(
    user_id_param INTEGER,
    withdrawal_amount NUMERIC(18,8)
)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET 
        last_weekly_withdrawal = NOW(),
        weekly_withdrawal_count = weekly_withdrawal_count + 1,
        total_weekly_withdrawn = total_weekly_withdrawn + withdrawal_amount
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset weekly withdrawal counters (to be called weekly)
CREATE OR REPLACE FUNCTION reset_weekly_withdrawal_counters()
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET 
        weekly_withdrawal_count = 0,
        total_weekly_withdrawn = 0
    WHERE last_weekly_withdrawal < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a function to update user balance after withdrawal approval
CREATE OR REPLACE FUNCTION update_user_balance_after_withdrawal(
    user_id BIGINT,
    withdrawal_amount NUMERIC(18,8)
)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET 
        total_withdrawn = total_withdrawn - withdrawal_amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for the new columns (if RLS is enabled)
-- Note: These policies assume RLS is enabled on the users table
-- Uncomment if needed:
/*
CREATE POLICY "Users can view own weekly withdrawal data" ON users 
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own weekly withdrawal data" ON users 
FOR UPDATE USING (auth.uid()::text = id::text);
*/
