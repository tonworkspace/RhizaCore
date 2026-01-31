# Requirements Document

## Introduction

The user-to-user RZC transfer functionality is failing because the required `user_transfers` database table does not exist. Users are encountering the error: "Could not find the table 'public.user_transfers' in the schema cache" when attempting to view transfer history. The application code references this table but the database migration has not been executed.

## Glossary

- **User_Transfers_Table**: Database table that stores user-to-user RZC transfer records
- **Database_Migration**: SQL script that creates database schema changes
- **RLS_Policies**: Row Level Security policies that control data access
- **Supabase_Client**: Application code that interfaces with the database
- **Transfer_History**: User interface showing sent/received RZC transfers

## Requirements

### Requirement 1: Database Table Creation

**User Story:** As a system administrator, I want the user_transfers table to exist in the database, so that the user-to-user transfer functionality works properly.

#### Acceptance Criteria

1. WHEN the database migration script is executed, THE Database_Migration SHALL create the user_transfers table with all required columns
2. WHEN the table is created, THE Database_Migration SHALL establish proper foreign key relationships to the users table
3. WHEN the table is created, THE Database_Migration SHALL add appropriate constraints for data integrity
4. WHEN the table is created, THE Database_Migration SHALL include indexes for optimal query performance

### Requirement 2: Security Policy Implementation

**User Story:** As a security administrator, I want proper access controls on the user_transfers table, so that users can only access their own transfer data.

#### Acceptance Criteria

1. WHEN RLS policies are applied, THE Database_Migration SHALL enable row level security on the user_transfers table
2. WHEN a user queries transfers, THE RLS_Policies SHALL only return transfers where the user is sender or recipient
3. WHEN a user creates a transfer, THE RLS_Policies SHALL only allow creation if the user is the sender
4. WHEN system updates occur, THE RLS_Policies SHALL restrict direct updates to system functions only

### Requirement 3: Activity Type Registration

**User Story:** As a system administrator, I want transfer activities to be properly categorized, so that user activity logs are complete and accurate.

#### Acceptance Criteria

1. WHEN the migration runs, THE Database_Migration SHALL insert 'rzc_send' activity type if it doesn't exist
2. WHEN the migration runs, THE Database_Migration SHALL insert 'rzc_receive' activity type if it doesn't exist
3. WHEN activity types exist, THE Supabase_Client SHALL be able to log transfer activities properly

### Requirement 4: Migration Execution Verification

**User Story:** As a developer, I want to verify the migration was successful, so that I can confirm the transfer functionality will work.

#### Acceptance Criteria

1. WHEN the migration completes, THE Database_Migration SHALL create all required table structures
2. WHEN verification queries run, THE Database_Migration SHALL show the table exists in the schema cache
3. WHEN the application queries the table, THE Supabase_Client SHALL successfully connect without errors
4. WHEN users access transfer history, THE Transfer_History SHALL load without database errors

### Requirement 5: Data Integrity and Constraints

**User Story:** As a data administrator, I want proper data validation on transfers, so that invalid transfer data cannot be stored.

#### Acceptance Criteria

1. WHEN transfer amounts are inserted, THE User_Transfers_Table SHALL enforce positive amount constraints
2. WHEN transfer status is set, THE User_Transfers_Table SHALL only allow valid status values
3. WHEN user references are inserted, THE User_Transfers_Table SHALL enforce foreign key constraints
4. WHEN timestamps are updated, THE User_Transfers_Table SHALL automatically update the updated_at field