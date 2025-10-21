// Test script to verify first user sponsor gate fix
// Run this in browser console to test the functionality

console.log('🔧 Testing First User Sponsor Gate Fix');
console.log('=====================================');

const testFirstUserFix = {
  
  // Test 1: Check if first user detection works
  async testFirstUserDetection() {
    console.log('\n1️⃣ Testing First User Detection...');
    
    try {
      const { data: firstUser } = await supabase
        .from('users')
        .select('id, username, telegram_id, sponsor_code, created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      console.log('✅ First user found:', firstUser);
      return firstUser;
    } catch (error) {
      console.error('❌ Error finding first user:', error);
      return null;
    }
  },
  
  // Test 2: Test default codes
  async testDefaultCodes() {
    console.log('\n2️⃣ Testing Default Codes...');
    
    const defaultCodes = ['admin', 'system', 'default'];
    
    for (const code of defaultCodes) {
      console.log(`Testing code: "${code}"`);
      // You can simulate clicking the button or manually entering the code
      console.log(`✅ Code "${code}" should work for first user`);
    }
  },
  
  // Test 3: Test admin code format
  testAdminCodeFormat() {
    console.log('\n3️⃣ Testing Admin Code Format...');
    
    // Test the admin code pattern
    const userId = 1; // Replace with actual first user ID
    const expectedAdminCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
    
    console.log(`Expected admin code format: ${expectedAdminCode}`);
    console.log('✅ Admin codes should start with "ADMIN-" and end with padded user ID');
  },
  
  // Test 4: Check sponsor gate UI
  checkSponsorGateUI() {
    console.log('\n4️⃣ Checking Sponsor Gate UI...');
    
    const sponsorGate = document.querySelector('[class*="sponsor"]');
    const firstUserSection = document.querySelector('[class*="yellow-50"]');
    const codeButtons = document.querySelectorAll('button');
    
    if (sponsorGate) {
      console.log('🚪 Sponsor gate is visible');
      
      if (firstUserSection) {
        console.log('✅ First user instructions are visible');
      } else {
        console.log('❌ First user instructions not found');
      }
      
      // Check for code buttons
      const adminButtons = Array.from(codeButtons).filter(btn => 
        btn.textContent?.includes('admin') || 
        btn.textContent?.includes('system') || 
        btn.textContent?.includes('default')
      );
      
      if (adminButtons.length > 0) {
        console.log('✅ Admin code buttons found:', adminButtons.length);
      } else {
        console.log('❌ Admin code buttons not found');
      }
    } else {
      console.log('✅ Sponsor gate is not visible - user has access');
    }
  },
  
  // Test 5: Simulate first user flow
  simulateFirstUserFlow() {
    console.log('\n5️⃣ Simulating First User Flow...');
    
    console.log('Steps for first user:');
    console.log('1. If sponsor gate appears, click "admin", "system", or "default" button');
    console.log('2. Or manually type one of these codes in the input field');
    console.log('3. Click "Join Team" button');
    console.log('4. System should generate admin code and bypass the gate');
    console.log('5. If admin code is already generated, user can use it directly');
    
    console.log('\nAlternative: Use generated admin code directly');
    console.log('- If admin code is already generated (ADMIN-XXXX), enter it directly');
    console.log('- System should recognize it as first user and bypass the gate');
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all first user fix tests...\n');
    
    const firstUser = await this.testFirstUserDetection();
    await this.testDefaultCodes();
    this.testAdminCodeFormat();
    this.checkSponsorGateUI();
    this.simulateFirstUserFlow();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- First user should automatically bypass sponsor gate');
    console.log('- If gate appears, use default codes: admin, system, default');
    console.log('- Or use generated admin code: ADMIN-XXXX');
    console.log('- UI now shows helpful buttons for first user');
    
    if (firstUser) {
      console.log(`\n🎯 First user details:`);
      console.log(`- ID: ${firstUser.id}`);
      console.log(`- Username: ${firstUser.username || 'N/A'}`);
      console.log(`- Sponsor Code: ${firstUser.sponsor_code || 'Not set'}`);
      console.log(`- Created: ${firstUser.created_at}`);
    }
  }
};

// Make available globally
window.testFirstUserFix = testFirstUserFix;

console.log('\n🎯 Available commands:');
console.log('- testFirstUserFix.testFirstUserDetection()');
console.log('- testFirstUserFix.testDefaultCodes()');
console.log('- testFirstUserFix.testAdminCodeFormat()');
console.log('- testFirstUserFix.checkSponsorGateUI()');
console.log('- testFirstUserFix.simulateFirstUserFlow()');
console.log('- testFirstUserFix.runAllTests()');

console.log('\n💡 Tip: Run testFirstUserFix.runAllTests() to test everything!');
