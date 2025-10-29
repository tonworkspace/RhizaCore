# Improved Free Mining Period System

## Overview

The free mining period system has been completely redesigned to provide a proper 100-day trial period for all users (both new and existing) with enhanced features and better user experience.

## Key Improvements

### 1. **Proper 100-Day Period**
- **New Users**: Get exactly 100 days from their account creation date
- **Existing Users**: Get 100 days from the system upgrade date (whichever is later)
- **Consistent**: All users now have the same 100-day period regardless of when they joined

### 2. **Dual-Limit System**
- **Time Limit**: 100 days from start date
- **Session Limit**: 100 mining sessions maximum
- **Whichever expires first** determines when free mining ends

### 3. **Grace Period**
- **7-day grace period** after the free period expires
- Users can still mine during grace period but with limited functionality
- Provides smooth transition to paid mining

### 4. **Enhanced Database Storage**
- Proper `free_mining_periods` table with all necessary fields
- Database functions handle all calculations
- Better performance and reliability

### 5. **Improved UI Display**
- Shows both **days remaining** and **sessions remaining**
- Clear indication of grace period status
- Better visual feedback for different states

## Database Schema

```sql
CREATE TABLE free_mining_periods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sessions_used INTEGER DEFAULT 0,
    max_sessions INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    grace_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

## Key Functions

### 1. `initialize_or_update_free_mining_period(user_id)`
- Initializes or updates free mining period for any user
- Ensures 100-day period from user creation or current date
- Sets up grace period automatically

### 2. `get_free_mining_status(user_id)`
- Returns comprehensive status including:
  - Days remaining
  - Sessions remaining
  - Grace period status
  - Mining eligibility
  - Reason for any restrictions

### 3. `can_user_mine_free(user_id)`
- Checks if user can mine considering both time and session limits
- Returns detailed eligibility information

### 4. `increment_mining_session_count(user_id)`
- Increments session count when mining starts
- Handles all edge cases automatically

## User Experience Flow

### Phase 1: Free Mining Period (0-100 days)
- **Status**: "FREE MINING PERIOD"
- **Color**: Green
- **Features**: Full mining capabilities
- **Sessions**: Up to 100 sessions
- **Time**: Up to 100 days

### Phase 2: Grace Period (100-107 days)
- **Status**: "GRACE PERIOD"
- **Color**: Yellow
- **Features**: Limited mining capabilities
- **Message**: "Limited mining available - stake TON for full access"
- **Duration**: 7 days after free period ends

### Phase 3: Paid Mining Required (107+ days)
- **Status**: Mining disabled
- **Message**: "Free mining period has expired. Please stake TON to continue mining."
- **Action**: User must stake TON to continue mining

## Session Counting

- Each `mining_start` activity counts as one session
- Sessions are tracked in the database, not just activities table
- Session count is incremented automatically when mining starts
- Both time and session limits are enforced

## Migration Strategy

### For Existing Users
1. Run the SQL migration script
2. All existing users get 100 days from their account creation date
3. If account is older than 100 days, they get 100 days from migration date
4. Grace period is automatically calculated

### For New Users
1. Free mining period is initialized on first login
2. 100 days from account creation
3. 100 sessions maximum
4. Grace period automatically set

## Benefits

### For Users
- **Clear expectations**: Know exactly how long they can mine for free
- **Fair system**: Everyone gets the same 100-day period
- **Smooth transition**: Grace period prevents abrupt cutoff
- **Better UX**: Clear status indicators and messaging

### For Platform
- **Predictable costs**: Know exactly when users need to start paying
- **Better retention**: Grace period gives users time to decide
- **Cleaner code**: Database-driven instead of activity-based counting
- **Scalable**: Handles any number of users efficiently

## Implementation Files

1. **Database**: `improved_free_mining_system.sql`
2. **Backend**: `src/lib/supabaseClient.ts` (updated functions)
3. **Frontend**: `src/components/ArcadeMiningUI.tsx` (enhanced UI)

## Testing

### Test Cases
1. **New user**: Should get 100 days from account creation
2. **Existing user**: Should get 100 days from account creation or migration date
3. **Session limit**: Should stop mining after 100 sessions
4. **Time limit**: Should stop mining after 100 days
5. **Grace period**: Should allow limited mining for 7 days after expiry
6. **Edge cases**: Multiple sessions, timezone handling, etc.

### Verification
- Check `free_mining_periods` table for correct data
- Verify UI shows accurate information
- Test mining start/stop functionality
- Confirm grace period behavior

## Future Enhancements

1. **Dynamic grace period**: Could be extended based on user activity
2. **Session bonuses**: Extra sessions for referrals or activities
3. **Tiered limits**: Different limits based on user tier
4. **Analytics**: Track usage patterns and optimize limits

This improved system provides a much better foundation for the free mining period, ensuring fairness, clarity, and a smooth user experience.
