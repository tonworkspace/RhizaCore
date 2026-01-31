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
  
//   // Constants
//   const RZC_PER_DAY = 50;
//   const RZC_PER_SECOND = (RZC_PER_DAY * miningRateMultiplier) / (24 * 60 * 60);

//   // Derived Values
//   const actualBalance = claimableRZC + (isMining ? accumulatedRZC : 0) + claimedRZC;
//   const totalUsd = actualBalance * 0.1; // Estimated USD value

//   // --- EFFECTS (Data Fetching & Timers) ---

//   // Debug log for tonAddress
//   useEffect(() => {
//     console.log('NativeWalletUI - tonAddress changed:', tonAddress);
//   }, [tonAddress]);

//   // 1. Smooth Balance Animation
//   useEffect(() => {
//     let animationId: number;
//     const animate = () => {
//       setDisplayBalance(prev => {
//         const diff = actualBalance - prev;
//         if (Math.abs(diff) < 0.00001) return actualBalance;
//         return prev + diff * 0.1; // Faster lerp for wallet feel
//       });
//       animationId = requestAnimationFrame(animate);
//     };
//     animate();
//     return () => cancelAnimationFrame(animationId);
//   }, [actualBalance]);

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

//         const [rzcBalance, miningCheck, activeSession] = await Promise.all([
//           getUserRZCBalance(userId),
//           canUserStartMining(userId),
//           getActiveMiningSession(userId)
//         ]);

//         setClaimableRZC(rzcBalance.claimableRZC);
//         setClaimedRZC(rzcBalance.claimedRZC);
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
//     if (!tonAddress) {
//       showSnackbar?.({ message: 'Wallet Required', description: 'Please connect your TON wallet first' });
//       return;
//     }
//     showSnackbar?.({ message: 'Coming Soon', description: 'Send functionality will be available soon' });
//   };

//   const handleBuyAction = () => {
//     showSnackbar?.({ message: 'Coming Soon', description: 'Buy functionality will be available soon' });
//   };

//   const handleSwapAction = () => {
//     showSnackbar?.({ message: 'Coming Soon', description: 'Swap functionality will be available soon' });
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
//           {/* TON Connection Status */}
//           {/* Mining Status */}
//           <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
//             <div className={`w-1 h-1 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></div>
//             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Testnet</span>
//           </div>
//         </div>
//       </div>

//       {/* Main Balance Hero */}
//       <div className="flex flex-col items-center py-8 px-6">
//         <div className="flex items-baseline gap-2">
//             <span className="text-5xl font-bold font-mono tracking-tighter">
//                 {displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </span>
//             <span className="text-green-400 font-bold text-lg">RZC</span>
//         </div>
//         <div className="text-gray-500 text-sm font-mono mt-1">
//             ≈ ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
//         </div>
        
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
//       </div>

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
//       {tonAddress && (
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
//       )}

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
//               <div 
//                 onClick={() => handleAssetClick('locked')}
//                 className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
//               >
//                   <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/5">
//                           <Icons.Wallet size={24} />
//                       </div>
//                       <div>
//                           <h4 className="text-white text-sm font-bold">Locked RhizaCore</h4>
//                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter font-mono">Status: Liquid Unclaimed</p>
//                       </div>
//                   </div>
//                   <div className="text-right">
//                       <div className="text-white font-bold text-sm font-mono">{claimableRZC.toFixed(2)}</div>
//                       <div className="text-[10px] text-gray-600">RZC</div>
//                   </div>
//               </div>

//               {/* Asset: Mining Rewards */}
//               <div 
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
//               </div>

//               {/* Asset: Verified (On-Chain) */}
//               <div 
//                 onClick={() => handleAssetClick('equity')}
//                 className="flex items-center justify-between p-2 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
//               >
//                   <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/10">
//                           <Icons.Rank size={24} />
//                       </div>
//                       <div>
//                           <h4 className="text-white text-sm font-bold">Protocol Equity</h4>
//                           <p className="text-[10px] text-purple-400/50 uppercase font-bold tracking-tighter font-mono">Lifetime Earned</p>
//                       </div>
//                   </div>
//                   <div className="text-right">
//                       <div className="text-white font-bold text-sm font-mono">{claimedRZC.toFixed(2)}</div>
//                       <div className="text-[10px] text-gray-600">On-Chain</div>
//                   </div>
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