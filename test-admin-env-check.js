// Test admin environment variable setup
console.log('=== Admin Environment Variables Test ===');

// Simulate environment variables (these should match your .env file)
const VITE_SUPER_ADMIN_IDS = '3';
const VITE_SUPER_ADMIN_TELEGRAM_IDS = '923481567';

console.log('Environment Variables:');
console.log('VITE_SUPER_ADMIN_IDS:', VITE_SUPER_ADMIN_IDS);
console.log('VITE_SUPER_ADMIN_TELEGRAM_IDS:', VITE_SUPER_ADMIN_TELEGRAM_IDS);

// Test parsing logic
const superAdminIds = VITE_SUPER_ADMIN_IDS.split(',')
  .map(id => id.trim())
  .filter(id => id.length > 0);

const superAdminTelegramIds = VITE_SUPER_ADMIN_TELEGRAM_IDS.split(',')
  .map(id => id.trim())
  .filter(id => id.length > 0);

console.log('\nParsed Admin IDs:', superAdminIds);
console.log('Parsed Telegram IDs:', superAdminTelegramIds);

// Test admin check logic
const testUserId = 3;
const testTelegramId = 923481567;

console.log('\n=== Admin Check Tests ===');
console.log('Testing User ID 3:', superAdminIds.includes(testUserId.toString()));
console.log('Testing Telegram ID 923481567:', superAdminTelegramIds.includes(testTelegramId.toString()));

// Test other IDs
console.log('Testing User ID 1:', superAdminIds.includes('1'));
console.log('Testing User ID 2:', superAdminIds.includes('2'));
console.log('Testing Telegram ID 123456:', superAdminTelegramIds.includes('123456'));

console.log('\n=== Test Complete ===');
console.log('✅ User ID 3 should have admin access');
console.log('✅ Telegram ID 923481567 should have admin access');
console.log('❌ Other IDs should NOT have admin access');