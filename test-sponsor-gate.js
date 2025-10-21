// Quick test script to verify sponsor gate functionality
// Run this in your browser console while on the app

console.log('🔐 Sponsor Gate Testing Script');
console.log('==============================');

// Import the tester (you'll need to adjust the import path based on your setup)
// import { testSponsorGate } from './src/utils/sponsorGateTester';

// Quick manual tests
const quickTests = {
  // Test 1: Check if current user is first user
  async checkFirstUser() {
    console.log('\n1️⃣ Testing First User Detection...');
    
    try {
      // This assumes supabase is available globally
      const { data: firstUser } = await supabase
        .from('users')
        .select('id, username, telegram_id, sponsor_code, created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      console.log('First user found:', firstUser);
      
      // Check if current user is first user (you'll need to replace with actual user ID)
      const currentUserId = window.user?.id || prompt('Enter current user ID:');
      
      if (firstUser?.id == currentUserId) {
        console.log('✅ Current user IS the first user - should bypass sponsor gate');
      } else {
        console.log('❌ Current user is NOT the first user - may see sponsor gate');
      }
      
      return firstUser;
    } catch (error) {
      console.error('Error checking first user:', error);
    }
  },
  
  // Test 2: Check sponsor gate state
  checkSponsorGateState() {
    console.log('\n2️⃣ Checking Sponsor Gate State...');
    
    // Check if sponsor gate elements exist
    const sponsorGate = document.querySelector('[class*="sponsor"]');
    const joinTeamTitle = document.querySelector('h1:contains("Join a Team First")');
    
    if (sponsorGate || joinTeamTitle) {
      console.log('🚪 Sponsor gate is currently VISIBLE');
      console.log('Elements found:', { sponsorGate: !!sponsorGate, joinTeamTitle: !!joinTeamTitle });
    } else {
      console.log('✅ Sponsor gate is NOT visible - user has access');
    }
  },
  
  // Test 3: Test admin bypass button
  testAdminBypass() {
    console.log('\n3️⃣ Testing Admin Bypass Button...');
    
    const bypassButton = document.querySelector('button:contains("Admin Bypass")');
    
    if (bypassButton) {
      console.log('✅ Admin bypass button found');
      console.log('Click the button to test bypass functionality');
    } else {
      console.log('❌ Admin bypass button not found');
    }
  },
  
  // Test 4: Check user sponsor status
  async checkSponsorStatus() {
    console.log('\n4️⃣ Checking Sponsor Status...');
    
    const currentUserId = window.user?.id || prompt('Enter user ID to check:');
    
    try {
      const { data: referralData } = await supabase
        .from('referrals')
        .select('sponsor_id')
        .eq('referred_id', currentUserId)
        .maybeSingle();
        
      if (referralData?.sponsor_id) {
        console.log('✅ User has sponsor:', referralData.sponsor_id);
      } else {
        console.log('❌ User has no sponsor');
      }
      
      return referralData;
    } catch (error) {
      console.error('Error checking sponsor status:', error);
    }
  },
  
  // Run all tests
  async runAll() {
    console.log('🚀 Running all sponsor gate tests...\n');
    
    await this.checkFirstUser();
    this.checkSponsorGateState();
    this.testAdminBypass();
    await this.checkSponsorStatus();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- If you see the sponsor gate, try the admin bypass button');
    console.log('- If you are the first user, the gate should not appear');
    console.log('- Use the default codes (admin/system/default) if you are the first user');
  }
};

// Make functions available globally
window.sponsorGateTests = quickTests;

console.log('\n🎯 Available commands:');
console.log('- sponsorGateTests.checkFirstUser()');
console.log('- sponsorGateTests.checkSponsorGateState()');
console.log('- sponsorGateTests.testAdminBypass()');
console.log('- sponsorGateTests.checkSponsorStatus()');
console.log('- sponsorGateTests.runAll()');

console.log('\n💡 Tip: Run sponsorGateTests.runAll() to test everything at once!');
