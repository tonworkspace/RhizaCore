// import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
// import { useI18n } from '@/components/I18nProvider';
// import { useGameData } from '@/contexts/GameDataContext';
// import {
//   supabase,
//   ensureUserHasSponsorCode,
//   startMiningSession,
//   startMiningSessionUnrestricted,
//   getActiveMiningSession,
//   manualCompleteMiningSession,
//   getUserRZCBalance,
//   claimRZCRewards,
//   getMiningHistory,
//   getFreeMiningStatus,
//   initializeFreeMiningPeriod,
//   canUserStartMining,
//   recordMiningActivity,
//   updateFreeMiningSessionCount,
//   MiningSession,
//   generatePassiveIncome,
//   purchaseUpgrade,
//   getUserAirdropBalance,
//   claimTotalEarnedToAirdrop,
//   getUserAirdropWithdrawals,
//   AirdropBalance,
//   AirdropWithdrawal
// } from '../lib/supabaseClient';
// import { Icons } from './Icon';

// interface SponsorInfo {
//   username: string;
//   code: string;
// }

// interface ReferralStats {
//   active: number;
//   total: number;
// }

// interface ArcadeMiningUIProps {
//   balanceTon: number;
//   tonPrice: number;
//   currentEarningsTon: number;
//   isClaiming: boolean;
//   claimCooldown: number;
//   cooldownText: string;
//   onClaim: () => void;
//   onOpenWithdraw?: () => void;
//   potentialEarningsTon: number;
//   airdropBalanceNova: number;
//   totalWithdrawnTon: number;
//   activities?: Array<{ id: string; type: string; amount: number; status: string; created_at: string; }>;
//   withdrawals?: Array<{ id: number; amount: number; status: string; created_at: string; }>;
//   isLoadingActivities?: boolean;
//   userId?: number;
//   userUsername?: string;
//   referralCode?: string;
//   estimatedDailyTapps?: number;
//   showSnackbar?: (data: { message: string; description?: string }) => void;
//   onMiningDataUpdate?: (data: {
//     isMining: boolean;
//     currentSession: any | null;
//     sessionCountdown: string;
//     accumulatedRZC: number;
//     claimableRZC: number;
//     claimedRZC: number;
//     totalEarnedRZC: number;
//     sessionDurationHours: number | null;
//     canStartMining: boolean;
//     miningRateMultiplier: number;
//     userUpgrades: {
//       miningRigMk2: boolean;
//       extendedSession: boolean;
//       passiveIncomeBoostLevel: number;
//     };
//   }) => void;
// }

// export type ArcadeMiningUIHandle = {
//   refreshBalance: () => Promise<void> | void;
// };

// const ArcadeMiningUI = forwardRef<ArcadeMiningUIHandle, ArcadeMiningUIProps>(function ArcadeMiningUI(props, ref) {
//   const { t } = useI18n();
//   const { updateClaimedRZC, updateMiningBalance, setIsMining: setContextIsMining } = useGameData();
//   const {
//     isClaiming,
//     activities,
//     isLoadingActivities,
//     userId,
//     userUsername,
//     referralCode,
//     showSnackbar,
//     onMiningDataUpdate,
//   } = props;

//   const [activeTab, setActiveTab] = useState<'mining' | 'activity' | 'upgrades' | 'leaderboard' | 'airdrop'>('mining');
//   const [sponsorCode, setSponsorCode] = useState<string | null>(null);
//   const [, setSponsorInfo] = useState<SponsorInfo | null>(null);
//   const [, setReferralStats] = useState<ReferralStats>({ active: 0, total: 0 });

//   // Backend-integrated mining system
//   const [isMining, setIsMining] = useState(false);
//   const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
//   const [sessionCountdown, setSessionCountdown] = useState('--:--:--');
//   const [sessionDurationHours, setSessionDurationHours] = useState<number | null>(null);
//   const [accumulatedRZC, setAccumulatedRZC] = useState(0);
//   const [claimableRZC, setClaimableRZC] = useState(0);
//   const [totalEarnedRZC, setTotalEarnedRZC] = useState(0);
//   const [claimedRZC, setClaimedRZC] = useState(0);
//   const [, setMiningHistory] = useState<MiningSession[]>([]);
  
//   const [lastClaimDuringMining, setLastClaimDuringMining] = useState<Date | null>(null);
  
//   const [userUpgrades, setUserUpgrades] = useState<{
//     miningRigMk2: boolean;
//     extendedSession: boolean;
//     passiveIncomeBoostLevel: number;
//   }>({
//     miningRigMk2: false,
//     extendedSession: false,
//     passiveIncomeBoostLevel: 0
//   });
//   const [miningRateMultiplier, setMiningRateMultiplier] = useState(1.0);
  
//   const [canStartMining, setCanStartMining] = useState(false);
  
//   const [, setTeamMembers] = useState<any[]>([]);
  
//   const [, setTopReferrers] = useState<any[]>([]);
//   const [, setTopClaimers] = useState<any[]>([]);
//   const [topBalances, setTopBalances] = useState<any[]>([]);
//   const [isLoadingLeaderboards, setIsLoadingLeaderboards] = useState(false);
//   const [, setIsLoadingBalances] = useState(false);
//   const [, setUserRank] = useState<number | null>(null);
//   const [showAllPlayers,] = useState(false);
  
//   const [isLoadingMiningData, setIsLoadingMiningData] = useState(false);
//   const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
//   const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
//   const [claimCooldownRemaining, setClaimCooldownRemaining] = useState(0);
  
//   const [showTelegramPopup, setShowTelegramPopup] = useState(false);
//   const [copyFeedback, setCopyFeedback] = useState(false);

//   // Airdrop Balance System
//   const [airdropBalance, setAirdropBalance] = useState<AirdropBalance | null>(null);
//   const [airdropWithdrawals, setAirdropWithdrawals] = useState<AirdropWithdrawal[]>([]);
//   const [isProcessingAirdropClaim, setIsProcessingAirdropClaim] = useState(false);
//   const [showWithdrawModal, setShowWithdrawModal] = useState(false);

//   const RZC_PER_DAY = 50;
//   const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);
  
//   const [miningStreak, setMiningStreak] = useState(0);
//   const [lastMilestone, setLastMilestone] = useState(0);
//   const [showEarningAnimation, setShowEarningAnimation] = useState(false);
//   const [recentEarnings, setRecentEarnings] = useState(0);
//   const [achievements, setAchievements] = useState<string[]>([]);
//   const [showAchievement, setShowAchievement] = useState<string | null>(null);
//   const [, setMiningStats] = useState({
//     totalSessions: 0,
//     totalEarned: 0,
//     bestStreak: 0,
//     averageSessionTime: 0
//   });
//   const [soundEnabled,] = useState(true);
//   const [showCelebration, setShowCelebration] = useState(false);
//   const thresholdClaimingRef = useRef(false);

//   const [displayBalance, setDisplayBalance] = useState(0);

//   const actualBalance = claimableRZC + (isMining ? accumulatedRZC : 0) + claimedRZC;

//   // Smooth balance animation
//   useEffect(() => {
//     let animationId: number;
//     const animate = () => {
//       setDisplayBalance(prev => {
//         const diff = actualBalance - prev;
//         if (Math.abs(diff) < 0.00001) return actualBalance;
//         return prev + diff * 0.05; // Smooth lerp
//       });
//       animationId = requestAnimationFrame(animate);
//     };
//     animate();
//     return () => {
//       if (animationId) cancelAnimationFrame(animationId);
//     };
//   }, [actualBalance]);

//   // Load mining statistics on component mount
//   useEffect(() => {
//     if (!userId) return;
    
