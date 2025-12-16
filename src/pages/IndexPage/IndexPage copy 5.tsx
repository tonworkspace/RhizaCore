
// import { useTonConnectUI } from '@tonconnect/ui-react';
// import { toUserFriendlyAddress } from '@tonconnect/sdk';
// import React, {  FC, useState, useEffect, useRef } from 'react';
// import { I18nProvider, useI18n } from '@/components/I18nProvider';
// import { AuthProvider, useWalletAuth } from '@/contexts/AuthContext';
// // import LoginForm from '@/components/auth/LoginForm';
// import UsernameSetup from '@/components/auth/UsernameSetup';
// import Layout from '@/components/ui/Layout';
// import UserSearch from '@/components/users/UserSearch';
// import SendPayment, { type PaymentData } from '@/components/payments/SendPayment';
// import PaymentConfirm from '@/components/payments/PaymentConfirm';
// import TransactionHistory from '@/components/transactions/TransactionHistory';
// import { type User, supabase, processReferralStakingRewards } from '@/lib/supabaseClient';
// import { toNano, fromNano } from "ton";
// import TonWeb from 'tonweb';
// import ArcadeMiningUI, { ArcadeMiningUIHandle } from '@/components/ArcadeMiningUI';
// import { SponsorGate } from '@/components/SponsorGate';
// import { Button } from '@telegram-apps/telegram-ui';
// import { Snackbar } from '@telegram-apps/telegram-ui';
// import EnhancedLoginForm from '@/components/auth/EnhancedLoginForm';
// import { OnboardingScreen } from './OnboardingScreen';

// type PaymentFlow = 'search' | 'form' | 'confirm';
// // Time-based multipliers as per whitepaper
// const getTimeMultiplier = (daysStaked: number): number => {
//   if (daysStaked <= 7) return 1.0;   // 1-7 days: 1.0x base rate
//   if (daysStaked <= 30) return 1.1;  // 8-30 days: 1.1x bonus multiplier
//   return 1.25; // 31+ days: 1.25x maximum multiplier
// };

// // Referral boost system as per whitepaper
// const getReferralBoost = (referralCount: number): number => {
//   const baseBoost = Math.min(referralCount * 0.05, 0.5); // 5% per referral, max 50%
//   return 1 + baseBoost;
// };

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

// // Add these constants for both networks
// const MAINNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';
// const TESTNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';

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
//   startDate?: number;
// }

// // Add these constants
// const EARNINGS_SYNC_INTERVAL = 60000; // Sync with server every 60 seconds
// const getEarningsStorageKey = (userId: number | string) => `userEarnings_${userId}`;
// const EARNINGS_UPDATE_INTERVAL = 1000; // Update UI every second

// // Add this interface near other interfaces
// interface OfflineEarnings {
//   lastActiveTimestamp: number;
//   baseEarningRate: number;
// }

// // Add this constant near other constants
// const getOfflineEarningsKey = (userId: number | string) => `offline_earnings_state_${userId}`;

// // // Add this constant near other constants
// // const TOTAL_EARNED_KEY = 'total_earned_state';

// // Add these constants at the top
// const LOCK_PERIOD_DAYS = 135;
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
// const saveOfflineEarnings = (userId: number | string, state: OfflineEarnings) => {
//   localStorage.setItem(getOfflineEarningsKey(userId), JSON.stringify(state));
// };

// const loadOfflineEarnings = (userId: number | string): OfflineEarnings | null => {
//   const stored = localStorage.getItem(getOfflineEarningsKey(userId));
//   return stored ? JSON.parse(stored) : null;
// };


// // Add these constants at the top
// // const USER_SESSION_KEY = 'userSession';
// const EARNINGS_KEY_PREFIX = 'userEarnings_';
// const LAST_SYNC_PREFIX = 'lastSync_';
// // Update storage keys to be user-specific
// const getUserEarningsKey = (userId: number | string) => `${EARNINGS_KEY_PREFIX}${userId}`;
// const getUserSyncKey = (userId: number | string) => `${LAST_SYNC_PREFIX}${userId}`;

// // Update syncEarningsToDatabase
// const syncEarningsToDatabase = async (userId: number, telegramId: number | string, earnings: number) => {
//   try {
//     const lastSync = localStorage.getItem(getUserSyncKey(telegramId));
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
      
//       localStorage.setItem(getUserSyncKey(telegramId), now.toString());
//     }
//   } catch (error) {
//     console.error('Silent sync error:', error);
//   }
// };

// const IndexPageContent: React.FC = () => {
//   const { isAuthenticated, isLoading, user, telegramUser, updateUserData } = useWalletAuth();
//   const [currentTab, setCurrentTab] = useState<'home' | 'send' | 'activity' | 'search' | 'profile'>('home');
//   const [userReferralCode, setUserReferralCode] = useState<string>('');
//   const [showDepositModal, setShowDepositModal] = useState(false);
//   const [showReferralContest, setShowReferralContest] = useState(false);
//   const [miningProgress, setMiningProgress] = useState(0);
//   const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>('search');
//   const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
//   const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
//    // Sponsor code gate states
//    const [hasSponsor, setHasSponsor] = useState<boolean | null>(null);
//    const [showSponsorGate, setShowSponsorGate] = useState(false);
//    const [isApplying, setIsApplying] = useState(false);
//      // Add state for activities
//   const [activities, setActivities] = useState<Activity[]>([]);
//   const [isLoadingActivities, setIsLoadingActivities] = useState(false);
//   const [depositStatus, setDepositStatus] = useState('idle');
//   const [walletBalance, setWalletBalance] = useState<string>('0');
//   const [, setIsLoadingBalance] = useState(true);
//   const [isSnackbarVisible, setSnackbarVisible] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarDescription, setSnackbarDescription] = useState('');
//   const snackbarTimeoutRef = useRef<NodeJS.Timeout>();

//  // Check if user has a sponsor
//  const checkSponsorStatus = async () => {
//   if (!user?.id) return;

//   console.time('IndexPage.checkSponsorStatus');
//   try {
//     console.log('🔍 Checking sponsor status for user:', user.id);

//     console.time('IndexPage.checkFirstUser');
//     // Check if user is the first user (admin bypass)
//     const { data: firstUser } = await supabase
//       .from('users')
//       .select('id')
//       .order('created_at', { ascending: true })
//       .limit(1)
//       .single();
//     console.timeEnd('IndexPage.checkFirstUser');
      
//     console.log('👑 First user ID:', firstUser?.id, 'Current user ID:', user.id);
      
//     // If this is the first user, bypass sponsor gate
//     if (firstUser?.id === user.id) {
//       console.log('✅ First user detected - bypassing sponsor gate');
//       setHasSponsor(true);
//       setShowSponsorGate(false);
//       return;
//     }
    
//     console.time('IndexPage.checkReferralData');
//     // Check if user already has a sponsor (from start parameters or manual entry)
//     const { data: referralData } = await supabase
//       .from('referrals')
//       .select('sponsor_id')
//       .eq('referred_id', user.id)
//       .maybeSingle();
//     console.timeEnd('IndexPage.checkReferralData');
      
//      console.log('📊 Referral data:', referralData);
//      console.log('👤 User sponsor_id:', user.sponsor_id);
       
//      // Check if user has sponsor from referrals table
//      const hasSponsorFromReferrals = !!referralData?.sponsor_id;
     
//      // Check if user has sponsor_id set in users table
//      const hasSponsorFromUser = !!user.sponsor_id;
     
//      // User has a sponsor if either referrals table OR users table has sponsor info
//      const hasSponsorStatus = hasSponsorFromReferrals || hasSponsorFromUser;
    
//     console.log('🔍 Sponsor status check:', {
//       hasSponsorFromReferrals,
//       hasSponsorFromUser,
//       hasSponsorStatus,
//       willShowGate: !hasSponsorStatus
//     });
    
//     setHasSponsor(hasSponsorStatus);
//     setShowSponsorGate(!hasSponsorStatus);
    
//      // If user has sponsor_id but no referral record, create it
//      if (hasSponsorFromUser && !hasSponsorFromReferrals && user.sponsor_id) {
//        console.log('📝 Creating missing referral record for sponsor_id:', user.sponsor_id);
//        try {
//          await supabase
//            .from('referrals')
//            .insert({
//              sponsor_id: user.sponsor_id,
//              referred_id: user.id,
//              status: 'active',
//              created_at: new Date().toISOString()
//            });
//          console.log('✅ Referral record created');
//        } catch (error) {
//          console.error('❌ Error creating referral record:', error);
//        }
//      }
//   } catch (error) {
//     console.error('❌ Error checking sponsor status:', error);
//     // On error, show sponsor gate to ensure user can still enter
//     setHasSponsor(false);
//     setShowSponsorGate(true);
//   } finally {
//     console.timeEnd('IndexPage.checkSponsorStatus');
//   }
// };

// // Apply sponsor code function
// const handleApplySponsorCode = async (sponsorCode: string) => {
//   if (!user?.id || !sponsorCode.trim()) return;
  
//   try {
//     setIsApplying(true);
    
//     if (sponsorCode === String(user.telegram_id) || sponsorCode === String(user.id)) {
//       showSnackbar({
//         message: 'Invalid Code',
//         description: 'You cannot use your own sponsor code.'
//       });
//       return;
//     }
    
//     // Check if user already has a sponsor
//     const { data: existing } = await supabase
//       .from('referrals')
//       .select('*')
//       .eq('referred_id', user.id)
//       .maybeSingle();
      
//     if (existing) {
//       showSnackbar({
//         message: 'Sponsor Already Assigned',
//         description: 'You already have a sponsor assigned to your account.'
//       });
//       return;
//     }
    
//     // Handle default codes for first user
//     if (sponsorCode.toLowerCase() === 'admin' || sponsorCode.toLowerCase() === 'system' || sponsorCode.toLowerCase() === 'default') {
//       // Check if this user is the first user in the system
//       const { data: totalUsers } = await supabase
//         .from('users')
//         .select('id', { count: 'exact', head: true });
        
//       const { data: firstUser } = await supabase
//         .from('users')
//         .select('id, username, telegram_id, sponsor_code')
//         .order('created_at', { ascending: true })
//         .limit(1)
//         .single();
        
//       // If this user is the first user, bypass the sponsor gate
//       if (totalUsers?.length === 1 || firstUser?.id === user.id) {
//         // Generate admin sponsor code if not already set
//         if (!user.sponsor_code || !user.sponsor_code.startsWith('ADMIN-')) {
//           const defaultSponsorCode = `ADMIN-${user.id.toString().padStart(4, '0')}`;
          
//           // Update the user with the default sponsor code
//           const { error: updateCodeError } = await supabase
//             .from('users')
//             .update({ sponsor_code: defaultSponsorCode })
//             .eq('id', user.id);
            
