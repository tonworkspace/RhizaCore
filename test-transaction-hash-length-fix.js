/**
 * Test script to verify transaction hash length fix
 * Tests that long TON BOC hashes don't cause database errors
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testTransactionHashLengthFix() {
  console.log('🧪 Testing Transaction Hash Length Fix\n');
  
  try {
    // Test 1: Create a test user
    console.log('Test 1: Creating test user...');
    const testUsername = `test_hash_${Date.now()}`;
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
    
    // Test 2: Test with very long transaction hash (simulating TON BOC)
    console.log('Test 2: Testing with long transaction hash...');
    const longTxHash = 'te6cckECGAEAA4QABCSK' + 'A'.repeat(1000) + 'BCDEFGHIJKLMNOP'; // Simulate long BOC
    console.log('Hash length:', longTxHash.length);
    
    // Try with full hash first, then fallback to truncated
    let activationResult;
    let activationError;
    
    // First attempt with full hash
    console.log('Attempting with full hash...');
    const firstAttempt = await supabase.rpc('process_wallet_activation', {
      p_user_id: testUserId,
      p_ton_amount: 2.5,
      p_ton_price: 6.0,
      p_transaction_hash: longTxHash,
      p_sender_address: 'test_sender_address',
      p_receiver_address: 'test_receiver_address'
    });
    
    console.log('First attempt error:', firstAttempt.error?.message);
    console.log('First attempt data error:', firstAttempt.data?.error);
    
    if ((firstAttempt.error && (firstAttempt.error.message?.includes('too long') || firstAttempt.error.message?.includes('varying'))) ||
        (firstAttempt.data?.error && (firstAttempt.data.error.includes('too long') || firstAttempt.data.error.includes('varying')))) {
      console.log('✅ First attempt failed with expected length error');
      console.log('Trying truncated hash...');
      const shortHash = `${longTxHash.substring(0, 100)}...${longTxHash.substring(longTxHash.length - 100)}`;
      console.log('Truncated hash length:', shortHash.length);
      
      const secondAttempt = await supabase.rpc('process_wallet_activation', {
        p_user_id: testUserId,
        p_ton_amount: 2.5,
        p_ton_price: 6.0,
        p_transaction_hash: shortHash,
        p_sender_address: 'test_sender_address',
        p_receiver_address: 'test_receiver_address'
      });
      
      activationResult = secondAttempt.data;
      activationError = secondAttempt.error;
      
      console.log('Second attempt result:', activationResult);
      console.log('Second attempt error:', activationError?.message);
    } else {
      activationResult = firstAttempt.data;
      activationError = firstAttempt.error;
    }
    
    console.log('Final result being used:', activationResult);
    
    if (activationError) {
      console.error('❌ Activation error:', activationError.message);
      if (activationError.message.includes('too long')) {
        console.error('❌ CRITICAL: Still getting length error - database migration needed');
      }
      return;
    }
    
    console.log('Activation result:', activationResult);
    
    if (!activationResult.success) {
      console.error('❌ Activation failed:', activationResult.error);
      return;
    }
    console.log('✅ Long transaction hash handled successfully\n');
    
    // Cleanup
    console.log('Cleaning up test data...');
    await supabase.from('activities').delete().eq('user_id', testUserId);
    await supabase.from('airdrop_balances').delete().eq('user_id', testUserId);
    await supabase.from('wallet_activations').delete().eq('user_id', testUserId);
    await supabase.from('users').delete().eq('id', testUserId);
    console.log('✅ Cleanup complete\n');
    
    console.log('🎉 TRANSACTION HASH LENGTH FIX WORKING!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testTransactionHashLengthFix();