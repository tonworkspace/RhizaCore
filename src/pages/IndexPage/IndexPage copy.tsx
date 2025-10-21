// import { useTonConnectUI } from '@tonconnect/ui-react';
// import { toUserFriendlyAddress } from '@tonconnect/sdk';
// import { FC, useState, useEffect, useRef } from 'react';
// import { FaCoins, FaWallet, FaUserPlus } from 'react-icons/fa';
// import { BiNetworkChart } from 'react-icons/bi';
// import { AiOutlineHome, AiOutlineCheckSquare } from 'react-icons/ai';
// import { TonConnectButton, } from '@tonconnect/ui-react';
// import { useAuth } from '@/hooks/useAuth';
// import { supabase } from '@/lib/supabaseClient';
// import { getTONPrice } from '@/lib/api';
// import GMPLeaderboard from '@/components/GMPLeaderboard';
// import { OnboardingScreen } from './OnboardingScreen';
// import { toNano, fromNano } from "ton";
// import TonWeb from 'tonweb';
// import { Button } from '@telegram-apps/telegram-ui';
// import { Snackbar } from '@telegram-apps/telegram-ui';
// import ReferralSystem from '@/components/ReferralSystem';
// import TokenLaunchpad from '@/components/TokenLaunchpad';
// import { WithdrawalInfoModal } from '@/components/WithdrawalInfoModal';
// import { BsCoin } from 'react-icons/bs';
// import SocialTasks from '@/components/SocialTasks';


// interface StatsCardProps {
//   title: string;
//   value: string | number;
//   subValue?: string;
//   icon: JSX.Element;
//   bgColor: string;
//   className?: string;
// }

// const StatsCard: FC<StatsCardProps> = ({ title, value, subValue, icon, bgColor, className }) => (
//   <div className={`relative bg-gradient-to-br from-[#0A0A0F] to-[#11131A] rounded-xl p-4 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] ${className}`}>
//     {/* Animated Corner Decorations */}
//     <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400/50" />
//     <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400/50" />
//     <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400/50" />
//     <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400/50" />
    
//     <div className="flex items-center gap-4">
//       <div className={`${bgColor} p-2.5 rounded-lg flex-shrink-0 bg-opacity-20`}>
//         {icon}
//       </div>
//       <div className="min-w-0">
//         <p className="text-xs text-blue-300/60">{title}</p>
//         <p className="text-sm font-semibold text-white mt-1 truncate">{value}</p>
//         {subValue && <p className="text-[10px] text-blue-300/40 mt-0.5">{subValue}</p>}
//       </div>
//     </div>
//   </div>
// );

// type CardType = 'stats' | 'activity' | 'community';

// // Add this type definition at the top of the file
// type ActivityType = 'deposit' | 'withdrawal' | 'stake' | 'redeposit' | 'nova_reward' | 'offline_reward';

// // Add these interfaces
// interface Activity {
//   id: string;
//   user_id: string;
//   type: ActivityType;
//   amount: number;
//   status: 'completed' | 'pending' | 'failed';
//   created_at: string;
//   metadata?: {
//     offline_duration?: number;
//     start_timestamp?: string;
//     end_timestamp?: string;
//     earning_rate?: number;
//     previous_balance?: number;
//     new_balance?: number;
//     [key: string]: any;
//   };
//   description?: string;
//   category?: string;
//   source?: string;
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
// const MAINNET_DEPOSIT_ADDRESS = 'UQASkbQTNxOa_N3hIN_mpE5aHlHG9OzG5pSFv-RMt7q-fmsB';
// const TESTNET_DEPOSIT_ADDRESS = 'UQASkbQTNxOa_N3hIN_mpE5aHlHG9OzG5pSFv-RMt7q-fmsB';

// const isMainnet = true; // You can toggle this for testing

// // Use the appropriate address based on network
// const DEPOSIT_ADDRESS = isMainnet ? MAINNET_DEPOSIT_ADDRESS : TESTNET_DEPOSIT_ADDRESS;

// // Constants for both networks
// const MAINNET_API_KEY = '509fc324e5a26df719b2e637cad9f34fd7c3576455b707522ce8319d8b450441';
// const TESTNET_API_KEY = 'bb31868e5cf6529efb16bcf547beb3c534a28d1e139bd63356fd936c168fe662';

// // Use toncenter.com as HTTP API endpoint to interact with TON blockchain
// const tonweb = isMainnet ?
//     new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {apiKey: MAINNET_API_KEY})) :
//     new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: TESTNET_API_KEY}));


// const MAX_EARNINGS_MULTIPLIER = 2; // 200% of staked amount
// const MIN_EARNINGS_CHECK_INTERVAL = 1000; // 1 second

// const LAST_SYNC_KEY = 'last_earnings_sync';

// // Add with other constants
// const MAX_DAILY_RATE = 0.11; // 11% daily maximum rate

// // Add this near the top with other constants
// // const NETWORK_NAME = isMainnet ? 'Mainnet' : 'Testnet';

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
// }

// // Add these constants
// const EARNINGS_SYNC_INTERVAL = 60000; // Sync with server every 60 seconds
// const EARNINGS_STORAGE_KEY = 'user_earnings_state';

// // Add this interface near other interfaces
// interface OfflineEarnings {
//   lastActiveTimestamp: number;
//   baseEarningRate: number;
// }

// // Add this constant near other constants
// const OFFLINE_EARNINGS_KEY = 'offline_earnings_state';

// // Add this constant near other constants
// const TOTAL_EARNED_KEY = 'total_earned_state';

// // Update the calculateStakingProgress function
// const calculateStakingProgress = (depositDate: Date | string | null): number => {
//   if (!depositDate) return 0;
  
//   // Convert string to Date if necessary
//   const startDate = typeof depositDate === 'string' ? new Date(depositDate) : depositDate;
  
//   // Validate the date
//   if (isNaN(startDate.getTime())) return 0;

//   const now = Date.now();
//   const startTime = startDate.getTime();
//   const endTime = startTime + (100 * 24 * 60 * 60 * 1000); // 100 days
  
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

// const loadTotalEarned = (): number => {
//   const stored = localStorage.getItem(TOTAL_EARNED_KEY);
//   return stored ? parseFloat(stored) : 0;
// };

// // Add Nova token calculation constants
// const NOVA_TOKEN_TIERS = {
//   TIER1: { min: 0, max: 100, multiplier: 10 },      // 2x for first 100 TON
//   TIER2: { min: 100, max: 500, multiplier: 10 },  // 1.5x for 100-500 TON
//   TIER3: { min: 500, max: 1000, multiplier: 10 }, // 1.25x for 500-1000 TON
//   TIER4: { min: 1000, max: Infinity, multiplier: 10 } // 1x for 1000+ TON
// };

// // Add Nova token calculation function
// const calculateNovaTokenReward = (stakeAmount: number): number => {
//   let novaTokens = 0;
  
//   let remainingAmount = stakeAmount;

//   // Calculate tokens based on tiers
//   for (const tier of Object.values(NOVA_TOKEN_TIERS)) {
//     if (remainingAmount <= 0) break;
    
//     const amountInTier = Math.min(
//       remainingAmount, 
//       tier.max === Infinity ? remainingAmount : tier.max - tier.min
//     );
    
//     novaTokens += amountInTier * tier.multiplier;
//     remainingAmount -= amountInTier;
//   }

//   return Math.round(novaTokens * 100) / 100; // Round to 2 decimal places
// };

// interface EarningsValidation {
//   lastCheckpoint: number;
//   accumulatedEarnings: number;
//   maxDailyRate: number;
// }

// export const IndexPage: FC = () => {

//   const [currentTab, setCurrentTab] = useState('home');
//   const [showDepositModal, setShowDepositModal] = useState(false);
//   const { user, isLoading, error, updateUserData } = useAuth();
//   // const userAddress = useTonAddress();
//   const [userFriendlyAddress, setUserFriendlyAddress] = useState<string | null>(null);
//   const tonConnectUI = useTonConnectUI();
  
//   useEffect(() => {
//     const [tonConnect] = tonConnectUI;
//     if (tonConnect.account) {
//       const rawAddress = tonConnect.account.address;
//       const friendlyAddress = toUserFriendlyAddress(rawAddress);
//       setUserFriendlyAddress(friendlyAddress);
//     }
//   }, [tonConnectUI]);

//   const [isWithdrawing,] = useState(false);
//   const [activeCard, setActiveCard] = useState<CardType>('stats');
//   const [currentROI, ] = useState<number>(0.01); // 1% daily default
//   const [tonPrice, setTonPrice] = useState<number>(2.5);
//   const [showOnboarding, setShowOnboarding] = useState(false);

//   // Add state for activities
//   const [activities, setActivities] = useState<Activity[]>([]);
//   const [isLoadingActivities, setIsLoadingActivities] = useState(false);

//   const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

//   // Add these state variables near the top with other state declarations
//   const [walletBalance, setWalletBalance] = useState<string>('0.00');
//   // const [isLoadingBalance, setIsLoadingBalance] = useState(false);

//   // Add these state variables
//   const [isSnackbarVisible, setSnackbarVisible] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarDescription, setSnackbarDescription] = useState('');
//   const snackbarTimeoutRef = useRef<NodeJS.Timeout>();

//   // Add this state for custom amount
//   const [customAmount, setCustomAmount] = useState<string>('');
// // Add this function to get level name based on balance
// const getLevelName = (balance: number): string => {
//   const level = Math.floor(balance / 100) + 1;
  
//   switch (true) {
//     case level >= 5000:
//       return 'Supernova';
//     case level >= 2000:
//       return 'Legendary';
//     case level >= 1000:
//       return 'Celestial';
//     case level >= 500:
//       return 'Sovereign';
//     case level >= 100:
//       return 'Guardian';
//     case level >= 50:
//       return 'Voyager';
//     case level >= 20:
//       return 'Explorer';
//     default:
//       return 'Initiate';
//   }
// };


//   // Update the earning system in the IndexPage component
//   const [earningState, setEarningState] = useState<LocalEarningState>(() => {
//     // Try to load saved state from localStorage
//     const savedState = localStorage.getItem(EARNINGS_STORAGE_KEY);
//     if (savedState) {
//       try {
//         const parsed = JSON.parse(savedState);
//         // Validate the structure of saved state
//         if (parsed && 
//             typeof parsed === 'object' && 
//             'lastUpdate' in parsed && 
//             'currentEarnings' in parsed && 
//             'baseEarningRate' in parsed && 
//             'isActive' in parsed) {
//           return parsed;
//         }
//       } catch (error) {
//         console.error('Error parsing saved earnings state:', error);
//       }
//     }
//     // Return default state if no valid saved state exists
//     return {
//       lastUpdate: Date.now(),
//       currentEarnings: 0,
//       baseEarningRate: 0,
//       isActive: false,
//     };
//   });

//   // Add function to save earning state to localStorage
//   const saveEarningState = (state: LocalEarningState) => {
//     try {
//       localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(state));
//     } catch (error) {
//       console.error('Error saving earning state:', error);
//     }
//   };

//   // Add function to load earning state from localStorage
//   const loadEarningState = (): LocalEarningState | null => {
//     try {
//       const stored = localStorage.getItem(EARNINGS_STORAGE_KEY);
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         // Validate the loaded state
//         if (parsed && typeof parsed === 'object' && 
//             'lastUpdate' in parsed && 'currentEarnings' in parsed && 
//             'baseEarningRate' in parsed && 'isActive' in parsed) {
//           return parsed;
//         }
//       }
//     } catch (error) {
//       console.error('Error loading earning state:', error);
//     }
//     return null;
//   };

//   const syncEarningsWithServer = async (earnings: number) => {
//     if (!user?.id) return;
  
//     try {
//       const now = Date.now();
//       const validation = JSON.parse(localStorage.getItem('earnings_validation') || '{}') as EarningsValidation;
      
//       // Calculate time-weighted earnings
//       const timeElapsed = now - validation.lastCheckpoint;
//       const maxAllowedEarnings = validation.maxDailyRate * timeElapsed / 86400000;
      
//       // Validate earnings before sync
//       const validatedEarnings = Math.min(
//         earnings,
//         validation.accumulatedEarnings + maxAllowedEarnings
//       );
  
//       // Add server-side validation
//       const { data, error } = await supabase.rpc('sync_earnings', {
//         p_user_id: user.id,
//         p_earnings: validatedEarnings,
//         p_last_update: new Date(validation.lastCheckpoint).toISOString(),
//         p_current_time: new Date(now).toISOString()
//       });
  
//       if (error) throw error;
  
//       // Update local validation checkpoint
//       localStorage.setItem('earnings_validation', JSON.stringify({
//         lastCheckpoint: now,
//         accumulatedEarnings: validatedEarnings,
//         maxDailyRate: user.balance * 0.11
//       }));
  
//       return data;
//     } catch (error) {
//       console.error('Error syncing earnings:', error);
//       return null;
//     }
//   };
  
//   // Update the earnings effect to handle persistence
//   useEffect(() => {
//     if (!user?.id || !user.balance) return;

//     const initializeEarningState = async () => {
//       try {
//         // Fetch current earnings from server
//         const { data: serverData } = await supabase
//           .from('user_earnings')
//           .select('current_earnings, last_update')
//           .eq('user_id', user.id)
//           .single();

//         const now = Date.now();
//         const newRate = calculateEarningRate(user.balance, user.last_deposit_date || now.toString());
        
//         let initialEarnings = 0;
//         if (serverData) {
//           const lastUpdateTime = new Date(serverData.last_update).getTime();
//           const secondsElapsed = (now - lastUpdateTime) / 1000;
//           const accumulatedEarnings = newRate * secondsElapsed;
          
//           initialEarnings = Math.min(
//             serverData.current_earnings + accumulatedEarnings,
//             user.balance * MAX_EARNINGS_MULTIPLIER
//           );
//         } else {
//           // Use locally stored earnings if no server data
//           const savedState = localStorage.getItem(EARNINGS_STORAGE_KEY);
//           if (savedState) {
//             const parsed = JSON.parse(savedState);
//             initialEarnings = parsed.currentEarnings || 0;
//           }
//         }

//         const newState = {
//           lastUpdate: now,
//           currentEarnings: initialEarnings,
//           baseEarningRate: newRate,
//           isActive: user.balance > 0
//         };

//         setEarningState(newState);
//         localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(newState));
        
//         // Save last sync time
//         localStorage.setItem(LAST_SYNC_KEY, now.toString());
//       } catch (error) {
//         console.error('Error initializing earning state:', error);
//       }
//     };

//     initializeEarningState();

//     // Update earnings interval
//     const earningsInterval = setInterval(() => {
//       setEarningState(prevState => {
//         const now = Date.now();
//         const secondsElapsed = (now - prevState.lastUpdate) / 1000;
        
//         // Add validation check
//         if (!validateEarnings(
//           prevState.currentEarnings,
//           secondsElapsed,
//           user?.balance || 0,
//           prevState.baseEarningRate
//         )) {
//           return prevState; // Skip update if validation fails
//         }

//         const newEarnings = Math.min(
//           prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed),
//           (user?.balance || 0) * MAX_EARNINGS_MULTIPLIER
//         );

//         const newState = {
//           ...prevState,
//           lastUpdate: now,
//           currentEarnings: newEarnings
//         };

//         localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(newState));
//         return newState;
//       });
//     }, MIN_EARNINGS_CHECK_INTERVAL);

//     // Sync with server periodically
//     const syncInterval = setInterval(async () => {
//       const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
//       const now = Date.now();
      
//       // Only sync if enough time has passed (e.g., every 5 minutes)
//       if (now - lastSync >= 300000) { // 5 minutes
//         await syncEarningsWithServer(earningState.currentEarnings);
//         localStorage.setItem(LAST_SYNC_KEY, now.toString());
//       }
//     }, 300000); // Check every 5 minutes

//     // Cleanup
//     return () => {
//       clearInterval(earningsInterval);
//       clearInterval(syncInterval);
//       // Save final state before unmounting
//       localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(earningState));
//     };
//   }, [user?.id, user?.balance, currentROI]);

//   // Add window focus/blur handlers to handle tab switching
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         // Page became visible again, recalculate earnings
//         const savedState = localStorage.getItem(EARNINGS_STORAGE_KEY);
//         if (savedState) {
//           try {
//             const parsed = JSON.parse(savedState);
//             const now = Date.now();
//             const secondsElapsed = (now - parsed.lastUpdate) / 1000;
//             const accumulatedEarnings = parsed.baseEarningRate * secondsElapsed;
            
//             const newState = {
//               ...parsed,
//               lastUpdate: now,
//               currentEarnings: Math.min(
//                 parsed.currentEarnings + accumulatedEarnings,
//                 (user?.balance || 0) * MAX_EARNINGS_MULTIPLIER
//               )
//             };
            
//             setEarningState(newState);
//             localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(newState));
//           } catch (error) {
//             console.error('Error handling visibility change:', error);
//           }
//         }
//       }
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [user?.balance]);

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

  
//   // Update this effect to fetch both TON and Nova token balances
//   useEffect(() => {
//     const fetchBalances = async () => {
//       const [tonConnect] = tonConnectUI;
//       if (!tonConnect.account || !user?.id) {
//         setWalletBalance('0.00');
//         // setIsLoadingBalance(false);
//         return;
//       }

//       try {
//         // Fetch TON balance
//         const balance = await tonweb.getBalance(tonConnect.account.address);
//         const balanceInTON = Number(fromNano(balance));
//         setWalletBalance(balanceInTON.toFixed(2));

//         // Fetch Nova token balance from Supabase
//         const { data: userData } = await supabase
//           .from('users')
//           .select('total_sbt')
//           .eq('id', user.id)
//           .single();

//         if (userData) {
//           // Update user data with latest total_sbt
//           updateUserData({ id: user.id });
//         }
//       } catch (error) {
//         console.error('Error fetching balances:', error);
//         setWalletBalance('0.00');
//       } finally {
//         // setIsLoadingBalance(false);
//       }
//     };

//     fetchBalances();
//     // Update balances every 30 seconds
//     const intervalId = setInterval(fetchBalances, 30000);

//     return () => clearInterval(intervalId);
//   }, [tonConnectUI, user?.id]);

// // Add ROI validation and caps
// const calculateEarningRate = (balance: number, lastDepositDate: string) => {
//   // Validate ROI based on staking duration
//   const stakingDays = getDaysSinceDeposit(lastDepositDate);
//   const adjustedRoi = calculateProgressiveRoi(stakingDays);
  
//   // Apply daily cap
//   const dailyRoiDecimal = Math.min(adjustedRoi, 0.11) / 100; // Max 11%
//   const perSecondRate = (balance * dailyRoiDecimal) / 86400;
  
//   // Apply rate limiting
//   return Math.min(perSecondRate, balance * MAX_DAILY_RATE / 86400);
// };

// // Progressive ROI calculation
// const calculateProgressiveRoi = (days: number): number => {
//   const baseRoi = 1; // 1%
//   const roiIncrement = 0.5; // 0.5% increase
//   const incrementPeriod = 5; // every 5 days
//   const maxRoi = 11; // 11% cap
  
//   const increases = Math.floor(days / incrementPeriod);
//   const calculatedRoi = baseRoi + (increases * roiIncrement);
  
//   return Math.min(calculatedRoi, maxRoi);
// };

// // Add earnings validation
// const validateEarnings = (
//   currentEarnings: number,
//   timeElapsed: number,
//   balance: number,
//   earningRate: number
// ) => {
//   // Calculate maximum possible earnings for time period
//   const maxPossibleEarnings = earningRate * timeElapsed;
//   const dailyRate = (maxPossibleEarnings * 86400) / timeElapsed;
  
//   // Validate against maximum daily rate
//   if (dailyRate > (balance * 0.11)) {
//     return false;
//   }
  
//   // Validate against total balance cap
//   if (currentEarnings > balance * MAX_EARNINGS_MULTIPLIER) {
//     return false;
//   }
  
//   return true;
// };

// // Update handleDeposit to use new calculation
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
    
//     // Generate unique ID
//     const depositId = await generateUniqueId();
    
//     // Calculate Nova token rewards using tiered system
//     const novaTokenReward = calculateNovaTokenReward(amount);
    
//     // Record pending deposit (without nova_tokens)
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

//     // Create transaction
//     const transaction = {
//       validUntil: Math.floor(Date.now() / 1000) + 60 * 20,
//       messages: [
//         {
//           address: DEPOSIT_ADDRESS,
//           amount: amountInNano.toString(),
//         },
//       ],
//     };

//     const [tonConnect] = tonConnectUI;
//     const result = await tonConnect.sendTransaction(transaction);

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

//       // Update user's balance and Nova tokens
//       const { error: userUpdateError } = await supabase
//         .from('users')
//         .update({ 
//           balance: (user?.balance || 0) + amount,
//           total_deposit: (user?.total_deposit || 0) + amount,
//           total_sbt: (user?.total_sbt || 0) + novaTokenReward,
//           last_deposit_date: new Date().toISOString()
//         })
//         .eq('id', user.id);

//       if (userUpdateError) throw userUpdateError;

