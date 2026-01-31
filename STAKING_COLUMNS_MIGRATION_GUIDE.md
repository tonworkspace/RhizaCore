# Staking Columns Migration Guide

## Issue
The staking feature is failing with error: `Could not find the 'last_stake_date' column of 'airdrop_balances' in the schema cache`

This means the database schema needs to be updated to include the new staking columns.

## Solution Options

### Option 1: Run the Migration Script (Recommended)

Execute the migration script to add the missing columns:

```sql
-- Run this in your Supabase SQL editor or database console
-- File: simple_add_staking_columns.sql

ALTER TABLE airdrop_balances 
ADD COLUMN IF NOT EXISTS staked_balance DECIMAL(20, 8) NOT NULL DEFAULT 0;

ALTER TABLE airdrop_balances 
ADD COLUMN IF NOT EXISTS last_stake_date TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN airdrop_balances.staked_balance IS 'Amount currently staked (70% of available balance when staking)';
COMMENT ON COLUMN airdrop_balances.last_stake_date IS 'Last time user staked their airdrop balance';
```

### Option 2: Use the Advanced Migration Script

For more detailed migration with checks:

```sql
-- File: add_staking_columns_to_airdrop_balances.sql
-- This script includes existence checks and detailed logging
```

### Option 3: Recreate the Table (If needed)

If you need to recreate the entire table with the new schema:

```sql
-- File: create_airdrop_balance_system.sql
-- This will create the complete table with all columns
```

## Steps to Fix

### 1. Access Your Database
- Go to your Supabase dashboard
- Navigate to the SQL Editor
- Or use your preferred database management tool

### 2. Run the Migration
Copy and paste the contents of `simple_add_staking_columns.sql` and execute it.

### 3. Verify the Migration
Check that the columns were added:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'airdrop_balances' 
AND column_name IN ('staked_balance', 'last_stake_date')
ORDER BY column_name;
```

Expected output:
```
column_name     | data_type | is_nullable | column_default
last_stake_date | timestamp | YES         | NULL
staked_balance  | numeric   | NO          | 0
```

### 4. Test the Staking Feature
After running the migration, the staking feature should work correctly.

## Backward Compatibility

The updated `stakeAirdropBalance` function now includes fallback logic:

1. **First attempt**: Try to update with all columns (new schema)
2. **Fallback**: If columns don't exist, update only `available_balance`
3. **Activity tracking**: Always records the staking activity for audit purposes

This means the feature will work even if the migration hasn't been run yet, though with limited functionality.

## What Each Column Does

### `staked_balance`
- **Type**: `DECIMAL(20, 8)`
- **Default**: `0`
- **Purpose**: Tracks the total amount of RZC currently staked by the user
- **Updates**: Increases when user stakes, decreases when user unstakes

### `last_stake_date`
- **Type**: `TIMESTAMPTZ`
- **Default**: `NULL`
- **Purpose**: Records when the user last performed a staking action
- **Updates**: Set to current timestamp whenever user stakes

## Migration Verification

After running the migration, you can verify it worked by:

1. **Check column existence**:
```sql
\d airdrop_balances
```

2. **Test a staking operation** through the UI

3. **Check the activity logs**:
```sql
SELECT * FROM activities 
WHERE type = 'airdrop_balance_stake' 
ORDER BY created_at DESC 
LIMIT 5;
```

## Troubleshooting

### If migration fails:
1. Check if you have the necessary permissions
2. Verify the table `airdrop_balances` exists
3. Check for any existing data that might conflict

### If staking still doesn't work:
1. Check browser console for detailed error messages
2. Verify the migration completed successfully
3. Refresh the application to clear any cached schema

### If you see "fallback_mode: true" in activities:
This means the staking worked but used the fallback method. Run the migration to enable full functionality.

## Files Created

1. `simple_add_staking_columns.sql` - Simple migration script
2. `add_staking_columns_to_airdrop_balances.sql` - Advanced migration with checks
3. Updated `src/lib/supabaseClient.ts` - Backward compatible staking function

The staking feature will work after running any of these migration scripts!