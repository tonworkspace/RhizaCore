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
  purchaseUpgrade
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

type TopTab = 'Mining' | 'Boost' | 'Rank' | 'Activity';

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
  } = props;

  const [activeTab, setActiveTab] = useState<'mining' | 'activity' | 'upgrades' | 'leaderboard' | 'balances'>('mining');
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
  const [, setTotalEarnedRZC] = useState(0);
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
  
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

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

        const [
          rzcBalance,
          freeMining,
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
        const [updatedBalance] = await Promise.all([
          getUserRZCBalance(userId),
          getFreeMiningStatus(userId)
        ]);

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

        const [updatedBalance] = await Promise.all([
          getUserRZCBalance(userId),
          getFreeMiningStatus(userId)
        ]);
        
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

      if ((bulkClaim || claimSource === 'mining_session') && isMining && accumulatedRZC > 0) {
        try {
          const miningAmount = bulkClaim ? accumulatedRZC : amountToClaim;
          const { error: activityError } = await supabase.from('activities').insert({
            user_id: userId,
            type: 'mining_complete',
            amount: miningAmount,
            status: 'completed',
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
        showSnackbar?.({
          message: 'Claim Failed',
          description: result.error || 'Failed to claim RZC rewards.'
        });
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
          await claimRewards();
        } finally {
          thresholdClaimingRef.current = false;
        }
      })();
    }
  }, [userId, isMining, accumulatedRZC, claimCooldownRemaining, isClaiming, isLoadingBalance, claimableRZC]);

  const mapTabToInternal = (tab: TopTab): 'mining' | 'upgrades' | 'leaderboard' | 'activity' => {
    switch (tab) {
      case 'Mining': return 'mining';
      case 'Boost': return 'upgrades';
      case 'Rank': return 'leaderboard';
      case 'Activity': return 'activity';
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
      default: return 'Mining';
    }
  };

  const activeTopTab = getActiveTopTab();

  return (
    <div className="flex flex-col h-full w-full pb-24 overflow-y-auto custom-scrollbar">
      
      {/* Top Tabs */}
      <div className="mx-4 mt-2 bg-rzc-gray/30 rounded-2xl p-1 flex justify-between items-center border border-white/5 backdrop-blur-sm">
        {(['Mining', 'Boost', 'Rank', 'Activity'] as TopTab[]).map((tab) => {
           let Icon = Icons.Energy;
           if (tab === 'Boost') Icon = Icons.Boost;
           if (tab === 'Rank') Icon = Icons.Rank;
           if (tab === 'Activity') Icon = Icons.History; // Assuming History icon exists or fallback

           const isActive = activeTopTab === tab;
           return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                isActive 
                  ? 'bg-rzc-dark text-rzc-green shadow-lg border border-rzc-green/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
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

            {/* Stats Card */}
            <div className="w-full bg-rzc-dark border border-rzc-gray rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-rzc-green text-sm font-medium">Mining:</span>
                    <span className="text-white font-mono font-bold">{(isMining ? accumulatedRZC : 0).toFixed(6)} RZC</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-purple-400 text-sm font-medium">Validated:</span>
                    <span className="text-white font-mono font-bold">{claimedRZC.toFixed(6)} RZC</span>
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

            {/* Claim Button - Only visible if there are rewards
            {(claimableRZC > 0 || (isMining && accumulatedRZC > 0)) && !isMining && (
               <button 
               onClick={() => claimRewards(true)}
               disabled={isClaiming || isLoadingBalance}
               className="w-full sm:w-2/3 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 py-3 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-6 transition-all"
             >
               {isClaiming ? 'CLAIMING...' : `CLAIM ${((isMining ? accumulatedRZC : 0) + claimableRZC).toFixed(4)} RZC`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
           <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold text-white mb-2 text-center">Join Community</h3>
              <p className="text-gray-400 text-sm mb-4 text-center">Stay updated with the latest news!</p>
              <div className="flex flex-col gap-3">
                 <a href="https://t.me/RhizaCore" target="_blank" rel="noreferrer" className="bg-blue-600 text-white py-2 rounded-lg text-center font-bold">Join Group</a>
                 <button onClick={() => setShowTelegramPopup(false)} className="text-gray-500 text-sm">Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
});

export default ArcadeMiningUI;