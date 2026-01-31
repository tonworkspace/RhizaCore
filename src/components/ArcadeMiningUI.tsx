import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { useGameData } from '@/contexts/GameDataContext';
import {
  supabase,
  ensureUserHasSponsorCode,
  startMiningSession,
  startMiningSessionUnrestricted,
  getActiveMiningSession,
  manualCompleteMiningSession,
  getUserRZCBalance,
  claimRZCRewards,
  claimAllSeasonRZC,
  createAirdropClaimRequest,
  getMiningHistory,
  getFreeMiningStatus,
  initializeFreeMiningPeriod,
  canUserStartMining,
  recordMiningActivity,
  updateFreeMiningSessionCount,
  // getUserActivities,
  MiningSession,
  generatePassiveIncome,
  // getPassiveIncomeBoostCost,
  purchaseUpgrade,
  getUserAirdropBalance,
  claimTotalEarnedToAirdrop,
  createAirdropWithdrawal,
  getUserAirdropWithdrawals,
  AirdropBalance,
  AirdropWithdrawal
} from '../lib/supabaseClient';
import { Icons } from './Icon';

interface SponsorInfo {
  username: string;
  code: string;
}

interface ReferralStats {
  active: number;
  total: number;
}

interface ArcadeMiningUIProps {
  balanceTon: number;
  tonPrice: number;
  currentEarningsTon: number;
  isClaiming: boolean;
  claimCooldown: number;
  cooldownText: string;
  onClaim: () => void;
  // onOpenDeposit: () => void;
  onOpenWithdraw?: () => void;
  potentialEarningsTon: number;
  airdropBalanceNova: number;
  totalWithdrawnTon: number;
  activities?: Array<{ id: string; type: string; amount: number; status: string; created_at: string; }>;
  withdrawals?: Array<{ id: number; amount: number; status: string; created_at: string; }>;
  isLoadingActivities?: boolean;
  userId?: number;
  userUsername?: string;
  referralCode?: string;
  estimatedDailyTapps?: number;
  showSnackbar?: (data: { message: string; description?: string }) => void;
  onMiningDataUpdate?: (data: {
    isMining: boolean;
    currentSession: any | null;
    sessionCountdown: string;
    accumulatedRZC: number;
    claimableRZC: number;
    claimedRZC: number;
    totalEarnedRZC: number;
    sessionDurationHours: number | null;
    canStartMining: boolean;
    miningRateMultiplier: number;
    userUpgrades: {
      miningRigMk2: boolean;
      extendedSession: boolean;
      passiveIncomeBoostLevel: number;
    };
  }) => void;
}

export type ArcadeMiningUIHandle = {
  refreshBalance: () => Promise<void> | void;
};

// const computeSessionProgressPercent = (session: MiningSession | null, reference: Date = new Date()): number => {
//   if (!session) return 0;
//   const startTime = new Date(session.start_time).getTime();
//   const endTime = new Date(session.end_time).getTime();
//   const totalDuration = Math.max(endTime - startTime, 1);
//   const elapsed = Math.min(Math.max(reference.getTime() - startTime, 0), totalDuration);
//   return (elapsed / totalDuration) * 100;
// };

// const formatClockLabel = (date: Date | null): string => {
//   if (!date || Number.isNaN(date.getTime())) {
//     return '--:--';
//   }
//   return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// };

type TopTab = 'Mining' | 'Boost' | 'Rank' | 'Activity' | 'Airdrop';

const ArcadeMiningUI = forwardRef<ArcadeMiningUIHandle, ArcadeMiningUIProps>(function ArcadeMiningUI(props, ref) {
  const { t } = useI18n();
  const { updateClaimedRZC, updateMiningBalance, setIsMining: setContextIsMining } = useGameData();
  const {
    isClaiming,
    activities,
    isLoadingActivities,
    userId,
    userUsername,
    referralCode,
    showSnackbar,
    onMiningDataUpdate,
  } = props;

  const [activeTab, setActiveTab] = useState<'mining' | 'activity' | 'upgrades' | 'leaderboard' | 'balances' | 'airdrop'>('mining');
  const [sponsorCode, setSponsorCode] = useState<string | null>(null);
  const [, setSponsorInfo] = useState<SponsorInfo | null>(null);
  const [, setReferralStats] = useState<ReferralStats>({ active: 0, total: 0 });

  // Backend-integrated mining system
  const [isMining, setIsMining] = useState(false);
  const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
  const [sessionCountdown, setSessionCountdown] = useState('--:--:--');
  const [sessionDurationHours, setSessionDurationHours] = useState<number | null>(null);
  // const [sessionProgress, setSessionProgress] = useState(0);
  // const [lastLiveUpdate, setLastLiveUpdate] = useState('');
  const [accumulatedRZC, setAccumulatedRZC] = useState(0);
  const [claimableRZC, setClaimableRZC] = useState(0);
  const [totalEarnedRZC, setTotalEarnedRZC] = useState(0);
  const [claimedRZC, setClaimedRZC] = useState(0);
  const [, setMiningHistory] = useState<MiningSession[]>([]);
  
  const [lastClaimDuringMining, setLastClaimDuringMining] = useState<Date | null>(null);
  
  const [userUpgrades, setUserUpgrades] = useState<{
    miningRigMk2: boolean;
    extendedSession: boolean;
    passiveIncomeBoostLevel: number;
  }>({
    miningRigMk2: false,
    extendedSession: false,
    passiveIncomeBoostLevel: 0
  });
  const [miningRateMultiplier, setMiningRateMultiplier] = useState(1.0);
  
  // const [freeMiningStatus, setFreeMiningStatus] = useState({
  //   isActive: false,
  //   daysRemaining: 0,
  //   sessionsUsed: 0,
  //   maxSessions: 0,
  //   sessionsRemaining: 0,
  //   canMine: false,
  //   endDate: '' as string | undefined,
  //   gracePeriodEnd: '' as string | undefined,
  //   isInGracePeriod: false,
  //   reason: ''
  // });
  const [canStartMining, setCanStartMining] = useState(false);
  
  const [, setTeamMembers] = useState<any[]>([]);
  
  const [, setTopReferrers] = useState<any[]>([]);
  const [, setTopClaimers] = useState<any[]>([]);
  const [topBalances, setTopBalances] = useState<any[]>([]);
  const [isLoadingLeaderboards, setIsLoadingLeaderboards] = useState(false);
  const [, setIsLoadingBalances] = useState(false);
  const [, setUserRank] = useState<number | null>(null);
  const [showAllPlayers,] = useState(false);
  
  const [isLoadingMiningData, setIsLoadingMiningData] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
  const [claimCooldownRemaining, setClaimCooldownRemaining] = useState(0);
  
  const [showSeasonEndModal, setShowSeasonEndModal] = useState(false);
  const [airdropWalletAddress, setAirdropWalletAddress] = useState('');
  const [nodeAlias, setNodeAlias] = useState('');
  const [isProcessingSeasonClaim, setIsProcessingSeasonClaim] = useState(false);
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Airdrop Balance System
  const [airdropBalance, setAirdropBalance] = useState<AirdropBalance | null>(null);
  const [airdropWithdrawals, setAirdropWithdrawals] = useState<AirdropWithdrawal[]>([]);
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('ethereum');
  const [isProcessingAirdropClaim, setIsProcessingAirdropClaim] = useState(false);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  const RZC_PER_DAY = 50;
  const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);
  
  const [miningStreak, setMiningStreak] = useState(0);
  const [lastMilestone, setLastMilestone] = useState(0);
  const [showEarningAnimation, setShowEarningAnimation] = useState(false);
  const [recentEarnings, setRecentEarnings] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [, setMiningStats] = useState({
    totalSessions: 0,
    totalEarned: 0,
    bestStreak: 0,
    averageSessionTime: 0
  });
  const [soundEnabled,] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const thresholdClaimingRef = useRef(false);

  const [displayBalance, setDisplayBalance] = useState(0);
  // const [balanceLastUpdated, setBalanceLastUpdated] = useState<Date | null>(null);

  const actualBalance = claimableRZC + (isMining ? accumulatedRZC : 0) + claimedRZC;

  // Smooth balance animation
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setDisplayBalance(prev => {
        const diff = actualBalance - prev;
        if (Math.abs(diff) < 0.00001) return actualBalance;
        return prev + diff * 0.05; // Smooth lerp
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [actualBalance]);

  // useEffect(() => {
  //   if (!isMining || !currentSession) {
  //     setSessionProgress(0);
  //   }
  //   if (!isMining) {
  //     setLastLiveUpdate('');
  //   }
  // }, [isMining, currentSession]);

  // Load mining statistics on component mount
  useEffect(() => {
    if (!userId) return;
    
    const loadMiningStats = async () => {
      try {
        const storedStats = localStorage.getItem(`mining_stats_${userId}`);
        if (storedStats) {
          setMiningStats(JSON.parse(storedStats));
        }
        
        const { data: recentActivities } = await supabase
          .from('activities')
          .select('created_at')
          .eq('user_id', userId)
          .eq('type', 'mining_start')
          .order('created_at', { ascending: false })
          .limit(30);
        
        if (recentActivities) {
          let streak = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (const activity of recentActivities) {
            const activityDate = new Date(activity.created_at);
            activityDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
              streak++;
            } else {
              break;
            }
          }
          
          setMiningStreak(streak);
        }
      } catch (error) {
        console.error('Error loading mining stats:', error);
      }
    };
    
    loadMiningStats();
  }, [userId]);

  useEffect(() => {
    if (!isMining) return;
    // setLastLiveUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [accumulatedRZC, isMining]);

  // Update context when mining status changes
  useEffect(() => {
    setContextIsMining(isMining);
  }, [isMining, setContextIsMining]);

  // const canClaim = (claimableRZC > 0 || accumulatedRZC > 0) && !isLoadingBalance && !isClaiming && claimCooldownRemaining === 0;

  useEffect(() => {
    if (!lastClaimTime || !userId) {
      setClaimCooldownRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const timeSinceLastClaim = Math.floor((now.getTime() - lastClaimTime.getTime()) / 1000);
      const cooldownSeconds = 30 * 60; // 30 minutes
      const remaining = Math.max(0, cooldownSeconds - timeSinceLastClaim);
      
      setClaimCooldownRemaining(remaining);
      
      if (remaining === 0) {
        setLastClaimTime(null);
        localStorage.removeItem(`last_claim_time_${userId}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastClaimTime, userId]);

  useEffect(() => {
    if (!userId) return;
    
    const storedClaimTime = localStorage.getItem(`last_claim_time_${userId}`);
    if (storedClaimTime) {
      const lastClaim = new Date(storedClaimTime);
      const now = new Date();
      const timeSinceLastClaim = Math.floor((now.getTime() - lastClaim.getTime()) / 1000);
      const cooldownSeconds = 30 * 60; // 30 minutes
      
      if (timeSinceLastClaim < cooldownSeconds) {
        setLastClaimTime(lastClaim);
        setClaimCooldownRemaining(cooldownSeconds - timeSinceLastClaim);
      } else {
        localStorage.removeItem(`last_claim_time_${userId}`);
      }
    }
  }, [userId]);

  const loadUserUpgrades = async () => {
    if (!userId) return;
    
    try {
      const { data: activities } = await supabase
        .from('activities')
        .select('type, metadata')
        .eq('user_id', userId)
        .in('type', ['mining_rig_mk2', 'extended_session', 'passive_income_boost']);
      
      const passiveBoostActivities = activities?.filter(a => a.type === 'passive_income_boost') || [];
      let passiveIncomeBoostLevel = 0;
      if (passiveBoostActivities.length > 0) {
        const levels = passiveBoostActivities
          .map(a => a.metadata?.level || 0)
          .filter(level => typeof level === 'number' && level > 0);
        passiveIncomeBoostLevel = levels.length > 0 ? Math.max(...levels) : 0;
      }
      
      const upgrades = {
        miningRigMk2: activities?.some(a => a.type === 'mining_rig_mk2') || false,
        extendedSession: activities?.some(a => a.type === 'extended_session') || false,
        passiveIncomeBoostLevel: passiveIncomeBoostLevel
      };
      
      setUserUpgrades(upgrades);
      
      if (upgrades.miningRigMk2) {
        setMiningRateMultiplier(1.25);
      }
    } catch (error) {
      console.error('Error loading user upgrades:', error);
    }
  };

  const loadAirdropBalance = async () => {
    if (!userId) return;
    
    try {
      const [balanceResult, withdrawalsResult] = await Promise.all([
        getUserAirdropBalance(userId),
        getUserAirdropWithdrawals(userId)
      ]);

      if (balanceResult.success && balanceResult.balance) {
        setAirdropBalance(balanceResult.balance);
      }

      if (withdrawalsResult.success && withdrawalsResult.withdrawals) {
        setAirdropWithdrawals(withdrawalsResult.withdrawals);
      }
    } catch (error) {
      console.error('Error loading airdrop balance:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const loadAllData = async () => {
      try {
        setIsLoadingMiningData(true);
        setIsLoadingBalance(true);
        
        await initializeFreeMiningPeriod(userId);
        const code = await ensureUserHasSponsorCode(userId, userUsername);
        setSponsorCode(code);

        await loadUserUpgrades();
        await loadAirdropBalance();

        const [
          rzcBalance,
          ,  // freeMining - unused
          miningCheck,
          activeSession,
          history,
          sponsorQueryResult,
          referralStatsResult,
          teamMembersResult
        ] = await Promise.all([
          getUserRZCBalance(userId),
          getFreeMiningStatus(userId),
          canUserStartMining(userId),
          getActiveMiningSession(userId),
          getMiningHistory(userId, 5),
          supabase
            .from('referrals')
            .select('sponsor_id, sponsor:users!sponsor_id(username, sponsor_code)')
            .eq('referred_id', userId)
            .single(),
          supabase
            .from('referrals')
            .select('status')
            .eq('sponsor_id', userId),
          supabase
            .from('referrals')
            .select(`*, referred:users!referred_id(id, username, created_at, is_active, total_earned, total_deposit)`)
            .eq('sponsor_id', userId)
            .order('created_at', { ascending: false })
        ]);
        
        if (referralStatsResult.data) {
          const active = referralStatsResult.data.filter(r => r.status === 'active').length;
          setReferralStats({ active, total: referralStatsResult.data.length });
        }
        if (teamMembersResult.data) {
          setTeamMembers(teamMembersResult.data || []);
        }
        
        setClaimableRZC(rzcBalance.claimableRZC);
        setTotalEarnedRZC(rzcBalance.totalEarned);
        setClaimedRZC(rzcBalance.claimedRZC);
        
        // Update the game data context
        updateClaimedRZC(rzcBalance.claimedRZC);
        updateMiningBalance(rzcBalance.claimableRZC + (isMining ? accumulatedRZC : 0));
        
        if (rzcBalance.lastClaimTime) {
          const lastClaim = new Date(rzcBalance.lastClaimTime);
          const now = new Date();
          const timeSinceLastClaim = Math.floor((now.getTime() - lastClaim.getTime()) / 1000);
          const cooldownSeconds = 30 * 60; // 30 minutes
          
          if (timeSinceLastClaim < cooldownSeconds) {
            setLastClaimTime(lastClaim);
            setClaimCooldownRemaining(cooldownSeconds - timeSinceLastClaim);
          }
        }
        // setFreeMiningStatus({
        //   ...freeMining,
        //   endDate: freeMining.endDate || '',
        //   gracePeriodEnd: freeMining.gracePeriodEnd || ''
        // });
        setCanStartMining(miningCheck.canMine);
        setMiningHistory(history);
        
        setIsLoadingBalance(false);

        if (sponsorQueryResult.data?.sponsor) {
          const sponsorData = Array.isArray(sponsorQueryResult.data.sponsor) ? sponsorQueryResult.data.sponsor[0] : sponsorQueryResult.data.sponsor;
          if (sponsorData && sponsorData.username) {
            setSponsorInfo({
              username: sponsorData.username,
              code: sponsorData.sponsor_code || 'N/A'
            });
          }
        } else {
          setSponsorInfo(null);
        }

        if (activeSession) {
          const now = new Date();
          const endTime = new Date(activeSession.end_time);
          if (now >= endTime) {
            await rolloverSession();
          } else {
            setCurrentSession(activeSession);
            setIsMining(true);
            const durationMs = new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime();
            setSessionDurationHours(Math.max(0, durationMs / (1000 * 60 * 60)));

            const remainingSeconds = Math.max(0, (endTime.getTime() - now.getTime()) / 1000);
            const hours = Math.floor(remainingSeconds / 3600);
            const minutes = Math.floor((remainingSeconds % 3600) / 60);
            const seconds = Math.floor(remainingSeconds % 60);
            setSessionCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            // setSessionProgress(computeSessionProgressPercent(activeSession, now));

            const sessionStartTime = new Date(activeSession.start_time);
            const lastClaimTime = rzcBalance.lastClaimTime ? new Date(rzcBalance.lastClaimTime) : new Date(0);

            const accumulationStartTime = lastClaimTime > sessionStartTime ? lastClaimTime : sessionStartTime;

            if (lastClaimTime > sessionStartTime) {
              setLastClaimDuringMining(lastClaimTime);
            } else {
              setLastClaimDuringMining(null);
            }

            const elapsedSeconds = Math.max(0, (now.getTime() - accumulationStartTime.getTime()) / 1000);
            const RZC_PER_SECOND = (50 * miningRateMultiplier) / (24 * 60 * 60);
            const initialAccumulated = elapsedSeconds * RZC_PER_SECOND;
            setAccumulatedRZC(initialAccumulated);

            setDisplayBalance(rzcBalance.claimableRZC + initialAccumulated + rzcBalance.claimedRZC);
          }
        }
      } catch (error) {
        console.error('Error loading mining data:', error);
      } finally {
        setIsLoadingMiningData(false);
        setIsLoadingBalance(false);
      }
    };

    loadAllData();
  }, [userId, userUsername]);

  useEffect(() => {
    if (!userId) return;

    const loadLeaderboards = async () => {
      setIsLoadingLeaderboards(true);
      try {
        const { data: sponsorStatsData, error: sponsorStatsError } = await supabase
          .from('referrals')
          .select(`
            sponsor_id,
            referrer_id,
            sponsor:users!sponsor_id(
              username,
              total_earned,
              total_deposit,
              rank
            ),
            status
          `);

        if (sponsorStatsError) {
          console.error('Error loading sponsor stats:', sponsorStatsError);
        }

        if (!sponsorStatsData || sponsorStatsData.length === 0) {
          setTopReferrers([]);
          const claimersResult = await supabase
            .from('users')
            .select('id, username, total_earned')
            .gt('total_earned', 0)
            .order('total_earned', { ascending: false })
            .limit(5);

          if (!claimersResult.error && claimersResult.data) {
            setTopClaimers(claimersResult.data);
          }
          setIsLoadingLeaderboards(false);
          return;
        }

        const counts = sponsorStatsData.reduce((acc: { [key: string]: any }, curr: any) => {
          const id = curr.sponsor_id;
          if (!id) return acc;

          const sponsorData = curr.sponsor;
          if (!acc[id]) {
            acc[id] = {
              sponsor_id: id,
              username: sponsorData?.username || 'Unknown',
              referral_count: 0,
              active_referrals: 0,
              total_earned: sponsorData?.total_earned || 0,
              total_deposit: sponsorData?.total_deposit || 0,
              rank: sponsorData?.rank || 'NOVICE'
            };
          }

          acc[id].referral_count++;
          const status = (curr.status || '').toLowerCase();
          if (status === 'active') {
            acc[id].active_referrals++;
          }

          return acc;
        }, {});

        const sponsorStats = Object.values(counts);
        const topReferrersList = sponsorStats
          .sort((a: any, b: any) => b.active_referrals - a.active_referrals)
          .slice(0, 5);

        setTopReferrers(topReferrersList);

        const claimersResult = await supabase
          .from('users')
          .select('id, username, total_earned')
          .gt('total_earned', 0)
          .order('total_earned', { ascending: false })
          .limit(5);

        if (claimersResult.error) {
          console.error('Error loading top claimers:', claimersResult.error);
          setTopClaimers([]);
        } else {
          setTopClaimers(claimersResult.data || []);
        }
      } catch (error) {
        console.error('Error loading leaderboards:', error);
      } finally {
        setIsLoadingLeaderboards(false);
      }
    };

    loadLeaderboards();

    const leaderboardInterval = setInterval(() => {
      loadLeaderboards();
    }, 180000);

    return () => clearInterval(leaderboardInterval);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadTopBalances = async () => {
      setIsLoadingBalances(true);
      try {
        const { data: topUsersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, available_balance')
          .gt('available_balance', 0)
          .order('available_balance', { ascending: false })
          .limit(100);

        if (usersError) {
          console.error('Error loading top balances:', usersError);
          setTopBalances([]);
          return;
        }

        const balancesWithDetails = (topUsersData || []).map((user) => ({
          id: user.id,
          username: user.username || `User ${user.id}`,
          claimedRZC: user.available_balance,
          totalEarned: 0,
          claimableRZC: 0,
          currentBalance: user.available_balance
        }));

        const sortedBalances = balancesWithDetails
          .slice(0, showAllPlayers ? 100 : 50);

        setTopBalances(sortedBalances);

        const userIndex = sortedBalances.findIndex(b => b.id === userId);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        } else {
          const { data: currentUser } = await supabase
            .from('users')
            .select('available_balance')
            .eq('id', userId)
            .single();

          const userBalance = currentUser?.available_balance || 0;
          const higherCount = sortedBalances.filter(b => b.claimedRZC > userBalance).length;
          setUserRank(higherCount + 1);
        }
      } catch (error) {
        console.error('Error loading top balances:', error);
        setTopBalances([]);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    loadTopBalances();

    const balancesInterval = setInterval(() => {
      loadTopBalances();
    }, 180000);

    return () => clearInterval(balancesInterval);
  }, [userId, showAllPlayers]);

  useEffect(() => {
    if (!userId) return;

    const checkTelegramPopup = () => {
      const storageKey = `telegram_popup_shown_${userId}`;
      const lastShown = localStorage.getItem(storageKey);
      
      if (!lastShown) {
        setShowTelegramPopup(true);
      } else {
        const lastShownDate = new Date(lastShown);
        const now = new Date();
        const hoursSinceLastShown = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastShown >= 24) {
          setShowTelegramPopup(true);
        }
      }
    };

    const timer = setTimeout(() => {
      checkTelegramPopup();
    }, 3000);

    return () => clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    if (!userId || userUpgrades.passiveIncomeBoostLevel === 0) return;

    const lastPassiveIncomeKey = `last_passive_income_${userId}`;
    const lastPassiveIncome = localStorage.getItem(lastPassiveIncomeKey);
    const now = Date.now();
    
    if (lastPassiveIncome) {
      const timeSinceLastGeneration = (now - parseInt(lastPassiveIncome)) / 1000;
      if (timeSinceLastGeneration < 60) {
        const remainingSeconds = 60 - timeSinceLastGeneration;
        const timer = setTimeout(async () => {
          const result = await generatePassiveIncome(userId);
          if (result.success) {
            localStorage.setItem(lastPassiveIncomeKey, Date.now().toString());
            const updatedBalance = await getUserRZCBalance(userId);
            setClaimableRZC(updatedBalance.claimableRZC);
            setTotalEarnedRZC(updatedBalance.totalEarned);
          }
        }, remainingSeconds * 1000);
        
        const interval = setInterval(async () => {
          const result = await generatePassiveIncome(userId);
          if (result.success) {
            localStorage.setItem(lastPassiveIncomeKey, Date.now().toString());
            const updatedBalance = await getUserRZCBalance(userId);
            setClaimableRZC(updatedBalance.claimableRZC);
            setTotalEarnedRZC(updatedBalance.totalEarned);
          }
        }, 60000);

        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      }
    }

    const generateIncome = async () => {
      const result = await generatePassiveIncome(userId);
      if (result.success) {
        localStorage.setItem(lastPassiveIncomeKey, Date.now().toString());
        const updatedBalance = await getUserRZCBalance(userId);
        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
      }
    };

    generateIncome();

    const interval = setInterval(async () => {
      const result = await generatePassiveIncome(userId);
      if (result.success) {
        localStorage.setItem(lastPassiveIncomeKey, Date.now().toString());
        const updatedBalance = await getUserRZCBalance(userId);
        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [userId, userUpgrades.passiveIncomeBoostLevel]);

  useEffect(() => {
    let miningInterval: NodeJS.Timeout;

    if (isMining && currentSession && userId) {
      miningInterval = setInterval(async () => {
        const now = new Date();
        const startTime = new Date(currentSession.start_time);
        const endTime = new Date(currentSession.end_time);
        const remainingSeconds = (endTime.getTime() - now.getTime()) / 1000;

        if (remainingSeconds <= 0) {
          // setSessionProgress(100);
          await rolloverSession();
          clearInterval(miningInterval);
        } else {
          const hours = Math.floor(remainingSeconds / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = Math.floor(remainingSeconds % 60);
          setSessionCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

          // const totalDurationSeconds = Math.max((endTime.getTime() - startTime.getTime()) / 1000, 1);
          // const elapsedSeconds = Math.min(Math.max((now.getTime() - startTime.getTime()) / 1000, 0), totalDurationSeconds);
          // setSessionProgress((elapsedSeconds / totalDurationSeconds) * 100);

          const baseTime = lastClaimDuringMining || startTime;
          const timeSinceBase = (now.getTime() - baseTime.getTime()) / 1000;
          const earnedRZC = timeSinceBase * RZC_PER_SECOND;
          const previousAccumulated = accumulatedRZC;
          setAccumulatedRZC(earnedRZC);

          if (earnedRZC - previousAccumulated > 0.001) {
            setRecentEarnings(earnedRZC - previousAccumulated);
            setShowEarningAnimation(true);
            setTimeout(() => setShowEarningAnimation(false), 1000);
          }

          const currentMilestone = Math.floor(earnedRZC);
          if (currentMilestone > lastMilestone) {
            setLastMilestone(currentMilestone);
            checkAchievements(currentMilestone, miningStreak);
            playSound('milestone');
            if (currentMilestone % 10 === 0) {
              triggerCelebration();
            }

            showSnackbar?.({
              message: `🎉 Milestone Reached!`,
              description: `You've earned ${currentMilestone} RZC in this session!`
            });
          }
        }
      }, 1000);
    }

    return () => {
      if (miningInterval) {
        clearInterval(miningInterval);
      }
    };
  }, [isMining, currentSession, RZC_PER_SECOND, userId, showSnackbar, lastClaimDuringMining]);

  useEffect(() => {
    if (!currentSession || sessionDurationHours == null) return;
    if (userUpgrades.extendedSession) {
      if (sessionDurationHours < 43) {
        showSnackbar?.({
          message: t('extended_session_check'),
          description: `${t('expected_48h_current')}${sessionDurationHours.toFixed(1)}${t('hours_abbrev')}`
        });
      }
    }
  }, [currentSession, sessionDurationHours, userUpgrades.extendedSession]);

  // Update parent component with mining data changes
  useEffect(() => {
    if (onMiningDataUpdate) {
      onMiningDataUpdate({
        isMining,
        currentSession,
        sessionCountdown,
        accumulatedRZC,
        claimableRZC,
        claimedRZC,
        totalEarnedRZC,
        sessionDurationHours,
        canStartMining,
        miningRateMultiplier,
        userUpgrades
      });
    }
  }, [
    isMining,
    currentSession,
    sessionCountdown,
    accumulatedRZC,
    claimableRZC,
    claimedRZC,
    totalEarnedRZC,
    sessionDurationHours,
    canStartMining,
    miningRateMultiplier,
    userUpgrades,
    onMiningDataUpdate
  ]);

  const maybeAutoStartMining = async () => {
    if (!userId || isMining) return;
    try {
      const res = await startMiningSessionUnrestricted(userId);
      if (res.success) {
        const active = await getActiveMiningSession(userId);
        if (active) {
          setCurrentSession(active);
          setIsMining(true);
          // setSessionProgress(computeSessionProgressPercent(active));
        }
      }
    } catch (err) {
      // no-op
    }
  };

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      if (!isMining) {
        maybeAutoStartMining();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [userId, isMining]);

  useEffect(() => {
    if (!userId) return;

    const validateMiningState = async () => {
      try {
        const updatedBalance = await getUserRZCBalance(userId);

        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
        setClaimedRZC(updatedBalance.claimedRZC);
        // setFreeMiningStatus({
        //   ...updatedFreeMining,
        //   endDate: updatedFreeMining.endDate || '',
        //   gracePeriodEnd: updatedFreeMining.gracePeriodEnd || ''
        // });

        const active = await getActiveMiningSession(userId);
        const now = new Date();
        if (active) {
          const endTime = new Date(active.end_time);
          if (now >= endTime) {
            await rolloverSession();
          } else {
            setCurrentSession(active);
            setIsMining(true);
          }
        } else if (!isMining) {
          await maybeAutoStartMining();
        }
      } catch (err) {
        // no-op
      }
    };

    validateMiningState();
    const interval = setInterval(validateMiningState, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, isMining]);

  useEffect(() => {
    if (!userId) return;
    const key = `last_seen_${userId}`;
    const miningStateKey = `mining_state_${userId}`;
    
    const saveMiningState = () => {
      const now = new Date().toISOString();
      localStorage.setItem(key, now);
      
      if (isMining && currentSession) {
        const miningState = {
          sessionId: currentSession.id,
          sessionStartTime: currentSession.start_time,
          sessionEndTime: currentSession.end_time,
          lastClaimTime: lastClaimDuringMining ? lastClaimDuringMining.toISOString() : null,
          accumulatedRZC: accumulatedRZC,
          savedAt: now
        };
        localStorage.setItem(miningStateKey, JSON.stringify(miningState));
      } else {
        localStorage.removeItem(miningStateKey);
      }
    };
    
    saveMiningState();
    const interval = setInterval(saveMiningState, 60000);
    
    const handleBeforeUnload = () => {
      saveMiningState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, isMining, currentSession, lastClaimDuringMining, accumulatedRZC]);

  const startMining = async () => {
    if (!userId || isMining || !canStartMining) return;

    try {
      const result = await startMiningSession(userId);
      if (result.success) {
        setIsMining(true);
        setAccumulatedRZC(0);
        setLastClaimDuringMining(null);
        
        await recordMiningActivity(userId, 'mining_start', 0);
        playSound('mining_start');
        await updateFreeMiningSessionCount(userId);
        
        const [activeSession, updatedFreeMining] = await Promise.all([
          getActiveMiningSession(userId),
          getFreeMiningStatus(userId)
        ]);
        
        if (activeSession) {
          setCurrentSession(activeSession);
          // setSessionProgress(0);
          const durationMs = new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime();
          setSessionDurationHours(Math.max(0, durationMs / (1000 * 60 * 60)));
        }

        // setFreeMiningStatus({
        //   ...updatedFreeMining,
        //   endDate: updatedFreeMining.endDate || '',
        //   gracePeriodEnd: updatedFreeMining.gracePeriodEnd || ''
        // });

        const sessionMessage = updatedFreeMining.isInGracePeriod 
          ? `Grace period mining started. ${updatedFreeMining.sessionsUsed}/${updatedFreeMining.maxSessions} sessions used.`
          : `Free mining started! ${updatedFreeMining.sessionsUsed}/${updatedFreeMining.maxSessions} sessions used.`;

        showSnackbar?.({
          message: 'Mining Started!',
          description: sessionMessage
        });
      } else {
        showSnackbar?.({
          message: 'Mining Failed',
          description: result.error || 'Failed to start mining session.'
        });
      }
    } catch (error) {
      console.error('Error starting mining:', error);
      showSnackbar?.({
        message: 'Mining Failed',
        description: 'An error occurred while starting mining.'
      });
    }
  };

  const rolloverSession = async () => {
    if (!userId || !isMining || !currentSession) return;

    try {
      const result = await manualCompleteMiningSession(currentSession.id);
      if (result.success) {
        await recordMiningActivity(userId, 'mining_complete', result.rzcEarned || 0);
        
        setIsMining(false);
        setCurrentSession(null);
        setAccumulatedRZC(0);
        setLastClaimDuringMining(null);
        // setSessionProgress(0);
        // setLastLiveUpdate('');

        const updatedBalance = await getUserRZCBalance(userId);
        
        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
        setClaimedRZC(updatedBalance.claimedRZC);
        // setFreeMiningStatus({ 
        //   ...updatedFreeMining, 
        //   endDate: updatedFreeMining.endDate || '',
        //   gracePeriodEnd: updatedFreeMining.gracePeriodEnd || ''
        // });
        
        setTimeout(async () => {
          const startRes = await startMiningSessionUnrestricted(userId);
          if (startRes.success) {
            const active = await getActiveMiningSession(userId);
            if (active) {
              setCurrentSession(active);
              setIsMining(true);
            }
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error rolling over mining session:', error);
    }
  };

  const claimRewards = async (bulkClaim: boolean = false) => {
    if (!userId) {
      showSnackbar?.({
        message: 'Error',
        description: 'User not found.'
      });
      return;
    }

    // Import security service
    const ClaimSecurityService = (await import('../services/ClaimSecurityService')).default;
    const securityService = ClaimSecurityService.getInstance();

    // Check user's security status
    const securityStatus = securityService.getUserSecurityStatus(userId);
    if (securityStatus.isBlocked) {
      showSnackbar?.({
        message: 'Account Temporarily Blocked',
        description: `${securityStatus.blockReason}. Try again in ${Math.ceil(securityStatus.blockTimeRemaining! / 1000)} seconds.`
      });
      return;
    }

    if (securityStatus.isLocked) {
      showSnackbar?.({
        message: 'Claim In Progress',
        description: 'Another claim operation is already in progress. Please wait.'
      });
      return;
    }

    const availableBalance = claimableRZC + (isMining ? accumulatedRZC : 0);

    if (availableBalance <= 0) {
      showSnackbar?.({
        message: 'No Balance to Claim',
        description: 'Start mining to earn RZC first.'
      });
      return;
    }

    if (!bulkClaim && claimCooldownRemaining > 0) {
      showSnackbar?.({
        message: 'Cooldown Active',
        description: `Please wait ${formatCooldownTime(claimCooldownRemaining)} before claiming again.`
      });
      return;
    }

    if (isClaiming) return;

    // Prevent threshold claiming during manual claims
    if (thresholdClaimingRef.current) {
      showSnackbar?.({
        message: 'Claim In Progress',
        description: 'Automatic threshold claiming is in progress. Please wait.'
      });
      return;
    }

    try {
      setIsLoadingBalance(true);

      let amountToClaim = 0;
      let claimSource = '';

      if (bulkClaim) {
        amountToClaim = availableBalance;
        claimSource = 'all_sources';
      } else if (isMining && accumulatedRZC > 0) {
        amountToClaim = accumulatedRZC;
        claimSource = 'mining_session';
      } else if (claimableRZC > 0) {
        amountToClaim = claimableRZC;
        claimSource = 'completed_sessions';
      }

      if (amountToClaim <= 0) {
        showSnackbar?.({
          message: 'No Balance to Claim',
          description: 'Start mining to earn RZC that you can claim instantly!'
        });
        setIsLoadingBalance(false);
        return;
      }

      // Handle accumulated RZC during mining
      if ((bulkClaim || claimSource === 'mining_session') && isMining && accumulatedRZC > 0) {
        try {
          const miningAmount = bulkClaim ? accumulatedRZC : amountToClaim;
          const { error: activityError } = await supabase.from('activities').insert({
            user_id: userId,
            type: 'mining_complete',
            amount: miningAmount,
            status: 'completed',
            security_validated: true,
            created_at: new Date().toISOString()
          });

          if (activityError) throw activityError;
          setClaimableRZC(prev => prev + miningAmount);
        } catch (error) {
          console.error('Error adding accumulated RZC to balance:', error);
          showSnackbar?.({
            message: 'Warning',
            description: 'Could not add accumulated RZC to claimable balance, but claiming will proceed.'
          });
        }
      }

      // Use secure claiming function
      const result = await claimRZCRewards(userId, amountToClaim);

      if (result.success) {
        if (!bulkClaim) {
          const now = new Date();
          setLastClaimTime(now);
          setClaimCooldownRemaining(30 * 60); // 30 minutes
          localStorage.setItem(`last_claim_time_${userId}`, now.toISOString());
        }

        if ((bulkClaim || claimSource === 'mining_session') && isMining) {
          setLastClaimDuringMining(new Date());
          setAccumulatedRZC(0);
        }

        setClaimableRZC(prev => Math.max(0, prev - amountToClaim));
        setClaimedRZC(prev => prev + amountToClaim);

        playSound('claim');
        triggerCelebration();

        const sourceMessage = bulkClaim ? 'all available sources' :
                            claimSource === 'mining_session' ? 'current mining session' :
                            'completed sessions';

        showSnackbar?.({
          message: 'RZC Claimed Successfully!',
          description: `Claimed ${amountToClaim.toFixed(6)} RZC from ${sourceMessage}${bulkClaim ? '' : '! Next claim available in 30 minutes.'}`
        });

        setTimeout(async () => {
          try {
            const updatedBalance = await getUserRZCBalance(userId);
            setClaimableRZC(updatedBalance.claimableRZC);
            setTotalEarnedRZC(updatedBalance.totalEarned);
            setClaimedRZC(updatedBalance.claimedRZC);
          } catch (error) {
            console.error('Error refreshing balance after claim:', error);
          }
        }, 1000);
      } else {
        // Handle specific security errors
        if (result.error?.includes('blocked') || result.error?.includes('rate limit')) {
          showSnackbar?.({
            message: 'Security Alert',
            description: result.error
          });
        } else if (result.error?.includes('already processed')) {
          showSnackbar?.({
            message: 'Claim Already Processed',
            description: 'This claim has already been processed. Please refresh your balance.'
          });
          
          // Refresh balance to show current state
          setTimeout(async () => {
            try {
              const updatedBalance = await getUserRZCBalance(userId);
              setClaimableRZC(updatedBalance.claimableRZC);
              setTotalEarnedRZC(updatedBalance.totalEarned);
              setClaimedRZC(updatedBalance.claimedRZC);
            } catch (error) {
              console.error('Error refreshing balance after duplicate claim:', error);
            }
          }, 500);
        } else {
          showSnackbar?.({
            message: 'Claim Failed',
            description: result.error || 'Failed to claim RZC rewards.'
          });
        }
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      showSnackbar?.({
        message: 'Claim Failed',
        description: 'An error occurred while claiming your RZC.'
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };
  
  const formatCooldownTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    try {
      const codeToCopy = `https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`;
      if (!codeToCopy) throw new Error('No Link to copy');
      await navigator.clipboard.writeText(codeToCopy);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
      showSnackbar?.({ message: t('copy_success') });
    } catch (error) {
      showSnackbar?.({ message: t('copy_failed') });
    }
  };

  const handleSeasonEndClaim = async () => {
    if (!userId) return;
    
    setIsProcessingSeasonClaim(true);
    try {
      // First claim all available RZC
      const claimResult = await claimAllSeasonRZC(userId);
      
      if (!claimResult.success) {
        showSnackbar?.({
          message: 'Season Claim Failed',
          description: claimResult.error || 'Failed to claim season RZC'
        });
        return;
      }

      // If wallet address provided, create airdrop claim request
      if (airdropWalletAddress.trim()) {
        const airdropResult = await createAirdropClaimRequest(
          userId, 
          airdropWalletAddress.trim(), 
          nodeAlias.trim() || undefined
        );

        if (airdropResult.success) {
          showSnackbar?.({
            message: 'Season End Claim Successful!',
            description: `Claimed ${claimResult.totalClaimed?.toFixed(6)} RZC and created airdrop request. Check your activities for updates.`
          });
          setShowSeasonEndModal(false);
          setAirdropWalletAddress('');
          setNodeAlias('');
        } else {
          showSnackbar?.({
            message: 'Partial Success',
            description: `Claimed ${claimResult.totalClaimed?.toFixed(6)} RZC but failed to create airdrop request: ${airdropResult.error}`
          });
        }
      } else {
        showSnackbar?.({
          message: 'Season RZC Claimed!',
          description: `Successfully claimed ${claimResult.totalClaimed?.toFixed(6)} RZC to your account balance.`
        });
        setShowSeasonEndModal(false);
      }

      // Refresh balance
      await fetchBalance();
    } catch (error) {
      console.error('Season end claim error:', error);
      showSnackbar?.({
        message: 'Season Claim Failed',
        description: 'An unexpected error occurred during season end claim.'
      });
    } finally {
      setIsProcessingSeasonClaim(false);
    }
  };

  const handleClaimToAirdrop = async () => {
    if (!userId) return;
    
    // Import security service
    const ClaimSecurityService = (await import('../services/ClaimSecurityService')).default;
    const securityService = ClaimSecurityService.getInstance();

    // Check user's security status
    const securityStatus = securityService.getUserSecurityStatus(userId);
    if (securityStatus.isBlocked) {
      showSnackbar?.({
        message: 'Account Temporarily Blocked',
        description: `${securityStatus.blockReason}. Try again in ${Math.ceil(securityStatus.blockTimeRemaining! / 1000)} seconds.`
      });
      return;
    }

    if (securityStatus.isLocked) {
      showSnackbar?.({
        message: 'Claim In Progress',
        description: 'Another claim operation is already in progress. Please wait.'
      });
      return;
    }
    
    setIsProcessingAirdropClaim(true);
    try {
      const result = await claimTotalEarnedToAirdrop(userId);
      
      if (result.success) {
        showSnackbar?.({
          message: 'Claimed to Airdrop Balance!',
          description: `Successfully claimed ${result.claimedAmount?.toFixed(6)} RZC to your airdrop balance.`
        });
        
        // Refresh all balances to reflect the reset
        const updatedBalance = await getUserRZCBalance(userId);
        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
        setClaimedRZC(updatedBalance.claimedRZC);
        
        // Reset accumulated RZC if currently mining (since it's been moved to airdrop)
        if (isMining) {
          setAccumulatedRZC(0);
          setLastClaimDuringMining(new Date()); // Mark as claimed during mining
        }
        
        // Refresh airdrop balance
        await loadAirdropBalance();
        setShowAirdropModal(false);
      } else {
        // Handle specific security errors
        if (result.error?.includes('blocked') || result.error?.includes('rate limit')) {
          showSnackbar?.({
            message: 'Security Alert',
            description: result.error
          });
        } else if (result.error?.includes('already processed')) {
          showSnackbar?.({
            message: 'Claim Already Processed',
            description: 'This airdrop claim has already been processed. Please refresh your balance.'
          });
          
          // Refresh balances to show current state
          setTimeout(async () => {
            try {
              const updatedBalance = await getUserRZCBalance(userId);
              setClaimableRZC(updatedBalance.claimableRZC);
              setTotalEarnedRZC(updatedBalance.totalEarned);
              setClaimedRZC(updatedBalance.claimedRZC);
              await loadAirdropBalance();
            } catch (error) {
              console.error('Error refreshing balance after duplicate airdrop claim:', error);
            }
          }, 500);
        } else {
          showSnackbar?.({
            message: 'Claim Failed',
            description: result.error || 'Failed to claim to airdrop balance'
          });
        }
      }
    } catch (error) {
      console.error('Airdrop claim error:', error);
      showSnackbar?.({
        message: 'Claim Failed',
        description: 'An unexpected error occurred while claiming to airdrop balance.'
      });
    } finally {
      setIsProcessingAirdropClaim(false);
    }
  };

  const handleWithdrawFromAirdrop = async () => {
    if (!userId || !withdrawAmount || !withdrawAddress) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showSnackbar?.({
        message: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount.'
      });
      return;
    }

    if (!airdropBalance || airdropBalance.available_balance < amount) {
      showSnackbar?.({
        message: 'Insufficient Balance',
        description: 'Not enough balance in your airdrop account.'
      });
      return;
    }
    
    setIsProcessingWithdraw(true);
    try {
      const result = await createAirdropWithdrawal(userId, amount, withdrawAddress, withdrawNetwork);
      
      if (result.success) {
        showSnackbar?.({
          message: 'Withdrawal Request Created!',
          description: `Your withdrawal of ${amount.toFixed(6)} RZC has been submitted for processing.`
        });
        
        // Refresh airdrop balance and withdrawals
        await loadAirdropBalance();
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawAddress('');
      } else {
        showSnackbar?.({
          message: 'Withdrawal Failed',
          description: result.error || 'Failed to create withdrawal request'
        });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      showSnackbar?.({
        message: 'Withdrawal Failed',
        description: 'An unexpected error occurred while creating withdrawal request.'
      });
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const checkAchievements = (rzcEarned: number, streak: number) => {
    const newAchievements: string[] = [];
    
    if (rzcEarned >= 10 && !achievements.includes('first_10')) {
      newAchievements.push('first_10');
    }
    if (rzcEarned >= 50 && !achievements.includes('first_50')) {
      newAchievements.push('first_50');
    }
    if (rzcEarned >= 100 && !achievements.includes('first_100')) {
      newAchievements.push('first_100');
    }
    if (rzcEarned >= 500 && !achievements.includes('first_500')) {
      newAchievements.push('first_500');
    }
    
    if (streak >= 3 && !achievements.includes('streak_3')) {
      newAchievements.push('streak_3');
    }
    if (streak >= 7 && !achievements.includes('streak_7')) {
      newAchievements.push('streak_7');
    }
    if (streak >= 30 && !achievements.includes('streak_30')) {
      newAchievements.push('streak_30');
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      const latestAchievement = newAchievements[newAchievements.length - 1];
      setShowAchievement(latestAchievement);
      setTimeout(() => setShowAchievement(null), 5000);
    }
  };

  const getAchievementInfo = (achievement: string) => {
    const achievementMap: { [key: string]: { title: string; description: string; icon: string } } = {
      'first_10': { title: 'First 10 RZC', description: 'Earned your first 10 RZC!', icon: '🎯' },
      'first_50': { title: 'Half Century', description: 'Earned 50 RZC in a session!', icon: '🏆' },
      'first_100': { title: 'Century Club', description: 'Earned 100 RZC in a session!', icon: '💎' },
      'first_500': { title: 'Mining Master', description: 'Earned 500 RZC in a session!', icon: '👑' },
      'streak_3': { title: 'Getting Started', description: '3-day mining streak!', icon: '🔥' },
      'streak_7': { title: 'Week Warrior', description: '7-day mining streak!', icon: '⚡' },
      'streak_30': { title: 'Mining Legend', description: '30-day mining streak!', icon: '🌟' }
    };
    return achievementMap[achievement] || { title: 'Achievement', description: 'Well done!', icon: '🎉' };
  };

  const playSound = (soundType: 'mining_start' | 'mining_complete' | 'achievement' | 'claim' | 'milestone') => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio(`/sounds/${soundType}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {}
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const getActivityIcon = (type: string) => {
    if (type.includes('mining_start')) {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    if (type.includes('mining_complete')) {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (type.includes('mining_claim') || type.includes('claim')) {
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      );
    }
    if (type.includes('upgrade_purchase')) {
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    }
    if (type.includes('withdrawal')) {
      return (
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    }
    if (type.includes('nova_reward') || type.includes('reward')) {
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  };

  const fetchBalance = async (showLoading = false) => {
    if (!userId) return;
    try {
      if (showLoading) setIsLoadingBalance(true);
      const updatedBalance = await getUserRZCBalance(userId);
      setClaimableRZC(updatedBalance.claimableRZC);
      setTotalEarnedRZC(updatedBalance.totalEarned);
      setClaimedRZC(updatedBalance.claimedRZC);
      // setBalanceLastUpdated(new Date());

      if (showLoading) {
        showSnackbar?.({
          message: 'Balance Updated',
          description: `Total: ${(updatedBalance.claimableRZC + updatedBalance.claimedRZC).toFixed(4)} RZC`
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      if (showLoading) {
        showSnackbar?.({
          message: 'Balance Update Failed',
          description: 'Could not refresh balance from database'
        });
      }
    } finally {
      if (showLoading) setIsLoadingBalance(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshBalance: fetchBalance
  }));

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const intervalFn = async () => {
      try {
        const updatedBalance = await getUserRZCBalance(userId);
        if (isMounted && updatedBalance) {
          setClaimableRZC(updatedBalance.claimableRZC);
          setTotalEarnedRZC(updatedBalance.totalEarned);
          setClaimedRZC(updatedBalance.claimedRZC);
        }
      } catch {}
    };
    intervalFn();
    const interval = setInterval(intervalFn, 50000); 
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (!isMining) return;
    if (claimCooldownRemaining > 0) return;
    if (isClaiming || isLoadingBalance) return;

    const available = claimableRZC + accumulatedRZC;
    if (accumulatedRZC >= 10 && available > 0 && !thresholdClaimingRef.current) {
      thresholdClaimingRef.current = true;
      (async () => {
        try {
          // Import security service for threshold claiming
          const ClaimSecurityService = (await import('../services/ClaimSecurityService')).default;
          const securityService = ClaimSecurityService.getInstance();

          // Check user's security status before threshold claiming
          const securityStatus = securityService.getUserSecurityStatus(userId);
          if (securityStatus.isBlocked || securityStatus.isLocked) {
            console.log('Threshold claiming blocked due to security restrictions:', securityStatus);
            return;
          }

          // Record this as an automatic threshold claim attempt
          securityService.recordClaimAttempt(userId, accumulatedRZC, 'threshold_claim', false);

          await claimRewards();
          
          // Update the attempt record to successful
          securityService.recordClaimAttempt(userId, accumulatedRZC, 'threshold_claim', true);
        } catch (error) {
          console.error('Error in threshold claiming:', error);
        } finally {
          thresholdClaimingRef.current = false;
        }
      })();
    }
  }, [userId, isMining, accumulatedRZC, claimCooldownRemaining, isClaiming, isLoadingBalance, claimableRZC]);

  const mapTabToInternal = (tab: TopTab): 'mining' | 'upgrades' | 'leaderboard' | 'activity' | 'airdrop' => {
    switch (tab) {
      case 'Mining': return 'mining';
      case 'Boost': return 'upgrades';
      case 'Rank': return 'leaderboard';
      case 'Activity': return 'activity';
      case 'Airdrop': return 'airdrop';
      default: return 'mining';
    }
  };

  const handleTabChange = (tab: TopTab) => {
    setActiveTab(mapTabToInternal(tab));
  };

  const getActiveTopTab = (): TopTab => {
    switch (activeTab) {
      case 'mining': return 'Mining';
      case 'upgrades': return 'Boost';
      case 'leaderboard': return 'Rank';
      case 'activity': return 'Activity';
      case 'airdrop': return 'Airdrop';
      default: return 'Mining';
    }
  };

  const activeTopTab = getActiveTopTab();

  return (
    <div className="flex flex-col h-full w-full pb-24 overflow-y-auto custom-scrollbar">
      
      {/* Top Tabs */}
      <div className="mx-4 mt-2 bg-rzc-gray/30 rounded-2xl p-1 flex justify-between items-center border border-white/5 backdrop-blur-sm">
        {(['Mining', 'Boost', 'Rank', 'Activity', 'Airdrop'] as TopTab[]).map((tab) => {
           let Icon = Icons.Energy;
           if (tab === 'Boost') Icon = Icons.Boost;
           if (tab === 'Rank') Icon = Icons.Rank;
           if (tab === 'Activity') Icon = Icons.History;
           if (tab === 'Airdrop') Icon = Icons.Wallet;

           const isActive = activeTopTab === tab;
           return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-xl text-[10px] font-medium transition-all duration-300 ${
                isActive 
                  ? 'bg-rzc-dark text-rzc-green shadow-lg border border-rzc-green/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={12} />
              {tab}
            </button>
           );
        })}
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center mt-6 px-4">
        {/* Only show header content on Mining tab to keep others clean, or keep it consistent? 
            The user request seems to imply this layout is the main view. 
            I'll render the header on all tabs but the specific "CORE" might be specific to Mining tab.
            However, the user asked to change the UI design "to this", implying a full replacement.
            I will wrap the specific content in the Mining tab check where appropriate.
        */}

        {activeTab === 'mining' && (
          <>
            <h1 className="text-xl font-bold text-white tracking-wider mb-2">RhizaCore AI Nodes</h1>
            <p className="text-gray-400 text-xs text-center max-w-xs leading-relaxed mb-6">
              Track your RZC airdrop earnings and claim your rewards! Share your referral link to earn more.
            </p>

            {/* System Message Overlay - Placeholder or if we had a system message state */}
            {/* {systemMessage && (
                <div className="mb-4 w-full bg-rzc-green/10 border border-rzc-green/50 text-rzc-green px-4 py-2 rounded text-xs font-mono text-center animate-pulse">
                    {'>'} {systemMessage}
                </div>
            )} */}

            {/* Referral Link */}
            {(referralCode || sponsorCode) && (
              <div className="w-full flex gap-3 mb-8">
                <div className="flex-1 bg-rzc-dark border border-rzc-gray rounded-xl flex items-center px-4 py-3 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rzc-green"></div>
                  <Icons.Energy size={16} className="text-rzc-green mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-xs truncate font-mono">
                    {`https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`}
                  </span>
                </div>
                <button 
                  onClick={handleCopy}
                  className={`w-12 h-full rounded-xl flex items-center justify-center border transition-all ${
                      copyFeedback 
                      ? 'bg-rzc-green text-black border-rzc-green' 
                      : 'bg-rzc-green/10 text-rzc-green border-rzc-green/30 hover:bg-rzc-green/20'
                  }`}
                >
                  <Icons.Copy size={20} />
                </button>
              </div>
            )}

            {/* THE CORE (Centerpiece) */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Background Rings */}
                <div className="absolute w-full h-full rounded-full border border-rzc-green/10"></div>
                <div className={`absolute w-[90%] h-[90%] rounded-full border border-rzc-green/5 ${isMining ? 'animate-[spin_10s_linear_infinite]' : ''} border-dashed`}></div>
                
                {/* Glow Effect */}
                {isMining && (
                  <div className="absolute w-48 h-48 rounded-full bg-rzc-green/5 blur-3xl animate-pulse"></div>
                )}

                {/* Main Circle */}
                <div className={`relative w-56 h-56 rounded-full border-2 ${isMining ? 'border-rzc-green/40' : 'border-gray-600/40'} bg-gradient-to-b from-rzc-dark to-black flex flex-col items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.15)] z-10 backdrop-blur-sm transition-all duration-500`}>
                    
                    {/* Active Indicator Dot */}
                    {isMining && (
                      <div className="absolute top-8 right-10 w-3 h-3 bg-rzc-green rounded-full shadow-[0_0_10px_#4ade80] animate-pulse"></div>
                    )}

                    {/* Show Earning Animation inside Core */}
                    {showEarningAnimation && (
                      <div className="absolute top-1/4 text-green-400 text-sm font-bold animate-bounce drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]">
                        +{recentEarnings.toFixed(4)}
                      </div>
                    )}

                    <div className={`text-3xl font-bold font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] ${isMining ? 'text-rzc-green' : 'text-gray-400'}`}>
                      {displayBalance.toFixed(4)}
                    </div>
                    
                    <div className={`mt-2 text-[10px] uppercase tracking-widest font-bold ${isMining ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isLoadingBalance ? 'INITIALIZING...' : isMining ? 'MINING ACTIVE' : canStartMining ? 'READY TO MINE' : 'OFFLINE'}
                    </div>
                    {isMining && (
                      <div className="text-rzc-green/80 text-[10px] font-mono mt-0.5">
                        +{(RZC_PER_SECOND * 3600).toFixed(4)}/hr
                      </div>
                    )}
                </div>
            </div>

            {/* Balance Labels */}
            <div className="text-center mb-6">
                <h3 className="text-rzc-green font-medium tracking-wide">Rhizacore Balance</h3>
                <p className="text-gray-500 font-mono text-xs mt-1">Session: {sessionCountdown}</p>
            </div>

            {/* Stats Card - Simplified to show direct flow */}
            <div className="w-full bg-rzc-dark border border-rzc-gray rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-rzc-green text-sm font-medium">Current Mining:</span>
                    <span className="text-white font-mono font-bold">{(isMining ? accumulatedRZC : 0).toFixed(6)} RZC</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-blue-400 text-sm font-medium">Pending Claim:</span>
                    <span className="text-white font-mono font-bold">{claimableRZC.toFixed(6)} RZC</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-orange-400 text-sm font-medium">Total Earned:</span>
                    <span className="text-orange-300 font-mono font-bold">{totalEarnedRZC.toFixed(6)} RZC</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-700/50 pt-3">
                    <span className="text-emerald-400 text-sm font-medium">Airdrop Balance:</span>
                    <span className="text-emerald-300 font-mono font-bold">{(airdropBalance?.available_balance || 0).toFixed(6)} RZC</span>
                </div>
                
                {/* Total Claimable Indicator */}
                <div className="mt-4 pt-3 border-t border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-emerald-300 text-sm font-bold">Ready to Claim:</span>
                        <span className="text-emerald-200 font-mono font-bold text-lg">
                            {((isMining ? accumulatedRZC : 0) + claimableRZC + claimedRZC + totalEarnedRZC).toFixed(6)} RZC
                        </span>
                    </div>
                    <div className="text-center text-emerald-400/80 text-xs mt-1">
                        → Direct to Airdrop Balance
                    </div>
                </div>
            </div>

            {/* Action Button - Dynamic based on state */}
            {isMining ? (
              <button disabled className="w-full sm:w-2/3 bg-rzc-dark/50 border border-rzc-gray/50 text-gray-500 py-3 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-6 cursor-not-allowed">
                  <div className="w-2 h-2 rounded-full bg-rzc-green animate-pulse"></div>
                  MINING IN PROGRESS
              </button>
            ) : canStartMining ? (
              <button 
                onClick={startMining}
                disabled={isLoadingMiningData}
                className="w-full sm:w-2/3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border border-green-400/50 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] py-3 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-6 active:scale-[0.98] transition-all"
              >
                {isLoadingMiningData ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Icons.Energy size={16} />
                    START MINING
                  </>
                )}
              </button>
            ) : (
              <button disabled className="w-full sm:w-2/3 bg-gray-800 border border-gray-700 text-gray-500 py-3 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-6 cursor-not-allowed">
                  SYSTEM CHECKING...
              </button>
            )}

            {/* Direct Claim to Airdrop Button - Simplified Flow */}
            <button 
              onClick={async () => {
                if (!userId) {
                  showSnackbar?.({
                    message: 'Error',
                    description: 'User not found.'
                  });
                  return;
                }

                setIsProcessingAirdropClaim(true);
                
                try {
                  // Step 1: Complete any active mining session first
                  if (isMining && accumulatedRZC > 0) {
                    const { error: activityError } = await supabase.from('activities').insert({
                      user_id: userId,
                      type: 'mining_complete',
                      amount: accumulatedRZC,
                      status: 'completed',
                      created_at: new Date().toISOString()
                    });

                    if (activityError) throw activityError;
                  }

                  // Step 2: Claim any pending claimable RZC to validated balance first
                  const currentClaimable = claimableRZC + (isMining ? accumulatedRZC : 0);
                  if (currentClaimable > 0) {
                    const claimResult = await claimRZCRewards(userId, currentClaimable);
                    if (!claimResult.success) {
                      throw new Error(claimResult.error || 'Failed to claim mining rewards');
                    }
                  }

                  // Step 3: Now transfer total earned to airdrop balance
                  const airdropResult = await claimTotalEarnedToAirdrop(userId);
                  
                  if (!airdropResult.success) {
                    // Check if this is because everything is already claimed to airdrop
                    if (airdropResult.error?.includes('No new RZC to claim to airdrop balance')) {
                      // Check if user has any current mining/claimable balance
                      const currentAvailable = claimableRZC + (isMining ? accumulatedRZC : 0) + claimedRZC;
                      
                      if (currentAvailable > 0) {
                        // User has some balance but it's already been claimed to airdrop
                        showSnackbar?.({
                          message: 'Already Claimed to Airdrop ✅',
                          description: 'Your RZC has already been moved to airdrop balance. Check the Airdrop tab to withdraw!'
                        });
                        
                        // Still reset the mining balances for fresh start
                        setClaimableRZC(0);
                        setAccumulatedRZC(0);
                        setClaimedRZC(0);
                        setTotalEarnedRZC(0);
                        setLastClaimDuringMining(null);
                        
                        // Refresh balances
                        const [updatedBalance] = await Promise.all([
                          getUserRZCBalance(userId),
                          loadAirdropBalance()
                        ]);
                        
                        setClaimableRZC(updatedBalance.claimableRZC);
                        setTotalEarnedRZC(updatedBalance.totalEarned);
                        setClaimedRZC(updatedBalance.claimedRZC);
                        
                        updateClaimedRZC(updatedBalance.claimedRZC);
                        updateMiningBalance(updatedBalance.claimableRZC);
                        
                        return; // Exit successfully
                      } else {
                        throw new Error('No RZC to claim. Start mining to earn RZC first!');
                      }
                    } else {
                      throw new Error(airdropResult.error || 'Failed to transfer RZC to airdrop balance');
                    }
                  }

                  const transferredAmount = airdropResult.claimedAmount || 0;

                  // Step 4: Reset ALL mining balances for fresh start
                  setClaimableRZC(0);
                  setAccumulatedRZC(0);
                  setClaimedRZC(0);
                  setTotalEarnedRZC(0);
                  setLastClaimDuringMining(null);

                  // Step 5: Refresh balances from database to ensure accuracy
                  const [updatedBalance] = await Promise.all([
                    getUserRZCBalance(userId),
                    loadAirdropBalance()
                  ]);
                  
                  // Update local states with fresh data
                  setClaimableRZC(updatedBalance.claimableRZC);
                  setTotalEarnedRZC(updatedBalance.totalEarned);
                  setClaimedRZC(updatedBalance.claimedRZC);
                  
                  // Update context for parent components
                  updateClaimedRZC(updatedBalance.claimedRZC);
                  updateMiningBalance(updatedBalance.claimableRZC);

                  // Success feedback
                  playSound('claim');
                  triggerCelebration();

                  showSnackbar?.({
                    message: 'All RZC Claimed to Airdrop! 🎉',
                    description: `${transferredAmount.toFixed(6)} RZC moved to Airdrop Balance. Mining reset for fresh start!`
                  });

                } catch (error) {
                  console.error('Claim error:', error);
                  showSnackbar?.({
                    message: 'Claim Failed',
                    description: error instanceof Error ? error.message : 'An unexpected error occurred during the claim process.'
                  });
                } finally {
                  setIsProcessingAirdropClaim(false);
                }
              }}
              disabled={(() => {
                const availableBalance = claimableRZC + (isMining ? accumulatedRZC : 0);
                const hasAnyBalance = availableBalance > 0 || claimedRZC > 0 || totalEarnedRZC > 0;
                
                return isClaiming || isProcessingAirdropClaim || isLoadingBalance || !hasAnyBalance;
              })()}
              className="w-full sm:w-2/3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 border border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] py-3 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-6 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isClaiming || isProcessingAirdropClaim) ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>CLAIMING...</span>
                </div>
              ) : (
                <>
                  <Icons.Wallet size={16} />
                  {(() => {
                    const availableBalance = claimableRZC + (isMining ? accumulatedRZC : 0);
                    const totalVisible = availableBalance + claimedRZC + totalEarnedRZC;
                    
                    if (totalVisible > 0) {
                      // Show the total that user can see, even if some might already be in airdrop
                      return `CLAIM ALL ${totalVisible.toFixed(4)} RZC`;
                    } else {
                      return `CLAIM TO AIRDROP`;
                    }
                  })()}
                </>
              )}
            </button>

            {/* Simplified Flow Indicator - Direct to Airdrop */}
            <div className="w-full sm:w-2/3 mb-6">
              {(() => {
                const availableBalance = claimableRZC + (isMining ? accumulatedRZC : 0);
                const totalVisible = availableBalance + claimedRZC + totalEarnedRZC;
                
                if (totalVisible > 0) {
                  return (
                    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                      <div className="text-center text-xs text-gray-400 mb-2">Direct Claim Flow</div>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                          <Icons.Energy size={10} />
                          <span>All Mining RZC</span>
                        </div>
                        <Icons.ChevronRight size={12} className="text-gray-500" />
                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                          <Icons.Wallet size={10} />
                          <span>Airdrop Balance</span>
                        </div>
                      </div>
                      <div className="text-center text-xs text-gray-500 mt-2">
                        {totalVisible.toFixed(4)} RZC will be processed for airdrop
                      </div>
                      <div className="text-center text-xs text-gray-600 mt-1">
                        ✨ One click processes everything and resets mining
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Season End Claim Button - Special button for final claims
            {(claimableRZC > 0 || (isMining && accumulatedRZC > 0) || claimedRZC > 0) && (
               <button 
               onClick={() => setShowSeasonEndModal(true)}
               disabled={isProcessingSeasonClaim}
               className="w-full sm:w-2/3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border border-orange-400/50 text-white shadow-[0_0_20px_rgba(251,146,60,0.3)] py-3 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-6 transition-all active:scale-[0.98]"
             >
               {isProcessingSeasonClaim ? (
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <>
                   <Icons.Rank size={16} />
                   SEASON END CLAIM
                 </>
               )}
             </button>
            )} */}

            {/* Footer Stats */}
            <div className="flex items-center justify-between w-full px-2 text-[10px] font-mono text-gray-400 font-bold tracking-tight">
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 ${isMining ? 'text-rzc-green' : 'text-gray-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isMining ? 'bg-rzc-green animate-pulse' : 'bg-gray-500'}`}></div>
                        {isMining ? 'SYSTEM ONLINE' : 'SYSTEM STANDBY'}
                    </div>
                    {isMining && userUpgrades.extendedSession && (
                      <span className="bg-rzc-green/10 px-1.5 py-0.5 rounded text-rzc-green border border-rzc-green/20">48H</span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {miningStreak > 0 && (
                      <div className="flex items-center gap-1 bg-orange-900/20 px-2 py-0.5 rounded border border-orange-500/20">
                          <Icons.Fire size={10} className="text-orange-500" />
                          <span className="text-orange-400">{miningStreak}d</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                        <span>{(RZC_PER_DAY * miningRateMultiplier).toFixed(1)} RZC/24h</span>
                        {miningRateMultiplier > 1 && (
                          <span className="bg-yellow-500/10 text-yellow-500 px-1 rounded text-[9px] border border-yellow-500/20">
                            +{Math.round((miningRateMultiplier - 1) * 100)}%
                          </span>
                        )}
                    </div>
                </div>
            </div>
          </>
        )}

        {/* Other Tabs Content Rendered Here */}
        {activeTab === 'activity' && (
          <div className="w-full space-y-4">
             <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Activity History</h2>
                <p className="text-gray-400 text-sm">Track your mining activities and rewards</p>
             </div>
             {isLoadingActivities ? (
               <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div></div>
             ) : activities && activities.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity, index) => (
                    <div key={activity.id || index} className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-700/50 p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                            <div className="text-gray-400 text-xs">{new Date(activity.created_at).toLocaleString()}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-green-400 font-bold text-sm tabular-nums">+{Number(activity.amount).toFixed(6)} RZC</div>
                          <div className="text-xs text-gray-500 uppercase">{activity.status}</div>
                       </div>
                    </div>
                  ))}
                </div>
             ) : (
               <div className="text-center text-gray-500 py-10">No activities found</div>
             )}
          </div>
        )}

        {activeTab === 'upgrades' && (
           <div className="w-full space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Mining Boost</h2>
                <p className="text-gray-400 text-sm">Enhance your node capabilities</p>
              </div>
              
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-4 mb-6 text-center">
                 <div className="text-yellow-300 font-bold text-lg mb-1">{RZC_PER_DAY * miningRateMultiplier} RZC/day</div>
                 <div className="text-yellow-400/80 text-sm">Current Mining Rate</div>
              </div>

              {/* Mining Rig MK2 */}
              <div className={`relative overflow-hidden rounded-xl p-4 border ${userUpgrades.miningRigMk2 ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900/50 border-gray-700/50'}`}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`p-3 rounded-lg ${userUpgrades.miningRigMk2 ? 'bg-green-500/20' : 'bg-gray-800/50'}`}>
                          <Icons.Boost size={20} className={userUpgrades.miningRigMk2 ? 'text-green-400' : 'text-gray-400'} />
                       </div>
                       <div>
                          <div className={`font-bold text-sm ${userUpgrades.miningRigMk2 ? 'text-green-300' : 'text-white'}`}>Mining Rig MK2</div>
                          <div className="text-gray-400 text-xs">+25% mining rate</div>
                          {!userUpgrades.miningRigMk2 && <div className="text-gray-500 text-xs mt-1">Cost: 50 RZC</div>}
                       </div>
                    </div>
                    {userUpgrades.miningRigMk2 ? (
                       <span className="text-green-400 text-sm font-medium">Owned</span>
                    ) : (
                       <button 
                         onClick={async () => {
                            if (!userId || claimedRZC < 50) return;
                            setIsLoadingBalance(true);
                            try {
                               const res = await purchaseUpgrade(userId, 'mining_rig_mk2', 50);
                               if (res.success) {
                                  await loadUserUpgrades();
                                  fetchBalance();
                                  showSnackbar?.({ message: 'Upgrade Successful!' });
                               }
                            } finally { setIsLoadingBalance(false); }
                         }}
                         className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded-lg transition-colors"
                       >
                         Upgrade
                       </button>
                    )}
                 </div>
              </div>

              {/* Extended Session */}
              <div className={`relative overflow-hidden rounded-xl p-4 border ${userUpgrades.extendedSession ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-900/50 border-gray-700/50'}`}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`p-3 rounded-lg ${userUpgrades.extendedSession ? 'bg-blue-500/20' : 'bg-gray-800/50'}`}>
                          <svg className={`w-5 h-5 ${userUpgrades.extendedSession ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <div>
                          <div className={`font-bold text-sm ${userUpgrades.extendedSession ? 'text-blue-300' : 'text-white'}`}>Extended Session</div>
                          <div className="text-gray-400 text-xs">48-hour mining sessions</div>
                          {!userUpgrades.extendedSession && <div className="text-gray-500 text-xs mt-1">Cost: 100 RZC</div>}
                       </div>
                    </div>
                    {userUpgrades.extendedSession ? (
                       <span className="text-blue-400 text-sm font-medium">Owned</span>
                    ) : (
                       <button 
                         onClick={async () => {
                            if (!userId || claimedRZC < 100) return;
                            setIsLoadingBalance(true);
                            try {
                               const res = await purchaseUpgrade(userId, 'extended_session', 100);
                               if (res.success) {
                                  await loadUserUpgrades();
                                  fetchBalance();
                                  showSnackbar?.({ message: 'Upgrade Successful!' });
                               }
                            } finally { setIsLoadingBalance(false); }
                         }}
                         className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                       >
                         Upgrade
                       </button>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'leaderboard' && (
           <div className="w-full space-y-4">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"><span className="text-lg">🏆</span></div>
                   <h2 className="text-xl font-bold text-white">RhizaCore Champions</h2>
                </div>
                <p className="text-gray-400 text-sm mb-3">Top miners by available balance</p>
              </div>

              {isLoadingLeaderboards ? (
                 <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div></div>
              ) : (
                 <div className="space-y-2">
                    {topBalances.map((balance: any, index: number) => {
                       const isUser = balance.id === userId;
                       const rank = index + 1;
                       return (
                          <div key={index} className={`relative overflow-hidden rounded-xl p-3 flex items-center justify-between ${isUser ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-900/50 border border-gray-700/50'}`}>
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                   index === 0 ? 'bg-yellow-500 text-black' : 
                                   index === 1 ? 'bg-gray-400 text-black' : 
                                   index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
                                }`}>
                                   {rank}
                                </div>
                                <div className="text-sm font-medium text-white">
                                   {balance.username}
                                   {isUser && <span className="ml-2 text-green-400 text-xs">(You)</span>}
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-white font-bold text-sm">{Number(balance.claimedRZC).toFixed(2)}</div>
                                <div className="text-xs text-gray-500">RZC</div>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}
           </div>
        )}

        {activeTab === 'airdrop' && (
           <div className="w-full space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Airdrop Balance</h2>
                <p className="text-gray-400 text-sm">Manage your airdrop balance and withdrawals</p>
              </div>
              
              {/* Airdrop Balance Card */}
              <div className="w-full bg-rzc-dark border border-rzc-gray rounded-2xl p-5 mb-6">
                 <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                       {airdropBalance ? airdropBalance.available_balance.toFixed(6) : '0.000000'}
                    </div>
                    <div className="text-gray-400 text-sm">Available for Withdrawal</div>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-gray-400 text-sm">Total Claimed to Airdrop:</span>
                       <span className="text-white font-mono">
                          {airdropBalance ? airdropBalance.total_claimed_to_airdrop.toFixed(6) : '0.000000'} RZC
                       </span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-400 text-sm">Migrated to Mainnet:</span>
                       <span className="text-white font-mono">
                          {airdropBalance ? airdropBalance.withdrawn_balance.toFixed(6) : '0.000000'} RZC
                       </span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-400 text-sm">Claimed RZC (Mining):</span>
                       <span className="text-green-400 font-mono">
                          {claimedRZC.toFixed(6)} RZC
                       </span>
                    </div>
                 </div>
              </div>

              {/* Mainnet Checklist */}
              <div className="w-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-5 mb-6">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                       <Icons.Check size={16} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Mainnet Readiness Checklist</h3>
                 </div>
                 
                 <div className="space-y-3">
                    {/* Checklist Items */}
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          totalEarnedRZC > 0 ? 'bg-green-500' : 'bg-gray-600'
                       }`}>
                          {totalEarnedRZC > 0 ? (
                             <Icons.Check size={12} className="text-white" />
                          ) : (
                             <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                       </div>
                       <div className="flex-1">
                          <div className="text-white text-sm font-medium">Unverifed Balance</div>
                          <div className="text-gray-400 text-xs">
                             {totalEarnedRZC > 0 ? `${totalEarnedRZC.toFixed(4)} RZC` : 'Start mining to earn RZC tokens'}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          airdropBalance && airdropBalance.total_claimed_to_airdrop > 0 ? 'bg-green-500' : 'bg-gray-600'
                       }`}>
                          {airdropBalance && airdropBalance.total_claimed_to_airdrop > 0 ? (
                             <Icons.Check size={12} className="text-white" />
                          ) : (
                             <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                       </div>
                       <div className="flex-1">
                          <div className="text-white text-sm font-medium">Transferable Balance</div>
                          <div className="text-gray-400 text-xs">
                             {airdropBalance && airdropBalance.total_claimed_to_airdrop > 0 
                                ? `${airdropBalance.total_claimed_to_airdrop.toFixed(4)} RZC` 
                                : 'Move your earned RZC to airdrop balance'
                             }
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          referralCode ? 'bg-green-500' : 'bg-gray-600'
                       }`}>
                          {referralCode ? (
                             <Icons.Check size={12} className="text-white" />
                          ) : (
                             <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                       </div>
                       <div className="flex-1">
                          <div className="text-white text-sm font-medium">Sponsor Code</div>
                          <div className="text-gray-400 text-xs">
                             {referralCode ? `${referralCode}` : 'Generate your unique referral code'}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10">
                       <div className="w-5 h-5 rounded-full flex items-center justify-center bg-yellow-500">
                          <Icons.Calendar size={12} className="text-white" />
                       </div>
                       <div className="flex-1">
                          <div className="text-white text-sm font-medium">Mainnet Launch</div>
                          <div className="text-gray-400 text-xs">
                             🚀 Coming Soon - Stay tuned for mainnet announcement
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10">
                       <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-600">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                       </div>
                       <div className="flex-1">
                          <div className="text-white text-sm font-medium">Token Distribution</div>
                          <div className="text-gray-400 text-xs">
                             Automatic distribution to eligible wallets after mainnet
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Progress Bar */}
                 <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-gray-400 text-sm">Readiness Progress</span>
                       <span className="text-white text-sm font-bold">
                          {(() => {
                             let completed = 0;
                             if (totalEarnedRZC > 0) completed++;
                             if (airdropBalance && airdropBalance.total_claimed_to_airdrop > 0) completed++;
                             if (referralCode) completed++;
                             return `${completed}/3`;
                          })()}
                       </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                       <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ 
                             width: `${(() => {
                                let completed = 0;
                                if (totalEarnedRZC > 0) completed++;
                                if (airdropBalance && airdropBalance.total_claimed_to_airdrop > 0) completed++;
                                if (referralCode) completed++;
                                return (completed / 3) * 100;
                             })()}%` 
                          }}
                       ></div>
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                 {(totalEarnedRZC > 0 || claimableRZC > 0 || (isMining && accumulatedRZC > 0) || claimedRZC > 0) && (
                    <button 
                    onClick={() => {
                      // Switch to mining tab and trigger the main claim flow
                      setActiveTab('mining');
                      showSnackbar?.({
                        message: 'Switched to Mining Tab',
                        description: 'Use the main CLAIM button to move all RZC to airdrop balance'
                      });
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 border border-purple-400/50 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] py-3 rounded-lg text-sm font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Icons.Wallet size={16} />
                    GO TO MINING TAB TO CLAIM
                  </button>
                 )}
                 
                 {airdropBalance && airdropBalance.available_balance > 0 && (
                    <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border border-green-400/50 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] py-3 rounded-lg text-sm font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Icons.Send size={16} />
                    WITHDRAW TO WALLET
                  </button>
                 )}
              </div>

              {/* Withdrawal History */}
              {airdropWithdrawals.length > 0 && (
                 <div className="mt-8">
                    <h3 className="text-lg font-bold text-white mb-4">Withdrawal History</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                       {airdropWithdrawals.map((withdrawal) => (
                          <div key={withdrawal.id} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
                             <div className="flex items-center justify-between mb-2">
                                <div className="text-white font-medium">{withdrawal.amount.toFixed(6)} RZC</div>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${
                                   withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                   withdrawal.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                   withdrawal.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                   'bg-gray-500/20 text-gray-400'
                                }`}>
                                   {withdrawal.status.toUpperCase()}
                                </div>
                             </div>
                             <div className="text-gray-400 text-xs">
                                To: {withdrawal.destination_address.slice(0, 10)}...{withdrawal.destination_address.slice(-8)}
                             </div>
                             <div className="text-gray-500 text-xs mt-1">
                                {new Date(withdrawal.created_at).toLocaleString()}
                             </div>
                             {withdrawal.transaction_hash && (
                                <div className="text-blue-400 text-xs mt-1">
                                   TX: {withdrawal.transaction_hash.slice(0, 10)}...{withdrawal.transaction_hash.slice(-8)}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        )}

      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-pulse transform translate-z-0">🎉</div>
        </div>
      )}

      {showAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-yellow-900 via-yellow-800 to-yellow-900 border-2 border-yellow-600/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-bounce">
            <div className="relative text-center">
              <div className="text-6xl mb-4 animate-pulse">
                {getAchievementInfo(showAchievement).icon}
              </div>
              <h3 className="text-2xl font-bold text-yellow-300 mb-2">Achievement Unlocked!</h3>
              <h4 className="text-xl font-semibold text-yellow-200 mb-2">{getAchievementInfo(showAchievement).title}</h4>
              <p className="text-yellow-100 text-sm mb-4">{getAchievementInfo(showAchievement).description}</p>
              <button onClick={() => setShowAchievement(null)} className="bg-yellow-600/80 hover:bg-yellow-500/80 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Awesome! 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Popup - preserved logic, simple render */}
      {showTelegramPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTelegramPopup(false)}></div>
           
           <div className="bg-rzc-dark border-2 border-rzc-green/30 rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 overflow-hidden shadow-[0_0_50px_rgba(74,222,128,0.2)]">
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>
              
              {/* Top Prize Badge */}
              <div className="flex justify-center mb-6">
                <div className="bg-rzc-green/10 border border-rzc-green/30 px-4 py-1 rounded-full">
                    <span className="text-rzc-green text-[10px] font-bold tracking-[0.3em] uppercase">Genesis Protocol</span>
                </div>
              </div>

              {/* Central Icon */}
              <div className="flex flex-col items-center mb-6">
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white relative shadow-xl transform rotate-3">
                        <Icons.Telegram size={40} />
                    </div>
                 </div>
                 <h3 className="text-2xl font-bold text-white mt-6 mb-2 text-center tracking-tight">1,000,000 RZC Pool</h3>
                 <p className="text-gray-400 text-xs text-center leading-relaxed">
                    Join the terminal community to validate your node and enter the <span className="text-rzc-green font-bold">Genesis Node Giveaway</span>.
                 </p>
              </div>

              {/* Stats/Social Proof */}
              <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-white/5">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Community Strength</span>
                    <span className="text-rzc-green text-[9px] font-mono">1000+ ACTIVE</span>
                 </div>
                 <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rzc-green w-[85%] animate-pulse"></div>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <a 
                    href="https://t.me/RhizaCore" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="group relative bg-white text-black py-4 rounded-2xl text-center font-bold tracking-widest text-xs uppercase overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                 >
                    <div className="absolute inset-0 bg-rzc-green opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        ENTER CONTEST <Icons.ChevronRight size={14} />
                    </span>
                 </a>
                 <button 
                    onClick={() => setShowTelegramPopup(false)} 
                    className="text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                 >
                    Dismiss Terminal
                 </button>
              </div>

              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-rzc-green/20"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-rzc-green/20"></div>
           </div>
        </div>
      )}

      {/* Season End Claim Modal */}
      {showSeasonEndModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowSeasonEndModal(false)}></div>
           
           <div className="bg-rzc-dark border-2 border-orange-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(251,146,60,0.3)]">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icons.Rank size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Season End Claim</h3>
                <p className="text-gray-400 text-sm">
                  Claim all your RZC and optionally request airdrop to external wallet
                </p>
              </div>

              {/* Balance Summary */}
              <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Available to Claim:</span>
                  <span className="text-orange-400 font-bold">
                    {((claimableRZC || 0) + (isMining ? accumulatedRZC : 0)).toFixed(6)} RZC
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Already Claimed:</span>
                  <span className="text-green-400 font-bold">{(claimedRZC || 0).toFixed(6)} RZC</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Total Balance:</span>
                    <span className="text-white font-bold text-lg">
                      {((claimableRZC || 0) + (isMining ? accumulatedRZC : 0) + (claimedRZC || 0)).toFixed(6)} RZC
                    </span>
                  </div>
                </div>
              </div>

              {/* Airdrop Options */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Wallet Address (Optional - for airdrop request)
                  </label>
                  <input
                    type="text"
                    value={airdropWalletAddress}
                    onChange={(e) => setAirdropWalletAddress(e.target.value)}
                    placeholder="Enter your wallet address for airdrop"
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-orange-500/50 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Node Alias (Optional)
                  </label>
                  <input
                    type="text"
                    value={nodeAlias}
                    onChange={(e) => setNodeAlias(e.target.value)}
                    placeholder="Enter your preferred node name"
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-orange-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-6">
                <p className="text-orange-300 text-xs leading-relaxed">
                  <strong>Note:</strong> This will claim all your available RZC. If you provide a wallet address, 
                  an airdrop request will be created with 30% liquid tokens and 70% locked in vault for network stability.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSeasonEndModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSeasonEndClaim}
                  disabled={isProcessingSeasonClaim}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isProcessingSeasonClaim ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    'Claim Season RZC'
                  )}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Claim to Airdrop Modal */}
      {showAirdropModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowAirdropModal(false)}></div>
           
           <div className="bg-rzc-dark border-2 border-purple-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.3)]">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icons.Wallet size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Claim to Airdrop Balance</h3>
                <p className="text-gray-400 text-sm">
                  Move your total earned RZC to your airdrop balance for withdrawal
                </p>
              </div>

              {/* Balance Summary */}
              <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Total Earned RZC:</span>
                  <span className="text-purple-400 font-bold">{Math.max(totalEarnedRZC, 0).toFixed(6)} RZC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Current Airdrop Balance:</span>
                  <span className="text-green-400 font-bold">
                    {airdropBalance ? airdropBalance.available_balance.toFixed(6) : '0.000000'} RZC
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-6">
                <p className="text-purple-300 text-xs leading-relaxed">
                  <strong>Claim:</strong> This will move all your earned RZC to your airdrop balance. 
                  From there, you can withdraw to any external wallet address.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAirdropModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                
                {/* Always show claim button - no reclaim option */}
                <button 
                  onClick={handleClaimToAirdrop}
                  disabled={isProcessingAirdropClaim}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isProcessingAirdropClaim ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    'Claim to Airdrop'
                  )}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Withdraw from Airdrop Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowWithdrawModal(false)}></div>
           
           <div className="bg-rzc-dark border-2 border-green-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icons.Send size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Withdraw to Wallet</h3>
                <p className="text-gray-400 text-sm">
                  Withdraw RZC from your airdrop balance to an external wallet
                </p>
              </div>

              {/* Balance Display */}
              <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/10 text-center">
                <div className="text-gray-400 text-sm mb-1">Available Balance</div>
                <div className="text-green-400 font-bold text-xl">
                  {airdropBalance ? airdropBalance.available_balance.toFixed(6) : '0.000000'} RZC
                </div>
              </div>

              {/* Withdrawal Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Amount to Withdraw
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.000000"
                      step="0.000001"
                      min="0"
                      max={airdropBalance?.available_balance || 0}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none pr-16"
                    />
                    <button
                      onClick={() => setWithdrawAmount(airdropBalance?.available_balance.toString() || '0')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-xs font-bold hover:text-green-300"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Network
                  </label>
                  <select
                    value={withdrawNetwork}
                    onChange={(e) => setWithdrawNetwork(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500/50 focus:outline-none"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">BSC</option>
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
                <p className="text-green-300 text-xs leading-relaxed">
                  <strong>Note:</strong> Withdrawals are processed manually and may take 24-48 hours. 
                  Gas fees will be deducted from the withdrawal amount.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setWithdrawAddress('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWithdrawFromAirdrop}
                  disabled={isProcessingWithdraw || !withdrawAmount || !withdrawAddress}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isProcessingWithdraw ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    'Create Withdrawal'
                  )}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
});

export default ArcadeMiningUI;
            {activeTab === 'rewards' && (
              <div className="flex flex-col animate-in fade-in duration-300">
     /* Status Badge */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                    <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.2em] font-mono">Claim Phase</span>
                  </div>
                </div>

                {/* Announcement Section */}
                <div className="bg-gradient-to-r from-green-600/10 via-green-500/5 to-transparent border border-green-500/20 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col relative z-10">
                    <h3 className="text-green-400 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Icons.Info size={14} className="text-green-500" />
                      Official Announcement
                    </h3>
                    <h4 className="text-white text-lg font-black tracking-tight mb-2">Pre-Mining Season Completed</h4>
                    <p className="text-gray-400 text-[11px] leading-relaxed font-medium max-w-[90%]">
                      The Genesis mining phase has officially ended. All miners have successfully transitioned to the Claim Phase. 
                      Secure your RZC assets today to ensure eligibility for the Q1 2026 Mainnet Airdrop.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="bg-green-500/20 text-green-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        Phase 4 Active
                      </span>
                      <div className="h-px flex-1 bg-green-500/20"></div>
                    </div>
                  </div>
                </div>

                {/* Hero Balance Card */}
                <div className="relative mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-green-500/10 to-transparent border border-white/5 p-8 text-center shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-green-500/5 blur-[60px] rounded-full -mt-24"></div>
                  <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-2">Total Available to Claim</p>
                  <div className="flex items-end justify-center gap-2 mb-1">
                    <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
                      {formatRZC(displayBalance)}
                    </h2>
                    <span className="text-green-500 font-black text-lg mb-2">RZC</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-gray-400 text-xs font-medium">Ready for Mainnet Airdrop</p>
                  </div>
                </div>

                {/* Dynamic Burn Warning Notification */}
                <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-start gap-4 shadow-[0_10px_30px_-15px_rgba(239,68,68,0.3)]">
                  <div className="p-2.5 bg-red-500/20 rounded-xl shrink-0">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-red-400 text-[10px] font-black uppercase tracking-wider">Burn Deadline</span>
                      <span className="text-red-400 text-[11px] font-mono font-bold bg-red-500/10 px-2 py-0.5 rounded leading-none">
                        {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                      </span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-tight mb-3">
                      Rewards will be <span className="text-red-400 font-bold">permanently burnt</span> in {countdown.days} days.
                    </p>
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5 relative">
                      <div 
                        className="bg-gradient-to-r from-red-600 via-red-500 to-orange-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_12px_rgba(239,68,68,0.4)]" 
                        style={{ width: `${countdown.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                {hasClaimedToAirdrop ? (
                  /* Already Claimed Indicator */
                  <div className="w-full mb-8 rounded-2xl border-2 border-green-500/30 bg-green-500/5 p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Icons.CheckCircle size={16} className="text-green-500" />
                      </div>
                      <span className="text-green-500 font-black uppercase tracking-[0.15em] text-sm">
                        Rewards Claimed
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-400 text-xs">
                        Total Claimed: <span className="text-green-500 font-mono font-bold">{formatRZC(airdropBalance?.total_claimed_to_airdrop || 0)} RZC</span>
                      </p>
                      <p className="text-gray-400 text-xs">
                        Available Balance: <span className="text-white font-mono font-bold">{formatRZC(airdropBalance?.available_balance || 0)} RZC</span>
                      </p>
                      {airdropBalance?.withdrawn_balance > 0 && (
                        <p className="text-gray-400 text-xs">
                          Withdrawn: <span className="text-orange-400 font-mono font-bold">{formatRZC(airdropBalance.withdrawn_balance)} RZC</span>
                        </p>
                      )}
                      {airdropBalance?.last_claim_from_mining && (
                        <p className="text-gray-500 text-[10px] mt-2">
                          Last Claim: {new Date(airdropBalance.last_claim_from_mining).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                        Visit Rhiza Wallet tab to manage your balance
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Claim Button */
                  <button 
                    onClick={async () => {
                      if (!userId) return;
                      setIsProcessingAirdropClaim(true);
                      
                      try {
                        if (totalAvailableToClaim <= 0) {
                          showSnackbar?.({ 
                            message: 'No Rewards', 
                            description: 'Your claimable balance is empty.' 
                          });
                          return;
                        }

                        // If there's accumulated RZC from active mining, complete it first
                        if (isMining && accumulatedRZC > 0) {
                          const { error: activityError } = await supabase.from('activities').insert({
                            user_id: userId,
                            type: 'mining_complete',
                            amount: accumulatedRZC,
                            status: 'completed',
                            created_at: new Date().toISOString()
                          });

                          if (activityError) throw activityError;
                        }

                        // Claim all RZC rewards first
                        if (claimableRZC > 0 || accumulatedRZC > 0) {
                          const claimAmount = claimableRZC + (isMining ? accumulatedRZC : 0);
                          const claimResult = await claimRZCRewards(userId, claimAmount);
                          if (!claimResult.success) {
                            throw new Error(claimResult.error || 'Failed to claim mining rewards');
                          }
                        }

                        const airdropResult = await claimTotalEarnedToAirdrop(userId);
                        
                        if (airdropResult.success) {
                          showSnackbar?.({ 
                            message: 'Success!', 
                            description: `${formatRZC(totalAvailableToClaim)} RZC claimed to airdrop.` 
                          });
                          
                          setClaimableRZC(0);
                          setTotalEarnedRZC(0);
                          setAccumulatedRZC(0);
                          setDisplayBalance(0);
                          setIsMining(false);
                          setCurrentSession(null);
                          
                          fetchBalance();
                        } else {
                          throw new Error(airdropResult.error || 'Failed to transfer to airdrop');
                        }
                      } catch (err) {
                        showSnackbar?.({ 
                          message: 'Claim Failed', 
                          description: err instanceof Error ? err.message : 'System error.' 
                        });
                      } finally {
                        setIsProcessingAirdropClaim(false);
                      }
                    }}
                    disabled={isProcessingAirdropClaim || (totalAvailableToClaim === 0)}
                    className="group relative w-full mb-8 overflow-hidden rounded-2xl shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-600 to-green-500 animate-gradient-x bg-[length:200%_100%]"></div>
                    <div className="relative flex items-center justify-center gap-3 py-5 text-black font-black uppercase tracking-[0.15em] text-sm">
                      {isProcessingAirdropClaim ? (
                        <div className="w-5 h-5 border-[3px] border-black/30 border-t-black rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Icons.Wallet size={20} />
                          <span>Claim RZC Rewards</span>
                        </>
                      )}
                    </div>
                  </button>
                )}

                {/* Referral Link Simplified */}
                <div className="mb-8">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 px-1 text-center">
                    Referral Node Active
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 py-3 group hover:border-green-500/30 transition-all cursor-pointer">
                      <span className="text-gray-400 text-xs truncate font-mono tracking-tight">
                        {`t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`}
                      </span>
                    </div>
                    <button 
                      onClick={handleCopy}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${
                        copyFeedback 
                          ? 'bg-green-500 text-black' 
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <Icons.Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}