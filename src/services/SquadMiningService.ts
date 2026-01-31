import { supabase } from '../lib/supabaseClient';

export interface SquadMiningStats {
  squad_size: number;
  potential_reward: number;
  can_claim: boolean;
  last_claim_at: string | null;
  next_claim_at: string | null;
  total_rewards_earned: number;
  total_claims: number;
  hours_until_next_claim: number;
}

export interface SquadClaimResult {
  success: boolean;
  squad_size?: number;
  reward_amount?: number;
  transaction_id?: string;
  claimed_at?: string;
  error?: string;
  next_claim_available?: string;
}

export interface SquadMember {
  id: number;
  username: string;
  telegram_id: number;
  is_premium: boolean;
  is_active: boolean;
  joined_at: string;
  total_earned: number;
  rank: string;
}

class SquadMiningService {
  /**
   * Get squad mining statistics for the current user
   */
  async getSquadMiningStats(userId: number): Promise<SquadMiningStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_squad_mining_stats', {
        user_id_param: userId
      });

      if (error) {
        console.error('Error fetching squad mining stats:', error);
        return null;
      }

      return data as SquadMiningStats;
    } catch (error) {
      console.error('Error in getSquadMiningStats:', error);
      return null;
    }
  }

  /**
   * Claim squad mining rewards to airdrop balance
   */
  async claimSquadRewards(userId: number, transactionId?: string): Promise<SquadClaimResult> {
    try {
      const { data, error } = await supabase.rpc('claim_squad_mining_rewards', {
        user_id_param: userId,
        transaction_id_param: transactionId || null
      });

      if (error) {
        console.error('Error claiming squad rewards:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // If successful, also record activity for the airdrop claim
      if (data.success && data.reward_amount) {
        try {
          await supabase.from('activities').insert({
            user_id: userId,
            type: 'squad_mining_claim',
            amount: data.reward_amount,
            status: 'completed',
            metadata: { 
              squad_size: data.squad_size,
              transaction_id: data.transaction_id,
              claim_type: 'airdrop_balance'
            },
            created_at: new Date().toISOString()
          });
        } catch (activityError) {
          console.error('Error recording squad mining activity:', activityError);
          // Don't fail the claim if activity recording fails
        }
      }

      return data as SquadClaimResult;
    } catch (error) {
      console.error('Error in claimSquadRewards:', error);
      return {
        success: false,
        error: 'Failed to claim squad rewards'
      };
    }
  }

  /**
   * Get squad members (active referrals)
   */
  async getSquadMembers(userId: number): Promise<SquadMember[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          created_at,
          referred:users!referred_id(
            id,
            username,
            telegram_id,
            is_premium,
            is_active,
            total_earned,
            rank,
            created_at
          )
        `)
        .eq('sponsor_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching squad members:', error);
        return [];
      }

      return (data || []).map(item => {
        // Type guard to ensure referred is not an array
        const referred = Array.isArray(item.referred) ? item.referred[0] : item.referred;
        
        return {
          id: referred?.id,
          username: referred?.username,
          telegram_id: referred?.telegram_id,
          is_premium: referred?.is_premium,
          is_active: referred?.is_active,
          joined_at: item.created_at,
          total_earned: referred?.total_earned || 0,
          rank: referred?.rank || 'Rookie'
        };
      });
    } catch (error) {
      console.error('Error in getSquadMembers:', error);
      return [];
    }
  }

  /**
   * Get squad mining claim history
   */
  async getClaimHistory(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('squad_mining_claims')
        .select('*')
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching claim history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClaimHistory:', error);
      return [];
    }
  }

  /**
   * Calculate time until next claim
   */
  calculateTimeUntilNextClaim(lastClaimAt: string | null): {
    canClaim: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
    nextClaimTime: Date | null;
  } {
    if (!lastClaimAt) {
      return {
        canClaim: true,
        hoursRemaining: 0,
        minutesRemaining: 0,
        nextClaimTime: null
      };
    }

    const lastClaim = new Date(lastClaimAt);
    const nextClaim = new Date(lastClaim.getTime() + 8 * 60 * 60 * 1000); // 8 hours
    const now = new Date();
    const timeDiff = nextClaim.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return {
        canClaim: true,
        hoursRemaining: 0,
        minutesRemaining: 0,
        nextClaimTime: null
      };
    }

    const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      canClaim: false,
      hoursRemaining,
      minutesRemaining,
      nextClaimTime: nextClaim
    };
  }

  /**
   * Format time remaining as string
   */
  formatTimeRemaining(hoursRemaining: number, minutesRemaining: number): string {
    if (hoursRemaining === 0 && minutesRemaining === 0) {
      return 'Ready to claim!';
    }
    
    if (hoursRemaining === 0) {
      return `${minutesRemaining}m remaining`;
    }
    
    if (minutesRemaining === 0) {
      return `${hoursRemaining}h remaining`;
    }
    
    return `${hoursRemaining}h ${minutesRemaining}m remaining`;
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId(userId: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `squad_${userId}_${timestamp}_${random}`;
  }
}

export const squadMiningService = new SquadMiningService();
export default squadMiningService;