export interface RewardTier {
  id: number;
  minUsers: number;
  maxUsers: number;
  reward: number; // USDT amount
  claimed?: boolean;
}

export const REWARD_TIERS: RewardTier[] = [
  { id: 1, minUsers: 50, maxUsers: 99, reward: 50 },
  { id: 2, minUsers: 100, maxUsers: 199, reward: 100 },
  { id: 3, minUsers: 200, maxUsers: 299, reward: 200 },
  { id: 4, minUsers: 300, maxUsers: 399, reward: 300 },
  { id: 5, minUsers: 400, maxUsers: 400, reward: 450 },
];

export const getRewardTierForActiveReferrals = (activeReferrals: number) => {
  return REWARD_TIERS.find(
    (tier) =>
      activeReferrals >= tier.minUsers && activeReferrals <= tier.maxUsers
  );
};

export const getPotentialUsdtFromActiveReferrals = (activeReferrals: number) => {
  const tier = getRewardTierForActiveReferrals(activeReferrals);
  return tier?.reward ?? 0;
};

