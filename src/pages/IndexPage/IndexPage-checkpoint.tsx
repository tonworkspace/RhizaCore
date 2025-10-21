// import { useTonConnectUI } from '@tonconnect/ui-react';
// import { toUserFriendlyAddress } from '@tonconnect/sdk';
// import { FC, useState, useEffect, useRef } from 'react';
// import { FaCoins, FaWallet, FaUserPlus, FaUserCog } from 'react-icons/fa';
// import { BiNetworkChart } from 'react-icons/bi';
// import { AiOutlineHome } from 'react-icons/ai';
// import { TonConnectButton, } from '@tonconnect/ui-react';
// import { useAuth } from '@/hooks/useAuth';
// import { supabase } from '@/lib/supabaseClient';
// import { OnboardingScreen } from './OnboardingScreen';
// import { toNano, fromNano } from "ton";
// import TonWeb from 'tonweb';
// import { Button } from '@telegram-apps/telegram-ui';
// import { Snackbar } from '@telegram-apps/telegram-ui';
// import ReferralSystem from '@/components/ReferralSystem';
// import TokenLaunchpad from '@/components/TokenLaunchpad';
// import { WithdrawalInfoModal } from '@/components/WithdrawalInfoModal';
// import { BsCoin } from 'react-icons/bs';
// import { GiScrollUnfurled } from 'react-icons/gi';
// import SocialTasks from '@/components/SocialTasks';
// import DailyUpdateCard from '@/components/DailyUpdateCard/DailyUpdateCard';
// import { GiParachute } from 'react-icons/gi';
// import { nova, toncoin } from '@/images';
// import { NFTMinter } from '@/components/NFTMinter';
// import AdminWithdrawalPanel from '@/components/AdminWithdrawalPanel';

// // Add this at the top of your file with other constants

// interface StatsCardProps {
//   title: string;
//   value: string | number;
//   subValue: React.ReactNode; // Changed from string to ReactNode
//   icon: JSX.Element;
//   bgColor: string;
//   className?: string;
// }

// const StatsCard: FC<StatsCardProps> = ({ title, value, subValue, icon, bgColor, className }) => (
//   <div className={`group relative overflow-hidden ${className}`}>
//   {/* Background with animated gradient */}
//   <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${bgColor} animate-gradient-slow`} />
  
//   {/* Animated border effect */}
//   <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
//     opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer" />
  
//   {/* Main content container */}
//   <div className="relative p-4 rounded-xl border border-white/10 backdrop-blur-sm 
//     bg-black/30 hover:bg-black/40 transition-all duration-300">
//     {/* Corner accents */}
//     <div className="absolute -top-px -left-px w-8 h-8">
//       <div className="absolute top-0 left-0 w-[1px] h-4 bg-gradient-to-b from-white/60 to-transparent" />
//       <div className="absolute top-0 left-0 h-[1px] w-4 bg-gradient-to-r from-white/60 to-transparent" />
//     </div>
//     <div className="absolute -top-px -right-px w-8 h-8">
//       <div className="absolute top-0 right-0 w-[1px] h-4 bg-gradient-to-b from-white/60 to-transparent" />
//       <div className="absolute top-0 right-0 h-[1px] w-4 bg-gradient-to-l from-white/60 to-transparent" />
//     </div>
//     <div className="absolute -bottom-px -left-px w-8 h-8">
//       <div className="absolute bottom-0 left-0 w-[1px] h-4 bg-gradient-to-t from-white/60 to-transparent" />
//       <div className="absolute bottom-0 left-0 h-[1px] w-4 bg-gradient-to-r from-white/60 to-transparent" />
//     </div>
//     <div className="absolute -bottom-px -right-px w-8 h-8">
//       <div className="absolute bottom-0 right-0 w-[1px] h-4 bg-gradient-to-t from-white/60 to-transparent" />
//       <div className="absolute bottom-0 right-0 h-[1px] w-4 bg-gradient-to-l from-white/60 to-transparent" />
//     </div>

//     {/* Content */}
//     <div className="space-y-3">
//       {/* Header with icon */}
//       <div className="flex items-center gap-2">
//         <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center
//           group-hover:scale-110 transition-transform duration-300`}>
//           {icon}
//         </div>
//         <span className="text-sm font-medium text-white/80">{title}</span>
//       </div>

//       {/* Value with animation */}
//       <div className="space-y-1">
//         <div className="text-xl font-bold text-white tracking-tight group-hover:scale-105 
//           transition-transform duration-300 origin-left">
//           {value}
//         </div>
//         {subValue && (
//           <div className="flex items-center gap-2">
//             <span className="text-sm text-white/50">{subValue}</span>
//             <div className="flex-grow h-[1px] bg-gradient-to-r from-white/10 to-transparent 
//               transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
//           </div>
//         )}
//       </div>
//     </div>

//     {/* Hover effect overlay */}
//     <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent 
//       opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
//   </div>
// </div>
// );

// // // Update the renderROIStats function
// // const renderROIStats = (currentROI: number) => {
// //   const dailyRate = currentROI * 100;
// //   const weeklyRate = dailyRate * 7;
// //   const monthlyRate = dailyRate * 30;
// //   const annualRate = dailyRate * 365;

// //   return (
// //     <div className="bg-white/5 rounded-lg p-3">
// //       <div className="flex items-center gap-1.5 mb-1">
// //         <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
// //         </svg>
// //         <span className="text-xs text-white/40">Earning Rates</span>
// //       </div>
// //       <div className="space-y-1">
// //         <div className="flex items-center justify-between">
// //           <span className="text-sm text-white/60">Daily</span>
// //           <span className="text-sm font-semibold text-green-400">
// //             +{dailyRate.toFixed(2)}%
// //           </span>
// //         </div>
// //         <div className="flex items-center justify-between">
// //           <span className="text-sm text-white/60">Weekly</span>
// //           <span className="text-sm font-semibold text-green-400">
// //             +{weeklyRate.toFixed(2)}%
// //           </span>
// //         </div>
// //         <div className="flex items-center justify-between">
// //           <span className="text-sm text-white/60">Monthly</span>
// //           <span className="text-sm font-semibold text-green-400">
// //             +{monthlyRate.toFixed(2)}%
// //           </span>
// //         </div>
// //         <div className="flex items-center justify-between">
// //           <span className="text-sm text-white/60">Annual</span>
// //           <span className="text-sm font-semibold text-green-400">
// //             +{annualRate.toFixed(2)}%
// //           </span>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };


// type CardType = 'stats' | 'activity' | 'community';

// // Add this type definition at the top of the file
// type ActivityType = 
//   | 'deposit' 
//   | 'withdrawal' 
//   | 'stake' 
//   | 'redeposit' 
//   | 'nova_reward' 
//   | 'nova_income'
//   | 'offline_reward'
//   | 'earnings_update'
//   | 'claim'
//   | 'transfer'
//   | 'reward'
//   | 'bonus'
//   | 'top_up'; // Add this new type

// // Add these interfaces
// interface Activity {
//   id: string;
//   user_id: string;
//   type: ActivityType;
//   amount: number;
//   status: string;
//   created_at: string;
// }

// // // Add this new component
// // const RankBadge: FC<{ rank: string }> = ({ rank }) => {
// //   const getRankColor = (rank: string): string => {
// //     switch (rank) {
// //       case 'Novice': return 'bg-gray-500/20 text-gray-400';
// //       case 'Ambassador': return 'bg-green-500/20 text-green-400';
// //       case 'Warrior': return 'bg-blue-500/20 text-blue-400';
// //       case 'Master': return 'bg-purple-500/20 text-purple-400';
// //       case 'Cryptomogul': return 'bg-yellow-500/20 text-yellow-400';
// //       case 'TON Baron': return 'bg-orange-500/20 text-orange-400';
// //       case 'Tycoon': return 'bg-red-500/20 text-red-400';
// //       case 'TON Elite': return 'bg-pink-500/20 text-pink-400';
// //       case 'Final Boss': return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400';
// //       default: return 'bg-gray-500/20 text-gray-400';
// //     }
// //   };

// //   return (
// //     <div className={`px-3 py-1 rounded-full ${getRankColor(rank)} font-medium text-xs`}>
// //       {rank}
// //     </div>
// //   );
// // };

// // Add these constants for both networks
// const MAINNET_DEPOSIT_ADDRESS = 'UQA87z9UyLuHlZigPZlBDQgYmEENvktnkYkEvP0CJaVf8E3u';
// const TESTNET_DEPOSIT_ADDRESS = 'UQA87z9UyLuHlZigPZlBDQgYmEENvktnkYkEvP0CJaVf8E3u';

// const isMainnet = true; // You can toggle this for testing

// // Use the appropriate address based on network
// const DEPOSIT_ADDRESS = isMainnet ? MAINNET_DEPOSIT_ADDRESS : TESTNET_DEPOSIT_ADDRESS;

// // Constants for both networks
// const MAINNET_API_KEY = '26197ebc36a041a5546d69739da830635ed339c0d8274bdd72027ccbff4f4234';
// const TESTNET_API_KEY = 'd682d9b65115976e52f63713d6dd59567e47eaaa1dc6067fe8a89d537dd29c2c';

// // Use toncenter.com as HTTP API endpoint to interact with TON blockchain
// const tonweb = isMainnet ?
//     new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {apiKey: MAINNET_API_KEY})) :
//     new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: TESTNET_API_KEY}));



// // Add this near the top with other constants
// const NETWORK_NAME = isMainnet ? 'Mainnet' : 'Testnet';

// // Helper function to generate unique ID
// const generateUniqueId = async () => {
//   let attempts = 0;
//   const maxAttempts = 5;
  
//   while (attempts < maxAttempts) {
//     // Generate a random ID between 1 and 999999
//     const id = Math.floor(Math.random() * 999999) + 1;
    
//     // Check if ID exists
//     const { error } = await supabase
//       .from('deposits')
//       .select('id')
//       .eq('id', id)
//       .single();
      
//     if (error && error.code === 'PGRST116') {  // No rows returned
//       return id;  // Return as number, not string
//     }
    
//     attempts++;
//   }
  
//   throw new Error('Could not generate unique deposit ID');
// };

// // Add these types and interfaces near other interfaces
// interface SnackbarConfig {
//   message: string;
//   description?: string;
//   duration?: number;
// }

// // Add these constants near other constants
// const SNACKBAR_DURATION = 5000; // 5 seconds

// // Add these new interfaces
// interface LocalEarningState {
//   lastUpdate: number;
//   currentEarnings: number;
//   baseEarningRate: number;
//   isActive: boolean;
//   startDate?: number;
// }

// // Add these constants
// const EARNINGS_SYNC_INTERVAL = 60000; // Sync with server every 60 seconds
// const EARNINGS_STORAGE_KEY = 'userEarnings';
// const EARNINGS_UPDATE_INTERVAL = 1000; // Update UI every second

// // Add this interface near other interfaces
// interface OfflineEarnings {
//   lastActiveTimestamp: number;
//   baseEarningRate: number;
// }

// // Add this constant near other constants
// const OFFLINE_EARNINGS_KEY = 'offline_earnings_state';

// // // Add this constant near other constants
// // const TOTAL_EARNED_KEY = 'total_earned_state';

// // Add these constants at the top
// const LOCK_PERIOD_DAYS = 100;
// const LOCK_PERIOD_MS = LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// // Update the calculateStakingProgress function
// const calculateStakingProgress = (depositDate: Date | string | null): number => {
//   if (!depositDate) return 0;
  
//   // Convert string to Date if necessary
//   const startDate = typeof depositDate === 'string' ? new Date(depositDate) : depositDate;
  
//   // Validate the date
//   if (isNaN(startDate.getTime())) return 0;

//   const now = Date.now();
//   const startTime = startDate.getTime();
//   const endTime = startTime + LOCK_PERIOD_MS;
  
//   // Handle edge cases
//   if (now >= endTime) return 100;
//   if (now <= startTime) return 0;
  
//   // Calculate progress
//   const progress = ((now - startTime) / (endTime - startTime)) * 100;
//   return Math.min(Math.max(progress, 0), 100); // Ensure between 0 and 100
// };

// // Add these helper functions
// const saveOfflineEarnings = (state: OfflineEarnings) => {
//   localStorage.setItem(OFFLINE_EARNINGS_KEY, JSON.stringify(state));
// };

// const loadOfflineEarnings = (): OfflineEarnings | null => {
//   const stored = localStorage.getItem(OFFLINE_EARNINGS_KEY);
//   return stored ? JSON.parse(stored) : null;
// };


// // Add these constants at the top
// // const USER_SESSION_KEY = 'userSession';
// const EARNINGS_KEY_PREFIX = 'userEarnings_';
// const LAST_SYNC_PREFIX = 'lastSync_';

// // // Add session management functions
// // const saveUserSession = (userId: number) => {
// //   localStorage.setItem(USER_SESSION_KEY, userId.toString());
// // };

// // const getUserSession = (): number | null => {
// //   const session = localStorage.getItem(USER_SESSION_KEY);
// //   return session ? Number(session) : null;
// // };

// // const clearUserSession = () => {
// //   const userId = getUserSession();
// //   if (userId) {
// //     localStorage.removeItem(USER_SESSION_KEY);
// //     localStorage.removeItem(`${EARNINGS_KEY_PREFIX}${userId}`);
// //     localStorage.removeItem(`${LAST_SYNC_PREFIX}${userId}`);
// //   }
// // };

// // Update storage keys to be user-specific
// const getUserEarningsKey = (userId: number) => `${EARNINGS_KEY_PREFIX}${userId}`;
// const getUserSyncKey = (userId: number) => `${LAST_SYNC_PREFIX}${userId}`;

// // Update syncEarningsToDatabase
// const syncEarningsToDatabase = async (userId: number, earnings: number) => {
//   try {
//     const lastSync = localStorage.getItem(getUserSyncKey(userId));
//     const now = Date.now();
    
//     if (!lastSync || (now - Number(lastSync)) > SYNC_INTERVAL) {
//       await supabase
//         .from('user_earnings')
//         .upsert({
//           user_id: userId,
//           current_earnings: earnings,
//           last_update: new Date().toISOString()
//         }, {
//           onConflict: 'user_id'
//         });
      
//       localStorage.setItem(getUserSyncKey(userId), now.toString());
//     }
//   } catch (error) {
//     console.error('Silent sync error:', error);
//   }
// };


// export const IndexPage: FC = () => {

//   const [currentTab, setCurrentTab] = useState('home');
//   const [showDepositModal, setShowDepositModal] = useState(false);
//   const { user, isLoading, error, updateUserData } = useAuth();
//   // const userAddress = useTonAddress();
//   const [userFriendlyAddress, setUserFriendlyAddress] = useState<string | null>(null);
//   const [tonConnectUI] = useTonConnectUI();
//   // const isWalletConnected = tonConnectUI.connected;
//   const [hasStaked, setHasStaked] = useState(() => {
//     return Boolean(user?.balance && user.balance >= 1);
//   });

//   const [isStakingCompleted, setIsStakingCompleted] = useState(() => {
//     return localStorage.getItem('isStakingCompleted') === 'true';
//   });

//   // Update useEffect that watches user balance
//   useEffect(() => {
//     if (user?.balance && user.balance >= 1 && !isStakingCompleted) {
//       setHasStaked(true);
//       setIsStakingCompleted(true);
//       localStorage.setItem('isStakingCompleted', 'true');
//     }
//   }, [user?.balance, isStakingCompleted]);

  
//   useEffect(() => {
//     if (tonConnectUI.account) {
//       const rawAddress = tonConnectUI.account.address;
//       const friendlyAddress = toUserFriendlyAddress(rawAddress);
//       setUserFriendlyAddress(friendlyAddress);
//     }
//   }, [tonConnectUI]);

//   const [activeCard, setActiveCard] = useState<CardType>('stats');
//   const [currentROI, ] = useState<number>(0.01); // 1% daily default
//   const [tonPrice, setTonPrice] = useState(0);
//   const [tonPriceChange, setTonPriceChange] = useState(0);
//   const [showOnboarding, setShowOnboarding] = useState(false);

//   // Add state for activities
//   const [activities, setActivities] = useState<Activity[]>([]);
//   const [isLoadingActivities, setIsLoadingActivities] = useState(false);

//   const [depositStatus, setDepositStatus] = useState('idle');

//   // Add these state variables near the top with other state declarations
//   const [walletBalance, setWalletBalance] = useState<string>('0');
//   const [isLoadingBalance, setIsLoadingBalance] = useState(true);

//   // Add these state variables
//   const [isSnackbarVisible, setSnackbarVisible] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarDescription, setSnackbarDescription] = useState('');
//   const snackbarTimeoutRef = useRef<NodeJS.Timeout>();

//   // Add this state for custom amount
//   const [customAmount, setCustomAmount] = useState('');

//   // Update the earning system in the IndexPage component
//   const [earningState, setEarningState] = useState<LocalEarningState>({
//     lastUpdate: Date.now(),
//     currentEarnings: 0,
//     baseEarningRate: 0,
//     isActive: false,
//   });

//   // Add these state variables to your component
// const [showNFTMinterModal, setShowNFTMinterModal] = useState(false);
// const [nftMintStatus, setNftMintStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
// const [hasNFTPass, setHasNFTPass] = useState(localStorage.getItem('hasClaimedNFTPass') === 'true');

// // Add this function to handle NFT minting success
// const handleNFTMintSuccess = async (): Promise<void> => {
//   setHasNFTPass(true);
//   localStorage.setItem('hasClaimedNFTPass', 'true');
  