//       // Add Nova token activity without description field
//       const { error: activityError } = await supabase
//         .from('activities')
//         .insert([{
//           user_id: user.id,
//           type: 'nova_reward',
//           amount: novaTokenReward,
//           status: 'confirmed'
//         }]);

//       if (activityError) {
//         console.error('Error recording Nova token activity:', activityError);
//       }

//       // Update UI state
//       setDepositStatus('success');
//       showSnackbar({ 
//         message: 'Deposit Successful', 
//         description: `Successfully deposited ${amount} TON and earned ${novaTokenReward} NOVA tokens!` 
//       });
      
//       // Refresh user data
//       await updateUserData({ id: user.id });
//       setShowDepositModal(false);

//       // Update earnings state
//       const newTotalBalance = (user?.balance || 0) + amount;
//       const newRate = calculateEarningRate(newTotalBalance, user.last_deposit_date || new Date().toISOString());
//       const newState = {
//         lastUpdate: Date.now(),
//         currentEarnings: earningState.currentEarnings,
//         baseEarningRate: newRate,
//         isActive: true
//       };
      
//       setEarningState(newState);
//       saveEarningState(newState);

//       // Sync with server
//       await syncEarningsWithServer(earningState.currentEarnings);
//     }
//   } catch (error) {
//     console.error('Deposit failed:', error);
//     setDepositStatus('error');
//     showSnackbar({ 
//       message: 'Deposit Failed', 
//       description: 'Please try again later' 
//     });
//   }
// };

//   // Add this function to format earnings display
//   const formatEarnings = (amount: number): string => {
//     if (amount >= 1) {
//       return amount.toFixed(6);
//     } else {
//       return amount.toFixed(6);
//     }
//   };

//   // Add this function to format earnings display
//   const formatEarningsRate = (amount: number): string => {
//     if (amount >= 1) {
//       return amount.toFixed(9);
//     } else {
//       return amount.toFixed(9);
//     }
//   };

//   // Update the earnings display in your JSX
//   const renderEarningsSection = () => (
//     <div className="flex items-center gap-2 mt-1">
//       {user?.balance && user.balance > 0 ? (
//         <>
//           <div className="flex items-center gap-1.5">
//             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
//             <span className="text-xs text-blue-500">
//               +{formatEarningsRate(earningState.baseEarningRate)} TON/sec
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

//   // // Update handleWithdraw to handle zero earnings
//   // const handleWithdraw = async () => {
//   //   if (!user?.id) {
//   //     showSnackbar({ 
//   //       message: 'Not Connected', 
//   //       description: 'Please connect your wallet first' 
//   //     });
//   //     return;
//   //   }

//   //   // Check if there are any earnings to withdraw
//   //   if (earningState.currentEarnings <= 0) {
//   //     showSnackbar({ 
//   //       message: 'No Earnings', 
//   //       description: 'You have no earnings to withdraw' 
//   //     });
//   //     return;
//   //   }

//   //   try {
//   //     setIsWithdrawing(true);

//   //     const totalAmount = earningState.currentEarnings;
//   //     const toWallet = totalAmount * 0.6;
//   //     const toRedeposit = totalAmount * 0.2;
//   //     const toSBT = totalAmount * 0.1;

//   //     // Process withdrawal
//   //     const { error } = await supabase.rpc('process_withdrawal', {
//   //       user_id: user.id,
//   //       amount: totalAmount,
//   //       to_wallet: toWallet,
//   //       to_redeposit: toRedeposit,
//   //       to_sbt: toSBT
//   //     });

//   //     if (error) throw error;

//   //     // Update UI state
//   //     const newState = {
//   //       lastUpdate: Date.now(),
//   //       currentEarnings: 0,
//   //       baseEarningRate: earningState.baseEarningRate,
//   //       isActive: earningState.isActive
//   //     };
      
//   //     setEarningState(newState);
//   //     saveEarningState(newState);
//   //     showSnackbar({ 
//   //       message: 'Withdrawal Successful',
//   //       description: `${toWallet.toFixed(2)} TON to wallet\n${toRedeposit.toFixed(2)} TON redeposited\n${toSBT.toFixed(2)} TON to STK`
//   //     });

//   //     // Refresh user data
//   //     await updateUserData({ id: user.id }); // Pass object with id property

//   //   } catch (error) {
//   //     console.error('Withdrawal failed:', error);
//   //     showSnackbar({ 
//   //       message: 'Withdrawal Failed', 
//   //       description: 'Please try again later' 
//   //     });
//   //   } finally {
//   //     setIsWithdrawing(false);
//   //   }
//   // };

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

//  // Update the activity card content
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
//     {activity.amount.toFixed(8)} {activity.type === 'nova_reward' ? 'NOVA' : 'TON'}
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
//       case 'offline_reward':
//         return <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//         </svg>;
//       default:
//         return null;
//     }
//   };

//   // Add useEffect to fetch price
//   useEffect(() => {
//     const fetchPrice = async () => {
//       const price = await getTONPrice();
//       setTonPrice(price);
//     };

//     fetchPrice();

//     // Update price every 60 seconds
//     const interval = setInterval(fetchPrice, 60000);

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

//   // Add these constants at the top with other constants
//   const MIN_OFFLINE_REWARD_AMOUNT = 0.00001; // Minimum reward amount to show modal
//   const MIN_OFFLINE_DURATION = 300000; // Minimum time offline (5 minutes)
//   const OFFLINE_MODAL_COOLDOWN = 3600000; // Cooldown between showing modals (1 hour)

//   // Add this effect to handle offline earnings
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         // App became visible, check if we should show offline rewards
//         const offlineState = loadOfflineEarnings();
//         const lastModalTime = parseInt(localStorage.getItem('last_offline_modal') || '0');
//         const now = Date.now();

//         if (offlineState && earningState.isActive) {
//           const timeOffline = now - offlineState.lastActiveTimestamp;
//           const offlineEarnings = offlineState.baseEarningRate * (timeOffline / 1000);

//           // Only show modal if:
//           // 1. Enough time has passed since last modal
//           // 2. User was offline for minimum duration
//           // 3. Earnings are above minimum threshold
//           // 4. User has an active stake
//           if (
//             now - lastModalTime >= OFFLINE_MODAL_COOLDOWN &&
//             timeOffline >= MIN_OFFLINE_DURATION &&
//             offlineEarnings >= MIN_OFFLINE_REWARD_AMOUNT &&
//             (user?.balance ?? 0) > 0
//           ) {
//             setOfflineRewardsAmount(offlineEarnings);
//             setShowOfflineRewardsModal(true);
//             // Update last modal time
//             localStorage.setItem('last_offline_modal', now.toString());
//           } else {
//             // If we don't show modal, still update earnings silently
//             if (offlineEarnings > 0) {
//               setEarningState(prev => ({
//                 ...prev,
//                 currentEarnings: prev.currentEarnings + offlineEarnings
//               }));
//               // Optionally show a mini notification
//               showSnackbar({
//                 message: 'Earnings Updated',
//                 description: `+${offlineEarnings.toFixed(8)} TON added`
//               });
//             }
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
//   }, [earningState, user?.balance]);

//   // Update the earning effect to include offline earnings
//   useEffect(() => {
//     if (!user?.id || !user.balance) return;

