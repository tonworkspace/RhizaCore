import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase initialization
// ⚠️ SECURITY NOTE: Ideally, remove the hardcoded fallback strings and rely strictly on .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qaviehvidwbntwrecyky.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

// Debug logging
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.error('⚠️ Supabase URL is not set! Please add VITE_SUPABASE_URL to your .env file');
}
// FIXED: Variable name changed from supabaseKey to supabaseAnonKey
if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('⚠️ Supabase Anon Key is not set! Please add VITE_SUPABASE_ANON_KEY to your .env file');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface User {
  id: number;
  telegram_id: number;
  wallet_address: string;
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
  sponsor_id?: number;
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
  user_id: number;
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
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
  created_at: string;
  processed_at?: string;
}

export interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  wallet_amount: number;
  redeposit_amount: number;
  sbt_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  transaction_hash?: string;
}

export interface Transaction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_contract: string;
  token_symbol: string;
  chain_id: number;
  thirdweb_transaction_id?: string;
  transaction_hash?: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at?: string;
  from_user?: User;
  to_user?: User;
}

export interface MiningSession {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'expired';
  rzc_earned: number;
  created_at: string;
  completed_at?: string;
}

export interface RZCBalance {
  user_id: number;
  claimable_rzc: number;
  total_rzc_earned: number;
  last_claim_time?: string;
  created_at: string;
  updated_at: string;
}

export interface FreeMiningPeriod {
  user_id: number;
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

// ==========================================
// CONSTANTS & CONFIG
// ==========================================

export const SPEED_BOOST_MULTIPLIER = 2;
export const FAST_START_BONUS_AMOUNT = 1; // 1 TON
export const FAST_START_REQUIRED_REFERRALS = 2;
export const FAST_START_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const STAKING_CONFIG = {
  DAILY_RATES: {
    WEEK1: 0.01, // 1% (days 1-7)
    WEEK2: 0.02, // 2% (days 8-14)
    WEEK3: 0.03, // 3% (days 15-21)
    WEEK4: 0.04  // 4% (days 22+)
  },
  MAX_CYCLE_PERCENTAGE: 300,
  MIN_DEPOSIT: 1, // 1 TON
  FEES: {
    DEPOSIT_STK: 0.05, // 5% to STK
    WITHDRAWAL_STK: 0.10, // 10% to STK
    WITHDRAWAL_GLP: 0.10, // 10% to GLP
    WITHDRAWAL_REINVEST: 0.20 // 20% to reinvestment wallet
  }
};

export const RANK_REQUIREMENTS = {
  NOVICE: { title: 'Novice', minStake: 0, minEarnings: 0, color: 'gray', weeklyBonus: 0, icon: 'sparkle' },
  EXPLORER: { title: 'Explorer', minStake: 20, minEarnings: 100, color: 'green', weeklyBonus: 5, icon: 'compass' },
  VOYAGER: { title: 'Voyager', minStake: 50, minEarnings: 500, color: 'blue', weeklyBonus: 10, icon: 'rocket' },
  GUARDIAN: { title: 'Guardian', minStake: 100, minEarnings: 2000, color: 'purple', weeklyBonus: 20, icon: 'shield' },
  SOVEREIGN: { title: 'Sovereign', minStake: 500, minEarnings: 10000, color: 'yellow', weeklyBonus: 50, icon: 'crown' },
  CELESTIAL: { title: 'Celestial', minStake: 1000, minEarnings: 25000, color: 'cyan', weeklyBonus: 100, icon: 'star' },
  LEGENDARY: { title: 'Legendary', minStake: 20000, minEarnings: 500000, color: 'red', weeklyBonus: 200, icon: 'star' },
  SUPERNOVA: { title: 'Supernova', minStake: 50000, minEarnings: 1000000, color: 'red', weeklyBonus: 200, icon: 'star' }
};

export const EARNING_LIMITS = {
  daily_roi_max: 1000,
  referral_commission_max: 500,
  speed_boost_duration: 24 * 60 * 60 * 1000, // 24 hours
  minimum_withdrawal: 1
};

const WITHDRAWAL_FEES = {
  GLP: 0.10,  // 10% to Global Leadership Pool
  STK: 0.10,  // 10% to Reputation Points ($STK)
  REINVEST: 0.20  // 20% to re-investment wallet
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const getRankBonus = (rank: string): number => {
  switch (rank) {
    case 'GUARDIAN': return 0.1; // +10%
    case 'SOVEREIGN': return 0.15; // +15%
    case 'CELESTIAL': return 0.2; // +20%
    default: return 0;
  }
};

export const calculateDailyROI = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) return STAKING_CONFIG.DAILY_RATES.WEEK1;
  else if (daysDiff <= 14) return STAKING_CONFIG.DAILY_RATES.WEEK2;
  else if (daysDiff <= 21) return STAKING_CONFIG.DAILY_RATES.WEEK3;
  else return STAKING_CONFIG.DAILY_RATES.WEEK4;
};

// Helper function to calculate GLP points
const calculateGLPPoints = (teamVolume: number, withdrawalVolume: number): number => {
  // Points from team volume (1 point per 1000 TON)
  const volumePoints = Math.floor(teamVolume / 1000);
  // Points from withdrawal volume (2% consideration)
  const withdrawalPoints = Math.floor((withdrawalVolume * 0.02) / 100);
  
  // Bonus points for high team volume
  let bonusPoints = 0;
  if (teamVolume >= 10000) bonusPoints += 20;
  if (teamVolume >= 50000) bonusPoints += 50;
  if (teamVolume >= 100000) bonusPoints += 100;
  
  return volumePoints + withdrawalPoints + bonusPoints;
};

// ==========================================
// CORE LOGIC FUNCTIONS
// ==========================================

// Function to calculate user's rank
export const calculateUserRank = async (userId: number) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select(`total_earned, balance`)
      .eq('id', userId)
      .single();

    if (!user) return 'NOVICE';

    for (const [rank, requirements] of Object.entries(RANK_REQUIREMENTS).reverse()) {
      if (
        user.balance >= requirements.minStake &&
        user.total_earned >= requirements.minEarnings
      ) {
        return rank;
      }
    }
    return 'NOVICE';
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 'NOVICE';
  }
};

// Function to process weekly rank bonus
const processWeeklyRankBonus = async (userId: number, bonusAmount: number) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: lastBonus } = await supabase
      .from('rank_bonuses')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())
      .single();

    if (lastBonus) return false;

    const { error } = await supabase
      .from('rank_bonuses')
      .insert({
        user_id: userId,
        amount: bonusAmount,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    await supabase
      .from('users')
      .update({
        available_earnings: supabase.rpc('increment', { amount: bonusAmount }),
        total_earned: supabase.rpc('increment', { amount: bonusAmount })
      })
      .eq('id', userId);

    return true;
  } catch (error) {
    console.error('Error processing rank bonus:', error);
    return false;
  }
};

export const updateUserRank = async (userId: number) => {
  try {
    const newRank = await calculateUserRank(userId);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        rank: newRank,
        rank_updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    const rankReq = RANK_REQUIREMENTS[newRank as keyof typeof RANK_REQUIREMENTS];
    if (rankReq.weeklyBonus > 0) {
      await processWeeklyRankBonus(userId, rankReq.weeklyBonus);
    }
    return newRank;
  } catch (error) {
    console.error('Error updating rank:', error);
    return null;
  }
};

// ==========================================
// DATABASE HELPER FUNCTIONS
// ==========================================

export const getUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
};

export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      ...userData,
      rank: 'NOVICE',
      balance: 0,
      total_deposit: 0,
      total_withdrawn: 0,
      team_volume: 0
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
};

export const getActiveStakes = async (userId: number): Promise<Stake[]> => {
  const { data, error } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching stakes:', error);
    return [];
  }
  return data || [];
};

export const createStake = async (stakeData: Partial<Stake>): Promise<Stake | null> => {
  const { data, error } = await supabase
    .from('stakes')
    .insert([stakeData])
    .select()
    .single();

  if (error) {
    console.error('Error creating stake:', error);
    return null;
  }
  return data;
};

export const createDeposit = async (depositData: Partial<Deposit>): Promise<Deposit | null> => {
  const { data, error } = await supabase
    .from('deposits')
    .insert([depositData])
    .select()
    .single();

  if (error) {
    console.error('Error creating deposit:', error);
    return null;
  }
  return data;
};

export const createWithdrawal = async (withdrawalData: Partial<Withdrawal>): Promise<Withdrawal | null> => {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert([withdrawalData])
    .select()
    .single();

  if (error) {
    console.error('Error creating withdrawal:', error);
    return null;
  }
  return data;
};

export const updateUserBalance = async (userId: number, amount: number, earnedAmount: number): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update({ 
      balance: amount,
      total_earned: supabase.rpc('increment_total_earned', { amount: earnedAmount })
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating balance:', error);
    return false;
  }
  return true;
};

export const setupStoredProcedures = async (userId: number) => {
  const { error: referralError } = await supabase.rpc('process_referral_v2', {
    p_sponsor_id: userId,
    p_referred_id: userId
  });

  const { error: volumeError } = await supabase.rpc('update_team_volumes', {
    p_sponsor_ids: [userId],
    p_amount: 0
  });

  return !referralError && !volumeError;
};

// ==========================================
// EARNINGS & REWARDS
// ==========================================

export const calculateDailyRewards = async (stakeId: number): Promise<number> => {
  const { data: stake, error: stakeError } = await supabase
    .from('stakes')
    .select('*, users!inner(*)')
    .eq('id', stakeId)
    .maybeSingle();

  if (stakeError) {
    console.error('Error fetching stake:', stakeError);
    return 0;
  }

  if (!stake || !stake.is_active) {
    console.log(`No active stake found with ID ${stakeId}`);
    return 0;
  }

  const lastPayout = new Date(stake.last_payout);
  const now = new Date();
  const hoursSinceLastPayout = (now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastPayout < 24) {
    console.log('Already paid out in last 24 hours');
    return 0;
  }

  let baseRate = 0.01;
  if (stake.amount >= 10000) baseRate *= 0.8;
  else if (stake.amount >= 5000) baseRate *= 0.85;
  else if (stake.amount >= 1000) baseRate *= 0.9;
  
  const startDate = new Date(stake.start_date);
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const durationMultiplier = Math.max(0.7, 1 - (daysSinceStart / 200));
  let dailyRate = baseRate * durationMultiplier;

  const rankBonus = getRankBonus(stake.users.rank);
  dailyRate *= (1 + rankBonus);

  let dailyEarning = stake.amount * dailyRate;
  
  if (stake.speed_boost_active) {
    dailyEarning *= 1.5;
  }

  const maxDailyEarning = Math.min(
    stake.amount * 0.03,
    EARNING_LIMITS.daily_roi_max
  );
  
  const cappedEarning = Math.min(dailyEarning, maxDailyEarning);

  const { error } = await supabase
    .from('stakes')
    .update({
      total_earned: stake.total_earned + cappedEarning,
      last_payout: now.toISOString(),
      daily_rate: dailyRate,
      cycle_progress: Math.min(((stake.total_earned + cappedEarning) / stake.amount) * 100, 300)
    })
    .eq('id', stakeId);

  if (error) {
    console.error('Error updating stake rewards:', error);
    return 0;
  }

  await supabase.from('earning_history').insert({
    stake_id: stakeId,
    user_id: stake.user_id,
    amount: cappedEarning,
    type: 'daily_roi',
    roi_rate: dailyRate * 100,
    base_rate: baseRate * 100,
    rank_bonus: rankBonus,
    duration_multiplier: durationMultiplier,
    created_at: now.toISOString()
  });

  return cappedEarning;
};

export const checkAndApplySpeedBoost = async (userId: number) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('current_deposit, speed_boost_active')
      .eq('id', userId)
      .single();

    if (!user) return false;

    if (user.speed_boost_active) {
      return {
        success: true,
        boosted_amount: user.current_deposit * SPEED_BOOST_MULTIPLIER,
        message: '🚀 Speed boost active: Earning 2x rewards!'
      };
    }

    return {
      success: false,
      boosted_amount: user.current_deposit,
      message: 'Speed boost not active'
    };
  } catch (error) {
    console.error('Error checking speed boost:', error);
    return false;
  }
};

export const getRewardHistory = async (userId: number) => {
  const { data, error } = await supabase
    .from('reward_history')
    .select(`
      *,
      stake:stakes (
        amount,
        daily_rate
      )
    `)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to load reward history:', error);
    throw error;
  }
  return data;
};

export const getGlobalPoolRankings = async (period: string = 'daily') => {
  const { data, error } = await supabase
    .from('global_pool_rankings')
    .select(`
      *,
      user:users (
        username,
        wallet_address
      )
    `)
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching pool data:', error);
    throw error;
  }
  return data;
};

