# Transaction Hash Length Fix

## Problem
Users were getting the error "Value too long for type character varying(255)" when trying to activate their wallets after making TON payments. This was happening because:

1. **TON BOC (Bag of Cells) are very long** - TON transaction hashes returned by `tonConnectUI.sendTransaction()` are BOC strings that can be 1000+ characters long
2. **Database field too small** - The `transaction_hash` field in `wallet_activations` table was defined as `VARCHAR(255)`, limiting it to 255 characters
3. **No truncation handling** - The code was trying to insert the full BOC directly into the database

## Root Cause Analysis

### TON Transaction Result Structure
```javascript
const result = await tonConnectUI.sendTransaction(transaction);
// result.boc can be 1000+ characters like:
// "te6cckECGAEAA4QABCSK...very long string...BCDEFGHIJKLMNOP"
```

### Database Schema Issue
```sql
-- Original schema (too small)
transaction_hash VARCHAR(255)  -- Only 255 characters max
```

### Error Flow
1. User sends TON payment
2. `tonConnectUI.sendTransaction()` returns result with long BOC
3. Code tries to insert full BOC into `transaction_hash` field
4. Database rejects with "Value too long for type character varying(255)"
5. Activation fails despite successful payment

## Solutions Implemented

### 1. **Database Schema Fix**
```sql
-- Increase field size to handle long BOC strings
ALTER TABLE wallet_activations 
ALTER COLUMN transaction_hash TYPE TEXT;

-- Update function parameter
CREATE OR REPLACE FUNCTION process_wallet_activation(
    -- ... other params
    p_transaction_hash TEXT, -- Changed from VARCHAR(255) to TEXT
    -- ... other params
)
```

### 2. **Enhanced Duplicate Detection**
```sql
-- Improved duplicate check to handle edge cases
IF p_transaction_hash IS NOT NULL 
   AND p_transaction_hash != '' 
   AND p_transaction_hash != 'direct_payment' THEN
    IF EXISTS(SELECT 1 FROM wallet_activations WHERE transaction_hash = p_transaction_hash) THEN
        RETURN json_build_object('success', false, 'error', 'Transaction already processed');
    END IF;
END IF;
```

### 3. **UI Display Improvements**
```javascript
// Better display of long transaction hashes
<div className="text-[10px] text-zinc-500 font-mono opacity-50 break-all text-center max-w-full">
  {txHash.length > 32 ? `${txHash.slice(0, 16)}...${txHash.slice(-16)}` : txHash}
</div>
```

### 4. **Activity Metadata Truncation**
```sql
-- Truncate hash in activity metadata to prevent JSON bloat
'transaction_hash', CASE 
    WHEN LENGTH(p_transaction_hash) > 100 
    THEN LEFT(p_transaction_hash, 100) || '...' 
    ELSE p_transaction_hash 
END
```

## Files Modified

### 1. `src/components/WalletActivationModal.tsx`
- Removed truncation logic (no longer needed)
- Improved transaction hash display
- Better error handling

### 2. `fix_transaction_hash_length_limit.sql` (new)
- Database migration to fix field sizes
- Updated function to handle TEXT fields
- Added safety checks for other tables

### 3. `test-transaction-hash-length-fix.js` (new)
- Test script to verify the fix works
- Tests with 1000+ character transaction hashes

## Migration Steps

### Step 1: Apply Database Migration
```bash
# Run the SQL migration
psql -d your_database -f fix_transaction_hash_length_limit.sql
```

### Step 2: Verify Migration
```sql
-- Check that the field is now TEXT type
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'wallet_activations' 
  AND column_name = 'transaction_hash';
```

### Step 3: Test the Fix
```bash
# Run the test script
node test-transaction-hash-length-fix.js
```

## Before vs After

### Before Fix
```
❌ User pays activation fee
❌ TON returns long BOC: "te6cckECGAEAA4QABCSK...1000+ chars"
❌ Database rejects: "Value too long for type character varying(255)"
❌ User sees "Activation Failed" despite successful payment
❌ User may try to pay again
```

### After Fix
```
✅ User pays activation fee
✅ TON returns long BOC: "te6cckECGAEAA4QABCSK...1000+ chars"
✅ Database accepts full BOC (TEXT field)
✅ Activation completes successfully
✅ User receives 150 RZC and wallet unlocks
✅ No duplicate payment issues
```

## Testing Results

The test script verifies:
1. ✅ Long transaction hashes (1000+ chars) are accepted
2. ✅ Activation completes successfully with long hashes
3. ✅ No database errors occur
4. ✅ Full BOC is stored for future reference
5. ✅ Duplicate detection still works properly

## Additional Improvements

### 1. **Other Tables Updated**
The migration also fixes similar issues in:
- `user_transfers.transaction_hash`
- `deposits.transaction_hash`

### 2. **Backward Compatibility**
- Existing short hashes continue to work
- No data loss during migration
- Function handles both old and new hash formats

### 3. **Performance Considerations**
- TEXT fields are efficiently stored in PostgreSQL
- Indexing still works properly
- No significant performance impact

## Monitoring

To monitor for any remaining issues:

```sql
-- Check for any failed activations
SELECT 
    wa.id,
    wa.user_id,
    wa.status,
    LENGTH(wa.transaction_hash) as hash_length,
    wa.created_at
FROM wallet_activations wa
WHERE wa.status = 'failed'
ORDER BY wa.created_at DESC;

-- Check hash length distribution
SELECT 
    CASE 
        WHEN LENGTH(transaction_hash) <= 100 THEN '0-100'
        WHEN LENGTH(transaction_hash) <= 500 THEN '101-500'
        WHEN LENGTH(transaction_hash) <= 1000 THEN '501-1000'
        ELSE '1000+'
    END as length_range,
    COUNT(*) as count
FROM wallet_activations
WHERE transaction_hash IS NOT NULL
GROUP BY length_range
ORDER BY length_range;
```

## Conclusion

This fix resolves the "Value too long" error that was preventing users from completing wallet activation after successful TON payments. The solution:

1. **Increases database field capacity** to handle long TON BOC strings
2. **Maintains full transaction data** for audit and verification
3. **Preserves duplicate detection** functionality
4. **Improves UI display** of long hashes
5. **Ensures backward compatibility** with existing data

Users should no longer experience activation failures due to transaction hash length limits.