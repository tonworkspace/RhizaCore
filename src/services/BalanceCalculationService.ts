/**
 * BalanceCalculationService - Enhanced balance calculation with proper synchronization
 * 
 * This service handles all balance-related calculations with proper synchronization
 * between frontend and backend data. It ensures consistency and provides accurate
 * balance information for the claiming system.
 */

import { supabase } from '../lib/supabaseClient';

// ==========================================
// INTERFACES & TYPES
// ==========================================

export interface ComprehensiveBalance {
  // Database values (authoritative)
  availableBalance: number;        // User's claimed balance in DB
  
  // Calculated values
  claimableRZC: number;           // From unclaimed mining activities
  accumulatedRZC: number;         // From active mining session
  totalEarned: number;            // Historical total
  
  // Metadata
  lastClaimTime?: Date;
  activeMiningSession?: MiningSession;
  calculatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  discrepancyFound: boolean;
  adjustmentMade: boolean;
  originalBalance: ComprehensiveBalance;
  adjustedBalance?: ComprehensiveBalance;
  error?: string;
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  discrepancies: {
    calculatedVsDatabase: number;
    claimableVsActivities: number;
  };
  recommendations: string[];
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

// ==========================================
// BALANCE CALCULATION SERVICE CLASS
// ==========================================

export class BalanceCalculationService {
  private static instance: BalanceCalculationService;

  private constructor() {}

