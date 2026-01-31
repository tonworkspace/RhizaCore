/**
 * Tiered Processing Service
 * 
 * This service implements intelligent claim classification and processing
 * based on USD value thresholds and user reputation.
 * 
 * Processing Tiers:
 * - INSTANT: < $50 USD - Immediate processing
 * - EXPRESS: $50-$500 USD - 6-hour pending with auto-approval
 * - STANDARD: > $500 USD - 24-hour pending with admin approval
 */

import { supabase } from '../lib/supabaseClient';

export interface ClaimRequest {
  id?: number;
  userId: number;
  amount: number;
  usdValue: number;
  processingTier: ProcessingTier;
  status: ClaimStatus;
  trackingId: string;
  submittedAt: Date;
  processingDate?: Date;
  walletAddress: string;
  network: string;
  riskScore: number;
  userReputationScore: number;
}

export type ProcessingTier = 'INSTANT' | 'EXPRESS' | 'STANDARD';
export type ClaimStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'BATCHED';

export interface ProcessingResult {
  success: boolean;
  trackingId?: string;
  processingDate?: Date;
  estimatedCompletionTime?: Date;
  error?: string;
  recommendedAction?: string;
}

export interface TierThresholds {
  instantThresholdUsd: number;
  expressThresholdUsd: number;
  gasOptimizationEnabled: boolean;
  batchProcessingEnabled: boolean;
}

export interface UserLimits {
  instantLimitUsd: number;
  expressLimitUsd: number;
  dailyClaimLimit: number;
  reputationScore: number;
  riskLevel: string;
}

export class TieredProcessingService {
  private static instance: TieredProcessingService;
  private rzcUsdRate: number = 0.1; // Default rate, should be fetched from API
  private tierThresholds: TierThresholds = {
    instantThresholdUsd: 50.0,
    expressThresholdUsd: 500.0,
    gasOptimizationEnabled: true,
    batchProcessingEnabled: true
  };

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): TieredProcessingService {
    if (!TieredProcessingService.instance) {
      TieredProcessingService.instance = new TieredProcessingService();
    }
    return TieredProcessingService.instance;
  }

  /**
   * Initialize the service by loading configuration and exchange rates
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadSystemConfiguration();
      await this.updateExchangeRate();
    } catch (error) {
      console.error('Failed to initialize TieredProcessingService:', error);
    }
  }

  /**
   * Load system configuration from database
   */
  private async loadSystemConfiguration(): Promise<void> {
    try {
      const { data: config, error } = await supabase
        .from('system_configuration')
        .select('config_key, config_value, config_type')
        .eq('is_active', true);

      if (error) throw error;

      if (config) {
        config.forEach(item => {
          switch (item.config_key) {
            case 'INSTANT_CLAIM_THRESHOLD_USD':
              this.tierThresholds.instantThresholdUsd = parseFloat(item.config_value);
              break;
            case 'EXPRESS_CLAIM_THRESHOLD_USD':
              this.tierThresholds.expressThresholdUsd = parseFloat(item.config_value);
              break;
            case 'GAS_OPTIMIZATION_ENABLED':
              this.tierThresholds.gasOptimizationEnabled = item.config_value === 'true';
              break;
            case 'BATCH_PROCESSING_ENABLED':
              this.tierThresholds.batchProcessingEnabled = item.config_value === 'true';
              break;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load system configuration:', error);
      // Use default values on error
    }
  }

  /**
   * Update RZC to USD exchange rate
   * In production, this should fetch from a reliable price API
   */
  private async updateExchangeRate(): Promise<void> {
    try {
      // TODO: Implement actual price API integration
      // For now, using mock rate
      this.rzcUsdRate = 0.1;
    } catch (error) {
      console.error('Failed to update exchange rate:', error);
      // Keep existing rate on error
    }
  }

  /**
   * Calculate USD value from RZC amount
   */
  public calculateUsdValue(rzcAmount: number): number {
    return rzcAmount * this.rzcUsdRate;
  }

  /**
   * Determine processing tier based on USD value and user reputation
   */
  public async determineProcessingTier(
    usdValue: number, 
    userId: number
  ): Promise<ProcessingTier> {
    try {
      const userLimits = await this.getUserLimits(userId);
      
      // Check if user has special privileges that affect tier classification
      if (userLimits.reputationScore >= 750) {
        // Elite users get higher instant limits
        if (usdValue < userLimits.instantLimitUsd) {
          return 'INSTANT';
        }
      }
      
      // Standard tier classification
      if (usdValue < this.tierThresholds.instantThresholdUsd) {
        return 'INSTANT';
      } else if (usdValue < this.tierThresholds.expressThresholdUsd) {
        return 'EXPRESS';
      } else {
        return 'STANDARD';
      }
    } catch (error) {
      console.error('Error determining processing tier:', error);
      // Default to most restrictive tier on error
      return 'STANDARD';
    }
  }

  /**
   * Get user limits and reputation information
   */
  private async getUserLimits(userId: number): Promise<UserLimits> {
    try {
      const { data: reputation, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!reputation) {
        // Create default reputation for new user
        const { error: createError } = await supabase
          .from('user_reputation')
          .insert({
            user_id: userId,
            reputation_score: 100,
            instant_claim_limit_usd: 50.0,
            express_claim_limit_usd: 500.0
          })
          .select()
          .single();

        if (createError) throw createError;
        
        return {
          instantLimitUsd: 50.0,
          expressLimitUsd: 500.0,
          dailyClaimLimit: 10,
          reputationScore: 100,
          riskLevel: 'LOW'
        };
      }

      return {
        instantLimitUsd: reputation.instant_claim_limit_usd,
        expressLimitUsd: reputation.express_claim_limit_usd,
        dailyClaimLimit: 10, // TODO: Make configurable
        reputationScore: reputation.reputation_score,
        riskLevel: reputation.risk_level || 'LOW'
      };
    } catch (error) {
      console.error('Error getting user limits:', error);
      // Return conservative defaults on error
      return {
        instantLimitUsd: 50.0,
        expressLimitUsd: 500.0,
        dailyClaimLimit: 5,
        reputationScore: 100,
        riskLevel: 'MEDIUM'
      };
    }
  }

  /**
   * Calculate processing timeline based on tier
   */
  public calculateProcessingTimeline(tier: ProcessingTier): Date {
    const now = new Date();
    
    switch (tier) {
      case 'INSTANT':
        return now; // Process immediately
      case 'EXPRESS':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
      case 'STANDARD':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Generate unique tracking ID
   */
  public generateTrackingId(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `RZC-${timestamp.slice(-8)}-${random}`;
  }

  /**
   * Calculate risk score for fraud detection
   */
  private async calculateRiskScore(userId: number, usdValue: number): Promise<number> {
    try {
      // Get user's recent claim history
      const { data: recentClaims, error } = await supabase
        .from('claim_requests')
        .select('*')
        .eq('user_id', userId)
        .gte('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      let riskScore = 0.0;

      // Factor 1: Number of recent claims (0-0.3)
      const recentClaimCount = recentClaims?.length || 0;
      if (recentClaimCount > 5) riskScore += 0.3;
      else if (recentClaimCount > 3) riskScore += 0.2;
      else if (recentClaimCount > 1) riskScore += 0.1;

      // Factor 2: Claim size relative to user history (0-0.3)
      const userLimits = await this.getUserLimits(userId);
      if (usdValue > userLimits.expressLimitUsd * 0.8) riskScore += 0.3;
      else if (usdValue > userLimits.instantLimitUsd * 2) riskScore += 0.2;

      // Factor 3: User reputation (0-0.2)
      if (userLimits.reputationScore < 200) riskScore += 0.2;
      else if (userLimits.reputationScore < 400) riskScore += 0.1;

      // Factor 4: Time pattern analysis (0-0.2)
      if (recentClaims && recentClaims.length > 1) {
        const timeDiffs = recentClaims.slice(0, -1).map((claim, index) => {
          const current = new Date(claim.submitted_at).getTime();
          const next = new Date(recentClaims[index + 1].submitted_at).getTime();
          return current - next;
        });
        
        const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        if (avgTimeDiff < 60 * 60 * 1000) riskScore += 0.2; // Less than 1 hour between claims
        else if (avgTimeDiff < 6 * 60 * 60 * 1000) riskScore += 0.1; // Less than 6 hours
      }

      return Math.min(1.0, riskScore);
    } catch (error) {
      console.error('Error calculating risk score:', error);
      return 0.5; // Medium risk on error
    }
  }

  /**
   * Validate claim request before processing
   */
  public async validateClaimRequest(
    userId: number,
    rzcAmount: number,
    walletAddress: string
  ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
    try {
      const warnings: string[] = [];

      // Check if user has sufficient balance
      const { data: balance, error: balanceError } = await supabase
        .rpc('get_user_rzc_balance', { user_id: userId });

      if (balanceError) throw balanceError;

      if (!balance || balance.claimableRZC < rzcAmount) {
        return {
          valid: false,
          error: 'Insufficient claimable balance'
        };
      }

      // Check daily claim limits
      const { data: todayClaims, error: claimsError } = await supabase
        .from('claim_requests')
        .select('id')
        .eq('user_id', userId)
        .gte('submitted_at', new Date().toISOString().split('T')[0])
        .not('status', 'eq', 'CANCELLED');

      if (claimsError) throw claimsError;

      const userLimits = await this.getUserLimits(userId);
      if ((todayClaims?.length || 0) >= userLimits.dailyClaimLimit) {
        return {
          valid: false,
          error: 'Daily claim limit exceeded'
        };
      }

      // Check for pending claims
      const { data: pendingClaims, error: pendingError } = await supabase
        .from('claim_requests')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['PENDING', 'PROCESSING']);

      if (pendingError) throw pendingError;

      if (pendingClaims && pendingClaims.length > 0) {
        return {
          valid: false,
          error: 'You have pending claims. Please wait for them to complete before submitting new claims.'
        };
      }

      // Validate wallet address format
      if (!walletAddress || walletAddress.length < 10) {
        return {
          valid: false,
          error: 'Invalid wallet address'
        };
      }

      // Check for high risk score
      const usdValue = this.calculateUsdValue(rzcAmount);
      const riskScore = await this.calculateRiskScore(userId, usdValue);
      
      if (riskScore > 0.8) {
        return {
          valid: false,
          error: 'Claim flagged for manual review due to suspicious patterns'
        };
      } else if (riskScore > 0.6) {
        warnings.push('This claim will require additional verification');
      }

      return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error('Error validating claim request:', error);
      return {
        valid: false,
        error: 'Validation failed due to system error'
      };
    }
  }

  /**
   * Submit a new claim request
   */
  public async submitClaimRequest(
    userId: number,
    rzcAmount: number,
    walletAddress: string,
    network: string = 'TON'
  ): Promise<ProcessingResult> {
    try {
      // Validate the request
      const validation = await this.validateClaimRequest(userId, rzcAmount, walletAddress);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Calculate USD value and determine tier
      const usdValue = this.calculateUsdValue(rzcAmount);
      const processingTier = await this.determineProcessingTier(usdValue, userId);
      const processingDate = this.calculateProcessingTimeline(processingTier);
      const trackingId = this.generateTrackingId();
      const riskScore = await this.calculateRiskScore(userId, usdValue);

      // Get user reputation score
      const userLimits = await this.getUserLimits(userId);

      // Create claim request
      const claimRequest: Partial<ClaimRequest> = {
        userId,
        amount: rzcAmount,
        usdValue,
        processingTier,
        status: processingTier === 'INSTANT' ? 'PROCESSING' : 'PENDING',
        trackingId,
        submittedAt: new Date(),
        processingDate: processingTier === 'INSTANT' ? new Date() : processingDate,
        walletAddress,
        network,
        riskScore,
        userReputationScore: userLimits.reputationScore
      };

      // Insert into database
      const { data: insertedClaim, error: insertError } = await supabase
        .from('claim_requests')
        .insert({
          user_id: claimRequest.userId,
          tracking_id: claimRequest.trackingId,
          amount: claimRequest.amount,
          usd_value: claimRequest.usdValue,
          processing_tier: claimRequest.processingTier,
          status: claimRequest.status,
          submitted_at: claimRequest.submittedAt?.toISOString(),
          processing_date: claimRequest.processingDate?.toISOString(),
          wallet_address: claimRequest.walletAddress,
          network: claimRequest.network,
          risk_score: claimRequest.riskScore,
          user_reputation_score: claimRequest.userReputationScore
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Deduct from claimable balance immediately
      const { error: balanceError } = await supabase
        .rpc('update_user_balance_for_claim', {
          user_id: userId,
          claim_amount: rzcAmount
        });

      if (balanceError) {
        // Rollback claim request if balance update fails
        await supabase
          .from('claim_requests')
          .delete()
          .eq('id', insertedClaim.id);
        
        throw balanceError;
      }

      // For instant claims, process immediately
      if (processingTier === 'INSTANT') {
        // This would trigger immediate processing
        // For now, we'll just mark it as completed
        await this.processInstantClaim(insertedClaim.id);
      }

      return {
        success: true,
        trackingId,
        processingDate,
        estimatedCompletionTime: processingDate,
        recommendedAction: this.getRecommendedAction(processingTier, riskScore)
      };

    } catch (error) {
      console.error('Error submitting claim request:', error);
      return {
        success: false,
        error: 'Failed to submit claim request'
      };
    }
  }

  /**
   * Process instant claim immediately
   */
  private async processInstantClaim(claimId: number): Promise<void> {
    try {
      // Update status to completed
      const { error } = await supabase
        .from('claim_requests')
        .update({
          status: 'COMPLETED',
          processed_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      // TODO: Trigger actual token transfer to wallet
      // This would integrate with the blockchain transaction service

    } catch (error) {
      console.error('Error processing instant claim:', error);
      // Mark as failed
      await supabase
        .from('claim_requests')
        .update({
          status: 'FAILED',
          failure_reason: 'Instant processing failed'
        })
        .eq('id', claimId);
    }
  }

  /**
   * Get recommended action based on tier and risk score
   */
  private getRecommendedAction(tier: ProcessingTier, riskScore: number): string {
    if (riskScore > 0.7) {
      return 'HIGH_RISK_REVIEW';
    }
    
    switch (tier) {
      case 'INSTANT':
        return 'PROCESS_IMMEDIATELY';
      case 'EXPRESS':
        return 'AUTO_APPROVE_AFTER_DELAY';
      case 'STANDARD':
        return 'MANUAL_REVIEW_REQUIRED';
      default:
        return 'STANDARD_PROCESSING';
    }
  }

  /**
   * Get claim status and details
   */
  public async getClaimStatus(trackingId: string): Promise<ClaimRequest | null> {
    try {
      const { data: claim, error } = await supabase
        .from('claim_requests')
        .select('*')
        .eq('tracking_id', trackingId)
        .single();

      if (error) throw error;

      return claim ? {
        id: claim.id,
        userId: claim.user_id,
        amount: claim.amount,
        usdValue: claim.usd_value,
        processingTier: claim.processing_tier,
        status: claim.status,
        trackingId: claim.tracking_id,
        submittedAt: new Date(claim.submitted_at),
        processingDate: claim.processing_date ? new Date(claim.processing_date) : undefined,
        walletAddress: claim.wallet_address,
        network: claim.network,
        riskScore: claim.risk_score,
        userReputationScore: claim.user_reputation_score
      } : null;

    } catch (error) {
      console.error('Error getting claim status:', error);
      return null;
    }
  }

  /**
   * Get user's claim history
   */
  public async getUserClaimHistory(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ClaimRequest[]> {
    try {
      const { data: claims, error } = await supabase
        .from('claim_requests')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return claims?.map(claim => ({
        id: claim.id,
        userId: claim.user_id,
        amount: claim.amount,
        usdValue: claim.usd_value,
        processingTier: claim.processing_tier,
        status: claim.status,
        trackingId: claim.tracking_id,
        submittedAt: new Date(claim.submitted_at),
        processingDate: claim.processing_date ? new Date(claim.processing_date) : undefined,
        walletAddress: claim.wallet_address,
        network: claim.network,
        riskScore: claim.risk_score,
        userReputationScore: claim.user_reputation_score
      })) || [];

    } catch (error) {
      console.error('Error getting user claim history:', error);
      return [];
    }
  }

  /**
   * Get current tier thresholds
   */
  public getTierThresholds(): TierThresholds {
    return { ...this.tierThresholds };
  }

  /**
   * Get current exchange rate
   */
  public getCurrentExchangeRate(): number {
    return this.rzcUsdRate;
  }
}

export default TieredProcessingService;