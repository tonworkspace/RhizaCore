import { supabase } from '../lib/supabaseClient';

export interface StakingLock {
  id: string;
  user_id: number;
  staked_amount: number;
  lock_period_years: number;
  apy_rate: number;
  staked_at: string;
  unlock_date: string;
  status: 'active' | 'unlocked' | 'withdrawn';
  created_at: string;
  updated_at: string;
}

export interface StakingSummary {
  total_staked: number;
  total_locked: number;
  total_unlocked: number;
  active_locks: number;
  next_unlock_date: string | null;
}

export interface StakeResult {
  success: boolean;
  lock_id?: string;
  staked_amount?: number;
  unlock_date?: string;
  lock_period_years?: number;
  apy_rate?: number;
  error?: string;
}

export interface UnstakeResult {
  success: boolean;
  unstaked_amount?: number;
  lock_id?: string;
  error?: string;
  unlock_date?: string;
  time_remaining?: string;
}

class StakingLockService {
  /**
   * Stake tokens with a lock period
   */
  async stakeTokensWithLock(
    userId: number,
    lockYears: number,
    apyRate: number
  ): Promise<StakeResult> {
    try {
      const { data, error } = await supabase.rpc('stake_tokens_with_lock', {
        p_user_id: userId,
        p_amount: 0, // Amount is calculated as 70% in the function
        p_lock_years: lockYears,
        p_apy_rate: apyRate
      });

      if (error) {
        console.error('Staking error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return data as StakeResult;
    } catch (error) {
      console.error('Staking service error:', error);
      return {
        success: false,
        error: 'Failed to stake tokens'
      };
    }
  }

  /**
   * Attempt to unstake tokens (only if lock period expired)
   */
  async unstakeTokens(userId: number, lockId: string): Promise<UnstakeResult> {
    try {
      const { data, error } = await supabase.rpc('unstake_tokens', {
        p_user_id: userId,
        p_lock_id: lockId
      });

      if (error) {
        console.error('Unstaking error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return data as UnstakeResult;
    } catch (error) {
      console.error('Unstaking service error:', error);
      return {
        success: false,
        error: 'Failed to unstake tokens'
      };
    }
  }

  /**
   * Get user's staking summary
   */
  async getUserStakingSummary(userId: number): Promise<StakingSummary | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_staking_summary', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching staking summary:', error);
        return null;
      }

      return data[0] as StakingSummary;
    } catch (error) {
      console.error('Staking summary service error:', error);
      return null;
    }
  }

  /**
   * Get all user's staking locks
   */
  async getUserStakingLocks(userId: number): Promise<StakingLock[]> {
    try {
      const { data, error } = await supabase
        .from('staking_locks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staking locks:', error);
        return [];
      }

      return data as StakingLock[];
    } catch (error) {
      console.error('Staking locks service error:', error);
      return [];
    }
  }

  /**
   * Check if user can unstake a specific amount
   */
  async canUnstake(userId: number, amount: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_unstake', {
        p_user_id: userId,
        p_amount: amount
      });

      if (error) {
        console.error('Error checking unstake eligibility:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Can unstake service error:', error);
      return false;
    }
  }

  /**
   * Get time remaining for a lock
   */
  getTimeRemaining(unlockDate: string): {
    isLocked: boolean;
    timeRemaining: string;
    daysRemaining: number;
  } {
    const now = new Date();
    const unlock = new Date(unlockDate);
    const timeDiff = unlock.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return {
        isLocked: false,
        timeRemaining: 'Unlocked',
        daysRemaining: 0
      };
    }

    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const yearsRemaining = Math.floor(daysRemaining / 365);
    const monthsRemaining = Math.floor((daysRemaining % 365) / 30);
    const remainingDays = daysRemaining % 30;

    let timeString = '';
    if (yearsRemaining > 0) {
      timeString += `${yearsRemaining}y `;
    }
    if (monthsRemaining > 0) {
      timeString += `${monthsRemaining}m `;
    }
    if (remainingDays > 0) {
      timeString += `${remainingDays}d`;
    }

    return {
      isLocked: true,
      timeRemaining: timeString.trim(),
      daysRemaining
    };
  }

  /**
   * Format APY rate for display
   */
  formatAPY(apyRate: number): string {
    return `${apyRate.toFixed(1)}%`;
  }

  /**
   * Calculate projected rewards
   */
  calculateProjectedRewards(
    stakedAmount: number,
    apyRate: number,
    lockYears: number
  ): {
    annualReward: number;
    totalReward: number;
  } {
    const annualReward = (stakedAmount * apyRate) / 100;
    const totalReward = annualReward * lockYears;

    return {
      annualReward,
      totalReward
    };
  }
}

export const stakingLockService = new StakingLockService();