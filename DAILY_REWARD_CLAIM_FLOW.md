# Daily Reward Claim Flow - Complete Guide

## Overview
The daily reward claim flow has been improved to ensure correctness, data consistency, and proper user feedback.

## Claim Flow Steps

### Frontend Flow (DailyRewardCard.tsx)

1. **Pre-claim Validation**
   - Check if `userId` exists
   - Check if already claiming (`isClaiming`)
   - Check if user can claim (`rewardStatus?.can_claim`)

2. **Call Database Function**
   - Call `claim_daily_reward` RPC function
   - Handle errors immediately with user feedback

3. **Parse Response**
   - Handle JSON response (string or object)
   - Validate response structure

4. **On Success - Execute in Order:**
   - **Step 1**: Show celebration animation (confetti)
   - **Step 2**: Trigger reward callback (updates balance in parent component)
   - **Step 3**: Optimistically update UI with server response data
   - **Step 4**: Show success message to user
   - **Step 5**: Refresh status from server (ensures UI matches database)
   - **Step 6**: Update user's `last_update` timestamp (non-blocking)

### Database Flow (claim_daily_reward function)

1. **Check for Duplicate Claims**
   - Verify user hasn't already claimed today
   - Return error if already claimed

2. **Get or Create Streak Record**
   - Fetch existing streak record
   - Create new record if user is new

3. **Calculate Streak**
   - If last claim was yesterday: Continue streak (increment)
   - If last claim was earlier: Reset streak to 1
   - Update `longest_streak` if needed

4. **Calculate Reward**
   - Base reward: 1000 RZC
   - Apply multiplier based on streak:
     - Days 1-7: 1.0x (1,000 RZC)
     - Days 8-14: 1.5x (1,500 RZC)
     - Days 15-21: 2.0x (2,000 RZC)
     - Days 22-28: 2.5x (2,500 RZC)
     - Days 29+: 3.0x (3,000 RZC)

5. **Record Claim**
   - Insert into `daily_rewards` table
   - Update `daily_reward_streaks` table

6. **Update User Balance**
   - Add reward to `users.total_sbt`
   - Update `users.last_active` timestamp

7. **Log Transaction**
   - Insert into `earning_logs` table
   - Include metadata (streak, multiplier, etc.)

8. **Return Response**
   - Success status
   - Reward amount
   - New streak count
   - Next claim time

## Data Consistency

### Atomic Operations
All database operations happen within a single transaction:
- Streak update
- Reward calculation
- Balance update
- Logging

### Error Handling
- Database function includes exception handling
- Frontend handles all error cases gracefully
- User always receives feedback

### Status Synchronization
- Optimistic update for immediate UI feedback
- Server refresh ensures accuracy
- Refresh failures don't block success message

## Key Improvements

1. **Proper Sequencing**
   - Reward callback triggered before UI update
   - Status refresh happens after optimistic update
   - Non-critical operations don't block user feedback

2. **Error Recovery**
   - Claim success is never blocked by refresh failures
   - All errors are logged but don't interrupt flow
   - User always sees appropriate feedback

3. **Data Accuracy**
   - Optimistic update uses server response data
   - Server refresh ensures final accuracy
   - Next claim time and reward amount always correct

4. **User Experience**
   - Immediate celebration animation
   - Clear success/error messages
   - Accurate countdown timer
   - Proper streak display

## Testing Checklist

- [ ] New user can claim first reward
- [ ] Streak continues correctly when claimed daily
- [ ] Streak resets when a day is missed
- [ ] Reward amount increases with streak
- [ ] Cannot claim twice in same day
- [ ] Balance updates correctly
- [ ] Status refreshes after claim
- [ ] Countdown timer works correctly
- [ ] Error messages display properly
- [ ] Celebration animation shows

## SQL Updates Required

Run `fix_claim_daily_reward_flow.sql` to update the database function with:
- Better error handling
- COALESCE for null balance handling
- More detailed response data
- Exception handling

## Notes

- The `last_update` timestamp update is non-blocking and won't affect the claim flow if it fails
- Status refresh ensures the UI matches the database state exactly
- All operations are designed to be idempotent where possible

