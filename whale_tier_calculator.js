// Whale Tier Profitability Calculator
// This script calculates exact returns for different stake amounts and whale tiers

// Current system constants
const BASE_DAILY_ROI = 0.01; // 1% base daily rate
const STANDARD_TIME_MULTIPLIER = 1.25; // For 31+ days
const REFERRAL_BOOST_MAX = 1.5; // 50% maximum boost

// Enhanced whale tier configurations
const WHALE_TIERS = {
  STANDARD: {
    name: 'Standard',
    minStake: 0,
    dailyROI: BASE_DAILY_ROI,
    timeMultiplier: STANDARD_TIME_MULTIPLIER,
    weeklyBonus: 0,
    description: 'Regular users'
  },
  LEGENDARY: {
    name: 'Legendary',
    minStake: 20000,
    dailyROI: BASE_DAILY_ROI,
    timeMultiplier: STANDARD_TIME_MULTIPLIER,
    weeklyBonus: 200,
    description: 'Existing whale tier'
  },
  SUPERNOVA: {
    name: 'Supernova',
    minStake: 50000,
    dailyROI: BASE_DAILY_ROI,
    timeMultiplier: STANDARD_TIME_MULTIPLIER,
    weeklyBonus: 200,
    description: 'Existing whale tier'
  },
  MEGA_WHALE: {
    name: 'Mega Whale',
    minStake: 100000,
    dailyROI: 0.015, // 1.5% daily
    timeMultiplier: 1.5,
    weeklyBonus: 500,
    description: 'New enhanced tier'
  },
  COLOSSAL_WHALE: {
    name: 'Colossal Whale',
    minStake: 250000,
    dailyROI: 0.0175, // 1.75% daily
    timeMultiplier: 1.75,
    weeklyBonus: 1000,
    description: 'Premium whale tier'
  },
  COSMIC_WHALE: {
    name: 'Cosmic Whale',
    minStake: 500000,
    dailyROI: 0.02, // 2.0% daily
    timeMultiplier: 2.0,
    weeklyBonus: 2500,
    description: 'Ultimate whale tier'
  }
};

// Calculate time multiplier progression for 135 days
function getTimeMultiplier(daysStaked) {
  if (daysStaked <= 7) return 1.0;   // Days 1-7: 1.0x
  if (daysStaked <= 30) return 1.1;  // Days 8-30: 1.1x
  return 1.25; // Days 31+: 1.25x (standard max)
}

// Calculate total returns over 135 days
function calculateReturns(stakeAmount, tier, referralCount = 0) {
  const tierConfig = WHALE_TIERS[tier];
  if (!tierConfig) throw new Error(`Invalid tier: ${tier}`);
  
  let totalEarnings = 0;
  const referralBoost = Math.min(1 + (referralCount * 0.05), REFERRAL_BOOST_MAX);
  
  // Calculate earnings for each day up to 135 days
  for (let day = 1; day <= 135; day++) {
    let timeMultiplier;
    let dailyROI;
    
    if (tier === 'MEGA_WHALE' || tier === 'COLOSSAL_WHALE' || tier === 'COSMIC_WHALE') {
      // Whale tiers use enhanced multipliers
      timeMultiplier = tierConfig.timeMultiplier;
      dailyROI = tierConfig.dailyROI;
    } else {
      // Standard tiers use progressive multipliers
      timeMultiplier = getTimeMultiplier(day);
      dailyROI = tierConfig.dailyROI;
    }
    
    const dailyEarnings = stakeAmount * dailyROI * timeMultiplier * referralBoost;
    totalEarnings += dailyEarnings;
  }
  
  // Calculate weekly bonuses (135 days = ~19.3 weeks)
  const weeklyBonuses = (135 / 7) * tierConfig.weeklyBonus;
  
  const totalReturn = totalEarnings + weeklyBonuses;
  const totalValue = stakeAmount + totalReturn;
  const percentageReturn = (totalReturn / stakeAmount) * 100;
  
  return {
    stakeAmount,
    tier: tierConfig.name,
    totalEarnings,
    weeklyBonuses,
    totalReturn,
    totalValue,
    percentageReturn,
    dailyAverage: totalReturn / 135,
    monthlyAverage: totalReturn / 4.5 // 135 days = 4.5 months
  };
}

// Generate comprehensive report
function generateReport() {
  console.log('🐋 WHALE TIER PROFITABILITY ANALYSIS');
  console.log('=====================================\n');
  
  const stakeAmounts = [1000, 10000, 50000, 100000, 250000, 500000];
  const tiers = Object.keys(WHALE_TIERS);
  
  stakeAmounts.forEach(amount => {
    console.log(`\n💰 STAKE AMOUNT: ${amount.toLocaleString()} TON`);
    console.log('─'.repeat(50));
    
    tiers.forEach(tier => {
      if (amount >= WHALE_TIERS[tier].minStake) {
        const result = calculateReturns(amount, tier);
        console.log(`${result.tier.padEnd(15)} | ${result.percentageReturn.toFixed(1)}% return | ${result.totalValue.toLocaleString()} TON total | ${result.dailyAverage.toFixed(1)} TON/day`);
      }
    });
  });
  
  console.log('\n📊 DETAILED 135-DAY BREAKDOWN');
  console.log('=============================\n');
  
  // Detailed analysis for 100,000 TON stake
  const megaWhaleResult = calculateReturns(100000, 'MEGA_WHALE');
  console.log(`MEGA WHALE (100,000 TON stake):`);
  console.log(`• Initial Stake: ${megaWhaleResult.stakeAmount.toLocaleString()} TON`);
  console.log(`• Total Earnings: ${megaWhaleResult.totalEarnings.toLocaleString()} TON`);
  console.log(`• Weekly Bonuses: ${megaWhaleResult.weeklyBonuses.toLocaleString()} TON`);
  console.log(`• Total Return: ${megaWhaleResult.totalReturn.toLocaleString()} TON`);
  console.log(`• Final Value: ${megaWhaleResult.totalValue.toLocaleString()} TON`);
  console.log(`• Return Percentage: ${megaWhaleResult.percentageReturn.toFixed(2)}%`);
  console.log(`• Daily Average: ${megaWhaleResult.dailyAverage.toFixed(2)} TON/day`);
  console.log(`• Monthly Average: ${megaWhaleResult.monthlyAverage.toLocaleString()} TON/month\n`);
  
  // Comparison with standard tier
  const standardResult = calculateReturns(100000, 'STANDARD');
  console.log(`STANDARD (100,000 TON stake):`);
  console.log(`• Final Value: ${standardResult.totalValue.toLocaleString()} TON`);
  console.log(`• Return Percentage: ${standardResult.percentageReturn.toFixed(2)}%\n`);
  
  const improvement = megaWhaleResult.percentageReturn - standardResult.percentageReturn;
  console.log(`🚀 MEGA WHALE ADVANTAGE: +${improvement.toFixed(2)}% better returns!\n`);
  
  // ROI comparison table
  console.log('📈 ROI COMPARISON TABLE');
  console.log('=======================');
  console.log('Tier'.padEnd(15) + 'Daily ROI'.padEnd(12) + 'Annual ROI'.padEnd(12) + '135-Day ROI');
  console.log('─'.repeat(60));
  
  Object.values(WHALE_TIERS).forEach(tier => {
    if (tier.minStake <= 100000) {
      const result = calculateReturns(100000, Object.keys(WHALE_TIERS).find(key => WHALE_TIERS[key] === tier));
      const dailyROI = (tier.dailyROI * tier.timeMultiplier * 100).toFixed(2);
      const annualROI = (dailyROI * 365).toFixed(0);
      
      console.log(
        tier.name.padEnd(15) + 
        `${dailyROI}%`.padEnd(12) + 
        `${annualROI}%`.padEnd(12) + 
        `${result.percentageReturn.toFixed(1)}%`
      );
    }
  });
}

// Run the analysis
generateReport();

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WHALE_TIERS,
    calculateReturns,
    generateReport
  };
}
