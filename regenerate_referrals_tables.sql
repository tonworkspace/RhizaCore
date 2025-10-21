-- Regenerate Referrals and Related Tables
-- This script recreates the referrals table and related tables with proper foreign key relationships
-- Run this in your Supabase SQL editor to restore the referrals system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (CAREFUL - this will delete all referral data!)
-- Uncomment the next lines only if you want to completely recreate the tables
-- DROP TABLE IF EXISTS referral_earnings CASCADE;
-- DROP TABLE IF EXISTS referrals CASCADE;

-- Referrals table (includes sponsor_id from migration)
CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES users(id),
    referred_id BIGINT REFERENCES users(id),
    sponsor_id BIGINT REFERENCES users(id) NOT NULL, -- Added from migration
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level INTEGER DEFAULT 1
);

-- Referral Earnings table (includes sponsor_id from migration)
CREATE TABLE IF NOT EXISTS referral_earnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    referral_id INTEGER REFERENCES users(id),
    referrer_id INTEGER REFERENCES users(id),
    sponsor_id INTEGER REFERENCES users(id), -- Added from migration
    amount NUMERIC(18,8) NOT NULL,
    level INTEGER DEFAULT 1,
    type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create all necessary indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_id ON referrals(sponsor_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_referral ON referrals(referrer_id, referred_id);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referrer_id_referred_id_key ON referrals(referrer_id, referred_id);

-- Referral Earnings Indexes
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral ON referral_earnings(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user ON referral_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_sponsor_id ON referral_earnings(sponsor_id);

-- Create trigger function to maintain direct_referrals count
CREATE OR REPLACE FUNCTION update_direct_referrals()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET direct_referrals = direct_referrals + 1
        WHERE id = NEW.referrer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET direct_referrals = direct_referrals - 1
        WHERE id = OLD.referrer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update user stats when referral earnings change
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
    -- Update user statistics when referral earnings change
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
        UPDATE users
        SET 
            total_referral_earnings = COALESCE(
                (SELECT SUM(amount)
                FROM referral_earnings
                WHERE referrer_id = NEW.referrer_id
                AND status = 'completed'),
                0
            ),
            team_volume = COALESCE(
                (SELECT SUM(amount)
                FROM referral_earnings
                WHERE referrer_id = NEW.referrer_id
                AND type = 'team_volume'
                AND status = 'completed'),
                0
            )
        WHERE id = NEW.referrer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS maintain_direct_referrals ON referrals;
CREATE TRIGGER maintain_direct_referrals
    AFTER INSERT OR DELETE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_referrals();

DROP TRIGGER IF EXISTS trigger_update_user_stats ON referral_earnings;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON referral_earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Add some default data for testing (optional)
-- You can uncomment these lines if you want to add test data
/*
INSERT INTO referrals (referrer_id, referred_id, sponsor_id, status, level) VALUES
(1, 2, 1, 'ACTIVE', 1),
(1, 3, 1, 'ACTIVE', 1)
ON CONFLICT (referrer_id, referred_id) DO NOTHING;
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Referrals and referral_earnings tables have been successfully created!';
    RAISE NOTICE 'All foreign key relationships to users table are established.';
    RAISE NOTICE 'All necessary indexes have been created for optimal performance.';
    RAISE NOTICE 'Trigger functions have been set up for automatic statistics updates.';
    RAISE NOTICE 'The ReferralSystem component should now work properly.';
END
$$;
