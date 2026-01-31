# Implementation Plan: User Transfers Table Fix

## Overview

This implementation plan addresses the missing `user_transfers` table issue by first resolving the dependency on the `activity_types` table, then creating the user transfers table with proper error handling and verification.

## Tasks

- [x] 1. Investigate and resolve activity_types table dependency
  - Check if activity_types table exists in the database
  - Create activity_types table if it doesn't exist
  - Verify the table structure matches application expectations
  - _Requirements: 3.1, 3.2_

- [ ]* 1.1 Write property test for activity_types table existence
  - **Property 5: Activity Type Availability**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 2. Create modified user_transfers migration script
  - [x] 2.1 Create activity_types table creation script
    - Write SQL to create activity_types table with proper structure
    - Include name and description columns with appropriate constraints
    - Add unique constraint on name column
    - _Requirements: 3.1, 3.2_

  - [x] 2.2 Modify user_transfers script to handle missing dependencies
    - Remove dependency on activity_types table from main script
    - Create separate script for activity types insertion
    - Add proper error handling for missing dependencies
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 2.3 Write property test for complete migration schema creation
  - **Property 1: Complete Migration Schema Creation**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2**

- [ ] 3. Execute database migrations in correct order
  - [x] 3.1 Run activity_types table creation first
    - Execute the activity_types creation script
    - Verify table was created successfully
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Run user_transfers table creation
    - Execute the modified user_transfers creation script
    - Verify all table structures, indexes, and constraints were created
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 3.3 Insert required activity types
    - Insert 'rzc_send' and 'rzc_receive' activity types
    - Handle conflicts gracefully with ON CONFLICT DO NOTHING
    - _Requirements: 3.1, 3.2_

- [ ]* 3.4 Write property test for RLS policy enforcement
  - **Property 2: Comprehensive RLS Policy Enforcement**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ]* 3.5 Write property test for data constraint enforcement
  - **Property 3: Data Constraint Enforcement**
  - **Validates: Requirements 1.2, 5.1, 5.2, 5.3, 5.4**

- [ ] 4. Verify migration success and test application functionality
  - [ ] 4.1 Verify table exists in schema cache
    - Query database system tables to confirm user_transfers table exists
    - Verify table is visible in Supabase schema cache
    - _Requirements: 4.1, 4.2_

  - [ ] 4.2 Test basic database operations
    - Test SELECT queries on user_transfers table
    - Test INSERT operations with valid data
    - Test constraint enforcement with invalid data
    - _Requirements: 4.3, 5.1, 5.2, 5.3_

  - [ ] 4.3 Test application integration
    - Test getUserTransferHistory function works without errors
    - Test sendRZCToUser function can create transfers
    - Test searchUsersForTransfer function works properly
    - _Requirements: 4.4_

- [ ]* 4.4 Write property test for application functionality restoration
  - **Property 4: Application Functionality Restoration**
  - **Validates: Requirements 4.3, 4.4**

- [ ] 5. Checkpoint - Ensure all functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create rollback procedures (optional safety measure)
  - [ ] 6.1 Document rollback steps for user_transfers table
    - Create script to safely drop user_transfers table
    - Document steps to restore previous state if needed
    - _Requirements: Error handling and recovery_

  - [ ] 6.2 Document rollback steps for activity_types table
    - Create script to remove added activity types
    - Document impact assessment for rollback
    - _Requirements: Error handling and recovery_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster resolution
- Each task references specific requirements for traceability
- Migration order is critical: activity_types must be created before user_transfers
- Proper error handling ensures partial failures can be recovered
- Verification steps ensure the fix actually resolves the original issue