//     // Load saved state and validation data
//     const savedState = loadEarningState();
//     const now = Date.now();

//     const initializeEarningState = async () => {
//       try {
//         // Fetch current earnings from server
//         const { data: serverData } = await supabase
//           .from('user_earnings')
//           .select('current_earnings, last_update')
//           .eq('user_id', user.id)
//           .single();

//         const newRate = calculateEarningRate(user.balance, user.last_deposit_date || now.toString());
//         const maxDailyEarnings = user.balance * 0.11; // 11% daily max
        
//         let initialEarnings = 0;
//         if (serverData) {
//           const lastUpdateTime = new Date(serverData.last_update).getTime();
//           const secondsElapsed = (now - lastUpdateTime) / 1000;
//           const maxAccumulatedEarnings = Math.min(
//             newRate * secondsElapsed,
//             maxDailyEarnings
//           );
          
//           initialEarnings = Math.min(
//             serverData.current_earnings + maxAccumulatedEarnings,
//             user.balance * MAX_EARNINGS_MULTIPLIER
//           );
//         } else if (savedState) {
//           initialEarnings = Math.min(
//             savedState.currentEarnings,
//             user.balance * MAX_EARNINGS_MULTIPLIER
//           );
//         }

//         const newState = {
//           lastUpdate: now,
//           currentEarnings: initialEarnings,
//           baseEarningRate: newRate,
//           isActive: user.balance > 0
//         };

//         setEarningState(newState);
//         saveEarningState(newState);
        
//         // Save validation checkpoint
//         localStorage.setItem('earnings_validation', JSON.stringify({
//           lastCheckpoint: now,
//           accumulatedEarnings: initialEarnings,
//           maxDailyRate: maxDailyEarnings
//         }));
//       } catch (error) {
//         console.error('Error initializing earning state:', error);
//       }
//     };

//     initializeEarningState();

//     // Update earnings with validation
//     const earningsInterval = setInterval(() => {
//       setEarningState(prevState => {
//         const now = Date.now();
//         const validation = JSON.parse(localStorage.getItem('earnings_validation') || '{}') as EarningsValidation;
        
//         // Validate time elapsed and earnings rate against checkpoint
//         const timeElapsed = now - validation.lastCheckpoint;
//         const maxAllowedEarnings = validation.maxDailyRate * timeElapsed / 86400000;
        
//         // Validate time elapsed
//         const secondsElapsed = Math.max(0, (now - prevState.lastUpdate) / 1000);
//         if (secondsElapsed <= 0) return prevState;

//         // Calculate and validate new earnings
//         const maxPossibleEarnings = prevState.baseEarningRate * secondsElapsed;
//         const dailyRate = (maxPossibleEarnings * 86400) / secondsElapsed;
        
//         // Skip update if rate exceeds maximum
//         if (dailyRate > (user.balance * 0.11)) return prevState;

//         // Calculate new total earnings with caps
//         const newEarnings = Math.min(
//           prevState.currentEarnings + maxPossibleEarnings,
//           validation.accumulatedEarnings + maxAllowedEarnings
//         );

//         const newState = {
//           ...prevState,
//           lastUpdate: now,
//           currentEarnings: newEarnings
//         };

//         // Persist state
//         saveEarningState(newState);
        
//         // Update validation checkpoint
//         localStorage.setItem('earnings_validation', JSON.stringify({
//           lastCheckpoint: now,
//           accumulatedEarnings: newEarnings,
//           maxDailyRate: user.balance * 0.11
//         }));

//         return newState;
//       });
//     }, MIN_EARNINGS_CHECK_INTERVAL);

//     // Sync with server more frequently
//     const syncInterval = setInterval(() => {
//       syncEarningsWithServer(earningState.currentEarnings);
//     }, EARNINGS_SYNC_INTERVAL);

//     return () => {
//       clearInterval(earningsInterval);
//       clearInterval(syncInterval);
//       // Ensure final state is saved
//       saveEarningState(earningState);
//       syncEarningsWithServer(earningState.currentEarnings);
//     };
//   }, [user?.id, user?.balance, currentROI]);

//   // Add this state
//   const [showOfflineRewardsModal, setShowOfflineRewardsModal] = useState(false);
//   const [offlineRewardsAmount, setOfflineRewardsAmount] = useState(0);

//   // Update the offline earnings handling
//   useEffect(() => {
//     if (!user?.id || !user.balance) return;

//     // Load offline earnings on mount
//     const offlineState = loadOfflineEarnings();
//     if (offlineState && earningState.isActive) {
//       const now = Date.now();
//       const secondsElapsed = (now - offlineState.lastActiveTimestamp) / 1000;
//       const offlineEarnings = offlineState.baseEarningRate * secondsElapsed;

//       if (offlineEarnings > 0) {
//         setOfflineRewardsAmount(offlineEarnings);
//         setShowOfflineRewardsModal(true);
//       }
//     }

//     // Clear offline earnings state
//     localStorage.removeItem(OFFLINE_EARNINGS_KEY);
//   }, [user?.id, user?.balance, currentROI]);

//   // Add the claim handler
//   const handleClaimOfflineRewards = async () => {
//     try {
//       if (!user?.id) {
//         showSnackbar({ 
//           message: 'Not Connected', 
//           description: 'Please connect your wallet first' 
//         });
//         return;
//       }

//       // Check if user has active stake
//       if (!user.balance || user.balance <= 0) {
//         showSnackbar({
//           message: 'No Active Stake',
//           description: 'You need to stake TON to earn offline rewards'
//         });
//         return;
//       }

//       const offlineState = loadOfflineEarnings();
//       const startTime = offlineState?.lastActiveTimestamp || Date.now() - 86400000;
//       const endTime = Date.now();
//       const hoursOffline = Math.round((endTime - startTime) / 3600000);
      
//       // Calculate Nova token reward (1% of offline TON earnings)
//       const novaTokenReward = offlineRewardsAmount * 0.01;

//       // Log for debugging
//       console.log('Offline Rewards:', {
//         offlineRewardsAmount,
//         novaTokenReward,
//         hoursOffline,
//         startTime,
//         endTime
//       });

//       // Prepare activity metadata
//       const activityMetadata = {
//         offline_duration: hoursOffline,
//         start_timestamp: new Date(startTime).toISOString(),
//         end_timestamp: new Date(endTime).toISOString(),
//         earning_rate: offlineState?.baseEarningRate || 0,
//         previous_balance: user.balance || 0,
//         new_balance: (user.balance || 0) + offlineRewardsAmount,
//         nova_reward: novaTokenReward // Add Nova reward to metadata
//       };

//       // First, update the user's balances
//       const { error: updateError } = await supabase
//         .from('users')
//         .update({
//           balance: user.balance + offlineRewardsAmount,
//           total_sbt: (user.total_sbt || 0) + novaTokenReward,
//           last_offline_claim: new Date().toISOString()
//         })
//         .eq('id', user.id);

//       if (updateError) throw updateError;

//       // Then, record the activity
//       const { error: activityError } = await supabase
//         .from('activities')
//         .insert([
//           {
//             user_id: user.id,
//             type: 'offline_reward',
//             amount: offlineRewardsAmount,
//             status: 'confirmed',
//             metadata: activityMetadata
//           },
//           {
//             user_id: user.id,
//             type: 'nova_reward',
//             amount: novaTokenReward,
//             status: 'confirmed',
//             metadata: {
//               source: 'offline_reward',
//               offline_duration: hoursOffline
//             }
//           }
//         ]);

//       if (activityError) {
//         console.error('Error recording activity:', activityError);
//       }

//       // Update local state
//       setEarningState(prev => ({
//         ...prev,
//         currentEarnings: prev.currentEarnings + offlineRewardsAmount,
//         lastUpdate: Date.now()
//       }));

//       // Clear offline earnings state
//       localStorage.removeItem(OFFLINE_EARNINGS_KEY);

//       // Update local user data
//       await updateUserData({ id: user.id });

//       // Show success message with both TON and Nova rewards
//       showSnackbar({
//         message: 'Rewards Claimed',
//         description: `Successfully claimed ${offlineRewardsAmount.toFixed(9)} TON and ${novaTokenReward.toFixed(9)} NOVA`
//       });

//       setShowOfflineRewardsModal(false);
//       setOfflineRewardsAmount(0);

//       // Sync with server
//       await syncEarningsWithServer(earningState.currentEarnings);

//       // After successful claim, update the last modal time
//       localStorage.setItem('last_offline_modal', Date.now().toString());

//     } catch (error) {
//       console.error('Error claiming offline rewards:', error);
      
//       showSnackbar({
//         message: 'Claim Failed',
//         description: 'Please try again later'
//       });
//     }
//   };

//   // Add this stored procedure to your Supabase database
//   /*
//   create or replace function claim_offline_rewards(
//     user_id uuid,
//     reward_amount double precision,
//     nova_reward double precision,
//     metadata jsonb
//   ) returns void as $$
//   begin
//     -- Use a transaction to ensure atomic updates
//     begin
//       -- Update user's balance and tokens
//       update users
//       set 
//         balance = balance + reward_amount,
//         total_earned = total_earned + reward_amount,
//         total_sbt = total_sbt + nova_reward,
//         last_offline_claim = now()
//       where id = user_id;

//       -- Record the activity
//       insert into activities (
//         user_id,
//         type,
//         amount,
//         status,
//         metadata,
//         description,
//         created_at,
//         category,
//         source
//       ) values (
//         user_id,
//         'offline_reward',
//         reward_amount,
//         'completed',
//         metadata,
//         format('Claimed %s TON and earned %s NOVA tokens offline (%s hours)',
//                round(reward_amount::numeric, 6),
//                round(nova_reward::numeric, 2),
//                (metadata->>'offline_duration')::int
//         ),
//         now(),
//         'earnings',
//         'system'
//       );

//       -- Commit transaction
//       commit;
//     exception
//       when others then
//         -- Rollback on any error
//         rollback;
//         raise;
//     end;
//   end;
//   $$ language plpgsql;
//   */

//   // Add this state for live progress
//   const [, setStakingProgress] = useState(0);

//   // Add this effect for live progress updates
//   useEffect(() => {
//     if (user?.last_deposit_date) {
//       setStakingProgress(calculateStakingProgress(user.last_deposit_date));
//     }
//   }, [user?.last_deposit_date]);

//   // // Add this calculation for earnings progress
//   // const earningsProgress = user?.balance && user.balance > 0 
//   //   ? (earningState.currentEarnings / user.balance) * 100
//   //   : 0;

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

//   // // Add this state near your other state declarations
//   // const [showWhitelistModal, setShowWhitelistModal] = useState(false);

//   // // Add this handler
//   // const handleWhitelistSuccess = () => {
//   //   showSnackbar({
//   //     message: 'Wallet Whitelisted',
//   //     description: 'Your wallet has been successfully whitelisted'
//   //   });
//   //   // Refresh user data
//   //   updateUserData({ id: user?.id });
//   // };

//   // Add state
//   const [showWithdrawalInfo, setShowWithdrawalInfo] = useState(false);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F] text-white">
//         <div className="text-center p-4">
//           <p className="text-red-500">{error}</p>
//           <p className="mt-2">Please open this app in Telegram</p>
//         </div>
//       </div>
//     );
//   }

 

//   return (
//     <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black p-custom">
      
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

//       {/* Main Content Area */}
//       <div className="flex-1">
//         {currentTab === 'home' && (
//           <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
//             {/* Stake Card */}
//             <div className="relative shadow-xl relative overflow-visible">
//               {/* Game-style Header */}
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 relative">
//                     <div className="absolute inset-0 bg-blue-500/20 rounded-lg rotate-45 animate-pulse" />
//                     <div className="absolute inset-0 flex items-center justify-center">
//                       <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                     </div>
//                   </div>
//                   <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//                     <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Staking</span>
//                   </div>
//                 </div>
                
//                 {user?.balance && user.balance > 0 ? (
//                    <button
//                    onClick={() => setShowDepositModal(true)}
//                    className="flex items-center gap-2 px-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 
//                      border border-blue-500/30 rounded-lg transition-all duration-200"
//                  >
//                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping opacity-75" />
//                    <span className="text-sm font-medium text-blue-400">TOP UP</span>
//                  </button>
//                 ) : (
//                   <button
//                     onClick={() => setShowDepositModal(true)}
//                     className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
//                       border border-blue-500/30 rounded-lg transition-all duration-200"
//                   >
//                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping opacity-75" />
//                     <span className="text-xs font-medium text-blue-400">DEPOSIT</span>
//                   </button>
//                 )}
//               </div>

//               {/* Balance Display with Game UI */}
//               <div className="relative p-4 rounded-lg bg-black/30 border border-blue-500/20 backdrop-blur-sm">
//                 {/* Animated Corner Decorations */}
//                 <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400/50" />
//                 <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400/50" />
//                 <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400/50" />
//                 <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400/50" />
                
//                 {/* Animated Background Grid */}
//                 <div className="absolute inset-0 bg-grid-blue/[0.02] bg-[length:20px_20px] animate-grid-flow opacity-50" />
                
//                 <div className="relative z-10">
//                   {/* Balance Amount with Glow Effect */}
//                   <div className="flex items-baseline gap-2 mb-3">
//                     <div className="space-y-1">
//                       <div className="text-xs text-white/40 uppercase tracking-wider">My Staked</div>
//                       <div className="flex items-baseline gap-2">
//                         <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
//                           {user?.balance?.toFixed(2) || '0.00'}
//                         </span>
//                         <span className="text-sm font-medium text-white/60">TON</span>
//                         <span className="pixel-corners bg-white/5 px-2 py-0.5">
//                           <span className="text-xs text-white/40">≈ ${((user?.balance ?? 0) * tonPrice).toFixed(2)}</span>
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Stake Status and Progress */}
//                   {user?.balance && user.balance > 0 ? (
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between text-xs text-white/60">
//                         <ReStakeCountdown depositDate={new Date(user.last_deposit_date || Date.now())} />
//                         <span className="pixel-corners bg-blue-500/10 px-2 py-0.5 text-blue-400">
//                         {getLevelName(user.balance)}
//                         </span>
//                       </div>
                      
//                       {/* Progress Bar with Glow */}
//                       <div className="relative h-2 bg-blue-900/20 rounded-full overflow-hidden">
//                         <div className="absolute inset-0 bg-grid-blue/[0.05] bg-[length:8px_8px]" />
//                         <div 
//                           className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000
//                                     after:absolute after:inset-0 after:bg-blue-400/20 after:blur-lg"
//                           style={{ width: `${calculateStakingProgress(user?.last_deposit_date || new Date())}%` }}
//                         />
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-sm text-white/40 flex items-center gap-2">
//                       <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                       </svg>
//                       Start staking to begin your journey
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Earnings Card */}
//             <div className="relative shadow-xl relative overflow-visible">
//               {/* Game-style Header */}
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 relative">
//                     <div className="absolute inset-0 bg-green-500/20 rounded-lg rotate-45 animate-pulse" />
//                     <div className="absolute inset-0 flex items-center justify-center">
//                       <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                     </div>
//                   </div>
//                   <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//                     <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Earning</span>
//                   </div>
//                 </div>
                
//                 <button
//                   onClick={() => setShowWithdrawalInfo(true)}
//                   disabled={isWithdrawing}
//                   className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 
//                       border border-green-500/30 rounded-lg transition-all duration-200"
//                 >
//                   <div className="flex items-center gap-2">
//                     <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
//                     <span className="text-xs font-medium text-green-400">UPGRADE</span>
//                   </div>
//                 </button>
//               </div>

//               {/* Balance Display with Game UI */}
//               <div className="relative p-4 rounded-lg bg-black/30 border border-green-500/20 backdrop-blur-sm">
//                 {/* Animated Corner Decorations */}
//                 <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-green-400/50" />
//                 <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-green-400/50" />
//                 <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-green-400/50" />
//                 <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-green-400/50" />
                
//                 {/* Animated Background Grid */}
//                 <div className="absolute inset-0 bg-grid-green/[0.02] bg-[length:20px_20px] animate-grid-flow opacity-50" />
                
//                 <div className="relative z-10">
//                   {/* Balance Amount with Glow Effect */}
//                   <div className="flex items-baseline gap-2">
//                     <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
//                       {formatEarnings(earningState.currentEarnings)}
//                     </span>
//                     <span className="text-sm font-medium text-white/60">TON</span>
//                     <span className="pixel-corners bg-white/5 px-2 py-0.5">
//                       <span className="text-xs text-white/40">≈ ${(earningState.currentEarnings * tonPrice).toFixed(2)}</span>
//                     </span>
//                   </div>

//                   {renderEarningsSection()}

//                   {!user?.balance || user.balance <= 0 ? (
//                     <div className="mt-4 text-center text-white/40 text-sm flex items-center justify-center gap-2">
//                       <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                       </svg>
//                       Start staking to see your earnings progress!
//                     </div>
//                   ) : (
//                     <div className="mt-4 space-y-4">
//                       {/* Progress Bar with Glow */}
//                       {/* Stats Grid */}
//                       <div className="grid grid-cols-2 gap-2">
//                         {[
//                           { label: 'Potential Earnings', value: `${formatEarnings(calculatePotentialEarnings(user.balance))} TON`, highlight: true },
//                           { label: 'Nova Balance', value: `${(user.total_sbt ?? 0).toFixed(8)} NOVA` }
//                         ].map((stat, index) => (
//                           <div key={index} className="pixel-corners bg-black/30 p-2 border border-green-500/10">
//                             <div className="text-xs text-white/60">{stat.label}</div>
//                             <div className={`text-xs font-medium ${stat.highlight ? 'text-green-400' : 'text-white'} mt-1`}>
//                               {stat.value}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
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
//           </div>

//           {/* Card Content */}
//           <div className="space-y-6">
//             {activeCard === 'stats' && (
//               <>
//                 {/* Staking Details */}
//                 <div className="relative">
                  
//                   <div className="flex items-center justify-between mb-4">
//     <div className="flex items-center gap-2">
//       <div className="w-8 h-8 relative">
//         <div className="absolute inset-0 bg-blue-500/20 rounded-lg rotate-45 animate-pulse" />
//         <div className="absolute inset-0 flex items-center justify-center">
//           <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//         </div>
//       </div>
//       <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//         <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Analytics</span>
//       </div>
//     </div>
    
//     <div className="pixel-corners bg-blue-500/20 px-3 py-1 border border-blue-500/30">
//       <span className="text-xs font-bold text-blue-400">LIVE FEED</span>
//     </div>
//   </div>

//                   <div className="grid grid-cols-2 gap-3">
//                   {/* Total Deposited */}
//                   <StatsCard
//                     title="Nova Power"
//                     value={`${user?.balance?.toFixed(2) ?? 0} TON`}
//                     subValue={`≈ $${((user?.balance ?? 0) * tonPrice).toFixed(2)}`}
//                     icon={<FaCoins className="w-4 h-4 text-blue-300" />}
//                     bgColor="bg-blue-500/20"
//                   />

//                   {/* Total Withdrawn */}
//                   <StatsCard
//                     title="Claimable"
//                     value={`${user?.total_withdrawn?.toFixed(2) ?? 0} TON`}
//                     subValue={`≈ $${((user?.total_withdrawn ?? 0) * tonPrice).toFixed(2)}`}
//                     icon={<svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>}
//                     bgColor="bg-green-500/20"
//                   />

//                   {/* Total Earned */}
//                   <StatsCard
//                     title="Earnings"
//                     value={`${(loadTotalEarned() + earningState.currentEarnings).toFixed(2)} TON`}
//                     subValue={`≈ $${((loadTotalEarned() + earningState.currentEarnings) * (tonPrice || 0)).toFixed(4)}`}
//                     icon={<svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>}
//                     bgColor="bg-yellow-500/20"
//                   />

//                   {/* Reputation Points */}
//                   <StatsCard
//                     title="Nova Token"
//                     value={`${user?.total_sbt?.toFixed(2) ?? 0} NOVA`}
//                     subValue={`Level ${Math.floor((user?.total_sbt ?? 0) / 100) + 1}`}
//                     icon={<svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                     </svg>}
//                     bgColor="bg-purple-500/20"
//                   />

