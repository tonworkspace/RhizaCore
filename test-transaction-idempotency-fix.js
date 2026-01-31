/**
 * Test script to verify the transaction idempotency fix
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://qaviehvidwbntwrecyky.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTransactionIdempotency() {
  console.log('🧪 Testing Transaction Idempotency Fix...');
  
  try {
    // Test 1: Check if transaction_id column exists
    console.log('\n1. Testing transaction_id column existence...');
    
    const testTransactionId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to insert a test activity with transaction_id
    const { data: insertData, error: insertError } = await supabase
      .from('activities')
      .insert({
        user_id: 1, // Test user
        type: 'test_transaction_id',
        amount: 0,
        status: 'completed',
        transaction_id: testTransactionId,
        security_validated: true,
        metadata: { test: true },
        created_at: new Date().toISOString()
      })
      .select('id, transaction_id');

    if (insertError) {
      console.error('❌ Error inserting test activity:', insertError);
      
      if (insertError.code === '42703') {
        console.log('💡 The transaction_id column does not exist. Please run the database migration:');
        console.log('   Run: create_claim_security_tables.sql');
        return false;
      }
      
      return false;
    }

    console.log('✅ Successfully inserted test activity with transaction_id');

    // Test 2: Check idempotency query
    console.log('\n2. Testing idempotency query...');
    
    const { data: queryData, error: queryError } = await supabase
      .from('activities')
      .select('id')
      .eq('transaction_id', testTransactionId)
      .limit(1);

    if (queryError) {
      console.error('❌ Error querying transaction_id:', queryError);
      return false;
    }

    if (queryData && queryData.length > 0) {
      console.log('✅ Successfully queried transaction_id - idempotency check working');
    } else {
      console.log('❌ Query returned no results - something is wrong');
      return false;
    }

    // Test 3: Test duplicate prevention
    console.log('\n3. Testing duplicate prevention...');
    
    const { data: duplicateData, error: duplicateError } = await supabase
      .from('activities')
      .insert({
        user_id: 1,
        type: 'test_duplicate',
        amount: 0,
        status: 'completed',
        transaction_id: testTransactionId, // Same transaction ID
        security_validated: true,
        metadata: { test: true },
        created_at: new Date().toISOString()
      });

    if (duplicateError) {
      if (duplicateError.code === '23505') { // Unique constraint violation
        console.log('✅ Duplicate transaction_id properly rejected - unique constraint working');
      } else {
        console.error('❌ Unexpected error on duplicate:', duplicateError);
        return false;
      }
    } else {
      console.log('❌ Duplicate transaction_id was allowed - unique constraint not working');
      return false;
    }

    // Clean up test data
    console.log('\n4. Cleaning up test data...');
    await supabase
      .from('activities')
      .delete()
      .eq('transaction_id', testTransactionId);

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All transaction idempotency tests passed!');
    console.log('✅ The JSON query syntax error has been fixed');
    console.log('✅ Transaction idempotency is working correctly');
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    return false;
  }
}

// Run the test
testTransactionIdempotency()
  .then(success => {
    if (success) {
      console.log('\n🎯 Transaction idempotency fix verified successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Transaction idempotency fix needs attention.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });