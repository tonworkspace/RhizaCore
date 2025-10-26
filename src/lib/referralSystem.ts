import { supabase } from "./supabaseClient";

interface ReferralConfig {
  MAX_LEVEL: number;
  REWARDS: { [key: number]: number };
  VOLUME_TRACKING_DEPTH: number; // Infinity for team volume
}

export const REFERRAL_CONFIG: ReferralConfig = {
  MAX_LEVEL: 1,
  REWARDS: {
    1: 50, // 50 RZC for level 1
  },
  VOLUME_TRACKING_DEPTH: Infinity
};

export const referralSystem = {
  async createReferralChain(userId: number, referrerId: number): Promise<boolean> {
    try {
      // Get upline chain
      const { data: upline } = await supabase
        .from('referral_chain')
        .select('*')
        .eq('user_id', referrerId)
        .order('level', { ascending: true });

      // Create referral relationships
      const relationships = [
        {
          user_id: userId,
          sponsor_id: referrerId,
          level: 1
        }
      ];

      // Add upper levels up to max
      if (upline) {
        upline.forEach((ref, index) => {
          if (index + 2 <= REFERRAL_CONFIG.MAX_LEVEL) {
            relationships.push({
              user_id: userId,
              sponsor_id: ref.sponsor_id,
              level: index + 2
            });
          }
        });
      }

      // Insert all relationships
      await supabase
        .from('referral_chain')
        .insert(relationships);

      return true;
    } catch (error) {
      console.error('Referral chain creation failed:', error);
      return false;
    }
  },

  async processReferralRewards(userId: number): Promise<void> {
    try {
      const { data: referrers } = await supabase
        .from('referral_chain')
        .select('sponsor_id, level')
        .eq('user_id', userId)
        .lte('level', REFERRAL_CONFIG.MAX_LEVEL);

      if (!referrers || referrers.length === 0) {
        return;
      }

      for (const referrer of referrers) {
        // We only care about level 1 for the flat reward
        if (referrer.level === 1) {
            const rewardAmount = REFERRAL_CONFIG.REWARDS[1];

            const { error: rpcError } = await supabase.rpc('increment_rzc_balance', {
              p_user_id: referrer.sponsor_id,
              p_amount: rewardAmount
            });
      
            if (rpcError) {
              console.error(`Error awarding referral bonus to sponsor ${referrer.sponsor_id}:`, rpcError);
              continue; // Continue to next referrer if any
            }
            
            // Log the reward activity
            await supabase.from('activities').insert({
              user_id: referrer.sponsor_id,
              type: 'referral_reward',
              amount: rewardAmount,
              status: 'completed',
              metadata: {
                referred_user_id: userId
              }
            });
        }
      }
    } catch (error) {
      console.error('Referral reward processing failed:', error);
    }
  },

  async updateTeamVolume(userId: number, amount: number): Promise<void> {
    try {
      // Get entire upline (no level limit for team volume)
      const { data: upline } = await supabase
        .from('referral_chain')
        .select('sponsor_id')
        .eq('user_id', userId);

      if (!upline) return;

      // Update team volume for all upline members
      const updates = upline.map(ref => 
        supabase.rpc('increment_team_volume', { user_id: ref.sponsor_id, increment_by: amount })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Team volume update failed:', error);
    }
  }
}; 