// Comprehensive test script for complete referral flow
// Run this in browser console to test the entire system

console.log('🔄 Testing Complete Referral Flow');
console.log('==================================');

const testReferralFlow = {
  
  // Test 1: First User Setup
  async testFirstUserSetup() {
    console.log('\n1️⃣ Testing First User Setup...');
    
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
          sponsor_code: firstUser.sponsor_code,
          created: firstUser.created_at
        });
        
        // Check if first user has admin sponsor code
        if (firstUser.sponsor_code?.startsWith('ADMIN-')) {
          console.log('✅ First user has admin sponsor code');
        } else {
          console.log('⚠️ First user needs admin sponsor code');
        }
        
        return firstUser;
      } else {
        console.log('❌ No first user found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error testing first user setup:', error);
      return null;
    }
  },
  
  // Test 2: Start Parameters Handling
  async testStartParameters() {
    console.log('\n2️⃣ Testing Start Parameters Handling...');
    
    try {
      // Get current launch params (if available)
      const launchParams = window.Telegram?.WebApp?.initDataUnsafe;
      const startParam = launchParams?.start_param;
      
      if (startParam) {
        console.log('✅ Start parameter detected:', startParam);
        
        // Parse start param
        const parsedReferrerTgId = parseInt(startParam, 10);
        if (!isNaN(parsedReferrerTgId) && parsedReferrerTgId > 0) {
          console.log('✅ Valid numeric start parameter:', parsedReferrerTgId);
          
          // Check if referrer exists
          const { data: referrer } = await supabase
            .from('users')
            .select('id, username, telegram_id')
            .eq('telegram_id', String(parsedReferrerTgId))
            .single();
            
          if (referrer) {
            console.log('✅ Referrer found:', referrer);
          } else {
            console.log('❌ Referrer not found for telegram_id:', parsedReferrerTgId);
          }
        } else {
          console.log('⚠️ Non-numeric start parameter:', startParam);
        }
      } else {
        console.log('ℹ️ No start parameter detected');
      }
    } catch (error) {
      console.error('❌ Error testing start parameters:', error);
    }
  },
  
  // Test 3: Sponsor Gate Logic
  async testSponsorGateLogic() {
    console.log('\n3️⃣ Testing Sponsor Gate Logic...');
    
    try {
      // Check if sponsor gate is visible
      const sponsorGate = document.querySelector('[class*="sponsor"]');
      const joinTeamTitle = document.querySelector('h1:contains("Join a Team First")');
      
      if (sponsorGate || joinTeamTitle) {
        console.log('🚪 Sponsor gate is currently VISIBLE');
        
        // Check for first user instructions
        const firstUserSection = document.querySelector('[class*="yellow-50"]');
        if (firstUserSection) {
          console.log('✅ First user instructions are visible');
          
          // Check for default button
          const defaultButton = document.querySelector('button:contains("default")');
          if (defaultButton) {
            console.log('✅ Default bypass button is available');
          } else {
            console.log('❌ Default bypass button not found');
          }
        } else {
          console.log('❌ First user instructions not found');
        }
      } else {
        console.log('✅ Sponsor gate is NOT visible - user has access');
      }
    } catch (error) {
      console.error('❌ Error testing sponsor gate logic:', error);
    }
  },
  
  // Test 4: Referral Code Generation
  async testReferralCodeGeneration() {
    console.log('\n4️⃣ Testing Referral Code Generation...');
    
    try {
      // Get current user
      const currentUser = window.user;
      
      if (currentUser) {
        console.log('✅ Current user:', {
          id: currentUser.id,
          username: currentUser.username,
          telegram_id: currentUser.telegram_id,
          sponsor_code: currentUser.sponsor_code
        });
        
        // Check referral link format
        const expectedReferralLink = `https://t.me/tapptokenbot?startapp=${currentUser.telegram_id}`;
        console.log('📋 Expected referral link:', expectedReferralLink);
        
        // Check if user has a sponsor code
        if (currentUser.sponsor_code) {
          console.log('✅ User has sponsor code:', currentUser.sponsor_code);
        } else {
          console.log('⚠️ User needs sponsor code');
        }
      } else {
        console.log('❌ No current user found');
      }
    } catch (error) {
      console.error('❌ Error testing referral code generation:', error);
    }
  },
  
  // Test 5: Referral Records
  async testReferralRecords() {
    console.log('\n5️⃣ Testing Referral Records...');
    
    try {
      const currentUser = window.user;
      
      if (currentUser) {
        // Check if user has referrals
        const { data: userReferrals } = await supabase
          .from('referrals')
          .select(`
            *,
            sponsor:users!sponsor_id(username, telegram_id),
            referred:users!referred_id(username, telegram_id)
          `)
          .eq('sponsor_id', currentUser.id);
          
        console.log(`📊 User has ${userReferrals?.length || 0} referrals`);
        
        if (userReferrals && userReferrals.length > 0) {
          userReferrals.forEach((referral, index) => {
            console.log(`  ${index + 1}. Referred: ${referral.referred?.username || referral.referred_id} (Status: ${referral.status})`);
          });
        }
        
        // Check if user has a sponsor
        const { data: userSponsor } = await supabase
          .from('referrals')
          .select(`
            *,
            sponsor:users!sponsor_id(username, telegram_id)
          `)
          .eq('referred_id', currentUser.id)
          .single();
          
        if (userSponsor) {
          console.log(`👥 User is sponsored by: ${userSponsor.sponsor?.username || userSponsor.sponsor_id}`);
        } else {
          console.log('👤 User has no sponsor');
        }
      }
    } catch (error) {
      console.error('❌ Error testing referral records:', error);
    }
  },
  
  // Test 6: Referral Rewards System
  async testReferralRewards() {
    console.log('\n6️⃣ Testing Referral Rewards System...');
    
    try {
      const currentUser = window.user;
      
      if (currentUser) {
        // Check user's referral earnings
        console.log('💰 User referral data:', {
          total_referral_earnings: currentUser.total_referral_earnings || 0,
          team_volume: currentUser.team_volume || 0,
          direct_referrals: currentUser.direct_referrals || 0
        });
        
        // Check if user has any referral earnings in activities
        const { data: referralActivities } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', currentUser.id)
          .like('type', '%referral%')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (referralActivities && referralActivities.length > 0) {
          console.log('📈 Recent referral activities:');
          referralActivities.forEach((activity, index) => {
            console.log(`  ${index + 1}. ${activity.type}: ${activity.amount || 'N/A'} (${activity.status})`);
          });
        } else {
          console.log('ℹ️ No referral activities found');
        }
      }
    } catch (error) {
      console.error('❌ Error testing referral rewards:', error);
    }
  },
  
  // Test 7: Simulate Complete Flow
  simulateCompleteFlow() {
    console.log('\n7️⃣ Simulating Complete Referral Flow...');
    
    console.log('📋 Complete Flow Steps:');
    console.log('1. First user registers and uses "default" code to bypass sponsor gate');
    console.log('2. First user gets admin sponsor code (ADMIN-XXXX)');
    console.log('3. First user shares referral link: https://t.me/tapptokenbot?startapp=TELEGRAM_ID');
    console.log('4. New user clicks link and gets automatic sponsor assignment');
    console.log('5. New user enters platform without sponsor gate');
    console.log('6. New user can stake and generate referral rewards for sponsor');
    console.log('7. Sponsor earns rewards from new user activities');
    
    console.log('\n🔧 Manual Testing Steps:');
    console.log('- Test first user with "default" code');
    console.log('- Test new user via referral link');
    console.log('- Test manual sponsor code entry');
    console.log('- Test referral rewards generation');
    console.log('- Test sponsor gate bypass for all scenarios');
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Running complete referral flow tests...\n');
    
    const firstUser = await this.testFirstUserSetup();
    await this.testStartParameters();
    this.testSponsorGateLogic();
    await this.testReferralCodeGeneration();
    await this.testReferralRecords();
    await this.testReferralRewards();
    this.simulateCompleteFlow();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- First user should use "default" code to bypass sponsor gate');
    console.log('- Start parameters should auto-assign sponsors for new users');
    console.log('- Referral records should be created and maintained properly');
    console.log('- Referral rewards should be calculated and distributed correctly');
    
    if (firstUser) {
      console.log(`\n🎯 First user details:`);
      console.log(`- ID: ${firstUser.id}`);
      console.log(`- Username: ${firstUser.username || 'N/A'}`);
      console.log(`- Telegram ID: ${firstUser.telegram_id}`);
      console.log(`- Sponsor Code: ${firstUser.sponsor_code || 'Not set'}`);
      console.log(`- Referral Link: https://t.me/tapptokenbot?startapp=${firstUser.telegram_id}`);
    }
  }
};

// Make available globally
window.testReferralFlow = testReferralFlow;

console.log('\n🎯 Available commands:');
console.log('- testReferralFlow.testFirstUserSetup()');
console.log('- testReferralFlow.testStartParameters()');
console.log('- testReferralFlow.testSponsorGateLogic()');
console.log('- testReferralFlow.testReferralCodeGeneration()');
console.log('- testReferralFlow.testReferralRecords()');
console.log('- testReferralFlow.testReferralRewards()');
console.log('- testReferralFlow.simulateCompleteFlow()');
console.log('- testReferralFlow.runAllTests()');

console.log('\n💡 Tip: Run testReferralFlow.runAllTests() to test everything!');
