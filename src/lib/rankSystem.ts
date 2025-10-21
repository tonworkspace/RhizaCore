import { supabase } from "./supabaseClient";
import { RANK_REQUIREMENTS } from "./supabaseClient";

export const rankSystem = {
  async calculateRank(userId: number): Promise<string> {
    const { data: user } = await supabase
      .from('users')
      .select(`
        total_earned,
        balance,
        team_volume
      `)
      .eq('id', userId)
      .single();

    if (!user) return 'NOVICE';

    // Check ranks from highest to lowest
    for (const [rank, requirements] of Object.entries(RANK_REQUIREMENTS).reverse()) {
      if (
        user.balance >= requirements.minStake &&
        user.total_earned >= requirements.minEarnings
      ) {
        return rank;
      }
    }

    return 'NOVICE';
  },

  async processWeeklyBonuses(): Promise<void> {
    try {
      const { data: rankedUsers } = await supabase
        .from('users')
        .select('id, rank, total_earned')
        .neq('rank', 'NOVICE');

      if (!rankedUsers) return;

      for (const user of rankedUsers) {
        const requirements = RANK_REQUIREMENTS[user.rank as keyof typeof RANK_REQUIREMENTS];
        
        if (user.total_earned >= requirements.minEarnings) {
          await supabase
            .from('rank_bonuses')
            .insert({
              user_id: user.id,
              rank: user.rank,
              amount: requirements.weeklyBonus,
              status: 'pending',
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Weekly bonus processing failed:', error);
    }
  }
};

