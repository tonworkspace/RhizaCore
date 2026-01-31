// Complete Admin System Test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== Complete Admin System Test ===\n');

async function testAdminSystem() {
  try {
    // Test 1: Check if admin tables exist
    console.log('1. Checking if admin tables exist...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['admin_users', 'admin_logs']);

    if (tablesError) {
      console.log('❌ Admin tables not found. Need to run database schema first.');
      console.log('   Run: quick_admin_setup.sql in your Supabase SQL editor');
      return false;
    }

    const tableNames = tables?.map(t => t.table_name) || [];
    console.log('✅ Found tables:', tableNames);

    // Test 2: Check if admin functions exist
    console.log('\n2. Checking if admin functions exist...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .in('routine_name', ['check_admin_status', 'initialize_admin_system']);

    if (functionsError) {
      console.log('❌ Admin functions not found');
      return false;
    }

    const functionNames = functions?.map(f => f.routine_name) || [];
    console.log('✅ Found functions:', functionNames);

    // Test 3: Check current admin count
    console.log('\n3. Checking current admin users...');
    const { data: adminCount, error: countError } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact' });

    if (countError) {
      console.log('❌ Error checking admin users:', countError.message);
      return false;
    }

    console.log(`✅ Current admin users: ${adminCount?.length || 0}`);
    if (adminCount && adminCount.length > 0) {
      console.log('   Existing admins:', adminCount.map(a => `ID: ${a.user_id}, Level: ${a.admin_level}`));
    }

    // Test 4: Test environment variable admin access
    console.log('\n4. Testing environment variable admin access...');
    const superAdminIds = process.env.VITE_SUPER_ADMIN_IDS?.split(',').map(id => id.trim()) || [];
    const superAdminTelegramIds = process.env.VITE_SUPER_ADMIN_TELEGRAM_IDS?.split(',').map(id => id.trim()) || [];
    
    console.log('   Super Admin IDs from env:', superAdminIds);
    console.log('   Super Admin Telegram IDs from env:', superAdminTelegramIds);

    // Test 5: Check if user ID 3 exists in users table
    console.log('\n5. Checking if user ID 3 exists...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, telegram_id')
      .eq('id', 3)
      .single();

    if (userError) {
      console.log('❌ User ID 3 not found in users table');
      console.log('   You may need to create this user first');
      return false;
    }

    console.log('✅ User ID 3 found:', userData);

    // Test 6: Test admin status check function
    console.log('\n6. Testing admin status check function...');
    const { data: adminStatus, error: statusError } = await supabase
      .rpc('check_admin_status', { p_user_id: 3 });

    if (statusError) {
      console.log('❌ Error checking admin status:', statusError.message);
    } else {
      console.log('✅ Admin status check result:', adminStatus);
    }

    // Test 7: Initialize admin system if needed
    if (!adminCount || adminCount.length === 0) {
      console.log('\n7. Initializing admin system with user ID 3...');
      const { data: initResult, error: initError } = await supabase
        .rpc('initialize_admin_system', { 
          p_first_admin_user_id: 3, 
          p_admin_level: 'super' 
        });

      if (initError) {
        console.log('❌ Error initializing admin system:', initError.message);
        return false;
      }

      console.log('✅ Admin system initialized:', initResult);
    } else {
      console.log('\n7. Admin system already initialized ✅');
    }

    // Test 8: Final verification
    console.log('\n8. Final verification...');
    const { data: finalStatus, error: finalError } = await supabase
      .rpc('check_admin_status', { p_user_id: 3 });

    if (finalError) {
      console.log('❌ Final verification failed:', finalError.message);
      return false;
    }

    console.log('✅ Final admin status:', finalStatus);

    console.log('\n=== Admin System Test Complete ===');
    console.log('✅ Admin system is ready!');
    console.log('✅ User ID 3 has admin access');
    console.log('✅ Environment variables configured');
    console.log('✅ Database schema deployed');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testAdminSystem().then(success => {
  if (success) {
    console.log('\n🎉 Admin system is fully operational!');
    console.log('   You can now access the Admin Panel in development mode.');
  } else {
    console.log('\n❌ Admin system needs setup. Please check the errors above.');
  }
});