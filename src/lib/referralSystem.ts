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
      // Create direct referral relationship in the referrals table
      const { error } = await supabase
        .from('referrals')
        .insert({
          sponsor_id: referrerId,
          referred_id: userId,
          referrer_id: referrerId, // For backward compatibility
          status: 'active',
          level: 1
        });

      if (error) {
        console.error('Referral creation failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Referral chain creation failed:', error);
      return false;
    }
  },

  async processReferralRewards(userId: number): Promise<void> {
    try {
      // Get direct referrer (sponsor) from referrals table
      const { data: referralData } = await supabase
        .from('referrals')
        .select('sponsor_id')
        .eq('referred_id', userId)
        .eq('status', 'active')
        .single();

      if (!referralData?.sponsor_id) {
        return;
      }

      const rewardAmount = REFERRAL_CONFIG.REWARDS[1];

      // Award reward to direct sponsor
      const { error: rpcError } = await supabase.rpc('increment_rzc_balance', {
        p_user_id: referralData.sponsor_id,
        p_amount: rewardAmount
      });

      if (rpcError) {
        console.error(`Error awarding referral bonus to sponsor ${referralData.sponsor_id}:`, rpcError);
        return;
      }
      
      // Log the reward activity
      await supabase.from('activities').insert({
        user_id: referralData.sponsor_id,
        type: 'referral_reward',
        amount: rewardAmount,
        status: 'completed',
        metadata: {
          referred_user_id: userId
        }
      });
    } catch (error) {
      console.error('Referral reward processing failed:', error);
    }
  },

  async updateTeamVolume(userId: number, amount: number): Promise<void> {
    try {
      // Get direct sponsor from referrals table
      const { data: referralData } = await supabase
        .from('referrals')
        .select('sponsor_id')
        .eq('referred_id', userId)
        .single();

      if (!referralData?.sponsor_id) return;

      // Update team volume for direct sponsor only (since MAX_LEVEL is 1)
      await supabase.rpc('increment_team_volume', { 
        user_id: referralData.sponsor_id, 
        increment_by: amount 
      });
    } catch (error) {
      console.error('Team volume update failed:', error);
    }
  },

  // New function to get accurate referral counts
  async getAccurateReferralCounts(): Promise<{ [key: number]: { total: number; active: number } }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('sponsor_id, status')
        .not('sponsor_id', 'is', null);

      if (error || !data) {
        console.error('Error fetching referral counts:', error);
        return {};
      }

      // Aggregate counts by sponsor_id, removing duplicates
      const counts: { [key: number]: { total: number; active: number } } = {};
      const seenPairs = new Set<string>();

      data.forEach(referral => {
        const sponsorId = referral.sponsor_id;
        if (!sponsorId) return;

        // Create unique key to prevent duplicate counting
        const uniqueKey = `${sponsorId}_${referral.status}`;
        if (seenPairs.has(uniqueKey)) return;
        seenPairs.add(uniqueKey);

        if (!counts[sponsorId]) {
          counts[sponsorId] = { total: 0, active: 0 };
        }

        counts[sponsorId].total++;
        if (referral.status?.toLowerCase() === 'active') {
          counts[sponsorId].active++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting accurate referral counts:', error);
      return {};
    }
  },

  // Function to clean up duplicate referrals
  async cleanupDuplicateReferrals(): Promise<{ cleaned: number; errors: string[] }> {
    try {
      const { data: allReferrals, error } = await supabase
        .from('referrals')
        .select('id, sponsor_id, referred_id, created_at')
        .order('created_at', { ascending: true });

      if (error || !allReferrals) {
        return { cleaned: 0, errors: [error?.message || 'Failed to fetch referrals'] };
      }

      const seenPairs = new Map<string, number>();
      const duplicateIds: number[] = [];

      allReferrals.forEach(referral => {
        const key = `${referral.sponsor_id}_${referral.referred_id}`;
        
        if (seenPairs.has(key)) {
          // This is a duplicate, mark for deletion
          duplicateIds.push(referral.id);
        } else {
          // First occurrence, keep it
          seenPairs.set(key, referral.id);
        }
      });

      if (duplicateIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('referrals')
          .delete()
          .in('id', duplicateIds);

        if (deleteError) {
          return { cleaned: 0, errors: [deleteError.message] };
        }
      }

      return { cleaned: duplicateIds.length, errors: [] };
    } catch (error) {
      return { cleaned: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }
}; 