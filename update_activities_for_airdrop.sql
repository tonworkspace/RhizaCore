-- Update activities table to support airdrop claim activities
-- Add airdrop_claim to the type enum if it doesn't exist

-- First, let's check if we need to add the new type
DO $$
BEGIN
    -- Add airdrop_claim to the activity type enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'airdrop_claim' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'activity_type'
        )
    ) THEN
        ALTER TYPE activity_type ADD VALUE 'airdrop_claim';
    END IF;
EXCEPTION
    WHEN others THEN
        -- If enum doesn't exist or other error, we'll handle it differently
        -- This might happen if activities table uses VARCHAR instead of enum
        NULL;
END $$;

-- Add metadata column to activities if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE activities ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add index on metadata for better performance
CREATE INDEX IF NOT EXISTS idx_activities_metadata ON activities USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN activities.metadata IS 'Additional data for the activity (JSON format)';