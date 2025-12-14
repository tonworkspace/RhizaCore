import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase initialization
const supabaseUrl = "https://qaviehvidwbntwrecyky.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// // Supabase initialization
// const supabaseUrl = "https://qaviehvidwbntwrecyky.supabase.co";
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmllaHZpZHdibnR3cmVjeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzE2MzYsImV4cCI6MjA3NTgwNzYzNn0.wnX-xdpD_P-Pxt-prIkpiX3DX8glSLwXZhbQWeUmc0g";

// export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// const supabaseUrl = "https://hxkmknvxicjqkbkfrguc.supabase.co";
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a21rbnZ4aWNqcWtia2ZyZ3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyODAyNDEsImV4cCI6MjA1MTg1NjI0MX0.hW77UDF-v8Q04latr7TktoUC1b-6Qeo64ZSXBvtEFmg";
// export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);


// Database Types
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

// Utility function to format amounts in USD
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Define rank requirements and rewards
export const RANK_REQUIREMENTS = {
  NOVICE: {
    title: 'Novice',
    minStake: 0,
    minEarnings: 0,
    color: 'gray',
    weeklyBonus: 0,
    icon: 'sparkle'
  },
  EXPLORER: {
    title: 'Explorer',
    minStake: 20,
    minEarnings: 100,
    color: 'green',
    weeklyBonus: 5,
    icon: 'compass'
  },
  VOYAGER: {
    title: 'Voyager',
    minStake: 50,
    minEarnings: 500,
    color: 'blue',
    weeklyBonus: 10,
    icon: 'rocket'
  },
  GUARDIAN: {
    title: 'Guardian',
    minStake: 100,
    minEarnings: 2000,
    color: 'purple',
    weeklyBonus: 20,
    icon: 'shield'
  },
  SOVEREIGN: {
    title: 'Sovereign',
    minStake: 500,
    minEarnings: 10000,
    color: 'yellow',
    weeklyBonus: 50,
    icon: 'crown'
  },
  CELESTIAL: {
    title: 'Celestial',
    minStake: 1000,
    minEarnings: 25000,
    color: 'cyan',
    weeklyBonus: 100,
    icon: 'star'
  },
  LEGENDARY: {
    title: 'Legendary',
    minStake: 20000,
    minEarnings: 500000,
    color: 'red',
    weeklyBonus: 200,
    icon: 'star'
  },
  SUPERNOVA: {
    title: 'Supernova',
    minStake: 50000,
    minEarnings: 1000000,
    color: 'red',
    weeklyBonus: 200,
    icon: 'star'
  }
};

// Function to calculate user's rank
export const calculateUserRank = async (userId: number) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select(`
        total_earned,
        balance
      `)
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

// Function to update user's rank
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

    // Process weekly rank bonus if eligible
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