//   <StatsCard
// title="Wallet Address"
// value={userFriendlyAddress || 'Not connected'}
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
//               <div className="bg-black rounded-xl p-4 border border-blue-500/20">
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {currentTab === 'network' && (
//         <div className="flex-1 p-2 sm:p-6 space-y-6 overflow-y-auto">
//           <ReferralSystem 
//           />
//         </div>
//       )}

//       {currentTab === 'gmp' && (
//         <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
//           <GMPLeaderboard />
//         </div>
//       )}

//       {currentTab === 'tasks' && (
//         <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
//           <SocialTasks showSnackbar={showSnackbar} />
//         </div>
//       )}

//       {currentTab === 'token' && (
//         <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
//           <TokenLaunchpad />
//         </div>
//       )}
//     </div>

//     {/* Deposit Modal */}
//     {showDepositModal && (
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//         <div className="bg-gradient-to-b from-[#1a1c2e] to-[#0d0f1d] rounded-xl w-full max-w-md border-2 border-blue-500/20 shadow-xl shadow-blue-500/10">
//           <div className="p-4">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex items-center gap-2">
//                 <div className="w-8 h-8 relative">
//                   <div className="absolute inset-0 bg-blue-500/20 rounded-lg rotate-45 animate-pulse" />
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                     </svg>
//                   </div>
//                 </div>
//                 <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
//                   <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Deposit TON</span>
//                 </div>
//               </div>
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
//                       min="1"
//                       step="0.1"
//                       value={customAmount}
//                       onChange={(e) => setCustomAmount(e.target.value)}
//                       className="w-full px-4 py-3 bg-blue-900/10 border border-blue-500/20 rounded-lg 
//                         text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
//                     />
//                     <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm">TON</div>
//                   </div>

//                   {/* Deposit Button */}
//                   <button
//                     onClick={() => {
//                       const amount = parseFloat(customAmount);
//                       if (!isNaN(amount) && amount >= 1) {
//                         handleDeposit(amount);
//                       }
//                     }}
//                     disabled={!customAmount || parseFloat(customAmount) < 1}
//                     className={`w-full py-3 pixel-corners font-medium transition-all duration-200 
//                       ${!customAmount || parseFloat(customAmount) < 1
//                         ? 'bg-blue-500/50 text-white/50 cursor-not-allowed'
//                         : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
//                       }`}
//                   >
//                     Deposit {customAmount ? `${customAmount} TON` : 'TON'}
//                   </button>
//                 </div>

//                 {/* Earnings Preview */}
//                 {customAmount && parseFloat(customAmount) >= 1 && (
//                   <div className="bg-blue-900/10 rounded-lg p-3 border border-blue-500/20 space-y-3">
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-white/60">Initial Deposit</span>
//                       <span className="text-white">{parseFloat(customAmount).toFixed(2)} TON</span>
//                     </div>
                    
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-white/60">Starting Daily ROI</span>
//                         <span className="text-green-400">+1.00%</span>
//                       </div>
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-white/60">Maximum Daily ROI</span>
//                         <span className="text-green-400">+11.00%</span>
//                       </div>
//                     </div>

//                     <div className="pt-2 border-t border-blue-500/20">
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-white/60">Potential Total Return</span>
//                         <div className="text-right">
//                           <div className="text-blue-400 font-medium">
//                             {(parseFloat(customAmount) + calculateTotalEarnings(parseFloat(customAmount))).toFixed(2)} TON
//                           </div>
//                           <div className="text-xs text-white/40">
//                             After 100 days
//                           </div>
//                         </div>
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

//  {/* Withdrawal Info Modal */}
//  <WithdrawalInfoModal
//         isOpen={showWithdrawalInfo}
//         onClose={() => setShowWithdrawalInfo(false)}
//       />

//       {/* Offline Rewards Modal */}
//       {showOfflineRewardsModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
//           <div className="bg-black rounded-xl w-full max-w-md border border-blue-500/20">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-xl font-semibold text-white">Offline Rewards</h3>
//                 <button 
//                   onClick={() => setShowOfflineRewardsModal(false)}
//                   className="text-white/60 hover:text-white"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>

//               <div className="text-center">
//                 <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 </div>

//                 <h4 className="text-lg font-semibold text-white mb-2">
//                   Nova Power Rewards Ready!
//                 </h4>
//                 <p className="text-sm text-white/60 mb-6">
//                   Your Nova Power has generated rewards while you were away.
//                 </p>

//                 <div className="space-y-4 mb-6">
//                   <div className="bg-white/5 rounded-lg p-4">
//                     <div className="text-sm text-white/60 mb-1">TON Rewards</div>
//                     <div className="text-2xl font-bold text-green-400">
//                       +{offlineRewardsAmount.toFixed(8)} TON
//                     </div>
//                   </div>

//                   <div className="bg-white/5 rounded-lg p-4">
//                     <div className="text-sm text-white/60 mb-1">NOVA Tokens</div>
//                     <div className="text-2xl font-bold text-purple-400">
//                       +{(offlineRewardsAmount * 0.1).toFixed(8)} NOVA
//                     </div>
//                   </div>
//                 </div>

//                 <button
//                   onClick={handleClaimOfflineRewards}
//                   className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-all duration-200 shadow-lg shadow-green-500/25"
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
//           <div className="grid grid-cols-4 items-center">
//           {[
//               { id: 'home', text: 'Home', Icon: AiOutlineHome },
//               { id: 'tasks', text: 'Tasks', Icon: AiOutlineCheckSquare },
//               { id: 'network', text: 'Network', Icon: FaUserPlus },
//               { id: 'token', text: 'Token', Icon: BsCoin }
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
//   const ReStakeCountdown: FC<{ depositDate: string | Date }> = ({ depositDate }) => {
//     const [timeLeft, setTimeLeft] = useState(() => {
//       const start = new Date(depositDate);
//       const now = new Date();
//       const totalDays = 100;
//       const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
//       const daysLeft = Math.max(0, totalDays - daysElapsed);
//       return daysLeft;
//     });
  
//     useEffect(() => {
//       // Update daily
//       const timer = setInterval(() => {
//         const start = new Date(depositDate);
//         const now = new Date();
//         const totalDays = 100;
//         const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
//         const daysLeft = Math.max(0, totalDays - daysElapsed);
//         setTimeLeft(daysLeft);
//       }, 86400000); // Update every 24 hours
  
//       return () => clearInterval(timer);
//     }, [depositDate]);
  
//     // If fully unlocked
//     if (timeLeft === 0) {
//       return (
//         <div className="flex items-center gap-1">
//           <span className="w-1 h-1 rounded-full bg-green-400"></span>
//           <span className="text-[10px] text-green-400">Unlocked</span>
//         </div>
//       );
//     }
  
//     // If still locked
//     return (
//       <div className="flex items-center gap-1">
//         <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
//         <span className="text-[10px] text-yellow-400">
//           Locked: {timeLeft}d
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

// // Add this helper function
// const getActivityDescription = (activity: Activity): string => {
//   switch (activity.type) {
//     case 'deposit':
//       return `Deposited ${activity.amount.toFixed(2)} TON`;
//     case 'withdrawal':
//       return `Withdrew ${activity.amount.toFixed(2)} TON`;
//     case 'stake':
//       return `Staked ${activity.amount.toFixed(2)} TON`;
//     case 'redeposit':
//       return `Redeposited ${activity.amount.toFixed(2)} TON`;
//     case 'nova_reward':
//       return `Earned ${activity.amount.toFixed(2)} NOVA tokens`;
//     case 'offline_reward':
//       const metadata = activity.metadata as {
//         offline_duration: number;
//         earning_rate: number;
//         previous_balance: number;
//         new_balance: number;
//       };
//       return `Claimed ${activity.amount.toFixed(6)} TON (${metadata.offline_duration}h offline)`;
//     default:
//       return `${activity.type} ${activity.amount.toFixed(2)} TON`;
//   }
// };

// // Add with other utility functions
// const getDaysSinceDeposit = (depositDate: string): number => {
//   const deposit = new Date(depositDate);
//   const now = new Date();
//   return Math.floor((now.getTime() - deposit.getTime()) / (1000 * 60 * 60 * 24));
// };
