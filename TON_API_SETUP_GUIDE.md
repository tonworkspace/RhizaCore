# TON API Integration Setup Guide

## Overview
This guide shows how to integrate TON blockchain API functionality into your React app with support for both Mainnet and Testnet networks.

## Files Created

### 1. Core Service (`src/services/TONAPIService.ts`)
- Main TON API service with TonWeb integration
- Network configuration for Mainnet/Testnet
- Balance checking, transaction monitoring, deposit management
- Unique ID generation for deposits

### 2. React Hook (`src/hooks/useTON.ts`)
- Custom hook for TON functionality
- Auto-refreshing balance and transaction data
- Deposit management with real-time updates

### 3. UI Components
- `src/components/TONDeposit.tsx` - Full deposit interface with modal
- `src/components/TONIntegrationExample.tsx` - Complete wallet interface
- `src/components/TONWalletIntegration.tsx` - Compact integration for existing apps

### 4. Database Migration (`create_deposits_table.sql`)
- Creates deposits table with proper indexing
- Row Level Security (RLS) policies
- Automatic timestamp updates
- Helper functions for deposit management

### 5. Constants (`src/constants.ts`)
- Network configuration constants
- Easy switching between Mainnet/Testnet

## Quick Setup

### 1. Run Database Migration
```sql
-- Execute the create_deposits_table.sql file in your Supabase SQL editor
```

### 2. Install Dependencies
```bash
# TonWeb is already in your package.json
npm install
```

### 3. Configure Network
```typescript
// In src/constants.ts
export const IS_MAINNET = true; // Set to false for testnet
```

### 4. Add to Your Component
```typescript
import TONWalletIntegration from '@/components/TONWalletIntegration';

// In your component
<TONWalletIntegration
  userId={userId}
  userAddress={userTonAddress}
  showSnackbar={showSnackbar}
/>
```

## Network Configuration

### Mainnet
- **Deposit Address**: `UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi`
- **API Key**: `26197ebc36a041a5546d69739da830635ed339c0d8274bdd72027ccbff4f4234`
- **Endpoint**: `https://toncenter.com/api/v2/jsonRPC`

### Testnet
- **Deposit Address**: `UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi`
- **API Key**: `d682d9b65115976e52f63713d6dd59567e47eaaa1dc6067fe8a89d537dd29c2c`
- **Endpoint**: `https://testnet.toncenter.com/api/v2/jsonRPC`

## Key Features

### 1. Balance Management
- Real-time TON balance checking
- Auto-refresh every 30 seconds
- Error handling and loading states

### 2. Deposit System
- Unique deposit ID generation
- Pending/Confirmed/Failed status tracking
- Automatic deposit processing
- Transaction hash linking

### 3. Transaction Monitoring
- Recent transaction history
- Deposit address monitoring
- Blockchain confirmation tracking

### 4. User Experience
- Clean, responsive UI components
- Loading states and error handling
- Copy-to-clipboard functionality
- Real-time status updates

## Usage Examples

### Basic Integration
```typescript
import { useTON } from '@/hooks/useTON';

const MyComponent = ({ userId, userAddress }) => {
  const { balance, deposits, createDeposit } = useTON(userId, userAddress);
  
  return (
    <div>
      <p>Balance: {balance.toFixed(4)} TON</p>
      <button onClick={() => createDeposit(1.0)}>
        Create 1 TON Deposit
      </button>
    </div>
  );
};
```

### Full Wallet Interface
```typescript
import TONIntegrationExample from '@/components/TONIntegrationExample';

<TONIntegrationExample
  userId={userId}
  userAddress={userAddress}
  showSnackbar={showSnackbar}
/>
```

### Compact Integration
```typescript
import TONWalletIntegration from '@/components/TONWalletIntegration';

<TONWalletIntegration
  userId={userId}
  userAddress={userAddress}
  showSnackbar={showSnackbar}
/>
```

## Deposit Flow

1. **User Creates Deposit**
   - Enters amount and clicks "Create Deposit"
   - System generates unique deposit ID
   - Deposit record created with "pending" status

2. **User Sends TON**
   - User sends exact amount to deposit address
   - Include deposit ID in transaction memo (optional)

3. **System Processes**
   - Background service monitors deposit address
   - Matches incoming transactions to pending deposits
   - Updates deposit status to "confirmed"
   - Credits user's TON balance

4. **Balance Updates**
   - User's balance updates automatically
   - Deposit history shows confirmed status
   - Transaction hash recorded for reference

## Background Processing

The system includes automatic deposit processing:

```typescript
// Runs every 60 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    await TONAPIService.processPendingDeposits();
  }, 60000);
  
  return () => clearInterval(interval);
}, []);
```

## Security Features

- Row Level Security (RLS) on deposits table
- Users can only see their own deposits
- Secure API key management
- Address validation
- Amount validation (positive numbers only)

## Testing

### Testnet Testing
1. Set `IS_MAINNET = false` in constants
2. Get testnet TON from faucets
3. Test deposit flow with small amounts
4. Verify transaction monitoring

### Mainnet Deployment
1. Set `IS_MAINNET = true` in constants
2. Test with small amounts first
3. Monitor deposit processing
4. Verify balance updates

## Troubleshooting

### Common Issues

1. **TonWeb Import Error**
   ```typescript
   // Use dynamic import if needed
   const TonWeb = (await import('tonweb')).default;
   ```

2. **Balance Not Updating**
   - Check API key validity
   - Verify network configuration
   - Check user address format

3. **Deposits Not Processing**
   - Verify deposit address is correct
   - Check transaction amounts match exactly
   - Ensure background processing is running

4. **Database Errors**
   - Run the migration SQL file
   - Check RLS policies are enabled
   - Verify user authentication

## API Reference

### TONAPIService Methods
- `getTONBalance(address)` - Get account balance
- `getTransactionHistory(address, limit)` - Get transaction history
- `createDepositRecord(userId, amount)` - Create deposit record
- `processPendingDeposits()` - Process pending deposits
- `isValidTONAddress(address)` - Validate TON address

### useTON Hook Returns
- `balance` - Current TON balance
- `transactions` - Transaction history
- `deposits` - User deposit records
- `createDeposit(amount)` - Create new deposit
- `refreshBalance()` - Manually refresh balance

## Next Steps

1. Run the database migration
2. Test with testnet first
3. Integrate the compact component into your existing UI
4. Set up background deposit processing
5. Monitor and test thoroughly before mainnet deployment

The system is designed to be modular and can be easily integrated into your existing app architecture.