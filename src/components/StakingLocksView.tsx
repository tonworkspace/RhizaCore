import React, { useState, useEffect } from 'react';
import { getUserStakingLocksSummary, canUserUnstake, unstakeAirdropBalance } from '../lib/supabaseClient';
import { Icons } from '../uicomponents/Icons';

interface SnackbarData {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface StakingLocksViewProps {
  userId: number;
  onUpdateBalances: () => void;
  showSnackbar?: (data: SnackbarData) => void;
}

interface StakingLocksSummary {
  totalStaked: number;
  totalLocked: number;
  totalUnlocked: number;
  activeLocks: number;
  nextUnlockDate: string | null;
  lockDetails: Array<{
    amount: number;
    unlockDate: string;
    lockPeriodYears: number;
    apyRate: number;
    isLocked: boolean;
    timeRemaining?: string;
  }>;
}

const StakingLocksView: React.FC<StakingLocksViewProps> = ({
  userId,
  onUpdateBalances,
  showSnackbar
}) => {
  const [stakingSummary, setStakingSummary] = useState<StakingLocksSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unstakingIndex, setUnstakingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadStakingData();
  }, [userId]);

  const loadStakingData = async () => {
    setIsLoading(true);
    try {
      const summary = await getUserStakingLocksSummary(userId);
      setStakingSummary(summary);
    } catch (error) {
      console.error('Error loading staking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async (amount: number, index: number) => {
    setUnstakingIndex(index);
    try {
      // Check if user can unstake this amount
      const canUnstake = await canUserUnstake(userId, amount);
      
      if (!canUnstake.canUnstake) {
        showSnackbar?.({
          message: 'Cannot Unstake Yet',
          description: `${canUnstake.lockedAmount.toLocaleString()} RZC is still locked. Available to unstake: ${canUnstake.availableAmount.toLocaleString()} RZC`,
          type: 'error'
        });
        return;
      }

      const result = await unstakeAirdropBalance(userId, amount);
      
      if (result.success) {
        showSnackbar?.({
          message: 'Unstaking Successful!',
          description: `${result.unstakedAmount?.toLocaleString()} RZC has been returned to your available balance`,
          type: 'success'
        });
        
        // Reload data and update balances
        await loadStakingData();
        onUpdateBalances();
      } else {
        showSnackbar?.({
          message: 'Unstaking Failed',
          description: result.error || 'Unable to unstake at this time',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Unstaking error:', error);
      showSnackbar?.({
        message: 'Unstaking Error',
        description: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setUnstakingIndex(null);
    }
  };

  const calculateProjectedRewards = (stakedAmount: number, apyRate: number, lockYears: number) => {
    const annualReward = (stakedAmount * apyRate) / 100;
    const totalReward = annualReward * lockYears;
    return { annualReward, totalReward };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stakingSummary || stakingSummary.totalStaked === 0) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icons.Lock size={24} className="text-zinc-500" />
        </div>
        <h3 className="text-white font-bold mb-2">No Active Stakes</h3>
        <p className="text-zinc-400 text-sm">You haven't staked any tokens yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staking Summary */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Icons.Lock size={20} className="text-green-500" />
          Staking Overview
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/30 rounded-xl p-4">
            <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Staked</div>
            <div className="text-white text-xl font-bold font-mono">
              {stakingSummary.totalStaked.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
            </div>
          </div>
          
          <div className="bg-zinc-800/30 rounded-xl p-4">
            <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Active Locks</div>
            <div className="text-white text-xl font-bold">
              {stakingSummary.activeLocks}
            </div>
          </div>
          
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
            <div className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Currently Locked</div>
            <div className="text-red-300 text-lg font-bold font-mono">
              {stakingSummary.totalLocked.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
            </div>
          </div>
          
          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
            <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Available to Unstake</div>
            <div className="text-green-300 text-lg font-bold font-mono">
              {stakingSummary.totalUnlocked.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
            </div>
          </div>
        </div>

        {stakingSummary.nextUnlockDate && (
          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Icons.Calendar size={14} className="text-blue-400" />
              <span className="text-blue-300 text-sm font-bold">
                Next Unlock: {new Date(stakingSummary.nextUnlockDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Individual Staking Locks */}
      <div className="space-y-3">
        <h4 className="text-white font-bold text-base">Active Stakes</h4>
        
        {stakingSummary.lockDetails.map((lock, index) => {
          const projectedRewards = calculateProjectedRewards(
            lock.amount,
            lock.apyRate,
            lock.lockPeriodYears
          );
          
          return (
            <div key={index} className="bg-zinc-800/30 border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${lock.isLocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <div>
                    <div className="text-white font-bold">
                      {lock.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
                    </div>
                    <div className="text-zinc-400 text-xs">
                      {lock.lockPeriodYears} Year Lock • {lock.apyRate.toFixed(1)}% APY
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-bold ${lock.isLocked ? 'text-red-400' : 'text-green-400'}`}>
                    {lock.timeRemaining || (lock.isLocked ? 'Locked' : 'Unlocked')}
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {lock.isLocked ? 'Locked' : 'Ready to Unstake'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Unlock Date</div>
                  <div className="text-zinc-300 text-sm">
                    {new Date(lock.unlockDate).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Lock Period</div>
                  <div className="text-zinc-300 text-sm">
                    {lock.lockPeriodYears} Year{lock.lockPeriodYears > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div>
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Annual Reward</div>
                  <div className="text-green-400 text-sm font-bold">
                    +{projectedRewards.annualReward.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
                  </div>
                </div>
                
                <div>
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Projected</div>
                  <div className="text-green-400 text-sm font-bold">
                    +{projectedRewards.totalReward.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
                  </div>
                </div>
              </div>
              
              {!lock.isLocked && (
                <button
                  onClick={() => handleUnstake(lock.amount, index)}
                  disabled={unstakingIndex === index}
                  className="w-full h-10 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {unstakingIndex === index ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Unstaking...
                    </>
                  ) : (
                    <>
                      <Icons.Wallet size={16} />
                      Unstake Now
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StakingLocksView;