-- Function to get user rank by total_earned
CREATE OR REPLACE FUNCTION get_user_rank(user_id BIGINT)
RETURNS TABLE (
    rank BIGINT,
    username VARCHAR,
    total_earned NUMERIC,
    available_balance NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            u.id,
            u.username,
            u.total_earned,
            u.available_balance,
            u.created_at,
            ROW_NUMBER() OVER (ORDER BY u.total_earned DESC, u.created_at ASC) as user_rank
        FROM users u
        WHERE u.total_earned > 0
    )
    SELECT 
        ru.user_rank as rank,
        ru.username,
        ru.total_earned,
        ru.available_balance,
        ru.created_at
    FROM ranked_users ru
    WHERE ru.id = user_id;
END;
$$ LANGUAGE plpgsql;