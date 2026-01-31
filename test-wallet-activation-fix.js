/**
 * Test script to verify wallet activation fix
 * Tests that users don't get asked to pay again after successful activation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testWalletActivationFlow() {
  console.log('🧪 Testing Wallet Activation Fix\n');
  
  try {
    // Test 1: Check if activation functions exist
    console.log('Test 1: Checking database functions...');
    const { data: functions, error: funcError } = await supabase.rpc('get_wallet_activation_status', {
      p_user_id: 1
    });
    
    if (funcError) {
      console.error('❌ Database function error:', funcError.message);
      return;
    }
    console.log('✅ Database functions are working\n');
    
    // Test 2: Create a test user
    console.log('Test 2: Creating test user...');
    const testUsername = `test_activation_${Date.now()}`;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        telegram_id: Math.floor(Math.random() * 1000000),
        username: testUsername,
        display_name: testUsername,
        wallet_activated: false
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Error creating test user:', userError.message);
      return;
    }
    console.log('✅ Test user created:', userData.id, '\n');
    
    const testUserId = userData.id;
    
    // Test 3: Check initial activation status
    console.log('Test 3: Checking initial activation status...');
    const { data: initialStatus, error: statusError1 } = await supabase.rpc('get_wallet_activation_status', {
      p_user_id: testUserId
    });
    
    if (statusError1) {
      console.error('❌ Error checking status:', statusError1.message);
      return;
    }
    
    console.log('Initial status:', {
      wallet_activated: initialStatus.wallet_activated,
      should_be: false
    });
    
    if (initialStatus.wallet_activated) {
      console.error('❌ User should not be activated initially');
      return;
    }
    console.log('✅ Initial status correct\n');
    
    // Test 4: Process activation
    console.log('Test 4: Processing wallet activation...');
    const testTxHash = `test_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: activationResult, error: activationError } = await supabase.rpc('process_wallet_activation', {
      p_user_id: testUserId,
      p_ton_amount: 2.5,
      p_ton_price: 6.0,
      p_transaction_hash: testTxHash,
      p_sender_address: 'test_sender_address',
      p_receiver_address: 'test_receiver_address'
    });
    
    if (activationError) {
      console.error('❌ Activation error:', activationError.message);
      return;
    }
    
    console.log('Activation result:', activationResult);
    
    if (!activationResult.success) {
      console.error('❌ Activation failed:', activationResult.error);
      return;
    }
    console.log('✅ Activation successful\n');
    
    // Test 5: Verify activation status after payment
    console.log('Test 5: Verifying activation status after payment...');
    const { data: afterStatus, error: statusError2 } = await supabase.rpc('get_wallet_activation_status', {
      p_user_id: testUserId
    });
    
    if (statusError2) {
      console.error('❌ Error checking status:', statusError2.message);
      return;
    }
    
    console.log('After activation status:', {
      wallet_activated: afterStatus.wallet_activated,
      should_be: true,
      activation_details: afterStatus.activation_details
    });
    
    if (!afterStatus.wallet_activated) {
      console.error('❌ CRITICAL: User should be activated after payment!');
      console.error('This is the bug - user will be asked to pay again');
      return;
    }
    console.log('✅ Status correctly shows activated\n');
    
    // Test 6: Try to activate again (should fail)
    console.log('Test 6: Testing duplicate activation prevention...');
    const { data: duplicateResult, error: duplicateError } = await supabase.rpc('process_wallet_activation', {
      p_user_id: testUserId,
      p_ton_amount: 2.5,
      p_ton_price: 6.0,
      p_transaction_hash: `test_tx_duplicate_${Date.now()}`,
      p_sender_address: 'test_sender_address',
      p_receiver_address: 'test_receiver_address'
    });
    
    if (duplicateError) {
      console.error('❌ Unexpected error:', duplicateError.message);
      return;
    }
    
    console.log('Duplicate activation result:', duplicateResult);
    
    if (duplicateResult.success) {
      console.error('❌ CRITICAL: Should not allow duplicate activation!');
      return;
    }
    
    if (duplicateResult.error !== 'Wallet already activated') {
      console.error('❌ Wrong error message:', duplicateResult.error);
      return;
    }
    console.log('✅ Duplicate activation correctly prevented\n');
    
    // Test 7: Verify RZC balance was credited
    console.log('Test 7: Verifying RZC balance...');
    const { data: balanceData, error: balanceError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (balanceError) {
      console.error('❌ Error fetching balance:', balanceError.message);
      return;
    }
    
    console.log('Balance data:', {
      available_balance: balanceData.available_balance,
      should_be: 150
    });
    
    if (balanceData.available_balance !== 150) {
      console.error('❌ Wrong balance amount');
      return;
    }
    console.log('✅ RZC balance correctly credited\n');
    
    // Test 8: Check activity log
    console.log('Test 8: Verifying activity log...');
    const { data: activities, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'wallet_activation');
    
    if (activityError) {
      console.error('❌ Error fetching activities:', activityError.message);
      return;
    }
    
    console.log('Activities found:', activities.length);
    
    if (activities.length === 0) {
      console.error('❌ No activity logged');
      return;
    }
    console.log('✅ Activity correctly logged\n');
    
    // Cleanup
    console.log('Cleaning up test data...');
    await supabase.from('activities').delete().eq('user_id', testUserId);
    await supabase.from('airdrop_balances').delete().eq('user_id', testUserId);
    await supabase.from('wallet_activations').delete().eq('user_id', testUserId);
    await supabase.from('users').delete().eq('id', testUserId);
    console.log('✅ Cleanup complete\n');
    
    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n✅ Wallet activation fix is working correctly');
    console.log('✅ Users will not be asked to pay again after successful activation');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testWalletActivationFlow();
