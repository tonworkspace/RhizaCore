// import { useEffect, useState } from 'react'
// import { supabase } from '../lib/supabaseClient'
// import useAuth from '@/hooks/useAuth'
// import { GiTrophyCup } from 'react-icons/gi'
// // import { novatoken } from '@/images' // Removed as we're using RZC now

// // Update the interface to match your table structure
// interface ReferralWithUsers {
//   id: number;
//   sponsor_id: number;
//   referred_id: number;
//   status: 'active' | 'inactive';
//   created_at: string;
//   level: number;
//   sponsor: {
//     username: string;
//     telegram_id: number;
//   };
//   referred: {
//     username: string;
//     telegram_id: number;
//     total_earned: number;
//     total_deposit: number;
//     rank: string;
//     is_premium: boolean;
//   };
//   sbt_amount: number;
//   total_sbt_earned: number;
// }

// // interface ReferralSummary {
// //   total_referrals: number;
// //   total_users: number;
// //   active_referrals: number;
// //   inactive_referrals: number;
// //   conversion_rate: number;
// // }

// type SponsorDataFromDB = {
//   sponsor_id: number;
//   sponsor: {
//     username: string;
//     total_earned: number;
//     total_deposit: number;
//     rank: string;
//   } | null;
//   status: string;
// }

// interface SponsorStat {
//   sponsor_id: number;
//   username: string;
//   referral_count: number;
//   active_referrals: number;
//   total_earned: number;
//   total_deposit: number;
//   rank: string;
// }


// // Update the constant
// const ACTIVE_REFERRAL_REWARD = 1000; // 1000 RZC per active referral

// // Add proper type for tree state
// interface TreeUser {
//   id: number;
//   username: string;
//   created_at: string;
//   is_active: boolean;
//   is_premium: boolean;
// }

// interface TreeData {
//   upline: TreeUser | null;
//   downline: TreeUser[];
// }

// type ReferralWithUser = {
//   referred: {
//     id: number;
//     username: string;
//     created_at: string;
//     is_active: boolean;
//     is_premium: boolean;
//   }
// }

// // Add this helper function near the top of the file
// const isRecentlyJoined = (dateString: string): boolean => {
//   const joinDate = new Date(dateString);
//   const now = new Date();
//   const daysDifference = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
//   return daysDifference <= 7; // Consider users joined within last 7 days as recent
// };

// const ReferralSystem = () => {
//   const [, setReferrals] = useState<ReferralWithUsers[]>([]);
//   // const [referralSummary, setReferralSummary] = useState<ReferralSummary>({
//   //   total_referrals: 0,
//   //   total_users: 0,
//   //   active_referrals: 0,
//   //   inactive_referrals: 0,
//   //   conversion_rate: 0
//   // });
//   const { user } = useAuth();
//   const [referralLink, setReferralLink] = useState<string>('');
//   const [referralCode, setReferralCode] = useState<string>('');
//   const [isLoading, setIsLoading] = useState(true);
//   const [, setError] = useState<string | null>(null);
//   const [, setTotalCount] = useState<number>(0);
//   const [allSponsorStats, setAllSponsorStats] = useState<SponsorStat[]>([]);
//   const [userReferralCount, setUserReferralCount] = useState<number>(0);
//   const [userActiveReferrals, setUserActiveReferrals] = useState<number>(0);

//   // Add pagination state
//   const [pageSize,] = useState<number>(50);
//   const [, setIsLoadingMore] = useState<boolean>(false);

//   // Add a new state for user's referrals
//   const [userReferrals, setUserReferrals] = useState<ReferralWithUsers[]>([]);
//   const [, setIsLoadingUserReferrals] = useState<boolean>(false);

//   // Add a state to control visibility (optional)
//   const [] = useState<boolean>(false);

//   // Add state for active tab
//   const [activeTab, setActiveTab] = useState<'my-referrals' | 'statistics'>('my-referrals');

//   // Add state for showing all referrals modal
//   const [showAllReferrals, setShowAllReferrals] = useState<boolean>(false);

//   // Add new state for active referral rewards
//   const [activeReferralReward, setActiveReferralReward] = useState<number>(0);

//   const [tree, setTree] = useState<TreeData>({ upline: null, downline: [] });

//   const [isTreeLoading, setIsTreeLoading] = useState(false);

//   // UI state for apply-by-code
//   const [applyCode, setApplyCode] = useState('');
//   const [isApplying, setIsApplying] = useState(false);

//   const loadTree = async () => {
//     if (!user?.id) return;
//     setIsTreeLoading(true);
//     try {
//       const data = await getReferralTree(user.id);
//       setTree(data);
//     } catch (error) {
//       console.error('Error loading referral tree:', error);
//     } finally {
//       setIsTreeLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadTree();
//   }, [user?.id]);

//   useEffect(() => {
//     if (!user?.id) return;
//     const subscription = supabase
//       .channel('referral_tree_changes')
//       .on('postgres_changes', 
//         {
//           event: '*',
//           schema: 'public',
//           table: 'users',
//           filter: `referral_id=eq.${user.id}`
//         },
//         loadTree
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(subscription);
//     };
//   }, [user?.id]);

//   useEffect(() => {
//     if (user?.id) {
//       console.log("User ID detected:", user.id);
//       console.log("User object:", user);
//       setReferralLink(`https://t.me/tappstokenbot?startapp=${user.telegram_id}`);
//       setReferralCode(String(user.telegram_id || user.id));
//     } else {
//       console.log("No user ID available in first useEffect");
//     }
//   }, [user?.id]);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         console.log("Starting loadData function");
//         // First get the total count of all referrals
//         const { count: totalReferralsCount, error: countError } = await supabase
//           .from('referrals')
//           .select('*', { count: 'exact', head: true });

//         if (countError) throw countError;
        
//         // // Get active referrals count
//         // const { count: activeCount, error: activeError } = await supabase
//         //   .from('referrals')
//         //   .select('*', { count: 'exact', head: true })
//         //   .eq('status', 'active');
          
//         // if (activeError) throw activeError;
        
//         // Get unique referrers count
//         // const { data: uniqueReferrers, error: referrersError } = await supabase
//         //   .from('referrals')
//         //   .select('referrer_id')
//         //   .limit(100000); // Set a high limit to get all records
          
//         // if (referrersError) throw referrersError;
        
//         // const uniqueReferrerCount = new Set(uniqueReferrers?.map(r => r.referrer_id)).size;
        
//         // Calculate summary
//         const totalCount = totalReferralsCount || 0;
//         // const activeReferrals = activeCount || 0;
//         // const inactiveReferrals = totalCount - activeReferrals;
        
//         // const summary = {
//         //   total_referrals: totalCount,
//         //   total_users: uniqueReferrerCount,
//         //   active_referrals: activeReferrals,
//         //   inactive_referrals: inactiveReferrals,
//         //   conversion_rate: totalCount ? 
//         //     Math.round((activeReferrals / totalCount) * 100) : 0
//         // };
        
//         // setReferralSummary(summary);
//         setTotalCount(totalCount);

//         // Get current user's referral count if user exists
//         if (user?.id) {
//           console.log("Attempting to get user referrals in loadData for user ID:", user.id);
//           const { data: userReferrals, error: userRefError } = await supabase
//             .from('referrals')
//             .select('id, status')
//             .eq('sponsor_id', user.id);
            
//           if (userRefError) {
//             console.error("Error fetching user referrals in loadData:", userRefError);
//           }
          
//           if (!userRefError && userReferrals) {
//             console.log("User referrals found in loadData:", userReferrals.length);
//             setUserReferralCount(userReferrals.length);
//             setUserActiveReferrals(userReferrals.filter(r => r.status === 'active').length);
//           } else {
//             console.log("No user referrals found in loadData");
//           }
//         } else {
//           console.log("No user ID available in loadData");
//         }

//         // Get sponsor stats with counts
//         const { data: sponsorStatsData } = await supabase
//           .from('referrals')
//           .select(`
//             sponsor_id,
//             sponsor:users!sponsor_id(
//               username,
//               total_earned,
//               total_deposit,
//               rank
//             ),
//             status
//           `) as { data: SponsorDataFromDB[] | null, error: any };

//         if (!sponsorStatsData) return { data: [] };
//         const counts = sponsorStatsData.reduce((acc: { [key: string]: any }, curr) => {
//           const id = curr.sponsor_id;
//           if (!acc[id]) {
//             acc[id] = {
//               sponsor_id: id,
//               username: curr.sponsor?.username,
//               referral_count: 0,
//               active_referrals: 0,
//               total_earned: curr.sponsor?.total_earned || 0,
//               total_deposit: curr.sponsor?.total_deposit || 0,
//               rank: curr.sponsor?.rank || 'NOVA_INITIATE'
//             };
//           }
//           acc[id].referral_count++;
//           if (curr.status === 'active') {
//             acc[id].active_referrals++;
//           }
//           return acc;
//         }, {});
        
//         const sponsorStats = Object.values(counts);
//         setAllSponsorStats(sponsorStats);

//         // Then get the first page of data
//         await loadReferralsPage(1);
//       } catch (err) {
//         console.error('Error in loadData:', err);
//         setError(err instanceof Error ? err.message : 'Failed to load referrals');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();

//     // Set up real-time subscription
//     const subscription = supabase
//       .channel('referrals_changes')
//       .on('postgres_changes', 
//         {
//           event: '*',
//           schema: 'public',
//           table: 'referrals'
//         },
//         () => {
//           loadData();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(subscription);
//     };
//   }, [user?.id]);

//   // Add a function to load a specific page of referrals
//   const loadReferralsPage = async (page: number) => {
//     setIsLoadingMore(true);
//     try {
//       const from = (page - 1) * pageSize;
//       const to = from + pageSize - 1;
      
//       const { data, error } = await supabase
//         .from('referrals')
//         .select(`
//           *,
//           sponsor:users!sponsor_id(username, telegram_id),
//           referred:users!referred_id(
//             username,
//             telegram_id,
//             total_earned,
//             total_deposit,
//             rank,
//             is_premium,
//             is_active
//           )
//         `)
//         .order('created_at', { ascending: false })
//         .range(from, to);

//       if (error) throw error;
      
//       if (page === 1) {
//         setReferrals(data || []);
//       } else {
//         setReferrals(prev => [...prev, ...(data || [])]);
//       }
//           } catch (err) {
//       console.error('Error loading referrals page:', err);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };

//   // Update the reward calculation function
//   const calculateActiveReferralReward = (referrals: ReferralWithUsers[]): number => {
//     return referrals.reduce((total, referral) => {
//       if (referral.status === 'active') {
//         // Premium users give 2000 RZC, others give 1000 RZC
//         return total + (referral.referred?.is_premium ? 2000 : ACTIVE_REFERRAL_REWARD);
//       }
//       return total;
//     }, 0);
//   };

  

//   // Update the updateReferralStats function
//   const updateReferralStats = (referrals: ReferralWithUsers[]) => {
//     const activeCount = referrals.filter(r => r.status === 'active').length;
//     setUserReferralCount(referrals.length);
//     setUserActiveReferrals(activeCount);
    
//     // Calculate reward based on premium status
//     const reward = calculateActiveReferralReward(referrals);
//     setActiveReferralReward(reward);
//   };

//   // Update loadUserReferrals to include SBT token tracking
//   const loadUserReferrals = async () => {
//     if (!user?.id) {
//       console.log("No user ID available in loadUserReferrals");
//       return;
//     }
    
//     setIsLoadingUserReferrals(true);
//     try {
//       const { data, error } = await supabase
//         .from('referrals')
//         .select(`
//           *,
//           sponsor:users!sponsor_id(
//             username,
//             telegram_id
//           ),
//           referred:users!referred_id(
//             username,
//             telegram_id,
//             total_earned,
//             total_deposit,
//             rank,
//             is_premium,
//             is_active
//           ),
//           sbt_amount,
//           total_sbt_earned
//         `)
//         .eq('sponsor_id', user.id)
//         .order('created_at', { ascending: false });

//       if (error) {
//         console.error('Error fetching referrals:', error);
//         throw error;
//       }

//       console.log("Fetched referrals:", data);
//       setUserReferrals(data || []);
//       updateReferralStats(data || []);

//     } catch (err) {
//       console.error('Error in loadUserReferrals:', err);
//     } finally {
//       setIsLoadingUserReferrals(false);
//     }
//   };

//   // Call this function when the component loads
//   useEffect(() => {
//     if (user?.id) {
//       console.log("Calling loadUserReferrals from useEffect for user ID:", user.id);
//       loadUserReferrals();
//     } else {
//       console.log("No user ID available in loadUserReferrals useEffect");
//     }
//   }, [user?.id]);

//   // Add a useEffect to log state changes
//   useEffect(() => {
//     console.log("userReferralCount changed:", userReferralCount);
//     console.log("userActiveReferrals changed:", userActiveReferrals);
//   }, [userReferralCount, userActiveReferrals]);

  
//   // Function to get upline/downline
//   const getReferralTree = async (userId: number): Promise<TreeData> => {
//     try {
//       // Get upline (who referred you)
//       const { data: referralData } = await supabase
//         .from('referrals')
//         .select('sponsor_id')
//         .eq('referred_id', userId)
//         .maybeSingle();

//       let uplineData = null;
//       if (referralData?.sponsor_id) {
//         const { data: upline } = await supabase
//           .from('users')
//           .select('id, username, created_at, is_active, is_premium')
//           .eq('id', referralData.sponsor_id)
//           .single();
//         uplineData = upline;
//       }

//       // Get downline (people you referred)
//       const { data: downline } = await supabase
//         .from('referrals')
//         .select(`
//           referred:users!referred_id(
//             id,
//             username,
//             created_at,
//             is_active,
//             is_premium
//           )
//         `)
//         .eq('sponsor_id', userId)
//         .order('created_at', { ascending: false }) as { data: ReferralWithUser[] | null };

//       return { 
//         upline: uplineData,
//         downline: (downline || []).map(({ referred }) => ({
//           id: referred.id,
//           username: referred.username,
//           created_at: referred.created_at,
//           is_active: referred.is_active,
//           is_premium: referred.is_premium
//         }))
//       };
//     } catch (error) {
//       console.error('Error in getReferralTree:', error);
//       return { upline: null, downline: [] };
//     }
//   };

//   // Update the formatDate function to include "time ago" for recent joins
//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString);
//       const now = new Date();
//       const diffTime = Math.abs(now.getTime() - date.getTime());
//       const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
//       const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

//       if (diffDays === 0) {
//         if (diffHours === 0) {
//           const diffMinutes = Math.floor(diffTime / (1000 * 60));
//           return `${diffMinutes} minutes ago`;
//         }
//         return `${diffHours} hours ago`;
//       }
//       if (diffDays < 7) {
//         return `${diffDays} days ago`;
//       }
//       return date.toLocaleDateString(undefined, {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch (error) {
//       console.error('Error formatting date:', error);
//       return 'Invalid date';
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="p-2 space-y-4">
//         {/* Your Invite ID Skeleton */}
//         <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
//           <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">YOUR INVITE ID</div>
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
//             <div className="flex-1">
//               <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
//               <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
//             </div>
//             <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
//           </div>
//         </div>

//         {/* Airdrop Balance Skeleton */}
//         <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
//           <div className="text-center">
//             <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
//             <div className="h-4 w-12 bg-gray-100 rounded animate-pulse mx-auto mb-3"></div>
//             <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mx-auto mb-2"></div>
//             <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mx-auto"></div>
//           </div>
//         </div>

//         {/* Team Statistics Skeleton */}
//         <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
//           <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">TEAM STATISTICS</div>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="text-center">
//               <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
//               <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mx-auto mb-1"></div>
//               <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mx-auto"></div>
//             </div>
//             <div className="text-center">
//               <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
//               <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mx-auto mb-1"></div>
//               <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mx-auto"></div>
//             </div>
//           </div>
//         </div>

//         {/* Your Sponsor ID Skeleton */}
//         <div className="bg-gray-100 rounded-xl p-4 shadow-sm border border-gray-200">
//           <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">YOUR SPONSOR ID</div>
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
//             <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
//         <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
//           <div className="space-y-2">
//             <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
//               <span className="text-xs font-semibold text-blue-700">Sponsor Network</span>
//               <span className="text-[10px] text-blue-600">Team Building</span>
//             </div>
//             <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">🎯 Build Your Team — Earn Together!</h1>
//             <p className="text-slate-700 text-sm md:text-base max-w-2xl">
//               Invite friends, build your sponsor network, and earn NOVA rewards for each active team member.
//             </p>
//           </div>
//           <div className="text-center">
//           <div className="text-2xl font-bold text-gray-900 mb-1">{activeReferralReward} RZC</div>
//           <div className="text-sm text-gray-500 mb-3">{userActiveReferrals} TON</div>
//           <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Airdrop Balance</div>
//           <button className="px-6 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 transition-colors cursor-pointer flex items-center gap-2 mx-auto">
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//             Claim Airdrop
//           </button>
//           <div className="text-xs text-gray-400 mt-2">The minimum withdrawal amount is 1 TON</div>
//         </div>
//         </div>
//       </div>

