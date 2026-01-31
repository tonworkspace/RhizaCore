// Test script to verify airdrop balance reset functionality
// This script tests the complete flow: mine RZC → claim to airdrop → verify mining balance shows 0

import { supabase, getUserRZCBalance, claimTotalEarnedToAirdrop, getUserAirdropBalance } from './src/lib/supabaseClient.js';

async function testAirdropBalanceReset() {
  console.log('🧪 Testing Airdrop Balance Reset Functionality\n');
  
  // Test with a sample user ID (replace with actual user ID for testing)
  const testUserId = 1;
  
  try {
    // Step 1: Check initial mining balance
    console.log('📊 Step 1: Checking initial mining balance...');
    const initialBalance = await getUserRZCBalance(testUserId);
    console.log('Initial Balance:', {
      claimableRZC: initialBalance.claimableRZC,
      totalEarned: initialBalance.totalEarned,
      claimedRZC: initialBalance.claimedRZC
    });
    
    if (initialBalance.totalEarned <= 0) {
      console.log('❌ No RZC earned to test with. Please mine some RZC first.');
      return;
    }
    
    // Step 2: Check initial airdrop balance
    console.log('\n📊 Step 2: Checking initial airdrop balance...');
    const initialAirdropResult = await getUserAirdropBalance(testUserId);
    console.log('Initial Airdrop Balance:', initialAirdropResult.balance || 'No airdrop balance yet');
    
    // Step 3: Claim to airdrop balance
    console.log('\n🎯 Step 3: Claiming total earned RZC to airdrop balance...');
    const claimResult = await claimTotalEarnedToAirdrop(testUserId);
    
    if (!claimResult.success) {
      console.log('❌ Claim failed:', claimResult.error);
      return;
    }
    
    console.log('✅ Claim successful:', {
      claimedAmount: claimResult.claimedAmount,
      newBalance: claimResult.newBalance
    });
    
    // Step 4: Verify mining balance is reset to 0
    console.log('\n🔍 Step 4: Verifying mining balance reset...');
    const postClaimBalance = await getUserRZCBalance(testUserId);
    console.log('Post-Claim Mining Balance:', {
      claimableRZC: postClaimBalance.claimableRZC,
      totalEarned: postClaimBalance.totalEarned,
      claimedRZC: postClaimBalance.claimedRZC
    });
    
    // Step 5: Verify airdrop balance increased
    console.log('\n🔍 Step 5: Verifying airdrop balance...');
    const finalAirdropResult = await getUserAirdropBalance(testUserId);
    console.log('Final Airdrop Balance:', finalAirdropResult.balance);
    
    // Step 6: Validation
    console.log('\n✅ Validation Results:');
    const miningBalanceReset = postClaimBalance.claimableRZC === 0 && 
                              postClaimBalance.totalEarned === 0;
    const airdropBalanceIncreased = finalAirdropResult.success && 
                                   finalAirdropResult.balance?.available_balance > 0;
    
    console.log(`Mining balance reset to 0: ${miningBalanceReset ? '✅' : '❌'}`);
    console.log(`Airdrop balance increased: ${airdropBalanceIncreased ? '✅' : '❌'}`);
    
    if (miningBalanceReset && airdropBalanceIncreased) {
      console.log('\n🎉 SUCCESS: Airdrop balance reset functionality is working correctly!');
      console.log('- Mining balance properly reset to 0 after claiming to airdrop');
      console.log('- RZC successfully moved to airdrop balance');
      console.log('- Users will see 0 mining balance in UI after claiming');
    } else {
      console.log('\n❌ ISSUE: Some functionality is not working as expected');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Uncomment to run the test
// testAirdropBalanceReset();

console.log('Test script created. To run:');
console.log('1. Replace testUserId with actual user ID');
console.log('2. Ensure user has some mined RZC');
console.log('3. Uncomment the function call at the bottom');
console.log('4. Run: node test-airdrop-balance-reset.js');