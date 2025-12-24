// import React, { useState, useEffect, useCallback } from 'react';
// import { Wallet, RefreshCw, Eye, EyeOff, Zap, Layers, Globe } from 'lucide-react';
// import { useWalletAuth } from '@/contexts/AuthContext'; 
// import { getWalletBalance } from '../../lib/thirdwebAPI';
// import { CHAINS, formatTokenAmount, type TokenContract } from '../../lib/contracts';
// // import TokenChainSelector from '../ui/TokenChainSelector';
// import { useChainTokenPreference } from '../../hooks/useChainTokenPreference';

// interface Balance {
//   token: TokenContract;
//   balance: string;
//   formattedBalance: string;
//   usdValue?: string;
// }

// const BalanceDisplay: React.FC = () => {
//   const [balances, setBalances] = useState<Balance[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [showBalances, setShowBalances] = useState(true);
//   const [error, setError] = useState('');
//   const [showAllChains] = useState(false);

//   const { user } = useWalletAuth();
//   const { preference, } = useChainTokenPreference();
//   const { chainId: selectedChainId, tokenAddress: selectedTokenAddress } = preference;

//   const fetchBalances = useCallback(async (showSpinner = false) => {
//     if (!user?.wallet_address) return;

//     if (showSpinner) setIsRefreshing(true);
//     else setIsLoading(true);
//     setError('');

//     try {
//       const balancePromises: Promise<Balance>[] = [];

//       // Determine which chains and tokens to fetch
//       let chainsToFetch = CHAINS;
//       if (!showAllChains && selectedChainId) {
//         chainsToFetch = CHAINS.filter(chain => chain.id === selectedChainId);
//       }

//       // Fetch balances for selected chains and tokens
//       chainsToFetch.forEach(chain => {
//         let tokensToFetch = chain.tokens;
//         if (selectedTokenAddress) {
//           tokensToFetch = chain.tokens.filter(token => token.address === selectedTokenAddress);
//         }

//         tokensToFetch.forEach(token => {
//           const promise = getWalletBalance(
//             user.wallet_address,
//             token.chainId,
//             token.address
//           ).then(response => {
//             // Handle array result from getWalletBalance
//             const balanceData = Array.isArray(response.result) ? response.result[0] : response.result;
            
//             return {
//               token,
//               balance: balanceData?.value || '0',
//               formattedBalance: formatTokenAmount(balanceData?.value || '0', token.decimals),
//               usdValue: undefined // We could add price API integration here
//             };
//           }).catch(error => {
//             console.error(`Failed to fetch ${token.symbol} balance on ${chain.name}:`, error);
//             return {
//               token,
//               balance: '0',
//               formattedBalance: '0',
//               usdValue: undefined
//             };
//           });
          
//           balancePromises.push(promise);
//         });
//       });

//       const results = await Promise.all(balancePromises);
      
//       // Sort results by chain and token
//       const sortedResults = results.sort((a, b) => {
//         // Sort by chain ID first
//         if (a.token.chainId !== b.token.chainId) {
//           return a.token.chainId - b.token.chainId;
//         }
//         // Then by token symbol
//         return a.token.symbol.localeCompare(b.token.symbol);
//       });
      
//       // Filter out zero balances for cleaner display
//       const nonZeroBalances = sortedResults.filter(b => b.balance !== '0');
      
//       if (nonZeroBalances.length > 0) {
//         setBalances(nonZeroBalances);
//       } else {
//         // Show all results if no non-zero balances
//         setBalances(sortedResults);
//       }
//     } catch (error) {
//       console.error('Failed to fetch balances:', error);
//       setError('Failed to load balances');
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [user?.wallet_address, selectedChainId, selectedTokenAddress, showAllChains]);

//   useEffect(() => {
//     fetchBalances();
//   }, [fetchBalances]);

//   const handleRefresh = () => {
//     fetchBalances(true);
//   };

//   const toggleVisibility = () => {
//     setShowBalances(!showBalances);
//   };

//   // const handleChainSelect = (chainId: number) => {
//   //   updateChain(chainId);
//   // };

//   // const handleTokenSelect = (token: TokenContract) => {
//   //   updateToken(token);
//   // };

//   // const toggleShowAllChains = () => {
//   //   setShowAllChains(!showAllChains);
//   //   if (!showAllChains) {
//   //     updateChain(DEFAULT_CHAIN_ID);
//   //     // Reset token selection by updating with a dummy token
//   //     const defaultChain = CHAINS.find(c => c.id === DEFAULT_CHAIN_ID);
//   //     if (defaultChain?.tokens[0]) {
//   //       updateToken(defaultChain.tokens[0]);
//   //     }
//   //   } else {
//   //     updateChain(DEFAULT_CHAIN_ID);
//   //   }
//   // };

//   // // Create balance mapping for the selector
//   // const balanceMap = useMemo(() => {
//   //   const map: Record<string, string> = {};
//   //   balances.forEach(balance => {
//   //     map[balance.token.address] = balance.formattedBalance;
//   //   });
//   //   return map;
//   // }, [balances]);

//   const getTotalUSDValue = () => {
//     // For demo purposes, we'll assume 1 USDC/USDT = $1
//     return balances.reduce((total, balance) => {
//       if (balance.token.symbol === 'USDC' || balance.token.symbol === 'USDT') {
//         return total + parseFloat(balance.formattedBalance || '0');
//       }
//       return total;
//     }, 0).toFixed(2);
//   };

//   if (isLoading) {
//     return (
//       <div className="bg-gradient-to-br from-black via-gray-900 to-black border border-green-500/20 rounded-2xl p-6 shadow-2xl animate-pulse">
//         <div className="flex items-center justify-between mb-4">
//           <div className="h-6 bg-gray-800 rounded w-24"></div>
//           <div className="h-8 bg-gray-800 rounded w-8"></div>
//         </div>
//         <div className="space-y-3">
//           <div className="h-8 bg-gray-800 rounded w-32"></div>
//           <div className="h-4 bg-gray-800 rounded w-48"></div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gradient-to-br from-black via-gray-900 to-black border border-green-500/20 rounded-2xl p-6 shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center space-x-2">
//           <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
//             <Wallet className="h-5 w-5 text-green-400" />
//           </div>
//           <h2 className="text-lg font-bold text-white">Your Balance</h2>
//         </div>
        
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={toggleVisibility}
//             className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-colors"
//           >
//             {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//           </button>
//           <button
//             onClick={handleRefresh}
//             disabled={isRefreshing}
//             className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-colors disabled:opacity-50"
//           >
//             <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
//           </button>
//         </div>
//       </div>

//       {error ? (
//         <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
//           <p className="text-red-400 text-sm">{error}</p>
//           <button
//             onClick={() => fetchBalances()}
//             className="text-red-400 text-sm underline mt-2 hover:text-red-300"
//           >
//             Try again
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {/* Chain and Token Selector */}
//           {/* Total Value */}
//           <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
//             <div className="text-3xl font-bold text-green-300 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
//               {showBalances ? `$${getTotalUSDValue()}` : '••••••'}
//             </div>
//             <p className="text-sm text-green-400/70">Total USD value</p>
//           </div>

//           <div className="space-y-4 animate-fade-in-up">
//             <div className="bg-rhiza-900/20 border border-rhiza-500/20 p-4 rounded-xl">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-xl font-bold text-white">Rhizacore Network Live</h2>
//                 </div>
                
//                 <div className="grid grid-cols-3 gap-2">
//                   {[
//                     { icon: Globe, title: "Decentralized", desc: "99.9% uptime" },
//                     { icon: Layers, title: "Scalable", desc: "Infinite throughput" },
//                     { icon: Zap, title: "Instant", desc: "Sub-second finality" }
//                   ].map((feature, i) => (
//                     <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-rhiza-500/30 transition-colors text-center">
//                       <feature.icon className="w-5 h-5 text-rhiza-400 mx-auto mb-2" />
//                       <h3 className="text-xs font-semibold text-white mb-1">{feature.title}</h3>
//                       <p className="text-xs text-slate-400">{feature.desc}</p>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="text-center">
//                   <h3 className="text-sm text-rhiza-300 font-medium mb-1">Validation Program</h3>
//                   <p className="text-xs text-slate-300 leading-relaxed">
//                   The Validation Program rewards early adopters who anchor the network's security. 
//           By participating today, you solidify the Genesis block structure and earn 
//           validated status for future governance proposals.
//                   </p>
//                 </div>
//               </div>
//             </div>
//               {/* <Button className="w-full border-2 border-slate-600 hover:border-slate-500 bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white font-medium py-2 px-6 rounded-xl transition-all duration-200">
//               Begin Validation <ArrowRight className="w-5 h-5 inline ml-2" />
//               </Button> */}
//           </div>

//           {/* Individual Balances */}
//           <div className="space-y-3">
//             {balances.map((balance) => (
//               <div
//                 key={`${balance.token.chainId}-${balance.token.address}`}
//                 className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-xl border border-gray-700/50 hover:border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all duration-300"
//               >
//                 <div className="flex items-center space-x-3">
//                   <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
//                     <span className="text-white font-bold text-sm">
//                       {balance.token.symbol[0]}
//                     </span>
//                   </div>
//                   <div>
//                     <p className="font-semibold text-white">
//                       {balance.token.symbol}
//                     </p>
//                     <p className="text-sm text-gray-400">
//                       {balance.token.name}
//                     </p>
//                   </div>
//                 </div>
                
//                 <div className="text-right">
//                   <p className="font-bold text-green-300 tabular-nums">
//                     {showBalances ? balance.formattedBalance : '••••••'}
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     {CHAINS.find(c => c.id === balance.token.chainId)?.name}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {balances.length === 0 && (
//             <div className="text-center py-8">
//               <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-700/50">
//                 <Wallet className="h-8 w-8 text-gray-500" />
//               </div>
//               <p className="text-gray-400 font-medium mb-2">No balances to display</p>
//               <button
//                 onClick={() => fetchBalances()}
//                 className="text-green-400 text-sm hover:text-green-300 transition-colors"
//               >
//                 Refresh
//               </button>
//             </div>
//           )}

//           {/* Wallet Address */}
//           <div className="border-gray-700/50">
//             <p className="text-xs text-gray-500 mb-2">Wallet Address</p>
//             <div className="px-4 py-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
//               <p className="text-xs font-mono text-green-400/80 break-all">
//                 {user?.wallet_address}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BalanceDisplay;
