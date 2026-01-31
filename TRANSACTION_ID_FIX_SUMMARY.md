# Transaction ID JSON Query Fix

## Issue Description

The ClaimSecurityService was throwing a PostgreSQL error:
```
Error checking transaction idempotency: {code: '22P02', details: 'Token "TXN" is invalid.', hint: null, message: 'invalid input syntax for type json'}
```

## Root Cause

The `checkTransactionIdempotency` function was using incorrect JSON query syntax:
```typescript
// ❌ INCORRECT - This tries to query JSON field
.eq('metadata->transaction_id', transactionId)
```

But `transaction_id` is actually a separate column in the `activities` table, not a JSON field within `metadata`.

## Solution

### 1. Fixed Query Syntax

Updated the query to use the correct column reference:
```typescript
// ✅ CORRECT - This queries the transaction_id column directly
.eq('transaction_id', transactionId)
```

### 2. Database Schema Verification

The `transaction_id` column is added to the `activities` table via the migration:
```sql
ALTER TABLE activities ADD COLUMN transaction_id VARCHAR(100);
CREATE UNIQUE INDEX idx_activities_transaction_id ON activities(transaction_id) WHERE transaction_id IS NOT NULL;
```

### 3. Files Modified

- ✅ `src/services/ClaimSecurityService.ts` - Fixed the query syntax
- ✅ `create_claim_security_tables.sql` - Improved migration script
- ✅ `fix_transaction_id_column.sql` - Quick fix script for existing databases

### 4. Testing

Created `test-transaction-idempotency-fix.js` to verify:
- ✅ Transaction ID column exists
- ✅ Idempotency queries work correctly
- ✅ Unique constraint prevents duplicates
- ✅ No more JSON syntax errors

## How to Apply the Fix

### If you haven't run the migration yet:
1. Run `create_claim_security_tables.sql` to create all security tables and columns

### If you're getting the error on an existing database:
1. Run `fix_transaction_id_column.sql` to add the missing columns
2. The ClaimSecurityService will now work correctly

### Verify the fix:
1. Run `node test-transaction-idempotency-fix.js` to test the functionality

## Impact

- ✅ **Fixed**: JSON syntax error when checking transaction idempotency
- ✅ **Improved**: Database migration handles existing tables better
- ✅ **Enhanced**: Added verification scripts for troubleshooting
- ✅ **Maintained**: All security features continue to work as designed

## Security Features Still Working

All anti-manipulation security measures remain fully functional:
- 🔒 Claim operation locks
- 🆔 Unique transaction IDs & idempotency (now fixed)
- ✅ Server-side balance verification
- ⏱️ Rate limiting & abuse prevention
- 🕵️ Suspicious pattern detection
- 📝 Comprehensive audit logging
- 🛡️ Database-level security functions

The fix only corrected the database query syntax - all security logic remains intact.