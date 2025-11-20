// import { FC, useState, useEffect } from 'react';
// import { FaRocket, FaGem, FaUsers, FaChartLine, FaGift, FaStar, FaCoins, FaWallet, FaTimes, FaCalculator } from 'react-icons/fa';
// import { MdTrendingUp, MdDiamond } from 'react-icons/md';

// interface StakingBenefitsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   userBalance?: number;
//   onStartStaking?: () => void;
// }

// export const StakingBenefitsModal: FC<StakingBenefitsModalProps> = ({
//   isOpen,
//   onClose,
//   userBalance = 0,
//   onStartStaking
// }) => {
//   const [selectedAmount, setSelectedAmount] = useState(1);
//   const [selectedDuration, setSelectedDuration] = useState(30);
//   const [calculatedReturns, setCalculatedReturns] = useState({
//     daily: 0,
//     weekly: 0,
//     monthly: 0,
//     total: 0
//   });

//   const stakingBenefits = [
//     {
//       icon: <FaCoins className="w-8 h-8 text-yellow-500" />,
//       title: "Daily Rewards",
//       description: "Earn 1-5% daily returns on your staked RZC tokens",
//       rate: "1-5% daily",
//       color: "from-yellow-400 to-orange-500"
//     },
//     {
//       icon: <MdTrendingUp className="w-8 h-8 text-green-500" />,
//       title: "Compound Growth",
//       description: "Reinvest your rewards to accelerate your wealth building",
//       rate: "Up to 500% returns",
//       color: "from-green-400 to-emerald-500"
//     },
//     {
//       icon: <FaGift className="w-8 h-8 text-purple-500" />,
//       title: "Bonus Rewards",
//       description: "Unlock special bonuses and airdrops for active stakers",
//       rate: "Exclusive airdrops",
//       color: "from-purple-400 to-pink-500"
//     },
//     {
//       icon: <FaStar className="w-8 h-8 text-blue-500" />,
//       title: "VIP Access",
//       description: "Get early access to new features and premium content",
//       rate: "VIP privileges",
//       color: "from-blue-400 to-cyan-500"
//     },
//     {
//       icon: <FaUsers className="w-8 h-8 text-indigo-500" />,
//       title: "Community Benefits",
//       description: "Join exclusive staker-only channels and events",
//       rate: "Exclusive access",
//       color: "from-indigo-400 to-purple-500"
//     },
//     {
//       icon: <FaChartLine className="w-8 h-8 text-red-500" />,
//       title: "Analytics Dashboard",
//       description: "Track your staking performance with detailed analytics",
//       rate: "Real-time data",
//       color: "from-red-400 to-pink-500"
//     }
//   ];

//   const stakingTiers = [
//     {
//       name: "Starter",
//       minAmount: 1,
//       maxAmount: 99,
//       dailyRate: 0.01,
//       color: "from-blue-500 to-cyan-500",
//       benefits: ["1% daily returns", "Basic support", "Community access"]
//     },
//     {
//       name: "Silver",
//       minAmount: 100,
//       maxAmount: 999,
//       dailyRate: 0.015,
//       color: "from-gray-500 to-slate-500",
//       benefits: ["1.5% daily returns", "Priority support", "Bonus rewards"]
//     },
//     {
//       name: "Gold",
//       minAmount: 1000,
//       maxAmount: 9999,
//       dailyRate: 0.02,
//       color: "from-yellow-500 to-orange-500",
//       benefits: ["2% daily returns", "VIP support", "Exclusive airdrops"]
//     },
//     {
//       name: "Platinum",
//       minAmount: 10000,
//       maxAmount: 99999,
//       dailyRate: 0.025,
//       color: "from-purple-500 to-pink-500",
//       benefits: ["2.5% daily returns", "Personal manager", "Early access"]
//     },
//     {
//       name: "Diamond",
//       minAmount: 100000,
//       maxAmount: Infinity,
//       dailyRate: 0.03,
//       color: "from-cyan-500 to-blue-500",
//       benefits: ["3% daily returns", "White-glove service", "Custom features"]
//     }
//   ];

//   // Calculate returns based on selected amount and duration
//   useEffect(() => {
//     const tier = stakingTiers.find(t => selectedAmount >= t.minAmount && selectedAmount <= t.maxAmount) || stakingTiers[0];
//     const dailyRate = tier.dailyRate;
    
//     const daily = selectedAmount * dailyRate;
//     const weekly = daily * 7;
//     const monthly = daily * 30;
//     const total = daily * selectedDuration;
    
//     setCalculatedReturns({
//       daily,
//       weekly,
//       monthly,
//       total
//     });
//   }, [selectedAmount, selectedDuration]);

//   const getCurrentTier = () => {
//     return stakingTiers.find(t => selectedAmount >= t.minAmount && selectedAmount <= t.maxAmount) || stakingTiers[0];
//   };

//   const handleStartStaking = () => {
//     onStartStaking?.();
//     onClose();
//   };

//   if (!isOpen) return null;

//   const currentTier = getCurrentTier();

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
//       <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
//               <FaRocket className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h3 className="text-2xl font-bold text-gray-800">Staking Benefits</h3>
//               <p className="text-gray-600">Discover the advantages of staking your RZC tokens</p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <FaTimes className="w-6 h-6" />
//           </button>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Left Column - Benefits */}
//           <div className="space-y-6">
//             <div>
//               <h4 className="text-lg font-bold text-gray-800 mb-4">Why Stake RZC?</h4>
//               <div className="grid grid-cols-1 gap-4">
//                 {stakingBenefits.map((benefit, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
//                   >
//                     {benefit.icon}
//                     <div className="flex-1">
//                       <div className="font-bold text-gray-800">{benefit.title}</div>
//                       <div className="text-sm text-gray-600">{benefit.description}</div>
//                     </div>
//                     <div className={`bg-gradient-to-r ${benefit.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
//                       {benefit.rate}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Staking Tiers */}
//             <div>
//               <h4 className="text-lg font-bold text-gray-800 mb-4">Staking Tiers</h4>
//               <div className="space-y-3">
//                 {stakingTiers.map((tier, index) => (
//                   <div
//                     key={index}
//                     className={`p-4 rounded-xl border-2 transition-all ${
//                       selectedAmount >= tier.minAmount && selectedAmount <= tier.maxAmount
//                         ? 'border-blue-500 bg-blue-50'
//                         : 'border-gray-200 bg-white'
//                     }`}
//                   >
//                     <div className="flex items-center justify-between mb-2">
//                       <div className="flex items-center gap-3">
//                         <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${tier.color}`} />
//                         <div className="font-bold text-gray-800">{tier.name}</div>
//                       </div>
//                       <div className="text-sm font-semibold text-gray-600">
//                         {tier.minAmount.toLocaleString()}+ RZC
//                       </div>
//                     </div>
//                     <div className="text-sm text-gray-600 mb-2">
//                       {tier.dailyRate * 100}% daily returns
//                     </div>
//                     <div className="flex flex-wrap gap-1">
//                       {tier.benefits.map((benefit, benefitIndex) => (
//                         <div
//                           key={benefitIndex}
//                           className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
//                         >
//                           {benefit}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Calculator */}
//           <div className="space-y-6">
//             <div>
//               <h4 className="text-lg font-bold text-gray-800 mb-4">Earnings Calculator</h4>
              
//               {/* Amount Input */}
//               <div className="mb-4">
//                 <label className="text-sm font-semibold text-gray-700 mb-2 block">
//                   Staking Amount (RZC)
//                 </label>
//                 <div className="flex gap-2">
//                   <input
//                     type="number"
//                     value={selectedAmount}
//                     onChange={(e) => setSelectedAmount(Math.max(1, Number(e.target.value)))}
//                     min="1"
//                     max={userBalance}
//                     className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
//                     placeholder="Enter amount to stake"
//                   />
//                   <button
//                     onClick={() => setSelectedAmount(userBalance)}
//                     className="px-4 py-3 bg-blue-100 text-blue-600 rounded-xl font-semibold hover:bg-blue-200 transition-colors"
//                   >
//                     Max
//                   </button>
//                 </div>
//                 <div className="text-xs text-gray-500 mt-1">
//                   Available: {userBalance.toFixed(6)} RZC
//                 </div>
//               </div>

//               {/* Duration Input */}
//               <div className="mb-4">
//                 <label className="text-sm font-semibold text-gray-700 mb-2 block">
//                   Staking Duration (Days)
//                 </label>
//                 <input
//                   type="number"
//                   value={selectedDuration}
//                   onChange={(e) => setSelectedDuration(Math.max(1, Number(e.target.value)))}
//                   min="1"
//                   max="365"
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
//                 />
//                 <div className="text-xs text-gray-500 mt-1">
//                   Recommended: 30-90 days for optimal returns
//                 </div>
//               </div>

//               {/* Current Tier Display */}
//               <div className={`bg-gradient-to-r ${currentTier.color} rounded-xl p-4 text-white mb-4`}>
//                 <div className="flex items-center gap-2 mb-2">
//                   <MdDiamond className="w-5 h-5" />
//                   <div className="font-bold">{currentTier.name} Tier</div>
//                 </div>
//                 <div className="text-sm opacity-90">
//                   {currentTier.dailyRate * 100}% daily returns
//                 </div>
//               </div>

//               {/* Calculated Returns */}
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <div className="text-sm font-semibold text-gray-700 mb-3">Projected Returns</div>
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-green-600">
//                       {calculatedReturns.daily.toFixed(6)}
//                     </div>
//                     <div className="text-xs text-gray-600">Daily</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-blue-600">
//                       {calculatedReturns.weekly.toFixed(6)}
//                     </div>
//                     <div className="text-xs text-gray-600">Weekly</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-purple-600">
//                       {calculatedReturns.monthly.toFixed(6)}
//                     </div>
//                     <div className="text-xs text-gray-600">Monthly</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-orange-600">
//                       {calculatedReturns.total.toFixed(6)}
//                     </div>
//                     <div className="text-xs text-gray-600">Total ({selectedDuration}d)</div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="space-y-3">
//               <button
//                 onClick={handleStartStaking}
//                 disabled={userBalance < 1}
//                 className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-300 ${
//                   userBalance >= 1
//                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
//                     : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                 }`}
//               >
//                 {userBalance >= 1 ? (
//                   <div className="flex items-center justify-center gap-2">
//                     <FaRocket className="w-5 h-5" />
//                     Start Staking Now
//                   </div>
//                 ) : (
//                   <div className="flex items-center justify-center gap-2">
//                     <FaGift className="w-5 h-5" />
//                     Complete Tasks to Earn RZC
//                   </div>
//                 )}
//               </button>

//               {userBalance < 1 && (
//                 <div className="text-center text-sm text-gray-600">
//                   Complete daily tasks and social engagement to earn RZC tokens
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StakingBenefitsModal;
