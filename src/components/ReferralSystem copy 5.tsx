import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from '@/hooks/useAuth';
import {
  Users,
  Copy,
  Check,
  Zap,
  Shield,
  Loader2,
  Share2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  User
} from 'lucide-react';

// --- Icons Mapping ---
const Icons = {
  Users,
  Copy,
  Check,
  Zap,
  Shield,
  Loader: Loader2,
  Share: Share2,
  Alert: AlertTriangle,
  Trash: Trash2,
  Refresh: RefreshCw,
  User
};

// --- Interfaces ---
interface ReferralWithUsers {
  id: number;
  sponsor_id: number;
  referred_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  level: number;
  sponsor: { username: string; telegram_id: number; };
  referred: {
    username: string;
    telegram_id: number;
    total_earned: number;
    total_deposit: number;
    rank: string;
    is_premium: boolean;
    is_active: boolean;
  };
  sbt_amount: number;
  total_sbt_earned: number;
}

// --- Constants ---
const ACTIVE_REFERRAL_REWARD = 50;

// --- Helper ---
const isRecentlyJoined = (dateString: string): boolean => {
  const joinDate = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) <= 7;
};

const ReferralSystem = () => {
  const { user } = useAuth();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [userReferrals, setUserReferrals] = useState<ReferralWithUsers[]>([]);
  const [userReferralCount, setUserReferralCount] = useState<number>(0);
  const [, setUserActiveReferrals] = useState<number>(0);
  const [activeReferralReward, setActiveReferralReward] = useState<number>(0);
  
  // Duplicates
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // UI State
  const [copied, setCopied] = useState(false);

  // --- Logic: Calculations ---
//   const potentialUsdtReward = getPotentialUsdtFromActiveReferrals(userActiveReferrals);
  const referralLink = user?.id ? `https://t.me/rhizacore_bot?startapp=${user.telegram_id}` : "Loading...";

  const calculateActiveReferralReward = (referrals: ReferralWithUsers[]): number => {
    return referrals.reduce((total, referral) => {
      if (referral.status === 'active') {
        return total + (referral.referred?.is_premium ? 100 : ACTIVE_REFERRAL_REWARD);
      }
      return total;
    }, 0);
  };

  const updateReferralStats = (referrals: ReferralWithUsers[]) => {
    const activeCount = referrals.filter(r => r.status === 'active').length;
    setUserReferralCount(referrals.length);
    setUserActiveReferrals(activeCount);
    setActiveReferralReward(calculateActiveReferralReward(referrals));
  };

  // --- Logic: Data Fetching ---

  // Load User Referrals (My Network)
  const loadUserReferrals = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          sponsor:users!sponsor_id(username, telegram_id),
          referred:users!referred_id(username, telegram_id, total_earned, total_deposit, rank, is_premium, is_active),
          sbt_amount,
          total_sbt_earned
        `)
        .eq('sponsor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []) as unknown as ReferralWithUsers[];
      setUserReferrals(typedData);
      updateReferralStats(typedData);
    } catch (err) {
      console.error('Error loading referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Duplicate Handling
  const checkForDuplicates = async () => {
    if (!user?.id) return;
    setIsCheckingDuplicates(true);
    try {
        const { data } = await supabase.from('referrals').select('id, sponsor_id, referred_id').eq('sponsor_id', user.id);
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
    //   setIsClearingDuplicates(true);
      
      try {
        const { data: allReferrals } = await supabase
            .from('referrals')
            .select('id, sponsor_id, referred_id, created_at')
            .eq('sponsor_id', user!.id)
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
            loadUserReferrals(); 
        }
      } catch (error) {
          console.error("Error clearing duplicates:", error);
      } finally {
        //   setIsClearingDuplicates(false);
      }
  };

  // --- Effects ---
  useEffect(() => { loadUserReferrals(); }, [user?.id]);
  
  useEffect(() => {
      console.log('🔌 Setting up real-time subscription...');
      const sub = supabase.channel('public_referrals').on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'referrals'
      }, (payload) => {
          console.log('📡 Real-time referral update:', payload);
          loadUserReferrals();
      }).subscribe((status) => {
          console.log('📡 Subscription status:', status);
      });
      
      return () => { 
          console.log('🔌 Cleaning up subscription...');
          supabase.removeChannel(sub); 
      };
  }, [user?.id]);

  // --- Render ---

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar bg-black text-white relative responsive-padding">
      
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold tracking-wider mb-2 text-white">Network Expansion</h1>
      <p className="text-gray-400 text-xs sm:text-sm mb-6 leading-relaxed">
        Grow the RhizaCore network. Earn <span className="text-green-400 font-bold">10%</span> of all RZC mined by your direct invites.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 relative z-10">Network Size</span>
            <span className="text-xl font-bold text-white font-mono relative z-10">{userReferralCount}</span>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 relative z-10">Rewards (RZC)</span>
            <span className="text-xl font-bold text-green-400 font-mono relative z-10">{activeReferralReward.toLocaleString()}</span>
        </div>
      </div>

     {/* Compact Invite Card */}
     <div className="w-full bg-gradient-to-br from-zinc-900 to-[#050a05] border border-green-500/20 rounded-2xl p-4 relative shadow-lg mb-4 group">
         {/* Subtle Ambient Glow */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col gap-3">
             {/* Compact Header */}
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="bg-green-500/10 p-1.5 rounded-lg text-green-400">
                        <Icons.Users size={16} />
                    </div>
                    <div>
                        <span className="text-green-400/60 text-[9px] font-mono uppercase tracking-widest block leading-none mb-0.5">Network</span>
                        <h3 className="text-white text-sm font-bold leading-none">Invite Friends</h3>
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
                        className={`text-gray-500 hover:text-white p-1.5 rounded-lg transition-colors ${isCheckingDuplicates ? "animate-spin text-green-400" : ""}`}
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
                        const shareText = "🚀 Join me on RhizaCore! Start mining RZC tokens with your phone and earn passive income. The future of decentralized mining is here! 💎⛏️";
                        const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
                        if ((window as any).Telegram?.WebApp) {
                            (window as any).Telegram.WebApp.openTelegramLink(fullUrl);
                        } else {
                            window.open(fullUrl, '_blank');
                        }
                    }}
                    disabled={!user?.id}
                    className="flex-1 bg-green-500 text-black py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-400 transition-colors shadow-lg shadow-green-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     <Icons.Share size={14} />
                     Invite Friends
                 </button>
             </div>
         </div>
      </div>

      {/* Network Content */}
      <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm">
                  Direct Invites ({userReferrals.length})
              </h3>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono">Last 7 Days: {userReferrals.filter(r => isRecentlyJoined(r.created_at)).length}</span>
              </div>
          </div>

          <div className="space-y-3 pb-6">
              {isLoading ? (
                  <div className="flex justify-center py-8"><Icons.Loader className="animate-spin text-green-400" /></div>
              ) : (
                  /* My Network List */
                  userReferrals.length > 0 ? (
                      userReferrals.map((ref) => (
                          <div key={ref.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold bg-zinc-800 border-white/10 text-gray-400`}>
                                      {ref.referred?.username?.[0]?.toUpperCase() || <Icons.User size={16}/>}
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-1.5">
                                          <span className="text-white text-xs font-bold">{ref.referred?.username || "Unknown"}</span>
                                          {ref.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_currentColor]"></div>}
                                          {isRecentlyJoined(ref.created_at) && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 rounded">NEW</span>}
                                      </div>
                                      <span className="text-[9px] text-gray-500 font-mono">
                                          {ref.referred?.is_premium ? 'Premium Node' : 'Standard Node'}
                                      </span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-green-400 text-xs font-mono font-bold">
                                      {ref.status === 'active' ? `+${ref.referred?.is_premium ? 2000 : 50}` : '0'}
                                  </div>
                                  <div className="text-[9px] text-gray-600 uppercase tracking-tighter">
                                      {ref.status === 'active' ? 'Claimable' : 'Pending'}
                                  </div>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-8 text-gray-500 text-xs">No referrals yet. Invite friends to start earning!</div>
                  )
              )}
          </div>

          <div className="mt-2 p-4 rounded-xl bg-green-400/5 border border-dashed border-green-400/20 text-center">
              <p className="text-[10px] text-gray-500 italic">"Invite friends to grow your mining network and earn 10% of their RZC rewards."</p>
          </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .responsive-text { font-size: 0.875rem; }
          .responsive-padding { padding: 1rem; }
          .responsive-gap { gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
};

export default ReferralSystem;