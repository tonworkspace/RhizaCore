-- Create RPC function to increment TON balance safely
-- This function handles the balance increment with proper error handling

CREATE OR REPLACE FUNCTION increment_ton_balance(user_id INTEGER, amount DECIMAL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    current_balance DECIMAL;
    new_balance DECIMAL;
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Validate amount
    IF amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Amount must be positive'
        );
    END IF;
    
    -- Get current balance (default to 0 if null)
    SELECT COALESCE(ton_balance, 0) INTO current_balance
    FROM users 
    WHERE id = user_id;
    
    -- Calculate new balance
    new_balance := current_balance + amount;
    
    -- Update the balance
    UPDATE users 
    SET 
        ton_balance = new_balance,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'previous_balance', current_balance,
        'amount_added', amount,
        'new_balance', new_balance,
        'updated_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_ton_balance(INTEGER, DECIMAL) TO authenticated;

-- Test the function (optional)
-- SELECT increment_ton_balance(1, 1.5);