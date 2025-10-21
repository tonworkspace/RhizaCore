// import { useState, useEffect } from 'react';
// import { Address } from '@ton/core';
// import { getHttpEndpoint } from '@orbs-network/ton-access';
// import { TonClient } from '@ton/ton';
// import { MiningGame } from '@/utils/contract-build/MiningGame/tact_MiningGame';
// import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
// import { beginCell, toNano } from '@ton/core';

// // Mining game contract address
// const MINING_CONTRACT_ADDRESS = "EQDVgXOZeAz9Py5vQmXmRHH09tgy3nWPwh7fALJ1qkYSSyIz";

// interface MinerStats {
//     name: string;
//     level: number;
//     level_title: string;
//     mining_rate: number;
//     pickaxe_power: number;
//     minerals: number;
//     max_storage: number;
// }

// interface LevelRequirement {
//     next_level: number;
//     cost: bigint;
//     cost_string: string;
// }

// // Update the GameStats interface to include all possible stats
// interface GameStats {
//     total_minerals: number;
//     total_miners: number;
//     total_upgrades: number;
//     contract_balance: number;
// }

// // Add to props interface
// interface MiningGameComponentProps {
//     onStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error', hasMined: boolean) => void;
//     onMineSuccess?: () => Promise<void>;
// }

// export const MiningGameComponent = ({ onStatusChange, onMineSuccess }: MiningGameComponentProps = {}) => {
//     const [tonConnectUI] = useTonConnectUI();
//     const [isLoading, setIsLoading] = useState(true);
//     const [minerStats, setMinerStats] = useState<MinerStats | null>(null);
//     const [nextLevelReq, setNextLevelReq] = useState<LevelRequirement | null>(null);
//     const [miningStatus, setMiningStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
//     const [hasMined, setHasMined] = useState<boolean>(false);
//     const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
//     const userAddress = useTonAddress();
//     // Update to use the expanded GameStats interface
//     const [gameStats, setGameStats] = useState<GameStats | null>(null);

//     // Add this function to handle showing notifications
//     const showSnackbar = ({ message, description }: { message: string; description?: string }) => {
//         // You can implement this based on your app's notification system
//         console.log(message, description);
//         // If you have a global notification system, call it here
//         // For example: window.showNotification(message, description);
//     };

//     const handleMine = async () => {
//         if (!tonConnectUI || !tonConnectUI.account) {
//             showSnackbar({
//                 message: 'Wallet Not Connected',
//                 description: 'Please connect your wallet first'
//             });
//             return;
//         }

//         // Don't attempt to mine if already in loading state or on cooldown
//         if (miningStatus === 'loading' || cooldownRemaining > 0) {
//             return;
//         }

//         try {
//             setMiningStatus('loading');
//             const miningContractAddress = Address.parse(MINING_CONTRACT_ADDRESS);

//             // Generate a unique transaction ID to track this specific transaction
//             const txId = `mine-${Date.now()}`;
            
//             await tonConnectUI.sendTransaction({
//                 validUntil: Math.floor(Date.now() / 1000) + 60,
//                 messages: [
//                     {
//                         address: miningContractAddress.toString(),
//                         amount: toNano('0.05').toString(),
//                         payload: beginCell().storeUint(0, 32).storeStringTail("mine").endCell().toBoc().toString('base64'),
//                     },
//                 ],
//             });

//             // After transaction is sent, wait a moment and then refresh data
//             setTimeout(async () => {
//                 await loadMinerData();
//                 setMiningStatus('success');
//                 setHasMined(true);
//                 if (onMineSuccess) await onMineSuccess();
                
//                 // Start cooldown timer
//                 setCooldownRemaining(120); // 2 minutes cooldown
//                 const timer = setInterval(() => {
//                     setCooldownRemaining(prev => {
//                         if (prev <= 1) {
//                             clearInterval(timer);
//                             setMiningStatus('idle');
//                             setHasMined(false);
//                             return 0;
//                         }
//                         return prev - 1;
//                     });
//                 }, 1000);
//             }, 3000); // Wait 3 seconds for transaction to be processed
            
//         } catch (error) {
//             console.error('Error mining:', error);
//             setMiningStatus('error');
//             setTimeout(() => setMiningStatus('idle'), 3000);
//         }
//     };

//     const handleSellMinerals = async () => {
//         if (!tonConnectUI || !tonConnectUI.account) {
//             showSnackbar({
//                 message: 'Wallet Not Connected',
//                 description: 'Please connect your wallet first'
//             });
//             return;
//         }

//         try {
//             setMiningStatus('loading');
//             const miningContractAddress = Address.parse(MINING_CONTRACT_ADDRESS);

//             await tonConnectUI.sendTransaction({
//                 validUntil: Math.floor(Date.now() / 1000) + 60,
//                 messages: [
//                     {
//                         address: miningContractAddress.toString(),
//                         amount: toNano('0.05').toString(),
//                         payload: beginCell().storeUint(0, 32).storeStringTail("sell").endCell().toBoc().toString('base64'),
//                     },
//                 ],
//             });

//             setMiningStatus('success');
//             setTimeout(() => {
//                 setMiningStatus('idle');
//                 loadMinerData(); // Refresh data after selling
//             }, 3000);
            
//         } catch (error) {
//             console.error('Error selling minerals:', error);
//             setMiningStatus('error');
//             setTimeout(() => setMiningStatus('idle'), 3000);
//         }
//     };

//     const handleUpgradeMiner = async () => {
//         if (!tonConnectUI || !tonConnectUI.account || !nextLevelReq) {
//             showSnackbar({
//                 message: 'Wallet Not Connected or Level Data Missing',
//                 description: 'Please connect your wallet first'
//             });
//             return;
//         }

//         try {
//             setMiningStatus('loading');
//             const miningContractAddress = Address.parse(MINING_CONTRACT_ADDRESS);

//             await tonConnectUI.sendTransaction({
//                 validUntil: Math.floor(Date.now() / 1000) + 60,
//                 messages: [
//                     {
//                         address: miningContractAddress.toString(),
//                         amount: nextLevelReq.cost.toString(),
//                         payload: beginCell().storeUint(0, 32).storeStringTail("upgrade_miner").endCell().toBoc().toString('base64'),
//                     },
//                 ],
//             });

//             setMiningStatus('success');
//             setTimeout(() => {
//                 setMiningStatus('idle');
//                 loadMinerData(); // Refresh data after upgrading
//             }, 3000);
            
//         } catch (error) {
//             console.error('Error upgrading miner:', error);
//             setMiningStatus('error');
//             setTimeout(() => setMiningStatus('idle'), 3000);
//         }
//     };

//     const handleUpgradeStorage = async () => {
//         if (!tonConnectUI || !tonConnectUI.account) {
//             showSnackbar({
//                 message: 'Wallet Not Connected',
//                 description: 'Please connect your wallet first'
//             });
//             return;
//         }

//         try {
//             setMiningStatus('loading');
//             const miningContractAddress = Address.parse(MINING_CONTRACT_ADDRESS);

//             await tonConnectUI.sendTransaction({
//                 validUntil: Math.floor(Date.now() / 1000) + 60,
//                 messages: [
//                     {
//                         address: miningContractAddress.toString(),
//                         amount: toNano('0.2').toString(), // Cost for storage upgrade
//                         payload: beginCell().storeUint(0, 32).storeStringTail("upgrade_storage").endCell().toBoc().toString('base64'),
//                     },
//                 ],
//             });

//             setMiningStatus('success');
//             setTimeout(() => {
//                 setMiningStatus('idle');
//                 loadMinerData(); // Refresh data after upgrading
//             }, 3000);
            
//         } catch (error) {
//             console.error('Error upgrading storage:', error);
//             setMiningStatus('error');
//             setTimeout(() => setMiningStatus('idle'), 3000);
//         }
//     };

//     const loadMinerData = async () => {
//         try {
//             setIsLoading(true);
            
//             const endpoint = await getHttpEndpoint({ network: 'testnet' }); // Make sure we're using testnet
//             const client = new TonClient({ endpoint });
//             const address = Address.parse(MINING_CONTRACT_ADDRESS);
//             const contract = MiningGame.fromAddress(address);
//             const openedContract = client.open(contract);
            
//             try {
//                 const contractStats = await openedContract.getMinerStats();
//                 // Process contract stats and set to state
//                 setMinerStats({
//                     name: contractStats.name,
//                     level: Number(contractStats.level),
//                     level_title: contractStats.level_title,
//                     mining_rate: Number(contractStats.mining_rate),
//                     pickaxe_power: Number(contractStats.pickaxe_power),
//                     minerals: Number(contractStats.minerals),
//                     max_storage: Number(contractStats.max_storage)
//                 });
//             } catch (error) {
//                 console.warn("Using fallback miner stats:", error);
//                 // Use fallback values if contract call fails
//                 setMinerStats({
//                     name: "Default Miner",
//                     level: 1,
//                     level_title: "Novice Digger",
//                     mining_rate: 1,
//                     pickaxe_power: 5,
//                     minerals: 0,
//                     max_storage: 10000
//                 });
//             }
            
//             try {
//                 const contractLevelReq = await openedContract.getNextLevelRequirement();
//                 // Process level requirements and set to state
//                 setNextLevelReq({
//                     next_level: Number(contractLevelReq.next_level),
//                     cost: contractLevelReq.cost,
//                     cost_string: `${Number(contractLevelReq.cost) / 1e9} TON`
//                 });
//             } catch (error) {
//                 console.warn("Using fallback level requirements:", error);
//                 // Use fallback values if contract call fails
//                 setNextLevelReq({
//                     next_level: 2,
//                     cost: BigInt(200000000), // 0.2 TON
//                     cost_string: "0.2 TON"
//                 });
//             }
            
//             // Load all game stats in a more robust way
//             const stats: GameStats = {
//                 total_minerals: 0,
//                 total_miners: 0,
//                 total_upgrades: 0,
//                 contract_balance: 0
//             };
            
//             // Try to get contract balance
//             try {
//                 const contractBalance = await client.getBalance(address);
//                 stats.contract_balance = Number(contractBalance) / 1e9; // Convert to TON
//             } catch (error) {
//                 console.warn("Error fetching contract balance:", error);
//             }
            
//             // Try to get total minerals
//             try {
//                 const totalMineralsResult = await openedContract.getTotalMinerals();
//                 stats.total_minerals = Number(totalMineralsResult);
//             } catch (error) {
//                 console.warn("Error fetching total minerals:", error);
//             }
            
//             // Try to get total miners
//             try {
//                 // Replace getTotalMiners with a method that actually exists in your contract
//                 // If there's no specific getter for miners count, you can remove this block
//                 // or use a placeholder value
//                 stats.total_miners = 1; // Set to 1 or another default value
//             } catch (error) {
//                 console.warn("Error fetching total miners:", error);
//             }
            
//             // Try to get total upgrades
//             try {
//                 // This getter doesn't exist in your contract
//                 // Use a placeholder value instead
//                 stats.total_upgrades = 0; // Set to 0 or another default value
//             } catch (error) {
//                 console.warn("Error fetching total upgrades:", error);
//             }
            
//             // Set all game stats
//             setGameStats(stats);
            
//         } catch (error) {
//             console.error('Error loading miner data:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     useEffect(() => {
//         // Check if wallet is connected before loading data
//         if (userAddress) {
//             loadMinerData();
            
//             // Set up a refresh interval
//             const intervalId = setInterval(() => {
//                 loadMinerData();
//             }, 30000); // Refresh every 30 seconds
            
//             return () => clearInterval(intervalId);
//         }
//     }, [userAddress]);

//     useEffect(() => {
//         // Notify parent component of status changes
//         onStatusChange?.(miningStatus, hasMined);
//     }, [miningStatus, hasMined, onStatusChange]);

//     if (isLoading || !minerStats) {
//         return (
//             <div className="flex items-center justify-center py-8">
//                 <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             </div>
//         );
//     }

//     // Calculate storage fullness percentage
//     const storageFullnessPercentage = Math.min(100, Math.floor((minerStats.minerals / minerStats.max_storage) * 100));

//     return (
//         <div className="space-y-4 relative z-0">
//             {/* Mining Game Card */}
//             <div 
//                 className="relative overflow-hidden group bg-gradient-to-br from-black to-[#0A0A0A]
//                          rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 
//                          hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300"
//             >
//                 {/* Animated gradient background */}
//                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
//                 {/* Content */}
//                 <div className="relative">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-4">
//                             {/* Miner Icon with glow effect */}
//                             <div className="relative">
//                                 <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-300"></div>
//                                 <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 
//                                             ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all p-2 flex items-center justify-center">
//                                     <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                                     </svg>
//                                 </div>
//                             </div>
                            
//                             {/* Title and Description */}
//                             <div>
//                                 <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">
//                                     {minerStats.name}
//                                 </h3>
//                                 <p className="text-sm text-blue-300/70">
//                                     {minerStats.level_title} (Level {minerStats.level})
//                                 </p>
//                             </div>
//                         </div>

//                         {/* Stats */}
//                         <div className="flex flex-col items-end space-y-1">
//                             <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-1 rounded-full">
//                                 <span className="text-blue-400 font-bold">
//                                     {minerStats.minerals}
//                                 </span>
//                                 <span className="text-blue-400/70 font-medium">Minerals</span>
//                             </div>
//                             <span className="text-xs text-gray-400">Mining Rate: {minerStats.mining_rate}/sec</span>
//                         </div>
//                     </div>

//                     {/* Storage Bar */}
//                     <div className="mt-6">
//                         <div className="flex justify-between text-xs text-gray-400 mb-1">
//                             <span>Storage</span>
//                             <span>{minerStats.minerals} / {minerStats.max_storage}</span>
//                         </div>
//                         <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
//                             <div 
//                                 className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
//                                 style={{ width: `${storageFullnessPercentage}%` }}
//                             ></div>
//                         </div>
//                     </div>

//                     {/* Update Total Minerals Display */}
//                     <div className="mt-4 grid grid-cols-2 gap-4">
//                         {/* Total Minerals Display */}
//                         <div className="bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
//                             <div className="flex items-center space-x-2">
//                                 <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                                 </svg>
//                                 <div>
//                                     <span className="text-sm text-blue-300">Total Mined:</span>
//                                     <span className="text-lg font-bold text-blue-400 ml-2">
//                                         {gameStats?.total_minerals !== undefined 
//                                             ? gameStats.total_minerals.toLocaleString() 
//                                             : "Loading..."}
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
                        
//                         {/* Uncollected Minerals Display */}
//                         <div className="bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
//                             <div className="flex items-center space-x-2">
//                                 <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                 </svg>
//                                 <div>
//                                     <span className="text-sm text-green-300">Uncollected:</span>
//                                     <span className="text-lg font-bold text-green-400 ml-2">
//                                         {minerStats.minerals.toLocaleString()}
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="mt-6 grid grid-cols-2 gap-4">
//                         <button
//                             onClick={handleMine}
//                             disabled={miningStatus === 'loading' || cooldownRemaining > 0}
//                             className={`py-3 rounded-xl font-semibold text-sm transition-all duration-300
//                                 ${miningStatus === 'loading' || cooldownRemaining > 0
//                                     ? 'bg-gray-700/50 cursor-not-allowed text-gray-400' 
//                                     : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
//                                 } relative overflow-hidden`}
//                         >
//                             <div className="relative flex items-center justify-center space-x-2">
//                                 {cooldownRemaining > 0 ? (
//                                     <>
//                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                         </svg>
//                                         <span>Cooldown: {cooldownRemaining}s</span>
//                                     </>
//                                 ) : miningStatus === 'loading' ? (
//                                     <>
//                                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                                         <span>Mining...</span>
//                                     </>
//                                 ) : (
//                                     <>
//                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                                         </svg>
//                                         <span>Mine (+{minerStats.pickaxe_power})</span>
//                                     </>
//                                 )}
//                             </div>
//                         </button>
                        
//                         <button
//                             onClick={handleSellMinerals}
//                             disabled={miningStatus === 'loading' || minerStats.minerals === 0}
//                             className={`py-3 rounded-xl font-semibold text-sm transition-all duration-300
//                                 ${miningStatus === 'loading' || minerStats.minerals === 0
//                                     ? 'bg-gray-700/50 cursor-not-allowed text-gray-400' 
//                                     : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-500/25'
//                                 } relative overflow-hidden`}
//                         >
//                             <div className="relative flex items-center justify-center space-x-2">
//                                 {miningStatus === 'loading' ? (
//                                     <>
//                                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                                         <span>Processing...</span>
//                                     </>
//                                 ) : (
//                                     <>
//                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                         </svg>
//                                         <span>Sell Minerals</span>
//                                     </>
//                                 )}
//                             </div>
//                         </button>
//                     </div>

//                     {/* Upgrade Section */}
//                     <div className="mt-6 space-y-4">
//                         <h4 className="text-sm font-semibold text-gray-300">Upgrades</h4>
                        
//                         <div className="grid grid-cols-2 gap-4">
//                             <button
//                                 onClick={handleUpgradeMiner}
//                                 disabled={miningStatus === 'loading'}
//                                 className={`py-3 rounded-xl font-semibold text-sm transition-all duration-300
//                                     ${miningStatus === 'loading'
//                                         ? 'bg-gray-700/50 cursor-not-allowed text-gray-400' 
//                                         : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
//                                     } relative overflow-hidden`}
//                             >
//                                 <div className="relative flex items-center justify-center space-x-2">
//                                     {miningStatus === 'loading' ? (
//                                         <>
//                                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                                             <span>Processing...</span>
//                                         </>
//                                     ) : (
//                                         <>
//                                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                                             </svg>
//                                             <span>Upgrade Miner</span>
//                                         </>
//                                     )}
//                                 </div>
//                                 {nextLevelReq && (
//                                     <div className="text-xs mt-1 text-purple-300/70">
//                                         Level {nextLevelReq.next_level} - {nextLevelReq.cost_string}
//                                     </div>
//                                 )}
//                             </button>
                            
//                             <button
//                                 onClick={handleUpgradeStorage}
//                                 disabled={miningStatus === 'loading'}
//                                 className={`py-3 rounded-xl font-semibold text-sm transition-all duration-300
//                                     ${miningStatus === 'loading'
//                                         ? 'bg-gray-700/50 cursor-not-allowed text-gray-400' 
//                                         : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-amber-500/25'
//                                     } relative overflow-hidden`}
//                             >
//                                 <div className="relative flex items-center justify-center space-x-2">
//                                     {miningStatus === 'loading' ? (
//                                         <>
//                                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                                             <span>Processing...</span>
//                                         </>
//                                     ) : (
//                                         <>
//                                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//                                             </svg>
//                                             <span>Upgrade Storage</span>
//                                         </>
//                                     )}
//                                 </div>
//                                 <div className="text-xs mt-1 text-amber-300/70">
//                                     +5000 capacity - 0.2 TON
//                                 </div>
//                             </button>
//                         </div>
//                     </div>

//                     {/* Status Indicators */}
//                     {miningStatus === 'success' && (
//                         <div className="mt-4 text-center">
//                             <p className="text-green-400 text-sm animate-fade-in">
//                                 🎉 Operation completed successfully!
//                             </p>
//                         </div>
//                     )}
                    
//                     {miningStatus === 'error' && (
//                         <div className="mt-4 text-center">
//                             <p className="text-red-400 text-sm animate-fade-in">
//                                 ❌ There was an error processing your request. Please try again.
//                             </p>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Stats Card */}
//             <div className="bg-gradient-to-br from-black/50 to-[#0A0A0A]/50 rounded-xl p-4 border border-blue-500/10">
//                 <h4 className="text-sm font-semibold text-gray-300 mb-3">Miner Stats</h4>
                
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Mining Rate:</span>
//                             <span className="text-blue-400 ml-1">{minerStats.mining_rate}/sec</span>
//                         </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Pickaxe Power:</span>
//                             <span className="text-blue-400 ml-1">+{minerStats.pickaxe_power}</span>
//                         </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Storage:</span>
//                             <span className="text-blue-400 ml-1">{minerStats.max_storage}</span>
//                         </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Level:</span>
//                             <span className="text-blue-400 ml-1">{minerStats.level}</span>
//                         </div>
//                     </div>
//                 </div>
                
//                 <div className="mt-3 text-xs text-gray-400">
//                     <p>Mine minerals by clicking the Mine button or wait for automatic mining. Sell minerals to earn TON.</p>
//                 </div>
//             </div>

//             {/* Add Global Game Stats Card */}
//             <div className="bg-gradient-to-br from-black/50 to-[#0A0A0A]/50 rounded-xl p-4 border border-blue-500/10">
//                 <h4 className="text-sm font-semibold text-gray-300 mb-3">Global Game Stats</h4>
                
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Total Miners:</span>
//                             <span className="text-purple-400 ml-1">
//                                 {gameStats?.total_miners !== undefined ? gameStats.total_miners : "Loading..."}
//                             </span>
//                         </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Total Upgrades:</span>
//                             <span className="text-amber-400 ml-1">
//                                 {gameStats?.total_upgrades !== undefined ? gameStats.total_upgrades : "Loading..."}
//                             </span>
//                         </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Total Minerals:</span>
//                             <span className="text-blue-400 ml-1">
//                                 {gameStats?.total_minerals !== undefined 
//                                     ? gameStats.total_minerals.toLocaleString() 
//                                     : "Loading..."}
//                             </span>
//                         </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-2 text-sm">
//                         <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                         <div>
//                             <span className="text-gray-400">Contract Balance:</span>
//                             <span className="text-green-400 ml-1">
//                                 {gameStats?.contract_balance !== undefined 
//                                     ? `${gameStats.contract_balance.toFixed(2)} TON` 
//                                     : "Loading..."}
//                             </span>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }; 