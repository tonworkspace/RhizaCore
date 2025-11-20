-- Fix Daily Reward Claim Flow
-- This ensures the claim_daily_reward function handles all edge cases correctly
-- and maintains data consistency

CREATE OR REPLACE FUNCTION claim_daily_reward(
    p_user_id BIGINT
) RETURNS JSON AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    last_claim_date DATE;
    current_streak INTEGER := 0;
    streak_record RECORD;
    reward_amount NUMERIC(18,8) := 1000; -- Base reward
    total_reward NUMERIC(18,8);
    multiplier NUMERIC(3,2);
    next_claim_time TIMESTAMP;
    result JSON;
BEGIN
    -- Step 1: Check if user already claimed today (prevent double claims)
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
    
    -- Step 2: Get or create streak record
    SELECT * INTO streak_record 
    FROM daily_reward_streaks 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- New user - create streak record with day 1
        INSERT INTO daily_reward_streaks (
            user_id, 
            current_streak, 
            longest_streak, 
            last_claim_date, 
            streak_start_date, 
            total_days_claimed
        )
        VALUES (p_user_id, 1, 1, today_date, today_date, 1);
        current_streak := 1;
        last_claim_date := NULL;
    ELSE
        -- Existing user - check if streak continues or resets
        last_claim_date := streak_record.last_claim_date;
        
        -- Check if streak should continue or reset
        IF last_claim_date IS NULL OR last_claim_date = today_date - INTERVAL '1 day' THEN
            -- Continue streak (claimed yesterday or never claimed before)
            current_streak := streak_record.current_streak + 1;
            
            -- Update streak record
            UPDATE daily_reward_streaks 
            SET 
                current_streak = current_streak,
                longest_streak = GREATEST(longest_streak, current_streak),
                last_claim_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        ELSE
            -- Reset streak (missed a day or more)
            current_streak := 1;
            
            UPDATE daily_reward_streaks 
            SET 
                current_streak = 1,
                longest_streak = GREATEST(longest_streak, 1), -- Don't decrease longest_streak
                last_claim_date = today_date,
                streak_start_date = today_date,
                total_days_claimed = total_days_claimed + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Step 3: Calculate reward amount based on current streak
    total_reward := calculate_daily_reward(p_user_id, current_streak);
    
    -- Step 4: Calculate multiplier for display
    IF current_streak <= 7 THEN
        multiplier := 1.0;
    ELSIF current_streak <= 14 THEN
        multiplier := 1.5;
    ELSIF current_streak <= 21 THEN
        multiplier := 2.0;
    ELSIF current_streak <= 28 THEN
        multiplier := 2.5;
    ELSE
        multiplier := 3.0; -- 30+ days
    END IF;
    
    -- Step 5: Record the claim in daily_rewards table
    INSERT INTO daily_rewards (
        user_id, 
        claim_date, 
        reward_amount, 
        streak_count, 
        bonus_multiplier, 
        total_reward
    )
    VALUES (
        p_user_id, 
        today_date, 
        reward_amount, 
        current_streak, 
        multiplier, 
        total_reward
    );
    
    -- Step 6: Add reward to user's airdrop balance (total_sbt)
    UPDATE users 
    SET 
        total_sbt = COALESCE(total_sbt, 0) + total_reward,
        last_active = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Step 7: Record in earning logs for tracking
    INSERT INTO earning_logs (user_id, type, amount, metadata)
    VALUES (
        p_user_id, 
        'daily_reward', 
        total_reward, 
        json_build_object(
            'streak_count', current_streak,
            'multiplier', multiplier,
            'base_reward', reward_amount,
            'claim_date', today_date
        )
    );
    
    -- Step 8: Calculate next claim time (24 hours from now)
    next_claim_time := (today_date + INTERVAL '1 day')::timestamp;
    
    -- Step 9: Return success response with all relevant data
    RETURN json_build_object(
        'success', true,
        'message', 'Daily reward claimed successfully!',
        'reward_amount', total_reward,
        'streak_count', current_streak,
        'multiplier', multiplier,
        'next_claim_time', next_claim_time,
        'base_reward', reward_amount
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Handle any unexpected errors
        RETURN json_build_object(
            'success', false,
            'message', 'An error occurred while claiming the daily reward. Please try again.',
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

