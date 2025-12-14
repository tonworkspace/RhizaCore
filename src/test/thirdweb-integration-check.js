/**
 * Thirdweb Authentication Integration Check
 *
 * This script verifies that the thirdweb authentication integration
 * has been properly implemented in the RhizaCore application.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting Thirdweb Authentication Integration Check...\\n');

let allChecksPassed = true;

// Check 1: Verify ThirdwebAuthContext exists
try {
  const contextPath = path.join(__dirname, '../contexts/ThirdwebAuthContext.tsx');
  if (fs.existsSync(contextPath)) {
    console.log('✅ ThirdwebAuthContext.tsx exists');
  } else {
    console.log('❌ ThirdwebAuthContext.tsx is missing');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('❌ Error checking ThirdwebAuthContext:', error.message);
  allChecksPassed = false;
}

// Check 2: Verify AuthPage exists
try {
  const authPagePath = path.join(__dirname, '../pages/AuthPage.tsx');
  if (fs.existsSync(authPagePath)) {
    console.log('✅ AuthPage.tsx exists');
  } else {
    console.log('❌ AuthPage.tsx is missing');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('❌ Error checking AuthPage:', error.message);
  allChecksPassed = false;
}

// Check 3: Verify AuthOptions component exists
try {
  const authOptionsPath = path.join(__dirname, '../components/AuthOptions.tsx');
  if (fs.existsSync(authOptionsPath)) {
    console.log('✅ AuthOptions.tsx exists');
  } else {
    console.log('❌ AuthOptions.tsx is missing');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('❌ Error checking AuthOptions:', error.message);
  allChecksPassed = false;
}

// Check 4: Verify WalletOnboarding has been updated
try {
  const walletOnboardingPath = path.join(__dirname, '../components/WalletOnboarding.tsx');
  if (fs.existsSync(walletOnboardingPath)) {
    const content = fs.readFileSync(walletOnboardingPath, 'utf8');
    if (content.includes('useThirdwebAuth') || content.includes('ThirdwebAuthProvider')) {
      console.log('✅ WalletOnboarding.tsx has been updated with thirdweb auth');
    } else {
      console.log('❌ WalletOnboarding.tsx is missing thirdweb auth integration');
      allChecksPassed = false;
    }
  } else {
    console.log('❌ WalletOnboarding.tsx is missing');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('❌ Error checking WalletOnboarding:', error.message);
  allChecksPassed = false;
}

// Check 5: Verify Root component has ThirdwebAuthProvider
try {
  const rootPath = path.join(__dirname, '../components/Root.tsx');
  if (fs.existsSync(rootPath)) {
    const content = fs.readFileSync(rootPath, 'utf8');
    if (content.includes('ThirdwebAuthProvider')) {
      console.log('✅ Root.tsx has ThirdwebAuthProvider integration');
    } else {
      console.log('❌ Root.tsx is missing ThirdwebAuthProvider integration');
      allChecksPassed = false;
    }
  } else {
    console.log('❌ Root.tsx is missing');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('❌ Error checking Root:', error.message);
  allChecksPassed = false;
}

// Check 6: Verify routes include auth page
try {
  const routesPath = path.join(__dirname, '../navigation/routes.tsx');
  if (fs.existsSync(routesPath)) {
    const content = fs.readFileSync(routesPath, 'utf8');
    if (content.includes("path: '/auth'") && content.includes('AuthPage')) {
      console.log('✅ routes.tsx includes auth page route');
    } else {
      console.log('❌ routes.tsx is missing auth page route');
      allChecksPassed = false;
    }
  } else {
    console.log('❌ routes.tsx is missing');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('❌ Error checking routes:', error.message);
  allChecksPassed = false;
}

// Check 7: Verify package.json has thirdweb dependency
try {
  const packagePath = path.join(__dirname, '../../package.json');
  if (fs.existsSync(packagePath)) {
    const content = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(content);
    if (packageJson.dependencies && packageJson.dependencies.thirdweb) {
      console.log('✅ package.json has thirdweb dependency');
    } else {
      console.log('❌ package.json is missing thirdweb dependency');
      allChecksPassed = false;
    }
  } else {
    console.log('❌ package.json is missing');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('❌ Error checking package.json:', error.message);
  allChecksPassed = false;
}

// Final summary
console.log('\\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('🎉 All Thirdweb Authentication Integration checks passed!');
  console.log('✅ The thirdweb authentication system has been successfully integrated.');
} else {
  console.log('⚠️  Some checks failed. Please review the issues above.');
  console.log('❌ The thirdweb authentication integration may not be complete.');
}
console.log('='.repeat(50));

process.exit(allChecksPassed ? 0 : 1);