//           if (updateCodeError) {
//             console.error('Error setting default sponsor code:', updateCodeError);
//             showSnackbar({
//               message: 'Setup Error',
//               description: 'Error setting up default sponsor code. Please try again.'
//             });
//             return;
//           }
          
//           // Update local user state
//           if (updateUserData) {
//             updateUserData({ sponsor_code: defaultSponsorCode });
//           }
          
//           showSnackbar({
//             message: 'Admin Setup Complete',
//             description: `Admin sponsor code generated: ${defaultSponsorCode}`
//           });
//         }
        
//         // Bypass sponsor gate for first user
//         setHasSponsor(true);
//         setShowSponsorGate(false);
//         setIsApplying(false);
//         return;
//       } else {
//         showSnackbar({
//           message: 'Access Denied',
//           description: 'Default codes are only available for the first user.'
//         });
//         return;
//       }
//     }
    
//     // Handle first user's own admin sponsor code
//     if (sponsorCode.startsWith('ADMIN-')) {
//       // Check if this user is the first user
//       const { data: firstUser } = await supabase
//         .from('users')
//         .select('id')
//         .order('created_at', { ascending: true })
//         .limit(1)
//         .single();
        
//       if (firstUser?.id === user.id) {
//         // Allow first user to use their own admin code to bypass
//         setHasSponsor(true);
//         setShowSponsorGate(false);
//         setIsApplying(false);
//         showSnackbar({
//           message: 'Welcome, Admin!',
//           description: 'You have successfully bypassed the sponsor gate.'
//         });
//         return;
//       } else {
//         showSnackbar({
//           message: 'Access Denied',
//           description: 'Admin codes are only available for the first user.'
//         });
//         return;
//       }
//     }
    
//     // Validate sponsor code
//     const codeNum = Number(sponsorCode);
//     if (isNaN(codeNum)) {
//       showSnackbar({
//         message: 'Invalid Code Format',
//         description: 'Please enter a valid numeric sponsor code.'
//       });
//       return;
//     }
    
//     // Find sponsor by telegram_id or user_id
//     const { data: sponsor, error: sponsorError } = await supabase
//       .from('users')
//       .select('id, username, telegram_id, sponsor_code')
//       .or(`telegram_id.eq.${codeNum},id.eq.${codeNum}`)
//       .maybeSingle();
      
//     if (sponsorError || !sponsor) {
//       showSnackbar({
//         message: 'Sponsor Not Found',
//         description: 'Please check the sponsor code and try again.'
//       });
//       return;
//     }
    
//     // Check if trying to use own code
//     if (sponsor.id === user.id) {
//       showSnackbar({
//         message: 'Invalid Code',
//         description: 'You cannot use your own sponsor code.'
//       });
//       return;
//     }
    
//     // Check if referral already exists (prevent duplicates)
//     const { data: existingReferral } = await supabase
//       .from('referrals')
//       .select('id')
//       .eq('sponsor_id', sponsor.id)
//       .eq('referred_id', user.id)
//       .maybeSingle();
      
//     if (existingReferral) {
//       showSnackbar({
//         message: 'Referral Already Exists',
//         description: 'This referral relationship already exists.'
//       });
//       return;
//     }
    
//     // Check if sponsor is trying to refer themselves
//     const { data: reverseCheck } = await supabase
//       .from('referrals')
//       .select('*')
//       .eq('sponsor_id', user.id)
//       .eq('referred_id', sponsor.id)
//       .maybeSingle();
      
//     if (reverseCheck) {
//       showSnackbar({
//         message: 'Circular Reference',
//         description: 'Cannot create circular referral relationship.'
//       });
//       return;
//     }
    
//     // Create referral relationship
//     const { error: insertErr } = await supabase
//       .from('referrals')
//       .insert({ 
//         sponsor_id: sponsor.id, 
//         referred_id: user.id, 
//         status: 'active',
//         created_at: new Date().toISOString()
//       });
      
//     if (insertErr) {
//       // Check if it's a duplicate key error (race condition)
//       const isDuplicate = (insertErr as any)?.code === '23505' || 
//                          (insertErr.message || '').toLowerCase().includes('duplicate') ||
//                          (insertErr.message || '').toLowerCase().includes('unique');
      
//       if (isDuplicate) {
//         showSnackbar({
//           message: 'Referral Already Exists',
//           description: 'This referral relationship already exists.'
//         });
//         return;
//       }
      
//       console.error('Insert error:', insertErr);
//       throw insertErr;
//     }
    
//     // Update user's sponsor_id in users table
//     const { error: updateErr } = await supabase
//       .from('users')
//       .update({ sponsor_id: sponsor.id })
//       .eq('id', user.id);
      
//     if (updateErr) {
//       console.error('Update error:', updateErr);
//       // Don't throw here, referral was created successfully
//     }
    
//     // Update local user state
//     if (updateUserData) {
//       updateUserData({ sponsor_id: sponsor.id });
//     }
    
//     // Update sponsor's direct_referrals count
//     const { error: bumpDirectError } = await supabase
//       .from('users')
//       .update({ direct_referrals: (sponsor as any).direct_referrals + 1 })
//       .eq('id', sponsor.id);
      
//     if (bumpDirectError) {
//       console.warn('Failed to bump direct_referrals (non-fatal):', bumpDirectError?.message);
//     }
    
//     showSnackbar({
//       message: 'Successfully Joined Team!',
//       description: `You have joined ${sponsor.username}'s team!`
//     });
//     checkSponsorStatus(); // Check sponsor status
//     setShowSponsorGate(false); // Hide the gate
    
//   } catch (e) {
//     console.error(e);
//     showSnackbar({
//       message: 'Failed to Apply Code',
//       description: 'There was an error processing your sponsor code. Please try again.'
//     });
//   } finally {
//     setIsApplying(false);
//   }
// };

// // Set user referral code when user data is available
// useEffect(() => {
//   if (user?.id) {
//     setUserReferralCode(String(user.telegram_id || user.id));
//     checkSponsorStatus();
    
//     // Fallback: If sponsor status check takes too long or fails, show sponsor gate
//     const fallbackTimer = setTimeout(() => {
//       if (hasSponsor === null) {
//         console.log('⚠️ Sponsor status check timeout - showing sponsor gate as fallback');
//         setHasSponsor(false);
//         setShowSponsorGate(true);
//       }
//     }, 5000); // 5 second timeout
    
//     return () => clearTimeout(fallbackTimer);
//   }
// }, [user?.id, user?.telegram_id, hasSponsor]);
// // const userAddress = useTonAddress();
// const [, setUserFriendlyAddress] = useState<string | null>(null);
// const [tonConnectUI] = useTonConnectUI();
// // const isWalletConnected = tonConnectUI.connected;
// const [, setHasStaked] = useState(() => {
//   return Boolean(user?.balance && user.balance >= 1);
// });

// const [isStakingCompleted, setIsStakingCompleted] = useState(false);


// useEffect(() => {
//   if (user) {
//     setIsStakingCompleted(localStorage.getItem(`isStakingCompleted_${user.telegram_id}`) === 'true');
//   }
// }, [user]);

// // Update useEffect that watches user balance
// useEffect(() => {
//   if (user?.balance && user.balance >= 1 && !isStakingCompleted) {
//     setHasStaked(true);
//     setIsStakingCompleted(true);
//     if (user) {
//       localStorage.setItem(`isStakingCompleted_${user.telegram_id}`, 'true');
//     }
//   }
// }, [user, isStakingCompleted]);


// useEffect(() => {
//   if (tonConnectUI.account) {
//     const rawAddress = tonConnectUI.account.address;
//     const friendlyAddress = toUserFriendlyAddress(rawAddress);
//     setUserFriendlyAddress(friendlyAddress);
//   }
// }, [tonConnectUI]);

// const [activeCard] = useState<CardType>('stats');
// const [currentROI, ] = useState<number>(0.0306); // 3.06% daily to match modal calculation
// const [tonPrice, setTonPrice] = useState(0);
// const [, setTonPriceChange] = useState(0);
// const [showOnboarding, setShowOnboarding] = useState(false);
// // Mining simulator states
// const [, setMiningStatus] = useState('Initializing mining rig...');


// // Add this state for custom amount
// const [customAmount, setCustomAmount] = useState('');

// // Update the earning system in the IndexPage component
// const [earningState, setEarningState] = useState<LocalEarningState>({
//   lastUpdate: Date.now(),
//   currentEarnings: 0,
//   baseEarningRate: 0,
//   isActive: false,
// });


// const [showNFTMinterModal, setShowNFTMinterModal] = useState(false);
// const [nftMintStatus, setNftMintStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
// const [hasNFTPass, setHasNFTPass] = useState(false);

// useEffect(() => {
//   if (user) {
//     setHasNFTPass(localStorage.getItem(`hasClaimedNFTPass_${user.telegram_id}`) === 'true');
//   }
// }, [user]);

// // Add this function to handle NFT minting success
// const handleNFTMintSuccess = async (): Promise<void> => {
//   setHasNFTPass(true);
//   if (user) {
//     localStorage.setItem(`hasClaimedNFTPass_${user.telegram_id}`, 'true');
//   }
  
//   // Close the modal after successful mint
//   setShowNFTMinterModal(false);
  
//   // Show success message
//   showSnackbar({
//     message: 'NFT Minted Successfully',
//     description: 'You have earned 5,000 RhizaCore'
//   });
// };

//   // Add function to save earning state to localStorage
//   const saveEarningState = (userId: number | string, state: LocalEarningState) => {
//     try {
//       localStorage.setItem(getEarningsStorageKey(userId), JSON.stringify(state));
//     } catch (error) {
//       console.error('Error saving earning state:', error);
//     }
//   };


//   // Add these states at the top of your component
// // const [isClaimingReward, setIsClaimingReward] = useState(false);
// const [isDepositing, setIsDepositing] = useState(false);

// useEffect(() => {
//   if (user) {
//     // setHasClaimedReward(localStorage.getItem(`hasClaimedWalletReward_${user.telegram_id}`) === 'true');
//   }
// }, [user]);

// // Add these constants near other constants
// const getClaimCooldownKey = (userId: number | string) => `claim_cooldown_${userId}`;
// // const CLAIM_COOLDOWN_DURATION = 1800; // 30 minutes in seconds

// // Update state for cooldown
// const [claimCooldown, setClaimCooldown] = useState(0);

// // Add effect to handle cooldown timer and persistence
// useEffect(() => {
//   if (!user) return;
//   const CLAIM_COOLDOWN_KEY = getClaimCooldownKey(user.telegram_id || user.id);
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