//   // Close the modal after successful mint
//   setShowNFTMinterModal(false);
  
//   // Show success message
//   showSnackbar({
//     message: 'NFT Minted Successfully',
//     description: 'You have earned 25,000 NOVA tokens!'
//   });
// };

//   const handleSetPayoutWallet = async (walletAddress: string) => {
//     try {
//       // Show loading snackbar
//       showSnackbar({
//         message: 'Updating Wallet',
//         description: 'Setting your payout wallet address...'
//       });
  
//       // Update the user's payout wallet in the database
//       const { error } = await supabase
//         .from('users')
//         .update({ payout_wallet: walletAddress })
//         .eq('id', user?.id);
  
//       if (error) throw error;
  
//       // Update local user state
//       if (user) {
//         updateUserData({
//           ...user,
//           payout_wallet: walletAddress
//         });
//       }
  
//       // Show success message
//       showSnackbar({
//         message: 'Wallet Updated',
//         description: 'Your payout wallet has been successfully set.'
//       });
  
//       return true;
//     } catch (error) {
//       console.error('Failed to set payout wallet:', error);
//       showSnackbar({
//         message: 'Update Failed',
//         description: 'There was an error setting your payout wallet. Please try again.'
//       });
//       throw error;
//     }
//   };

//   // Add function to save earning state to localStorage
//   const saveEarningState = (state: LocalEarningState) => {
//     try {
//       localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(state));
//     } catch (error) {
//       console.error('Error saving earning state:', error);
//     }
//   };


//   // Add these states at the top of your component
// const [isClaimingReward, setIsClaimingReward] = useState(false);
// const [hasClaimedReward, setHasClaimedReward] = useState(() => {
//   return localStorage.getItem('hasClaimedWalletReward') === 'true';
// });

// // Function to handle claiming rewards
// const handleClaimReward = async () => {
//   if (!tonConnectUI.connected || hasClaimedReward || isClaimingReward) {
//     return;
//   }
  
//   setIsClaimingReward(true);
  
//   try {
//     // Simulate API call or blockchain transaction
//     await new Promise(resolve => setTimeout(resolve, 1500));
    
//     // Update user state with the new NOVA tokens
//     if (user) {
//       const updatedUser = {
//         ...user,
//         total_sbt: (user.total_sbt || 0) + 10000
//       };
      
//       updateUserData(updatedUser);
//     }
    
//     // Add to activity log
//     const newActivity: Activity = {
//       id: Date.now().toString(),
//       user_id: String(user?.id || ''),
//       type: 'nova_reward',
//       amount: 10000,
//       status: 'completed',
//       created_at: new Date().toISOString()
//     };
    
//     setActivities(prev => [newActivity, ...prev]);
    
//     // Mark as claimed in localStorage to persist across sessions
//     localStorage.setItem('hasClaimedWalletReward', 'true');
//     setHasClaimedReward(true);
    
//     // Show success message
//     showSnackbar({
//       message: 'Reward Claimed!',
//       description: 'You have received 10,000 NOVA tokens'
//     });
    
//   } catch (error) {
//     console.error('Error claiming reward:', error);
//     showSnackbar({
//       message: 'Claim Failed',
//       description: 'There was an error claiming your reward. Please try again.'
//     });
//   } finally {
//     setIsClaimingReward(false);
//   }
// };

// // // Function to update user balance in the database
// // const updateUserBalance = async (userId: string, newBalance: number) => {
// //   try {
// //     const { error } = await supabase
// //       .from('users')
// //       .update({ total_sbt: newBalance })
// //       .eq('id', userId);
      
// //     if (error) {
// //       console.error('Error updating user balance:', error);
// //       throw error;
// //     }
    
// //     return true;
// //   } catch (error) {
// //     console.error('Failed to update user balance:', error);
// //     return false;
// //   }
// // };

//   // Add this state near other state declarations
// const [isClaimingEarnings, setIsClaimingEarnings] = useState(false);

// // Add these constants near other constants
// const CLAIM_COOLDOWN_KEY = 'claim_cooldown';
// const CLAIM_COOLDOWN_DURATION = 1800; // 30 minutes in seconds

// // Update state for cooldown
// const [claimCooldown, setClaimCooldown] = useState(0);

// // Add effect to handle cooldown timer and persistence
// useEffect(() => {
//   // Load saved cooldown on mount
//   const loadCooldown = () => {
//     try {
//       const savedCooldownEnd = localStorage.getItem(CLAIM_COOLDOWN_KEY);
//       if (savedCooldownEnd) {
//         const endTime = parseInt(savedCooldownEnd, 10);
//         const now = Math.floor(Date.now() / 1000);
//         const remainingTime = Math.max(0, endTime - now);
        
//         // Only set cooldown if there's actual time remaining
//         if (remainingTime > 0) {
//           setClaimCooldown(remainingTime);
//           return true;
//         } else {
//           // Clean up expired cooldown
//           localStorage.removeItem(CLAIM_COOLDOWN_KEY);
//         }
//       }
//       return false;
//     } catch (error) {
//       console.error('Error loading cooldown:', error);
//       return false;
//     }
//   };
  
//   // Initial load
//   loadCooldown();
  
//   // Set up timer only if cooldown is active
//   let timer: NodeJS.Timeout | null = null;
  
//   if (claimCooldown > 0) {
//     // Save end time to localStorage (only on initial set, not every tick)
//     if (!localStorage.getItem(CLAIM_COOLDOWN_KEY)) {
//       const endTime = Math.floor(Date.now() / 1000) + claimCooldown;
//       localStorage.setItem(CLAIM_COOLDOWN_KEY, endTime.toString());
//     }
    
//     // Update every second
//     timer = setInterval(() => {
//       setClaimCooldown(prev => {
//         const newValue = Math.max(0, prev - 1);
//         if (newValue === 0) {
//           // Clear from localStorage when done
//           localStorage.removeItem(CLAIM_COOLDOWN_KEY);
//           // Play a sound or show notification that claiming is available again
//           showSnackbar({
//             message: 'Claim Available',
//             description: 'You can now claim your earnings again!'
//           });
//         }
//         return newValue;
//       });
//     }, 1000);
//   }
  
//   // Handle visibility change (tab focus/blur)
//   const handleVisibilityChange = () => {
//     if (document.visibilityState === 'visible') {
//       // Recalculate cooldown when tab becomes visible again
//       loadCooldown();
//     }
//   };
  
//   document.addEventListener('visibilitychange', handleVisibilityChange);
  
//   // Cleanup
//   return () => {
//     if (timer) clearInterval(timer);
//     document.removeEventListener('visibilitychange', handleVisibilityChange);
//   };
// }, [claimCooldown]);

// // Helper function to format time as mm:ss or hh:mm:ss for longer durations
// const formatCooldownTime = (seconds: number): string => {
//   if (seconds <= 0) return '00:00';
  
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const remainingSeconds = seconds % 60;
  
//   if (hours > 0) {
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
//   } else {
//     return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
//   }
// };

// // Add this handler function
// const handleClaimEarnings = async () => {
//   if (!user?.id || earningState.currentEarnings <= 0 || isClaimingEarnings || claimCooldown > 0) return;

//   try {
//     setIsClaimingEarnings(true);
    
//     // Calculate Nova tokens (10% of TON earnings)
//     const novaAmount = earningState.currentEarnings * 0.1;
//     const newNovaBalance = (user.total_sbt || 0) + novaAmount;
    
//     // Reset earnings state
//     const newEarningState = {
//       ...earningState,
//       currentEarnings: 0,
//       lastUpdate: Date.now()
//     };
    
//     // Update local storage first
//     localStorage.setItem(getUserEarningsKey(user.id), JSON.stringify(newEarningState));
//     setEarningState(newEarningState);
    
//     // Update database - simplified to avoid foreign key issues
//     const { error: updateError } = await supabase
//       .from('users')
//       .update({ 
//         total_earned: (user.total_earned || 0) + earningState.currentEarnings,
//         total_sbt: newNovaBalance,
//         total_withdrawn: (user.total_withdrawn || 0) + earningState.currentEarnings
//       })
//       .eq('id', user.id);
      
//     if (updateError) {
//       throw updateError;
//     }
    
//     // Update earnings table separately
//     const { error: earningsError } = await supabase
//       .from('user_earnings')
//       .update({
//         current_earnings: 0,
//         last_update: new Date().toISOString()
//       })
//       .eq('user_id', user.id);
      
//     if (earningsError) {
//       console.error('Error updating earnings table:', earningsError);
//       // Continue anyway as the main update succeeded
//     }
    
//     // Record activity
//     await supabase
//       .from('activities')
//       .insert({
//         user_id: user.id,
//         type: 'claim',
//         amount: earningState.currentEarnings,
//         status: 'completed',
//         created_at: new Date().toISOString()
//       });
    
//     // Add to local activities state for immediate UI update
//     const newActivity: Activity = {
//       id: Date.now().toString(),
//       user_id: String(user.id),
//       type: 'claim',
//       amount: earningState.currentEarnings,
//       status: 'completed',
//       created_at: new Date().toISOString()
//     };
    
//     setActivities(prev => [newActivity, ...prev]);
    
//     // Update local user data without relying on database fetch
//     if (user) {
//       const updatedUser = {
//         ...user,
//         total_earned: (user.total_earned || 0) + earningState.currentEarnings,
//         total_sbt: newNovaBalance,
//         total_withdrawn: (user.total_withdrawn || 0) + earningState.currentEarnings
//       };
      
//       // Update user state using the hook's function
//       updateUserData(updatedUser);
//     }
    
//     // Show success message
//     showSnackbar({
//       message: 'Rewards Claimed',
//       description: `Added ${earningState.currentEarnings.toFixed(8)} TON + ${novaAmount.toFixed(8)} NOVA`
//     });
    
//     // Set cooldown (30 minutes)
//     setClaimCooldown(CLAIM_COOLDOWN_DURATION);
    
//   } catch (error) {
//     console.error('Error claiming rewards:', error);
    
//     // Restore earnings state on error
//     const savedEarnings = localStorage.getItem(getUserEarningsKey(user.id));
//     if (savedEarnings) {
//       setEarningState(JSON.parse(savedEarnings));
//     }
    
//     showSnackbar({
//       message: 'Claim Failed',
//       description: 'Please try again later'
//     });
//   } finally {
//     setIsClaimingEarnings(false);
//   }
// };

// // Add this with your other state declarations
// const [showPayoutCard, setShowPayoutCard] = useState(false);

// // Modify this effect to only show notification but not auto-expand
// useEffect(() => {
//   if (user?.total_withdrawn && user.total_withdrawn >= 1) {
//     // We'll just update the UI to show notification, but won't auto-expand
//     // The card will remain collapsed until user clicks
//   }
// }, [user?.total_withdrawn]);

// // Add this to your existing useEffect dependencies or create a new one
// useEffect(() => {
//   // When withdrawal is approved, reset the pending state and update UI
//   if (user?.pending_withdrawal === false && previousPendingState.current === true) {
//     // Show success message
//     showSnackbar({
//       message: 'Withdrawal Approved!',
//       description: 'Your TON has been sent to your wallet.'
//     });
    
//     // Reset the total_withdrawn amount since it's been processed
//     if (user) {
//       // Update local user data to reflect the withdrawal
//       updateUserData({
//         ...user,
//         total_withdrawn: 0
//       });
//     }
    
//     // Add to activity log
//     const newActivity: Activity = {
//       id: Date.now().toString(),
//       user_id: String(user?.id || ''),
//       type: 'withdrawal',
//       amount: previousWithdrawnAmount.current,
//       status: 'completed',
//       created_at: new Date().toISOString()
//     };
    
//     setActivities(prev => [newActivity, ...prev]);
    
//     // Collapse the payout card since withdrawal is complete
//     setShowPayoutCard(false);
//   }
  
//   // Store current pending state for comparison in next render
//   if (user) {
//     previousPendingState.current = !!user.pending_withdrawal;
//     previousWithdrawnAmount.current = user.total_withdrawn || 0;
//   }
// }, [user?.pending_withdrawal]);

// // Add these refs at the top of your component
// const previousPendingState = useRef<boolean>(false);
// const previousWithdrawnAmount = useRef<number>(0);




// // Add this state variable with your other state declarations
// const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);

// // Add this handler function with your other handlers
// const handleRequestWithdrawal = async () => {
//   if (isRequestingWithdrawal) return;
  
//   try {
//     // Double-check minimum withdrawal amount
//     if (!user?.total_withdrawn || user.total_withdrawn < 1) {
//       showSnackbar({
//         message: 'Minimum Withdrawal',
//         description: 'You need at least 1 TON to request a withdrawal.'
//       });
//       return;
//     }
    
//     // Check if user already has a pending withdrawal
//     if (user?.pending_withdrawal) {
//       showSnackbar({
//         message: 'Withdrawal Pending',
//         description: 'You already have a pending withdrawal request.'
//       });
//       return;
//     }
    
//     setIsRequestingWithdrawal(true);
    
//     // Process the withdrawal request
//     const { error } = await supabase
//       .from('activities')
//       .insert({
//         user_id: user?.id,
//         type: 'withdrawal_request',
//         amount: user?.total_withdrawn,
//         status: 'pending',
//         created_at: new Date().toISOString()
//       });

//     if (error) throw error;

//     // Update local state only (don't try to update the user record yet)
//     if (user) {
//       updateUserData({
//         ...user,
//         pending_withdrawal: true
//       });
//     }

//     // Show success message
//     showSnackbar({
//       message: 'Withdrawal Requested',
//       description: 'Your withdrawal request has been submitted and will be processed soon.'
//     });
    
//   } catch (error) {
//     console.error('Error requesting withdrawal:', error);
//     showSnackbar({
//       message: 'Request Failed',
//       description: 'There was an error processing your withdrawal request. Please try again later.'
//     });
//   } finally {
//     setIsRequestingWithdrawal(false);
//   }
// };


//   // // Add function to load earning state from localStorage
//   // const loadEarningState = (): LocalEarningState | null => {
//   //   try {
//   //     const stored = localStorage.getItem(EARNINGS_STORAGE_KEY);
//   //     if (stored) {
//   //       const parsed = JSON.parse(stored);
//   //       // Validate the loaded state
//   //       if (parsed && typeof parsed === 'object' && 
//   //           'lastUpdate' in parsed && 'currentEarnings' in parsed && 
//   //           'baseEarningRate' in parsed && 'isActive' in parsed) {
//   //         return parsed;
//   //       }
//   //     }
//   //   } catch (error) {
//   //     console.error('Error loading earning state:', error);
//   //   }
//   //   return null;
//   // };

//   // Update earnings effect
//   useEffect(() => {
//     if (!user?.id || !user.balance) return;

//     // // Save user session
//     // saveUserSession(user.id);

//     // Load saved earnings from localStorage with user-specific key
//     const savedEarnings = localStorage.getItem(getUserEarningsKey(user.id));
//     const initialEarnings = savedEarnings ? JSON.parse(savedEarnings) : {
//       currentEarnings: 0,
//       lastUpdate: Date.now(),
//       baseEarningRate: calculateEarningRate(user.balance, currentROI),
//       isActive: user.balance > 0
//     };

//     setEarningState(initialEarnings);

//     const earningsInterval = setInterval(() => {
//       setEarningState(prevState => {
//         const now = Date.now();
//         const secondsElapsed = (now - prevState.lastUpdate) / 1000;
//         const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
//         const newState = {
//           ...prevState,
//           lastUpdate: now,
//           currentEarnings: newEarnings
//         };
        
//         // Save to user-specific localStorage key
//         localStorage.setItem(getUserEarningsKey(user.id!), JSON.stringify(newState));
        
//         // Stealth sync to database
//         syncEarningsToDatabase(user.id!, newEarnings);
        
//         return newState;
//       });
//     }, EARNINGS_UPDATE_INTERVAL);

//     return () => {
//       clearInterval(earningsInterval);
//       // Save final state before unmounting
//       const finalState = earningState;
//       localStorage.setItem(getUserEarningsKey(user.id), JSON.stringify(finalState));
      
//       // Final sync with server using IIFE
//       (async () => {
//         try {
//           await supabase
//             .from('user_earnings')
//             .upsert({
//               user_id: user.id,
//               current_earnings: finalState.currentEarnings,
//               last_update: new Date().toISOString()
//             }, {
//               onConflict: 'user_id'
//             });
//           console.log('Final earnings sync completed');
//         } catch (err) {
//           console.error('Error in final earnings sync:', err);
//         }
//       })();
//     };
//   }, [user?.id, user?.balance, currentROI]);

//   // Add this utility function
//   const showSnackbar = ({ message, description = '', duration = SNACKBAR_DURATION }: SnackbarConfig) => {
//     if (snackbarTimeoutRef.current) {
//       clearTimeout(snackbarTimeoutRef.current);
//     }

//     setSnackbarMessage(message);
//     setSnackbarDescription(description);
//     setSnackbarVisible(true);

//     snackbarTimeoutRef.current = setTimeout(() => {
//       setSnackbarVisible(false);
//     }, duration);
//   };

//   // Add this effect to fetch and update the wallet balance
//   useEffect(() => {
//     const fetchWalletBalance = async () => {
//       if (!tonConnectUI.account) {
//         setWalletBalance('0');
//         setIsLoadingBalance(false);
//         return;
//       }

//       try {
//         const balance = await tonweb.getBalance(tonConnectUI.account.address);
//         const balanceInTON = fromNano(balance);
//         setWalletBalance(balanceInTON);
//       } catch (error) {
//         console.error('Error fetching wallet balance:', error);
//         setWalletBalance('0');
//       } finally {
//         setIsLoadingBalance(false);
//       }
//     };

