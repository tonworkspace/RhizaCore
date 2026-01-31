// Check existing users in the database
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('🔍 Checking existing users...\n');

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, wallet_address, available_balance')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No users found in database');
      return;
    }

    console.log('✅ Found users:');
    users.forEach(user => {
      console.log(`   ID: ${user.id}, Username: ${user.username || 'N/A'}, Balance: ${user.available_balance || 0}`);
    });

    // Use the first user for testing
    const testUserId = users[0].id;
    console.log(`\n🎯 Using user ID ${testUserId} for testing`);

    // Check if this user has airdrop balance
    const { data: airdropBalance, error: balanceError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Error checking airdrop balance:', balanceError);
      return;
    }

    if (airdropBalance) {
      console.log('✅ User has airdrop balance:', {
        available: airdropBalance.available_balance,
        staked: airdropBalance.staked_balance || 0,
        withdrawn: airdropBalance.withdrawn_balance || 0
      });
    } else {
      console.log('ℹ️  User has no airdrop balance yet');
    }

    // Check staking activities
    const { data: stakingActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('type, amount, metadata, created_at')
      .eq('user_id', testUserId)
      .eq('type', 'airdrop_balance_stake_locked')
      .order('created_at', { ascending: false })
      .limit(3);

    if (activitiesError) {
      console.error('❌ Error checking staking activities:', activitiesError);
      return;
    }

    if (stakingActivities && stakingActivities.length > 0) {
      console.log('\n✅ Found staking activities:');
      stakingActivities.forEach((activity, index) => {
        const metadata = activity.metadata || {};
        console.log(`   ${index + 1}. Amount: ${activity.amount}, Lock: ${metadata.lock_period_years}y, APY: ${metadata.apy_rate}%`);
      });
    } else {
      console.log('\nℹ️  No staking activities found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers().catch(console.error);