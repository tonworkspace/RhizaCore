# Requirements Document

## Introduction

This feature will integrate TON blockchain balance fetching functionality into the NativeWalletUI component to display the user's actual TON balance from their connected wallet address.

## Glossary

- **TON_API**: The TON blockchain API service for querying wallet balances
- **Wallet_Component**: The NativeWalletUI React component that displays wallet information
- **Balance_Service**: Service responsible for fetching and formatting TON balance data
- **TON_Address**: The user's connected TON wallet address

## Requirements

### Requirement 1: TON Balance Fetching

**User Story:** As a user with a connected TON wallet, I want to see my actual TON balance, so that I can monitor my TON holdings alongside my RZC balance.

#### Acceptance Criteria

1. WHEN a user has a connected TON address, THE Balance_Service SHALL fetch the current TON balance from the blockchain
2. WHEN the TON balance is successfully fetched, THE Wallet_Component SHALL display the balance in a user-friendly format
3. WHEN the balance fetch fails, THE Wallet_Component SHALL display a fallback state without breaking the UI
4. THE Balance_Service SHALL cache balance data for 30 seconds to avoid excessive API calls
5. WHEN the component mounts or refreshes, THE Balance_Service SHALL automatically fetch the latest balance

### Requirement 2: Balance Display Integration

**User Story:** As a user, I want to see my TON balance prominently displayed in the wallet interface, so that I have a complete view of my assets.

#### Acceptance Criteria

1. THE Wallet_Component SHALL display TON balance alongside the existing RZC balance
2. WHEN displaying TON balance, THE Wallet_Component SHALL show both TON amount and USD equivalent
3. THE Wallet_Component SHALL format large numbers with appropriate decimal places and thousand separators
4. WHEN TON balance is loading, THE Wallet_Component SHALL show a loading indicator
5. THE Wallet_Component SHALL update the balance display when the refresh function is called

### Requirement 3: Error Handling and Resilience

**User Story:** As a user, I want the wallet interface to remain functional even when TON balance cannot be fetched, so that other wallet features continue to work.

#### Acceptance Criteria

1. WHEN TON API is unavailable, THE Balance_Service SHALL handle the error gracefully
2. WHEN network requests timeout, THE Balance_Service SHALL retry up to 3 times with exponential backoff
3. IF all retry attempts fail, THE Wallet_Component SHALL display "Balance unavailable" message
4. THE Balance_Service SHALL log errors for debugging without exposing sensitive information
5. WHEN TON address is invalid or empty, THE Balance_Service SHALL skip balance fetching

### Requirement 4: Performance Optimization

**User Story:** As a user, I want the wallet interface to load quickly and not make excessive network requests, so that the app remains responsive.

#### Acceptance Criteria

1. THE Balance_Service SHALL implement request debouncing to prevent rapid successive API calls
2. WHEN multiple components request the same balance, THE Balance_Service SHALL deduplicate requests
3. THE Balance_Service SHALL use efficient caching to minimize API usage
4. WHEN balance data is cached and fresh, THE Balance_Service SHALL return cached data immediately
5. THE Balance_Service SHALL refresh cached data in the background when approaching expiration

### Requirement 5: Integration with Existing Refresh Mechanism

**User Story:** As a user, I want my TON balance to refresh when I manually refresh my wallet, so that I can get the most current balance information.

#### Acceptance Criteria

1. WHEN the refreshBalance function is called, THE Balance_Service SHALL fetch fresh TON balance data
2. WHEN squad mining or other actions complete, THE TON balance SHALL refresh automatically
3. THE Balance_Service SHALL integrate with the existing window.refreshWalletBalance global function
4. WHEN balance refresh is triggered, THE Wallet_Component SHALL show loading state during the fetch
5. THE refreshBalance function SHALL update both RZC and TON balances simultaneously