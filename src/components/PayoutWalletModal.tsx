// import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';
// import { AuthUser } from '../types/auth';

// interface PayoutWalletModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   user: AuthUser | null;
//   walletAddress?: string;
//   updateUserData: (user: AuthUser) => void;
//   showSnackbar: (params: { message: string; description: string }) => void;
// }

// const PayoutWalletModal: React.FC<PayoutWalletModalProps> = ({
//   isOpen,
//   onClose,
//   user,
//   walletAddress,
//   updateUserData,
//   showSnackbar
// }) => {
//   const [payoutWallet, setPayoutWallet] = useState('');
//   const [isSavingWallet, setIsSavingWallet] = useState(false);

//   useEffect(() => {
//     if (user?.payout_wallet) {
//       setPayoutWallet(user.payout_wallet);
//     }
//   }, [user, isOpen]);

//   const handleSavePayoutWallet = async () => {
//     if (!user?.id) return;
    
//     try {
//       setIsSavingWallet(true);
      
//       // Validate wallet address (basic validation)
//       if (!payoutWallet.startsWith('EQ') && !payoutWallet.startsWith('UQ')) {
//         showSnackbar({
//           message: 'Invalid Wallet',
//           description: 'Please enter a valid TON wallet address'
//         });
//         setIsSavingWallet(false);
//         return;
//       }
      
//       // Update in database
//       const { error } = await supabase
//         .from('users')
//         .update({ payout_wallet: payoutWallet })
//         .eq('id', user.id);
        
//       if (error) throw error;
      
//       // Update local user data
//       if (user) {
//         updateUserData({
//           ...user,
//           payout_wallet: payoutWallet
//         });
//       }
      
//       showSnackbar({
//         message: 'Wallet Saved',
//         description: 'Your payout wallet has been updated successfully'
//       });
      
//       onClose();
//     } catch (error) {
//       console.error('Error saving payout wallet:', error);
//       showSnackbar({
//         message: 'Error',
//         description: 'Failed to save your payout wallet. Please try again.'
//       });
//     } finally {
//       setIsSavingWallet(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//       <div className="bg-gradient-to-b from-[#1a1c2e] to-[#0d0f1d] rounded-xl w-full max-w-md border-2 border-yellow-500/20 shadow-xl shadow-yellow-500/10">
//         <div className="p-4">
//           {/* Header */}
//           <div className="flex justify-between items-center mb-4">
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 relative">
//                 <div className="absolute inset-0 bg-yellow-500/20 rounded-lg rotate-45 animate-pulse" />
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//                   </svg>
//                 </div>
//               </div>
//               <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//                 <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
//                   {user?.payout_wallet ? 'Edit Payout Wallet' : 'Set Payout Wallet'}
//                 </span>
//               </div>
//             </div>
//             <button 
//               onClick={onClose}
//               className="text-white/60 hover:text-white"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>

//           {/* Wallet Input */}
//           <div className="space-y-3 mb-4">
//             <div className="text-sm text-white/80 mb-1">
//               Enter your TON wallet address for receiving payouts:
//             </div>
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="EQ..."
//                 value={payoutWallet}
//                 onChange={(e) => setPayoutWallet(e.target.value.trim())}
//                 className="w-full px-4 py-3 bg-yellow-900/10 border border-yellow-500/20 rounded-lg 
//                   text-white placeholder-white/40 focus:outline-none focus:border-yellow-500/50"
//               />
//             </div>

//             {/* Use Connected Wallet Button */}
//             {walletAddress && (
//               <button
//                 onClick={() => setPayoutWallet(walletAddress)}
//                 className="w-full py-2 text-sm text-yellow-400 bg-yellow-500/10 rounded-lg border border-yellow-500/20
//                   hover:bg-yellow-500/20 transition-colors"
//               >
//                 Use Connected Wallet
//               </button>
//             )}

//             {/* Save Button */}
//             <button
//               onClick={handleSavePayoutWallet}
//               disabled={isSavingWallet || !payoutWallet.trim()}
//               className={`w-full py-3 pixel-corners font-medium transition-all duration-200 
//                 ${isSavingWallet || !payoutWallet.trim()
//                   ? 'bg-yellow-500/50 text-white/50 cursor-not-allowed'
//                   : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/25'
//                 }`}
//             >
//               {isSavingWallet ? 'Saving...' : 'Save Wallet Address'}
//             </button>
//           </div>

//           {/* Info Footer */}
//           <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
//             <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <span>Make sure to enter a valid TON wallet address to receive your payouts</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PayoutWalletModal; 