//       {/* Tab Navigation */}
//       <div className="flex w-full gap-2">
//         <button
//           onClick={() => setActiveTab('my-referrals')}
//           className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors duration-200 ${
//             activeTab === 'my-referrals'
//               ? 'bg-blue-600 text-white'
//               : 'bg-slate-100 text-slate-600 hover:text-slate-800'
//           }`}
//         >
//           👥 My Network
//         </button>
//         <button
//           onClick={() => setActiveTab('statistics')}
//           className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors duration-200 ${
//             activeTab === 'statistics'
//               ? 'bg-blue-600 text-white'
//               : 'bg-slate-100 text-slate-600 hover:text-slate-800'
//           }`}
//         >
//           🏆 Leaderboard
//         </button>
//       </div>

//       {activeTab === 'my-referrals' ? (
//         <>
//           {/* Invite Section */}
//           <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
//             <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
//               <div>
//                 <h2 className="text-lg font-bold text-slate-900">🚀 Share Your Sponsor Link</h2>
//                 <p className="text-sm text-slate-700 mt-1 max-w-3xl">
//                   Invite friends to join your team and earn RZC rewards for each active member. Share your unique link or code.
//                 </p>
//                 <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
//                   <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Sponsor Link</div>
//                   <div className="text-sm text-slate-900 truncate max-w-[240px] sm:max-w-none mb-2">{referralLink || 'Loading link...'}</div>
//                   <div className="flex items-center gap-2">
//                     <button 
//                       onClick={() => navigator.clipboard.writeText(referralLink)} 
//                       className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
//                     >
//                       Copy Link
//                     </button>
//                     <button 
//                       onClick={async()=>{
//                         try{
//                           if((navigator as any).share){
//                             await (navigator as any).share({title:'TAPPs Invite',text:`Join TAPPs with my link: ${referralLink}`,url:referralLink});
//                           }else{
//                             await navigator.clipboard.writeText(referralLink);
//                           }
//                         }catch{}
//                       }} 
//                       className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
//                     >
//                       Share
//                     </button>
//                   </div>
//                 </div>
//               </div>
//               <div className="min-w-[180px] text-center">
//                 <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
//                   <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Your Code</div>
//                   <div className="text-xl font-bold text-blue-600">{referralCode}</div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gray-100 rounded-xl p-4 shadow-sm border border-gray-200">
//         <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">YOUR SPONSOR ID</div>
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
//             <span className="text-pink-600 text-lg">😊</span>
//           </div>
//           <div className="text-lg font-bold text-gray-900">
//             {referralCode}
//           </div>
//         </div>
//       </div>


//           {/* Apply Code Section */}
//           <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
//             <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
//               <div>
//                 <h2 className="text-lg font-bold text-slate-900">🔗 Join a Team</h2>
//                 <p className="text-sm text-slate-700 mt-1 max-w-3xl">
//                   Have a sponsor code? Enter it below to join someone's team and start earning together.
//                 </p>
//                 <div className="mt-3 flex items-center gap-2">
//                   <input 
//                     onChange={(e)=>{(e as any).target&&setApplyCode((e as any).target.value)}} 
//                     placeholder="Enter sponsor code" 
//                     className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm outline-none focus:border-blue-400 transition-colors" 
//                   />
//                   <button 
//                     onClick={async()=>{
//                       if(!user?.id||!applyCode.trim())return;
//                       try{
//                         setIsApplying(true);
//                         if(applyCode===String(user.telegram_id)||applyCode===String(user.id)){
//                           alert('You cannot use your own code.');
//                           return;
//                         }
//                         // Check if user already has a sponsor
//                         const { data: existing } = await supabase.from('referrals').select('*').eq('referred_id', user.id).maybeSingle();
//                         if(existing){
//                           alert('You already have a sponsor assigned.');
//                           return;
//                         }
                        
//                         // Validate sponsor code
//                         const codeNum = Number(applyCode);
//                         if (isNaN(codeNum)) {
//                           alert('Invalid sponsor code format.');
//                           return;
//                         }
                        
//                         // Find sponsor by telegram_id or user_id
//                         const { data: sponsor, error: sponsorError } = await supabase
//                           .from('users')
//                           .select('id, username, telegram_id')
//                           .or(`telegram_id.eq.${codeNum},id.eq.${codeNum}`)
//                           .maybeSingle();
                          
