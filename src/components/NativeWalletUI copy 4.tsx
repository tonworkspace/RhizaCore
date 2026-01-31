// import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
// import {
//   ensureUserHasSponsorCode,
//   startMiningSessionUnrestricted,
//   getActiveMiningSession,
//   manualCompleteMiningSession,
//   getUserRZCBalance,
//   canUserStartMining,
//   initializeFreeMiningPeriod,
//   getUserAirdropBalance,
//   claimTotalEarnedToAirdrop,
//   reclaimFromAirdropToMining,
//   stakeAirdropBalance,
//   createAirdropWithdrawal,
//   sendRZCToUser,
//   getUserTransferHistory,
//   searchUsersForTransfer,
//   MiningSession,
//   AirdropBalance,
//   UserTransfer,
//   UserSearchResult,
// } from '../lib/supabaseClient';
// import { Icons } from '../uicomponents/Icons';
// import RhizaCoreSaleComponent from './RhizaCoreSaleComponent';

// // Define SnackbarData type locally since it's not in supabaseClient
// interface SnackbarData {
//   message: string;
//   description?: string;
//   type?: 'success' | 'error' | 'info';
// }

// // --- TYPES & INTERFACES ---

// interface ArcadeMiningUIProps {
//   balanceTon: number;
//   tonPrice: number;
//   userId?: number;
//   userUsername?: string;
//   referralCode?: string;
//   showSnackbar?: (data: SnackbarData) => void;
//   tonAddress?: string | null;
//   totalEarnedRZC?: number;
// }

// export type ArcadeMiningUIHandle = {
//   refreshBalance: () => Promise<void> | void;
// };

// // --- COMPACT HELPER COMPONENTS ---

// const CompactAction = ({ icon: Icon, label, onClick, disabled, variant = "green", badge }: any) => {
//   const themes = {
//     green: "from-green-600/80 to-green-800/80 hover:from-green-500/90 hover:to-green-700/90",
//     zinc: "from-zinc-700/80 to-zinc-900/80 hover:from-zinc-600/90 hover:to-zinc-800/90",
//     blue: "from-blue-600/80 to-blue-800/80 hover:from-blue-500/90 hover:to-blue-700/90"
//   };

//   return (
//     <button 
//       onClick={onClick}
//       disabled={disabled}
//       className="relative flex flex-col items-center gap-1.5 group outline-none transition-all flex-1 min-w-0"
//     >
//       <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300
//         ${disabled 
//           ? 'bg-zinc-900/50 text-zinc-700 border border-white/5 opacity-40' 
//           : `bg-gradient-to-br ${themes[variant as keyof typeof themes]} text-white border border-white/10 shadow-lg hover:scale-105 active:scale-95`
//         }
//       `}>
//         <Icon size={18} strokeWidth={1.8} />
//         {badge && (
//           <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
//         )}
//       </div>
//       <span className={`text-[8px] font-bold uppercase tracking-[0.2em] transition-colors leading-none ${
//         disabled ? 'text-zinc-800' : 'text-zinc-500 group-hover:text-green-400'
//       }`}>
//         {label}
//       </span>
//     </button>
//   );
// };

// const StatCard = ({ label, value, subValue, icon: Icon, onClick, variant = "default" }: any) => {
//   const variants: Record<string, string> = {
//     default: "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.12]",
//     active: "bg-green-500/[0.05] border-green-500/20 hover:border-green-500/30",
//     warning: "bg-yellow-500/[0.05] border-yellow-500/20 hover:border-yellow-500/30"
//   };

//   return (
//     <div 
//       onClick={onClick}
//       className={`${variants[variant]} border rounded-2xl p-4 transition-all cursor-pointer group backdrop-blur-sm`}
//     >
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
//             <Icon size={16} strokeWidth={1.5} />
//           </div>
//           <div>
//             <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</div>
//             <div className="text-white font-bold text-lg font-mono leading-none">{value}</div>
//             {subValue && <div className="text-[9px] text-zinc-600 font-mono mt-0.5">{subValue}</div>}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const NativeWalletUI = forwardRef<ArcadeMiningUIHandle, ArcadeMiningUIProps>(function WalletUI(props, ref) {
//   const {
//     userId = 123456,
//     userUsername = 'RhizaUser',
//     tonAddress,
//     tonPrice,
//     showSnackbar,
//     referralCode: externalReferralCode,
//     totalEarnedRZC = 0,
//   } = props;

//   // --- STATE ---
//   const [sponsorCode, setSponsorCode] = useState<string | null>(null);
//   const [isMining, setIsMining] = useState(false);
//   const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
//   const [accumulatedRZC, setAccumulatedRZC] = useState(0);
//   const [claimableRZC, setClaimableRZC] = useState(0);
//   const [claimedRZC, setClaimedRZC] = useState(0);
//   const [totalEarnedRZCState, setTotalEarnedRZC] = useState(0);
//   const [airdropBalance, setAirdropBalance] = useState<AirdropBalance | null>(null);
//   const [expandedStep, setExpandedStep] = useState<number | null>(null);
  
//   const [showAirdropModal, setShowAirdropModal] = useState(false);
//   const [showWithdrawModal, setShowWithdrawModal] = useState(false);
//   const [showStakeModal, setShowStakeModal] = useState(false);
//   const [showSaleModal, setShowSaleModal] = useState(false);
//   const [showSendModal, setShowSendModal] = useState(false);
//   const [showReceiveModal, setShowReceiveModal] = useState(false);
  
