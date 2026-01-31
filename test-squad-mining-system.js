// Test Squad Mining System - Corrected Version
// This script tests the squad mining functionality with proper UUID handling

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSquadMiningSystem() {
  console.log('🧪 Testing Squad Mining System (Corrected Version)...\n');

  try {
    // First, let's get a real user ID from the database
    console.log('🔍 Finding a test user...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, telegram_id')
      .limit(1);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }

    const testUser = users[0];
    console.log(`✅ Using test user: ${testUser.username || 'Unknown'} (ID: ${testUser.id})`);

    // Test 1: Get squad mining stats for the user
    console.log('\n📊 Test 1: Getting squad mining stats...');
    const { data: stats, error: statsError } = await supabase.rpc('get_squad_mining_stats', {
      user_id_param: testUser.id
    });

    if (statsError) {
      console.error('❌ Error getting stats:', statsError);
    } else {
      console.log('✅ Squad mining stats:', stats);
      console.log(`   - Squad size: ${stats.squad_size}`);
      console.log(`   - Potential reward: ${stats.potential_reward} RZC`);
      console.log(`   - Can claim: ${stats.can_claim}`);
      console.log(`   - Total rewards earned: ${stats.total_rewards_earned} RZC`);
      console.log(`   - Hours until next claim: ${stats.hours_until_next_claim}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Check squad size calculation
    console.log('👥 Test 2: Checking squad size calculation...');
    const { data: squadSize, error: squadError } = await supabase.rpc('get_user_squad_size', {
      user_id_param: testUser.id
    });

    if (squadError) {
      console.error('❌ Error getting squad size:', squadError);
    } else {
      console.log(`✅ Squad size: ${squadSize} active members`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Check if user can claim rewards
    console.log('⏰ Test 3: Checking claim eligibility...');
    const { data: canClaim, error: claimError } = await supabase.rpc('can_claim_squad_rewards', {
      user_id_param: testUser.id
    });

    if (claimError) {
      console.error('❌ Error checking claim eligibility:', claimError);
    } else {
      console.log(`✅ Can claim rewards: ${canClaim}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Calculate potential reward
    console.log('💰 Test 4: Calculating potential reward...');
    const { data: reward, error: rewardError } = await supabase.rpc('calculate_squad_reward', {
      user_id_param: testUser.id
    });

    if (rewardError) {
      console.error('❌ Error calculating reward:', rewardError);
    } else {
      console.log(`✅ Potential reward: ${reward} RZC`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Get squad members (referrals)
    console.log('👨‍👩‍👧‍👦 Test 5: Getting squad members...');
    const { data: members, error: membersError } = await supabase
      .from('referrals')
      .select(`
        id,
        created_at,
        status,
        referred:users!referred_id(
          id,
          username,
          telegram_id,
          is_premium,
          is_active,
          total_earned,
          rank
        )
      `)
      .eq('sponsor_id', testUser.id)
      .eq('status', 'active');

    if (membersError) {
      console.error('❌ Error getting squad members:', membersError);
    } else {
      console.log(`✅ Found ${members.length} squad members:`);
      members.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.referred.username} (${member.referred.is_premium ? 'Premium' : 'Standard'})`);
        console.log(`      - Active: ${member.referred.is_active}`);
        console.log(`      - Total earned: ${member.referred.total_earned || 0} RZC`);
        console.log(`      - Rank: ${member.referred.rank || 'Rookie'}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Test claim functionality (if eligible)
    if (canClaim && squadSize > 0) {
      console.log('🎯 Test 6: Testing claim functionality...');
      const transactionId = `test_squad_${Date.now()}`;
      
      const { data: claimResult, error: claimResultError } = await supabase.rpc('claim_squad_mining_rewards', {
        user_id_param: testUser.id,
        transaction_id_param: transactionId
      });

      if (claimResultError) {
        console.error('❌ Error claiming rewards:', claimResultError);
      } else {
        console.log('✅ Claim result:', claimResult);
        if (claimResult.success) {
          console.log(`   - Claimed ${claimResult.reward_amount} RZC from ${claimResult.squad_size} squad members`);
          console.log(`   - Transaction ID: ${claimResult.transaction_id}`);
        } else {
          console.log(`   - Claim failed: ${claimResult.error}`);
        }
      }
    } else {
      console.log('⏳ Test 6: Skipping claim test (not eligible or no squad members)');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 7: Check claim history
    console.log('📜 Test 7: Getting claim history...');
    const { data: history, error: historyError } = await supabase
      .from('squad_mining_claims')
      .select('*')
      .eq('user_id', testUser.id)
      .order('claimed_at', { ascending: false })
      .limit(5);

    if (historyError) {
      console.error('❌ Error getting claim history:', historyError);
    } else {
      console.log(`✅ Found ${history.length} recent claims:`);
      history.forEach((claim, index) => {
        console.log(`   ${index + 1}. ${claim.reward_amount} RZC from ${claim.squad_size} members`);
        console.log(`      - Claimed at: ${new Date(claim.claimed_at).toLocaleString()}`);
        console.log(`      - Transaction ID: ${claim.transaction_id}`);
      });
    }

    console.log('\n🎉 Squad Mining System test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testSquadMiningSystem();