//                         if(sponsorError || !sponsor){
//                           alert('Sponsor not found. Please check the code.');
//                           return;
//                         }
                        
//                         // Check if trying to use own code
//                         if(sponsor.id === user.id){
//                           alert('You cannot use your own sponsor code.');
//                           return;
//                         }
                        
//                         // Check if sponsor is trying to refer themselves
//                         const { data: reverseCheck } = await supabase
//                           .from('referrals')
//                           .select('*')
//                           .eq('sponsor_id', user.id)
//                           .eq('referred_id', sponsor.id)
//                           .maybeSingle();
                          
//                         if(reverseCheck){
//                           alert('Cannot create circular referral relationship.');
//                           return;
//                         }
                        
//                         // Create referral relationship
//                         const { error: insertErr } = await supabase
//                           .from('referrals')
//                           .insert({ 
//                             sponsor_id: sponsor.id, 
//                             referred_id: user.id, 
//                             status: 'active',
//                             created_at: new Date().toISOString()
//                           });
                          
//                         if(insertErr) {
//                           console.error('Insert error:', insertErr);
//                           throw insertErr;
//                         }
                        
//                         // Update user's sponsor_id in users table
//                         const { error: updateErr } = await supabase
//                           .from('users')
//                           .update({ sponsor_id: sponsor.id })
//                           .eq('id', user.id);
                          
//                         if(updateErr) {
//                           console.error('Update error:', updateErr);
//                           // Don't throw here, referral was created successfully
//                         }
                        
//                         alert(`Successfully joined ${sponsor.username}'s team!`);
//                         setApplyCode(''); // Clear the input
//                         loadUserReferrals(); // Refresh the data
//                       }catch(e){
//                         console.error(e);
//                         alert('Failed to apply code');
//                       }finally{
//                         setIsApplying(false);
//                       }
//                     }} 
//                     className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60 hover:bg-blue-700 transition-colors" 
//                     disabled={isApplying}
//                   >
//                     {isApplying ? 'Applying…' : 'Apply Code'}
//                   </button>
//                 </div>
//               </div>
//               <div className="min-w-[180px]">
//                 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
//                   <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Benefits</div>
//                   <div className="text-sm text-slate-700">Join a team and earn together</div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Stats Section */}
//           <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
//             <h2 className="text-lg font-bold text-slate-900 mb-4">📊 Your Team Stats</h2>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
//                 <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Team</div>
//                 <div className="text-2xl font-bold text-blue-600">{userActiveReferrals}</div>
//                 <div className="text-sm text-slate-700">Members earning</div>
//               </div>
//               <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
//                 <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">RZC Earned</div>
//                 <div className="flex items-baseline gap-2">
//                   <div className="relative w-6 h-6 flex-shrink-0">
//                     <span className="text-green-600 text-xl">🎯</span>
//                   </div>
//                   <div className="text-2xl font-bold text-green-600">{activeReferralReward}</div>
//                 </div>
//                 <div className="text-sm text-slate-700">From team rewards</div>
//               </div>
//             </div>
//           </div>

//           {/* Network Section */}
//           <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
//             <h2 className="text-lg font-bold text-slate-900 mb-4">👥 Your Network</h2>
            
//             {isTreeLoading ? (
//               <div className="flex items-center justify-center p-8">
//                 <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {/* Upline Section */}
//                 <div>
//                   <h4 className="text-sm font-bold text-slate-900 mb-2">👆 Your Sponsor</h4>
//                   {tree.upline ? (
//                     <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                           <span className="text-blue-600 font-medium">
//                             {tree.upline.username?.[0]?.toUpperCase()}
//                           </span>
//                         </div>
//                         <div>
//                           <div className="flex items-center gap-2">
//                             <p className="text-slate-900 font-medium">{tree.upline.username}</p>
//                             {isRecentlyJoined(tree.upline.created_at) && (
//                               <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
//                                 New
//                               </span>
//                             )}
//                             {tree.upline.is_premium && (
//                               <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
//                                 ⭐ Premium
//                               </span>
//                             )}
//                           </div>
//                           <p className="text-sm text-slate-600">
//                             Joined {formatDate(tree.upline.created_at)}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
//                       <p className="text-slate-600 text-sm">No sponsor yet</p>
//                       <p className="text-xs text-slate-500 mt-1">Use a sponsor code to join a team</p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Downline Section */}
//                 <div>
//                   <div className="flex justify-between items-center mb-2">
//                     <h4 className="text-sm font-bold text-slate-900">👇 Your Team ({tree.downline.length})</h4>
//                   </div>
                  
//                   {tree.downline.length > 0 ? (
//                     <div className="space-y-2">
//                       {tree.downline.slice(0, 5).map((user) => (
//                         <div key={user.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-3">
//                               <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                                 <span className="text-blue-600 font-medium">
//                                   {user.username?.[0]?.toUpperCase()}
//                                 </span>
//                               </div>
//                               <div>
//                                 <div className="flex items-center gap-2">
//                                   <p className="text-slate-900 font-medium">{user.username}</p>
//                                   {isRecentlyJoined(user.created_at) && (
//                                     <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
//                                       New
//                                     </span>
//                                   )}
//                                   {user.is_premium && (
//                                     <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
//                                       ⭐ Premium
//                                     </span>
//                                   )}
//                                 </div>
//                                 <p className="text-sm text-slate-600">
//                                   Joined {formatDate(user.created_at)}
//                                 </p>
//                               </div>
//                             </div>
//                             <div className={`px-2 py-1 rounded-full text-xs ${
//                               user.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
//                             }`}>
//                               {user.is_active ? 'Active' : 'Inactive'}
//                             </div>
//                           </div>
//                         </div>
//                       ))}

//                       {tree.downline.length > 5 && (
//                         <div className="text-center mt-2">
//                           <button 
//                             onClick={() => setShowAllReferrals(true)}
//                             className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition-all duration-300 flex items-center gap-2 mx-auto border border-blue-200"
//                           >
//                             <span>See all {tree.downline.length} team members</span>
//                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                             </svg>
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
//                       <div className="text-4xl mb-2">🎯</div>
//                       <p className="text-slate-600 text-sm">Share your sponsor link to build your team!</p>
//                       <p className="text-xs text-slate-500 mt-1">Earn NOVA rewards for each active member</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//           </>
//       ) : (
//         // Statistics Tab Content
//         <>
//           {/* Leaderboard Header */}
//           <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
//             <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
//               <div className="space-y-2">
//                 <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
//                   <span className="text-xs font-semibold text-yellow-700">Global Leaders</span>
//                   <span className="text-[10px] text-yellow-600">Top Sponsors</span>
//                 </div>
//                 <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">🏆 Global Sponsor Leaderboard</h1>
//                 <p className="text-slate-700 text-sm md:text-base max-w-2xl">
//                   See the top performing sponsors worldwide. Build your team and climb the ranks!
//                 </p>
//               </div>
//               <div className="flex flex-col gap-2 min-w-[180px] text-center">
//                 <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
//                   <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Total Sponsors</div>
//                   <div className="text-xl font-bold text-blue-600">{allSponsorStats.length}</div>
//                 </div>
//                 <div className="flex items-center gap-2 justify-center">
//                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                   <span className="text-xs text-slate-500">Live Rankings</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Leaderboard */}
//           <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
//             <div className="flex justify-between items-center mb-6">
//               <div className="flex items-center gap-2">
//                 <GiTrophyCup className="text-yellow-500 text-2xl" />
//                 <h2 className="text-lg font-bold text-slate-900">Top Sponsors</h2>
//               </div>
//             </div>

//             {/* Mobile View (Card Layout) */}
//             <div className="md:hidden space-y-4">
//               {allSponsorStats
//                 .sort((a, b) => b.active_referrals - a.active_referrals)
//                 .slice(0, 10)
//                 .map((sponsor, index) => (
//                   <div 
//                     key={sponsor.sponsor_id}
//                     className={`relative p-4 rounded-xl border transition-all duration-300 ${
//                       index === 0 
//                         ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
//                         : index === 1 
//                         ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
//                         : index === 2 
//                         ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
//                         : 'bg-slate-50 border-slate-200'
//                     }`}
//                   >
//                     <div className="flex items-center gap-4">
//                       <div className="text-2xl font-bold">
//                         {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
//                       </div>
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2">
//                           <span className="font-semibold text-slate-900">{sponsor.username}</span>
//                           <span className={`px-2 py-0.5 text-xs rounded-full ${
//                             sponsor.active_referrals > 0 
//                               ? 'bg-green-100 text-green-700' 
//                               : 'bg-yellow-100 text-yellow-700'
//                           }`}>
//                             {sponsor.active_referrals > 0 ? 'Active' : 'Inactive'}
//                           </span>
//                         </div>
//                         <div className="mt-2 flex justify-between text-sm">
//                           <span className="text-slate-600">Active Team:</span>
//                           <span className="text-green-600 font-medium">{sponsor.active_referrals}</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//             </div>

