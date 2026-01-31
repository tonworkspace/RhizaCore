# Design Document

## Architecture Overview

The unlimited RZC claim system will replace the current tiered, cooldown-based claiming mechanism with a streamlined, instant claiming system that allows users to claim any amount of their earned RZC without restrictions. The design prioritizes user freedom, simplicity, and immediate access to rewards while maintaining security and audit capabilities.

## System Components

### 1. Unified Balance Aggregation Service

**Purpose**: Consolidate all RZC sources into a single claimable balance

**Components**:
- `BalanceAggregator`: Combines RZC from all sources (mining, validated, completed sessions)
- `RealTimeBalanceUpdater`: Updates balance displays in real-time during mining
- `BalanceValidator`: Ensures balance calculations are accurate before claims

**Key Functions**:
```typescript
interface BalanceAggregator {
  getTotalClaimableBalance(userId: number): Promise<number>;
  getBalanceBreakdown(userId: number): Promise<BalanceBreakdown>;
  updateRealTimeBalance(userId: number, newAmount: number): void;
}

interface BalanceBreakdown {
  activeMiningRZC: number;
  completedMiningRZC: number;
  validatedRZC: number;
  totalClaimable: number;
  lastUpdated: Date;
}
```

### 2. Instant Claim Processing Engine

**Purpose**: Process all claims immediately without delays or restrictions

**Components**:
- `InstantClaimProcessor`: Handles immediate claim execution
- `BalanceTransferService`: Moves RZC from various sources to airdrop balance
- `MiningSessionManager`: Automatically completes active mining sessions during claims
- `TransactionLogger`: Records all claim activities for audit trail

**Key Functions**:
```typescript
interface InstantClaimProcessor {
  processUnlimitedClaim(userId: number): Promise<ClaimResult>;
  validateClaimEligibility(userId: number): Promise<boolean>;
  executeBalanceTransfer(userId: number, amount: number): Promise<TransferResult>;
}

interface ClaimResult {
  success: boolean;
  claimedAmount: number;
  newAirdropBalance: number;
  transactionId: string;
  timestamp: Date;
  error?: string;
}
```

### 3. Mining Session Auto-Completion

**Purpose**: Automatically complete active mining sessions during claims

**Components**:
- `SessionCompletionService`: Handles automatic session completion
- `EarningsCalculator`: Calculates final earnings from active sessions
- `SessionStateManager`: Updates session status and records completion

**Key Functions**:
```typescript
interface SessionCompletionService {
  autoCompleteActiveSessions(userId: number): Promise<CompletionResult>;
  calculateSessionEarnings(session: MiningSession): number;
  updateSessionStatus(sessionId: number, status: 'completed'): Promise<void>;
}
```

### 4. Simplified User Interface

**Purpose**: Provide a clean, one-click claiming experience

**Components**:
- `UnlimitedClaimButton`: Single button to claim all available RZC
- `BalanceDisplay`: Real-time balance showing total claimable amount
- `ClaimFeedback`: Immediate visual feedback for successful claims
- `ProgressIndicator`: Shows claim processing status

**UI Elements**:
- Prominent "Claim All RZC" button when balance > 0
- Real-time balance counter with smooth animations
- Success animations and haptic feedback
- Clear error messages with recovery suggestions

### 5. Enhanced Error Handling System

**Purpose**: Provide robust error recovery and user guidance

**Components**:
- `ErrorRecoveryService`: Handles automatic retry logic
- `BalanceReconciliation`: Ensures balance consistency after errors
- `UserNotificationService`: Provides clear error messages and recovery steps
- `SystemHealthMonitor`: Monitors claim processing health

**Error Handling Strategy**:
- Automatic retry for transient failures (network, database timeouts)
- Balance rollback for partial failures
- Clear user messaging for permanent failures
- Detailed logging for debugging and support

## Database Schema Changes

### Modified Tables

#### 1. Enhanced Activities Table
```sql
-- Add new activity types for unlimited claiming
ALTER TABLE activities ADD COLUMN IF NOT EXISTS claim_type VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS source_breakdown JSONB;

-- New activity types:
-- 'unlimited_claim' - Full balance claim
-- 'mining_auto_complete' - Auto-completed mining session
-- 'balance_reset' - Mining balance reset after claim
```

