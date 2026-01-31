// import { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo, memo } from 'react';
// import { TonConnectButton } from '@tonconnect/ui-react';
// import { Bell, X, Download } from 'lucide-react';
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
//   MiningSession
// } from '../lib/supabaseClient';
// import { Icons } from './Icon'; // Assuming your Icon export handles the names, otherwise see inline SVGs below

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
//   isWalletActivated?: boolean;
//   onActivate?: (unlockedBonus: number, purchaseAmount: number) => void;
//   onUpdateBalance?: (amount: number) => void;
// }

// export type ArcadeMiningUIHandle = {
//   refreshBalance: () => Promise<void> | void;
// };

// // --- HELPER COMPONENTS FOR THE NEW UI ---

// // Memoized Notification Component
// const NotificationToast = memo(({ notification }: { notification: any }) => (
//   <div 
//     className={`p-3 rounded-xl border backdrop-blur-sm animate-in slide-in-from-right-4 duration-300 ${
//       notification.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
//       notification.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
//       'bg-blue-500/10 border-blue-500/30 text-blue-400'
//     }`}
//   >
//     <div className="flex items-center gap-2">
//       <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
//       <span className="text-xs font-medium">{notification.message}</span>
//     </div>
//   </div>
// ));

// // Memoized Price Chart Component
// const PriceChart = memo(({ priceChart }: { priceChart: Array<{timestamp: number, price: number}> }) => (
//   <div className="mt-4 w-full max-w-xs">
//     <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//       <div className="flex justify-between items-center mb-2">
//         <span className="text-xs font-bold text-gray-400">24H PRICE CHART</span>
//         <span className="text-xs text-green-400">+2.4%</span>
//       </div>
//       <div className="h-16 flex items-end gap-1">
//         {priceChart.map((point, index) => (
//           <div 
//             key={index}
//             className="flex-1 bg-green-400/30 rounded-t"
//             style={{ 
//               height: `${((point.price - 0.08) / 0.04) * 100}%`,
//               minHeight: '2px'
//             }}
//           />
//         ))}
//       </div>
//       <div className="flex justify-between text-[8px] text-gray-600 mt-1">
//         <span>24h ago</span>
//         <span>Now</span>
//       </div>
//     </div>
//   </div>
// ));

// // Memoized Asset Item Component
// const AssetItem = memo(({ 
//   icon, 
//   title, 
//   subtitle, 
//   amount, 
//   unit, 
//   onClick, 
//   showClaimButton, 
//   onClaimClick,
//   iconBg,
//   iconColor 
// }: any) => (
//   <div 
//     onClick={onClick}
//     className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
//   >
//     <div className="flex items-center gap-4">
//       <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} border ${iconBg.replace('/5', '/10')}`}>
//         {icon}
//       </div>
//       <div>
//         <h4 className="text-white text-sm font-bold">{title}</h4>
//         <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter font-mono">{subtitle}</p>
//       </div>
//     </div>
//     <div className="text-right flex items-center gap-2">
//       <div>
//         <div className={`font-bold text-sm font-mono ${iconColor === 'text-green-400' ? 'text-green-400' : 'text-white'}`}>
//           {amount}
//         </div>
//         <div className="text-[10px] text-gray-600">{unit}</div>
//       </div>
//       {showClaimButton && (
//         <button 
//           onClick={onClaimClick}
//           className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-[8px] font-bold uppercase tracking-wider hover:bg-green-500/30 transition-colors"
//         >
//           Claim
//         </button>
//       )}
//     </div>
//   </div>
// ));

// const NativeWalletUI = forwardRef<ArcadeMiningUIHandle, ArcadeMiningUIProps>(function WalletUI(props, ref) {
//   // const { t } = useI18n();
//   // const { updateClaimedRZC, updateMiningBalance, setIsMining: setContextIsMining } = useGameData();
//   const {
//     userId,
//     userUsername,
//     tonAddress,
//     showSnackbar,
//     // referralCode,
//   } = props;

//   // --- LOGIC & STATE (Preserved from original) ---
//   const [, setSponsorCode] = useState<string | null>(null);
  
//   // Mining & Balance State
//   const [isMining, setIsMining] = useState(false);
//   const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
//   const [accumulatedRZC, setAccumulatedRZC] = useState(0);
//   const [claimableRZC, setClaimableRZC] = useState(0);
//   const [claimedRZC, setClaimedRZC] = useState(0);
//   const [lastClaimDuringMining] = useState<Date | null>(null);
//   const [displayBalance, setDisplayBalance] = useState(0);
  
