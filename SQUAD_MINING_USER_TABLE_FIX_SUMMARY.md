# Squad Mining User Table Fix Summary

## Issue Analysis
The squad mining system was trying to insert rewards into an `airdrop_balances` table, but the application actually uses the `users` table's `available_balance` column for wallet balances. This caused the error:
```
column "last_updated" of relation "airdrop_balances" does not exist
```

## Root Cause
1. **Mixed Architecture**: The app uses both `users.available_balance` and a separate `airdrop_balances` table
2. **Squad Mining Mismatch**: Squad mining was configured for `airdrop_balances` but should use `users.available_balance`
3. **Column Name Error**: Even if using `airdrop_balances`, the column is `updated_at`, not `last_updated`

## Solution Applied

### 1. Updated Squad Mining SQL Functions
**File**: `create_squad_mining_system_corrected.sql` and `fix_squad_mining_airdrop_column.sql`

**Before** (trying to use airdrop_balances):
```sql
INSERT INTO airdrop_balances (
    user_id,
    available_balance,
    total_claimed_to_airdrop,
    last_updated  -- ❌ Wrong column name
) VALUES (...)
```

**After** (using users table):
```sql
UPDATE users 
SET 
    available_balance = COALESCE(available_balance, 0) + reward_amount,
    total_earned = COALESCE(total_earned, 0) + reward_amount,
    last_squad_claim_at = NOW(),
    total_squad_rewards = COALESCE(total_squad_rewards, 0) + reward_amount
WHERE id = user_id_param;
```

### 2. Updated Frontend Messages
**File**: `src/components/ReferralSystem.tsx`

- Changed "airdrop balance" back to "wallet" in success messages
- Updated descriptions to reflect rewards go to main wallet
- Simplified refresh callbacks to use `refreshWalletBalance()`

### 3. Created Migration Script
**File**: `ensure_users_table_squad_columns.sql`

Ensures the `users` table has all necessary columns:
- `available_balance` - Main wallet balance
- `total_earned` - Total RZC earned
- `last_squad_claim_at` - Last squad claim timestamp
- `total_squad_rewards` - Total squad rewards earned
- `squad_mining_rate` - RZC per squad member (default 2.0)

## Architecture Clarification

### Users Table (Primary Balance System)
```sql
users {
  available_balance: DECIMAL(20,8)  -- Main wallet balance ✅
  total_earned: DECIMAL(20,8)       -- Total RZC earned ✅
  last_squad_claim_at: TIMESTAMPTZ  -- Squad claim tracking ✅
  total_squad_rewards: DECIMAL(20,8) -- Squad rewards total ✅
}
```

### Airdrop Balances Table (Secondary/Advanced Features)
```sql
airdrop_balances {
  available_balance: DECIMAL(20,8)   -- Airdrop-specific balance
  total_claimed_to_airdrop: DECIMAL(20,8) -- Migrated from users
  staked_balance: DECIMAL(20,8)      -- Staked portion
  updated_at: TIMESTAMPTZ            -- ✅ Correct column name
}
```

## How It Works Now

### Squad Mining Flow
1. User clicks "Claim Squad Rewards"
2. `claim_squad_mining_rewards()` function executes
3. **Rewards added to `users.available_balance`** ✅
4. User's total earnings and squad stats updated
5. Frontend shows updated wallet balance

### Balance Migration Flow (Optional)
1. User can later migrate `users.available_balance` to `airdrop_balances`
2. This enables advanced features like staking and external withdrawals
3. Two-tier system: basic wallet → advanced airdrop features

## Files to Apply

### 1. Database Updates (Choose One)
- **New Setup**: Run `create_squad_mining_system_corrected.sql`
- **Existing Setup**: Run `fix_squad_mining_airdrop_column.sql`
- **Column Check**: Run `ensure_users_table_squad_columns.sql`

### 2. Frontend Updates (Already Applied)
- ✅ `src/components/ReferralSystem.tsx` - Updated messages and refresh calls

## Testing Steps

1. **Run Migration**:
   ```sql
   \i ensure_users_table_squad_columns.sql
   \i fix_squad_mining_airdrop_column.sql
   ```

2. **Test Squad Claim**:
   - User with squad members clicks "Claim Squad Rewards"
   - Should see success message: "Successfully claimed X RZC to your wallet"
   - Check `users.available_balance` increased by reward amount

3. **Verify Balance Display**:
   - Wallet UI should show updated balance
   - Squad mining stats should update correctly

## Benefits of This Fix

1. **Consistency**: Squad rewards use same balance system as other features
2. **Simplicity**: No complex airdrop table dependencies
3. **Compatibility**: Works with existing wallet UI components
4. **Flexibility**: Users can still migrate to airdrop system later if needed

## Future Considerations

- Keep both systems for flexibility
- Squad mining → `users.available_balance` (immediate)
- Advanced features → `airdrop_balances` (optional migration)
- Clear separation of concerns between basic and advanced wallet features