// // Modify this effect to only show notification but not auto-expand
// useEffect(() => {
//   if (user?.total_withdrawn && user.total_withdrawn >= 1) {
//     // We'll just update the UI to show notification, but won't auto-expand
//     // The card will remain collapsed until user clicks
//   }
// }, [user?.total_withdrawn]);

//   // Update earnings effect
//   useEffect(() => {
//     if (!user?.id || !user.balance) return;

//     // // Save user session
//     // saveUserSession(user.id);

//     // Load saved earnings from localStorage with user-specific key
//     const savedEarnings = localStorage.getItem(getUserEarningsKey(user.telegram_id || user.id));
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
//         localStorage.setItem(getUserEarningsKey(user.telegram_id || user.id), JSON.stringify(newState));
        
//         // Stealth sync to database
//         syncEarningsToDatabase(user.id!, user.telegram_id!, newEarnings);
        
//         return newState;
//       });
//     }, EARNINGS_UPDATE_INTERVAL);

//     return () => {
//       clearInterval(earningsInterval);
//       // Save final state before unmounting
//       const finalState = earningState;
//       localStorage.setItem(getUserEarningsKey(user.telegram_id ?? user.id), JSON.stringify(finalState));
      
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

// // Network power calculation (total staked amount)
// const calculateNetworkPower = async (): Promise<number> => {
//   try {
//     const { data } = await supabase
//       .from('users')
//       .select('balance')
//       .gt('balance', 0);
    
//     return data?.reduce((total, user) => total + (user.balance || 0), 0) || 1;
//   } catch (error) {
//     console.error('Error calculating network power:', error);
//     return 1; // Fallback to prevent division by zero
//   }
// };

// // Sustainable earning rate calculation matching whitepaper formula
// const calculateEarningRate = async (
//   balance: number, 
//   _baseROI: number, 
//   daysStaked: number = 0, 
//   referralCount: number = 0
// ): Promise<number> => {
//   // Get multipliers
//   const timeMultiplier = getTimeMultiplier(daysStaked);
//   const referralBoost = getReferralBoost(referralCount);
  
//   // Calculate effective staking power
//   const effectiveStakingPower = balance * timeMultiplier * referralBoost;
  
//   // Get network power
//   const networkPower = await calculateNetworkPower();
  
//   // Daily emission cap (sustainable amount)
//   const dailyEmission = 1000; // 1000 Rhiza per day total
  
//   // Calculate daily reward using whitepaper formula
//   const dailyReward = (effectiveStakingPower / networkPower) * dailyEmission;
  
//   // Convert to per-second rate
//   return dailyReward / 86400;
// };

// // Legacy function for backward compatibility (simplified)
// const calculateEarningRateLegacy = (balance: number, baseROI: number, daysStaked: number = 0) => {
//   // Use time-based multipliers to match modal calculation
//   const timeMultiplier = getTimeMultiplier(daysStaked);
//   const referralBoost = 1.0; // Default for users without referrals (can be enhanced later)
  
//   const effectiveStakingPower = balance * timeMultiplier * referralBoost;
//   const dailyReward = effectiveStakingPower * baseROI;
  
//   return dailyReward / 86400; // Per second rate
// };

// // Clear old cached earning rates to prevent $43 rewards
// const clearOldEarningCache = (userId: number | string) => {
//   try {
//     // Clear localStorage cache
//     localStorage.removeItem(getUserEarningsKey(userId));
//     localStorage.removeItem(getUserSyncKey(userId));
//     localStorage.removeItem(getOfflineEarningsKey(userId));
    
//     console.log('Cleared old earning cache for user:', userId);
//   } catch (error) {
//     console.error('Error clearing earning cache:', error);
//   }
// };

// // Update handleDeposit to use proper number handling
// const handleDeposit = async (amount: number) => {
//   try {
//     setIsDepositing(true);  // Set loading state
    
//     // Validate amount
//     if (amount < 1) {
//       showSnackbar({ 
//         message: 'Invalid Amount', 
//         description: 'Minimum deposit amount is 1 TON' 
//       });
//       setIsDepositing(false);
//       return;
//     }

//     // Enhanced wallet validation
//     if (!tonConnectUI.account) {
//       showSnackbar({ 
//         message: 'Wallet Not Connected', 
//         description: 'Please connect your TON wallet first' 
//       });
//       setIsDepositing(false);
//       return;
//     }

//     // Validate user
//     if (!user?.id) {
//       showSnackbar({ 
//         message: 'User Not Found', 
//         description: 'Please try logging in again' 
//       });
//       setIsDepositing(false);
//       return;
//     }

//     // Validate wallet address
//     if (!tonConnectUI.account.address) {
//       showSnackbar({ 
//         message: 'Invalid Wallet', 
//         description: 'Please reconnect your wallet' 
//       });
//       setIsDepositing(false);
//       return;
//     }

//     // Check wallet balance with proper error handling
//     try {
//       const walletBalanceNum = Number(walletBalance);
//       if (isNaN(walletBalanceNum)) {
//         throw new Error('Invalid wallet balance');
//       }
      
//       if (walletBalanceNum < amount) {
//         showSnackbar({
//           message: 'Insufficient Balance',
//           description: `Your wallet balance is ${walletBalanceNum.toFixed(2)} TON`
//         });
//         setIsDepositing(false);
//         return;
//       }
//     } catch (error) {
//       console.error('Error checking wallet balance:', error);
//       showSnackbar({
//         message: 'Wallet Error',
//         description: 'Unable to verify wallet balance. Please try again.'
//       });
//       setIsDepositing(false);
//       return;
//     }

//     // Rest of the deposit logic remains the same...
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
//     saveEarningState(user.telegram_id || user.id, previousState);
    
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

//       // Clear old earning cache to prevent inflated rewards
//       clearOldEarningCache(user.telegram_id || user.id);

//       // Process referral rewards for staking
//       await processReferralStakingRewards(user.id, amount);

//       // Fetch updated user data
//       const { data: updatedUser } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', user.id)
//         .single();

//       if (updatedUser) {
//         // Update user data in context
//         updateUserData(updatedUser);

//         // Calculate new base rate with updated balance (new users start at day 0)
//         const newBaseEarningRate = calculateEarningRateLegacy(updatedUser.balance, currentROI, 0);
        
//         // Set new state with preserved earnings for top-ups
//         const newState = {
//           ...previousState,
//           baseEarningRate: newBaseEarningRate,
//           isActive: true,
//           currentEarnings: previousEarnings, // Preserve previous earnings for top-ups
//           lastUpdate: Date.now()
//         };

//         setEarningState(newState);
//         saveEarningState(user.telegram_id || user.id, newState);

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
    
//     // Enhanced error handling
//     let errorMessage = 'Please try again later';
//     if (error instanceof Error) {
//       if (error.message.includes('user rejected')) {
//         errorMessage = 'Transaction was rejected';
//       } else if (error.message.includes('insufficient funds')) {
//         errorMessage = 'Insufficient funds in wallet';
//       }
//     }
    
//     showSnackbar({ 
//       message: 'Deposit Failed', 
//       description: errorMessage 
//     });
    
//     // Restore previous state on error
//     if (user) {
//       const savedState = localStorage.getItem(getEarningsStorageKey(user.telegram_id || user.id));
//       if (savedState) {
//         setEarningState(JSON.parse(savedState));
//       }
//     }
//   } finally {
//     setCustomAmount('');
//     setIsDepositing(false);
//   }
// };

//   // Add effect to fetch and subscribe to activities
//   useEffect(() => {
//     const fetchActivities = async () => {
//       if (!user?.id) return;

//       console.time('IndexPage.fetchActivities');
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
//         console.timeEnd('IndexPage.fetchActivities');
//       }
//     };

//     // Fetch when activity card is active or when on home (embedded activity list)
//     if (activeCard === 'activity' || currentTab === 'home') {
//       fetchActivities();
//       // fetchWithdrawals();

//       // Set up real-time subscription for activities
//       const activitiesSubscription = supabase
//         .channel('activities-channel')
//         .on(
//           'postgres_changes',
//           {
//             event: '*',
//             schema: 'public',
//             table: 'activities',
//           filter: `user_id=eq.${user?.id}`
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

//         // Cleanup subscriptions
//         return () => {
//           supabase.removeChannel(activitiesSubscription);
//           // supabase.removeChannel(withdrawalsSubscription);
//         };
//       }
//     }, [user?.id, activeCard, currentTab]);

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
//     if (user && !isLoading && hasSponsor) {
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
//   }, [user, isLoading, hasSponsor]);

//   // Add this effect to handle offline earnings
//   useEffect(() => {
//     if (!user) return;
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         // App became visible, calculate offline earnings
//         const offlineState = loadOfflineEarnings(user.telegram_id || user.id);
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
//               description: `You earned ${offlineEarnings.toFixed(8)} RZC while offline`
//             });
//           }
//         }
//       } else {
//         // App is going to background, save current state
//         if (earningState.isActive) {
//           saveOfflineEarnings(user.telegram_id || user.id, {
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
//   }, [earningState, user]);

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
//         const daysStaked = serverData ? Math.floor((now - new Date(serverData.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
//         const newRate = calculateEarningRateLegacy(user.balance, currentROI, daysStaked);
        
//         // Load saved earnings from localStorage
//         const savedEarnings = localStorage.getItem(getEarningsStorageKey(user.telegram_id || user.id));
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
//           saveEarningState(user.telegram_id || user.id, newState);
          
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
//           saveEarningState(user.telegram_id || user.id, newState);
//         }

//         // Set up periodic sync
//         const syncInterval = setInterval(async () => {
//           const currentState = JSON.parse(localStorage.getItem(getUserEarningsKey(user.telegram_id ?? user.id)) || '{}');
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
//         localStorage.setItem(getUserEarningsKey(user.telegram_id!), JSON.stringify(newState));
        
//         return newState;
//       });
//     }, EARNINGS_UPDATE_INTERVAL);

//     return () => {
//       clearInterval(earningsInterval);
//       // Save final state before unmounting
//       const finalState = earningState;
//       localStorage.setItem(getUserEarningsKey(user.telegram_id || user.id), JSON.stringify(finalState));
      
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


//   // Add this state for live progress
//   const [, setStakingProgress] = useState(0);

//   // Add this effect for live progress updates
//   useEffect(() => {
//     if (user?.last_deposit_date) {
//       setStakingProgress(calculateStakingProgress(user.last_deposit_date));
//     }
//   }, [user?.last_deposit_date]);

//   // Add new state variables at the top with other state declarations
//   const [isInitializing, setIsInitializing] = useState(true);
//   const [isNewUser] = useState(false);
//   const hasInitializedRef = useRef(false);

//   // Professional loading sequence
//   useEffect(() => {
//     if (hasInitializedRef.current) return;
//     if (isLoading) return;

//     // Simple loading sequence
//     const loadingSequence = [
//       { status: 'Initializing system...', progress: 25 },
//       { status: 'Connecting to blockchain...', progress: 50 },
//       { status: 'Loading user data...', progress: 75 },
//       { status: 'Ready to mine!', progress: 100 }
//     ];

//     let currentStep = 0;
//     const loadingInterval = setInterval(() => {
//       if (currentStep < loadingSequence.length) {
//         setMiningStatus(loadingSequence[currentStep].status);
//         setMiningProgress(loadingSequence[currentStep].progress);
//         currentStep++;
//       } else {
//         clearInterval(loadingInterval);
//         setIsInitializing(false);
//         hasInitializedRef.current = true;
//       }
//     }, 600);

//     return () => clearInterval(loadingInterval);
//   }, [isLoading]);

//   // Update the earnings initialization effect
//   useEffect(() => {
//     if (!user?.id || !user.balance) {
//       setIsInitializing(false);
//       return;
//     }

//     const initializeEarningState = async () => {
//       try {
//         if (!hasInitializedRef.current) {
//           setIsInitializing(true);
//         }

//         // Check if user exists in user_earnings
//         const { data: serverData } = await supabase
//           .from('user_earnings')
//           .select('current_earnings, last_update, start_date')
//           .eq('user_id', user.id)
//           .single();

//         const now = Date.now();
//         const daysStaked = serverData ? Math.floor((now - new Date(serverData.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
//         const newRate = calculateEarningRateLegacy(user.balance, currentROI, daysStaked);
        
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
//         hasInitializedRef.current = true;
//       }
//     };

//     initializeEarningState();
    
//     // Set up earnings calculation interval
//     const earningsInterval = setInterval(() => {
//       setEarningState(prevState => {
//         const now = Date.now();
//         const secondsElapsed = (now - prevState.lastUpdate) / 1000;
        
//         // Calculate days staked for time multiplier
//         const daysStaked = prevState.startDate ? Math.floor((now - prevState.startDate) / (1000 * 60 * 60 * 24)) : 0;
        
//         // Calculate new earnings based on current rate and elapsed time
//         const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
//         const newState = {
//           ...prevState,
//           lastUpdate: now,
//           currentEarnings: newEarnings,
//           baseEarningRate: calculateEarningRateLegacy(user.balance, currentROI, daysStaked) // Update rate based on new balance and time
//         };
        
//         // Save to localStorage
//         localStorage.setItem(getUserEarningsKey(user.telegram_id || user.id), JSON.stringify(newState));
        
//         return newState;
//       });
//     }, EARNINGS_UPDATE_INTERVAL);

//     return () => clearInterval(earningsInterval);
//   }, [user?.id, user?.balance, currentROI]);


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

//   const arcadeRef = useRef<ArcadeMiningUIHandle>(null);

//   // Immediate balance refresh for SocialTasks
//   const handleRewardClaimed = async (_amount: number) => {
//     if (arcadeRef.current && typeof arcadeRef.current.refreshBalance === 'function') {
//       arcadeRef.current.refreshBalance();
//     }
//   };



//   if (isLoading) {
//     return (
//       <Layout currentTab="home" onTabChange={() => {}}>
//         <div className="flex items-center justify-center bg-gradient-to-br from-black via-[#0a0a0f] to-black">
//           <div className="text-center">
//             <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
//               <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
//             </div>
//             <p className="text-green-400">Loading wallet...</p>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

  
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
//         {/* Error message component */}
//       </div>
//     );
//   }

//   // Show onboarding for new users
//   if (isNewUser && user) {
//     return (
//       <OnboardingScreen />
//     );
//   }

//   // Show sponsor gate if user doesn't have a sponsor
//   if (showSponsorGate && (hasSponsor === false || hasSponsor === null) && user) {
//     return (
//       <SponsorGate onApplyCode={handleApplySponsorCode} isLoading={isApplying} />
//     );
//   }


//   if (!isAuthenticated) {
//     return <EnhancedLoginForm />;
//   }

//   if (!user?.username) {
//     return <UsernameSetup />;
//   }

//   const handleUserSelectForPayment = (selectedUser: User) => {
//     setSelectedRecipient(selectedUser);
//     setPaymentFlow('form');
//   };

//   const handlePaymentConfirm = (data: PaymentData) => {
//     setPaymentData(data);
//     setPaymentFlow('confirm');
//   };

//   const handlePaymentSuccess = () => {
//     setCurrentTab('home');
//     setPaymentFlow('search');
//     setSelectedRecipient(null);
//     setPaymentData(null);
//   };

//   const handleBackToSearch = () => {
//     setPaymentFlow('search');
//     setSelectedRecipient(null);
//     setPaymentData(null);
//   };

//   const handleBackToForm = () => {
//     setPaymentFlow('form');
//     setPaymentData(null);
//   };

