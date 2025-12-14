# Wallet Login Fix Guide

## Problem Description

The wallet login is failing with the following error:

```
Wallet login failed: Error: Failed to create/update user: there is no unique or exclusion constraint matching the ON CONFLICT specification
    at createOrUpdateUser (supabaseClient.ts:1661:11)
    at async loginWithWallet (AuthContext.tsx:165:16)
```

## Root Cause

The issue occurs in the `createOrUpdateUser` function in `src/lib/supabaseClient.ts` at line 1661. The function uses PostgreSQL's `UPSERT` operation with `onConflict: 'wallet_address'`, but the database schema does not have a UNIQUE constraint on the `wallet_address` column.

## Solution

### If you encounter duplicate wallet address errors:

Use the comprehensive fix that handles duplicates: [`fix_wallet_address_duplicates.sql`](fix_wallet_address_duplicates.sql)

This migration:
1. Identifies all duplicate wallet addresses
2. Preserves the oldest user for each wallet address (by created_at)
3. Nullifies wallet addresses for duplicate users
4. Adds the UNIQUE constraint
5. Creates a performance index

### If you don't have duplicates (clean database):

Use the simpler migration: [`add_wallet_address_unique_constraint.sql`](add_wallet_address_unique_constraint.sql)

### For new installations:

The `complete_schema.sql` file has been updated to include the UNIQUE constraint by default.

## Files Created/Modified

1. **Created**: [`add_wallet_address_unique_constraint.sql`](add_wallet_address_unique_constraint.sql) - Simple migration for databases without duplicates
2. **Created**: [`fix_wallet_address_duplicates.sql`](fix_wallet_address_duplicates.sql) - Comprehensive migration that handles duplicate wallet addresses
3. **Updated**: [`complete_schema.sql`](complete_schema.sql:19) - Added UNIQUE constraint to wallet_address column
4. **Updated**: [`complete_schema.sql`](complete_schema.sql:500) - Added index for wallet_address column

## Step-by-Step Fix for Existing Databases with Duplicates

### Step 1: Run the duplicate fix migration
```sql
-- Copy and execute the entire contents of fix_wallet_address_duplicates.sql
-- This will:
-- 1. Identify duplicates
-- 2. Preserve oldest users, nullify newer duplicates
-- 3. Add the UNIQUE constraint
-- 4. Create performance index
```

### Step 2: Verify the fix
```sql
-- Check that no duplicates remain
SELECT wallet_address, COUNT(*) as count
FROM users
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Verify constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_name = 'users_wallet_address_key';
```

### Step 3: Handle affected users (optional)
Users who had their wallet addresses nullified will need to:
1. Log in using alternative methods (email, telegram, etc.)
2. Set a new unique wallet address
3. Reconnect their wallets

## Prevention

This issue has been prevented for future installations by updating the main schema file. The `wallet_address` column now has a UNIQUE constraint by default.

## Troubleshooting

### If you get "could not create unique index" errors:
This means you have duplicate wallet addresses. Use the comprehensive fix: [`fix_wallet_address_duplicates.sql`](fix_wallet_address_duplicates.sql)

### If users report missing wallet connections:
These users had duplicate wallet addresses and were affected by the cleanup. They'll need to reconnect their wallets.

## Support

If you need further assistance, please provide:
- Results from the duplicate check query
- Any error messages encountered
- Your Supabase database version