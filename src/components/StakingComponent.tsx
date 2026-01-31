import React, { useState } from 'react';
import { supabase, AirdropBalance } from '../lib/supabaseClient';
import { Icons } from '../uicomponents/Icons';

// Define SnackbarData type locally
interface SnackbarData {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface StakingComponentProps {
  userId: number;
  airdropBalance: AirdropBalance | null;
  onClose: () => void;
  onStakeComplete: () => void;
  showSnackbar?: (data: SnackbarData) => void;
}

const StakingComponent: React.FC<StakingComponentProps> = ({
  userId,
  airdropBalance,
  onClose,
  onStakeComplete,
  showSnackbar
}) => {
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number>(3); // Default to 3 years (balanced option)
  const [isProcessingStake, setIsProcessingStake] = useState(false);
  const [showPeriodOptions, setShowPeriodOptions] = useState(false); // Collapsible period selection

  // Simplified lock-up period options - All require 70% minimum stake
  const lockPeriodOptions = [
    {
      years: 1,
      label: '1 Year',
      stakingPercentage: 70, // Minimum 70% for all periods
      apy: '8%',
      description: 'Short term, flexible',
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-500/50'
    },
    {
      years: 3,
      label: '3 Years',
      stakingPercentage: 70, // Minimum 70% for all periods
      apy: '15%',
      description: 'Balanced rewards',
      color: 'blue',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500/50',
      recommended: true
    },
    {
      years: 5,
      label: '5 Years',
      stakingPercentage: 70, // Minimum 70% for all periods
      apy: '22%',
      description: 'Maximum returns',
      color: 'purple',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-500/50'
    }
  ];

  const handleStakeAirdropBalance = async () => {
    if (!userId) return;
    
    setIsProcessingStake(true);
    try {
      const selectedOption = lockPeriodOptions.find(opt => opt.years === selectedLockPeriod);
      const stakingPercentage = selectedOption?.stakingPercentage || 70;
      const apyRate = parseFloat(selectedOption?.apy.replace('%', '') || '15');
      
      // Use the existing stakeAirdropBalance function from supabaseClient
      const { stakeAirdropBalance } = await import('../lib/supabaseClient');
      const result = await stakeAirdropBalance(userId);
      
      if (result.success) {
        // Calculate unlock date based on lock period
        const unlockDate = new Date();
        unlockDate.setFullYear(unlockDate.getFullYear() + selectedLockPeriod);
        
        // Record activity with lock period information
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'airdrop_balance_stake_locked',
          amount: result.stakedAmount || 0,
          status: 'completed',
          metadata: { 
            lock_period_years: selectedLockPeriod,
            staking_percentage: stakingPercentage,
            apy_rate: apyRate,
            unlock_date: unlockDate.toISOString(),
            lock_enforced: true,
            stake_type: 'locked_staking'
          },
          created_at: new Date().toISOString()
        });
        
        const unlockDateString = unlockDate.toLocaleDateString();
        
        showSnackbar?.({ 
          message: 'Staking Locked Successfully!', 
          description: `${stakingPercentage}% locked for ${selectedLockPeriod} year${selectedLockPeriod > 1 ? 's' : ''} at ${selectedOption?.apy} APY. Unlocks on ${unlockDateString}`, 
          type: 'success' 
        });
        
        onStakeComplete();
        onClose();
      } else {
        showSnackbar?.({ 
          message: 'Staking Failed', 
          description: result.error || 'Insufficient balance or protocol error.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Staking error:', error);
      showSnackbar?.({ 
        message: 'Staking Failed', 
        description: 'Please try again later.', 
        type: 'error' 
      });
    } finally {
      setIsProcessingStake(false);
    }
  };

  const selectedOption = lockPeriodOptions.find(opt => opt.years === selectedLockPeriod);
  const stakingAmount = ((airdropBalance?.available_balance || 0) * (selectedOption?.stakingPercentage || 70) / 100);
  const liquidAmount = (airdropBalance?.available_balance || 0) - stakingAmount;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/98 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-2xl w-full max-w-md mx-4 border border-zinc-700/50 shadow-2xl overflow-hidden relative z-10">
        <div className="flex flex-col px-6 py-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-6 h-6 rounded-full bg-zinc-800/50 hover:bg-zinc-700 transition-colors flex items-center justify-center group"
          >
            <Icons.X size={14} className="text-zinc-400 group-hover:text-white" />
          </button>
          
          {/* Header Section */}
          <div className="text-center mt-2 mb-6">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-green-500/20">
              <Icons.Boost size={28} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Protocol Staking</h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.25em]">Commit RZC for Mainnet Validation</p>
          </div>

          {/* Balance Display */}
          <div className="bg-[#080808] border border-white/5 rounded-2xl p-6 mb-6 text-center shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <div className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.25em] mb-2">Available Liquid Pool</div>
              <div className="text-white text-3xl font-bold font-mono tracking-tighter mb-1">
                {(airdropBalance?.available_balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-green-500 text-[10px] font-bold uppercase tracking-widest">RZC Tokens</div>
            </div>
          </div>

          {/* Collapsible Period Selection */}
          <div className="mb-6">
            <button
              onClick={() => setShowPeriodOptions(!showPeriodOptions)}
              className="w-full flex items-center justify-between p-4 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-xl border border-white/5 transition-all group mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                  <Icons.Calendar size={16} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-base tracking-tight">
                    {lockPeriodOptions.find(opt => opt.years === selectedLockPeriod)?.label} Phase
                  </div>
                  <div className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                    {lockPeriodOptions.find(opt => opt.years === selectedLockPeriod)?.apy} Target APR
                  </div>
                </div>
              </div>
              <div className={`transform transition-transform duration-300 ${showPeriodOptions ? 'rotate-180' : 'rotate-90'}`}>
                <Icons.ChevronRight size={16} className="text-zinc-400 group-hover:text-white" />
              </div>
            </button>
            
            {showPeriodOptions && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                {lockPeriodOptions.map((option) => (
                  <button
                    key={option.years}
                    onClick={() => {
                      setSelectedLockPeriod(option.years);
                      setShowPeriodOptions(false);
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden group/btn ${
                      selectedLockPeriod === option.years
                        ? `${option.borderColor} bg-white/[0.03] shadow-lg`
                        : 'border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50'
                    }`}
                  >
                    {selectedLockPeriod === option.years && (
                      <div className={`absolute top-0 right-0 h-1 w-full ${option.bgColor}`} />
                    )}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold tracking-tight transition-colors ${
                            selectedLockPeriod === option.years ? 'text-white' : 'text-zinc-400'
                          }`}>
                            {option.label} Phase
                          </span>
                          {option.recommended && (
                            <span className="bg-green-500 text-black text-[7px] font-black px-2 py-0.5 rounded-full tracking-widest">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-wide">{option.description}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-mono font-bold transition-colors ${
                          selectedLockPeriod === option.years ? 'text-green-500' : 'text-zinc-600'
                        }`}>
                          {option.apy}
                        </div>
                        <div className="text-zinc-600 text-[7px] font-black uppercase tracking-widest">Target APR</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Breakdown Summary */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Protocol Stake</span>
              <span className="text-green-500 font-mono font-bold text-sm">
                {stakingAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Reserved Liquid</span>
              <span className="text-zinc-400 font-mono font-bold text-sm">
                {liquidAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} RZC
              </span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Projected APR</span>
              <span className="text-green-500 font-mono font-bold text-base">{selectedOption?.apy}</span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleStakeAirdropBalance} 
            disabled={isProcessingStake || !airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
            className={`group relative w-full h-12 rounded-xl font-black uppercase text-xs tracking-[0.25em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-40 overflow-hidden mb-4 ${
              selectedOption?.bgColor || 'bg-green-600'
            } text-white`}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isProcessingStake ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Icons.Lock size={16} strokeWidth={2.5} />
                  Finalize Staking
                </>
              )}
            </span>
          </button>

          <div className="text-center px-8">
            <p className="text-zinc-700 text-[7px] leading-relaxed font-black uppercase tracking-[0.1em]">
              Staked tokens are locked within the protocol and will be migrated to the RhizaCore Mainnet as Validator Stake upon network transition.
            </p>
          </div>

          <style dangerouslySetInnerHTML={{ 
            __html: `
              @keyframes slide-in-from-bottom-4 {
                from { transform: translateY(1rem); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes slide-in-from-top-2 {
                from { transform: translateY(-0.5rem); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `
          }} />
        </div>
      </div>
    </div>
  );
};

export default StakingComponent;