//     fetchWalletBalance();
//     // Update balance every 30 seconds
//     const intervalId = setInterval(fetchWalletBalance, 30000);

//     return () => clearInterval(intervalId);
//   }, [tonConnectUI]);

// // Add this function to calculate earnings rate based on user's balance and ROI
// const calculateEarningRate = (balance: number, baseROI: number) => {
//   // Enhanced ROI based on stake amount
//   let adjustedROI = baseROI;
//   if (balance >= 100) {
//     adjustedROI *= 1.5; // 50% bonus for 100+ TON
//   } else if (balance >= 50) {
//     adjustedROI *= 1.25; // 25% bonus for 50-99 TON
//   } else if (balance >= 10) {
//     adjustedROI *= 1.1; // 10% bonus for 10-49 TON
//   }
  
//   // Convert daily ROI to per-second rate
//   return (balance * adjustedROI) / 86400;
// };

// // Update handleDeposit to use proper number handling
// const handleDeposit = async (amount: number) => {
//   try {
//     // Validate amount
//     if (amount < 1) {
//       showSnackbar({ 
//         message: 'Invalid Amount', 
//         description: 'Minimum deposit amount is 1 TON' 
//       });
//       return;
//     }

//     // Validate user and wallet connection
//     if (!user?.id || !userFriendlyAddress) {
//       showSnackbar({ 
//         message: 'Wallet Not Connected', 
//         description: 'Please connect your wallet first' 
//       });
//       return;
//     }

//     // Check wallet balance
//     const walletBalanceNum = Number(walletBalance);
//     if (walletBalanceNum < amount) {
//       showSnackbar({
//         message: 'Insufficient Balance',
//         description: `Your wallet balance is ${walletBalanceNum.toFixed(2)} TON`
//       });
//       return;
//     }

//     setDepositStatus('pending');
//     const amountInNano = toNano(amount.toString());
//     const depositId = await generateUniqueId();
    
//     // Determine if this is a new user or a top-up
//     const isNewUser = !user.balance || user.balance === 0;
    
//     // Store current earnings state before deposit
//     const previousEarnings = isNewUser ? 0 : Number(earningState.currentEarnings.toFixed(8));
//     const previousState = {
//       ...earningState,
//       currentEarnings: previousEarnings,
//       startDate: isNewUser ? Date.now() : earningState.startDate,
//       lastUpdate: Date.now()
//     };
    
//     // Save current earning state
//     localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(previousState));
    
//     // Record pending deposit
//     const { error: pendingError } = await supabase
//       .from('deposits')
//       .insert([{
//         id: depositId,
//         user_id: user.id,
//         amount: amount,
//         amount_nano: amountInNano.toString(),
//         status: 'pending',
//         created_at: new Date().toISOString()
//       }]);

//     if (pendingError) throw pendingError;

//     // Create and send transaction
//     const transaction = {
//       validUntil: Math.floor(Date.now() / 1000) + 60 * 20,
//       messages: [
//         {
//           address: DEPOSIT_ADDRESS,
//           amount: amountInNano.toString(),
//         },
//       ],
//     };

//     const result = await tonConnectUI.sendTransaction(transaction);

//     if (result) {
//       // Update deposit status
//       const { error: updateError } = await supabase
//         .from('deposits')
//         .update({ 
//           status: 'confirmed',
//           tx_hash: result.boc
//         })
//         .eq('id', depositId);

//       if (updateError) throw updateError;

//       // Update user balance using RPC
//       const { error: balanceError } = await supabase.rpc('update_user_deposit', {
//         p_user_id: user.id,
//         p_amount: amount,
//         p_deposit_id: depositId
//       });

//       if (balanceError) throw balanceError;

//       // Fetch updated user data
//       const { data: updatedUser } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', user.id)
//         .single();

//       if (updatedUser) {
//         // Update user data in context
//         updateUserData(updatedUser);

//         // Calculate new base rate with updated balance
//         const newBaseEarningRate = calculateEarningRate(updatedUser.balance, currentROI);
        
//         // Set new state with preserved earnings for top-ups
//         const newState = {
//           ...previousState,
//           baseEarningRate: newBaseEarningRate,
//           isActive: true,
//           currentEarnings: previousEarnings, // Preserve previous earnings for top-ups
//           lastUpdate: Date.now()
//         };

//         setEarningState(newState);
//         localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(newState));

//         // Update earnings in database
//         await supabase
//           .from('user_earnings')
//           .upsert({
//             user_id: user.id,
//             current_earnings: previousEarnings,
//             last_update: new Date().toISOString(),
//             start_date: isNewUser ? new Date().toISOString() : undefined // Only set start_date for new users
//           }, {
//             onConflict: 'user_id'
//           });

//         showSnackbar({ 
//           message: isNewUser ? 'First Deposit Successful' : 'Top-up Successful', 
//           description: isNewUser
//             ? `Deposited ${amount.toFixed(2)} TON\nStaking journey begins!`
//             : `Deposited ${amount.toFixed(2)} TON\nCurrent earnings preserved: ${previousEarnings.toFixed(8)} TON`
//         });
//       }

//       setDepositStatus('success');
//       setShowDepositModal(false);
//     }
//   } catch (error) {
//     console.error('Deposit failed:', error);
//     setDepositStatus('error');
    
//     // Restore previous state on error
//     const savedState = localStorage.getItem(EARNINGS_STORAGE_KEY);
//     if (savedState) {
//       setEarningState(JSON.parse(savedState));
//     }
    
//     showSnackbar({ 
//       message: 'Deposit Failed', 
//       description: 'Please try again later' 
//     });
//   } finally {
//     setCustomAmount('');
//   }
// };


//   // Add this function to format earnings display
//   const formatEarnings = (amount: number): string => {
//     if (amount >= 1) {
//       return amount.toFixed(7);
//     } else {
//       return amount.toFixed(7);
//     }
//   };

//   // Update the earnings display in your JSX
//   const renderEarningsSection = () => (
//     <div className="flex items-center gap-2">
//       {user?.balance && user.balance > 0 ? (
//         <>
//           <div className="flex items-center gap-1.5">
//             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
//             <span className="text-xs text-blue-500">
//               +{formatEarnings(earningState.baseEarningRate)} TON/sec
//             </span>
//           </div>
//           <span className="text-xs text-white/40">
//             ({(earningState.baseEarningRate * 86400).toFixed(6)} TON/day)
//           </span>
//         </>
//       ) : (
//         <span className="text-xs text-white/40">
//           Deposit TON to start earning
//         </span>
//       )}
//     </div>
//   );

//   // Add effect to fetch and subscribe to activities
//   useEffect(() => {
//     const fetchActivities = async () => {
//       if (!user?.id) return;

//       setIsLoadingActivities(true);
//       try {
//         const { data, error } = await supabase
//           .from('activities')
//           .select('*')
//           .eq('user_id', user.id)
//           .order('created_at', { ascending: false })
//           .limit(10);

//         if (error) throw error;
//         setActivities(data || []);
//       } catch (error) {
//         console.error('Error fetching activities:', error);
//       } finally {
//         setIsLoadingActivities(false);
//       }
//     };

//     // Only fetch if activities tab is active
//     if (activeCard === 'activity') {
//       fetchActivities();

//       // Set up real-time subscription
//       const subscription = supabase
//         .channel('activities-channel')
//         .on(
//           'postgres_changes',
//           {
//             event: '*',
//             schema: 'public',
//             table: 'activities',
//             filter: `user_id=eq.${user?.id}`
//           },
//           (payload) => {
//             // Handle different types of changes
//             if (payload.eventType === 'INSERT') {
//               setActivities(prev => [payload.new as Activity, ...prev].slice(0, 10));
//             } else if (payload.eventType === 'UPDATE') {
//               setActivities(prev => 
//                 prev.map(activity => 
//                   activity.id === payload.new.id ? payload.new as Activity : activity
//                 )
//               );
//             } else if (payload.eventType === 'DELETE') {
//               setActivities(prev => 
//                 prev.filter(activity => activity.id !== payload.old.id)
//               );
//             }
//           }
//         )
//         .subscribe();

//         // Cleanup subscription
//         return () => {
//           supabase.removeChannel(subscription);
//         };
//       }
//     }, [user?.id, activeCard]);

//   // Helper function to format date
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return new Intl.DateTimeFormat('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     }).format(date);
//   };

//    // Update the activity card content
//  const renderActivityCard = () => (
//   <div className="relative">
//     {/* Header */}
//     <div className="flex items-center justify-between mb-4">
//       <div className="flex items-center gap-2">
//         <div className="w-8 h-8 relative">
//           <div className="absolute inset-0 bg-blue-500/20 rounded-lg rotate-45 animate-pulse" />
//           <div className="absolute inset-0 flex items-center justify-center">
//             <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//         </div>
//         <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//           <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Recent Activity</span>
//         </div>
//       </div>
//     </div>

//     {/* Activity List */}
//     <div className="space-y-3">
//       {isLoadingActivities ? (
//         <div className="flex items-center justify-center py-8">
//           <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
//         </div>
//       ) : activities.length > 0 ? (
//         activities.map((activity) => (
//           <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
//             <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
//               {getActivityIcon(activity.type)}
//             </div>
//             <div className="flex-1">
//               <div className="text-sm text-white">{getActivityDescription(activity)}</div>
//               <div className="text-xs text-white/40">{formatDate(activity.created_at)}</div>
//             </div>
//             <div className="text-right">
//   <div className={`text-sm font-medium ${
//     activity.type === 'nova_reward' 
//       ? 'text-purple-400' 
//       : 'text-white'
//   }`}>
//     {activity.amount.toFixed(9)} {activity.type === 'nova_reward' ? 'NOVA' : 'TON'}
//   </div>
//   <div className="text-xs text-white/40">{activity.status}</div>
// </div>
//           </div>
//         ))
//       ) : (
//         <div className="text-center py-8 text-white/40">
//           No recent activity
//         </div>
//       )}
//     </div>
//   </div>
// );

//   // Activity card content
//   const getActivityIcon = (type: Activity['type']) => {
//     switch (type) {
//       case 'deposit':
//         return <FaCoins className="w-4 h-4 text-blue-400" />;
//       case 'withdrawal':
//         return <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//         </svg>;
//       case 'stake':
//         return <BiNetworkChart className="w-4 h-4 text-purple-400" />;
//       case 'redeposit':
//         return <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//         </svg>;
//       case 'nova_reward':
//         return <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//         </svg>;
//       case 'nova_income':
//         return <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>;
//       case 'offline_reward':
//         return <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>;
//       case 'earnings_update':
//         return <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//         </svg>;
//       case 'claim':
//         return <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>;
//       case 'transfer':
//         return <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>;
//       case 'reward':
//         return <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>;
//       case 'bonus':
//         return <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>;
//       default:
//         return null;
//     }
//   };

//   // Add useEffect to fetch price
//   useEffect(() => {
//     const fetchTonPrice = async () => {
//       try {
//         const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true');
//         const data = await response.json();
//         setTonPrice(data['the-open-network'].usd);
//         setTonPriceChange(data['the-open-network'].usd_24h_change);
//       } catch (error) {
//         console.error('Error fetching TON price:', error);
//       }
//     };
    
//     fetchTonPrice();
//     const interval = setInterval(fetchTonPrice, 60000); // Update every minute
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (user && !isLoading) {
//       const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.telegram_id}`);
//       const isNewUser = user.total_deposit === 0;

//       if (!hasSeenOnboarding || isNewUser) {
//         setShowOnboarding(true);
//         const timer = setTimeout(() => {
//           setShowOnboarding(false);
//           localStorage.setItem(`onboarding_${user.telegram_id}`, 'true');
//         }, 14000); // 2s loading + (4 steps × 3s)
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [user, isLoading]);

//   // Add this effect to handle offline earnings
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         // App became visible, calculate offline earnings
//         const offlineState = loadOfflineEarnings();
//         if (offlineState && earningState.isActive) {
//           const now = Date.now();
//           const secondsElapsed = (now - offlineState.lastActiveTimestamp) / 1000;
//           const offlineEarnings = offlineState.baseEarningRate * secondsElapsed;

//           if (offlineEarnings > 0) {
//             setEarningState(prev => ({
//               ...prev,
//               currentEarnings: prev.currentEarnings + offlineEarnings,
//               lastUpdate: now
//             }));

//             showSnackbar({
//               message: 'Offline Earnings Added',
//               description: `You earned ${offlineEarnings.toFixed(8)} TON while offline`
//             });
//           }
//         }
//       } else {
//         // App is going to background, save current state
//         if (earningState.isActive) {
//           saveOfflineEarnings({
//             lastActiveTimestamp: Date.now(),
//             baseEarningRate: earningState.baseEarningRate
//           });
//         }
//       }
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [earningState]);

//   // Update the earning effect to include offline earnings
//   useEffect(() => {
//     if (!user?.id || !user.balance) return;

//     const initializeEarningState = async () => {
//       try {
//         // Fetch current earnings from server
//         const { data: serverData } = await supabase
//           .from('user_earnings')
//           .select('current_earnings, last_update, start_date')
//           .eq('user_id', user.id)
//           .single();

//         const now = Date.now();
//         const newRate = calculateEarningRate(user.balance, currentROI);
        
//         // Load saved earnings from localStorage
//         const savedEarnings = localStorage.getItem(getUserEarningsKey(user.id));
//         const localEarnings = savedEarnings ? JSON.parse(savedEarnings).currentEarnings : 0;
        
//         if (serverData) {
//           const startDate = new Date(serverData.start_date).getTime();
//           const lastUpdateTime = new Date(serverData.last_update).getTime();
//           const secondsElapsed = (now - lastUpdateTime) / 1000;
          
//           // Use the higher value between server and local storage to prevent resets
//           const baseEarnings = Math.max(serverData.current_earnings, localEarnings);
//           const accumulatedEarnings = (newRate * secondsElapsed) + baseEarnings;

//           const newState = {
//             lastUpdate: now,
//             currentEarnings: accumulatedEarnings,
//             baseEarningRate: newRate,
//             isActive: user.balance > 0,
//             startDate: startDate
//           };
          
//           setEarningState(newState);
//           saveEarningState(newState);
          
//           // Sync with server to ensure consistency
//           await supabase
//             .from('user_earnings')
//             .upsert({
//               user_id: user.id,
//               current_earnings: accumulatedEarnings,
//               last_update: new Date(now).toISOString(),
//               start_date: new Date(startDate).toISOString()
//             }, {
//               onConflict: 'user_id'
//             });

//         } else {
//           // Initialize new earning state, preserving any existing earnings
//           const newState = {
//             lastUpdate: now,
//             currentEarnings: localEarnings, // Use any existing local earnings
//             baseEarningRate: newRate,
//             isActive: user.balance > 0,
//             startDate: now
//           };

//           // Create initial server record with preserved earnings
//           await supabase
//             .from('user_earnings')
//             .insert({
//               user_id: user.id,
//               current_earnings: localEarnings, // Preserve existing earnings
//               last_update: new Date(now).toISOString(),
//               start_date: new Date(now).toISOString()
//             });

//           setEarningState(newState);
//           saveEarningState(newState);
//         }

//         // Set up periodic sync
//         const syncInterval = setInterval(async () => {
//           const currentState = JSON.parse(localStorage.getItem(getUserEarningsKey(user.id)) || '{}');
//           if (currentState.currentEarnings) {
//             await supabase
//               .from('user_earnings')
//               .upsert({
//                 user_id: user.id,
//                 current_earnings: currentState.currentEarnings,
//                 last_update: new Date().toISOString()
//               }, {
//                 onConflict: 'user_id'
//               });
//           }
//         }, EARNINGS_SYNC_INTERVAL);

//         return () => clearInterval(syncInterval);

//       } catch (error) {
//         console.error('Error initializing earning state:', error);
//       }
//     };

//     initializeEarningState();

//     // Set up earnings calculation interval
//     const earningsInterval = setInterval(() => {
//       setEarningState(prevState => {
//         const now = Date.now();
//         const secondsElapsed = (now - prevState.lastUpdate) / 1000;
//         const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
//         const newState = {
//           ...prevState,
//           lastUpdate: now,
//           currentEarnings: newEarnings
//         };
        
//         // Save to localStorage with user-specific key
//         localStorage.setItem(getUserEarningsKey(user.id!), JSON.stringify(newState));
        
//         return newState;
//       });
//     }, EARNINGS_UPDATE_INTERVAL);

//     return () => {
//       clearInterval(earningsInterval);
//       // Save final state before unmounting
//       const finalState = earningState;
//       localStorage.setItem(getUserEarningsKey(user.id), JSON.stringify(finalState));
      
//       // Final sync with server using IIFE
//       (async () => {
//         try {
//           await supabase
//             .from('user_earnings')
//             .upsert({
//               user_id: user.id,
//               current_earnings: finalState.currentEarnings,
//               last_update: new Date().toISOString()
//             }, {
//               onConflict: 'user_id'
//             });
//           console.log('Final earnings sync completed');
//         } catch (err) {
//           console.error('Error in final earnings sync:', err);
//         }
//       })();
//     };
//   }, [user?.id, user?.balance, currentROI]);

//   // Add this state
//   const [showOfflineRewardsModal, setShowOfflineRewardsModal] = useState(false);
//   const [offlineRewardsAmount, setOfflineRewardsAmount] = useState(0);

//   // Update these constants to be more precise
//   const OFFLINE_EARNINGS_KEY = 'offline_earnings_state';
//   const MINIMUM_OFFLINE_TIME = 5 * 60 * 1000; // 5 minutes minimum for offline rewards

//   // Add this helper function to calculate offline earnings
//   const calculateOfflineEarnings = (
//     lastActiveTime: number,
//     baseRate: number,
//     currentTime: number = Date.now()
//   ): number => {
//     const timeDiff = currentTime - lastActiveTime;
//     if (timeDiff < MINIMUM_OFFLINE_TIME) return 0;
//     return (baseRate * timeDiff) / 1000; // Convert to seconds
//   };

//   // Update the offline earnings effect
//   useEffect(() => {
//     if (!user?.id || !user.balance || !earningState.isActive) return;

//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         // Load offline state
//         const offlineState = loadOfflineEarnings();
//         if (offlineState) {
//           const offlineEarnings = calculateOfflineEarnings(
//             offlineState.lastActiveTimestamp,
//             offlineState.baseEarningRate
//           );

//           if (offlineEarnings > 0) {
//             console.log('Offline earnings calculated:', offlineEarnings);
//             setOfflineRewardsAmount(offlineEarnings);
//             setShowOfflineRewardsModal(true);
//           }
//           // Clear offline state after processing
//           localStorage.removeItem(OFFLINE_EARNINGS_KEY);
//         }
//       } else {
//         // Save current state when going offline
//         saveOfflineEarnings({
//           lastActiveTimestamp: Date.now(),
//           baseEarningRate: earningState.baseEarningRate
//         });
//       }
//     };

//     // Also check for offline earnings on component mount
//     const offlineState = loadOfflineEarnings();
//     if (offlineState) {
//       const offlineEarnings = calculateOfflineEarnings(
//         offlineState.lastActiveTimestamp,
//         offlineState.baseEarningRate
//       );

//       if (offlineEarnings > 0) {
//         console.log('Initial offline earnings found:', offlineEarnings);
//         setOfflineRewardsAmount(offlineEarnings);
//         setShowOfflineRewardsModal(true);
//         localStorage.removeItem(OFFLINE_EARNINGS_KEY);
//       }
//     }

//     // Add visibility change listener
//     document.addEventListener('visibilitychange', handleVisibilityChange);
    
//     // Save initial state
//     saveOfflineEarnings({
//       lastActiveTimestamp: Date.now(),
//       baseEarningRate: earningState.baseEarningRate
//     });

//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [user?.id, user?.balance, earningState.isActive, earningState.baseEarningRate]);

//   // Update handleClaimOfflineRewards
//   const handleClaimOfflineRewards = async () => {
//     if (!user?.id) return;

//     try {
//       const savedEarnings = localStorage.getItem(getUserEarningsKey(user.id));
//       const currentEarnings = savedEarnings 
//         ? JSON.parse(savedEarnings).currentEarnings 
//         : 0;

//       const newEarnings = currentEarnings + offlineRewardsAmount;
//       const newNovaBalance = (user.total_sbt || 0) + (offlineRewardsAmount * 0.1);

//       // Update local storage first with user-specific key
//       const newEarningState = {
//         ...earningState,
//         currentEarnings: newEarnings,
//         lastUpdate: Date.now()
//       };
//       localStorage.setItem(getUserEarningsKey(user.id), JSON.stringify(newEarningState));
//       setEarningState(newEarningState);

//       // Silent database updates
//       await Promise.all([
//         supabase
//           .from('users')
//           .update({ 
//             total_sbt: newNovaBalance,
//             total_earned: newEarnings
//           })
//           .eq('id', user.id),
        
//         supabase
//           .from('user_earnings')
//           .upsert({
//             user_id: user.id,
//             current_earnings: newEarnings,
//             last_update: new Date().toISOString()
//           }, {
//             onConflict: 'user_id'
//           }),

//         supabase
//           .from('activities')
//           .insert({
//             user_id: user.id,
//             type: 'nova_income',
//             amount: offlineRewardsAmount,
//             status: 'completed',
//             created_at: new Date().toISOString()
//           })
//       ]);

//       showSnackbar({
//         message: 'Rewards Claimed',
//         description: `Added ${offlineRewardsAmount.toFixed(8)} TON + ${(offlineRewardsAmount * 0.1).toFixed(8)} NOVA`
//       });

//       setShowOfflineRewardsModal(false);
//       setOfflineRewardsAmount(0);
//     } catch (error) {
//       console.error('Error claiming rewards:', error);
//       showSnackbar({
//         message: 'Claim Failed',
//         description: 'Please try again later'
//       });
//     }
//   };

//   // Add this state for live progress
//   const [, setStakingProgress] = useState(0);

//   // Add this effect for live progress updates
//   useEffect(() => {
//     if (user?.last_deposit_date) {
//       setStakingProgress(calculateStakingProgress(user.last_deposit_date));
//     }
//   }, [user?.last_deposit_date]);

//   // Add this helper function to calculate potential earnings
//   const calculatePotentialEarnings = (balance: number): number => {
//     let totalEarnings = 0;
//     let currentROI = 0.01; // Starting at 1%
    
//     // Calculate for 100 days with ROI increasing every 5 days
//     for (let day = 1; day <= 100; day++) {
//       // Increase ROI by 0.5% every 5 days
//       if (day % 5 === 0) {
//         currentROI += 0.005; // Add 0.5%
//       }
      
//       // Add daily earnings
//       totalEarnings += balance * currentROI;
//     }
    
//     return totalEarnings;
//   };

//   // Add state
//   const [showWithdrawalInfo, setShowWithdrawalInfo] = useState(false);


//   // Add new state variables at the top with other state declarations
//   const [isInitializing, setIsInitializing] = useState(true);
//   const [isNewUser] = useState(false);

//   // // Add this near the top of your component
//   // const [countdown, setCountdown] = useState('');

//   // useEffect(() => {
//   //   const endDate = new Date('2025-04-10');
    
//   //   const updateCountdown = () => {
//   //     const now = new Date();
//   //     const diff = endDate.getTime() - now.getTime();
      
//   //     if (diff <= 0) {
//   //       setCountdown('Offer ended');
//   //       return;
//   //     }

//   //     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//   //     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//   //     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
//   //     setCountdown(`${days}d ${hours}h ${minutes}m`);
//   //   };

//   //   updateCountdown();
//   //   const timer = setInterval(updateCountdown, 60000);
//   //   return () => clearInterval(timer);
//   // }, []);

//   // Update the earnings initialization effect
//   useEffect(() => {
//     if (!user?.id || !user.balance) {
//       setIsInitializing(false);
//       return;
//     }

//     const initializeEarningState = async () => {
//       try {
//         setIsInitializing(true);

//         // Check if user exists in user_earnings
//         const { data: serverData } = await supabase
//           .from('user_earnings')
//           .select('current_earnings, last_update, start_date')
//           .eq('user_id', user.id)
//           .single();

//         const now = Date.now();
//         const newRate = calculateEarningRate(user.balance, currentROI);
        
//         if (serverData) {
//           // Existing user logic - preserve earnings on top-up
//           const startDate = new Date(serverData.start_date).getTime();
//           const lastUpdateTime = new Date(serverData.last_update).getTime();
//           const secondsElapsed = (now - lastUpdateTime) / 1000;
          
//           // Preserve existing earnings and add new accumulated earnings
//           const baseEarnings = serverData.current_earnings || 0;
//           const accumulatedEarnings = (newRate * secondsElapsed) + baseEarnings;

//           // Update earnings state with preserved earnings
//           setEarningState({
//             lastUpdate: now,
//             currentEarnings: accumulatedEarnings,
//             baseEarningRate: newRate,
//             isActive: user.balance > 0,
//             startDate: startDate // Keep original start date
//           });

//           // Update database with new earnings
//           await supabase
//             .from('user_earnings')
//             .update({
//               current_earnings: accumulatedEarnings,
//               last_update: new Date(now).toISOString()
//               // Don't update start_date to preserve original staking start
//             })
//             .eq('user_id', user.id);

//         } else {
//           // New user logic - start with 0 earnings
//           const newState = {
//             lastUpdate: now,
//             currentEarnings: 0,
//             baseEarningRate: newRate,
//             isActive: user.balance > 0,
//             startDate: now
//           };

//           // Initialize new user in database
//           await supabase
//             .from('user_earnings')
//             .insert({
//               user_id: user.id,
//               current_earnings: 0,
//               last_update: new Date(now).toISOString(),
//               start_date: new Date(now).toISOString()
//             });

//           setEarningState(newState);
//         }
//       } catch (error) {
//         console.error('Error initializing earning state:', error);
//       } finally {
//         setIsInitializing(false);
//       }
//     };

//     initializeEarningState();
    
//     // Set up earnings calculation interval
//     const earningsInterval = setInterval(() => {
//       setEarningState(prevState => {
//         const now = Date.now();
//         const secondsElapsed = (now - prevState.lastUpdate) / 1000;
        
//         // Calculate new earnings based on current rate and elapsed time
//         const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
//         const newState = {
//           ...prevState,
//           lastUpdate: now,
//           currentEarnings: newEarnings,
//           baseEarningRate: calculateEarningRate(user.balance, currentROI) // Update rate based on new balance
//         };
        
//         // Save to localStorage
//         localStorage.setItem(getUserEarningsKey(user.id), JSON.stringify(newState));
        
//         return newState;
//       });
//     }, EARNINGS_UPDATE_INTERVAL);

//     return () => clearInterval(earningsInterval);
//   }, [user?.id, user?.balance, currentROI]);

//   // Add state for managing withdrawal modal and loading state
//   const [isRestaking, setIsRestaking] = useState(false);

//   // Update handleRestake function
//   const handleRestake = async () => {
//     if (isRestaking) return; // Prevent double clicks
    
//     try {
//       setIsRestaking(true);
//       const totalAmount = (user?.balance || 0) + earningState.currentEarnings;
      
//       // Show loading snackbar
//       showSnackbar({
//         message: 'Processing Restake',
//         description: 'Please wait while we process your request...'
//       });

//       const { error } = await supabase.rpc('update_user_restake', {
//         p_user_id: user?.id,
//         p_amount: totalAmount,
//         p_deposit_date: new Date().toISOString()
//       });

//       if (error) throw error;

//       // Reset earnings state
//       setEarningState({
//         lastUpdate: Date.now(),
//         currentEarnings: 0,
//         baseEarningRate: calculateEarningRate(totalAmount, currentROI),
//         isActive: true,
//         startDate: Date.now()
//       });

//       // Update user data
//       if (user) {
//         updateUserData({
//           ...user,
//           balance: totalAmount,
//           last_deposit_date: new Date().toISOString()
//         });
//       }

//       // Show success message with more details
//       showSnackbar({
//         message: 'Restake Successful! 🎉',
//         description: `Successfully restaked ${totalAmount.toFixed(2)} TON. Your new earnings rate has been updated.`
//       });

//       // Add activity record
//       await supabase.from('activities').insert({
//         user_id: user?.id,
//         type: 'redeposit',
//         amount: totalAmount,
//         status: 'completed',
//         created_at: new Date().toISOString()
//       });

//     } catch (error) {
//       console.error('Restake failed:', error);
//       showSnackbar({
//         message: 'Restake Failed',
//         description: 'There was an error processing your restake. Please try again later.'
//       });
//     } finally {
//       setIsRestaking(false);
//       setShowWithdrawalInfo(false);
//     }
//   };

//   useEffect(() => {
//     if (user && !isLoading) {
//       const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.telegram_id}`);
//       const isNewUser = user.total_deposit === 0;

//       if (!hasSeenOnboarding || isNewUser) {
//         setShowOnboarding(true);
//         const timer = setTimeout(() => {
//           setShowOnboarding(false);
//           localStorage.setItem(`onboarding_${user.telegram_id}`, 'true');
//         }, 14000); // 2s loading + (4 steps × 3s)
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [user, isLoading]);

//   // Add state for task completion
//   const [completedTasks, setCompletedTasks] = useState<string[]>([]);

//   // Add useEffect to check wallet connection status
//   useEffect(() => {
//     if (tonConnectUI.connected && !completedTasks.includes('wallet')) {
//       // Add wallet task to completed tasks
//       setCompletedTasks(prev => [...prev, 'wallet']);
      
//       // Show success message
//       showSnackbar({
//         message: 'Task Completed!',
//         description: 'Wallet connection verified. +10,000 NOVA tokens'
//       });

//       // Update task in database if needed
//       if (user?.id) {
//         supabase.from('user_tasks')
//           .upsert({
//             user_id: user.id,
//             task_type: 'wallet_connection',
//             completed_at: new Date().toISOString(),
//             reward_amount: 10000
//           })
//           .then(result => {
//             if (result.error) {
//               console.error('Error recording task:', result.error);
//             } else {
//               console.log('Wallet task recorded');
//             }
//           });
//       }
//     }
//   }, [tonConnectUI.connected, user?.id]);

//   // Add this useEffect to check staking completion
//   useEffect(() => {
//     // Check if user has staked enough and hasn't already claimed
//     if (user?.balance && user.balance >= 1 && !isStakingCompleted) {
//       // Mark as completed
//       localStorage.setItem('hasCompletedStaking', 'true');
//       setIsStakingCompleted(true);
      
//       // Update user with NOVA tokens
//       if (user) {
//         const updatedUser = {
//           ...user,
//           total_sbt: (user.total_sbt || 0) + 10000
//         };
//         updateUserData(updatedUser);
//       }
      
//       // Add to activity log
//       const newActivity: Activity = {
//         id: Date.now().toString(),
//         user_id: String(user?.id || ''),
//         type: 'nova_reward',
//         amount: 10000,
//         status: 'completed',
//         created_at: new Date().toISOString()
//       };
      
//       setActivities(prev => [newActivity, ...prev]);
      
//       // Show success message
//       showSnackbar({
//         message: 'Staking Task Completed!',
//         description: 'You have received 10,000 NOVA tokens'
//       });
//     }
//   }, [user?.balance, isStakingCompleted, user]);

//   // Update the main return statement to handle loading, new user, and no stake states
//   if (isLoading || isInitializing) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
//         <div className="text-center">
//           <div className="w-16 h-16 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-blue-400">{isInitializing ? 'Initializing your account...' : 'Loading...'}</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
//         {/* Error message component */}
//       </div>
//     );
//   }

//   // Show onboarding for new users
//   if (isNewUser && user) {
//     return <OnboardingScreen />;
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-[#0A0A0F] text-white antialiased mb-[3.7rem]">
//       {!isLoading && user && showOnboarding && <OnboardingScreen />}
//       {/* Header */}
//       <div className="px-2 py-4 flex justify-between items-center sticky top-0 bg-gradient-to-b from-black via-black/95 to-black/90 backdrop-blur-xl z-50 border-b border-white/5">
//         <div className="flex items-center gap-4">
//           {/* User Profile Section */}
//           <div className="flex items-center gap-3">
//             {/* Avatar with Animated Border */}
//             <div className="relative">
//               <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-75 blur-sm animate-gradient-slow"></div>
//               <div className="relative">
//                 <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-[#1a1c2e] to-[#0d0f1d]">
//                   <img 
//                     src="https://xelene.me/telegram.gif" 
//                     alt="" 
//                     className="w-full h-full object-cover"
//                   />
//                   {/* Online Status Indicator */}
//                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
//                 </div>
//               </div>
//             </div>

//             {/* User Info */}
//             <div className="flex flex-col">
//               <div className="flex items-center gap-2">
//                 <span className="text-sm font-medium text-white">
//                   {user?.username ? `@${user.username}` : '@username'}
//                 </span>
//                 {/* Verified Badge - if needed */}
//                 <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <div className="flex items-center gap-2">
//                 {/* User Name */}
//                 <span className="text-xs text-white/60 truncate max-w-[120px]">
//                   {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User Name'}
//                 </span>
//                 {user?.rank && (
//                   <div className="pixel-corners bg-blue-500/20 px-2 py-0.5 hidden">
//                     <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">
//                       {user.rank}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Section with Connect Button and Optional Menu */}
//         <div className="flex items-center gap-3">
//           {/* Optional Network Status */}
//           <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
//             <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
//             <span className="text-xs text-white/60">Mainnet</span>
//           </div>

//           {/* Connect Button with Custom Styling */}
//           <TonConnectButton />
//         </div>
//       </div>

//       {/* Network Status Bar */}
//       <div className="flex items-center justify-between gap-2 px-4 py-2 bg-[#1A1B1E]/50 border-b border-white/5">
//         {/* Wallet Balance and TON Price */}
//         <div className="flex items-center gap-2">
//           {/* Wallet Balance */}
//           <div className="px-2 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
//             <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//             </svg>
//             {isLoadingBalance ? (
//               <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
//             ) : (
//               <span className="text-xs font-medium text-white/80">
//                 {Number(walletBalance).toFixed(2)} TON
//               </span>
//             )}
//           </div>
//         </div>

//         {/* Network Info - Existing Code */}
//         <div className="flex items-center gap-2 text-xs text-white/60">
//           {/* TON Price */}
//           <div className="px-2 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
//             <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <span className={`text-xs font-medium ${
//               tonPriceChange >= 0 ? 'text-green-400' : 'text-red-400'
//             }`}>
//               ${tonPrice.toFixed(2)}
//               <span className="ml-1 text-[10px]">
//                 {tonPriceChange >= 0 ? '↑' : '↓'}{Math.abs(tonPriceChange).toFixed(2)}%
//               </span>
//             </span>
//           </div>
        
//           {/* Network Badge */}
//           <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
//             isMainnet 
//               ? 'bg-green-500/10 border border-green-500/20' 
//               : 'bg-yellow-500/10 border border-yellow-500/20'
//           }`}>
//             <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
//               isMainnet ? 'bg-green-400' : 'bg-yellow-400'
//             }`} />
//             <span className={`text-xs font-medium ${
//               isMainnet ? 'text-green-400' : 'text-yellow-400'
//             }`}>
//               {NETWORK_NAME}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1">
//         {currentTab === 'home' && (
//           <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
//         <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/30 blur-3xl" />
// {/* Payout Card - Compact Version with Toggle */}
// <div className="relative mb-4">
//   {/* Notification Button that appears when user has enough for withdrawal */}
//   <button 
//     onClick={() => setShowPayoutCard(!showPayoutCard)}
//     className={`w-full relative p-6 rounded-xl bg-gradient-to-br from-[#0A0A0F]/95 to-[#1A1B1E]/95 
//       ${user?.pending_withdrawal 
//         ? 'border border-green-500/20' 
//         : user?.total_withdrawn && user.total_withdrawn >= 1 
//           ? 'border border-yellow-500/20' 
//           : 'border border-white/10'
//       } backdrop-blur-xl transition-all duration-300 transform hover:scale-[1.01]`}
//   >
//     {/* Animated Background Effects */}
//     <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] animate-grid-flow opacity-50" />
//     <div className={`absolute inset-0 bg-gradient-to-t 
//       ${user?.pending_withdrawal 
//         ? 'from-green-500/5 to-transparent' 
//         : 'from-yellow-500/5 to-transparent'}`} 
//     />
    
//     {/* Animated Corner Decorations - Yellow/Green variant based on status */}
//     <div className="absolute -top-px -left-px w-16 h-16">
//       <div className={`absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//       <div className={`absolute top-0 left-0 h-[2px] w-8 bg-gradient-to-r 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//     </div>
//     <div className="absolute -top-px -right-px w-16 h-16">
//       <div className={`absolute top-0 right-0 w-[2px] h-8 bg-gradient-to-b 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//       <div className={`absolute top-0 right-0 h-[2px] w-8 bg-gradient-to-l 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//     </div>
//     <div className="absolute -bottom-px -left-px w-16 h-16">
//       <div className={`absolute bottom-0 left-0 w-[2px] h-8 bg-gradient-to-t 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//       <div className={`absolute bottom-0 left-0 h-[2px] w-8 bg-gradient-to-r 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//     </div>
//     <div className="absolute -bottom-px -right-px w-16 h-16">
//       <div className={`absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//       <div className={`absolute bottom-0 right-0 h-[2px] w-8 bg-gradient-to-l 
//         ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//     </div>
    
//     <div className="relative z-10 flex items-center justify-between">
//       <div className="flex items-center gap-3">
//         <div className={`w-10 h-10 rounded-xl 
//           ${user?.pending_withdrawal 
//             ? 'bg-green-500/10' 
//             : 'bg-yellow-500/10'} 
//           flex items-center justify-center`}
//         >
//           {user?.pending_withdrawal ? (
//             <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//             </svg>
//           ) : (
//             <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           )}
//         </div>
//         <div className="flex-1 flex flex-col text-left">
//           <span className="text-lg font-semibold text-white">
//             Weekly TON Distribution
//           </span>
//           {user?.pending_withdrawal ? (
//             <div className="flex items-center gap-1.5 mt-0.5">
//               <span className="text-sm text-white/60">Status: </span>
//               <span className="text-sm font-medium text-green-400">
//                 Payment in progress
//               </span>
//             </div>
//           ) : user?.total_withdrawn && user.total_withdrawn >= 1 ? (
//             <div className="flex items-center gap-1.5 mt-0.5">
//               <span className="text-sm text-white/60">Available: </span>
//               <span className="text-sm font-medium text-yellow-400">
//                 {Number(user.total_withdrawn).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON
//               </span>
//             </div>
//           ) : (
//             <span className="text-sm text-white/60">Collect your weekly rewards</span>
//           )}
//         </div>

        
//       </div>
      
//       <div className="flex items-center gap-2">
//         {user?.pending_withdrawal ? (
//           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-1"></div>
//         ) : user?.total_withdrawn && user.total_withdrawn >= 1 && (
//           <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping mr-1"></div>
//         )}
//         <div className={`w-8 h-8 rounded-full 
//           ${user?.pending_withdrawal 
//             ? 'bg-green-500/10' 
//             : 'bg-yellow-500/10'} 
//           flex items-center justify-center`}
//         >
//           <svg className={`w-5 h-5 transition-transform duration-300 ${showPayoutCard ? 'rotate-180' : ''} 
//             ${user?.pending_withdrawal ? 'text-green-400' : 'text-yellow-400'}`} 
//             fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//           </svg>
//         </div>
//       </div>
//     </div>
//   </button>

//   {/* Expandable Card Content */}
//   <div className={`transition-all duration-500 overflow-hidden ${showPayoutCard ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
//     <div className="relative shadow-xl overflow-visible transform hover:scale-[1.01] transition-all duration-300">
//       <div className={`relative p-6 rounded-xl bg-gradient-to-br from-[#0A0A0F]/95 to-[#1A1B1E]/95 
//         ${user?.pending_withdrawal 
//           ? 'border border-green-500/20' 
//           : 'border border-yellow-500/20'} 
//         backdrop-blur-xl`}
//       >
//         {/* Animated Background Effects */}
//         <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] animate-grid-flow opacity-50" />
//         <div className={`absolute inset-0 bg-gradient-to-t 
//           ${user?.pending_withdrawal 
//             ? 'from-green-500/5 to-transparent' 
//             : 'from-yellow-500/5 to-transparent'}`} 
//         />
        
//         {/* Animated Corner Decorations - Yellow/Green variant based on status */}
//         <div className="absolute -top-px -left-px w-16 h-16">
//           <div className={`absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//           <div className={`absolute top-0 left-0 h-[2px] w-8 bg-gradient-to-r 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//         </div>
//         <div className="absolute -top-px -right-px w-16 h-16">
//           <div className={`absolute top-0 right-0 w-[2px] h-8 bg-gradient-to-b 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//           <div className={`absolute top-0 right-0 h-[2px] w-8 bg-gradient-to-l 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//         </div>
//         <div className="absolute -bottom-px -left-px w-16 h-16">
//           <div className={`absolute bottom-0 left-0 w-[2px] h-8 bg-gradient-to-t 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//           <div className={`absolute bottom-0 left-0 h-[2px] w-8 bg-gradient-to-r 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//         </div>
//         <div className="absolute -bottom-px -right-px w-16 h-16">
//           <div className={`absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//           <div className={`absolute bottom-0 right-0 h-[2px] w-8 bg-gradient-to-l 
//             ${user?.pending_withdrawal ? 'from-green-400/60' : 'from-yellow-400/60'} to-transparent`} />
//         </div>

//         <div className="relative z-10">
//           {/* Header with Amount - Enhanced with animation */}
//           <div className="flex justify-between items-center mb-4">
//             <div className="flex items-center gap-2">
//               <div className={`w-10 h-10 rounded-xl 
//                 ${user?.pending_withdrawal 
//                   ? 'bg-green-500/10' 
//                   : 'bg-yellow-500/10'} 
//                 flex items-center justify-center relative group`}
//               >
//                 <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
//                   ${user?.pending_withdrawal ? 'bg-green-400/20' : 'bg-yellow-400/20'}`}></div>
//                 {user?.pending_withdrawal ? (
//                   <svg className="w-5 h-5 text-green-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 ) : (
//                   <svg className="w-5 h-5 text-yellow-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 )}
//               </div>
//               <div>
//                 <span className="text-base font-semibold text-white">Weekly TON Distribution</span>
//                 <div className={`text-xs ${user?.pending_withdrawal ? 'text-green-400/80' : 'text-yellow-400/80'}`}>
//                   {user?.pending_withdrawal ? 'Payment in progress' : 'Every Friday'}
//                 </div>
//               </div>
//             </div>
//             <div className="text-right">
//               <div className="text-lg font-bold text-white group relative">
//                 <span className={`group-hover:${user?.pending_withdrawal ? 'text-green-400' : 'text-yellow-400'} transition-colors duration-300`}>
//                   {user?.total_withdrawn?.toFixed(2) || '0.00'} <span className="text-xs text-white/60">TON</span>
//                 </span>
//                 <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
//                   ${user?.pending_withdrawal ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
//               </div>
//               <div className="text-xs text-white/60">
//                 ≈ ${((user?.total_withdrawn ?? 0) * tonPrice).toFixed(2)}
//               </div>
//             </div>
//           </div>

//           {/* Payout schedule or status message */}
//           {user?.pending_withdrawal ? (
//             <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-green-600/5 rounded-lg text-xs mb-4 relative overflow-hidden group">
//               <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:10px_10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <div className="absolute -inset-1 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
              
//               <div className="flex items-center gap-2 relative z-10">
//                 <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
//                   <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 </div>
//                 <span className="text-white/80">Payment Processing</span>
//               </div>
//               <div className="relative z-10 flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full border-2 border-green-400/20 border-t-green-400 animate-spin"></div>
//                 <span className="text-green-400">TON on its way!</span>
//               </div>
//             </div>
//           ) : (
//             <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 rounded-lg text-xs mb-4 relative overflow-hidden group">
//               <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:10px_10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
              
//               <div className="flex items-center gap-2 relative z-10">
//                 <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
//                   <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                 </div>
//                 <span className="text-white/80">Next Friday</span>
//               </div>
//               <div className="relative z-10">
//                 <WeeklyPayoutCountdown />
//               </div>
//             </div>
//           )}

//           {/* Wallet for Payouts - Enhanced with better visual hierarchy */}
//           <div className={`p-4 bg-gradient-to-br from-black/40 to-black/20 rounded-lg 
//             ${user?.pending_withdrawal ? 'border border-green-500/10' : 'border border-yellow-500/10'} 
//             relative overflow-hidden group`}
//           >
//             <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:10px_10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
//             <div className="flex items-center justify-between mb-3 relative z-10">
//               <span className="text-sm text-white/80 font-medium">Payout Wallet</span>
//               <button 
//                 onClick={() => setShowWithdrawalInfo(true)}
//                 className={`text-xs px-3 py-1 rounded-full 
//                   ${user?.pending_withdrawal 
//                     ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
//                     : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'} 
//                   transition-colors`}
//                 disabled={user?.pending_withdrawal}
//               >
//                 {user?.payout_wallet ? 'Edit' : 'Set Wallet'}
//               </button>
//             </div>
            
//             <div className="flex items-center gap-3 mb-4 relative z-10">
//               <div className={`w-10 h-10 rounded-full 
//                 ${user?.pending_withdrawal ? 'bg-green-500/10' : 'bg-yellow-500/10'} 
//                 flex items-center justify-center`}
//               >
//                 <svg className={`w-5 h-5 ${user?.pending_withdrawal ? 'text-green-400' : 'text-yellow-400'}`} 
//                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//                 </svg>
//               </div>
//               <div className="flex-1 overflow-hidden">
//                 {user?.payout_wallet ? (
//                   <div>
//                     <div className="text-sm text-white font-medium truncate">
//                       {user.payout_wallet.substring(0, 6)}...{user.payout_wallet.substring(user.payout_wallet.length - 4)}
//                     </div>
//                     <div className="text-xs text-white/40">TON Blockchain</div>
//                   </div>
//                 ) : (
//                   <div className="text-sm text-white/40 italic">No wallet set for payouts</div>
//                 )}
//               </div>
//             </div>
            
//             {/* Add withdrawal request button - Enhanced with better states */}
//             {user?.payout_wallet && (
//               <button
//                 onClick={handleRequestWithdrawal}
//                 disabled={isRequestingWithdrawal || !user?.total_withdrawn || user.total_withdrawn < 1 || user?.pending_withdrawal}
//                 className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 relative overflow-hidden
//                   ${isRequestingWithdrawal 
//                     ? 'bg-yellow-500/30 text-white/50 cursor-not-allowed' 
//                     : user?.pending_withdrawal 
//                       ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
//                       : !user?.total_withdrawn || user.total_withdrawn < 1
//                         ? 'bg-yellow-500/10 text-yellow-400/50 border border-yellow-500/20 cursor-not-allowed'
//                         : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all duration-300'
//                   }`}
//               >
//                 {/* Animated background for active button */}
//                 {!isRequestingWithdrawal && user?.total_withdrawn && user.total_withdrawn >= 1 && !user?.pending_withdrawal && (
//                   <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
//                 )}
                
//                 <div className="relative z-10 flex items-center justify-center gap-2">
//                   {isRequestingWithdrawal ? (
//                     <>
//                       <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
//                       <span>Preparing your TON...</span>
//                     </>
//                   ) : user?.pending_withdrawal ? (
//                     <>
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                       </svg>
//                       <span>TON on its way!</span>
//                     </>
//                   ) : !user?.total_withdrawn || user.total_withdrawn < 1 ? (
//                     <>
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                       <span>Need 1+ TON to collect</span>
//                     </>
//                   ) : (
//                     <>
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                       </svg>
//                       <span>Collect Your TON</span>
//                     </>
//                   )}
//                 </div>
//               </button>
//             )}
//           </div>

//           {/* Info text - Enhanced with icon and better styling */}
//           <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/60 group">
//             <svg className={`w-4 h-4 ${user?.pending_withdrawal ? 'text-green-400/60 group-hover:text-green-400' : 'text-yellow-400/60 group-hover:text-yellow-400'} transition-colors duration-300`} 
//               fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <span className="group-hover:text-white/80 transition-colors duration-300">
//               {user?.pending_withdrawal 
//                 ? "Your TON is being processed and will arrive shortly" 
//                 : "Payouts processed automatically every Friday"}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
    
//   </div>
// </div>
// <DailyUpdateCard earningState={earningState} />


//              {/* Stake Card */}
//              <div className="relative shadow-xl overflow-visible transform hover:scale-[1.01] transition-all duration-300">
//               <div className="relative p-6 rounded-xl bg-gradient-to-br from-[#0A0A0F]/95 to-[#1A1B1E]/95 border border-green-500/20 backdrop-blur-xl">
//                 {/* Animated Background Effects */}
//                 <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] animate-grid-flow opacity-50" />
//                 <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent" />
                
//                 {/* Animated Corner Decorations */}
//                 <div className="absolute -top-px -left-px w-16 h-16">
//                   <div className="absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b from-green-400/60 to-transparent" />
//                   <div className="absolute top-0 left-0 h-[2px] w-8 bg-gradient-to-r from-green-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -top-px -right-px w-16 h-16">
//                   <div className="absolute top-0 right-0 w-[2px] h-8 bg-gradient-to-b from-green-400/60 to-transparent" />
//                   <div className="absolute top-0 right-0 h-[2px] w-8 bg-gradient-to-l from-green-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -bottom-px -left-px w-16 h-16">
//                   <div className="absolute bottom-0 left-0 w-[2px] h-8 bg-gradient-to-t from-green-400/60 to-transparent" />
//                   <div className="absolute bottom-0 left-0 h-[2px] w-8 bg-gradient-to-r from-green-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -bottom-px -right-px w-16 h-16">
//                   <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t from-green-400/60 to-transparent" />
//                   <div className="absolute bottom-0 right-0 h-[2px] w-8 bg-gradient-to-l from-green-400/60 to-transparent" />
//                 </div>

//                 <div className="relative z-10">
//                   {/* Header */}
//                   <div className="flex justify-between items-center mb-6">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
//                         <FaCoins className="w-5 h-5 text-green-400" />
//                       </div>
//                       <span className="text-lg font-semibold text-white">My Stake</span>
//                     </div>
//                     {user?.balance && user.balance > 0 ? (
//                       <button
//                         onClick={() => setShowDepositModal(true)}
//                         className="group flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl 
//                           border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30 
//                           transition-all duration-300"
//                       >
//                         <div className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:animate-ping" />
//                         <span className="text-sm font-medium text-green-400">Top Up</span>
//                       </button>
//                     ) : (
//                       <button
//                         onClick={() => setShowDepositModal(true)}
//                         className="group flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl 
//                           border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 
//                           transition-all duration-300"
//                       >
//                         <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:animate-ping" />
//                         <span className="text-sm font-medium text-blue-400">Stake Now</span>
//                       </button>
//                     )}
//                   </div>

//                   {/* Balance Display */}
//                   <div className="space-y-2 mb-6">
//                     <div className="flex items-baseline gap-3">
//                       <span className="text-4xl font-bold text-white tracking-tight">
//                         {user?.balance?.toFixed(2) || '0.00'}
//                         <span className="text-lg font-medium text-white/60 ml-2">TON</span>
//                       </span>
//                       <div className="pixel-corners bg-white/5 px-3 py-1">
//                         <span className="text-sm text-white/40">≈ ${((user?.balance ?? 0) * tonPrice).toFixed(2)}</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Stake Progress */}
//                   {user?.balance && user.balance > 0 ? (
//                     <div className="space-y-3">
//                       <div className="flex items-center justify-between text-sm">
//                         <ReStakeCountdown depositDate={new Date(user.last_deposit_date || Date.now())} />
//                       </div>
                      
//                       {/* Enhanced Progress Bar */}
//                       <div className="relative h-3 bg-black/20 rounded-lg overflow-hidden">
//                         <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:8px_8px]" />
//                         <div 
//                           className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-lg transition-all duration-1000
//                             relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
//                           style={{ width: `${calculateStakingProgress(user?.last_deposit_date || new Date())}%` }}
//                         >
//                           <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
//                             animate-shimmer -translate-x-full"/>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-sm text-white/40 flex items-center gap-2 mt-4">
//                       <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                       </svg>
//                       Start staking to begin your journey
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Earnings Card */}
//             <div className="relative shadow-xl overflow-visible transform hover:scale-[1.01] transition-all duration-300">
//               <div className="relative p-6 rounded-xl bg-gradient-to-br from-[#0A0A0F]/95 to-[#1A1B1E]/95 border border-blue-500/20 backdrop-blur-xl">
//                 {/* Animated Background Effects */}
//                 <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] animate-grid-flow opacity-50" />
//                 <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent" />
                
//                 {/* Animated Corner Decorations - Blue variant */}
//                 <div className="absolute -top-px -left-px w-16 h-16">
//                   <div className="absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b from-blue-400/60 to-transparent" />
//                   <div className="absolute top-0 left-0 h-[2px] w-8 bg-gradient-to-r from-blue-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -top-px -right-px w-16 h-16">
//                   <div className="absolute top-0 right-0 w-[2px] h-8 bg-gradient-to-b from-blue-400/60 to-transparent" />
//                   <div className="absolute top-0 right-0 h-[2px] w-8 bg-gradient-to-l from-blue-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -bottom-px -left-px w-16 h-16">
//                   <div className="absolute bottom-0 left-0 w-[2px] h-8 bg-gradient-to-t from-blue-400/60 to-transparent" />
//                   <div className="absolute bottom-0 left-0 h-[2px] w-8 bg-gradient-to-r from-blue-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -bottom-px -right-px w-16 h-16">
//                   <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t from-blue-400/60 to-transparent" />
//                   <div className="absolute bottom-0 right-0 h-[2px] w-8 bg-gradient-to-l from-blue-400/60 to-transparent" />
//                 </div>

//                 <div className="relative z-10">
//                   {/* Header */}
//                   <div className="flex justify-between items-center mb-6">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
//                         {/* <BsCoin className="w-5 h-5 text-blue-400" /> */}
//                         <img src={toncoin } className="w-5 h-5 text-blue-400" />
//                       </div>
//                       <span className="text-lg font-semibold text-white">TON Earnings</span>
//                     </div>
//                     <button
//                       onClick={handleClaimEarnings}
//                       disabled={isClaimingEarnings || earningState.currentEarnings <= 0 || claimCooldown > 0}
//                       className={`group flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl 
//                         border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 
//                         transition-all duration-300 ${(isClaimingEarnings || earningState.currentEarnings <= 0 || claimCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
//                     >
//                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:animate-ping" />
//                       <span className="text-sm font-medium text-blue-400">
//                         {isClaimingEarnings ? 'Claiming...' : 
//                          claimCooldown > 0 ? `Cooldown (${formatCooldownTime(claimCooldown)})` : 
//                          'Claim Rewards'}
//                       </span>
//                     </button>
//                   </div>

//                   {/* Earnings Display */}
//                   <div className="space-y-2 mb-6">
//                     <div className="flex items-baseline gap-3">
//                       <span className="text-4xl font-bold text-white tracking-tight">
//                         {formatEarnings(earningState.currentEarnings)}
//                         <span className="text-lg font-medium text-white/60 ml-2">TON</span>
//                       </span>
//                       <div className="pixel-corners bg-white/5 px-3 py-1">
//                         <span className="text-sm text-white/40">≈ ${(earningState.currentEarnings * tonPrice).toFixed(2)}</span>
//                       </div>
//                     </div>
//                     {renderEarningsSection()}
//                   </div>

//                   {/* Additional Stats */}
//                   {user?.balance && user.balance > 0 ? (
//                     <div className="grid grid-cols-2 gap-4 mt-6">
//                       <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
//                         <div className="text-sm text-white/60 mb-1">Expected Reward</div>
//                         <div className="text-lg font-semibold text-blue-400">
//                         {Number(calculatePotentialEarnings(user.balance ?? 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON                        </div>
//                       </div>
//                       <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
//                         <div className="text-sm text-white/60 mb-1">Nova Balance</div>
//                         <div className="text-lg font-semibold text-purple-400">
//                           {Number(user.total_sbt ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} NOVA
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-center text-white/40 text-sm mt-4">
//                       Start staking to see your earnings progress!
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Card Navigation */}
//             <div className="flex items-center gap-2 px-1">
//               {/* Stats Button */}
//               <button
//                 onClick={() => setActiveCard('stats')}
//                 className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
//                   transition-all duration-300 overflow-hidden
//                   ${activeCard === 'stats'
//                     ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20'
//                     : 'bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10'
//                   }`}
//               >
//                 {/* Background Effects */}
//                 <div className={`absolute inset-0 bg-grid-white/[0.02] bg-[length:8px_8px] 
//                   transition-opacity duration-300
//                   ${activeCard === 'stats' ? 'opacity-100' : 'opacity-0'}`} 
//                 />
//                 <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 
//                   transition-opacity duration-300
//                   ${activeCard === 'stats' ? 'opacity-100' : 'opacity-0'}`} 
//                 />
                
//                 {/* Icon and Text Container */}
//                 <div className="relative flex items-center gap-2">
//                   {/* Animated Icon */}
//                   <div className={`w-4 h-4 rounded flex items-center justify-center
//                     transition-all duration-300 transform
//                     ${activeCard === 'stats' 
//                       ? 'scale-110 text-blue-400' 
//                       : 'text-white/40 group-hover:text-white/60'}`}
//                   >
//                     <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                         d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
//                     />
//                   </svg>
//                 </div>

//                 {/* Text with Glow Effect */}
//                 <span className={`relative transition-all duration-300
//                   ${activeCard === 'stats' 
//                     ? 'after:content-[""] after:absolute after:inset-0 after:bg-blue-400/20 after:blur-lg after:opacity-75'
//                     : ''}`}
//                 >
//                   Analytics
//                 </span>

//                 {/* Active Indicator Dot */}
//                 <div className={`absolute -right-1 -top-1 w-2 h-2 rounded-full 
//                   transition-all duration-300 transform
//                   ${activeCard === 'stats'
//                     ? 'bg-blue-400 scale-100 opacity-100'
//                     : 'scale-0 opacity-0'}`}
//                 />
//               </div>
//             </button>

//             {/* Activity Button */}
//             <button
//               onClick={() => setActiveCard('activity')}
//               className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
//                 transition-all duration-300 overflow-hidden
//                 ${activeCard === 'activity'
//                   ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 shadow-lg shadow-green-500/20'
//                   : 'bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10'
//                 }`}
//             >
//               {/* Background Effects */}
//               <div className={`absolute inset-0 bg-grid-white/[0.02] bg-[length:8px_8px] 
//                 transition-opacity duration-300
//                 ${activeCard === 'activity' ? 'opacity-100' : 'opacity-0'}`} 
//               />
//               <div className={`absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 
//                 transition-opacity duration-300
//                 ${activeCard === 'activity' ? 'opacity-100' : 'opacity-0'}`} 
//               />
              
//               {/* Icon and Text Container */}
//               <div className="relative flex items-center gap-2">
//                 {/* Animated Icon */}
//                 <div className={`w-4 h-4 rounded flex items-center justify-center
//                   transition-all duration-300 transform
//                   ${activeCard === 'activity' 
//                     ? 'scale-110 text-green-400' 
//                     : 'text-white/40 group-hover:text-white/60'}`}
//                 >
//                   <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                       d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
//                     />
//                   </svg>
//                 </div>

//                 {/* Text with Glow Effect */}
//                 <span className={`relative transition-all duration-300
//                   ${activeCard === 'activity' 
//                     ? 'after:content-[""] after:absolute after:inset-0 after:bg-green-400/20 after:blur-lg after:opacity-75'
//                     : ''}`}
//                 >
//                   Activity
//                 </span>

//                 {/* Active Indicator Dot */}
//                 <div className={`absolute -right-1 -top-1 w-2 h-2 rounded-full 
//                   transition-all duration-300 transform
//                   ${activeCard === 'activity'
//                     ? 'bg-green-400 scale-100 opacity-100'
//                     : 'scale-0 opacity-0'}`}
//                 />
//               </div>
//             </button>

//             {/* Community Button */}
//             <button
//               onClick={() => setActiveCard('community')}
//               className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
//                 transition-all duration-300 overflow-hidden
//                 ${activeCard === 'community'
//                   ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 shadow-lg shadow-purple-500/20'
//                   : 'bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10'
//                 }`}
//             >
//               {/* Background Effects */}
//               <div className={`absolute inset-0 bg-grid-white/[0.02] bg-[length:8px_8px] 
//                 transition-opacity duration-300
//                 ${activeCard === 'community' ? 'opacity-100' : 'opacity-0'}`} 
//               />
//               <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 
//                 transition-opacity duration-300
//                 ${activeCard === 'community' ? 'opacity-100' : 'opacity-0'}`} 
//               />
              
//               {/* Icon and Text Container */}
//               <div className="relative flex items-center gap-2">
//                 {/* Animated Icon */}
//                 <div className={`w-4 h-4 rounded flex items-center justify-center
//                   transition-all duration-300 transform
//                   ${activeCard === 'community' 
//                     ? 'scale-110 text-purple-400' 
//                     : 'text-white/40 group-hover:text-white/60'}`}
//                 >
//                   <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                       d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
//                     />
//                   </svg>
//                 </div>

//                 {/* Text with Glow Effect */}
//                 <span className={`relative transition-all duration-300
//                   ${activeCard === 'community' 
//                     ? 'after:content-[""] after:absolute after:inset-0 after:bg-purple-400/20 after:blur-lg after:opacity-75'
//                     : ''}`}
//                 >
//                   Community
//                 </span>

//                 {/* Active Indicator Dot */}
//                 <div className={`absolute -right-1 -top-1 w-2 h-2 rounded-full 
//                   transition-all duration-300 transform
//                   ${activeCard === 'community'
//                     ? 'bg-purple-400 scale-100 opacity-100'
//                     : 'scale-0 opacity-0'}`}
//                 />
//               </div>
//             </button>
//           </div>

//             {/* Card Content */}
        
//           {/* Card Content */}
//           <div className="space-y-6">
//             {activeCard === 'stats' && (
//               <>
//                 {/* Staking Details */}
//                 <div className="relative">
//                   <div className="grid grid-cols-2 gap-3">
//                   {/* Total Deposited */}
//                   <StatsCard
//                     title="Nova Power"
//                     value={`${user?.balance?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? 0} TON`}
//                     subValue={`≈ $${((user?.balance ?? 0) * tonPrice).toFixed(2)}`}
//                     icon={<FaCoins className="w-4 h-4 text-blue-300" />}
//                     bgColor="bg-blue-500/20"
//                   />

//                   {/* Total Withdrawn */}
//                   <StatsCard
//                     title="Claimable"
//                     value={`${user?.total_withdrawn?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? 0} TON`}
//                     subValue={`≈ $${((user?.total_withdrawn ?? 0) * tonPrice).toFixed(2)}`}
//                     icon={<svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>}
//                     bgColor="bg-green-500/20"
//                   />

//                   {/* Total Earned */}
//                   <StatsCard
//                     title="Total Payout"
//                     value={`${(user?.payout_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON`}
//                     subValue={`≈ $${((user?.payout_balance || 0) * (tonPrice || 0)).toFixed(2)}`}
//                     icon={<svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>}
//                     bgColor="bg-yellow-500/20"
//                   />

//                   {/* Reputation Points */}
//                   <StatsCard
//                     title="Nova Token"
//                     value={`${Number(user?.total_sbt ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} NOVA`}
//                     subValue={
//                       <div className="flex items-center gap-1.5">
//                         <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center 
//                           ${getLevelIconColor(user?.total_sbt ?? 0)}`}>
//                           {getLevelIcon(user?.total_sbt ?? 0)}
//                         </div>
//                         <span>{calculatePlayerLevel(user?.total_sbt ?? 0)}</span>
//                       </div>
//                     }
//                     icon={<svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                     </svg>}
//                     bgColor="bg-purple-500/20"
//                   />

//   <StatsCard
// title="Wallet Address"
// value={userFriendlyAddress || 'Not connected'}
// subValue="" // Add this line to provide the required prop
// icon={<FaWallet />}
// bgColor="bg-purple-500/20"
// className="hidden" // Add this line
//                 />
//               </div>
//                 </div>
//               </>
//             )}

//             {activeCard === 'activity' && renderActivityCard()}

//             {activeCard === 'community' && (
//               <div className="space-y-4">
//                 {/* Header */}
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center gap-2">
//                     <div className="w-8 h-8 relative">
//                       <div className="absolute inset-0 bg-purple-500/20 rounded-lg rotate-45 animate-pulse" />
//                       <div className="absolute inset-0 flex items-center justify-center">
//                         <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                             d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
//                           </svg>
//                       </div>
//                     </div>
//                     <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//                       <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Community Updates</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Updates List */}
//                 <div className="space-y-4">
//                   {[
//                     {
//                       title: "Nova Staking Launch 🚀",
//                       date: "March 2024",
//                       description: "Experience the future of staking with enhanced rewards and community features.",
//                       status: "Live"
//                     },
//                     {
//                       title: "Community Rewards Program",
//                       date: "April 10 2025",
//                       description: "Earn extra rewards for active participation and community engagement.",
//                       status: "Live"
//                     },
//                     {
//                       title: "Nova Token Integration",
//                       date: "In Development",
//                       description: "New utility features and governance capabilities coming to NOVA token holders.",
//                       status: "Development"
//                     }
//                   ].map((update, index) => (
//                     <div key={index} className="relative p-4 rounded-lg bg-black/30 border border-purple-500/20 backdrop-blur-sm">
//                       <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-purple-400/50" />
//                       <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-purple-400/50" />
//                       <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-purple-400/50" />
//                       <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-purple-400/50" />
                      
//                       <div className="flex justify-between items-start mb-2">
//                         <h3 className="text-lg font-medium text-white">{update.title}</h3>
//                         <span className={`pixel-corners px-2 py-0.5 text-xs font-medium
//                           ${update.status === 'Live' ? 'bg-green-500/20 text-green-400' :
//                             update.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' :
//                             'bg-purple-500/20 text-purple-400'}`}>
//                           {update.status}
//                         </span>
//                       </div>
                      
//                       <p className="text-sm text-white/60 mb-2">{update.description}</p>
                      
//                       <div className="flex items-center gap-2 text-xs text-white/40">
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                             d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                         </svg>
//                         {update.date}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//           </div>
//         )}

//         {currentTab === 'network' && (
//           <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
//             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/20 blur-3xl" />
//             <ReferralSystem 
//             />
//           </div>
//         )}

//         {currentTab === 'airdrop' && (
//           <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
//             {/* Enhanced background with animated gradient */}
//             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/15 to-pink-500/10 animate-gradient-slow blur-3xl" />
//             <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] opacity-50" />

//             {/* Airdrop Card */}
//             <div className="relative max-w-md mx-auto">
//               <div className="relative backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl
//                 bg-gradient-to-b from-[#1a1c2e]/90 to-[#0d0f1d]/90">
                
//                 {/* Animated corner decorations */}
//                 <div className="absolute -top-px -left-px w-16 h-16">
//                   <div className="absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b from-purple-400/60 to-transparent" />
//                   <div className="absolute top-0 left-0 h-[2px] w-8 bg-gradient-to-r from-purple-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -top-px -right-px w-16 h-16">
//                   <div className="absolute top-0 right-0 w-[2px] h-8 bg-gradient-to-b from-purple-400/60 to-transparent" />
//                   <div className="absolute top-0 right-0 h-[2px] w-8 bg-gradient-to-l from-purple-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -bottom-px -left-px w-16 h-16">
//                   <div className="absolute bottom-0 left-0 w-[2px] h-8 bg-gradient-to-t from-purple-400/60 to-transparent" />
//                   <div className="absolute bottom-0 left-0 h-[2px] w-8 bg-gradient-to-r from-purple-400/60 to-transparent" />
//                 </div>
//                 <div className="absolute -bottom-px -right-px w-16 h-16">
//                   <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t from-purple-400/60 to-transparent" />
//                   <div className="absolute bottom-0 right-0 h-[2px] w-8 bg-gradient-to-l from-purple-400/60 to-transparent" />
//                 </div>
                
//                 {/* Header with Token Image */}
//                 <div className="flex flex-col items-center justify-center p-6 pb-2 relative">
//                   {/* Animated glow effect */}
//                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                  
//                   <div className="relative w-24 h-24 mb-4 group">
//                     <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
//                     <div className="absolute inset-0 flex items-center justify-center">
//                       <img 
//                         src={nova}
//                         alt="NOVA Token"
//                         className="w-16 h-16 object-contain animate-float"
//                       />
//                     </div>
//                     {/* Orbiting particles */}
//                     <div className="absolute w-full h-full animate-spin-slow">
//                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
//                     </div>
//                     <div className="absolute w-full h-full animate-spin-slow-reverse">
//                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-pink-400 rounded-full"></div>
//                     </div>
//                   </div>
                  
//                   <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-center mb-1">
//                     NOVA Airdrop
//                   </h2>
//                   <p className="text-white/80 text-center mb-4 max-w-xs">
//                     Complete tasks to earn <span className="text-purple-400 font-semibold">70,000 NOVA</span> tokens, the future governance token of StakeNova!
//                   </p>
                  
//                   {/* Total potential earnings */}
//                   <div className="w-full px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl mb-4">
//                     <div className="flex justify-between items-center">
//                       <span className="text-white/70 text-sm">Total Potential Earnings:</span>
//                       <span className="text-xl font-bold text-white">70,000 NOVA</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Task List */}
//                 <div className="px-4 pb-4 space-y-3">
//                   {/* Connect Wallet Task */}
//                   <button 
//                     onClick={() => {
//                       if (!tonConnectUI.connected) {
//                         tonConnectUI.openModal();
//                       } else if (!hasClaimedReward) {
//                         handleClaimReward();
//                       }
//                     }}
//                     disabled={isClaimingReward || hasClaimedReward}
//                     className={`w-full flex items-center justify-between p-4 rounded-xl relative overflow-hidden
//                       transition-all duration-300 ${
//                         hasClaimedReward 
//                           ? 'bg-green-500/20 cursor-default' 
//                           : tonConnectUI.connected
//                             ? 'bg-yellow-500/20 hover:bg-yellow-500/30 cursor-pointer'
//                             : 'bg-blue-500/80 hover:bg-blue-600/80 cursor-pointer'
//                       }`}
//                   >
//                     {/* Animated background for active buttons */}
//                     {!hasClaimedReward && (
//                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>
//                     )}
                    
//                     <div className="flex items-center gap-3 relative z-10">
//                       <div className={`w-10 h-10 rounded-full flex items-center justify-center
//                         ${hasClaimedReward 
//                           ? 'bg-green-500/20' 
//                           : tonConnectUI.connected
//                             ? 'bg-yellow-500/20'
//                             : 'bg-white/20'
//                         }`}
//                       >
//                         {hasClaimedReward ? (
//                           <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                           </svg>
//                         ) : tonConnectUI.connected ? (
//                           <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                               d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                           </svg>
//                         ) : (
//                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                               d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//                           </svg>
//                         )}
//                       </div>
//                       <div className="text-left">
//                         <div className={`font-medium ${
//                           hasClaimedReward 
//                             ? 'text-green-400' 
//                             : tonConnectUI.connected
//                               ? 'text-yellow-400'
//                               : 'text-white'
//                         }`}>
//                           {hasClaimedReward 
//                             ? 'Wallet Connect Task Completed' 
//                             : tonConnectUI.connected
//                               ? 'Claim Wallet Reward'
//                               : 'Connect Your TON Wallet'
//                           }
//                         </div>
//                         <div className="flex items-center">
//                           {isClaimingReward ? (
//                             <span className="text-white/60 text-sm">Processing...</span>
//                           ) : hasClaimedReward ? (
//                             <span className="text-white/60 text-sm">+10,000 NOVA Earned</span>
//                           ) : (
//                             <>
//                               <div className="w-4 h-4 rounded-full bg-purple-400 flex items-center justify-center mr-1">
//                                 <span className="text-xs text-black font-bold">+</span>
//                               </div>
//                               <span className="text-purple-400 text-sm font-medium">10,000 NOVA</span>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                     <div className={`relative z-10 ${
//                       hasClaimedReward 
//                         ? 'text-green-400' 
//                         : tonConnectUI.connected
//                           ? 'text-yellow-400'
//                           : 'text-white'
//                     }`}>
//                       {isClaimingReward ? (
//                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
//                       ) : (
//                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                             d={hasClaimedReward ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} />
//                         </svg>
//                       )}
//                     </div>
//                   </button>

//                   {/* Stake TON Task */}
//                   <button 
//                     onClick={() => {
//                       if (!tonConnectUI.connected) {
//                         showSnackbar({
//                           message: 'Connect Wallet',
//                           description: 'Please connect your wallet first'
//                         });
//                         return;
//                       }
//                       setShowDepositModal(true);
//                     }}
//                     className={`w-full flex items-center justify-between p-4 rounded-xl relative overflow-hidden
//                       transition-all duration-300 ${
//                         Boolean(isStakingCompleted) 
//                           ? 'bg-green-500/20 cursor-default' 
//                           : hasStaked
//                             ? 'bg-yellow-500/20 hover:bg-yellow-500/30'
//                             : 'bg-black/50 hover:bg-black/70'
//                       }`}
//                     disabled={Boolean(isStakingCompleted)}
//                   >
//                     {/* Animated background for active buttons */}
//                     {!isStakingCompleted && hasStaked && (
//                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>
//                     )}
                    
//                     <div className="flex items-center gap-3 relative z-10">
//                       <div className={`w-10 h-10 rounded-full flex items-center justify-center
//                         ${Boolean(isStakingCompleted) 
//                           ? 'bg-green-500/20' 
//                           : hasStaked
//                             ? 'bg-yellow-500/20'
//                             : 'bg-white/10'
//                         }`}
//                       >
//                         {Boolean(isStakingCompleted) ? (
//                           <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                           </svg>
//                         ) : (
//                           <img 
//                             src={toncoin}
//                             alt="TON"
//                             className="w-6 h-6 object-contain"
//                           />
//                         )}
//                       </div>
//                       <div className="text-left">
//                         <div className={`font-medium ${
//                           Boolean(isStakingCompleted) 
//                             ? 'text-green-400' 
//                             : hasStaked
//                               ? 'text-yellow-400'
//                               : 'text-white'
//                         }`}>
//                           {Boolean(isStakingCompleted) 
//                             ? 'Staking Task Completed' 
//                             : hasStaked
//                               ? `Staked: ${user?.balance?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON`
//                               : 'Stake TON in StakeNova'
//                           }
//                         </div>
// <div className="flex items-center">
//   {Boolean(isStakingCompleted) ? (
//     <span className="text-white/60 text-sm">+10,000 NOVA Earned</span>
//   ) : hasStaked ? (
//     <span className="text-white/60 text-sm">
//       Need ${Math.max(0, (1 - (user?.balance || 0))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON more
//     </span>
//   ) : (
//     <>
//       <div className="w-4 h-4 rounded-full bg-purple-400 flex items-center justify-center mr-1">
//         <span className="text-xs text-black font-bold">+</span>
//       </div>
//       <span className="text-purple-400 text-sm font-medium">10,000 NOVA</span>
//     </>
//   )}
// </div>
//                       </div>
//                     </div>
//                     <div className={`relative z-10 ${
//                       Boolean(isStakingCompleted) 
//                         ? 'text-green-400' 
//                         : hasStaked
//                           ? 'text-yellow-400'
//                           : 'text-white'
//                     }`}>
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                           d={Boolean(isStakingCompleted) ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} />
//                       </svg>
//                     </div>
//                   </button>

//                   {/* Complete Social Tasks */}
//                   <button 
//                     onClick={() => {
//                       if (!tonConnectUI.connected) {
//                         showSnackbar({
//                           message: 'Connect Wallet',
//                           description: 'Please connect your wallet first'
//                         });
//                         return;
//                       }
//                       setCurrentTab('tasks');
//                     }}
//                     className={`w-full flex items-center justify-between p-4 rounded-xl relative overflow-hidden
//                       transition-all duration-300 ${
//                         localStorage.getItem('hasClaimedAllTasksBonus') === 'true'
//                           ? 'bg-green-500/20 cursor-default' 
//                           : 'bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-600/80 hover:to-purple-600/80'
//                       }`}
//                   >
//                     {/* Animated background for active buttons */}
//                     {localStorage.getItem('hasClaimedAllTasksBonus') !== 'true' && (
//                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>
//                     )}
                    
//                     <div className="flex items-center gap-3 relative z-10">
//                       <div className={`w-10 h-10 rounded-full flex items-center justify-center
//                         ${localStorage.getItem('hasClaimedAllTasksBonus') === 'true' 
//                           ? 'bg-green-500/20' 
//                           : 'bg-white/20'
//                         }`}
//                       >
//                         {localStorage.getItem('hasClaimedAllTasksBonus') === 'true' ? (
//                           <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                           </svg>
//                         ) : (
//                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                               d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 21.418 18 23 18c1.746 0 3.332-.477 4.5-1.253V6.253c0-1.066-1.668-1.5-4.5-1.5S12 5.187 12 6.253z" />
//                           </svg>
//                         )}
//                       </div>
//                       <div className="text-left">
//                         <div className={`font-medium ${
//                           localStorage.getItem('hasClaimedAllTasksBonus') === 'true' 
//                             ? 'text-green-400' 
//                             : 'text-white'
//                         }`}>
//                           {localStorage.getItem('hasClaimedAllTasksBonus') === 'true' 
//                             ? 'Social Tasks Completed' 
//                             : 'Complete Social Tasks'
//                           }
//                         </div>
//                         <div className="flex items-center">
//                           {localStorage.getItem('hasClaimedAllTasksBonus') === 'true' ? (
//                             <span className="text-white/60 text-sm">+25,000 NOVA Earned</span>
//                           ) : (
//                             <>
//                               <div className="w-4 h-4 rounded-full bg-pink-400 flex items-center justify-center mr-1">
//                                 <span className="text-xs text-black font-bold">+</span>
//                               </div>
//                               <span className="text-pink-300 text-sm font-medium">25,000 NOVA</span>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                     <div className={`relative z-10 ${
//                       localStorage.getItem('hasClaimedAllTasksBonus') === 'true' 
//                         ? 'text-green-400' 
//                         : 'text-white'
//                     }`}>
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                           d={localStorage.getItem('hasClaimedAllTasksBonus') === 'true' ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} />
//                       </svg>
//                     </div>
//                   </button>

//                   {/* Mint NovaClub NFT Pass */}
//                   <button 
//                     onClick={() => {
//                       if (!tonConnectUI.connected) {
//                         showSnackbar({
//                           message: 'Connect Wallet',
//                           description: 'Please connect your wallet first'
//                         });
//                         return;
//                       }
                      
//                       // Don't open modal if already minting or minted
//                       if (nftMintStatus === 'loading' || hasNFTPass) return;
                      
//                       setShowNFTMinterModal(true);
//                     }}
//                     className={`w-full flex items-center justify-between p-4 rounded-xl relative overflow-hidden
//                       transition-all duration-300 ${
//                         hasNFTPass
//                           ? 'bg-green-500/20 cursor-default' 
//                           : nftMintStatus === 'loading'
//                             ? 'bg-blue-500/20 cursor-wait'
//                             : 'bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/80 hover:to-blue-600/80'
//                       }`}
//                     disabled={nftMintStatus === 'loading' || hasNFTPass}
//                   >
//                     {/* Animated background for active buttons */}
//                     {!hasNFTPass && nftMintStatus !== 'loading' && (
//                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>
//                     )}
                    
//                     <div className="flex items-center gap-3 relative z-10">
//                       <div className={`w-10 h-10 rounded-full flex items-center justify-center
//                         ${hasNFTPass 
//                           ? 'bg-green-500/20' 
//                           : nftMintStatus === 'loading'
//                             ? 'bg-blue-500/20'
//                             : 'bg-white/20'
//                         }`}
//                       >
//                         {hasNFTPass ? (
//                           <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                           </svg>
//                         ) : nftMintStatus === 'loading' ? (
//                           <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
//                         ) : (
//                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                               d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
//                           </svg>
//                         )}
//                       </div>
//                       <div className="text-left">
//                         <div className={`font-medium ${
//                           hasNFTPass 
//                             ? 'text-green-400'
//                             : nftMintStatus === 'loading'
//                               ? 'text-blue-400'
//                               : 'text-white'
//                         }`}>
//                           {hasNFTPass 
//                             ? 'NovaClub Pass Minted'
//                             : nftMintStatus === 'loading'
//                               ? 'Minting in progress...'
//                               : 'Mint NovaClub Airdrop Pass'
//                           }
//                         </div>
//                         <div className="flex items-center">
//                           {hasNFTPass ? (
//                             <span className="text-white/60 text-sm">+25,000 NOVA Earned</span>
//                           ) : nftMintStatus === 'loading' ? (
//                             <span className="text-blue-300/60 text-sm">Please wait...</span>
//                           ) : (
//                             <>
//                               <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center mr-1">
//                                 <span className="text-xs text-black font-bold">+</span>
//                               </div>
//                               <span className="text-blue-300 text-sm font-medium">25,000 NOVA</span>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                     <div className={`relative z-10 ${
//                       hasNFTPass 
//                         ? 'text-green-400'
//                         : nftMintStatus === 'loading'
//                           ? 'text-blue-400'
//                           : 'text-white'
//                     }`}>
//                       {nftMintStatus === 'loading' ? (
//                         <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
//                       ) : (
//                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                             d={hasNFTPass ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} />
//                         </svg>
//                       )}
//                     </div>
//                   </button>
//    </div>

//                 {/* Progress Bar */}
//                 <div className="px-6 pb-6">
//                   <div className="mb-2 flex justify-between items-center">
//                     <span className="text-xs text-white/60">Your progress</span>
//                     <span className="text-xs font-medium text-white">
//                       {(() => {
//                         // Count completed tasks
//                         let completedCount = 0;
//                         if (hasClaimedReward) completedCount++;
//                         if (isStakingCompleted) completedCount++;
//                         if (localStorage.getItem('hasClaimedAllTasksBonus') === 'true') completedCount++;
//                         if (hasNFTPass) completedCount++;
                        
//                         // Total number of tasks
//                         const totalTasks = 4;
                        
//                         return `${completedCount}/${totalTasks} completed`;
//                       })()}
//                     </span>
//                   </div>
//                   <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden relative">
//                     <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:8px_8px]"></div>
//                     <div 
//                       className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative" 
//                       style={{ 
//                         width: `${(() => {
//                           // Calculate percentage
//                           let completedCount = 0;
//                           if (hasClaimedReward) completedCount++;
//                           if (isStakingCompleted) completedCount++;
//                           if (localStorage.getItem('hasClaimedAllTasksBonus') === 'true') completedCount++;
//                           if (hasNFTPass) completedCount++;
                          
//                           const totalTasks = 4;
//                           return (completedCount / totalTasks) * 100;
//                         })()}%` 
//                       }}
//                     >
//                       <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer -translate-x-full"></div>
//                     </div>
//                   </div>
                  
//                   {/* Total earned display */}
//                   <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
//                     <div className="flex justify-between items-center">
//                       <div className="text-white/70">Total NOVA earned:</div>
//                       <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
//                         {(() => {
//                           // Calculate total earned
//                           let totalEarned = 0;
//                           if (hasClaimedReward) totalEarned += 10000;
//                           if (isStakingCompleted) totalEarned += 10000;
//                           if (localStorage.getItem('hasClaimedAllTasksBonus') === 'true') totalEarned += 25000;
//                           if (hasNFTPass) totalEarned += 25000;
                          
//                           return totalEarned.toLocaleString();
//                         })()} NOVA
//                       </div>
//                     </div>
//                   </div>

//                   {/* Total earned display */}
// {/* NOVA Balance Display - NotCoin Style */}
// <div className="mt-6 relative overflow-hidden">
//   {/* Background with animated gradient */}
//   <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-500/20 to-purple-600/20 animate-gradient-x rounded-xl"></div>
//   <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:8px_8px]"></div>
  
//   {/* Content */}
//   <div className="relative p-5 rounded-xl border border-purple-500/30">
//     <div className="flex flex-col items-center">
//       {/* Token Icon */}
//       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-2 shadow-lg shadow-purple-500/20">
//         <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//         </svg>
//       </div>
      
//       {/* Balance */}
//       <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
//         {user?.total_sbt?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? 0}
//       </div>
      
//       {/* Token Name */}
//       <div className="text-white/70 text-sm mb-3">NOVA Tokens</div>
      
//       {/* Progress Bar */}
//       <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
//         <div 
//           className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative overflow-hidden"
//           style={{ width: `${Math.min(((user?.total_sbt ?? 0) / 100) * 100, 100)}%` }}
//         >
//           <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
//         </div>
//       </div>
      
//       {/* Level */}
//       <div className="text-xs text-white/60">
//       {calculatePlayerLevel(user?.total_sbt ?? 0)} • {Math.floor(((user?.total_sbt ?? 0) % 100) * 100) / 100}% to next level
//       </div>
//     </div>
//   </div>
// </div>
                  
//                   {/* Info text */}
//                   <div className="mt-4 flex items-start gap-2 text-xs text-white/50">
//                     <svg className="w-4 h-4 text-purple-400/70 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <span>
//                       NOVA tokens will be claimable after the token generation event. Complete all tasks to maximize your allocation in the upcoming airdrop.
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {currentTab === 'tasks' && (
//           <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
//             {/* Glowing background effect */}
//             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/30 blur-3xl" />
//             {/* Content */}
//             <div className="relative">
//               <SocialTasks showSnackbar={showSnackbar}/>
//             </div>
//           </div>
//         )}

//         {currentTab === 'token' && (
//           <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
//             {/* Glowing background effect */}
//             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/30 blur-3xl" />
//             {/* Content */}
//             <div className="relative">
//               <TokenLaunchpad />
//                   </div>
//                   </div>
//         )}

// {currentTab === 'admin' && (
//         <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
//           <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          
//           {/* Admin Withdrawal Panel */}
//           <AdminWithdrawalPanel />
          
//           {/* You can add more admin panels here */}
//                   </div>
//       )}
//                   </div>

//       {/* NFT Minter Modal */}
// {showNFTMinterModal && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//     <div className="bg-gradient-to-b from-[#1a1c2e] to-[#0d0f1d] rounded-xl w-full max-w-md border-2 border-purple-500/20 shadow-xl shadow-purple-500/10">
//       <div className="p-4">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 relative">
//               <div className="absolute inset-0 bg-purple-500/20 rounded-lg rotate-45 animate-pulse" />
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
//                 </svg>
//                       </div>
//                       </div>
//             <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//               <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
//                 NovaClub NFT Pass
//               </span>
//             </div>
//           </div>
//           <button 
//             onClick={() => {
//               setShowNFTMinterModal(false);
//               // Reset status if not successful
//               if (nftMintStatus !== 'success') {
//                 setNftMintStatus('idle');
//               }
//             }}
//             className="text-white/60 hover:text-white"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//                     </div>
                    
//         {/* NFT Minter Component */}
//         <NFTMinter 
//           onStatusChange={(status, hasMinted) => {
//             // Update local status state
//             setNftMintStatus(status);
            
//             // If already minted, update state
//             if (hasMinted && !hasNFTPass) {
//               setHasNFTPass(true);
//               localStorage.setItem('hasClaimedNFTPass', 'true');
//             }
//           }}
//           onMintSuccess={handleNFTMintSuccess}
//         />
//       </div>
//     </div>
//   </div>
// )}
             

//        {/* Deposit Modal */}
//     {showDepositModal && (
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//         <div className="bg-gradient-to-b from-[#1a1c2e] to-[#0d0f1d] rounded-xl w-full max-w-md border-2 border-blue-500/20 shadow-xl shadow-blue-500/10">
//           <div className="p-4">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-4">
//                         <div className="flex items-center gap-2">
//                 <div className="w-8 h-8 relative">
//                   <div className="absolute inset-0 bg-blue-500/20 rounded-lg rotate-45 animate-pulse" />
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                     </svg>
//                   </div>
//                 </div>
//                 <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//                   <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
//                     {user?.balance && user.balance > 0 ? 'Top Up TON' : 'Deposit TON'}
//                           </span>
//                         </div>
//                       </div>
//               <button 
//                 onClick={() => {
//                   setShowDepositModal(false);
//                   setDepositStatus('idle');
//                   setCustomAmount('');
//                 }}
//                 className="text-white/60 hover:text-white"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             {depositStatus === 'pending' ? (
//               <div className="text-center py-8">
//                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
//                 <p className="text-white font-medium">Processing Deposit...</p>
//                 <p className="text-sm text-white/60 mt-2">Please wait while we confirm your transaction</p>
//               </div>
//             ) : (
//               <>
//                 {/* Quick Select Grid */}
//                 <div className="grid grid-cols-3 gap-2 mb-4">
//                   {[1, 5, 10, 50, 100, 500].map((amount) => (
//                     <button
//                       key={amount}
//                       onClick={() => {
//                         setCustomAmount(amount.toString());
//                         handleDeposit(amount);
//                       }}
//                       className="pixel-corners relative px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 
//                         border border-blue-500/30 group transition-all duration-200"
//                     >
//                       <div className="absolute inset-0 bg-grid-blue/[0.02] bg-[length:8px_8px] opacity-0 group-hover:opacity-100 transition-opacity" />
//                       <span className="text-sm font-medium text-blue-400">{amount} TON</span>
//                     </button>
//                   ))}
//                 </div>

//                 {/* Custom Amount Input */}
//                 <div className="space-y-3 mb-4">
//                   <div className="relative">
//                     <input
//                       type="number"
//                       placeholder="Enter custom amount"
//                       min="0.1"
//                       step="0.1"
//                       value={customAmount}
//                       onChange={(e) => {
//                         // Validate input to ensure it's a proper number
//                         const value = e.target.value;
//                         if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
//                           setCustomAmount(value);
//                         }
//                       }}
//                       className="w-full px-4 py-3 bg-blue-900/10 border border-blue-500/20 rounded-lg 
//                         text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
//                     />
//                     <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm">TON</div>
//                   </div>

//                   {/* Deposit Button */}
//                   <button
//                     onClick={() => {
//                       const amount = parseFloat(customAmount);
//                       if (!isNaN(amount) && amount >= 0.1) {
//                         handleDeposit(amount);
//                       } else {
//                         showSnackbar({ 
//                           message: 'Invalid Amount', 
//                           description: 'Please enter a valid amount (minimum 0.1 TON).' 
//                         });
//                       }
//                     }}
//                     disabled={!customAmount || parseFloat(customAmount) < 0.1}
//                     className={`w-full py-3 pixel-corners font-medium transition-all duration-200 
//                       ${!customAmount || parseFloat(customAmount) < 0.1
//                         ? 'bg-blue-500/50 text-white/50 cursor-not-allowed'
//                         : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
//                       }`}
//                   >
//                     {user?.balance && user.balance > 0 
//                       ? `Top Up ${customAmount ? `${parseFloat(customAmount).toFixed(2)} TON` : 'TON'}`
//                       : `Deposit ${customAmount ? `${parseFloat(customAmount).toFixed(2)} TON` : 'TON'}`}
//                   </button>
//                 </div>

//                 {/* Earnings Preview */}
//                 {customAmount && parseFloat(customAmount) >= 1 && (
//                   <div className="bg-blue-900/10 rounded-lg p-3 border border-blue-500/20 space-y-3">
//                     {/* Basic Stake Info */}
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-white/60">Deposit Amount</span>
//                       <span className="text-white font-medium">{parseFloat(customAmount).toFixed(2)} TON</span>
//                     </div>

//                     {/* Daily Earnings */}
//                     <div className="pt-2 border-t border-blue-500/20">
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-white/60">Daily Earnings</span>
//                         <span className="text-green-400 font-medium">
//                           +{(parseFloat(customAmount) * currentROI).toFixed(6)} TON/day
//                         </span>
//                       </div>
//                     </div>

//                     {/* Potential Return */}
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-white/60">100-Day Return</span>
//                       <div className="text-right">
//                         <span className="text-blue-400 font-medium">
//                           {(parseFloat(customAmount) + calculateTotalEarnings(parseFloat(customAmount))).toFixed(2)} TON
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Info Footer */}
//                 <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
//                   <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <span>Minimum deposit: 1 TON • Lock period: 100 days</span>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     )}


//       {/* Withdrawal Info Modal */}
//       <WithdrawalInfoModal
//         isOpen={showWithdrawalInfo}
//         onClose={() => {
//           if (!isRestaking) {
//             setShowWithdrawalInfo(false);
//           }
//         }}
//         depositDate={user?.balance && user?.last_deposit_date ? new Date(user.last_deposit_date) : null}
//         currentEarnings={earningState.currentEarnings}
//         stakedAmount={user?.balance || 0}
//         onRestake={handleRestake}
//         onStake={() => {
//           setShowWithdrawalInfo(false);
//           setShowDepositModal(true);
//         }}
//         payoutWallet={user?.payout_wallet || null}
//         onSetPayoutWallet={handleSetPayoutWallet}
//       />
      

//       {/* Offline Rewards Modal */}
//       {showOfflineRewardsModal && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
//           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
//           <div className="relative bg-[#1A1B1E] rounded-xl border border-white/10 p-6 max-w-md w-full">
//             <div className="text-center space-y-4">
//               <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
//                 <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                     d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-bold text-white">Offline Rewards Available!</h3>
//               <p className="text-white/60">
//                 You've earned rewards while you were away:
//               </p>
//               <div className="text-2xl font-bold text-blue-400">
//                 {offlineRewardsAmount.toFixed(8)} TON
//               </div>
//               <div className="flex gap-3 mt-6">
//                 <button
//                   onClick={() => setShowOfflineRewardsModal(false)}
//                   className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleClaimOfflineRewards}
//                   className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
//                 >
//                   Claim Rewards
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Bottom Navigation */}
//       <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-blue-500/20 safe-area-pb">
//         <div className="max-w-lg mx-auto px-2 md:px-4">
//           <div className="grid grid-cols-5 items-center">
//             {[
//               { id: 'home', text: 'Home', Icon: AiOutlineHome },
//               { id: 'tasks', text: 'Tasks', Icon: GiScrollUnfurled },
//               { id: 'airdrop', text: 'Airdrop', Icon: GiParachute },
//               { id: 'network', text: 'Referral', Icon: FaUserPlus },
//               { id: 'token', text: 'Token', Icon: BsCoin },
//               { id: 'admin', text: 'Admin', Icon: FaUserCog },
//             ].map(({ id, text, Icon }) => (
//               <button 
//                 key={id} 
//                 onClick={() => setCurrentTab(id)}
//                 className={`flex flex-col items-center py-3 md:py-4 w-full transition-all duration-300 ${
//                   currentTab === id ? 'text-blue-400' : 'text-gray-500'
//                 }`}
//               >
//                 <Icon size={18} className="mb-1" />
//                 <span className="text-[10px] md:text-xs font-medium tracking-wide truncate max-w-[64px] text-center">
//                   {text}
//                   </span>
//               </button>
//             ))}
//           </div>
//                 </div>
//               </div>

//         {/* Add Snackbar component before closing div */}
//         {isSnackbarVisible && (
//           <Snackbar
//             onClose={() => {
//               setSnackbarVisible(false);
//               if (snackbarTimeoutRef.current) {
//                 clearTimeout(snackbarTimeoutRef.current);
//               }
//             }}
//             duration={SNACKBAR_DURATION}
//             description={snackbarDescription}
//             after={
//               <Button 
//                 size="s" 
//                 onClick={() => {
//                   setSnackbarVisible(false);
//                   if (snackbarTimeoutRef.current) {
//                     clearTimeout(snackbarTimeoutRef.current);
//                   }
//                 }}
//               >
//                 Close
//               </Button>
//             }
//             className="snackbar-top"
//           >
//             {snackbarMessage}
//           </Snackbar>
//         )}
//       </div>
//   );
// };

//   // Update the ReStakeCountdown component
//   const ReStakeCountdown: FC<{ depositDate: Date }> = ({ depositDate }) => {
//     const [timeLeft, setTimeLeft] = useState<string>('');
//     const [isLocked, setIsLocked] = useState(true);

//     useEffect(() => {
//       const calculateTimeLeft = () => {
//         const now = Date.now();
//         const startTime = depositDate.getTime();
//         const endTime = startTime + LOCK_PERIOD_MS;
//         const remaining = endTime - now;

//         if (remaining <= 0) {
//           setIsLocked(false);
//           setTimeLeft('Unlocked');
//           return;
//         }

//         // Calculate remaining time
//         const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
//         const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//         const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

//         setTimeLeft(`${days}d ${hours}h ${minutes}m`);
//         setIsLocked(true);
//       };

//       calculateTimeLeft();
//       const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

//       return () => clearInterval(interval);
//     }, [depositDate]);

//     return (
//       <div className="flex items-center gap-2">
//         <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
//         <span className="text-xs">
//           {isLocked ? (
//             <>
//               <span className="text-white/60">Locked for: </span>
//               <span className="text-white/80 font-medium">{timeLeft}</span>
//             </>
//           ) : (
//             <span className="text-green-400">Ready for withdrawal</span>
//           )}
//         </span>
//       </div>
//     );
//   };

// const calculateTotalEarnings = (amount: number): number => {
//   let totalEarnings = 0;
//   let currentROI = 0.01; // Start at 1%
  
//   // Calculate earnings for each day up to 100 days
//   for (let day = 1; day <= 100; day++) {
//     // Update ROI every 5 days
//     if (day > 1 && day % 5 === 1) {
//       currentROI = Math.min(currentROI + 0.005, 0.11); // Increase by 0.5%, max 11%
//     }
    
//     // Add daily earnings
//     totalEarnings += amount * currentROI;
//   }
  
//   return totalEarnings;
// };

// const getActivityDescription = (activity: Activity): string => {
//   switch (activity.type) {
//     case 'deposit':
//       return `Initial deposit of ${activity.amount.toFixed(9)} TON`;
//     case 'top_up':
//       return `Added ${activity.amount.toFixed(9)} TON to stake`;
//     case 'withdrawal':
//       return `Withdrew ${activity.amount.toFixed(9)} TON`;
//     case 'stake':
//       return `Staked ${activity.amount.toFixed(9)} TON`;
//     case 'redeposit':
//       return `Redeposited ${activity.amount.toFixed(9)} TON`;
//     case 'nova_reward':
//       return `Received ${activity.amount.toFixed(9)} NOVA tokens`;
//     case 'nova_income':
//       return `Earned ${activity.amount.toFixed(9)} TON`;
//     case 'offline_reward':
//       return `Collected ${activity.amount.toFixed(9)} TON offline earnings`;
//     case 'earnings_update':
//       return `Earnings updated: +${activity.amount.toFixed(9)} TON`;
//     case 'claim':
//       return `Claimed ${activity.amount.toFixed(9)} TON`;
//     case 'transfer':
//       return `Transferred ${activity.amount.toFixed(9)} TON`;
//     case 'reward':
//       return `Received ${activity.amount.toFixed(9)} TON reward`;
//     case 'bonus':
//       return `Received ${activity.amount.toFixed(9)} TON bonus`;
//     default:
//       return `${activity.type}: ${activity.amount.toFixed(9)} TON`;
//   }
// };

// const SYNC_INTERVAL = 60000; // Sync every minute

// // Add this new component near your other components
// const WeeklyPayoutCountdown = () => {
//   const [timeUntilPayout, setTimeUntilPayout] = useState('');

//   useEffect(() => {
//     const calculateNextPayout = () => {
//       const now = new Date();
//       const nextFriday = new Date();
      
//       // Set to next Friday at 00:00 UTC
//       nextFriday.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay() + 5) % 7));
//       nextFriday.setUTCHours(0, 0, 0, 0);
      
//       // If it's already past Friday, move to next week
//       if (now >= nextFriday) {
//         nextFriday.setUTCDate(nextFriday.getUTCDate() + 7);
//       }

//       const diff = nextFriday.getTime() - now.getTime();
      
//       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//       const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//       const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
//       setTimeUntilPayout(`${days}d ${hours}h ${minutes}m`);
//     };

//     calculateNextPayout();
//     const timer = setInterval(calculateNextPayout, 60000); // Update every minute
//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <div className="flex items-center gap-2 text-sm">
//       <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//           d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//       </svg>
//       <span>Next payout in: {timeUntilPayout}</span>
//     </div>
//   );
// };

// // Function to calculate player level based on NOVA token balance (1 to 10 million range)
// const calculatePlayerLevel = (novaBalance: number): string => {
//   // Level thresholds and names for 1 to 10 million range
//   const levels = [
//     { threshold: 0, name: "Nova Recruit" },       // Level 1: 0-999
//     { threshold: 1000, name: "Nova Initiate" },   // Level 2: 1K-9.9K
//     { threshold: 10000, name: "Nova Explorer" },  // Level 3: 10K-49.9K
//     { threshold: 50000, name: "Nova Voyager" },   // Level 4: 50K-99.9K
//     { threshold: 100000, name: "Nova Guardian" }, // Level 5: 100K-499.9K
//     { threshold: 500000, name: "Nova Sentinel" }, // Level 6: 500K-999.9K
//     { threshold: 1000000, name: "Nova Sovereign" },// Level 7: 1M-4.99M
//     { threshold: 5000000, name: "Nova Legend" },   // Level 8: 5M-9.99M
//     { threshold: 10000000, name: "Nova Immortal" },// Level 9: 10M+
//   ];
  
//   // Find the player's level
//   let levelIndex = 0;
//   for (let i = 1; i < levels.length; i++) {
//     if (novaBalance >= levels[i].threshold) {
//       levelIndex = i;
//     } else {
//       break;
//     }
//   }
  
//   // Get level name
//   const levelName = levels[levelIndex].name;
  
//   return levelName;
// };

// // Function to get the appropriate level icon based on NOVA balance
// const getLevelIcon = (novaBalance: number): JSX.Element => {
//   // Determine which icon to show based on level
//   if (novaBalance >= 10000000) {
//     // Immortal - Crown
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-0.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
//       </svg>
//     );
//   } else if (novaBalance >= 5000000) {
//     // Legend - Star
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//       </svg>
//     );
//   } else if (novaBalance >= 1000000) {
//     // Grandmaster - Shield
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//       </svg>
//     );
//   } else if (novaBalance >= 500000) {
//     // Master - Medal
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//       </svg>
//     );
//   } else if (novaBalance >= 100000) {
//     // Diamond - Diamond
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
//       </svg>
//     );
//   } else if (novaBalance >= 50000) {
//     // Platinum - Lightning
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
//       </svg>
//     );
//   } else if (novaBalance >= 10000) {
//     // Gold - Sun
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
//       </svg>
//     );
//   } else if (novaBalance >= 1000) {
//     // Silver - Moon
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
//       </svg>
//     );
//   } else {
//     // Bronze - Circle
//     return (
//       <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//       </svg>
//     );
//   }
// };

// // Function to get the appropriate background color for the level icon
// const getLevelIconColor = (novaBalance: number): string => {
//   if (novaBalance >= 10000000) {
//     return "bg-gradient-to-br from-purple-600 to-pink-600"; // Immortal
//   } else if (novaBalance >= 5000000) {
//     return "bg-gradient-to-br from-purple-500 to-blue-500"; // Legend
//   } else if (novaBalance >= 1000000) {
//     return "bg-gradient-to-br from-red-500 to-purple-500"; // Grandmaster
//   } else if (novaBalance >= 500000) {
//     return "bg-gradient-to-br from-red-500 to-orange-500"; // Master
//   } else if (novaBalance >= 100000) {
//     return "bg-blue-500"; // Diamond
//   } else if (novaBalance >= 50000) {
//     return "bg-cyan-500"; // Platinum
//   } else if (novaBalance >= 10000) {
//     return "bg-yellow-500"; // Gold
//   } else if (novaBalance >= 1000) {
//     return "bg-gray-400"; // Silver
//   } else {
//     return "bg-amber-700"; // Bronze
//   }
// };

