-- Setup First User Default Sponsor Code
-- Run this script to generate a default sponsor code for the first user

-- Function to set up first user with default sponsor code
DO $$
DECLARE
    first_user_id BIGINT;
    default_code TEXT;
    current_code TEXT;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id 
    FROM users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF first_user_id IS NULL THEN
        RAISE NOTICE 'No users found in the database.';
        RETURN;
    END IF;
    
    -- Check if first user already has a sponsor code
    SELECT sponsor_code INTO current_code 
    FROM users 
    WHERE id = first_user_id;
    
    IF current_code IS NOT NULL THEN
        RAISE NOTICE 'First user (ID: %) already has sponsor code: %', first_user_id, current_code;
        RETURN;
    END IF;
    
    -- Generate default admin code
    default_code := 'ADMIN-' || LPAD(first_user_id::text, 4, '0');
    
    -- Update first user with default sponsor code
    UPDATE users 
    SET sponsor_code = default_code 
    WHERE id = first_user_id;
    
    -- Get user details for confirmation
    DECLARE
        user_username TEXT;
        user_telegram_id BIGINT;
    BEGIN
        SELECT username, telegram_id INTO user_username, user_telegram_id
        FROM users 
        WHERE id = first_user_id;
        
        RAISE NOTICE 'Default sponsor code generated successfully!';
        RAISE NOTICE 'User ID: %', first_user_id;
        RAISE NOTICE 'Username: %', COALESCE(user_username, 'N/A');
        RAISE NOTICE 'Telegram ID: %', user_telegram_id;
        RAISE NOTICE 'Default Sponsor Code: %', default_code;
        RAISE NOTICE '';
        RAISE NOTICE 'The first user can now use these codes in the apply code section:';
        RAISE NOTICE '- admin';
        RAISE NOTICE '- system';
        RAISE NOTICE '- default';
        RAISE NOTICE '';
        RAISE NOTICE 'Or they can share their sponsor code: %', default_code;
    END;
    
END
$$;
