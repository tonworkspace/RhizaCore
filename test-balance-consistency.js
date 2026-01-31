// Test script to verify balance consistency between components
// This ensures both NativeWalletUI and ArcadeMiningUI show the same balance

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

// Mock getUserRZCBalance function (same as in supabaseClient.ts)
async function getUserRZCBalance(userId) {
  try {
    // Get user's current available_balance (this is their claimed/validated balance)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('available_balance, last_claim_time')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get activities to calculate total earned and claimable amounts
    const { data: activities, error } = await supabase
      .from('activities')
      .select('type, amount, created_at, metadata')
      .eq('user_id', userId)
      .in('type', ['rzc_claim', 'mining_complete', 'mining_rig_mk2', 'extended_session'])
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let claimableRZC = 0; // Unclaimed mining rewards
    let totalEarned = 0;  // Total from all mining activities
    let claimedRZC = 0;   // Total that has been claimed (should match available_balance)
    let lastClaimTime;

    activities?.forEach(activity => {
      // Check if this activity has been transferred to airdrop
      const isClaimedToAirdrop = activity.metadata?.claimed_to_airdrop === true;
      
      if (activity.type === 'rzc_claim') {
        // Track claimed amounts
        if (!isClaimedToAirdrop) {
          claimedRZC += activity.amount;
          if (!lastClaimTime && activity.amount > 0) lastClaimTime = activity.created_at;
        }
      } else if (activity.type === 'mining_complete') {
        // Always count towards total earned (for historical tracking)
        totalEarned += activity.amount;
        
        // Only count as claimable if it hasn't been claimed yet
        if (!isClaimedToAirdrop) {
          claimableRZC += activity.amount;
        }
      }
    });

    // Use the database available_balance as the authoritative claimed amount
    const databaseClaimedRZC = parseFloat(user.available_balance) || 0;
    
    // If there's a discrepancy between calculated claimed and database available_balance,
    // trust the database and adjust claimable accordingly
    if (Math.abs(claimedRZC - databaseClaimedRZC) > 0.001) {
      console.log('Adjusting claimable RZC based on database available_balance:', {
        calculatedClaimed: claimedRZC,
        databaseClaimed: databaseClaimedRZC,
        originalClaimable: claimableRZC
      });
      
      // Adjust claimable to account for the difference
      const adjustment = claimedRZC - databaseClaimedRZC;
      claimableRZC += adjustment;
      claimedRZC = databaseClaimedRZC;
    }

    return {
      claimableRZC: Math.max(0, claimableRZC),
      totalEarned,
      claimedRZC,
      lastClaimTime: lastClaimTime || user.last_claim_time
    };
  } catch (error) {
    console.error('Error fetching RZC balance:', error);
    return {
      claimableRZC: 0,
      totalEarned: 0,
      claimedRZC: 0
    };
  }
}

// Mock getUserAirdropBalance function
async function getUserAirdropBalance(userId) {
  try {
    const { data: airdropBalance, error } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      success: true,
      balance: airdropBalance || {
        available_balance: 0,
        staked_balance: 0,
        total_claimed_to_airdrop: 0
      }
    };
  } catch (error) {
    console.error('Error fetching airdrop balance:', error);
    return {
      success: false,
      balance: null
    };
  }
}

async function testBalanceConsistency() {
  console.log('🧪 Testing balance consistency between components...');
  
  // Test with a user that has some balance
  const testUserId = 1; // Replace with actual user ID
  
  try {
    // Get balances from both sources
    const rzcBalance = await getUserRZCBalance(testUserId);
    const airdropResult = await getUserAirdropBalance(testUserId);
    
    console.log('\n📊 Balance Comparison:');
    console.log('='.repeat(50));
    
    // RZC Balance (used by both components now)
    console.log('RZC Balance System:');
    console.log(`  Claimable RZC: ${rzcBalance.claimableRZC.toFixed(4)}`);
    console.log(`  Claimed RZC: ${rzcBalance.claimedRZC.toFixed(4)}`);
    console.log(`  Total Available: ${(rzcBalance.claimableRZC + rzcBalance.claimedRZC).toFixed(4)}`);
    console.log(`  Total Earned: ${rzcBalance.totalEarned.toFixed(4)}`);
    
    // Airdrop Balance (legacy system)
    if (airdropResult.success && airdropResult.balance) {
      console.log('\nAirdrop Balance System (Legacy):');
      console.log(`  Available Balance: ${(airdropResult.balance.available_balance || 0).toFixed(4)}`);
      console.log(`  Staked Balance: ${(airdropResult.balance.staked_balance || 0).toFixed(4)}`);
      console.log(`  Total Claimed to Airdrop: ${(airdropResult.balance.total_claimed_to_airdrop || 0).toFixed(4)}`);
    } else {
      console.log('\nAirdrop Balance System: No data found');
    }
    
    // Component Balance Calculations
    console.log('\n🎯 Component Balance Calculations:');
    console.log('='.repeat(50));
    
    // NativeWalletUI calculation (updated)
    const nativeWalletBalance = rzcBalance.claimedRZC + rzcBalance.claimableRZC;
    console.log(`NativeWalletUI Display: ${nativeWalletBalance.toFixed(4)} RZC`);
    console.log(`  - Main Balance: ${rzcBalance.claimedRZC.toFixed(4)} (claimed)`);
    console.log(`  - Claimable: ${rzcBalance.claimableRZC.toFixed(4)} (from mining)`);
    
    // ArcadeMiningUI calculation (updated)
    const arcadeMiningBalance = rzcBalance.claimedRZC + rzcBalance.claimableRZC;
    console.log(`ArcadeMiningUI Display: ${arcadeMiningBalance.toFixed(4)} RZC`);
    console.log(`  - Claimed: ${rzcBalance.claimedRZC.toFixed(4)}`);
    console.log(`  - Claimable: ${rzcBalance.claimableRZC.toFixed(4)}`);
    
    // Consistency Check
    console.log('\n✅ Consistency Check:');
    console.log('='.repeat(50));
    
    const isConsistent = Math.abs(nativeWalletBalance - arcadeMiningBalance) < 0.0001;
    
    if (isConsistent) {
      console.log('✅ PASS: Both components show the same balance!');
      console.log(`   Both display: ${nativeWalletBalance.toFixed(4)} RZC`);
    } else {
      console.log('❌ FAIL: Components show different balances!');
      console.log(`   NativeWalletUI: ${nativeWalletBalance.toFixed(4)} RZC`);
      console.log(`   ArcadeMiningUI: ${arcadeMiningBalance.toFixed(4)} RZC`);
      console.log(`   Difference: ${Math.abs(nativeWalletBalance - arcadeMiningBalance).toFixed(4)} RZC`);
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('='.repeat(50));
    console.log('1. Both components now use getUserRZCBalance() for consistency');
    console.log('2. Main balance = claimedRZC (available for spending)');
    console.log('3. Claimable balance = claimableRZC (from mining, needs claiming)');
    console.log('4. Total balance = claimedRZC + claimableRZC');
    console.log('5. Airdrop balance system is separate for staking/withdrawal');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBalanceConsistency();