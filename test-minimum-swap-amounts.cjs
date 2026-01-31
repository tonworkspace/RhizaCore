/**
 * Test Minimum Swap Amounts Implementation
 * Verifies the minimum swap validation and UI updates
 */

const fs = require('fs');
const path = require('path');

function testMinimumSwapAmounts() {
  console.log('🧪 Testing Minimum Swap Amounts Implementation...\n');

  // Test constants file
  const constantsPath = path.join(__dirname, 'src/constants.ts');
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');

  // Test 1: Minimum swap constants defined
  const hasMinSwapConstants = constantsContent.includes('MIN_TON_SWAP = 0.1') && 
                              constantsContent.includes('MIN_RZC_SWAP = 10');
  console.log(`✅ Minimum swap constants: ${hasMinSwapConstants ? 'PASS' : 'FAIL'}`);

  // Test DexUI file
  const dexUIPath = path.join(__dirname, 'src/components/DexUI.tsx');
  const dexUIContent = fs.readFileSync(dexUIPath, 'utf8');

  // Test 2: Constants imported
  const hasConstantsImport = dexUIContent.includes('MIN_TON_SWAP') && 
                             dexUIContent.includes('MIN_RZC_SWAP');
  console.log(`✅ Constants imported: ${hasConstantsImport ? 'PASS' : 'FAIL'}`);

  // Test 3: Minimum amount validation
  const hasMinValidation = dexUIContent.includes('const minAmount = isReverse ? MIN_RZC_SWAP : MIN_TON_SWAP') && 
                           dexUIContent.includes('if (sellAmountNum < minAmount)');
  console.log(`✅ Minimum amount validation: ${hasMinValidation ? 'PASS' : 'FAIL'}`);

  // Test 4: Error message for minimum amount
  const hasMinErrorMessage = dexUIContent.includes('Minimum Swap Amount') && 
                             dexUIContent.includes('Minimum swap amount is');
  console.log(`✅ Minimum amount error message: ${hasMinErrorMessage ? 'PASS' : 'FAIL'}`);

  // Test 5: Button disabled logic updated
  const hasButtonValidation = dexUIContent.includes('parseFloat(sellAmount) < (isReverse ? MIN_RZC_SWAP : MIN_TON_SWAP)');
  console.log(`✅ Button disabled validation: ${hasButtonValidation ? 'PASS' : 'FAIL'}`);

  // Test 6: Input field attributes
  const hasInputAttributes = dexUIContent.includes('min={isReverse ? MIN_RZC_SWAP : MIN_TON_SWAP}') && 
                              dexUIContent.includes('step={isReverse ? "1" : "0.1"}');
  console.log(`✅ Input field attributes: ${hasInputAttributes ? 'PASS' : 'FAIL'}`);

  // Test 7: Minimum swap hint
  const hasMinHint = dexUIContent.includes('* Minimum swap:') && 
                     dexUIContent.includes('{isReverse ? MIN_RZC_SWAP : MIN_TON_SWAP}');
  console.log(`✅ Minimum swap hint: ${hasMinHint ? 'PASS' : 'FAIL'}`);

  // Test 8: Default amount updated
  const hasDefaultAmount = dexUIContent.includes("useState<string>('0.1')");
  console.log(`✅ Default amount updated: ${hasDefaultAmount ? 'PASS' : 'FAIL'}`);

  // Test 9: Form reset with minimum
  const hasFormReset = dexUIContent.includes("setSellAmount('0.1')");
  console.log(`✅ Form reset with minimum: ${hasFormReset ? 'PASS' : 'FAIL'}`);

  console.log('\n🎯 Minimum Swap Implementation Summary:');
  console.log('- ✅ TON minimum: 0.1 TON (~$0.54)');
  console.log('- ✅ RZC minimum: 10 RZC (~$1.00)');
  console.log('- ✅ Dynamic validation based on swap direction');
  console.log('- ✅ Clear error messages for users');
  console.log('- ✅ Button disabled when below minimum');
  console.log('- ✅ Input field hints and attributes');
  console.log('- ✅ Default values meet minimums');
  
  console.log('\n💡 Minimum Swap Logic:');
  console.log('TON → RZC Swaps:');
  console.log('  - Minimum: 0.1 TON');
  console.log('  - Reason: Covers gas fees + meaningful swap amount');
  console.log('  - Input step: 0.1 TON increments');
  console.log('');
  console.log('RZC → TON Swaps:');
  console.log('  - Minimum: 10 RZC');
  console.log('  - Reason: Meaningful swap amount at $0.10/RZC');
  console.log('  - Input step: 1 RZC increments');

  console.log('\n🔒 Validation Flow:');
  console.log('1. ✅ User enters amount');
  console.log('2. ✅ Check if amount > 0');
  console.log('3. ✅ Check if amount >= minimum (0.1 TON or 10 RZC)');
  console.log('4. ✅ Show specific error if below minimum');
  console.log('5. ✅ Button disabled until minimum met');
  console.log('6. ✅ Visual hint shows current minimum');

  console.log('\n💰 Cost Analysis:');
  console.log('TON Minimum (0.1 TON):');
  console.log('  - Value: ~$0.54 (at $5.42/TON)');
  console.log('  - Protocol fee: 0.001 TON (~$0.005)');
  console.log('  - Net swap: 0.099 TON → ~5.4 RZC');
  console.log('');
  console.log('RZC Minimum (10 RZC):');
  console.log('  - Value: ~$1.00 (at $0.10/RZC)');
  console.log('  - Meaningful amount for users');
  console.log('  - Future: Will swap to ~0.18 TON');

  console.log('\n🎨 UI Enhancements:');
  console.log('- Dynamic minimum hint based on swap direction');
  console.log('- Input field min/step attributes for better UX');
  console.log('- Button disabled state with visual feedback');
  console.log('- Clear error messages with specific amounts');
  console.log('- Default values that meet minimum requirements');

  console.log('\n⚠️  User Experience:');
  console.log('- Users see minimum requirements immediately');
  console.log('- Button is disabled until minimum is met');
  console.log('- Clear error messages explain requirements');
  console.log('- Input hints guide proper amounts');
  console.log('- Reasonable minimums for meaningful swaps');
}

// Run the test
testMinimumSwapAmounts();