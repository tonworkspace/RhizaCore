// Test script to verify sponsor gate visibility for different user types
// Run this in browser console to debug sponsor gate issues

console.log('🚪 Testing Sponsor Gate Visibility');
console.log('==================================');

const testSponsorGateVisibility = {
  
  // Test 1: Check current user's sponsor status
  async checkCurrentUserSponsorStatus() {
    console.log('\n1️⃣ Checking Current User Sponsor Status...');
    
    try {
      const currentUser = window.user;
      
      if (currentUser) {
        console.log('👤 Current user details:', {
          id: currentUser.id,
          username: currentUser.username,
          telegram_id: currentUser.telegram_id,
          sponsor_id: currentUser.sponsor_id,
          created_at: currentUser.created_at
        });
        
        // Check referrals table
        const { data: referralData } = await supabase
          .from('referrals')
          .select('sponsor_id, status')
          .eq('referred_id', currentUser.id)
          .maybeSingle();
          
        console.log('📊 Referral data from database:', referralData);
        
        // Check if user is first user
        const { data: firstUser } = await supabase
          .from('users')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
          
        const isFirstUser = firstUser?.id === currentUser.id;
        console.log('👑 Is first user:', isFirstUser);
        
        // Determine expected sponsor gate visibility
        const hasSponsorFromReferrals = !!referralData?.sponsor_id;
        const hasSponsorFromUser = !!currentUser.sponsor_id;
        const hasSponsorStatus = hasSponsorFromReferrals || hasSponsorFromUser;
        const shouldShowGate = !hasSponsorStatus && !isFirstUser;
        
        console.log('🔍 Sponsor status analysis:', {
          hasSponsorFromReferrals,
          hasSponsorFromUser,
          hasSponsorStatus,
          isFirstUser,
          shouldShowGate: shouldShowGate
        });
        
        return {
          user: currentUser,
          referralData,
          isFirstUser,
          hasSponsorStatus,
          shouldShowGate
        };
      } else {
        console.log('❌ No current user found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking user sponsor status:', error);
      return null;
    }
  },
  
  // Test 2: Check sponsor gate UI visibility
  checkSponsorGateUIVisibility() {
    console.log('\n2️⃣ Checking Sponsor Gate UI Visibility...');
    
    try {
      // Check if sponsor gate elements are visible
      const sponsorGate = document.querySelector('[class*="sponsor"]');
      const joinTeamTitle = document.querySelector('h1');
      const isJoinTeamTitle = joinTeamTitle?.textContent?.includes('Join a Team First');
      
      console.log('🚪 Sponsor gate elements found:', {
        sponsorGate: !!sponsorGate,
        joinTeamTitle: !!joinTeamTitle,
        isJoinTeamTitle: isJoinTeamTitle,
        titleText: joinTeamTitle?.textContent
      });
      
      // Check for first user instructions
      const firstUserSection = document.querySelector('[class*="yellow-50"]');
      const defaultButton = document.querySelector('button:contains("default")');
      
      console.log('📝 First user elements found:', {
        firstUserSection: !!firstUserSection,
        defaultButton: !!defaultButton
      });
      
      // Check if main app content is visible
      const mainContent = document.querySelector('[class*="min-h-screen"]');
      const isSponsorGateVisible = isJoinTeamTitle && joinTeamTitle.closest('[class*="min-h-screen"]');
      
      console.log('📱 UI visibility analysis:', {
        mainContent: !!mainContent,
        isSponsorGateVisible: !!isSponsorGateVisible,
        sponsorGateActuallyVisible: !!isSponsorGateVisible
      });
      
      return {
        sponsorGateFound: !!sponsorGate,
        joinTeamTitleFound: isJoinTeamTitle,
        sponsorGateVisible: !!isSponsorGateVisible,
        firstUserSectionFound: !!firstUserSection
      };
    } catch (error) {
      console.error('❌ Error checking UI visibility:', error);
      return null;
    }
  },
  
  // Test 3: Simulate different user scenarios
  async simulateUserScenarios() {
    console.log('\n3️⃣ Simulating Different User Scenarios...');
    
    try {
      // Get all users to test different scenarios
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, username, sponsor_id, created_at')
        .order('created_at', { ascending: true })
        .limit(5);
        
      if (allUsers && allUsers.length > 0) {
        console.log('👥 Testing scenarios for different users:');
        
        for (let i = 0; i < allUsers.length; i++) {
          const user = allUsers[i];
          
          // Check if user is first user
          const isFirstUser = i === 0;
          
          // Check referrals table
          const { data: referralData } = await supabase
            .from('referrals')
            .select('sponsor_id')
            .eq('referred_id', user.id)
            .maybeSingle();
            
          const hasSponsorFromReferrals = !!referralData?.sponsor_id;
          const hasSponsorFromUser = !!user.sponsor_id;
          const hasSponsorStatus = hasSponsorFromReferrals || hasSponsorFromUser;
          const shouldShowGate = !hasSponsorStatus && !isFirstUser;
          
          console.log(`  User ${i + 1}: ${user.username || user.id}`, {
            isFirstUser,
            hasSponsorFromReferrals,
            hasSponsorFromUser,
            hasSponsorStatus,
            shouldShowGate: shouldShowGate ? 'YES' : 'NO'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error simulating user scenarios:', error);
    }
  },
  
  // Test 4: Check new user creation flow
  async checkNewUserFlow() {
    console.log('\n4️⃣ Checking New User Creation Flow...');
    
    try {
      // Check if there are users without sponsors
      const { data: usersWithoutSponsors } = await supabase
        .from('users')
        .select('id, username, sponsor_id, created_at')
        .is('sponsor_id', null)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (usersWithoutSponsors && usersWithoutSponsors.length > 0) {
        console.log('👤 Users without sponsors found:');
        
        for (const user of usersWithoutSponsors) {
          // Check if user is first user
          const { data: firstUser } = await supabase
            .from('users')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
            
          const isFirstUser = firstUser?.id === user.id;
          
          // Check referrals table
          const { data: referralData } = await supabase
            .from('referrals')
            .select('sponsor_id')
            .eq('referred_id', user.id)
            .maybeSingle();
            
          const hasSponsorFromReferrals = !!referralData?.sponsor_id;
          const shouldShowGate = !hasSponsorFromReferrals && !isFirstUser;
          
          console.log(`  - ${user.username || user.id}:`, {
            created: user.created_at,
            isFirstUser,
            hasReferralRecord: hasSponsorFromReferrals,
            shouldShowGate: shouldShowGate ? 'YES' : 'NO'
          });
        }
      } else {
        console.log('ℹ️ All users have sponsors or are first user');
      }
    } catch (error) {
      console.error('❌ Error checking new user flow:', error);
    }
  },
  
  // Test 5: Force sponsor gate to show (for testing)
  forceSponsorGateToShow() {
    console.log('\n5️⃣ Force Sponsor Gate to Show (Testing)...');
    
    try {
      // This is for testing purposes only
      console.log('🔧 To force sponsor gate to show:');
      console.log('1. Set user.sponsor_id to null in database');
      console.log('2. Remove any referral records for the user');
      console.log('3. Make sure user is not the first user');
      console.log('4. Refresh the page');
      
      // Check if we can manually trigger sponsor gate
      const sponsorGateState = {
        showSponsorGate: window.showSponsorGate,
        hasSponsor: window.hasSponsor,
        user: window.user
      };
      
      console.log('🔍 Current sponsor gate state:', sponsorGateState);
      
      console.log('💡 Manual trigger commands (for testing):');
      console.log('- Check if checkSponsorStatus() function exists');
      console.log('- Call it manually to refresh sponsor status');
      
    } catch (error) {
      console.error('❌ Error in force sponsor gate test:', error);
    }
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all sponsor gate visibility tests...\n');
    
    const userStatus = await this.checkCurrentUserSponsorStatus();
    const uiVisibility = this.checkSponsorGateUIVisibility();
    await this.simulateUserScenarios();
    await this.checkNewUserFlow();
    this.forceSponsorGateToShow();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📊 Summary:');
    
    if (userStatus) {
      console.log(`Current user should ${userStatus.shouldShowGate ? 'SEE' : 'NOT SEE'} sponsor gate`);
    }
    
    if (uiVisibility) {
      console.log(`Sponsor gate UI is ${uiVisibility.sponsorGateVisible ? 'VISIBLE' : 'HIDDEN'}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('- If user should see gate but doesn\'t: Check checkSponsorStatus logic');
    console.log('- If gate shows but shouldn\'t: Check user sponsor status in database');
    console.log('- If first user sees gate: Check first user detection logic');
    console.log('- If new users don\'t see gate: Check sponsor_id assignment in useAuth');
  }
};

// Make available globally
window.testSponsorGateVisibility = testSponsorGateVisibility;

console.log('\n🎯 Available commands:');
console.log('- testSponsorGateVisibility.checkCurrentUserSponsorStatus()');
console.log('- testSponsorGateVisibility.checkSponsorGateUIVisibility()');
console.log('- testSponsorGateVisibility.simulateUserScenarios()');
console.log('- testSponsorGateVisibility.checkNewUserFlow()');
console.log('- testSponsorGateVisibility.forceSponsorGateToShow()');
console.log('- testSponsorGateVisibility.runAllTests()');

console.log('\n💡 Tip: Run testSponsorGateVisibility.runAllTests() to debug sponsor gate issues!');
