import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from '@/hooks/useAuth';
import squadMiningService, { SquadMiningStats, SquadMember } from '../services/SquadMiningService';
import SquadUI from './SquadUI';
import { Icons } from './Icons';

// --- Global Window Interface Extensions ---
declare global {
  interface Window {
    refreshWalletBalance?: () => Promise<void>;
    refreshAirdropBalance?: () => void;
  }
}

// --- Interfaces ---
// (ReferralWithUsers interface removed as it's not used in this component)

// --- Constants ---
const SQUAD_REWARD_PER_MEMBER = 2; // RZC per squad member per claim
const PREMIUM_SQUAD_REWARD_PER_MEMBER = 5; // RZC per premium squad member per claim

// --- Helper ---
const isRecentlyJoined = (dateString: string): boolean => {
  const joinDate = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) <= 7;
};

const SquadMiningSystem = () => {
  const { user } = useAuth();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [squadStats, setSquadStats] = useState<SquadMiningStats | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string>('');
  const [timeUntilClaim, setTimeUntilClaim] = useState<{
    hours: number;
    minutes: number;
    canClaim: boolean;
  }>({ hours: 0, minutes: 0, canClaim: true });
  
  // Duplicates
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // UI State
  const [copied, setCopied] = useState(false);
  const [showNewUI, setShowNewUI] = useState(() => {
    try {
      const saved = localStorage.getItem('prefer_squad_ui');
      return saved !== null ? JSON.parse(saved) : true; // Default to SquadUI
    } catch {
      return true;
    }
  });
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  // --- Logic: Data Transformation for SquadUI ---
  const transformMembersForSquadUI = (members: SquadMember[]) => {
    return members.map(member => ({
      id: member.id.toString(),
      username: member.username || 'Unknown',
      status: member.is_active ? 'active' as const : 'inactive' as const,
      rate: member.is_premium ? PREMIUM_SQUAD_REWARD_PER_MEMBER : SQUAD_REWARD_PER_MEMBER,
      yield24h: (member.is_premium ? PREMIUM_SQUAD_REWARD_PER_MEMBER : SQUAD_REWARD_PER_MEMBER) * 3, // 3 claims per 24h
      rank: member.is_premium ? 'Elite' as const : 'Pro' as const
    }));
  };

  // --- SquadUI Handlers ---
  const handleCopyLink = () => {
    if (!user?.id) return;
    try {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { 
      console.error(e); 
    }
  };

  const handlePingInactive = () => {
    // Placeholder for pinging inactive members
    console.log('Pinging inactive members...');
  };

  const handleHarvestRewards = () => {
    claimSquadRewards();
  };

  const handleInviteToSquad = () => {
    if (!user?.id) return;
    const shareText = "🚀 Join my Squad on RhizaCore! Start mining RZC tokens and help me earn squad rewards every 8 hours! 💎⛏️";
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openTelegramLink(fullUrl);
    } else {
      window.open(fullUrl, '_blank');
    }
  };

  const handleCopyReferralLink = () => {
    if (!referralLink) return;
    try {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Show copy alert
      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 3000);
    } catch (e) { 
      console.error('Failed to copy referral link:', e); 
    }
  };
  const referralLink = user?.id ? `https://t.me/rhizacore_bot?startapp=${user.telegram_id}` : "Loading...";

  const updateTimeUntilClaim = () => {
    if (!squadStats?.last_claim_at) {
      setTimeUntilClaim({ hours: 0, minutes: 0, canClaim: true });
      return;
    }

    const result = squadMiningService.calculateTimeUntilNextClaim(squadStats.last_claim_at);
    setTimeUntilClaim({
      hours: result.hoursRemaining,
      minutes: result.minutesRemaining,
      canClaim: result.canClaim
    });
  };

  // --- Logic: Data Fetching ---

  // Load Squad Mining Data
  const loadSquadMiningData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const userId = parseInt(user.id, 10); // Convert string ID to number
      // Load squad stats and members in parallel
      const [stats, members] = await Promise.all([
        squadMiningService.getSquadMiningStats(userId),
        squadMiningService.getSquadMembers(userId)
      ]);

      setSquadStats(stats);
      setSquadMembers(members);
    } catch (err) {
      console.error('Error loading squad mining data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Claim Squad Mining Rewards
  const claimSquadRewards = async () => {
    if (!user?.id || !squadStats?.can_claim || isClaiming) return;
    
    setIsClaiming(true);
    setClaimMessage('');
    
    try {
      const userId = parseInt(user.id, 10); // Convert string ID to number
      const transactionId = squadMiningService.generateTransactionId(userId);
      const result = await squadMiningService.claimSquadRewards(userId, transactionId);
      
      if (result.success) {
        setClaimMessage(`Successfully claimed ${result.reward_amount?.toLocaleString()} RZC to your wallet from ${result.squad_size} squad members!`);
        
        // Reload data to update stats
        await loadSquadMiningData();
        
        // Trigger wallet refresh to update available_balance
        if (window.refreshWalletBalance) {
          await window.refreshWalletBalance();
        }
      } else {
        setClaimMessage(result.error || 'Failed to claim rewards');
      }
    } catch (error) {
      console.error('Error claiming squad rewards:', error);
      setClaimMessage('Failed to claim rewards. Please try again.');
    } finally {
      setIsClaiming(false);
      // Clear message after 5 seconds
      setTimeout(() => setClaimMessage(''), 5000);
    }
  };

  // 3. Duplicate Handling
  const checkForDuplicates = async () => {
    if (!user?.id) return;
    setIsCheckingDuplicates(true);
    try {
        const userId = parseInt(user.id, 10); // Convert string ID to number
        const { data } = await supabase.from('referrals').select('id, sponsor_id, referred_id').eq('sponsor_id', userId);
        const map = new Map<string, number>();
        let dupes = 0;
        data?.forEach(r => {
            const key = `${r.sponsor_id}_${r.referred_id}`;
            if(map.has(key)) dupes++;
            else map.set(key, 1);
        });
        setDuplicateCount(dupes);
    } catch (e) { console.error(e); }
    finally { setIsCheckingDuplicates(false); }
  };

  const clearDuplicateReferrals = async () => {
      if(!confirm("Are you sure you want to remove duplicate referrals?")) return;
      
      try {
        const userId = parseInt(user!.id, 10); // Convert string ID to number
        const { data: allReferrals } = await supabase
            .from('referrals')
            .select('id, sponsor_id, referred_id, created_at')
            .eq('sponsor_id', userId)
            .order('created_at', { ascending: true }); 

        if (!allReferrals) return;

        const map = new Map<string, any[]>();
        const idsToDelete: number[] = [];

        allReferrals.forEach(ref => {
            const key = `${ref.sponsor_id}_${ref.referred_id}`;
            if (!map.has(key)) {
                map.set(key, [ref]);
            } else {
                map.get(key)!.push(ref);
                idsToDelete.push(ref.id);
            }
        });

        if (idsToDelete.length > 0) {
            await supabase.from('referrals').delete().in('id', idsToDelete);
            setDuplicateCount(0);
            loadSquadMiningData(); 
        }
      } catch (error) {
          console.error("Error clearing duplicates:", error);
      }
  };

  // --- Effects ---
  useEffect(() => { 
    loadSquadMiningData(); 
  }, [user?.id]);

  // Update timer every minute
  useEffect(() => {
    updateTimeUntilClaim();
    const interval = setInterval(updateTimeUntilClaim, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [squadStats?.last_claim_at]);
  
  useEffect(() => {
      console.log('🔌 Setting up real-time subscription...');
      const sub = supabase.channel('public_referrals').on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'referrals'
      }, (payload) => {
          console.log('📡 Real-time referral update:', payload);
          loadSquadMiningData();
      }).subscribe((status) => {
          console.log('📡 Subscription status:', status);
      });
      
      return () => { 
          console.log('🔌 Cleaning up subscription...');
          supabase.removeChannel(sub); 
      };
  }, [user?.id]);

  // Listen for UI preference changes from Settings
  useEffect(() => {
    const handleUIPreferenceChange = (event: CustomEvent) => {
      const { preferSquadUI } = event.detail;
      setShowNewUI(preferSquadUI);
    };

    window.addEventListener('app:ui-preference-change', handleUIPreferenceChange as EventListener);
    
    return () => {
      window.removeEventListener('app:ui-preference-change', handleUIPreferenceChange as EventListener);
    };
  }, []);

  // --- Render ---

  // Show new SquadUI if enabled
  if (showNewUI) {
    const transformedMembers = transformMembersForSquadUI(squadMembers);
    const multiplier = 1 + (squadMembers.length * 0.1); // 10% boost per member
    
    return (
      <div className="flex flex-col h-full w-full bg-black text-white relative">
        <SquadUI
          members={transformedMembers}
          totalRewards={squadStats?.potential_reward || 0}
          multiplier={multiplier}
          referralCode={user?.telegram_id?.toString() || 'Loading...'}
          onCopyLink={handleCopyLink}
          onPingInactive={handlePingInactive}
          onHarvestRewards={handleHarvestRewards}
          onInviteToSquad={handleInviteToSquad}
          onCopyReferralLink={handleCopyReferralLink}
          referralLink={referralLink}
          isClaiming={isClaiming}
          canClaim={timeUntilClaim.canClaim}
          claimMessage={claimMessage}
          timeUntilClaim={timeUntilClaim}
        />
        
        {/* Claim Message Overlay */}
        {claimMessage && (
          <div className="fixed bottom-24 left-4 right-4 z-50">
            <div className={`text-xs p-3 rounded-xl text-center shadow-lg ${
              claimMessage.includes('Successfully') 
                ? 'bg-green-500/90 text-white border border-green-400' 
                : 'bg-red-500/90 text-white border border-red-400'
            }`}>
              {claimMessage}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar bg-black text-white relative responsive-padding">
      
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold tracking-wider mb-2 text-white">Squad Mining</h1>
      <p className="text-gray-400 text-xs sm:text-sm mb-6 leading-relaxed">
        Build your mining squad and claim <span className="text-green-400 font-bold">{SQUAD_REWARD_PER_MEMBER} RZC</span> per member every <span className="text-blue-400 font-bold">8 hours</span> directly to your wallet.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 relative z-10">Squad Size</span>
            <span className="text-xl font-bold text-white font-mono relative z-10">{squadStats?.squad_size || 0}</span>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 relative z-10">Per Claim</span>
            <span className="text-xl font-bold text-green-400 font-mono relative z-10">{squadStats?.potential_reward?.toLocaleString() || '0'}</span>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 relative z-10">Total Earned</span>
            <span className="text-xl font-bold text-purple-400 font-mono relative z-10">{squadStats?.total_rewards_earned?.toLocaleString() || '0'}</span>
        </div>
      </div>

     {/* Squad Mining Claim Card */}
     <div className="w-full bg-gradient-to-br from-zinc-900 to-[#050a05] border border-green-500/20 rounded-2xl p-4 relative shadow-lg mb-4 group">
         {/* Subtle Ambient Glow */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col gap-3">
             {/* Squad Mining Header */}
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="bg-green-500/10 p-1.5 rounded-lg text-green-400">
                        <Icons.Award size={16} />
                    </div>
                    <div>
                        <span className="text-green-400/60 text-[9px] font-mono uppercase tracking-widest block leading-none mb-0.5">Squad Mining</span>
                        <h3 className="text-white text-sm font-bold leading-none">Claim Rewards</h3>
                    </div>
                 </div>
                 <div className="flex items-center gap-1 text-xs">
                    <Icons.Clock size={12} className="text-blue-400" />
                    <span className="text-blue-400 font-mono">
                      {timeUntilClaim.canClaim ? 'Ready!' : `${timeUntilClaim.hours}h ${timeUntilClaim.minutes}m`}
                    </span>
                 </div>
             </div>
             
             {/* Claim Button */}
             <div className="flex gap-2">
                <button 
                    onClick={claimSquadRewards}
                    disabled={!timeUntilClaim.canClaim || isClaiming || (squadStats?.squad_size || 0) === 0}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg active:scale-[0.98] ${
                        timeUntilClaim.canClaim && (squadStats?.squad_size || 0) > 0 && !isClaiming
                        ? 'bg-green-500 text-black hover:bg-green-400 shadow-green-900/20' 
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {isClaiming ? (
                        <>
                            <Icons.Loader className="animate-spin" size={16} />
                            Claiming...
                        </>
                    ) : timeUntilClaim.canClaim ? (
                        <>
                            <Icons.Zap size={16} />
                            Claim {squadStats?.potential_reward?.toLocaleString() || '0'} RZC
                        </>
                    ) : (
                        <>
                            <Icons.Clock size={16} />
                            Next Claim in {timeUntilClaim.hours}h {timeUntilClaim.minutes}m
                        </>
                    )}
                </button>
             </div>

             {/* Claim Message */}
             {claimMessage && (
                <div className={`text-xs p-2 rounded-lg text-center ${
                    claimMessage.includes('Successfully') 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                    {claimMessage}
                </div>
             )}
         </div>
      </div>

     {/* Compact Invite Card */}
     <div className="w-full bg-gradient-to-br from-zinc-900 to-[#050a05] border border-blue-500/20 rounded-2xl p-4 relative shadow-lg mb-4 group">
         {/* Subtle Ambient Glow */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col gap-3">
             {/* Compact Header */}
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="bg-blue-500/10 p-1.5 rounded-lg text-blue-400">
                        <Icons.Users size={16} />
                    </div>
                    <div>
                        <span className="text-blue-400/60 text-[9px] font-mono uppercase tracking-widest block leading-none mb-0.5">Expand</span>
                        <h3 className="text-white text-sm font-bold leading-none">Invite Squad</h3>
                    </div>
                 </div>
                 <div className="flex gap-1">
                    {duplicateCount > 0 && (
                        <button 
                            onClick={clearDuplicateReferrals} 
                            className="text-red-400 bg-red-500/10 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Clear Duplicates"
                        >
                            <Icons.Trash size={14} />
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            setIsCheckingDuplicates(true);
                            checkForDuplicates();
                        }} 
                        disabled={isCheckingDuplicates}
                        className={`text-gray-500 hover:text-white p-1.5 rounded-lg transition-colors ${isCheckingDuplicates ? "animate-spin text-blue-400" : ""}`}
                    >
                        <Icons.Refresh size={14} />
                    </button>
                 </div>
             </div>
             
             {/* Compact Input Row */}
             <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between transition-colors hover:border-green-500/30">
                    {user?.id ? (
                        <span className="text-gray-300 text-xs font-mono truncate select-all mr-2">
                            {referralLink}
                        </span>
                    ) : (
                        <div className="h-4 w-24 bg-zinc-800 animate-pulse rounded"></div>
                    )}
                </div>
                <button 
                    onClick={() => {
                        if (!user?.id) return;
                        try {
                            navigator.clipboard.writeText(referralLink);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                            
                            // Show copy alert
                            setShowCopyAlert(true);
                            setTimeout(() => setShowCopyAlert(false), 3000);
                        } catch (e) { console.error(e); }
                    }}
                    disabled={!user?.id}
                    className={`w-10 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                        copied 
                        ? 'bg-green-500 text-black border-green-500' 
                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {copied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
                </button>
             </div>
             
             {/* Compact Action Buttons */}
             <div className="flex gap-2">
                 <button 
                    onClick={() => {
                        if (!user?.id) return;
                        const shareText = "🚀 Join my Squad on RhizaCore! Start mining RZC tokens and help me earn squad rewards every 8 hours! 💎⛏️";
                        const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
                        if ((window as any).Telegram?.WebApp) {
                            (window as any).Telegram.WebApp.openTelegramLink(fullUrl);
                        } else {
                            window.open(fullUrl, '_blank');
                        }
                    }}
                    disabled={!user?.id}
                    className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     <Icons.Share size={14} />
                     Invite to Squad
                 </button>
             </div>
         </div>
      </div>

      {/* Squad Members Content */}
      <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm">
                  Squad Members ({squadMembers.length})
              </h3>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Active: {squadMembers.filter(m => m.is_active).length}
                  </span>
              </div>
          </div>

          <div className="space-y-3 pb-6">
              {isLoading ? (
                  <div className="flex justify-center py-8"><Icons.Loader className="animate-spin text-green-400" /></div>
              ) : (
                  /* Squad Members List */
                  squadMembers.length > 0 ? (
                      squadMembers.map((member) => (
                          <div key={member.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold ${
                                    member.is_premium ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400' : 'bg-zinc-800 border-white/10 text-gray-400'
                                  }`}>
                                      {member.username?.[0]?.toUpperCase() || <Icons.User size={16}/>}
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-1.5">
                                          <span className="text-white text-xs font-bold">{member.username || "Unknown"}</span>
                                          {member.is_active && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_currentColor]"></div>}
                                          {member.is_premium && <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1.5 rounded">PREMIUM</span>}
                                          {isRecentlyJoined(member.joined_at) && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 rounded">NEW</span>}
                                      </div>
                                      <span className="text-[9px] text-gray-500 font-mono">
                                          {member.rank} • {member.total_earned.toLocaleString()} RZC earned
                                      </span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-green-400 text-xs font-mono font-bold">
                                      +{member.is_premium ? PREMIUM_SQUAD_REWARD_PER_MEMBER : SQUAD_REWARD_PER_MEMBER}
                                  </div>
                                  <div className="text-[9px] text-gray-600 uppercase tracking-tighter">
                                      Per Claim
                                  </div>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        <Icons.Users className="mx-auto mb-2 opacity-50" size={32} />
                        No squad members yet. Invite friends to start earning!
                      </div>
                  )
              )}
          </div>

          <div className="mt-2 p-4 rounded-xl bg-green-400/5 border border-dashed border-green-400/20 text-center">
              <p className="text-[10px] text-gray-500 italic">
                "Build your squad and claim {SQUAD_REWARD_PER_MEMBER} RZC per member every 8 hours directly to your wallet. Premium members earn {PREMIUM_SQUAD_REWARD_PER_MEMBER} RZC each!"
              </p>
          </div>
      </div>

      {/* Copy Alert Notification */}
      {showCopyAlert && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center shadow-lg border border-green-400/30 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-center gap-2">
              <Icons.Check size={16} />
              <span className="text-sm font-bold">Referral Link Copied!</span>
            </div>
            <p className="text-xs opacity-90 mt-1">Share it with friends to grow your squad</p>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .responsive-text { font-size: 0.875rem; }
          .responsive-padding { padding: 1rem; }
          .responsive-gap { gap: 0.5rem; }
        }
        
        /* Animation for copy alert */
        @keyframes slide-in-from-top-4 {
          from {
            transform: translateY(-1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top-4 {
          animation-name: slide-in-from-top-4;
        }
        
        .duration-300 {
          animation-duration: 300ms;
        }
      `}</style>
    </div>
  );
};

export default SquadMiningSystem;