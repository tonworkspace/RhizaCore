// Update script for supabaseClient.ts UUID compatibility
// This script contains the corrected function signatures for UUID compatibility

// Key changes needed:
// 1. Change User interface id from number to string
// 2. Change all userId parameters from number to string
// 3. Update sponsor_id from number to string
// 4. Update all related interfaces

// Updated interfaces:
export interface User {
  id: string; // Changed from number to string for UUID compatibility
  telegram_id: number;
  wallet_address: string | null;
  username?: string;
  created_at: string;
  balance: number;
  total_deposit: number;
  total_withdrawn: number;
  team_volume: number;
  rank: string;
  last_active: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  last_claim_time?: number;
  total_earned?: number;
  total_sbt?: number;
  is_active: boolean;
  reinvestment_balance?: number;
  available_balance?: number;
  sbt_last_updated?: string;
  last_rank_bonus?: string;
  stake: number;
  is_premium: boolean;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  updated_at?: string;
  sponsor_code?: string;
  sponsor_id?: string; // Changed from number to string for UUID compatibility
  current_deposit?: number;
  speed_boost_active?: boolean;
  last_weekly_withdrawal?: string;
  available_earnings?: number;
  rank_updated_at?: string;
  login_streak?: number;
  last_login_date?: string;
  direct_referrals?: number;
  last_deposit_time: string | null;
  has_nft?: boolean;
  referrer_username?: string;
  referrer_rank?: string;
  claimed_milestones?: number[];
  expected_rank_bonus?: number;
  stake_date?: string;
  current_stake_date?: string;
  whitelisted_wallet?: string;
  payout_wallet?: string;
  pending_withdrawal?: boolean;
  pending_withdrawal_id?: number;
  payout_balance?: number;
  total_payout?: number;
}

export interface Stake {
  id: number;
  user_id: string; // Changed from number to string for UUID compatibility
  amount: number;
  start_date: string;
  end_date?: string;
  daily_rate: number;
  total_earned: number;
  is_active: boolean;
  last_payout: string;
  speed_boost_active: boolean;
  cycle_progress?: number;
  cycle_completed?: boolean;
  cycle_completed_at?: string;
}

export interface Deposit {
  id: number;
  user_id: string; // Changed from number to string for UUID compatibility
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
  created_at: string;
  processed_at?: string;
}

export interface Withdrawal {
  id: number;
  user_id: string; // Changed from number to string for UUID compatibility
  amount: number;
  wallet_amount: number;
  redeposit_amount: number;
  sbt_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  transaction_hash?: string;
}

export interface MiningSession {
  id: number;
  user_id: string; // Changed from number to string for UUID compatibility
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'expired';
  rzc_earned: number;
  created_at: string;
  completed_at?: string;
}

export interface RZCBalance {
  user_id: string; // Changed from number to string for UUID compatibility
  claimable_rzc: number;
  total_rzc_earned: number;
  last_claim_time?: string;
  created_at: string;
  updated_at: string;
}

export interface FreeMiningPeriod {
  user_id: string; // Changed from number to string for UUID compatibility
  start_date: string;
  end_date: string;
  grace_period_end: string;
  is_active: boolean;
  sessions_used: number;
  max_sessions: number;
  is_in_grace_period: boolean;
  days_remaining: number;
  sessions_remaining: number;
  can_mine: boolean;
  reason: string;
}

