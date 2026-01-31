/**
 * Test script for RZC Claim Security System
 * 
 * This script tests the anti-manipulation security measures implemented
 * for the RZC claiming system to ensure users cannot double claim or
 * manipulate the claiming process.
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://qaviehvidwbntwrecyky.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test user ID (use a test user)
const TEST_USER_ID = 1;

/**
 * Test 1: Verify claim operation locks prevent concurrent claims
 */
async function testConcurrentClaimPrevention() {
  console.log('\n🔒 Testing Concurrent Claim Prevention...');
  
  try {
    // Import the security service
    const ClaimSecurityService = (await import('./src/services/ClaimSecurityService.js')).default;
    const securityService = ClaimSecurityService.getInstance();

    // Try to acquire multiple locks simultaneously
    const lock1Promise = securityService.acquireClaimLock(TEST_USER_ID, 'test_claim_1');
    const lock2Promise = securityService.acquireClaimLock(TEST_USER_ID, 'test_claim_2');

    const [lock1Result, lock2Result] = await Promise.all([lock1Promise, lock2Promise]);

    console.log('Lock 1 result:', lock1Result);
    console.log('Lock 2 result:', lock2Result);

    // One should succeed, one should fail
    const successCount = [lock1Result, lock2Result].filter(r => r.isValid).length;
    const failCount = [lock1Result, lock2Result].filter(r => !r.isValid).length;

    if (successCount === 1 && failCount === 1) {
      console.log('✅ Concurrent claim prevention working correctly');
      
      // Release the successful lock
      if (lock1Result.isValid) {
        securityService.releaseClaimLock(TEST_USER_ID, lock1Result.lockId);
      }
      if (lock2Result.isValid) {
        securityService.releaseClaimLock(TEST_USER_ID, lock2Result.lockId);
      }
      
      return true;
    } else {
      console.log('❌ Concurrent claim prevention failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing concurrent claim prevention:', error);
    return false;
  }
}

/**
 * Test 2: Verify transaction idempotency prevents duplicate claims
 */
async function testTransactionIdempotency() {
  console.log('\n🔄 Testing Transaction Idempotency...');
  
  try {
    const ClaimSecurityService = (await import('./src/services/ClaimSecurityService.js')).default;
    const securityService = ClaimSecurityService.getInstance();

    // Generate a transaction ID
    const transactionId = securityService.generateTransactionId(TEST_USER_ID, 'test_claim', 10.5);
    console.log('Generated transaction ID:', transactionId);

    // First check should return false (not duplicate)
    const firstCheck = await securityService.checkTransactionIdempotency(transactionId);
    console.log('First idempotency check:', firstCheck);

    // Insert a test activity with this transaction ID
    const { error: insertError } = await supabase
      .from('activities')
      .insert({
        user_id: TEST_USER_ID,
        type: 'test_claim',
        amount: 10.5,
        status: 'completed',
        transaction_id: transactionId,
        security_validated: true,
        metadata: { test: true },
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting test activity:', insertError);
      return false;
    }

    // Second check should return true (is duplicate)
    const secondCheck = await securityService.checkTransactionIdempotency(transactionId);
    console.log('Second idempotency check:', secondCheck);

    // Clean up test data
    await supabase
      .from('activities')
      .delete()
      .eq('transaction_id', transactionId);

    if (!firstCheck && secondCheck) {
      console.log('✅ Transaction idempotency working correctly');
      return true;
    } else {
      console.log('❌ Transaction idempotency failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing transaction idempotency:', error);
    return false;
  }
}

/**
 * Test 3: Verify rate limiting blocks rapid claims
 */
async function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...');
  
  try {
    const ClaimSecurityService = (await import('./src/services/ClaimSecurityService.js')).default;
    const securityService = ClaimSecurityService.getInstance();

    // Record multiple rapid claim attempts
    for (let i = 0; i < 5; i++) {
      securityService.recordClaimAttempt(TEST_USER_ID, 5.0, 'test_rapid_claim', true);
    }

    // Try to acquire a lock after rapid attempts
    const lockResult = await securityService.acquireClaimLock(TEST_USER_ID, 'rate_limit_test');
    console.log('Lock result after rapid attempts:', lockResult);

    if (!lockResult.isValid && lockResult.error?.includes('rate limit')) {
      console.log('✅ Rate limiting working correctly');
      return true;
    } else {
      console.log('❌ Rate limiting failed - should have blocked the request');
      
      // Clean up if lock was acquired
      if (lockResult.isValid) {
        securityService.releaseClaimLock(TEST_USER_ID, lockResult.lockId);
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing rate limiting:', error);
    return false;
  }
}

/**
 * Test 4: Verify balance validation prevents manipulation
 */
async function testBalanceValidation() {
  console.log('\n💰 Testing Balance Validation...');
  
  try {
    const ClaimSecurityService = (await import('./src/services/ClaimSecurityService.js')).default;
    const securityService = ClaimSecurityService.getInstance();

    // Test with invalid balance (claiming more than available)
    const invalidBalance = {
      claimable: 5.0,
      accumulated: 2.0,
      claimed: 10.0
    };

    const validationResult = await securityService.validateClaimOperation(
      TEST_USER_ID,
      20.0, // Claiming more than available (5.0 + 2.0 = 7.0)
      'test_balance_validation',
      invalidBalance
    );

    console.log('Balance validation result:', validationResult);

    if (!validationResult.isValid && validationResult.error?.includes('Insufficient balance')) {
      console.log('✅ Balance validation working correctly');
      return true;
    } else {
      console.log('❌ Balance validation failed - should have rejected invalid claim');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing balance validation:', error);
    return false;
  }
}

/**
 * Test 5: Verify audit logging captures all operations
 */
async function testAuditLogging() {
  console.log('\n📝 Testing Audit Logging...');
  
  try {
    const ClaimSecurityService = (await import('./src/services/ClaimSecurityService.js')).default;
    const securityService = ClaimSecurityService.getInstance();

    const transactionId = securityService.generateTransactionId(TEST_USER_ID, 'audit_test', 15.0);

    // Log a test claim audit
    await securityService.logClaimAudit(
      TEST_USER_ID,
      'audit_test',
      15.0,
      transactionId,
      true,
      { test: true, timestamp: new Date().toISOString() }
    );

    // Verify the audit log was created
    const { data: auditLogs, error: auditError } = await supabase
      .from('claim_audit_log')
      .select('*')
      .eq('transaction_id', transactionId)
      .limit(1);

    if (auditError) {
      console.error('Error querying audit logs:', auditError);
      return false;
    }

    console.log('Audit log entry:', auditLogs?.[0]);

    // Clean up test data
    if (auditLogs?.[0]) {
      await supabase
        .from('claim_audit_log')
        .delete()
        .eq('id', auditLogs[0].id);
    }

    if (auditLogs && auditLogs.length > 0) {
      console.log('✅ Audit logging working correctly');
      return true;
    } else {
      console.log('❌ Audit logging failed - no log entry found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing audit logging:', error);
    return false;
  }
}

/**
 * Run all security tests
 */
async function runSecurityTests() {
  console.log('🚀 Starting RZC Claim Security Tests...');
  console.log('=====================================');

  const tests = [
    { name: 'Concurrent Claim Prevention', fn: testConcurrentClaimPrevention },
    { name: 'Transaction Idempotency', fn: testTransactionIdempotency },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Balance Validation', fn: testBalanceValidation },
    { name: 'Audit Logging', fn: testAuditLogging }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`Error running test ${test.name}:`, error);
      results.push({ name: test.name, passed: false });
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  let passedCount = 0;
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name}`);
    if (result.passed) passedCount++;
  });

  console.log(`\n🎯 Overall: ${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('🎉 All security tests passed! The anti-manipulation measures are working correctly.');
  } else {
    console.log('⚠️ Some security tests failed. Please review the implementation.');
  }

  return passedCount === results.length;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error running security tests:', error);
      process.exit(1);
    });
}

export { runSecurityTests };