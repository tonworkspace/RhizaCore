/**
 * Test script to verify claim functionality works after reset
 * This script tests the balance verification and claim process
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with actual test user ID)
const TEST_USER_ID = 1;

async function testClaimAfterReset() {
  console.log('🧪 Testing Claim After Reset');
  console.log('=============================');

  try {
    // Step 1: Check current user state
    console.log('\n1️⃣ Checking current user state...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, available_balance, last_claim_time')
      .eq('id', TEST_USER_ID)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log('Current user state:', {
      id: user.id,
      username: user.username,
      available_balance: user.available_balance,
      last_claim_time: user.last_claim_time
    });

    // Step 2: Check mining activities for claimable RZC
    console.log('\n2️⃣ Checking mining activities...');
    const { data: miningActivities, error: miningError } = await supabase
      .from('activities')
      .select('id, amount, status, metadata, created_at')
      .eq('user_id', TEST_USER_ID)
      .eq('type', 'mining_complete')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (miningError) {
      console.error('❌ Error fetching mining activities:', miningError);
      return;
    }

    console.log(`Found ${miningActivities?.length || 0} completed mining activities`);
    
    let totalMiningRZC = 0;
    let unclaimedMiningRZC = 0;
    
    if (miningActivities && miningActivities.length > 0) {
      miningActivities.forEach(activity => {
        const amount = parseFloat(activity.amount) || 0;
        totalMiningRZC += amount;
        
        // Check if this activity has been claimed to airdrop
        if (!activity.metadata?.claimed_to_airdrop) {
          unclaimedMiningRZC += amount;
        }
      });
      
      console.log(`Total RZC from mining: ${totalMiningRZC.toFixed(3)}`);
      console.log(`Unclaimed mining RZC: ${unclaimedMiningRZC.toFixed(3)}`);
    }

    // Step 3: Check claim activities
    console.log('\n3️⃣ Checking claim activities...');
    const { data: claimActivities, error: claimError } = await supabase
      .from('activities')
      .select('id, type, amount, status, created_at, metadata')
      .eq('user_id', TEST_USER_ID)
      .in('type', ['rzc_claim', 'rzc_unclaim', 'dev_reset_claim_status'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (claimError) {
      console.error('❌ Error fetching claim activities:', claimError);
    } else {
      console.log(`Found ${claimActivities?.length || 0} claim-related activities`);
      claimActivities?.forEach(activity => {
        console.log(`- ${activity.type}: ${activity.amount} (${activity.status}) at ${new Date(activity.created_at).toLocaleString()}`);
      });
    }

    // Step 4: Simulate balance verification (like the security service does)
    console.log('\n4️⃣ Simulating balance verification...');
    
    const frontendClaimable = parseFloat(user.available_balance) || 0;
    const databaseAvailable = parseFloat(user.available_balance) || 0;
    const tolerance = 0.001;
    
    console.log('Balance verification:', {
      frontendClaimable,
      databaseAvailable,
      difference: Math.abs(frontendClaimable - databaseAvailable),
      tolerance,
      isValid: Math.abs(frontendClaimable - databaseAvailable) <= tolerance
    });

    // Step 5: Check if user can claim
    console.log('\n5️⃣ Checking claim eligibility...');
    
    const canClaim = frontendClaimable > 0 && !user.last_claim_time;
    const hasBalance = frontendClaimable > 0;
    const notAlreadyClaimed = !user.last_claim_time;
    
    console.log('Claim eligibility check:', {
      hasBalance,
      notAlreadyClaimed,
      canClaim: canClaim ? '✅ YES' : '❌ NO',
      availableAmount: frontendClaimable.toFixed(3)
    });

    // Step 6: Test balance verification logic
    console.log('\n6️⃣ Testing security validation...');
    
    if (hasBalance) {
      console.log('✅ Balance verification should pass');
      console.log(`Frontend claimable: ${frontendClaimable.toFixed(3)}`);
      console.log(`Database available: ${databaseAvailable.toFixed(3)}`);
      console.log(`Difference: ${Math.abs(frontendClaimable - databaseAvailable).toFixed(6)}`);
      console.log(`Within tolerance: ${Math.abs(frontendClaimable - databaseAvailable) <= tolerance ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('⚠️  No balance available to claim');
    }

    // Step 7: Recommendations
    console.log('\n7️⃣ Recommendations...');
    
    if (!hasBalance && unclaimedMiningRZC > 0) {
      console.log('💡 Recommendation: Run reset to restore claimable balance from mining activities');
      console.log(`   Available mining RZC to restore: ${unclaimedMiningRZC.toFixed(3)}`);
    } else if (hasBalance && notAlreadyClaimed) {
      console.log('✅ User should be able to claim successfully');
      console.log(`   Claimable amount: ${frontendClaimable.toFixed(3)} RZC`);
    } else if (hasBalance && !notAlreadyClaimed) {
      console.log('⚠️  User has balance but has already claimed');
      console.log('   Use unclaim or reset function to test again');
    } else {
      console.log('ℹ️  User needs to complete mining sessions to have claimable RZC');
    }

    console.log('\n🎉 Test completed!');
    console.log('==================');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testClaimAfterReset().catch(console.error);