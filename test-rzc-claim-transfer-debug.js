const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = "https://qaviehvidwbntwrecyky.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user IDs - replace with actual user IDs having issues
const TEST_USER_IDS = [1, 2, 3, 4, 5]; // Add actual user IDs here

async function debugUserRZCBalance(userId) {
  console.log(`\n=== DEBUGGING USER ${userId} RZC BALANCE ===`);
  
  try {
    // 1. Get user's basic info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, available_balance, total_earned, created_at, last_claim_time')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error(`❌ Error fetching user ${userId}:`, userError);
      return;
    }

    if (!user) {
      console.log(`❌ User ${userId} not found`);
      return;
    }

    console.log('👤 User Info:', {
      id: user.id,
      username: user.username || 'No username',
      available_balance: user.available_balance,
      total_earned: user.total_earned,
      created_at: user.created_at,
      last_claim_time: user.last_claim_time
    });

    // 2. Get all activities for this user
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
      return;
    }

    console.log(`📊 Total Activities: ${activities?.length || 0}`);

    // 3. Analyze activities by type
    const activitySummary = {};
    let totalMiningEarned = 0;
    let totalClaimed = 0;
    let claimableAmount = 0;
    let hasTransferActivation = false;
    let hasAirdropClaim = false;

    activities?.forEach(activity => {
      const type = activity.type;
      if (!activitySummary[type]) {
        activitySummary[type] = { count: 0, totalAmount: 0 };
      }
      activitySummary[type].count++;
      activitySummary[type].totalAmount += activity.amount || 0;

      // Track specific activity types
      if (type === 'mining_complete' && activity.status === 'completed') {
        totalMiningEarned += activity.amount || 0;
        
        // Check if this mining activity has been claimed to airdrop
        const isClaimedToAirdrop = activity.metadata?.claimed_to_airdrop === true;
        if (!isClaimedToAirdrop) {
          claimableAmount += activity.amount || 0;
        }
      }
      
      if (type === 'rzc_claim' && activity.status === 'completed') {
        totalClaimed += activity.amount || 0;
      }
      
      if (type === 'transfer_activation') {
        hasTransferActivation = true;
      }
      
      if (type === 'airdrop_balance_claim') {
        hasAirdropClaim = true;
      }
    });

    console.log('📈 Activity Summary:');
    Object.entries(activitySummary).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} activities, ${data.totalAmount.toFixed(4)} total amount`);
    });

    console.log('\n💰 Balance Analysis:');
    console.log(`  Total Mining Earned: ${totalMiningEarned.toFixed(4)} RZC`);
    console.log(`  Total Claimed: ${totalClaimed.toFixed(4)} RZC`);
    console.log(`  Claimable Amount: ${claimableAmount.toFixed(4)} RZC`);
    console.log(`  Database Available Balance: ${parseFloat(user.available_balance || 0).toFixed(4)} RZC`);
    console.log(`  Has Transfer Activation: ${hasTransferActivation ? '✅' : '❌'}`);
    console.log(`  Has Airdrop Claim: ${hasAirdropClaim ? '✅' : '❌'}`);

    // 4. Check airdrop balance
    const { data: airdropBalance, error: airdropError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (airdropError && airdropError.code !== 'PGRST116') {
      console.error('❌ Error fetching airdrop balance:', airdropError);
    } else if (airdropBalance) {
      console.log('\n🎯 Airdrop Balance:', {
        total_claimed_to_airdrop: airdropBalance.total_claimed_to_airdrop,
        available_balance: airdropBalance.available_balance,
        withdrawn_balance: airdropBalance.withdrawn_balance,
        last_claim_from_mining: airdropBalance.last_claim_from_mining
      });
    } else {
      console.log('\n🎯 Airdrop Balance: None found');
    }

    // 5. Identify potential issues
    console.log('\n🔍 Potential Issues:');
    
    const issues = [];
    
    if (totalMiningEarned > 0 && claimableAmount === 0 && parseFloat(user.available_balance || 0) === 0) {
      issues.push('All mining rewards may have been transferred to airdrop already');
    }
    
    if (totalMiningEarned > 0 && claimableAmount > 0 && !hasTransferActivation) {
      issues.push('User has claimable RZC but no transfer activation - they need to activate transfer feature');
    }
    
    if (hasTransferActivation && claimableAmount > 0 && parseFloat(user.available_balance || 0) === 0) {
      issues.push('Transfer activated but available balance is 0 - possible transfer already completed');
    }
    
    if (totalMiningEarned === 0) {
      issues.push('User has no mining activities - they need to start mining first');
    }
    
    const balanceDiscrepancy = Math.abs(totalClaimed - parseFloat(user.available_balance || 0));
    if (balanceDiscrepancy > 0.001) {
      issues.push(`Balance discrepancy: claimed ${totalClaimed.toFixed(4)} vs database ${parseFloat(user.available_balance || 0).toFixed(4)}`);
    }

    if (issues.length === 0) {
      issues.push('No obvious issues detected - user should be able to transfer');
    }

    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });

    // 6. Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (totalMiningEarned === 0) {
      console.log('  - User needs to start mining to earn RZC tokens');
    } else if (claimableAmount > 0 && !hasTransferActivation) {
      console.log('  - User should click "Activate & Transfer" button to activate transfer feature');
    } else if (hasTransferActivation && parseFloat(user.available_balance || 0) > 0) {
      console.log('  - User should be able to transfer their available balance');
    } else if (hasAirdropClaim) {
      console.log('  - User has already completed the transfer process');
    } else {
      console.log('  - Check if user has active mining session or recent mining activities');
    }

    return {
      userId,
      totalMiningEarned,
      claimableAmount,
      availableBalance: parseFloat(user.available_balance || 0),
      hasTransferActivation,
      hasAirdropClaim,
      issues
    };

  } catch (error) {
    console.error(`❌ Error debugging user ${userId}:`, error);
    return null;
  }
}

async function testTransferFunction(userId, amount) {
  console.log(`\n=== TESTING TRANSFER FUNCTION FOR USER ${userId} ===`);
  
  try {
    // Simulate the transfer function logic
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('available_balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.log('❌ User not found or error fetching user');
      return;
    }

    const currentBalance = parseFloat(user.available_balance) || 0;
    console.log(`Current available balance: ${currentBalance.toFixed(4)} RZC`);
    console.log(`Requested transfer amount: ${amount.toFixed(4)} RZC`);

    if (currentBalance < amount) {
      console.log('❌ Insufficient balance for transfer');
      return;
    }

    // Check existing airdrop balance
    const { data: existingAirdrop, error: airdropError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (airdropError && airdropError.code !== 'PGRST116') {
      console.log('❌ Error checking airdrop balance:', airdropError);
      return;
    }

    if (existingAirdrop) {
      console.log('✅ User has existing airdrop balance:', {
        total_claimed: existingAirdrop.total_claimed_to_airdrop,
        available: existingAirdrop.available_balance
      });
    } else {
      console.log('ℹ️ User has no existing airdrop balance - will create new one');
    }

    console.log('✅ Transfer should work - all conditions met');

  } catch (error) {
    console.error('❌ Error testing transfer function:', error);
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting RZC Claim/Transfer Diagnostics...\n');

  const results = [];
  
  for (const userId of TEST_USER_IDS) {
    const result = await debugUserRZCBalance(userId);
    if (result) {
      results.push(result);
      
      // Test transfer function if user has available balance
      if (result.availableBalance > 0) {
        await testTransferFunction(userId, result.availableBalance);
      }
    }
    
    // Add delay between users to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📋 SUMMARY OF ALL USERS:');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`User ${result.userId}:`);
    console.log(`  Mining Earned: ${result.totalMiningEarned.toFixed(4)} RZC`);
    console.log(`  Available: ${result.availableBalance.toFixed(4)} RZC`);
    console.log(`  Transfer Activated: ${result.hasTransferActivation ? 'Yes' : 'No'}`);
    console.log(`  Already Transferred: ${result.hasAirdropClaim ? 'Yes' : 'No'}`);
    console.log(`  Issues: ${result.issues.length}`);
    console.log('');
  });

  // Find users with specific issues
  const usersNeedingActivation = results.filter(r => 
    r.totalMiningEarned > 0 && 
    r.availableBalance > 0 && 
    !r.hasTransferActivation
  );

  const usersAlreadyTransferred = results.filter(r => r.hasAirdropClaim);

  const usersWithNoMining = results.filter(r => r.totalMiningEarned === 0);

  console.log('🎯 ISSUE CATEGORIES:');
  console.log(`Users needing activation: ${usersNeedingActivation.length}`);
  console.log(`Users already transferred: ${usersAlreadyTransferred.length}`);
  console.log(`Users with no mining: ${usersWithNoMining.length}`);

  if (usersNeedingActivation.length > 0) {
    console.log('\n👥 Users needing activation:', usersNeedingActivation.map(u => u.userId));
  }
}

// Run the diagnostics
runDiagnostics().catch(console.error);