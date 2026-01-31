// Test Squad Mining Airdrop Integration
// This script tests that squad mining rewards go to airdrop balance

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qaviehvidwbntwrecyky.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSquadMiningAirdropIntegration() {
  console.log('🧪 Testing Squad Mining Airdrop Integration...\n');

  try {
    // Test user ID (replace with actual test user)
    const testUserId = 1;

    console.log('1. Checking user squad mining stats...');
    const { data: stats, error: statsError } = await supabase.rpc('get_squad_mining_stats', {
      user_id_param: testUserId
    });

    if (statsError) {
      console.error('❌ Error getting squad stats:', statsError);
      return;
    }

    console.log('✅ Squad Stats:', {
      squad_size: stats?.squad_size || 0,
      potential_reward: stats?.potential_reward || 0,
      can_claim: stats?.can_claim || false,
      last_claim_at: stats?.last_claim_at
    });

    if (!stats?.can_claim) {
      console.log('⏰ User cannot claim yet. Testing with mock claim...');
    }

    console.log('\n2. Checking current airdrop balance...');
    const { data: beforeBalance, error: beforeError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (beforeError && beforeError.code !== 'PGRST116') {
      console.error('❌ Error getting airdrop balance:', beforeError);
      return;
    }

    console.log('📊 Airdrop Balance Before:', {
      available_balance: beforeBalance?.available_balance || 0,
      total_claimed_to_airdrop: beforeBalance?.total_claimed_to_airdrop || 0,
      updated_at: beforeBalance?.updated_at
    });

    console.log('\n3. Testing squad mining claim function...');
    const transactionId = `test_${Date.now()}`;
    
    const { data: claimResult, error: claimError } = await supabase.rpc('claim_squad_mining_rewards', {
      user_id_param: testUserId,
      transaction_id_param: transactionId
    });

    if (claimError) {
      console.error('❌ Error claiming squad rewards:', claimError);
      return;
    }

    console.log('✅ Claim Result:', claimResult);

    if (claimResult?.success) {
      console.log('\n4. Verifying airdrop balance update...');
      const { data: afterBalance, error: afterError } = await supabase
        .from('airdrop_balances')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      if (afterError) {
        console.error('❌ Error getting updated airdrop balance:', afterError);
        return;
      }

      console.log('📊 Airdrop Balance After:', {
        available_balance: afterBalance?.available_balance || 0,
        total_claimed_to_airdrop: afterBalance?.total_claimed_to_airdrop || 0,
        updated_at: afterBalance?.updated_at
      });

      const balanceIncrease = (afterBalance?.available_balance || 0) - (beforeBalance?.available_balance || 0);
      console.log(`💰 Balance increased by: ${balanceIncrease} RZC`);

      if (balanceIncrease === (claimResult.reward_amount || 0)) {
        console.log('✅ SUCCESS: Squad mining rewards correctly added to airdrop balance!');
      } else {
        console.log('⚠️  WARNING: Balance increase doesn\'t match reward amount');
      }

      console.log('\n5. Checking squad mining claims table...');
      const { data: claimRecord, error: recordError } = await supabase
        .from('squad_mining_claims')
        .select('*')
        .eq('user_id', testUserId)
        .eq('transaction_id', transactionId)
        .single();

      if (recordError) {
        console.error('❌ Error getting claim record:', recordError);
      } else {
        console.log('✅ Claim Record:', {
          squad_size: claimRecord.squad_size,
          reward_amount: claimRecord.reward_amount,
          claimed_at: claimRecord.claimed_at
        });
      }

      console.log('\n6. Checking activities table...');
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'squad_mining_claim')
        .order('created_at', { ascending: false })
        .limit(1);

      if (activitiesError) {
        console.error('❌ Error getting activities:', activitiesError);
      } else if (activities && activities.length > 0) {
        console.log('✅ Activity Record:', {
          type: activities[0].type,
          amount: activities[0].amount,
          status: activities[0].status,
          metadata: activities[0].metadata
        });
      }

    } else {
      console.log('❌ Claim was not successful:', claimResult?.error);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSquadMiningAirdropIntegration();