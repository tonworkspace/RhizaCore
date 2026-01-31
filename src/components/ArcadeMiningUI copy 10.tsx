// import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
// import { useI18n } from '@/components/I18nProvider';
// import { useGameData } from '@/contexts/GameDataContext';
// import {
//   supabase,
//   ensureUserHasSponsorCode,
//   startMiningSessionUnrestricted,
//   getActiveMiningSession,
//   manualCompleteMiningSession,
//   getUserRZCBalance,
//   claimRZCRewards,
//   getMiningHistory,
//   initializeFreeMiningPeriod,
//   canUserStartMining,
//   recordMiningActivity,
//   unclaimRZCRewards,
//   resetClaimStatus,
//   MiningSession
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
//     userId,
//     userUsername,
//     referralCode,
//     showSnackbar,
//   } = props;

//   const [activeTab, setActiveTab] = useState<'rewards' | 'leaderboard' | 'roadmap'>('rewards');
//   const [sponsorCode, setSponsorCode] = useState<string | null>(null);
//   const [, setSponsorInfo] = useState<SponsorInfo | null>(null);
//   const [, setReferralStats] = useState<ReferralStats>({ active: 0, total: 0 });

//   // Backend-integrated mining system
//   const [isMining, setIsMining] = useState(false);
//   const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
//   const [accumulatedRZC, setAccumulatedRZC] = useState(0);
//   const [claimableRZC, setClaimableRZC] = useState(0);
//   const [claimedRZC, setClaimedRZC] = useState(0);
//   const [, setMiningHistory] = useState<MiningSession[]>([]);
  
//   const [, setCanStartMining] = useState(false);
  
//   const [, setTeamMembers] = useState<any[]>([]);
  
//   const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
  
//   const [copyFeedback, setCopyFeedback] = useState(false);

//   // New state for the updated interface
//   const [countdown, setCountdown] = useState({
//     days: 0,
//     hours: 0,
//     minutes: 0,
//     seconds: 0,
//     percentage: 0
//   });
  
//   const [leaderboard, setLeaderboard] = useState<Array<{
//     rank: number;
//     username: string;
//     balance: number;
//     isUser: boolean;
//   }>>([]);
//   const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

//   const refreshLeaderboard = async () => {
//     if (!userId || isLoadingLeaderboard) return;
    
//     setIsLoadingLeaderboard(true);
    
//     try {
//       // Fetch top 50 users by available_balance (RZC balance)
//       const { data: topUsers, error } = await supabase
//         .from('users')
//         .select('id, username, available_balance, created_at')
//         .order('available_balance', { ascending: false })
//         .limit(50);
      
//       if (error) {
//         console.error('Error fetching leaderboard:', error);
//         showSnackbar?.({
//           message: 'Refresh Failed',
//           description: 'Could not update leaderboard data'
//         });
//         return;
//       }
      
//       if (topUsers && topUsers.length > 0) {
//         const leaderboardData = topUsers.map((user, idx) => ({
//           rank: idx + 1,
//           username: user.username || `User${user.id}`,
//           balance: parseFloat(user.available_balance) || 0,
//           isUser: user.id === userId
//         }));
        
//         setLeaderboard(leaderboardData);
        
//         // Find current user's rank if not in top 50
//         if (!leaderboardData.some(player => player.isUser)) {
//           try {
//             const { data: userRankData } = await supabase
//               .rpc('get_user_rank', { user_id: userId });
            
//             if (userRankData && userRankData.length > 0) {
//               const userRank = userRankData[0];
//               const currentUserEntry = {
//                 rank: userRank.rank || 999,
//                 username: userRank.username || `User${userId}`,
//                 balance: parseFloat(userRank.available_balance) || 0,
//                 isUser: true
//               };
              
//               setLeaderboard([...leaderboardData, currentUserEntry]);
//             }
//           } catch (rankError) {
//             console.log('User rank function not available, showing top 50 only');
//           }
//         }
        
//         showSnackbar?.({
//           message: 'Leaderboard Updated',
//           description: 'Latest rankings loaded successfully'
//         });
//       } else {
//         setLeaderboard([]);
//       }
//     } catch (error) {
//       console.error('Error refreshing leaderboard:', error);
//       showSnackbar?.({
//         message: 'Refresh Error',
//         description: 'An error occurred while updating leaderboard'
//       });
//     } finally {
//       setIsLoadingLeaderboard(false);
//     }
//   };

//   const [totalAvailableToClaim, setTotalAvailableToClaim] = useState(0);

//   // Roadmap milestones data
//   const RoadmapMilestones = [
//     {
//       quarter: "Q1 2026",
//       title: "Mainnet Launch",
//       description: "Full decentralized network deployment with cross-chain compatibility",
//       status: "Target",
//       icon: <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
//     },
//     {
//       quarter: "Q2 2026", 
//       title: "DeFi Integration",
//       description: "Native staking, liquidity pools, and yield farming protocols",
//       status: "Planned",
//       icon: <div className="w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-500"></div>
//     },
//     {
//       quarter: "Q3 2026",
//       title: "AI Node Network",
//       description: "Distributed AI computation and machine learning infrastructure",
//       status: "Research",
//       icon: <div className="w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-500"></div>
//     },
//     {
//       quarter: "Q4 2026",
//       title: "Ecosystem Expansion",
//       description: "Developer tools, SDKs, and third-party integrations",
//       status: "Concept",
//       icon: <div className="w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-500"></div>
//     }
//   ];

//   // Airdrop Balance System
//   const [isProcessingAirdropClaim, setIsProcessingAirdropClaim] = useState(false);
//   const [hasClaimedRewards, setHasClaimedRewards] = useState(false);
//   const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);

//   const [displayBalance, setDisplayBalance] = useState(0);

//   const actualBalance = claimedRZC + claimableRZC; // Simplified: total available balance

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

//   // Countdown effect for burn deadline
//   useEffect(() => {
//     // Set burn deadline to 30 days from now
//     const targetDate = new Date();
//     targetDate.setDate(targetDate.getDate() + 30);
//     targetDate.setHours(23, 59, 59, 999); // End of day
    
//     const updateCountdown = () => {
//       const now = new Date();
//       const diff = targetDate.getTime() - now.getTime();
      
//       if (diff > 0) {
//         const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//         const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//         const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
//         const totalDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
//         const elapsed = totalDuration - diff;
//         const percentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
        
//         setCountdown({ days, hours, minutes, seconds, percentage });
//       } else {
//         // Deadline passed
//         setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, percentage: 100 });
//       }
//     };
    
//     updateCountdown();
//     const interval = setInterval(updateCountdown, 1000);
    
//     return () => clearInterval(interval);
//   }, []);

//   // Load leaderboard data
//   useEffect(() => {
//     const loadLeaderboard = async () => {
//       if (!userId) return;
      
//       setIsLoadingLeaderboard(true);
      
//       try {
//         // Fetch top 50 users by available_balance (claimed RZC balance)
//         const { data: topUsers, error } = await supabase
//           .from('users')
//           .select('id, username, available_balance, created_at')
//           .order('available_balance', { ascending: false })
//           .limit(50);
        
//         if (error) {
//           console.error('Error fetching leaderboard:', error);
//           return;
//         }
        
//         if (topUsers && topUsers.length > 0) {
//           const leaderboardData = topUsers.map((user, idx) => ({
//             rank: idx + 1,
//             username: user.username || `User${user.id}`,
//             balance: parseFloat(user.available_balance) || 0,
//             isUser: user.id === userId
//           }));
          
//           setLeaderboard(leaderboardData);
          
//           // Find current user's rank if not in top 50
//           if (!leaderboardData.some(player => player.isUser)) {
//             try {
//               const { data: userRankData } = await supabase
//                 .rpc('get_user_rank', { user_id: userId });
              
//               if (userRankData && userRankData.length > 0) {
//                 const userRank = userRankData[0];
//                 // Add current user to the end of the list if not in top 50
//                 const currentUserEntry = {
//                   rank: userRank.rank || 999,
//                   username: userRank.username || `User${userId}`,
//                   balance: parseFloat(userRank.available_balance) || 0,
//                   isUser: true
//                 };
                
//                 setLeaderboard([...leaderboardData, currentUserEntry]);
//               }
//             } catch (rankError) {
//               console.log('User rank function not available, showing top 50 only');
//             }
//           }
//         } else {
//           // If no users found, create a placeholder
//           setLeaderboard([]);
//         }
//       } catch (error) {
//         console.error('Error loading leaderboard:', error);
//         // Set empty leaderboard on error
//         setLeaderboard([]);
//       } finally {
//         setIsLoadingLeaderboard(false);
//       }
//     };
    
//     loadLeaderboard();
//   }, [userId]);

//   // Update total available to claim
//   useEffect(() => {
//     setTotalAvailableToClaim(claimableRZC + (isMining ? accumulatedRZC : 0));
//   }, [claimableRZC, accumulatedRZC, isMining]);

//   useEffect(() => {
//     if (!lastClaimTime || !userId) {
//       return;
//     }

//     const interval = setInterval(() => {
//       const now = new Date();
//       const timeSinceLastClaim = Math.floor((now.getTime() - lastClaimTime.getTime()) / 1000);
//       const cooldownSeconds = 30 * 60; // 30 minutes
//       const remaining = Math.max(0, cooldownSeconds - timeSinceLastClaim);
      
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
      
//       // Basic upgrade checking for future use
//       const hasMiningRig = activities?.some(a => a.type === 'mining_rig_mk2') || false;
      
//       if (hasMiningRig) {
//         // Could set mining rate multiplier here if needed
//       }
//     } catch (error) {
//       console.error('Error loading user upgrades:', error);
//     }
//   };

//   // Main data loading effect
//   useEffect(() => {
//     if (!userId) return;

//     const loadAllData = async () => {
//       try {
//         await initializeFreeMiningPeriod(userId);
//         const code = await ensureUserHasSponsorCode(userId, userUsername);
//         setSponsorCode(code);

//         await loadUserUpgrades();

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
//         setClaimedRZC(rzcBalance.claimedRZC);
        
//         // Check if user has already claimed rewards
//         const hasRecentClaim = rzcBalance.lastClaimTime && rzcBalance.claimedRZC > 0;
//         setHasClaimedRewards(hasRecentClaim || false);
//         setLastClaimDate(rzcBalance.lastClaimTime || null);
        
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
//           }
//         }
        
//         setCanStartMining(miningCheck.canMine);
//         setMiningHistory(history);

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

//             const sessionStartTime = new Date(activeSession.start_time);
//             const lastClaimTime = rzcBalance.lastClaimTime ? new Date(rzcBalance.lastClaimTime) : new Date(0);

//             const accumulationStartTime = lastClaimTime > sessionStartTime ? lastClaimTime : sessionStartTime;

//             const elapsedSeconds = Math.max(0, (now.getTime() - accumulationStartTime.getTime()) / 1000);
//             const RZC_PER_SECOND = 50 / (24 * 60 * 60); // Simplified rate
//             const initialAccumulated = elapsedSeconds * RZC_PER_SECOND;
//             setAccumulatedRZC(initialAccumulated);

//             setDisplayBalance(rzcBalance.claimableRZC + initialAccumulated + rzcBalance.claimedRZC);
//           }
//         }
//       } catch (error) {
//         console.error('Error loading mining data:', error);
//       }
//     };

//     loadAllData();
//   }, [userId, userUsername, isMining, accumulatedRZC, updateClaimedRZC, updateMiningBalance]);

//   // const startMining = async () => {
//   //   if (!userId || isMining || !canStartMining) return;

//   //   try {
//   //     const result = await startMiningSession(userId);
//   //     if (result.success) {
//   //       setIsMining(true);
//   //       setAccumulatedRZC(0);
        
//   //       await recordMiningActivity(userId, 'mining_start', 0);
//   //       await updateFreeMiningSessionCount(userId);
        
//   //       const activeSession = await getActiveMiningSession(userId);
        
//   //       if (activeSession) {
//   //         setCurrentSession(activeSession);
//   //       }

//   //       showSnackbar?.({
//   //         message: 'Mining Started!',
//   //         description: 'Your mining session has begun.'
//   //       });
//   //     } else {
//   //       showSnackbar?.({
//   //         message: 'Mining Failed',
//   //         description: result.error || 'Failed to start mining session.'
//   //       });
//   //     }
//   //   } catch (error) {
//   //     console.error('Error starting mining:', error);
//   //     showSnackbar?.({
//   //       message: 'Mining Failed',
//   //       description: 'An error occurred while starting mining.'
//   //     });
//   //   }
//   // };

//   const rolloverSession = async () => {
//     if (!userId || !isMining || !currentSession) return;

