// import { useState, useEffect } from 'react';
// import { JettonBalance } from "@ton-api/client";
// // import { Address } from "@ton/core";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   X, 
//   // Send, 
//   // Download, 
//   Copy, 
//   Check, 
//   ExternalLink, 
//   // TrendingUp, 
//   // TrendingDown,
//   // BarChart3,
//   Clock,
//   ArrowUpRight,
//   ArrowDownLeft,
//   Shield,
//   // Star,
//   // Globe,
//   Eye,
//   EyeOff
// } from 'lucide-react';
// import { getJettonRegistryData, enhanceJettonData } from "../utils/jettonRegistry";
// import { toDecimals } from "../utility/decimals";
// import { formatTokenAmount } from "../utility/format";

// interface JettonDetailModalProps {
//   jetton: JettonBalance;
//   onClose: () => void;
//   onSend: (jetton: JettonBalance) => void;
//   onReceive: () => void;
// }

// interface Transaction {
//   id: string;
//   type: 'send' | 'receive';
//   amount: string;
//   address: string;
//   timestamp: number;
//   status: 'completed' | 'pending' | 'failed';
// }

// export const JettonDetailModal = ({ 
//   jetton, 
//   onClose, 
//   onSend, 
//   onReceive 
// }: JettonDetailModalProps) => {
//   const [hideBalance, setHideBalance] = useState(false);
//   const [copySuccess, setCopySuccess] = useState(false);
//   const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
//   const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

//   const registryData = getJettonRegistryData(jetton.jetton.address.toString());
//   const enhancedJetton = enhanceJettonData(jetton, registryData || undefined);
//   const jettonAmount = parseFloat(toDecimals(jetton.balance, jetton.jetton.decimals));
//   const usdValue = registryData?.verified && registryData.rateUsd > 0 
//     ? jettonAmount * registryData.rateUsd 
//     : 0;

//   // Mock transaction history (replace with real API call)
//   useEffect(() => {
//     setIsLoadingTransactions(true);
//     // Simulate loading transactions
//     setTimeout(() => {
//       setRecentTransactions([
//         {
//           id: '1',
//           type: 'receive',
//           amount: '1000.00',
//           address: 'EQBObyiP7EtGDBxWV--eZYAB-o8U8RuGL7kPZELbu-cTufNr',
//           timestamp: Date.now() - 86400000,
//           status: 'completed'
//         },
//         {
//           id: '2',
//           type: 'send',
//           amount: '250.50',
//           address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
//           timestamp: Date.now() - 172800000,
//           status: 'completed'
//         }
//       ]);
//       setIsLoadingTransactions(false);
//     }, 1000);
//   }, [jetton.jetton.address.toString()]);

//   const handleCopyAddress = async () => {
//     try {
//       await navigator.clipboard.writeText(jetton.jetton.address.toString());
//       setCopySuccess(true);
//       setTimeout(() => setCopySuccess(false), 2000);
//     } catch (err) {
//       console.error('Failed to copy address:', err);
//     }
//   };

//   const handleViewOnExplorer = () => {
//     const explorerUrl = `https://tonapi.io/jetton/${jetton.jetton.address.toString()}`;
//     window.open(explorerUrl, '_blank');
//   };

//   const formatTime = (timestamp: number) => {
//     const date = new Date(timestamp);
//     return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const formatAddress = (address: string) => {
//     return `${address.slice(0, 8)}...${address.slice(-8)}`;
//   };

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: 0.9, opacity: 0 }}
//           onClick={(e) => e.stopPropagation()}
//           className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl"
//         >
//           {/* Header */}
//           <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center overflow-hidden">
//                   {enhancedJetton.jetton.image ? (
//                     <img
//                       src={enhancedJetton.jetton.image}
//                       alt={enhancedJetton.jetton.name}
//                       className="w-12 h-12 rounded-xl object-cover"
//                       onError={(e) => {
//                         (e.target as HTMLImageElement).src = `https://via.placeholder.com/48/6366f1/ffffff?text=${enhancedJetton.jetton.symbol?.[0] || '?'}`
//                       }}
//                     />
//                   ) : (
//                     <span className="text-2xl font-bold text-white">{enhancedJetton.jetton.symbol?.[0] || '?'}</span>
//                   )}
//                 </div>
//                 <div>
//                   <div className="flex items-center gap-3">
//                     <h2 className="text-2xl font-bold text-white">{enhancedJetton.jetton.name}</h2>
//                     {enhancedJetton.jetton.verified && (
//                       <Shield className="w-5 h-5 text-green-400" />
//                     )}
//                   </div>
//                   <p className="text-slate-400 text-lg">{enhancedJetton.jetton.symbol}</p>
//                   {enhancedJetton.jetton.description && (
//                     <p className="text-slate-500 text-sm mt-1">{enhancedJetton.jetton.description}</p>
//                   )}
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-xl"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>
//           </div>

