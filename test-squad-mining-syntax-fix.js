// Test Squad Mining System After SQL Syntax Fixes
// This script tests the squad mining functionality after fixing dollar-quoted string syntax

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSquadMiningSystem() {
  console.log('🧪 Testing Squad Mining System After SQL Syntax Fixes...\n');

  try {
    // Test 1: Check if squad mining functions exist
    console.log('1. Testing function availability...');
    
    const { data: functions, error: funcError } = await supabase
      .rpc('get_user_squad_size', { user_id_param: 1 });
    
    if (funcError) {
      console.error('❌ Squad mining functions not available:', funcError.message);
      return;
    }
    
    console.log('✅ Squad mining functions are available');

    // Test 2: Test squad size calculation
    console.log('\n2. Testing squad size calculation...');
    
    const { data: squadSize, error: sizeError } = await supabase
      .rpc('get_user_squad_size', { user_id_param: 1 });
    
    if (sizeError) {
      console.error('❌ Squad size calculation failed:', sizeError.message);
    } else {
      console.log(`✅ Squad size for user 1: ${squadSize} members`);
    }

    // Test 3: Test reward calculation
    console.log('\n3. Testing reward calculation...');
    
    const { data: reward, error: rewardError } = await supabase
      .rpc('calculate_squad_reward', { user_id_param: 1 });
    
    if (rewardError) {
      console.error('❌ Reward calculation failed:', rewardError.message);
    } else {
      console.log(`✅ Potential reward for user 1: ${reward} RZC`);
    }

    // Test 4: Test claim eligibility
    console.log('\n4. Testing claim eligibility...');
    
    const { data: canClaim, error: claimError } = await supabase
      .rpc('can_claim_squad_rewards', { user_id_param: 1 });
    
    if (claimError) {
      console.error('❌ Claim eligibility check failed:', claimError.message);
    } else {
      console.log(`✅ User 1 can claim: ${canClaim}`);
    }

    // Test 5: Test squad mining stats
    console.log('\n5. Testing squad mining stats...');
    
    const { data: stats, error: statsError } = await supabase
      .rpc('get_squad_mining_stats', { user_id_param: 1 });
    
    if (statsError) {
      console.error('❌ Stats retrieval failed:', statsError.message);
    } else {
      console.log('✅ Squad mining stats:', JSON.stringify(stats, null, 2));
    }

    // Test 6: Check users table columns
    console.log('\n6. Checking users table structure...');
    
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'users')
      .in('column_name', [
        'available_balance', 
        'total_earned', 
        'last_squad_claim_at', 
        'total_squad_rewards', 
        'squad_mining_rate'
      ]);
    
    if (colError) {
      console.error('❌ Column check failed:', colError.message);
    } else {
      console.log('✅ Users table squad mining columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
      });
    }

    console.log('\n🎉 Squad Mining System Test Complete!');
    console.log('\nNext steps:');
    console.log('1. Run the SQL migration files in Supabase');
    console.log('2. Test actual claim functionality');
    console.log('3. Verify frontend integration');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSquadMiningSystem();