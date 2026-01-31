/**
 * ClaimTypes - TypeScript interfaces and error types for the RZC claiming system
 * 
 * This file contains all the TypeScript interfaces, types, and enums used
 * throughout the claiming system to ensure type safety and consistency.
 */

// ==========================================
// CORE INTERFACES
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
// ERROR TYPES
// ==========================================

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
// ACTIVITY TYPES
// ==========================================

export interface Activity {
  id: number;
  user_id: number;
  type: ActivityType;
  amount: number;
  status: ActivityStatus;
  transaction_id?: string;
  security_validated?: boolean;
  metadata?: ActivityMetadata;
  created_at: string;
  updated_at?: string;
}

export type ActivityType = 
  | 'mining_start'
  | 'mining_complete'
  | 'rzc_claim'
  | 'mining_rig_mk2'
  | 'extended_session'
  | 'passive_income_boost'
  | 'season_end_claim'
  | 'airdrop_claim_request';

export type ActivityStatus = 'pending' | 'completed' | 'failed';

export interface ActivityMetadata {
  claimed_to_airdrop?: boolean;
  claimed_at?: string;
  claimed_amount?: number;
  transaction_id?: string;
  session_id?: number;
  elapsed_hours?: number;
  completed_during_claim?: boolean;
  claim_type?: string;
  claimed_from_mining?: boolean;
  activities_marked?: number;
  previous_available_balance?: number;
  new_available_balance?: number;
  level?: number;
  [key: string]: any;
}

// ==========================================
// SECURITY TYPES
// ==========================================

export interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
  lockId?: string;
  shouldBlock?: boolean;
  blockDuration?: number;
}

export interface ClaimLock {
  userId: number;
  lockId: string;
  timestamp: number;
  operation: string;
}

export interface ClaimAttempt {
  userId: number;
  timestamp: number;
  amount: number;
  operation: string;
  success: boolean;
}

// ==========================================
// USER BALANCE TYPES
// ==========================================

export interface UserBalance {
  user_id: number;
  claimable_rzc: number;
  total_rzc_earned: number;
  last_claim_time?: string;
  created_at: string;
  updated_at: string;
}

export interface BalanceCalculation {
  id: number;
  user_id: number;
  calculated_claimable: number;
  database_available: number;
  discrepancy: number;
  mining_activities_count: number;
  claim_activities_count: number;
  calculation_timestamp: string;
}

// ==========================================
// LOGGING TYPES
// ==========================================

export interface ClaimOperationLog {
  userId: number;
  operation: 'balance_calculation' | 'claim_processing' | 'error_handling';
  timestamp: Date;
  duration: number;
  success: boolean;
  details: {
    balanceBefore?: ComprehensiveBalance;
    balanceAfter?: ComprehensiveBalance;
    claimedAmount?: number;
    errorType?: ClaimErrorType;
    errorDetails?: any;
  };
}

export interface AuditLogEntry {
  user_id: number;
  operation: string;
  amount: number;
  transaction_id: string;
  success: boolean;
  metadata?: any;
  created_at: string;
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type ClaimingState = {
  // Balance states
  balances: ComprehensiveBalance | null;
  isLoadingBalances: boolean;
  balanceError: string | null;
  
  // Claiming states
  isProcessingClaim: boolean;
  claimError: string | null;
  lastClaimResult: ClaimResult | null;
  
  // UI states
  canClaim: boolean;
  claimButtonText: string;
  showClaimSuccess: boolean;
};

export type ClaimingActions = {
  loadBalances(): Promise<void>;
  processClaim(): Promise<void>;
  refreshAfterClaim(): Promise<void>;
  clearErrors(): void;
  resetClaimState(): void;
};

// ==========================================
// ERROR MESSAGE CONSTANTS
// ==========================================

export const ERROR_MESSAGES = {
  [ClaimErrorType.INSUFFICIENT_BALANCE]: {
    title: "Insufficient Balance",
    message: "You don't have enough RZC to claim this amount.",
    action: "Continue mining to earn more RZC"
  },
  [ClaimErrorType.DATABASE_ERROR]: {
    title: "Database Error",
    message: "Unable to process your claim right now.",
    action: "Please try again in a moment"
  },
  [ClaimErrorType.NETWORK_ERROR]: {
    title: "Connection Error",
    message: "Check your internet connection and try again.",
    action: "Retry when connection is restored"
  },
  [ClaimErrorType.VALIDATION_ERROR]: {
    title: "Validation Error",
    message: "The claim request could not be validated.",
    action: "Please check your balance and try again"
  },
  [ClaimErrorType.CONCURRENT_CLAIM]: {
    title: "Claim in Progress",
    message: "Another claim operation is already in progress.",
    action: "Please wait and try again"
  },
  [ClaimErrorType.MINING_SESSION_ERROR]: {
    title: "Mining Session Error",
    message: "There was an issue with your mining session.",
    action: "Please restart mining and try again"
  },
  [ClaimErrorType.TRANSACTION_ERROR]: {
    title: "Transaction Error",
    message: "The claim transaction could not be completed.",
    action: "Please try again or contact support"
  }
} as const;

// ==========================================
// TYPE GUARDS
// ==========================================

export function isClaimError(error: any): error is ClaimError {
  return error && typeof error === 'object' && 'type' in error && 'message' in error;
}

export function isValidClaimResult(result: any): result is ClaimResult {
  return result && 
         typeof result === 'object' && 
         'success' in result && 
         'claimedAmount' in result && 
         'newAvailableBalance' in result && 
         'transactionId' in result;
}

export function isValidMiningSession(session: any): session is MiningSession {
  return session && 
         typeof session === 'object' && 
         'id' in session && 
         'user_id' in session && 
         'start_time' in session && 
         'status' in session;
}

// ==========================================
// CONSTANTS
// ==========================================

export const CLAIM_CONSTANTS = {
  MAX_CLAIM_AMOUNT: 1000000, // Maximum RZC that can be claimed at once
  MIN_CLAIM_AMOUNT: 0.000001, // Minimum RZC that can be claimed
  MINING_SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_RZC_PER_SESSION: 50, // Maximum RZC per mining session
  RZC_PER_HOUR: 50 / 24, // RZC earned per hour during mining
  CLAIM_COOLDOWN: 0, // No cooldown for claims (in milliseconds)
  TRANSACTION_TIMEOUT: 30000, // 30 seconds timeout for transactions
  BALANCE_SYNC_INTERVAL: 60000, // 1 minute interval for balance synchronization
} as const;