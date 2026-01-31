import React, { useState } from 'react';
import { useTON } from '../hooks/useTON';
import { Icons } from './Icon';

interface TONDepositProps {
  userId: number;
  userAddress?: string;
  onDepositCreated?: (depositId: number) => void;
  showSnackbar?: (data: { message: string; description?: string }) => void;
}

const TONDeposit: React.FC<TONDepositProps> = ({
  userId,
  userAddress,
  onDepositCreated,
  showSnackbar
}) => {
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const {
    balance,
    isLoading,
    error,
    deposits,
    networkInfo,
    refreshBalance,
    // refreshDeposits,
    createDeposit
  } = useTON(userId, userAddress);

  const handleCreateDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount <= 0) {
      showSnackbar?.({
        message: 'Invalid Amount',
        description: 'Please enter a valid deposit amount'
      });
      return;
    }

    setIsCreatingDeposit(true);
    
    try {
      const deposit = await createDeposit(amount);
      
      if (deposit) {
        showSnackbar?.({
          message: 'Deposit Created',
          description: `Deposit of ${amount} TON created. Send TON to the deposit address.`
        });
        
        setDepositAmount('');
        setShowDepositModal(false);
        onDepositCreated?.(deposit.id);
      }
    } catch (err) {
      showSnackbar?.({
        message: 'Deposit Failed',
        description: 'Failed to create deposit record'
      });
    } finally {
      setIsCreatingDeposit(false);
    }
  };

  const copyDepositAddress = async () => {
    try {
      await navigator.clipboard.writeText(networkInfo.depositAddress);
      showSnackbar?.({
        message: 'Address Copied',
        description: 'Deposit address copied to clipboard'
      });
    } catch (err) {
      showSnackbar?.({
        message: 'Copy Failed',
        description: 'Failed to copy address to clipboard'
      });
    }
  };

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const confirmedDeposits = deposits.filter(d => d.status === 'confirmed');

  return (
    <div className="space-y-4">
      {/* Network Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-blue-400 text-xs font-bold uppercase">
            {networkInfo.networkName} Network
          </span>
        </div>
        <p className="text-blue-300 text-[10px]">
          Connected to TON {networkInfo.networkName}
        </p>
      </div>

      {/* Balance Display */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs">TON Balance</span>
          <button
            onClick={refreshBalance}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icons.Refresh size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-white text-2xl font-bold">
            {balance.toFixed(4)}
          </span>
          <span className="text-blue-400 text-sm font-bold mb-1">TON</span>
        </div>
        {error && (
          <p className="text-red-400 text-[10px] mt-1">{error}</p>
        )}
      </div>

      {/* Deposit Button */}
      <button
        onClick={() => setShowDepositModal(true)}
        className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Icons.Send size={16} />
        <span>Create Deposit</span>
      </button>

      {/* Pending Deposits */}
      {pendingDeposits.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <h4 className="text-orange-400 text-xs font-bold uppercase mb-2">
            Pending Deposits ({pendingDeposits.length})
          </h4>
          <div className="space-y-2">
            {pendingDeposits.map((deposit) => (
              <div key={deposit.id} className="flex items-center justify-between">
                <span className="text-orange-300 text-[10px]">
                  ID: {deposit.id}
                </span>
                <span className="text-white text-xs font-bold">
                  {deposit.amount} TON
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Confirmed Deposits */}
      {confirmedDeposits.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <h4 className="text-green-400 text-xs font-bold uppercase mb-2">
            Recent Deposits
          </h4>
          <div className="space-y-2">
            {confirmedDeposits.slice(0, 3).map((deposit) => (
              <div key={deposit.id} className="flex items-center justify-between">
                <span className="text-green-300 text-[10px]">
                  {new Date(deposit.confirmed_at!).toLocaleDateString()}
                </span>
                <span className="text-white text-xs font-bold">
                  +{deposit.amount} TON
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">Create Deposit</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Icons.X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase block mb-2">
                  Deposit Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    step="0.01"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-bold">
                    TON
                  </span>
                </div>
              </div>

              {/* Deposit Address */}
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase block mb-2">
                  Deposit Address
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <span className="text-white text-xs font-mono break-all">
                      {networkInfo.depositAddress}
                    </span>
                  </div>
                  <button
                    onClick={copyDepositAddress}
                    className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <Icons.Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-300 text-[10px] leading-relaxed">
                  1. Enter the amount you want to deposit<br/>
                  2. Click "Create Deposit" to generate a deposit record<br/>
                  3. Send exactly the specified amount to the deposit address<br/>
                  4. Your balance will update automatically once confirmed
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDeposit}
                  disabled={isCreatingDeposit || !depositAmount}
                  className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isCreatingDeposit ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Deposit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TONDeposit;