export interface AirdropBalance {
  id: number;
  user_id: string; // Changed from number to string for UUID compatibility
  total_claimed_to_airdrop: number;
  available_balance: number;
  withdrawn_balance: number;
  staked_balance: number;
  last_claim_from_mining?: string;
  last_stake_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AirdropWithdrawal {
  id: number;
  user_id: string; // Changed from number to string for UUID compatibility
  airdrop_balance_id: number;
  amount: number;
  destination_address: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_hash?: string;
  network: string;
  gas_fee: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Function signature updates (all userId parameters changed from number to string):

// export const calculateUserRank = async (userId: string) => { ... }
// export const updateUserRank = async (userId: string) => { ... }
// export const getActiveStakes = async (userId: string): Promise<Stake[]> => { ... }
// export const updateUserBalance = async (userId: string, amount: number, earnedAmount: number): Promise<boolean> => { ... }
// export const setupStoredProcedures = async (userId: string) => { ... }
// export const checkAndApplySpeedBoost = async (userId: string) => { ... }
// export const getRewardHistory = async (userId: string) => { ... }
// export const getReferralsByPlayer = async (userId: string) => { ... }
// export const updateUserSBT = async (userId: string, amount: number, type: 'deposit' | 'referral' | 'stake') => { ... }
// export const generateSponsorCode = (userId: string, username?: string): string => { ... }
// export const ensureUserHasSponsorCode = async (userId: string, username?: string): Promise<string> => { ... }
// export const generateDefaultSponsorCode = async (userId: string): Promise<string> => { ... }
// export const processReferralStakingRewards = async (userId: string, stakedAmount: number): Promise<void> => { ... }
// export const logEarningEvent = async (userId: string, type: 'roi' | 'referral' | 'bonus', amount: number, metadata: any) => { ... }
// export const reconcileEarnings = async (userId: string) => { ... }
// export const processEarnings = async (userId: string, stakeId: number, amount: number, type: 'roi' | 'referral' | 'bonus' = 'roi') => { ... }
// export const checkAndHandleCycle = async (userId: string) => { ... }
// export const processWithdrawalFees = async (userId: string, amount: number) => { ... }
// export const processWithdrawal = async (userId: string, amount: number): Promise<boolean> => { ... }
// export const checkCycleCompletion = async (userId: string) => { ... }
// export const checkWeeklyWithdrawalEligibility = async (userId: string): Promise<...> => { ... }
// export const processWeeklyWithdrawal = async (userId: string, amount: number, _walletAddress: string): Promise<...> => { ... }
// export const getUserPayoutStats = async (userId: string): Promise<...> => { ... }
// export const processDeposit = async (userId: string, amount: number, txHash: string): Promise<boolean> => { ... }
// export const reconcileUserBalance = async (userId: string): Promise<boolean> => { ... }
// export const deleteUserProfile = async (userId: string): Promise<boolean> => { ... }
// export const startMiningSession = async (userId: string): Promise<...> => { ... }
// export const startMiningSessionUnrestricted = async (userId: string): Promise<...> => { ... }
// export const getActiveMiningSession = async (userId: string): Promise<MiningSession | null> => { ... }
// export const getUserRZCBalance = async (userId: string): Promise<...> => { ... }
// export const claimRZCRewards = async (userId: string, amount: number): Promise<...> => { ... }
// export const claimAllSeasonRZC = async (userId: string): Promise<...> => { ... }
// export const createAirdropClaimRequest = async (userId: string, walletAddress: string, nodeAlias?: string): Promise<...> => { ... }
// export const getMiningHistory = async (userId: string, limit: number = 10): Promise<MiningSession[]> => { ... }
// export const initializeFreeMiningPeriod = async (userId: string): Promise<...> => { ... }
// export const getFreeMiningStatus = async (userId: string): Promise<...> => { ... }
// export const updateFreeMiningSessionCount = async (userId: string): Promise<boolean> => { ... }
// export const canUserStartMining = async (userId: string): Promise<...> => { ... }
// export const recordMiningActivity = async (userId: string, activityType: '...', amount: number = 0): Promise<boolean> => { ... }
// export const recordUpgradeActivity = async (userId: string, cost: number): Promise<boolean> => { ... }
// export const getPassiveIncomeBoostLevel = async (userId: string): Promise<number> => { ... }
// export const purchaseUpgrade = async (userId: string, upgradeType: '...', cost?: number, level?: number): Promise<...> => { ... }
// export const generatePassiveIncome = async (userId: string): Promise<...> => { ... }
// export const recordRZCClaimActivity = async (userId: string, amount: number): Promise<boolean> => { ... }
// export const getUserActivities = async (userId: string, activityTypes?: string[], limit: number = 20): Promise<any[]> => { ... }
// export const getUserAirdropBalance = async (userId: string): Promise<...> => { ... }
// export const claimTotalEarnedToAirdrop = async (userId: string): Promise<...> => { ... }

// Note: This is a reference file. You'll need to manually update each function in supabaseClient.ts
// or use find-and-replace to change all occurrences of "userId: number" to "userId: string"