//     const loadMiningStats = async () => {
//       try {
//         const storedStats = localStorage.getItem(`mining_stats_${userId}`);
//         if (storedStats) {
//           setMiningStats(JSON.parse(storedStats));
//         }
        
//         const { data: recentActivities } = await supabase
//           .from('activities')
//           .select('created_at')
//           .eq('user_id', userId)
//           .eq('type', 'mining_start')
//           .order('created_at', { ascending: false })
//           .limit(30);
        
//         if (recentActivities) {
//           let streak = 0;
//           const today = new Date();
//           today.setHours(0, 0, 0, 0);
          
//           for (const activity of recentActivities) {
//             const activityDate = new Date(activity.created_at);
//             activityDate.setHours(0, 0, 0, 0);
            
//             const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
            
//             if (daysDiff === streak) {
//               streak++;
//             } else {
//               break;
//             }
//           }
          
//           setMiningStreak(streak);
//         }
//       } catch (error) {
//         console.error('Error loading mining stats:', error);
//       }
//     };
    
//     loadMiningStats();
//   }, [userId]);

//   // Update context when mining status changes
//   useEffect(() => {
//     setContextIsMining(isMining);
//   }, [isMining, setContextIsMining]);

//   useEffect(() => {
//     if (!lastClaimTime || !userId) {
//       setClaimCooldownRemaining(0);
//       return;
//     }

//     const interval = setInterval(() => {
//       const now = new Date();
//       const timeSinceLastClaim = Math.floor((now.getTime() - lastClaimTime.getTime()) / 1000);
//       const cooldownSeconds = 30 * 60; // 30 minutes
//       const remaining = Math.max(0, cooldownSeconds - timeSinceLastClaim);
      
//       setClaimCooldownRemaining(remaining);
      
//       if (remaining === 0) {
//         setLastClaimTime(null);
//         localStorage.removeItem(`last_claim_time_${userId}`);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [lastClaimTime, userId]);

//   const loadUserUpgrades = async () => {
//     if (!userId) return;
    
//     try {
//       const { data: activities } = await supabase
//         .from('activities')
//         .select('type, metadata')
//         .eq('user_id', userId)
//         .in('type', ['mining_rig_mk2', 'extended_session', 'passive_income_boost']);
      
//       const passiveBoostActivities = activities?.filter(a => a.type === 'passive_income_boost') || [];
//       let passiveIncomeBoostLevel = 0;
//       if (passiveBoostActivities.length > 0) {
//         const levels = passiveBoostActivities
//           .map(a => a.metadata?.level || 0)
//           .filter(level => typeof level === 'number' && level > 0);
//         passiveIncomeBoostLevel = levels.length > 0 ? Math.max(...levels) : 0;
//       }
      
//       const upgrades = {
//         miningRigMk2: activities?.some(a => a.type === 'mining_rig_mk2') || false,
//         extendedSession: activities?.some(a => a.type === 'extended_session') || false,
//         passiveIncomeBoostLevel: passiveIncomeBoostLevel
//       };
      
//       setUserUpgrades(upgrades);
      
//       if (upgrades.miningRigMk2) {
//         setMiningRateMultiplier(1.25);
//       }
//     } catch (error) {
//       console.error('Error loading user upgrades:', error);
//     }
//   };

//   const loadAirdropBalance = async () => {
//     if (!userId) return;
    
//     try {
//       const [balanceResult, withdrawalsResult] = await Promise.all([
//         getUserAirdropBalance(userId),
//         getUserAirdropWithdrawals(userId)
//       ]);

//       if (balanceResult.success && balanceResult.balance) {
//         setAirdropBalance(balanceResult.balance);
//       }

//       if (withdrawalsResult.success && withdrawalsResult.withdrawals) {
//         setAirdropWithdrawals(withdrawalsResult.withdrawals);
//       }
//     } catch (error) {
//       console.error('Error loading airdrop balance:', error);
//     }
//   };

//   // Main data loading effect
//   useEffect(() => {
//     if (!userId) return;