//   const [isProcessingAirdropClaim, setIsProcessingAirdropClaim] = useState(false);
//   const [isProcessingAirdropReclaim, setIsProcessingAirdropReclaim] = useState(false);
//   const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
//   const [isProcessingStake, setIsProcessingStake] = useState(false);
//   const [isProcessingSend, setIsProcessingSend] = useState(false);
  
//   // Send/Search form state
//   const [sendAmount, setSendAmount] = useState('');
//   const [sendMessage, setSendMessage] = useState('');
//   const [userSearchQuery, setUserSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
//   const [selectedRecipient, setSelectedRecipient] = useState<UserSearchResult | null>(null);
//   const [transferHistory, setTransferHistory] = useState<UserTransfer[]>([]);
//   const [withdrawAmount, setWithdrawAmount] = useState('');
//   const [withdrawAddress, setWithdrawAddress] = useState('');
//   const [withdrawNetwork, setWithdrawNetwork] = useState('ethereum');
  
//   const miningRateMultiplier = 1.0;
//   const RZC_PER_DAY = 50;
//   const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);
//   const currentTotalEarned = totalEarnedRZC || totalEarnedRZCState;

//   // --- LOGIC ---
//   const loadAirdropBalance = async () => {
//     if (!userId) return;
    
//     try {
//       const balanceResult = await getUserAirdropBalance(userId);
//       if (balanceResult.success && balanceResult.balance) {
//         setAirdropBalance(balanceResult.balance);
//       }
//     } catch (error) {
//       console.error('Error loading airdrop balance:', error);
//     }
//   };

//   const handleClaimToAirdrop = async () => {
//     if (!userId) return;
    
//     setIsProcessingAirdropClaim(true);
//     try {
//       const result = await claimTotalEarnedToAirdrop(userId);
      
//       if (result.success) {
//         showSnackbar?.({
//           message: 'Assets Verified',
//           description: `${result.claimedAmount?.toFixed(4)} RZC migrated to Secure Hub.`,
//           type: 'success'
//         });
        
//         const updatedBalance = await getUserRZCBalance(userId);
//         setClaimableRZC(updatedBalance.claimableRZC);
//         setTotalEarnedRZC(updatedBalance.totalEarned);
//         setClaimedRZC(updatedBalance.claimedRZC);
        
//         if (isMining) setAccumulatedRZC(0);
        
//         await loadAirdropBalance();
//         setShowAirdropModal(false);
//       }
//     } catch (error) {
//       console.error('Airdrop claim error:', error);
//     } finally {
//       setIsProcessingAirdropClaim(false);
//     }
//   };

//   const handleReclaimFromAirdrop = async () => {
//     if (!userId) return;
    
//     setIsProcessingAirdropReclaim(true);
//     try {
//       const result = await reclaimFromAirdropToMining(userId);
      
//       if (result.success) {
//         showSnackbar?.({ 
//           message: 'Liquidity Reclaimed', 
//           description: `RZC returned to active pool.`, 
//           type: 'success' 
//         });
        
//         const updatedBalance = await getUserRZCBalance(userId);
//         setClaimableRZC(updatedBalance.claimableRZC);
//         setTotalEarnedRZC(updatedBalance.totalEarned);
//         setClaimedRZC(updatedBalance.claimedRZC);
        
//         await loadAirdropBalance();
//         setShowAirdropModal(false);
//       }
//     } catch (error) {
//       console.error('Airdrop reclaim error:', error);
//     } finally {
//       setIsProcessingAirdropReclaim(false);
//     }
//   };

//   const handleWithdrawFromAirdrop = async () => {
//     if (!userId || !withdrawAmount || !withdrawAddress) return;
    
//     const amount = parseFloat(withdrawAmount);
//     if (isNaN(amount) || amount <= 0) return;
    
//     setIsProcessingWithdraw(true);
//     try {
//       const result = await createAirdropWithdrawal(userId, amount, withdrawAddress, 'ton');
      
//       if (result.success) {
//         showSnackbar?.({ 
//           message: 'Egress Protocol Initialized', 
//           description: `Transfer pending verification.`, 
//           type: 'success' 
//         });
        
//         await loadAirdropBalance();
//         setShowWithdrawModal(false);
//         setWithdrawAmount('');
//         setWithdrawAddress('');
//       }
//     } catch (error) {
//       console.error('Withdrawal error:', error);
//     } finally {
//       setIsProcessingWithdraw(false);
//     }
//   };

//   // Peer-to-peer Send
//   const handleSendRZC = async () => {
//     if (!userId || !selectedRecipient || !sendAmount) return;
    
//     const amount = parseFloat(sendAmount);
//     if (isNaN(amount) || amount <= 0) return;
    
//     setIsProcessingSend(true);
//     try {
//       const result = await sendRZCToUser(userId, selectedRecipient.id, amount, sendMessage);
      
//       if (result.success) {
//         showSnackbar?.({
//           message: 'Dispatch Successful',
//           description: `Transferred ${amount.toFixed(4)} RZC to @${selectedRecipient.username}.`,
//           type: 'success'
//         });
        
//         await loadAirdropBalance();
//         loadHistory();
//         setShowSendModal(false);
//         setSendAmount('');
//         setSendMessage('');
//         setSelectedRecipient(null);
//       } else {
//         showSnackbar?.({ message: 'Dispatch Failed', description: result.error, type: 'error' });
//       }
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsProcessingSend(false);
//     }
//   };

//   const loadHistory = async () => {
//     if (!userId) return;
//     const history = await getUserTransferHistory(userId);
//     setTransferHistory(history);
//   };

//   const handleStakeAirdropBalance = async () => {
//     if (!userId) return;
    
//     setIsProcessingStake(true);
//     try {
//       const result = await stakeAirdropBalance(userId);
      
//       if (result.success) {
//         showSnackbar?.({ 
//           message: 'Stake Finalized', 
//           description: `70% of hub assets now generating yield.`, 
//           type: 'success' 
//         });
        
//         await loadAirdropBalance();
//         setShowStakeModal(false);
//       }
//     } catch (error) {
//       console.error('Staking error:', error);
//     } finally {
//       setIsProcessingStake(false);
//     }
//   };

//   const handleCopyTonAddress = async () => {
//     if (!tonAddress) return;
//     try {
//       await navigator.clipboard.writeText(tonAddress);
//       showSnackbar?.({ message: 'Encrypted Copy', description: 'Network address copied.' });
//     } catch (error) {
//       console.error('Failed to copy address:', error);
//     }
//   };

//   const rolloverSession = async () => {
//     if(!currentSession) return;
//     const result = await manualCompleteMiningSession(currentSession.id);
//     if(result.success) {
//       setIsMining(false);
//       setAccumulatedRZC(0);
//       setCurrentSession(null);
//       const bal = await getUserRZCBalance(userId!);
//       setClaimableRZC(bal.claimableRZC);
      
//       setTimeout(async () => {
//         const start = await startMiningSessionUnrestricted(userId!);
//         if(start.success) {
//           const active = await getActiveMiningSession(userId!);
//           if(active) {
//             setCurrentSession(active);
//             setIsMining(true);
//           }
//         }
//       }, 500);
//     }
//   };

//   useEffect(() => {
//     if (userSearchQuery.trim().length >= 2) {
//       const runSearch = async () => {
//         const res = await searchUsersForTransfer(userSearchQuery, userId!);
//         setSearchResults(res);
//       };
//       const delay = setTimeout(runSearch, 300);
//       return () => clearTimeout(delay);
//     } else {
//       setSearchResults([]);
//     }
//   }, [userSearchQuery, userId]);

//   useEffect(() => {
//     if (!isMining || !currentSession) return;
//     const interval = setInterval(async () => {
//       const now = new Date();
//       const endTime = new Date(currentSession.end_time);
      
//       if (now >= endTime) {
//         await rolloverSession();
//       } else {
//         const startTime = new Date(currentSession.start_time);
//         const timeSinceBase = Math.max(0, (now.getTime() - startTime.getTime()) / 1000);
//         const earned = timeSinceBase * RZC_PER_SECOND;
//         setAccumulatedRZC(earned);
//       }
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [isMining, currentSession]);

//   useEffect(() => {
//     if (!userId) return;
//     const loadData = async () => {
//       await initializeFreeMiningPeriod(userId);
//       const code = await ensureUserHasSponsorCode(userId, userUsername);
//       setSponsorCode(code);

//       await loadAirdropBalance();
//       loadHistory();

//       const [rzcBalance, miningCheck, activeSession] = await Promise.all([
//         getUserRZCBalance(userId),
//         canUserStartMining(userId),
//         getActiveMiningSession(userId)
//       ]);

//       setClaimableRZC(rzcBalance.claimableRZC);
//       setClaimedRZC(rzcBalance.claimedRZC);
//       setTotalEarnedRZC(rzcBalance.totalEarned);

//       if (activeSession) {
//         const now = new Date();
//         if (now < new Date(activeSession.end_time)) {
//           setCurrentSession(activeSession);
//           setIsMining(true);
//         } else {
//           await rolloverSession();
//         }
//       }
//     };
//     loadData();
//     const interval = setInterval(loadData, 30000);
//     return () => clearInterval(interval);
//   }, [userId, userUsername]);

//   useImperativeHandle(ref, () => ({
//     refreshBalance: async () => {
//       if(!userId) return;
//       const bal = await getUserRZCBalance(userId);
//       setClaimableRZC(bal.claimableRZC);
//       setClaimedRZC(bal.claimedRZC);
//       setTotalEarnedRZC(bal.totalEarned);
//       await loadAirdropBalance();
//     }
//   }));

//   const sequenceItems = [
//     { 
//       label: 'Asset Verification', 
//       sub: 'Pool Integrity', 
//       done: currentTotalEarned > 0, 
//       icon: Icons.Energy, 
//       explain: 'We audit the tokens earned in your virtual mining pool to confirm they are ready for network migration.' 
//     },
//     { 
//       label: 'Secure Migration', 
//       sub: 'Hub Deployment', 
//       done: (airdropBalance?.total_claimed_to_airdrop || 0) > 0, 
//       icon: Icons.Wallet, 
//       explain: 'Establishes a permanent link between your cloud earnings and your private on-chain distribution hub.' 
//     },
//     { 
//       label: 'Network Identity', 
//       sub: 'Protocol Auth', 
//       done: !!sponsorCode, 
//       icon: Icons.Rank, 
//       explain: 'Initializes your encrypted signature within the RhizaCore network, enabling verified node participation.' 
//     },
//     { 
//       label: 'Stake Commitment', 
//       sub: 'Validator Yield', 
//       done: (airdropBalance?.staked_balance || 0) > 0, 
//       icon: Icons.Boost, 
//       explain: 'Secures 70% of hub assets in the validator pool to generate recurring network rewards and protocol equity.' 
//     },
//     { 
//       label: 'Ecosystem Access', 
//       sub: 'Market Entry', 
//       done: (airdropBalance?.staked_balance || 0) > 0, 
//       icon: Icons.Store, 
//       explain: 'Unlocks priority access to the decentralized marketplace for Pre-Mainnet RZC asset acquisitions.' 
//     }
//   ];

//   const readinessProgress = sequenceItems.filter(item => item.done).length;

//   return (
//     <div className="flex flex-col h-full w-full bg-[#020202] text-white overflow-y-auto custom-scrollbar pb-20 font-sans selection:bg-green-500/30">
      
//       {/* Compact Header */}
//       <div className="flex justify-between items-center px-6 pt-6 pb-3">
//         <div className="flex items-center gap-3">
//           <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-600 to-green-400 flex items-center justify-center shadow-lg">
//             <Icons.Rank size={16} className="text-white" />
//           </div>
//           <div>
//             <h1 className="text-[10px] font-bold tracking-[0.25em] text-white uppercase leading-none">RhizaCore</h1>
//             <span className="text-[7px] text-green-500 font-bold uppercase tracking-widest">V4.0 Protocol</span>
//           </div>
//         </div>
//         <div className="px-2.5 py-1 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center gap-1.5">
//           <div className={`w-1 h-1 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-zinc-700'}`}></div>
//           <span className="text-[8px] font-bold text-green-400 uppercase tracking-widest">
//             {isMining ? 'Active' : 'Idle'}
//           </span>
//         </div>
//       </div>

//       {/* Compact Balance Section */}
//       <div className="px-6 py-6 relative">
//         <div className="text-center">
//           <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mb-1 block">Hub Balance</span>
//           <div className="flex items-baseline justify-center gap-2 mb-3">
//             <span className="text-4xl font-bold font-mono tracking-tighter text-white">
//               {airdropBalance ? (airdropBalance.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'}
//             </span>
//             <span className="text-green-500 font-bold text-lg">RZC</span>
//           </div>
//           <div className="px-3 py-1 bg-zinc-900/50 rounded-xl border border-white/5">
//             <span className="text-gray-400 text-[10px] font-mono font-bold">
//               ≈ ${((airdropBalance ? (airdropBalance.available_balance || 0) : 0) * 0.1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
//             </span>
//           </div>
//         </div>

//         {/* Compact Wallet Address */}
//         {tonAddress && (
//           <div className="mt-4">
//             <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 flex items-center justify-between hover:border-green-500/20 transition-all group">
//               <div className="flex items-center gap-3 flex-1 min-w-0">
//                 <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
//                   <Icons.Wallet size={12} className="text-green-500" />
//                 </div>
//                 <div className="flex flex-col min-w-0">
//                   <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">Address</span>
//                   <span className="text-zinc-300 font-mono text-[10px] truncate">
//                     {tonAddress.slice(0, 12)}...{tonAddress.slice(-8)}
//                   </span>
//                 </div>
//               </div>
//               <button 
//                 onClick={handleCopyTonAddress}
//                 className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors text-zinc-600 hover:text-white"
//               >
//                 <Icons.Copy size={14} />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Compact Actions Grid */}
//       <div className="flex justify-between gap-3 px-6 mb-6">
//         <CompactAction 
//           icon={Icons.Send} 
//           label="Send" 
//           disabled={!airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
//           onClick={() => setShowSendModal(true)} 
//         />
//         <CompactAction 
//           icon={Icons.Copy} 
//           label="Receive" 
//           onClick={() => setShowReceiveModal(true)} 
//           variant="zinc" 
//         />
//         <CompactAction 
//           icon={Icons.Store}
//           label="Market" 
//           disabled={!airdropBalance || (airdropBalance.staked_balance || 0) <= 0} 
//           onClick={() => setShowSaleModal(true)} 
//           variant={(airdropBalance && (airdropBalance.staked_balance || 0) > 0) ? "green" : "zinc"}
//           badge={(airdropBalance && (airdropBalance.staked_balance || 0) > 0)}
//         />
//         <CompactAction 
//           icon={Icons.Boost}
//           label="Stake" 
//           disabled={!airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
//           onClick={() => setShowStakeModal(true)}
//           variant="blue"
//         />
//       </div>

//       {/* Smart Asset Overview */}
//       <div className="px-6 mb-6">
//         <div className="flex items-center gap-2 mb-3">
//           <h3 className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.3em]">Assets</h3>
//           <div className="h-px flex-1 bg-white/[0.04]"></div>
//         </div>
        
//         <div className="space-y-2">
//           <StatCard
//             label="Available"
//             value={airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
//             subValue="RZC"
//             icon={Icons.Wallet}
//             onClick={() => setShowAirdropModal(true)}
//             variant="default"
//           />
          
//           {airdropBalance && (airdropBalance.staked_balance || 0) > 0 && (
//             <StatCard
//               label="Staked"
//               value={(airdropBalance.staked_balance || 0).toFixed(4)}
//               subValue="Earning Yield"
//               icon={Icons.Energy}
//               onClick={() => setShowStakeModal(true)}
//               variant="active"
//             />
//           )}
//         </div>
//       </div>

//       {/* Smart Progress Indicator */}
//       <div className="px-6 mb-6">
//         <div className="flex items-center gap-2 mb-3">
//           <h3 className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.3em]">Setup</h3>
//           <div className="h-px flex-1 bg-white/[0.04]"></div>
//           <span className="text-[8px] text-zinc-600 font-mono">{readinessProgress}/5</span>
//         </div>
        
//         <div className="bg-[#080808] border border-white/[0.06] rounded-2xl p-4">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
//                 <Icons.Check size={16} className="text-white" />
//               </div>
//               <div>
//                 <h4 className="text-white text-sm font-bold leading-none">Progress</h4>
//                 <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
//                   {Math.round((readinessProgress/5)*100)}% Complete
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Compact Progress Steps */}
//           <div className="space-y-2">
//             {sequenceItems.slice(0, 3).map((item, idx) => (
//               <div 
//                 key={idx} 
//                 className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
//                   item.done ? 'bg-white/[0.02]' : 'opacity-40'
//                 }`}
//               >
//                 <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
//                   item.done ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-zinc-700'
//                 }`}>
//                   <item.icon size={12} strokeWidth={1.5} />
//                 </div>
//                 <div className="flex-1">
//                   <span className={`text-[10px] font-bold ${item.done ? 'text-white' : 'text-zinc-600'}`}>
//                     {item.label}
//                   </span>
//                 </div>
//                 {item.done && (
//                   <div className="w-4 h-4 bg-green-500/20 rounded flex items-center justify-center">
//                     <Icons.Check size={8} className="text-green-500" />
//                   </div>
//                 )}
//               </div>
//             ))}
            
//             {sequenceItems.length > 3 && (
//               <button 
//                 onClick={() => setExpandedStep(expandedStep === null ? 0 : null)}
//                 className="w-full text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors py-1"
//               >
//                 {expandedStep === null ? `+${sequenceItems.length - 3} more steps` : 'Show less'}
//               </button>
//             )}
            
//             {expandedStep !== null && sequenceItems.slice(3).map((item, idx) => (
//               <div 
//                 key={idx + 3} 
//                 className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
//                   item.done ? 'bg-white/[0.02]' : 'opacity-40'
//                 }`}
//               >
//                 <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
//                   item.done ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-zinc-700'
//                 }`}>
//                   <item.icon size={12} strokeWidth={1.5} />
//                 </div>
//                 <div className="flex-1">
//                   <span className={`text-[10px] font-bold ${item.done ? 'text-white' : 'text-zinc-600'}`}>
//                     {item.label}
//                   </span>
//                 </div>
//                 {item.done && (
//                   <div className="w-4 h-4 bg-green-500/20 rounded flex items-center justify-center">
//                     <Icons.Check size={8} className="text-green-500" />
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Compact Progress Bar */}
//           <div className="mt-4">
//             <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
//               <div 
//                 className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000 ease-out" 
//                 style={{ width: `${(readinessProgress / 5) * 100}%` }}
//               ></div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Claim to Airdrop Modal */}
//       {/* Compact Airdrop Modal */}
//       {showAirdropModal && (
//         <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
//            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setShowAirdropModal(false)}></div>
           
//            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
//               {/* Compact Header */}
//               <div className="text-center mb-6">
//                 <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
//                   <Icons.Wallet size={24} className="text-white" />
//                 </div>
//                 <h3 className="text-xl font-bold text-white mb-2">
//                   {airdropBalance && (airdropBalance.available_balance || 0) > 0 ? 'Balance Manager' : 'Claim Assets'}
//                 </h3>
//                 <p className="text-gray-400 text-sm leading-relaxed">
//                   {airdropBalance && (airdropBalance.available_balance || 0) > 0 
//                     ? 'Manage your airdrop funds or reclaim to mining'
//                     : 'Move earned RZC to your secure airdrop balance'
//                   }
//                 </p>
//               </div>

//               {/* Compact Balance Summary */}
//               <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="text-center">
//                     <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Total Earned</div>
//                     <div className="text-purple-400 font-bold text-lg font-mono">{currentTotalEarned.toFixed(4)}</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Available</div>
//                     <div className="text-green-400 font-bold text-lg font-mono">
//                       {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
//                     </div>
//                   </div>
//                 </div>
//                 {airdropBalance && (airdropBalance.staked_balance || 0) > 0 && (
//                   <div className="text-center mt-3 pt-3 border-t border-white/10">
//                     <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Staked</div>
//                     <div className="text-blue-400 font-bold text-lg font-mono">
//                       {(airdropBalance.staked_balance || 0).toFixed(4)}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Smart Action Buttons */}
//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => setShowAirdropModal(false)}
//                   className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl text-sm font-bold transition-colors"
//                 >
//                   Cancel
//                 </button>
                
//                 {airdropBalance && (airdropBalance.available_balance || 0) > 0 ? (
//                   <button 
//                     onClick={handleReclaimFromAirdrop}
//                     disabled={isProcessingAirdropReclaim}
//                     className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
//                   >
//                     {isProcessingAirdropReclaim ? (
//                       <div className="flex items-center justify-center gap-2">
//                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                         <span>Processing</span>
//                       </div>
//                     ) : (
//                       'Reclaim'
//                     )}
//                   </button>
//                 ) : (
//                   <button 
//                     onClick={handleClaimToAirdrop}
//                     disabled={isProcessingAirdropClaim || currentTotalEarned <= 0}
//                     className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
//                   >
//                     {isProcessingAirdropClaim ? (
//                       <div className="flex items-center justify-center gap-2">
//                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                         <span>Processing</span>
//                       </div>
//                     ) : (
//                       'Claim'
//                     )}
//                   </button>
//                 )}
//               </div>
//            </div>
//         </div>
//       )}

//       {/* Compact Withdraw Modal */}
//       {showWithdrawModal && (
//         <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in duration-200">
//           <div className="absolute inset-0 bg-black/98 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
          
//           <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
//             {/* Compact Header */}
//             <div className="text-center mb-6">
//               <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
//                 <Icons.Send size={24} className="text-white" />
//               </div>
//               <h3 className="text-xl font-bold text-white mb-2">External Transfer</h3>
//               <p className="text-gray-400 text-sm leading-relaxed">
//                 Withdraw RZC to external wallet
//               </p>
//             </div>

//             {/* Compact Balance Display */}
//             <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 text-center">
//               <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Available</div>
//               <div className="text-green-400 font-bold text-2xl font-mono">
//                 {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
//               </div>
//               <div className="text-[9px] text-zinc-600 font-mono mt-1">RZC</div>
//             </div>

//             {/* Compact Form */}
//             <div className="space-y-4 mb-6">
//               <div className="relative">
//                 <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
//                   Amount
//                 </label>
//                 <input
//                   type="number"
//                   value={withdrawAmount}
//                   onChange={(e) => setWithdrawAmount(e.target.value)}
//                   placeholder="0.0000"
//                   step="0.0001"
//                   min="0"
//                   max={airdropBalance?.available_balance || 0}
//                   className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-green-500/50 focus:outline-none pr-16"
//                 />
//                 <button
//                   onClick={() => setWithdrawAmount((airdropBalance?.available_balance || 0).toString())}
//                   className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400 text-[8px] font-bold uppercase tracking-widest hover:text-green-300"
//                 >
//                   MAX
//                 </button>
//               </div>
              
//               <div className="relative">
//                 <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
//                   Address
//                 </label>
//                 <input
//                   type="text"
//                   value={withdrawAddress}
//                   onChange={(e) => setWithdrawAddress(e.target.value)}
//                   placeholder="0x..."
//                   className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
//                 />
//               </div>

//               <div className="relative">
//                 <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
//                   Network
//                 </label>
//                 <select
//                   value={withdrawNetwork}
//                   onChange={(e) => setWithdrawNetwork(e.target.value)}
//                   className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm focus:border-green-500/50 focus:outline-none"
//                 >
//                   <option value="ethereum">Ethereum</option>
//                   <option value="polygon">Polygon</option>
//                   <option value="bsc">BSC</option>
//                 </select>
//               </div>
//             </div>

//             {/* Smart Action Buttons */}
//             <div className="flex gap-3">
//               <button 
//                 onClick={() => {
//                   setShowWithdrawModal(false);
//                   setWithdrawAmount('');
//                   setWithdrawAddress('');
//                 }}
//                 className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl text-sm font-bold transition-colors"
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={handleWithdrawFromAirdrop}
//                 disabled={isProcessingWithdraw || !withdrawAmount || !withdrawAddress}
//                 className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
//               >
//                 {isProcessingWithdraw ? (
//                   <div className="flex items-center justify-center gap-2">
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                     <span>Processing</span>
//                   </div>
//                 ) : (
//                   'Withdraw'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Stake Modal - Protocol Audit Style */}
//       {showStakeModal && (
//         <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-400">
//           <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setShowStakeModal(false)}></div>
          
//           <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 shadow-3xl">
//             {/* Protocol-themed Header */}
//             <div className="text-center mb-8">
//               <div className="w-16 h-16 bg-green-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/10 text-green-400 shadow-inner">
//                 <Icons.Energy size={28} strokeWidth={1.5} />
//               </div>
//               <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Stake Audit</h3>
//               <p className="text-zinc-500 text-[10px]">Commit for validator yield.</p>
//             </div>

//             {/* Professional Balance Breakdown */}
//             <div className="bg-zinc-900/40 rounded-2xl p-6 border border-white/[0.05] space-y-4 mb-8 shadow-inner">
//               <div className="flex justify-between items-center">
//                 <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Locked (70%)</span>
//                 <span className="text-green-500 font-bold font-mono text-xl">
//                   {((airdropBalance?.available_balance || 0) * 0.7).toFixed(2)}
//                 </span>
//               </div>
//               <div className="h-px bg-white/[0.03] w-full"></div>
//               <div className="flex justify-between items-center">
//                 <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Liquid (30%)</span>
//                 <span className="text-zinc-400 font-bold font-mono text-xl">
//                   {((airdropBalance?.available_balance || 0) * 0.3).toFixed(2)}
//                 </span>
//               </div>
//             </div>

