/**
 * Quick script to check available users for DEX testing
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('🔍 Checking available users...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, telegram_id, created_at')
      .order('id', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users found in database');
      return;
    }

    console.log('✅ Available users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username || 'N/A'}, Telegram ID: ${user.telegram_id}, Created: ${user.created_at}`);
    });

    // Check airdrop balances for these users
    console.log('\n🔍 Checking airdrop balances...');
    const { data: balances, error: balanceError } = await supabase
      .from('airdrop_balances')
      .select('user_id, available_balance, staked_balance, total_claimed_to_airdrop')
      .order('user_id', { ascending: true });

    if (balanceError) {
      console.error('❌ Error fetching airdrop balances:', balanceError);
      return;
    }

    if (!balances || balances.length === 0) {
      console.log('ℹ️ No airdrop balances found');
    } else {
      console.log('✅ Airdrop balances:');
      balances.forEach(balance => {
        console.log(`- User ID: ${balance.user_id}, Available: ${balance.available_balance}, Staked: ${balance.staked_balance}, Total Claimed: ${balance.total_claimed_to_airdrop}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers().catch(console.error);