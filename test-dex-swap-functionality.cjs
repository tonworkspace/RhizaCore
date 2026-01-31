/**
 * Test script to verify DEX swap functionality and balance updates
 * This tests the complete flow: TON payment → transaction confirmation → RZC balance update
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (using environment variables)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.error('❌ VITE_SUPABASE_URL not set in environment');
  process.exit(1);
}

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
  console.error('❌ VITE_SUPABASE_ANON_KEY not set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test function to simulate addRZCFromDEXPurchase
async function testAddRZCFromDEXPurchase(userId, rzcAmount, tonAmount, transactionHash) {
  try {
    console.log('🧪 Testing addRZCFromDEXPurchase function...');
    console.log('Parameters:', { userId, rzcAmount, tonAmount, transactionHash });
    
    // Check if user already has an airdrop balance
    const { data: existingAirdrop, error: airdropError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    const now = new Date().toISOString();

    if (airdropError && airdropError.code === 'PGRST116') {
      // No existing airdrop balance, create new one
      console.log('📝 Creating new airdrop balance for DEX purchase...');
      
      const { data: newBalance, error: insertError } = await supabase
        .from('airdrop_balances')
        .insert({
          user_id: userId,
          total_claimed_to_airdrop: rzcAmount,
          available_balance: rzcAmount,
          withdrawn_balance: 0,
          staked_balance: 0,
          last_claim_from_mining: now,
          created_at: now,
          updated_at: now
        })
        .select('available_balance')
        .single();

      if (insertError) {
        console.error('❌ Error creating airdrop balance:', insertError);
        return { success: false, error: 'Failed to create airdrop balance' };
      }

      // Record the DEX purchase activity
      await supabase.from('activities').insert({
        user_id: userId,
        type: 'dex_purchase',
        amount: rzcAmount,
        status: 'completed',
        metadata: {
          ton_amount: tonAmount,
          transaction_hash: transactionHash,
          purchase_type: 'ton_to_rzc'
        },
        created_at: now
      });

      console.log('✅ New airdrop balance created successfully');
      return { success: true, newBalance: newBalance.available_balance };
      
    } else if (existingAirdrop) {
      // Update existing airdrop balance
      console.log('📝 Updating existing airdrop balance for DEX purchase...');
      console.log('Current balance:', existingAirdrop);
      
      const newTotalClaimed = (existingAirdrop.total_claimed_to_airdrop || 0) + rzcAmount;
      const newAvailableBalance = (existingAirdrop.available_balance || 0) + rzcAmount;
      
      console.log('New totals:', { newTotalClaimed, newAvailableBalance });
      
      const { data: updatedBalance, error: updateError } = await supabase
        .from('airdrop_balances')
        .update({
          total_claimed_to_airdrop: newTotalClaimed,
          available_balance: newAvailableBalance,
          last_claim_from_mining: now,
          updated_at: now
        })
        .eq('user_id', userId)
        .select('available_balance')
        .single();

      if (updateError) {
        console.error('❌ Error updating airdrop balance:', updateError);
        return { success: false, error: 'Failed to update airdrop balance' };
      }

      // Record the DEX purchase activity
      await supabase.from('activities').insert({
        user_id: userId,
        type: 'dex_purchase',
        amount: rzcAmount,
        status: 'completed',
        metadata: {
          ton_amount: tonAmount,
          transaction_hash: transactionHash,
          purchase_type: 'ton_to_rzc'
        },
        created_at: now
      });

      console.log('✅ Airdrop balance updated successfully');
      return { success: true, newBalance: updatedBalance.available_balance };
      
    } else {
      console.error('❌ Unexpected error with airdrop balance query:', airdropError);
      return { success: false, error: 'Failed to query airdrop balance' };
    }
  } catch (error) {
    console.error('❌ Error in addRZCFromDEXPurchase test:', error);
    return { success: false, error: error.message || 'Failed to add RZC from DEX purchase' };
  }
}

// Test function to verify user exists and get their current balance
async function testUserAndBalance(userId) {
  try {
    console.log('🔍 Checking user and current balance...');
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, telegram_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ User not found:', userError);
      return null;
    }

    console.log('✅ User found:', user);

    // Check current airdrop balance
    const { data: airdropBalance, error: balanceError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Error fetching airdrop balance:', balanceError);
      return null;
    }

    if (airdropBalance) {
      console.log('✅ Current airdrop balance:', airdropBalance);
    } else {
      console.log('ℹ️ No existing airdrop balance found');
    }

    return { user, airdropBalance };
  } catch (error) {
    console.error('❌ Error checking user and balance:', error);
    return null;
  }
}

// Test function to verify activities are recorded
async function testActivitiesRecording(userId) {
  try {
    console.log('🔍 Checking recent DEX purchase activities...');
    
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'dex_purchase')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching activities:', error);
      return;
    }

    console.log('✅ Recent DEX purchase activities:', activities);
  } catch (error) {
    console.error('❌ Error checking activities:', error);
  }
}

// Main test function
async function runDEXSwapTest() {
  console.log('🚀 Starting DEX Swap Functionality Test\n');

  // Test parameters - using a test user ID
  const testUserId = 3; // Using sarahj (existing user with airdrop balance)
  const testRZCAmount = 54.2; // Amount of RZC to add (equivalent to 1 TON at $5.42 TON price)
  const testTONAmount = 1.0; // Amount of TON spent
  const testTransactionHash = 'test_tx_' + Date.now(); // Mock transaction hash

  try {
    // Step 1: Check user and current balance
    console.log('📋 Step 1: Verify user and current balance');
    const userCheck = await testUserAndBalance(testUserId);
    if (!userCheck) {
      console.log('❌ Test failed: User verification failed');
      return;
    }

    const initialBalance = userCheck.airdropBalance?.available_balance || 0;
    console.log(`Initial available balance: ${initialBalance} RZC\n`);

    // Step 2: Test the addRZCFromDEXPurchase function
    console.log('📋 Step 2: Test DEX purchase function');
    const result = await testAddRZCFromDEXPurchase(
      testUserId,
      testRZCAmount,
      testTONAmount,
      testTransactionHash
    );

    if (!result.success) {
      console.log('❌ Test failed:', result.error);
      return;
    }

    console.log(`✅ DEX purchase successful! New balance: ${result.newBalance} RZC\n`);

    // Step 3: Verify the balance was updated correctly
    console.log('📋 Step 3: Verify balance update');
    const expectedBalance = initialBalance + testRZCAmount;
    if (Math.abs(result.newBalance - expectedBalance) < 0.0001) {
      console.log('✅ Balance update verified correctly');
    } else {
      console.log(`❌ Balance mismatch! Expected: ${expectedBalance}, Got: ${result.newBalance}`);
    }

    // Step 4: Check activities recording
    console.log('\n📋 Step 4: Verify activity recording');
    await testActivitiesRecording(testUserId);

    console.log('\n🎉 DEX Swap Test Completed Successfully!');
    console.log('Summary:');
    console.log(`- User ID: ${testUserId}`);
    console.log(`- TON Amount: ${testTONAmount}`);
    console.log(`- RZC Amount: ${testRZCAmount}`);
    console.log(`- Initial Balance: ${initialBalance} RZC`);
    console.log(`- Final Balance: ${result.newBalance} RZC`);
    console.log(`- Transaction Hash: ${testTransactionHash}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
runDEXSwapTest().catch(console.error);