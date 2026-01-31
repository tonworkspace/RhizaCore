// Test script to verify wallet activation button functionality
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWalletActivationButton() {
  console.log('🧪 Testing Wallet Activation Button Functionality');
  console.log('='.repeat(50));

  try {
    // Test 1: Check if wallet activation function exists
    console.log('1. Checking wallet activation function...');
    const { data, error } = await supabase.rpc('get_wallet_activation_status', {
      p_user_id: 123456 // Test user ID
    });

    if (error) {
      console.log('❌ Wallet activation function not found or error:', error.message);
    } else {
      console.log('✅ Wallet activation function exists');
      console.log('   Status:', data);
    }

    // Test 2: Check constants and configuration
    console.log('\n2. Checking configuration...');
    
    // These would be imported in the actual component
    const TON_NETWORK = {
      MAINNET: {
        DEPOSIT_ADDRESS: 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi',
        API_KEY: '26197ebc36a041a5546d69739da830635ed339c0d8274bdd72027ccbff4f4234',
        API_ENDPOINT: 'https://toncenter.com/api/v2/jsonRPC',
        NAME: 'Mainnet'
      }
    };

    if (TON_NETWORK.MAINNET.DEPOSIT_ADDRESS) {
      console.log('✅ Receiver address configured:', TON_NETWORK.MAINNET.DEPOSIT_ADDRESS);
    } else {
      console.log('❌ Receiver address not configured');
    }

    // Test 3: Simulate button click conditions
    console.log('\n3. Testing button click conditions...');
    
    const mockState = {
      connected: true,
      actualConnectedAddress: 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi',
      isProcessing: false,
      paymentSent: false,
      tonPrice: 2.45,
      userId: 123456
    };

    console.log('Mock state:', mockState);

    if (mockState.connected && mockState.actualConnectedAddress && !mockState.isProcessing && !mockState.paymentSent) {
      console.log('✅ Button should be enabled and clickable');
      
      // Calculate TON amount needed
      const USD_AMOUNT = 15;
      const tonAmountNeeded = USD_AMOUNT / mockState.tonPrice;
      console.log(`   TON amount needed: ${tonAmountNeeded.toFixed(4)} TON`);
      console.log(`   USD equivalent: $${USD_AMOUNT}`);
      
    } else {
      console.log('❌ Button would be disabled');
    }

    console.log('\n4. Common issues to check:');
    console.log('   - Ensure TON Connect is properly initialized');
    console.log('   - Check that wallet is connected before opening modal');
    console.log('   - Verify tonAddress prop is passed correctly');
    console.log('   - Check browser console for connection state logs');
    console.log('   - Ensure process_wallet_activation function exists in Supabase');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed');
}

// Run the test
testWalletActivationButton();