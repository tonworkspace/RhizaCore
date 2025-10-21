-- Fix for ambiguous column reference in daily reward function
-- This fixes the "column reference 'current_streak' is ambiguous" error

CREATE OR REPLACE FUNCTION claim_daily_reward(
    p_user_id BIGINT
) RETURNS JSON AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    last_claim_date DATE;
    new_streak_count INTEGER := 0;  -- Renamed to avoid ambiguity
    streak_record RECORD;
    reward_amount NUMERIC(18,8);
    total_reward NUMERIC(18,8);
    multiplier NUMERIC(3,2);
    result JSON;
BEGIN
    -- Check if user already claimed today
    IF EXISTS (
        SELECT 1 FROM daily_rewards 
        WHERE user_id = p_user_id AND claim_date = today_date
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Daily reward already claimed today!',
            'next_claim_time', (today_date + INTERVAL '1 day')::timestamp
        );
    END IF;
    
    -- Get or create streak record
    SELECT * INTO streak_record 
    FROM daily_reward_streaks 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create new streak record
        INSERT INTO daily_reward_streaks (user_id, current_streak, longest_streak, last_claim_date, streak_start_date, total_days_claimed)
        VALUES (p_user_id, 1, 1, today_date, today_date, 1);
        new_streak_count := 1;
        last_claim_date := NULL;
    ELSE
        last_claim_date := streak_record.last_claim_date;
        
        -- Check if streak should continue or reset
        IF last_claim_date IS NULL OR last_claim_date = today_date - INTERVAL '1 day' THEN
            -- Continue streak
            new_streak_count := streak_record.current_streak + 1;
            UPDATE daily_reward_streaks 
            SET 
                current_streak = new_streak_count,  -- Fixed: use new_streak_count variable
                longest_streak = GREATEST(longest_streak, new_streak_count),
                last_claim_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        ELSE
            -- Reset streak (missed a day)
            new_streak_count := 1;
            UPDATE daily_reward_streaks 
            SET 
                current_streak = 1,
                last_claim_date = today_date,
                streak_start_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Calculate reward amount
    total_reward := calculate_daily_reward(p_user_id, new_streak_count);
    
    -- Calculate multiplier for display
    IF new_streak_count <= 7 THEN
        multiplier := 1.0;
    ELSIF new_streak_count <= 14 THEN
        multiplier := 1.5;
    ELSIF new_streak_count <= 21 THEN
        multiplier := 2.0;
    ELSIF new_streak_count <= 28 THEN
        multiplier := 2.5;
    ELSE
        multiplier := 3.0;
    END IF;
    
    -- Record the claim
    INSERT INTO daily_rewards (user_id, claim_date, reward_amount, streak_count, bonus_multiplier, total_reward)
    VALUES (p_user_id, today_date, 1000, new_streak_count, multiplier, total_reward);
    
    -- Add reward to user's airdrop balance (SBT)
    UPDATE users 
    SET total_sbt = total_sbt + total_reward,
        last_active = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Record in earning logs
    INSERT INTO earning_logs (user_id, type, amount, metadata)
    VALUES (p_user_id, 'daily_reward', total_reward, json_build_object(
        'streak_count', new_streak_count,
        'multiplier', multiplier,
        'base_reward', 1000
    ));
    
    RETURN json_build_object(
        'success', true,
        'message', 'Daily reward claimed successfully!',
        'reward_amount', total_reward,
        'streak_count', new_streak_count,
        'multiplier', multiplier,
        'next_claim_time', (today_date + INTERVAL '1 day')::timestamp
    );
END;
$$ LANGUAGE plpgsql;
