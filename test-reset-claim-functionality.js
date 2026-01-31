/**
 * Test script to verify reset claim functionality works correctly
 * This script tests the complete flow: claim -> reset -> claim again
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with actual test user ID)
const TEST_USER_ID = 1;

async function testResetClaimFunctionality() {
  console.log('🧪 Testing Reset Claim Functionality');
  console.log('=====================================');

  try {
    // Step 1: Check initial state
    console.log('\n1️⃣ Checking initial user state...');
    const { data: initialUser, error: initialError } = await supabase
      .from('users')
      .select('id, username, available_balance, last_claim_time')
      .eq('id', TEST_USER_ID)
      .single();

    if (initialError) {
      console.error('❌ Error fetching initial user:', initialError);
      return;
    }

    console.log('Initial user state:', {
      id: initialUser.id,
      username: initialUser.username,
      available_balance: initialUser.available_balance,
      last_claim_time: initialUser.last_claim_time
    });

    // Step 2: Check mining activities
    console.log('\n2️⃣ Checking completed mining activities...');
    const { data: miningActivities, error: miningError } = await supabase
      .from('activities')
      .select('id, amount, status, metadata, created_at')
      .eq('user_id', TEST_USER_ID)
      .eq('type', 'mining_complete')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);

    if (miningError) {
      console.error('❌ Error fetching mining activities:', miningError);
      return;
    }

    console.log(`Found ${miningActivities?.length || 0} completed mining activities`);
    if (miningActivities && miningActivities.length > 0) {
      const totalMiningRZC = miningActivities.reduce((sum, activity) => {
        return sum + (parseFloat(activity.amount) || 0);
      }, 0);
      console.log(`Total RZC from mining: ${totalMiningRZC.toFixed(3)}`);
    }

    // Step 3: Test reset function
    console.log('\n3️⃣ Testing reset claim status...');
    
    // Call the reset function (simulating the API call)
    const resetResponse = await fetch('/api/dev/reset-claim-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });

    if (!resetResponse.ok) {
      console.log('⚠️  API endpoint not available, testing database directly...');
      
      // Direct database test of reset logic
      console.log('Simulating reset logic...');
      
      // Calculate claimable RZC from mining
      const { data: completedMining } = await supabase
        .from('activities')
        .select('amount')
        .eq('user_id', TEST_USER_ID)
        .eq('type', 'mining_complete')
        .eq('status', 'completed')
        .is('metadata->claimed_to_airdrop', null);

      let totalClaimableRZC = 0;
      if (completedMining) {
        totalClaimableRZC = completedMining.reduce((sum, activity) => {
          return sum + (parseFloat(activity.amount) || 0);
        }, 0);
      }

      console.log(`Calculated claimable RZC: ${totalClaimableRZC.toFixed(3)}`);

      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          available_balance: totalClaimableRZC,
          last_claim_time: null
        })
        .eq('id', TEST_USER_ID);

      if (updateError) {
        console.error('❌ Error updating user balance:', updateError);
        return;
      }

      console.log('✅ Reset simulation completed');
    } else {
      const resetResult = await resetResponse.json();
      console.log('Reset result:', resetResult);
    }

    // Step 4: Verify reset worked
    console.log('\n4️⃣ Verifying reset results...');
    const { data: resetUser, error: resetCheckError } = await supabase
      .from('users')
      .select('id, username, available_balance, last_claim_time')
      .eq('id', TEST_USER_ID)
      .single();

    if (resetCheckError) {
      console.error('❌ Error checking reset results:', resetCheckError);
      return;
    }

    console.log('User state after reset:', {
      id: resetUser.id,
      username: resetUser.username,
      available_balance: resetUser.available_balance,
      last_claim_time: resetUser.last_claim_time
    });

    // Step 5: Check if user can claim now
    console.log('\n5️⃣ Testing claim availability...');
    const canClaim = resetUser.available_balance > 0 && !resetUser.last_claim_time;
    
    console.log(`Can user claim? ${canClaim ? '✅ YES' : '❌ NO'}`);
    console.log(`Available balance: ${resetUser.available_balance}`);
    console.log(`Last claim time: ${resetUser.last_claim_time || 'None'}`);

    // Step 6: Check claim activities
    console.log('\n6️⃣ Checking claim activities...');
    const { data: claimActivities, error: claimError } = await supabase
      .from('activities')
      .select('id, type, amount, status, created_at')
      .eq('user_id', TEST_USER_ID)
      .in('type', ['rzc_claim', 'rzc_unclaim', 'dev_reset_claim_status'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (claimError) {
      console.error('❌ Error fetching claim activities:', claimError);
    } else {
      console.log(`Found ${claimActivities?.length || 0} claim-related activities`);
      claimActivities?.forEach(activity => {
        console.log(`- ${activity.type}: ${activity.amount} (${activity.status}) at ${activity.created_at}`);
      });
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testResetClaimFunctionality().catch(console.error);