-- Update Squad Mining Rates Migration
-- Reduces squad mining rewards from 25/50 to 2/5 RZC per member

-- Update existing users' squad mining rates to the new lower rate
UPDATE users 
SET squad_mining_rate = 2.0 
WHERE squad_mining_rate = 25.0 OR squad_mining_rate IS NULL;

-- Update any users who had custom rates above 25 to a proportional reduction
UPDATE users 
SET squad_mining_rate = ROUND(squad_mining_rate * 0.08, 2)  -- 2/25 = 0.08 ratio
WHERE squad_mining_rate > 25.0;

-- Verify the changes
SELECT 
    COUNT(*) as total_users,
    AVG(squad_mining_rate) as avg_mining_rate,
    MIN(squad_mining_rate) as min_rate,
    MAX(squad_mining_rate) as max_rate
FROM users 
WHERE squad_mining_rate IS NOT NULL;

COMMENT ON TABLE users IS 'Updated squad mining rates: Regular members now earn 2 RZC per claim, Premium members earn 5 RZC per claim (reduced from 25/50)';