//   // UI Specific State
//   const [, setCanStartMining] = useState(false);
//   const [miningRateMultiplier] = useState(1.0);
//   const [showCelebration] = useState(false);
  
//   // New Feature States
//   const [showTransactionHistory, setShowTransactionHistory] = useState(false);
//   const [showQRCode, setShowQRCode] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'warning' | 'info', message: string, timestamp: Date}>>([]);
//   const [priceChart, setPriceChart] = useState<Array<{timestamp: number, price: number}>>([]);
//   const [showPriceChart, setShowPriceChart] = useState(false);
  
//   // Claim Wizard States - Enhanced
//   const [showClaimWizard, setShowClaimWizard] = useState(false);
//   const [claimStep, setClaimStep] = useState<'audit' | 'matrix' | 'sign' | 'complete'>('audit');
//   const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
//   const [claimAmount, setClaimAmount] = useState(0);
//   const [txLogs, setTxLogs] = useState<string[]>([]);
//   const [currentLogIndex, setCurrentLogIndex] = useState(-1);
  
//   // Constants - Memoized for performance
//   const constants = useMemo(() => ({
//     RZC_PER_DAY: 50,
//     RZC_PER_SECOND: (50 * miningRateMultiplier) / (24 * 60 * 60),
//     POLL_INTERVAL: 30000,
//     NOTIFICATION_TIMEOUT: 5000,
//     CLAIM_PROCESSING_TIME: 3000
//   }), [miningRateMultiplier]);

//   // Derived Values - Memoized to prevent unnecessary recalculations
//   const derivedValues = useMemo(() => {
//     const actualBalance = claimableRZC + (isMining ? accumulatedRZC : 0) + claimedRZC;
//     const totalUsd = actualBalance * 0.1;
//     const liquidClaimable = claimableRZC * 0.3;
//     const lockedAmount = claimableRZC * 0.7;
//     const canClaim = claimableRZC > 0;
    
//     return {
//       actualBalance,
//       totalUsd,
//       liquidClaimable,
//       lockedAmount,
//       canClaim
//     };
//   }, [claimableRZC, isMining, accumulatedRZC, claimedRZC]);

//   // --- EFFECTS (Data Fetching & Timers) ---

//   // Debug log for tonAddress - Memoized
//   const logTonAddress = useCallback(() => {
//     console.log('NativeWalletUI - tonAddress changed:', tonAddress);
//   }, [tonAddress]);

//   useEffect(() => {
//     logTonAddress();
//   }, [logTonAddress]);

//   // 1. Smooth Balance Animation - Optimized with RAF
//   useEffect(() => {
//     let animationId: number;
//     let isAnimating = true;
    
//     const animate = () => {
//       if (!isAnimating) return;
      
//       setDisplayBalance(prev => {
//         const diff = derivedValues.actualBalance - prev;
//         if (Math.abs(diff) < 0.00001) return derivedValues.actualBalance;
//         return prev + diff * 0.1;
//       });
      
//       animationId = requestAnimationFrame(animate);
//     };
    
//     animate();
    
//     return () => {
//       isAnimating = false;
//       cancelAnimationFrame(animationId);
//     };
//   }, [derivedValues.actualBalance]);

//   // 2. Mining Loop (Accumulation) - Optimized interval
//   useEffect(() => {
//     if (!isMining || !currentSession) return;
    
//     let intervalId: NodeJS.Timeout;
    
//     const updateAccumulation = async () => {
//       const now = new Date();
//       const endTime = new Date(currentSession.end_time);
      
//       if (now >= endTime) {
//         await rolloverSession();
//       } else {
//         const startTime = new Date(currentSession.start_time);
//         const baseTime = lastClaimDuringMining || startTime;
//         const timeSinceBase = Math.max(0, (now.getTime() - baseTime.getTime()) / 1000);
//         const earned = timeSinceBase * constants.RZC_PER_SECOND;
//         setAccumulatedRZC(earned);
//       }
//     };
    
//     intervalId = setInterval(updateAccumulation, 1000);
    
//     return () => clearInterval(intervalId);
//   }, [isMining, currentSession, lastClaimDuringMining, constants.RZC_PER_SECOND]);

//   // 3. Initial Data Load - Optimized with useCallback
//   const loadData = useCallback(async () => {
//     if (!userId) return;
    
//     try {
//       await initializeFreeMiningPeriod(userId);
//       const code = await ensureUserHasSponsorCode(userId, userUsername);
//       setSponsorCode(code);

//       const [rzcBalance, miningCheck, activeSession] = await Promise.all([
//         getUserRZCBalance(userId),
//         canUserStartMining(userId),
//         getActiveMiningSession(userId)
//       ]);

//       setClaimableRZC(rzcBalance.claimableRZC);
//       setClaimedRZC(rzcBalance.claimedRZC);
//       setCanStartMining(miningCheck.canMine);

//       if (activeSession) {
//         const now = new Date();
//         if (now < new Date(activeSession.end_time)) {
//            setCurrentSession(activeSession);
//            setIsMining(true);
//            const startTime = new Date(activeSession.start_time);
//            const lastClaim = rzcBalance.lastClaimTime ? new Date(rzcBalance.lastClaimTime) : new Date(0);
//            const calcStart = lastClaim > startTime ? lastClaim : startTime;
//            const elapsed = (now.getTime() - calcStart.getTime()) / 1000;
//            setAccumulatedRZC(elapsed * constants.RZC_PER_SECOND);
//         } else {
//            await rolloverSession();
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load data:', error);
//     }
//   }, [userId, userUsername, constants.RZC_PER_SECOND]);

//   useEffect(() => {
//     loadData();
//     generatePriceData();
    
//     const interval = setInterval(loadData, constants.POLL_INTERVAL);
//     return () => clearInterval(interval);
//   }, [loadData, constants.POLL_INTERVAL]);

//   // --- ACTIONS (Optimized with useCallback) ---

//   // New Feature: Add Notification - Memoized
//   const addNotification = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
//     const notification = {
//       id: Date.now().toString(),
//       type,
//       message,
//       timestamp: new Date()
//     };
//     setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
//     setTimeout(() => {
//       setNotifications(prev => prev.filter(n => n.id !== notification.id));
//     }, constants.NOTIFICATION_TIMEOUT);
//   }, [constants.NOTIFICATION_TIMEOUT]);

//   // New Feature: Generate QR Code for Address - Memoized
//   const generateQRCode = useCallback(() => {
//     if (!tonAddress) {
//       showSnackbar?.({ message: 'No Address', description: 'Connect wallet first to generate QR code' });
//       return;
//     }
//     setShowQRCode(true);
//     addNotification('info', 'QR Code generated for your TON address');
//   }, [tonAddress, showSnackbar, addNotification]);

//   // New Feature: Price Chart Data (Mock) - Memoized
//   const generatePriceData = useCallback(() => {
//     const data = [];
//     const now = Date.now();
//     for (let i = 23; i >= 0; i--) {
//       data.push({
//         timestamp: now - (i * 60 * 60 * 1000),
//         price: 0.08 + Math.random() * 0.04
//       });
//     }
//     setPriceChart(data);
//   }, []);

//   // New Feature: Export Transaction History - Memoized
//   const exportTransactionHistory = useCallback(() => {
//     const csvContent = "data:text/csv;charset=utf-8," + 
//       "Type,Amount,Status,Date\n" +
//       (props.activities || []).map(activity => 
//         `${activity.type},${activity.amount},${activity.status},${activity.created_at}`
//       ).join("\n");
    
//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", "rhizacore_transactions.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     addNotification('success', 'Transaction history exported successfully');
//   }, [props.activities, addNotification]);

//   // New Feature: Claim Wizard Functions - Enhanced
//   const startClaimWizard = useCallback(() => {
//     if (!derivedValues.canClaim) {
//       showSnackbar?.({ message: 'No Claimable Balance', description: 'You need claimable RZC to use the claim wizard' });
//       return;
//     }
//     setClaimAmount(derivedValues.liquidClaimable);
//     setClaimStep('audit');
//     setStep('input');
//     setShowClaimWizard(true);
//     setCurrentLogIndex(-1);
//     addNotification('info', 'Claim wizard started');
//   }, [derivedValues.canClaim, derivedValues.liquidClaimable, showSnackbar, addNotification]);

//   const resetClaimWizard = useCallback(() => {
//     setShowClaimWizard(false);
//     setClaimStep('audit');
//     setStep('input');
//     setClaimAmount(0);
//     setCurrentLogIndex(-1);
//     setTxLogs([]);
//   }, []);

//   const handleAirdropNext = useCallback(async () => {
//     if (claimStep === 'audit') {
//       setStep('processing');
//       const logs = ["MINING_VALIDATION_PASSED", "BOT_FILTER_NEGATIVE", "NODE_UPTIME_VERIFIED", "ADDR_UQAs...R7_LINKED"];
//       setTxLogs(logs);
      
//       for (let i = 0; i < logs.length; i++) {
//         await new Promise(r => setTimeout(r, 700));
//         setCurrentLogIndex(i);
//       }
      
//       setStep('input');
//       setClaimStep('matrix');
//     } else if (claimStep === 'matrix') {
//       setClaimStep('sign');
//     } else if (claimStep === 'sign') {
//       setStep('processing');
//       const logs = ["GEN_NEURAL_SIG", "VERIFYING_H_HASH", "DISPATCHING_ASSETS", "VAULT_LOCK_ENGAGED"];
//       setTxLogs(logs);
      
//       for (let i = 0; i < logs.length; i++) {
//         await new Promise(r => setTimeout(r, 600));
//         setCurrentLogIndex(i);
//       }
      
//       // Update balances
//       const newClaimedAmount = claimedRZC + claimAmount;
//       const newClaimableAmount = claimableRZC - (claimAmount / 0.3);
      
//       setClaimedRZC(newClaimedAmount);
//       setClaimableRZC(Math.max(0, newClaimableAmount));
      
//       props.onUpdateBalance?.(claimAmount);
//       addNotification('success', `Successfully claimed ${claimAmount.toFixed(2)} RZC`);
      
//       setStep('input');
//       setClaimStep('complete');
//     }
//   }, [claimStep, claimAmount, claimedRZC, claimableRZC, props, addNotification]);

//   const handleCopyTonAddress = useCallback(async () => {
//     if (!tonAddress) return;
//     try {
//       await navigator.clipboard.writeText(tonAddress);
//       showSnackbar?.({ message: 'Address Copied', description: 'TON address copied to clipboard' });
//     } catch (error) {
//       console.error('Failed to copy address:', error);
//       showSnackbar?.({ message: 'Copy Failed', description: 'Unable to copy address to clipboard' });
//     }
//   }, [tonAddress, showSnackbar]);

//   const handleAssetClick = useCallback((assetType: string) => {
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
//   }, [tonAddress, showSnackbar, claimableRZC, isMining, accumulatedRZC, claimedRZC]);

//   const rolloverSession = useCallback(async () => {
//      if(!currentSession) return;
//      const result = await manualCompleteMiningSession(currentSession.id);
//      if(result.success) {
//         setIsMining(false);
//         setAccumulatedRZC(0);
//         setCurrentSession(null);
//         const bal = await getUserRZCBalance(userId!);
//         setClaimableRZC(bal.claimableRZC);
        
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
//   }, [currentSession, userId]);

//   // --- EXPOSE REFRESH ---
//   useImperativeHandle(ref, () => ({
//     refreshBalance: async () => {
//         if(!userId) return;
//         const bal = await getUserRZCBalance(userId);
//         setClaimableRZC(bal.claimableRZC);
//         setClaimedRZC(bal.claimedRZC);
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
//         <h1 className="text-xl font-bold tracking-tight">Core Wallet</h1>
//         <div className="flex items-center gap-3">
//           {/* New Feature: Settings Button */}
//           <button 
//             onClick={() => setShowSettings(true)}
//             className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//           >
//             <Icons.Settings size={18} className="text-gray-400 hover:text-white" />
//           </button>
          
//           {/* New Feature: Notifications Bell */}
//           <div className="relative">
//             <button 
//               onClick={() => setNotifications([])}
//               className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
//             >
//               <Bell size={18} className="text-gray-400 hover:text-white" />
//               {notifications.length > 0 && (
//                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
//                   <span className="text-white text-[8px] font-bold">{notifications.length}</span>
//                 </div>
//               )}
//             </button>
//           </div>
          
//           {/* TON Connection Status */}
//           {/* Mining Status */}
//           <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
//             <div className={`w-1 h-1 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></div>
//             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Genesis</span>
//           </div>
//         </div>
//       </div>

//       {/* New Feature: Notification Toast */}
//       {notifications.length > 0 && (
//         <div className="fixed top-20 right-4 z-50 space-y-2">
//           {notifications.slice(0, 3).map((notification) => (
//             <NotificationToast key={notification.id} notification={notification} />
//           ))}
//         </div>
//       )}

//   {tonAddress && (
//           <div className="hidden flex justify-center w-full mt-4">
//             <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between max-w-xs w-full">
//               <div className="flex items-center gap-2 flex-1 min-w-0">
//                 <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
//                   <span className="text-blue-400 text-xs font-bold">T</span>
//                 </div>
//                 <span className="text-gray-300 font-mono text-xs truncate">
//                   {tonAddress.slice(0, 6)}...{tonAddress.slice(-6)}
//                 </span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <button 
//                   onClick={handleCopyTonAddress}
//                   className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
//                 >
//                   <Icons.Copy size={14} className="text-gray-400 hover:text-white" />
//                 </button>
//                 {/* New Feature: QR Code Button */}
//                 <button 
//                   onClick={generateQRCode}
//                   className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
//                 >
//                   <Icons.QrCode size={14} className="text-gray-400 hover:text-white" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//       {/* Main Balance Hero */}
//       <div className="hidden flex flex-col items-center py-8 px-6">
//         <div className="flex items-baseline gap-2">
//             <span className="text-5xl font-bold font-mono tracking-tighter">
//                 {displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </span>
//             <span className="text-green-400 font-bold text-lg">RZC</span>
//         </div>
//         <div className="text-gray-500 text-sm font-mono mt-1 flex items-center gap-2">
//             ≈ ${derivedValues.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
//             {/* New Feature: Price Chart Toggle */}
//             <button 
//               onClick={() => setShowPriceChart(!showPriceChart)}
//               className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
//             >
//               <Icons.Boost size={14} className="text-gray-500 hover:text-green-400" />
//             </button>
//         </div>
        
//         {/* New Feature: Mini Price Chart */}
//         {showPriceChart && priceChart.length > 0 && (
//           <PriceChart priceChart={priceChart} />
//         )}
        
//         {/* TON Address Display */}
      
//       </div>

//       {/* Action Bar */}
//       {/* <div className="flex justify-center gap-6 sm:gap-8 mb-10 px-4">
//         <WalletAction 
//             icon={(props: any) => <Icons.Send {...props} />} 
//             label="Send" 
//             disabled={true} 
//             onClick={handleSendAction} 
//         />
//         <WalletAction 
//             icon={(props: any) => <Icons.Copy {...props} />} 
//             label="Receive" 
//             disabled={true}
//             colorClass="bg-blue-400" 
//             onClick={handleCopyTonAddress} 
//         />
//         <WalletAction 
//             icon={(props: any) => <Icons.Store {...props} />}
//             label="Buy" 
//             disabled={false} 
//             onClick={handleBuyAction} 
//         />
//         <WalletAction 
//             icon={(props: any) => <Icons.Boost {...props} />}
//             label="Swap" 
//             disabled={false} 
//             onClick={handleSwapAction} 
//         />
//       </div> */}

//       {/* Connect TON Wallet Prompt - Only show when wallet is NOT connected */}
//       {!tonAddress && (
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
//       )}

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
//         <></>
//        // <div className="mx-6 mb-8">
//         //     <div className="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
//         //         <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                
//         //         <div className="flex items-start gap-4 mb-6">
//         //             <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
//         //                 <Icons.Lock size={24} className="animate-pulse" />
//         //             </div>
//         //             <div>
//         //                 <h3 className="text-white font-bold text-sm mb-1">Activate Multi-Chain Node</h3>
//         //                 <p className="text-gray-500 text-[11px] leading-relaxed">
//         //                     Establish a persistent link on <span className="text-blue-400 font-bold">TON Mainnet</span>. 
//         //                     This unlocks <span className="text-green-400">{(RZC_PER_DAY * miningRateMultiplier).toFixed(0)} RZC Daily Yield</span>.
//         //                 </p>
//         //             </div>
//         //         </div>

//         //         <button 
//         //             onClick={() => {}}
//         //             disabled={true}
//         //             className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase transition-all flex flex-col items-center justify-center bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5"
//         //         >
//         //             <div className="flex items-center gap-2 mb-1">
//         //                 <div className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin"></div>
//         //                 <span>Coming Soon</span>
//         //             </div>
//         //             <span className="text-[8px] opacity-70 normal-case font-mono mt-0.5 tracking-normal">Node Activation Coming Soon</span>
//         //         </button>
//         //     </div>
//         // </div>>
//       )}

//       {/* New Feature: Claim Wizard Banner - Show when user has claimable RZC AND wallet connected */}
//       {derivedValues.canClaim && tonAddress && (
//         <div className="mx-6 mb-8 animate-in slide-in-from-top-4 duration-700">
//           <div className="bg-gradient-to-br from-green-900/40 to-black border-2 border-green-400/30 rounded-[2.5rem] p-6 relative overflow-hidden shadow-[0_15px_35px_rgba(34,197,94,0.2)]">
//             <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
//               <Icons.Wallet size={150} />
//             </div>
            
//             <div className="flex items-center gap-2 mb-4">
//               <span className="px-2 py-0.5 bg-green-500 text-white text-[8px] font-bold uppercase rounded tracking-widest">
//                 Ready to Claim
//               </span>
//             </div>
            
//             <h3 className="text-white text-xl font-bold mb-2">RhizaCore Genesis Claim</h3>
//             <p className="text-gray-400 text-xs mb-6 leading-relaxed">
//               Mining phase completed. You are eligible to claim <span className="text-white font-bold">30%</span> of your 
//               total rewards immediately. 70% will be secured for network stability.
//             </p>
            
//             <div className="grid grid-cols-2 gap-3 mb-6">
//               <div className="bg-green-500/10 border border-green-400/20 rounded-2xl p-3">
//                 <span className="text-[9px] text-green-400 font-bold uppercase block mb-1">Claimable Now</span>
//                 <span className="text-sm font-mono font-bold text-white">{derivedValues.liquidClaimable.toFixed(2)} RZC</span>
//               </div>
//               <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
//                 <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Locked Vault</span>
//                 <span className="text-sm font-mono font-bold text-gray-400">{derivedValues.lockedAmount.toFixed(2)} RZC</span>
//               </div>
//             </div>
            
//             <button 
//               onClick={startClaimWizard}
//               className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
//             >
//               <Icons.Rank size={16} />
//               Enter Claim Wizard
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Asset List */}
//       <div className="px-6">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Network Balances</h3>
//             {/* New Feature: Transaction History Button */}
//             <button 
//               onClick={() => setShowTransactionHistory(true)}
//               className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
//             >
//               <Icons.History size={12} className="text-gray-400" />
//               <span className="text-[9px] text-gray-400 font-bold uppercase">History</span>
//             </button>
//           </div>
          
//           <div className="space-y-4">
//               {/* Asset: Main Wallet */}
//               <AssetItem
//                 icon={<Icons.Wallet size={24} />}
//                 title="Locked RhizaCore"
//                 subtitle="Status: Liquid Unclaimed"
//                 amount={claimableRZC.toFixed(2)}
//                 unit="RZC"
//                 onClick={() => handleAssetClick('locked')}
//                 showClaimButton={derivedValues.canClaim && tonAddress}
//                 onClaimClick={(e: React.MouseEvent) => {
//                   e.stopPropagation();
//                   startClaimWizard();
//                 }}
//                 iconBg="bg-white/5"
//                 iconColor="text-white"
//               />

//               {/* Asset: Mining Rewards */}
//               <AssetItem
//                 icon={<Icons.Energy size={24} />}
//                 title="Mining Rewards"
//                 subtitle={isMining ? 'Accumulating...' : 'Paused'}
//                 amount={accumulatedRZC.toFixed(4)}
//                 unit="Pending"
//                 onClick={() => handleAssetClick('mining')}
//                 showClaimButton={false}
//                 iconBg="bg-green-500/10"
//                 iconColor="text-green-400"
//               />

//               {/* Asset: Verified (On-Chain) */}
//               <div className="opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
//                 <AssetItem
//                   icon={<Icons.Rank size={24} />}
//                   title="Protocol Equity"
//                   subtitle="Lifetime Earned"
//                   amount={claimedRZC.toFixed(2)}
//                   unit="On-Chain"
//                   onClick={() => handleAssetClick('equity')}
//                   showClaimButton={false}
//                   iconBg="bg-purple-500/10"
//                   iconColor="text-purple-400"
//                 />
//               </div>
//           </div>
//       </div>

//       {/* Footer Info */}
//       <div className="mt-auto px-6 pt-10 pb-4 text-center">
//           <p className="text-[10px] text-gray-600 font-mono italic">
//             "Your decentralized asset hub, powered by RhizaCore v4.0 Network."
//           </p>
//           <p className="text-[8px] text-gray-700 mt-2">ID: {userId}</p>
//       </div>

//       {/* New Feature: QR Code Modal */}
//       {showQRCode && tonAddress && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
//           <div className="bg-gray-900 border border-white/20 rounded-3xl p-6 m-4 max-w-sm w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-white font-bold">Receive RZC</h3>
//               <button 
//                 onClick={() => setShowQRCode(false)}
//                 className="p-1 hover:bg-white/10 rounded transition-colors"
//               >
//                 <X size={20} className="text-gray-400" />
//               </button>
//             </div>
            
//             <div className="bg-white p-4 rounded-2xl mb-4">
//               <div className="w-48 h-48 mx-auto bg-gray-200 rounded-xl flex items-center justify-center">
//                 <span className="text-gray-600 text-xs text-center">QR Code<br/>for {tonAddress.slice(0, 8)}...</span>
//               </div>
//             </div>
            
//             <div className="text-center">
//               <p className="text-gray-400 text-xs mb-2">Share this address to receive RZC</p>
//               <div className="bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-xs text-gray-300 break-all">
//                 {tonAddress}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Feature: Transaction History Modal */}
//       {showTransactionHistory && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
//           <div className="bg-gray-900 border border-white/20 rounded-3xl p-6 m-4 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-white font-bold">Transaction History</h3>
//               <div className="flex items-center gap-2">
//                 <button 
//                   onClick={exportTransactionHistory}
//                   className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//                 >
//                   <Download size={16} className="text-gray-400" />
//                 </button>
//                 <button 
//                   onClick={() => setShowTransactionHistory(false)}
//                   className="p-1 hover:bg-white/10 rounded transition-colors"
//                 >
//                   <X size={20} className="text-gray-400" />
//                 </button>
//               </div>
//             </div>
            
//             <div className="flex-1 overflow-y-auto space-y-3">
//               {props.activities && props.activities.length > 0 ? (
//                 props.activities.map((activity) => (
//                   <div key={activity.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <div className={`w-2 h-2 rounded-full ${
//                             activity.status === 'completed' ? 'bg-green-400' :
//                             activity.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
//                           }`}></div>
//                           <span className="text-white text-sm font-medium capitalize">
//                             {activity.type.replace('_', ' ')}
//                           </span>
//                         </div>
//                         <p className="text-gray-400 text-xs mt-1">
//                           {new Date(activity.created_at).toLocaleDateString()}
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-white font-mono text-sm">
//                           {activity.amount > 0 ? '+' : ''}{activity.amount} RZC
//                         </div>
//                         <div className="text-gray-500 text-xs capitalize">{activity.status}</div>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-8">
//                   <Icons.History size={48} className="text-gray-600 mx-auto mb-3" />
//                   <p className="text-gray-500 text-sm">No transactions yet</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New Feature: Settings Modal */}
//       {showSettings && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
//           <div className="bg-gray-900 border border-white/20 rounded-3xl p-6 m-4 max-w-sm w-full">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-white font-bold">Wallet Settings</h3>
//               <button 
//                 onClick={() => setShowSettings(false)}
//                 className="p-1 hover:bg-white/10 rounded transition-colors"
//               >
//                 <X size={20} className="text-gray-400" />
//               </button>
//             </div>
            
//             <div className="space-y-4">
//               <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h4 className="text-white text-sm font-medium">Notifications</h4>
//                     <p className="text-gray-400 text-xs">Mining and transaction alerts</p>
//                   </div>
//                   <div className="w-10 h-6 bg-green-500 rounded-full flex items-center px-1">
//                     <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h4 className="text-white text-sm font-medium">Auto-Refresh</h4>
//                     <p className="text-gray-400 text-xs">Update balance automatically</p>
//                   </div>
//                   <div className="w-10 h-6 bg-green-500 rounded-full flex items-center px-1">
//                     <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h4 className="text-white text-sm font-medium">Price Alerts</h4>
//                     <p className="text-gray-400 text-xs">Notify on significant price changes</p>
//                   </div>
//                   <div className="w-10 h-6 bg-gray-600 rounded-full flex items-center px-1">
//                     <div className="w-4 h-4 bg-white rounded-full"></div>
//                   </div>
//                 </div>
//               </div>
              
//               <button className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-medium text-sm hover:bg-red-500/20 transition-colors">
//                 Reset Wallet Data
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Claim Wizard Modal */}
//       {showClaimWizard && (
//         <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
//           <div 
//             className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
//             onClick={() => step !== 'processing' && resetClaimWizard()}
//           ></div>
//           <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-[2.5rem] p-8 relative z-10 overflow-hidden shadow-2xl">
            
//             {/* Header */}
//             <div className="flex items-center gap-2 mb-6">
//               <Icons.Rank size={18} className="text-green-400" />
//               <h2 className="text-white font-bold text-sm uppercase tracking-widest">Claim Dispatcher</h2>
//             </div>

//             {step === 'processing' ? (
//               /* Processing State */
//               <div className="flex flex-col items-center py-6">
//                 <div className="w-12 h-12 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin mb-6"></div>
//                 <div className="w-full bg-black/40 rounded-xl p-4 font-mono text-[8px] min-h-[100px] border border-white/5">
//                   {txLogs.map((log, i) => (
//                     <div key={i} className={`mb-1 ${i <= currentLogIndex ? 'text-green-400' : 'text-gray-700'}`}>
//                       {i <= currentLogIndex ? '✔' : '○'} {log}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               /* Step Content */
//               <div className="space-y-6">
                
//                 {/* Step 1: Audit */}
//                 {claimStep === 'audit' && (
//                   <div className="animate-in fade-in slide-in-from-bottom-2">
//                     <h3 className="text-white font-bold text-lg mb-2">Initialize Audit</h3>
//                     <p className="text-gray-400 text-xs leading-relaxed mb-6">
//                       The RhizaCore AI will now scan your mining logs to verify valid hash contributions and node uptime.
//                     </p>
//                     <button 
//                       onClick={handleAirdropNext} 
//                       className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95"
//                     >
//                       Start Protocol Audit
//                     </button>
//                   </div>
//                 )}

//                 {/* Step 2: Matrix */}
//                 {claimStep === 'matrix' && (
//                   <div className="animate-in fade-in slide-in-from-bottom-2">
//                     <h3 className="text-white font-bold text-lg mb-2">Allocation Matrix</h3>
//                     <div className="space-y-3 mb-6">
//                       <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
//                         <div className="flex justify-between items-center">
//                           <span className="text-[10px] text-gray-500 font-bold uppercase">Liquid Reward (30%)</span>
//                           <span className="text-green-400 font-mono font-bold">+{derivedValues.liquidClaimable.toFixed(2)} RZC</span>
//                         </div>
//                       </div>
//                       <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
//                         <div className="flex justify-between items-center">
//                           <span className="text-[10px] text-gray-500 font-bold uppercase">Ecosystem Vault (70%)</span>
//                           <span className="text-blue-400 font-mono font-bold">{derivedValues.lockedAmount.toFixed(2)} RZC</span>
//                         </div>
//                         <div className="mt-2 pt-2 border-t border-white/5 text-[8px] text-gray-600 font-mono uppercase">
//                           Locked for Network Security • Stability Protocol Engaged
//                         </div>
//                       </div>
//                     </div>
//                     <button 
//                       onClick={handleAirdropNext} 
//                       className="w-full py-4 bg-white text-black rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95"
//                     >
//                       Continue to Sign
//                     </button>
//                   </div>
//                 )}

//                 {/* Step 3: Sign */}
//                 {claimStep === 'sign' && (
//                   <div className="animate-in fade-in slide-in-from-bottom-2 text-center">
//                     <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
//                       <Icons.Power size={32} />
//                     </div>
//                     <h3 className="text-white font-bold text-lg mb-2">Neural Sign-off</h3>
//                     <p className="text-gray-400 text-xs leading-relaxed mb-6">
//                       Authorize the disbursement of {derivedValues.liquidClaimable.toFixed(0)} RZC to your liquid wallet address.
//                     </p>
//                     <button 
//                       onClick={handleAirdropNext} 
//                       className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg animate-pulse"
//                     >
//                       Authorize Transfer
//                     </button>
//                   </div>
//                 )}

//                 {/* Step 4: Complete */}
//                 {claimStep === 'complete' && (
//                   <div className="animate-in zoom-in duration-500 text-center py-6">
//                     <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-black shadow-[0_0_30px_rgba(74,222,128,0.4)]">
//                       <Icons.Check size={32} strokeWidth={3} />
//                     </div>
//                     <h3 className="text-white font-bold text-xl mb-1">Claim Completed</h3>
//                     <p className="text-gray-500 text-[10px] font-mono mb-8">
//                       TX_HASH: 0x8F3...A2B_OK
//                     </p>
//                     <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
//                       <div className="text-center">
//                         <div className="text-2xl font-bold text-green-400 font-mono mb-1">
//                           +{claimAmount.toFixed(2)} RZC
//                         </div>
//                         <div className="text-green-300 text-sm">Successfully claimed</div>
//                       </div>
//                     </div>
//                     <button 
//                       onClick={resetClaimWizard} 
//                       className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold uppercase text-xs tracking-widest border border-white/5"
//                     >
//                       Dismiss Terminal
//                     </button>
//                   </div>
//                 )}

//               </div>
//             )}
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
//         `
//       }} />
//     </div>
//   );
// });

// export default NativeWalletUI;