export const getReferralsByPlayer = async (userId: number) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referred_id(username)
      `)
      .eq('sponsor_id', userId);

    if (error) throw error;

    return data?.map(referral => ({
      referred_id: referral.referred_id,
      referred_username: referral.referred?.username || 'Anonymous User'
    })) || [];

  } catch (error) {
    console.error('Error fetching referrals:', error);
    throw error;
  }
};

export const errorRecovery = {
  async retryTransaction(fn: () => Promise<any>, maxRetries = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  },
  async monitorUserActivity(userId: string) {
    return supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        timestamp: new Date().toISOString(),
        action_type: 'system_check',
        status: 'monitoring'
      });
  }
};

export const updateUserSBT = async (userId: number, amount: number, type: 'deposit' | 'referral' | 'stake') => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        total_sbt: supabase.rpc('increment_sbt', { user_id: userId, amount: amount })
      })
      .eq('id', userId)
      .select('total_sbt')
      .single();

    if (error) throw error;

    await supabase.from('sbt_history').insert({
      user_id: userId,
      amount: amount,
      type: type,
      timestamp: new Date().toISOString()
    });

    return user?.total_sbt;
  } catch (error) {
    console.error('Error updating SBT:', error);
    return null;
  }
};

export const generateSponsorCode = (userId: number, username?: string): string => {
  const baseId = userId.toString().padStart(4, '0');
  const usernamePart = username ? username.substring(0, 3).toUpperCase() : 'USR';
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${usernamePart}-${baseId}${randomPart}`.substring(0, 8);
};

export const ensureUserHasSponsorCode = async (userId: number, username?: string): Promise<string> => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('sponsor_code, username')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return '';
    }

    if (user?.sponsor_code) return user.sponsor_code;

    const { data: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
      
    const { data: firstUser } = await supabase
      .from('users')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    let sponsorCode: string;
    if (totalUsers?.length === 1 || firstUser?.id === userId) {
      sponsorCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
    } else {
      sponsorCode = generateSponsorCode(userId, username || user?.username);
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ sponsor_code: sponsorCode })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating sponsor code:', updateError);
      return '';
    }

    return sponsorCode;
  } catch (error) {
    console.error('Error ensuring sponsor code:', error);
    return '';
  }
};

export const generateDefaultSponsorCode = async (userId: number): Promise<string> => {
  try {
    const defaultCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
    const { error: updateError } = await supabase
      .from('users')
      .update({ sponsor_code: defaultCode })
      .eq('id', userId);

    if (updateError) {
      console.error('Error setting default sponsor code:', updateError);
      return '';
    }
    return defaultCode;
  } catch (error) {
    console.error('Error generating default sponsor code:', error);
    return '';
  }
};

export const processReferralStakingRewards = async (userId: number, stakedAmount: number): Promise<void> => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('sponsor_id, username')
      .eq('id', userId)
      .single();

    if (userError || !user || !user.sponsor_id) {
      console.log('No sponsor found for user:', userId);
      return;
    }

    const rewardAmount = Math.max(1000, stakedAmount * 0.1);

    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id: user.sponsor_id,
      amount: rewardAmount
    });

    if (balanceError) {
      console.error('Error updating sponsor balance:', balanceError);
      return;
    }

    const { error: earningsError } = await supabase.rpc('update_user_earnings', {
      user_id: user.sponsor_id,
      referral_amount: rewardAmount
    });

    if (earningsError) {
      console.error('Error updating sponsor earnings:', earningsError);
    }

    await supabase.from('activities').insert({
      user_id: user.sponsor_id,
      type: 'referral_staking_reward',
      amount: rewardAmount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    await supabase
      .from('referrals')
      .update({ status: 'active' })
      .eq('sponsor_id', user.sponsor_id)
      .eq('referred_id', userId);

    console.log(`Processed referral staking reward: ${rewardAmount} RZC for sponsor ${user.sponsor_id} from user ${userId}'s stake of ${stakedAmount}`);

  } catch (error) {
    console.error('Error processing referral staking rewards:', error);
  }
};

export const logEarningEvent = async (userId: number, type: 'roi' | 'referral' | 'bonus', amount: number, metadata: any) => {
  await supabase.from('earning_logs').insert({
    user_id: userId,
    type,
    amount,
    metadata,
    timestamp: new Date().toISOString()
  });
};

export const reconcileEarnings = async (userId: number) => {
  const { data: earnings } = await supabase
    .from('earning_logs')
    .select('amount')
    .eq('user_id', userId);

  const calculatedTotal = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const { data: user } = await supabase
    .from('users')
    .select('total_earned')
    .eq('id', userId)
    .single();

  if (user && Math.abs(calculatedTotal - user.total_earned) > 0.000001) {
    await supabase.from('earning_discrepancies').insert({
      user_id: userId,
      calculated: calculatedTotal,
      recorded: user.total_earned,
      timestamp: new Date().toISOString()
    });
  }
};

// Cycle completion handling
const handleCycleCompletion = async (userId: number, stakeId: number, stakeAmount: number) => {
  try {
    await supabase
      .from('stakes')
      .update({ 
        is_active: false, 
        cycle_completed: true,
        cycle_completed_at: new Date().toISOString()
      })
      .eq('id', stakeId);

    const reinvestAmount = stakeAmount * 0.2;
    const glpAmount = stakeAmount * 0.1;
    const stkAmount = stakeAmount * 0.1;

    await Promise.all([
      supabase.rpc('increment_reinvestment_balance', { user_id: userId, amount: reinvestAmount }),
      supabase.rpc('increment_glp_pool', { p_amount: glpAmount }),
      supabase.rpc('increment_sbt', { user_id: userId, amount: stkAmount })
    ]);

    await supabase.from('cycle_completions').insert({
      user_id: userId,
      stake_id: stakeId,
      stake_amount: stakeAmount,
      reinvest_amount: reinvestAmount,
      glp_amount: glpAmount,
      stk_amount: stkAmount,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling cycle completion:', error);
    throw error;
  }
};

export const processEarnings = async (userId: number, stakeId: number, amount: number, type: 'roi' | 'referral' | 'bonus' = 'roi') => {
  try {
    const timestamp = new Date().toISOString();
    
    const { data: stake } = await supabase
      .from('stakes')
      .select('amount, total_earned')
      .eq('id', stakeId)
      .maybeSingle();

    if (!stake) return false;

    const newTotalEarned = stake.total_earned + amount;
    const cycleProgress = (newTotalEarned / stake.amount) * 100;

    if (cycleProgress >= 300) {
      await handleCycleCompletion(userId, stakeId, stake.amount);
      return true;
    }

    const { error } = await supabase.rpc('process_earnings', {
      p_amount: amount,
      p_stake_id: stakeId,
      p_timestamp: timestamp,
      p_user_id: userId,
      p_type: type
    });

    if (error) throw error;

    await supabase
      .from('stakes')
      .update({ 
        cycle_progress: cycleProgress,
        total_earned: newTotalEarned
      })
      .eq('id', stakeId);

    await logEarningEvent(userId, type, amount, {
      stakeId,
      timestamp,
      cycleProgress
    });

    return true;
  } catch (error) {
    console.error('Error processing earnings:', error);
    return false;
  }
};

export const gmpSystem = {
  getPoolStats: async () => {
    const { data, error } = await supabase.rpc('get_gmp_stats', {
      withdrawal_fee_percent: 10,
      distribution_percent: 35
    });
    
    if (error) throw error;
    return data;
  },

  getUserPoolShare: async (userId: number) => {
    const { data, error } = await supabase.rpc('calculate_user_glp_share', {
      p_user_id: userId,
      p_team_volume_percent: 2,
      p_reset_interval_days: 7
    });

    if (error) throw error;
    return data;
  }
};

export const checkAndHandleCycle = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = stake.total_earned / stake.amount * 100;
    if (totalReturn >= 300) {
      await supabase.rpc('complete_stake_cycle', { 
        p_stake_id: stake.id,
        p_user_id: userId 
      });
    }
  }
};

