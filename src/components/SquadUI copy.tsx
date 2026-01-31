import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface SquadMember {
  id: string;
  username: string;
  status: 'active' | 'inactive';
  rate: number;
  yield24h: number;
  rank: 'Validator' | 'Pro' | 'Elite';
}

interface SquadUIProps {
  members: SquadMember[];
  totalRewards: number;
  multiplier: number;
  referralCode: string;
  onCopyLink: () => void;
  onPingInactive: () => void;
  onHarvestRewards: () => void;
  // Claiming state props
  isClaiming?: boolean;
  canClaim?: boolean;
  claimMessage?: string;
  timeUntilClaim?: {
    hours: number;
    minutes: number;
    canClaim: boolean;
  };
  // Invite functionality
  onInviteToSquad?: () => void;
  referralLink?: string;
  onCopyReferralLink?: () => void;
  // Alert triggers
  onHarvestSuccess?: () => void;
}

const SquadUI: React.FC<SquadUIProps> = ({
  members,
  totalRewards,
  multiplier,
  referralCode,
  onCopyLink,
  onPingInactive,
  onHarvestRewards,
  isClaiming = false,
  canClaim = true,
  claimMessage = '',
  timeUntilClaim = { hours: 0, minutes: 0, canClaim: true },
  onInviteToSquad,
  referralLink,
  onCopyReferralLink,
  onHarvestSuccess
}) => {
  const activeCount = members.filter(m => m.status === 'active').length;
  const [referralLinkCopied, setReferralLinkCopied] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [showHarvestAlert, setShowHarvestAlert] = useState(false);
  const [showPingAlert, setShowPingAlert] = useState(false);
  const [showReferralCodeCopyAlert, setShowReferralCodeCopyAlert] = useState(false);

  // Listen for harvest success
  useEffect(() => {
    if (onHarvestSuccess) {
      const handleHarvestSuccess = () => {
        setShowHarvestAlert(true);
        setTimeout(() => setShowHarvestAlert(false), 4000);
      };
      
      // This is a bit of a workaround - we'll trigger this when claimMessage indicates success
      if (claimMessage && claimMessage.includes('Successfully')) {
        handleHarvestSuccess();
      }
    }
  }, [claimMessage, onHarvestSuccess]);

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar bg-black text-white relative responsive-padding animate-in fade-in slide-in-from-right-8 duration-700">
      {/* Network Stats Dashboard */}
      <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-7 mb-8 relative shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.3em]">Network Active</span>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Validator Squad</h2>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
            <span className="text-green-500 font-mono font-bold text-xs">
              {multiplier.toFixed(2)}x <span className="text-[8px] uppercase font-sans tracking-widest ml-1">Boost</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <span className="text-zinc-600 text-[7px] font-black uppercase tracking-widest block mb-1">Squad Size</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-xl font-bold font-mono">{members.length}</span>
              <span className="text-zinc-500 text-[9px] font-medium">Nodes</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <span className="text-zinc-600 text-[7px] font-black uppercase tracking-widest block mb-1">
              {canClaim ? 'Ready to Harvest' : 'Next Harvest'}
            </span>
            <div className="flex items-baseline gap-1">
              {canClaim ? (
                <>
                  <span className="text-green-500 text-xl font-bold font-mono">{totalRewards.toFixed(2)}</span>
                  <span className="text-green-800 text-[8px] font-bold">RZC</span>
                </>
              ) : (
                <>
                  <span className="text-blue-400 text-lg font-bold font-mono">
                    {timeUntilClaim.hours}h {timeUntilClaim.minutes}m
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            onHarvestRewards();
          }}
          disabled={!canClaim || isClaiming || members.length === 0}
          className={`w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10 ${
            canClaim && !isClaiming && members.length > 0
              ? 'bg-white text-black hover:bg-green-500 hover:text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isClaiming ? (
            <>
              <Icons.Loader className="animate-spin" size={16} strokeWidth={3} />
              Harvesting...
            </>
          ) : !canClaim ? (
            <>
              <Icons.Clock size={16} strokeWidth={3} />
              Next Harvest in {timeUntilClaim.hours}h {timeUntilClaim.minutes}m
            </>
          ) : members.length === 0 ? (
            <>
              <Icons.Users size={16} strokeWidth={3} />
              No Squad Members
            </>
          ) : (
            <>
              <Icons.Energy size={16} strokeWidth={3} />
              Harvest Network Yield
            </>
          )}
        </button>
      </div>

      {/* Claim Message */}
      {claimMessage && (
        <div className="mb-6">
          <div className={`text-xs p-3 rounded-xl text-center shadow-lg ${
            claimMessage.includes('Successfully') || claimMessage.includes('claimed')
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {claimMessage}
          </div>
        </div>
      )}

      {/* Recruitment Hub */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400">
              <Icons.Share size={18} />
            </div>
            <div>
              <div className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Global Invite Signature</div>
              <div className="text-white font-mono text-xs font-bold">{referralCode}</div>
            </div>
          </div>
          <button 
            onClick={() => {
              onCopyLink();
              // Show referral code copy alert
              setShowReferralCodeCopyAlert(true);
              setTimeout(() => setShowReferralCodeCopyAlert(false), 3000);
            }}
            className="h-10 px-5 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-90"
          >
            Copy
          </button>
        </div>
        
        {/* Full Referral Link Display */}
        {referralLink && (
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-4">
            <div className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-2">Full Invite Link</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-gray-300 text-xs font-mono truncate select-all">
                {referralLink}
              </div>
              <button 
                onClick={() => {
                  if (onCopyReferralLink) {
                    onCopyReferralLink();
                  } else {
                    // Fallback copy functionality
                    try {
                      navigator.clipboard.writeText(referralLink);
                      setReferralLinkCopied(true);
                      setTimeout(() => setReferralLinkCopied(false), 2000);
                    } catch (e) {
                      console.error('Failed to copy referral link:', e);
                    }
                  }
                  // Show copy alert
                  setShowCopyAlert(true);
                  setTimeout(() => setShowCopyAlert(false), 3000);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                  referralLinkCopied 
                    ? 'bg-green-500 text-black border-green-500' 
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                {referralLinkCopied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
              </button>
            </div>
          </div>
        )}
        
        {/* Invite Button */}
        {onInviteToSquad && (
          <button 
            onClick={onInviteToSquad}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            <Icons.Share size={16} />
            Invite to Squad
          </button>
        )}
      </div>

      {/* Member Registry */}
      <div className="flex items-center justify-between mb-5 px-1">
        <h3 className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">
          Node Registry ({activeCount} Online)
        </h3>
        <button 
          onClick={() => {
            onPingInactive();
            // Show ping alert
            setShowPingAlert(true);
            setTimeout(() => setShowPingAlert(false), 3000);
          }} 
          className="text-green-500 text-[8px] font-black uppercase tracking-widest hover:text-green-400 transition-colors"
        >
          Ping Inactive Nodes
        </button>
      </div>

      <div className="space-y-4 pb-6">
        {members.length > 0 ? (
          members.map((member) => (
            <div 
              key={member.id} 
              className={`bg-[#080808] border rounded-[2rem] p-5 flex items-center justify-between transition-all duration-500 ${
                member.status === 'active' 
                  ? 'border-green-500/10' 
                  : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  member.status === 'active' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                    : 'bg-zinc-900 border-white/5 text-zinc-700'
                }`}>
                  <Icons.Users size={20} />
                  {member.status === 'active' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-xs font-bold">@{member.username}</span>
                    <span className={`text-[6px] font-black px-1.5 py-0.5 rounded border uppercase ${
                      member.rank === 'Elite' 
                        ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' 
                        : 'text-zinc-500 border-white/10'
                    }`}>
                      {member.rank}
                    </span>
                  </div>
                  <div className="text-zinc-600 text-[8px] font-medium uppercase tracking-wider">
                    Contribution: <span className={member.status === 'active' ? 'text-green-500' : ''}>
                      +{member.rate} RZC/h
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-zinc-600 text-[7px] font-black uppercase tracking-widest mb-1">24H Yield</div>
                <div className={`font-mono font-bold text-sm ${
                  member.status === 'active' ? 'text-white' : 'text-zinc-700'
                }`}>
                  {member.yield24h.toFixed(2)} <span className="text-[8px] font-sans">RZC</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-xs">
            <Icons.Users className="mx-auto mb-2 opacity-50" size={32} />
            No squad members yet. Invite friends to start earning!
          </div>
        )}
      </div>

      {/* Bottom Info Card */}
      <div className="mt-2 p-4 rounded-xl bg-green-400/5 border border-dashed border-green-400/20 text-center">
        <p className="text-[10px] text-gray-500 italic">
          "Build your validator squad and harvest network yield every 8 hours. Elite members contribute more to the collective mining power!"
        </p>
      </div>

      {/* Copy Alert Notification */}
      {showCopyAlert && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center shadow-lg border border-green-400/30">
            <div className="flex items-center justify-center gap-2">
              <Icons.Check size={16} />
              <span className="text-sm font-bold">Referral Link Copied!</span>
            </div>
            <p className="text-xs opacity-90 mt-1">Share it with friends to grow your squad</p>
          </div>
        </div>
      )}

      {/* Referral Code Copy Alert */}
      {showReferralCodeCopyAlert && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-blue-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center shadow-lg border border-blue-400/30">
            <div className="flex items-center justify-center gap-2">
              <Icons.Copy size={16} />
              <span className="text-sm font-bold">Invite Code Copied!</span>
            </div>
            <p className="text-xs opacity-90 mt-1">Share your unique invite signature</p>
          </div>
        </div>
      )}

      {/* Harvest Rewards Alert */}
      {showHarvestAlert && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center shadow-lg border border-green-400/30">
            <div className="flex items-center justify-center gap-2">
              <Icons.Energy size={16} />
              <span className="text-sm font-bold">Rewards Harvested!</span>
            </div>
            <p className="text-xs opacity-90 mt-1">Network yield successfully claimed to wallet</p>
          </div>
        </div>
      )}

      {/* Ping Inactive Alert */}
      {showPingAlert && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-orange-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center shadow-lg border border-orange-400/30">
            <div className="flex items-center justify-center gap-2">
              <Icons.Users size={16} />
              <span className="text-sm font-bold">Inactive Nodes Pinged!</span>
            </div>
            <p className="text-xs opacity-90 mt-1">Notification sent to inactive squad members</p>
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

export default SquadUI;