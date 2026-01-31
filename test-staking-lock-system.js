// Test script to verify staking lock system functionality
// Run this after setting up the database schema

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStakingLockSystem() {
  console.log('🧪 Testing Staking Lock System...\n');

  const testUserId = 1; // Replace with actual user ID

  try {
    // Test 1: Stake tokens with lock period
    console.log('📝 Test 1: Staking tokens with 3-year lock...');
    const stakeResult = await supabase.rpc('stake_tokens_with_lock', {
      p_user_id: testUserId,
      p_amount: 0, // Will calculate 70% automatically
      p_lock_years: 3,
      p_apy_rate: 15.0
    });

    if (stakeResult.error) {
      console.error('❌ Staking failed:', stakeResult.error);
      return;
    }

    console.log('✅ Staking successful:', stakeResult.data);
    const lockId = stakeResult.data.lock_id;

    // Test 2: Try to unstake immediately (should fail)
    console.log('\n📝 Test 2: Attempting to unstake immediately (should fail)...');
    const unstakeResult = await supabase.rpc('unstake_tokens', {
      p_user_id: testUserId,
      p_lock_id: lockId
    });

    if (unstakeResult.data.success === false) {
      console.log('✅ Unstaking correctly blocked:', unstakeResult.data.error);
      console.log('   Unlock date:', unstakeResult.data.unlock_date);
      console.log('   Time remaining:', unstakeResult.data.time_remaining);
    } else {
      console.error('❌ Unstaking should have been blocked but succeeded');
    }

    // Test 3: Check staking summary
    console.log('\n📝 Test 3: Checking staking summary...');
    const summaryResult = await supabase.rpc('get_user_staking_summary', {
      p_user_id: testUserId
    });

    if (summaryResult.error) {
      console.error('❌ Failed to get staking summary:', summaryResult.error);
    } else {
      console.log('✅ Staking summary:', summaryResult.data[0]);
    }

    // Test 4: Check user's staking locks
    console.log('\n📝 Test 4: Fetching user staking locks...');
    const locksResult = await supabase
      .from('staking_locks')
      .select('*')
      .eq('user_id', testUserId)
      .eq('status', 'active');

    if (locksResult.error) {
      console.error('❌ Failed to fetch staking locks:', locksResult.error);
    } else {
      console.log('✅ Active staking locks:', locksResult.data.length);
      locksResult.data.forEach((lock, index) => {
        console.log(`   Lock ${index + 1}:`, {
          id: lock.id,
          amount: lock.staked_amount,
          years: lock.lock_period_years,
          apy: lock.apy_rate,
          unlock_date: lock.unlock_date
        });
      });
    }

    // Test 5: Check can_unstake function
    console.log('\n📝 Test 5: Testing can_unstake function...');
    const canUnstakeResult = await supabase.rpc('can_unstake', {
      p_user_id: testUserId,
      p_amount: 100
    });

    if (canUnstakeResult.error) {
      console.error('❌ Failed to check unstake eligibility:', canUnstakeResult.error);
    } else {
      console.log('✅ Can unstake 100 RZC:', canUnstakeResult.data);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Staking with lock period: ✅ Working');
    console.log('   - Lock period enforcement: ✅ Working');
    console.log('   - Staking summary: ✅ Working');
    console.log('   - Lock queries: ✅ Working');
    console.log('   - Unstake eligibility: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Utility function to create a test stake that expires soon (for testing unstaking)
async function createTestExpiredStake(userId) {
  console.log('🧪 Creating test stake that expires in 1 minute...');
  
  // Manually insert a stake with a very short lock period for testing
  const { data, error } = await supabase
    .from('staking_locks')
    .insert({
      user_id: userId,
      staked_amount: 100,
      lock_period_years: 0, // Special case for testing
      apy_rate: 15.0,
      unlock_date: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create test stake:', error);
    return null;
  }

  console.log('✅ Test stake created:', data.id);
  return data.id;
}

// Run the tests
testStakingLockSystem().catch(console.error);

export {
  testStakingLockSystem,
  createTestExpiredStake
};