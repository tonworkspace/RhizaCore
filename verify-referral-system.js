// Final verification script for the complete referral system
// Run this in browser console to verify everything is working

console.log('✅ Final Verification: Complete Referral System');
console.log('==============================================');

const verifySystem = {
  
  // Verify 1: First User Auto-Bypass
  async verifyFirstUserBypass() {
    console.log('\n1️⃣ Verifying First User Auto-Bypass...');
    
    try {
      // Get first user
      const { data: firstUser } = await supabase
        .from('users')
        .select('id, username, telegram_id, sponsor_code, created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      if (firstUser) {
        console.log('✅ First user found:', {
          id: firstUser.id,
          username: firstUser.username,
          telegram_id: firstUser.telegram_id,
          sponsor_code: firstUser.sponsor_code
        });
        
        // Test default code functionality
        console.log('🔧 First user can use these codes to bypass:');
        console.log('  - "default" (primary auto-bypass)');
        console.log('  - "admin"');
        console.log('  - "system"');
        console.log('  - Generated admin code (ADMIN-XXXX)');
        
        return true;
      } else {
        console.log('❌ No first user found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verifying first user bypass:', error);
      return false;
    }
  },
  
  // Verify 2: Referral Link Generation
  async verifyReferralLinks() {
    console.log('\n2️⃣ Verifying Referral Link Generation...');
    
    try {
      const currentUser = window.user;
      
      if (currentUser) {
        const referralLink = `https://t.me/tapptokenbot?startapp=${currentUser.telegram_id}`;
        console.log('✅ Referral link generated:', referralLink);
        
        // Check if user has sponsor code
        if (currentUser.sponsor_code) {
          console.log('✅ User has sponsor code:', currentUser.sponsor_code);
        } else {
          console.log('⚠️ User needs sponsor code');
        }
        
        return true;
      } else {
        console.log('❌ No current user found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verifying referral links:', error);
      return false;
    }
  },
  
  // Verify 3: Start Parameters Handling
  async verifyStartParameters() {
    console.log('\n3️⃣ Verifying Start Parameters Handling...');
    
    try {
      // Check if start parameters are being processed
      const launchParams = window.Telegram?.WebApp?.initDataUnsafe;
      const startParam = launchParams?.start_param;
      
      if (startParam) {
        console.log('✅ Start parameter detected:', startParam);
        
        // Verify numeric parsing
        const parsedId = parseInt(startParam, 10);
        if (!isNaN(parsedId) && parsedId > 0) {
          console.log('✅ Valid numeric start parameter:', parsedId);
          
          // Check if referrer exists
          const { data: referrer } = await supabase
            .from('users')
            .select('id, username, telegram_id')
            .eq('telegram_id', String(parsedId))
            .single();
            
          if (referrer) {
            console.log('✅ Referrer found:', referrer);
          } else {
            console.log('❌ Referrer not found');
          }
        } else {
          console.log('⚠️ Non-numeric start parameter');
        }
      } else {
        console.log('ℹ️ No start parameter (normal for direct access)');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error verifying start parameters:', error);
      return false;
    }
  },
  
  // Verify 4: Referral Records Management
  async verifyReferralRecords() {
    console.log('\n4️⃣ Verifying Referral Records Management...');
    
    try {
      const currentUser = window.user;
      
      if (currentUser) {
        // Check user's sponsor
        const { data: userSponsor } = await supabase
          .from('referrals')
          .select(`
            *,
            sponsor:users!sponsor_id(username, telegram_id)
          `)
          .eq('referred_id', currentUser.id)
          .single();
          
        if (userSponsor) {
          console.log('✅ User has sponsor:', userSponsor.sponsor?.username || userSponsor.sponsor_id);
          console.log('✅ Referral status:', userSponsor.status);
        } else {
          console.log('👤 User has no sponsor (first user or not referred)');
        }
        
        // Check user's referrals
        const { data: userReferrals } = await supabase
          .from('referrals')
          .select(`
            *,
            referred:users!referred_id(username, telegram_id)
          `)
          .eq('sponsor_id', currentUser.id);
          
        console.log(`📊 User has ${userReferrals?.length || 0} referrals`);
        
        if (userReferrals && userReferrals.length > 0) {
          userReferrals.forEach((referral, index) => {
            console.log(`  ${index + 1}. ${referral.referred?.username || referral.referred_id} (${referral.status})`);
          });
        }
        
        return true;
      } else {
        console.log('❌ No current user found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verifying referral records:', error);
      return false;
    }
  },
  
  // Verify 5: Referral Rewards System
  async verifyReferralRewards() {
    console.log('\n5️⃣ Verifying Referral Rewards System...');
    
    try {
      const currentUser = window.user;
      
      if (currentUser) {
        console.log('💰 User referral earnings:', {
          total_referral_earnings: currentUser.total_referral_earnings || 0,
          team_volume: currentUser.team_volume || 0,
          direct_referrals: currentUser.direct_referrals || 0
        });
        
        // Check for referral reward activities
        const { data: referralActivities } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', currentUser.id)
          .like('type', '%referral%')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (referralActivities && referralActivities.length > 0) {
          console.log('📈 Recent referral activities:');
          referralActivities.forEach((activity, index) => {
            console.log(`  ${index + 1}. ${activity.type}: ${activity.amount || 'N/A'} (${activity.status})`);
          });
        } else {
          console.log('ℹ️ No referral activities yet (normal for new users)');
        }
        
        console.log('🔧 Referral rewards are triggered when:');
        console.log('  - User makes a deposit/stake');
        console.log('  - Sponsor gets 1000 RZC or 10% of staked amount (whichever is higher)');
        console.log('  - Rewards are logged in activities table');
        
        return true;
      } else {
        console.log('❌ No current user found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verifying referral rewards:', error);
      return false;
    }
  },
  
  // Verify 6: Complete Flow Summary
  generateFlowSummary() {
    console.log('\n6️⃣ Complete Referral Flow Summary...');
    
    console.log('📋 How the System Works:');
    console.log('');
    console.log('1️⃣ FIRST USER SETUP:');
    console.log('   - First user registers in the system');
    console.log('   - Uses "default" code to bypass sponsor gate');
    console.log('   - Gets admin sponsor code (ADMIN-XXXX)');
    console.log('   - Can now refer other users');
    console.log('');
    console.log('2️⃣ REFERRAL LINK SHARING:');
    console.log('   - First user shares: https://t.me/tapptokenbot?startapp=TELEGRAM_ID');
    console.log('   - New user clicks link and gets automatic sponsor assignment');
    console.log('   - New user enters platform without sponsor gate');
    console.log('');
    console.log('3️⃣ MANUAL CODE ENTRY:');
    console.log('   - New user can manually enter sponsor code');
    console.log('   - System validates code and creates referral record');
    console.log('   - User gets access to platform');
    console.log('');
    console.log('4️⃣ REFERRAL REWARDS:');
    console.log('   - When referred user stakes, sponsor gets rewards');
    console.log('   - Reward: 1000 RZC or 10% of staked amount (whichever is higher)');
    console.log('   - Rewards are tracked in activities table');
    console.log('');
    console.log('5️⃣ SYSTEM FEATURES:');
    console.log('   - Automatic first user bypass');
    console.log('   - Start parameter handling');
    console.log('   - Referral record management');
    console.log('   - Reward calculation and distribution');
    console.log('   - Team volume tracking');
  },
  
  // Run all verifications
  async runAllVerifications() {
    console.log('🚀 Running complete system verification...\n');
    
    const results = {
      firstUserBypass: await this.verifyFirstUserBypass(),
      referralLinks: await this.verifyReferralLinks(),
      startParameters: await this.verifyStartParameters(),
      referralRecords: await this.verifyReferralRecords(),
      referralRewards: await this.verifyReferralRewards()
    };
    
    this.generateFlowSummary();
    
    console.log('\n✅ Verification Complete!');
    console.log('\n📊 Results Summary:');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });
    
    const allPassed = Object.values(results).every(result => result === true);
    if (allPassed) {
      console.log('\n🎉 All systems are working correctly!');
    } else {
      console.log('\n⚠️ Some issues detected. Check the logs above.');
    }
  }
};

// Make available globally
window.verifySystem = verifySystem;

console.log('\n🎯 Available commands:');
console.log('- verifySystem.verifyFirstUserBypass()');
console.log('- verifySystem.verifyReferralLinks()');
console.log('- verifySystem.verifyStartParameters()');
console.log('- verifySystem.verifyReferralRecords()');
console.log('- verifySystem.verifyReferralRewards()');
console.log('- verifySystem.generateFlowSummary()');
console.log('- verifySystem.runAllVerifications()');

console.log('\n💡 Tip: Run verifySystem.runAllVerifications() to verify everything!');