//     try {
//       const result = await manualCompleteMiningSession(currentSession.id);
//       if (result.success) {
//         await recordMiningActivity(userId, 'mining_complete', result.rzcEarned || 0);
        
//         setIsMining(false);
//         setCurrentSession(null);
//         setAccumulatedRZC(0);

//         const updatedBalance = await getUserRZCBalance(userId);
        
//         setClaimableRZC(updatedBalance.claimableRZC);
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

//   // Test/Development functions
//   const handleResetClaim = async () => {
//     if (!userId) return;
    
//     try {
//       // Use the database function to completely reset claim status
//       const result = await resetClaimStatus(userId);
      
//       if (result.success) {
//         // Update local state to reflect the reset
//         setHasClaimedRewards(false);
//         setLastClaimDate(null);
//         setClaimedRZC(0);
        
//         // Clear localStorage
//         localStorage.removeItem(`last_claim_time_${userId}`);
        
//         // Refresh the balance to get the restored claimable amount
//         await fetchBalance();
        
//         showSnackbar?.({
//           message: 'Claim Status Reset',
//           description: 'You can now test the claiming process again'
//         });
        
//       } else {
//         showSnackbar?.({
//           message: 'Reset Failed',
//           description: result.error || 'Could not reset claim status'
//         });
//       }
      
//     } catch (error) {
//       console.error('Error resetting claim:', error);
//       showSnackbar?.({
//         message: 'Reset Failed',
//         description: 'Could not reset claim status'
//       });
//     }
//   };

//   const handleUnclaimRewards = async () => {
//     if (!userId || !hasClaimedRewards || claimedRZC === 0) return;
    
//     try {
//       // Use the database function to properly unclaim
//       const result = await unclaimRZCRewards(userId);
      
//       if (result.success) {
//         // Update local state
//         setHasClaimedRewards(false);
//         setLastClaimDate(null);
//         setClaimedRZC(0);
//         setClaimableRZC(prev => prev + (result.unclaimedAmount || 0));
        
//         // Clear localStorage
//         localStorage.removeItem(`last_claim_time_${userId}`);
        
//         showSnackbar?.({
//           message: 'Rewards Unclaimed',
//           description: `${result.unclaimedAmount?.toFixed(3)} RZC moved back to claimable`
//         });
        
//         // Refresh the balance to reflect database changes
//         await fetchBalance();
//       } else {
//         showSnackbar?.({
//           message: 'Unclaim Failed',
//           description: result.error || 'Could not reverse the claim'
//         });
//       }
      
//     } catch (error) {
//       console.error('Error unclaiming rewards:', error);
//       showSnackbar?.({
//         message: 'Unclaim Failed',
//         description: 'Could not reverse the claim'
//       });
//     }
//   };

//   const handleClaim = async () => {
//     if (!userId || isProcessingAirdropClaim || totalAvailableToClaim === 0 || hasClaimedRewards) return;

//     try {
//       setIsProcessingAirdropClaim(true);
      
//       // Use existing claim function
//       const result = await claimRZCRewards(userId, totalAvailableToClaim);
      
//       if (result.success) {
//         // Update balances
//         await fetchBalance();
        
//         // Update claimed status
//         setHasClaimedRewards(true);
//         setLastClaimDate(new Date().toISOString());
        
//         showSnackbar?.({
//           message: 'RZC Claimed Successfully!',
//           description: `Claimed ${totalAvailableToClaim.toFixed(3)} RZC`
//         });
//       } else {
//         showSnackbar?.({
//           message: 'Claim Failed',
//           description: result.error || 'Failed to claim RZC rewards'
//         });
//       }
//     } catch (error) {
//       console.error('Error claiming RZC:', error);
//       showSnackbar?.({
//         message: 'Claim Error',
//         description: 'An error occurred while claiming rewards'
//       });
//     } finally {
//       setIsProcessingAirdropClaim(false);
//     }
//   };

//   const fetchBalance = async (showLoading = false) => {
//     if (!userId) return;
//     try {
//       const updatedBalance = await getUserRZCBalance(userId);
//       setClaimableRZC(updatedBalance.claimableRZC);
//       setClaimedRZC(updatedBalance.claimedRZC);

