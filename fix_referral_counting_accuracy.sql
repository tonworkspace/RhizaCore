-- Fix Referral Counting Accuracy
-- This script creates functions and views to ensure accurate referral counts

-- 1. Create a function to get accurate referral counts
CREATE OR REPLACE FUNCTION get_accurate_referral_counts()
RETURNS TABLE (
    sponsor_id BIGINT,
    username TEXT,
    total_referrals BIGINT,
    active_referrals BIGINT,
    total_earned NUMERIC,
    total_deposit NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH unique_referrals AS (
        -- Remove duplicates by selecting distinct sponsor_id, referred_id pairs
        SELECT DISTINCT 
            r.sponsor_id,
            r.referred_id,
            r.status,
            u.username,
            u.total_earned,
            u.total_deposit
        FROM referrals r
        JOIN users u ON r.sponsor_id = u.id
        WHERE r.sponsor_id IS NOT NULL 
        AND r.referred_id IS NOT NULL
    ),
    aggregated_counts AS (
        SELECT 
            ur.sponsor_id,
            ur.username,
            ur.total_earned,
            ur.total_deposit,
            COUNT(*) as total_referrals,
            COUNT(CASE WHEN LOWER(ur.status) = 'active' THEN 1 END) as active_referrals
        FROM unique_referrals ur
        GROUP BY ur.sponsor_id, ur.username, ur.total_earned, ur.total_deposit
    )
    SELECT 
        ac.sponsor_id,
        ac.username,
        ac.total_referrals,
        ac.active_referrals,
        COALESCE(ac.total_earned, 0) as total_earned,
        COALESCE(ac.total_deposit, 0) as total_deposit
    FROM aggregated_counts ac
    ORDER BY ac.active_referrals DESC, ac.total_referrals DESC, ac.total_earned DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to clean duplicate referrals globally
CREATE OR REPLACE FUNCTION clean_duplicate_referrals()
RETURNS TABLE (
    cleaned_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    duplicate_ids INTEGER[];
    cleaned INTEGER := 0;
BEGIN
    -- Find duplicate referral IDs (keeping the earliest created_at for each unique pair)
    WITH ranked_referrals AS (
        SELECT 
            id,
            sponsor_id,
            referred_id,
            created_at,
            ROW_NUMBER() OVER (
                PARTITION BY sponsor_id, referred_id 
                ORDER BY created_at ASC, id ASC
            ) as rn
        FROM referrals
        WHERE sponsor_id IS NOT NULL 
        AND referred_id IS NOT NULL
    ),
    duplicates AS (
        SELECT id
        FROM ranked_referrals
        WHERE rn > 1
    )
    SELECT ARRAY_AGG(id) INTO duplicate_ids
    FROM duplicates;

    -- Delete duplicates if any found
    IF duplicate_ids IS NOT NULL AND array_length(duplicate_ids, 1) > 0 THEN
        DELETE FROM referrals WHERE id = ANY(duplicate_ids);
        GET DIAGNOSTICS cleaned = ROW_COUNT;
    END IF;

    RETURN QUERY SELECT cleaned, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 0, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a view for accurate leaderboard data
CREATE OR REPLACE VIEW referral_leaderboard AS
SELECT * FROM get_accurate_referral_counts()
LIMIT 100;

-- 4. Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_referred 
ON referrals(sponsor_id, referred_id) 
WHERE sponsor_id IS NOT NULL AND referred_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_status 
ON referrals(status) 
WHERE status IS NOT NULL;

-- 5. Add a constraint to prevent duplicate referral pairs (optional - be careful with existing data)
-- ALTER TABLE referrals ADD CONSTRAINT unique_sponsor_referred 
-- UNIQUE (sponsor_id, referred_id);

-- 6. Create a function to validate referral data integrity
CREATE OR REPLACE FUNCTION validate_referral_integrity()
RETURNS TABLE (
    issue_type TEXT,
    count BIGINT,
    description TEXT
) AS $$
BEGIN
    -- Check for null sponsor_id or referred_id
    RETURN QUERY
    SELECT 
        'null_sponsor_or_referred'::TEXT,
        COUNT(*),
        'Referrals with null sponsor_id or referred_id'::TEXT
    FROM referrals 
    WHERE sponsor_id IS NULL OR referred_id IS NULL;

    -- Check for self-referrals
    RETURN QUERY
    SELECT 
        'self_referrals'::TEXT,
        COUNT(*),
        'Users who referred themselves'::TEXT
    FROM referrals 
    WHERE sponsor_id = referred_id;

    -- Check for duplicate pairs
    RETURN QUERY
    SELECT 
        'duplicate_pairs'::TEXT,
        COUNT(*) - COUNT(DISTINCT (sponsor_id, referred_id)),
        'Duplicate sponsor-referred pairs'::TEXT
    FROM referrals 
    WHERE sponsor_id IS NOT NULL AND referred_id IS NOT NULL;

    -- Check for orphaned referrals (sponsor or referred user doesn't exist)
    RETURN QUERY
    SELECT 
        'orphaned_sponsors'::TEXT,
        COUNT(*),
        'Referrals with non-existent sponsor users'::TEXT
    FROM referrals r
    LEFT JOIN users u ON r.sponsor_id = u.id
    WHERE r.sponsor_id IS NOT NULL AND u.id IS NULL;

    RETURN QUERY
    SELECT 
        'orphaned_referred'::TEXT,
        COUNT(*),
        'Referrals with non-existent referred users'::TEXT
    FROM referrals r
    LEFT JOIN users u ON r.referred_id = u.id
    WHERE r.referred_id IS NOT NULL AND u.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM get_accurate_referral_counts();
-- SELECT * FROM clean_duplicate_referrals();
-- SELECT * FROM referral_leaderboard;
-- SELECT * FROM validate_referral_integrity();