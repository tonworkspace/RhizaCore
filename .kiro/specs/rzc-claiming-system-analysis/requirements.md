# Requirements Document

## Introduction

This document analyzes the current RZC (RhizaCore) claiming system in the ArcadeMiningUI component to understand its complexity, identify potential issues, and establish requirements for improvements. The system handles multiple types of RZC balances and claiming mechanisms with various edge cases and user flows.

## Glossary

- **RZC**: RhizaCore token that users earn through mining
- **Mining_Session**: Active period where users accumulate RZC over time
- **Accumulated_RZC**: RZC earned during current active mining session
- **Claimable_RZC**: RZC from completed mining sessions ready to be claimed
- **Claimed_RZC**: RZC that has been claimed and added to user's available balance
- **Total_Earned_RZC**: Sum of all RZC ever earned by the user
- **Airdrop_Balance**: Separate balance system for RZC that can be withdrawn to external wallets
- **Threshold_Claiming**: Automatic claiming when accumulated RZC reaches 10 tokens
- **Cooldown_Period**: 30-minute wait time between manual claims
- **Season_End_Claim**: Special claiming mechanism for end-of-season scenarios

## Requirements

### Requirement 1: Balance State Management

**User Story:** As a user, I want to understand my different RZC balances clearly, so that I know exactly how much I can claim and withdraw.

#### Acceptance Criteria

1. THE System SHALL maintain four distinct balance types: accumulated, claimable, claimed, and total earned
2. WHEN displaying balances, THE System SHALL show each balance type with clear labels
3. THE System SHALL calculate the total available balance as accumulated + claimable + claimed
4. WHEN mining is active, THE System SHALL update accumulated RZC in real-time every second
5. THE System SHALL persist balance state across browser sessions using localStorage

### Requirement 2: Automatic Threshold Claiming

**User Story:** As a user, I want my mining rewards to be automatically claimed when I reach certain thresholds, so that I don't lose progress if I forget to claim manually.

#### Acceptance Criteria

1. WHEN accumulated RZC reaches 10 tokens during mining, THE System SHALL automatically trigger a claim
2. THE System SHALL prevent duplicate automatic claims using a reference lock mechanism
3. WHEN automatic claiming occurs, THE System SHALL move accumulated RZC to claimable balance
4. THE System SHALL continue mining after automatic claiming without interruption
5. THE System SHALL update the last claim time to reset cooldown period after automatic claims

### Requirement 3: Manual Claiming with Cooldown

**User Story:** As a user, I want to manually claim my rewards when I choose, but with reasonable limits to prevent system abuse.

#### Acceptance Criteria

1. THE System SHALL allow manual claiming of claimable RZC and accumulated RZC
2. WHEN a manual claim is made, THE System SHALL enforce a 30-minute cooldown period
3. THE System SHALL display remaining cooldown time to users
4. WHEN cooldown is active, THE System SHALL prevent manual claims and show appropriate messaging
5. THE System SHALL allow bulk claiming from all available sources in a single transaction

### Requirement 4: Direct Airdrop Claiming

**User Story:** As a user, I want to claim all my RZC directly to my airdrop balance in one action, so that I can prepare for withdrawal to external wallets.

#### Acceptance Criteria

1. THE System SHALL provide a single button to claim all RZC to airdrop balance
2. WHEN claiming to airdrop, THE System SHALL first complete any active mining sessions
3. THE System SHALL then claim all pending claimable RZC to user's balance
4. THE System SHALL transfer total earned RZC to the airdrop balance system
5. THE System SHALL reset all mining balances to zero after successful airdrop claim
6. WHEN RZC is already claimed to airdrop, THE System SHALL show appropriate messaging
7. THE System SHALL refresh both mining and airdrop balances after the operation

### Requirement 5: Error Handling and Recovery

**User Story:** As a user, I want the system to handle errors gracefully and provide clear feedback when claiming operations fail.

#### Acceptance Criteria

1. WHEN a claim operation fails, THE System SHALL display specific error messages to users
2. THE System SHALL not modify balance states if backend operations fail
3. WHEN network errors occur, THE System SHALL allow users to retry operations
4. THE System SHALL validate sufficient balance before attempting claim operations
5. THE System SHALL handle edge cases like claiming zero amounts gracefully

### Requirement 6: Balance Synchronization

**User Story:** As a user, I want my balance to stay synchronized with the backend, so that I always see accurate information.

#### Acceptance Criteria

1. THE System SHALL refresh balances from the backend every 50 seconds
2. WHEN claim operations complete, THE System SHALL refresh balances after a 1-second delay
3. THE System SHALL validate mining state every 5 minutes
4. WHEN discrepancies are detected, THE System SHALL prioritize backend data over local state
5. THE System SHALL handle concurrent balance updates without race conditions

### Requirement 7: User Experience and Feedback

**User Story:** As a user, I want clear visual feedback and animations when claiming rewards, so that I feel engaged with the process.

#### Acceptance Criteria

1. WHEN claims are successful, THE System SHALL play sound effects and show celebration animations
2. THE System SHALL display loading states during claim operations
3. THE System SHALL show progress indicators for multi-step claiming processes
4. WHEN balances update, THE System SHALL animate the changes smoothly
5. THE System SHALL provide toast notifications with claim details and amounts

### Requirement 8: Season End and Special Claims

**User Story:** As a system administrator, I want special claiming mechanisms for season end scenarios, so that users can claim all rewards and optionally request airdrops.

#### Acceptance Criteria

1. THE System SHALL provide a season end claim modal for comprehensive claiming
2. WHEN season end claiming, THE System SHALL claim all available RZC from all sources
3. THE System SHALL optionally create airdrop requests with wallet addresses
4. THE System SHALL support node alias specification for airdrop requests
5. THE System SHALL handle partial success scenarios gracefully

### Requirement 9: Airdrop Balance Integration

**User Story:** As a user, I want seamless integration between mining balances and airdrop balances, so that I can easily move funds for withdrawal.

#### Acceptance Criteria

1. THE System SHALL maintain separate airdrop balance tracking
2. WHEN claiming to airdrop, THE System SHALL update both mining and airdrop balance displays
3. THE System SHALL prevent double-counting of RZC between systems
4. THE System SHALL support withdrawal creation from airdrop balances
5. THE System SHALL track withdrawal history and status

### Requirement 10: Anti-Manipulation and Double Claim Prevention

**User Story:** As a system administrator, I want to prevent users from claiming the same rewards multiple times or manipulating the claiming system, so that the token economy remains fair and secure.

#### Acceptance Criteria

1. THE System SHALL implement claim operation locks to prevent concurrent claims by the same user
2. THE System SHALL use unique transaction IDs to track and prevent duplicate claim requests
3. THE System SHALL validate claim eligibility before processing any claim operation
4. THE System SHALL implement server-side balance verification independent of frontend state
5. THE System SHALL detect and block suspicious claiming patterns and rapid-fire attempts
6. THE System SHALL maintain immutable audit logs for all claiming operations with timestamps
7. THE System SHALL implement claim request deduplication using idempotency keys
8. THE System SHALL enforce minimum time intervals between different types of claims
9. THE System SHALL validate that claimed amounts never exceed available balances
10. THE System SHALL implement automatic account flagging for detected manipulation attempts

### Requirement 11: Data Consistency and Integrity

**User Story:** As a system administrator, I want to ensure data consistency across all claiming operations, so that users cannot exploit the system or lose rewards.

#### Acceptance Criteria

1. THE System SHALL use database transactions for multi-step claiming operations
2. THE System SHALL prevent race conditions in concurrent claiming attempts
3. THE System SHALL validate all balance calculations before committing changes
4. THE System SHALL maintain audit trails for all claiming activities
5. THE System SHALL handle edge cases like claiming during mining session transitions