# Weekly Withdrawal System Implementation Guide

## Overview
The weekly withdrawal system allows users to withdraw their earned RZC tokens into TON only once every 7 days. This creates a sustainable withdrawal schedule that prevents excessive withdrawals while maintaining user engagement.

## Key Features

### 1. Weekly Cooldown Period
- Users can only withdraw once every 7 days
- Cooldown starts from the last withdrawal date
- Visual countdown timer shows time remaining until next withdrawal

### 2. Database Schema Changes
The following fields have been added to the `users` table:
- `last_weekly_withdrawal`: Timestamp of the last weekly withdrawal
- `weekly_withdrawal_count`: Number of withdrawals made in current week
- `total_weekly_withdrawn`: Total amount withdrawn in current week

### 3. Database Functions
- `can_make_weekly_withdrawal(user_id)`: Checks if user can make a withdrawal
- `get_next_withdrawal_date(user_id)`: Returns the next available withdrawal date
- `update_weekly_withdrawal_tracking(user_id, amount)`: Updates withdrawal tracking
- `reset_weekly_withdrawal_counters()`: Resets weekly counters (to be called weekly)

## Implementation Details

### Database Migration
Run the `weekly_withdrawal_system.sql` file to:
1. Add new columns to the users table
2. Create necessary indexes
3. Add database functions for withdrawal logic

### Frontend Components

#### WithdrawModal Updates
- Added weekly withdrawal status indicator
- Real-time countdown timer
- Visual feedback for withdrawal availability
- Disabled state when cooldown is active

#### Key Features:
- **Status Indicator**: Green when available, orange when on cooldown
- **Countdown Timer**: Shows exact time remaining (days, hours, minutes)
- **Next Withdrawal Date**: Displays the exact date and time when next withdrawal becomes available
- **Button State**: Disabled with appropriate messaging during cooldown

### API Functions

#### `checkWeeklyWithdrawalEligibility(userId)`
Returns:
- `canWithdraw`: Boolean indicating if withdrawal is allowed
- `nextWithdrawalDate`: Date when next withdrawal becomes available
- `daysUntilWithdrawal`: Number of days remaining

#### `processWeeklyWithdrawal(userId, amount, walletAddress)`
Handles the complete withdrawal process:
- Validates eligibility
- Checks minimum withdrawal amount
- Verifies sufficient balance
- Creates withdrawal record
- Updates weekly tracking

## User Experience

### Withdrawal Available State
- Green status indicator
- "Withdrawal Available" message
- Active withdrawal button
- Information about 7-day cooldown after withdrawal

### Cooldown Active State
- Orange status indicator
- "Weekly Cooldown Active" message
- Real-time countdown timer
- Exact next withdrawal date and time
- Disabled withdrawal button with cooldown message

## Technical Implementation

### State Management
```typescript
const [canWithdraw, setCanWithdraw] = useState(false);
const [nextWithdrawalDate, setNextWithdrawalDate] = useState<Date | null>(null);
const [timeUntilWithdrawal, setTimeUntilWithdrawal] = useState('');
```

### Real-time Updates
- Countdown timer updates every minute
- Automatic eligibility check when modal opens
- Real-time status updates

### Validation Logic
1. Check if 7 days have passed since last withdrawal
2. Validate minimum withdrawal amount (1 RZC)
3. Verify sufficient available balance
4. Validate TON wallet address format

## Benefits

### For Users
- Clear withdrawal schedule
- Visual feedback on availability
- Transparent cooldown system
- Real-time countdown information

### For Platform
- Prevents excessive withdrawals
- Maintains sustainable tokenomics
- Encourages longer-term engagement
- Reduces withdrawal processing load

## Maintenance

### Weekly Reset (Optional)
The `reset_weekly_withdrawal_counters()` function can be called weekly to reset counters, though the system works without it as it tracks from the last withdrawal date.

### Monitoring
- Track withdrawal patterns
- Monitor cooldown compliance
- Analyze user behavior during cooldown periods

## Security Considerations

- All withdrawal validations happen server-side
- Database functions ensure data consistency
- RLS policies protect user data
- Input validation prevents malicious requests

## Future Enhancements

1. **Flexible Cooldown Periods**: Allow different cooldown periods for different user tiers
2. **Emergency Withdrawals**: Special cases for urgent withdrawals
3. **Withdrawal Limits**: Maximum withdrawal amounts per week
4. **Notification System**: Alert users when withdrawals become available
5. **Analytics Dashboard**: Track withdrawal patterns and user behavior

## Testing

### Test Cases
1. First-time withdrawal (no previous withdrawal)
2. Withdrawal after 7+ days
3. Attempted withdrawal during cooldown
4. Insufficient balance scenarios
5. Invalid wallet address handling
6. Database function error handling

### Manual Testing
1. Make a withdrawal
2. Verify cooldown is active
3. Wait for countdown timer
4. Attempt withdrawal during cooldown
5. Verify withdrawal becomes available after 7 days

## Deployment Checklist

- [ ] Run database migration (`weekly_withdrawal_system.sql`)
- [ ] Deploy updated WithdrawModal component
- [ ] Update supabaseClient with new functions
- [ ] Test withdrawal flow end-to-end
- [ ] Verify countdown timer functionality
- [ ] Test error handling scenarios
- [ ] Monitor initial user interactions

## Support

For issues or questions regarding the weekly withdrawal system:
1. Check database function logs
2. Verify user withdrawal history
3. Test eligibility functions
4. Review countdown timer accuracy
5. Validate withdrawal processing flow
