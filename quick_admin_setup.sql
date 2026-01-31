-- ===================================================================
-- QUICK ADMIN SETUP - Run this to add admin functionality
-- ===================================================================

-- 1. CREATE ADMIN TABLES
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_level VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (admin_level IN ('super', 'admin', 'moderator')),
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    added_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    target_user_id INTEGER REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
CREATE POLICY "Admin users can view admin_users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()::integer 
            AND au.is_active = TRUE
        )
    );

CREATE POLICY "Super admins can manage admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()::integer 
            AND au.admin_level = 'super' 
            AND au.is_active = TRUE
        )
    );

CREATE POLICY "Admins can view admin_logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()::integer 
            AND au.is_active = TRUE
        )
    );

CREATE POLICY "Admins can insert admin_logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()::integer 
            AND au.is_active = TRUE
        )
    );

-- 5. CREATE ESSENTIAL FUNCTIONS
CREATE OR REPLACE FUNCTION check_admin_status(p_user_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_admin_data RECORD;
BEGIN
    SELECT 
        admin_level,
        permissions,
        is_active,
        created_at
    INTO v_admin_data
    FROM admin_users 
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    IF FOUND THEN
        RETURN json_build_object(
            'is_admin', true,
            'admin_level', v_admin_data.admin_level,
            'permissions', v_admin_data.permissions,
            'admin_since', v_admin_data.created_at
        );
    ELSE
        RETURN json_build_object('is_admin', false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION initialize_admin_system(
    p_first_admin_user_id INTEGER,
    p_admin_level VARCHAR(20) DEFAULT 'super'
)
RETURNS JSON AS $$
DECLARE
    v_existing_admins INTEGER;
BEGIN
    -- Check if admin system is already initialized
    SELECT COUNT(*) INTO v_existing_admins FROM admin_users WHERE is_active = TRUE;
    
    IF v_existing_admins > 0 THEN
        RETURN json_build_object('success', false, 'error', 'Admin system already initialized');
    END IF;
    
    -- Create first admin
    INSERT INTO admin_users (user_id, admin_level, permissions)
    VALUES (p_first_admin_user_id, p_admin_level, ARRAY['all']);
    
    -- Log initialization
    INSERT INTO admin_logs (admin_user_id, action, details)
    VALUES (
        p_first_admin_user_id,
        'system_initialization',
        json_build_object(
            'message', 'Admin system initialized',
            'first_admin_id', p_first_admin_user_id,
            'admin_level', p_admin_level
        )
    );
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Admin system initialized successfully',
        'first_admin_id', p_first_admin_user_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. GRANT PERMISSIONS
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_logs TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_status(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_admin_system(INTEGER, VARCHAR(20)) TO authenticated;

-- ===================================================================
-- QUICK SETUP COMMANDS
-- ===================================================================

-- Step 1: Find your user ID (replace with your actual username/telegram_id)
-- SELECT id, username, telegram_id FROM users WHERE username = 'your_username';
-- OR
-- SELECT id, username, telegram_id FROM users WHERE telegram_id = 123456789;

-- Step 2: Initialize admin system (replace 1 with your actual user ID)
-- SELECT initialize_admin_system(1, 'super');

-- Step 3: Verify setup
-- SELECT check_admin_status(1);

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('admin_users', 'admin_logs');

-- Check if functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('check_admin_status', 'initialize_admin_system');

-- Show current admin count
SELECT COUNT(*) as admin_count FROM admin_users WHERE is_active = true;