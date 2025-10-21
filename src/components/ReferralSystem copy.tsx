// import React, { useState, useEffect } from 'react';
// import { supabase, ensureUserHasSponsorCode } from '../lib/supabaseClient';
// import { useAuth } from '../hooks/useAuth';


// const ReferralSystem: React.FC = () => {
//   const { user } = useAuth();
//   const [isLoading, setIsLoading] = useState(true);
//   const [referralCode, setReferralCode] = useState<string>('');
//   const [sponsorInfo, setSponsorInfo] = useState<{username: string, code: string} | null>(null);
//   const [userActiveReferrals, setUserActiveReferrals] = useState<number>(0);
//   const [activeReferralReward, setActiveReferralReward] = useState<number>(0);
//   const [userReferralCount, setUserReferralCount] = useState<number>(0);
//   const ACTIVE_REFERRAL_REWARD = 5; // 5 NOVA per active referral
//   const [, setIsLoadingUserReferrals] = useState<boolean>(false);
//   const [userReferrals, setUserReferrals] = useState<ReferralWithUsers[]>([]);



  
// // Update the interface to match your table structure
// interface ReferralWithUsers {
//   id: number;
//   referrer_id: number;
//   referred_id: number;
//   status: 'active' | 'inactive';
//   created_at: string;
//   level: number;
//   referrer: {
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

//  // Update the updateReferralStats function
//  const updateReferralStats = (referrals: ReferralWithUsers[]) => {
//   const activeCount = referrals.filter(r => r.status === 'active').length;
//   setUserReferralCount(referrals.length);
//   setUserActiveReferrals(activeCount);
  
//   // Calculate reward based on premium status
//   const reward = calculateActiveReferralReward(referrals);
//   setActiveReferralReward(reward);
// };

// // Update the reward calculation function
// const calculateActiveReferralReward = (referrals: ReferralWithUsers[]): number => {
//   return referrals.reduce((total, referral) => {
//     if (referral.status === 'active') {
//       // Premium users give 10 NOVA, others give 5
//       return total + (referral.referred?.is_premium ? 10 : ACTIVE_REFERRAL_REWARD);
//     }
//     return total;
//   }, 0);
// };

//  // Update loadUserReferrals to include SBT token tracking
//  const loadUserReferrals = async () => {
//   if (!user?.id) {
//     console.log("No user ID available in loadUserReferrals");
//     return;
//   }
  
//   setIsLoadingUserReferrals(true);
//   try {
//     const { data, error } = await supabase
//       .from('referrals')
//       .select(`
//         *,
//         referrer:users!referrer_id(
//           username,
//           telegram_id
//         ),
//         referred:users!referred_id(
//           username,
//           telegram_id,
//           total_earned,
//           total_deposit,
//           rank,
//           is_premium,
//           is_active
//         ),
//         sbt_amount,
//         total_sbt_earned
//       `)
//       .eq('referrer_id', user.id)
//       .order('created_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching referrals:', error);
//       throw error;
//     }

//     console.log("Fetched referrals:", data);
//     setUserReferrals(data || []);
//     updateReferralStats(data || []);

//   } catch (err) {
//     console.error('Error in loadUserReferrals:', err);
//   } finally {
//     setIsLoadingUserReferrals(false);
//   }
// };


//   // const loadUserReferrals = async () => {
//   //   if (!user?.id) return;

//   //   try {
//   //     const { data: referrals, error } = await supabase
//   //       .from('referrals')
//   //       .select('*')
//   //       .eq('sponsor_id', user.id);

//   //     if (error) {
//   //       console.error('Error loading referrals:', error);
//   //       return;
//   //     }

//   //     const activeCount = referrals?.filter(r => r.status === 'active').length || 0;
//   //     setUserActiveReferrals(activeCount);
//   //   } catch (error) {
//   //     console.error('Error loading user referrals:', error);
//   //   }
//   // };

//   const loadSponsorInfo = async () => {
//     if (!user?.id) return;

//     try {
//       const { data: userData, error } = await supabase
//         .from('users')
//         .select(`
//           sponsor_id,
//           sponsor:users!sponsor_id(
//             username,
//             sponsor_code
//           )
//         `)
//         .eq('id', user.id)
//         .single();

//       if (error) {
//         console.error('Error loading sponsor info:', error);
//         return;
//       }

//       if (userData?.sponsor) {
//         const sponsorData = Array.isArray(userData.sponsor) ? userData.sponsor[0] : userData.sponsor;
//         if (sponsorData && sponsorData.username) {
//           setSponsorInfo({
//             username: sponsorData.username,
//             code: sponsorData.sponsor_code || 'N/A'
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Error loading sponsor info:', error);
//     }
//   };

//   const loadTree = async () => {
//     await Promise.all([
//       loadUserReferrals(),
//       loadSponsorInfo()
//     ]);
//   };

//   useEffect(() => {
//     const generateReferralInfo = async () => {
//       if (user?.id) {
//         const sponsorCode = await ensureUserHasSponsorCode(user.id, user.username);
//         setReferralCode(sponsorCode);
//       }
//     };

//     generateReferralInfo();
//   }, [user?.id, user?.username]);

//   useEffect(() => {
//     if (user?.id) {
//       loadTree().finally(() => setIsLoading(false));
//     }
//   }, [user?.id]);


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
//     <div className="p-4 space-y-4">
//       {/* Your Invite ID */}
//       <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
//         <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">YOUR INVITE ID</div>
//         <div className="flex items-center gap-3">
//           <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
//             <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
//             </svg>
//           </div>
//           <div className="flex-1">
//             <div className="text-lg font-bold text-gray-900">{referralCode || 'Loading...'}</div>
//             <div className="text-sm text-gray-500">Share with friends</div>
//           </div>
//           <button 
//             onClick={async () => {
//               try {
//                 await navigator.clipboard.writeText(referralCode);
//                 alert('Invite ID copied!');
//               } catch (error) {
//                 alert('Failed to copy');
//               }
//             }}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors cursor-pointer"
//           >
//             Copy
//           </button>
//         </div>
//       </div>

//       {/* Airdrop Balance */}
//       <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
//         <div className="text-center">
//           <div className="text-2xl font-bold text-gray-900 mb-1">{activeReferralReward} TON</div>
//           <div className="text-sm text-gray-500 mb-3">$0</div>
//           <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Airdrop Balance</div>
//           <button className="px-6 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 transition-colors cursor-pointer flex items-center gap-2 mx-auto">
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//             Claim Airdrop
//           </button>
//           <div className="text-xs text-gray-400 mt-2">The minimum withdrawal amount is 1 TON</div>
//         </div>
//       </div>

//       {/* Team Statistics */}
//       <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
//         <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">TEAM STATISTICS</div>
//         <div className="grid grid-cols-2 gap-4">
//           <div className="text-center">
//             <div className="text-2xl font-bold text-gray-900 mb-1">{userActiveReferrals}</div>
//             <div className="text-sm text-gray-500 mb-1">Active Team Members</div>
//             <div className="text-sm text-gray-500">Team Members</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-gray-900 mb-1">$0</div>
//             <div className="text-sm text-gray-500 mb-1">Team Turnover</div>
//             <div className="text-sm text-gray-500">Total Earnings</div>
//           </div>
//         </div>
//       </div>

//       {/* Your Sponsor ID */}
//       <div className="bg-gray-100 rounded-xl p-4 shadow-sm border border-gray-200">
//         <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">YOUR SPONSOR ID</div>
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
//             <span className="text-pink-600 text-lg">😊</span>
//           </div>
//           <div className="text-lg font-bold text-gray-900">
//             {sponsorInfo?.code || 'No Sponsor'}
//           </div>
//         </div>
//       </div>

//       {/* Level Statistics */}
//       <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
//         <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">LEVEL STATISTICS</div>
//         <div className="space-y-3">
//           {[
//             { level: 1, reward: '10%', earnings: '$0', active: 0, total: 0 },
//             { level: 2, reward: '1.5%', earnings: '$0', active: 0, total: 0 },
//             { level: 3, reward: '1%', earnings: '$0', active: 0, total: 0 },
//             { level: 4, reward: '1%', earnings: '$0', active: 0, total: 0 },
//             { level: 5, reward: '0.5%', earnings: '$0', active: 0, total: 0 },
//             { level: 6, reward: '0.5%', earnings: '$0', active: 0, total: 0 },
//             { level: 7, reward: '0.5%', earnings: '$0', active: 0, total: 0 },
//           ].map((item) => (
//             <div key={item.level} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
//               <div className="flex items-center gap-3">
//                 <div className="text-sm font-bold text-gray-900">#{item.level}</div>
//                 <div className="text-sm text-blue-600">{item.reward} rewards</div>
//               </div>
//               <div className="text-right">
//                 <div className="text-sm font-bold text-gray-900">{item.earnings}</div>
//                 <div className="text-xs text-gray-500">{item.active} Active Members</div>
//                 <div className="text-xs text-gray-500">{item.total} Members</div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReferralSystem;