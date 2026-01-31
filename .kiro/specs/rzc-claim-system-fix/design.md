# Design Document

## Overview

This design document outlines the comprehensive fix for the RZC claiming system that addresses critical issues preventing users from claiming their earned rewards. The solution focuses on creating a robust, reliable claiming mechanism with proper balance calculation, error handling, and UI state management.

## Architecture

The claiming system follows a layered architecture:

```
┌─────────────────────────────────────────┐
│           UI Layer (React)              │
│  - ArcadeMiningUI Component             │
│  - Balance Display & Claim Button       │
│  - Real-time Updates & Animations       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│        Service Layer (TypeScript)       │
│  - ClaimService (New)                   │
│  - BalanceCalculationService (New)      │
│  - ValidationService (Enhanced)         │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│       Data Layer (Supabase)             │
│  - getUserRZCBalance (Fixed)            │
│  - claimRZCRewards (Enhanced)           │
│  - Database Transactions                │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ClaimService

A new service to handle all claiming operations with proper error handling and validation:

```typescript
interface ClaimService {
  // Calculate accurate claimable balance
  calculateClaimableBalance(userId: number): Promise<ClaimableBalance>;
  
  // Process claim with full validation
  processClaim(userId: number, amount: number): Promise<ClaimResult>;
  
  // Validate claim eligibility
  validateClaimEligibility(userId: number, amount: number): Promise<ValidationResult>;
  
  // Handle mining session completion during claims
  completeActiveMiningSession(userId: number): Promise<SessionResult>;
}

interface ClaimableBalance {
  claimableFromMining: number;      // From completed mining sessions
  accumulatedFromActive: number;    // From current active session
  totalClaimable: number;          // Sum of above
  lastCalculated: Date;
}

interface ClaimResult {
  success: boolean;
  claimedAmount: number;
  newAvailableBalance: number;
  transactionId: string;
  error?: string;
}
```

### 2. BalanceCalculationService

Enhanced balance calculation with proper synchronization:

```typescript
interface BalanceCalculationService {
  // Get comprehensive balance information
  getComprehensiveBalance(userId: number): Promise<ComprehensiveBalance>;
  
  // Synchronize frontend and backend balances
  synchronizeBalances(userId: number): Promise<SyncResult>;
  
  // Calculate real-time accumulated RZC
  calculateAccumulatedRZC(session: MiningSession): number;
  
  // Validate balance consistency
  validateBalanceConsistency(userId: number): Promise<ConsistencyCheck>;
}

