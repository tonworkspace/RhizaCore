# Airdrop Staking Null Safety Fixes

## Issue
The application was throwing an error: "Cannot read properties of undefined (reading 'toFixed')" when trying to access properties of the `airdropBalance` object that could be `null` or `undefined`.

## Root Cause
The `airdropBalance` state was being accessed without proper null checks, and individual properties within the object could also be `undefined` even when the object exists.

## Fixes Applied

### 1. Main Balance Hero Section
**Before:**
```typescript
{airdropBalance ? (airdropBalance.available_balance + airdropBalance.staked_balance).toLocaleString(...) : '0.0000'}
```

**After:**
```typescript
{airdropBalance ? ((airdropBalance.available_balance || 0) + (airdropBalance.staked_balance || 0)).toLocaleString(...) : '0.0000'}
```

### 2. Airdrop Balance Asset Display
**Before:**
```typescript
Available: {airdropBalance ? airdropBalance.available_balance.toFixed(4) : '0.0000'}
Staked: {airdropBalance ? airdropBalance.staked_balance.toFixed(4) : '0.0000'}
```

**After:**
```typescript
Available: {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
Staked: {airdropBalance ? (airdropBalance.staked_balance || 0).toFixed(4) : '0.0000'}
```

### 3. Modal Balance Displays
Applied similar null safety checks to:
- Airdrop modal balance summary
- Withdraw modal balance display
- Staking modal balance calculations

### 4. Conditional Logic Updates
**Before:**
```typescript
{airdropBalance && airdropBalance.available_balance > 0 && (
```

**After:**
```typescript
{airdropBalance && (airdropBalance.available_balance || 0) > 0 && (
```

### 5. Form Validation
**Before:**
```typescript
if (!airdropBalance || airdropBalance.available_balance < amount) {
```

**After:**
```typescript
if (!airdropBalance || (airdropBalance.available_balance || 0) < amount) {
```

### 6. Button States
Updated all button disabled conditions to use null-safe checks:
```typescript
disabled={isProcessingStake || !airdropBalance || (airdropBalance.available_balance || 0) <= 0}
```

### 7. Checklist Progress
Fixed the transferable balance checklist item to handle null values:
```typescript
{airdropBalance && (airdropBalance.total_claimed_to_airdrop || 0) > 0 
  ? `${(airdropBalance.total_claimed_to_airdrop || 0).toFixed(4)} RZC` 
  : 'Move your earned RZC to airdrop balance'
}
```

## Pattern Used
The consistent pattern applied throughout was:
1. Check if `airdropBalance` exists
2. Use `|| 0` fallback for individual properties that might be undefined
3. Apply the same pattern to all mathematical operations and display logic

## Result
- ✅ No more runtime errors when `airdropBalance` is null/undefined
- ✅ Graceful handling of missing properties within the airdrop balance object
- ✅ Consistent display of "0.0000" when no balance data is available
- ✅ All functionality works correctly regardless of data state

## Testing Scenarios Covered
1. **Initial Load**: When `airdropBalance` is `null` (before data loads)
2. **Empty Balance**: When `airdropBalance` exists but properties are `undefined` or `0`
3. **Partial Data**: When some properties exist but others don't
4. **Full Data**: When all properties are properly populated

The fixes ensure the component renders correctly and functions properly in all these scenarios without throwing runtime errors.