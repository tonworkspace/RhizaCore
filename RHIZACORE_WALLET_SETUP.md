# RhizaCore Wallet Setup Guide

## Installation

To use the RhizaCore Wallet with local wallet functionality, you need to install `crypto-js`:

```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

## Integration

### 1. Wrap your app with WalletProvider

In your main App component or entry point, wrap the app with `WalletProvider`:

```tsx
import { WalletProvider } from './context/WalletContext';
import { RhizaCoreWallet } from './components/RhizaCoreWallet';

function App() {
  return (
    <WalletProvider>
      <RhizaCoreWallet />
    </WalletProvider>
  );
}
```

### 2. Usage

The `RhizaCoreWallet` component handles all wallet modes:
- **TonConnect Mode**: Connects to external wallets (TON Keeper, OpenMask, Tonhub)
- **Local Wallet Mode**: Create or import wallets using mnemonics

## Features

### Local Wallet Features
- ✅ Generate 24-word mnemonic wallets
- ✅ Import existing wallets from mnemonic
- ✅ AES encryption with password protection
- ✅ Secure local storage (encrypted)
- ✅ View balance and address
- ✅ Send TON transactions (requires signing implementation)

### TonConnect Features
- ✅ Connect to external TON wallets
- ✅ View balance and jettons
- ✅ Send TON and jettons
- ✅ Full TON ecosystem integration

## Security Notes

⚠️ **Important Security Considerations:**

1. **Local Wallets**: Private keys are encrypted with AES and stored in localStorage. Never share your password or mnemonic.

2. **Mnemonic Storage**: The mnemonic is encrypted before storage. Always backup your recovery phrase securely.

3. **Password**: Use a strong password (minimum 8 characters). The password is never stored.

4. **Transaction Signing**: For local wallets, transaction signing requires additional implementation using the wallet's private key.

## File Structure

```
src/
├── components/
│   ├── RhizaCoreWallet.tsx      # Main wallet component
│   ├── WalletSelector.tsx       # Initial wallet selection screen
│   ├── CreateWallet.tsx         # Create new wallet flow
│   ├── ImportWallet.tsx         # Import wallet flow
│   ├── LocalWalletDashboard.tsx # Local wallet dashboard
│   └── TonWallet.tsx            # TonConnect wallet (existing)
├── context/
│   └── WalletContext.tsx        # Wallet state management
└── utils/
    ├── encryption.ts            # AES encryption utilities
    └── wallet.ts                # Wallet generation/derivation utilities
```

## Next Steps

1. Install `crypto-js` dependency
2. Wrap your app with `WalletProvider`
3. Replace `TonWallet` usage with `RhizaCoreWallet` if desired
4. Implement transaction signing for local wallets (optional)

## Transaction Signing for Local Wallets

To enable sending transactions from local wallets, you'll need to implement wallet signing using the private key. This typically involves:

1. Decrypting the wallet on send
2. Creating a transaction cell
3. Signing with the private key
4. Broadcasting to TON network

Example (pseudo-code):
```typescript
import { WalletContractV4 } from '@ton/ton';
import { beginCell } from '@ton/core';

const wallet = WalletContractV4.create({ publicKey, workchain: 0 });
const signedTx = wallet.createTransfer({
  secretKey: privateKey,
  messages: [/* transaction messages */]
});
```

For now, the send button shows an alert. Implement signing logic based on your requirements.

