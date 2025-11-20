-- Migration to add is_premium column to users table
-- This column indicates whether a user has premium status

ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;

-- Add index for better query performance on premium users
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);

-- Optional: Add comment to the column for documentation
COMMENT ON COLUMN users.is_premium IS 'Indicates if the user has premium membership status';