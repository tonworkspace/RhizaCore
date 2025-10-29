-- STEP-BY-STEP MIGRATION GUIDE
-- Follow these steps in order to avoid errors

-- STEP 1: Check current database state
DO $$
BEGIN
    RAISE NOTICE '🔍 STEP 1: Checking current database state...';
    
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mining_periods') THEN
        RAISE NOTICE '✅ free_mining_periods table exists';
    ELSE
        RAISE NOTICE '❌ free_mining_periods table does NOT exist - need to create it';
    END IF;
    
    -- Check if functions exist
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_free_mining_status') THEN
        RAISE NOTICE '✅ get_free_mining_status function exists';
    ELSE
        RAISE NOTICE '❌ get_free_mining_status function does NOT exist - need to create it';
    END IF;
    
    RAISE NOTICE '📋 Current state checked. Proceed to next step based on results.';
END $$;