//       // Update claimed status
//       const hasRecentClaim = updatedBalance.lastClaimTime && updatedBalance.claimedRZC > 0;
//       setHasClaimedRewards(hasRecentClaim || false);
//       setLastClaimDate(updatedBalance.lastClaimTime || null);

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
//     }
//   };

//   useImperativeHandle(ref, () => ({
//     refreshBalance: fetchBalance
//   }));

//   return (
//     <div className="flex flex-col h-full w-full pb-24 overflow-hidden">
//       {/* Compact Header with Balance */}
//       <div className="shrink-0 px-4 pt-4 pb-3 bg-gradient-to-b from-black/20 to-transparent">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
//             <span className="text-green-500 text-xs font-bold">RZC Mining</span>
//             {/* Development Buttons in Header */}
//             {process.env.NODE_ENV === 'development' && (
//               <div className="flex gap-1 ml-2">
//                 <button 
//                   onClick={handleResetClaim}
//                   className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-all"
//                   title="Reset claim status completely"
//                 >
//                   Reset
//                 </button>
//                 {hasClaimedRewards && (
//                   <button 
//                     onClick={handleUnclaimRewards}
//                     className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/30 transition-all"
//                     title="Move claimed RZC back to claimable for testing"
//                   >
//                     Unclaim
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//           <div className="text-right">
//             <div className="text-white text-lg font-black font-mono">{displayBalance.toFixed(3)}</div>
//             <div className="text-green-500 text-xs font-bold">Available</div>
//           </div>
//         </div>
        
//         {/* Tab Switcher - More Compact */}
//         <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10">
//           <button 
//             onClick={() => setActiveTab('rewards')}
//             className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
//               activeTab === 'rewards' 
//                 ? 'bg-green-500 text-black' 
//                 : 'text-gray-400 hover:text-gray-200'
//             }`}
//           >
//             Rewards
//           </button>
//           <button 
//             onClick={() => setActiveTab('leaderboard')}
//             className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
//               activeTab === 'leaderboard' 
//                 ? 'bg-green-500 text-black' 
//                 : 'text-gray-400 hover:text-gray-200'
//             }`}
//           >
//             Ranking
//           </button>
//           <button 
//             onClick={() => setActiveTab('roadmap')}
//             className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
//               activeTab === 'roadmap' 
//                 ? 'bg-green-500 text-black' 
//                 : 'text-gray-400 hover:text-gray-200'
//             }`}
//           >
//             Roadmap
//           </button>
//         </div>
//       </div>

//       {/* Content Area */}
//       <div className="flex-1 overflow-y-auto px-4 pb-4">
//         {activeTab === 'rewards' && (
//           <div className="space-y-4">
//             {/* Main Claim Section - More Compact */}
//             <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-5 relative overflow-hidden">
//               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
              
//               <div className="relative z-10">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
//                     <span className="text-green-500 text-xs font-bold">
//                       {hasClaimedRewards ? 'Claimed' : 'Ready to Claim'}
//                     </span>
//                   </div>
//                   {hasClaimedRewards && (
//                     <Icons.Check size={16} className="text-green-500" />
//                   )}
//                 </div>
                
//                 <div className="mb-4">
//                   <div className="text-3xl font-black text-white mb-1">{displayBalance.toFixed(3)} <span className="text-lg text-green-500">RZC</span></div>
//                   <div className="text-gray-400 text-xs">
//                     {hasClaimedRewards && lastClaimDate 
//                       ? `Last claimed: ${new Date(lastClaimDate).toLocaleDateString()}`
//                       : claimableRZC > 0 
//                         ? `${claimableRZC.toFixed(3)} RZC ready to claim from mining`
//                         : 'Complete mining sessions to earn claimable RZC'
//                     }
//                   </div>
//                 </div>
                
//                 <button 
//                   onClick={handleClaim}
//                   disabled={isProcessingAirdropClaim || totalAvailableToClaim === 0 || hasClaimedRewards}
//                   className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
//                     hasClaimedRewards 
//                       ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
//                       : totalAvailableToClaim === 0
//                         ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
//                         : 'bg-green-500 text-black hover:bg-green-400 active:scale-[0.98]'
//                   }`}
//                 >
//                   {isProcessingAirdropClaim ? (
//                     <div className="flex items-center justify-center gap-2">
//                       <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
//                       Processing...
//                     </div>
//                   ) : hasClaimedRewards ? (
//                     'Already Claimed'
//                   ) : totalAvailableToClaim === 0 ? (
//                     'No Mining Rewards to Claim'
//                   ) : (
//                     `Claim ${totalAvailableToClaim.toFixed(3)} RZC from Mining`
//                   )}
//                 </button>
                
//                 {/* Development Buttons - Show in development mode */}
//                 {process.env.NODE_ENV === 'development' && (
//                   <div className="flex gap-2 mt-2">
//                     <button 
//                       onClick={handleResetClaim}
//                       className="flex-1 py-2 rounded-xl font-bold text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
//                     >
//                       🔄 Reset (Dev)
//                     </button>
//                     {hasClaimedRewards && (
//                       <button 
//                         onClick={handleUnclaimRewards}
//                         className="flex-1 py-2 rounded-xl font-bold text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all"
//                       >
//                         ↩️ Unclaim (Dev)
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Burn Deadline - Compact Warning */}
//             <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-3">
//               <div className="flex items-center justify-between mb-2">
//                 <div className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
//                   <span className="text-red-400 text-xs font-bold">Burn Deadline</span>
//                 </div>
//                 <div className="text-red-300 text-xs font-mono">
//                   {countdown.days}d {countdown.hours}h {countdown.minutes}m
//                 </div>
//               </div>
//               <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
//                 <div 
//                   className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
//                   style={{ width: `${countdown.percentage}%` }}
//                 ></div>
//               </div>
//               <div className="text-red-300 text-xs mt-1">
//                 {countdown.percentage.toFixed(1)}% elapsed • Unclaimed tokens will be burned
//               </div>
//             </div>

//             {/* Balance Breakdown - Horizontal Layout */}
//             <div className="grid grid-cols-2 gap-3">
//               <div className="bg-white/5 border border-white/10 rounded-xl p-3">
//                 <div className="flex items-center gap-2 mb-1">
//                   <Icons.Energy size={12} className="text-green-500" />
//                   <span className="text-gray-400 text-xs">Claimable</span>
//                 </div>
//                 <div className="text-white text-lg font-bold font-mono">{claimableRZC.toFixed(3)}</div>
//                 <div className="text-gray-400 text-xs">From mining</div>
//               </div>
//               <div className="bg-white/5 border border-white/10 rounded-xl p-3">
//                 <div className="flex items-center gap-2 mb-1">
//                   <Icons.Energy size={12} className="text-emerald-500" />
//                   <span className="text-gray-400 text-xs">Available</span>
//                 </div>
//                 <div className="text-white text-lg font-bold font-mono">{claimedRZC.toFixed(3)}</div>
//                 <div className="text-gray-400 text-xs">Claimed balance</div>
//               </div>
//             </div>

//             {/* Announcements - Compact Cards */}
//             <div className="space-y-3">
//               <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-4">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-1">
//                       <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
//                       <span className="text-emerald-400 text-xs font-bold">Ecosystem Update</span>
//                     </div>
//                     <h4 className="text-white text-sm font-bold mb-1">RZC Token Sale Opening Soon</h4>
//                     <p className="text-gray-400 text-xs">Priority whitelist access for early miners</p>
//                   </div>
//                   <Icons.Energy size={20} className="text-emerald-500/30" />
//                 </div>
//               </div>
              
//               <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-1">
//                       <Icons.Info size={12} className="text-gray-400" />
//                       <span className="text-gray-400 text-xs font-bold">Status Report</span>
//                     </div>
//                     <h4 className="text-white text-sm font-bold mb-1">Pre-Mining Season Completed</h4>
//                     <p className="text-gray-400 text-xs">All nodes transitioned to Phase 4</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Referral Link - Compact */}
//             <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <Icons.Users size={14} className="text-green-500" />
//                 <span className="text-gray-400 text-xs font-bold">Referral Link</span>
//               </div>
//               <div className="flex gap-2">
//                 <div className="flex-1 bg-black/20 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono truncate">
//                   t.me/rhizacore_bot?startapp={referralCode || sponsorCode}
//                 </div>
//                 <button 
//                   onClick={handleCopy}
//                   className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
//                     copyFeedback 
//                       ? 'bg-green-500 text-black' 
//                       : 'bg-white/10 text-gray-400 hover:text-white'
//                   }`}
//                 >
//                   <Icons.Copy size={14} />
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === 'leaderboard' && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="text-white font-bold text-lg">Global Ranking</h3>
//                 <p className="text-gray-400 text-xs">Top claimed RZC balances</p>
//               </div>
//               <button
//                 onClick={refreshLeaderboard}
//                 disabled={isLoadingLeaderboard}
//                 className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-50"
//               >
//                 <Icons.Refresh size={14} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
//               </button>
//             </div>