// ==========================================
// WITHDRAWALS
// ==========================================

export const processWithdrawalFees = async (userId: number, amount: number) => {
  try {
    const glpAmount = amount * WITHDRAWAL_FEES.GLP;
    const stkAmount = amount * WITHDRAWAL_FEES.STK;
    const reinvestAmount = amount * WITHDRAWAL_FEES.REINVEST;
    const userAmount = amount - glpAmount - stkAmount - reinvestAmount;

    await supabase.rpc('increment_glp_pool', { p_amount: glpAmount });
    await supabase.rpc('increment_sbt', { user_id: userId, amount: stkAmount });
    await supabase.rpc('increment_reinvestment_balance', { user_id: userId, amount: reinvestAmount });

    return {
      success: true,
      userAmount,
      fees: {
        glp: glpAmount,
        stk: stkAmount,
        reinvest: reinvestAmount
      }
    };
  } catch (error) {
    console.error('Error processing withdrawal fees:', error);
    return { success: false };
  }
};

export const processWithdrawal = async (userId: number, amount: number): Promise<boolean> => {
  try {
    if (amount < EARNING_LIMITS.minimum_withdrawal) {
      console.error('Withdrawal amount below minimum');
      return false;
    }

    const { data: user } = await supabase
      .from('users')
      .select('available_earnings')
      .eq('id', userId)
      .single();

    if (!user || user.available_earnings < amount) {
      console.error('Insufficient available earnings');
      return false;
    }

    const feeResult = await processWithdrawalFees(userId, amount);
    if (!feeResult.success) return false;

    const { error } = await supabase.rpc('process_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_user_amount: feeResult.userAmount,
      p_glp_amount: feeResult?.fees?.glp ?? 0,
      p_stk_amount: feeResult?.fees?.stk ?? 0,
      p_reinvest_amount: feeResult?.fees?.reinvest ?? 0
    });

    if (error) throw error;

    await supabase.from('withdrawals').insert({
      user_id: userId,
      amount: amount,
      user_amount: feeResult.userAmount,
      glp_fee: feeResult?.fees?.glp ?? 0,
      stk_fee: feeResult?.fees?.stk ?? 0,
      reinvest_amount: feeResult?.fees?.reinvest ?? 0,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return false;
  }
};

export const checkCycleCompletion = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = (stake.total_earned / stake.amount) * 100;
    if (totalReturn >= 300) {
      await supabase
        .from('stakes')
        .update({ is_active: false, cycle_completed: true })
        .eq('id', stake.id);
        
      await supabase.rpc('increment_reinvestment_balance', {
        user_id: userId,
        amount: stake.amount * 0.2
      });
    }
  }
};

export const checkWeeklyWithdrawalEligibility = async (userId: number): Promise<{
  canWithdraw: boolean;
  nextWithdrawalDate: Date | null;
  daysUntilWithdrawal: number;
  hasPendingWithdrawal: boolean;
  pendingWithdrawalId?: number;
}> => {
  try {
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from('withdrawals')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingError) throw pendingError;

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return {
        canWithdraw: false,
        nextWithdrawalDate: null,
        daysUntilWithdrawal: 0,
        hasPendingWithdrawal: true,
        pendingWithdrawalId: pendingWithdrawals[0].id
      };
    }

    const { data, error } = await supabase
      .from('users')
      .select('last_weekly_withdrawal')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const lastWithdrawal = data?.last_weekly_withdrawal;
    const now = new Date();
    
    if (!lastWithdrawal) {
      return {
        canWithdraw: true,
        nextWithdrawalDate: null,
        daysUntilWithdrawal: 0,
        hasPendingWithdrawal: false
      };
    }

    const lastWithdrawalDate = new Date(lastWithdrawal);
    const daysSinceWithdrawal = Math.floor((now.getTime() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceWithdrawal >= 7) {
      return {
        canWithdraw: true,
        nextWithdrawalDate: null,
        daysUntilWithdrawal: 0,
        hasPendingWithdrawal: false
      };
    } else {
      const nextDate = new Date(lastWithdrawalDate);
      nextDate.setDate(nextDate.getDate() + 7);
      return {
        canWithdraw: false,
        nextWithdrawalDate: nextDate,
        daysUntilWithdrawal: 7 - daysSinceWithdrawal,
        hasPendingWithdrawal: false
      };
    }
  } catch (error) {
    console.error('Error checking weekly withdrawal eligibility:', error);
    return {
      canWithdraw: false,
      nextWithdrawalDate: null,
      daysUntilWithdrawal: 0,
      hasPendingWithdrawal: false
    };
  }
};

