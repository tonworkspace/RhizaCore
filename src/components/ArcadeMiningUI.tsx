import { useState, useEffect } from 'react';
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
  purchaseUpgrade,
  updateFreeMiningSessionCount,
  // getUserActivities,
  MiningSession
} from '../lib/supabaseClient';

// Assuming these types are defined elsewhere, or I'd need to add them.
// For this example, I'll add placeholder types for missing ones.
interface SponsorInfo {
  username: string;
  code: string;
}

interface ReferralStats {
  active: number;
  total: number;
}

// interface WithdrawalEligibility {
//   canWithdraw: boolean;
//   hasPendingWithdrawal: boolean;
//   daysUntilWithdrawal: number;
// }

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

// A compact, arcade-style mining UI that preserves existing actions
export default function ArcadeMiningUI(props: ArcadeMiningUIProps) {
  const { t } = useI18n();
  const {
    // tonPrice,
    isClaiming,
    // claimCooldown, // Removed - instant claim enabled
    // cooldownText,
    // onClaim,
    // onOpenWithdraw,
    // airdropBalanceNova,
    // potentialEarningsTon,
    // totalWithdrawnTon,
    userId,
    userUsername,
    referralCode,
    // estimatedDailyTapps,
    showSnackbar,
  } = props;

  const [activeTab, setActiveTab] = useState<'mining' | 'activity' | 'referral'>('mining');
  const [sponsorCode, setSponsorCode] = useState<string | null>(null); // Added type
  const [sponsorInfo, setSponsorInfo] = useState<SponsorInfo | null>(null); // Added state
  const [referralStats, setReferralStats] = useState<ReferralStats>({ active: 0, total: 0 }); // Added state
  // const [showWithdrawModal, setShowWithdrawModal] = useState(false); // Added state
  // const [withdrawalEligibility, setWithdrawalEligibility] = useState<WithdrawalEligibility>({
  //   canWithdraw: false,
  //   hasPendingWithdrawal: false,
  //   daysUntilWithdrawal: 0,
  // }); // Added state

  // Backend-integrated mining system
  const [isMining, setIsMining] = useState(false);
  const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
  const [sessionCountdown, setSessionCountdown] = useState('');
  const [sessionDurationHours, setSessionDurationHours] = useState<number | null>(null);
  const [accumulatedRZC, setAccumulatedRZC] = useState(0);
  const [claimableRZC, setClaimableRZC] = useState(0);
  const [, setTotalEarnedRZC] = useState(0);
  const [claimedRZC, setClaimedRZC] = useState(0);
  const [, setMiningHistory] = useState<MiningSession[]>([]);
  
  // Track the last claim time during mining to reset accumulation
  // This prevents exploitation by reloading the app to get old accumulated values
  const [lastClaimDuringMining, setLastClaimDuringMining] = useState<Date | null>(null);
  
  // Track user upgrades and mining rate
  const [userUpgrades, setUserUpgrades] = useState<{
    miningRigMk2: boolean;
    extendedSession: boolean;
  }>({
    miningRigMk2: false,
    extendedSession: false
  });
  const [miningRateMultiplier, setMiningRateMultiplier] = useState(1.0);
  
  // Free mining period state (enhanced)
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
  
  // Network/Referral state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // Leaderboard state
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [, setTopClaimers] = useState<any[]>([]);
  const [isLoadingLeaderboards, setIsLoadingLeaderboards] = useState(false);
  
  // Loading states for smooth UX
  const [isLoadingMiningData, setIsLoadingMiningData] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Claim cooldown state
  const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
  const [claimCooldownRemaining, setClaimCooldownRemaining] = useState(0);
  
  // Telegram popup state
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);

  // Mining rate: 50 RZC per day (consistent with UI display)
  const RZC_PER_DAY = 50;
  const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);
  
  // Enhanced visual feedback states
  const [miningStreak, setMiningStreak] = useState(0);
  // const [totalMiningTime, setTotalMiningTime] = useState(0);
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load mining statistics on component mount
  useEffect(() => {
    if (!userId) return;
    
    const loadMiningStats = async () => {
      try {
        // Load from localStorage or calculate from activities
        const storedStats = localStorage.getItem(`mining_stats_${userId}`);
        if (storedStats) {
          setMiningStats(JSON.parse(storedStats));
        }
        
        // Calculate streak from recent mining activities
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

  // Allow claiming anytime there's balance (including during mining)
  const canClaim = (claimableRZC > 0 || accumulatedRZC > 0) && !isLoadingBalance && !isClaiming && claimCooldownRemaining === 0;

  // Track claim cooldown timer
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
        // Clear localStorage when cooldown expires
        localStorage.removeItem(`last_claim_time_${userId}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastClaimTime, userId]);

  // Check withdrawal eligibility
  // const checkWithdrawalEligibility = async () => {
  //   if (!userId) return;

  //   try {
  //     // Using the imported function
  //     const eligibility = await checkWeeklyWithdrawalEligibility(userId);
  //     setWithdrawalEligibility(eligibility);
  //   } catch (error) {
  //     console.error('Error checking withdrawal eligibility:', error);
  //   }
  // };


  // Load team members
  // const loadTeamMembers = async () => {
  //   if (!userId) return;
    
  //   setIsLoadingTeam(true);
  //   try {
  //     const { data: referrals, error } = await supabase
  //       .from('referrals')
  //       .select(`
  //         *,
  //         referred:users!referred_id(
  //           id,
  //           username,
  //           created_at,
  //           is_active,
  //           total_earned,
  //           total_deposit
  //         )
  //       `)
  //       .eq('sponsor_id', userId)
  //       .order('created_at', { ascending: false });

  //     if (error) throw error;
      
  //     setTeamMembers(referrals || []);
  //   } catch (error) {
  //     console.error('Error loading team members:', error);
  //   } finally {
  //     setIsLoadingTeam(false);
  //   }
  // };

  // Load last claim time from localStorage on mount
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
        // Cooldown expired, clear localStorage
        localStorage.removeItem(`last_claim_time_${userId}`);
      }
    }
  }, [userId]);

  // Load user upgrades
  const loadUserUpgrades = async () => {
    if (!userId) return;
    
    try {
      // Check if user has purchased upgrades
      const { data: activities } = await supabase
        .from('activities')
        .select('type')
        .eq('user_id', userId)
        .in('type', ['mining_rig_mk2', 'extended_session']);
      
      const upgrades = {
        miningRigMk2: activities?.some(a => a.type === 'mining_rig_mk2') || false,
        extendedSession: activities?.some(a => a.type === 'extended_session') || false
      };
      
      setUserUpgrades(upgrades);
      
      // Set mining rate multiplier based on upgrades
      if (upgrades.miningRigMk2) {
        setMiningRateMultiplier(1.25);
      }
    } catch (error) {
      console.error('Error loading user upgrades:', error);
    }
  };

  // Combined data loading for performance
  useEffect(() => {
      if (!userId) return;

    const loadAllData = async () => {
      try {
        setIsLoadingMiningData(true);
        setIsLoadingBalance(true);
        
        // Step 1: Sequential, critical initializations
        // These must run first and in order.
        await initializeFreeMiningPeriod(userId);
        const code = await ensureUserHasSponsorCode(userId, userUsername);
        setSponsorCode(code);

        // Load user upgrades
        await loadUserUpgrades();

        // Step 2: Parallel data fetching for speed
        // Most data can be fetched at the same time.
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
        
        // Check for errors from Supabase queries
        if (sponsorQueryResult.error && sponsorQueryResult.error.code !== 'PGRST116') {
          console.warn('Sponsor query error:', sponsorQueryResult.error);
        }
        if (referralStatsResult.error) {
          console.warn('Referral stats error:', referralStatsResult.error);
        } else if (referralStatsResult.data) {
          const active = referralStatsResult.data.filter(r => r.status === 'active').length;
          console.log('User Referral Stats:', { active, total: referralStatsResult.data.length, rawData: referralStatsResult.data });
          setReferralStats({ active, total: referralStatsResult.data.length });
        }
        if (teamMembersResult.error) {
          console.warn('Team members error:', teamMembersResult.error);
        } else {
          setTeamMembers(teamMembersResult.data || []);
        }
        
        // Step 3: Set state from parallel fetches
        setClaimableRZC(rzcBalance.claimableRZC);
        setTotalEarnedRZC(rzcBalance.totalEarned);
        setClaimedRZC(rzcBalance.claimedRZC);
        
        // Initialize claim cooldown if user has claimed before
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
        
        // Update loading states
        setIsLoadingBalance(false);

        // Set sponsor info (handle case where user has no sponsor)
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

        // Step 4: Handle active session logic (conditionally sequential)
        if (activeSession) {
          const now = new Date();
          const endTime = new Date(activeSession.end_time);
          if (now >= endTime) {
            // Session expired - silently rollover to keep mining
            await rolloverSession();
          } else {
            // Session is active and valid
            setCurrentSession(activeSession);
            setIsMining(true);
            // Compute and store session duration in hours for diagnostics
            const durationMs = new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime();
            setSessionDurationHours(Math.max(0, durationMs / (1000 * 60 * 60)));
            
            // Determine the correct start time for accumulation. If the user has claimed *during* this session,
            // we need to calculate accumulated rewards from the last claim time to avoid "re-earning" what was
            // just claimed. Otherwise, we start from the beginning of the session.
            const sessionStartTime = new Date(activeSession.start_time);
            const lastClaimTime = rzcBalance.lastClaimTime ? new Date(rzcBalance.lastClaimTime) : new Date(0); // Use epoch if no claim time
          
            const accumulationStartTime = lastClaimTime > sessionStartTime ? lastClaimTime : sessionStartTime;
            
            // Set the `lastClaimDuringMining` state, which is used by the interval calculator.
            // This ensures that even on the first load, the interval knows where to start from.
            if (lastClaimTime > sessionStartTime) {
              setLastClaimDuringMining(lastClaimTime);
            } else {
              setLastClaimDuringMining(null);
            }

            // Also, calculate the initial accumulated RZC immediately on load.
            // This prevents a flicker where the balance shows 0 before the interval kicks in.
            const now = new Date();
            const elapsedSeconds = Math.max(0, (now.getTime() - accumulationStartTime.getTime()) / 1000);
            const RZC_PER_DAY = 50; // Make sure this is defined or imported
            const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);
            const initialAccumulated = elapsedSeconds * RZC_PER_SECOND;
            setAccumulatedRZC(initialAccumulated);
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

  // Check withdrawal eligibility on component mount and when userId changes
  // useEffect(() => {
  //   checkWithdrawalEligibility();
  // }, [userId]);

  // Note: Removed duplicate useEffect that was causing referral data to flash/disappear
  // All data loading is now handled in the main useEffect above

  // Load leaderboard data - using ReferralSystem approach
  useEffect(() => {
    if (!userId) return;

    const loadLeaderboards = async () => {
      setIsLoadingLeaderboards(true);
      try {
        // Get sponsor stats with counts (same approach as ReferralSystem)
        // Query both sponsor_id and referrer_id for compatibility
        const { data: sponsorStatsData } = await supabase
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
            referrer:users!referrer_id(
              username,
              total_earned,
              total_deposit,
              rank
            ),
            status
          `);

        console.log('Leaderboard - Raw Sponsor Stats Data:', sponsorStatsData);
        console.log('Leaderboard - Data length:', sponsorStatsData?.length);

        if (!sponsorStatsData) {
          console.log('Leaderboard - No sponsor stats data found');
          setTopReferrers([]);
          // Get top claimers separately
          const claimersResult = await supabase
            .from('users')
            .select('id, username, total_earned')
            .gt('total_earned', 0)
            .order('total_earned', { ascending: false })
            .limit(5);
          
          if (!claimersResult.error) {
            setTopClaimers(claimersResult.data || []);
          }
          return;
        }

        console.log('Leaderboard - Processing', sponsorStatsData.length, 'referrals');
        
        // Count referrals per sponsor (same logic as ReferralSystem)
        // Handle both sponsor_id and referrer_id for backward compatibility
        const counts = sponsorStatsData.reduce((acc: { [key: string]: any }, curr: any) => {
          // Use sponsor_id if available, otherwise fall back to referrer_id
          const id = curr.sponsor_id || curr.referrer_id;
          const sponsorData = curr.sponsor || curr.referrer;
          
          if (!acc[id] && id) {
            acc[id] = {
              sponsor_id: id,
              username: sponsorData?.username,
              referral_count: 0,
              active_referrals: 0,
              total_earned: sponsorData?.total_earned || 0,
              total_deposit: sponsorData?.total_deposit || 0,
              rank: sponsorData?.rank || 'NOVICE'
            };
          }
          
          if (id) {
            acc[id].referral_count++;
            if (curr.status === 'active' || curr.status === 'ACTIVE') {
              acc[id].active_referrals++;
            }
          }
          
          return acc;
        }, {});

        const sponsorStats = Object.values(counts);
        
        console.log('Leaderboard - All Sponsor Stats:', sponsorStats);
        console.log('Leaderboard - Total Sponsors:', sponsorStats.length);
        
        // Sort by active_referrals and get top 5
        const topReferrersList = sponsorStats
          .sort((a: any, b: any) => b.active_referrals - a.active_referrals)
          .slice(0, 5);
        
        console.log('Leaderboard - Top 5 Referrers:', topReferrersList);
        setTopReferrers(topReferrersList);

        // Also get top claimers based on total_earned
        const claimersResult = await supabase
          .from('users')
          .select('id, username, total_earned')
          .gt('total_earned', 0)
          .order('total_earned', { ascending: false })
          .limit(5);
        
        if (!claimersResult.error) {
          setTopClaimers(claimersResult.data || []);
        }
      } catch (error) {
        console.error('Error loading leaderboards:', error);
      } finally {
        setIsLoadingLeaderboards(false);
      }
    };

    loadLeaderboards();
  }, [userId]);

  // Check and show Telegram popup daily
  useEffect(() => {
    if (!userId) return;

    const checkTelegramPopup = () => {
      const storageKey = `telegram_popup_shown_${userId}`;
      const lastShown = localStorage.getItem(storageKey);
      
      if (!lastShown) {
        // First time, show immediately
        setShowTelegramPopup(true);
      } else {
        // Check if 24 hours have passed
        const lastShownDate = new Date(lastShown);
        const now = new Date();
        const hoursSinceLastShown = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastShown >= 24) {
          setShowTelegramPopup(true);
        }
      }
    };

    // Wait a bit after component loads before showing popup
    const timer = setTimeout(() => {
      checkTelegramPopup();
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer);
  }, [userId]);

  // Calculate accumulated RZC based on mining time
  useEffect(() => {
    let miningInterval: NodeJS.Timeout;

    if (isMining && currentSession && userId) {
      miningInterval = setInterval(async () => {
        const now = new Date();
        const startTime = new Date(currentSession.start_time);
        const endTime = new Date(currentSession.end_time);
        const remainingSeconds = (endTime.getTime() - now.getTime()) / 1000;

        if (remainingSeconds <= 0) {
          // Session completed - rollover to a new one to keep mining
          await rolloverSession();
          clearInterval(miningInterval);
        } else {
          // Update countdown
          const hours = Math.floor(remainingSeconds / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = Math.floor(remainingSeconds % 60);
          setSessionCountdown(`${hours}h ${minutes}m ${seconds}s`);

          // Calculate accumulated RZC
          // If user claimed during mining, calculate from the last claim time
          // Otherwise, calculate from session start
          const baseTime = lastClaimDuringMining || startTime;
          const timeSinceBase = (now.getTime() - baseTime.getTime()) / 1000;
          const earnedRZC = timeSinceBase * RZC_PER_SECOND;
          const previousAccumulated = accumulatedRZC;
          setAccumulatedRZC(earnedRZC);
          
          // Show earning animation when RZC increases significantly
          if (earnedRZC - previousAccumulated > 0.001) {
            setRecentEarnings(earnedRZC - previousAccumulated);
            setShowEarningAnimation(true);
            setTimeout(() => setShowEarningAnimation(false), 2000);
          }
          
          // Check for milestones (every 1 RZC earned)
          const currentMilestone = Math.floor(earnedRZC);
          if (currentMilestone > lastMilestone) {
            setLastMilestone(currentMilestone);
            
            // Check for achievements
            checkAchievements(currentMilestone, miningStreak);
            
            // Play milestone sound and trigger celebration
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

  // Validate that extended sessions run close to 48h when upgrade is owned
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

  // Try to auto-start mining if backend allows
  const maybeAutoStartMining = async () => {
    if (!userId || isMining) return;
    try {
      // Unrestricted auto-start for nonstop mining
      const res = await startMiningSessionUnrestricted(userId);
      if (res.success) {
        // Fetch the active session and set mining state
        const active = await getActiveMiningSession(userId);
        if (active) {
          setCurrentSession(active);
          setIsMining(true);
        }
      }
    } catch (err) {
      // no-op
    }
  };

  // Background auto-starter: periodically check if we can start mining and do so
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      if (!isMining) {
        maybeAutoStartMining();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [userId, isMining]);

  // Auto-validation: every 30 minutes ensure session/balance are consistent
  useEffect(() => {
    if (!userId) return;

    const validateMiningState = async () => {
      try {
        // Refresh balances and free mining status for UI
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

        // Validate session: rollover if ended, or auto-start if missing
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

    // Run immediately, then every 30 minutes
    validateMiningState();
    const interval = setInterval(validateMiningState, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, isMining]);

  // Persist last seen time periodically for offline rewards/resume logic
  useEffect(() => {
    if (!userId) return;
    const key = `last_seen_${userId}`;
    const write = () => localStorage.setItem(key, new Date().toISOString());
    write();
    const interval = setInterval(write, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Handle returning to the app: complete missed sessions and restart mining
  const handleResume = async () => {
    if (!userId) return;
    const key = `last_seen_${userId}`;
    const lastSeenStr = localStorage.getItem(key);
    const now = new Date();
    let sessionsCompleted = 0;

    try {
      // If we had an active session that may have ended, complete and roll until up-to-date
      let active = currentSession || (await getActiveMiningSession(userId));
      let safety = 0;
      while (active && new Date(active.end_time) <= now && safety < 10) {
        const result = await manualCompleteMiningSession(active.id);
        if (result?.success) {
          sessionsCompleted++;
          // Refresh balances and permissions
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
          // Start a new unrestricted session to continue auto-mining
          const startRes = await startMiningSessionUnrestricted(userId);
          if (startRes.success) {
            // no-op; next iteration will fetch active session
          }
        }
        // Fetch next active session (if any)
        active = await getActiveMiningSession(userId);
        safety++;
      }

      // If no active session after catching up, try to start one unrestricted
      if (!active) {
        await maybeAutoStartMining();
      } else {
        setCurrentSession(active);
        setIsMining(true);
      }

      // Show approximate offline earnings info
      if (lastSeenStr) {
        const lastSeen = new Date(lastSeenStr);
        const offlineSeconds = Math.max(0, Math.floor((now.getTime() - lastSeen.getTime()) / 1000));
        if (offlineSeconds > 60) {
          const approxEarned = offlineSeconds * RZC_PER_SECOND;
          if (approxEarned > 0) {
            showSnackbar?.({
              message: 'While you were away',
              description: `Estimated +${approxEarned.toFixed(6)} RZC earned offline${sessionsCompleted > 0 ? ` · ${sessionsCompleted} session(s) completed` : ''}.`
            });
          }
        }
      }
    } catch (err) {
      // Silent resume errors
    } finally {
      localStorage.setItem(key, now.toISOString());
    }
  };

  // Resume listeners: when tab becomes visible or window gains focus
  useEffect(() => {
    if (!userId) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleResume();
      }
    };
    const onFocus = () => handleResume();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, currentSession, isMining]);

  // Start mining function (enhanced with proper session tracking)
  const startMining = async () => {
    if (!userId || isMining || !canStartMining) return;

    try {
      const result = await startMiningSession(userId);
      if (result.success) {
        setIsMining(true);
        setAccumulatedRZC(0);
        setLastClaimDuringMining(null); // Reset claim tracking for new session
        
        // Record mining start activity
        await recordMiningActivity(userId, 'mining_start', 0);
        
        // Play mining start sound
        playSound('mining_start');
        
        // Update free mining session count
        await updateFreeMiningSessionCount(userId);
        
        // Refresh session data and free mining status
        const [activeSession, updatedFreeMining] = await Promise.all([
          getActiveMiningSession(userId),
          getFreeMiningStatus(userId)
        ]);
        
        if (activeSession) {
          setCurrentSession(activeSession);
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

  // Complete the current session and immediately continue mining
  const rolloverSession = async () => {
    if (!userId || !isMining || !currentSession) return;

    try {
      const result = await manualCompleteMiningSession(currentSession.id);
      if (result.success) {
        // Record mining completion activity
        await recordMiningActivity(userId, 'mining_complete', result.rzcEarned || 0);
        
        setIsMining(false);
        setCurrentSession(null);
        setAccumulatedRZC(0);
        setLastClaimDuringMining(null);

        // Refresh RZC balance and free mining status
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
        // Immediately start a new unrestricted session to keep mining nonstop
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

  // Claim rewards function
  const claimRewards = async () => {
    if (!userId) {
      showSnackbar?.({
        message: 'Error',
        description: 'User not found.'
      });
      return;
    }

    // Check if there's any balance to claim
    const availableBalance = claimableRZC + (isMining ? accumulatedRZC : 0);
    
    if (availableBalance <= 0) {
      showSnackbar?.({
        message: 'No Balance to Claim',
        description: 'Start mining to earn RZC first.'
      });
      return;
    }

    // Check cooldown (5 minutes)
    if (claimCooldownRemaining > 0) {
      showSnackbar?.({
        message: 'Cooldown Active',
        description: `Please wait ${formatCooldownTime(claimCooldownRemaining)} before claiming again.`
      });
      return;
    }

    // Prevent double clicks
    if (isClaiming) return;

        try {
      setIsLoadingBalance(true);
      
      // Determine how much to claim
      // Priority: claim accumulated RZC during active session first, then claimable balance
      let amountToClaim = 0;
      
      if (isMining && accumulatedRZC > 0) {
        // If actively mining, claim the accumulated amount from the current session
        // This immediately adds it to claimable balance and then claims it
        amountToClaim = accumulatedRZC;
      } else if (claimableRZC > 0) {
        // Otherwise, claim from already accumulated balance
        amountToClaim = claimableRZC;
      }
      
      if (amountToClaim <= 0) {
        showSnackbar?.({
          message: 'No Balance to Claim',
          description: 'Start mining to earn RZC that you can claim instantly!'
        });
        setIsLoadingBalance(false);
        return;
      }
      
      // First, if mining, add accumulated RZC to claimable balance
      if (isMining && accumulatedRZC > 0) {
        try {
          // Record mining completion activity to add to claimable balance
          const { error: activityError } = await supabase.from('activities').insert({
            user_id: userId,
            type: 'mining_complete',
            amount: amountToClaim,
            status: 'completed',
            created_at: new Date().toISOString()
          });
          
          if (activityError) throw activityError;
          
          // Update the claimable balance state
          setClaimableRZC(prev => prev + amountToClaim);
        } catch (error) {
          console.error('Error adding accumulated RZC to balance:', error);
          // Show error but continue
          showSnackbar?.({
            message: 'Warning',
            description: 'Could not add accumulated RZC to claimable balance, but claiming will proceed.'
          });
        }
      }
      
      // Now claim the amount
      const result = await claimRZCRewards(userId, amountToClaim);
      
      if (result.success) {
        // Activity is already recorded in claimRZCRewards function
        
        // Set cooldown timer
        const now = new Date();
        setLastClaimTime(now);
        setClaimCooldownRemaining(30 * 60); // 30 minutes
        
        // Store last claim time in localStorage for persistence
        localStorage.setItem(`last_claim_time_${userId}`, now.toISOString());
        
        // Refresh RZC balance
        const updatedBalance = await getUserRZCBalance(userId);
        setClaimableRZC(updatedBalance.claimableRZC);
        setTotalEarnedRZC(updatedBalance.totalEarned);
        setClaimedRZC(updatedBalance.claimedRZC);

        // If we were mining and claimed accumulated RZC, DON'T reset to 0
        // Instead, set the last claim time so accumulation continues from this point
        if (isMining) {
          // Keep the accumulated RZC as is - don't reset to 0
          // Set the last claim time so accumulation restarts from this point
          setLastClaimDuringMining(new Date());
        }

        // Play claim sound and trigger celebration
        playSound('claim');
        triggerCelebration();
        
        showSnackbar?.({
          message: 'RZC Claimed Successfully!',
          description: `You claimed ${amountToClaim.toFixed(6)} RZC! Next claim available in 30 minutes.`
        });
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
  
  // Helper function to format cooldown time
  const formatCooldownTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Achievement checking function
  const checkAchievements = (rzcEarned: number, streak: number) => {
    const newAchievements: string[] = [];
    
    // RZC earning achievements
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
    
    // Streak achievements
    if (streak >= 3 && !achievements.includes('streak_3')) {
      newAchievements.push('streak_3');
    }
    if (streak >= 7 && !achievements.includes('streak_7')) {
      newAchievements.push('streak_7');
    }
    if (streak >= 30 && !achievements.includes('streak_30')) {
      newAchievements.push('streak_30');
    }
    
    // Update achievements
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      const latestAchievement = newAchievements[newAchievements.length - 1];
      setShowAchievement(latestAchievement);
      setTimeout(() => setShowAchievement(null), 5000);
    }
  };

  // Get achievement display info
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

  // Sound effects
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

  // Celebration effect
  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // Helper function to get icon for activity
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
    // Default activity icon
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  };

  // Helper function to get icon for withdrawal status
  const getWithdrawalIcon = (status: string) => {
    if (status === 'PENDING') {
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status === 'FAILED') {
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };


  return (
    <div className="w-full max-w-md mx-auto bg-gray-900/80 border-2 border-green-700/50 rounded-2xl shadow-neon-green-light overflow-hidden flex flex-col backdrop-blur-md sm:max-w-lg md:max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-green-700/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-900/50 border-2 border-green-600/70 flex items-center justify-center">
            {/* Placeholder for an icon */}
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-green-300">{t('rzc_core_title')}</h2>
            <p className="text-xs text-green-500">{t('rzc_core_subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-green-900/50 text-green-400 hover:bg-green-800/50' 
                : 'bg-gray-800/50 text-gray-500 hover:bg-gray-700/50'
            }`}
            title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            )}
          </button>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isMining ? 'bg-green-400 shadow-neon-green' : 'bg-gray-600'} animate-pulse" />
        </div>
      </div>

      {/* Wallet Content */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
{(referralCode || sponsorCode) && (
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-green-300 leading-tight">{t('your_referral_code')}</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="min-w-0 flex-1 bg-gray-900/60 border border-gray-700 rounded-md px-2 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-[11px] text-green-300 font-mono tracking-wider truncate">
                          {`https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const codeToCopy = `https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`;
                          if (!codeToCopy) throw new Error('No Link to copy');
                          await navigator.clipboard.writeText(codeToCopy);
                          showSnackbar?.({ message: t('copy_success') });
                        } catch (error) {
                          showSnackbar?.({ message: t('copy_failed') });
                        }
                      }}
                      className="px-2 py-1 bg-green-600/80 text-white rounded-md text-[11px] font-semibold hover:bg-green-500/80 transition-colors border border-green-500/80 whitespace-nowrap"
                      aria-label="Copy referral link"
                    >
                      {t('copy')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        {/* Enhanced Futuristic Display with Animations */}
        <div className="text-center p-3 sm:p-4 rounded-lg bg-gray-800/50 border border-green-800/30 relative overflow-hidden">
          {/* Background Effects */}
          {isMining && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse pointer-events-none z-0" />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-2xl animate-ping pointer-events-none z-0" />
            </>
          )}
          
          {/* Earning Animation Overlay */}
          {showEarningAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-green-400 text-2xl font-bold animate-bounce">
                +{recentEarnings.toFixed(6)} RZC
              </div>
            </div>
          )}
          
          <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center relative ${isMining ? 'bg-green-900/50 border-2 border-green-500 animate-pulse-slow' : 'bg-gray-800/50 border-2 border-gray-600'}`}>
            {/* Rotating Ring for Active Mining */}
            {isMining && (
              <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-spin" style={{ animationDuration: '3s' }} />
            )}
            
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center relative ${isMining ? 'bg-green-700/60 border-2 border-green-400' : 'bg-gray-700/60 border-2 border-gray-500'}`}>
              {/* Pulsing Core */}
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full relative ${isMining ? 'bg-green-400 shadow-neon-green' : 'bg-gray-600'}`}>
                {isMining && (
                  <div className="absolute inset-0 rounded-full bg-green-300 animate-ping" />
                )}
              </div>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-green-300 tabular-nums">
            {isLoadingBalance ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm sm:text-base">---------</span>
              </div>
            ) : (
              (claimableRZC + (isMining ? accumulatedRZC : 0)).toFixed(6)
            )}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-green-500 mb-2">
            {isLoadingBalance ? 'initializing.' : t('total_rzc_balance')}
          </p>
          {!isLoadingBalance && (
            <div className="text-xs text-gray-400 mt-2 mb-2 space-y-1">
              {/* <div className="flex justify-between">
                <span>Claimable:</span>
                <span className="text-yellow-300">{claimableRZC.toFixed(6)} RZC</span>
              </div> */}
              {isMining && accumulatedRZC > 0 && (
                <div className="flex justify-between">
                  <span>{t('mining_label')}</span>
                  <span className="text-green-300">{accumulatedRZC.toFixed(6)} RZC</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('validated_label')}</span>
                <span className="text-purple-300">{claimedRZC.toFixed(6)} RZC</span>
              </div>
              
              {/* Enhanced Statistics */}
            </div>
          )}
          {/* <p className="text-xs text-gray-400 tabular-nums">
            ≈ ${((isMining ? accumulatedRZC : claimableRZC) * tonPrice).toFixed(4)} USD
          </p> */
          
          <div className="relative z-20 space-y-2 sm:space-y-3">
          <button
            onClick={startMining}
            disabled={isMining || !canStartMining}
            className="w-full bg-green-900/50 border-2 border-green-600/70 text-green-300 font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm
                       hover:bg-green-800/60 hover:border-green-500 hover:shadow-neon-green
                       disabled:bg-gray-800/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {isMining ? (
              <>
                <span>{t('mining_in_progress')}</span>
              </>
            ) : !canStartMining ? (
              <>
                <span>{t('mining_unavailable')}</span>
              </>
            ) : (
              <>
                <span>{t('initiate_mining')}</span>
              </>
            )}
          </button>
          {false && (
            <button 
              onClick={claimRewards}
              disabled={!canClaim || isLoadingBalance || claimCooldownRemaining > 0}
              className="w-full bg-yellow-900/50 border-2 border-yellow-600/70 text-yellow-300 font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm
                        hover:bg-yellow-800/60 hover:border-yellow-500 hover:shadow-neon-yellow
                        disabled:bg-gray-800/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {claimCooldownRemaining > 0 ? (
                <span>⏳ COOLDOWN: {formatCooldownTime(claimCooldownRemaining)}</span>
              ) : (claimableRZC + (isMining ? accumulatedRZC : 0)) > 0 ? (
                <span>🎯 VALIDATE {(claimableRZC + (isMining ? accumulatedRZC : 0)).toFixed(6)} RZC</span>
              ) : (
                <span>🎯 VALIDATE 0.000000 RZC</span>
              )}
            </button>
          )}
        </div>}
            
        </div>

       

        {/* Enhanced Mining Status */}
        <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              <span className={isMining ? 'text-green-400' : 'text-gray-400'}>
                {isLoadingMiningData ? 'Loading...' : (isMining ? t('system_online') : t('system_standby'))}
              </span>
              {isMining && userUpgrades.extendedSession && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-green-900/40 border border-green-700 text-green-300 animate-pulse">EXTENDED 48H</span>
              )}
              {miningStreak > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-orange-900/40 border border-orange-700 text-orange-300">
                  🔥 {miningStreak} DAY STREAK
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-green-400 font-semibold text-xs sm:text-sm">
                {RZC_PER_DAY * miningRateMultiplier} RZC/24h
                {miningRateMultiplier > 1 && (
                  <span className="text-yellow-400 ml-1">(+{Math.round((miningRateMultiplier - 1) * 100)}%)</span>
                )}
              </span>
              {achievements.length > 0 && (
                <div className="text-[10px] text-yellow-400 mt-1">
                  🏆 {achievements.length} Achievement{achievements.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Free Mining Status Display */}
          {freeMiningStatus.isActive && (
            <div className={`border rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 ${
              freeMiningStatus.isInGracePeriod 
                ? 'bg-yellow-900/30 border-yellow-600/50' 
                : 'bg-green-900/30 border-green-600/50'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className={`font-semibold ${
                  freeMiningStatus.isInGracePeriod ? 'text-yellow-300' : 'text-green-300'
                }`}>
                  {freeMiningStatus.isInGracePeriod ? 'GRACE PERIOD' : 'FREE MINING PERIOD'}
                </span>
                <div className="text-right">
                  <div className={`${
                    freeMiningStatus.isInGracePeriod ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {freeMiningStatus.daysRemaining > 0 ? `${freeMiningStatus.sessionsRemaining} days left` : 'Expired'}
                  </div>
                  {/* <div className="text-gray-400 text-[10px]">
                    {freeMiningStatus.sessionsRemaining} sessions remaining
                  </div> */}
                </div>
              </div>
              {freeMiningStatus.isInGracePeriod && (
                <div className="text-[10px] text-yellow-300 mt-1">
                  Limited mining available - stake TON for full access
                </div>
              )}
            </div>
          )}
          
            <div className="text-center text-[10px] text-gray-400 font-mono h-4">
            {isMining && (
              <span>{t('session_ends_in')}: {sessionCountdown} | {t('continuous_mining')}</span>
            )}
            {!isMining && !canStartMining && (
              <span className="text-green-400">{t('validating_node')}</span>
            )}
            {!isMining && canStartMining && (
              <span>{t('ready_to_mine')}</span>
            )}
          </div>
          
          {/* Mining Progress Bar */}
          {isMining && currentSession && (
            <div className="mt-2 sm:mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{t('session_progress')}</span>
                <span>{(() => {
                  const start = new Date(currentSession.start_time).getTime();
                  const end = new Date(currentSession.end_time).getTime();
                  const nowMs = Date.now();
                  const pct = Math.max(0, Math.min(100, ((nowMs - start) / Math.max(1, (end - start))) * 100));
                  return pct.toFixed(1);
                })()}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(() => {
                    const start = new Date(currentSession.start_time).getTime();
                    const end = new Date(currentSession.end_time).getTime();
                    const nowMs = Date.now();
                    const pct = Math.max(0, Math.min(100, ((nowMs - start) / Math.max(1, (end - start))) * 100));
                    return pct;
                  })()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t('claimable')}: {claimableRZC.toFixed(2)}</span>
                <span>{t('mining_label')} {accumulatedRZC.toFixed(2)}</span>
                <span>{t('total')}: {(claimableRZC + accumulatedRZC).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {/* Stats */}
        {/* <div className="flex gap-4">
          <div className="flex-1 text-center bg-gray-800/50 border border-green-800/30 rounded-lg p-3">
            <p className="text-xl font-bold text-green-300 tabular-nums">{totalWithdrawnTon.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Total Claimed</p>
          </div>
          <div className="flex-1 text-center bg-gray-800/50 border border-green-800/30 rounded-lg p-3">
            <p className="text-xl font-bold text-green-300 tabular-nums">{Number(airdropBalanceNova ?? 0).toFixed(2)}</p>
            <p className="text-xs text-gray-400">Airdrop</p>
          </div>
        </div> */}
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-900/50 border-t-2 border-green-700/50">
        <button
          onClick={() => setActiveTab('mining')}
          className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === 'mining' ? 'bg-green-900/70 text-green-300 shadow-neon-green-inset' : 'text-gray-500 hover:bg-gray-800/50'}`}
        >
          MINING
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 border-l border-r border-green-700/50 ${activeTab === 'activity' ? 'bg-green-900/70 text-green-300 shadow-neon-green-inset' : 'text-gray-500 hover:bg-gray-800/50'}`}
        >
          ACTIVITY
        </button>
        <button
          onClick={() => setActiveTab('referral')}
          className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === 'referral' ? 'bg-green-900/70 text-green-300 shadow-neon-green-inset' : 'text-gray-500 hover:bg-gray-800/50'}`}
        >
          NETWORK
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/30 min-h-[180px] sm:min-h-[200px]">
        
        {/* ================================================================== */}
        {/* == MODIFIED MINING TAB CONTENT == */}
        {/* ================================================================== */}
        {activeTab === 'mining' && (
          <div className="p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-green-300 mb-3 text-center">{t('mining_upgrades')}</h3>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {/* Mining Rig Upgrade */}
              <div className="bg-gray-800/70 border border-green-700/50 p-2 sm:p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-green-400">{t('mining_rig_mk2')}</h4>
                  <p className="text-xs sm:text-sm text-gray-400">{t('increases_mining_rate')}</p>
                </div>
                <button 
                  onClick={async () => {
                    if (!userId || claimedRZC < 10 || userUpgrades.miningRigMk2) return;
                    
                    try {
                      const result = await purchaseUpgrade(userId, 'mining_rig_mk2', 10);
                      if (result.success) {
                        // Refresh user data to reflect the purchase
                        const updatedBalance = await getUserRZCBalance(userId);
                        setClaimedRZC(updatedBalance.claimedRZC);
                        await loadUserUpgrades(); // This will refetch and set the new state
                        
                        showSnackbar?.({
                          message: 'Upgrade Purchased!',
                          description: 'Mining Rig Mk. II activated. Mining rate increased by 25%!'
                        });
                      } else {
                        showSnackbar?.({
                          message: 'Upgrade Failed',
                          description: result.error || 'Could not purchase upgrade.'
                        });
                      }
                    } catch (error) {
                      console.error('Error purchasing upgrade:', error);
                      showSnackbar?.({
                        message: 'Upgrade Failed',
                        description: 'An error occurred while purchasing the upgrade.'
                      });
                    }
                  }}
                  disabled={claimedRZC < 10 || userUpgrades.miningRigMk2}
                  className={`font-semibold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors w-full sm:w-auto ${
                    userUpgrades.miningRigMk2 
                      ? 'bg-green-600 text-white cursor-default' 
                      : claimedRZC >= 10 
                        ? 'bg-green-900/50 border-2 border-green-600/70 text-green-300 hover:bg-green-800/60' 
                        : 'bg-gray-800/50 border-2 border-gray-600/70 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {userUpgrades.miningRigMk2 ? '✓ PURCHASED' : claimedRZC >= 10 ? '10 RZC' : 'Insufficient RZC'}
                </button>
              </div>
              
              {/* Extended Session Upgrade */}
              <div className="bg-gray-800/70 border border-green-700/50 p-2 sm:p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-green-400">{t('extended_session')}</h4>
                  <p className="text-xs sm:text-sm text-gray-400">{t('allows_mining_48h')}</p>
                </div>
                <button 
                  onClick={async () => {
                    if (!userId || claimedRZC < 5 || userUpgrades.extendedSession) return;
                    
                    try {
                      const result = await purchaseUpgrade(userId, 'extended_session', 5);
                      if (result.success) {
                        // Refresh user data to reflect the purchase
                        const updatedBalance = await getUserRZCBalance(userId);
                        setClaimedRZC(updatedBalance.claimedRZC);
                        await loadUserUpgrades();
                        
                        showSnackbar?.({
                          message: 'Upgrade Purchased!',
                          description: 'Extended Session activated. Next session will last 48 hours!'
                        });
                      } else {
                        showSnackbar?.({
                          message: 'Upgrade Failed',
                          description: result.error || 'Could not purchase upgrade.'
                        });
                      }
                    } catch (error) {
                      console.error('Error purchasing upgrade:', error);
                      showSnackbar?.({
                        message: 'Upgrade Failed',
                        description: 'An error occurred while purchasing the upgrade.'
                      });
                    }
                  }}
                  disabled={claimedRZC < 5 || userUpgrades.extendedSession}
                  className={`font-semibold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors w-full sm:w-auto ${
                    userUpgrades.extendedSession 
                      ? 'bg-green-600 text-white cursor-default' 
                      : claimedRZC >= 5 
                        ? 'bg-green-900/50 border-2 border-green-600/70 text-green-300 hover:bg-green-800/60' 
                        : 'bg-gray-800/50 border-2 border-gray-600/70 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {userUpgrades.extendedSession ? '✓ PURCHASED' : claimedRZC >= 5 ? '5 RZC' : 'Insufficient RZC'}
                </button>
              </div>
            </div>
            <p className="text-center text-gray-500 text-xs mt-3 sm:mt-4">{t('more_upgrades_coming')}</p>
          </div>
        )}
        {/* ================================================================== */}
        {/* == END OF MODIFIED MINING TAB CONTENT == */}
        {/* ================================================================== */}

        {activeTab === 'activity' && (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Withdrawal Activity Summary */}
            {props.withdrawals && props.withdrawals.length > 0 && (
              <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-green-300">Withdrawal Activity</h4>
                    <p className="text-xs text-gray-400">Your withdrawal history</p>
                  </div>
                  {/* Placeholder for icon */}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base sm:text-lg font-bold text-green-400">{props.withdrawals.filter(w => w.status === 'COMPLETED').length}</p>
                    <p className="text-xs text-gray-400">Completed</p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-bold text-yellow-400">{props.withdrawals.filter(w => w.status === 'PENDING').length}</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-bold text-green-300">{props.withdrawals.reduce((sum, w) => sum + (w.status === 'COMPLETED' ? w.amount : 0), 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Total Paid</p>
                  </div>
                </div>
              </div>
            )}

            {props.isLoadingActivities ? (
              <div className="flex justify-center items-center h-20 sm:h-24">
                {/* Placeholder for loading spinner */}
                <span className="text-gray-400 text-sm">Loading Activities...</span>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {/* Regular Activities */}
                {props.activities && props.activities.length > 0 && props.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/40 border border-gray-700/50 rounded-lg">
                    {/* Activity icon */}
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                      {getActivityIcon(a.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold uppercase text-gray-200 truncate">{a.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-semibold text-green-300">{typeof a.amount === 'number' ? a.amount.toFixed(6) : a.amount} {a.type === 'nova_reward' ? 'RZC' : 'RZC'}</p>
                      <p className="text-xs text-gray-400 capitalize">{a.status}</p>
                    </div>
                  </div>
                ))}

                {/* Withdrawal Activities Header */}
                {props.withdrawals && props.withdrawals.length > 0 && (
                  <div className="flex justify-between items-baseline pt-2">
                    <h4 className="font-semibold text-gray-300">Recent Withdrawals</h4>
                    <p className="text-xs text-gray-500">{props.withdrawals.length} total</p>
                  </div>
                )}

                {/* Enhanced Withdrawal Activities */}
                {props.withdrawals && props.withdrawals.length > 0 && props.withdrawals.slice(0, 5).map((w) => (
                  <div key={`withdrawal-${w.id}`} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    w.status === 'PENDING' ? 'bg-yellow-900/20 border-yellow-700/50' :
                    w.status === 'COMPLETED' ? 'bg-green-900/20 border-green-700/50' :
                    w.status === 'FAILED' ? 'bg-red-900/20 border-red-700/50' :
                    'bg-gray-800/20 border-gray-700/50'
                  }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${
                      w.status === 'PENDING' ? 'bg-yellow-900/50 border-yellow-600/70 text-yellow-300' :
                      w.status === 'COMPLETED' ? 'bg-green-900/50 border-green-600/70 text-green-300' :
                      w.status === 'FAILED' ? 'bg-red-900/50 border-red-600/70 text-red-300' :
                      'bg-gray-800/50 border-gray-600/70 text-gray-300'
                    }`}>
                      {/* Withdrawal status icon */}
                      {getWithdrawalIcon(w.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-200">
                        { w.status === 'PENDING' ? 'Withdrawal Pending' :
                          w.status === 'COMPLETED' ? 'Withdrawal Completed' :
                          w.status === 'FAILED' ? 'Withdrawal Failed' :
                          'Withdrawal Request'}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-200">{w.amount.toFixed(6)} RZC</p>
                      <div className={`text-xs font-semibold px-2 py-0.5 rounded-md inline-block mt-1 ${
                        w.status === 'PENDING' ? 'bg-yellow-800/50 text-yellow-300' :
                        w.status === 'COMPLETED' ? 'bg-green-800/50 text-green-300' :
                        w.status === 'FAILED' ? 'bg-red-800/50 text-red-300' :
                        'bg-gray-700/50 text-gray-300'
                      }`}>
                        {w.status}
                      </div>
                    </div>
                  </div>
                ))}

                {/* View All Withdrawals Button */}
                {props.withdrawals && props.withdrawals.length > 5 && (
                  <div className="pt-2">
                    {/* Placeholder for "View All" button */}
                    <button className="w-full text-sm text-green-400 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 border border-green-800/30">
                      View All Activity
                    </button>
                  </div>
                )}

                {/* No activities message */}
                {(!props.activities || props.activities.length === 0) && (!props.withdrawals || props.withdrawals.length === 0) && (
                  <div className="text-center py-10">
                    {/* Placeholder for empty state icon */}
                    <h4 className="font-semibold text-gray-400">No Recent Activity</h4>
                    <p className="text-sm text-gray-500">Your mining and activities will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Network Header */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-3 sm:p-4 text-center">
              <h3 className="text-base sm:text-lg font-semibold text-green-300 mb-2">🌐 Mining Network</h3>
              <p className="text-xs sm:text-sm text-gray-400">Build your mining team and earn together</p>
            </div>

            {/* Your Sponsor Code */}
            {/* <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-green-300">Your Referral Code</h4>
                  <p className="text-xs text-gray-400">Share to build your network</p>
                </div>
              </div>
              
              <div className="flex justify-center items-center gap-2 bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                <span className="text-xs font-bold text-green-300 font-mono tracking-wider">
                  https://t.me/rhizacore_bot?startapp={referralCode || sponsorCode}
                </span>
                <button
                  onClick={async () => {
                    try {
                      const codeToCopy = `https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`;
                      if (!codeToCopy) throw new Error("No Link to copy");
                      await navigator.clipboard.writeText(codeToCopy);
                      showSnackbar?.({ message: 'Referral Link copied!' });
                    } catch (error) {
                      showSnackbar?.({ message: 'Failed to copy Link!' });
                    }
                  }}
                  className="px-3 py-1.5 bg-green-600/80 text-white rounded-md text-sm font-semibold hover:bg-green-500/80 transition-colors border border-green-500/80"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Share this code to earn referral rewards</p>
            </div> */}

            {/* Upline Information */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-green-300">👆 Your Sponsor</h4>
                  <p className="text-xs text-gray-400">Who referred you</p>
                </div>
              </div>

              {sponsorInfo ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 border-2 border-green-600/70 flex items-center justify-center text-green-300 font-bold text-lg">
                    {sponsorInfo.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200">{sponsorInfo.username}</p>
                    <p className="text-xs text-gray-400 font-mono">Code: {sponsorInfo.code}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">
                  <p className="font-semibold">No Sponsor</p>
                  <p className="text-xs">You joined without a sponsor code</p>
                </div>
              )}
            </div>

            {/* Network Stats */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-green-300 mb-2 sm:mb-3 text-center">Network Statistics</h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center bg-gray-900/50 rounded-lg p-2 sm:p-3 border border-gray-700">
                  <p className="text-lg sm:text-2xl font-bold text-green-400">{referralStats.active}</p>
                  <p className="text-xs text-gray-400">Active Team</p>
                </div>
                <div className="text-center bg-gray-900/50 rounded-lg p-2 sm:p-3 border border-gray-700">
                  <p className="text-lg sm:text-2xl font-bold text-gray-300">{referralStats.total * 50} <span className="text-green-400">RZC</span></p>
                  <p className="text-xs text-gray-400">Total Earnings</p>
                </div>
              </div>
            </div>

            {/* Team Members List */}
            {referralStats.total > 0 && (
              <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-green-300">👇 Your Team ({referralStats.total})</h4>
                    <p className="text-xs text-gray-400">Your mining network members</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {teamMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="w-8 h-8 rounded-full bg-green-900/50 border border-green-600/70 flex items-center justify-center text-green-300 font-bold text-sm">
                        {member.referred?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-200">
                            {member.referred?.username || 'Unknown User'}
                          </p>
                          {member.referred?.total_deposit > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-900/50 text-green-300 rounded border border-green-600/50">
                              💎 Investor
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Joined: {new Date(member.created_at).toLocaleDateString()}
                        </p>
                        {/* <p className="text-xs text-gray-500">
                          Earned: {member.referred?.total_earned?.toFixed(2) || '0'} RZC
                        </p> */}
                      </div>
                      <div className="text-right">
                        <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                        <p className={`text-xs mt-1 ${member.status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>
                          {member.status === 'active' ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {teamMembers.length > 5 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">+{teamMembers.length - 5} more team members</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Team Members */}
            {referralStats.total === 0 && (
              <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h4 className="font-semibold text-gray-300 mb-2">No Team Members Yet</h4>
                <p className="text-sm text-gray-500 mb-4">Share your referral Link to build your mining network</p>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">Your Referral Link:</p>
                  <p className="text-sm text-green-300 font-mono break-all">
                    https://t.me/rhizacore_bot?startapp={referralCode || sponsorCode}
                  </p>
                </div>
              </div>
            )}

            {/* Network Benefits */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
              <h4 className="font-semibold text-green-300 mb-3 text-center">Network Benefits</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Earn RZC from team mining activities</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Bonus rewards for active team members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Network mining power boosts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Team upgrade discounts</span>
                </div>
              </div>
            </div>

            {/* Top Referrers Leaderboard */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-300">🏆 Top Referrers</h4>
                <span className="text-xs text-gray-400">Top Network Builders</span>
              </div>
              
              {isLoadingLeaderboards ? (
                <div className="flex justify-center items-center py-4">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : topReferrers.length > 0 ? (
                <div className="space-y-2">
                  {topReferrers.map((referrer: any, index) => (
                    <div key={referrer.sponsor_id || referrer.id} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                      <div className="text-lg font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-900/50 border border-green-600/70 flex items-center justify-center text-green-300 font-bold text-sm flex-shrink-0">
                        {referrer.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">
                          {referrer.username || 'Unknown'}
                        </p>
                        {/* {referrer.rank && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/50 text-blue-300">
                            {referrer.rank}
                          </span>
                        )} */}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">
                          {referrer.active_referrals || 0}
                        </p>
                        <p className="text-xs text-gray-400">Active Team</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No referrer data available</p>
              )}
            </div>

            {/* Top Claimers Leaderboard */}
            {/* <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-300">💰 Top Claimers</h4>
                <span className="text-xs text-gray-400">Most RZC Claimed</span>
              </div>
              
              {isLoadingLeaderboards ? (
                <div className="flex justify-center items-center py-4">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : topClaimers.length > 0 ? (
                <div className="space-y-2">
                  {topClaimers.map((claimer, index) => (
                    <div key={claimer.id} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-600 text-white' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-yellow-900/50 border border-yellow-600/70 flex items-center justify-center text-yellow-300 font-bold text-sm flex-shrink-0">
                        {claimer.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">
                          {claimer.username || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-400">
                          {claimer.total_earned?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-400">RZC</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No claimer data available</p>
              )}
            </div> */}
          </div>
        )}
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-green-500/20 animate-pulse" />
          <div className="absolute top-1/4 left-1/4 text-6xl animate-bounce">🎉</div>
          <div className="absolute top-1/3 right-1/4 text-5xl animate-bounce delay-300">✨</div>
          <div className="absolute bottom-1/4 left-1/3 text-4xl animate-bounce delay-700">💎</div>
          <div className="absolute bottom-1/3 right-1/3 text-5xl animate-bounce delay-500">🏆</div>
        </div>
      )}

      {/* Achievement Popup Modal */}
      {showAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-yellow-900 via-yellow-800 to-yellow-900 border-2 border-yellow-600/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-bounce">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-yellow-500/20" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />
            
            <div className="relative text-center">
              <div className="text-6xl mb-4 animate-pulse">
                {getAchievementInfo(showAchievement).icon}
              </div>
              <h3 className="text-2xl font-bold text-yellow-300 mb-2">
                Achievement Unlocked!
              </h3>
              <h4 className="text-xl font-semibold text-yellow-200 mb-2">
                {getAchievementInfo(showAchievement).title}
              </h4>
              <p className="text-yellow-100 text-sm mb-4">
                {getAchievementInfo(showAchievement).description}
              </p>
              <button
                onClick={() => setShowAchievement(null)}
                className="bg-yellow-600/80 hover:bg-yellow-500/80 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Awesome! 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Popup Modal */}
      {showTelegramPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-green-600/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
            
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowTelegramPopup(false);
                  // Mark as shown for today
                  const storageKey = `telegram_popup_shown_${userId}`;
                  localStorage.setItem(storageKey, new Date().toISOString());
                }}
                className="absolute top-0 right-0 text-gray-400 hover:text-green-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 1.897.443 3.693 1.224 5.276L.051 22.13c-.14.65.39 1.207 1.046 1.072l4.956-1.13A12.005 12.005 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm6.16 15.868c-.163.468-.847.868-1.237 1.003-.623.217-1.438.383-2.113.432-.896.063-1.94.068-3.75-.182l-.554-.079c-.836-.112-2.24-.266-3.484-.49C5.858 16.569 4.13 15.75 4.13 13.781c0-1.025.747-1.586 1.57-2.09.51-.314 1.053-.588 1.505-1.464 0 0 .38-.703.65-1.845 0 0 .326-1.391 1.481-2.173.97-.652 2.134-.629 3.094-.417.645.144.914.24 1.279.384.106.042.217.085.335.134.625.257 1.514.616 1.864 1.402.35.786.058 2.047-.152 2.74-.295.967-1.423 1.955-.639 2.634.784.679 1.944-.067 2.462-.586.518-.518 1.17-1.105 1.5-1.13.33-.025 1.25.052 1.259 1.27.009 1.219-.914 5.135-1.092 5.591-.178.456-.759.904-1.354.718-.595-.185-2.259-.503-3.2-.858-.941-.356-1.768-.487-1.832-1.005-.064-.518.379-.783 1.094-1.088 1.208-.519 2.89-.724 2.89-.724s.233.34-.238.594z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-300 mb-2">Join Our Telegram Community!</h3>
                <p className="text-gray-400 text-sm">Stay connected with the RhizaCore community</p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-green-800/30">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-green-300 font-semibold">Latest Updates</p>
                    <p className="text-gray-400 text-xs">Get the latest mining tips and platform updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-green-800/30">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="text-green-300 font-semibold">Expert Support</p>
                    <p className="text-gray-400 text-xs">Get help from experienced miners and the team</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-green-800/30">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-green-300 font-semibold">Exclusive Rewards</p>
                    <p className="text-gray-400 text-xs">Access special mining bonuses and airdrops</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <a
                  href="https://t.me/RhizaCore"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const storageKey = `telegram_popup_shown_${userId}`;
                    localStorage.setItem(storageKey, new Date().toISOString());
                    setShowTelegramPopup(false);
                  }}
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 text-center"
                >
                  🔗 Join Telegram Group
                </a>
                <a
                  href="https://t.me/RhizaCoreNews"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const storageKey = `telegram_popup_shown_${userId}`;
                    localStorage.setItem(storageKey, new Date().toISOString());
                    setShowTelegramPopup(false);
                  }}
                  className="block w-full bg-gray-800/50 border-2 border-green-600/70 hover:border-green-500 text-green-300 font-bold py-3 px-4 rounded-lg transition-all duration-200 text-center"
                >
                  📢 Join Telegram Channel
                </a>
                <button
                  onClick={() => {
                    setShowTelegramPopup(false);
                    const storageKey = `telegram_popup_shown_${userId}`;
                    localStorage.setItem(storageKey, new Date().toISOString());
                  }}
                  className="w-full text-gray-400 hover:text-gray-300 text-sm transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}