//           {/* Balance Section */}
//           <div className="p-6 border-b border-slate-700">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold text-white">Balance</h3>
//               <button
//                 onClick={() => setHideBalance(!hideBalance)}
//                 className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
//               >
//                 {hideBalance ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
//               </button>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-white mb-2">
//                 {hideBalance ? '••••••' : formatTokenAmount(jetton.balance, jetton.jetton.decimals, { maxDecimals: 6, trimInsignificant: true, smartCompactWords: true })}
//               </div>
//               <div className="text-xl text-slate-400">
//                 {hideBalance ? '••••••' : `$${usdValue.toFixed(2)} USD`}
//               </div>
//               {registryData?.verified && registryData.rateUsd > 0 && (
//                 <div className="text-sm text-slate-500 mt-2">
//                   ${registryData.rateUsd.toFixed(6)} per token
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="p-6 border-b border-slate-700">
//             <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <button
//                 onClick={() => onSend(jetton)}
//                 className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-white font-medium transition-all"
//               >
//                 <ArrowUpRight className="w-5 h-5" />
//                 Send
//               </button>
//               <button
//                 onClick={onReceive}
//                 className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl text-white font-medium transition-all"
//               >
//                 <ArrowDownLeft className="w-5 h-5" />
//                 Receive
//               </button>
//             </div>
//           </div>

//           {/* Token Info */}
//           <div className="p-6 border-b border-slate-700">
//             <h3 className="text-lg font-semibold text-white mb-4">Token Information</h3>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-400">Contract Address</span>
//                 <div className="flex items-center gap-2">
//                   <span className="text-white font-mono text-sm">{formatAddress(jetton.jetton.address.toString())}</span>
//                   <button
//                     onClick={handleCopyAddress}
//                     className="p-1 hover:bg-slate-700 rounded transition-colors"
//                   >
//                     {copySuccess ? (
//                       <Check className="w-4 h-4 text-green-400" />
//                     ) : (
//                       <Copy className="w-4 h-4 text-slate-400" />
//                     )}
//                   </button>
//                 </div>
//               </div>
              
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-400">Symbol</span>
//                 <span className="text-white font-medium">{enhancedJetton.jetton.symbol || 'N/A'}</span>
//               </div>
              
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-400">Decimals</span>
//                 <span className="text-white">{enhancedJetton.jetton.decimals}</span>
//               </div>
              
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-400">Total Supply</span>
//                 <span className="text-white">{enhancedJetton.jetton.totalSupply || 'Unknown'}</span>
//               </div>
              
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-400">Verification</span>
//                 <div className="flex items-center gap-2">
//                   {enhancedJetton.jetton.verified ? (
//                     <>
//                       <Shield className="w-4 h-4 text-green-400" />
//                       <span className="text-green-400 text-sm">Verified</span>
//                     </>
//                   ) : (
//                     <span className="text-amber-400 text-sm">Unverified</span>
//                   )}
//                 </div>
//               </div>
              
//               {enhancedJetton.jetton.website && (
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-400">Website</span>
//                   <a
//                     href={enhancedJetton.jetton.website}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
//                   >
//                     <ExternalLink className="w-4 h-4" />
//                     Visit
//                   </a>
//                 </div>
//               )}
              
//               {enhancedJetton.jetton.telegram && (
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-400">Telegram</span>
//                   <a
//                     href={enhancedJetton.jetton.telegram}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
//                   >
//                     <ExternalLink className="w-4 h-4" />
//                     Join
//                   </a>
//                 </div>
//               )}
              
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-400">View on Explorer</span>
//                 <button
//                   onClick={handleViewOnExplorer}
//                   className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
//                 >
//                   <ExternalLink className="w-4 h-4" />
//                   Open
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Recent Transactions */}
//           <div className="p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
//             {isLoadingTransactions ? (
//               <div className="space-y-3">
//                 {[1, 2, 3].map((i) => (
//                   <div key={i} className="p-3 bg-slate-800/60 rounded-xl animate-pulse">
//                     <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
//                     <div className="h-3 w-16 bg-slate-700 rounded"></div>
//                   </div>
//                 ))}
//               </div>
//             ) : recentTransactions.length > 0 ? (
//               <div className="space-y-3 max-h-48 overflow-y-auto">
//                 {recentTransactions.map((tx) => (
//                   <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
//                     <div className="flex items-center gap-3">
//                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                         tx.type === 'receive' ? 'bg-green-500/20' : 'bg-red-500/20'
//                       }`}>
//                         {tx.type === 'receive' ? (
//                           <ArrowDownLeft className="w-4 h-4 text-green-400" />
//                         ) : (
//                           <ArrowUpRight className="w-4 h-4 text-red-400" />
//                         )}
//                       </div>
//                       <div>
//                         <div className="text-white font-medium">
//                           {tx.type === 'receive' ? 'Received' : 'Sent'} {tx.amount} {enhancedJetton.jetton.symbol}
//                         </div>
//                         <div className="text-slate-400 text-sm">{formatAddress(tx.address)}</div>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-slate-400 text-sm">{formatTime(tx.timestamp)}</div>
//                       <div className={`text-xs ${
//                         tx.status === 'completed' ? 'text-green-400' : 
//                         tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
//                       }`}>
//                         {tx.status}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-slate-400">
//                 <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
//                 <p>No recent transactions</p>
//               </div>
//             )}
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// };
