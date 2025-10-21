// import React, { useState } from 'react';
// import { TrendingUp, Calendar, DollarSign, Users, Crown, Star, Zap, Shield, Trophy } from 'lucide-react';
// import WhaleTierCard from './WhaleTierCard';

// interface WhaleTierDashboardProps {
//   userBalance: number;
//   userRank: string;
//   daysStaked: number;
//   referralCount: number;
//   onUpgrade?: () => void;
// }

// export default function WhaleTierDashboard({ 
//   userBalance, 
//   userRank, 
//   daysStaked, 
//   referralCount,
//   onUpgrade 
// }: WhaleTierDashboardProps) {
//   const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'benefits'>('overview');

//   // Calculate current whale tier
//   const getCurrentWhaleTier = () => {
//     if (userBalance >= 500000) return 'COSMIC_WHALE';
//     if (userBalance >= 250000) return 'COLOSSAL_WHALE';
//     if (userBalance >= 100000) return 'MEGA_WHALE';
//     return null;
//   };

//   const currentTier = getCurrentWhaleTier();

//   // Calculate potential earnings for different scenarios
//   const calculateEarnings = (balance: number, tier: string) => {
//     const tierRates = {
//       'MEGA_WHALE': { dailyROI: 0.015, multiplier: 1.5, weeklyBonus: 500 },
//       'COLOSSAL_WHALE': { dailyROI: 0.0175, multiplier: 1.75, weeklyBonus: 1000 },
//       'COSMIC_WHALE': { dailyROI: 0.02, multiplier: 2.0, weeklyBonus: 2500 }
//     };

//     const rate = tierRates[tier as keyof typeof tierRates];
//     if (!rate) return { daily: 0, weekly: 0, monthly: 0, total135: 0 };

//     const referralBoost = Math.min(1 + (referralCount * 0.05), 1.5);
//     const dailyEarning = balance * rate.dailyROI * rate.multiplier * referralBoost;
//     const weeklyEarning = dailyEarning * 7 + rate.weeklyBonus;
//     const monthlyEarning = dailyEarning * 30 + (rate.weeklyBonus * 4.3);
//     const total135 = (dailyEarning * 135) + (rate.weeklyBonus * 19.3);

//     return {
//       daily: dailyEarning,
//       weekly: weeklyEarning,
//       monthly: monthlyEarning,
//       total135: total135,
//       percentage: (total135 / balance) * 100
//     };
//   };

//   const nextTier = () => {
//     if (userBalance < 100000) return 'MEGA_WHALE';
//     if (userBalance < 250000) return 'COLOSSAL_WHALE';
//     if (userBalance < 500000) return 'COSMIC_WHALE';
//     return null;
//   };

//   const nextTierInfo = nextTier();

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="text-center">
//         <h2 className="text-3xl font-bold text-white mb-2">🐋 Whale Tier System</h2>
//         <p className="text-white/70">
//           Unlock exclusive benefits and higher returns with larger stakes
//         </p>
//       </div>

//       {/* Current Status */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-500/20 rounded-lg">
//               <DollarSign className="w-6 h-6 text-blue-400" />
//             </div>
//             <div>
//               <p className="text-sm text-white/70">Current Balance</p>
//               <p className="text-xl font-bold text-white">{userBalance.toLocaleString()} TON</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-green-500/20 rounded-lg">
//               <Crown className="w-6 h-6 text-green-400" />
//             </div>
//             <div>
//               <p className="text-sm text-white/70">Current Tier</p>
//               <p className="text-xl font-bold text-white">
//                 {currentTier ? currentTier.replace('_', ' ') : 'Standard'}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-purple-500/20 rounded-lg">
//               <TrendingUp className="w-6 h-6 text-purple-400" />
//             </div>
//             <div>
//               <p className="text-sm text-white/70">Days Staked</p>
//               <p className="text-xl font-bold text-white">{daysStaked} days</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Navigation Tabs */}
//       <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
//         {[
//           { id: 'overview', label: 'Overview', icon: <Star className="w-4 h-4" /> },
//           { id: 'calculator', label: 'Calculator', icon: <TrendingUp className="w-4 h-4" /> },
//           { id: 'benefits', label: 'Benefits', icon: <Shield className="w-4 h-4" /> }
//         ].map((tab) => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id as any)}
//             className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
//               activeTab === tab.id
//                 ? 'bg-white/10 text-white'
//                 : 'text-white/70 hover:text-white hover:bg-white/5'
//             }`}
//           >
//             {tab.icon}
//             <span className="text-sm font-medium">{tab.label}</span>
//           </button>
//         ))}
//       </div>

//       {/* Tab Content */}
//       {activeTab === 'overview' && (
//         <div className="space-y-6">
//           {/* Current Tier Card */}
//           {currentTier && (
//             <div>
//               <h3 className="text-xl font-semibold text-white mb-4">Your Current Tier</h3>
//               <WhaleTierCard 
//                 tier={currentTier as any} 
//                 currentBalance={userBalance} 
//                 isUnlocked={true} 
//               />
//             </div>
//           )}

//           {/* Next Tier */}
//           {nextTierInfo && (
//             <div>
//               <h3 className="text-xl font-semibold text-white mb-4">Next Tier Available</h3>
//               <WhaleTierCard 
//                 tier={nextTierInfo as any} 
//                 currentBalance={userBalance} 
//                 isUnlocked={false} 
//               />
//             </div>
//           )}

//           {/* All Tiers Overview */}
//           <div>
//             <h3 className="text-xl font-semibold text-white mb-4">All Whale Tiers</h3>
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//               <WhaleTierCard 
//                 tier="MEGA_WHALE" 
//                 currentBalance={userBalance} 
//                 isUnlocked={userBalance >= 100000} 
//               />
//               <WhaleTierCard 
//                 tier="COLOSSAL_WHALE" 
//                 currentBalance={userBalance} 
//                 isUnlocked={userBalance >= 250000} 
//               />
//               <WhaleTierCard 
//                 tier="COSMIC_WHALE" 
//                 currentBalance={userBalance} 
//                 isUnlocked={userBalance >= 500000} 
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {activeTab === 'calculator' && (
//         <div className="space-y-6">
//           <h3 className="text-xl font-semibold text-white">Earnings Calculator</h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {['MEGA_WHALE', 'COLOSSAL_WHALE', 'COSMIC_WHALE'].map((tier) => {
//               const earnings = calculateEarnings(userBalance, tier);
//               const isUnlocked = (tier === 'MEGA_WHALE' && userBalance >= 100000) ||
//                                 (tier === 'COLOSSAL_WHALE' && userBalance >= 250000) ||
//                                 (tier === 'COSMIC_WHALE' && userBalance >= 500000);

//               return (
//                 <div 
//                   key={tier}
//                   className={`p-4 rounded-xl border ${
//                     isUnlocked 
//                       ? 'border-green-500/30 bg-green-500/10' 
//                       : 'border-white/10 bg-white/5'
//                   }`}
//                 >
//                   <div className="flex items-center gap-2 mb-3">
//                     <Crown className="w-5 h-5 text-yellow-400" />
//                     <h4 className="font-semibold text-white">{tier.replace('_', ' ')}</h4>
//                   </div>
                  
//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-white/70">Daily:</span>
//                       <span className="text-white font-medium">{earnings.daily.toLocaleString()} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-white/70">Weekly:</span>
//                       <span className="text-white font-medium">{earnings.weekly.toLocaleString()} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-white/70">Monthly:</span>
//                       <span className="text-white font-medium">{earnings.monthly.toLocaleString()} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-white/70">135-Day Total:</span>
//                       <span className="text-white font-medium">{earnings.total135.toLocaleString()} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-white/70">Return %:</span>
//                       <span className="text-green-400 font-medium">{earnings.percentage.toFixed(1)}%</span>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {activeTab === 'benefits' && (
//         <div className="space-y-6">
//           <h3 className="text-xl font-semibold text-white">Exclusive Benefits</h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-blue-500/20 rounded-lg">
//                   <Users className="w-6 h-6 text-blue-400" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-white">VIP Support</h4>
//               </div>
//               <p className="text-white/70 text-sm">
//                 Dedicated support channel with priority response times and direct access to senior team members.
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-green-500/20 rounded-lg">
//                   <Zap className="w-6 h-6 text-green-400" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-white">Early Access</h4>
//               </div>
//               <p className="text-white/70 text-sm">
//                 Be the first to try new features, participate in beta testing, and access exclusive tools.
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-purple-500/20 rounded-lg">
//                   <Shield className="w-6 h-6 text-purple-400" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-white">Governance Rights</h4>
//               </div>
//               <p className="text-white/70 text-sm">
//                 Vote on platform decisions, propose changes, and have a say in the future direction of the platform.
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-yellow-500/20 rounded-lg">
//                   <DollarSign className="w-6 h-6 text-yellow-400" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-white">Revenue Sharing</h4>
//               </div>
//               <p className="text-white/70 text-sm">
//                 Earn a percentage of platform revenue based on your tier level and stake amount.
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-6 border border-red-500/30">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-red-500/20 rounded-lg">
//                   <Crown className="w-6 h-6 text-red-400" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-white">Advisory Board</h4>
//               </div>
//               <p className="text-white/70 text-sm">
//                 Join the advisory board for the highest tier whales and help shape platform strategy.
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-500/30">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-cyan-500/20 rounded-lg">
//                   <Trophy className="w-6 h-6 text-cyan-400" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-white">Custom Contracts</h4>
//               </div>
//               <p className="text-white/70 text-sm">
//                 Access to custom staking contracts with personalized terms and conditions.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Call to Action */}
//       {!currentTier && onUpgrade && (
//         <div className="text-center p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
//           <h3 className="text-xl font-semibold text-white mb-2">Ready to Become a Whale?</h3>
//           <p className="text-white/70 mb-4">
//             Stake more TON to unlock exclusive whale tier benefits and higher returns
//           </p>
//           <button
//             onClick={onUpgrade}
//             className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
//           >
//             Upgrade Your Stake
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

