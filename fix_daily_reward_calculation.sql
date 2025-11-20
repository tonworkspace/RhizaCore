-- Fix Daily Reward Status Function
-- This fixes the next_reward_amount calculation to properly account for streak continuation or reset

CREATE OR REPLACE FUNCTION get_daily_reward_status(
    p_user_id BIGINT
) RETURNS JSON AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    last_claim_date DATE;
    streak_record RECORD;
    can_claim BOOLEAN := false;
    next_claim_time TIMESTAMP;
    current_streak INTEGER := 0;
    longest_streak INTEGER := 0;
    total_days INTEGER := 0;
    next_streak INTEGER := 1; -- Default to 1 for new users
    next_reward NUMERIC(18,8);
    result JSON;
BEGIN
    -- Get streak record
    SELECT * INTO streak_record 
    FROM daily_reward_streaks 
    WHERE user_id = p_user_id;
    
    IF FOUND THEN
        current_streak := streak_record.current_streak;
        longest_streak := streak_record.longest_streak;
        total_days := streak_record.total_days_claimed;
        last_claim_date := streak_record.last_claim_date;
        
        -- Calculate what the streak will be after claiming
        -- If last claim was yesterday, continue streak; otherwise reset to 1
        IF last_claim_date IS NULL OR last_claim_date = today_date - INTERVAL '1 day' THEN
            next_streak := current_streak + 1;
        ELSE
            next_streak := 1; -- Streak broken, will reset to 1
        END IF;
    END IF;
    
    -- Check if user can claim today
    IF NOT EXISTS (
        SELECT 1 FROM daily_rewards 
        WHERE user_id = p_user_id AND claim_date = today_date
    ) THEN
        can_claim := true;
        next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
    ELSE
        -- Already claimed today, next claim is tomorrow
        next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
        -- If already claimed, next reward will be based on continuing streak
        IF FOUND AND last_claim_date = today_date THEN
            next_streak := current_streak + 1;
        END IF;
    END IF;
    
    -- Calculate the reward amount for the next claim
    next_reward := calculate_daily_reward(p_user_id, next_streak);
    
    RETURN json_build_object(
        'can_claim', can_claim,
        'current_streak', current_streak,
        'longest_streak', longest_streak,
        'total_days_claimed', total_days,
        'next_claim_time', next_claim_time,
        'last_claim_date', last_claim_date,
        'next_reward_amount', next_reward
    );
END;
$$ LANGUAGE plpgsql;

