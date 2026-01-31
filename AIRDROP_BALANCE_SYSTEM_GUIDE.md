# Airdrop Balance System Guide

## Overview

The new Airdrop Balance System allows users to claim their total earned RZC from mining activities to a separate airdrop balance, and then withdraw from that balance to external wallets. This provides a clear separation between mining rewards and withdrawable funds.

## System Components

### 1. Database Schema

#### `airdrop_balances` Table
- `user_id`: Reference to the user
- `total_claimed_to_airdrop`: Total amount ever claimed from mining to airdrop balance
- `available_balance`: Current available balance for withdrawal
- `withdrawn_balance`: Total amount withdrawn to external wallets
- `last_claim_from_mining`: Last time user claimed from mining to airdrop balance

#### `airdrop_withdrawals` Table
- `user_id`: Reference to the user making the withdrawal
- `airdrop_balance_id`: Reference to the airdrop balance
- `amount`: Amount being withdrawn
- `destination_address`: External wallet address
- `status`: Current status (pending, processing, completed, failed)
- `transaction_hash`: Blockchain transaction hash (when completed)
- `network`: Blockchain network (ethereum, polygon, bsc)
- `gas_fee`: Gas fee deducted from withdrawal

### 2. API Functions

#### `getUserAirdropBalance(userId: number)`
- Retrieves user's airdrop balance information
- Returns balance object or null if no balance exists

#### `claimTotalEarnedToAirdrop(userId: number)`
- Claims user's total earned RZC from mining to their airdrop balance
- Creates new airdrop balance if none exists
- Updates existing balance with additional earned RZC
- Records activity for tracking

#### `reclaimFromAirdropToMining(userId: number)`
- Reclaims user's airdrop balance back to mining balance
- Resets airdrop balance to 0
- Restores mining activities by removing claimed_to_airdrop flags
- Allows users to continue mining from where they left off
- Records activity for tracking

#### `createAirdropWithdrawal(userId, amount, destinationAddress, network)`
- Creates a withdrawal request from airdrop balance to external wallet
- Updates airdrop balance (reduces available, increases withdrawn)
- Records withdrawal activity
- Returns withdrawal ID for tracking

#### `getUserAirdropWithdrawals(userId: number)`
- Retrieves user's withdrawal history
- Returns array of withdrawal records with status and details

#### `updateAirdropWithdrawalStatus(withdrawalId, status, transactionHash?, gasFee?)`
- Admin function to update withdrawal status
- Used when processing withdrawals manually

### 3. UI Components

#### New Airdrop Tab
- Displays current airdrop balance
- Shows total claimed to airdrop and total withdrawn
- Provides buttons for claiming and withdrawing
- Shows withdrawal history

#### Claim to Airdrop Modal
- Shows total earned RZC available to claim
- Displays current airdrop balance
- Allows user to claim all earned RZC to airdrop balance

#### Withdraw Modal
- Shows available airdrop balance
- Form for withdrawal amount and destination address
- Network selection (Ethereum, Polygon, BSC)
- MAX button for full balance withdrawal

## User Flow

### 1. Mining and Earning
- Users mine RZC through normal mining sessions
- Total earned RZC accumulates in `totalEarnedRZC`
- This represents all RZC ever earned from mining

### 2. Claiming to Airdrop Balance
- Users can claim their total earned RZC to airdrop balance
- This moves RZC from mining rewards to withdrawable balance
- Button appears in Mining tab and Airdrop tab when totalEarnedRZC > 0

### 3. Reclaiming from Airdrop Balance (NEW)
- Users can reclaim their airdrop balance back to mining balance
- This restores their mining progress and allows continued mining
- Useful if users want to continue earning instead of withdrawing
- Button appears in Airdrop modal when airdrop balance > 0

### 4. Withdrawing to External Wallet
- Users can withdraw from their airdrop balance to any external wallet
- Supports multiple networks (Ethereum, Polygon, BSC)
- Withdrawals are processed manually by admins
- Status tracking: pending → processing → completed/failed

## Benefits

### For Users
- Clear separation between earned and withdrawable RZC
- Ability to withdraw to any external wallet address
- Multi-network support for withdrawals
- Complete withdrawal history tracking
- No loss of mining progress when withdrawing

### For Platform
- Better control over withdrawal processing
- Reduced database complexity for balance tracking
- Audit trail for all airdrop-related activities
- Flexibility to add withdrawal fees or limits
- Manual processing prevents automated abuse

## Security Features

- Row Level Security (RLS) policies ensure users can only access their own data
- Withdrawal requests require manual admin approval
- All activities are logged for audit purposes
- Balance validation prevents over-withdrawal
- Network selection prevents wrong-chain withdrawals

## Implementation Notes

### Database Migration
Run `create_airdrop_balance_system.sql` to create the required tables and policies.

### Activity Types
New activity types added:
- `airdrop_balance_claim`: When user claims mining rewards to airdrop balance
- `airdrop_balance_reclaim`: When user reclaims airdrop balance back to mining balance
- `airdrop_withdrawal_request`: When user requests withdrawal to external wallet

### Admin Processing
Withdrawals require manual processing using `updateAirdropWithdrawalStatus()` function.

## Future Enhancements

1. **Automated Processing**: Integration with blockchain APIs for automatic withdrawal processing
2. **Withdrawal Fees**: Configurable fees for different networks
3. **Minimum Withdrawal**: Set minimum amounts for withdrawals
4. **Batch Processing**: Process multiple withdrawals in batches
5. **Email Notifications**: Notify users of withdrawal status changes
6. **Multi-Token Support**: Support for different token types beyond RZC

## Usage Examples

### Claiming to Airdrop Balance
```typescript
const result = await claimTotalEarnedToAirdrop(userId);
if (result.success) {
  console.log(`Claimed ${result.claimedAmount} RZC to airdrop balance`);
  console.log(`New balance: ${result.newBalance} RZC`);
}
```

### Creating Withdrawal
```typescript
const result = await createAirdropWithdrawal(
  userId, 
  100.5, 
  '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87', 
  'ethereum'
);
if (result.success) {
  console.log(`Withdrawal request created with ID: ${result.withdrawalId}`);
}
```

### Reclaiming from Airdrop Balance
```typescript
const result = await reclaimFromAirdropToMining(userId);
if (result.success) {
  console.log(`Reclaimed ${result.reclaimedAmount} RZC back to mining balance`);
}
```

### Checking Balance
```typescript
const result = await getUserAirdropBalance(userId);
if (result.success && result.balance) {
  console.log(`Available: ${result.balance.available_balance} RZC`);
  console.log(`Total claimed: ${result.balance.total_claimed_to_airdrop} RZC`);
  console.log(`Total withdrawn: ${result.balance.withdrawn_balance} RZC`);
}
```

This system provides a robust foundation for managing user withdrawals while maintaining security and providing a great user experience.