//             {/* Protocol Action Buttons */}
//             <div className="flex gap-3">
//               <button 
//                 onClick={() => setShowStakeModal(false)} 
//                 className="flex-1 h-14 bg-zinc-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest border border-white/5"
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={handleStakeAirdropBalance} 
//                 disabled={isProcessingStake || !airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
//                 className="flex-1 h-14 bg-green-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-xl border border-green-500/20 disabled:opacity-40"
//               >
//                 {isProcessingStake ? 'Wait...' : 'Authorize'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* RhizaCore Sale Component */}
//       {showSaleModal && (
//         <RhizaCoreSaleComponent
//           tonPrice={tonPrice}
//           tonAddress={tonAddress}
//           showSnackbar={showSnackbar}
//           onClose={() => setShowSaleModal(false)}
//         />
//       )}

//       {/* Compact Send Modal */}
//       {showSendModal && (
//         <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in duration-200">
//           <div className="absolute inset-0 bg-black/98 backdrop-blur-sm" onClick={() => setShowSendModal(false)}></div>
          
//           <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
//             {/* Compact Header */}
//             <div className="text-center mb-6">
//               <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
//                 <Icons.Send size={24} className="text-white" />
//               </div>
//               <h3 className="text-xl font-bold text-white mb-2">Send RZC</h3>
//               <p className="text-gray-400 text-sm leading-relaxed">
//                 Transfer to username or Telegram ID
//               </p>
//             </div>

//             {/* Compact Balance Display */}
//             <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 text-center">
//               <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Available</div>
//               <div className="text-green-400 font-bold text-2xl font-mono">
//                 {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
//               </div>
//               <div className="text-[9px] text-zinc-600 font-mono mt-1">RZC</div>
//             </div>

