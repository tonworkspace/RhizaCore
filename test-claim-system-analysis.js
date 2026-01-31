/**
 * RZC Claiming System Analysis Test
 * 
 * This script analyzes and tests the RZC claiming system to understand:
 * 1. How balances are calculated
 * 2. How claiming works
 * 3. How the reset/unclaim development functions work
 * 4. The flow from mining -> claimable -> claimed -> available
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = "https://qaviehvidwbntwrecyky.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user ID (replace with actual user ID)
const TEST_USER_ID = 3; // User with RZC activities

console.log('🔍 RZC Claiming System Analysis');
console.log('================================');

/**
 * Analyze user's current RZC balance structure
 */
async function analyzeUserBalance(userId) {
  console.log(`\n📊 Analyzing balance for user ${userId}:`);
  
  try {
    // Get user's available_balance from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('available_balance, last_claim_time, username')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log(`👤 User: ${user.username || 'Unknown'}`);
    console.log(`💰 Available Balance (Claimed): ${user.available_balance || 0} RZC`);
    console.log(`🕒 Last Claim Time: ${user.last_claim_time || 'Never'}`);

    // Get all activities related to RZC
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .in('type', ['mining_complete', 'rzc_claim', 'rzc_unclaim', 'dev_reset_claim_status'])
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
      return;
    }

    console.log(`\n📋 Activities (${activities?.length || 0} total):`);
    
    let totalMined = 0;
    let totalClaimed = 0;
    let claimableAmount = 0;
    
    activities?.forEach((activity, index) => {
      const isClaimedToAirdrop = activity.metadata?.claimed_to_airdrop === true;
      const amount = parseFloat(activity.amount) || 0;
      
      console.log(`${index + 1}. ${activity.type} - ${amount} RZC (${activity.created_at})`);
      console.log(`   Status: ${activity.status}, Claimed: ${isClaimedToAirdrop ? 'Yes' : 'No'}`);
      
      if (activity.type === 'mining_complete') {
        totalMined += amount;
        if (!isClaimedToAirdrop) {
          claimableAmount += amount;
        }
      } else if (activity.type === 'rzc_claim') {
        if (!isClaimedToAirdrop) {
          totalClaimed += amount;
        }
      }
      
      if (activity.metadata) {
        console.log(`   Metadata: ${JSON.stringify(activity.metadata, null, 2)}`);
      }
      console.log('');
    });

    console.log(`\n📈 Balance Summary:`);
    console.log(`🔨 Total Mined: ${totalMined.toFixed(3)} RZC`);
    console.log(`⏳ Claimable (Unclaimed Mining): ${claimableAmount.toFixed(3)} RZC`);
    console.log(`✅ Total Claimed: ${totalClaimed.toFixed(3)} RZC`);
    console.log(`💳 Database Available Balance: ${parseFloat(user.available_balance || 0).toFixed(3)} RZC`);
    
    // Check for discrepancies
    const dbBalance = parseFloat(user.available_balance || 0);
    if (Math.abs(totalClaimed - dbBalance) > 0.001) {
      console.log(`⚠️  DISCREPANCY: Calculated claimed (${totalClaimed.toFixed(3)}) != DB balance (${dbBalance.toFixed(3)})`);
    }

    return {
      totalMined,
      claimableAmount,
      totalClaimed,
      dbAvailableBalance: dbBalance,
      activities: activities || []
    };

  } catch (error) {
    console.error('❌ Error analyzing balance:', error);
  }
}

/**
 * Test the claiming flow
 */
async function testClaimingFlow(userId) {
  console.log(`\n🧪 Testing Claiming Flow for user ${userId}:`);
  
  const balanceBefore = await analyzeUserBalance(userId);
  
  if (!balanceBefore || balanceBefore.claimableAmount <= 0) {
    console.log('❌ No claimable amount available for testing');
    return;
  }

  console.log(`\n🎯 Attempting to claim ${balanceBefore.claimableAmount.toFixed(3)} RZC...`);
  
  // Note: We can't actually call the claim function here since it's not exported
  // But we can simulate what would happen by checking the logic
  
  console.log('📝 Claim Process Analysis:');
  console.log('1. Function would generate transaction ID for idempotency');
  console.log('2. Acquire claim lock to prevent concurrent claims');
  console.log('3. Find unclaimed mining_complete activities');
  console.log('4. Mark those activities as claimed_to_airdrop: true');
  console.log('5. Update user.available_balance += claimed_amount');
  console.log('6. Create rzc_claim activity record');
  console.log('7. Release claim lock');
  
  // Show which activities would be affected
  const unclaimedActivities = balanceBefore.activities.filter(
    a => a.type === 'mining_complete' && 
         a.status === 'completed' && 
         !a.metadata?.claimed_to_airdrop
  );
  
  console.log(`\n📋 Activities that would be marked as claimed (${unclaimedActivities.length}):`);
  unclaimedActivities.forEach((activity, index) => {
    console.log(`${index + 1}. ID: ${activity.id}, Amount: ${activity.amount} RZC, Date: ${activity.created_at}`);
  });
}

/**
 * Analyze the development reset/unclaim functions
 */
async function analyzeDevFunctions(userId) {
  console.log(`\n🛠️  Development Functions Analysis:`);
  
  console.log('\n🔄 resetClaimStatus() would:');
  console.log('1. Delete all rzc_claim, rzc_unclaim, airdrop_balance_claim activities');
  console.log('2. Clear security audit logs and locks');
  console.log('3. Reset user.available_balance = 0');
  console.log('4. Reset user.last_claim_time = null');
  console.log('5. Reset airdrop_balances table');
  console.log('6. Unmark mining activities (set claimed_to_airdrop = null)');
  console.log('7. Create dev_reset_claim_status activity');
  
  console.log('\n↩️  unclaimRZCRewards() would:');
  console.log('1. Create rzc_unclaim activity with negative amount');
  console.log('2. Create new mining_complete activity to restore claimable amount');
  console.log('3. Reset user.available_balance = 0');
  console.log('4. Reset user.last_claim_time = null');
  
  console.log('\n⚠️  Both functions only work in NODE_ENV=development');
}

/**
 * Check for any mining sessions
 */
async function checkMiningSessions(userId) {
  console.log(`\n⛏️  Checking mining sessions for user ${userId}:`);
  
  try {
    const { data: sessions, error } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching mining sessions:', error);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('📭 No mining sessions found');
      return;
    }

    console.log(`📋 Recent mining sessions (${sessions.length}):`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ID: ${session.id}, Status: ${session.status}`);
      console.log(`   Start: ${session.start_time}, End: ${session.end_time}`);
      console.log(`   RZC Earned: ${session.rzc_earned || 0}`);
      console.log(`   Completed: ${session.completed_at || 'Not completed'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking mining sessions:', error);
  }
}

/**
 * Main analysis function
 */
async function runAnalysis() {
  try {
    console.log(`🚀 Starting analysis for user ID: ${TEST_USER_ID}`);
    
    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', TEST_USER_ID)
      .single();

    if (error || !user) {
      console.error(`❌ User ${TEST_USER_ID} not found. Please update TEST_USER_ID with a valid user ID.`);
      return;
    }

    await analyzeUserBalance(TEST_USER_ID);
    await checkMiningSessions(TEST_USER_ID);
    await testClaimingFlow(TEST_USER_ID);
    await analyzeDevFunctions(TEST_USER_ID);
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
runAnalysis();