export const processWeeklyWithdrawal = async (userId: number, amount: number, _walletAddress: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const eligibility = await checkWeeklyWithdrawalEligibility(userId);
    if (!eligibility.canWithdraw) {
      if (eligibility.hasPendingWithdrawal) {
        return {
          success: false,
          error: 'You have a pending withdrawal request. Please wait for it to be processed before making another request.'
        };
      } else {
        return {
          success: false,
          error: 'Weekly withdrawal cooldown active. Please wait until next withdrawal date.'
        };
      }
    }

    if (amount < 1) {
      return { success: false, error: 'Minimum withdrawal amount is 1 RZC' };
    }

    const { data: user } = await supabase
      .from('users')
      .select('total_withdrawn')
      .eq('id', userId)
      .single();

    if (!user || user.total_withdrawn < amount) {
      return { success: false, error: 'Insufficient claimable balance' };
    }

    const { error: withdrawError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        wallet_amount: amount,
        status: 'PENDING',
        created_at: new Date().toISOString()
      });

    if (withdrawError) throw withdrawError;

    const { error: updateError } = await supabase.rpc('update_weekly_withdrawal_tracking', {
      user_id_param: userId,
      withdrawal_amount: amount
    });

    if (updateError) {
      console.error('Error updating weekly withdrawal tracking:', updateError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error processing weekly withdrawal:', error);
    return {
      success: false,
      error: error.message || 'Failed to process withdrawal'
    };
  }
};

export const approveWithdrawal = async (withdrawalId: number): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) return { success: false, error: 'Withdrawal not found' };
    if (withdrawal.status !== 'PENDING') return { success: false, error: 'Withdrawal is not pending' };

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'COMPLETED',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    const { error: balanceError } = await supabase.rpc('update_user_balance_after_withdrawal', {
      user_id: withdrawal.user_id,
      withdrawal_amount: withdrawal.amount
    });

    if (balanceError) {
      console.error('Error updating user balance:', balanceError);
      await supabase
        .from('withdrawals')
        .update({ status: 'PENDING' })
        .eq('id', withdrawalId);
      
      return { success: false, error: 'Failed to update user balance' };
    }

    await supabase
      .from('activities')
      .insert({
        user_id: withdrawal.user_id,
        type: 'withdrawal',
        amount: withdrawal.amount,
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      });

    return { success: true };
  } catch (error: any) {
    console.error('Error approving withdrawal:', error);
    return {
      success: false,
      error: error.message || 'Failed to approve withdrawal'
    };
  }
};

export const rejectWithdrawal = async (withdrawalId: number, _reason?: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'FAILED',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error);
    return {
      success: false,
      error: error.message || 'Failed to reject withdrawal'
    };
  }
};

export const getUserPayoutStats = async (userId: number): Promise<{
  totalPayout: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  lastPayoutDate: string | null;
}> => {
  try {
    const { data, error } = await supabase.rpc('get_user_payout_stats', {
      user_id_param: userId
    });

    if (error) throw error;

    const stats = data?.[0] || {
      total_payout: 0,
      total_withdrawn: 0,
      pending_withdrawals: 0,
      last_payout_date: null
    };

    return {
      totalPayout: Number(stats.total_payout) || 0,
      totalWithdrawn: Number(stats.total_withdrawn) || 0,
      pendingWithdrawals: Number(stats.pending_withdrawals) || 0,
      lastPayoutDate: stats.last_payout_date
    };
  } catch (error: any) {
    console.error('Error getting user payout stats:', error);
    return {
      totalPayout: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      lastPayoutDate: null
    };
  }
};

export const getPlatformPayoutStats = async (): Promise<{
  totalPlatformPayouts: number;
  totalPendingWithdrawals: number;
  totalUsersWithPayouts: number;
}> => {
  try {
    const { data, error } = await supabase.rpc('get_platform_payout_stats');

    if (error) throw error;

    const stats = data?.[0] || {
      total_platform_payouts: 0,
      total_pending_withdrawals: 0,
      total_users_with_payouts: 0
    };

    return {
      totalPlatformPayouts: Number(stats.total_platform_payouts) || 0,
      totalPendingWithdrawals: Number(stats.total_pending_withdrawals) || 0,
      totalUsersWithPayouts: Number(stats.total_users_with_payouts) || 0
    };
  } catch (error: any) {
    console.error('Error getting platform payout stats:', error);
    return {
      totalPlatformPayouts: 0,
      totalPendingWithdrawals: 0,
      totalUsersWithPayouts: 0
    };
  }
};

export const distributeGLPRewards = async () => {
  try {
    const { data: poolData } = await supabase
      .from('global_pool')
      .select('amount')
      .single();
    
    if (!poolData?.amount || poolData.amount === 0) {
      console.log('No rewards to distribute');
      return;
    }

    const { data: participants } = await supabase
      .from('users')
      .select(`
        id,
        team_volume,
        withdrawal_volume:withdrawals(sum)
      `)
      .gte('balance', 100);

    if (!participants?.length) {
      console.log('No qualified participants');
      return;
    }

    const participantPoints = participants.map(p => ({
      user_id: p.id,
      team_volume: p.team_volume,
      points: calculateGLPPoints(
        p.team_volume, 
        p.withdrawal_volume?.[0]?.sum || 0
      )
    }));

    const totalPoints = participantPoints.reduce((sum, p) => sum + p.points, 0);
    
    const distributions = participantPoints.map(p => ({
      user_id: p.user_id,
      amount: (p.points / totalPoints) * poolData.amount,
      points: p.points,
      distribution_date: new Date().toISOString()
    }));

    const { error } = await supabase.rpc('process_glp_distribution', {
      p_distributions: distributions,
      p_pool_amount: poolData.amount
    });

    if (error) throw error;

    await supabase.from('glp_distribution_history').insert(
      distributions.map(d => ({
        ...d,
        total_pool_amount: poolData.amount,
        total_participants: participants.length
      }))
    );

    return {
      success: true,
      distributed_amount: poolData.amount,
      participant_count: participants.length
    };

  } catch (error) {
    console.error('Error distributing GLP rewards:', error);
    return {
      success: false,
      error: 'Failed to distribute GLP rewards'
    };
  }
};

export const processDeposit = async (userId: number, amount: number, txHash: string): Promise<boolean> => {
  try {
    const { data: existingDeposit } = await supabase
      .from('deposits')
      .select('id')
      .eq('transaction_hash', txHash)
      .single();

    if (existingDeposit) {
      console.error('Duplicate transaction detected');
      return false;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, total_deposit')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user data:', userError);
      return false;
    }

    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_hash: txHash,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (depositError || !deposit) {
      console.error('Error creating deposit record:', depositError);
      return false;
    }

    const { error: updateError } = await supabase.rpc('update_user_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_deposit_id: deposit.id
    });

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      await supabase
        .from('deposits')
        .update({ status: 'failed' })
        .eq('id', deposit.id);
      return false;
    }

    await processReferralStakingRewards(userId, amount);

    await supabase.from('activities').insert({
      user_id: userId,
      type: 'deposit',
      amount: amount,
      status: 'completed',
      deposit_id: deposit.id
    });

    return true;

  } catch (error) {
    console.error('Error processing deposit:', error);
    return false;
  }
};

