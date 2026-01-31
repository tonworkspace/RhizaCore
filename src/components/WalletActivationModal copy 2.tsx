// import { useState, useEffect } from 'react';
// import { Icons } from '../uicomponents/Icons';
// import { supabase } from '../lib/supabaseClient';
// import { TonConnectButton, useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
// import { Address, toNano } from '@ton/core';
// import { CURRENT_TON_NETWORK } from '../constants';

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
  
//   // TON Connect integration - using the same hooks as SettingsComponent
//   const [tonConnectUI] = useTonConnectUI();
//   const connectedAddressString = useTonAddress();
//   const wallet = useTonWallet();
  
//   // Use the passed tonAddress prop as primary source, fallback to hook
//   const actualConnectedAddress = tonAddress || connectedAddressString;
//   const connected = !!actualConnectedAddress;

//   // Constants
//   const USD_AMOUNT = 15;
//   const RZC_REWARD = 150;
//   const tonAmountNeeded = USD_AMOUNT / tonPrice;
//   const RECEIVER_ADDRESS = CURRENT_TON_NETWORK.DEPOSIT_ADDRESS;

//   useEffect(() => {
//     loadActivationStatus();
//   }, [userId]);

//   // Debug connection state
//   useEffect(() => {
//     console.log('WalletActivationModal connection state:', {
//       connected,
//       actualConnectedAddress,
//       connectedAddressString,
//       tonAddressProp: tonAddress,
//       wallet: wallet?.device?.appName,
//       isProcessing,
//       paymentSent
//     });
//   }, [connected, actualConnectedAddress, connectedAddressString, tonAddress, wallet, isProcessing, paymentSent]);

//   const loadActivationStatus = async () => {
//     try {
//       const { data, error } = await supabase.rpc('get_wallet_activation_status', {
//         p_user_id: userId
//       });

//       if (error) {
//         console.error('Error loading activation status:', error);
//         return;
//       }

//       if (data?.success) {
//         setActivationStatus(data);
//       }
//     } catch (error) {
//       console.error('Error loading activation status:', error);
//     }
//   };

//   const handleActivateWallet = async () => {
//     console.log('Activate wallet clicked', { connected, actualConnectedAddress, isProcessing, paymentSent });
    
//     if (!connected || !actualConnectedAddress) {
//       console.error('Wallet not connected:', { connected, actualConnectedAddress });
//       showSnackbar?.({
//         message: 'Wallet Not Connected',
//         description: 'Please connect your TON wallet first',
//         type: 'error'
//       });
//       return;
//     }

//     if (isProcessing || paymentSent) {
//       console.log('Already processing or payment sent:', { isProcessing, paymentSent });
//       return;
//     }

//     setIsProcessing(true);
    
//     try {
//       // Validate receiver address
//       if (!RECEIVER_ADDRESS) {
//         throw new Error('Receiver address not configured');
//       }

//       // Create the transaction
//       const transaction = {
//         validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
//         messages: [
//           {
//             address: RECEIVER_ADDRESS,
//             amount: toNano(tonAmountNeeded.toFixed(4)).toString()
//             // Remove payload - it needs to be properly encoded or omitted
//           }
//         ]
//       };

//       console.log('Sending transaction:', transaction);
//       console.log('TON amount needed:', tonAmountNeeded);
//       console.log('Receiver address:', RECEIVER_ADDRESS);

//       // Check if tonConnectUI is available
//       if (!tonConnectUI) {
//         throw new Error('TON Connect UI not initialized');
//       }

//       // Send the transaction using tonConnectUI
//       const result = await tonConnectUI.sendTransaction(transaction);
      
//       console.log('Transaction result:', result);
      
//       if (result) {
//         setPaymentSent(true);
        
//         showSnackbar?.({
//           message: 'Payment Sent',
//           description: 'Processing wallet activation...',
//           type: 'info'
//         });
        
//         // Wait a moment for transaction to be processed
//         setTimeout(async () => {
//           try {
//             // Process the activation (you might want to verify the transaction first)
//             const activationResult = await supabase.rpc('process_wallet_activation', {
//               p_user_id: userId,
//               p_ton_amount: tonAmountNeeded,
//               p_ton_price: tonPrice,
//               p_transaction_hash: result.boc || 'direct_payment', // Use BOC or a placeholder
//               p_sender_address: actualConnectedAddress,
//               p_receiver_address: RECEIVER_ADDRESS
//             });

