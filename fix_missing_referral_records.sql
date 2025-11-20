-- Migration to create missing referral records for users who have sponsor_id but no referral record

-- Insert referral records for users who have sponsor_id but no corresponding referral record
INSERT INTO referrals (sponsor_id, referred_id, status, created_at)
SELECT
    u.sponsor_id,
    u.id,
    'active',
    u.created_at
FROM users u
LEFT JOIN referrals r ON u.id = r.referred_id
WHERE u.sponsor_id IS NOT NULL
AND r.id IS NULL
AND u.id != u.sponsor_id; -- Prevent self-referrals

-- Update any referral records that have null sponsor_id but the user has sponsor_id set
UPDATE referrals
SET sponsor_id = u.sponsor_id
FROM users u
WHERE referrals.referred_id = u.id
AND referrals.sponsor_id IS NULL
AND u.sponsor_id IS NOT NULL;

-- Log the changes
DO $$
DECLARE
    inserted_count INTEGER;
    updated_count INTEGER;
BEGIN
    -- Get count of inserted records (this is approximate since we can't get exact count from INSERT)
    SELECT COUNT(*) INTO inserted_count
    FROM users u
    LEFT JOIN referrals r ON u.id = r.referred_id
    WHERE u.sponsor_id IS NOT NULL
    AND r.id IS NULL
    AND u.id != u.sponsor_id;

    -- Get count of updated records
    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RAISE NOTICE 'Referral records migration completed. Approximately % records may have been inserted, % records updated.', inserted_count, updated_count;
END $$;