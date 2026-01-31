// import { useState, useEffect } from 'react';
// import { Icons } from '../uicomponents/Icons';
// import { supabase } from '../lib/supabaseClient';

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
//   const [transactionHash, setTransactionHash] = useState('');
//   const [senderAddress, setSenderAddress] = useState('');
  
//   // Constants
//   const USD_AMOUNT = 15;
//   const RZC_REWARD = 150;
//   const tonAmountNeeded = USD_AMOUNT / tonPrice;
//   const RECEIVER_ADDRESS = "UQD8_4W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8"; // Replace with your actual TON address

//   useEffect(() => {
//     loadActivationStatus();
//   }, [userId]);

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
//     if (!transactionHash || !senderAddress) {
//       showSnackbar?.({
//         message: 'Missing Information',
//         description: 'Please provide transaction hash and sender address',
//         type: 'error'
//       });
//       return;
//     }

//     setIsProcessing(true);
//     try {
//       const { data, error } = await supabase.rpc('process_wallet_activation', {
//         p_user_id: userId,
//         p_ton_amount: tonAmountNeeded,
//         p_ton_price: tonPrice,
//         p_transaction_hash: transactionHash,
//         p_sender_address: senderAddress,
//         p_receiver_address: RECEIVER_ADDRESS
//       });

//       if (error) {
//         throw error;
//       }

//       if (data?.success) {
//         showSnackbar?.({
//           message: 'Wallet Activated!',
//           description: `You received ${RZC_REWARD} RZC tokens. Welcome to RhizaCore!`,
//           type: 'success'
//         });
        
//         await loadActivationStatus();
//         onActivationComplete();
//         onClose();
//       } else {
//         showSnackbar?.({
//           message: 'Activation Failed',
//           description: data?.error || 'Failed to activate wallet',
//           type: 'error'
//         });
//       }
//     } catch (error: any) {
//       console.error('Activation error:', error);
//       showSnackbar?.({
//         message: 'Activation Error',
//         description: error.message || 'An unexpected error occurred',
//         type: 'error'
//       });
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const copyToClipboard = async (text: string, label: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       showSnackbar?.({
//         message: 'Copied!',
//         description: `${label} copied to clipboard`,
//         type: 'info'
//       });
//     } catch (error) {
//       console.error('Failed to copy:', error);
//     }
//   };

//   // If wallet is already activated, show success state
//   if (activationStatus?.wallet_activated) {
//     return (
//       <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
//         <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose}></div>
        
//         <div className="bg-[#0a0a0a] border border-green-500/20 rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl">
//           <div className="text-center mb-6">
//             <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
//               <Icons.Check size={32} className="text-green-400" />
//             </div>
//             <h3 className="text-2xl font-bold text-white mb-2">Wallet Activated!</h3>
//             <p className="text-zinc-400 text-sm">Your RhizaCore wallet is ready to use</p>
//           </div>

//           <div className="bg-green-500/5 rounded-2xl p-6 border border-green-500/10 mb-6">
//             <div className="text-center">
//               <div className="text-green-400 text-3xl font-bold font-mono mb-2">
//                 {activationStatus.activation_details?.rzc_awarded || RZC_REWARD} RZC
//               </div>
//               <div className="text-zinc-500 text-sm">Activation Reward Received</div>
//             </div>
            
//             {activationStatus.activation_details && (
//               <div className="mt-4 pt-4 border-t border-green-500/10">
//                 <div className="text-xs text-zinc-600 space-y-1">
//                   <div>Activated: {new Date(activationStatus.wallet_activated_at!).toLocaleDateString()}</div>
//                   <div>Transaction: {activationStatus.activation_details.transaction_hash.slice(0, 20)}...</div>
//                 </div>
//               </div>
//             )}
//           </div>

//           <button 
//             onClick={onClose}
//             className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-2xl text-sm font-bold transition-colors"
//           >
//             Continue to Wallet
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
//       <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose}></div>
      
//       <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl">
//         {/* Header */}
//         <div className="text-center mb-6">
//           <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
//             <Icons.Lock size={32} className="text-blue-400" />
//           </div>
//           <h3 className="text-2xl font-bold text-white mb-2">Activate Wallet</h3>
//           <p className="text-zinc-400 text-sm">Pay $15 in TON to unlock your RhizaCore wallet</p>
//         </div>

//         {/* Activation Details */}
//         <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 mb-6 space-y-4">
//           <div className="flex justify-between items-center">
//             <span className="text-zinc-400 text-sm">Activation Fee</span>
//             <span className="text-white font-bold">${USD_AMOUNT} USD</span>
//           </div>
          
//           <div className="flex justify-between items-center">
//             <span className="text-zinc-400 text-sm">TON Amount</span>
//             <span className="text-blue-400 font-bold font-mono">{tonAmountNeeded.toFixed(4)} TON</span>
//           </div>
          
//           <div className="flex justify-between items-center">
//             <span className="text-zinc-400 text-sm">RZC Reward</span>
//             <span className="text-green-400 font-bold">{RZC_REWARD} RZC</span>
//           </div>
          
//           <div className="h-px bg-white/5 w-full"></div>
          
//           <div className="flex justify-between items-center">
//             <span className="text-zinc-400 text-sm">TON Price</span>
//             <span className="text-zinc-300 text-sm">${tonPrice.toFixed(2)}</span>
//           </div>
//         </div>

//         {/* Payment Instructions */}
//         <div className="bg-blue-500/5 rounded-2xl p-6 border border-blue-500/10 mb-6">
//           <h4 className="text-white font-bold mb-3 flex items-center gap-2">
//             <Icons.Energy size={16} className="text-blue-400" />
//             Payment Instructions
//           </h4>
          
//           <div className="space-y-3 text-sm">
//             <div>
//               <div className="text-zinc-400 mb-1">1. Send TON to this address:</div>
//               <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
//                 <span className="text-blue-400 font-mono text-xs break-all">{RECEIVER_ADDRESS}</span>
//                 <button
//                   onClick={() => copyToClipboard(RECEIVER_ADDRESS, 'Address')}
//                   className="ml-2 p-1 hover:bg-white/10 rounded"
//                 >
//                   <Icons.Copy size={14} className="text-zinc-400" />
//                 </button>
//               </div>
//             </div>
            
//             <div>
//               <div className="text-zinc-400 mb-1">2. Amount to send:</div>
//               <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
//                 <span className="text-green-400 font-mono font-bold">{tonAmountNeeded.toFixed(4)} TON</span>
//                 <button
//                   onClick={() => copyToClipboard(tonAmountNeeded.toFixed(4), 'Amount')}
//                   className="ml-2 p-1 hover:bg-white/10 rounded"
//                 >
//                   <Icons.Copy size={14} className="text-zinc-400" />
//                 </button>
//               </div>
//             </div>
            
//             <div className="text-zinc-500 text-xs">
//               3. After sending, provide the transaction details below
//             </div>
//           </div>
//         </div>

//         {/* Transaction Details Form */}
//         <div className="space-y-4 mb-6">
//           <div className="relative">
//             <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-xs font-bold uppercase tracking-widest z-10">
//               Transaction Hash
//             </label>
//             <input
//               type="text"
//               value={transactionHash}
//               onChange={(e) => setTransactionHash(e.target.value)}
//               placeholder="Enter TON transaction hash..."
//               className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
//             />
//           </div>
          
//           <div className="relative">
//             <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-xs font-bold uppercase tracking-widest z-10">
//               Your TON Address
//             </label>
//             <input
//               type="text"
//               value={senderAddress}
//               onChange={(e) => setSenderAddress(e.target.value)}
//               placeholder={tonAddress || "Enter your TON wallet address..."}
//               className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
//             />
//             {tonAddress && (
//               <button
//                 onClick={() => setSenderAddress(tonAddress)}
//                 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-blue-300"
//               >
//                 Use Connected
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex gap-3">
//           <button 
//             onClick={onClose}
//             className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl text-sm font-bold transition-colors"
//           >
//             Cancel
//           </button>
//           <button 
//             onClick={handleActivateWallet}
//             disabled={isProcessing || !transactionHash || !senderAddress}
//             className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
//           >
//             {isProcessing ? (
//               <div className="flex items-center justify-center gap-2">
//                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                 <span>Activating...</span>
//               </div>
//             ) : (
//               'Activate Wallet'
//             )}
//           </button>
//         </div>

//         {/* Security Notice */}
//         <div className="mt-4 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
//           <div className="flex items-start gap-2">
//             <Icons.Lock size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
//             <div className="text-xs text-yellow-200">
//               <div className="font-bold mb-1">Security Notice</div>
//               <div className="text-yellow-300/80">
//                 Only send TON to the official address above. Verify the transaction on TON blockchain before submitting.
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WalletActivationModal;