//             console.log('Activation result:', activationResult);

//             if (activationResult.error) {
//               throw activationResult.error;
//             }

//             if (activationResult.data?.success) {
//               showSnackbar?.({
//                 message: 'Wallet Activated!',
//                 description: `You received ${RZC_REWARD} RZC tokens. Welcome to RhizaCore!`,
//                 type: 'success'
//               });

//               await loadActivationStatus();
//               onActivationComplete();
//               onClose();
//             } else {
//               showSnackbar?.({
//                 message: 'Activation Failed',
//                 description: activationResult.data?.error || 'Failed to activate wallet',
//                 type: 'error'
//               });
//             }
//           } catch (error: any) {
//             console.error('Activation processing error:', error);
//             showSnackbar?.({
//               message: 'Processing Error',
//               description: 'Payment sent but activation failed. Please contact support.',
//               type: 'error'
//             });
//           } finally {
//             setIsProcessing(false);
//             setPaymentSent(false);
//           }
//         }, 3000); // Wait 3 seconds for transaction confirmation
        
//       } else {
//         throw new Error('Transaction failed - no result returned');
//       }
//     } catch (error: any) {
//       console.error('Payment error:', error);
//       setIsProcessing(false);
//       setPaymentSent(false);
      
//       if (error.message?.includes('user rejected') || error.message?.includes('User rejected')) {
//         showSnackbar?.({
//           message: 'Payment Cancelled',
//           description: 'You cancelled the payment',
//           type: 'info'
//         });
//       } else {
//         showSnackbar?.({
//           message: 'Payment Error',
//           description: error.message || 'Failed to send payment',
//           type: 'error'
//         });
//       }
//     }
//   };

//   // If wallet is already activated, show success state
//   if (activationStatus?.wallet_activated) {
//     return (
//       <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
//         <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose}></div>

//         <div className="bg-[#0a0a0a] border border-green-500/20 rounded-3xl w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
//           <div className="p-6 md:p-8 flex flex-col items-center justify-center h-full overflow-y-auto">
//             <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 border border-green-500/20 shrink-0">
//               <Icons.Check size={32} className="text-green-400" />
//             </div>
//             <h3 className="text-2xl font-bold text-white mb-2 text-center">Wallet Activated!</h3>
//             <p className="text-zinc-400 text-sm text-center mb-6">Your RhizaCore wallet is ready to use</p>

//             <div className="bg-green-500/5 rounded-2xl p-6 border border-green-500/10 mb-6 w-full">
//               <div className="text-center">
//                 <div className="text-green-400 text-3xl font-bold font-mono mb-2">
//                   {activationStatus.activation_details?.rzc_awarded || RZC_REWARD} RZC
//                 </div>
//                 <div className="text-zinc-500 text-sm">Activation Reward Received</div>
//               </div>

//               {activationStatus.activation_details && (
//                 <div className="mt-4 pt-4 border-t border-green-500/10">
//                   <div className="text-xs text-zinc-600 space-y-1 text-center">
//                     <div>Activated: {new Date(activationStatus.wallet_activated_at!).toLocaleDateString()}</div>
//                     <div>Transaction: {activationStatus.activation_details.transaction_hash.slice(0, 20)}...</div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <button
//               onClick={onClose}
//               className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-2xl text-sm font-bold transition-colors shrink-0"
//             >
//               Continue to Wallet
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
//       <div 
//         className="absolute inset-0 bg-black/95 backdrop-blur-sm" 
//         onClick={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//           onClose();
//         }}
//       ></div>

//       <div 
//         className="bg-[#0a0a0a] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom duration-300"
//         onClick={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//         }}
//       >
//         {/* Header - Fixed */}
//         <div className="p-5 border-b border-white/5 flex flex-col items-center shrink-0">
//           <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center mb-3 border border-blue-500/20">
//             <Icons.Lock size={24} className="text-blue-400" />
//           </div>
//           <h3 className="text-xl font-bold text-white mb-1">Activate Wallet</h3>
//           <p className="text-zinc-400 text-xs text-center px-4">Pay $15 in TON to unlock your RhizaCore wallet</p>
//         </div>

