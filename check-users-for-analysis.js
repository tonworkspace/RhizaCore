/**
 * Check available users for RZC claiming system analysis
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

async function checkUsers() {
  console.log('🔍 Checking available users...');
  
  try {
    // Get first 10 users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, telegram_id, available_balance, created_at')
      .order('id', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('📭 No users found in database');
      return;
    }

    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username || 'N/A'}, Balance: ${user.available_balance || 0} RZC`);
      console.log(`   Telegram ID: ${user.telegram_id}, Created: ${user.created_at}`);
    });

    // Check for users with activities
    console.log('\n🔍 Checking users with RZC activities...');
    
    const { data: usersWithActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('user_id, type, amount, created_at')
      .in('type', ['mining_complete', 'rzc_claim'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
      return;
    }

    if (usersWithActivities && usersWithActivities.length > 0) {
      console.log(`\n📋 Recent RZC activities (${usersWithActivities.length}):`);
      
      const userActivityCounts = {};
      usersWithActivities.forEach(activity => {
        if (!userActivityCounts[activity.user_id]) {
          userActivityCounts[activity.user_id] = { mining: 0, claims: 0, totalAmount: 0 };
        }
        
        if (activity.type === 'mining_complete') {
          userActivityCounts[activity.user_id].mining++;
        } else if (activity.type === 'rzc_claim') {
          userActivityCounts[activity.user_id].claims++;
        }
        
        userActivityCounts[activity.user_id].totalAmount += parseFloat(activity.amount) || 0;
      });

      Object.entries(userActivityCounts).forEach(([userId, stats]) => {
        console.log(`User ${userId}: ${stats.mining} mining, ${stats.claims} claims, ${stats.totalAmount.toFixed(3)} RZC total`);
      });

      // Suggest a good user ID for testing
      const bestUserId = Object.keys(userActivityCounts)[0];
      console.log(`\n💡 Suggested user ID for testing: ${bestUserId}`);
    } else {
      console.log('📭 No RZC activities found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();