-- Check and Fix Referrals System
-- This script checks if tables exist and recreates them with proper relationships
-- Run this in your Supabase SQL editor to diagnose and fix the referrals system

-- First, let's check what tables currently exist
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING EXISTING TABLES ===';
    
    -- Check if referrals table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') THEN
        RAISE NOTICE 'referrals table EXISTS';
        
        -- Check foreign key constraints
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'referrals' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%referrer_id%'
        ) THEN
            RAISE NOTICE 'referrer_id foreign key EXISTS';
        ELSE
            RAISE NOTICE 'referrer_id foreign key MISSING';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'referrals' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%sponsor_id%'
        ) THEN
            RAISE NOTICE 'sponsor_id foreign key EXISTS';
        ELSE
            RAISE NOTICE 'sponsor_id foreign key MISSING';
        END IF;
        
    ELSE
        RAISE NOTICE 'referrals table DOES NOT EXIST';
    END IF;
    
    -- Check if referral_earnings table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referral_earnings') THEN
        RAISE NOTICE 'referral_earnings table EXISTS';
    ELSE
        RAISE NOTICE 'referral_earnings table DOES NOT EXIST';
    END IF;
    
END $$;

-- Now let's recreate the tables properly
-- Drop existing tables if they exist (this will delete all referral data!)
DROP TABLE IF EXISTS referral_earnings CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;

-- Create referrals table with proper foreign key relationships
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    referred_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    sponsor_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level INTEGER DEFAULT 1
);

-- Create referral_earnings table with proper foreign key relationships
CREATE TABLE referral_earnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referral_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sponsor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18,8) NOT NULL,
    level INTEGER DEFAULT 1,
    type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create all necessary indexes
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_sponsor_id ON referrals(sponsor_id);
CREATE UNIQUE INDEX unique_referral ON referrals(referrer_id, referred_id);

CREATE INDEX idx_referral_earnings_referral ON referral_earnings(referral_id);
CREATE INDEX idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX idx_referral_earnings_user ON referral_earnings(user_id);
CREATE INDEX idx_referral_earnings_sponsor_id ON referral_earnings(sponsor_id);

-- Create trigger functions
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

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
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
CREATE TRIGGER maintain_direct_referrals
    AFTER INSERT OR DELETE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_referrals();

CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON referral_earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Verify the relationships are working
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFYING CREATED TABLES ===';
    
    -- Check referrals table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') THEN
        RAISE NOTICE 'referrals table CREATED SUCCESSFULLY';
        
        -- Count foreign key constraints
        SELECT COUNT(*) INTO fk_count FROM information_schema.table_constraints 
        WHERE table_name = 'referrals' AND constraint_type = 'FOREIGN KEY';
        
        RAISE NOTICE 'referrals table has % foreign key constraints', fk_count;
    ELSE
        RAISE NOTICE 'ERROR: referrals table was NOT created';
    END IF;
    
    -- Check referral_earnings table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referral_earnings') THEN
        RAISE NOTICE 'referral_earnings table CREATED SUCCESSFULLY';
    ELSE
        RAISE NOTICE 'ERROR: referral_earnings table was NOT created';
    END IF;
    
    RAISE NOTICE '=== SETUP COMPLETE ===';
    RAISE NOTICE 'The ReferralSystem component should now work properly.';
    RAISE NOTICE 'All foreign key relationships have been established.';
    
END $$;