//             {/* Compact Send Form */}
//             <div className="space-y-4 mb-6">
//               {/* Recipient Search */}
//               <div className="relative">
//                 <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
//                   Recipient
//                 </label>
//                 {selectedRecipient ? (
//                   <div className="h-12 bg-white/[0.04] border border-green-500/30 rounded-2xl px-4 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
//                         <span className="text-green-400 text-xs font-bold">
//                           {(selectedRecipient.username || selectedRecipient.display_name || 'U')[0].toUpperCase()}
//                         </span>
//                       </div>
//                       <div className="text-white text-sm font-medium">
//                         @{selectedRecipient.username || selectedRecipient.display_name || 'Unknown'}
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => {
//                         setSelectedRecipient(null);
//                         setUserSearchQuery('');
//                       }}
//                       className="text-gray-400 hover:text-white"
//                     >
//                       <Icons.Copy size={14} />
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="relative">
//                     <input
//                       type="text"
//                       value={userSearchQuery}
//                       onChange={(e) => setUserSearchQuery(e.target.value)}
//                       placeholder="Search username or ID..."
//                       className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
//                     />
//                     {searchResults.length > 0 && (
//                       <div className="absolute top-full mt-2 w-full bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl max-h-32 overflow-y-auto">
//                         {searchResults.map((user) => (
//                           <button
//                             key={user.id}
//                             onClick={() => {
//                               setSelectedRecipient(user);
//                               setUserSearchQuery('');
//                               setSearchResults([]);
//                             }}
//                             className="w-full p-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
//                           >
//                             <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
//                               <span className="text-green-400 text-xs font-bold">
//                                 {(user.username || user.display_name || 'U')[0].toUpperCase()}
//                               </span>
//                             </div>
//                             <div>
//                               <div className="text-white text-sm font-medium">
//                                 @{user.username || user.display_name || 'Unknown'}
//                               </div>
//                               <div className="text-gray-400 text-xs">
//                                 {user.telegram_id ? `Telegram: ${user.telegram_id}` : `ID: ${user.id}`}
//                               </div>
//                             </div>
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
              
//               {/* Amount */}
//               <div className="relative">
//                 <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
//                   Amount
//                 </label>
//                 <input
//                   type="number"
//                   value={sendAmount}
//                   onChange={(e) => setSendAmount(e.target.value)}
//                   placeholder="0.0000"
//                   step="0.0001"
//                   min="0"
//                   max={airdropBalance?.available_balance || 0}
//                   className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-green-500/50 focus:outline-none pr-16"
//                 />
//                 <button
//                   onClick={() => setSendAmount((airdropBalance?.available_balance || 0).toString())}
//                   className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400 text-[8px] font-bold uppercase tracking-widest hover:text-green-300"
//                 >
//                   MAX
//                 </button>
//               </div>

//               {/* Message */}
//               <div className="relative">
//                 <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
//                   Message (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={sendMessage}
//                   onChange={(e) => setSendMessage(e.target.value)}
//                   placeholder="Add a message..."
//                   maxLength={100}
//                   className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
//                 />
//               </div>
//             </div>

//             {/* Smart Action Buttons */}
//             <div className="flex gap-3">
//               <button 
//                 onClick={() => {
//                   setShowSendModal(false);
//                   setSendAmount('');
//                   setSendMessage('');
//                   setSelectedRecipient(null);
//                   setUserSearchQuery('');
//                   setSearchResults([]);
//                 }}
//                 className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl text-sm font-bold transition-colors"
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={handleSendRZC}
//                 disabled={isProcessingSend || !selectedRecipient || !sendAmount}
//                 className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
//               >
//                 {isProcessingSend ? (
//                   <div className="flex items-center justify-center gap-2">
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                     <span>Sending</span>
//                   </div>
//                 ) : (
//                   'Send RZC'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Receive Modal - Protocol Identity Style */}
//       {showReceiveModal && (
//         <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-400">
//           <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setShowReceiveModal(false)}></div>
          
//           <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 shadow-3xl">
//             {/* Protocol-themed Header */}
//             <div className="text-center mb-6">
//               <div className="w-16 h-16 bg-green-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/10 text-green-400 shadow-inner">
//                 <Icons.Copy size={28} strokeWidth={1.5} />
//               </div>
//               <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Node Identity</h3>
//               <p className="text-zinc-500 text-[10px]">Protocol metadata & transfer registry.</p>
//             </div>

//             <div className="space-y-5 mb-8">
//               {/* Protocol Identity Card */}
//               <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl shadow-inner text-center">
//                 <div className="text-zinc-600 text-[7px] font-bold uppercase tracking-[0.4em] mb-2">Protocol Identity</div>
//                 <div className="text-green-500 font-mono text-lg font-bold tracking-tight mb-1">@{userUsername || 'Not set'}</div>
//                 <div className="text-zinc-700 text-[8px] font-mono">Sig: {userId}</div>
//               </div>

//               {/* Registry History */}
//               <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
//                 <h4 className="text-zinc-600 text-[7px] font-bold uppercase tracking-[0.3em] mb-3">Registry History</h4>
//                 <div className="space-y-2">
//                   {transferHistory.length > 0 ? transferHistory.map(tx => (
//                     <div key={tx.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
//                           tx.from_user_id === userId ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
//                         }`}>
//                           {tx.from_user_id === userId ? <Icons.Send size={10} /> : <Icons.Copy size={10} />}
//                         </div>
//                         <div className="flex flex-col">
//                           <span className="text-[9px] font-bold text-zinc-300">
//                             @{tx.from_user_id === userId 
//                               ? (tx.to_user?.username || tx.to_user?.display_name || `User${tx.to_user_id}`)
//                               : (tx.from_user?.username || tx.from_user?.display_name || `User${tx.from_user_id}`)
//                             }
//                           </span>
//                           <span className="text-[7px] text-zinc-700 font-mono">
//                             {new Date(tx.created_at).toLocaleDateString()}
//                           </span>
//                         </div>
//                       </div>
//                       <div className={`text-[10px] font-bold font-mono ${
//                         tx.from_user_id === userId ? 'text-red-400' : 'text-green-400'
//                       }`}>
//                         {tx.from_user_id === userId ? '-' : '+'}{tx.amount.toFixed(2)}
//                       </div>
//                     </div>
//                   )) : (
//                     <div className="py-4 text-center text-zinc-800 text-[8px] uppercase font-bold tracking-widest italic">
//                       Registry Empty
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <button 
//               onClick={() => setShowReceiveModal(false)} 
//               className="w-full h-14 bg-zinc-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest border border-white/5"
//             >
//               Close Registry
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Custom styles for TonConnectButton */}
//       <style dangerouslySetInnerHTML={{
//         __html: `
//           .ton-connect-button-custom {
//             --tc-bg-color: #3b82f6;
//             --tc-bg-color-hover: #2563eb;
//             --tc-text-color: #ffffff;
//             --tc-border-radius: 8px;
//             --tc-font-size: 12px;
//             --tc-font-weight: 600;
//             --tc-padding: 8px 16px;
//             --tc-min-height: 32px;
//           }
          
//           .ton-connect-button-custom button {
//             background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
//             border: 1px solid rgba(59, 130, 246, 0.3) !important;
//             color: white !important;
//             font-size: 12px !important;
//             font-weight: 600 !important;
//             padding: 8px 16px !important;
//             border-radius: 8px !important;
//             min-height: 32px !important;
//             transition: all 0.2s ease !important;
//             white-space: nowrap !important;
//           }
          
//           .ton-connect-button-custom button:hover {
//             background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
//             transform: translateY(-1px) !important;
//             box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
//           }

//           /* Disconnect button styling */
//           .ton-connect-button-custom button[data-tc-connected="true"] {
//             background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
//             border: 1px solid rgba(239, 68, 68, 0.3) !important;
//           }
          
//           .ton-connect-button-custom button[data-tc-connected="true"]:hover {
//             background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
//             box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
//           }

//           /* Enhanced shadow for protocol modals */
//           .shadow-3xl {
//             box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 1), 0 0 40px -10px rgba(34, 197, 94, 0.05);
//           }

//           /* Custom scrollbar for protocol modals */
//           .custom-scrollbar::-webkit-scrollbar {
//             width: 4px;
//           }
          
//           .custom-scrollbar::-webkit-scrollbar-track {
//             background: rgba(255, 255, 255, 0.05);
//             border-radius: 2px;
//           }
          
//           .custom-scrollbar::-webkit-scrollbar-thumb {
//             background: rgba(34, 197, 94, 0.3);
//             border-radius: 2px;
//           }
          
//           .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//             background: rgba(34, 197, 94, 0.5);
//           }
//         `
//       }} />
//     </div>
//   );
// });

// export default NativeWalletUI;