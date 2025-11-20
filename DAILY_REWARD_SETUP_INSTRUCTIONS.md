# Daily Reward System Setup Instructions

## Error: `relation "daily_reward_streaks" does not exist`

This error occurs because the daily reward system tables haven't been created in your Supabase database yet.

## Quick Fix

### Step 1: Run the Setup SQL Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `setup_daily_reward_system_complete.sql`
5. Click **Run** to execute the script

### Step 2: Verify Setup

After running the script, you should see:
- ✅ All tables created successfully
- ✅ All functions created successfully
- ✅ All indexes created successfully

## What Gets Created

### Tables
- `daily_rewards` - Tracks daily reward claims
- `daily_reward_streaks` - Tracks user streaks
- `twitter_engagement_tasks` - For future Twitter engagement features
- `earning_logs` - Logs all reward transactions

### Functions
- `get_daily_reward_status(p_user_id)` - Gets current reward status
- `claim_daily_reward(p_user_id)` - Claims the daily reward
- `calculate_daily_reward(p_user_id, p_streak_count)` - Calculates reward amount

### Indexes
- Performance indexes on all key columns

## After Setup

Once the tables are created:
1. The error will disappear
2. Users can start claiming daily rewards
3. Streaks will be tracked automatically
4. Rewards will be added to `users.total_sbt`

## Troubleshooting

If you still see errors after running the script:

1. **Check if tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'daily%';
   ```

2. **Check if functions exist:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%daily%';
   ```

3. **Verify user permissions:**
   - Make sure you're running the script as a database admin
   - Check that RLS policies allow the operations

## Notes

- The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times
- All foreign keys reference the `users` table
- The system automatically handles new users (creates streak records on first claim)

