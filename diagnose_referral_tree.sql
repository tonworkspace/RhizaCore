-- Diagnostic queries to check referral tree data

-- Check if users have sponsor_id set
SELECT
    id,
    telegram_id,
    username,
    sponsor_id,
    referrer_id,
    created_at
FROM users
WHERE sponsor_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check referral records
SELECT
    r.id,
    r.sponsor_id,
    r.referred_id,
    r.status,
    r.created_at,
    s.username as sponsor_username,
    ref.username as referred_username
FROM referrals r
LEFT JOIN users s ON r.sponsor_id = s.id
LEFT JOIN users ref ON r.referred_id = ref.id
ORDER BY r.created_at DESC
LIMIT 20;

-- Check users without referral records but with sponsor_id
SELECT
    u.id,
    u.telegram_id,
    u.username,
    u.sponsor_id,
    u.created_at,
    s.username as sponsor_username
FROM users u
LEFT JOIN referrals r ON u.id = r.referred_id
LEFT JOIN users s ON u.sponsor_id = s.id
WHERE u.sponsor_id IS NOT NULL
AND r.id IS NULL
ORDER BY u.created_at DESC;

-- Check users with referral records
SELECT
    u.id,
    u.telegram_id,
    u.username,
    u.sponsor_id,
    r.sponsor_id as referral_sponsor_id,
    r.status,
    s.username as sponsor_username
FROM users u
LEFT JOIN referrals r ON u.id = r.referred_id
LEFT JOIN users s ON COALESCE(u.sponsor_id, r.sponsor_id) = s.id
WHERE u.sponsor_id IS NOT NULL OR r.id IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 20;