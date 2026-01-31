/**
 * Create test mining activities for testing claim functionality
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qaviehvidwbntwrecyky.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID
const TEST_USER_ID = 31;

async function createTestMiningActivities() {
  console.log('🏗️  Creating Test Mining Activities');
  console.log('===================================');

  try {
    // Create several test mining activities
    const testActivities = [
      { amount: 15.5, hours_ago: 2 },
      { amount: 22.3, hours_ago: 6 },
      { amount: 8.7, hours_ago: 12 },
      { amount: 31.2, hours_ago: 24 },
      { amount: 12.8, hours_ago: 48 }
    ];

    console.log(`Creating ${testActivities.length} test mining activities for user ${TEST_USER_ID}:`);

    for (let i = 0; i < testActivities.length; i++) {
      const activity = testActivities[i];
      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - activity.hours_ago);

      console.log(`  ${i + 1}. ${activity.amount} RZC (${activity.hours_ago}h ago)`);

      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: TEST_USER_ID,
          type: 'mining_complete',
          amount: activity.amount,
          status: 'completed',
          metadata: {
            test_activity: true,
            mining_session_duration: '24h',
            created_for_testing: true
          },
          created_at: createdAt.toISOString()
        });

      if (error) {
        console.error(`❌ Error creating activity ${i + 1}:`, error);
        return;
      }
    }

    console.log('\n✅ All test mining activities created successfully!');

    // Verify the activities were created
    const { data: createdActivities, error: verifyError } = await supabase
      .from('activities')
      .select('id, amount, created_at, metadata')
      .eq('user_id', TEST_USER_ID)
      .eq('type', 'mining_complete')
      .eq('status', 'completed')
      .is('metadata->claimed_to_airdrop', null)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying activities:', verifyError);
      return;
    }

    const totalClaimable = createdActivities?.reduce((sum, activity) => sum + (parseFloat(activity.amount) || 0), 0) || 0;

    console.log('\n📊 Verification:');
    console.log(`✅ Found ${createdActivities?.length || 0} claimable mining activities`);
    console.log(`✅ Total claimable: ${totalClaimable.toFixed(4)} RZC`);

    console.log('\n🎯 Ready for Testing!');
    console.log('====================');
    console.log('The user now has claimable mining rewards that can be tested in the UI.');
    console.log('You can now:');
    console.log('1. Open the NativeWalletUI component');
    console.log('2. See the "Claimable RZC" card with the claim button');
    console.log('3. Test the claim functionality');

  } catch (error) {
    console.error('❌ Failed to create test activities:', error);
  }
}

// Run the script
createTestMiningActivities().catch(console.error);