//     const loadAllData = async () => {
//       try {
//         setIsLoadingMiningData(true);
//         setIsLoadingBalance(true);
        
//         await initializeFreeMiningPeriod(userId);
//         const code = await ensureUserHasSponsorCode(userId, userUsername);
//         setSponsorCode(code);

//         await loadUserUpgrades();
//         await loadAirdropBalance();

//         const [
//           rzcBalance,
//           miningCheck,
//           activeSession,
//           history,
//           sponsorQueryResult,
//           referralStatsResult,
//           teamMembersResult
//         ] = await Promise.all([
//           getUserRZCBalance(userId),
//           canUserStartMining(userId),
//           getActiveMiningSession(userId),
//           getMiningHistory(userId, 5),
//           supabase
//             .from('referrals')
//             .select('sponsor_id, sponsor:users!sponsor_id(username, sponsor_code)')
//             .eq('referred_id', userId)
//             .single(),
//           supabase
//             .from('referrals')
//             .select('status')
//             .eq('sponsor_id', userId),
//           supabase
//             .from('referrals')
//             .select(`*, referred:users!referred_id(id, username, created_at, is_active, total_earned, total_deposit)`)
//             .eq('sponsor_id', userId)
//             .order('created_at', { ascending: false })
//         ]);
        
//         if (referralStatsResult.data) {
//           const active = referralStatsResult.data.filter(r => r.status === 'active').length;
//           setReferralStats({ active, total: referralStatsResult.data.length });
//         }
//         if (teamMembersResult.data) {
//           setTeamMembers(teamMembersResult.data || []);
//         }
        
//         setClaimableRZC(rzcBalance.claimableRZC);
//         setTotalEarnedRZC(rzcBalance.totalEarned);
//         setClaimedRZC(rzcBalance.claimedRZC);
        
//         // Update the game data context
//         updateClaimedRZC(rzcBalance.claimedRZC);
//         updateMiningBalance(rzcBalance.claimableRZC + (isMining ? accumulatedRZC : 0));
        
//         if (rzcBalance.lastClaimTime) {
//           const lastClaim = new Date(rzcBalance.lastClaimTime);
//           const now = new Date();
//           const timeSinceLastClaim = Math.floor((now.getTime() - lastClaim.getTime()) / 1000);
//           const cooldownSeconds = 30 * 60; // 30 minutes
          
//           if (timeSinceLastClaim < cooldownSeconds) {
//             setLastClaimTime(lastClaim);
//             setClaimCooldownRemaining(cooldownSeconds - timeSinceLastClaim);
//           }
//         }
        
//         setCanStartMining(miningCheck.canMine);
//         setMiningHistory(history);
        
//         setIsLoadingBalance(false);

//         if (sponsorQueryResult.data?.sponsor) {
//           const sponsorData = Array.isArray(sponsorQueryResult.data.sponsor) ? sponsorQueryResult.data.sponsor[0] : sponsorQueryResult.data.sponsor;
//           if (sponsorData && sponsorData.username) {
//             setSponsorInfo({
//               username: sponsorData.username,
//               code: sponsorData.sponsor_code || 'N/A'
//             });
//           }
//         } else {
//           setSponsorInfo(null);
//         }

//         if (activeSession) {
//           const now = new Date();
//           const endTime = new Date(activeSession.end_time);
//           if (now >= endTime) {
//             await rolloverSession();
//           } else {
//             setCurrentSession(activeSession);
//             setIsMining(true);
//             const durationMs = new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime();
//             setSessionDurationHours(Math.max(0, durationMs / (1000 * 60 * 60)));

//             const remainingSeconds = Math.max(0, (endTime.getTime() - now.getTime()) / 1000);
//             const hours = Math.floor(remainingSeconds / 3600);
//             const minutes = Math.floor((remainingSeconds % 3600) / 60);
//             const seconds = Math.floor(remainingSeconds % 60);
//             setSessionCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

//             const sessionStartTime = new Date(activeSession.start_time);
//             const lastClaimTime = rzcBalance.lastClaimTime ? new Date(rzcBalance.lastClaimTime) : new Date(0);

//             const accumulationStartTime = lastClaimTime > sessionStartTime ? lastClaimTime : sessionStartTime;

//             if (lastClaimTime > sessionStartTime) {
//               setLastClaimDuringMining(lastClaimTime);
//             } else {
//               setLastClaimDuringMining(null);
//             }

//             const elapsedSeconds = Math.max(0, (now.getTime() - accumulationStartTime.getTime()) / 1000);
//             const RZC_PER_SECOND = (50 * miningRateMultiplier) / (24 * 60 * 60);
//             const initialAccumulated = elapsedSeconds * RZC_PER_SECOND;
//             setAccumulatedRZC(initialAccumulated);

//             setDisplayBalance(rzcBalance.claimableRZC + initialAccumulated + rzcBalance.claimedRZC);
//           }
//         }
//       } catch (error) {
//         console.error('Error loading mining data:', error);
//       } finally {
//         setIsLoadingMiningData(false);
//         setIsLoadingBalance(false);
//       }
//     };

//     loadAllData();
//   }, [userId, userUsername, miningRateMultiplier, isMining, accumulatedRZC, updateClaimedRZC, updateMiningBalance]);

//   const startMining = async () => {
//     if (!userId || isMining || !canStartMining) return;

//     try {
//       const result = await startMiningSession(userId);
//       if (result.success) {
//         setIsMining(true);
//         setAccumulatedRZC(0);
//         setLastClaimDuringMining(null);
        
//         await recordMiningActivity(userId, 'mining_start', 0);
//         await updateFreeMiningSessionCount(userId);
        
//         const activeSession = await getActiveMiningSession(userId);
        
//         if (activeSession) {
//           setCurrentSession(activeSession);
//           const durationMs = new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime();
//           setSessionDurationHours(Math.max(0, durationMs / (1000 * 60 * 60)));
//         }

//         showSnackbar?.({
//           message: 'Mining Started!',
//           description: 'Your mining session has begun.'
//         });
//       } else {
//         showSnackbar?.({
//           message: 'Mining Failed',
//           description: result.error || 'Failed to start mining session.'
//         });
//       }
//     } catch (error) {
//       console.error('Error starting mining:', error);
//       showSnackbar?.({
//         message: 'Mining Failed',
//         description: 'An error occurred while starting mining.'
//       });
//     }
//   };

//   const rolloverSession = async () => {
//     if (!userId || !isMining || !currentSession) return;

//     try {
//       const result = await manualCompleteMiningSession(currentSession.id);
//       if (result.success) {
//         await recordMiningActivity(userId, 'mining_complete', result.rzcEarned || 0);
        
//         setIsMining(false);
//         setCurrentSession(null);
//         setAccumulatedRZC(0);
//         setLastClaimDuringMining(null);

//         const updatedBalance = await getUserRZCBalance(userId);
        
//         setClaimableRZC(updatedBalance.claimableRZC);
//         setTotalEarnedRZC(updatedBalance.totalEarned);
//         setClaimedRZC(updatedBalance.claimedRZC);
        
//         setTimeout(async () => {
//           const startRes = await startMiningSessionUnrestricted(userId);
//           if (startRes.success) {
//             const active = await getActiveMiningSession(userId);
//             if (active) {
//               setCurrentSession(active);
//               setIsMining(true);
//             }
//           }
//         }, 300);
//       }
//     } catch (error) {
//       console.error('Error rolling over mining session:', error);
//     }
//   };

//   const handleCopy = async () => {
//     try {
//       const codeToCopy = `https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`;
//       if (!codeToCopy) throw new Error('No Link to copy');
//       await navigator.clipboard.writeText(codeToCopy);
//       setCopyFeedback(true);
//       setTimeout(() => setCopyFeedback(false), 2000);
//       showSnackbar?.({ message: t('copy_success') });
//     } catch (error) {
//       showSnackbar?.({ message: t('copy_failed') });
//     }
//   };

