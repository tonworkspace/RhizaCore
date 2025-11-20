import { FC, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalWithdrawnTon: number;
  onSuccess?: () => void;
}

export const WithdrawModal: FC<WithdrawModalProps> = ({ isOpen, onClose, totalWithdrawnTon, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState(user?.wallet_address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [nextWithdrawalDate, setNextWithdrawalDate] = useState<Date | null>(null);
  const [timeUntilWithdrawal, setTimeUntilWithdrawal] = useState('');
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<number | undefined>();
  const [userWalletAddress, setUserWalletAddress] = useState<string>('');
  const [isDetectingWallet, setIsDetectingWallet] = useState(false);

  // Auto-detect user's wallet address
  const detectUserWallet = async () => {
    if (!user?.id) return;

    setIsDetectingWallet(true);
    try {
      // Get user's wallet address from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (userData?.wallet_address) {
        setUserWalletAddress(userData.wallet_address);
        setWithdrawalAddress(userData.wallet_address);
      }
    } catch (err) {
      console.error('Error detecting wallet:', err);
    } finally {
      setIsDetectingWallet(false);
    }
  };

  // Check weekly withdrawal eligibility
  const checkWeeklyWithdrawalEligibility = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('last_weekly_withdrawal')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const lastWithdrawal = data?.last_weekly_withdrawal;
      const now = new Date();
      
      // Check for pending withdrawals first
      const { data: pendingWithdrawals, error: pendingError } = await supabase
        .from('withdrawals')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1);

      if (pendingError) throw pendingError;

      // If there's a pending withdrawal, user cannot withdraw
      if (pendingWithdrawals && pendingWithdrawals.length > 0) {
        setCanWithdraw(false);
        setHasPendingWithdrawal(true);
        setPendingWithdrawalId(pendingWithdrawals[0].id);
        setNextWithdrawalDate(null);
        return;
      }

      setHasPendingWithdrawal(false);
      setPendingWithdrawalId(undefined);

      if (!lastWithdrawal) {
        setCanWithdraw(true);
        setNextWithdrawalDate(null);
        return;
      }

      const lastWithdrawalDate = new Date(lastWithdrawal);
      const daysSinceWithdrawal = Math.floor((now.getTime() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceWithdrawal >= 7) {
        setCanWithdraw(true);
        setNextWithdrawalDate(null);
      } else {
        setCanWithdraw(false);
        const nextDate = new Date(lastWithdrawalDate);
        nextDate.setDate(nextDate.getDate() + 7);
        setNextWithdrawalDate(nextDate);
        updateTimeUntilWithdrawal(nextDate);
      }
    } catch (err) {
      console.error('Error checking withdrawal eligibility:', err);
      setError('Failed to check withdrawal eligibility');
    }
  };

  // Update countdown timer
  const updateTimeUntilWithdrawal = (targetDate: Date) => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeUntilWithdrawal('');
      setCanWithdraw(true);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      setTimeUntilWithdrawal(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeUntilWithdrawal(`${hours}h ${minutes}m`);
    } else {
      setTimeUntilWithdrawal(`${minutes}m`);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check eligibility and detect wallet when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      checkWeeklyWithdrawalEligibility();
      detectUserWallet();
    }
  }, [isOpen, user?.id]);

  // Update countdown every minute
  useEffect(() => {
    if (!canWithdraw && nextWithdrawalDate) {
      const interval = setInterval(() => {
        updateTimeUntilWithdrawal(nextWithdrawalDate);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [canWithdraw, nextWithdrawalDate]);

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Check if user can withdraw (weekly restriction)
      if (!canWithdraw) {
        throw new Error('Weekly withdrawal cooldown active. Please wait until next withdrawal date.');
      }

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        throw new Error('Invalid withdrawal amount');
      }

      if (withdrawAmount < 1) {
        throw new Error('Minimum withdrawal amount is 1 RZC');
      }

      if (withdrawAmount > totalWithdrawnTon) {
        throw new Error('Insufficient claimable balance');
      }

      if (!withdrawalAddress || withdrawalAddress.trim().length === 0) {
        throw new Error('Please enter a valid withdrawal address');
      }

      // Enhanced TON address validation
      const trimmedAddress = withdrawalAddress.trim();
      
      // Check if address is not empty
      if (!trimmedAddress) {
        throw new Error('Please enter a TON wallet address');
      }
      
      // TON address validation patterns
      const tonAddressPatterns = [
        /^UQ[A-Za-z0-9_-]{47}$/,  // UQ format
        /^EQ[A-Za-z0-9_-]{47}$/,  // EQ format
        /^0:[A-Za-z0-9_-]{47}$/,  // 0: format
        /^[A-Za-z0-9_-]{48}$/     // Raw format (48 chars)
      ];
      
      const isValidTonAddress = tonAddressPatterns.some(pattern => pattern.test(trimmedAddress));
      
      if (!isValidTonAddress) {
        throw new Error('Please enter a valid TON wallet address (UQ, EQ, 0:, or 48-character format)');
      }

      // Create withdrawal request with wallet address
      const { error: withdrawError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          amount: withdrawAmount,
          wallet_amount: withdrawAmount,
          wallet_address: withdrawalAddress.trim(),
          status: 'PENDING',
          created_at: new Date().toISOString()
        });

      if (withdrawError) throw withdrawError;

      // Update weekly withdrawal tracking
      const { error: updateError } = await supabase.rpc('update_weekly_withdrawal_tracking', {
        user_id_param: user?.id,
        withdrawal_amount: withdrawAmount
      });

      if (updateError) {
        console.error('Error updating weekly withdrawal tracking:', updateError);
        // Don't throw error here as withdrawal was already created
      }

      // Reset form
      setAmount('');
      setWithdrawalAddress(userWalletAddress || user?.wallet_address || '');
      
      // Show success message
      console.log(`Withdrawal request submitted: ${withdrawAmount} RZC to ${withdrawalAddress.trim()}`);
      
      // Show success and close modal
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border-2 border-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-blue-600">
            Withdraw Funds
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Weekly Withdrawal Status */}
          <div className={`rounded-xl p-4 border ${
            canWithdraw 
              ? 'bg-green-50 border-green-200' 
              : hasPendingWithdrawal
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                canWithdraw 
                  ? 'bg-green-500' 
                  : hasPendingWithdrawal
                  ? 'bg-yellow-500'
                  : 'bg-orange-500'
              }`} />
              <div className="text-sm font-semibold text-gray-800">
                {canWithdraw 
                  ? 'Withdrawal Available' 
                  : hasPendingWithdrawal
                  ? 'Withdrawal Pending'
                  : 'Weekly Cooldown Active'
                }
              </div>
            </div>
            {canWithdraw ? (
              <div className="text-xs text-green-600">
                You can withdraw your RZC now! Next withdrawal will be available in 7 days.
              </div>
            ) : hasPendingWithdrawal ? (
              <div className="space-y-1">
                <div className="text-xs text-yellow-600">
                  You have a pending withdrawal request (ID: {pendingWithdrawalId}). Please wait for it to be processed before making another request.
                </div>
                <div className="text-xs text-gray-600">
                  Check the Activities tab to see your withdrawal status.
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs text-orange-600">
                  Next withdrawal available in: <span className="font-mono font-bold text-black">{timeUntilWithdrawal}</span>
                </div>
                {nextWithdrawalDate && (
                  <div className="text-xs text-gray-600">
                    On {formatDate(nextWithdrawalDate)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Balance Display */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Claimable Balance</div>
            <div className="text-2xl font-bold text-black">{totalWithdrawnTon.toFixed(6)} RZC</div>
            <div className="text-xs text-gray-500 mt-1">Minimum withdrawal: 1 RZC</div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block font-medium">Withdrawal Amount</label>
            <input
              type="number"
              step="0.001"
              min="1"
              max={totalWithdrawnTon}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to withdraw"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <div className="flex justify-between mt-2">
              <button 
                onClick={() => setAmount((totalWithdrawnTon * 0.25).toFixed(3))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                25%
              </button>
              <button 
                onClick={() => setAmount((totalWithdrawnTon * 0.5).toFixed(3))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                50%
              </button>
              <button 
                onClick={() => setAmount((totalWithdrawnTon * 0.75).toFixed(3))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                75%
              </button>
              <button 
                onClick={() => setAmount(totalWithdrawnTon.toFixed(6))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          {/* Wallet Address Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 font-medium">Withdrawal Address</label>
              <button
                onClick={detectUserWallet}
                disabled={isDetectingWallet}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isDetectingWallet ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    Detecting...
                  </div>
                ) : (
                  '🔄 Auto-Detect'
                )}
              </button>
            </div>
            
            {userWalletAddress && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="text-xs font-semibold text-green-700">Detected Wallet</div>
                </div>
                <div className="text-xs text-green-600 font-mono break-all">
                  {userWalletAddress}
                </div>
              </div>
            )}
            
            <input
              type="text"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
              placeholder="Enter TON wallet address"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <div className="text-xs text-gray-500 mt-1">
              Valid formats: UQ..., EQ..., 0:..., or 48-character address
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all border border-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !amount || !withdrawalAddress || !canWithdraw}
              className={`flex-1 px-4 py-3 rounded-xl transition-all font-semibold ${
                canWithdraw
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : !canWithdraw ? (
                'Weekly Cooldown Active'
              ) : (
                'Submit Withdrawal'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal; 