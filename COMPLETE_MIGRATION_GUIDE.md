# Complete Migration Guide - Fix Free Mining System

## 🚨 The Problem
Your app is trying to call `get_free_mining_status()` function, but it doesn't exist in the database yet. This is because the migration wasn't completed successfully.

## ✅ The Solution
Follow these 6 steps **in order** to fix the issue:

### **Step 1: Check Current State**
```sql
-- Run this first to see what's missing
-- Execute: step1_check_state.sql
```

### **Step 2: Create/Fix Table Structure**
```sql
-- Run this to ensure the table has all required columns
-- Execute: step2_create_table.sql
```

### **Step 3: Create All Functions**
```sql
-- Run this to create the missing functions (including get_free_mining_status)
-- Execute: step3_create_functions.sql
```

### **Step 4: Add Indexes and Security**
```sql
-- Run this to add performance indexes and RLS policies
-- Execute: step4_add_indexes_policies.sql
```

### **Step 5: Initialize User Periods**
```sql
-- Run this to create free mining periods for all existing users
-- Execute: step5_initialize_periods.sql
```

### **Step 6: Final Verification**
```sql
-- Run this to test everything and verify it works
-- Execute: step6_final_test.sql
```

## 🔍 What Each Step Does

### **Step 1** - Diagnostic
- Checks if table exists
- Checks if functions exist
- Shows current state

### **Step 2** - Table Setup
- Creates table if missing
- Adds missing columns safely
- Ensures proper structure

### **Step 3** - Functions
- Creates `initialize_or_update_free_mining_period()`
- Creates `can_user_mine_free()`
- Creates `increment_mining_session_count()`
- Creates `get_free_mining_status()` ← **This fixes your error**

### **Step 4** - Performance & Security
- Adds database indexes
- Enables Row Level Security
- Creates security policies

### **Step 5** - Data Initialization
- Creates free mining periods for all users
- Sets up 100-day periods
- Calculates grace periods

### **Step 6** - Testing
- Tests all functions
- Verifies data integrity
- Confirms everything works

## ⚡ Quick Fix (If You're in a Hurry)

If you just want to fix the immediate error, run **Step 3** first:

```sql
-- This creates the missing get_free_mining_status function
-- Execute: step3_create_functions.sql
```

Then run the other steps to complete the setup.

## 🛡️ Safety Features

- ✅ **No data loss** - only adds new functionality
- ✅ **Idempotent** - can run steps multiple times safely
- ✅ **Backward compatible** - doesn't break existing code
- ✅ **Rollback available** - can revert if needed

## 🎯 Expected Results

After completing all steps:
- ✅ `get_free_mining_status()` function will exist
- ✅ Your TypeScript code will work without errors
- ✅ All users will have 100-day free mining periods
- ✅ UI will show accurate status information
- ✅ Session counting will work properly

## 🚨 If Something Goes Wrong

1. **Check error messages** in each step
2. **Run the diagnostic** (step1_check_state.sql) again
3. **Use the rollback script** if needed:
   ```sql
   -- Execute: rollback_free_mining_migration.sql
   ```

## 📞 Support

Each step includes detailed error checking and will tell you exactly what's wrong if something fails.

**Start with Step 1** to see the current state, then proceed through the steps in order!
