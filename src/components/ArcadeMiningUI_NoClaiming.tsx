// import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
// import { useI18n } from '@/components/I18nProvider';
// import { useGameData } from '@/contexts/GameDataContext';
// import {
//   supabase,
//   ensureUserHasSponsorCode,
//   startMiningSessionUnrestricted,
//   getActiveMiningSession,
//   manualCompleteMiningSession,
//   getMiningHistory,
//   initializeFreeMiningPeriod,
//   canUserStartMining,
//   recordMiningActivity,
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
//   const { updateMiningBalance, setIsMining: setContextIsMining } = useGameData();
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
//       // Fetch top 50 users by total mining activities
//       const { data: topUsers, error } = await supabase
//         .from('users')
//         .select('id, username, total_earned')
//         .order('total_earned', { ascending: false })
//         .limit(50);

//       if (error) throw error;

//       const leaderboardData = topUsers?.map((user, index) => ({
//         rank: index + 1,
//         username: user.username || `User ${user.id}`,
//         balance: user.total_earned || 0,
//         isUser: user.id === userId
//       })) || [];

//       setLeaderboard(leaderboardData);
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

//   // Load leaderboard on mount
//   useEffect(() => {
//     const loadLeaderboard = async () => {
//       await refreshLeaderboard();
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

//         const [
//           miningCheck,
//           activeSession,
//           history,
//           sponsorQueryResult,
//           referralStatsResult,
//           teamMembersResult
//         ] = await Promise.all([
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
        
//         // Update the game data context with mining balance only
//         updateMiningBalance(isMining ? accumulatedRZC : 0);
        
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
//             const elapsedSeconds = Math.max(0, (now.getTime() - sessionStartTime.getTime()) / 1000);
//             const RZC_PER_SECOND = 50 / (24 * 60 * 60); // Simplified rate
//             const initialAccumulated = elapsedSeconds * RZC_PER_SECOND;
//             setAccumulatedRZC(initialAccumulated);
//           }
//         }
//       } catch (error) {
//         console.error('Error loading mining data:', error);
//       }
//     };

//     loadAllData();
//   }, [userId, userUsername, isMining, accumulatedRZC, updateMiningBalance]);

//   const rolloverSession = async () => {
//     if (!userId || !isMining || !currentSession) return;

//     try {
//       const result = await manualCompleteMiningSession(currentSession.id);
//       if (result.success) {
//         await recordMiningActivity(userId, 'mining_complete', result.rzcEarned || 0);
        
//         setIsMining(false);
//         setCurrentSession(null);
//         setAccumulatedRZC(0);
        
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

//   useImperativeHandle(ref, () => ({
//     refreshBalance: () => {} // No longer needed without claiming
//   }));

//   return (
//     <div className="flex flex-col h-full w-full pb-24 overflow-hidden">
//       {/* Compact Header with Balance */}
//       <div className="shrink-0 px-4 pt-4 pb-3 bg-gradient-to-b from-black/20 to-transparent">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
//               <Icons.Energy size={16} className="text-black" />
//             </div>
//             <div>
//               <h1 className="text-white font-black text-lg">RZC Mining</h1>
//               <p className="text-gray-400 text-xs">Earn RhizaCore tokens</p>
//             </div>
//           </div>
//           <div className="text-right">
//             <div className="text-white text-lg font-black font-mono">{accumulatedRZC.toFixed(3)}</div>
//             <div className="text-green-500 text-xs font-bold">Current Session</div>
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
//             Mining
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

//       {/* Main Content Area */}
//       <div className="flex-1 overflow-y-auto px-4">
//         {activeTab === 'rewards' && (
//           <div className="space-y-4">
//             {/* Mining Status Card */}
//             <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-2">
//                   <div className={`w-3 h-3 rounded-full animate-pulse ${isMining ? 'bg-green-500' : 'bg-gray-500'}`}></div>
//                   <span className={`text-xs font-bold ${isMining ? 'text-green-500' : 'text-gray-500'}`}>
//                     {isMining ? 'Mining Active' : 'Mining Inactive'}
//                   </span>
//                 </div>
//               </div>
              
//               <div className="text-center py-6">
//                 <div className="text-3xl font-black text-white mb-1">
//                   {accumulatedRZC.toFixed(3)} <span className="text-lg text-green-500">RZC</span>
//                 </div>
//                 <div className="text-gray-400 text-xs">
//                   {isMining ? 'Earning from current session' : 'Start mining to earn RZC'}
//                 </div>
//               </div>
//             </div>

//             {/* Referral Section */}
//             <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4">
//               <div className="flex items-center justify-between mb-3">
//                 <div>
//                   <h3 className="text-white font-bold text-lg">Invite Friends</h3>
//                   <p className="text-gray-400 text-xs">Share your referral link</p>
//                 </div>
//               </div>
              
//               <div className="flex gap-2">
//                 <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2">
//                   <div className="text-white text-xs font-mono truncate">
//                     {referralCode || sponsorCode || 'Loading...'}
//                   </div>
//                 </div>
//                 <button 
//                   onClick={handleCopy}
//                   className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
//                     copyFeedback 
//                       ? 'bg-green-500 text-black' 
//                       : 'bg-blue-500 text-white hover:bg-blue-400'
//                   }`}
//                 >
//                   {copyFeedback ? 'Copied!' : 'Copy'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === 'leaderboard' && (
//           <div className="space-y-4">
//             <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
//               <div className="flex items-center justify-between mb-4">
//                 <div>
//                   <h3 className="text-white font-bold text-lg">Global Ranking</h3>
//                   <p className="text-gray-400 text-xs">Top miners by total earned</p>
//                 </div>
//                 <button 
//                   onClick={refreshLeaderboard}
//                   disabled={isLoadingLeaderboard}
//                   className="p-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50"
//                 >
//                   <Icons.Refresh size={16} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
//                 </button>
//               </div>
              
//               <div className="space-y-2 max-h-96 overflow-y-auto">
//                 {leaderboard.map((user) => (
//                   <div 
//                     key={user.rank}
//                     className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
//                       user.isUser 
//                         ? 'bg-green-500/20 border-green-500/30 text-green-400' 
//                         : 'bg-white/5 border-white/10 text-gray-300'
//                     }`}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
//                         user.rank <= 3 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'
//                       }`}>
//                         {user.rank}
//                       </div>
//                       <span className="font-medium">{user.username}</span>
//                     </div>
//                     <span className="font-mono text-sm">{user.balance.toFixed(3)} RZC</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === 'roadmap' && (
//           <div className="space-y-4">
//             <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
//               <h3 className="text-white font-bold text-lg mb-4">Development Roadmap</h3>
              
//               <div className="space-y-4">
//                 {RoadmapMilestones.map((milestone, index) => (
//                   <div key={index} className="flex gap-4 p-3 bg-white/5 border border-white/10 rounded-lg">
//                     <div className="flex-shrink-0 mt-1">
//                       {milestone.icon}
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex items-center gap-2 mb-1">
//                         <h4 className="text-white font-bold text-sm">{milestone.title}</h4>
//                         <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded">
//                           {milestone.quarter}
//                         </span>
//                       </div>
//                       <p className="text-gray-400 text-xs">{milestone.description}</p>
//                       <div className="mt-2">
//                         <span className={`text-xs px-2 py-0.5 rounded ${
//                           milestone.status === 'Target' ? 'bg-green-500/20 text-green-400' :
//                           milestone.status === 'Planned' ? 'bg-blue-500/20 text-blue-400' :
//                           'bg-gray-500/20 text-gray-400'
//                         }`}>
//                           {milestone.status}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// });

// ArcadeMiningUI.displayName = 'ArcadeMiningUI';

// export default ArcadeMiningUI;