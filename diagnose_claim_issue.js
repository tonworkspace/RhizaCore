/**
 * Diagnostic script to identify why claiming is not working
 * Run this to see the current state and identify the issue
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with actual test user ID)
const TEST_USER_ID = 31;

async function diagnoseClaimIssue() {
  console.log('🔍 Diagnosing Claim Issue');
  console.log('=========================');

  try {
    // Step 1: Check user's current state
    console.log('\n1️⃣ User Current State:');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, available_balance, last_claim_time')
      .eq('id', TEST_USER_ID)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log('User:', {
      id: user.id,
      username: user.username,
      available_balance: user.available_balance,
      last_claim_time: user.last_claim_time
    });

    // Step 2: Check mining activities
    console.log('\n2️⃣ Mining Activities:');
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
    let claimableMiningRZC = 0;
    let claimedMiningRZC = 0;
    
    if (miningActivities && miningActivities.length > 0) {
      miningActivities.forEach((activity, idx) => {
        const amount = parseFloat(activity.amount) || 0;
        const isClaimed = activity.metadata?.claimed_to_airdrop === true;
        
        totalMiningRZC += amount;
        if (isClaimed) {
          claimedMiningRZC += amount;
        } else {
          claimableMiningRZC += amount;
        }
        
        console.log(`  ${idx + 1}. Amount: ${amount.toFixed(3)}, Claimed: ${isClaimed ? '✅' : '❌'}, Date: ${new Date(activity.created_at).toLocaleDateString()}`);
      });
      
      console.log(`\nMining Summary:`);
      console.log(`  Total from mining: ${totalMiningRZC.toFixed(3)} RZC`);
      console.log(`  Claimable: ${claimableMiningRZC.toFixed(3)} RZC`);
      console.log(`  Already claimed: ${claimedMiningRZC.toFixed(3)} RZC`);
    }

    // Step 3: Check claim activities
    console.log('\n3️⃣ Claim Activities:');
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
      claimActivities?.forEach((activity, idx) => {
        console.log(`  ${idx + 1}. ${activity.type}: ${activity.amount} (${activity.status}) at ${new Date(activity.created_at).toLocaleString()}`);
      });
    }

    // Step 4: Check what getUserRZCBalance would return
    console.log('\n4️⃣ Balance Calculation Simulation:');
    
    // Simulate the getUserRZCBalance logic
    let simulatedClaimable = 0;
    let simulatedClaimed = parseFloat(user.available_balance) || 0;
    let simulatedTotalEarned = 0;
    
    if (miningActivities) {
      miningActivities.forEach(activity => {
        const amount = parseFloat(activity.amount) || 0;
        simulatedTotalEarned += amount;
        
        if (!activity.metadata?.claimed_to_airdrop) {
          simulatedClaimable += amount;
        }
      });
    }
    
    console.log('Simulated getUserRZCBalance result:', {
      claimableRZC: simulatedClaimable,
      claimedRZC: simulatedClaimed,
      totalEarned: simulatedTotalEarned
    });

    // Step 5: Check UI state logic
    console.log('\n5️⃣ UI State Analysis:');
    
    const hasClaimedRewards = user.last_claim_time && simulatedClaimed > 0;
    const totalAvailableToClaim = simulatedClaimable;
    const canClaim = !hasClaimedRewards && totalAvailableToClaim > 0;
    
    console.log('UI State:', {
      hasClaimedRewards,
      totalAvailableToClaim,
      canClaim: canClaim ? '✅ YES' : '❌ NO',
      buttonDisabled: !canClaim || totalAvailableToClaim === 0,
      buttonText: hasClaimedRewards ? 'Already Claimed' 
                 : totalAvailableToClaim === 0 ? 'No Mining Rewards to Claim'
                 : `Claim ${totalAvailableToClaim.toFixed(3)} RZC from Mining`
    });

    // Step 6: Check database function existence
    console.log('\n6️⃣ Database Function Check:');
    
    try {
      // Try to call the function with a test (this will fail but show if function exists)
      const { error: funcError } = await supabase.rpc('process_secure_claim', {
        p_user_id: TEST_USER_ID,
        p_amount: 0.001,
        p_operation: 'test',
        p_transaction_id: 'test-' + Date.now()
      });
      
      if (funcError) {
        if (funcError.message.includes('function process_secure_claim')) {
          console.log('❌ process_secure_claim function does not exist or is not accessible');
          console.log('   Need to run: fix_claim_process_function.sql');
        } else {
          console.log('✅ process_secure_claim function exists (test call failed as expected)');
          console.log('   Error:', funcError.message);
        }
      } else {
        console.log('⚠️  Test call succeeded unexpectedly');
      }
    } catch (error) {
      console.log('❌ Error testing function:', error.message);
    }

    // Step 7: Recommendations
    console.log('\n7️⃣ Recommendations:');
    
    if (simulatedClaimable === 0 && totalMiningRZC > 0) {
      console.log('💡 All mining activities are marked as claimed');
      console.log('   → Use reset function to make them claimable again');
    } else if (simulatedClaimable > 0 && hasClaimedRewards) {
      console.log('💡 User has claimable RZC but has already claimed');
      console.log('   → This suggests the claim didn\'t properly mark activities as claimed');
      console.log('   → Check if the database function is working correctly');
    } else if (simulatedClaimable > 0 && !hasClaimedRewards) {
      console.log('✅ User should be able to claim');
      console.log('   → Check browser console for claim errors');
      console.log('   → Verify security validation is passing');
    } else if (totalMiningRZC === 0) {
      console.log('ℹ️  User has no completed mining activities');
      console.log('   → Complete mining sessions first');
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. If function doesn\'t exist: Run fix_claim_process_function.sql');
    console.log('2. If activities are all claimed: Use reset function');
    console.log('3. If claim button is disabled: Check browser console for errors');
    console.log('4. If validation fails: Check ClaimSecurityService logs');

    console.log('\n✅ Diagnosis Complete');
    console.log('=====================');

  } catch (error) {
    console.error('❌ Diagnosis failed with error:', error);
  }
}

// Run the diagnosis
diagnoseClaimIssue().catch(console.error);