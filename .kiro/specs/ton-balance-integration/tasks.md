# Implementation Plan: TON Balance Integration

## Overview

This implementation plan adds TON balance fetching and display functionality to the NativeWalletUI component through a new service layer with caching, error handling, and integration with existing refresh mechanisms.

## Tasks

- [x] 1. Create TON Balance Service
  - Create `src/services/TONBalanceService.ts` with balance fetching logic
  - Implement caching mechanism with 30-second TTL
  - Add request deduplication and retry logic with exponential backoff
  - _Requirements: 1.1, 1.4, 3.2, 4.1, 4.2_

- [ ]* 1.1 Write property test for balance service caching
  - **Property 1: Balance Fetch Consistency**
  - **Validates: Requirements 1.4, 4.3**

- [ ]* 1.2 Write property test for error handling
  - **Property 2: Error Handling Resilience**
  - **Validates: Requirements 3.1, 3.3**

- [x] 2. Integrate TON API client
  - Add TON API integration to existing `src/lib/api.ts` or create new API client
  - Implement balance fetching from tonapi.io with proper error handling
  - Add response parsing and validation for TON balance data
  - _Requirements: 1.1, 1.3, 3.1_

- [ ]* 2.1 Write unit tests for API client
  - Test successful balance fetching with mocked responses
  - Test error scenarios and timeout handling
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 3. Update NativeWalletUI component state
  - Add TON balance state properties to component
  - Implement loading states and error handling in UI
  - Add balance formatting utilities for display
  - _Requirements: 2.1, 2.3, 2.4, 3.3_

- [ ]* 3.1 Write property test for cache expiration
  - **Property 3: Cache Expiration Accuracy**
  - **Validates: Requirements 1.4, 4.4**

- [x] 4. Implement balance display in UI
  - Update balance section to show TON balance alongside RZC
  - Add USD conversion display using existing tonPrice prop
  - Implement loading skeleton and error states
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 4.1 Write unit tests for balance display
  - Test balance formatting with various amounts
  - Test loading and error state rendering
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 5. Integrate with existing refresh mechanism
  - Update refreshBalance function to include TON balance fetching
  - Integrate with window.refreshWalletBalance global function
  - Ensure TON balance refreshes with RZC balance updates
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ]* 5.1 Write property test for refresh integration
  - **Property 4: Refresh Integration Completeness**
  - **Validates: Requirements 5.1, 5.5**

- [ ]* 5.2 Write property test for request deduplication
  - **Property 5: Request Deduplication Effectiveness**
  - **Validates: Requirements 4.2, 4.1**

- [x] 6. Add performance optimizations
  - Implement request debouncing for rapid successive calls
  - Add background refresh for cached data approaching expiration
  - Optimize component re-renders when balance data updates
  - _Requirements: 4.1, 4.4_

- [ ]* 6.1 Write integration tests for performance
  - Test debouncing behavior with rapid requests
  - Test background refresh functionality
  - _Requirements: 4.1, 4.4_

- [-] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Update existing balance display UI
  - Modify the enhanced balance section to include TON balance card
  - Update the compact wallet address section to show TON balance
  - Ensure consistent styling with existing RZC balance display
  - _Requirements: 2.1, 2.2_

- [ ]* 8.1 Write unit tests for UI integration
  - Test TON balance display in various states
  - Test integration with existing RZC balance display
  - _Requirements: 2.1, 2.2_

- [ ] 9. Add error recovery mechanisms
  - Implement retry button for failed balance fetches
  - Add manual refresh capability for TON balance
  - Implement offline detection and cached data usage
  - _Requirements: 3.1, 3.3, 3.4_

- [ ]* 9.1 Write integration tests for error recovery
  - Test retry mechanisms with various failure scenarios
  - Test offline behavior and cached data usage
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 10. Final checkpoint - Complete integration testing
  - Test full balance fetch and display flow
  - Verify integration with existing wallet functionality
  - Ensure performance meets requirements
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure end-to-end functionality works correctly