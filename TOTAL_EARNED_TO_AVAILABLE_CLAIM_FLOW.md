# Total Earned to Available Balance Claim Flow

## Overview
Updated the claim system so users claim their **Total Earned Balance** (from mining activities) and move it to their **Available Balance** (claimed/validated balance for use in the app).

## New Claim Flow

### Before (Incorrect):
```
Mining Activities → Available Balance (used as claimable source)
User Claims → Available Balance (circular, could claim same rewards multiple times)
```

### After (Correct):
```
Mining Activities → Claimable RZC (unclaimed mining rewards)
User Claims → Available Balance (claimed/validated balance)
Mining Activities Marked as Claimed → No longer claimable
```

## Key Changes

### 1. Balance Calculation Logic (`src/lib/supabaseClient.ts`)

**Updated `getUserRZCBalance()` function:**

```typescript
// NEW: Proper separation of claimable vs claimed
let claimableRZC = 0; // Unclaimed mining rewards
let claimedRZC = 0;   // Available balance (from database)

activities?.forEach(activity => {
  if (activity.type === 'mining_complete') {
    totalEarned += activity.amount; // Always count for history
    
    // Only claimable if not marked as claimed
    if (!activity.metadata?.claimed_to_airdrop) {
      claimableRZC += activity.amount;
    }
  }
});

// Use database available_balance as the authoritative claimed amount
const databaseClaimedRZC = parseFloat(user.available_balance) || 0;
```

### 2. Security Validation (`src/services/ClaimSecurityService.ts`)

**Updated balance verification:**

```typescript
// Verify against actual claimable mining activities
let dbClaimableBalance = 0;
activities?.forEach(activity => {
  // Only count unclaimed mining activities
  if (!activity.metadata?.claimed_to_airdrop) {
    dbClaimableBalance += parseFloat(activity.amount) || 0;
  }
});

// Compare frontend claimable vs database claimable calculation
if (Math.abs(frontendBalance.claimable - dbClaimableBalance) > tolerance) {
  return { isValid: false, error: 'Balance verification failed' };
}
```

### 3. Database Claim Processing (`fix_claim_process_function.sql`)

**New `process_secure_claim()` function:**

```sql
-- Calculate claimable from unclaimed mining activities
SELECT COALESCE(SUM(amount), 0) INTO v_claimable_amount
FROM activities 
WHERE user_id = p_user_id 
AND type = 'mining_complete' 
AND status = 'completed'
AND (metadata->>'claimed_to_airdrop' IS NULL OR metadata->>'claimed_to_airdrop' != 'true');

-- Mark mining activities as claimed (prevents double claiming)
UPDATE activities 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('claimed_to_airdrop', true, 'claimed_at', NOW())
WHERE id = v_activity_record.id;

-- Add claimed amount to user's available_balance
UPDATE users SET
    available_balance = v_current_balance + p_amount,
    last_claim_time = NOW()
WHERE id = p_user_id;
```

### 4. Reset Function (`src/lib/supabaseClient.ts`)

**Updated `resetClaimStatus()` function:**

```typescript
// Reset available_balance (claimed balance) to 0
await supabase
  .from('users')
  .update({ 
    available_balance: 0, // Reset claimed balance
    last_claim_time: null 
  })
  .eq('id', userId);

// Unmark mining activities as claimed (make them claimable again)
await supabase
  .from('activities')
  .update({ 
    metadata: supabase.rpc('jsonb_set', {
      target: 'metadata',
      path: '{claimed_to_airdrop}',
      new_value: 'null'
    })
  })
  .eq('user_id', userId)
  .eq('type', 'mining_complete');
```

### 5. UI Updates (`src/components/ArcadeMiningUI.tsx`)

**Clearer balance display:**

```typescript
// Balance Breakdown
<div className="grid grid-cols-2 gap-3">
  <div>
    <span>Claimable</span>
    <div>{claimableRZC.toFixed(3)}</div>
    <div>From mining</div>
  </div>
  <div>
    <span>Available</span>
    <div>{claimedRZC.toFixed(3)}</div>
    <div>Claimed balance</div>
  </div>
</div>

// Button text
{`Claim ${totalAvailableToClaim.toFixed(3)} RZC from Mining`}
```

## Data Flow

### 1. Mining Phase:
```
User completes mining session
↓
Activity created: type='mining_complete', amount=X, metadata={}
↓
Claimable RZC = Sum of unclaimed mining activities
Available Balance = Current claimed balance (from users.available_balance)
```

### 2. Claim Phase:
```
User clicks "Claim X RZC from Mining"
↓
Security validation: Check claimable amount matches database calculation
↓
Mark mining activities as claimed: metadata.claimed_to_airdrop = true
↓
Add claimed amount to users.available_balance
↓
Create claim activity: type='rzc_claim', amount=X
↓
Claimable RZC = Reduced by claimed amount
Available Balance = Increased by claimed amount
```

### 3. Reset Phase (Development):
```
User clicks "Reset"
↓
Set users.available_balance = 0
↓
Unmark mining activities: metadata.claimed_to_airdrop = null
↓
Claimable RZC = Restored from all mining activities
Available Balance = 0
```

## Benefits

✅ **Prevents Double Claiming**: Mining activities are marked as claimed  
✅ **Clear Separation**: Claimable (from mining) vs Available (claimed/validated)  
✅ **Proper Flow**: Total Earned → Claimable → Available Balance  
✅ **Security**: Validation checks actual claimable amounts  
✅ **Reset Friendly**: Development reset properly restores claimable state  
✅ **User Clarity**: UI clearly shows what's being claimed and from where  

## Usage

### Normal Flow:
1. User completes mining sessions → Earns claimable RZC
2. User clicks "Claim X RZC from Mining" → Moves to available balance
3. Available balance can be used for app features (staking, purchases, etc.)

### Development Testing:
1. Complete mining → Earn claimable RZC
2. Claim rewards → Moves to available balance
3. Reset → Clears available balance, restores claimable RZC
4. Repeat testing cycle

The claim system now properly implements the Total Earned → Available Balance flow with proper security and validation.