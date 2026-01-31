# Squad Mining Airdrop Integration Summary

## Overview
Squad mining rewards now go directly to users' airdrop balances instead of regular RZC balances. This integration ensures that squad mining rewards are properly tracked and can be managed through the airdrop system.

## Key Changes Made

### 1. Database Integration (Already Configured)
- **SQL Function**: `claim_squad_mining_rewards` in `create_squad_mining_system_corrected.sql`
- **Target Table**: `airdrop_balances` instead of regular user balance
- **Reward Rates**: Reduced from 25/50 to 2/5 RZC per member per claim

### 2. Frontend Updates (ReferralSystem.tsx)
- **Success Message**: Updated to indicate rewards go to "airdrop balance"
- **Description Text**: Clarified that rewards go to airdrop balance
- **Refresh Integration**: Added `refreshAirdropBalance()` callback
- **TypeScript**: Added proper window interface declarations

### 3. Service Integration (SquadMiningService.ts)
- **Activity Recording**: Records `squad_mining_claim` activities
- **Airdrop Metadata**: Includes claim type as 'airdrop_balance'
- **Error Handling**: Proper error handling for airdrop balance operations

## How It Works

### Claim Process
1. User clicks "Claim Squad Rewards" button
2. `squadMiningService.claimSquadRewards()` is called
3. Backend `claim_squad_mining_rewards` function executes:
   - Validates user can claim (8-hour cooldown)
   - Calculates reward based on squad size
   - **Adds rewards to `airdrop_balances` table**
   - Records claim in `squad_mining_claims` table
   - Updates user's last claim timestamp

### Database Flow
```sql
-- Rewards go to airdrop_balances table
INSERT INTO airdrop_balances (
    user_id,
    available_balance,
    total_claimed_to_airdrop,
    last_updated
) VALUES (
    user_id_param,
    reward_amount,
    reward_amount,
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    available_balance = COALESCE(airdrop_balances.available_balance, 0) + reward_amount,
    total_claimed_to_airdrop = COALESCE(airdrop_balances.total_claimed_to_airdrop, 0) + reward_amount,
    last_updated = NOW();
```

## Reward Structure
- **Regular Squad Members**: 2 RZC per claim (every 8 hours)
- **Premium Squad Members**: 5 RZC per claim (every 8 hours)
- **Cooldown Period**: 8 hours between claims
- **Target Balance**: Airdrop balance (not regular RZC balance)

## Benefits
1. **Unified Token Management**: All earned RZC goes through airdrop system
2. **Better Tracking**: Clear separation between different reward types
3. **Future Compatibility**: Ready for token distribution and staking features
4. **Security**: Leverages existing airdrop balance security measures

## Testing
- Created `test-squad-mining-airdrop-integration.js` for verification
- Tests claim process, balance updates, and activity recording
- Verifies rewards go to correct airdrop balance table

## User Experience
- Users see clear messaging that rewards go to "airdrop balance"
- Consistent with other reward systems in the platform
- Proper refresh callbacks ensure UI updates correctly
- Maintains 8-hour claim cooldown for sustainability

## Next Steps
1. Run the test script to verify integration
2. Monitor airdrop balance updates in production
3. Ensure frontend airdrop balance display reflects squad mining rewards
4. Consider adding squad mining rewards to airdrop balance history/breakdown