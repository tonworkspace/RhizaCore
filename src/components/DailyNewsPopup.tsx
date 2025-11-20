// import { FC, useState, useEffect } from 'react';
// import { FaTimes, FaRocket, FaGem, FaUsers, FaChartLine, FaGift, FaStar, FaBell } from 'react-icons/fa';
// import { MdTrendingUp, MdDiamond } from 'react-icons/md';

// interface DailyNewsPopupProps {
//   isOpen: boolean;
//   onClose: () => void;
//   userBalance?: number;
//   isStaked?: boolean;
//   onStartStaking?: () => void;
//   onJoinCommunity?: () => void;
// }

// export const DailyNewsPopup: FC<DailyNewsPopupProps> = ({
//   isOpen,
//   onClose,
//   userBalance = 0,
//   isStaked = false,
//   onStartStaking,
//   onJoinCommunity
// }) => {
//   const [currentNews, setCurrentNews] = useState(0);
//   const [showStakingPrompt, setShowStakingPrompt] = useState(false);

//   // More frequent news for non-staked users
//   const newsItems = [
//     {
//       id: 1,
//       icon: <FaRocket className="w-6 h-6 text-blue-500" />,
//       title: "🚀 New Staking Pool Launched!",
//       description: "Earn up to 3% daily returns with our latest staking pool. Limited time bonus rewards available!",
//       type: "staking",
//       urgency: "high",
//       action: "Start Staking",
//       color: "from-blue-500 to-purple-600"
//     },
//     {
//       id: 2,
//       icon: <FaGem className="w-6 h-6 text-purple-500" />,
//       title: "💎 Exclusive Airdrop for Stakers",
//       description: "Stake your RZC tokens to qualify for our exclusive airdrop. 10,000 RZC will be distributed among active stakers.",
//       type: "airdrop",
//       urgency: "high",
//       action: "Learn More",
//       color: "from-purple-500 to-pink-600"
//     },
//     {
//       id: 3,
//       icon: <FaUsers className="w-6 h-6 text-green-500" />,
//       title: "👥 Community Milestone Reached!",
//       description: "We've reached 50,000 active users! Join our growing community and start earning rewards today.",
//       type: "community",
//       urgency: "medium",
//       action: "Join Community",
//       color: "from-green-500 to-emerald-600"
//     },
//     {
//       id: 4,
//       icon: <FaChartLine className="w-6 h-6 text-orange-500" />,
//       title: "📈 RZC Price Surge!",
//       description: "RZC token price increased by 25% this week. Don't miss out on the opportunity to stake and earn!",
//       type: "price",
//       urgency: "high",
//       action: "View Chart",
//       color: "from-orange-500 to-red-600"
//     },
//     {
//       id: 5,
//       icon: <FaGift className="w-6 h-6 text-yellow-500" />,
//       title: "🎁 Daily Bonus Rewards",
//       description: "Complete your first stake today and receive a 10% bonus on your initial investment. Limited time offer!",
//       type: "bonus",
//       urgency: "high",
//       action: "Claim Bonus",
//       color: "from-yellow-500 to-orange-600"
//     },
//     {
//       id: 6,
//       icon: <FaStar className="w-6 h-6 text-indigo-500" />,
//       title: "⭐ VIP Staking Program",
//       description: "Stake 100+ RZC to unlock VIP benefits including higher rewards, priority support, and exclusive features.",
//       type: "vip",
//       urgency: "medium",
//       action: "Upgrade to VIP",
//       color: "from-indigo-500 to-purple-600"
//     }
//   ];

//   // Filter news based on user status
//   const filteredNews = isStaked 
//     ? newsItems.filter(item => item.type !== 'staking' && item.type !== 'bonus')
//     : newsItems.filter(item => item.type === 'staking' || item.type === 'bonus' || item.type === 'airdrop');

//   // Rotate news every 3 seconds for non-staked users, 5 seconds for staked users
//   useEffect(() => {
//     if (!isOpen || filteredNews.length === 0) return;

//     const interval = setInterval(() => {
//       setCurrentNews((prev) => (prev + 1) % filteredNews.length);
//     }, isStaked ? 5000 : 3000);

//     return () => clearInterval(interval);
//   }, [isOpen, isStaked, filteredNews.length]);

//   // Show staking prompt for non-staked users
//   useEffect(() => {
//     if (!isStaked && userBalance >= 1) {
//       const timer = setTimeout(() => {
//         setShowStakingPrompt(true);
//       }, 2000);
//       return () => clearTimeout(timer);
//     }
//   }, [isStaked, userBalance]);

//   if (!isOpen || filteredNews.length === 0) return null;

//   const currentItem = filteredNews[currentNews];

//   const handleAction = () => {
//     if (currentItem.type === 'staking' || currentItem.type === 'bonus') {
//       onStartStaking?.();
//     } else if (currentItem.type === 'community') {
//       onJoinCommunity?.();
//     }
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
//       <div className="bg-white rounded-2xl p-6 w-full max-w-md border-2 border-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex items-center gap-2">
//             <FaBell className="w-5 h-5 text-blue-500" />
//             <div className="text-lg font-bold text-gray-800">
//               {isStaked ? 'Daily Updates' : 'Breaking News'}
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <FaTimes className="w-5 h-5" />
//           </button>
//         </div>

//         {/* News Content */}
//         <div className="space-y-4">
//           {/* Current News Item */}
//           <div className={`bg-gradient-to-r ${currentItem.color} rounded-xl p-4 text-white`}>
//             <div className="flex items-center gap-3 mb-3">
//               {currentItem.icon}
//               <div className="flex-1">
//                 <div className="font-bold text-lg">{currentItem.title}</div>
//                 <div className="text-sm opacity-90">{currentItem.description}</div>
//               </div>
//             </div>
            
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <div className={`w-2 h-2 rounded-full ${
//                   currentItem.urgency === 'high' ? 'bg-red-300' : 
//                   currentItem.urgency === 'medium' ? 'bg-yellow-300' : 'bg-green-300'
//                 }`} />
//                 <div className="text-xs opacity-75">
//                   {currentItem.urgency === 'high' ? 'Urgent' : 
//                    currentItem.urgency === 'medium' ? 'Important' : 'Info'}
//                 </div>
//               </div>
//               <button
//                 onClick={handleAction}
//                 className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
//               >
//                 {currentItem.action}
//               </button>
//             </div>
//           </div>

//           {/* News Progress Indicator */}
//           <div className="flex gap-1 justify-center">
//             {filteredNews.map((_, index) => (
//               <div
//                 key={index}
//                 className={`w-2 h-2 rounded-full transition-colors ${
//                   index === currentNews ? 'bg-blue-500' : 'bg-gray-300'
//                 }`}
//               />
//             ))}
//           </div>

//           {/* Staking Prompt for Non-Staked Users */}
//           {showStakingPrompt && !isStaked && userBalance >= 1 && (
//             <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
//               <div className="flex items-center gap-3 mb-2">
//                 <FaRocket className="w-5 h-5" />
//                 <div className="font-bold">Ready to Start Staking?</div>
//               </div>
//               <div className="text-sm opacity-90 mb-3">
//                 You have {userBalance.toFixed(6)} RZC ready to stake. Start earning daily rewards now!
//               </div>
//               <button
//                 onClick={() => {
//                   onStartStaking?.();
//                   onClose();
//                 }}
//                 className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full"
//               >
//                 Start Staking Now
//               </button>
//             </div>
//           )}

//           {/* Quick Stats */}
//           <div className="grid grid-cols-2 gap-3">
//             <div className="bg-blue-50 rounded-lg p-3 text-center">
//               <div className="text-lg font-bold text-blue-600">
//                 {isStaked ? 'Active' : 'Available'}
//               </div>
//               <div className="text-xs text-blue-500">
//                 {isStaked ? 'Staking Pool' : 'Staking Pool'}
//               </div>
//             </div>
//             <div className="bg-green-50 rounded-lg p-3 text-center">
//               <div className="text-lg font-bold text-green-600">
//                 {isStaked ? 'Earning' : 'Potential'}
//               </div>
//               <div className="text-xs text-green-500">
//                 {isStaked ? 'Daily Rewards' : 'Daily Rewards'}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="mt-4 pt-4 border-t border-gray-200">
//           <div className="flex items-center justify-between text-xs text-gray-500">
//             <div>
//               {isStaked ? 'Updates every 5 minutes' : 'Updates every 3 minutes'}
//             </div>
//             <div>
//               {currentNews + 1} of {filteredNews.length}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DailyNewsPopup;
