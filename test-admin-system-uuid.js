// Test UUID Admin System
// Run this with: node test-admin-system-uuid.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUUIDAdminSystem() {
  console.log('🚀 Testing UUID Admin System...\n');

  try {
    // 1. Check authentication status
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      console.log('💡 Please authenticate first using supabase.auth.signIn()');
      return;
    }

    if (!user) {
      console.log('❌ No authenticated user found');
      console.log('💡 Please sign in first');
      return;
    }

    console.log('✅ Authenticated user:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });
    console.log('');

    // 2. Check if admin tables exist
    console.log('📋 Checking admin system tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['admin_users', 'admin_logs', 'admin_sessions']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
      console.log('💡 Please run create_admin_system_schema_uuid.sql first');
      return;
    }

    console.log('✅ Admin tables found:', tables?.map(t => t.table_name) || []);
    console.log('');

    // 3. Check current admin status
    console.log('👤 Checking current user admin status...');
    const { data: adminStatus, error: statusError } = await supabase
      .rpc('check_admin_status', { p_user_id: user.id });

    if (statusError) {
      console.error('❌ Error checking admin status:', statusError.message);
      console.log('💡 Admin functions may not be properly installed');
    } else {
      console.log('📊 Admin status:', adminStatus || { is_admin: false });
    }
    console.log('');

    // 4. Get admin statistics
    console.log('📈 Getting admin system statistics...');
    const { data: adminUsers, error: usersError } = await supabase
      .rpc('get_admin_users');

    if (usersError) {
      console.log('⚠️  Error getting admin users:', usersError.message);
    } else {
      console.log('👥 Current admin users:', adminUsers?.length || 0);
      if (adminUsers && adminUsers.length > 0) {
        adminUsers.forEach((admin, index) => {
          console.log(`  ${index + 1}. ${admin.email} (${admin.admin_level})`);
        });
      }
    }
    console.log('');

    // 5. Test initialization if no admins exist
    if (!adminUsers || adminUsers.length === 0) {
      console.log('🔧 No admin users found. Testing initialization...');
      
      const { data: initResult, error: initError } = await supabase
        .rpc('initialize_admin_system', {
          p_first_admin_user_id: user.id,
          p_admin_level: 'super'
        });

      if (initError) {
        console.error('❌ Initialization error:', initError.message);
      } else {
        console.log('🎉 Initialization result:', initResult);
        
        if (initResult?.success) {
          console.log('✅ Admin system initialized successfully!');
          
          // Re-check admin status
          const { data: newStatus } = await supabase
            .rpc('check_admin_status', { p_user_id: user.id });
          console.log('📊 New admin status:', newStatus);
        }
      }
    } else {
      console.log('ℹ️  Admin system already initialized');
    }
    console.log('');

    // 6. Test helper functions
    console.log('🧪 Testing helper functions...');
    
    // Test get_user_id_by_email
    if (user.email) {
      const { data: userIdByEmail, error: emailError } = await supabase
        .rpc('get_user_id_by_email', { p_email: user.email });

      if (emailError) {
        console.log('⚠️  Error getting user by email:', emailError.message);
      } else {
        console.log('✅ User ID by email lookup:', userIdByEmail === user.id ? 'MATCH' : 'MISMATCH');
      }
    }

    // 7. Test admin logs
    console.log('📝 Checking admin logs...');
    const { data: logs, error: logsError } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.log('⚠️  Error getting admin logs:', logsError.message);
    } else {
      console.log('📋 Recent admin actions:', logs?.length || 0);
      if (logs && logs.length > 0) {
        logs.forEach((log, index) => {
          console.log(`  ${index + 1}. ${log.action} at ${log.created_at}`);
        });
      }
    }
    console.log('');

    // 8. Environment variable check
    console.log('🌍 Checking environment variables...');
    const superAdminEmails = process.env.VITE_SUPER_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAILS || '';
    
    if (superAdminEmails) {
      const emailList = superAdminEmails.split(',').map(e => e.trim());
      console.log('✅ Super admin emails configured:', emailList.length);
      
      if (user.email && emailList.includes(user.email)) {
        console.log('🌟 Current user is a super admin via environment variables!');
      } else {
        console.log('ℹ️  Current user not in super admin email list');
      }
    } else {
      console.log('⚠️  No super admin emails configured in environment variables');
      console.log('💡 Add VITE_SUPER_ADMIN_EMAILS to your .env file');
    }
    console.log('');

    // 9. Final summary
    console.log('📋 Test Summary:');
    console.log('================');
    console.log(`✅ User authenticated: ${user.email}`);
    console.log(`✅ Admin tables exist: ${tables?.length === 3 ? 'YES' : 'PARTIAL'}`);
    console.log(`✅ Admin functions work: ${!statusError ? 'YES' : 'NO'}`);
    console.log(`✅ Admin users count: ${adminUsers?.length || 0}`);
    console.log(`✅ Current user is admin: ${adminStatus?.is_admin ? 'YES' : 'NO'}`);
    console.log(`✅ Environment config: ${superAdminEmails ? 'YES' : 'NO'}`);

    console.log('\n🎉 UUID Admin System test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Helper function to test with authentication
async function testWithAuth() {
  console.log('🔐 Testing admin system with authentication...\n');
  
  // You can uncomment and modify this section to test with actual credentials
  /*
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'your-email@example.com',
    password: 'your-password'
  });
  
  if (error) {
    console.error('❌ Authentication failed:', error.message);
    return;
  }
  
  console.log('✅ Signed in successfully');
  */
  
  await testUUIDAdminSystem();
}

// Run the test
testWithAuth().catch(console.error);

// ===================================================================
// DIRECT SQL COMMANDS (for manual testing in Supabase SQL editor)
// ===================================================================

/*

-- 1. Check if admin system is set up
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'admin_users') as admin_tables_exist,
  (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as active_admins;

-- 2. Get your user ID (replace email)
SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com';

-- 3. Initialize admin system (replace with your UUID)
SELECT initialize_admin_system('your-uuid-here', 'super');

-- 4. Check admin status (replace with your UUID)
SELECT check_admin_status('your-uuid-here');

-- 5. Get all admin users
SELECT * FROM get_admin_users();

-- 6. Add another admin user (replace UUIDs)
SELECT add_admin_user('target-user-uuid', 'admin', ARRAY['user_management'], 'your-uuid');

-- 7. View admin logs
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 10;

-- 8. Get user ID by email (helper function)
SELECT get_user_id_by_email('user@example.com');

-- 9. Update admin permissions (replace UUIDs)
SELECT update_admin_permissions('user-uuid', ARRAY['user_management', 'reports'], 'your-uuid');

-- 10. Remove admin privileges (replace UUIDs)
SELECT remove_admin_user('user-uuid', 'your-uuid');

*/

console.log('\n💡 Tip: Check the SQL commands at the bottom of this file for manual testing in Supabase SQL editor');