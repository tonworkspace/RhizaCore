import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from '@/hooks/useAuth';
import { Loader2, Copy, Share2, RefreshCw, Shield, Gift, Check } from 'lucide-react';
import {
  REWARD_TIERS,
  RewardTier,
  getRewardTierForActiveReferrals,
} from '@/utils/referralRewards';

interface ReferralContestProps {
  showSnackbar?: (config: { message: string; description?: string }) => void;
  onClose?: () => void;
}

const CONTEST_START_DATE = new Date('2025-11-20'); // Update with actual contest start date
const CONTEST_END_DATE = new Date('2025-12-31'); // Update with actual contest end date

const ReferralContest = ({ showSnackbar }: ReferralContestProps) => {
  const { user } = useAuth();
  const [contestReferrals, setContestReferrals] = useState<number>(0);
  const [referralLink, setReferralLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>(
    REWARD_TIERS.map((tier) => ({ ...tier, claimed: false }))
  );
  const [claimingReward, setClaimingReward] = useState<number | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [balanceUpdated, setBalanceUpdated] = useState<boolean>(false);
  const [hasJoinedContest, setHasJoinedContest] = useState<boolean>(false);
  const [contestJoinDate, setContestJoinDate] = useState<string | null>(null);
  const [totalReferrals, setTotalReferrals] = useState<number>(0);
  const [qualifiedTier, setQualifiedTier] = useState<RewardTier | null>(null);
  const [projectedReward, setProjectedReward] = useState<number>(0);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSharingLink, setIsSharingLink] = useState(false);
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkContestParticipation();
      loadContestData();
      generateReferralLink();
    }
  }, [user?.id, user?.telegram_id]);

  useEffect(() => {
    setCanUseNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const generateReferralLink = () => {
    if (user?.telegram_id) {
      // Use the same referral link format as ReferralSystem
      setReferralLink(`https://t.me/rhizacore_bot?startapp=${user.telegram_id}`);
    } else if (user?.id) {
      // Fallback if telegram_id is not available
      setReferralLink(`https://t.me/rhizacore_bot?startapp=${user.id}`);
    }
  };

  const checkContestParticipation = async () => {
    if (!user?.id) return;

    try {
      // Check if user has joined the contest (stored in activities or localStorage)
      const contestKey = `referral_contest_joined_${user.id}`;
      const joinedInStorage = localStorage.getItem(contestKey) === 'true';
      
      // Also check database for contest participation record
      const { data: contestActivity } = await supabase
        .from('activities')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'contest_joined')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (joinedInStorage || contestActivity) {
        setHasJoinedContest(true);
        setContestJoinDate(contestActivity?.created_at || new Date().toISOString());
      }
    } catch (error) {
      console.error('Error checking contest participation:', error);
    }
  };

  const handleJoinContest = async () => {
    if (!user?.id || hasJoinedContest) return;

    try {
      // Record contest participation in database
      const { error: activityError } = await supabase.from('activities').insert({
        user_id: user.id,
        type: 'contest_joined',
        amount: 0,
        status: 'completed',
        metadata: {
          contest_start: CONTEST_START_DATE.toISOString(),
          contest_end: CONTEST_END_DATE.toISOString()
        },
        created_at: new Date().toISOString()
      });

      if (activityError) throw activityError;

      // Store in localStorage
      const contestKey = `referral_contest_joined_${user.id}`;
      localStorage.setItem(contestKey, 'true');

      setHasJoinedContest(true);
      setContestJoinDate(new Date().toISOString());

      showSnackbar?.({
        message: '🎉 Contest Joined!',
        description: 'You\'ve successfully joined the referral contest! All your referrals during the contest period will count.'
      });

      // Reload data to show updated counts
      await loadContestData();
    } catch (error) {
      console.error('Error joining contest:', error);
      showSnackbar?.({
        message: '❌ Error',
        description: 'Failed to join contest. Please try again.'
      });
    }
  };

  const loadContestData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get ALL active referrals first (this is what counts for rewards)
      const { data: allActiveRefs, error: activeError } = await supabase
        .from('referrals')
        .select('id, created_at, status')
        .eq('sponsor_id', user.id)
        .eq('status', 'active');
      
      if (activeError) throw activeError;
      
      // Total active referrals (this is what we use for qualification)
      const totalActive = allActiveRefs?.length || 0;
      setTotalReferrals(totalActive);
      const tier = getRewardTierForActiveReferrals(totalActive) || null;
      setQualifiedTier(tier);
      setProjectedReward(tier?.reward ?? 0);
      
      // Also calculate contest referrals (referrals created during contest period)
      const now = new Date();
      const validContestRefs = allActiveRefs?.filter(ref => {
        const refDate = new Date(ref.created_at);
        return refDate >= CONTEST_START_DATE && refDate <= CONTEST_END_DATE && refDate <= now;
      }) || [];
      
      setContestReferrals(validContestRefs.length);
      
      // For reward qualification, use TOTAL active referrals (not just contest period)
      // This ensures users with referrals outside contest period can still qualify
      // But we still track contest referrals separately for display

      // Load claimed rewards
      await loadClaimedRewards();

      // Load USDT balance
      await loadUSDTBalance();
    } catch (error) {
      console.error('Error loading contest data:', error);
      showSnackbar?.({
        message: '❌ Error',
        description: 'Failed to load contest data. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClaimedRewards = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('type', 'contest_reward')
        .eq('status', 'completed');

      if (error) throw error;

      const claimedTierIds = new Set(
        data?.map(activity => activity.metadata?.tier_id).filter(Boolean) || []
      );

      setRewardTiers((prev) =>
        prev.map((tier) => ({
          ...tier,
          claimed: claimedTierIds.has(tier.id),
        }))
      );
    } catch (error) {
      console.error('Error loading claimed rewards:', error);
    }
  };

  const loadUSDTBalance = async () => {
    if (!user?.id) return;

    try {
      // Calculate USDT balance from activities
      const { data, error } = await supabase
        .from('activities')
        .select('amount, type')
        .eq('user_id', user.id)
        .in('type', ['contest_reward', 'usdt_withdrawal'])
        .eq('status', 'completed');

      if (error) throw error;

      let balance = 0;
      data?.forEach(activity => {
        if (activity.type === 'contest_reward') {
          balance += activity.amount || 0;
        } else if (activity.type === 'usdt_withdrawal') {
          balance -= Math.abs(activity.amount || 0);
        }
      });

      setUsdtBalance(Math.max(0, balance));
    } catch (error) {
      console.error('Error loading USDT balance:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadContestData();
      showSnackbar?.({
        message: '✅ Refreshed',
        description: 'Contest data has been updated.'
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const copyTextToClipboard = async (text: string) => {
    if (!text) throw new Error('No referral link available');

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return;
    }

    throw new Error('Clipboard API not available');
  };

  const handleCopyLink = async () => {
    if (!referralLink) {
      showSnackbar?.({
        message: '❌ Error',
        description: 'Referral link is not ready yet. Please try again in a moment.'
      });
      return;
    }

    setIsCopyingLink(true);
    try {
      await copyTextToClipboard(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      showSnackbar?.({
        message: '✅ Copied!',
        description: 'Referral link copied to clipboard'
      });
    } catch (error) {
      console.error('Error copying link:', error);
      showSnackbar?.({
        message: '❌ Error',
        description: 'Failed to copy link'
      });
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleShareLink = async () => {
    if (!referralLink) {
      showSnackbar?.({
        message: '❌ Error',
        description: 'Referral link is not ready yet. Please try again in a moment.'
      });
      return;
    }

    setIsSharingLink(true);
    try {
      if (canUseNativeShare) {
        await navigator.share({
          title: 'Join RhizaCore',
          text: 'Join RhizaCore with my referral link!',
          url: referralLink
        });
        showSnackbar?.({
          message: '📤 Shared',
          description: 'Referral link shared successfully'
        });
      } else {
        await copyTextToClipboard(referralLink);
        showSnackbar?.({
          message: '✅ Copied!',
          description: 'Referral link copied to clipboard'
        });
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      showSnackbar?.({
        message: '❌ Error',
        description: 'Failed to share link'
      });
    } finally {
      setIsSharingLink(false);
    }
  };

  const handleClaimReward = async (tier: RewardTier) => {
    if (!user?.id || claimingReward === tier.id) return;

    // Check if user qualifies for this tier using TOTAL active referrals
    // This ensures all active referrals count, not just those in contest period
    if (totalReferrals < tier.minUsers || totalReferrals > tier.maxUsers) {
      showSnackbar?.({
        message: '❌ Not Qualified',
        description: `You need ${tier.minUsers}-${tier.maxUsers} active referrals to claim this reward. You currently have ${totalReferrals} active referrals.`
      });
      return;
    }

    if (tier.claimed) {
      showSnackbar?.({
        message: 'ℹ️ Already Claimed',
        description: 'This reward has already been claimed.'
      });
      return;
    }

    try {
      setClaimingReward(tier.id);

      // Create activity record for the reward
      const { error: activityError } = await supabase.from('activities').insert({
        user_id: user.id,
        type: 'contest_reward',
        amount: tier.reward,
        status: 'completed',
        metadata: {
          tier_id: tier.id,
          min_users: tier.minUsers,
          max_users: tier.maxUsers,
          active_referrals: totalReferrals, // Use total active referrals
          contest_referrals: contestReferrals // Also include contest referrals for tracking
        },
        created_at: new Date().toISOString()
      });

      if (activityError) throw activityError;

      // Update local state
      setRewardTiers(prev =>
        prev.map(t =>
          t.id === tier.id ? { ...t, claimed: true } : t
        )
      );

      // Reload USDT balance to ensure accuracy
      await loadUSDTBalance();
      
      // Show visual feedback that balance was updated
      setBalanceUpdated(true);
      setTimeout(() => setBalanceUpdated(false), 2000);

      showSnackbar?.({
        message: '🎉 Reward Claimed!',
        description: `You've successfully claimed $${tier.reward} USDT! Your balance has been updated.`
      });
    } catch (error) {
      console.error('Error claiming reward:', error);
      showSnackbar?.({
        message: '❌ Error',
        description: 'Failed to claim reward. Please try again.'
      });
    } finally {
      setClaimingReward(null);
    }
  };

//   const getTimeLeft = () => {
//     const now = new Date();
//     const end = CONTEST_END_DATE;
//     const diff = end.getTime() - now.getTime();

//     if (diff <= 0) return 'Contest Ended';

//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

//     return `${days}d ${hours}h`;
//   };

//   const getQualifiedTier = () => {
//     return rewardTiers.find(
//       tier => contestReferrals >= tier.minUsers && contestReferrals <= tier.maxUsers
//     );
//   };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono">
      {/* USDT Rewards Section */}
      <div className="relative overflow-hidden rounded-2xl
                      bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
                      border border-green-500/30
                      shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                      backdrop-blur-xl
                      p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">USDT Rewards</h2>
              <p className="text-sm text-gray-400">Total earnings balance</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Active</span>
          </div>
        </div>

        <div className="mb-4">
          <div className={`text-4xl font-bold mb-1 transition-all duration-500 ${
            balanceUpdated 
              ? 'text-green-300 scale-110' 
              : 'text-green-400'
          }`}>
            ${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-green-300/70 font-medium">USDT</div>
          <div className="mt-1 text-xs text-green-200/80">
            Auto-estimated reward from active referrals:{' '}
            <span className="font-semibold text-green-300">
              ${projectedReward.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
          {usdtBalance > 0 && (
            <div className="mt-2 text-xs text-green-400/80 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              Ready to withdraw
            </div>
          )}
          {usdtBalance === 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Claim rewards to earn USDT
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          <span>Available for withdrawal</span>
        </div>

        <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
          <span>Withdraw USDT</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Your Progress Section */}
      <div className="relative overflow-hidden rounded-2xl
                      bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
                      border border-orange-500/30
                      shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                      backdrop-blur-xl
                      p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Your Progress</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh Data</span>
          </button>
        </div>

        {/* Join Contest Banner (if not joined) */}
        {!hasJoinedContest && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">Join the Contest Now!</h3>
                <p className="text-xs text-gray-300 mb-3">
                  Join the referral contest to start earning USDT rewards. All referrals created during the contest period will automatically count towards your contest total.
                </p>
                <button
                  onClick={handleJoinContest}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg transition-all duration-300 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Join Contest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Joined Status (if joined) */}
        {hasJoinedContest && contestJoinDate && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">
                Contest Joined • {new Date(contestJoinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="text-xs text-gray-400 mb-1">Active Referrals</div>
            <div className="text-2xl font-bold text-green-400">{totalReferrals}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              Used for rewards
            </div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="text-xs text-gray-400 mb-1">Contest Referrals</div>
            <div className="text-2xl font-bold text-purple-400">{contestReferrals}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              During contest period
            </div>
          </div>
        </div>
        
        {/* Qualification Status */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-blue-400 mb-1">Your Qualification Status</h4>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                You have <strong className="text-green-400">{totalReferrals} active referrals</strong>.
                {(() => {
                  if (qualifiedTier) {
                    return ` You qualify for Tier ${qualifiedTier.id}: $${qualifiedTier.reward} USDT reward!`;
                  } else if (totalReferrals > 0) {
                    const nextTier = rewardTiers.find((tier) => totalReferrals < tier.minUsers);
                    if (nextTier) {
                      const needed = nextTier.minUsers - totalReferrals;
                      return ` You need ${needed} more active referral${needed > 1 ? 's' : ''} to qualify for the next tier (${nextTier.minUsers}-${nextTier.maxUsers} users = $${nextTier.reward} USDT).`;
                    } else {
                      return ` You've exceeded all reward tiers! Maximum reward: $${rewardTiers[rewardTiers.length - 1].reward} USDT.`;
                    }
                  } else {
                    return ` Start referring users to qualify for rewards!`;
                  }
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-blue-400 mb-1">How Referral Rewards Work</h4>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                <strong>Active Referrals:</strong> All your active referrals count towards reward qualification, regardless of when they joined. This is the number used to determine which reward tier you qualify for.
                <br /><br />
                <strong>Contest Referrals:</strong> This shows referrals created during the contest period ({CONTEST_START_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {CONTEST_END_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}). This is for tracking purposes only.
                <br /><br />
                <strong>Important:</strong> Reward qualification is based on your total active referral count. If you have 10 active referrals, you qualify for the appropriate reward tier!
              </p>
            </div>
          </div>
        </div>

        <button className="w-full mb-6 bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
          <Shield className="w-5 h-5" />
          <span>Read the Rules</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Referral Link Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Your Referral Link:</h3>
          <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="text-sm text-white truncate font-mono">{referralLink || 'Loading...'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              disabled={isCopyingLink || !referralLink}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/90 hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title={referralLink ? 'Copy referral link' : 'Referral link not ready'}
            >
              {copySuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copySuccess ? 'Copied' : isCopyingLink ? 'Copying...' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShareLink}
              disabled={isSharingLink || !referralLink}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/90 hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title={canUseNativeShare ? 'Share referral link' : 'Copy referral link'}
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharingLink ? 'Sharing...' : canUseNativeShare ? 'Share Link' : 'Copy Link'}</span>
            </button>
          </div>
          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
            <p className="text-xs text-green-300/70">
              All active referrals count towards reward qualification. Share your link to grow your team and unlock higher reward tiers!
            </p>
          </div>
        </div>
      </div>

      {/* Claim Referral Rewards Section */}
      <div className="relative overflow-hidden rounded-2xl
                      bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
                      border border-purple-500/30
                      shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                      backdrop-blur-xl
                      p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Gift className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Claim Referral Rewards</h2>
        </div>

        <div className="space-y-4">
          {rewardTiers.map((tier, index) => {
            // Use totalReferrals (all active referrals) for qualification, not just contest referrals
            const isQualified = totalReferrals >= tier.minUsers && totalReferrals <= tier.maxUsers;
            const isClaimable = isQualified && !tier.claimed;

            return (
              <div
                key={tier.id}
                className={`relative overflow-hidden rounded-xl p-5 border-2 transition-all duration-300
                  ${isQualified && !tier.claimed
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg'
                    : tier.claimed
                    ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600/50 opacity-60'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${isQualified && !tier.claimed ? 'bg-green-500 text-white' : tier.claimed ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Gift className={`w-6 h-6 ${isQualified && !tier.claimed ? 'text-green-400' : 'text-gray-500'}`} />
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {tier.minUsers} - {tier.maxUsers} Active Referrals
                          </h3>
                          <p className="text-sm text-gray-400">
                            Refer between {tier.minUsers} - {tier.maxUsers} active users
                          </p>
                          {!isQualified && totalReferrals > 0 && (
                            <p className="text-xs text-orange-400 mt-1">
                              You have {totalReferrals} active referral{totalReferrals !== 1 ? 's' : ''}. 
                              {totalReferrals < tier.minUsers 
                                ? ` Need ${tier.minUsers - totalReferrals} more to qualify.`
                                : ` You have ${totalReferrals - tier.maxUsers} more than the maximum for this tier.`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isQualified && !tier.claimed ? 'text-green-400' : 'text-gray-500'}`}>
                      ${tier.reward}
                    </div>
                    <div className="text-xs text-gray-400">Reward</div>
                  </div>
                </div>

                <button
                  onClick={() => handleClaimReward(tier)}
                  disabled={!isClaimable || claimingReward === tier.id}
                  className={`w-full mt-4 py-3 px-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2
                    ${isClaimable
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg hover:shadow-xl'
                      : tier.claimed
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {claimingReward === tier.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : tier.claimed ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Claimed</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>Verify & Claim</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReferralContest;

