// Debug script to test leaderboard data
import { supabase } from './src/lib/supabaseClient.js';

async function debugLeaderboard() {
  console.log('🔍 Debugging Leaderboard...');
  
  try {
    // 1. Check raw referrals data
    console.log('\n1. Raw referrals data:');
    const { data: rawData, error } = await supabase
      .from('referrals')
      .select(`
        sponsor_id,
        status,
        sponsor:users!sponsor_id(username, total_earned, total_deposit)
      `)
      .not('sponsor_id', 'is', null)
      .limit(100);
    
    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }
    
    console.log(`✅ Found ${rawData?.length || 0} referral records`);
    console.log('Sample records:', rawData?.slice(0, 3));
    
    // 2. Check status values
    console.log('\n2. Status distribution:');
    const statusCounts = {};
    rawData?.forEach(r => {
      const status = r.status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('Status counts:', statusCounts);
    
    // 3. Check sponsor data structure
    console.log('\n3. Sponsor data structure:');
    const sampleSponsor = rawData?.[0]?.sponsor;
    console.log('Sample sponsor:', sampleSponsor);
    console.log('Is array?', Array.isArray(sampleSponsor));
    
    // 4. Test aggregation logic
    console.log('\n4. Testing aggregation:');
    const counts = rawData?.reduce((acc, curr) => {
      const id = curr.sponsor_id;
      if (!id) return acc;

      const sponsorData = Array.isArray(curr.sponsor) ? curr.sponsor[0] : curr.sponsor;

      if (!acc[id]) {
        acc[id] = {
          sponsor_id: id,
          username: sponsorData?.username || `User ${id}`,
          referral_count: 0,
          active_referrals: 0,
          total_earned: sponsorData?.total_earned || 0,
          total_deposit: sponsorData?.total_deposit || 0,
        };
      }

      acc[id].referral_count++;

      if ((curr.status || '').toLowerCase() === 'active') {
        acc[id].active_referrals++;
      }

      return acc;
    }, {});
    
    const sortedStats = Object.values(counts || {})
      .sort((a, b) => {
        if (b.active_referrals !== a.active_referrals) {
          return b.active_referrals - a.active_referrals;
        }
        return b.referral_count - a.referral_count;
      })
      .slice(0, 10);
    
    console.log('Top 10 leaderboard:', sortedStats);
    
    // 5. Check real-time subscription
    console.log('\n5. Testing real-time subscription...');
    const channel = supabase.channel('test_referrals')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'referrals'
      }, (payload) => {
        console.log('📡 Real-time update received:', payload);
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });
    
    // Clean up after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 Cleaned up test subscription');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLeaderboard();