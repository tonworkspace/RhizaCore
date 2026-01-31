// import { useState, useEffect } from 'react';
// import { Icons } from '../uicomponents/Icons';
// import { supabase } from '../lib/supabaseClient';
// import { useTonConnectUI } from '@tonconnect/ui-react';
// import { Address, toNano } from '@ton/core';

// interface WalletActivationModalProps {
//   userId: number;
//   userUsername?: string;
//   tonAddress?: string | null;
//   tonPrice: number;
//   showSnackbar?: (data: { message: string; description?: string; type?: 'success' | 'error' | 'info' }) => void;
//   onClose: () => void;
//   onActivationComplete: () => void;
// }

// interface ActivationStatus {
//   wallet_activated: boolean;
//   wallet_activated_at?: string;
//   activation_details?: {
//     id: number;
//     ton_amount: number;
//     usd_amount: number;
//     rzc_awarded: number;
//     transaction_hash: string;
//     status: string;
//     created_at: string;
//   };
// }

// const WalletActivationModal: React.FC<WalletActivationModalProps> = ({
//   userId,
//   userUsername,
//   tonAddress,
//   tonPrice,
//   showSnackbar,
//   onClose,
//   onActivationComplete
// }) => {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [activationStatus, setActivationStatus] = useState<ActivationStatus | null>(null);
//   const [paymentSent, setPaymentSent] = useState(false);
//   const [debugLogs, setDebugLogs] = useState<string[]>([]);
//   const [showDebugPanel, setShowDebugPanel] = useState(false);
  
//   // TON Connect integration with debugging
//   const [tonConnectUI] = useTonConnectUI();
  
//   // Debug: Log TON Connect state
//   const connected = tonConnectUI.connected;
//   const account = tonConnectUI.account;

//   // Constants
//   const USD_AMOUNT = 15;
//   const RZC_REWARD = 150;
//   const tonAmountNeeded = USD_AMOUNT / tonPrice;
//   const RECEIVER_ADDRESS = "UQD8_4W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8"; // Replace with your actual TON address

//   // Debug logging function
//   const addDebugLog = (message: string, data?: any) => {
//     const timestamp = new Date().toLocaleTimeString();
//     const logEntry = `[${timestamp}] ${message}${data ? ` - ${JSON.stringify(data, null, 2)}` : ''}`;
//     console.log('🐛 WalletActivation:', logEntry);
//     setDebugLogs(prev => [...prev, logEntry]);
//   };

//   useEffect(() => {
//     addDebugLog('Component mounted', {
//       userId,
//       userUsername,
//       tonAddress,
//       tonPrice,
//       connected,
//       account: account ? {
//         address: account.address,
//         chain: account.chain,
//         walletStateInit: account.walletStateInit
//       } : null
//     });
    
//     loadActivationStatus();
//   }, [userId]);

//   useEffect(() => {
//     addDebugLog('TON Connect state changed', {
//       connected,
//       account: account ? {
//         address: account.address,
//         chain: account.chain
//       } : null
//     });
//   }, [connected, account]);

//   const loadActivationStatus = async () => {
//     try {
//       addDebugLog('Loading activation status...');
      
//       const { data, error } = await supabase.rpc('get_wallet_activation_status', {
//         p_user_id: userId
//       });

//       addDebugLog('Activation status response', { data, error });

//       if (error) {
//         console.error('Error loading activation status:', error);
//         addDebugLog('Error loading activation status', error);
//         return;
//       }

//       if (data?.success) {
//         setActivationStatus(data);
//         addDebugLog('Activation status loaded successfully', data);
//       } else {
//         addDebugLog('Activation status load failed', data);
//       }
//     } catch (error) {
//       console.error('Error loading activation status:', error);
//       addDebugLog('Exception loading activation status', error);
//     }
//   };

//   const handleActivateWallet = async () => {
//     addDebugLog('Activate wallet button clicked');
    
//     if (!connected || !account) {
//       const errorMsg = 'Wallet not connected';
//       addDebugLog(errorMsg, { connected, account });
//       showSnackbar?.({
//         message: 'Wallet Not Connected',
//         description: 'Please connect your TON wallet first',
//         type: 'error'
//       });
//       return;
//     }

//     setIsProcessing(true);
//     addDebugLog('Starting wallet activation process');
    
//     try {
//       // Validate inputs
//       addDebugLog('Validating transaction parameters', {
//         tonAmountNeeded,
//         RECEIVER_ADDRESS,
//         userId,
//         tonPrice
//       });

//       // Create the transaction
//       const transaction = {
//         validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
//         messages: [
//           {
//             address: RECEIVER_ADDRESS,
//             amount: toNano(tonAmountNeeded.toFixed(4)).toString(),
//             payload: `Wallet activation for user ${userId}` // Optional comment
//           }
//         ]
//       };

//       addDebugLog('Transaction created', transaction);

//       // Send the transaction
//       addDebugLog('Sending transaction via TON Connect...');
//       const result = await tonConnectUI.sendTransaction(transaction);
      
//       addDebugLog('Transaction result received', result);
      
//       if (result) {
//         setPaymentSent(true);
//         addDebugLog('Payment sent successfully, waiting for confirmation...');
        
//         // Wait a moment for transaction to be processed
//         setTimeout(async () => {
//           try {
//             addDebugLog('Processing activation after payment confirmation...');
            
//             // Process the activation
//             const activationParams = {
//               p_user_id: userId,
//               p_ton_amount: tonAmountNeeded,
//               p_ton_price: tonPrice,
//               p_transaction_hash: result.boc || 'direct_payment',
//               p_sender_address: account.address,
//               p_receiver_address: RECEIVER_ADDRESS
//             };
            
//             addDebugLog('Calling process_wallet_activation', activationParams);
            
//             const activationResult = await supabase.rpc('process_wallet_activation', activationParams);

//             addDebugLog('Activation result received', activationResult);

//             if (activationResult.error) {
//               addDebugLog('Activation error from database', activationResult.error);
//               throw activationResult.error;
//             }

//             if (activationResult.data?.success) {
//               addDebugLog('Activation successful!', activationResult.data);
              
//               showSnackbar?.({
//                 message: 'Wallet Activated!',
//                 description: `You received ${RZC_REWARD} RZC tokens. Welcome to RhizaCore!`,
//                 type: 'success'
//               });

//               await loadActivationStatus();
//               onActivationComplete();
//               onClose();
//             } else {
//               addDebugLog('Activation failed', activationResult.data);
//               showSnackbar?.({
//                 message: 'Activation Failed',
//                 description: activationResult.data?.error || 'Failed to activate wallet',
//                 type: 'error'
//               });
//             }
//           } catch (error: any) {
//             addDebugLog('Activation processing error', error);
//             console.error('Activation processing error:', error);
//             showSnackbar?.({
//               message: 'Processing Error',
//               description: 'Payment sent but activation failed. Please contact support.',
//               type: 'error'
//             });
//           } finally {
//             setIsProcessing(false);
//             setPaymentSent(false);
//             addDebugLog('Activation process completed');
//           }
//         }, 3000); // Wait 3 seconds for transaction confirmation
        
//       } else {
//         addDebugLog('No transaction result received');
//         throw new Error('No transaction result received');
//       }
//     } catch (error: any) {
//       addDebugLog('Payment error', error);
//       console.error('Payment error:', error);
//       setIsProcessing(false);
//       setPaymentSent(false);
      
//       if (error.message?.includes('user rejected') || error.message?.includes('User rejected')) {
//         addDebugLog('User rejected payment');
//         showSnackbar?.({
//           message: 'Payment Cancelled',
//           description: 'You cancelled the payment',
//           type: 'info'
//         });
//       } else {
//         addDebugLog('Payment error occurred', error);
//         showSnackbar?.({
//           message: 'Payment Error',
//           description: error.message || 'Failed to send payment',
//           type: 'error'
//         });
//       }
//     }
//   };

//   const copyToClipboard = async (text: string, label: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       addDebugLog(`Copied ${label} to clipboard`);
//       showSnackbar?.({
//         message: 'Copied!',
//         description: `${label} copied to clipboard`,
//         type: 'info'
//       });
//     } catch (error) {
//       addDebugLog('Failed to copy to clipboard', error);
//       console.error('Failed to copy:', error);
//     }
//   };

//   // Debug Panel Component
//   const DebugPanel = () => (
//     <div className="fixed top-4 right-4 w-80 max-h-96 bg-black/90 border border-white/20 rounded-lg p-4 z-[600] overflow-y-auto">
//       <div className="flex justify-between items-center mb-2">
//         <h4 className="text-white font-bold text-sm">Debug Logs</h4>
//         <button
//           onClick={() => setShowDebugPanel(false)}
//           className="text-white/60 hover:text-white"
//         >
//           <Icons.Copy size={16} />
//         </button>
//       </div>
//       <div className="space-y-1 text-xs font-mono">
//         {debugLogs.map((log, index) => (
//           <div key={index} className="text-green-400 break-words">
//             {log}
//           </div>
//         ))}
//       </div>
//       <button
//         onClick={() => setDebugLogs([])}
//         className="mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded"
//       >
//         Clear Logs
//       </button>
//     </div>
//   );

//   // If wallet is already activated, show success state
//   if (activationStatus?.wallet_activated) {
//     return (
//       <>
//         {showDebugPanel && <DebugPanel />}
//         <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
//           <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose}></div>

//           <div className="bg-[#0a0a0a] border border-green-500/20 rounded-3xl w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
//             <div className="p-6 md:p-8 flex flex-col items-center justify-center h-full overflow-y-auto">
//               <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 border border-green-500/20 shrink-0">
//                 <Icons.Check size={32} className="text-green-400" />
//               </div>
//               <h3 className="text-2xl font-bold text-white mb-2 text-center">Wallet Activated!</h3>
//               <p className="text-zinc-400 text-sm text-center mb-6">Your RhizaCore wallet is ready to use</p>

//               <div className="bg-green-500/5 rounded-2xl p-6 border border-green-500/10 mb-6 w-full">
//                 <div className="text-center">
//                   <div className="text-green-400 text-3xl font-bold font-mono mb-2">
//                     {activationStatus.activation_details?.rzc_awarded || RZC_REWARD} RZC
//                   </div>
//                   <div className="text-zinc-500 text-sm">Activation Reward Received</div>
//                 </div>

//                 {activationStatus.activation_details && (
//                   <div className="mt-4 pt-4 border-t border-green-500/10">
//                     <div className="text-xs text-zinc-600 space-y-1 text-center">
//                       <div>Activated: {new Date(activationStatus.wallet_activated_at!).toLocaleDateString()}</div>
//                       <div>Transaction: {activationStatus.activation_details.transaction_hash.slice(0, 20)}...</div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <button
//                 onClick={onClose}
//                 className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-2xl text-sm font-bold transition-colors shrink-0"
//               >
//                 Continue to Wallet
//               </button>
//             </div>
//           </div>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       {showDebugPanel && <DebugPanel />}
//       <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
//         <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose}></div>

//         <div className="bg-[#0a0a0a] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom duration-300">
//           {/* Header - Fixed */}
//           <div className="p-5 border-b border-white/5 flex flex-col items-center shrink-0">
//             <div className="flex items-center gap-2 mb-3">
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
//                 <Icons.Lock size={24} className="text-blue-400" />
//               </div>
//               {/* Debug Toggle Button */}
//               <button
//                 onClick={() => setShowDebugPanel(!showDebugPanel)}
//                 className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20"
//                 title="Toggle Debug Panel"
//               >
//                 <Icons.Energy size={16} />
//               </button>
//             </div>
//             <h3 className="text-xl font-bold text-white mb-1">Activate Wallet</h3>
//             <p className="text-zinc-400 text-xs text-center px-4">Pay $15 in TON to unlock your RhizaCore wallet</p>
//           </div>

//           {/* Scrollable Content */}
//           <div className="overflow-y-auto p-5 space-y-5 custom-scrollbar">
//             {/* Debug Info Panel */}
//             <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
//               <h4 className="text-red-300 font-bold mb-2 text-xs">Debug Info</h4>
//               <div className="text-xs space-y-1 font-mono">
//                 <div>Connected: {connected ? '✅' : '❌'}</div>
//                 <div>Account: {account ? '✅' : '❌'}</div>
//                 <div>User ID: {userId}</div>
//                 <div>TON Price: ${tonPrice}</div>
//                 <div>Amount Needed: {tonAmountNeeded.toFixed(4)} TON</div>
//                 <div>Processing: {isProcessing ? '✅' : '❌'}</div>
//                 <div>Payment Sent: {paymentSent ? '✅' : '❌'}</div>
//               </div>
//             </div>

//             {/* Activation Details */}
//             <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 space-y-3">
//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-zinc-400">Activation Fee</span>
//                 <span className="text-white font-bold">${USD_AMOUNT} USD</span>
//               </div>

//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-zinc-400">TON Amount</span>
//                 <span className="text-blue-400 font-bold font-mono">{tonAmountNeeded.toFixed(4)} TON</span>
//               </div>

//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-zinc-400">RZC Reward</span>
//                 <span className="text-green-400 font-bold">{RZC_REWARD} RZC</span>
//               </div>

//               <div className="h-px bg-white/5 w-full"></div>

//               <div className="flex justify-between items-center text-xs">
//                 <span className="text-zinc-500">Rate: 1 TON ≈ ${tonPrice.toFixed(2)}</span>
//               </div>
//             </div>

//             {/* Wallet Connection Status */}
//             <div className={`rounded-xl p-4 border ${
//               connected 
//                 ? 'bg-green-500/5 border-green-500/10' 
//                 : 'bg-yellow-500/5 border-yellow-500/10'
//             }`}>
//               <div className="flex items-center gap-3 mb-2">
//                 <div className={`w-3 h-3 rounded-full ${
//                   connected ? 'bg-green-400' : 'bg-yellow-400'
//                 }`}></div>
//                 <span className={`font-bold text-sm ${
//                   connected ? 'text-green-300' : 'text-yellow-300'
//                 }`}>
//                   {connected ? 'Wallet Connected' : 'Wallet Required'}
//                 </span>
//               </div>
              
//               {connected && account ? (
//                 <div className="text-xs text-zinc-400">
//                   <div className="font-mono">
//                     {Address.parse(account.address).toString().slice(0, 8)}...
//                     {Address.parse(account.address).toString().slice(-6)}
//                   </div>
//                   <div className="text-green-400 mt-1">Ready to pay {tonAmountNeeded.toFixed(4)} TON</div>
//                 </div>
//               ) : (
//                 <div className="text-xs text-yellow-200/80">
//                   Connect your TON wallet to proceed with activation payment
//                 </div>
//               )}
//             </div>

//             {/* Payment Status */}
//             {paymentSent && (
//               <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
//                 <div className="flex items-center gap-3 mb-2">
//                   <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
//                   <span className="text-blue-300 font-bold text-sm">Processing Payment</span>
//                 </div>
//                 <div className="text-xs text-blue-200/80">
//                   Payment sent successfully. Verifying transaction and activating wallet...
//                 </div>
//               </div>
//             )}

//             {/* Benefits */}
//             <div className="bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl p-4 border border-green-500/10">
//               <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
//                 <Icons.Check size={14} className="text-green-400" />
//                 What You Get
//               </h4>

//               <div className="space-y-2 text-xs">
//                 <div className="flex items-center gap-2">
//                   <Icons.Wallet size={12} className="text-green-400" />
//                   <span className="text-zinc-300">Full wallet functionality unlocked</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Icons.Energy size={12} className="text-blue-400" />
//                   <span className="text-zinc-300">150 RZC tokens instantly credited</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Icons.Send size={12} className="text-purple-400" />
//                   <span className="text-zinc-300">Send & receive RZC tokens</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Icons.Boost size={12} className="text-yellow-400" />
//                   <span className="text-zinc-300">Access to staking & rewards</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Icons.Store size={12} className="text-pink-400" />
//                   <span className="text-zinc-300">RhizaCore marketplace access</span>
//                 </div>
//               </div>
//             </div>

//             {/* Security Notice */}
//             <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10 flex gap-3 text-xs">
//               <Icons.Lock size={14} className="text-green-400 mt-0.5 shrink-0" />
//               <div className="text-green-200/80 leading-relaxed">
//                 <strong className="text-green-200 block mb-0.5">Secure Payment</strong>
//                 Direct wallet payment via TON Connect. Your funds are processed securely on the TON blockchain.
//               </div>
//             </div>

//             {/* Spacer for bottom padding in scroll view */}
//             <div className="h-2"></div>
//           </div>

//           {/* Footer Actions - Fixed */}
//           <div className="p-4 border-t border-white/5 bg-[#0a0a0a] rounded-b-3xl flex gap-3 shrink-0">
//             <button
//               onClick={onClose}
//               className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white py-3 rounded-xl text-sm font-bold transition-all"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleActivateWallet}
//               disabled={isProcessing || !connected || paymentSent}
//               className="flex-[2] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-500/20"
//             >
//               {isProcessing ? (
//                 <div className="flex items-center justify-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                   <span>{paymentSent ? 'Activating...' : 'Processing...'}</span>
//                 </div>
//               ) : !connected ? (
//                 'Connect Wallet First'
//               ) : (
//                 `Pay ${tonAmountNeeded.toFixed(4)} TON`
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default WalletActivationModal;