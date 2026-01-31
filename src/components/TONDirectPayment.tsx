import React, { useState } from 'react';
import { useTON } from '../hooks/useTON';
import { Icons } from './Icon';
import { supabase } from '../lib/supabaseClient';
import { TonConnectButton } from '@tonconnect/ui-react';

interface TONDirectPaymentProps {
  userId: number;
  userTonAddress?: string;
  tonConnectUI?: any;
  walletBalance?: number;
  showSnackbar?: (data: { message: string; description?: string }) => void;
}

const TONDirectPayment: React.FC<TONDirectPaymentProps> = ({
  userId,
  userTonAddress,
  tonConnectUI,
  walletBalance = 0,
  showSnackbar
}) => {
  const [customAmount, setCustomAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const {
    balance,
    deposits,
    networkInfo,
    refreshBalance
  } = useTON(userId, userTonAddress);

  // Generate unique ID function (simplified version)
  const generateUniqueId = async (): Promise<number> => {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      const id = Math.floor(Math.random() * 999999) + 1;
      
      const { error } = await supabase
        .from('deposits')
        .select('id')
        .eq('id', id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        return id;
      }
      
      attempts++;
    }
    
    throw new Error('Could not generate unique deposit ID');
  };

  const handleDirectDeposit = async (amount: number) => {
    try {
      setIsDepositing(true);
      setDepositStatus('pending');

      // Validate amount
      if (amount < 0.1) {
        showSnackbar?.({
          message: 'Invalid Amount',
          description: 'Minimum deposit amount is 0.1 TON'
        });
        setIsDepositing(false);
        setDepositStatus('error');
        return;
      }

      // Enhanced wallet validation
      if (!tonConnectUI?.account) {
        showSnackbar?.({
          message: 'Wallet Not Connected',
          description: 'Please connect your TON wallet first'
        });
        setIsDepositing(false);
        setDepositStatus('error');
        return;
      }

      // Validate user
      if (!userId) {
        showSnackbar?.({
          message: 'User Not Found',
          description: 'Please try logging in again'
        });
        setIsDepositing(false);
        setDepositStatus('error');
        return;
      }

      // Validate wallet address
      if (!tonConnectUI.account.address) {
        showSnackbar?.({
          message: 'Invalid Wallet',
          description: 'Please reconnect your wallet'
        });
        setIsDepositing(false);
        setDepositStatus('error');
        return;
      }

      // Check wallet balance
      try {
        const walletBalanceNum = Number(walletBalance);
        if (isNaN(walletBalanceNum)) {
          throw new Error('Invalid wallet balance');
        }
        if (walletBalanceNum < amount) {
          showSnackbar?.({
            message: 'Insufficient Balance',
            description: `Your wallet balance is ${walletBalanceNum.toFixed(2)} TON`
          });
          setIsDepositing(false);
          setDepositStatus('error');
          return;
        }
      } catch (error) {
        console.error('Error checking wallet balance:', error);
        showSnackbar?.({
          message: 'Wallet Error',
          description: 'Unable to verify wallet balance. Please try again.'
        });
        setIsDepositing(false);
        setDepositStatus('error');
        return;
      }

      // Convert amount to nano TON (1 TON = 10^9 nano)
      const toNano = (amount: string): bigint => {
        return BigInt(Math.floor(parseFloat(amount) * 1000000000));
      };

      const amountInNano = toNano(amount.toString());
      const depositId = await generateUniqueId();

      // Record pending deposit
      const { error: pendingError } = await supabase
        .from('deposits')
        .insert([{
          id: depositId,
          user_id: userId,
          amount: amount,
          status: 'pending',
          created_at: new Date().toISOString(),
          metadata: {
            wallet_address: tonConnectUI.account.address,
            amount_nano: amountInNano.toString()
          }
        }]);

      if (pendingError) throw pendingError;

      // Create and send transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
        messages: [{
          address: networkInfo.depositAddress,
          amount: amountInNano.toString(),
        }],
      };

      console.log('Sending transaction:', transaction);
      const result = await tonConnectUI.sendTransaction(transaction);

      if (result) {
        console.log('Transaction result:', result);
        
        // Update deposit status
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ 
            status: 'confirmed',
            transaction_hash: result.boc || 'direct_payment',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', depositId);

        if (updateError) throw updateError;

        // Update user's TON balance in database using RPC
        const { error: balanceError } = await supabase
          .rpc('increment_ton_balance', {
            user_id: userId,
            amount: amount
          });

        if (balanceError) {
          console.error('Error updating user balance:', balanceError);
        }

        showSnackbar?.({
          message: 'Deposit Successful!',
          description: `Deposited ${amount.toFixed(4)} TON successfully`
        });

        setDepositStatus('success');
        setCustomAmount('');
        
        // Refresh balances
        await refreshBalance();
      }

    } catch (error) {
      console.error('Deposit failed:', error);
      setDepositStatus('error');

      // Enhanced error handling
      let errorMessage = 'Please try again later';
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds in wallet';
        } else {
          errorMessage = error.message;
        }
      }

      showSnackbar?.({
        message: 'Deposit Failed',
        description: errorMessage
      });
    } finally {
      setIsDepositing(false);
      setTimeout(() => setDepositStatus('idle'), 3000);
    }
  };

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const isWalletConnected = tonConnectUI?.account?.address;

  return (
    <div className="space-y-4">
      {/* Wallet Connection Status */}
      <div className={`p-3 rounded-lg border ${
        isWalletConnected 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-orange-500/10 border-orange-500/20'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            isWalletConnected ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
          <span className={`text-xs font-bold uppercase ${
            isWalletConnected ? 'text-green-400' : 'text-orange-400'
          }`}>
            {isWalletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
          </span>
        </div>
        {isWalletConnected ? (
          <div className="space-y-1">
            <p className="text-green-300 text-[10px]">
              Address: {tonConnectUI.account.address.slice(0, 8)}...{tonConnectUI.account.address.slice(-8)}
            </p>
            <p className="text-green-300 text-[10px]">
              Balance: {walletBalance.toFixed(4)} TON
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-orange-300 text-[10px]">
              Connect your TON wallet to make direct deposits
            </p>
            <div className="flex justify-center">
              <TonConnectButton 
                style={{
                  width: '100%',
                  maxWidth: '200px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0088cc, #0066aa)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Current Balance Display */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs">Current Balance</span>
          <button
            onClick={refreshBalance}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icons.Refresh size={14} />
          </button>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-white text-2xl font-bold">
            {balance.toFixed(4)}
          </span>
          <span className="text-blue-400 text-sm font-bold mb-1">TON</span>
        </div>
      </div>

      {/* Direct Payment Section */}
      {isWalletConnected && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Icons.Wallet size={16} className="text-blue-400" />
            Direct Payment
          </h4>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[0.5, 1.0, 2.0].map((amount) => (
              <button
                key={amount}
                onClick={() => handleDirectDeposit(amount)}
                disabled={isDepositing || walletBalance < amount}
                className="bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 border border-blue-500/30 text-blue-400 font-bold py-2 px-3 rounded-lg transition-colors text-xs"
              >
                {amount} TON
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase block mb-2">
                Custom Amount
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    step="0.01"
                    min="0.1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-bold">
                    TON
                  </span>
                </div>
                <button
                  onClick={() => handleDirectDeposit(parseFloat(customAmount))}
                  disabled={isDepositing || !customAmount || parseFloat(customAmount) < 0.1}
                  className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isDepositing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-xs">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Send size={14} />
                      <span className="text-xs">Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Indicator */}
            {depositStatus !== 'idle' && (
              <div className={`p-2 rounded-lg text-xs ${
                depositStatus === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                depositStatus === 'success' ? 'bg-green-500/10 text-green-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {depositStatus === 'pending' && 'Processing transaction...'}
                {depositStatus === 'success' && 'Transaction completed successfully!'}
                {depositStatus === 'error' && 'Transaction failed. Please try again.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Deposits Alert */}
      {pendingDeposits.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Clock size={14} className="text-orange-400" />
            <span className="text-orange-400 text-xs font-bold">
              {pendingDeposits.length} Pending Deposit{pendingDeposits.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {pendingDeposits.map((deposit) => (
              <div key={deposit.id} className="flex items-center justify-between text-xs">
                <span className="text-orange-300">ID: {deposit.id}</span>
                <span className="text-white font-bold">{deposit.amount} TON</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <h5 className="text-blue-400 text-xs font-bold mb-2">How it works:</h5>
        <ul className="text-blue-300 text-[10px] space-y-1">
          <li>• Connect your TON wallet using TON Connect</li>
          <li>• Choose an amount or enter a custom amount</li>
          <li>• Confirm the transaction in your wallet</li>
          <li>• Your balance will update automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default TONDirectPayment;