//   const getActivityIcon = (type: string) => {
//     if (type.includes('mining_start')) {
//       return (
//         <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>
//       );
//     }
//     if (type.includes('mining_complete')) {
//       return (
//         <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//         </svg>
//       );
//     }
//     return (
//       <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//       </svg>
//     );
//   };

//   const fetchBalance = async (showLoading = false) => {
//     if (!userId) return;
//     try {
//       if (showLoading) setIsLoadingBalance(true);
//       const updatedBalance = await getUserRZCBalance(userId);
//       setClaimableRZC(updatedBalance.claimableRZC);
//       setTotalEarnedRZC(updatedBalance.totalEarned);
//       setClaimedRZC(updatedBalance.claimedRZC);

//       if (showLoading) {
//         showSnackbar?.({
//           message: 'Balance Updated',
//           description: `Total: ${(updatedBalance.claimableRZC + updatedBalance.claimedRZC).toFixed(4)} RZC`
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching balance:', error);
//       if (showLoading) {
//         showSnackbar?.({
//           message: 'Balance Update Failed',
//           description: 'Could not refresh balance from database'
//         });
//       }
//     } finally {
//       if (showLoading) setIsLoadingBalance(false);
//     }
//   };

//   useImperativeHandle(ref, () => ({
//     refreshBalance: fetchBalance
//   }));

//   return (
//     <div className="flex flex-col h-full w-full pb-20 overflow-y-auto">
//       {/* Pure Mining Interface */}
//       <div className="flex flex-col px-2 mt-2">
//         {/* Compact Header */}
//         <div className="text-center mb-3">
//           <h1 className="text-sm font-bold text-white mb-1">RhizaCore AI Nodes</h1>
//           <p className="text-gray-500 text-[10px] leading-tight">Pure Mining Interface</p>
//         </div>

//         {/* Compact Referral Link */}
//         {(referralCode || sponsorCode) && (
//           <div className="w-full flex gap-2 mb-3">
//             <div className="flex-1 bg-black/40 border border-gray-700 rounded-lg flex items-center px-2 py-1.5">
//               <Icons.Energy size={12} className="text-rzc-green mr-2 flex-shrink-0" />
//               <span className="text-gray-400 text-[9px] truncate font-mono">
//                 {`t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`}
//               </span>
//             </div>
//             <button 
//               onClick={handleCopy}
//               className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
//                   copyFeedback 
//                   ? 'bg-rzc-green text-black' 
//                   : 'bg-rzc-green/20 text-rzc-green hover:bg-rzc-green/30'
//               }`}
//             >
//               <Icons.Copy size={12} />
//             </button>
//           </div>
//         )}

//         {/* Compact Core Display */}
//         <div className="relative w-32 h-32 flex items-center justify-center mb-3 mx-auto">
//           {/* Simplified rings */}
//           <div className="absolute w-full h-full rounded-full border border-rzc-green/20"></div>
//           {isMining && (
//             <div className="absolute w-28 h-28 rounded-full bg-rzc-green/5 blur-xl animate-pulse"></div>
//           )}

//           {/* Compact Main Circle */}
//           <div className={`relative w-28 h-28 rounded-full border ${isMining ? 'border-rzc-green/40' : 'border-gray-600/40'} bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center transition-all`}>
            
//             {isMining && (
//               <div className="absolute top-2 right-3 w-2 h-2 bg-rzc-green rounded-full animate-pulse"></div>
//             )}

//             {showEarningAnimation && (
//               <div className="absolute top-1/4 text-green-400 text-xs font-bold animate-bounce">
//                 +{recentEarnings.toFixed(3)}
//               </div>
//             )}

