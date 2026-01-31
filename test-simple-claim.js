/**
 * Simple test script to verify claim functionality
 * This tests the basic claim flow without complex database functions
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with actual test user ID)
const TEST_USER_ID = 1;

async function testSimpleClaim() {
  console.log('🧪 Testing Simple Claim Functionality');
  console.log('=====================================');

  try {
    // Step 1: Check initial state
    console.log('\n1️⃣ Initial State Check...');
    
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

    // Step 2: Check claimable mining activities
    console.log('\n2️⃣ Checking Claimable Mining Activities...');
    
    const { data: unclaimedActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, amount, created_at, metadata')
      .eq('user_id', TEST_USER_ID)
      .eq('type', 'mining_complete')
      .eq('status', 'completed')
      .is('metadata->claimed_to_airdrop', null)
      .order('created_at', { ascending: true });

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
      return;
    }

    let totalClaimable = 0;
    if (unclaimedActivities && unclaimedActivities.length > 0) {
      unclaimedActivities.forEach((activity, idx) => {
        const amount = parseFloat(activity.amount) || 0;
        totalClaimable += amount;
        console.log(`  ${idx + 1}. ${amount.toFixed(3)} RZC from ${new Date(activity.created_at).toLocaleDateString()}`);
      });
    }

    console.log(`Total claimable: ${totalClaimable.toFixed(3)} RZC`);

    if (totalClaimable === 0) {
      console.log('⚠️  No claimable RZC found. Need to:');
      console.log('   1. Complete mining sessions, or');
      console.log('   2. Use reset function to make activities claimable again');
      return;
    }

    // Step 3: Test claim simulation (without actually claiming)
    console.log('\n3️⃣ Claim Simulation...');
    
    const claimAmount = Math.min(totalClaimable, 1.0); // Claim up to 1 RZC for testing
    console.log(`Simulating claim of ${claimAmount.toFixed(3)} RZC...`);

    // Simulate marking activities as claimed
    let remainingToClaim = claimAmount;
    const activitiesToMark = [];
    
    for (const activity of unclaimedActivities) {
      if (remainingToClaim <= 0) break;
      
      const activityAmount = parseFloat(activity.amount) || 0;
      const claimFromActivity = Math.min(activityAmount, remainingToClaim);
      
      activitiesToMark.push({
        id: activity.id,
        amount: claimFromActivity,
        originalAmount: activityAmount
      });
      
      remainingToClaim -= claimFromActivity;
    }

    console.log('Activities that would be marked as claimed:');
    activitiesToMark.forEach((activity, idx) => {
      console.log(`  ${idx + 1}. Activity ${activity.id}: ${activity.amount.toFixed(3)} RZC (of ${activity.originalAmount.toFixed(3)})`);
    });

    const currentAvailableBalance = parseFloat(user.available_balance) || 0;
    const newAvailableBalance = currentAvailableBalance + claimAmount;
    
    console.log('Balance changes:');
    console.log(`  Current available_balance: ${currentAvailableBalance.toFixed(3)} RZC`);
    console.log(`  After claim: ${newAvailableBalance.toFixed(3)} RZC`);
    console.log(`  Increase: +${claimAmount.toFixed(3)} RZC`);

    // Step 4: Check if user can actually claim
    console.log('\n4️⃣ Claim Eligibility Check...');
    
    const hasAlreadyClaimed = user.last_claim_time && currentAvailableBalance > 0;
    const canClaim = !hasAlreadyClaimed && totalClaimable > 0;
    
    console.log('Eligibility:', {
      hasAlreadyClaimed,
      totalClaimable: totalClaimable.toFixed(3),
      canClaim: canClaim ? '✅ YES' : '❌ NO'
    });

    if (!canClaim) {
      if (hasAlreadyClaimed) {
        console.log('💡 User has already claimed. Use reset or unclaim function to test again.');
      } else {
        console.log('💡 User cannot claim. Check claimable balance.');
      }
    }

    // Step 5: Recommendations
    console.log('\n5️⃣ Recommendations...');
    
    if (canClaim) {
      console.log('✅ User should be able to claim successfully');
      console.log('   → Try claiming from the UI');
      console.log('   → Check browser console for any errors');
    } else if (totalClaimable > 0 && hasAlreadyClaimed) {
      console.log('🔄 Use development reset function to test claiming again');
    } else if (totalClaimable === 0) {
      console.log('⛏️  Complete mining sessions to earn claimable RZC');
      console.log('   → Or use reset function if activities exist but are marked as claimed');
    }

    console.log('\n✅ Test Complete');
    console.log('=================');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSimpleClaim().catch(console.error);