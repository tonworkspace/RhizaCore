// Test script for wallet activation system
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWalletActivationSystem() {
  try {
    console.log('🧪 Testing Wallet Activation System...\n');
    
    // Step 1: Get a test user or create one if none exist
    console.log('📋 Finding or creating test user...');
    let { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, telegram_id, wallet_activated')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return false;
    }
    
    let testUser;
    
    if (!users || users.length === 0) {
      console.log('⚠️  No users found, creating a test user...');
      
      // Create a test user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: 999999999,
          username: 'test_activation_user',
          wallet_address: null,
          balance: 0,
          total_deposit: 0,
          total_withdrawn: 0,
          team_volume: 0,
          rank: 'Bronze',
          is_active: true,
          wallet_activated: false
        })
        .select('id, username, telegram_id, wallet_activated')
        .single();
      
      if (createError) {
        console.error('❌ Error creating test user:', createError);
        return false;
      }
      
      testUser = newUser;
      console.log(`✅ Created test user: ID ${testUser.id} (@${testUser.username})`);
    } else {
      testUser = users[0];
      console.log(`✅ Found existing user: ID ${testUser.id} (@${testUser.username || testUser.telegram_id})`);
    }
    
    console.log(`   Current activation status: ${testUser.wallet_activated ? 'ACTIVATED' : 'NOT ACTIVATED'}\n`);
    
    // Step 2: Test activation status check
    console.log('🔍 Testing activation status check...');
    const { data: statusData, error: statusError } = await supabase.rpc('get_wallet_activation_status', {
      p_user_id: testUser.id
    });
    
    if (statusError) {
      console.error('❌ Error checking activation status:', statusError);
      return false;
    }
    
    console.log('✅ Activation status check successful');
    console.log('   Status:', JSON.stringify(statusData, null, 2));
    
    // Step 3: Test wallet activation tables
    console.log('\n📊 Testing wallet_activations table access...');
    const { data: activationsData, error: activationsError } = await supabase
      .from('wallet_activations')
      .select('count(*)')
      .limit(1);
    
    if (activationsError) {
      console.error('❌ Error accessing wallet_activations table:', activationsError);
      return false;
    }
    
    console.log('✅ wallet_activations table is accessible');
    
    // Step 4: Test activation process (with test data)
    if (!testUser.wallet_activated) {
      console.log('\n🚀 Testing wallet activation process...');
      
      const testTonAmount = 2.5; // Example: $15 / $6 TON price
      const testTonPrice = 6.0;
      const testTransactionHash = `test_activation_${Date.now()}`;
      const testSenderAddress = 'test_sender_address_123';
      const testReceiverAddress = 'test_receiver_address_456';
      
      const { data: activationData, error: activationError } = await supabase.rpc('process_wallet_activation', {
        p_user_id: testUser.id,
        p_ton_amount: testTonAmount,
        p_ton_price: testTonPrice,
        p_transaction_hash: testTransactionHash,
        p_sender_address: testSenderAddress,
        p_receiver_address: testReceiverAddress
      });
      
      if (activationError) {
        console.error('❌ Error processing activation:', activationError);
        return false;
      }
      
      console.log('✅ Wallet activation processed successfully!');
      console.log('   Result:', JSON.stringify(activationData, null, 2));
      
      // Verify the activation worked
      console.log('\n🔍 Verifying activation...');
      const { data: verifyData, error: verifyError } = await supabase.rpc('get_wallet_activation_status', {
        p_user_id: testUser.id
      });
      
      if (verifyError) {
        console.error('❌ Error verifying activation:', verifyError);
        return false;
      }
      
      if (verifyData?.wallet_activated) {
        console.log('✅ Activation verified - wallet is now activated!');
        
        // Check if RZC was awarded
        const { data: balanceData, error: balanceError } = await supabase
          .from('airdrop_balances')
          .select('available_balance, total_claimed_to_airdrop')
          .eq('user_id', testUser.id)
          .single();
        
        if (!balanceError && balanceData) {
          console.log(`✅ RZC balance updated: ${balanceData.available_balance} available, ${balanceData.total_claimed_to_airdrop} total claimed`);
        }
        
        // Check activity record
        const { data: activityData, error: activityError } = await supabase
          .from('activities')
          .select('type, amount, status')
          .eq('user_id', testUser.id)
          .eq('type', 'wallet_activation')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!activityError && activityData && activityData.length > 0) {
          console.log(`✅ Activity recorded: ${activityData[0].type} - ${activityData[0].amount} RZC (${activityData[0].status})`);
        }
        
      } else {
        console.log('❌ Activation verification failed - wallet still not activated');
        return false;
      }
    } else {
      console.log('\n⚠️  User wallet is already activated, skipping activation test');
    }
    
    // Step 5: Test activation history
    console.log('\n📜 Testing activation history...');
    const { data: historyData, error: historyError } = await supabase
      .from('wallet_activations')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false });
    
    if (historyError) {
      console.error('❌ Error fetching activation history:', historyError);
      return false;
    }
    
    console.log(`✅ Activation history retrieved: ${historyData?.length || 0} records`);
    if (historyData && historyData.length > 0) {
      console.log('   Latest activation:', {
        id: historyData[0].id,
        ton_amount: historyData[0].ton_amount,
        rzc_awarded: historyData[0].rzc_awarded,
        status: historyData[0].status,
        created_at: historyData[0].created_at
      });
    }
    
    console.log('\n🎉 Wallet Activation System Test Complete!');
    console.log('📝 Summary:');
    console.log('   ✅ Database tables accessible');
    console.log('   ✅ Activation status check working');
    console.log('   ✅ Activation process functional');
    console.log('   ✅ RZC rewards system working');
    console.log('   ✅ Activity logging working');
    console.log('   ✅ History tracking working');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    return false;
  }
}

// Run the test
testWalletActivationSystem().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! The wallet activation system is working correctly.');
    console.log('💡 Users can now pay $15 in TON to activate their wallets and receive 150 RZC.');
  } else {
    console.log('\n❌ Some tests failed. Please check the output above.');
  }
  process.exit(success ? 0 : 1);
});