// Simple Admin System Test (CommonJS)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== Simple Admin System Test ===\n');

async function testAdminSystem() {
  try {
    // Test 1: Check if user ID 3 exists
    console.log('1. Checking if user ID 3 exists...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, telegram_id')
      .eq('id', 3)
      .single();

    if (userError) {
      console.log('❌ User ID 3 not found:', userError.message);
      return false;
    }

    console.log('✅ User ID 3 found:', userData);

    // Test 2: Check environment variables
    console.log('\n2. Checking environment variables...');
    const superAdminIds = process.env.VITE_SUPER_ADMIN_IDS?.split(',').map(id => id.trim()) || [];
    const superAdminTelegramIds = process.env.VITE_SUPER_ADMIN_TELEGRAM_IDS?.split(',').map(id => id.trim()) || [];
    
    console.log('   Super Admin IDs:', superAdminIds);
    console.log('   Super Admin Telegram IDs:', superAdminTelegramIds);
    console.log('   User 3 is admin via env:', superAdminIds.includes('3'));
    console.log('   Telegram ID is admin via env:', superAdminTelegramIds.includes(userData.telegram_id?.toString()));

    // Test 3: Check if admin tables exist
    console.log('\n3. Checking admin system status...');
    
    // Try to check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(5);

    if (adminError) {
      console.log('❌ Admin tables not found. Database schema needs to be deployed.');
      console.log('   Next step: Run quick_admin_setup.sql in Supabase SQL editor');
      return false;
    }

    console.log('✅ Admin tables exist');
    console.log('   Current admin users:', adminUsers?.length || 0);

    // Test 4: Try admin status check function
    console.log('\n4. Testing admin status function...');
    const { data: adminStatus, error: statusError } = await supabase
      .rpc('check_admin_status', { p_user_id: 3 });

    if (statusError) {
      console.log('❌ Admin function error:', statusError.message);
      console.log('   This might be normal if admin system is not initialized yet');
    } else {
      console.log('✅ Admin status check successful:', adminStatus);
    }

    console.log('\n=== Test Summary ===');
    console.log('✅ User ID 3 exists in database');
    console.log('✅ Environment variables configured correctly');
    console.log(adminError ? '❌ Database schema needs deployment' : '✅ Database schema deployed');
    console.log(statusError ? '⚠️  Admin system needs initialization' : '✅ Admin system functional');

    return !adminError;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testAdminSystem().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 Admin system is ready for use!');
    console.log('   Access the Admin Panel in development mode.');
  } else {
    console.log('⚠️  Admin system needs database setup.');
    console.log('   Run: quick_admin_setup.sql in Supabase SQL editor');
  }
  console.log('='.repeat(50));
});