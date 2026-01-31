# Staked Balance Deduction Fix

## Issue
When users staked their airdrop balance, the main balance hero was showing the total of available + staked balance instead of deducting the staked amount from the displayed balance.

## Problem
- **Before**: Main balance showed `available_balance + staked_balance`
- **Expected**: Main balance should show only `available_balance` (liquid funds)
- **Staked funds**: Should be shown separately as they're locked in staking

## Solution Implemented

### 1. Updated Main Balance Hero

**Before:**
```typescript
// Showed total of available + staked
{airdropBalance ? ((airdropBalance.available_balance || 0) + (airdropBalance.staked_balance || 0)).toLocaleString(...) : '0.0000'}
```

**After:**
```typescript
// Shows only available balance
{airdropBalance ? (airdropBalance.available_balance || 0).toLocaleString(...) : '0.0000'}
```

**Additional Enhancement:**
Added a separate staked balance indicator below the main balance when user has staked funds:
```jsx
{airdropBalance && (airdropBalance.staked_balance || 0) > 0 && (
  <div className="mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <div className="text-blue-400 text-xs font-bold">
      {(airdropBalance.staked_balance || 0).toFixed(4)} RZC Staked
    </div>
  </div>
)}
```

### 2. Updated Airdrop Balance Asset Display

**Before:**
- Showed both available and staked in subtitle
- Main amount showed total (available + staked)

**After:**
- Shows staked amount in subtitle (if any)
- Main amount shows only available balance
- Label changed from "Total" to "Available"

### 3. Added Separate Staked Balance Asset

**New Asset Item:**
- Only appears when user has staked balance > 0
- Shows staked amount prominently
- Uses blue color scheme to differentiate from available balance
- Indicates "Earning Staking Rewards" status

## User Experience Improvements

### Clear Balance Separation
- **Main Balance**: Shows liquid, spendable funds
- **Staked Indicator**: Shows locked, earning funds
- **Separate Asset**: Dedicated staked balance display

### Visual Hierarchy
1. **Primary**: Available balance (large, prominent)
2. **Secondary**: Staked balance (smaller, blue badge)
3. **Asset List**: Separate items for available vs staked

### Accurate Financial Display
- Users see their actual liquid balance
- Staked funds are clearly identified as locked
- No confusion about spendable vs locked funds

## Before vs After Comparison

### Before Staking (10.0000 RZC available):
```
Main Balance: 10.0000 RZC
Airdrop Asset: 10.0000 RZC (Available)
```

### After Staking 70% (7.0000 RZC staked, 3.0000 RZC available):

**Before Fix:**
```
Main Balance: 10.0000 RZC  ❌ (Incorrect - shows total)
Airdrop Asset: 10.0000 RZC (Total)
```

**After Fix:**
```
Main Balance: 3.0000 RZC  ✅ (Correct - shows available)
             [7.0000 RZC Staked]  ✅ (Shows staked separately)
             
Asset List:
- Airdrop Balance: 3.0000 RZC (Available)
- Staked Balance: 7.0000 RZC (Staked)  ✅ (New separate item)
```

## Technical Implementation

### Balance Calculation Logic
```typescript
// Main balance (liquid funds only)
const mainBalance = airdropBalance?.available_balance || 0;

// Staked balance (locked funds)
const stakedBalance = airdropBalance?.staked_balance || 0;

// Total balance (for reference, not displayed as main)
const totalBalance = mainBalance + stakedBalance;
```

### Conditional Display
```typescript
// Show staked indicator only if user has staked
{airdropBalance && (airdropBalance.staked_balance || 0) > 0 && (
  // Staked balance display
)}
```

### Asset List Logic
- **Airdrop Balance**: Always shown, displays available amount
- **Staked Balance**: Only shown when staked_balance > 0

## Benefits

1. **Accurate Balance Display**: Users see their actual spendable balance
2. **Clear Fund Separation**: Liquid vs locked funds are distinct
3. **Better UX**: No confusion about available funds
4. **Staking Awareness**: Users clearly see their staking participation
5. **Financial Clarity**: Proper representation of fund allocation

## Future Enhancements

1. **Staking Rewards**: Show earned rewards on staked balance
2. **Unstaking Feature**: Allow users to unstake with proper balance updates
3. **Staking Duration**: Display how long funds have been staked
4. **APY Display**: Show current staking yield percentage

The fix ensures users have a clear, accurate view of their available balance while properly highlighting their staking participation.