interface ComprehensiveBalance {
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
```

### 3. Enhanced UI State Management

Improved state management in ArcadeMiningUI component:

```typescript
interface ClaimingState {
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
}

interface ClaimingActions {
  loadBalances(): Promise<void>;
  processClaim(): Promise<void>;
  refreshAfterClaim(): Promise<void>;
  clearErrors(): void;
  resetClaimState(): void;
}
```

## Data Models

### Enhanced Activity Tracking

```sql
-- Enhanced activities table structure
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  transaction_id VARCHAR(100),
  security_validated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient claim queries
CREATE INDEX idx_activities_claim_lookup 
ON activities(user_id, type, status) 
WHERE type IN ('mining_complete', 'rzc_claim');
```

### Balance Consistency Tracking

```sql
-- New table for tracking balance calculations
CREATE TABLE balance_calculations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  calculated_claimable DECIMAL(18,8),
  database_available DECIMAL(18,8),
  discrepancy DECIMAL(18,8),
  mining_activities_count INTEGER,
  claim_activities_count INTEGER,
  calculation_timestamp TIMESTAMP DEFAULT NOW()
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Claimable Balance Calculation
*For any* user with mining activities, the claimable RZC should equal the sum of all unclaimed mining_complete activities
**Validates: Requirements 1.1, 1.2**

### Property 2: Total Balance Composition
*For any* user state, the total available balance should equal claimable RZC plus accumulated RZC plus claimed RZC
**Validates: Requirements 1.3**

### Property 3: Accumulated RZC Time Calculation
*For any* active mining session, the accumulated RZC should be calculated correctly based on elapsed time since session start
**Validates: Requirements 1.4**

### Property 4: Database Balance Priority
*For any* discrepancy between calculated and database balances, the system should prioritize database available_balance values
**Validates: Requirements 1.5**

### Property 5: Claim Validation
*For any* claim attempt, the system should validate available balance before processing
**Validates: Requirements 2.1**

### Property 6: Successful Claim Processing
*For any* claim with sufficient balance, the claim should succeed and update the available balance by the claimed amount
**Validates: Requirements 2.2, 2.4**

### Property 7: Activity Marking on Claim
*For any* successful claim, the corresponding mining_complete activities should be marked as claimed
**Validates: Requirements 2.3**

### Property 8: Claim Audit Trail
*For any* successful claim, a claim activity record should be created in the database
**Validates: Requirements 2.5**

### Property 9: Claim Failure State Preservation
*For any* failed claim operation, no balance states should be modified
**Validates: Requirements 3.4**

### Property 10: Error Logging
*For any* error that occurs, detailed error information should be logged for debugging
**Validates: Requirements 3.5**

### Property 11: UI Component Consistency
*For any* balance update, all UI components should display the same balance values consistently
**Validates: Requirements 4.1**

### Property 12: Claim Button State Management
*For any* claim processing state, the claim button should be disabled and show loading state
**Validates: Requirements 4.2**

### Property 13: Post-Claim UI Updates
*For any* successful claim, the UI should refresh balances and update immediately
**Validates: Requirements 4.3**

### Property 14: Tab Navigation Consistency
*For any* tab switch, the balance display should remain consistent across all views
**Validates: Requirements 4.4**

### Property 15: Component Initialization
*For any* component load, fresh balance data should be fetched from the database
**Validates: Requirements 5.1**

### Property 16: Backend Data Synchronization
*For any* balance update, the system should refresh data from the backend
**Validates: Requirements 5.3**

### Property 17: Mining Session Completion Updates
*For any* mining session completion, the claimable balance should be updated immediately
**Validates: Requirements 5.4**

### Property 18: Periodic Balance Refresh
*For any* time period, the system should implement periodic balance refresh to maintain accuracy
**Validates: Requirements 5.5**

### Property 19: Active Mining Session Claiming
*For any* claim during active mining, the current session should be completed first
**Validates: Requirements 6.2**

### Property 20: Mining Complete Activity Creation
*For any* completed mining session, a mining_complete activity should be created
**Validates: Requirements 6.3**

### Property 21: Threshold-Based Claiming
*For any* accumulated RZC that reaches claimable threshold, the system should allow claiming
**Validates: Requirements 6.4**

### Property 22: Mining Session Transition Handling
*For any* concurrent mining and claiming operations, the system should handle transitions correctly
**Validates: Requirements 6.5**

### Property 23: Database Transaction Usage
*For any* claim processing, database transactions should be used for consistency
**Validates: Requirements 7.1**

### Property 24: Atomic Metadata Updates
*For any* activity marking as claimed, metadata updates should be atomic
**Validates: Requirements 7.2**

### Property 25: Transaction Rollback
*For any* failed balance update, the operation should complete fully or roll back completely
**Validates: Requirements 7.3**

### Property 26: Concurrency Control
*For any* concurrent claim attempts, the system should prevent race conditions with proper locking
**Validates: Requirements 7.4**

### Property 27: Claim Button Availability State
*For any* available RZC balance, the claim button should be enabled with clear call-to-action
**Validates: Requirements 8.2**

### Property 28: Cooldown Button State
*For any* active cooldown period, the system should show remaining time and disable the button
**Validates: Requirements 8.4**

### Property 29: Reactive Button Updates
*For any* balance condition change, the button state should update immediately
**Validates: Requirements 8.5**

### Property 30: Real-time Accumulated Updates
*For any* active mining session, accumulated RZC should update every second
**Validates: Requirements 9.1**

### Property 31: Smooth Balance Animations
*For any* balance change, the display should animate smoothly without performance issues
**Validates: Requirements 9.2, 9.5**

## Error Handling

### Error Classification System

```typescript
enum ClaimErrorType {
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  CONCURRENT_CLAIM = 'concurrent_claim',
  MINING_SESSION_ERROR = 'mining_session_error'
}

interface ClaimError {
  type: ClaimErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}
```

### Error Recovery Strategies

1. **Insufficient Balance**: Refresh balances and show accurate available amount
2. **Database Error**: Retry with exponential backoff, show retry button
3. **Network Error**: Queue operation for retry when connection restored
4. **Validation Error**: Show specific validation message and requirements
5. **Concurrent Claim**: Wait and retry automatically with user notification
6. **Mining Session Error**: Complete session first, then retry claim

### User-Friendly Error Messages

```typescript
const ERROR_MESSAGES = {
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
  }
};
```

## Testing Strategy

### Unit Testing Approach

**Focus Areas:**
- Balance calculation logic with various mining activity scenarios
- Claim processing with different user states and edge cases
- Error handling for all identified error conditions
- UI state management during claim operations

**Key Test Scenarios:**
- User with no mining activities (should show 0 claimable)
- User with completed mining sessions (should show correct claimable amount)
- User with active mining session (should include accumulated RZC)
- Concurrent claim attempts (should handle gracefully)
- Database errors during claim processing (should not corrupt state)

### Property-Based Testing Configuration

Each property test will run a minimum of 100 iterations with randomized inputs to ensure comprehensive coverage. Tests will be tagged with the format: **Feature: rzc-claim-system-fix, Property {number}: {property_text}**

**Property Test Examples:**
- Generate random mining activities and verify balance calculations
- Create various user states and test claim processing
- Simulate network errors and verify error handling
- Test UI state transitions with random balance changes

### Integration Testing

**Database Integration:**
- Test claim operations with real database transactions
- Verify balance consistency across multiple operations
- Test concurrent user scenarios with proper isolation

**UI Integration:**
- Test complete user flows from balance display to claim completion
- Verify real-time updates and animations work correctly
- Test error scenarios with proper user feedback

### Performance Testing

**Load Testing:**
- Test claim processing under high concurrent user load
- Verify balance calculations perform efficiently with large datasets
- Test real-time updates don't cause performance degradation

**Memory Testing:**
- Verify no memory leaks in real-time balance updates
- Test component cleanup when switching between tabs
- Validate efficient state management with large user bases

## Implementation Phases

### Phase 1: Core Service Layer (Week 1)
- Implement ClaimService with proper validation
- Create BalanceCalculationService with accurate calculations
- Add comprehensive error handling and logging
- Write unit tests for all service methods

### Phase 2: Database Layer Fixes (Week 1)
- Fix getUserRZCBalance function with proper balance calculation
- Enhance claimRZCRewards with atomic transactions
- Add balance consistency tracking
- Implement proper indexing for performance

### Phase 3: UI Layer Integration (Week 2)
- Update ArcadeMiningUI with new service integration
- Implement proper state management for claiming
- Add real-time balance updates with smooth animations
- Create comprehensive error display system

### Phase 4: Testing and Validation (Week 2)
- Implement property-based tests for all correctness properties
- Add integration tests for complete user flows
- Perform load testing with concurrent users
- Validate backward compatibility with existing data

### Phase 5: Deployment and Monitoring (Week 3)
- Deploy with feature flags for gradual rollout
- Implement monitoring and alerting for claim operations
- Add administrative tools for troubleshooting
- Create user documentation and support materials

## Monitoring and Observability

### Key Metrics to Track

1. **Claim Success Rate**: Percentage of successful claims vs. attempts
2. **Balance Calculation Accuracy**: Frequency of balance discrepancies
3. **Error Distribution**: Breakdown of error types and frequencies
4. **Performance Metrics**: Claim processing time and database query performance
5. **User Experience**: Time from claim initiation to completion

### Alerting Thresholds

- Claim success rate drops below 95%
- Balance discrepancies exceed 1% of calculations
- Average claim processing time exceeds 3 seconds
- Error rate exceeds 5% of total operations
- Database query performance degrades by 50%

### Logging Strategy

```typescript
interface ClaimOperationLog {
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
```

This comprehensive design ensures a robust, reliable RZC claiming system that addresses all identified issues while providing excellent user experience and maintainability.