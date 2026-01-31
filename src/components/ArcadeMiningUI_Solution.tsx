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
//   getMiningHistory,
//   initializeFreeMiningPeriod,
//   canUserStartMining,
//   recordMiningActivity,
//   claimTotalEarnedToAirdrop,
//   claimRZCRewards,
//   transferClaimedRZCToAirdrop,
//   MiningSession
// } from '../lib/supabaseClient';
// import { Icons } from './Icon';

// // Global window interface for wallet integration
// declare global {
//   interface Window {
//     refreshWalletBalance?: () => Promise<void>;
//   }
// }

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
//   const [databaseAvailableBalance, setDatabaseAvailableBalance] = useState(0);
//   const [, setMiningHistory] = useState<MiningSession[]>([]);
  
//   const [, setCanStartMining] = useState(false);
  
//   const [, setTeamMembers] = useState<any[]>([]);
  
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
//   const [isProcessingClaim, setIsProcessingClaim] = useState(false);
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
        
//         // Get the actual database available_balance for display
//         const { data: userData, error: userError } = await supabase
//           .from('users')
//           .select('available_balance')
//           .eq('id', userId)
//           .single();
        
//         if (userData && !userError) {
//           setDatabaseAvailableBalance(parseFloat(userData.available_balance) || 0);
//         }
        
//         // Update the game data context
//         updateClaimedRZC(rzcBalance.claimedRZC);
//         updateMiningBalance(rzcBalance.claimableRZC + (isMining ? accumulatedRZC : 0));
        
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
//             const now = new Date();

//             const elapsedSeconds = Math.max(0, (now.getTime() - sessionStartTime.getTime()) / 1000);
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

//   const handleClaimToWallet = async () => {
//     if (!userId || isProcessingClaim) return;

//     setIsProcessingClaim(true);
//     try {
//       // First, get detailed balance information for debugging
//       console.log('=== TRANSFER TO WALLET DEBUG ===');
//       console.log('User ID:', userId);
//       console.log('Current component state:');
//       console.log('- claimableRZC:', claimableRZC);
//       console.log('- accumulatedRZC:', accumulatedRZC);
//       console.log('- claimedRZC:', claimedRZC);
//       console.log('- isMining:', isMining);
//       console.log('- displayBalance:', displayBalance);

//       // Get fresh balance data from the database
//       const freshBalance = await getUserRZCBalance(userId);
//       console.log('Fresh balance from database:');
//       console.log('- claimableRZC:', freshBalance.claimableRZC);
//       console.log('- claimedRZC:', freshBalance.claimedRZC);
//       console.log('- totalEarned:', freshBalance.totalEarned);
//       console.log('- lastClaimTime:', freshBalance.lastClaimTime);

//       const totalToTransfer = freshBalance.totalEarned;
//       console.log('Total to transfer (totalEarned):', totalToTransfer);
      
//       // Show the validation values that will be used
//       const validationBalance = {
//         claimable: freshBalance.claimableRZC,
//         accumulated: 0,
//         claimed: freshBalance.claimedRZC
//       };
//       console.log('Validation balance object:', validationBalance);
//       console.log('Available for validation (claimable + accumulated):', validationBalance.claimable + validationBalance.accumulated);
//       console.log('Will validation pass?', totalToTransfer <= (validationBalance.claimable + validationBalance.accumulated));
      
//       if (totalToTransfer <= 0) {
//         console.log('No RZC to transfer - totalEarned is 0 or negative');
//         showSnackbar?.({
//           message: 'No RZC to Transfer',
//           description: 'Start mining to earn RZC tokens first.'
//         });
//         return;
//       }

//       // Use the database available balance as the primary transfer amount
//       const transferAmount = databaseAvailableBalance;
//       console.log('Using database available balance for transfer:', transferAmount);
      
//       if (transferAmount <= 0) {
//         console.log('No available balance to transfer');
//         showSnackbar?.({
//           message: 'No Available Balance',
//           description: 'Your available balance is empty. Continue mining to earn RZC.'
//         });
//         return;
//       }

//       // Check if user has any mining activities
//       const { data: activities, error: activitiesError } = await supabase
//         .from('activities')
//         .select('id, type, amount, status, created_at')
//         .eq('user_id', userId)
//         .order('created_at', { ascending: false })
//         .limit(10);

//       console.log('Recent activities:', activities);
//       if (activitiesError) {
//         console.error('Error fetching activities:', activitiesError);
//       }

//       console.log('Attempting to transfer database available balance...');
      
//       // Try transferring the database available balance directly
//       const transferResult = await transferClaimedRZCToAirdrop(userId, transferAmount);
//       console.log('Transfer database available balance result:', transferResult);
      
//       if (transferResult.success) {
//         showSnackbar?.({
//           message: 'Transfer Complete!',
//           description: `${transferAmount.toFixed(4)} RZC transferred to your secure wallet.`
//         });
        
//         // Refresh balances
//         await fetchBalance();
        
//         // Trigger wallet refresh if available
//         if (typeof window !== 'undefined' && window.refreshWalletBalance) {
//           window.refreshWalletBalance();
//         }
//         return;
//       } else {
//         console.error('Transfer database available balance failed:', transferResult.error);
//         showSnackbar?.({
//           message: 'Transfer Failed',
//           description: transferResult.error || 'Failed to transfer available balance to wallet.'
//         });
//         return;
//       }
//     } catch (error) {
//       console.error('Error transferring to wallet:', error);
//       showSnackbar?.({
//         message: 'Transfer Error',
//         description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
//       });
//     } finally {
//       setIsProcessingClaim(false);
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

//   const fetchBalance = async (showLoading = false) => {
//     if (!userId) return;
//     try {
//       const updatedBalance = await getUserRZCBalance(userId);
//       setClaimableRZC(updatedBalance.claimableRZC);
//       setClaimedRZC(updatedBalance.claimedRZC);

//       // Also fetch the database available_balance
//       const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select('available_balance')
//         .eq('id', userId)
//         .single();
      
//       if (userData && !userError) {
//         setDatabaseAvailableBalance(parseFloat(userData.available_balance) || 0);
//       }

//       if (showLoading) {
//         showSnackbar?.({
//           message: 'Balance Updated',
//           description: `Available: ${databaseAvailableBalance.toFixed(4)} RZC`
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
//     <div className="flex flex-col h-full w-full pb-20 overflow-hidden px-3 pt-4">
//       {/* Compact Tab Header */}
//       <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10 mb-4 w-full max-w-sm mx-auto shrink-0">
//         <button 
//           onClick={() => setActiveTab('rewards')}
//           className={`flex-1 py-2 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${
//             activeTab === 'rewards' 
//               ? 'bg-green-500 text-black shadow-md shadow-green-500/20' 
//               : 'text-gray-500 hover:text-gray-300'
//           }`}
//         >
//           Rewards
//         </button>
//         <button 
//           onClick={() => setActiveTab('leaderboard')}
//           className={`flex-1 py-2 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${
//             activeTab === 'leaderboard' 
//               ? 'bg-green-500 text-black shadow-md shadow-green-500/20' 
//               : 'text-gray-500 hover:text-gray-300'
//           }`}
//         >
//           Ranking
//         </button>
//         <button 
//           onClick={() => setActiveTab('roadmap')}
//           className={`flex-1 py-2 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${
//             activeTab === 'roadmap' 
//               ? 'bg-green-500 text-black shadow-md shadow-green-500/20' 
//               : 'text-gray-500 hover:text-gray-300'
//           }`}
//         >
//           Roadmap
//         </button>
//       </div>

//       {/* Content Area */}
//       <div 
//         className="flex-1 overflow-y-auto scroll-smooth thin-scrollbar"
//         onScroll={(e) => {
//           const element = e.currentTarget;
//           element.classList.add('scrolling');
//           clearTimeout((element as any).scrollTimeout);
//           (element as any).scrollTimeout = setTimeout(() => {
//             element.classList.remove('scrolling');
//           }, 1000);
//         }}
//       >
//         {activeTab === 'rewards' && (
//           <div className="flex flex-col animate-in fade-in duration-300">
//             {/* Compact Balance Display with Transfer Button */}
//             <div className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-green-500/10 to-transparent border border-white/5 p-5 text-center shadow-xl">
//               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/5 blur-[40px] rounded-full -mt-16"></div>
              
//               <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 mb-4">
//                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]"></div>
//                 <span className="text-green-500 text-[8px] font-bold uppercase tracking-wide font-mono">
//                   Mining Balance
//                 </span>
//               </div>
              
//               <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wide mb-1">Total RZC Earned</p>
              
//               <div className="flex items-end justify-center gap-1.5 mb-2">
//                 <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-xl">{displayBalance.toFixed(3)}</h2>
//                 <span className="text-green-500 font-bold text-sm mb-1">RZC</span>
//               </div>
              
//               {/* Available Balance Display */}
//               <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
//                 <p className="text-green-400 text-[8px] font-bold uppercase tracking-wide mb-1 text-center">Available to Transfer</p>
//                 <p className="text-green-500 text-lg font-bold text-center font-mono">
//                   {databaseAvailableBalance.toFixed(4)} RZC
//                 </p>
//               </div>
              
//               {/* Debug Info - Remove in production */}
//               <div className="mb-4 p-2 bg-black/20 rounded-lg text-left">
//                 <p className="text-[8px] text-gray-400 mb-1">Debug Info:</p>
//                 <p className="text-[7px] text-gray-500">Claimable: {claimableRZC.toFixed(4)}</p>
//                 <p className="text-[7px] text-gray-500">Accumulated: {accumulatedRZC.toFixed(4)}</p>
//                 <p className="text-[7px] text-gray-500">Claimed: {claimedRZC.toFixed(4)}</p>
//                 <p className="text-[7px] text-green-400">DB Available: {databaseAvailableBalance.toFixed(4)}</p>
//                 <p className="text-[7px] text-gray-500">Mining: {isMining ? 'Yes' : 'No'}</p>
//               </div>
              
//               <button 
//                 onClick={handleClaimToWallet}
//                 disabled={isProcessingClaim || databaseAvailableBalance <= 0}
//                 className={`group relative w-full overflow-hidden rounded-xl shadow-[0_15px_30px_-8px_rgba(34,197,94,0.4)] active:scale-[0.98] transition-all disabled:opacity-50`}
//               >
//                 <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-600 to-green-500 animate-gradient-x bg-[length:200%_100%]"></div>
//                 <div className="relative flex items-center justify-center gap-2 py-3.5 text-black font-bold uppercase tracking-wide text-xs">
//                   {isProcessingClaim ? (
//                     <div className="w-4 h-4 border-[2px] border-black/30 border-t-black rounded-full animate-spin"></div>
//                   ) : (
//                     <>
//                       <Icons.Wallet size={16} />
//                       <span>Transfer {databaseAvailableBalance.toFixed(3)} RZC</span>
//                     </>
//                   )}
//                 </div>
//               </button>
              
//               <p className="text-gray-500 text-[8px] font-medium mt-3">
//                 {databaseAvailableBalance > 0 
//                   ? `Transfer ${databaseAvailableBalance.toFixed(4)} RZC from your mining balance to secure wallet`
//                   : 'Start mining to earn RZC tokens for transfer'
//                 }
//               </p>
//             </div>

//             {/* Ultra-Compact Burn Deadline */}
//             <div className="relative mb-3 rounded-lg overflow-hidden bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/40 shadow-md animate-pulse">
//               <div className="relative z-10 p-2.5">
//                 <div className="flex items-center justify-between mb-1.5">
//                   <div className="flex items-center gap-1.5">
//                     <div className="relative">
//                       <div className="w-3 h-3 bg-red-500/20 rounded-full flex items-center justify-center">
//                         <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
//                       </div>
//                       <div className="absolute inset-0 w-3 h-3 bg-red-500/30 rounded-full animate-ping"></div>
//                     </div>
//                     <span className="text-red-400 text-[8px] font-bold uppercase tracking-wide">🔥 BURN DEADLINE</span>
//                   </div>
//                   <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
//                     <span className="text-red-300 text-[10px] font-mono font-bold">
//                       {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h
//                     </span>
//                   </div>
//                 </div>

//                 <div className="relative w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-red-500/30">
//                   <div 
//                     className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-1000 ease-linear shadow-[0_0_6px_rgba(239,68,68,0.6)]" 
//                     style={{ width: `${countdown.percentage}%` }}
//                   >
//                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
//                   </div>
//                 </div>

//                 <div className="text-center mt-1.5">
//                   <p className="text-red-300 text-[8px] font-bold">
//                     <span className="text-red-400">{countdown.percentage.toFixed(1)}%</span> • Unclaimed tokens will be burned!
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Compact Announcements */}
//             <div className="space-y-3 mb-5">
//               <div className="bg-gradient-to-br from-emerald-600/20 via-green-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden group">
//                 <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:scale-110 transition-transform">
//                   <Icons.Energy size={24} className="text-emerald-500" />
//                 </div>
//                 <div className="flex flex-col relative z-10">
//                   <h3 className="text-emerald-400 text-[8px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5">
//                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
//                     Ecosystem Update
//                   </h3>
//                   <h4 className="text-white text-sm font-bold tracking-tight mb-1.5">RZC Token Sale Opening Soon</h4>
//                   <p className="text-gray-400 text-[9px] leading-relaxed font-medium">Priority whitelist access for early miners. Prepare for the premier liquidity event.</p>
//                 </div>
//               </div>