  public static getInstance(): BalanceCalculationService {
    if (!BalanceCalculationService.instance) {
      BalanceCalculationService.instance = new BalanceCalculationService();
    }
    return BalanceCalculationService.instance;
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Get comprehensive balance information with all components
   */
  public async getComprehensiveBalance(userId: number): Promise<ComprehensiveBalance> {
    try {
      console.log(`[BalanceCalculationService] Getting comprehensive balance for user ${userId}`);

      // Get user's current available_balance (authoritative database value)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('available_balance, last_claim_time')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get all relevant activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('type, amount, created_at, metadata')
        .eq('user_id', userId)
        .in('type', ['rzc_claim', 'mining_complete', 'mining_rig_mk2', 'extended_session'])
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;

      // Calculate balance components
      let claimableRZC = 0;
      let totalEarned = 0;
      let lastClaimTime: Date | undefined;

      activities?.forEach(activity => {
        const isClaimedToAirdrop = activity.metadata?.claimed_to_airdrop === true;
        
        if (activity.type === 'rzc_claim') {
          if (!lastClaimTime && activity.amount > 0) {
            lastClaimTime = new Date(activity.created_at);
          }
        } else if (activity.type === 'mining_complete') {
          // Always count towards total earned
          totalEarned += activity.amount;
          
          // Only count as claimable if not claimed yet
          if (!isClaimedToAirdrop) {
            claimableRZC += activity.amount;
          }
        }
      });

      // Get active mining session
      const activeMiningSession = await this.getActiveMiningSession(userId);
      let accumulatedRZC = 0;
      if (activeMiningSession) {
        accumulatedRZC = this.calculateAccumulatedRZC(activeMiningSession);
      }

      const result: ComprehensiveBalance = {
        availableBalance: parseFloat(user.available_balance) || 0,
        claimableRZC: Math.max(0, claimableRZC),
        accumulatedRZC,
        totalEarned,
        lastClaimTime: lastClaimTime || (user.last_claim_time ? new Date(user.last_claim_time) : undefined),
        activeMiningSession: activeMiningSession || undefined,
        calculatedAt: new Date()
      };

      console.log(`[BalanceCalculationService] Comprehensive balance calculated:`, result);
      return result;

    } catch (error) {
      console.error('[BalanceCalculationService] Error getting comprehensive balance:', error);
      throw new Error(`Failed to get comprehensive balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Synchronize frontend and backend balances
   */
  public async synchronizeBalances(userId: number): Promise<SyncResult> {
    try {
      console.log(`[BalanceCalculationService] Synchronizing balances for user ${userId}`);

      const originalBalance = await this.getComprehensiveBalance(userId);
      
      // Check for discrepancies
      const consistencyCheck = await this.validateBalanceConsistency(userId);
      
      if (consistencyCheck.isConsistent) {
        return {
          success: true,
          discrepancyFound: false,
          adjustmentMade: false,
          originalBalance
        };
      }

      // Log discrepancy for monitoring
      await this.logBalanceDiscrepancy(userId, originalBalance, consistencyCheck);

      // For now, we trust the database values and don't make automatic adjustments
      // In a production system, you might want to implement automatic reconciliation
      console.log(`[BalanceCalculationService] Discrepancy found but no automatic adjustment made`);

      return {
        success: true,
        discrepancyFound: true,
        adjustmentMade: false,
        originalBalance
      };

    } catch (error) {
      console.error('[BalanceCalculationService] Error synchronizing balances:', error);
      return {
        success: false,
        discrepancyFound: false,
        adjustmentMade: false,
        originalBalance: await this.getComprehensiveBalance(userId),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate real-time accumulated RZC from active mining session
   */
  public calculateAccumulatedRZC(session: MiningSession): number {
    try {
      const startTime = new Date(session.start_time);
      const now = new Date();
      const endTime = new Date(session.end_time);

      // Ensure we don't go beyond the session end time
      const effectiveEndTime = now > endTime ? endTime : now;
      
      const elapsedHours = (effectiveEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate RZC based on 50 RZC per 24-hour session
      const rzcPerHour = 50 / 24;
      const accumulatedRZC = Math.min(elapsedHours * rzcPerHour, 50);

      return Math.max(0, accumulatedRZC);
    } catch (error) {
      console.error('[BalanceCalculationService] Error calculating accumulated RZC:', error);
      return 0;
    }
  }

  /**
   * Validate balance consistency between calculated and database values
   */
  public async validateBalanceConsistency(userId: number): Promise<ConsistencyCheck> {
    try {
      console.log(`[BalanceCalculationService] Validating balance consistency for user ${userId}`);

      const balance = await this.getComprehensiveBalance(userId);
      
      // Get activities for cross-validation
      const { data: claimActivities, error: claimError } = await supabase
        .from('activities')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'rzc_claim')
        .eq('status', 'completed');

      if (claimError) throw claimError;

      const { data: miningActivities, error: miningError } = await supabase
        .from('activities')
        .select('amount, metadata')
        .eq('user_id', userId)
        .eq('type', 'mining_complete')
        .eq('status', 'completed');

      if (miningError) throw miningError;

      // Calculate expected values
      const totalClaimed = claimActivities?.reduce((sum, activity) => sum + activity.amount, 0) || 0;
      const unclaimedMining = miningActivities?.filter(activity => 
        !activity.metadata?.claimed_to_airdrop
      ).reduce((sum, activity) => sum + activity.amount, 0) || 0;

      // Check discrepancies
      const calculatedVsDatabase = Math.abs(totalClaimed - balance.availableBalance);
      const claimableVsActivities = Math.abs(balance.claimableRZC - unclaimedMining);

      const isConsistent = calculatedVsDatabase < 0.001 && claimableVsActivities < 0.001;

      const recommendations: string[] = [];
      if (calculatedVsDatabase >= 0.001) {
        recommendations.push(`Database available_balance (${balance.availableBalance}) differs from calculated claimed amount (${totalClaimed})`);
      }
      if (claimableVsActivities >= 0.001) {
        recommendations.push(`Claimable RZC (${balance.claimableRZC}) differs from unclaimed mining activities (${unclaimedMining})`);
      }

      return {
        isConsistent,
        discrepancies: {
          calculatedVsDatabase,
          claimableVsActivities
        },
        recommendations
      };

    } catch (error) {
      console.error('[BalanceCalculationService] Error validating balance consistency:', error);
      return {
        isConsistent: false,
        discrepancies: {
          calculatedVsDatabase: 0,
          claimableVsActivities: 0
        },
        recommendations: ['Error validating balance consistency']
      };
    }
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Get active mining session for a user
   */
  private async getActiveMiningSession(userId: number): Promise<MiningSession | null> {
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

      // Check if session was already completed
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
      console.error('[BalanceCalculationService] Error fetching active mining session:', error);
      return null;
    }
  }

  /**
   * Log balance discrepancy for monitoring
   */
  private async logBalanceDiscrepancy(
    userId: number,
    balance: ComprehensiveBalance,
    consistencyCheck: ConsistencyCheck
  ): Promise<void> {
    try {
      await supabase.from('balance_calculations').insert({
        user_id: userId,
        calculated_claimable: balance.claimableRZC,
        database_available: balance.availableBalance,
        discrepancy: consistencyCheck.discrepancies.calculatedVsDatabase,
        mining_activities_count: 0, // Would need to be calculated
        claim_activities_count: 0,  // Would need to be calculated
        calculation_timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[BalanceCalculationService] Error logging balance discrepancy:', error);
      // Don't throw - this is just for monitoring
    }
  }
}

// Export singleton instance
export default BalanceCalculationService;