#### 2. Updated Users Table
```sql
-- Remove claim cooldown tracking
ALTER TABLE users DROP COLUMN IF EXISTS last_claim_time;
ALTER TABLE users DROP COLUMN IF EXISTS claim_cooldown_end;

-- Add unlimited claim tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_unlimited_claims INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_unlimited_claim_time TIMESTAMP;
```

#### 3. New Claim Audit Table
```sql
CREATE TABLE IF NOT EXISTS unlimited_claim_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  claimed_amount DECIMAL(20,8) NOT NULL,
  mining_amount DECIMAL(20,8) DEFAULT 0,
  validated_amount DECIMAL(20,8) DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  transaction_id VARCHAR(100) UNIQUE,
  claim_timestamp TIMESTAMP DEFAULT NOW(),
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  balance_before DECIMAL(20,8),
  balance_after DECIMAL(20,8)
);
```

## API Design

### New Endpoints

#### 1. Get Total Claimable Balance
```typescript
GET /api/balance/claimable/:userId
Response: {
  totalClaimable: number;
  breakdown: {
    activeMining: number;
    completedMining: number;
    validated: number;
  };
  lastUpdated: string;
}
```

#### 2. Process Unlimited Claim
```typescript
POST /api/claim/unlimited
Body: { userId: number }
Response: {
  success: boolean;
  claimedAmount: number;
  transactionId: string;
  newAirdropBalance: number;
  completedSessions: number;
  error?: string;
}
```

#### 3. Get Claim History
```typescript
GET /api/claim/history/:userId
Response: {
  claims: Array<{
    id: number;
    amount: number;
    timestamp: string;
    transactionId: string;
    sourceBreakdown: object;
  }>;
  totalClaims: number;
  totalAmount: number;
}
```

## Security Considerations

### 1. Balance Validation
- Double-check all balance calculations before processing claims
- Implement database-level constraints to prevent negative balances
- Use database transactions to ensure atomicity

### 2. Audit Trail
- Log every claim attempt with full context
- Record balance changes with before/after snapshots
- Maintain detailed error logs for debugging

### 3. Rate Limiting (Soft)
- Monitor for unusual claim patterns (informational only)
- Log high-frequency claims for analysis
- No blocking or restrictions on legitimate usage

### 4. Data Integrity
- Use database transactions for all claim operations
- Implement rollback mechanisms for failed claims
- Validate data consistency after each operation

## Performance Optimizations

### 1. Real-Time Updates
- Use WebSocket connections for instant balance updates
- Implement efficient polling fallback for poor connections
- Cache balance calculations for improved response times

### 2. Database Optimization
- Index frequently queried columns (user_id, timestamps)
- Use database functions for complex balance calculations
- Implement connection pooling for high concurrency

### 3. UI Responsiveness
- Optimistic UI updates for instant feedback
- Progressive loading for claim history
- Efficient re-rendering with React optimization techniques

## Migration Strategy

### Phase 1: Backend Implementation
1. Create new database tables and modify existing ones
2. Implement new balance aggregation service
3. Build instant claim processing engine
4. Add comprehensive error handling and logging

### Phase 2: Frontend Integration
1. Update ArcadeMiningUI component with new claiming logic
2. Replace tiered claim buttons with single "Claim All" button
3. Implement real-time balance updates
4. Add success animations and feedback

### Phase 3: Testing and Validation
1. Test with various balance scenarios
2. Validate error handling and recovery
3. Performance testing under load
4. User acceptance testing

### Phase 4: Deployment and Monitoring
1. Deploy with feature flags for gradual rollout
2. Monitor claim processing performance
3. Track user adoption and satisfaction
4. Gather feedback for further improvements

## Monitoring and Analytics

### Key Metrics
- Claim success rate (target: >99.9%)
- Average claim processing time (target: <2 seconds)
- User satisfaction with claiming experience
- Error rates and recovery success

### Dashboards
- Real-time claim processing status
- Balance aggregation accuracy
- Error tracking and resolution
- User behavior analytics

## Future Enhancements

### Potential Improvements
1. **Batch Operations**: Allow claiming for multiple users simultaneously
2. **Smart Notifications**: Proactive notifications when significant RZC is available
3. **Claim Scheduling**: Allow users to schedule automatic claims
4. **Advanced Analytics**: Detailed claiming patterns and optimization suggestions
5. **Mobile Optimization**: Enhanced mobile experience with offline support

### Scalability Considerations
- Horizontal scaling for high user volumes
- Database sharding for improved performance
- CDN integration for global accessibility
- Microservices architecture for component isolation