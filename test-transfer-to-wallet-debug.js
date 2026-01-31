const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'your-supabase-url',
  process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
);

async function debugTransferToWallet(userId) {
  console.log('=== DEBUGGING TRANSFER TO WALLET ===');
  console.log('User ID:', userId);
  
  try {
    // 1. Check user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('User fetch error:', userError);
      return;
    }
    
    console.log('User data:', {
      id: user.id,
      username: user.username,
      available_balance: user.available_balance,
      total_earned: user.total_earned,
      last_claim_time: user.last_claim_time
    });
    
    // 2. Check activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (activitiesError) {
      console.error('Activities fetch error:', activitiesError);
      return;
    }
    
    console.log('Recent activities count:', activities?.length || 0);
    console.log('Activities:', activities?.map(a => ({
      type: a.type,
      amount: a.amount,
      status: a.status,
      created_at: a.created_at,
      metadata: a.metadata
    })));
    
    // 3. Calculate balances manually
    let totalEarned = 0;
    let claimableRZC = 0;
    let claimedRZC = 0;
    
    if (activities) {
      for (const activity of activities) {
        if (activity.type === 'mining_complete' && activity.status === 'completed') {
          totalEarned += activity.amount;
          
          // Check if this has been claimed to airdrop
          const isClaimedToAirdrop = activity.metadata?.claimed_to_airdrop === true;
          
          if (!isClaimedToAirdrop) {
            claimableRZC += activity.amount;
          } else {
            claimedRZC += activity.amount;
          }
        }
      }
    }
    
    console.log('Calculated balances:');
    console.log('- Total Earned:', totalEarned);
    console.log('- Claimable RZC:', claimableRZC);
    console.log('- Claimed RZC:', claimedRZC);
    console.log('- Database available_balance:', parseFloat(user.available_balance) || 0);
    
    // 4. Check airdrop balance
    const { data: airdropBalance, error: airdropError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (airdropError && airdropError.code !== 'PGRST116') {
      console.error('Airdrop balance fetch error:', airdropError);
    } else if (airdropBalance) {
      console.log('Airdrop balance:', {
        available_balance: airdropBalance.available_balance,
        staked_balance: airdropBalance.staked_balance,
        total_claimed_to_airdrop: airdropBalance.total_claimed_to_airdrop
      });
    } else {
      console.log('No airdrop balance record found');
    }
    
    // 5. Test the claim function conditions
    console.log('\n=== CLAIM FUNCTION CONDITIONS ===');
    console.log('Total earned > 0:', totalEarned > 0);
    console.log('Can attempt claim:', totalEarned > 0);
    
    if (totalEarned <= 0) {
      console.log('❌ ISSUE: No total earned RZC found');
      console.log('Possible causes:');
      console.log('- No mining_complete activities');
      console.log('- All activities have amount = 0');
      console.log('- Activities have wrong status');
    } else {
      console.log('✅ Total earned RZC found, claim should be possible');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Usage: node test-transfer-to-wallet-debug.js [userId]
const userId = process.argv[2] || 123456; // Default test user ID
debugTransferToWallet(parseInt(userId));