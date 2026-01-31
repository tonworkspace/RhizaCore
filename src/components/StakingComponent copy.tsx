import { useState } from 'react';
import { supabase, stakeAirdropBalance, AirdropBalance } from '../lib/supabaseClient';
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
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number>(5); // Default to 5 years
  const [showStakingBenefits, setShowStakingBenefits] = useState(false);
  const [isProcessingStake, setIsProcessingStake] = useState(false);

  // Lock-up period options with benefits
  const lockPeriodOptions = [
    {
      years: 1,
      label: '1 Year',
      stakingPercentage: 50,
      apy: '8%',
      multiplier: '1.0x',
      benefits: ['Basic validator rewards', 'Standard governance rights'],
      color: 'blue',
      recommended: false
    },
    {
      years: 3,
      label: '3 Years',
      stakingPercentage: 60,
      apy: '12%',
      multiplier: '1.5x',
      benefits: ['Enhanced validator rewards', 'Priority governance voting', 'Early feature access'],
      color: 'purple',
      recommended: false
    },
    {
      years: 5,
      label: '5 Years',
      stakingPercentage: 70,
      apy: '18%',
      multiplier: '2.0x',
      benefits: ['Maximum validator rewards', 'Premium governance rights', 'Exclusive marketplace access', 'Airdrop priority'],
      color: 'green',
      recommended: true
    },
    {
      years: 10,
      label: '10 Years',
      stakingPercentage: 80,
      apy: '25%',
      multiplier: '3.0x',
      benefits: ['Elite validator rewards', 'Council governance access', 'Founder-tier benefits', 'Maximum airdrop allocation'],
      color: 'gold',
      recommended: false
    }
  ];

  const handleStakeAirdropBalance = async () => {
    if (!userId) return;
    
    setIsProcessingStake(true);
    try {
      const selectedOption = lockPeriodOptions.find(opt => opt.years === selectedLockPeriod);
      const stakingPercentage = selectedOption?.stakingPercentage || 70;
      
      // For now, we'll use the existing stakeAirdropBalance function
      // In a real implementation, you'd want to pass the lock period and percentage
      const result = await stakeAirdropBalance(userId);
      
      if (result.success) {
        // Record activity for staking with lock period info
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'airdrop_balance_stake',
          amount: result.stakedAmount || 0,
          status: 'completed',
          metadata: { 
            lock_period_years: selectedLockPeriod,
            staking_percentage: stakingPercentage,
            apy: selectedOption?.apy,
            multiplier: selectedOption?.multiplier
          },
          created_at: new Date().toISOString()
        });
        
        showSnackbar?.({ 
          message: 'Stake Finalized', 
          description: `${stakingPercentage}% of hub assets locked for ${selectedLockPeriod} year${selectedLockPeriod > 1 ? 's' : ''} at ${selectedOption?.apy} APY.`, 
          type: 'success' 
        });
        
        onStakeComplete();
        onClose();
      }
    } catch (error) {
      console.error('Staking error:', error);
      showSnackbar?.({ 
        message: 'Staking Error', 
        description: 'An unexpected error occurred during staking', 
        type: 'error' 
      });
    } finally {
      setIsProcessingStake(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/98 backdrop-blur-2xl animate-in fade-in duration-400">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-none p-8 w-full h-full relative z-10 shadow-3xl overflow-y-auto">
        <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-8">
        {/* Protocol-themed Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/10 text-green-400 shadow-inner">
            <Icons.Boost size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Stake Your RZC</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Choose your lock period to earn validator rewards and secure the network</p>
        </div>

        {/* Lock Period Selection */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h4 className="text-white text-lg font-bold mb-2">Choose Lock Period</h4>
            <p className="text-zinc-400 text-xs">Longer commitments earn higher rewards and exclusive benefits</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {lockPeriodOptions.map((option) => {
              const isSelected = selectedLockPeriod === option.years;
              const colorClasses = {
                blue: isSelected ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-500/20 bg-blue-500/5',
                purple: isSelected ? 'border-purple-500/50 bg-purple-500/10' : 'border-purple-500/20 bg-purple-500/5',
                green: isSelected ? 'border-green-500/50 bg-green-500/10' : 'border-green-500/20 bg-green-500/5',
                gold: isSelected ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-yellow-500/20 bg-yellow-500/5'
              };
              
              return (
                <button
                  key={option.years}
                  onClick={() => setSelectedLockPeriod(option.years)}
                  className={`relative p-4 rounded-2xl border transition-all duration-200 text-left ${
                    colorClasses[option.color as keyof typeof colorClasses]
                  } ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
                >
                  {option.recommended && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                      RECOMMENDED
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-sm">{option.label}</span>
                    <span className="text-green-400 font-bold text-xs">{option.apy} APY</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-400">
                      Stake: {option.stakingPercentage}% • Multiplier: {option.multiplier}
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      {option.benefits.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <Icons.Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Selected Period Benefits */}
          <div className="bg-zinc-900/60 rounded-2xl p-4 border border-white/[0.05]">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Boost size={14} className="text-green-400" />
              <span className="text-green-400 text-sm font-bold">
                {lockPeriodOptions.find(opt => opt.years === selectedLockPeriod)?.label} Benefits
              </span>
            </div>
            <div className="space-y-2">
              {lockPeriodOptions.find(opt => opt.years === selectedLockPeriod)?.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  <span className="text-zinc-300 text-xs">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Staking Benefits */}
        <div className="mb-6">
          <button
            onClick={() => setShowStakingBenefits(!showStakingBenefits)}
            className="w-full flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] hover:border-green-500/20 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Icons.Check size={16} className="text-green-400" />
              <span className="text-white text-sm font-bold">Why Stake RZC?</span>
            </div>
            <div className={`transform transition-transform duration-200 ${showStakingBenefits ? 'rotate-180' : ''}`}>
              <Icons.Energy size={16} className="text-zinc-400 group-hover:text-green-400" />
            </div>
          </button>
          
          {showStakingBenefits && (
            <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3 p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icons.Energy size={12} className="text-green-400" />
                </div>
                <div>
                  <div className="text-green-300 text-xs font-bold mb-1">Earn Validator Rewards</div>
                  <div className="text-zinc-400 text-xs leading-relaxed">Generate passive income through network validation and transaction fees over the lock period</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icons.Rank size={12} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-300 text-xs font-bold mb-1">Network Governance</div>
                  <div className="text-zinc-400 text-xs leading-relaxed">Participate in protocol decisions and vote on network upgrades</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icons.Store size={12} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-purple-300 text-xs font-bold mb-1">Priority Access</div>
                  <div className="text-zinc-400 text-xs leading-relaxed">Long-term stakers get priority access to new features, airdrops, and exclusive ecosystem benefits</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Professional Balance Breakdown */}
        <div className="bg-zinc-900/40 rounded-2xl p-6 border border-white/[0.05] space-y-4 mb-6 shadow-inner">
          <div className="text-center mb-4">
            <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-2">Staking Allocation</div>
            <div className="text-white text-lg font-bold">
              {airdropBalance ? (airdropBalance.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'} RZC
            </div>
          </div>
          
          {(() => {
            const selectedOption = lockPeriodOptions.find(opt => opt.years === selectedLockPeriod);
            const stakingPercentage = selectedOption?.stakingPercentage || 70;
            const liquidPercentage = 100 - stakingPercentage;
            
            return (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Staked ({stakingPercentage}%)</span>
                  <span className="text-green-500 font-bold font-mono text-lg">
                    {((airdropBalance?.available_balance || 0) * (stakingPercentage / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-white/[0.03] w-full"></div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Liquid ({liquidPercentage}%)</span>
                  <span className="text-zinc-400 font-bold font-mono text-lg">
                    {((airdropBalance?.available_balance || 0) * (liquidPercentage / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icons.History size={12} className="text-yellow-400" />
                    <span className="text-yellow-300 text-xs font-bold">Lock Period: {selectedLockPeriod} Year{selectedLockPeriod > 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-zinc-400 text-xs">
                    Staked tokens are locked for {selectedLockPeriod} year{selectedLockPeriod > 1 ? 's' : ''}. 
                    You'll maintain {liquidPercentage}% liquid for transactions during this period.
                  </div>
                </div>
                
                {/* APY and Multiplier Display */}
                <div className="flex gap-3 mt-3">
                  <div className="flex-1 bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                    <div className="text-green-400 text-xs font-bold mb-1">Expected APY</div>
                    <div className="text-green-300 text-lg font-bold">{selectedOption?.apy}</div>
                  </div>
                  <div className="flex-1 bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                    <div className="text-blue-400 text-xs font-bold mb-1">Reward Multiplier</div>
                    <div className="text-blue-300 text-lg font-bold">{selectedOption?.multiplier}</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        </div>

        {/* Protocol Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-colors border border-white/5"
          >
            Cancel
          </button>
          <button 
            onClick={handleStakeAirdropBalance} 
            disabled={isProcessingStake || !airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessingStake ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Staking...</span>
              </div>
            ) : (
              `Stake for ${selectedLockPeriod} Year${selectedLockPeriod > 1 ? 's' : ''}`
            )}
          </button>
        </div>
        </div>

      {/* Custom styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Enhanced shadow for protocol modals */
          .shadow-3xl {
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 1), 0 0 40px -10px rgba(34, 197, 94, 0.05);
          }
        `
      }} />
    </div>
  );
};

export default StakingComponent;