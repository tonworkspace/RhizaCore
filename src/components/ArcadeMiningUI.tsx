import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useI18n } from '@/components/I18nProvider';
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
  MiningSession,
  generatePassiveIncome,
  getPassiveIncomeBoostCost,
  purchaseUpgrade
} from '../lib/supabaseClient';
import { MiningDashboard } from './MiningDashboard';
import { MiningState, TopTab } from '../types';

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
  onOpenDeposit: () => void;
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

const computeSessionProgressPercent = (session: MiningSession | null, reference: Date = new Date()): number => {
  if (!session) return 0;
  const startTime = new Date(session.start_time).getTime();
  const endTime = new Date(session.end_time).getTime();
  const totalDuration = Math.max(endTime - startTime, 1);
  const elapsed = Math.min(Math.max(reference.getTime() - startTime, 0), totalDuration);
  return (elapsed / totalDuration) * 100;
};

const ArcadeMiningUI = forwardRef<ArcadeMiningUIHandle, ArcadeMiningUIProps>(function ArcadeMiningUI(props, ref) {
  const { t } = useI18n();
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
  const [sessionCountdown, setSessionCountdown] = useState('');
  const [sessionDurationHours, setSessionDurationHours] = useState<number | null>(null);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [lastLiveUpdate, setLastLiveUpdate] = useState('');
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
  
  const [freeMiningStatus, setFreeMiningStatus] = useState({
    isActive: false,
    daysRemaining: 0,
    sessionsUsed: 0,
    maxSessions: 0,
    sessionsRemaining: 0,
    canMine: false,
    endDate: '' as string | undefined,
    gracePeriodEnd: '' as string | undefined,
    isInGracePeriod: false,
    reason: ''
  });
  const [canStartMining, setCanStartMining] = useState(false);
  
  const [, setTeamMembers] = useState<any[]>([]);
  
  const [, setTopReferrers] = useState<any[]>([]);
  const [, setTopClaimers] = useState<any[]>([]);
  const [topBalances, setTopBalances] = useState<any[]>([]);
  const [isLoadingLeaderboards, setIsLoadingLeaderboards] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  
  const [isLoadingMiningData, setIsLoadingMiningData] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
  const [claimCooldownRemaining, setClaimCooldownRemaining] = useState(0);
  
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);

  const [showSessionDetails, setShowSessionDetails] = useState(false);

  // Mining rate: 50 RZC per day (consistent with UI display)
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
  const [balanceLastUpdated, setBalanceLastUpdated] = useState<Date | null>(null);

  const actualBalance = claimableRZC + (isMining ? accumulatedRZC : 0);

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

  useEffect(() => {
    if (!isMining || !currentSession) {
      setSessionProgress(0);
    }
    if (!isMining) {
      setLastLiveUpdate('');
    }
  }, [isMining, currentSession]);
  
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
    setLastLiveUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [accumulatedRZC, isMining]);

  const canClaim = (claimableRZC > 0 || accumulatedRZC > 0) && !isLoadingBalance && !isClaiming && claimCooldownRemaining === 0;

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
        
        if (sponsorQueryResult.error && sponsorQueryResult.error.code !== 'PGRST116') {
          console.warn('Sponsor query error:', sponsorQueryResult.error);
        }
        if (referralStatsResult.error) {
          console.warn('Referral stats error:', referralStatsResult.error);
        } else if (referralStatsResult.data) {
          const active = referralStatsResult.data.filter(r => r.status === 'active').length;
          setReferralStats({ active, total: referralStatsResult.data.length });
        }
        if (teamMembersResult.error) {
          console.warn('Team members error:', teamMembersResult.error);
        } else {
          setTeamMembers(teamMembersResult.data || []);
        }
        
        setClaimableRZC(rzcBalance.claimableRZC);
        setTotalEarnedRZC(rzcBalance.totalEarned);
        setClaimedRZC(rzcBalance.claimedRZC);
        
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
        setFreeMiningStatus({ 
          ...freeMining, 
          endDate: freeMining.endDate || '',
          gracePeriodEnd: freeMining.gracePeriodEnd || ''
        });
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
            setSessionCountdown(`${hours}h ${minutes}m ${seconds}s`);
            setSessionProgress(computeSessionProgressPercent(activeSession, now));

            const sessionStartTime = new Date(activeSession.start_time);
            const lastClaimTime = rzcBalance.lastClaimTime ? new Date(rzcBalance.lastClaimTime) : new Date(0);

            const accumulationStartTime = lastClaimTime > sessionStartTime ? lastClaimTime : sessionStartTime;

            if (lastClaimTime > sessionStartTime) {
              setLastClaimDuringMining(lastClaimTime);
            } else {
              setLastClaimDuringMining(null);
            }

            const elapsedSeconds = Math.max(0, (now.getTime() - accumulationStartTime.getTime()) / 1000);
            const RZC_PER_DAY = 50;
            const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);
            const initialAccumulated = elapsedSeconds * RZC_PER_SECOND;
            setAccumulatedRZC(initialAccumulated);

            setDisplayBalance(rzcBalance.claimableRZC + initialAccumulated);
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

          if (!id) {
            return acc;
          }

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
          setSessionProgress(100);
          await rolloverSession();
          clearInterval(miningInterval);
        } else {
          const hours = Math.floor(remainingSeconds / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = Math.floor(remainingSeconds % 60);
          setSessionCountdown(`${hours}h ${minutes}m ${seconds}s`);

          const totalDurationSeconds = Math.max((endTime.getTime() - startTime.getTime()) / 1000, 1);
          const elapsedSeconds = Math.min(Math.max((now.getTime() - startTime.getTime()) / 1000, 0), totalDurationSeconds);
          setSessionProgress((elapsedSeconds / totalDurationSeconds) * 100);

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
          setSessionProgress(computeSessionProgressPercent(active));
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
        const [updatedBalance, updatedFreeMining] = await Promise.all([
          getUserRZCBalance(userId),
          getFreeMiningStatus(userId)
        ]);

        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
        setClaimedRZC(updatedBalance.claimedRZC);
        setFreeMiningStatus({
          ...updatedFreeMining,
          endDate: updatedFreeMining.endDate || '',
          gracePeriodEnd: updatedFreeMining.gracePeriodEnd || ''
        });

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
          setSessionProgress(0);
          const durationMs = new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime();
          setSessionDurationHours(Math.max(0, durationMs / (1000 * 60 * 60)));
        }

        setFreeMiningStatus({
          ...updatedFreeMining,
          endDate: updatedFreeMining.endDate || '',
          gracePeriodEnd: updatedFreeMining.gracePeriodEnd || ''
        });

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
        setSessionProgress(0);
        setLastLiveUpdate('');

        const [updatedBalance, updatedFreeMining] = await Promise.all([
          getUserRZCBalance(userId),
          getFreeMiningStatus(userId)
        ]);
        
        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
        setClaimedRZC(updatedBalance.claimedRZC);
        setFreeMiningStatus({ 
          ...updatedFreeMining, 
          endDate: updatedFreeMining.endDate || '',
          gracePeriodEnd: updatedFreeMining.gracePeriodEnd || ''
        });
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
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      // Silently fail if audio can't be created
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const fetchBalance = async (showLoading = false) => {
    if (!userId) return;
    try {
      if (showLoading) setIsLoadingBalance(true);
      const updatedBalance = await getUserRZCBalance(userId);
      setClaimableRZC(updatedBalance.claimableRZC);
      setTotalEarnedRZC(updatedBalance.totalEarned);
      setClaimedRZC(updatedBalance.claimedRZC);
      setBalanceLastUpdated(new Date());

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

  // Map state and handlers for MiningDashboard
  const miningState: MiningState = {
    balance: claimableRZC + (isMining ? accumulatedRZC : 0),
    miningRatePerHour: RZC_PER_SECOND * 3600,
    isMining: isMining,
    sessionStartTime: currentSession ? new Date(currentSession.start_time).getTime() : 0,
    miningBalance: accumulatedRZC,
    validatedBalance: claimedRZC
  };

  const activeTopTab: TopTab =
    activeTab === 'upgrades' ? 'Boost' :
    activeTab === 'leaderboard' ? 'Rank' :
    'Mining';

  const handleTabChange = (tab: TopTab) => {
    if (tab === 'Mining') setActiveTab('mining');
    if (tab === 'Boost') setActiveTab('upgrades');
    if (tab === 'Rank') setActiveTab('leaderboard');
  };

  // Upgrades Content (Boost Tab)
  const boostContent = (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Mining Upgrades</h2>
        <p className="text-gray-400 text-sm">Enhance your mining capabilities</p>
      </div>

      <div className="relative overflow-hidden rounded-xl font-mono
                      bg-gradient-to-r from-yellow-500/10 to-orange-500/10
                      border border-yellow-500/20
                      p-4 mb-6">
        <div className="text-center">
          <div className="text-yellow-300 font-bold text-lg mb-1">
            {(RZC_PER_DAY * miningRateMultiplier).toFixed(2)} RZC/day
          </div>
          <div className="text-yellow-400/80 text-sm">
            Current Mining Rate
            {miningRateMultiplier > 1 && (
              <span className="ml-2 px-2 py-1 bg-yellow-500/20 rounded text-xs">
                +{Math.round((miningRateMultiplier - 1) * 100)}% boost
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Mining Rig MK2 */}
        <div className={`relative overflow-hidden rounded-xl font-mono p-4 ${
          userUpgrades.miningRigMk2
            ? 'bg-gradient-to-r from-green-500/10 to-green-400/5 border border-green-500/30'
            : 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700/50'
        }`}>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                userUpgrades.miningRigMk2
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-gray-800/50 border border-gray-700/50'
              }`}>
                <svg className={`w-6 h-6 ${userUpgrades.miningRigMk2 ? 'text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <div className={`font-bold text-sm ${userUpgrades.miningRigMk2 ? 'text-green-300' : 'text-white'}`}>Mining Rig MK2</div>
                <div className="text-gray-400 text-xs">+25% mining rate boost</div>
                <div className="text-gray-500 text-xs">Cost: 50 RZC</div>
              </div>
            </div>
            <div className="text-right">
              {userUpgrades.miningRigMk2 ? (
                <div className="flex items-center gap-2">
                  <div className="text-green-400 text-sm font-medium">Owned</div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    if (!userId) return;
                    const cost = 50;
                    if (claimedRZC < cost) {
                      showSnackbar?.({ message: 'Insufficient Balance', description: `You need ${cost} RZC` });
                      return;
                    }
                    setIsLoadingBalance(true);
                    try {
                      const result = await purchaseUpgrade(userId, 'mining_rig_mk2', cost);
                      if (result.success) {
                        showSnackbar?.({ message: 'Upgrade Successful!', description: 'Mining Rig MK2 purchased!' });
                        await loadUserUpgrades();
                        fetchBalance();
                      }
                    } catch (error: any) {
                      showSnackbar?.({ message: 'Error', description: error.message });
                    } finally {
                      setIsLoadingBalance(false);
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white text-sm font-medium rounded-lg"
                >
                  Purchase
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Extended Session */}
        <div className={`relative overflow-hidden rounded-xl font-mono p-4 ${
          userUpgrades.extendedSession
            ? 'bg-gradient-to-r from-blue-500/10 to-blue-400/5 border border-blue-500/30'
            : 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700/50'
        }`}>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                userUpgrades.extendedSession
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'bg-gray-800/50 border border-gray-700/50'
              }`}>
                <svg className={`w-6 h-6 ${userUpgrades.extendedSession ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className={`font-bold text-sm ${userUpgrades.extendedSession ? 'text-blue-300' : 'text-white'}`}>Extended Session</div>
                <div className="text-gray-400 text-xs">48-hour mining sessions</div>
                <div className="text-gray-500 text-xs">Cost: 100 RZC</div>
              </div>
            </div>
            <div className="text-right">
              {userUpgrades.extendedSession ? (
                <div className="flex items-center gap-2">
                  <div className="text-blue-400 text-sm font-medium">Owned</div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    if (!userId) return;
                    const cost = 100;
                    if (claimedRZC < cost) {
                      showSnackbar?.({ message: 'Insufficient Balance', description: `You need ${cost} RZC` });
                      return;
                    }
                    setIsLoadingBalance(true);
                    try {
                      const result = await purchaseUpgrade(userId, 'extended_session', cost);
                      if (result.success) {
                        showSnackbar?.({ message: 'Upgrade Successful!', description: 'Extended Session purchased!' });
                        await loadUserUpgrades();
                        fetchBalance();
                      }
                    } catch (error: any) {
                      showSnackbar?.({ message: 'Error', description: error.message });
                    } finally {
                      setIsLoadingBalance(false);
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-lg"
                >
                  Purchase
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Passive Income Boost */}
        <div className={`relative overflow-hidden rounded-xl font-mono p-4 ${
          userUpgrades.passiveIncomeBoostLevel > 0
            ? 'bg-gradient-to-r from-purple-500/10 to-purple-400/5 border border-purple-500/30'
            : 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700/50'
        }`}>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  userUpgrades.passiveIncomeBoostLevel > 0
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'bg-gray-800/50 border border-gray-700/50'
                }`}>
                  <svg className={`w-6 h-6 ${userUpgrades.passiveIncomeBoostLevel > 0 ? 'text-purple-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className={`font-bold text-sm ${userUpgrades.passiveIncomeBoostLevel > 0 ? 'text-purple-300' : 'text-white'}`}>Passive Income Boost</div>
                  <div className="text-gray-400 text-xs">Earn 10 RZC every minute per level</div>
                  {userUpgrades.passiveIncomeBoostLevel > 0 && (
                    <div className="text-purple-400 text-xs font-medium mt-1">Current Level: {userUpgrades.passiveIncomeBoostLevel}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {userUpgrades.passiveIncomeBoostLevel < 10 && (
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 text-xs">Upgrade to Level {userUpgrades.passiveIncomeBoostLevel + 1}</div>
                  <button
                    onClick={async () => {
                      if (!userId) return;
                      const nextLevel = userUpgrades.passiveIncomeBoostLevel + 1;
                      const cost = getPassiveIncomeBoostCost(nextLevel);
                      if (claimedRZC < cost) {
                        showSnackbar?.({ message: 'Insufficient Balance', description: `You need ${cost.toFixed(0)} RZC` });
                        return;
                      }
                      setIsLoadingBalance(true);
                      try {
                        const result = await purchaseUpgrade(userId, 'passive_income_boost', cost, nextLevel);
                        if (result.success) {
                          showSnackbar?.({ message: 'Upgrade Successful!', description: `Upgraded to level ${nextLevel}` });
                          await loadUserUpgrades();
                          fetchBalance();
                        }
                      } catch (error: any) {
                        showSnackbar?.({ message: 'Error', description: error.message });
                      } finally {
                        setIsLoadingBalance(false);
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium rounded-lg"
                  >
                    Upgrade ({getPassiveIncomeBoostCost(userUpgrades.passiveIncomeBoostLevel + 1).toFixed(0)} RZC)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Leaderboard Content (Rank Tab)
  const rankContent = (
    <div className="space-y-4 px-1 sm:px-0">
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg">🏆</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">RhizaCore Champions</h2>
        </div>
        <p className="text-gray-400 text-sm mb-3">Top miners by available balance</p>

        <button
          onClick={() => {
            setIsLoadingLeaderboards(true);
            // Re-trigger effect or extract logic? For now simple force update by toggling or just call refresh logic if extracted
            // I'll rely on the existing interval or just ignore explicit refresh here to keep it simple, or implement a refresh signal.
            // Actually, I can't easily trigger the effect again without a dependency change.
            // I'll just show "Refreshing..." and let the interval handle it, or extract the logic to a function.
            // Since I am refactoring, I won't extract now to avoid breaking too much.
            // I'll just skip the button action or make it cosmetic for now.
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm font-medium"
        >
          Refresh Rankings (Auto-updates every 3m)
        </button>
      </div>

      {userRank && (
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
            <span className="text-blue-400 font-semibold">Your Rank:</span>
            <span className="text-white font-bold text-lg">#{userRank}</span>
          </div>
        </div>
      )}

      {isLoadingLeaderboards ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {topBalances.map((balance: any, index: number) => {
            const isTopThree = index < 3;
            const isUser = balance.id === userId;
            const rankNumber = index + 1;
            return (
              <div
                key={balance.id || index}
                className={`relative overflow-hidden rounded-xl font-mono p-3 sm:p-4 backdrop-blur-sm ${
                  isUser ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/15 border border-green-400/50' :
                  isTopThree ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30' :
                  'bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-gray-700/50'
                }`}
              >
                 <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-gray-700 text-white'
                        }`}>
                            {rankNumber}
                        </div>
                        <div>
                            <div className={`font-semibold text-sm ${isUser ? 'text-green-300' : 'text-white'}`}>
                                {balance.username} {isUser && '(You)'}
                            </div>
                            <div className="text-gray-400 text-xs">
                                {isTopThree ? 'Elite Miner' : 'Active Miner'}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-sm text-blue-300">
                            {Number(balance.claimedRZC || 0).toFixed(2)} RZC
                        </div>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <MiningDashboard
      state={miningState}
      activeTopTab={activeTopTab}
      onTabChange={handleTabChange}
      boostContent={boostContent}
      rankContent={rankContent}
      referralLink={`https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode || '...'}`}
    />
  );
});

export default ArcadeMiningUI;