//         {/* Scrollable Content */}
//         <div className="overflow-y-auto p-5 space-y-5 custom-scrollbar">
//           {/* Activation Details */}
//           <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 space-y-3">
//             <div className="flex justify-between items-center text-sm">
//               <span className="text-zinc-400">Activation Fee</span>
//               <span className="text-white font-bold">${USD_AMOUNT} USD</span>
//             </div>

//             <div className="flex justify-between items-center text-sm">
//               <span className="text-zinc-400">TON Amount</span>
//               <span className="text-blue-400 font-bold font-mono">{tonAmountNeeded.toFixed(4)} TON</span>
//             </div>

//             <div className="flex justify-between items-center text-sm">
//               <span className="text-zinc-400">RZC Reward</span>
//               <span className="text-green-400 font-bold">{RZC_REWARD} RZC</span>
//             </div>

//             <div className="h-px bg-white/5 w-full"></div>

//             <div className="flex justify-between items-center text-xs">
//               <span className="text-zinc-500">Rate: 1 TON ≈ ${tonPrice.toFixed(2)}</span>
//             </div>
//           </div>

//           {/* Wallet Connection Status */}
//           <div className={`rounded-xl p-4 border ${
//             connected 
//               ? 'bg-green-500/5 border-green-500/10' 
//               : 'bg-yellow-500/5 border-yellow-500/10'
//           }`}>
//             <div className="flex items-center gap-3 mb-2">
//               <div className={`w-3 h-3 rounded-full ${
//                 connected ? 'bg-green-400' : 'bg-yellow-400'
//               }`}></div>
//               <span className={`font-bold text-sm ${
//                 connected ? 'text-green-300' : 'text-yellow-300'
//               }`}>
//                 {connected ? 'Wallet Connected' : 'Wallet Required'}
//               </span>
//             </div>
            
//             {connected && actualConnectedAddress ? (
//               <div className="text-xs text-zinc-400">
//                 <div className="font-mono">
//                   {Address.parse(actualConnectedAddress).toString().slice(0, 8)}...
//                   {Address.parse(actualConnectedAddress).toString().slice(-6)}
//                 </div>
//                 <div className="text-green-400 mt-1">Ready to pay {tonAmountNeeded.toFixed(4)} TON</div>
//                 {wallet && (
//                   <div className="text-blue-400 mt-1 text-xs">
//                     Connected via {wallet.device.appName}
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="text-xs text-yellow-200/80 mb-3">
//                 Connect your TON wallet to proceed with activation payment
//               </div>
//             )}
            
//             {/* TON Connect Button for non-connected state */}
//             {!connected && (
//               <div className="mt-3 relative z-10 space-y-2">
//                 <TonConnectButton className="ton-connect-button-custom w-full" />
//                 <div className="text-center">
//                   <span className="text-xs text-zinc-500">or</span>
//                 </div>
//                 <button
//                   onClick={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     tonConnectUI.openModal();
//                   }}
//                   className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold transition-all"
//                 >
//                   Alternative Connect
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Payment Status */}
//           {paymentSent && (
//             <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
//                 <span className="text-blue-300 font-bold text-sm">Processing Payment</span>
//               </div>
//               <div className="text-xs text-blue-200/80">
//                 Payment sent successfully. Verifying transaction and activating wallet...
//               </div>
//             </div>
//           )}

//           {/* Benefits */}
//           <div className="bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl p-4 border border-green-500/10">
//             <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
//               <Icons.Check size={14} className="text-green-400" />
//               What You Get
//             </h4>

//             <div className="space-y-2 text-xs">
//               <div className="flex items-center gap-2">
//                 <Icons.Wallet size={12} className="text-green-400" />
//                 <span className="text-zinc-300">Full wallet functionality unlocked</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Icons.Energy size={12} className="text-blue-400" />
//                 <span className="text-zinc-300">150 RZC tokens instantly credited</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Icons.Send size={12} className="text-purple-400" />
//                 <span className="text-zinc-300">Send & receive RZC tokens</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Icons.Boost size={12} className="text-yellow-400" />
//                 <span className="text-zinc-300">Access to staking & rewards</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Icons.Store size={12} className="text-pink-400" />
//                 <span className="text-zinc-300">RhizaCore marketplace access</span>
//               </div>
//             </div>
//           </div>

