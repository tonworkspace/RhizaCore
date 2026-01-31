// Test script to verify airdrop reclaim functionality
// This script tests the reclaim flow: airdrop balance → reclaim to mining → verify mining balance restored

import { supabase, getUserRZCBalance, reclaimFromAirdropToMining, getUserAirdropBalance } from './src/lib/supabaseClient.js';

async function testAirdropReclaim() {
  console.log('🧪 Testing Airdrop Reclaim Functionality\n');
  
  // Test with a sample user ID (replace with actual user ID for testing)
  const testUserId = 1;
  
  try {
    // Step 1: Check initial airdrop balance
    console.log('📊 Step 1: Checking initial airdrop balance...');
    const initialAirdropResult = await getUserAirdropBalance(testUserId);
    console.log('Initial Airdrop Balance:', initialAirdropResult.balance);
    
    if (!initialAirdropResult.success || !initialAirdropResult.balance || initialAirdropResult.balance.available_balance <= 0) {
      console.log('❌ No airdrop balance to test reclaim with. Please claim some RZC to airdrop first.');
      return;
    }
    
    const initialAirdropAmount = initialAirdropResult.balance.available_balance;
    
    // Step 2: Check initial mining balance (should be 0 if previously claimed to airdrop)
    console.log('\n📊 Step 2: Checking initial mining balance...');
    const initialMiningBalance = await getUserRZCBalance(testUserId);
    console.log('Initial Mining Balance:', {
      claimableRZC: initialMiningBalance.claimableRZC,
      totalEarned: initialMiningBalance.totalEarned,
      claimedRZC: initialMiningBalance.claimedRZC
    });
    
    // Step 3: Reclaim from airdrop to mining
    console.log('\n🎯 Step 3: Reclaiming from airdrop balance to mining balance...');
    const reclaimResult = await reclaimFromAirdropToMining(testUserId);
    
    if (!reclaimResult.success) {
      console.log('❌ Reclaim failed:', reclaimResult.error);
      return;
    }
    
    console.log('✅ Reclaim successful:', {
      reclaimedAmount: reclaimResult.reclaimedAmount
    });
    
    // Step 4: Verify mining balance is restored
    console.log('\n🔍 Step 4: Verifying mining balance restored...');
    const postReclaimMiningBalance = await getUserRZCBalance(testUserId);
    console.log('Post-Reclaim Mining Balance:', {
      claimableRZC: postReclaimMiningBalance.claimableRZC,
      totalEarned: postReclaimMiningBalance.totalEarned,
      claimedRZC: postReclaimMiningBalance.claimedRZC
    });
    
    // Step 5: Verify airdrop balance is reset to 0
    console.log('\n🔍 Step 5: Verifying airdrop balance reset...');
    const finalAirdropResult = await getUserAirdropBalance(testUserId);
    console.log('Final Airdrop Balance:', finalAirdropResult.balance);
    
    // Step 6: Validation
    console.log('\n✅ Validation Results:');
    const miningBalanceRestored = postReclaimMiningBalance.totalEarned > 0;
    const airdropBalanceReset = !finalAirdropResult.balance || finalAirdropResult.balance.available_balance === 0;
    const amountsMatch = Math.abs(postReclaimMiningBalance.totalEarned - initialAirdropAmount) < 0.000001;
    
    console.log(`Mining balance restored: ${miningBalanceRestored ? '✅' : '❌'}`);
    console.log(`Airdrop balance reset to 0: ${airdropBalanceReset ? '✅' : '❌'}`);
    console.log(`Amounts match: ${amountsMatch ? '✅' : '❌'}`);
    
    if (miningBalanceRestored && airdropBalanceReset && amountsMatch) {
      console.log('\n🎉 SUCCESS: Airdrop reclaim functionality is working correctly!');
      console.log('- Airdrop balance successfully reclaimed to mining balance');
      console.log('- Mining balance restored with correct amount');
      console.log('- Airdrop balance properly reset to 0');
      console.log('- Users can now continue mining from where they left off');
    } else {
      console.log('\n❌ ISSUE: Some functionality is not working as expected');
      console.log('Expected amounts:', {
        initialAirdrop: initialAirdropAmount,
        finalMining: postReclaimMiningBalance.totalEarned,
        difference: Math.abs(postReclaimMiningBalance.totalEarned - initialAirdropAmount)
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Uncomment to run the test
// testAirdropReclaim();

console.log('Reclaim test script created. To run:');
console.log('1. Replace testUserId with actual user ID');
console.log('2. Ensure user has airdrop balance (claim some RZC to airdrop first)');
console.log('3. Uncomment the function call at the bottom');
console.log('4. Run: node test-airdrop-reclaim.js');