export const reconcileUserBalance = async (userId: number): Promise<boolean> => {
  try {
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalDeposits = deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
    const correctBalance = totalDeposits - totalWithdrawals;

    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!user) return false;

    if (Math.abs(user.balance - correctBalance) > 0.000001) {
      await supabase.from('balance_discrepancies').insert({
        user_id: userId,
        recorded_balance: user.balance,
        calculated_balance: correctBalance,
        difference: correctBalance - user.balance,
        timestamp: new Date().toISOString()
      });

      await supabase
        .from('users')
        .update({ 
          balance: correctBalance,
          last_balance_check: new Date().toISOString()
        })
        .eq('id', userId);
    }
    return true;
  } catch (error) {
    console.error('Error reconciling balance:', error);
    return false;
  }
};

export const deleteUserProfile = async (userId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('lastLogin');
    localStorage.removeItem('earningsState');
    localStorage.removeItem('totalEarned');

    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
};

// ==========================================
// USER & TRANSACTION FUNCTIONS
// ==========================================

export const createOrUpdateUser = async (
  email: string,
  walletAddress: string,
  username?: string,
  displayName?: string
): Promise<User> => {
  const userData: {
    email: string;
    wallet_address: string;
    updated_at: string;
    username?: string;
    display_name?: string;
  } = {
    email,
    wallet_address: walletAddress,
    updated_at: new Date().toISOString()
  };

  if (username) userData.username = username;
  if (displayName) userData.display_name = displayName;

  const { data, error } = await supabase
    .from('users')
    .upsert(userData, { 
      onConflict: 'wallet_address',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }

  return data;
};

export const getUserByWalletAddress = async (walletAddress: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user by username: ${error.message}`);
  }

  return data;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  return data || [];
};

export const updateUserProfile = async (
  walletAddress: string,
  updates: Partial<Pick<User, 'username' | 'display_name' | 'avatar_url'>>
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
};

export const createTransaction = async (
  fromUserId: string,
  toUserId: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  tokenContract: string,
  tokenSymbol: string,
  chainId: number,
  message?: string,
  thirdwebTransactionId?: string
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      from_address: fromAddress,
      to_address: toAddress,
      amount,
      token_contract: tokenContract,
      token_symbol: tokenSymbol,
      chain_id: chainId,
      message,
      thirdweb_transaction_id: thirdwebTransactionId,
      status: 'pending'
    })
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return data;
};

export const updateTransactionStatus = async (
  transactionId: string,
  status: 'pending' | 'confirmed' | 'failed',
  transactionHash?: string
): Promise<Transaction> => {
  const updates: {
    status: 'pending' | 'confirmed' | 'failed';
    updated_at: string;
    confirmed_at?: string;
    transaction_hash?: string;
  } = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString();
  }

  if (transactionHash) {
    updates.transaction_hash = transactionHash;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update transaction status: ${error.message}`);
  }

  return data;
};

export const updateThirdwebTransactionId = async (
  transactionId: string,
  thirdwebTransactionId: string
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      thirdweb_transaction_id: thirdwebTransactionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update thirdweb transaction ID: ${error.message}`);
  }

  return data;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user transactions: ${error.message}`);
  }

  return data || [];
};

export const getRecentTransactions = async (limit = 20): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent transactions: ${error.message}`);
  }

  return data || [];
};

export const subscribeToUserTransactions = (
  userId: string,
  callback: (transaction: Transaction) => void
) => {
  return supabase
    .channel('user-transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `or(from_user_id.eq.${userId},to_user_id.eq.${userId})`
      },
      (payload) => {
        callback(payload.new as Transaction);
      }
    )
    .subscribe();
};

// ==========================================
// MINING SYSTEM FUNCTIONS
// ==========================================

export const startMiningSession = async (userId: number): Promise<{
  success: boolean;
  sessionId?: number;
  error?: string;
}> => {
  try {
    const miningCheck = await canUserStartMining(userId);
    if (!miningCheck.canMine) {
      return {
        success: false,
        error: miningCheck.reason || 'Cannot start mining session'
      };
    }

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        type: 'mining_start',
        amount: 0,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      sessionId: activity.id
    };
  } catch (error: any) {
    console.error('Error starting mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to start mining session'
    };
  }
};

export const startMiningSessionUnrestricted = async (userId: number): Promise<{
  success: boolean;
  sessionId?: number;
  error?: string;
}> => {
  try {
    const existing = await getActiveMiningSession(userId);
    if (existing) {
      return { success: true, sessionId: existing.id };
    }

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        type: 'mining_start',
        amount: 0,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      sessionId: activity.id
    };
  } catch (error: any) {
    console.error('Error starting unrestricted mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to start unrestricted mining session'
    };
  }
};

export const getActiveMiningSession = async (userId: number): Promise<MiningSession | null> => {
  try {
    const { data: miningStarts, error } = await supabase
      .from('activities')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('type', 'mining_start')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!miningStarts || miningStarts.length === 0) return null;

    const startActivity = miningStarts[0];
    const startTime = new Date(startActivity.created_at);
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const { data: miningComplete } = await supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'mining_complete')
      .eq('status', 'completed')
      .gt('created_at', startActivity.created_at)
      .limit(1);

    if (miningComplete && miningComplete.length > 0) return null;

    const now = new Date();
    if (now >= endTime) return null;

    return {
      id: startActivity.id,
      user_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'active',
      rzc_earned: 0,
      created_at: startActivity.created_at
    };
  } catch (error) {
    console.error('Error fetching active mining session:', error);
    return null;
  }
};

export const manualCompleteMiningSession = async (sessionId: number): Promise<{
  success: boolean;
  rzcEarned?: number;
  error?: string;
}> => {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;
    if (!session) return { success: false, error: 'Mining session not found' };

    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const elapsedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const rzcEarned = Math.min(elapsedHours * (50 / 24), 50);

    const { error: updateError } = await supabase
      .from('mining_sessions')
      .update({
        status: 'completed',
        rzc_earned: rzcEarned,
        completed_at: endTime.toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    const { error: activityError } = await supabase.from('activities').insert({
      user_id: session.user_id,
      type: 'mining_complete',
      amount: rzcEarned,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (activityError) throw activityError;

    return { success: true, rzcEarned };
  } catch (error: any) {
    console.error('Error manually completing mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete mining session'
    };
  }
};

export const completeMiningSession = async (sessionId: number): Promise<{
  success: boolean;
  rzcEarned?: number;
  error?: string;
}> => {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;
    if (!session) return { success: false, error: 'Mining session not found' };

    const rzcEarned = 50.0; // Hardcoded reward for auto-completion?

    const { error: updateError } = await supabase
      .from('mining_sessions')
      .update({
        status: 'completed',
        rzc_earned: rzcEarned,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    const { error: activityError } = await supabase.from('activities').insert({
      user_id: session.user_id,
      type: 'mining_complete',
      amount: rzcEarned,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (activityError) throw activityError;

    return { success: true, rzcEarned };
  } catch (error: any) {
    console.error('Error completing mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete mining session'
    };
  }
};

export const updateMiningProgress = async (sessionId: number, rzcEarned: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('mining_sessions')
      .update({ rzc_earned: rzcEarned })
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating mining progress:', error);
    return false;
  }
};

export const getUserRZCBalance = async (userId: number): Promise<{
  claimableRZC: number;
  totalEarned: number;
  claimedRZC: number;
  lastClaimTime?: string;
}> => {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('type, amount, created_at')
      .eq('user_id', userId)
      .in('type', ['rzc_claim', 'mining_complete', 'mining_rig_mk2', 'extended_session'])
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let claimableRZC = 0;
    let totalEarned = 0;
    let claimedRZC = 0;
    let lastClaimTime: string | undefined;

    activities?.forEach(activity => {
      if (activity.type === 'rzc_claim') {
        claimedRZC += activity.amount; // Note: upgrades might have negative amounts
        if (!lastClaimTime && activity.amount > 0) lastClaimTime = activity.created_at;
      } else if (activity.type === 'mining_complete') {
        claimableRZC += activity.amount;
        totalEarned += activity.amount;
      }
    });

    console.log('RZC Balance Calculation:', {
      userId,
      activities: activities?.length || 0,
      claimableRZC,
      totalEarned,
      claimedRZC,
      lastClaimTime
    });

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ available_balance: claimedRZC })
        .eq('id', userId);

      if (updateError) console.error('Error updating available_balance:', updateError);
    } catch (updateErr) {
      console.error('Error updating user available_balance:', updateErr);
    }

    return {
      claimableRZC,
      totalEarned,
      claimedRZC,
      lastClaimTime
    };
  } catch (error) {
    console.error('Error fetching RZC balance:', error);
    return {
      claimableRZC: 0,
      totalEarned: 0,
      claimedRZC: 0
    };
  }
};

export const claimRZCRewards = async (userId: number, amount: number): Promise<{
  success: boolean;
  error?: string;
  transactionId?: string;
}> => {
  try {
    const balance = await getUserRZCBalance(userId);
    
    if (balance.claimableRZC < amount) {
      return { success: false, error: 'Insufficient RZC balance' };
    }

    const { error: claimError } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim',
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (claimError) throw claimError;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_earned: balance.totalEarned + amount,
        available_balance: balance.claimedRZC + amount,
        last_claim_time: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return {
      success: true,
      transactionId: `RZC-${Date.now()}`
    };
  } catch (error: any) {
    console.error('Error claiming RZC rewards:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim RZC rewards'
    };
  }
};

export const getMiningHistory = async (userId: number, limit: number = 10): Promise<MiningSession[]> => {
  try {
    const { data, error } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching mining history:', error);
    return [];
  }
};

export const processExpiredMiningSessions = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('status', 'active')
      .lt('end_time', now);

    if (fetchError) throw fetchError;

    for (const session of expiredSessions || []) {
      await completeMiningSession(session.id);
    }
  } catch (error) {
    console.error('Error processing expired mining sessions:', error);
  }
};

export const initializeFreeMiningPeriod = async (userId: number): Promise<{
  success: boolean;
  error?: string;
  freeMiningData?: FreeMiningPeriod;
}> => {
  try {
    const { error: dbError } = await supabase.rpc('initialize_or_update_free_mining_period', {
      p_user_id: userId
    });

    if (dbError) {
      console.error('Database error initializing free mining period:', dbError);
      return {
        success: false,
        error: dbError.message || 'Failed to initialize free mining period'
      };
    }

    const status = await getFreeMiningStatus(userId);
    
    return {
      success: true,
      freeMiningData: {
        user_id: userId,
        start_date: new Date().toISOString(),
        end_date: status.endDate || new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
        grace_period_end: status.gracePeriodEnd || new Date(Date.now() + 107 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: status.isActive,
        sessions_used: status.sessionsUsed,
        max_sessions: status.maxSessions,
        is_in_grace_period: status.isInGracePeriod,
        days_remaining: status.daysRemaining,
        sessions_remaining: status.sessionsRemaining,
        can_mine: status.canMine,
        reason: status.reason || 'Free mining period active'
      }
    };
  } catch (error: any) {
    console.error('Error initializing free mining period:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize free mining period'
    };
  }
};

export const getFreeMiningStatus = async (userId: number): Promise<{
  isActive: boolean;
  daysRemaining: number;
  sessionsUsed: number;
  maxSessions: number;
  sessionsRemaining: number;
  canMine: boolean;
  endDate?: string;
  gracePeriodEnd?: string;
  isInGracePeriod: boolean;
  reason: string;
}> => {
  try {
    const { data, error } = await supabase.rpc('get_free_mining_status', {
      p_user_id: userId
    });

    if (error) {
      console.error('Database error fetching free mining status:', error);
      return {
        isActive: false, daysRemaining: 0, sessionsUsed: 0, maxSessions: 0,
        sessionsRemaining: 0, canMine: false, isInGracePeriod: false,
        reason: 'Error fetching mining status'
      };
    }

    const result = data?.[0];
    if (!result) {
      await initializeFreeMiningPeriod(userId);
      const { data: retryData } = await supabase.rpc('get_free_mining_status', { p_user_id: userId });
      const retryResult = retryData?.[0];
      
      return {
        isActive: retryResult?.is_active || false,
        daysRemaining: retryResult?.days_remaining || 0,
        sessionsUsed: retryResult?.sessions_used || 0,
        maxSessions: retryResult?.max_sessions || 100,
        sessionsRemaining: retryResult?.sessions_remaining || 0,
        canMine: retryResult?.can_mine || false,
        endDate: retryResult?.end_date,
        gracePeriodEnd: retryResult?.grace_period_end,
        isInGracePeriod: retryResult?.is_in_grace_period || false,
        reason: retryResult?.reason || 'Free mining period active'
      };
    }

    return {
      isActive: result.is_active,
      daysRemaining: result.days_remaining,
      sessionsUsed: result.sessions_used,
      maxSessions: result.max_sessions,
      sessionsRemaining: result.sessions_remaining,
      canMine: result.can_mine,
      endDate: result.end_date,
      gracePeriodEnd: result.grace_period_end,
      isInGracePeriod: result.is_in_grace_period,
      reason: result.reason
    };
  } catch (error) {
    console.error('Error fetching free mining status:', error);
    return {
      isActive: false, daysRemaining: 0, sessionsUsed: 0, maxSessions: 0,
      sessionsRemaining: 0, canMine: false, isInGracePeriod: false,
      reason: 'Error fetching mining status'
    };
  }
};

export const updateFreeMiningSessionCount = async (userId: number): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('increment_mining_session_count', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error updating free mining session count:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error updating free mining session count:', error);
    return false;
  }
};

export const canUserStartMining = async (userId: number): Promise<{
  canMine: boolean;
  reason?: string;
  freeMiningStatus?: any;
}> => {
  try {
    const freeMiningStatus = await getFreeMiningStatus(userId);
    
    if (!freeMiningStatus.canMine) {
      return {
        canMine: false,
        reason: freeMiningStatus.reason,
        freeMiningStatus
      };
    }

    const activeSession = await getActiveMiningSession(userId);
    if (activeSession) {
      return {
        canMine: false,
        reason: 'You already have an active mining session.',
        freeMiningStatus
      };
    }

    return {
      canMine: true,
      freeMiningStatus
    };
  } catch (error) {
    console.error('Error checking if user can start mining:', error);
    return {
      canMine: false,
      reason: 'Error checking mining eligibility.'
    };
  }
};

export const recordMiningActivity = async (
  userId: number,
  activityType: 'mining_start' | 'mining_complete' | 'mining_claim',
  amount: number = 0,
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: activityType,
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording mining activity:', error);
    return false;
  }
};

export const recordUpgradeActivity = async (userId: number, cost: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'upgrade_purchase',
      amount: cost,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording upgrade activity:', error);
    return false;
  }
};

export const getPassiveIncomeBoostCost = (level: number): number => {
  // Formula: 100 * 2^(level - 1)
  return 100 * Math.pow(2, level - 1);
};

export const getPassiveIncomeBoostLevel = async (userId: number): Promise<number> => {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('metadata')
      .eq('user_id', userId)
      .eq('type', 'passive_income_boost')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!activities || activities.length === 0) return 0;

    const latestActivity = activities[0];
    const level = latestActivity.metadata?.level || 1;
    return typeof level === 'number' ? level : 1;
  } catch (error) {
    console.error('Error getting passive income boost level:', error);
    return 0;
  }
};

export const purchaseUpgrade = async (
  userId: number,
  upgradeType: 'mining_rig_mk2' | 'extended_session' | 'passive_income_boost',
  cost?: number,
  level?: number,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (upgradeType === 'passive_income_boost') {
      if (level === undefined || level < 1 || level > 10) {
        return { success: false, error: 'Invalid level. Must be between 1 and 10.' };
      }

      const currentLevel = await getPassiveIncomeBoostLevel(userId);
      
      if (level <= currentLevel) {
        return { success: false, error: `You already have level ${currentLevel}. Upgrade to level ${currentLevel + 1} or higher.` };
      }

      const calculatedCost = getPassiveIncomeBoostCost(level);
      const finalCost = cost || calculatedCost;

      const { claimedRZC } = await getUserRZCBalance(userId);
      if (claimedRZC < finalCost) {
        return { success: false, error: 'Insufficient validated RZC balance.' };
      }

      const { error: deductError } = await supabase.from('activities').insert({
        user_id: userId,
        type: 'rzc_claim',
        amount: -finalCost,
        status: 'completed',
      });
      if (deductError) throw deductError;

      const { error: balanceUpdateError } = await supabase
        .from('users')
        .update({
          available_balance: claimedRZC - finalCost
        })
        .eq('id', userId);

      if (balanceUpdateError) {
        console.error('Error updating available_balance after passive income boost:', balanceUpdateError);
      }

      const { error: recordError } = await supabase.from('activities').insert({
        user_id: userId,
        type: 'passive_income_boost',
        amount: finalCost,
        status: 'completed',
        metadata: { level: level }
      });

      if (recordError) {
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'rzc_claim',
          amount: finalCost,
          status: 'completed',
        });
        throw recordError;
      }

      return { success: true };
    }

    if (!cost) {
      return { success: false, error: 'Cost is required for this upgrade type.' };
    }

    const { data: existingUpgrade, error: checkError } = await supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', upgradeType)
      .limit(1);

    if (checkError) throw checkError;
    if (existingUpgrade && existingUpgrade.length > 0) {
      return { success: false, error: 'Upgrade already purchased.' };
    }

    const { claimedRZC } = await getUserRZCBalance(userId);
    if (claimedRZC < cost) {
      return { success: false, error: 'Insufficient validated RZC balance.' };
    }

    const { error: deductError } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim', 
      amount: -cost,
      status: 'completed',
    });
    if (deductError) throw deductError;

    const { error: balanceUpdateError } = await supabase
      .from('users')
      .update({
        available_balance: claimedRZC - cost
      })
      .eq('id', userId);

    if (balanceUpdateError) {
      console.error('Error updating available_balance after upgrade purchase:', balanceUpdateError);
    }
    
    const { error: recordError } = await supabase.from('activities').insert({
      user_id: userId,
      type: upgradeType,
      amount: cost,
      status: 'completed',
    });

    if (recordError) {
      console.error(`CRITICAL: Failed to record upgrade activity for ${upgradeType}. Attempting to refund deduction.`);
      await supabase.from('activities').insert({
        user_id: userId,
        type: 'rzc_claim',
        amount: cost,
        status: 'completed',
      });
      throw recordError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error purchasing upgrade:', error);
    return { success: false, error: error.message };
  }
};

export const generatePassiveIncome = async (userId: number): Promise<{ success: boolean; amount?: number; error?: string }> => {
  try {
    const level = await getPassiveIncomeBoostLevel(userId);
    
    if (level === 0) {
      return { success: false, error: 'No passive income boost active.' };
    }

    const amount = 10 * level;

    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'mining_complete',
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;

    return { success: true, amount };
  } catch (error: any) {
    console.error('Error generating passive income:', error);
    return { success: false, error: error.message };
  }
};

export const recordRZCClaimActivity = async (userId: number, amount: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim',
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording RZC claim activity:', error);
    return false;
  }
};

export const getUserActivities = async (
  userId: number,
  activityTypes?: string[],
  limit: number = 20
): Promise<any[]> => {
  try {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activityTypes && activityTypes.length > 0) {
      query = query.in('type', activityTypes);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};