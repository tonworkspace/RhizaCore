-- Add metadata column to activities table for contest rewards
ALTER TABLE activities ADD COLUMN IF NOT EXISTS metadata JSONB;