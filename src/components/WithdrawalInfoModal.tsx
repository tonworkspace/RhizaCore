import { FC, useState, useEffect } from 'react';

interface WithdrawalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositDate: Date | string | null;
  currentEarnings: number;
  stakedAmount: number;
  onRestake: () => void;
  onStake?: () => void;
  onWithdraw?: (walletAddress: string, amount: number) => void;
  onClaimRewards?: (walletAddress: string) => void;
  onUpdateEarnings?: (newEarnings: number) => void;
  onSetPayoutWallet?: (walletAddress: string) => void;
  payoutWallet?: string | null;
}

const LOCK_PERIOD_DAYS = 100;
const LOCK_PERIOD_MS = LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000;

const isWithdrawalAllowed = (depositDate: Date | string): boolean => {
  const startDate = typeof depositDate === 'string' ? new Date(depositDate) : depositDate;
  return Date.now() >= startDate.getTime() + LOCK_PERIOD_MS;
};


const ReStakeCountdown: FC<{ depositDate: Date }> = ({ depositDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const endTime = depositDate.getTime() + LOCK_PERIOD_MS;
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeLeft('Unlocked');
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [depositDate]);

  return <span className="text-indigo-400">{timeLeft}</span>;
};

export const WithdrawalInfoModal: FC<WithdrawalInfoModalProps> = ({ 
  isOpen,
  onClose,
  depositDate,
  currentEarnings,
  stakedAmount,
  onRestake,
  onStake,
  onWithdraw,
  onClaimRewards,
  onUpdateEarnings,
  onSetPayoutWallet,
  payoutWallet,
}) => {
  const [walletAddress, setWalletAddress] = useState(() => {
    // Try to load saved wallet address from localStorage or use payoutWallet if available
    return payoutWallet || localStorage.getItem('claimWalletAddress') || '';
  });
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState<'full' | 'rewards' | 'payout' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Add function to save wallet address
  const saveWalletAddress = (address: string) => {
    localStorage.setItem('claimWalletAddress', address);
  };

  // Add function to handle successful claim
  const handleSuccessfulClaim = () => {
    if (withdrawalType === 'rewards') {
      // Reset current earnings to 0 after successful claim
      onUpdateEarnings?.(0);
    }
    setIsSuccess(true);
    // Auto close after success
    setTimeout(() => {
      setShowWalletInput(false);
      setWithdrawalType(null);
      setIsSuccess(false);
      onClose();
    }, 3000);
  };

  // Update the transaction handler to include payout wallet setting
  const handleTransaction = async () => {
    try {
      setIsSubmitting(true);
      
      if (withdrawalType === 'payout') {
        // Handle setting payout wallet
        await onSetPayoutWallet?.(walletAddress);
        if (walletAddress) {
          saveWalletAddress(walletAddress);
        }
        setIsSuccess(true);
        setTimeout(() => {
          setShowWalletInput(false);
          setWithdrawalType(null);
          setIsSuccess(false);
          onClose();
        }, 3000);
      } else if (withdrawalType === 'rewards') {
        await onClaimRewards?.(walletAddress);
        // Save wallet address if transaction is successful
        if (walletAddress) {
          saveWalletAddress(walletAddress);
        }
        handleSuccessfulClaim();
      } else {
        await onWithdraw?.(walletAddress, totalAmount);
        setIsSuccess(true);
        setTimeout(() => {
          setShowWalletInput(false);
          setWithdrawalType(null);
          setIsSuccess(false);
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      // You might want to show an error message here
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // If no deposit date, show a simplified modal focused on setting payout wallet
  if (!depositDate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
        <div className="relative bg-gradient-to-br from-[#0A0A1F] to-[#141428] rounded-2xl p-8 w-full max-w-md mx-4 border-2 border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                Payout Settings
              </h3>
              <button 
                onClick={onClose}
                className="text-indigo-300/60 hover:text-indigo-300 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Payout Wallet Section */}
            <div className="bg-black/40 rounded-xl p-6 border border-indigo-500/20">
              <div className="text-4xl mb-4">💳</div>
              <h4 className="text-lg font-medium text-white mb-2">Set Payout Wallet</h4>
              <p className="text-sm text-indigo-200/60 mb-6">
                Enter your TON wallet address to receive automatic weekly payouts
              </p>
              
              {showWalletInput ? (
                isSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                    <div className="text-emerald-400 text-4xl mb-3">✓</div>
                    <h4 className="text-emerald-400 font-medium mb-2">Wallet Updated!</h4>
                    <p className="text-sm text-emerald-400/60">
                      Your payout wallet has been successfully updated
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter your TON wallet address"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-black/40 border border-indigo-500/20 rounded-xl text-white placeholder-indigo-200/40 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleTransaction}
                      disabled={!walletAddress || isSubmitting}
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Wallet Address'
                      )}
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={() => {
                    setWithdrawalType('payout');
                    setShowWalletInput(true);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-medium text-white transition-all duration-200"
                >
                  {payoutWallet ? 'Update Payout Wallet' : 'Set Payout Wallet'}
                </button>
              )}
              
              {payoutWallet && !showWalletInput && (
                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <div className="text-xs text-indigo-200/60 mb-1">Current Payout Wallet</div>
                  <div className="text-sm text-white break-all">
                    {payoutWallet.substring(0, 10)}...{payoutWallet.substring(payoutWallet.length - 10)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onStake}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-medium text-white transition-all duration-200"
              >
                Stake Now
              </button>
              
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white/60 hover:text-white transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allowed = isWithdrawalAllowed(depositDate);
  const totalAmount = stakedAmount + currentEarnings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-[#0A0A1F] to-[#141428] rounded-2xl p-8 w-full max-w-md mx-4 border-2 border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              Set Payout Wallet
            </h3>
            <button 
              onClick={onClose}
              className="text-indigo-300/60 hover:text-indigo-300 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Payout Wallet Section */}
          <div className="bg-black/40 rounded-xl p-4 border border-indigo-500/20">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-indigo-200/60">Payout Wallet</span>
              <button 
                onClick={() => {
                  setWithdrawalType('payout');
                  setShowWalletInput(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                {payoutWallet ? 'Update' : 'Set Wallet'}
              </button>
            </div>
            {payoutWallet ? (
              <div className="text-sm text-white break-all">
                {payoutWallet.substring(0, 10)}...{payoutWallet.substring(payoutWallet.length - 10)}
              </div>
            ) : (
              <div className="text-sm text-indigo-200/40 italic">No payout wallet set</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {showWalletInput ? (
              <div className="space-y-3">
                {isSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                    <div className="text-emerald-400 text-4xl mb-3">✓</div>
                    <h4 className="text-emerald-400 font-medium mb-2">
                      {withdrawalType === 'payout' ? 'Wallet Updated!' : 
                       withdrawalType === 'rewards' ? 'Rewards Claimed!' : 'Withdrawal Successful!'}
                    </h4>
                    <p className="text-sm text-emerald-400/60">
                      {withdrawalType === 'payout' ? 
                        'Your payout wallet has been successfully updated' : 
                        'Transaction has been submitted to the network'}
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter your TON wallet address"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-black/40 border border-indigo-500/20 rounded-xl text-white placeholder-indigo-200/40 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <div className="flex items-center gap-2 text-xs text-indigo-200/60">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={!!walletAddress}
                        onChange={(e) => {
                          if (e.target.checked) {
                            saveWalletAddress(walletAddress);
                          } else {
                            localStorage.removeItem('claimWalletAddress');
                            setWalletAddress('');
                          }
                        }}
                        className="rounded border-indigo-500/20"
                      />
                      <label htmlFor="saveAddress">Save wallet address for future use</label>
                    </div>
                    <button
                      onClick={handleTransaction}
                      disabled={!walletAddress || isSubmitting}
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {withdrawalType === 'payout' ? 'Saving...' : 
                           withdrawalType === 'rewards' ? 'Claiming...' : 'Withdrawing...'}
                        </>
                      ) : (
                        `${withdrawalType === 'payout' ? 'Save Wallet Address' : 
                          withdrawalType === 'rewards' ? 'Confirm Claim' : 'Confirm Withdrawal'}`
                      )}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
            
                {allowed ? (
                  <>
                    <button
                      onClick={onRestake}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-medium text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restake {totalAmount.toFixed(2)} TON
                    </button>
                  </>
                ) : (
                  <div className="text-center text-sm text-indigo-200/60">
                    <span className="block mb-2">🔒 Staked funds are locked</span>
                    <ReStakeCountdown depositDate={new Date(depositDate)} />
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => {
                setShowWalletInput(false);
                setWithdrawalType(null);
                onClose();
              }}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white/60 hover:text-white transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 