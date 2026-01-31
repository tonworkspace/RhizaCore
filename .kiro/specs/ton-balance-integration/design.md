# Design Document: TON Balance Integration

## Overview

This design implements TON blockchain balance fetching and display functionality within the existing NativeWalletUI component. The solution adds a new TON balance service, integrates it with the existing wallet interface, and provides real-time balance updates with proper error handling and caching.

## Architecture

The implementation follows a service-oriented architecture with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  NativeWalletUI │───▶│  TONBalanceService│───▶│   TON API       │
│   Component     │    │                  │    │  (tonapi.io)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   UI State      │    │   Cache Layer    │
│  Management     │    │  (30s TTL)       │
└─────────────────┘    └──────────────────┘
```

## Components and Interfaces

### TONBalanceService

A new service class that handles all TON balance operations:

```typescript
interface TONBalanceService {
  fetchBalance(address: string): Promise<TONBalanceResult>
  getCachedBalance(address: string): TONBalanceResult | null
  clearCache(address?: string): void
}

interface TONBalanceResult {
  success: boolean
  balance?: number
  balanceFormatted?: string
  usdValue?: number
  error?: string
  cached?: boolean
  timestamp?: number
}
```

### Enhanced NativeWalletUI State

Additional state properties for TON balance management:

```typescript
interface TONBalanceState {
  tonBalance: number | null
  tonBalanceUSD: number | null
  isTonBalanceLoading: boolean
  tonBalanceError: string | null
  lastTonBalanceUpdate: number | null
}
```

### API Integration

The service will integrate with TON API (tonapi.io) for balance queries:

```typescript
interface TONAPIResponse {
  balance: string  // Balance in nanotons
  status: string
  last_activity: number
}
```

## Data Models

### Balance Cache Entry

```typescript
interface BalanceCacheEntry {
  address: string
  balance: number
  usdValue: number
  timestamp: number
  expiresAt: number
}
```

### Balance Display Format

```typescript
interface BalanceDisplay {
  primary: string      // "1.234 TON"
  secondary: string    // "$2.47 USD"
  loading: boolean
  error: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Balance Fetch Consistency
*For any* valid TON address, fetching the balance multiple times within the cache period should return the same result without making additional API calls
**Validates: Requirements 1.4, 4.3**

### Property 2: Error Handling Resilience  
*For any* network error or API failure, the balance service should handle the error gracefully without crashing the component
**Validates: Requirements 3.1, 3.3**

### Property 3: Cache Expiration Accuracy
*For any* cached balance entry, the cache should expire exactly after the configured TTL period and trigger a fresh fetch on next request
**Validates: Requirements 1.4, 4.4**

### Property 4: Refresh Integration Completeness
*For any* refresh operation, both RZC and TON balances should be updated simultaneously and consistently
**Validates: Requirements 5.1, 5.5**

### Property 5: Request Deduplication Effectiveness
*For any* concurrent requests for the same address, only one API call should be made and the result shared among all requesters
**Validates: Requirements 4.2, 4.1**

## Error Handling

### Network Errors
- Connection timeouts: 10-second timeout with 3 retries
- API rate limits: Exponential backoff starting at 1 second
- Invalid responses: Graceful fallback to cached data if available

### Address Validation
- Empty/null addresses: Skip balance fetching entirely
- Invalid format: Log warning and display "Invalid address" message
- Network mismatch: Validate address format matches TON network

### UI Error States
- Loading state: Skeleton loader with shimmer effect
- Error state: "Balance unavailable" with retry button
- Offline state: Use cached data with "Last updated" timestamp

## Testing Strategy

### Unit Tests
- Test TONBalanceService methods with mocked API responses
- Test error handling with various failure scenarios
- Test cache behavior with different TTL configurations
- Test address validation with valid/invalid inputs

### Property-Based Tests
- Generate random TON addresses and verify consistent behavior
- Test cache expiration with various time intervals
- Test concurrent request handling with multiple simultaneous calls
- Test refresh integration with different component states

### Integration Tests
- Test full balance fetch flow from component to API
- Test UI updates when balance data changes
- Test error recovery and retry mechanisms
- Test performance under various network conditions

**Testing Configuration:**
- Minimum 100 iterations per property test
- Mock TON API responses for consistent testing
- Use real network calls in integration tests only
- Tag format: **Feature: ton-balance-integration, Property {number}: {property_text}**