//             {/* Desktop View (Table Layout) */}
//             <div className="hidden md:block">
//               <table className="w-full">
//                 <thead>
//                   <tr className="text-sm text-slate-600">
//                     <th className="pb-4 text-left w-16">Rank</th>
//                     <th className="pb-4 text-left">Sponsor</th>
//                     <th className="pb-4 text-right">Team Size</th>
//                     <th className="pb-4 text-right">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {allSponsorStats
//                     .sort((a, b) => b.active_referrals - a.active_referrals)
//                     .slice(0, 10)
//                     .map((sponsor, index) => (
//                       <tr 
//                         key={sponsor.sponsor_id}
//                         className={`border-b border-slate-200 last:border-0 transition-all duration-300 hover:bg-blue-50 ${
//                           index === 0 ? 'bg-yellow-50' : 
//                           index === 1 ? 'bg-gray-50' : 
//                           index === 2 ? 'bg-orange-50' : ''
//                         }`}
//                       >
//                         <td className="py-4">
//                           <div className="flex items-center">
//                             {index < 3 ? (
//                               <span className="text-2xl">
//                                 {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
//                               </span>
//                             ) : (
//                               <span className="text-slate-600 font-bold">#{index + 1}</span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="py-4">
//                           <div className="flex items-center gap-2">
//                             <span className="text-slate-900 font-medium">{sponsor.username}</span>
//                             {sponsor.rank && (
//                               <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
//                                 {sponsor.rank}
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="py-4 text-right">
//                           <span className="text-green-600 font-bold">{sponsor.active_referrals}</span>
//                         </td>
//                         <td className="py-4 text-right">
//                           <span className={`px-2 py-1 text-xs rounded-full ${
//                             sponsor.active_referrals > 0 
//                               ? 'bg-green-100 text-green-700' 
//                               : 'bg-yellow-100 text-yellow-700'
//                           }`}>
//                             {sponsor.active_referrals > 0 ? 'Active' : 'Inactive'}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Modal for All Team Members */}
//       {showAllReferrals && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//           <div className="relative rounded-2xl bg-white border border-slate-200 shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
//             {/* Modal Header */}
//             <div className="p-6 border-b border-slate-200 flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-bold text-slate-900">Your Team Members</h3>
//                 <p className="text-sm text-slate-600">All {userReferrals.length} team members</p>
//               </div>
//               <button 
//                 onClick={() => setShowAllReferrals(false)}
//                 className="text-slate-400 hover:text-slate-600 transition-colors"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="flex-1 overflow-y-auto p-6">
//               <div className="space-y-3">
//                 {userReferrals.map((referral) => (
//                   <div
//                     key={referral.id}
//                     className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 relative">
//                         {referral.referred?.username?.charAt(0).toUpperCase() || '?'}
//                         {referral.referred?.is_premium && (
//                           <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
//                             <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
//                               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                             </svg>
//                           </div>
//                         )}
//                       </div>
//                       <div className="flex flex-col">
//                         <span className="text-slate-900 font-medium">
//                           {referral.referred?.username || 'Unknown User'}
//                         </span>
//                         <span className="text-xs text-slate-600">
//                           {referral.referred?.username ? (
//                             <a 
//                               href={`https://t.me/${referral.referred.username}`}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-blue-600 hover:text-blue-700"
//                             >
//                               View Profile
//                             </a>
//                           ) : 'No Telegram ID'}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <div className={`px-3 py-1.5 rounded-full ${
//                         referral.status === 'active' 
//                           ? 'bg-green-100 text-green-700' 
//                           : 'bg-slate-100 text-slate-600'
//                       }`}>
//                         <span className="text-xs font-bold">
//                           {referral.status === 'active' ? 'Active' : 'Inactive'}
//                         </span>
//                       </div>
//                       {referral.referred?.is_premium && (
//                         <div className="bg-yellow-100 px-3 py-1.5 rounded-full">
//                           <span className="text-yellow-700 text-xs font-bold">
//                             ⭐ Premium
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ReferralSystem;