//   const renderTabContent = () => {
//     switch (currentTab) {
//       case 'home':
//         return (
//           <div>
//             <ArcadeMiningUI
//               ref={arcadeRef}
//               balanceTon={user?.balance || 0}
//               tonPrice={tonPrice || 0}
//               currentEarningsTon={earningState?.currentEarnings || 0}
//               isClaiming={false}
//               claimCooldown={0}
//               cooldownText={''}
//               onClaim={() => {}}
//               onOpenDeposit={() => setShowDepositModal(true)}
//               potentialEarningsTon={0}
//               airdropBalanceNova={0}
//               totalWithdrawnTon={user?.total_withdrawn || 0}
//               activities={activities}
//               withdrawals={[]}
//               isLoadingActivities={isLoadingActivities}
//               userId={user?.id}
//               userUsername={user?.username}
//               referralCode={userReferralCode}
//               estimatedDailyTapps={0}
//               showSnackbar={showSnackbar}
//             />
//           </div>
//         );
      
//       case 'send':
//         if (paymentFlow === 'search') {
//           return (
//             <div className="p-4 space-y-6">
//               <div className="venmo-card">
//                 <h2 className="text-lg font-semibold text-green-400 mb-4">Send Payment</h2>
//                 <UserSearch 
//                   showPayButton={true}
//                   onUserSelect={handleUserSelectForPayment}
//                 />
//               </div>
//             </div>
//           );
//         } else if (paymentFlow === 'form' && selectedRecipient) {
//           return (
//             <SendPayment
//               recipient={selectedRecipient}
//               onBack={handleBackToSearch}
//               onPaymentConfirm={handlePaymentConfirm}
//             />
//           );
//         } else if (paymentFlow === 'confirm' && paymentData) {
//           return (
//             <PaymentConfirm
//               paymentData={paymentData}
//               onBack={handleBackToForm}
//               onSuccess={handlePaymentSuccess}
//             />
//           );
//         }
//         return null;
      
//       case 'activity':
//         return (
//           <div className="p-4 space-y-6">
//             <TransactionHistory />
//           </div>
//         );
      
//       case 'search':
//         return (
//           <div className="p-4 space-y-6">
//             <div className="venmo-card">
//               <h2 className="text-lg font-semibold text-green-400 mb-4">Find Users</h2>
//               <UserSearch 
//                 onUserSelect={(selectedUser) => {
//                   setSelectedRecipient(selectedUser);
//                   setCurrentTab('send');
//                   setPaymentFlow('form');
//                 }}
//               />
//             </div>
//           </div>
//         );
      
//       case 'profile':
//         return (
//           <div className="p-4 space-y-6">
//             <div className="venmo-card">
//               <h2 className="text-lg font-semibold text-green-400 mb-4">Profile</h2>
//               <div className="space-y-4">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-500/20">
//                     {telegramUser.username?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-semibold text-green-400">
//                     {telegramUser.firstName || 'N/A'} {telegramUser.lastName || 'N/A'}
//                     </h3>
//                     <p className="text-green-300">@{user.username}</p>
//                     <p className="text-sm text-green-200">{user.email}</p>
//                   </div>
//                 </div>
                
//                 {telegramUser && (
//                   <div className="pt-4 border-t border-green-500/20">
//                     <h4 className="text-sm font-medium text-green-300 mb-2">Telegram Profile</h4>
//                     <div className="space-y-2">
//                       <p className="text-sm text-green-200"><strong>ID:</strong> {telegramUser.id}</p>
//                       <p className="text-sm text-green-200"><strong>Username:</strong> {telegramUser.username || 'N/A'}</p>
//                       <p className="text-sm text-green-200"><strong>First Name:</strong> {telegramUser.firstName || 'N/A'}</p>
//                       <p className="text-sm text-green-200"><strong>Last Name:</strong> {telegramUser.lastName || 'N/A'}</p>
//                       <p className="text-sm text-green-200"><strong>Language:</strong> {telegramUser.languageCode || 'N/A'}</p>
//                     </div>
//                   </div>
//                 )}
                
//                 <div className="pt-4 border-t border-green-500/20">
//                   <h4 className="text-sm font-medium text-green-300 mb-2">Wallet Address</h4>
//                   <p className="text-xs font-mono text-green-200 break-all bg-gray-900/50 p-3 rounded-lg border border-green-500/20">
//                     {user.wallet_address}
//                   </p>
//                 </div>
                
//               </div>
//             </div>
//           </div>
//         );
      
//       default:
//         return null;
//     }
//   };

//   const handleTabChange = (tab: 'home' | 'send' | 'activity' | 'search' | 'profile') => {
//     setCurrentTab(tab);
//     // Reset payment flow when changing tabs
//     if (tab !== 'send') {
//       setPaymentFlow('search');
//       setSelectedRecipient(null);
//       setPaymentData(null);
//     }
//   };

//   return (
//     <Layout currentTab={currentTab} onTabChange={handleTabChange}>
//       {renderTabContent()}
//     </Layout>
//   );
// };

// const calculateTotalEarnings = (amount: number): number => {
//   let totalEarnings = 0;
//   const baseROI = 0.0306; // 3.06% base daily rate for better returns
  
//   // Calculate earnings for each day up to 135 days (lock period)
//   for (let day = 1; day <= 135; day++) {
//     // Get time multiplier based on days staked
//     const timeMultiplier = getTimeMultiplier(day);
    
//     // Calculate daily earnings with time multiplier
//     const dailyEarnings = amount * baseROI * timeMultiplier;
//     totalEarnings += dailyEarnings;
//   }
  
//   return totalEarnings;
// };

// const SYNC_INTERVAL = 60000; // Sync every minute


// function IndexPage() {
//   return (
//     <AuthProvider>
//       <I18nProvider>
//       <IndexPageContent />
//       </I18nProvider>
//     </AuthProvider>
//   );
// }


// export default IndexPage;


