-- Update social tasks for RhizaCore platform
-- Replace RZC tasks with RhizaCore-specific tasks

-- First, clear completed_tasks to avoid foreign key conflicts
TRUNCATE TABLE completed_tasks RESTART IDENTITY CASCADE;

-- Then clear existing tasks
DELETE FROM tasks;

-- Insert RhizaCore social tasks matching the taskIdMap in SocialTasks.tsx
INSERT INTO tasks (id, title, description, reward, reward_type, difficulty, status, requirements) VALUES
(1, 'Join Telegram Channel', 'Stay connected with official announcements and updates!', 1000, 'RZC', 'EASY', 'ACTIVE', '{"platform": "telegram", "action": "join", "link": "https://t.me/RhizaCoreNews"}'),
(2, 'Join Telegram Discussion', 'Connect with fellow members! Join our Telegram community group for networking', 1000, 'RZC', 'EASY', 'ACTIVE', '{"platform": "telegram", "action": "join", "link": "https://t.me/RhizaCore"}'),
(3, 'Like Our Post on X', 'Show some love! Like our latest post on X (Twitter) and get rewarded', 1000, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "like", "link": "https://twitter.com/intent/like?tweet_id=1985258094247432273"}'),
(4, 'Share with Friends', 'Help us grow! Retweet our post to spread the word and earn rewards', 1000, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "retweet", "link": "https://twitter.com/intent/retweet?tweet_id=1985258094247432273"}'),
(5, 'Join the Conversation', 'Share your thoughts! Leave a comment on our post and get rewarded', 1000, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "comment", "link": "https://twitter.com/intent/tweet?in_reply_to=1985258094247432273"}'),
(6, 'Follow for Updates', 'Stay connected! Follow @RhizaCore for the latest news and updates', 1500, 'RZC', 'EASY', 'ACTIVE', '{"platform": "twitter", "action": "follow", "link": "https://x.com/RhizaCore"}'),
(7, 'Like Facebook Page', 'Show your support! Like our Facebook page and join our community', 1000, 'RZC', 'EASY', 'ACTIVE', '{"platform": "facebook", "action": "like", "link": "https://web.facebook.com/RhizaCore"}');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Social Tasks have been updated for RhizaCore!';
    RAISE NOTICE 'Created 7 social tasks matching the SocialTasks component.';
    RAISE NOTICE 'Completed tasks table has been reset.';
END
$$;