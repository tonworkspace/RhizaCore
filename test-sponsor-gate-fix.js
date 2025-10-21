// Test script to verify sponsor gate is working for new users
// Run this in browser console to test the fix

console.log('🔧 Testing Sponsor Gate Fix');
console.log('===========================');

const testSponsorGateFix = {
  
  // Test 1: Check sponsor gate state
  checkSponsorGateState() {
    console.log('\n1️⃣ Checking Sponsor Gate State...');
    
    // Check if sponsor gate is visible
    const sponsorGate = document.querySelector('[class*="sponsor"]');
    const joinTeamTitle = document.querySelector('h1:contains("Join a Team First")');
    const defaultButton = document.querySelector('button:contains("default")');
    
    if (sponsorGate || joinTeamTitle) {
      console.log('✅ Sponsor gate is VISIBLE');
      console.log('  - Gate element found:', !!sponsorGate);
      console.log('  - Title found:', !!joinTeamTitle);
      console.log('  - Default button found:', !!defaultButton);
      
      if (defaultButton) {
        console.log('  - Default button is clickable');
      }
    } else {
      console.log('❌ Sponsor gate is NOT visible');
      console.log('  - This means user has access or gate is not showing');
    }
    
    return !!(sponsorGate || joinTeamTitle);
  },
  
  // Test 2: Check user sponsor status
  async checkUserSponsorStatus() {
    console.log('\n2️⃣ Checking User Sponsor Status...');
    
    try {
      const currentUser = window.user;
      
      if (currentUser) {
        console.log('👤 Current user:', {
          id: currentUser.id,
          username: currentUser.username,
          telegram_id: currentUser.telegram_id,
          sponsor_id: currentUser.sponsor_id
        });
        
        // Check referrals table
        const { data: referralData } = await supabase
          .from('referrals')
          .select('sponsor_id')
          .eq('referred_id', currentUser.id)
          .maybeSingle();
          
        console.log('📊 Referral data:', referralData);
        
        const hasSponsor = !!(referralData?.sponsor_id || currentUser.sponsor_id);
        console.log('🔍 Has sponsor:', hasSponsor);
        
        if (hasSponsor) {
          console.log('✅ User has a sponsor - gate should NOT show');
        } else {
          console.log('❌ User has NO sponsor - gate SHOULD show');
        }
        
        return hasSponsor;
      } else {
        console.log('❌ No current user found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking user sponsor status:', error);
      return false;
    }
  },
  
  // Test 3: Check first user bypass
  async checkFirstUserBypass() {
    console.log('\n3️⃣ Checking First User Bypass...');
    
    try {
      // Get first user
      const { data: firstUser } = await supabase
        .from('users')
        .select('id, username, telegram_id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      const currentUser = window.user;
      
      if (firstUser && currentUser) {
        const isFirstUser = firstUser.id === currentUser.id;
        
        console.log('👑 First user:', firstUser);
        console.log('👤 Current user ID:', currentUser.id);
        console.log('🔍 Is first user:', isFirstUser);
        
        if (isFirstUser) {
          console.log('✅ Current user IS the first user - should bypass sponsor gate');
        } else {
          console.log('ℹ️ Current user is NOT the first user');
        }
        
        return isFirstUser;
      } else {
        console.log('❌ Could not determine first user status');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking first user bypass:', error);
      return false;
    }
  },
  
  // Test 4: Test default code functionality
  testDefaultCodeFunctionality() {
    console.log('\n4️⃣ Testing Default Code Functionality...');
    
    // Check if default button exists and is clickable
    const defaultButton = document.querySelector('button:contains("default")');
    
    if (defaultButton) {
      console.log('✅ Default button found');
      console.log('🔧 To test: Click the "default" button');
      console.log('📋 Expected behavior:');
      console.log('  - Button should populate input field with "default"');
      console.log('  - User can then click "Join Team" to bypass gate');
    } else {
      console.log('❌ Default button not found');
    }
    
    // Check input field
    const inputField = document.querySelector('input[placeholder*="sponsor code"]');
    if (inputField) {
      console.log('✅ Input field found');
      console.log('🔧 To test: Type "default" in input field and click "Join Team"');
    } else {
      console.log('❌ Input field not found');
    }
  },
  
  // Test 5: Manual sponsor code test
  async testManualSponsorCode() {
    console.log('\n5️⃣ Testing Manual Sponsor Code Entry...');
    
    console.log('🔧 Manual testing steps:');
    console.log('1. Enter a valid sponsor code (telegram_id or user_id)');
    console.log('2. Click "Join Team" button');
    console.log('3. Should create referral record and grant access');
    
    // Check if there are any existing users to use as sponsors
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, telegram_id')
        .limit(5);
        
      if (users && users.length > 0) {
        console.log('📋 Available sponsor codes for testing:');
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. User ID: ${user.id}, Telegram ID: ${user.telegram_id}, Username: ${user.username}`);
        });
      }
    } catch (error) {
      console.error('❌ Error fetching users for testing:', error);
    }
  },
  
  // Test 6: Debug sponsor gate logic
  debugSponsorGateLogic() {
    console.log('\n6️⃣ Debugging Sponsor Gate Logic...');
    
    console.log('🔍 Check browser console for these logs:');
    console.log('  - "🔍 Checking sponsor status for user: X"');
    console.log('  - "👑 First user ID: X Current user ID: Y"');
    console.log('  - "📊 Referral data: ..."');
    console.log('  - "🔍 Sponsor status check: ..."');
    console.log('');
    console.log('🔧 Expected flow:');
    console.log('1. User loads page');
    console.log('2. checkSponsorStatus() is called');
    console.log('3. If no sponsor found, showSponsorGate = true');
    console.log('4. Sponsor gate should be visible');
    console.log('');
    console.log('⚠️ If sponsor gate is not showing, check:');
    console.log('  - Console logs for errors');
    console.log('  - User has sponsor_id in database');
    console.log('  - User has referral record');
    console.log('  - First user bypass is working');
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Running sponsor gate fix tests...\n');
    
    const gateVisible = this.checkSponsorGateState();
    const hasSponsor = await this.checkUserSponsorStatus();
    const isFirstUser = await this.checkFirstUserBypass();
    
    this.testDefaultCodeFunctionality();
    await this.testManualSponsorCode();
    this.debugSponsorGateLogic();
    
    console.log('\n✅ Tests completed!');
    console.log('\n📊 Results Summary:');
    console.log(`  Sponsor Gate Visible: ${gateVisible ? '✅ YES' : '❌ NO'}`);
    console.log(`  User Has Sponsor: ${hasSponsor ? '✅ YES' : '❌ NO'}`);
    console.log(`  Is First User: ${isFirstUser ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    if (gateVisible) {
      console.log('🎉 Sponsor gate is working correctly!');
    } else if (hasSponsor) {
      console.log('ℹ️ Sponsor gate not showing because user has a sponsor (expected)');
    } else if (isFirstUser) {
      console.log('ℹ️ Sponsor gate not showing because user is first user (expected)');
    } else {
      console.log('⚠️ Sponsor gate should be showing but is not visible - check console logs');
    }
  }
};

// Make available globally
window.testSponsorGateFix = testSponsorGateFix;

console.log('\n🎯 Available commands:');
console.log('- testSponsorGateFix.checkSponsorGateState()');
console.log('- testSponsorGateFix.checkUserSponsorStatus()');
console.log('- testSponsorGateFix.checkFirstUserBypass()');
console.log('- testSponsorGateFix.testDefaultCodeFunctionality()');
console.log('- testSponsorGateFix.testManualSponsorCode()');
console.log('- testSponsorGateFix.debugSponsorGateLogic()');
console.log('- testSponsorGateFix.runAllTests()');

console.log('\n💡 Tip: Run testSponsorGateFix.runAllTests() to test everything!');
