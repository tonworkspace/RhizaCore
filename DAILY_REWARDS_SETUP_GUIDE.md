# Daily Rewards & Twitter Engagement System Setup Guide

## 🎁 Overview

This system adds two powerful engagement features to your RZC application:

1. **Daily Reward Card** - Users can claim free RZC every 24 hours with streak bonuses
2. **Twitter Engagement Tasks** - Users earn 10 RZC for each Twitter interaction (like, retweet, reply, follow)

## 🚀 Features

### Daily Reward System
- **24-hour cohwith countdown timers and progress tracking
- **Streak protection** - missing a day resets to 0

### Twitter Engagement System
- **4 engagement types**: Like, Retweet, Reply, Follow
- **10 RZC per engagement** (configurable)
- **One-time completion** per engagement type
- **Direct Twitter integration** with external links
- **Real-time reward claiming**

## 📋 Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the entire content from daily_rewards_system.sql
-- This creates all necessary tables, functions, and indexes
```

**Key Tables Created:**
- `daily_rewards` - Tracks daily reward claims
- `daily_reward_streaks` - Manages streak data
- `twitter_engagement_tasks` - Records Twitter interactions
- `tasks` - Updated with new engagement tasks

### 2. Component Integration

The components are already integrated into your main app:

```typescript
// In src/pages/IndexPage/IndexPage.tsx
import DailyRewardCard from '@/components/DailyRewardCard';
import TwitterEngagementTask from '@/components/TwitterEngagementTask';
```

### 3. File Structure

```
src/
├── components/
│   ├── DailyRewardCard.tsx          # Daily reward claiming interface
│   ├── TwitterEngagementTask.tsx    # Twitter engagement tasks
│   └── ...
├── pages/IndexPage/
│   └── IndexPage.tsx                # Main app with integrated components
└── ...

daily_rewards_system.sql              # Database schema and functions
```

## 🎮 How It Works

### Daily Rewards Flow

1. **User visits Tasks tab** → Sees Daily Reward Card
2. **Checks claim status** → Can claim if 24+ hours passed
3. **Clicks "CLAIM DAILY REWARD"** → Earns RZC based on streak
4. **Streak continues** → Multiplier increases up to 3.0x
5. **Misses a day** → Streak resets to 0

### Twitter Engagement Flow

1. **User sees Twitter tasks** → 4 engagement options
2. **Clicks "Open Twitter"** → Opens Twitter in new tab
3. **Completes engagement** → Likes/retweets/replies/follows
4. **Returns to app** → Clicks "Claim Reward"
5. **Earns 10 RZC** → Task marked as completed

## 💰 Reward Structure

### Daily Rewards (Base: 1000 RZC)
- **Days 1-7**: 1.0x = 1,000 RZC
- **Days 8-14**: 1.5x = 1,500 RZC
- **Days 15-21**: 2.0x = 2,000 RZC
- **Days 22-28**: 2.5x = 2,500 RZC
- **Days 29+**: 3.0x = 3,000 RZC

### Twitter Engagement
- **Like Tweet**: 10 RZC
- **Retweet**: 10 RZC
- **Reply to Tweet**: 10 RZC
- **Follow Account**: 10 RZC
- **Total Possible**: 40 RZC per user

## 🎨 UI Features

### Daily Reward Card
- **Gift box icon** with pulsing claim indicator
- **Streak counter** with emoji progression (🌟 → ⚡ → 🔥 → 🔥🔥🔥)
- **Progress bar** showing 30-day challenge progress
- **Countdown timer** for next claim availability
- **Animated confetti** on successful claims
- **Fun motivational messages** based on streak level

### Twitter Engagement Tasks
- **Bird icon** with engagement type indicators
- **Progress tracking** (X/4 completed)
- **Color-coded buttons** for different engagement types
- **External link integration** to Twitter
- **Completion status** with timestamps
- **Animated success feedback**

## 🔧 Configuration

### Customize Rewards

Edit the reward amounts in the database functions:

```sql
-- In daily_rewards_system.sql
-- Change base daily reward (currently 1000 RZC)
base_reward NUMERIC(18,8) := 1000;

