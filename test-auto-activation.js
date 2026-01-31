// Test Auto-Activation System
// Run this with: node test-auto-activation.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutoActivation() {
  console.log('🚀 Testing Auto-Activation System...\n');

  try {
    // 1. Get current stats
    console.log('📊 Getting current activation stats...');
    const { data: stats, error: statsError } = await supabase.rpc('get_activation_stats');
    
    if (statsError) {
      console.error('❌ Error getting stats:', statsError);
      return;
    }
    
    console.log('Stats:', {
      totalUsers: stats.total_users,
      activatedUsers: stats.activated_users,
      pendingUsers: stats.pending_users,
      activationRate: stats.activation_rate + '%'
    });
    console.log('');

    // 2. Preview test users that would be activated
    console.log('👀 Previewing test users for activation...');
    const { data: preview, error: previewError } = await supabase.rpc('preview_activation_candidates', {
      p_username_pattern: 'test',
      p_limit: 5
    });
    
    if (previewError) {
      console.error('❌ Error previewing:', previewError);
    } else {
      console.log('Test users found:', preview?.length || 0);
      if (preview && preview.length > 0) {
        preview.forEach(user => {
          console.log(`  - ID: ${user.user_id}, Username: ${user.username}, Created: ${user.created_at}`);
        });
      }
    }
    console.log('');

    // 3. Test single user activation by ID (replace with actual user ID)
    const testUserId = 1; // Replace with an actual non-activated user ID
    console.log(`🔧 Testing single user activation (ID: ${testUserId})...`);
    
    const { data: singleResult, error: singleError } = await supabase.rpc('auto_activate_user', {
      p_user_id: testUserId,
      p_reason: 'Test activation from script',
      p_rzc_amount: 150.0
    });
    
    if (singleError) {
      console.log('⚠️  Single activation result:', singleError.message);
    } else {
      console.log('✅ Single activation result:', {
        success: singleResult.success,
        message: singleResult.message,
        username: singleResult.username
      });
    }
    console.log('');

    // 4. Test activation by username
    const testUsername = 'testuser'; // Replace with actual username
    console.log(`🔧 Testing activation by username (${testUsername})...`);
    
    const { data: usernameResult, error: usernameError } = await supabase.rpc('auto_activate_user_by_username', {
      p_username: testUsername,
      p_reason: 'Test activation by username from script'
    });
    
    if (usernameError) {
      console.log('⚠️  Username activation result:', usernameError.message);
    } else {
      console.log('✅ Username activation result:', {
        success: usernameResult.success,
        message: usernameResult.activation_result?.message || usernameResult.error
      });
    }
    console.log('');

    // 5. Test bulk activation (replace with actual user IDs)
    const testUserIds = [1, 2, 3]; // Replace with actual non-activated user IDs
    console.log(`🔧 Testing bulk activation (IDs: ${testUserIds.join(', ')})...`);
    
    const { data: bulkResult, error: bulkError } = await supabase.rpc('bulk_auto_activate_users', {
      p_user_ids: testUserIds,
      p_reason: 'Test bulk activation from script'
    });
    
    if (bulkError) {
      console.log('⚠️  Bulk activation error:', bulkError.message);
    } else {
      console.log('✅ Bulk activation result:', {
        totalProcessed: bulkResult.total_processed,
        successCount: bulkResult.success_count,
        errorCount: bulkResult.error_count
      });
    }
    console.log('');

    // 6. Test conditional activation (activate users created today)
    console.log('🔧 Testing conditional activation (today\'s users)...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: conditionalResult, error: conditionalError } = await supabase.rpc('auto_activate_users_by_criteria', {
      p_created_after: today.toISOString(),
      p_reason: 'Test conditional activation - today\'s users',
      p_limit: 10
    });
    
    if (conditionalError) {
      console.log('⚠️  Conditional activation error:', conditionalError.message);
    } else {
      console.log('✅ Conditional activation result:', {
        totalProcessed: conditionalResult.total_processed,
        successCount: conditionalResult.success_count,
        errorCount: conditionalResult.error_count
      });
    }
    console.log('');

    // 7. Get updated stats
    console.log('📊 Getting updated stats...');
    const { data: updatedStats, error: updatedStatsError } = await supabase.rpc('get_activation_stats');
    
    if (updatedStatsError) {
      console.error('❌ Error getting updated stats:', updatedStatsError);
    } else {
      console.log('Updated Stats:', {
        totalUsers: updatedStats.total_users,
        activatedUsers: updatedStats.activated_users,
        pendingUsers: updatedStats.pending_users,
        activationRate: updatedStats.activation_rate + '%',
        todayActivations: updatedStats.today_activations
      });
    }

    console.log('\n✅ Auto-activation system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to create test users (optional)
async function createTestUsers() {
  console.log('🔧 Creating test users...');
  
  const testUsers = [
    { username: 'testuser1', display_name: 'Test User 1', telegram_id: 1001 },
    { username: 'testuser2', display_name: 'Test User 2', telegram_id: 1002 },
    { username: 'testuser3', display_name: 'Test User 3', telegram_id: 1003 }
  ];

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: user.username,
          display_name: user.display_name,
          telegram_id: user.telegram_id,
          wallet_activated: false
        }])
        .select();

      if (error) {
        console.log(`⚠️  User ${user.username} might already exist:`, error.message);
      } else {
        console.log(`✅ Created test user: ${user.username} (ID: ${data[0]?.id})`);
      }
    } catch (err) {
      console.log(`⚠️  Error creating ${user.username}:`, err.message);
    }
  }
  console.log('');
}

// Run the tests
async function main() {
  // Uncomment this if you want to create test users first
  // await createTestUsers();
  
  await testAutoActivation();
}

main().catch(console.error);

// ===================================================================
// DIRECT SQL COMMANDS (for manual testing in Supabase SQL editor)
// ===================================================================

/*

-- 1. Get current stats
SELECT get_activation_stats();

-- 2. Preview users that would be activated
SELECT * FROM preview_activation_candidates('test', NULL, NULL, 10);

-- 3. Activate single user by ID
SELECT auto_activate_user(123, 'Manual test activation');

-- 4. Activate user by username
SELECT auto_activate_user_by_username('testuser1', 'Username activation test');

-- 5. Bulk activate multiple users
SELECT bulk_auto_activate_users(ARRAY[123, 124, 125], 'Bulk test activation');

-- 6. Activate users by criteria (e.g., test users)
SELECT auto_activate_users_by_criteria(NULL, NULL, 'test', 'Test user activation', 150.0, 10);

-- 7. Activate users created today
SELECT auto_activate_users_by_criteria(CURRENT_DATE, NULL, NULL, 'Today users activation', 150.0, 100);

-- 8. Check specific user status
SELECT * FROM users WHERE id = 123;
SELECT * FROM airdrop_balances WHERE user_id = 123;
SELECT * FROM wallet_activations WHERE user_id = 123 ORDER BY created_at DESC;

-- 9. DANGEROUS: Activate ALL users (use with extreme caution!)
-- SELECT auto_activate_all_users('Mass activation event', 150.0, 1000);

*/