//             {isLoadingLeaderboard ? (
//               <div className="text-center py-8">
//                 <div className="w-12 h-12 border-3 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-3"></div>
//                 <p className="text-gray-400 text-sm">Loading rankings...</p>
//               </div>
//             ) : leaderboard.length === 0 ? (
//               <div className="text-center py-8">
//                 <Icons.Users size={32} className="text-gray-500 mx-auto mb-3" />
//                 <p className="text-gray-400 text-sm">No players found</p>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 {leaderboard.slice(0, 10).map((player) => (
//                   <div 
//                     key={`${player.rank}-${player.username}`} 
//                     className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
//                       player.isUser 
//                         ? 'bg-green-500/10 border-green-500/30' 
//                         : 'bg-white/5 border-white/10'
//                     }`}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
//                         player.rank <= 3 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-gray-400'
//                       }`}>
//                         {player.rank}
//                       </div>
                      
//                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center text-white font-bold text-sm">
//                         {player.username[0]?.toUpperCase() || 'U'}
//                       </div>
                      
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <span className="text-white text-sm font-bold">{player.username}</span>
//                           {player.isUser && (
//                             <span className="bg-green-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">YOU</span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="text-right">
//                       <div className="text-white font-bold font-mono text-sm">
//                         {player.balance.toLocaleString(undefined, { 
//                           minimumFractionDigits: 2, 
//                           maximumFractionDigits: 2 
//                         })}
//                       </div>
//                       <div className="text-green-500 text-xs font-bold">RZC</div>
//                     </div>
//                   </div>
//                 ))}
                
//                 {leaderboard.length > 10 && (
//                   <div className="text-center py-2 text-gray-400 text-xs">
//                     Showing top 10 • Your rank: {leaderboard.find(p => p.isUser)?.rank || 'Unranked'}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'roadmap' && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between mb-6">
//               <div>
//                 <h3 className="text-white font-bold text-lg">Roadmap 2026</h3>
//                 <p className="text-gray-400 text-xs">Building the decentralized core</p>
//               </div>
//               <span className="text-green-500 text-xs font-mono bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
//                 V4.0_NEXT
//               </span>
//             </div>

//             <div className="space-y-4">
//               {RoadmapMilestones.map((milestone, idx) => (
//                 <div key={idx} className="relative">
//                   <div className="flex gap-4">
//                     <div className="flex flex-col items-center">
//                       {milestone.icon}
//                       {idx < RoadmapMilestones.length - 1 && (
//                         <div className="w-px h-12 bg-gradient-to-b from-green-500/30 to-gray-800 mt-2"></div>
//                       )}
//                     </div>
                    
//                     <div className="flex-1 pb-4">
//                       <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all">
//                         <div className="flex justify-between items-center mb-2">
//                           <span className="text-green-500 text-xs font-bold font-mono">{milestone.quarter}</span>
//                           <span className={`text-xs font-bold px-2 py-1 rounded ${
//                             milestone.status === 'Target' 
//                               ? 'bg-green-500/20 text-green-400' 
//                               : 'bg-white/10 text-gray-400'
//                           }`}>
//                             {milestone.status}
//                           </span>
//                         </div>
//                         <h4 className="text-white text-sm font-bold mb-1">{milestone.title}</h4>
//                         <p className="text-gray-400 text-xs leading-relaxed">{milestone.description}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Compact Footer Status */}
//       <div className="shrink-0 border-t border-white/5 px-4 py-3 flex justify-between items-center bg-black/20">
//         <div className="flex items-center gap-2">
//           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
//           <span className="text-white text-xs font-bold">NODE_ONLINE</span>
//         </div>
//         <div className="text-green-500 text-xs font-mono">
//           {countdown.days}D:{countdown.hours}H:{countdown.minutes}M
//         </div>
//       </div>
//     </div>
//   );
// });

// export default ArcadeMiningUI;