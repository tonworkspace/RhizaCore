/**
 * ClaimSecurityService - Anti-manipulation security measures for RZC claiming
 * 
 * This service implements comprehensive security measures to prevent:
 * - Double claiming and manipulation attempts
 * - Concurrent claim operations by the same user
 * - Suspicious claiming patterns and rapid-fire attempts
 * - Balance manipulation and exploitation
 */

import { supabase } from '../lib/supabaseClient';

interface ClaimLock {
  userId: number;
  lockId: string;
  timestamp: number;
  operation: string;
}

interface ClaimAttempt {
  userId: number;
  timestamp: number;
  amount: number;
  operation: string;
  success: boolean;
}

interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
  lockId?: string;
  shouldBlock?: boolean;
  blockDuration?: number;
}

class ClaimSecurityService {
  private static instance: ClaimSecurityService;
  private claimLocks = new Map<number, ClaimLock>();
  private claimAttempts = new Map<number, ClaimAttempt[]>();
  private blockedUsers = new Map<number, { until: number; reason: string }>();
  
  // Security configuration
  // private readonly MAX_CONCURRENT_CLAIMS = 1; // Unused
  private readonly CLAIM_RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_CLAIMS_PER_WINDOW = 3;
  // private readonly SUSPICIOUS_PATTERN_THRESHOLD = 5; // Unused
  private readonly BLOCK_DURATION = 300000; // 5 minutes
  private readonly LOCK_TIMEOUT = 30000; // 30 seconds

  private constructor() {
    // Clean up expired locks and blocks periodically
    setInterval(() => {
      this.cleanupExpiredLocks();
      this.cleanupExpiredBlocks();
    }, 10000); // Every 10 seconds
  }

  public static getInstance(): ClaimSecurityService {
    if (!ClaimSecurityService.instance) {
      ClaimSecurityService.instance = new ClaimSecurityService();
    }
    return ClaimSecurityService.instance;
  }

  /**
   * Acquire a claim operation lock for a user
   */
  public async acquireClaimLock(userId: number, operation: string): Promise<SecurityValidationResult> {
    const now = Date.now();
    
    // Check if user is blocked
    const blockInfo = this.blockedUsers.get(userId);
    if (blockInfo && blockInfo.until > now) {
      return {
        isValid: false,
        error: `Account temporarily blocked: ${blockInfo.reason}. Try again in ${Math.ceil((blockInfo.until - now) / 1000)} seconds.`,
        shouldBlock: true,
        blockDuration: blockInfo.until - now
      };
    }

    // Check for existing lock
    const existingLock = this.claimLocks.get(userId);
    if (existingLock && (now - existingLock.timestamp) < this.LOCK_TIMEOUT) {
      return {
        isValid: false,
        error: 'Another claim operation is already in progress. Please wait and try again.',
        shouldBlock: false
      };
    }

    // Check rate limiting
    const rateLimit = this.checkRateLimit(userId, now);
    if (!rateLimit.isValid) {
      return rateLimit;
    }

    // Generate unique lock ID
    const lockId = `${userId}-${operation}-${now}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Acquire lock
    this.claimLocks.set(userId, {
      userId,
      lockId,
      timestamp: now,
      operation
    });

    return {
      isValid: true,
      lockId
    };
  }

  /**
   * Release a claim operation lock
   */
  public releaseClaimLock(userId: number, lockId: string): boolean {
    const lock = this.claimLocks.get(userId);
    if (lock && lock.lockId === lockId) {
      this.claimLocks.delete(userId);
      return true;
    }
    return false;
  }

  /**
   * Validate claim operation before processing
   */
  public async validateClaimOperation(
    userId: number, 
    amount: number, 
    operation: string,
    currentBalance: { claimable: number; accumulated: number; claimed: number }
  ): Promise<SecurityValidationResult> {
    // const now = Date.now(); // Unused

    // Basic validation
    if (amount <= 0) {
      return {
        isValid: false,
        error: 'Invalid claim amount'
      };
    }

    // Check available balance
    const availableBalance = currentBalance.claimable + currentBalance.accumulated;
    if (amount > availableBalance) {
      // Log suspicious attempt
      await this.logSuspiciousActivity(userId, 'balance_manipulation', {
        requestedAmount: amount,
        availableBalance,
        operation
      });

      return {
        isValid: false,
        error: 'Insufficient balance for claim operation'
      };
    }

    // Check for suspicious patterns
    const suspiciousCheck = await this.checkSuspiciousPatterns(userId, amount, operation);
    if (!suspiciousCheck.isValid) {
      return suspiciousCheck;
    }

    // Server-side balance verification
    const balanceVerification = await this.verifyBalanceWithDatabase(userId, currentBalance);
    if (!balanceVerification.isValid) {
      return balanceVerification;
    }

    return { isValid: true };
  }

  /**
   * Record claim attempt for monitoring
   */
  public recordClaimAttempt(userId: number, amount: number, operation: string, success: boolean): void {
    const now = Date.now();
    
    if (!this.claimAttempts.has(userId)) {
      this.claimAttempts.set(userId, []);
    }

    const attempts = this.claimAttempts.get(userId)!;
    attempts.push({
      userId,
      timestamp: now,
      amount,
      operation,
      success
    });

    // Keep only recent attempts (last hour)
    const oneHourAgo = now - 3600000;
    this.claimAttempts.set(userId, attempts.filter(a => a.timestamp > oneHourAgo));
  }

  /**
   * Generate unique transaction ID for idempotency
   */
  public generateTransactionId(userId: number, operation: string, amount: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `TXN-${userId}-${operation}-${amount}-${timestamp}-${random}`;
  }

  /**
   * Check if transaction ID already exists (idempotency check)
   */
  public async checkTransactionIdempotency(transactionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id')
        .eq('transaction_id', transactionId)
        .limit(1);

      if (error) {
        console.error('Error checking transaction idempotency:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking transaction idempotency:', error);
      return false;
    }
  }

  /**
   * Log audit trail for claim operation
   */
  public async logClaimAudit(
    userId: number,
    operation: string,
    amount: number,
    transactionId: string,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.from('claim_audit_log').insert({
        user_id: userId,
        operation,
        amount,
        transaction_id: transactionId,
        success,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_hash: await this.getClientIpHash()
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging claim audit:', error);
    }
  }

  /**
   * Check rate limiting for user
   */
  private checkRateLimit(userId: number, now: number): SecurityValidationResult {
    const attempts = this.claimAttempts.get(userId) || [];
    const recentAttempts = attempts.filter(a => (now - a.timestamp) < this.CLAIM_RATE_LIMIT_WINDOW);

    if (recentAttempts.length >= this.MAX_CLAIMS_PER_WINDOW) {
      // Block user temporarily
      this.blockedUsers.set(userId, {
        until: now + this.BLOCK_DURATION,
        reason: 'Rate limit exceeded'
      });

      return {
        isValid: false,
        error: `Too many claim attempts. Please wait ${this.BLOCK_DURATION / 1000} seconds before trying again.`,
        shouldBlock: true,
        blockDuration: this.BLOCK_DURATION
      };
    }

    return { isValid: true };
  }

  /**
   * Check for suspicious claiming patterns
   */
  private async checkSuspiciousPatterns(userId: number, amount: number, operation: string): Promise<SecurityValidationResult> {
    const attempts = this.claimAttempts.get(userId) || [];
    const now = Date.now();
    
    // Check for rapid-fire attempts (within 5 seconds)
    const rapidAttempts = attempts.filter(a => (now - a.timestamp) < 5000);
    if (rapidAttempts.length >= 3) {
      await this.logSuspiciousActivity(userId, 'rapid_fire_attempts', {
        attempts: rapidAttempts.length,
        operation
      });

      this.blockedUsers.set(userId, {
        until: now + this.BLOCK_DURATION,
        reason: 'Suspicious rapid-fire claiming detected'
      });

      return {
        isValid: false,
        error: 'Suspicious activity detected. Account temporarily blocked.',
        shouldBlock: true,
        blockDuration: this.BLOCK_DURATION
      };
    }

    // Check for identical amount patterns
    const identicalAmounts = attempts.filter(a => 
      a.amount === amount && (now - a.timestamp) < 60000
    );
    if (identicalAmounts.length >= 3) {
      await this.logSuspiciousActivity(userId, 'identical_amount_pattern', {
        amount,
        attempts: identicalAmounts.length,
        operation
      });

      return {
        isValid: false,
        error: 'Suspicious claiming pattern detected. Please vary your claim amounts.',
        shouldBlock: false
      };
    }

    return { isValid: true };
  }

  /**
   * Verify balance with database
   */
  private async verifyBalanceWithDatabase(
    userId: number, 
    frontendBalance: { claimable: number; accumulated: number; claimed: number }
  ): Promise<SecurityValidationResult> {
    try {
      // Get fresh balance calculation from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('available_balance')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return {
          isValid: false,
          error: 'Unable to verify account balance'
        };
      }

      // Get unclaimed mining activities to calculate actual claimable balance
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('amount, metadata')
        .eq('user_id', userId)
        .eq('type', 'mining_complete')
        .eq('status', 'completed');

      if (activitiesError) {
        return {
          isValid: false,
          error: 'Unable to verify claimable balance'
        };
      }

      // Calculate claimable RZC from unclaimed mining activities
      let dbClaimableBalance = 0;
      activities?.forEach(activity => {
        // Only count if not claimed to airdrop
        if (!activity.metadata?.claimed_to_airdrop) {
          dbClaimableBalance += parseFloat(activity.amount) || 0;
        }
      });

      const tolerance = 0.001; // Small tolerance for floating point differences

      // Check if frontend claimable balance matches database calculation
      if (Math.abs(frontendBalance.claimable - dbClaimableBalance) > tolerance) {
        // For development mode, be more lenient and provide detailed logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Balance verification details:', {
            frontendClaimable: frontendBalance.claimable,
            databaseClaimable: dbClaimableBalance,
            databaseAvailable: parseFloat(user.available_balance) || 0,
            difference: Math.abs(frontendBalance.claimable - dbClaimableBalance),
            tolerance
          });
          
          // In development, allow larger discrepancies but log them
          if (Math.abs(frontendBalance.claimable - dbClaimableBalance) < 5.0) {
            console.warn('Balance discrepancy detected in development mode, allowing claim to proceed');
            return { isValid: true };
          }
        }

        await this.logSuspiciousActivity(userId, 'balance_discrepancy', {
          frontendClaimable: frontendBalance.claimable,
          databaseClaimable: dbClaimableBalance,
          databaseAvailable: parseFloat(user.available_balance) || 0,
          difference: Math.abs(frontendBalance.claimable - dbClaimableBalance),
          tolerance,
          isDevelopment: process.env.NODE_ENV === 'development'
        });

        return {
          isValid: false,
          error: 'Balance verification failed. Please refresh and try again.'
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error verifying balance:', error);
      return {
        isValid: false,
        error: 'Balance verification failed'
      };
    }
  }

  /**
   * Log suspicious activity
   */
  private async logSuspiciousActivity(userId: number, activityType: string, metadata: any): Promise<void> {
    try {
      await supabase.from('suspicious_activity_log').insert({
        user_id: userId,
        activity_type: activityType,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging suspicious activity:', error);
    }
  }

  /**
   * Get client IP hash for audit logging
   */
  private async getClientIpHash(): Promise<string> {
    try {
      // Simple hash of user agent and timestamp for privacy
      const data = navigator.userAgent + Date.now().toString();
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    for (const [userId, lock] of this.claimLocks.entries()) {
      if ((now - lock.timestamp) > this.LOCK_TIMEOUT) {
        this.claimLocks.delete(userId);
      }
    }
  }

  /**
   * Clean up expired blocks
   */
  private cleanupExpiredBlocks(): void {
    const now = Date.now();
    for (const [userId, block] of this.blockedUsers.entries()) {
      if (block.until <= now) {
        this.blockedUsers.delete(userId);
      }
    }
  }

  /**
   * Get user's current security status
   */
  public getUserSecurityStatus(userId: number): {
    isLocked: boolean;
    isBlocked: boolean;
    blockReason?: string;
    blockTimeRemaining?: number;
    recentAttempts: number;
  } {
    const now = Date.now();
    const lock = this.claimLocks.get(userId);
    const block = this.blockedUsers.get(userId);
    const attempts = this.claimAttempts.get(userId) || [];
    const recentAttempts = attempts.filter(a => (now - a.timestamp) < this.CLAIM_RATE_LIMIT_WINDOW).length;

    return {
      isLocked: lock ? (now - lock.timestamp) < this.LOCK_TIMEOUT : false,
      isBlocked: block ? block.until > now : false,
      blockReason: block?.reason,
      blockTimeRemaining: block ? Math.max(0, block.until - now) : 0,
      recentAttempts
    };
  }
}

export default ClaimSecurityService;