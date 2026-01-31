/**
 * ClaimService - Core service for handling RZC claim operations
 * 
 * This service provides comprehensive claim processing with proper validation,
 * error handling, and transaction integrity. It serves as the main interface
 * for all claim-related operations in the RZC system.
 */

import { supabase } from '../lib/supabaseClient';
import { BalanceCalculationService } from './BalanceCalculationService';
import ClaimSecurityService from './ClaimSecurityService';

// ==========================================
// INTERFACES & TYPES
// ==========================================

export interface ClaimableBalance {
  claimableFromMining: number;      // From completed mining sessions
  accumulatedFromActive: number;    // From current active session
  totalClaimable: number;          // Sum of above
  lastCalculated: Date;
}

export interface ClaimResult {
  success: boolean;
  claimedAmount: number;
  newAvailableBalance: number;
  transactionId: string;
  error?: string;
  metadata?: {
    activitiesMarked: number;
    previousBalance: number;
    sessionCompleted?: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    requestedAmount: number;
    availableAmount: number;
    balanceCheck: boolean;
    sessionCheck: boolean;
  };
}

export interface SessionResult {
  success: boolean;
  sessionId?: number;
  rzcEarned?: number;
  error?: string;
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

export enum ClaimErrorType {
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  CONCURRENT_CLAIM = 'concurrent_claim',
  MINING_SESSION_ERROR = 'mining_session_error',
  TRANSACTION_ERROR = 'transaction_error'
}

export interface ClaimError {
  type: ClaimErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}

// ==========================================
// CLAIM SERVICE CLASS
// ==========================================

export class ClaimService {
  private static instance: ClaimService;
  private balanceService: BalanceCalculationService;
  private securityService: ClaimSecurityService;

  private constructor() {
    this.balanceService = BalanceCalculationService.getInstance();
    this.securityService = ClaimSecurityService.getInstance();
  }

