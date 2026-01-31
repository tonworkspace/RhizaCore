// import React, { useState, useEffect } from 'react';
// import { useTON } from '../hooks/useTON';
// import TONDeposit from './TONDeposit';
// import TONAPIService from '../services/TONAPIService';
// import { Icons } from './Icon';

// interface TONIntegrationExampleProps {
//   userId: number;
//   userAddress?: string;
//   showSnackbar?: (data: { message: string; description?: string }) => void;
// }

// const TONIntegrationExample: React.FC<TONIntegrationExampleProps> = ({
//   userId,
//   userAddress,
//   showSnackbar
// }) => {
//   const [activeTab, setActiveTab] = useState<'balance' | 'deposit' | 'history'>('balance');
//   const [isProcessingDeposits, setIsProcessingDeposits] = useState(false);

//   const {
//     balance,
//     isLoading,
//     error,
//     transactions,
//     deposits,
//     networkInfo,
//     refreshBalance,
//     refreshTransactions,
//     refreshDeposits
//   } = useTON(userId, userAddress);

//   // Process pending deposits periodically
//   useEffect(() => {
//     const processPendingDeposits = async () => {
//       if (isProcessingDeposits) return;
      
//       setIsProcessingDeposits(true);
//       try {
//         await TONAPIService.processPendingDeposits();
//         await refreshDeposits();
//         await refreshBalance();
//       } catch (error) {
//         console.error('Error processing deposits:', error);
//       } finally {
//         setIsProcessingDeposits(false);
//       }
//     };

//     // Process deposits every 60 seconds
//     const interval = setInterval(processPendingDeposits, 60000);
    
//     // Process immediately on mount
//     processPendingDeposits();

//     return () => clearInterval(interval);
//   }, [refreshDeposits, refreshBalance, isProcessingDeposits]);

//   const handleDepositCreated = (depositId: number) => {
//     showSnackbar?.({
//       message: 'Deposit Created',
//       description: `Deposit ID: ${depositId}. Send TON to complete the deposit.`
//     });
//     refreshDeposits();
//   };

//   const pendingDeposits = deposits.filter(d => d.status === 'pending');
//   const confirmedDeposits = deposits.filter(d => d.status === 'confirmed');

//   return (
//     <div className="max-w-md mx-auto bg-gray-900 border border-white/10 rounded-2xl p-6">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h2 className="text-white text-xl font-bold">TON Wallet</h2>
//           <p className="text-gray-400 text-sm">
//             {networkInfo.networkName} Network
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className={`w-2 h-2 rounded-full ${networkInfo.isMainnet ? 'bg-green-500' : 'bg-orange-500'}`}></div>
//           <span className="text-xs font-mono text-gray-400">
//             {networkInfo.isMainnet ? 'MAIN' : 'TEST'}
//           </span>
//         </div>
//       </div>

//       {/* Tab Navigation */}
//       <div className="flex bg-white/5 p-1 rounded-lg mb-6">
//         <button
//           onClick={() => setActiveTab('balance')}
//           className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase transition-all ${
//             activeTab === 'balance'
//               ? 'bg-blue-500 text-white'
//               : 'text-gray-400 hover:text-white'
//           }`}
//         >
//           Balance
//         </button>
//         <button
//           onClick={() => setActiveTab('deposit')}
//           className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase transition-all ${
//             activeTab === 'deposit'
//               ? 'bg-blue-500 text-white'
//               : 'text-gray-400 hover:text-white'
//           }`}
//         >
//           Deposit
//         </button>
//         <button
//           onClick={() => setActiveTab('history')}
//           className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase transition-all ${
//             activeTab === 'history'
//               ? 'bg-blue-500 text-white'
//               : 'text-gray-400 hover:text-white'
//           }`}
//         >
//           History
//         </button>
//       </div>

//       {/* Tab Content */}
//       <div className="space-y-4">
//         {activeTab === 'balance' && (
//           <div className="space-y-4">
//             {/* Main Balance */}
//             <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-blue-400 text-xs font-bold uppercase">TON Balance</span>
//                 <button
//                   onClick={refreshBalance}
//                   disabled={isLoading}
//                   className="text-blue-400 hover:text-blue-300 transition-colors"
//                 >
//                   <Icons.Refresh size={14} className={isLoading ? 'animate-spin' : ''} />
//                 </button>
//               </div>
//               <div className="flex items-end gap-2 mb-2">
//                 <span className="text-white text-3xl font-bold">
//                   {balance.toFixed(4)}
//                 </span>
//                 <span className="text-blue-400 text-lg font-bold mb-1">TON</span>
//               </div>
//               {error && (
//                 <p className="text-red-400 text-xs">{error}</p>
//               )}
//             </div>

//             {/* Deposit Summary */}
//             <div className="grid grid-cols-2 gap-3">
//               <div className="bg-white/5 border border-white/10 rounded-lg p-3">
//                 <div className="flex items-center gap-2 mb-1">
//                   <Icons.Clock size={12} className="text-orange-400" />
//                   <span className="text-orange-400 text-xs font-bold">Pending</span>
//                 </div>
//                 <p className="text-white text-lg font-bold">
//                   {pendingDeposits.length}
//                 </p>
//               </div>
//               <div className="bg-white/5 border border-white/10 rounded-lg p-3">
//                 <div className="flex items-center gap-2 mb-1">
//                   <Icons.CheckCircle size={12} className="text-green-400" />
//                   <span className="text-green-400 text-xs font-bold">Confirmed</span>
//                 </div>
//                 <p className="text-white text-lg font-bold">
//                   {confirmedDeposits.length}
//                 </p>
//               </div>
//             </div>

//             {/* Processing Status */}
//             {isProcessingDeposits && (
//               <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
//                 <div className="flex items-center gap-2">
//                   <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
//                   <span className="text-blue-400 text-xs">Processing deposits...</span>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'deposit' && (
//           <TONDeposit
//             userId={userId}
//             userAddress={userAddress}
//             onDepositCreated={handleDepositCreated}
//             showSnackbar={showSnackbar}
//           />
//         )}

//         {activeTab === 'history' && (
//           <div className="space-y-4">
//             {/* Recent Transactions */}
//             <div>
//               <h4 className="text-white text-sm font-bold mb-3">Recent Transactions</h4>
//               {transactions.length > 0 ? (
//                 <div className="space-y-2">
//                   {transactions.slice(0, 5).map((tx, index) => (
//                     <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
//                       <div className="flex items-center justify-between mb-1">
//                         <span className="text-gray-400 text-xs">
//                           {new Date(tx.timestamp).toLocaleDateString()}
//                         </span>
//                         <span className="text-white text-sm font-bold">
//                           {parseFloat(tx.value).toFixed(4)} TON
//                         </span>
//                       </div>
//                       <p className="text-gray-500 text-xs font-mono truncate">
//                         {tx.hash}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-6">
//                   <Icons.History size={24} className="text-gray-500 mx-auto mb-2" />
//                   <p className="text-gray-500 text-sm">No transactions found</p>
//                 </div>
//               )}
//             </div>

//             {/* Deposit History */}
//             <div>
//               <h4 className="text-white text-sm font-bold mb-3">Deposit History</h4>
//               {deposits.length > 0 ? (
//                 <div className="space-y-2">
//                   {deposits.slice(0, 5).map((deposit) => (
//                     <div key={deposit.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
//                       <div className="flex items-center justify-between mb-1">
//                         <div className="flex items-center gap-2">
//                           <div className={`w-2 h-2 rounded-full ${
//                             deposit.status === 'confirmed' ? 'bg-green-500' :
//                             deposit.status === 'pending' ? 'bg-orange-500' :
//                             'bg-red-500'
//                           }`}></div>
//                           <span className="text-gray-400 text-xs">
//                             ID: {deposit.id}
//                           </span>
//                         </div>
//                         <span className="text-white text-sm font-bold">
//                           {deposit.amount} TON
//                         </span>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className="text-gray-500 text-xs">
//                           {new Date(deposit.created_at).toLocaleDateString()}
//                         </span>
//                         <span className={`text-xs font-bold uppercase ${
//                           deposit.status === 'confirmed' ? 'text-green-400' :
//                           deposit.status === 'pending' ? 'text-orange-400' :
//                           'text-red-400'
//                         }`}>
//                           {deposit.status}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-6">
//                   <Icons.Wallet size={24} className="text-gray-500 mx-auto mb-2" />
//                   <p className="text-gray-500 text-sm">No deposits found</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Footer Info */}
//       <div className="mt-6 pt-4 border-t border-white/10">
//         <div className="flex items-center justify-between text-xs text-gray-500">
//           <span>Deposit Address:</span>
//           <button
//             onClick={() => navigator.clipboard.writeText(networkInfo.depositAddress)}
//             className="font-mono hover:text-white transition-colors truncate max-w-[120px]"
//           >
//             {networkInfo.depositAddress.slice(0, 8)}...{networkInfo.depositAddress.slice(-8)}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TONIntegrationExample;