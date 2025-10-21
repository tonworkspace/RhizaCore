// TAPPs Mining Earnings Calculator Test
// This shows what the realistic earnings should be with the new sustainable system

console.log("=== TAPPs Mining Earnings Calculator ===\n");

// Test with 1 TON stake
const stakeAmount = 10; // TON
const baseROI = 0.01; // 1% daily
const timeMultiplier = 1.0; // Day 1-7
const referralBoost = 1.0; // No referrals

// Calculate daily earnings
const dailyEarnings = stakeAmount * baseROI * timeMultiplier * referralBoost;
const perSecondRate = dailyEarnings / 86400; // 86400 seconds in a day

console.log(`Stake Amount: ${stakeAmount} TON`);
console.log(`Base ROI: ${baseROI * 100}% daily`);
console.log(`Time Multiplier: ${timeMultiplier}x`);
console.log(`Referral Boost: ${referralBoost}x`);
console.log(`\nDaily Earnings: ${dailyEarnings.toFixed(6)} TON`);
console.log(`Per Second Rate: ${perSecondRate.toFixed(10)} TON`);

// Test different time periods
console.log("\n=== Earnings Over Time ===");
console.log(`1 hour: ${(perSecondRate * 3600).toFixed(8)} TON`);
console.log(`1 day: ${(perSecondRate * 86400).toFixed(6)} TON`);
console.log(`1 week: ${(perSecondRate * 86400 * 7).toFixed(6)} TON`);
console.log(`1 month: ${(perSecondRate * 86400 * 30).toFixed(6)} TON`);

// Test with time multiplier (Day 31+)
const timeMultiplierMax = 1.25; // Day 31+
const dailyEarningsMax = stakeAmount * baseROI * timeMultiplierMax * referralBoost;
const perSecondRateMax = dailyEarningsMax / 86400;

console.log("\n=== With Maximum Time Multiplier (Day 31+) ===");
console.log(`Daily Earnings: ${dailyEarningsMax.toFixed(6)} TON`);
console.log(`Per Second Rate: ${perSecondRateMax.toFixed(10)} TON`);
console.log(`1 hour: ${(perSecondRateMax * 3600).toFixed(8)} TON`);
console.log(`1 day: ${(perSecondRateMax * 86400).toFixed(6)} TON`);

// Test with referrals
const referralCount = 5; // 5 referrals
const referralBoostWithRefs = 1 + (referralCount * 0.05); // 1.25x boost
const dailyEarningsWithRefs = stakeAmount * baseROI * timeMultiplierMax * referralBoostWithRefs;
const perSecondRateWithRefs = dailyEarningsWithRefs / 86400;

console.log("\n=== With Maximum Multipliers (Day 31+ + 5 Referrals) ===");
console.log(`Referral Boost: ${referralBoostWithRefs}x`);
console.log(`Daily Earnings: ${dailyEarningsWithRefs.toFixed(6)} TON`);
console.log(`Per Second Rate: ${perSecondRateWithRefs.toFixed(10)} TON`);
console.log(`1 hour: ${(perSecondRateWithRefs * 3600).toFixed(8)} TON`);
console.log(`1 day: ${(perSecondRateWithRefs * 86400).toFixed(6)} TON`);

// Check if $43 reward is realistic
console.log("\n=== Reality Check ===");
console.log(`If TON price is $5, then:`);
console.log(`1 TON = $5`);
console.log(`Daily earnings (1%): $${(dailyEarnings * 5).toFixed(2)}`);
console.log(`Hourly earnings: $${(perSecondRate * 3600 * 5).toFixed(4)}`);
console.log(`\n$43 reward would require:`);
console.log(`- ${(43 / (dailyEarnings * 5)).toFixed(1)} days of mining`);
console.log(`- OR ${(43 / (perSecondRate * 3600 * 5)).toFixed(1)} hours of mining`);
console.log(`\nThis suggests the $43 reward is from OLD SYSTEM (10% daily) or cached data!`);

console.log("\n=== Expected Realistic Rewards ===");
console.log(`For 1 TON staked:`);
console.log(`- Hourly: $${(perSecondRate * 3600 * 5).toFixed(4)}`);
console.log(`- Daily: $${(dailyEarnings * 5).toFixed(2)}`);
console.log(`- Weekly: $${(dailyEarnings * 7 * 5).toFixed(2)}`);
console.log(`- Monthly: $${(dailyEarnings * 30 * 5).toFixed(2)}`);