  public static getInstance(): ClaimService {
    if (!ClaimService.instance) {
      ClaimService.instance = new ClaimService();
    }
    return ClaimService.instance;
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Calculate accurate claimable balance for a user
   */
  public async calculateClaimableBalance(userId: number): Promise<ClaimableBalance> {
    try {
      console.log(`[ClaimService] Calculating claimable balance for user ${userId}`);
      
      const comprehensiveBalance = await this.balanceService.getComprehensiveBalance(userId);
      const activeSession = await this.getActiveMiningSession(userId);
      
      let accumulatedFromActive = 0;
      if (activeSession) {
        accumulatedFromActive = this.balanceService.calculateAccumulatedRZC(activeSession);
      }

      const result: ClaimableBalance = {
        claimableFromMining: comprehensiveBalance.claimableRZC,
        accumulatedFromActive,
        totalClaimable: comprehensiveBalance.claimableRZC + accumulatedFromActive,
        lastCalculated: new Date()
      };

      console.log(`[ClaimService] Claimable balance calculated:`, result);
      return result;
    } catch (error) {
      console.error('[ClaimService] Error calculating claimable balance:', error);
      throw this.createClaimError(
        ClaimErrorType.DATABASE_ERROR,
        'Failed to calculate claimable balance',
        error,
        true,
        'Please try again in a moment'
      );
    }
  }

  /**
   * Process claim with full validation and transaction integrity
   */
  public async processClaim(userId: number, amount: number): Promise<ClaimResult> {
    console.log(`[ClaimService] Processing claim for user ${userId}, amount: ${amount}`);
    
    // Generate transaction ID for idempotency
    const transactionId = this.securityService.generateTransactionId(userId, 'manual_claim', amount);
    
    try {
      // Check for duplicate transaction
      const isDuplicate = await this.securityService.checkTransactionIdempotency(transactionId);
      if (isDuplicate) {
        return {
          success: false,
          claimedAmount: 0,
          newAvailableBalance: 0,
          transactionId,
          error: 'Claim already processed'
        };
      }

      // Acquire security lock
      const lockResult = await this.securityService.acquireClaimLock(userId, 'manual_claim');
      if (!lockResult.isValid) {
        return {
          success: false,
          claimedAmount: 0,
          newAvailableBalance: 0,
          transactionId,
          error: lockResult.error || 'Unable to acquire claim lock'
        };
      }

      try {
        // Validate claim eligibility
        const validation = await this.validateClaimEligibility(userId, amount);
        if (!validation.isValid) {
          return {
            success: false,
            claimedAmount: 0,
            newAvailableBalance: 0,
            transactionId,
            error: validation.error || 'Claim validation failed'
          };
        }

        // Complete active mining session if exists
        const sessionResult = await this.completeActiveMiningSession(userId);
        
        // Recalculate balance after session completion
        const claimableBalance = await this.calculateClaimableBalance(userId);
        const actualAmount = Math.min(amount, claimableBalance.totalClaimable);

        if (actualAmount <= 0) {
          return {
            success: true,
            claimedAmount: 0,
            newAvailableBalance: 0,
            transactionId,
            error: 'No claimable amount available'
          };
        }

        // Process the actual claim
        const result = await this.executeClaimTransaction(userId, actualAmount, transactionId);
        
        // Record successful attempt
        this.securityService.recordClaimAttempt(userId, actualAmount, 'manual_claim', result.success);
        
        // Log audit trail
        await this.securityService.logClaimAudit(
          userId,
          'manual_claim',
          actualAmount,
          transactionId,
          result.success,
          {
            sessionCompleted: sessionResult.success,
            originalAmount: amount,
            actualAmount,
            newBalance: result.newAvailableBalance
          }
        );

        return {
          ...result,
          metadata: {
            activitiesMarked: result.metadata?.activitiesMarked || 0,
            previousBalance: result.metadata?.previousBalance || 0,
            sessionCompleted: sessionResult.success
          }
        };

      } finally {
        // Always release the lock
        this.securityService.releaseClaimLock(userId, lockResult.lockId!);
      }

    } catch (error) {
      console.error('[ClaimService] Error processing claim:', error);
      
      // Record failed attempt
      this.securityService.recordClaimAttempt(userId, amount, 'manual_claim', false);
      
      return {
        success: false,
        claimedAmount: 0,
        newAvailableBalance: 0,
        transactionId,
        error: error instanceof Error ? error.message : 'Failed to process claim'
      };
    }
  }

  /**
   * Validate claim eligibility with comprehensive checks
   */
  public async validateClaimEligibility(userId: number, amount: number): Promise<ValidationResult> {
    try {
      console.log(`[ClaimService] Validating claim eligibility for user ${userId}, amount: ${amount}`);

      // Basic validation
      if (amount <= 0) {
        return {
          isValid: false,
          error: 'Invalid claim amount',
          details: {
            requestedAmount: amount,
            availableAmount: 0,
            balanceCheck: false,
            sessionCheck: false
          }
        };
      }

      // Get current balance
      const claimableBalance = await this.calculateClaimableBalance(userId);
      const balanceCheck = claimableBalance.totalClaimable >= amount;

      // Check for active mining session
      const sessionCheck = true; // Sessions are handled automatically

      // Security validation
      const comprehensiveBalance = await this.balanceService.getComprehensiveBalance(userId);
      const securityValidation = await this.securityService.validateClaimOperation(
        userId,
        amount,
        'manual_claim',
        {
          claimable: claimableBalance.totalClaimable,
          accumulated: claimableBalance.accumulatedFromActive,
          claimed: comprehensiveBalance.availableBalance
        }
      );

      if (!securityValidation.isValid) {
        return {
          isValid: false,
          error: securityValidation.error || 'Security validation failed',
          details: {
            requestedAmount: amount,
            availableAmount: claimableBalance.totalClaimable,
            balanceCheck,
            sessionCheck
          }
        };
      }

      // For this implementation, we allow claims up to available balance
      // (adjusting amount if necessary is handled in processClaim)
      const isValid = amount > 0 && claimableBalance.totalClaimable > 0;

      return {
        isValid,
        error: isValid ? undefined : 'No claimable balance available',
        details: {
          requestedAmount: amount,
          availableAmount: claimableBalance.totalClaimable,
          balanceCheck,
          sessionCheck
        }
      };

    } catch (error) {
      console.error('[ClaimService] Error validating claim eligibility:', error);
      return {
        isValid: false,
        error: 'Failed to validate claim eligibility',
        details: {
          requestedAmount: amount,
          availableAmount: 0,
          balanceCheck: false,
          sessionCheck: false
        }
      };
    }
  }

  /**
   * Complete active mining session during claims
   */
  public async completeActiveMiningSession(userId: number): Promise<SessionResult> {
    try {
      console.log(`[ClaimService] Checking for active mining session for user ${userId}`);
      
      const activeSession = await this.getActiveMiningSession(userId);
      if (!activeSession) {
        return { success: true }; // No active session to complete
      }

      console.log(`[ClaimService] Completing active mining session ${activeSession.id}`);
      
      // Calculate RZC earned from the session
      const startTime = new Date(activeSession.start_time);
      const endTime = new Date();
      const elapsedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const rzcEarned = Math.min(elapsedHours * (50 / 24), 50); // Max 50 RZC per 24-hour session

      // Create mining_complete activity
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: 'mining_complete',
          amount: rzcEarned,
          status: 'completed',
          metadata: {
            session_id: activeSession.id,
            elapsed_hours: elapsedHours,
            completed_during_claim: true
          },
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('[ClaimService] Error creating mining_complete activity:', activityError);
        throw activityError;
      }

      console.log(`[ClaimService] Mining session completed, earned: ${rzcEarned} RZC`);
      
      return {
        success: true,
        sessionId: activeSession.id,
        rzcEarned
      };

    } catch (error) {
      console.error('[ClaimService] Error completing active mining session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete mining session'
      };
    }
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Execute the actual claim transaction with database operations
   */
  private async executeClaimTransaction(userId: number, amount: number, transactionId: string): Promise<ClaimResult> {
    try {
      console.log(`[ClaimService] Executing claim transaction for user ${userId}, amount: ${amount}`);

      // Get current user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('available_balance')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Failed to fetch user data');
      }

      // Get unclaimed mining activities to mark as claimed
      const { data: unclaimedActivities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, amount')
        .eq('user_id', userId)
        .eq('type', 'mining_complete')
        .eq('status', 'completed')
        .is('metadata->claimed_to_airdrop', null)
        .order('created_at', { ascending: true });

      if (activitiesError) {
        throw new Error('Failed to fetch mining activities');
      }

      // Calculate activities to mark as claimed
      const activitiesToMark: { id: number; amount: number }[] = [];
      let remainingToClaim = amount;

      for (const activity of unclaimedActivities || []) {
        if (remainingToClaim <= 0) break;
        
        const activityAmount = parseFloat(activity.amount) || 0;
        const claimFromActivity = Math.min(activityAmount, remainingToClaim);
        
        activitiesToMark.push({ id: activity.id, amount: claimFromActivity });
        remainingToClaim -= claimFromActivity;
      }

      // Mark mining activities as claimed
      for (const activity of activitiesToMark) {
        const { error: markError } = await supabase
          .from('activities')
          .update({
            metadata: {
              claimed_to_airdrop: true,
              claimed_at: new Date().toISOString(),
              claimed_amount: activity.amount,
              transaction_id: transactionId
            }
          })
          .eq('id', activity.id);

        if (markError) {
          console.error('[ClaimService] Error marking activity as claimed:', markError);
          // Continue with other activities
        }
      }

      // Update user's available_balance
      const currentAvailableBalance = parseFloat(user.available_balance) || 0;
      const newAvailableBalance = currentAvailableBalance + amount;

      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          available_balance: newAvailableBalance,
          last_claim_time: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateUserError) {
        throw new Error('Failed to update user balance');
      }

      // Create claim activity record
      const { error: claimActivityError } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: 'rzc_claim',
          amount: amount,
          status: 'completed',
          transaction_id: transactionId,
          security_validated: true,
          metadata: {
            claim_type: 'manual',
            claimed_from_mining: true,
            activities_marked: activitiesToMark.length,
            previous_available_balance: currentAvailableBalance,
            new_available_balance: newAvailableBalance
          },
          created_at: new Date().toISOString()
        });

      if (claimActivityError) {
        console.error('[ClaimService] Error creating claim activity:', claimActivityError);
        // Don't fail the whole operation for this
      }

      console.log(`[ClaimService] Claim transaction completed successfully`);

      return {
        success: true,
        claimedAmount: amount,
        newAvailableBalance,
        transactionId,
        metadata: {
          activitiesMarked: activitiesToMark.length,
          previousBalance: currentAvailableBalance
        }
      };

    } catch (error) {
      console.error('[ClaimService] Error executing claim transaction:', error);
      throw error;
    }
  }

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
      console.error('[ClaimService] Error fetching active mining session:', error);
      return null;
    }
  }

  /**
   * Create a standardized claim error
   */
  private createClaimError(
    type: ClaimErrorType,
    message: string,
    details?: any,
    recoverable: boolean = true,
    suggestedAction?: string
  ): ClaimError {
    return {
      type,
      message,
      details,
      recoverable,
      suggestedAction
    };
  }
}

// Export singleton instance
export default ClaimService;