//               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
//                 <div className="flex flex-col relative z-10">
//                   <h3 className="text-gray-500 text-[8px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5">
//                     <Icons.Info size={12} className="text-gray-500" />
//                     Status Report
//                   </h3>
//                   <h4 className="text-white/80 text-sm font-bold tracking-tight mb-1">Pre-Mining Season Completed</h4>
//                   <p className="text-gray-500 text-[9px] leading-relaxed font-medium">Genesis mining has ended. All active nodes transitioned to Phase 4.</p>
//                 </div>
//               </div>
//             </div>

//             {/* Compact Breakdown Grid */}
//             <div className="grid grid-cols-2 gap-3 mb-5">
//               <div className="bg-white/5 border border-white/10 rounded-xl p-3">
//                 <div className="flex items-center gap-1.5 mb-1.5">
//                   <Icons.Energy size={10} className="text-green-500" />
//                   <span className="text-gray-500 text-[8px] font-bold uppercase">Mining Gain</span>
//                 </div>
//                 <p className="text-white text-base font-bold font-mono tracking-tight">{(isMining ? accumulatedRZC : 0).toFixed(3)}</p>
//               </div>
//               <div className="bg-white/5 border border-white/10 rounded-xl p-3">
//                 <div className="flex items-center gap-1.5 mb-1.5">
//                   <Icons.Energy size={10} className="text-emerald-500" />
//                   <span className="text-gray-500 text-[8px] font-bold uppercase">Total Earned</span>
//                 </div>
//                 <p className="text-white text-base font-bold font-mono tracking-tight">
//                   {(claimableRZC + claimedRZC).toFixed(3)}
//                 </p>
//               </div>
//             </div>

//             {/* Compact Referral Link */}
//             <div className="mb-5">
//               <p className="text-gray-500 text-[8px] font-bold uppercase tracking-wide mb-2 px-1 text-center">Referral Node Active</p>
//               <div className="flex gap-2">
//                 <div className="flex-1 bg-white/5 border border-white/10 rounded-lg flex items-center px-3 py-2.5 group hover:border-green-500/30 transition-all cursor-pointer">
//                   <span className="text-gray-400 text-[10px] truncate font-mono tracking-tight">
//                     {`t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`}
//                   </span>
//                 </div>
//                 <button 
//                   onClick={handleCopy}
//                   className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-90 ${
//                     copyFeedback 
//                       ? 'bg-green-500 text-black' 
//                       : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
//                   }`}
//                 >
//                   <Icons.Copy size={16} />
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === 'leaderboard' && (
//           <div className="flex flex-col animate-in fade-in duration-300">
//             <div className="mb-3 px-1 text-center">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex-1">
//                   <h3 className="text-white font-bold text-base uppercase tracking-wide mb-0.5">Global Ranking</h3>
//                   <p className="text-gray-500 text-[8px] font-bold uppercase tracking-wide">Top Claimed RZC Balances</p>
//                 </div>
//                 <button
//                   onClick={refreshLeaderboard}
//                   disabled={isLoadingLeaderboard}
//                   className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
//                   title="Refresh"
//                 >
//                   <Icons.Refresh size={12} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
//                 </button>
//               </div>
//             </div>

//             {isLoadingLeaderboard ? (
//               <div className="text-center py-6">
//                 <div className="w-12 h-12 border-3 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-3"></div>
//                 <p className="text-gray-500 text-xs">Loading leaderboard...</p>
//               </div>
//             ) : leaderboard.length === 0 ? (
//               <div className="text-center py-6">
//                 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
//                   <Icons.Users size={20} className="text-gray-500" />
//                 </div>
//                 <p className="text-gray-500 text-xs">No players found</p>
//                 <p className="text-gray-600 text-[10px] mt-1">Be the first to start mining!</p>
//               </div>
//             ) : (
//               <div className="space-y-1.5 mb-4">
//                 {leaderboard.map((player) => (
//                   <div 
//                     key={`${player.rank}-${player.username}`} 
//                     className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
//                       player.isUser 
//                         ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
//                         : 'bg-white/5 border-white/10 hover:bg-white/8'
//                     }`}
//                   >
//                     <div className="flex items-center gap-2.5">
//                       <div className="flex items-center justify-center min-w-[28px]">
//                         <span className={`text-center font-bold font-mono text-xs ${
//                           player.rank <= 3 ? 'text-green-500' : 
//                           player.rank <= 10 ? 'text-yellow-500' : 
//                           'text-gray-500'
//                         }`}>
//                           #{player.rank}
//                         </span>
//                       </div>
                      
//                       <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center text-white font-bold border border-white/10 text-xs">
//                         {player.username[0]?.toUpperCase() || 'U'}
//                       </div>
                      
//                       <div className="flex items-center gap-1.5">
//                         <h4 className="text-white text-xs font-bold tracking-tight">
//                           {player.username}
//                         </h4>
//                         {player.isUser && (
//                           <span className="bg-green-500 text-black text-[6px] font-bold px-1 py-0.5 rounded">YOU</span>
//                         )}
//                         {player.rank <= 3 && (
//                           <span className={`text-[6px] font-bold px-1 py-0.5 rounded ${
//                             player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
//                             player.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
//                             'bg-orange-500/20 text-orange-500'
//                           }`}>
//                             TOP {player.rank}
//                           </span>
//                         )}
//                       </div>
//                     </div>
                    
//                     <div className="text-right">
//                       <p className="text-white font-bold font-mono text-xs">
//                         {player.balance.toLocaleString(undefined, { 
//                           minimumFractionDigits: 2, 
//                           maximumFractionDigits: 2 
//                         })}
//                       </p>
//                       <p className="text-green-500 text-[7px] font-bold uppercase tracking-wide">RZC</p>
//                     </div>
//                   </div>
//                 ))}
                
//                 {leaderboard.length >= 50 && (
//                   <div className="text-center py-2 border-t border-white/10 mt-3">
//                     <p className="text-gray-500 text-[8px] font-medium">
//                       Top 50 • {leaderboard.filter(p => p.isUser).length > 0 ? 'Your rank shown above' : 'Keep claiming to join!'}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'roadmap' && (
//           <div className="flex flex-col animate-in slide-in-from-right duration-300">
//             <div className="mb-6 px-1">
//               <div className="flex items-center justify-between mb-5">
//                 <div className="flex flex-col">
//                   <h3 className="text-white font-bold text-base uppercase tracking-wide mb-0.5 flex items-center gap-2">
//                     <div className="w-1 h-5 bg-green-500 rounded-full"></div>
//                     Roadmap 2026
//                   </h3>
//                   <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wide ml-3">Building the Decentralized Core</p>
//                 </div>
//                 <span className="text-green-500 text-[8px] font-mono font-bold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">
//                   V4.0_NEXT
//                 </span>
//               </div>

//               <div className="relative space-y-5">
//                 {/* Vertical Line */}
//                 <div className="absolute left-[6px] top-2 bottom-2 w-px bg-gradient-to-b from-green-500/50 via-gray-800 to-transparent"></div>

//                 {RoadmapMilestones.map((milestone, idx) => (
//                   <div key={idx} className="relative pl-8 group">
//                     <div className="absolute left-0 top-1.5 z-10">
//                       {milestone.icon}
//                     </div>
//                     <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-default relative overflow-hidden">
//                       {milestone.status === 'Target' && (
//                         <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 blur-xl rounded-full -mr-6 -mt-6"></div>
//                       )}
//                       <div className="flex justify-between items-center mb-1.5">
//                         <span className="text-green-500 text-[9px] font-bold font-mono tracking-wide">{milestone.quarter}</span>
//                         <span className={`text-[8px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
//                           milestone.status === 'Target' 
//                             ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
//                             : 'bg-white/5 text-gray-500'
//                         }`}>
//                           {milestone.status}
//                         </span>
//                       </div>
//                       <h4 className="text-white text-xs font-bold mb-1.5 tracking-tight">{milestone.title}</h4>
//                       <p className="text-gray-400 text-[10px] leading-relaxed font-medium">{milestone.description}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Compact Ecosystem Status Footer */}
//       <div className="shrink-0 border-t border-white/5 pt-4 flex justify-between items-center px-2 mb-1">
//         <div className="flex flex-col">
//           <span className="text-gray-500 text-[8px] font-bold uppercase mb-0.5">Network Status</span>
//           <div className="flex items-center gap-1.5">
//             <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,1)] animate-pulse"></div>
//             <span className="text-white text-[8px] font-bold font-mono">NODE_ONLINE</span>
//           </div>
//         </div>
//         <div className="flex flex-col items-end">
//           <span className="text-gray-500 text-[8px] font-bold uppercase mb-0.5">Season Context</span>
//           <span className="bg-green-500/10 px-2 py-0.5 rounded text-green-500 font-bold text-[8px] font-mono border border-green-500/10">
//             {countdown.days}D:{countdown.hours}H:{countdown.minutes}M
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// });

// export default ArcadeMiningUI;