//             <div className={`text-lg font-bold font-mono ${isMining ? 'text-rzc-green' : 'text-gray-400'}`}>
//               {displayBalance.toFixed(3)}
//             </div>
            
//             <div className={`text-[8px] uppercase tracking-wider font-bold ${isMining ? 'text-gray-500' : 'text-gray-600'}`}>
//               {isLoadingBalance ? 'LOADING' : isMining ? 'MINING' : canStartMining ? 'READY' : 'OFFLINE'}
//             </div>
//             {isMining && (
//               <div className="text-rzc-green/80 text-[8px] font-mono">
//                 +{(RZC_PER_SECOND * 3600).toFixed(2)}/hr
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Compact Balance Display */}
//         <div className="text-center mb-3">
//           <h3 className="text-rzc-green font-medium text-xs">Balance: {sessionCountdown}</h3>
//         </div>

//         {/* Ultra Compact Stats */}
//         <div className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 mb-3">
//           <div className="grid grid-cols-2 gap-2 text-[9px]">
//             <div className="flex justify-between">
//               <span className="text-blue-400">Current:</span>
//               <span className="text-white font-mono">{(isMining ? accumulatedRZC : 0).toFixed(3)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-orange-400">Pending:</span>
//               <span className="text-white font-mono">{claimableRZC.toFixed(3)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-green-400">Total:</span>
//               <span className="text-white font-mono">{totalEarnedRZC.toFixed(3)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-purple-400">Rate:</span>
//               <span className="text-white font-mono">{(RZC_PER_DAY * miningRateMultiplier).toFixed(0)}/d</span>
//             </div>
//           </div>
//         </div>

//         {/* Single Mining Action Button */}
//         {isMining ? (
//           <button disabled className="w-full bg-black/50 border border-gray-700 text-gray-500 py-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 mb-3 cursor-not-allowed">
//             <div className="w-1.5 h-1.5 rounded-full bg-rzc-green animate-pulse"></div>
//             MINING ACTIVE
//           </button>
//         ) : canStartMining ? (
//           <button 
//             onClick={startMining}
//             disabled={isLoadingMiningData}
//             className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 mb-3 active:scale-[0.98] transition-all"
//           >
//             {isLoadingMiningData ? (
//               <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
//             ) : (
//               <>
//                 <Icons.Energy size={12} />
//                 START MINING
//               </>
//             )}
//           </button>
//         ) : (
//           <button disabled className="w-full bg-gray-800 border border-gray-700 text-gray-500 py-2 rounded text-[10px] font-bold mb-3 cursor-not-allowed">
//             CHECKING...
//           </button>
//         )}

//         {/* Compact Footer Stats */}
//         <div className="flex items-center justify-between w-full text-[8px] font-mono text-gray-500 font-bold">
//           <div className="flex items-center gap-1">
//             <div className={`w-1 h-1 rounded-full ${isMining ? 'bg-rzc-green animate-pulse' : 'bg-gray-500'}`}></div>
//             {isMining ? 'ONLINE' : 'STANDBY'}
//             {isMining && userUpgrades.extendedSession && (
//               <span className="bg-rzc-green/20 px-1 rounded text-rzc-green">48H</span>
//             )}
//           </div>

//           <div className="flex items-center gap-2">
//             {miningStreak > 0 && (
//               <div className="flex items-center gap-0.5 bg-orange-900/20 px-1 rounded">
//                 <Icons.Fire size={8} className="text-orange-500" />
//                 <span className="text-orange-400">{miningStreak}d</span>
//               </div>
//             )}
            
//             <div className="flex items-center gap-0.5">
//               <span>{(RZC_PER_DAY * miningRateMultiplier).toFixed(0)}/day</span>
//               {miningRateMultiplier > 1 && (
//                 <span className="bg-yellow-500/20 text-yellow-500 px-0.5 rounded text-[7px]">
//                   +{Math.round((miningRateMultiplier - 1) * 100)}%
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// });

// export default ArcadeMiningUI;