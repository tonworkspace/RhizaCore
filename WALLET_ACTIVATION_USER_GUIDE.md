# Wallet Activation - User Guide

## What Was Fixed

We've resolved an issue where some users were being asked to pay the activation fee again after already completing payment. This should no longer happen.

## How Wallet Activation Works Now

### Step 1: Initial Check
- When you open the activation modal, the system checks if you're already activated
- If you're already activated, you'll be taken directly to the success screen

### Step 2: Payment Process
- Connect your TON wallet
- Review the payment details ($15 in TON)
- Click "Commit" to send payment
- **Before sending**: System double-checks you're not already activated

### Step 3: Confirmation
- Transaction is sent to the TON network
- System waits for blockchain confirmation
- Database records your activation

### Step 4: Activation Complete
- Your wallet status is updated to "activated"
- 150 RZC tokens are credited to your account
- All wallet features are unlocked
- Modal closes automatically

## What If I Already Paid But Still See the Lock Screen?

If you've already paid but still see the activation prompt:

1. **Refresh the page** - Sometimes the UI needs a refresh to sync with the database
2. **Wait 30 seconds** - The system auto-refreshes every 30 seconds
3. **Check your balance** - If you see 150 RZC in your wallet, you're activated
4. **Contact support** - If the issue persists after refreshing

## Protection Against Double Payment

The system now has multiple layers of protection:

1. ✅ **Pre-payment check** - Verifies you're not activated before allowing payment
2. ✅ **Database validation** - Prevents duplicate activation records
3. ✅ **Transaction hash check** - Prevents processing the same transaction twice
4. ✅ **Auto-refresh** - UI automatically updates after successful activation

## What You'll Receive

After successful activation:
- ✅ 150 RZC tokens in your wallet
- ✅ Access to Send/Receive features
- ✅ Access to Staking (70% for 5 years)
- ✅ Access to RhizaCore Marketplace
- ✅ Full ecosystem participation

## Troubleshooting

### "Already Activated" Message
- This means your wallet is already active
- Click "Launch Dashboard" to continue
- Your 150 RZC should be visible in your balance

### Payment Sent But No Confirmation
- Wait 1-2 minutes for blockchain confirmation
- The system will automatically process once confirmed
- Check your TON wallet for transaction status

### Still Seeing Lock Screen After Payment
1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Check browser console for errors
3. Verify your internet connection
4. Contact support with your user ID

## Technical Details

For developers and advanced users:

- Activation fee: $15 USD (paid in TON)
- RZC reward: 150 tokens
- Database function: `process_wallet_activation`
- Status check: `get_wallet_activation_status`
- Auto-refresh interval: 30 seconds

## Support

If you experience any issues:
1. Take a screenshot of the error
2. Note your user ID and username
3. Check if the payment went through in your TON wallet
4. Contact support with these details

## Summary

The wallet activation process is now more reliable with multiple safeguards to prevent duplicate payments. Once you've successfully paid and received your 150 RZC, you won't be asked to pay again.
