-- Setup Social Tasks System
-- This script creates the necessary database functions and tables for the social tasks system
-- Run this in your Supabase SQL editor

-- Drop and recreate tasks table to ensure proper structure
DROP TABLE IF EXISTS tasks CASCADE;

-- Create tasks table with proper structure
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward NUMERIC(18,8) NOT NULL,
    reward_type TEXT NOT NULL,
    difficulty TEXT,
    status TEXT DEFAULT 'ACTIVE',
    requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default social tasks
INSERT INTO tasks (id, title, description, reward, reward_type, difficulty, status, requirements) VALUES
(1, 'Join TAPPS Telegram Group', 'Join our vibrant community and stay updated with the latest news!', 10000, 'TAPPS', 'EASY', 'ACTIVE', '{"platform": "telegram", "action": "join", "link": "https://t.me/TAPPs_Chat"}'),
(2, 'Join TAPPS Telegram Channel', 'Stay connected with official announcements and updates!', 10000, 'TAPPS', 'EASY', 'ACTIVE', '{"platform": "telegram", "action": "join", "link": "https://t.me/TAPPs_News"}'),
(3, 'Follow TAPPS on X/Twitter', 'Follow us on X for the latest news, updates, and community discussions!', 15000, 'TAPPS', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "follow", "link": "https://x.com/TAPP_Whale"}'),
(4, 'Like TAPPS Whale Facebook Page', 'Show your support by liking our Facebook page and joining our community!', 10000, 'TAPPS', 'EASY', 'ACTIVE', '{"platform": "facebook", "action": "like", "link": "https://web.facebook.com/TAPPsWeb3"}'),
(5, 'Join TAPPS Discord Server', 'Connect with fellow TAPPS community members on Discord!', 12000, 'TAPPS', 'EASY', 'ACTIVE', '{"platform": "discord", "action": "join", "link": "https://discord.gg/tapps"}');

-- Create function to increment SBT balance (airdrop balance)
CREATE OR REPLACE FUNCTION increment_sbt(
    user_id BIGINT,
    amount NUMERIC
) RETURNS void AS $$
BEGIN
    UPDATE users 
    SET total_sbt = COALESCE(total_sbt, 0) + amount
    WHERE id = user_id;
    
    -- Log success (earning_logs table doesn't exist, so we skip logging)
    RAISE NOTICE 'Successfully added % SBT to user %', amount, user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's social task statistics
CREATE OR REPLACE FUNCTION get_user_social_stats(p_user_id BIGINT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_tasks_completed', COUNT(*),
        'total_rewards_earned', COALESCE(SUM(t.reward), 0),
        'completed_tasks', json_agg(
            json_build_object(
                'task_id', ct.task_id,
                'title', t.title,
                'reward', t.reward,
                'completed_at', ct.completed_at
            )
        )
    ) INTO result
    FROM completed_tasks ct
    JOIN tasks t ON ct.task_id = t.id
    WHERE ct.user_id = p_user_id AND ct.status = 'COMPLETED';
    
    RETURN COALESCE(result, json_build_object(
        'total_tasks_completed', 0,
        'total_rewards_earned', 0,
        'completed_tasks', json_build_array()
    ));
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can claim social task reward
CREATE OR REPLACE FUNCTION can_claim_social_task(
    p_user_id BIGINT,
    p_task_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    task_exists BOOLEAN;
    already_completed BOOLEAN;
BEGIN
    -- Check if task exists and is active
    SELECT EXISTS(
        SELECT 1 FROM tasks 
        WHERE id = p_task_id AND status = 'ACTIVE'
    ) INTO task_exists;
    
    IF NOT task_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user already completed this task
    SELECT EXISTS(
        SELECT 1 FROM completed_tasks 
        WHERE user_id = p_user_id AND task_id = p_task_id
    ) INTO already_completed;
    
    RETURN NOT already_completed;
END;
$$ LANGUAGE plpgsql;

-- Create function to complete social task
CREATE OR REPLACE FUNCTION complete_social_task(
    p_user_id BIGINT,
    p_task_id BIGINT
) RETURNS JSON AS $$
DECLARE
    task_reward NUMERIC;
    result JSON;
BEGIN
    -- Get task reward
    SELECT reward INTO task_reward
    FROM tasks
    WHERE id = p_task_id AND status = 'ACTIVE';
    
    IF task_reward IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Task not found or inactive');
    END IF;
    
    -- Check if already completed
    IF EXISTS(
        SELECT 1 FROM completed_tasks 
        WHERE user_id = p_user_id AND task_id = p_task_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Task already completed');
    END IF;
    
    -- Insert completed task
    INSERT INTO completed_tasks (user_id, task_id, completed_at, status, reward_claimed)
    VALUES (p_user_id, p_task_id, CURRENT_TIMESTAMP, 'COMPLETED', true);
    
    -- Update user's SBT balance
    PERFORM increment_sbt(p_user_id, task_reward);
    
    -- Return success
    RETURN json_build_object(
        'success', true, 
        'reward', task_reward,
        'message', 'Task completed successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_completed_tasks_user_id ON completed_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_task_id ON completed_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_status ON completed_tasks(status);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_task_completion ON completed_tasks(user_id, task_id);

-- Create view for social task leaderboard
CREATE OR REPLACE VIEW social_task_leaderboard AS
SELECT 
    u.id,
    u.username,
    u.telegram_id,
    COUNT(ct.id) as tasks_completed,
    COALESCE(SUM(t.reward), 0) as total_rewards,
    MAX(ct.completed_at) as last_task_completed
FROM users u
LEFT JOIN completed_tasks ct ON u.id = ct.user_id AND ct.status = 'COMPLETED'
LEFT JOIN tasks t ON ct.task_id = t.id
GROUP BY u.id, u.username, u.telegram_id
HAVING COUNT(ct.id) > 0
ORDER BY tasks_completed DESC, total_rewards DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Social Tasks System has been successfully set up!';
    RAISE NOTICE 'Created tasks table with 5 default social tasks.';
    RAISE NOTICE 'Created functions: increment_sbt, get_user_social_stats, can_claim_social_task, complete_social_task';
    RAISE NOTICE 'Created indexes for optimal performance.';
    RAISE NOTICE 'Created social_task_leaderboard view.';
    RAISE NOTICE 'The SocialTasks component should now work properly with database persistence.';
END
$$;