//           {/* Security Notice */}
//           <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10 flex gap-3 text-xs">
//             <Icons.Lock size={14} className="text-green-400 mt-0.5 shrink-0" />
//             <div className="text-green-200/80 leading-relaxed">
//               <strong className="text-green-200 block mb-0.5">Secure Payment</strong>
//               Direct wallet payment via TON Connect. Your funds are processed securely on the TON blockchain.
//             </div>
//           </div>

//           {/* Spacer for bottom padding in scroll view */}
//           <div className="h-2"></div>
//         </div>

//         {/* Footer Actions - Fixed */}
//         <div className="p-4 border-t border-white/5 bg-[#0a0a0a] rounded-b-3xl flex gap-3 shrink-0 modal-footer-buttons">
//           <button
//             onClick={(e) => {
//               e.preventDefault();
//               e.stopPropagation();
//               onClose();
//             }}
//             className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white py-3 rounded-xl text-sm font-bold transition-all"
//             style={{ pointerEvents: 'auto', zIndex: 12 }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={async (e) => {
//               console.log('Raw button click event triggered');
//               e.preventDefault();
//               e.stopPropagation();
              
//               console.log('Activation button clicked!', { 
//                 connected, 
//                 actualConnectedAddress, 
//                 isProcessing, 
//                 paymentSent,
//                 tonConnectUI: !!tonConnectUI,
//                 RECEIVER_ADDRESS 
//               });
              
//               if (!connected) {
//                 console.log('Not connected, showing error');
//                 showSnackbar?.({
//                   message: 'Wallet Not Connected',
//                   description: 'Please connect your TON wallet first',
//                   type: 'error'
//                 });
//                 return;
//               }
              
//               if (isProcessing || paymentSent) {
//                 console.log('Already processing or payment sent');
//                 return;
//               }
              
//               try {
//                 await handleActivateWallet();
//               } catch (error) {
//                 console.error('Error in button click handler:', error);
//               }
//             }}
//             disabled={isProcessing || !connected || paymentSent}
//             className="flex-[2] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-500/20"
//             style={{ pointerEvents: 'auto', zIndex: 12 }}
//           >
//             {isProcessing ? (
//               <div className="flex items-center justify-center gap-2">
//                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                 <span>{paymentSent ? 'Activating...' : 'Processing...'}</span>
//               </div>
//             ) : !connected ? (
//               'Connect Wallet First'
//             ) : (
//               `Pay ${tonAmountNeeded.toFixed(4)} TON`
//             )}
//           </button>
//         </div>
//       </div>
      
//       {/* Custom styles for TonConnectButton */}
//       <style dangerouslySetInnerHTML={{
//         __html: `
//           .ton-connect-button-custom {
//             --tc-bg-color: #3b82f6;
//             --tc-bg-color-hover: #2563eb;
//             --tc-text-color: #ffffff;
//             --tc-border-radius: 12px;
//             --tc-font-size: 12px;
//             --tc-font-weight: 600;
//             --tc-padding: 8px 16px;
//             --tc-min-height: 40px;
//             position: relative;
//             z-index: 1;
//           }
          
//           .ton-connect-button-custom button {
//             background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
//             border: 1px solid rgba(59, 130, 246, 0.3) !important;
//             color: white !important;
//             font-size: 12px !important;
//             font-weight: 600 !important;
//             padding: 10px 16px !important;
//             border-radius: 12px !important;
//             min-height: 40px !important;
//             transition: all 0.2s ease !important;
//             white-space: nowrap !important;
//             width: 100% !important;
//             position: relative !important;
//             z-index: 1 !important;
//             pointer-events: auto !important;
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

//           /* Ensure modal footer buttons are clickable */
//           .modal-footer-buttons {
//             position: relative;
//             z-index: 10;
//             pointer-events: auto;
//           }
          
//           .modal-footer-buttons button {
//             position: relative;
//             z-index: 11;
//             pointer-events: auto;
//           }

//           /* Custom scrollbar for modal */
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
// };

// export default WalletActivationModal;