-- ===================================================================
-- ADMIN SYSTEM DATABASE SCHEMA (UUID Compatible)
-- Complete admin user management and authentication system for Supabase
-- ===================================================================

-- 1. ADMIN USERS TABLE (UUID Compatible)
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_level VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (admin_level IN ('super', 'admin', 'moderator')),
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(user_id),
    CHECK (admin_level IN ('super', 'admin', 'moderator'))
);

-- 2. ADMIN LOGS TABLE (for audit trail)
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    target_user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADMIN SESSIONS TABLE (optional - for session management)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Admin users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_admin_users_level ON admin_users(admin_level);

-- Admin logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user ON admin_logs(target_user_id);

-- Admin sessions indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active) WHERE is_active = TRUE;

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admin users can view admin_users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = TRUE
        )
    );

CREATE POLICY "Super admins can manage admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.admin_level = 'super' 
            AND au.is_active = TRUE
        )
    );

-- Admin logs policies
CREATE POLICY "Admins can view admin_logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = TRUE
        )
    );

CREATE POLICY "Admins can insert admin_logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = TRUE
        )
    );

-- ===================================================================
-- ADMIN MANAGEMENT FUNCTIONS (UUID Compatible)
-- ===================================================================

-- 1. CHECK ADMIN STATUS FUNCTION
CREATE OR REPLACE FUNCTION check_admin_status(p_user_id UUID)
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

-- 2. ADD ADMIN USER FUNCTION
CREATE OR REPLACE FUNCTION add_admin_user(
    p_user_id UUID,
    p_admin_level VARCHAR(20) DEFAULT 'admin',
    p_permissions TEXT[] DEFAULT '{}',
    p_added_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_exists BOOLEAN;
    v_already_admin BOOLEAN;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if already admin
    SELECT EXISTS(SELECT 1 FROM admin_users WHERE user_id = p_user_id AND is_active = TRUE) INTO v_already_admin;
    IF v_already_admin THEN
        RETURN json_build_object('success', false, 'error', 'User is already an admin');
    END IF;
    
    -- Insert admin record
    INSERT INTO admin_users (user_id, admin_level, permissions, added_by)
    VALUES (p_user_id, p_admin_level, p_permissions, p_added_by);
    
    -- Log the action
    INSERT INTO admin_logs (admin_user_id, action, details, target_user_id)
    VALUES (
        COALESCE(p_added_by, p_user_id),
        'add_admin_user',
        json_build_object(
            'new_admin_user_id', p_user_id,
            'admin_level', p_admin_level,
            'permissions', p_permissions
        ),
        p_user_id
    );
    
    RETURN json_build_object('success', true, 'message', 'Admin user added successfully');
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REMOVE ADMIN USER FUNCTION
CREATE OR REPLACE FUNCTION remove_admin_user(
    p_user_id UUID,
    p_removed_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Deactivate admin user
    UPDATE admin_users 
    SET is_active = FALSE, deactivated_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Admin user not found or already inactive');
    END IF;
    
    -- Log the action
    INSERT INTO admin_logs (admin_user_id, action, details, target_user_id)
    VALUES (
        COALESCE(p_removed_by, p_user_id),
        'remove_admin_user',
        json_build_object('removed_admin_user_id', p_user_id),
        p_user_id
    );
    
    RETURN json_build_object('success', true, 'message', 'Admin privileges removed successfully');
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GET ADMIN USERS FUNCTION
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    admin_level VARCHAR(20),
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    added_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.user_id,
        u.email,
        au.admin_level,
        au.permissions,
        au.created_at,
        au.added_by
    FROM admin_users au
    JOIN auth.users u ON au.user_id = u.id
    WHERE au.is_active = TRUE
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INITIALIZE ADMIN SYSTEM FUNCTION
CREATE OR REPLACE FUNCTION initialize_admin_system(
    p_first_admin_user_id UUID,
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

-- 6. UPDATE ADMIN PERMISSIONS FUNCTION
CREATE OR REPLACE FUNCTION update_admin_permissions(
    p_user_id UUID,
    p_permissions TEXT[],
    p_updated_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE admin_users 
    SET permissions = p_permissions, updated_at = NOW()
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Admin user not found');
    END IF;
    
    -- Log the action
    INSERT INTO admin_logs (admin_user_id, action, details, target_user_id)
    VALUES (
        COALESCE(p_updated_by, p_user_id),
        'update_permissions',
        json_build_object(
            'user_id', p_user_id,
            'new_permissions', p_permissions
        ),
        p_user_id
    );
    
    RETURN json_build_object('success', true, 'message', 'Permissions updated successfully');
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. HELPER FUNCTION TO GET USER ID BY EMAIL (for Supabase auth)
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- USAGE EXAMPLES (UUID Compatible)
-- ===================================================================

/*

-- 1. Get your user ID by email
SELECT get_user_id_by_email('your-email@example.com');

-- 2. Initialize admin system with your user ID
SELECT initialize_admin_system('your-uuid-here', 'super');

-- 3. Add a new admin user
SELECT add_admin_user('user-uuid-here', 'admin', ARRAY['user_management', 'activation'], 'your-uuid-here');

-- 4. Check admin status
SELECT check_admin_status('user-uuid-here');

-- 5. Get all admin users
SELECT * FROM get_admin_users();

-- 6. Update admin permissions
SELECT update_admin_permissions('user-uuid-here', ARRAY['user_management', 'activation', 'reports'], 'your-uuid-here');

-- 7. Remove admin privileges
SELECT remove_admin_user('user-uuid-here', 'your-uuid-here');

-- 8. View admin logs
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 10;

*/

-- ===================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===================================================================

-- Update timestamp trigger for admin_users
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_logs TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;

-- Grant admin management functions to authenticated users (will be controlled by RLS)
GRANT EXECUTE ON FUNCTION add_admin_user(UUID, VARCHAR(20), TEXT[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_permissions(UUID, TEXT[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_admin_system(UUID, VARCHAR(20)) TO authenticated;

-- ===================================================================
-- SAMPLE SETUP COMMANDS
-- ===================================================================

/*
-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Initialize admin system (replace with your actual UUID)
SELECT initialize_admin_system('your-uuid-from-step-1', 'super');

-- Step 3: Verify setup
SELECT * FROM get_admin_users();
*/