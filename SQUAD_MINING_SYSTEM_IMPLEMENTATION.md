# Squad Mining System Implementation

## Overview
The Squad Mining System transforms the traditional referral system into a time-based reward claiming mechanism where users earn RZC tokens based on their squad size (active referrals) every 8 hours.

## Key Features

### 🕐 Time-Based Claims
- Users can claim rewards every **8 hours**
- Cooldown period prevents spam and creates sustainable reward distribution
- Real-time countdown timer shows when next claim is available

### 👥 Squad-Based Rewards
- **25 RZC** per standard squad member per claim
- **50 RZC** per premium squad member per claim
- Only active referrals count towards squad size
- Rewards scale linearly with squad size

### 📊 Comprehensive Statistics
- Current squad size
- Potential reward per claim
- Total rewards earned
- Claim history tracking
- Hours until next claim

## Database Schema

### New Tables

#### `squad_mining_claims`
```sql
- id: Primary key
- user_id: Reference to users table
- squad_size: Number of squad members at claim time
- reward_amount: RZC amount claimed
- claimed_at: Timestamp of claim
- transaction_id: Unique transaction identifier
```

### New User Columns
```sql
- last_squad_claim_at: Timestamp of last claim
- total_squad_rewards: Cumulative RZC earned from squad mining
- squad_mining_rate: Customizable RZC per squad member (default: 25)
```

## Core Functions

### `get_user_squad_size(user_id)`
- Counts active referrals for a user
- Only includes users with `is_active = true`
- Returns integer count

### `can_claim_squad_rewards(user_id)`
- Checks if 8 hours have passed since last claim
- Returns boolean
- Handles first-time claimers (always true)

### `calculate_squad_reward(user_id)`
- Calculates potential reward based on squad size
- Uses user's custom mining rate or default (25 RZC)
- Returns decimal amount

### `claim_squad_mining_rewards(user_id, transaction_id)`
- Validates claim eligibility
- Records claim in history
- Updates user balance and statistics
- Returns success/error result

### `get_squad_mining_stats(user_id)`
- Comprehensive statistics for dashboard
- Includes all relevant metrics
- Calculates time until next claim

## UI Components

### Squad Mining Dashboard
- **Header**: "Squad Mining" with 8-hour claim explanation
- **Stats Cards**: Squad size, per-claim reward, total earned
- **Claim Button**: 
  - Shows countdown when on cooldown
  - Displays claimable amount when ready
  - Disabled when no squad members
- **Squad Members List**: Shows all active referrals with premium indicators

### Real-Time Updates
- Timer updates every minute
- Real-time subscription to referral changes
- Automatic data refresh after claims

## Service Layer

### `SquadMiningService`
- Centralized business logic
- Error handling and validation
- Time calculations and formatting
- Transaction ID generation

## Security Features

### Row Level Security (RLS)
- Users can only see their own claims
- Secure function execution
- Protected against unauthorized access

### Transaction Idempotency
- Unique transaction IDs prevent duplicate claims
- Database constraints ensure data integrity

## Benefits Over Traditional Referral System

### 🎯 Predictable Rewards
- Fixed amounts per squad member
- Regular claiming schedule
- No dependency on referral activity

### ⚡ Immediate Gratification
- Claims available every 8 hours
- Instant reward calculation
- Clear progression tracking

### 🔄 Sustainable Economics
- Controlled reward distribution
- Prevents reward inflation
- Encourages consistent engagement

### 📈 Growth Incentives
- Direct correlation between squad size and rewards
- Premium member bonuses encourage quality referrals
- Long-term engagement through regular claims

## Implementation Steps

1. **Database Setup**
   ```bash
   # Run the schema migration
   psql -f create_squad_mining_system.sql
   ```

2. **Service Integration**
   - Import `SquadMiningService` in components
   - Replace referral logic with squad mining logic

3. **UI Updates**
   - Update component from `ReferralSystem` to `SquadMiningSystem`
   - Add claim button and timer
   - Update messaging and branding

4. **Testing**
   ```bash
   # Run the test suite
   node test-squad-mining-system.js
   ```

## Configuration Options

### Customizable Parameters
- **Claim Interval**: Currently 8 hours (configurable)
- **Base Reward Rate**: 25 RZC per member (user-customizable)
- **Premium Multiplier**: 2x for premium members
- **Maximum Squad Size**: No limit (can be added if needed)

### Admin Controls
- Adjust global mining rates
- Monitor claim patterns
- Analyze reward distribution

## Migration from Referral System

### Data Preservation
- Existing referrals remain intact
- No data loss during transition
- Backward compatibility maintained

### User Communication
- Clear explanation of new system
- Benefits highlighted in UI
- Smooth transition experience

## Future Enhancements

### Potential Features
- **Squad Tiers**: Bonus multipliers for large squads
- **Achievement System**: Rewards for milestones
- **Leaderboards**: Competition between squads
- **Special Events**: Temporary bonus periods
- **Squad Challenges**: Collaborative goals

### Analytics Integration
- Claim frequency tracking
- Squad growth metrics
- Reward distribution analysis
- User engagement patterns

## Conclusion

The Squad Mining System provides a more engaging, predictable, and sustainable approach to referral rewards. By implementing time-based claims with squad-size scaling, users have clear incentives to grow their network while maintaining regular engagement with the platform.

The system is designed to be scalable, secure, and user-friendly, providing immediate value while encouraging long-term growth and retention.