-- Change Twitter engagement reward (currently 10 RZC)
reward_amount NUMERIC(18,8) := 10;
```

### Customize Twitter Links

Update the Twitter URLs in `TwitterEngagementTask.tsx`:

```typescript
// Change to your actual Twitter account
tweet_url: 'https://x.com/YourTwitterHandle'
```

### Customize Streak Bonuses

Modify the multiplier logic in `calculate_daily_reward()` function:

```sql
-- Adjust streak thresholds and multipliers
IF p_streak_count <= 7 THEN
    multiplier := 1.0;
ELSIF p_streak_count <= 14 THEN
    multiplier := 1.5;
-- ... etc
```

## 📊 Database Functions

### Key Functions Created

1. **`claim_daily_reward(p_user_id)`**
   - Processes daily reward claim
   - Updates streak counter
   - Calculates bonus multiplier
   - Adds RZC to user balance

2. **`get_daily_reward_status(p_user_id)`**
   - Returns current streak info
   - Shows next claim time
   - Calculates next reward amount

3. **`complete_twitter_engagement(p_user_id, p_tweet_url, p_engagement_type)`**
   - Records Twitter interaction
   - Awards RZC tokens
   - Prevents duplicate claims

## 🚨 Important Notes

### Daily Rewards
- **24-hour cooldown** is enforced server-side
- **Streak resets** if user misses a day
- **Maximum multiplier** is 3.0x (30+ days)
- **Rewards go to airdrop balance** (total_sbt field)

### Twitter Engagement
- **One completion per engagement type** per user
- **Manual verification** - users must actually complete the action
- **External links** open in new tabs
- **No automatic verification** - relies on user honesty

### Security Considerations
- **Server-side validation** prevents cheating
- **Database constraints** prevent duplicate claims
- **Time-based restrictions** enforce cooldowns
- **User ID verification** ensures proper attribution

## 🎯 User Retention Benefits

### Daily Engagement
- **Habit formation** through daily rewards
- **FOMO effect** with streak bonuses
- **Gamification** with progress tracking
- **Social proof** through streak counters

### Twitter Growth
- **Organic promotion** through user engagement
- **Community building** via interactions
- **Viral potential** through retweets
- **Brand awareness** through follows

## 🔄 Maintenance

### Regular Tasks
- **Monitor streak abuse** (unlikely with 24h cooldown)
- **Update Twitter links** if account changes
- **Adjust reward amounts** based on tokenomics
- **Review engagement metrics** for optimization

### Scaling Considerations
- **Database indexes** are optimized for performance
- **Functions are cached** for efficiency
- **Minimal API calls** reduce server load
- **Client-side caching** improves UX

## 🎉 Success Metrics

Track these KPIs to measure success:

### Daily Rewards
- **Daily active users** claiming rewards
- **Average streak length** maintained
- **Retention rate** after 7, 14, 30 days
- **Peak streak achievements** (30+ days)

### Twitter Engagement
- **Engagement completion rate** (X/4 tasks)
- **Twitter follower growth** correlation
- **Social media reach** increase
- **Community interaction** quality

## 🚀 Future Enhancements

### Potential Additions
- **Referral bonuses** for daily rewards
- **Team streak challenges** for groups
- **Seasonal multipliers** for special events
- **NFT rewards** for milestone streaks
- **Leaderboards** for top performers

### Advanced Features
- **Push notifications** for claim reminders
- **Streak insurance** (premium feature)
- **Social sharing** of achievements
- **Integration with other platforms** (Discord, Telegram)

---

## 🎊 Conclusion

This system creates a powerful dual engagement mechanism that:
- **Increases daily retention** through streak bonuses
- **Drives social media growth** through Twitter engagement
- **Builds community** through gamified interactions
- **Generates organic promotion** through user actions

The professional, fun, and funny UI design ensures users enjoy the experience while maintaining the serious business value of increased engagement and retention.

**Ready to boost your user engagement? Run the database script and watch your community grow! 🚀**
