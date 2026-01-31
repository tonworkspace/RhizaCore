// import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
// import { TonConnectButton } from '@tonconnect/ui-react';
// import {
//   ensureUserHasSponsorCode,
// //   startMiningSession,
//   startMiningSessionUnrestricted,
//   getActiveMiningSession,
//   manualCompleteMiningSession,
//   getUserRZCBalance,
//   canUserStartMining,
// //   recordMiningActivity,
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
//   UserSearchResult
// } from '../lib/supabaseClient';
// import { Icons } from './Icon'; // Assuming your Icon export handles the names, otherwise see inline SVGs below
// import RhizaCoreSaleComponent from './RhizaCoreSaleComponent';

// // --- TYPES & INTERFACES ---

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
//   tonAddress?: string | null;
//   totalEarnedRZC?: number;
// }

// export type ArcadeMiningUIHandle = {
//   refreshBalance: () => Promise<void> | void;
// };

// // --- HELPER COMPONENTS FOR THE NEW UI ---

// const WalletAction = ({ icon: Icon, label, onClick, disabled, colorClass = "bg-green-400" }: any) => (
//   <button 
//     onClick={onClick}
//     disabled={disabled}
//     className="flex flex-col items-center gap-2 group"
//   >
//     <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
//       ${disabled 
//         ? 'bg-white/5 text-gray-700 border border-white/5' 
//         : `${colorClass} text-black shadow-[0_4px_15px_rgba(74,222,128,0.2)] hover:scale-110 active:scale-95`
//       }
//     `}>
//       <Icon size={24} />
//     </div>
//     <span className={`text-[10px] font-bold uppercase tracking-widest ${disabled ? 'text-gray-600' : 'text-gray-400 group-hover:text-white'}`}>
//       {label}
//     </span>
//   </button>
// );

// const NativeWalletUI = forwardRef<ArcadeMiningUIHandle, ArcadeMiningUIProps>(function WalletUI(props, ref) {
//   // const { t } = useI18n();
//   // const { updateClaimedRZC, updateMiningBalance, setIsMining: setContextIsMining } = useGameData();
//   const {
//     userId,
//     userUsername,
//     tonAddress,
//     tonPrice,
//     showSnackbar,
//     referralCode,
//     totalEarnedRZC = 0,
//   } = props;

//   // --- LOGIC & STATE (Preserved from original) ---
//   const [, setSponsorCode] = useState<string | null>(null);
  
//   // Mining & Balance State
//   const [isMining, setIsMining] = useState(false);
//   const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
//   const [accumulatedRZC, setAccumulatedRZC] = useState(0);
//   const [claimableRZC, setClaimableRZC] = useState(0);
//   const [claimedRZC, setClaimedRZC] = useState(0);
//   const [totalEarnedRZCState, setTotalEarnedRZC] = useState(0);
//   const [lastClaimDuringMining] = useState<Date | null>(null);
  
//   // Airdrop Balance System
//   const [airdropBalance, setAirdropBalance] = useState<AirdropBalance | null>(null);
//   const [showAirdropModal, setShowAirdropModal] = useState(false);
//   const [showWithdrawModal, setShowWithdrawModal] = useState(false);
//   const [showStakeModal, setShowStakeModal] = useState(false);
//   const [showSaleModal, setShowSaleModal] = useState(false);
//   const [showSendModal, setShowSendModal] = useState(false);
//   const [showReceiveModal, setShowReceiveModal] = useState(false);
//   const [withdrawAmount, setWithdrawAmount] = useState('');
//   const [withdrawAddress, setWithdrawAddress] = useState('');
//   const [withdrawNetwork, setWithdrawNetwork] = useState('ethereum');
//   const [isProcessingAirdropClaim, setIsProcessingAirdropClaim] = useState(false);
//   const [isProcessingAirdropReclaim, setIsProcessingAirdropReclaim] = useState(false);
//   const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
//   const [isProcessingStake, setIsProcessingStake] = useState(false);
//   const [isProcessingSend, setIsProcessingSend] = useState(false);
  
//   // Send/Receive State
//   const [sendAmount, setSendAmount] = useState('');
//   const [sendMessage, setSendMessage] = useState('');
//   const [selectedRecipient, setSelectedRecipient] = useState<UserSearchResult | null>(null);
//   const [userSearchQuery, setUserSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
//   const [transferHistory, setTransferHistory] = useState<UserTransfer[]>([]);
  
//   // UI Specific State
//   const [, setCanStartMining] = useState(false);
//   const [miningRateMultiplier] = useState(1.0);
//   const [showCelebration] = useState(false);
  
//   // Constants
//   const RZC_PER_DAY = 50;
//   const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);

//   // Derived Values
//   const currentTotalEarned = totalEarnedRZC || totalEarnedRZCState;

//   // --- AIRDROP FUNCTIONS ---
  
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
//           message: 'Claimed to Airdrop Balance!',
//           description: `Successfully claimed ${result.claimedAmount?.toFixed(6)} RZC to your airdrop balance.`
//         });
        
//         // Refresh all balances to reflect the reset
//         const updatedBalance = await getUserRZCBalance(userId);
//         setClaimableRZC(updatedBalance.claimableRZC);
//         setTotalEarnedRZC(updatedBalance.totalEarned);
//         setClaimedRZC(updatedBalance.claimedRZC);
        
//         // Reset accumulated RZC if currently mining (since it's been moved to airdrop)
//         if (isMining) {
//           setAccumulatedRZC(0);
//         }
        
//         // Refresh airdrop balance
//         await loadAirdropBalance();
//         setShowAirdropModal(false);
//       } else {
//         showSnackbar?.({
//           message: 'Claim Failed',
//           description: result.error || 'Failed to claim to airdrop balance'
//         });
//       }
//     } catch (error) {
//       console.error('Airdrop claim error:', error);
//       showSnackbar?.({
//         message: 'Claim Failed',
//         description: 'An unexpected error occurred while claiming to airdrop balance.'
//       });
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
//           message: 'Reclaimed to Mining Balance!',
//           description: `Successfully reclaimed ${result.reclaimedAmount?.toFixed(6)} RZC back to your mining balance.`
//         });
        
//         // Refresh all balances to reflect the reclaim
//         const updatedBalance = await getUserRZCBalance(userId);
//         setClaimableRZC(updatedBalance.claimableRZC);
//         setTotalEarnedRZC(updatedBalance.totalEarned);
//         setClaimedRZC(updatedBalance.claimedRZC);
        
//         // Refresh airdrop balance (should be 0 now)
//         await loadAirdropBalance();
//         setShowAirdropModal(false);
//       } else {
//         showSnackbar?.({
//           message: 'Reclaim Failed',
//           description: result.error || 'Failed to reclaim from airdrop balance'
//         });
//       }
//     } catch (error) {
//       console.error('Airdrop reclaim error:', error);
//       showSnackbar?.({
//         message: 'Reclaim Failed',
//         description: 'An unexpected error occurred while reclaiming from airdrop balance.'
//       });
//     } finally {
//       setIsProcessingAirdropReclaim(false);
//     }
//   };

//   const handleWithdrawFromAirdrop = async () => {
//     if (!userId || !withdrawAmount || !withdrawAddress) return;
    
//     const amount = parseFloat(withdrawAmount);
//     if (isNaN(amount) || amount <= 0) {
//       showSnackbar?.({
//         message: 'Invalid Amount',
//         description: 'Please enter a valid withdrawal amount.'
//       });
//       return;
//     }

//     if (!airdropBalance || (airdropBalance.available_balance || 0) < amount) {
//       showSnackbar?.({
//         message: 'Insufficient Balance',
//         description: 'Not enough balance in your airdrop account.'
//       });
//       return;
//     }
    
//     setIsProcessingWithdraw(true);
//     try {
//       const result = await createAirdropWithdrawal(userId, amount, withdrawAddress, withdrawNetwork);
      
//       if (result.success) {
//         showSnackbar?.({
//           message: 'Withdrawal Request Created!',
//           description: `Your withdrawal of ${amount.toFixed(6)} RZC has been submitted for processing.`
//         });
        
//         // Refresh airdrop balance and withdrawals
//         await loadAirdropBalance();
//         setShowWithdrawModal(false);
//         setWithdrawAmount('');
//         setWithdrawAddress('');
//       } else {
//         showSnackbar?.({
//           message: 'Withdrawal Failed',
//           description: result.error || 'Failed to create withdrawal request'
//         });
//       }
//     } catch (error) {
//       console.error('Withdrawal error:', error);
//       showSnackbar?.({
//         message: 'Withdrawal Failed',
//         description: 'An unexpected error occurred while creating withdrawal request.'
//       });
//     } finally {
//       setIsProcessingWithdraw(false);
//     }
//   };

//   // --- USER SEARCH & TRANSFER FUNCTIONS ---
  
//   const searchUsers = async (query: string) => {
//     if (!query.trim() || !userId) return;
    
//     try {
//       const results = await searchUsersForTransfer(query, userId);
//       setSearchResults(results);
//     } catch (error) {
//       console.error('Error searching users:', error);
//       setSearchResults([]);
//     }
//   };

//   const loadTransferHistory = async () => {
//     if (!userId) return;
    
//     try {
//       const history = await getUserTransferHistory(userId, 10);
//       setTransferHistory(history);
//     } catch (error) {
//       console.error('Error loading transfer history:', error);
//     }
//   };

//   const handleSendRZC = async () => {
//     if (!userId || !selectedRecipient || !sendAmount) return;
    
//     const amount = parseFloat(sendAmount);
//     if (isNaN(amount) || amount <= 0) {
//       showSnackbar?.({
//         message: 'Invalid Amount',
//         description: 'Please enter a valid amount to send.'
//       });
//       return;
//     }

//     if (!airdropBalance || (airdropBalance.available_balance || 0) < amount) {
//       showSnackbar?.({
//         message: 'Insufficient Balance',
//         description: 'Not enough available balance to send.'
//       });
//       return;
//     }
    
//     setIsProcessingSend(true);
//     try {
//       const result = await sendRZCToUser(userId, selectedRecipient.id, amount, sendMessage || undefined);
      
//       if (result.success) {
//         showSnackbar?.({
//           message: 'RZC Sent Successfully!',
//           description: `Sent ${amount.toFixed(6)} RZC to ${selectedRecipient.username || selectedRecipient.display_name}`
//         });
        
//         // Refresh balances and close modal
//         await loadAirdropBalance();
//         await loadTransferHistory();
//         setShowSendModal(false);
//         setSendAmount('');
//         setSendMessage('');
//         setSelectedRecipient(null);
//         setUserSearchQuery('');
//         setSearchResults([]);
//       } else {
//         showSnackbar?.({
//           message: 'Send Failed',
//           description: result.error || 'Failed to send RZC'
//         });
//       }
//     } catch (error) {
//       console.error('Send error:', error);
//       showSnackbar?.({
//         message: 'Send Failed',
//         description: 'An unexpected error occurred while sending RZC.'
//       });
//     } finally {
//       setIsProcessingSend(false);
//     }
//   };

//   const handleStakeAirdropBalance = async () => {
//     if (!userId) return;
    
//     setIsProcessingStake(true);
//     try {
//       const result = await stakeAirdropBalance(userId);
      
//       if (result.success) {
//         showSnackbar?.({
//           message: 'Airdrop Balance Staked!',
//           description: `Successfully staked ${result.stakedAmount?.toFixed(6)} RZC (70%). ${result.remainingAmount?.toFixed(6)} RZC remains available.`
//         });
        
//         // Refresh airdrop balance
//         await loadAirdropBalance();
//         setShowStakeModal(false);
//       } else {
//         showSnackbar?.({
//           message: 'Staking Failed',
//           description: result.error || 'Failed to stake airdrop balance'
//         });
//       }
//     } catch (error) {
//       console.error('Staking error:', error);
//       showSnackbar?.({
//         message: 'Staking Failed',
//         description: 'An unexpected error occurred while staking airdrop balance.'
//       });
//     } finally {
//       setIsProcessingStake(false);
//     }
//   };

//   // --- EFFECTS (Data Fetching & Timers) ---

//   // Debug log for tonAddress
//   useEffect(() => {
//     console.log('NativeWalletUI - tonAddress changed:', tonAddress);
//   }, [tonAddress]);

//   // 2. Mining Loop (Accumulation)
//   useEffect(() => {
//     if (!isMining || !currentSession) return;
//     const interval = setInterval(async () => {
//       const now = new Date();
//       const endTime = new Date(currentSession.end_time);
      
//       if (now >= endTime) {
//         await rolloverSession();
//       } else {
//         const startTime = new Date(currentSession.start_time);
//         const baseTime = lastClaimDuringMining || startTime;
//         const timeSinceBase = Math.max(0, (now.getTime() - baseTime.getTime()) / 1000);
//         const earned = timeSinceBase * RZC_PER_SECOND;
//         setAccumulatedRZC(earned);
//       }
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [isMining, currentSession, lastClaimDuringMining, RZC_PER_SECOND]);

//   // 3. Initial Data Load
//   useEffect(() => {
//     if (!userId) return;
//     const loadData = async () => {
//         await initializeFreeMiningPeriod(userId);
//         const code = await ensureUserHasSponsorCode(userId, userUsername);
//         setSponsorCode(code);

//         await loadAirdropBalance();

//         const [rzcBalance, miningCheck, activeSession] = await Promise.all([
//           getUserRZCBalance(userId),
//           canUserStartMining(userId),
//           getActiveMiningSession(userId)
//         ]);

//         setClaimableRZC(rzcBalance.claimableRZC);
//         setClaimedRZC(rzcBalance.claimedRZC);
//         setTotalEarnedRZC(rzcBalance.totalEarned);
//         setCanStartMining(miningCheck.canMine);

//         if (activeSession) {
//           const now = new Date();
//           if (now < new Date(activeSession.end_time)) {
//              setCurrentSession(activeSession);
//              setIsMining(true);
//              // Calculate initial accumulation
//              const startTime = new Date(activeSession.start_time);
//              const lastClaim = rzcBalance.lastClaimTime ? new Date(rzcBalance.lastClaimTime) : new Date(0);
//              const calcStart = lastClaim > startTime ? lastClaim : startTime;
//              const elapsed = (now.getTime() - calcStart.getTime()) / 1000;
//              setAccumulatedRZC(elapsed * RZC_PER_SECOND);
//           } else {
//              await rolloverSession();
//           }
//         }
//     };
//     loadData();
//     const interval = setInterval(loadData, 30000); // Poll every 30s
//     return () => clearInterval(interval);
//   }, [userId, userUsername]);

//   // 4. Load transfer history when component mounts
//   useEffect(() => {
//     if (!userId) return;
//     loadTransferHistory();
//   }, [userId]);

//   // 5. Search users when query changes
//   useEffect(() => {
//     if (userSearchQuery.trim().length >= 2) {
//       const timeoutId = setTimeout(() => {
//         searchUsers(userSearchQuery);
//       }, 300);
//       return () => clearTimeout(timeoutId);
//     } else {
//       setSearchResults([]);
//     }
//   }, [userSearchQuery, userId]);

//   // --- ACTIONS ---

//   const handleCopyTonAddress = async () => {
//     if (!tonAddress) return;
//     try {
//       await navigator.clipboard.writeText(tonAddress);
//       showSnackbar?.({ message: 'Address Copied', description: 'TON address copied to clipboard' });
//     } catch (error) {
//       console.error('Failed to copy address:', error);
//       showSnackbar?.({ message: 'Copy Failed', description: 'Unable to copy address to clipboard' });
//     }
//   };

//   const handleSendAction = () => {
//     if (!airdropBalance || (airdropBalance.staked_balance || 0) <= 0) {
//       showSnackbar?.({ 
//         message: 'Staking Required', 
//         description: 'You must have staked balance to send RZC to other users' 
//       });
//       return;
//     }
    
//     if (!airdropBalance || (airdropBalance.available_balance || 0) <= 0) {
//       showSnackbar?.({ 
//         message: 'No Balance Available', 
//         description: 'You need available balance to send RZC' 
//       });
//       return;
//     }
    
//     setShowSendModal(true);
//   };

//   const handleReceiveAction = () => {
//     setShowReceiveModal(true);
//   };

//   const handleBuyAction = () => {
//     // Check if user has staked balance to enable buy feature
//     if (!airdropBalance || (airdropBalance.staked_balance || 0) <= 0) {
//       showSnackbar?.({ 
//         message: 'Staking Required', 
//         description: 'Please stake your airdrop balance to unlock the buy feature' 
//       });
//       return;
//     }
    
//     // Show the sale component
//     setShowSaleModal(true);
//   };

//   const handleStakeAction = () => {
//     if (!airdropBalance || (airdropBalance.available_balance || 0) <= 0) {
//       showSnackbar?.({ 
//         message: 'No Balance Available', 
//         description: 'You need airdrop balance to stake. Claim your earned RZC first.' 
//       });
//       return;
//     }
    
//     setShowStakeModal(true);
//   };

//   const handleAssetClick = (assetType: string) => {
//     if (!tonAddress && assetType !== 'mining') {
//       showSnackbar?.({ message: 'Wallet Required', description: 'Connect your TON wallet to interact with assets' });
//       return;
//     }
    
//     switch (assetType) {
//       case 'locked':
//         showSnackbar?.({ message: 'Locked RZC', description: `You have ${claimableRZC.toFixed(2)} RZC ready to claim` });
//         break;
//       case 'mining':
//         showSnackbar?.({ message: 'Mining Rewards', description: `Currently ${isMining ? 'accumulating' : 'paused'}: ${accumulatedRZC.toFixed(4)} RZC` });
//         break;
//       case 'equity':
//         showSnackbar?.({ message: 'Protocol Equity', description: `Lifetime earned: ${claimedRZC.toFixed(2)} RZC on-chain` });
//         break;
//     }
//   };

// //   const handleActivation = async () => {
// //     if (isMining) {
// //         showSnackbar?.({ message: 'Mining Active', description: 'Node is already running efficiently.' });
// //         return;
// //     }

// //     setIsActivating(true);
    
// //     // Simulate Blockchain Transaction Delay
// //     await new Promise(resolve => setTimeout(resolve, 2000));

// //     try {
// //         const result = await startMiningSession(userId!);
// //         if (result.success) {
// //             setIsMining(true);
// //             setAccumulatedRZC(0);
// //             setLastClaimDuringMining(null);
// //             await recordMiningActivity(userId!, 'mining_start', 0);
            
// //             const active = await getActiveMiningSession(userId!);
// //             if (active) setCurrentSession(active);

// //             showSnackbar?.({ message: 'Node Activated', description: 'Mining session started successfully on TON.' });
// //             setShowCelebration(true);
// //             setTimeout(() => setShowCelebration(false), 3000);
// //         } else {
// //             showSnackbar?.({ message: 'Activation Failed', description: result.error });
// //         }
// //     } catch (e) {
// //         console.error(e);
// //     } finally {
// //         setIsActivating(false);
// //     }
// //   };

//   const rolloverSession = async () => {
//      if(!currentSession) return;
//      const result = await manualCompleteMiningSession(currentSession.id);
//      if(result.success) {
//         setIsMining(false);
//         setAccumulatedRZC(0);
//         setCurrentSession(null);
//         const bal = await getUserRZCBalance(userId!);
//         setClaimableRZC(bal.claimableRZC);
        
//         // Auto restart
//         setTimeout(async () => {
//              const start = await startMiningSessionUnrestricted(userId!);
//              if(start.success) {
//                  const active = await getActiveMiningSession(userId!);
//                  if(active) {
//                      setCurrentSession(active);
//                      setIsMining(true);
//                  }
//              }
//         }, 500);
//      }
//   };

// //   const handleCopyReferral = async () => {
// //     const link = `https://t.me/rhizacore_bot?startapp=${referralCode || sponsorCode}`;
// //     await navigator.clipboard.writeText(link);
// //     showSnackbar?.({ message: 'Address Copied', description: 'Referral link copied to clipboard' });
// //   };

//   // --- EXPOSE REFRESH ---
//   useImperativeHandle(ref, () => ({
//     refreshBalance: async () => {
//         if(!userId) return;
//         const bal = await getUserRZCBalance(userId);
//         setClaimableRZC(bal.claimableRZC);
//         setClaimedRZC(bal.claimedRZC);
//         setTotalEarnedRZC(bal.totalEarned);
//         await loadAirdropBalance();
//     }
//   }));

//   // --- RENDER ---
//   return (
//     <div className="flex flex-col h-full w-full bg-black text-white overflow-y-auto custom-scrollbar pb-24 font-sans">
      
//       {/* Celebration Effect */}
//       {showCelebration && (
//         <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
//             <div className="animate-bounce text-6xl">🚀</div>
//         </div>
//       )}

//       {/* Native Header */}
//       <div className="flex justify-between items-center px-6 pt-6 pb-2">
//         <h1 className="text-xl font-bold tracking-tight">RhizaCore Wallet</h1>
//         <div className="flex items-center gap-3">
//           {/* TON Connection Status */}
//           {/* Mining Status */}
//           <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
//             <div className={`w-1 h-1 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></div>
//             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Pre-Mainnet</span>
//           </div>
//         </div>
//       </div>

//       {/* Main Balance Hero */}
//       <div className="flex flex-col items-center py-8 px-6">
//         <div className="flex items-baseline gap-2">
//             <span className="text-5xl font-bold font-mono tracking-tighter">
//                 {airdropBalance ? (airdropBalance.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0.0000'}
//             </span>
//             <span className="text-green-400 font-bold text-lg">RZC</span>
//         </div>
//         <div className="text-gray-500 text-sm font-mono mt-1">
//             ≈ ${((airdropBalance ? (airdropBalance.available_balance || 0) : 0) * 0.1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
//         </div>
        
//         {/* Show staked balance separately if user has staked */}
//         {airdropBalance && (airdropBalance.staked_balance || 0) > 0 && (
//           <div className="mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
//             <div className="text-blue-400 text-xs font-bold">
//               {(airdropBalance.staked_balance || 0).toFixed(4)} RZC Staked
//             </div>
//           </div>
//         )}
        
//         {/* TON Address Display */}
//         {tonAddress && (
//           <div className="mt-4 w-full max-w-xs">
//             <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
//               <div className="flex items-center gap-2 flex-1 min-w-0">
//                 <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
//                   <span className="text-blue-400 text-xs font-bold">T</span>
//                 </div>
//                 <span className="text-gray-300 font-mono text-xs truncate">
//                   {tonAddress.slice(0, 6)}...{tonAddress.slice(-6)}
//                 </span>
//               </div>
//               <button 
//                 onClick={handleCopyTonAddress}
//                 className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
//               >
//                 <Icons.Copy size={14} className="text-gray-400 hover:text-white" />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Action Bar */}
//       <div className="flex justify-center gap-6 sm:gap-8 mb-10 px-4">
//         <WalletAction 
//             icon={(props: any) => <Icons.Send {...props} />} 
//             label="Send" 
//             disabled={!airdropBalance || (airdropBalance.staked_balance || 0) <= 0 || (airdropBalance.available_balance || 0) <= 0} 
//             onClick={handleSendAction} 
//         />
//         <WalletAction 
//             icon={(props: any) => <Icons.Copy {...props} />} 
//             label="Receive" 
//             disabled={false}
//             colorClass="bg-blue-400" 
//             onClick={handleReceiveAction} 
//         />
//         <div className="relative">
//           <WalletAction 
//               icon={(props: any) => <Icons.Store {...props} />}
//               label="Buy" 
//               disabled={!airdropBalance || (airdropBalance.staked_balance || 0) <= 0} 
//               colorClass={airdropBalance && (airdropBalance.staked_balance || 0) > 0 ? "bg-yellow-400" : "bg-green-400"}
//               onClick={handleBuyAction} 
//           />
//           {/* Unlocked indicator */}
//           {airdropBalance && (airdropBalance.staked_balance || 0) > 0 && (
//             <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
//           )}
//         </div>
//         <WalletAction 
//             icon={(props: any) => <Icons.Boost {...props} />}
//             label="Stake" 
//             disabled={!airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
//             onClick={handleStakeAction} 
//         />
//       </div>

//       {/* Connect TON Wallet Prompt - Only show when wallet is NOT connected */}
//       {/* {!tonAddress && (
//         <div className="mx-6 mb-8">
//           <div className="bg-blue-500/5 border border-dashed border-blue-500/30 rounded-2xl p-4 flex items-center justify-between hover:border-blue-500/50 transition-colors">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
//                 <Icons.Wallet size={20} />
//               </div>
//               <div className="flex flex-col">
//                 <span className="text-white text-sm font-bold">Connect TON Wallet</span>
//                 <span className="text-gray-500 text-[10px]">To enable wallet features</span>
//               </div>
//             </div>
//             <div className="relative">
//               <TonConnectButton className="ton-connect-button-custom" />
//             </div>
//           </div>
//         </div>
//       )} */}

//       {/* Connected Wallet Status - Only show when wallet IS connected */}
//       {/* {tonAddress && (
//         <div className="mx-6 mb-8">
//           <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
//                 <Icons.Wallet size={20} />
//               </div>
//               <div className="flex flex-col">
//                 <span className="text-white text-sm font-bold">TON Wallet Connected</span>
//                 <span className="text-gray-500 text-[10px] font-mono">
//                   {tonAddress.slice(0, 8)}...{tonAddress.slice(-8)}
//                 </span>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                 <span className="text-green-400 text-xs font-bold">Active</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       )} */}

//       {/* Gated Activation Banner - Only show when wallet is connected */}
//       {tonAddress && (
//         <div className="mx-6 mb-8">
//             <div className="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
//                 <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                
//                 <div className="flex items-start gap-4 mb-6">
//                     <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
//                         <Icons.Lock size={24} className="animate-pulse" />
//                     </div>
//                     <div>
//                         <h3 className="text-white font-bold text-sm mb-1">Activate Multi-Chain Node</h3>
//                         <p className="text-gray-500 text-[11px] leading-relaxed">
//                             Establish a persistent link on <span className="text-blue-400 font-bold">TON Mainnet</span>. 
//                             This unlocks <span className="text-green-400">{(RZC_PER_DAY * miningRateMultiplier).toFixed(0)} RZC Daily Yield</span>.
//                         </p>
//                     </div>
//                 </div>

//                 <button 
//                     onClick={() => {}}
//                     disabled={true}
//                     className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase transition-all flex flex-col items-center justify-center bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5"
//                 >
//                     <div className="flex items-center gap-2 mb-1">
//                         <div className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin"></div>
//                         <span>Coming Soon</span>
//                     </div>
//                     <span className="text-[8px] opacity-70 normal-case font-mono mt-0.5 tracking-normal">Node Activation Coming Soon</span>
//                 </button>
//             </div>
//         </div>
//       )}

//       {/* Asset List */}
//       <div className="px-6">
//           <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Network Balances</h3>
          
//           <div className="space-y-4">
//               {/* Asset: Main Wallet */}
//               {/* <div 
//                 onClick={() => handleAssetClick('locked')}
//                 className="flex items-center justify-between p-2 hover:bg-white/5 rounNow ded-xl transition-colors cursor-pointer"
//               >
//                   <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/5">
//                           <Icons.Wallet size={24} />
//                       </div>
//                       <div>
//                           <h4 className="text-white text-sm font-bold">Unverifed Balance</h4>
//                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter font-mono">Status: Liquid Unclaimed</p>
//                       </div>
//                   </div>
//                   <div className="text-right">
//                       <div className="text-white font-bold text-sm font-mono">{claimableRZC.toFixed(2)}</div>
//                       <div className="text-[10px] text-gray-600">RZC</div>
//                   </div>
//               </div> */}

//               {/* Asset: Mining Rewards */}
//               {/* <div 
//                 onClick={() => handleAssetClick('mining')}
//                 className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
//               >
//                   <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/10">
//                           <Icons.Energy size={24} />
//                       </div>
//                       <div>
//                           <h4 className="text-white text-sm font-bold">Mining Rewards</h4>
//                           <p className="text-[10px] text-green-400/50 uppercase font-bold tracking-tighter font-mono">
//                              {isMining ? 'Accumulating...' : 'Paused'}
//                           </p>
//                       </div>
//                   </div>
//                   <div className="text-right">
//                       <div className="text-green-400 font-bold text-sm font-mono">{accumulatedRZC.toFixed(4)}</div>
//                       <div className="text-[10px] text-gray-600">Pending</div>
//                   </div>
//               </div> */}

//               {/* Asset: Airdrop Balance */}
//               <div 
//                 onClick={() => setShowAirdropModal(true)}
//                 className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
//               >
//                   <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/10">
//                           <Icons.Wallet size={24} />
//                       </div>
//                       <div>
//                           <h4 className="text-white text-sm font-bold">Airdrop Balance</h4>
//                           <p className="text-[10px] text-purple-400/50 uppercase font-bold tracking-tighter font-mono">
//                              {airdropBalance && (airdropBalance.staked_balance || 0) > 0 
//                                ? `Staked: ${(airdropBalance.staked_balance || 0).toFixed(4)} RZC`
//                                : 'Available for Staking & Withdrawal'
//                              }
//                           </p>
//                       </div>
//                   </div>
//                   <div className="text-right">
//                       <div className="text-purple-400 font-bold text-sm font-mono">
//                         {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
//                       </div>
//                       <div className="text-[10px] text-gray-600">Available</div>
//                   </div>
//               </div>

//               {/* Asset: Staked Balance (only show if user has staked) */}
//               {airdropBalance && (airdropBalance.staked_balance || 0) > 0 && (
//                 <div 
//                   onClick={() => setShowAirdropModal(true)}
//                   className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
//                 >
//                     <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
//                             <Icons.Energy size={24} />
//                         </div>
//                         <div>
//                             <h4 className="text-white text-sm font-bold">Staked Balance</h4>
//                             <p className="text-[10px] text-blue-400/50 uppercase font-bold tracking-tighter font-mono">
//                                Earning Staking Rewards
//                             </p>
//                         </div>
//                     </div>
//                     <div className="text-right">
//                         <div className="text-blue-400 font-bold text-sm font-mono">
//                           {(airdropBalance.staked_balance || 0).toFixed(4)}
//                         </div>
//                         <div className="text-[10px] text-gray-600">Staked</div>
//                     </div>
//                 </div>
//               )}

//               {/* Asset: Protocol Equity (On-Chain) */}
//               <div 
//                 onClick={() => handleAssetClick('equity')}
//                 className="flex items-center justify-between p-2 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
//               >
//                   <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
//                           <Icons.Rank size={24} />
//                       </div>
//                       <div>
//                           <h4 className="text-white text-sm font-bold">Protocol Equity</h4>
//                           <p className="text-[10px] text-blue-400/50 uppercase font-bold tracking-tighter font-mono">Lifetime Earned</p>
//                       </div>
//                   </div>
//                   <div className="text-right">
//                       <div className="text-white font-bold text-sm font-mono">{claimedRZC.toFixed(2)}</div>
//                       <div className="text-[10px] text-gray-600">On-Chain</div>
//                   </div>
//               </div>
//           </div>

//           {/* Mainnet Readiness Checklist */}
//           <div className="mt-8">
//             <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Mainnet Readiness</h3>
            
//             <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-4">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
//                   <Icons.Check size={12} className="text-white" />
//                 </div>
//                 <h4 className="text-sm font-bold text-white">Progress Checklist</h4>
//               </div>
              
//               <div className="space-y-3">
//                 {/* Checklist Items */}
//                 <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/10">
//                   <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
//                     currentTotalEarned > 0 ? 'bg-green-500' : 'bg-gray-600'
//                   }`}>
//                     {currentTotalEarned > 0 ? (
//                       <Icons.Check size={8} className="text-white" />
//                     ) : (
//                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
//                     )}
//                   </div>
//                   <div className="flex-1">
//                     <div className="text-white text-xs font-medium">Unverified Balance</div>
//                     <div className="text-gray-400 text-[10px]">
//                       {currentTotalEarned > 0 ? `${currentTotalEarned.toFixed(4)} RZC` : 'Start mining to earn RZC tokens'}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/10">
//                   <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
//                     airdropBalance && (airdropBalance.total_claimed_to_airdrop || 0) > 0 ? 'bg-green-500' : 'bg-gray-600'
//                   }`}>
//                     {airdropBalance && (airdropBalance.total_claimed_to_airdrop || 0) > 0 ? (
//                       <Icons.Check size={8} className="text-white" />
//                     ) : (
//                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
//                     )}
//                   </div>
//                   <div className="flex-1">
//                     <div className="text-white text-xs font-medium">Transferable Balance</div>
//                     <div className="text-gray-400 text-[10px]">
//                       {airdropBalance && (airdropBalance.total_claimed_to_airdrop || 0) > 0 
//                         ? `${(airdropBalance.total_claimed_to_airdrop || 0).toFixed(4)} RZC` 
//                         : 'Move your earned RZC to airdrop balance'
//                       }
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/10">
//                   <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
//                     referralCode ? 'bg-green-500' : 'bg-gray-600'
//                   }`}>
//                     {referralCode ? (
//                       <Icons.Check size={8} className="text-white" />
//                     ) : (
//                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
//                     )}
//                   </div>
//                   <div className="flex-1">
//                     <div className="text-white text-xs font-medium">Sponsor Code</div>
//                     <div className="text-gray-400 text-[10px]">
//                       {referralCode ? `${referralCode}` : 'Generate your unique referral code'}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/10">
//                   <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
//                     airdropBalance && (airdropBalance.staked_balance || 0) > 0 ? 'bg-green-500' : 'bg-gray-600'
//                   }`}>
//                     {airdropBalance && (airdropBalance.staked_balance || 0) > 0 ? (
//                       <Icons.Check size={8} className="text-white" />
//                     ) : (
//                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
//                     )}
//                   </div>
//                   <div className="flex-1">
//                     <div className="text-white text-xs font-medium">Staking Participation</div>
//                     <div className="text-gray-400 text-[10px]">
//                       {airdropBalance && (airdropBalance.staked_balance || 0) > 0 
//                         ? `${(airdropBalance.staked_balance || 0).toFixed(4)} RZC staked` 
//                         : 'Stake your airdrop balance to earn rewards'
//                       }
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/10">
//                   <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
//                     airdropBalance && (airdropBalance.staked_balance || 0) > 0 ? 'bg-green-500' : 'bg-gray-600'
//                   }`}>
//                     {airdropBalance && (airdropBalance.staked_balance || 0) > 0 ? (
//                       <Icons.Check size={8} className="text-white" />
//                     ) : (
//                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
//                     )}
//                   </div>
//                   <div className="flex-1">
//                     <div className="text-white text-xs font-medium">Buy Feature Access</div>
//                     <div className="text-gray-400 text-[10px]">
//                       {airdropBalance && (airdropBalance.staked_balance || 0) > 0 
//                         ? 'Buy feature unlocked - Purchase RZC tokens' 
//                         : 'Stake your balance to unlock buy feature'
//                       }
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Progress Bar */}
//               <div className="mt-4 pt-3 border-t border-white/10">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-gray-400 text-[10px]">Readiness Progress</span>
//                   <span className="text-white text-[10px] font-bold">
//                     {(() => {
//                       let completed = 0;
//                       if (currentTotalEarned > 0) completed++;
//                       if (airdropBalance && (airdropBalance.total_claimed_to_airdrop || 0) > 0) completed++;
//                       if (referralCode) completed++;
//                       if (airdropBalance && (airdropBalance.staked_balance || 0) > 0) completed++;
//                       if (airdropBalance && (airdropBalance.staked_balance || 0) > 0) completed++; // Buy feature unlocked
//                       return `${completed}/5`;
//                     })()}
//                   </span>
//                 </div>
//                 <div className="w-full bg-gray-700 rounded-full h-1.5">
//                   <div 
//                     className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
//                     style={{ 
//                       width: `${(() => {
//                         let completed = 0;
//                         if (currentTotalEarned > 0) completed++;
//                         if (airdropBalance && (airdropBalance.total_claimed_to_airdrop || 0) > 0) completed++;
//                         if (referralCode) completed++;
//                         if (airdropBalance && (airdropBalance.staked_balance || 0) > 0) completed++;
//                         if (airdropBalance && (airdropBalance.staked_balance || 0) > 0) completed++; // Buy feature unlocked
//                         return (completed / 5) * 100;
//                       })()}%` 
//                     }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           {(currentTotalEarned > 0 || (airdropBalance && (airdropBalance.available_balance || 0) > 0)) && (
//             <div className="mt-6 space-y-3">
//               {currentTotalEarned > 0 && (
//                 <button 
//                   onClick={() => setShowAirdropModal(true)}
//                   disabled={isProcessingAirdropClaim}
//                   className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 border border-purple-400/50 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] py-3 rounded-lg text-sm font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
//                 >
//                   {isProcessingAirdropClaim ? (
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                   ) : (
//                     <>
//                       <Icons.Wallet size={16} />
//                       CLAIM {currentTotalEarned.toFixed(4)} RZC TO AIRDROP
//                     </>
//                   )}
//                 </button>
//               )}
              
//               {airdropBalance && (airdropBalance.available_balance || 0) > 0 && (
//                 <>
//                   <button 
//                     onClick={() => setShowStakeModal(true)}
//                     className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border border-blue-400/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] py-3 rounded-lg text-sm font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//                   >
//                     <Icons.Energy size={16} />
//                     STAKE AIRDROP BALANCE (70%)
//                   </button>
                  
//                   <button 
//                     onClick={() => setShowWithdrawModal(true)}
//                     className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border border-green-400/50 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] py-3 rounded-lg text-sm font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//                   >
//                     <Icons.Send size={16} />
//                     WITHDRAW TO WALLET
//                   </button>
//                 </>
//               )}
//             </div>
//           )}
//       </div>

//       {/* Footer Info */}
//       <div className="mt-auto px-6 pt-10 pb-4 text-center">
//           <p className="text-[10px] text-gray-600 font-mono italic">
//             "Your decentralized asset hub, powered by RhizaCore v4.0 Network."
//           </p>
//           <p className="text-[8px] text-gray-700 mt-2">ID: {userId}</p>
//       </div>

//       {/* Claim to Airdrop Modal */}
//       {showAirdropModal && (
//         <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
//            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowAirdropModal(false)}></div>
           
//            <div className="bg-black border-2 border-purple-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.3)]">
//               {/* Header */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                   <Icons.Wallet size={32} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-white mb-2">
//                   {airdropBalance && (airdropBalance.available_balance || 0) > 0 ? 'Airdrop Balance Management' : 'Claim to Airdrop Balance'}
//                 </h3>
//                 <p className="text-gray-400 text-sm">
//                   {airdropBalance && (airdropBalance.available_balance || 0) > 0 
//                     ? 'Reclaim your RZC back to mining balance or manage your airdrop funds'
//                     : 'Move your total earned RZC to your airdrop balance for withdrawal'
//                   }
//                 </p>
//               </div>

//               {/* Balance Summary */}
//               <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-gray-400 text-sm">Total Earned RZC:</span>
//                   <span className="text-purple-400 font-bold">{currentTotalEarned.toFixed(6)} RZC</span>
//                 </div>
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-gray-400 text-sm">Available Balance:</span>
//                   <span className="text-green-400 font-bold">
//                     {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(6) : '0.000000'} RZC
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-400 text-sm">Staked Balance:</span>
//                   <span className="text-blue-400 font-bold">
//                     {airdropBalance ? (airdropBalance.staked_balance || 0).toFixed(6) : '0.000000'} RZC
//                   </span>
//                 </div>
//               </div>

//               {/* Info Box */}
//               <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-6">
//                 <p className="text-purple-300 text-xs leading-relaxed">
//                   {airdropBalance && (airdropBalance.available_balance || 0) > 0 ? (
//                     <>
//                       <strong>Reclaim:</strong> Move your airdrop balance back to mining balance to continue earning. 
//                       This will restore your mining progress and allow you to mine more RZC.
//                     </>
//                   ) : (
//                     <>
//                       <strong>Claim:</strong> This will move all your earned RZC to your airdrop balance. 
//                       From there, you can withdraw to any external wallet address.
//                     </>
//                   )}
//                 </p>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => setShowAirdropModal(false)}
//                   className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-bold transition-colors"
//                 >
//                   Cancel
//                 </button>
                
//                 {/* Show reclaim button if user has airdrop balance */}
//                 {airdropBalance && (airdropBalance.available_balance || 0) > 0 ? (
//                   <button 
//                     onClick={handleReclaimFromAirdrop}
//                     disabled={isProcessingAirdropReclaim}
//                     className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
//                   >
//                     {isProcessingAirdropReclaim ? (
//                       <div className="flex items-center justify-center gap-2">
//                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                         Reclaiming...
//                       </div>
//                     ) : (
//                       'Reclaim to Mining'
//                     )}
//                   </button>
//                 ) : (
//                   <button 
//                     onClick={handleClaimToAirdrop}
//                     disabled={isProcessingAirdropClaim || currentTotalEarned <= 0}
//                     className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
//                   >
//                     {isProcessingAirdropClaim ? (
//                       <div className="flex items-center justify-center gap-2">
//                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                         Processing...
//                       </div>
//                     ) : (
//                       'Claim to Airdrop'
//                     )}
//                   </button>
//                 )}
//               </div>
//            </div>
//         </div>
//       )}

//       {/* Withdraw from Airdrop Modal */}
//       {showWithdrawModal && (
//         <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
//            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowWithdrawModal(false)}></div>
           
//            <div className="bg-black border-2 border-green-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.3)]">
//               {/* Header */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                   <Icons.Send size={32} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-white mb-2">Withdraw to Wallet</h3>
//                 <p className="text-gray-400 text-sm">
//                   Withdraw RZC from your airdrop balance to an external wallet
//                 </p>
//               </div>

//               {/* Balance Display */}
//               <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10 text-center">
//                 <div className="text-gray-400 text-sm mb-1">Available Balance</div>
//                 <div className="text-green-400 font-bold text-xl">
//                   {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(6) : '0.000000'} RZC
//                 </div>
//               </div>

//               {/* Withdrawal Form */}
//               <div className="space-y-4 mb-6">
//                 <div>
//                   <label className="block text-white text-sm font-medium mb-2">
//                     Amount to Withdraw
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="number"
//                       value={withdrawAmount}
//                       onChange={(e) => setWithdrawAmount(e.target.value)}
//                       placeholder="0.000000"
//                       step="0.000001"
//                       min="0"
//                       max={airdropBalance?.available_balance || 0}
//                       className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none pr-16"
//                     />
//                     <button
//                       onClick={() => setWithdrawAmount((airdropBalance?.available_balance || 0).toString())}
//                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-xs font-bold hover:text-green-300"
//                     >
//                       MAX
//                     </button>
//                   </div>
//                 </div>
                
//                 <div>
//                   <label className="block text-white text-sm font-medium mb-2">
//                     Destination Address
//                   </label>
//                   <input
//                     type="text"
//                     value={withdrawAddress}
//                     onChange={(e) => setWithdrawAddress(e.target.value)}
//                     placeholder="0x..."
//                     className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-white text-sm font-medium mb-2">
//                     Network
//                   </label>
//                   <select
//                     value={withdrawNetwork}
//                     onChange={(e) => setWithdrawNetwork(e.target.value)}
//                     className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500/50 focus:outline-none"
//                   >
//                     <option value="ethereum">Ethereum</option>
//                     <option value="polygon">Polygon</option>
//                     <option value="bsc">BSC</option>
//                   </select>
//                 </div>
//               </div>

//               {/* Info Box */}
//               <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
//                 <p className="text-green-300 text-xs leading-relaxed">
//                   <strong>Note:</strong> Withdrawals are processed manually and may take 24-48 hours. 
//                   Gas fees will be deducted from the withdrawal amount.
//                 </p>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => {
//                     setShowWithdrawModal(false);
//                     setWithdrawAmount('');
//                     setWithdrawAddress('');
//                   }}
//                   className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-bold transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   onClick={handleWithdrawFromAirdrop}
//                   disabled={isProcessingWithdraw || !withdrawAmount || !withdrawAddress}
//                   className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
//                 >
//                   {isProcessingWithdraw ? (
//                     <div className="flex items-center justify-center gap-2">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       Processing...
//                     </div>
//                   ) : (
//                     'Create Withdrawal'
//                   )}
//                 </button>
//               </div>
//            </div>
//         </div>
//       )}

//       {/* Stake Airdrop Balance Modal */}
//       {showStakeModal && (
//         <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
//            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowStakeModal(false)}></div>
           
//            <div className="bg-black border-2 border-blue-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)]">
//               {/* Header */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                   <Icons.Energy size={32} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-white mb-2">Stake Airdrop Balance</h3>
//                 <p className="text-gray-400 text-sm">
//                   Stake 70% of your airdrop balance, keeping 30% available for withdrawal
//                 </p>
//               </div>

//               {/* Balance Display */}
//               <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
//                 <div className="flex justify-between items-center mb-3">
//                   <span className="text-gray-400 text-sm">Available Balance:</span>
//                   <span className="text-blue-400 font-bold text-lg">
//                     {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(6) : '0.000000'} RZC
//                   </span>
//                 </div>
                
//                 <div className="border-t border-white/10 pt-3 mt-3">
//                   <div className="flex justify-between items-center mb-2">
//                     <span className="text-gray-400 text-sm">Will be staked (70%):</span>
//                     <span className="text-green-400 font-bold">
//                       {airdropBalance ? ((airdropBalance.available_balance || 0) * 0.7).toFixed(6) : '0.000000'} RZC
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-gray-400 text-sm">Will remain available (30%):</span>
//                     <span className="text-yellow-400 font-bold">
//                       {airdropBalance ? ((airdropBalance.available_balance || 0) * 0.3).toFixed(6) : '0.000000'} RZC
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Info Box */}
//               <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
//                 <p className="text-blue-300 text-xs leading-relaxed">
//                   <strong>Staking Benefits:</strong> Staked RZC earns additional rewards and helps secure the network. 
//                   70% will be staked for rewards, while 30% remains liquid for immediate withdrawal needs.
//                 </p>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => setShowStakeModal(false)}
//                   className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-bold transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   onClick={handleStakeAirdropBalance}
//                   disabled={isProcessingStake || !airdropBalance || (airdropBalance.available_balance || 0) <= 0}
//                   className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
//                 >
//                   {isProcessingStake ? (
//                     <div className="flex items-center justify-center gap-2">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       Staking...
//                     </div>
//                   ) : (
//                     'Stake 70%'
//                   )}
//                 </button>
//               </div>
//            </div>
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

//       {/* Send RZC Modal */}
//       {showSendModal && (
//         <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
//            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowSendModal(false)}></div>
           
//            <div className="bg-black border-2 border-green-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.3)]">
//               {/* Header */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                   <Icons.Send size={32} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-white mb-2">Send RZC</h3>
//                 <p className="text-gray-400 text-sm">
//                   Send RZC using username or Telegram ID (requires staked balance)
//                 </p>
//               </div>

//               {/* Balance Display */}
//               <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10 text-center">
//                 <div className="text-gray-400 text-sm mb-1">Available Balance</div>
//                 <div className="text-green-400 font-bold text-xl">
//                   {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(6) : '0.000000'} RZC
//                 </div>
//               </div>

//               {/* Send Form */}
//               <div className="space-y-4 mb-6">
//                 {/* Recipient Search */}
//                 <div>
//                   <label className="block text-white text-sm font-medium mb-2">
//                     Send to User
//                   </label>
//                   {selectedRecipient ? (
//                     <div className="bg-white/5 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
//                           <span className="text-green-400 text-xs font-bold">
//                             {(selectedRecipient.username || selectedRecipient.display_name || 'U')[0].toUpperCase()}
//                           </span>
//                         </div>
//                         <div>
//                           <div className="text-white text-sm font-medium">
//                             @{selectedRecipient.username || selectedRecipient.display_name || 'Unknown'}
//                           </div>
//                           <div className="text-gray-400 text-xs">
//                             {selectedRecipient.telegram_id ? `Telegram ID: ${selectedRecipient.telegram_id}` : `User ID: ${selectedRecipient.id}`}
//                           </div>
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => {
//                           setSelectedRecipient(null);
//                           setUserSearchQuery('');
//                         }}
//                         className="text-gray-400 hover:text-white"
//                       >
//                         <Icons.Copy size={16} />
//                       </button>
//                     </div>
//                   ) : (
//                     <div>
//                       <input
//                         type="text"
//                         value={userSearchQuery}
//                         onChange={(e) => setUserSearchQuery(e.target.value)}
//                         placeholder="Search username or Telegram ID..."
//                         className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
//                       />
//                       {searchResults.length > 0 && (
//                         <div className="mt-2 bg-white/5 border border-white/10 rounded-lg max-h-40 overflow-y-auto">
//                           {searchResults.map((user) => (
//                             <button
//                               key={user.id}
//                               onClick={() => {
//                                 setSelectedRecipient(user);
//                                 setUserSearchQuery('');
//                                 setSearchResults([]);
//                               }}
//                               className="w-full p-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
//                             >
//                               <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
//                                 <span className="text-green-400 text-xs font-bold">
//                                   {(user.username || user.display_name || 'U')[0].toUpperCase()}
//                                 </span>
//                               </div>
//                               <div>
//                                 <div className="text-white text-sm font-medium">
//                                   @{user.username || user.display_name || 'Unknown'}
//                                 </div>
//                                 <div className="text-gray-400 text-xs">
//                                   {user.telegram_id ? `Telegram ID: ${user.telegram_id}` : `User ID: ${user.id}`}
//                                 </div>
//                               </div>
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
                
//                 {/* Amount */}
//                 <div>
//                   <label className="block text-white text-sm font-medium mb-2">
//                     Amount to Send
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="number"
//                       value={sendAmount}
//                       onChange={(e) => setSendAmount(e.target.value)}
//                       placeholder="0.000000"
//                       step="0.000001"
//                       min="0"
//                       max={airdropBalance?.available_balance || 0}
//                       className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none pr-16"
//                     />
//                     <button
//                       onClick={() => setSendAmount((airdropBalance?.available_balance || 0).toString())}
//                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-xs font-bold hover:text-green-300"
//                     >
//                       MAX
//                     </button>
//                   </div>
//                 </div>

//                 {/* Message */}
//                 <div>
//                   <label className="block text-white text-sm font-medium mb-2">
//                     Message (Optional)
//                   </label>
//                   <input
//                     type="text"
//                     value={sendMessage}
//                     onChange={(e) => setSendMessage(e.target.value)}
//                     placeholder="Add a message..."
//                     maxLength={100}
//                     className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Info Box */}
//               <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
//                 <p className="text-green-300 text-xs leading-relaxed">
//                   <strong>Search Tips:</strong> You can search by username (e.g., "john") or Telegram ID (e.g., "123456789"). 
//                   You must have staked balance to send RZC. The recipient will receive RZC in their airdrop balance.
//                 </p>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => {
//                     setShowSendModal(false);
//                     setSendAmount('');
//                     setSendMessage('');
//                     setSelectedRecipient(null);
//                     setUserSearchQuery('');
//                     setSearchResults([]);
//                   }}
//                   className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-bold transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   onClick={handleSendRZC}
//                   disabled={isProcessingSend || !selectedRecipient || !sendAmount}
//                   className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
//                 >
//                   {isProcessingSend ? (
//                     <div className="flex items-center justify-center gap-2">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       Sending...
//                     </div>
//                   ) : (
//                     'Send RZC'
//                   )}
//                 </button>
//               </div>
//            </div>
//         </div>
//       )}

//       {/* Receive RZC Modal */}
//       {showReceiveModal && (
//         <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
//            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowReceiveModal(false)}></div>
           
//            <div className="bg-black border-2 border-blue-500/50 rounded-2xl p-6 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)]">
//               {/* Header */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                   <Icons.Copy size={32} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-white mb-2">Receive RZC</h3>
//                 <p className="text-gray-400 text-sm">
//                   Your transfer history and user information
//                 </p>
//               </div>

//               {/* User Info */}
//               <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
//                 <div className="text-center mb-4">
//                   <div className="text-gray-400 text-sm mb-1">Your Username</div>
//                   <div className="text-blue-400 font-bold text-lg">@{userUsername || 'Not set'}</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-gray-400 text-sm mb-1">Your User ID</div>
//                   <div className="text-blue-400 font-bold text-xl font-mono">{userId}</div>
//                 </div>
//                 <div className="text-gray-400 text-xs mt-3 text-center">
//                   Share your username or ID with others to receive RZC
//                 </div>
//               </div>

//               {/* Transfer History */}
//               <div className="mb-6">
//                 <h4 className="text-white text-sm font-bold mb-3">Recent Transfers</h4>
//                 <div className="bg-white/5 rounded-xl border border-white/10 max-h-60 overflow-y-auto">
//                   {transferHistory.length > 0 ? (
//                     <div className="divide-y divide-white/10">
//                       {transferHistory.map((transfer) => (
//                         <div key={transfer.id} className="p-3">
//                           <div className="flex items-center justify-between mb-1">
//                             <div className="flex items-center gap-2">
//                               {transfer.from_user_id === userId ? (
//                                 <Icons.Send size={14} className="text-red-400" />
//                               ) : (
//                                 <Icons.Copy size={14} className="text-green-400" />
//                               )}
//                               <span className="text-white text-sm font-medium">
//                                 {transfer.from_user_id === userId ? 'Sent to' : 'Received from'}
//                               </span>
//                               <span className="text-gray-400 text-sm">
//                                 {transfer.from_user_id === userId 
//                                   ? `@${transfer.to_user?.username || transfer.to_user?.display_name || `User ${transfer.to_user_id}`}`
//                                   : `@${transfer.from_user?.username || transfer.from_user?.display_name || `User ${transfer.from_user_id}`}`
//                                 }
//                               </span>
//                             </div>
//                             <span className={`text-sm font-bold ${
//                               transfer.from_user_id === userId ? 'text-red-400' : 'text-green-400'
//                             }`}>
//                               {transfer.from_user_id === userId ? '-' : '+'}{transfer.amount.toFixed(6)} RZC
//                             </span>
//                           </div>
//                           {transfer.message && (
//                             <div className="text-gray-400 text-xs italic ml-6">
//                               "{transfer.message}"
//                             </div>
//                           )}
//                           <div className="text-gray-500 text-xs ml-6">
//                             {new Date(transfer.created_at).toLocaleDateString()} {new Date(transfer.created_at).toLocaleTimeString()}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="p-6 text-center text-gray-400 text-sm">
//                       No transfer history yet
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Action Button */}
//               <button 
//                 onClick={() => setShowReceiveModal(false)}
//                 className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-lg text-sm font-bold transition-all"
//               >
//                 Close
//               </button>
//            </div>
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
//         `
//       }} />
//     </div>
//   );
// });

// export default NativeWalletUI;