// Function to process weekly rank bonus
const processWeeklyRankBonus = async (userId: number, bonusAmount: number) => {
  try {
    // Check if user already received bonus this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: lastBonus } = await supabase
      .from('rank_bonuses')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())
      .single();

    if (lastBonus) return false; // Already received bonus this week

    // Process bonus
    const { error } = await supabase
      .from('rank_bonuses')
      .insert({
        user_id: userId,
        amount: bonusAmount,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update user's earnings
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

// Database helper functions
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
      rank: 'NOVICE', // Updated default rank
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

// Update the updateUserBalance function to consider total earnings
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

// First, execute the stored procedure creation once in your database
export const setupStoredProcedures = async (userId: number) => {
  // First create referral procedure
  const { error: referralError } = await supabase.rpc('process_referral_v2', {
    p_sponsor_id: userId,
    p_referred_id: userId
  });

  // Then create team volume procedures
  const { error: volumeError } = await supabase.rpc('update_team_volumes', {
    p_sponsor_ids: [userId],
    p_amount: 0
  });

  return !referralError && !volumeError;
};

// Add constants to match bot backend
export const SPEED_BOOST_MULTIPLIER = 2;
export const FAST_START_BONUS_AMOUNT = 1; // 1 TON
export const FAST_START_REQUIRED_REFERRALS = 2;
export const FAST_START_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds


// Update STAKING_CONFIG to include weekly rates
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

// Add function to calculate current ROI based on stake duration
export const calculateDailyROI = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) {
    return STAKING_CONFIG.DAILY_RATES.WEEK1;
  } else if (daysDiff <= 14) {
    return STAKING_CONFIG.DAILY_RATES.WEEK2;
  } else if (daysDiff <= 21) {
    return STAKING_CONFIG.DAILY_RATES.WEEK3;
  } else {
    return STAKING_CONFIG.DAILY_RATES.WEEK4;
  }
};

// Update calculateDailyRewards function for more realistic earnings
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

  // Check for duplicate payout within last 24 hours
  const lastPayout = new Date(stake.last_payout);
  const now = new Date();
  const hoursSinceLastPayout = (now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastPayout < 24) {
    console.log('Already paid out in last 24 hours');
    return 0;
  }

  // Dynamic ROI based on stake amount and duration
  let baseRate = 0.01; // 1% base daily rate
  
  // Adjust rate based on stake amount (higher stakes get slightly lower rates)
  if (stake.amount >= 10000) baseRate *= 0.8;  // 0.8% for 10k+
  else if (stake.amount >= 5000) baseRate *= 0.85; // 0.85% for 5k+
  else if (stake.amount >= 1000) baseRate *= 0.9;  // 0.9% for 1k+
  
  // Calculate days since stake start
  const startDate = new Date(stake.start_date);
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Gradually decrease rate over time
  const durationMultiplier = Math.max(0.7, 1 - (daysSinceStart / 200)); // Minimum 70% of base rate
  let dailyRate = baseRate * durationMultiplier;

  // Apply rank bonus if applicable
  const rankBonus = getRankBonus(stake.users.rank);
  dailyRate *= (1 + rankBonus);

  // Calculate daily earning with all multipliers
  let dailyEarning = stake.amount * dailyRate;
  
  // Apply speed boost if active
  if (stake.speed_boost_active) {
    dailyEarning *= 1.5; // 50% boost
  }

  // Apply maximum daily earning cap based on stake size
  const maxDailyEarning = Math.min(
    stake.amount * 0.03, // Max 3% per day
    EARNING_LIMITS.daily_roi_max
  );
  
  const cappedEarning = Math.min(dailyEarning, maxDailyEarning);

  // Update stake record
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

  // Log the earning event
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

// Add helper function for rank bonuses
const getRankBonus = (rank: string): number => {
  switch (rank) {
    case 'GUARDIAN': return 0.1; // +10%
    case 'SOVEREIGN': return 0.15; // +15%
    case 'CELESTIAL': return 0.2; // +20%
    default: return 0;
  }
};

// Add Speed Boost functions
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

// Add error tracking and recovery system
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

    // Log SBT earning
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

// Function to generate unique sponsor codes
export const generateSponsorCode = (userId: number, username?: string): string => {
  // Create a base code from user ID and username
  const baseId = userId.toString().padStart(4, '0');
  const usernamePart = username ? username.substring(0, 3).toUpperCase() : 'USR';
  
  // Generate a short unique identifier
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${usernamePart}-${baseId}${randomPart}`.substring(0, 8);
};

// Function to ensure user has a sponsor code
export const ensureUserHasSponsorCode = async (userId: number, username?: string): Promise<string> => {
  try {
    // Check if user already has a sponsor code
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('sponsor_code, username')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return '';
    }

    // If user already has a sponsor code, return it
    if (user?.sponsor_code) {
      return user.sponsor_code;
    }

    // Check if this is the first user in the system
    const { data: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
      
    const { data: firstUser } = await supabase
      .from('users')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // Generate appropriate sponsor code
    let sponsorCode: string;
    if (totalUsers?.length === 1 || firstUser?.id === userId) {
      // First user gets a special admin code
      sponsorCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
    } else {
      // Regular users get normal sponsor codes
      sponsorCode = generateSponsorCode(userId, username || user?.username);
    }
    
    // Update user with sponsor code
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

// Function to generate default sponsor code for first user
export const generateDefaultSponsorCode = async (userId: number): Promise<string> => {
  try {
    const defaultCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
    
    // Update user with default sponsor code
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

// Add function to process referral rewards for staking
export const processReferralStakingRewards = async (userId: number, stakedAmount: number): Promise<void> => {
  try {
    // Get user's sponsor information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('sponsor_id, username')
      .eq('id', userId)
      .single();

    if (userError || !user || !user.sponsor_id) {
      console.log('No sponsor found for user:', userId);
      return;
    }

    // Calculate reward amount (1000 RZC or 10% of staked amount, whichever is higher)
    const rewardAmount = Math.max(1000, stakedAmount * 0.1);

    // Update sponsor's balance with TAPPS reward
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id: user.sponsor_id,
      amount: rewardAmount
    });

    if (balanceError) {
      console.error('Error updating sponsor balance:', balanceError);
      return;
    }

    // Update sponsor's total earnings
    const { error: earningsError } = await supabase.rpc('update_user_earnings', {
      user_id: user.sponsor_id,
      referral_amount: rewardAmount
    });

    if (earningsError) {
      console.error('Error updating sponsor earnings:', earningsError);
    }

    // Log the referral reward
    await supabase.from('activities').insert({
      user_id: user.sponsor_id,
      type: 'referral_staking_reward',
      amount: rewardAmount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    // Update referral status to active if not already
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

export const logEarningEvent = async (
  userId: number,
  type: 'roi' | 'referral' | 'bonus',
  amount: number,
  metadata: any
) => {
  await supabase.from('earning_logs').insert({
    user_id: userId,
    type,
    amount,
    metadata,
    timestamp: new Date().toISOString()
  });
};

export const EARNING_LIMITS = {
  daily_roi_max: 1000,
  referral_commission_max: 500,
  speed_boost_duration: 24 * 60 * 60 * 1000, // 24 hours
  minimum_withdrawal: 1
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
    // Log discrepancy and correct
    await supabase.from('earning_discrepancies').insert({
      user_id: userId,
      calculated: calculatedTotal,
      recorded: user.total_earned,
      timestamp: new Date().toISOString()
    });
  }
};

export const processEarnings = async (
  userId: number, 
  stakeId: number, 
  amount: number,
  type: 'roi' | 'referral' | 'bonus' = 'roi'
) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Get current stake info
    const { data: stake } = await supabase
      .from('stakes')
      .select('amount, total_earned')
      .eq('id', stakeId)
      .maybeSingle();

    if (!stake) return false;

    // Calculate new cycle progress
    const newTotalEarned = stake.total_earned + amount;
    const cycleProgress = (newTotalEarned / stake.amount) * 100;

    // Check if cycle completion (300%) is reached
    if (cycleProgress >= 300) {
      // Handle cycle completion
      await handleCycleCompletion(userId, stakeId, stake.amount);
      return true;
    }

    // Process normal earnings
    const { error } = await supabase.rpc('process_earnings', {
      p_amount: amount,
      p_stake_id: stakeId,
      p_timestamp: timestamp,
      p_user_id: userId,
      p_type: type
    });

    if (error) throw error;

    // Update cycle progress
    await supabase
      .from('stakes')
      .update({ 
        cycle_progress: cycleProgress,
        total_earned: newTotalEarned
      })
      .eq('id', stakeId);

    // Log the earning event
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

// Add new function to handle cycle completion
const handleCycleCompletion = async (userId: number, stakeId: number, stakeAmount: number) => {
  try {
    // Deactivate current stake
    await supabase
      .from('stakes')
      .update({ 
        is_active: false, 
        cycle_completed: true,
        cycle_completed_at: new Date().toISOString()
      })
      .eq('id', stakeId);

    // Calculate distribution
    const reinvestAmount = stakeAmount * 0.2; // 20% to reinvestment
    const glpAmount = stakeAmount * 0.1; // 10% to GLP
    const stkAmount = stakeAmount * 0.1; // 10% to STK

    // Process distributions
    await Promise.all([
      // Add to reinvestment balance
      supabase.rpc('increment_reinvestment_balance', {
        user_id: userId,
        amount: reinvestAmount
      }),
      // Add to GLP pool
      supabase.rpc('increment_glp_pool', {
        p_amount: glpAmount
      }),
      // Add STK tokens
      supabase.rpc('increment_sbt', {
        user_id: userId,
        amount: stkAmount
      })
    ]);

    // Log cycle completion
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
      p_team_volume_percent: 2, // Only 2% of team withdrawal volume counts
      p_reset_interval_days: 7  // Reset every 7 days
    });

    if (error) throw error;
    return data;
  }
};

// Add cycle tracking
export const checkAndHandleCycle = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = stake.total_earned / stake.amount * 100;
    if (totalReturn >= 300) {
      // Handle cycle completion
      await supabase.rpc('complete_stake_cycle', { 
        p_stake_id: stake.id,
        p_user_id: userId 
      });
    }
  }
};

// Add these constants for withdrawal fees
const WITHDRAWAL_FEES = {
  GLP: 0.10,  // 10% to Global Leadership Pool
  STK: 0.10,  // 10% to Reputation Points ($STK)
  REINVEST: 0.20  // 20% to re-investment wallet
};

// Add this function to handle withdrawal fee distribution
export const processWithdrawalFees = async (userId: number, amount: number) => {
  try {
    const glpAmount = amount * WITHDRAWAL_FEES.GLP;
    const stkAmount = amount * WITHDRAWAL_FEES.STK;
    const reinvestAmount = amount * WITHDRAWAL_FEES.REINVEST;
    const userAmount = amount - glpAmount - stkAmount - reinvestAmount;

    // Update GLP pool
    await supabase.rpc('increment_glp_pool', {
      p_amount: glpAmount
    });

    // Add STK (Reputation Points) to user
    await supabase.rpc('increment_sbt', {
      user_id: userId,
      amount: stkAmount
    });

    // Add to user's reinvestment wallet
    await supabase.rpc('increment_reinvestment_balance', {
      user_id: userId,
      amount: reinvestAmount
    });

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

// Update the existing withdrawal function
export const processWithdrawal = async (userId: number, amount: number): Promise<boolean> => {
  try {
    // Validate minimum withdrawal
    if (amount < EARNING_LIMITS.minimum_withdrawal) {
      console.error('Withdrawal amount below minimum');
      return false;
    }

    // Get user's current earnings
    const { data: user } = await supabase
      .from('users')
      .select('available_earnings')
      .eq('id', userId)
      .single();

    if (!user || user.available_earnings < amount) {
      console.error('Insufficient available earnings');
      return false;
    }

    // Process fees and get final user amount
    const feeResult = await processWithdrawalFees(userId, amount);
    if (!feeResult.success) return false;

    // Begin transaction
    const { error } = await supabase.rpc('process_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_user_amount: feeResult.userAmount,
      p_glp_amount: feeResult?.fees?.glp ?? 0,
      p_stk_amount: feeResult?.fees?.stk ?? 0,
      p_reinvest_amount: feeResult?.fees?.reinvest ?? 0
    });

    if (error) throw error;

    // Log the withdrawal
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

// Add this function to handle 300% cycle completion
export const checkCycleCompletion = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = (stake.total_earned / stake.amount) * 100;
    if (totalReturn >= 300) {
      // Deactivate stake and notify user
      await supabase
        .from('stakes')
        .update({ is_active: false, cycle_completed: true })
        .eq('id', stake.id);
        
      // Add to reinvestment balance
      await supabase.rpc('increment_reinvestment_balance', {
        user_id: userId,
        amount: stake.amount * 0.2 // 20% to reinvestment
      });
    }
  }
};

// Weekly Withdrawal System Functions
export const checkWeeklyWithdrawalEligibility = async (userId: number): Promise<{
  canWithdraw: boolean;
  nextWithdrawalDate: Date | null;
  daysUntilWithdrawal: number;
  hasPendingWithdrawal: boolean;
  pendingWithdrawalId?: number;
}> => {
  try {
    // Check for pending withdrawals first
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from('withdrawals')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingError) throw pendingError;

    // If there's a pending withdrawal, user cannot withdraw
    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return {
        canWithdraw: false,
        nextWithdrawalDate: null,
        daysUntilWithdrawal: 0,
        hasPendingWithdrawal: true,
        pendingWithdrawalId: pendingWithdrawals[0].id
      };
    }

    // Check weekly withdrawal eligibility
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
    // Check eligibility first
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

    // Validate minimum withdrawal
    if (amount < 1) {
      return {
        success: false,
        error: 'Minimum withdrawal amount is 1 RZC'
      };
    }

    // Get user's current claimable balance (total_withdrawn)
    const { data: user } = await supabase
      .from('users')
      .select('total_withdrawn')
      .eq('id', userId)
      .single();

    if (!user || user.total_withdrawn < amount) {
      return {
        success: false,
        error: 'Insufficient claimable balance'
      };
    }

    // Create withdrawal request
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

    // Update weekly withdrawal tracking
    const { error: updateError } = await supabase.rpc('update_weekly_withdrawal_tracking', {
      user_id_param: userId,
      withdrawal_amount: amount
    });

    if (updateError) {
      console.error('Error updating weekly withdrawal tracking:', updateError);
      // Don't fail the withdrawal if tracking update fails
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

// Function to approve a withdrawal and subtract from claimable balance
export const approveWithdrawal = async (withdrawalId: number): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    if (withdrawal.status !== 'PENDING') {
      return { success: false, error: 'Withdrawal is not pending' };
    }

    // Update withdrawal status to COMPLETED
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'COMPLETED',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    // Subtract from user's available earnings (claimable balance) and add to total_payout
    const { error: balanceError } = await supabase.rpc('update_user_balance_after_withdrawal', {
      user_id: withdrawal.user_id,
      withdrawal_amount: withdrawal.amount
    });

    if (balanceError) {
      console.error('Error updating user balance:', balanceError);
      // Revert withdrawal status if balance update fails
      await supabase
        .from('withdrawals')
        .update({ status: 'PENDING' })
        .eq('id', withdrawalId);
      
      return { success: false, error: 'Failed to update user balance' };
    }

    // Create activity record for the withdrawal
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

// Function to reject a withdrawal
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

// Get user payout statistics
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

// Get platform payout statistics
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

    // Get qualified participants based on stake and earnings
    const { data: participants } = await supabase
      .from('users')
      .select(`
        id,
        team_volume,
        withdrawal_volume:withdrawals(sum)
      `)
      .gte('balance', 100); // Minimum 100 TON staked

    if (!participants?.length) {
      console.log('No qualified participants');
      return;
    }

    // Calculate points for each participant
    const participantPoints = participants.map(p => ({
      user_id: p.id,
      team_volume: p.team_volume,
      points: calculateGLPPoints(
        p.team_volume, 
        p.withdrawal_volume?.[0]?.sum || 0
      )
    }));

    // Calculate total points
    const totalPoints = participantPoints.reduce((sum, p) => sum + p.points, 0);
    
    // Distribute rewards
    const distributions = participantPoints.map(p => ({
      user_id: p.user_id,
      amount: (p.points / totalPoints) * poolData.amount,
      points: p.points,
      distribution_date: new Date().toISOString()
    }));

    // Process distributions in a transaction
    const { error } = await supabase.rpc('process_glp_distribution', {
      p_distributions: distributions,
      p_pool_amount: poolData.amount
    });

    if (error) throw error;

    // Log distribution
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

// Helper function to calculate GLP points
const calculateGLPPoints = (
  teamVolume: number,
  withdrawalVolume: number
): number => {
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

// Add deposit validation and processing
export const processDeposit = async (userId: number, amount: number, txHash: string): Promise<boolean> => {
  try {
    // 1. Validate the transaction first
    const { data: existingDeposit } = await supabase
      .from('deposits')
      .select('id')
      .eq('transaction_hash', txHash)
      .single();

    if (existingDeposit) {
      console.error('Duplicate transaction detected');
      return false;
    }

    // 2. Start a transaction to ensure data consistency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, total_deposit')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user data:', userError);
      return false;
    }

    // 3. Create deposit record with pending status
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

    // 4. Update user balance atomically
    const { error: updateError } = await supabase.rpc('update_user_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_deposit_id: deposit.id
    });

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      // Rollback deposit status
      await supabase
        .from('deposits')
        .update({ status: 'failed' })
        .eq('id', deposit.id);
      return false;
    }

    // 5. Process referral rewards for staking
    await processReferralStakingRewards(userId, amount);

    // 6. Log the activity
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

// Add balance reconciliation function
export const reconcileUserBalance = async (userId: number): Promise<boolean> => {
  try {
    // Get all confirmed deposits
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get all confirmed withdrawals
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Calculate correct balance
    const totalDeposits = deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
    const correctBalance = totalDeposits - totalWithdrawals;

    // Get current user balance
    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!user) return false;

    // If there's a discrepancy, log it and correct the balance
    if (Math.abs(user.balance - correctBalance) > 0.000001) {
      // Log the discrepancy
      await supabase.from('balance_discrepancies').insert({
        user_id: userId,
        recorded_balance: user.balance,
        calculated_balance: correctBalance,
        difference: correctBalance - user.balance,
        timestamp: new Date().toISOString()
      });

      // Update to correct balance
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
    // Delete user from database
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    // Clear local storage data
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

// ============================================================================
// MINING SYSTEM FUNCTIONS
// ============================================================================

// Mining session interface
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

// RZC balance interface
export interface RZCBalance {
  user_id: number;
  claimable_rzc: number;
  total_rzc_earned: number;
  last_claim_time?: string;
  created_at: string;
  updated_at: string;
}

// Start a new mining session (simplified version using activities)
export const startMiningSession = async (userId: number): Promise<{
  success: boolean;
  sessionId?: number;
  error?: string;
}> => {
  try {
    // Check if user can start mining (free period + no active session)
    const miningCheck = await canUserStartMining(userId);
    if (!miningCheck.canMine) {
      return {
        success: false,
        error: miningCheck.reason || 'Cannot start mining session'
      };
    }

    // Record mining start activity
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
      sessionId: activity.id // Use activity ID as session ID
    };
  } catch (error: any) {
    console.error('Error starting mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to start mining session'
    };
  }
};

// Start a new mining session without free-period checks (unrestricted/auto mode)
export const startMiningSessionUnrestricted = async (userId: number): Promise<{
  success: boolean;
  sessionId?: number;
  error?: string;
}> => {
  try {
    // Avoid duplicate active sessions: if an active session exists, return success with that id
    const existing = await getActiveMiningSession(userId);
    if (existing) {
      return { success: true, sessionId: existing.id };
    }

    // Directly record mining start activity
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

// Get active mining session (simplified version using activities)
export const getActiveMiningSession = async (userId: number): Promise<MiningSession | null> => {
  try {
    // Get the most recent mining_start activity that doesn't have a corresponding mining_complete
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

    // Check if there's a mining_complete activity after this mining_start
    const { data: miningComplete } = await supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'mining_complete')
      .eq('status', 'completed')
      .gt('created_at', startActivity.created_at)
      .limit(1);

    // If there's a mining_complete after this mining_start, session is not active
    if (miningComplete && miningComplete.length > 0) return null;

    // Check if session has expired (24 hours)
    const now = new Date();
    if (now >= endTime) return null;

    // Return a mock MiningSession object
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

// Update mining session progress
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

// Manually complete mining session (user-initiated)
export const manualCompleteMiningSession = async (sessionId: number): Promise<{
  success: boolean;
  rzcEarned?: number;
  error?: string;
}> => {
  try {
    // Get session details
    const { data: session, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;
    if (!session) {
      return { success: false, error: 'Mining session not found' };
    }

    // Calculate RZC earned based on actual time elapsed
    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const elapsedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const rzcEarned = Math.min(elapsedHours * (50 / 24), 50); // 50 RZC per day, capped at 50

    // Update session as completed
    const { error: updateError } = await supabase
      .from('mining_sessions')
      .update({
        status: 'completed',
        rzc_earned: rzcEarned,
        completed_at: endTime.toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Add RZC to user's claimable balance by recording mining completion activity
    const { error: activityError } = await supabase.from('activities').insert({
      user_id: session.user_id,
      type: 'mining_complete',
      amount: rzcEarned,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (activityError) throw activityError;

    return {
      success: true,
      rzcEarned
    };
  } catch (error: any) {
    console.error('Error manually completing mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete mining session'
    };
  }
};

// Complete mining session
export const completeMiningSession = async (sessionId: number): Promise<{
  success: boolean;
  rzcEarned?: number;
  error?: string;
}> => {
  try {
    // Get session details
    const { data: session, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;
    if (!session) {
      return { success: false, error: 'Mining session not found' };
    }

    // Calculate final RZC earned (50 RZC per day - consistent with frontend)
    const rzcEarned = 50.0;

    // Update session as completed
    const { error: updateError } = await supabase
      .from('mining_sessions')
      .update({
        status: 'completed',
        rzc_earned: rzcEarned,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Add RZC to user's claimable balance by recording mining completion activity
    const { error: activityError } = await supabase.from('activities').insert({
      user_id: session.user_id,
      type: 'mining_complete',
      amount: rzcEarned,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (activityError) throw activityError;

    return {
      success: true,
      rzcEarned
    };
  } catch (error: any) {
    console.error('Error completing mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete mining session'
    };
  }
};

// Get user's RZC balance (simplified version using activities table)
export const getUserRZCBalance = async (userId: number): Promise<{
  claimableRZC: number;
  totalEarned: number;
  claimedRZC: number;
  lastClaimTime?: string;
}> => {
  try {
    // Get all RZC-related activities
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

    // Process activities to calculate balances
    activities?.forEach(activity => {
      if (activity.type === 'rzc_claim') {
        if (activity.amount > 0) {
          claimedRZC += activity.amount;
          if (!lastClaimTime) lastClaimTime = activity.created_at;
        } else {
          // Negative claim (upgrade purchase) - deduct from claimed RZC balance
          claimedRZC += activity.amount; // This will subtract since amount is negative
        }
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

    // Update the available_balance column in users table
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          available_balance: claimedRZC
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating available_balance:', updateError);
      } else {
        console.log(`Updated available_balance for user ${userId} to ${claimedRZC}`);
      }
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

// Claim RZC rewards (simplified version using activities table)
export const claimRZCRewards = async (userId: number, amount: number): Promise<{
  success: boolean;
  error?: string;
  transactionId?: string;
}> => {
  try {
    // Get current balance to check if user has enough
    const balance = await getUserRZCBalance(userId);
    
    if (balance.claimableRZC < amount) {
      return {
        success: false,
        error: 'Insufficient RZC balance'
      };
    }

    // Record the claim activity
    const { error: claimError } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim',
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (claimError) throw claimError;

    // Update user's total_earned and available_balance in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_earned: balance.totalEarned + amount,
        available_balance: balance.claimedRZC + amount, // Update available_balance immediately
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

// Get mining history
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

// Check and process expired mining sessions
export const processExpiredMiningSessions = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    // Get all active sessions that have expired
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('status', 'active')
      .lt('end_time', now);

    if (fetchError) throw fetchError;

    // Process each expired session
    for (const session of expiredSessions || []) {
      await completeMiningSession(session.id);
    }
  } catch (error) {
    console.error('Error processing expired mining sessions:', error);
  }
};

// ============================================================================
// IMPROVED FREE MINING PERIOD FUNCTIONS
// ============================================================================

// Free mining period interface
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

// Initialize free mining period for users (improved version)
export const initializeFreeMiningPeriod = async (userId: number): Promise<{
  success: boolean;
  error?: string;
  freeMiningData?: FreeMiningPeriod;
}> => {
  try {
    // Call the database function to initialize or update the free mining period
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

    // Get the updated status
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

// Get comprehensive free mining status (improved version)
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
    // Call the database function to get comprehensive status
    const { data, error } = await supabase.rpc('get_free_mining_status', {
      p_user_id: userId
    });

    if (error) {
      console.error('Database error fetching free mining status:', error);
      return {
        isActive: false,
        daysRemaining: 0,
        sessionsUsed: 0,
        maxSessions: 0,
        sessionsRemaining: 0,
        canMine: false,
        isInGracePeriod: false,
        reason: 'Error fetching mining status'
      };
    }

    const result = data?.[0];
    if (!result) {
      // If no data returned, initialize the period
      await initializeFreeMiningPeriod(userId);
      // Try again
      const { data: retryData } = await supabase.rpc('get_free_mining_status', {
        p_user_id: userId
      });
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
      isActive: false,
      daysRemaining: 0,
      sessionsUsed: 0,
      maxSessions: 0,
      sessionsRemaining: 0,
      canMine: false,
      isInGracePeriod: false,
      reason: 'Error fetching mining status'
    };
  }
};

// Update free mining session count when mining starts (improved version)
export const updateFreeMiningSessionCount = async (userId: number): Promise<boolean> => {
  try {
    // Call the database function to increment session count
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

// Check if user can start mining (improved version with grace period)
export const canUserStartMining = async (userId: number): Promise<{
  canMine: boolean;
  reason?: string;
  freeMiningStatus?: any;
}> => {
  try {
    // Get comprehensive free mining status
    const freeMiningStatus = await getFreeMiningStatus(userId);
    
    if (!freeMiningStatus.canMine) {
      return {
        canMine: false,
        reason: freeMiningStatus.reason,
        freeMiningStatus
      };
    }

    // Check for active mining session
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

// ============================================================================
// ACTIVITY RECORDING FUNCTIONS
// ============================================================================

// Record mining activity
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

// Record upgrade activity
export const recordUpgradeActivity = async (
  userId: number,
  cost: number
): Promise<boolean> => {
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
// Purchase an upgrade
// Calculate cost for passive income boost based on level (exponential growth)
export const getPassiveIncomeBoostCost = (level: number): number => {
  // Level 1: 100 RZC, Level 2: 200, Level 3: 400, Level 4: 800, etc.
  // Formula: 100 * 2^(level - 1)
  return 100 * Math.pow(2, level - 1);
};

// Get current passive income boost level for a user
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

    // Get the latest activity and check metadata for level
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
    // For passive_income_boost, handle level-based upgrades
    if (upgradeType === 'passive_income_boost') {
      if (level === undefined || level < 1 || level > 10) {
        return { success: false, error: 'Invalid level. Must be between 1 and 10.' };
      }

      // Get current level
      const currentLevel = await getPassiveIncomeBoostLevel(userId);
      
      // Check if trying to upgrade to same or lower level
      if (level <= currentLevel) {
        return { success: false, error: `You already have level ${currentLevel}. Upgrade to level ${currentLevel + 1} or higher.` };
      }

      // Calculate cost for the target level
      const calculatedCost = getPassiveIncomeBoostCost(level);
      const finalCost = cost || calculatedCost;

      // Check if user has enough *claimed* RZC (validated balance)
      const { claimedRZC } = await getUserRZCBalance(userId);
      if (claimedRZC < finalCost) {
        return { success: false, error: 'Insufficient validated RZC balance.' };
      }

      // Deduct the cost and update available_balance
      const { error: deductError } = await supabase.from('activities').insert({
        user_id: userId,
        type: 'rzc_claim',
        amount: -finalCost,
        status: 'completed',
      });
      if (deductError) throw deductError;

      // Update available_balance immediately
      const { error: balanceUpdateError } = await supabase
        .from('users')
        .update({
          available_balance: claimedRZC - finalCost
        })
        .eq('id', userId);

      if (balanceUpdateError) {
        console.error('Error updating available_balance after passive income boost:', balanceUpdateError);
      }

      // Record the upgrade with level in metadata
      const { error: recordError } = await supabase.from('activities').insert({
        user_id: userId,
        type: 'passive_income_boost',
        amount: finalCost,
        status: 'completed',
        metadata: { level: level }
      });

      if (recordError) {
        // Rollback deduction
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

    // For other upgrades (mining_rig_mk2, extended_session), use existing logic
    if (!cost) {
      return { success: false, error: 'Cost is required for this upgrade type.' };
    }

    // 1. Check if user has already purchased this upgrade
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

    // 2. Check if user has enough *claimed* RZC (validated balance)
    const { claimedRZC } = await getUserRZCBalance(userId);
    if (claimedRZC < cost) {
      return { success: false, error: 'Insufficient validated RZC balance.' };
    }

    // 3. Deduct the cost from the user's *claimed* RZC balance by creating a negative claim.
    // This is an atomic way to ensure the balance is updated correctly.
    const { error: deductError } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim', // A negative claim is a deduction
      amount: -cost, // Use a negative value to represent a deduction
      status: 'completed',
    });
    if (deductError) throw deductError;

    // Update available_balance immediately
    const { error: balanceUpdateError } = await supabase
      .from('users')
      .update({
        available_balance: claimedRZC - cost
      })
      .eq('id', userId);

    if (balanceUpdateError) {
      console.error('Error updating available_balance after upgrade purchase:', balanceUpdateError);
    }
    
    // 4. Record the specific upgrade activity itself
    const { error: recordError } = await supabase.from('activities').insert({
      user_id: userId,
      type: upgradeType, // 'mining_rig_mk2' or 'extended_session'
      amount: cost, // Record the positive cost of the upgrade
      status: 'completed',
    });

    if (recordError) {
      // If logging the upgrade fails, we should try to revert the deduction.
      // This is a simplistic rollback attempt. A true transaction would be better.
      console.error(`CRITICAL: Failed to record upgrade activity for ${upgradeType}. Attempting to refund deduction.`);
      await supabase.from('activities').insert({
        user_id: userId,
        type: 'rzc_claim',
        amount: cost, // Refund the cost
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
// Generate passive income for a user (10 RZC per minute per level)
export const generatePassiveIncome = async (userId: number): Promise<{ success: boolean; amount?: number; error?: string }> => {
  try {
    const level = await getPassiveIncomeBoostLevel(userId);
    
    if (level === 0) {
      return { success: false, error: 'No passive income boost active.' };
    }

    // Calculate amount: 10 RZC per minute per level
    const amount = 10 * level;

    // Record as mining_complete activity to add to claimable balance
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

// Record RZC claim activity
export const recordRZCClaimActivity = async (
  userId: number,
  amount: number
): Promise<boolean> => {
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

// Get user activities with filtering
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
