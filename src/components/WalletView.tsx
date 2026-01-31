// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { Icons } from './Icon';
// import { 
//   getUserRZCBalance
// } from '../lib/supabaseClient';
// import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";

// // Types for compatibility with existing system
// interface MiningState {
//   balance: number;
//   miningBalance: number;
//   isAirdropClaimed: boolean;
//   validatedBalance: number;
// }

// interface WalletViewProps {
//   state: MiningState;
//   onActivate: (unlockedBonus: number, purchaseAmount: number) => void;
//   onUpdateBalance?: (amount: number) => void;
//   onClaimAirdrop: (liquid: number, locked: number) => void;
  
//   // Additional props for integration with existing system
//   userId?: number;
//   tonAddress?: string | null;
//   showSnackbar?: (data: { message: string; description?: string }) => void;
//   activities?: Array<{ id: string; type: string; amount: number; status: string; created_at: string; }>;
// }

// export const WalletView: React.FC<WalletViewProps> = ({ 
//   onClaimAirdrop, 
//   onUpdateBalance,
//   userId,
//   tonAddress,
//   showSnackbar
// }) => {
//   const [walletAddress, setWalletAddress] = useState(tonAddress || '');
//   const [isClaiming, setIsClaiming] = useState(false);
//   const [claimableRZC, setClaimableRZC] = useState(0);
//   const [claimedRZC, setClaimedRZC] = useState(0);
//   const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
//   const [pendingOrder, setPendingOrder] = useState<{
//     liquidAmount: number;
//     lockedAmount: number;
//     walletAddress: string;
//     orderId: string;
//   } | null>(null);

//   // TON Connect hooks
//   const connectedAddress = useTonAddress();
//   const [tonConnectUI] = useTonConnectUI();

//   const RZC_USD_RATE = 0.1;

//   // Load RZC balance data
//   const loadRZCData = useCallback(async () => {
//     if (!userId) return;
    
//     try {
//       const [rzcBalance] = await Promise.all([
//         getUserRZCBalance(userId)
//       ]);

//       setClaimableRZC(rzcBalance.claimableRZC);
//       setClaimedRZC(rzcBalance.claimedRZC);
//     } catch (error) {
//       console.error('Failed to load RZC data:', error);
//     }
//   }, [userId]);

//   useEffect(() => {
//     loadRZCData();
//     const interval = setInterval(loadRZCData, 30000); // Refresh every 30 seconds
//     return () => clearInterval(interval);
//   }, [loadRZCData]);

//   // Update wallet address when tonAddress or connected address changes
//   useEffect(() => {
//     const address = connectedAddress || tonAddress;
//     if (address) {
//       setWalletAddress(address);
//     }
//   }, [tonAddress, connectedAddress]);

//   // Calculate display values
//   const derivedValues = useMemo(() => {
//     const totalPool = claimableRZC;
//     const liquidAmount = totalPool * 0.3;
//     const lockedAmount = totalPool * 0.7;
//     const currentTotal = claimedRZC + claimableRZC;
//     const hasClaimableBalance = claimableRZC > 0;
    
//     return {
//       totalPool,
//       liquidAmount,
//       lockedAmount,
//       currentTotal,
//       hasClaimableBalance
//     };
//   }, [claimableRZC, claimedRZC]);

//   const handleClaim = async () => {
//     const currentWalletAddress = connectedAddress || walletAddress;
    
//     if (!currentWalletAddress || currentWalletAddress.length < 10) {
//       showSnackbar?.({ 
//         message: 'Wallet Not Connected', 
//         description: 'Please connect your TON wallet to claim rewards' 
//       });
//       return;
//     }

//     if (!userId) {
//       showSnackbar?.({ 
//         message: 'User Not Found', 
//         description: 'Please refresh and try again' 
//       });
//       return;
//     }

//     if (derivedValues.liquidAmount <= 0) {
//       showSnackbar?.({ 
//         message: 'No Claimable Balance', 
//         description: 'You need claimable RZC to make a claim' 
//       });
//       return;
//     }

//     // Show order confirmation modal
//     setShowOrderConfirmation(true);
//   };

//   const handleConfirmOrder = async () => {
//     const currentWalletAddress = connectedAddress || walletAddress;
//     setIsClaiming(true);
//     setShowOrderConfirmation(false);

//     try {
//       // Generate order ID
//       const orderId = `RZC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
//       // Create pending order
//       const orderDetails = {
//         liquidAmount: derivedValues.liquidAmount,
//         lockedAmount: derivedValues.lockedAmount,
//         walletAddress: currentWalletAddress,
//         orderId
//       };

//       // Simulate order submission (this will be implemented in the spec)
//       await new Promise(r => setTimeout(r, 2000));

//       // Set order as pending
//       setPendingOrder(orderDetails);
      
//       // Call the existing claim function for compatibility (but mark as pending)
//       onClaimAirdrop(derivedValues.liquidAmount, derivedValues.lockedAmount);
      
//       // Update local state to reflect pending status
//       setClaimableRZC(prev => prev - derivedValues.totalPool);
      
//       // Call update balance callback
//       onUpdateBalance?.(0); // Don't add to balance yet since it's pending

//       showSnackbar?.({ 
//         message: 'Order Submitted', 
//         description: `Claim order ${orderId} is pending approval` 
//       });

//     } catch (error) {
//       console.error('Order submission failed:', error);
//       showSnackbar?.({ 
//         message: 'Order Failed', 
//         description: 'Please try again later' 
//       });
//     } finally {
//       setIsClaiming(false);
//     }
//   };

//   // Simulate order approval (for testing - remove in production)
//   const simulateOrderApproval = () => {
//     if (pendingOrder) {
//       setClaimedRZC(prev => prev + pendingOrder.liquidAmount);
//       onUpdateBalance?.(pendingOrder.liquidAmount);
//       setPendingOrder(null);
      
//       showSnackbar?.({ 
//         message: 'Order Approved!', 
//         description: `${pendingOrder.liquidAmount.toFixed(2)} RZC has been transferred to your wallet` 
//       });
//     }
//   };

//   return (
//     <div className="flex flex-col h-full w-full bg-black text-white items-center p-6 text-center overflow-y-auto custom-scrollbar pb-32">
//       {/* Background Ambient Glow */}
//       <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 blur-[120px] pointer-events-none"></div>

//       <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in duration-700">
//         <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-6 shadow-[0_0_30px_rgba(74,222,128,0.1)]">
//           <Icons.Wallet size={28} />
//         </div>

//         <h1 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
//          Claim 30% Mined Balance from your Core Balance
//         </h1>

//         <div className="flex items-baseline justify-center gap-2 mb-4">
//           <span className="text-5xl font-bold text-white font-mono tracking-tighter">
//             {derivedValues.liquidAmount.toLocaleString()}
//           </span>
//           <span className="text-green-400 font-bold text-lg">RZC</span>
//         </div>

//         {/* <div className="text-gray-500 text-sm font-mono mb-10">
//           ≈ ${(derivedValues.currentTotal * RZC_USD_RATE).toLocaleString(undefined, { 
//             minimumFractionDigits: 2, 
//             maximumFractionDigits: 2 
//           })} USD
//         </div> */}

   
//         {/* Claim Card Section - Only show when wallet is connected */}
//         {connectedAddress && derivedValues.hasClaimableBalance && !pendingOrder ? (
//           <div className="w-full bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[2.5rem] p-6 text-left relative overflow-hidden mb-6 shadow-2xl">
//             <div className="absolute top-0 right-0 p-4 opacity-5">
//               <Icons.Energy size={40} />
//             </div>

//             <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-widest">
//               Unclaimed Genesis Rewards
//             </h3>

//             <div className="space-y-3 mb-6">
//               <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
//                 <span className="text-[10px] text-gray-500 font-bold uppercase">To Liquid (30%)</span>
//                 <span className="text-green-400 font-mono font-bold">
//                   +{derivedValues.liquidAmount.toLocaleString()}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
//                 <span className="text-[10px] text-gray-500 font-bold uppercase">To Locked (70%)</span>
//                 <span className="text-blue-400 font-mono font-bold">
//                   {derivedValues.lockedAmount.toLocaleString()}
//                 </span>
//               </div>
//             </div>

//             <div className="mb-6">
//               <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block">
//                 Destination Wallet
//               </label>
//               <div className="relative">
//                 {connectedAddress ? (
//                   <div className="w-full bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-[10px] font-mono flex items-center justify-between">
//                     <span>{connectedAddress.slice(0, 8)}...{connectedAddress.slice(-6)}</span>
//                     <div className="flex items-center gap-1">
//                       <Icons.Check size={12} />
//                       <span className="text-[8px] uppercase">Connected</span>
//                     </div>
//                   </div>
//                 ) : (
//                   <input 
//                     type="text"
//                     placeholder="Connect wallet above or enter manually"
//                     value={walletAddress}
//                     onChange={(e) => setWalletAddress(e.target.value)}
//                     className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-[10px] font-mono outline-none focus:border-green-400 transition-colors"
//                   />
//                 )}
//                 <Icons.QrCode className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
//               </div>
//             </div>

//             <button 
//               onClick={handleClaim}
//               disabled={isClaiming || (!connectedAddress && walletAddress.length < 10)}
//               className={`w-full py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
//                 (connectedAddress || walletAddress.length >= 10)
//                   ? 'bg-green-500 text-black shadow-[0_10px_20px_rgba(74,222,128,0.2)] hover:scale-[1.02] active:scale-95' 
//                   : 'bg-white/5 text-gray-600 cursor-not-allowed'
//               }`}
//             >
//               {isClaiming ? (
//                 <Icons.Settings className="animate-spin" size={16} />
//               ) : connectedAddress ? (
//                 <>
//                   CLAIM 30% TO WALLET <Icons.Send size={14} />
//                 </>
//               ) : (
//                 <>
//                   CONNECT & CLAIM 30% <Icons.Send size={14} />
//                 </>
//               )}
//             </button>
//           </div>
//         ) : connectedAddress && pendingOrder ? (
//           <div className="w-full bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border border-orange-500/30 rounded-[2.5rem] p-6 text-left relative overflow-hidden mb-6 shadow-2xl">
//             <div className="absolute top-0 right-0 p-4 opacity-5">
//               <Icons.Settings size={40} />
//             </div>

//             <h3 className="text-orange-400 font-bold text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
//               <Icons.Settings className="animate-spin" size={16} />
//               Order Pending Approval
//             </h3>

//             <div className="space-y-3 mb-6">
//               <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-orange-500/20">
//                 <span className="text-[10px] text-gray-500 font-bold uppercase">Order ID</span>
//                 <span className="text-orange-400 font-mono font-bold text-xs">
//                   {pendingOrder.orderId}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
//                 <span className="text-[10px] text-gray-500 font-bold uppercase">Liquid Amount</span>
//                 <span className="text-green-400 font-mono font-bold">
//                   +{pendingOrder.liquidAmount.toLocaleString()} RZC
//                 </span>
//               </div>
//               <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
//                 <span className="text-[10px] text-gray-500 font-bold uppercase">Locked Amount</span>
//                 <span className="text-blue-400 font-mono font-bold">
//                   {pendingOrder.lockedAmount.toLocaleString()} RZC
//                 </span>
//               </div>
//               <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
//                 <span className="text-[10px] text-gray-500 font-bold uppercase">Destination</span>
//                 <span className="text-gray-300 font-mono font-bold text-xs">
//                   {pendingOrder.walletAddress.slice(0, 8)}...{pendingOrder.walletAddress.slice(-6)}
//                 </span>
//               </div>
//             </div>

//             <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
//               <div className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-2">
//                 Awaiting Admin Approval
//               </div>
//               <div className="text-gray-400 text-[10px] leading-relaxed mb-3">
//                 Your claim order has been submitted and is being reviewed. You will be notified once approved and tokens are transferred.
//               </div>
//               {/* Temporary approval button for testing */}
//               <button
//                 onClick={simulateOrderApproval}
//                 className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs font-bold hover:bg-green-500/30 transition-colors"
//               >
//                 [TEST] Approve Order
//               </button>
//             </div>
//           </div>
//         ) : connectedAddress && !derivedValues.hasClaimableBalance ? (
//           <div className="w-full bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] p-8 mb-6 animate-in zoom-in">
//             <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-4">
//               <Icons.Lock size={24} />
//             </div>
//             <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">
//               Vault Protocol Active
//             </h3>
//             <p className="text-gray-500 text-[10px] leading-relaxed">
//               70% of your initial genesis rewards ({claimedRZC.toLocaleString()} RZC) are currently secured in the yearly linear release vault.
//             </p>
//             <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
//               <div className="h-full bg-blue-500 w-[5%] animate-pulse"></div>
//             </div>
//             <div className="flex justify-between mt-2">
//               <span className="text-[8px] text-gray-600 font-mono">EST. NEXT RELEASE</span>
//               <span className="text-[8px] text-gray-600 font-mono">30 DAYS</span>
//             </div>
//           </div>
//         ) : null}

//         {/* Encourage wallet connection when not connected */}
//         {!connectedAddress && (
//           <div className="w-full bg-gradient-to-br from-gray-900/50 to-black/50 border border-dashed border-gray-500/30 rounded-[2.5rem] p-8 mb-6 text-center">
//             <div className="w-12 h-12 bg-gray-500/10 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
//               <Icons.Lock size={24} />
//             </div>
//             <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">
//               Rewards Locked
//             </h3>
//             <p className="text-gray-500 text-[10px] leading-relaxed">
//               Connect your TON wallet above to access and claim your genesis rewards securely.
//             </p>
//           </div>
//         )}

//         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
//           <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
//           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
//             Security Layer: ACTIVE
//           </span>
//         </div>
//       </div>

//       {/* Success Toast - Remove since we're not using it anymore */}

//       {/* Decorative Corner Accents */}
//       <div className="absolute top-10 left-10 w-4 h-4 border-t border-l border-white/10"></div>
//       <div className="absolute top-10 right-10 w-4 h-4 border-t border-r border-white/10"></div>

//       {/* Order Confirmation Modal */}
//       {showOrderConfirmation && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
//           <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in">
//             <div className="text-center mb-6">
//               <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mx-auto mb-4">
//                 <Icons.Check size={32} />
//               </div>
//               <h2 className="text-white font-bold text-lg mb-2">Confirm Claim Order</h2>
//               <p className="text-gray-400 text-sm">Review your order details before submission</p>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="bg-black/40 p-4 rounded-xl border border-white/5">
//                 <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">Order Summary</div>
//                 <div className="space-y-2">
//                   <div className="flex justify-between">
//                     <span className="text-gray-400 text-xs">Liquid (30%)</span>
//                     <span className="text-green-400 font-mono font-bold text-sm">
//                       +{derivedValues.liquidAmount.toFixed(2)} RZC
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-400 text-xs">Locked (70%)</span>
//                     <span className="text-blue-400 font-mono font-bold text-sm">
//                       {derivedValues.lockedAmount.toFixed(2)} RZC
//                     </span>
//                   </div>
//                   <div className="border-t border-white/10 pt-2 mt-2">
//                     <div className="flex justify-between">
//                       <span className="text-white text-sm font-bold">Total Value</span>
//                       <span className="text-white font-mono font-bold">
//                         ${(derivedValues.totalPool * RZC_USD_RATE).toFixed(2)} USD
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-black/40 p-4 rounded-xl border border-white/5">
//                 <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">Destination Wallet</div>
//                 <div className="text-green-400 font-mono text-sm break-all">
//                   {connectedAddress || walletAddress}
//                 </div>
//               </div>

//               <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
//                 <div className="flex items-start gap-2">
//                   <Icons.Settings className="text-orange-400 mt-0.5" size={14} />
//                   <div>
//                     <div className="text-orange-400 font-bold text-xs uppercase">Important Notice</div>
//                     <div className="text-gray-400 text-[10px] leading-relaxed mt-1">
//                       Your order will be pending admin approval. Tokens will be transferred once approved.
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowOrderConfirmation(false)}
//                 className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold text-sm hover:bg-gray-600 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmOrder}
//                 disabled={isClaiming}
//                 className="flex-1 py-3 rounded-xl bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
//               >
//                 {isClaiming ? (
//                   <Icons.Settings className="animate-spin" size={16} />
//                 ) : (
//                   <>
//                     Submit Order <Icons.Send size={14} />
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };