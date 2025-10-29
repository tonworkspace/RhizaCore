import { useTonConnectUI } from '@tonconnect/ui-react';
import { toUserFriendlyAddress } from '@tonconnect/sdk';
import { FC, useState, useEffect, useRef } from 'react';
import { I18nProvider, useI18n } from '@/components/I18nProvider';
import { FaCogs, FaMagento, FaTasks, FaWallet } from 'react-icons/fa';
// import { MdDiamond } from 'react-icons/md';
// import { BiNetworkChart } from 'react-icons/bi';
// import { TonConnectButton, } from '@tonconnect/ui-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, processReferralStakingRewards } from '@/lib/supabaseClient';
import { OnboardingScreen } from './OnboardingScreen';
import { toNano, fromNano } from "ton";
import TonWeb from 'tonweb';
import { Button } from '@telegram-apps/telegram-ui';
import { Snackbar } from '@telegram-apps/telegram-ui';
// import ReferralSystem from '@/components/ReferralSystem';
// import TokenLaunchpad from '@/components/TokenLaunchpad';
// import { WithdrawalInfoModal } from '@/components/WithdrawalInfoModal';
// import SocialTasks from '@/components/SocialTasks';
// import DailyRewardCard from '@/components/DailyRewardCard';
// import TwitterEngagementTask from '@/components/TwitterEngagementTask';
// import DailyUpdateCard from '@/components/DailyUpdateCard/DailyUpdateCard';
import { NFTMinter } from '@/components/NFTMinter';
// import AdminWithdrawalPanel from '@/components/AdminWithdrawalPanel';
import ArcadeMiningUI from '@/components/ArcadeMiningUI';
// import WithdrawModal from '@/components/WithdrawModal';
// import NewsComponent from '@/components/NewsComponent';
import TonWallet from '@/components/TonWallet';
// import DailyRewardCard from '@/components/DailyRewardCard';
// import NonStakedEngagement from '@/components/NonStakedEngagement';
import DappExplorer from '@/components/DappExplorer';
import SettingsComponent from '@/components/SettingsComponent';
import { SponsorGate } from '@/components/SponsorGate';
import SocialTasks from '@/components/SocialTasks';

// Time-based multipliers as per whitepaper
const getTimeMultiplier = (daysStaked: number): number => {
  if (daysStaked <= 7) return 1.0;   // 1-7 days: 1.0x base rate
  if (daysStaked <= 30) return 1.1;  // 8-30 days: 1.1x bonus multiplier
  return 1.25; // 31+ days: 1.25x maximum multiplier
};

// Referral boost system as per whitepaper
const getReferralBoost = (referralCount: number): number => {
  const baseBoost = Math.min(referralCount * 0.05, 0.5); // 5% per referral, max 50%
  return 1 + baseBoost;
};

// Add this at the top of your file with other constants

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

// // Update the renderROIStats function
// const renderROIStats = (currentROI: number) => {
//   const dailyRate = currentROI * 100;
//   const weeklyRate = dailyRate * 7;
//   const monthlyRate = dailyRate * 30;
//   const annualRate = dailyRate * 365;

//   return (
//     <div className="bg-white/5 rounded-lg p-3">
//       <div className="flex items-center gap-1.5 mb-1">
//         <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//         </svg>
//         <span className="text-xs text-white/40">Earning Rates</span>
//       </div>
//       <div className="space-y-1">
//         <div className="flex items-center justify-between">
//           <span className="text-sm text-white/60">Daily</span>
//           <span className="text-sm font-semibold text-green-400">
//             +{dailyRate.toFixed(2)}%
//           </span>
//         </div>
//         <div className="flex items-center justify-between">
//           <span className="text-sm text-white/60">Weekly</span>
//           <span className="text-sm font-semibold text-green-400">
//             +{weeklyRate.toFixed(2)}%
//           </span>
//         </div>
//         <div className="flex items-center justify-between">
//           <span className="text-sm text-white/60">Monthly</span>
//           <span className="text-sm font-semibold text-green-400">
//             +{monthlyRate.toFixed(2)}%
//           </span>
//         </div>
//         <div className="flex items-center justify-between">
//           <span className="text-sm text-white/60">Annual</span>
//           <span className="text-sm font-semibold text-green-400">
//             +{annualRate.toFixed(2)}%
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };


type CardType = 'stats' | 'activity' | 'community';

// Add this type definition at the top of the file
type ActivityType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'stake' 
  | 'redeposit' 
  | 'nova_reward' 
  | 'nova_income'
  | 'offline_reward'
  | 'earnings_update'
  | 'claim'
  | 'transfer'
  | 'reward'
  | 'bonus'
  | 'top_up'; // Add this new type

// Add these interfaces
interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  amount: number;
  status: string;
  created_at: string;
}

// // Add this new component
// const RankBadge: FC<{ rank: string }> = ({ rank }) => {
//   const getRankColor = (rank: string): string => {
//     switch (rank) {
//       case 'Novice': return 'bg-gray-500/20 text-gray-400';
//       case 'Ambassador': return 'bg-green-500/20 text-green-400';
//       case 'Warrior': return 'bg-blue-500/20 text-blue-400';
//       case 'Master': return 'bg-purple-500/20 text-purple-400';
//       case 'Cryptomogul': return 'bg-yellow-500/20 text-yellow-400';
//       case 'TON Baron': return 'bg-orange-500/20 text-orange-400';
//       case 'Tycoon': return 'bg-red-500/20 text-red-400';
//       case 'TON Elite': return 'bg-pink-500/20 text-pink-400';
//       case 'Final Boss': return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400';
//       default: return 'bg-gray-500/20 text-gray-400';
//     }
//   };

//   return (
//     <div className={`px-3 py-1 rounded-full ${getRankColor(rank)} font-medium text-xs`}>
//       {rank}
//     </div>
//   );
// };

// Add these constants for both networks
const MAINNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';
const TESTNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';

const isMainnet = true; // You can toggle this for testing

// Use the appropriate address based on network
const DEPOSIT_ADDRESS = isMainnet ? MAINNET_DEPOSIT_ADDRESS : TESTNET_DEPOSIT_ADDRESS;

// Constants for both networks
const MAINNET_API_KEY = '26197ebc36a041a5546d69739da830635ed339c0d8274bdd72027ccbff4f4234';
const TESTNET_API_KEY = 'd682d9b65115976e52f63713d6dd59567e47eaaa1dc6067fe8a89d537dd29c2c';

// Use toncenter.com as HTTP API endpoint to interact with TON blockchain
const tonweb = isMainnet ?
    new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {apiKey: MAINNET_API_KEY})) :
    new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: TESTNET_API_KEY}));

// Add this near the top with other constants
// const NETWORK_NAME = isMainnet ? 'Mainnet' : 'Testnet';

// Helper function to generate unique ID
const generateUniqueId = async () => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    // Generate a random ID between 1 and 999999
    const id = Math.floor(Math.random() * 999999) + 1;
    
    // Check if ID exists
    const { error } = await supabase
      .from('deposits')
      .select('id')
      .eq('id', id)
      .single();
      
    if (error && error.code === 'PGRST116') {  // No rows returned
      return id;  // Return as number, not string
    }
    
    attempts++;
  }
  
  throw new Error('Could not generate unique deposit ID');
};

// Add these types and interfaces near other interfaces
interface SnackbarConfig {
  message: string;
  description?: string;
  duration?: number;
}

// Add these constants near other constants
const SNACKBAR_DURATION = 5000; // 5 seconds

// Add these new interfaces
interface LocalEarningState {
  lastUpdate: number;
  currentEarnings: number;
  baseEarningRate: number;
  isActive: boolean;
  startDate?: number;
}

// Add these constants
const EARNINGS_SYNC_INTERVAL = 60000; // Sync with server every 60 seconds
const getEarningsStorageKey = (userId: number | string) => `userEarnings_${userId}`;
const EARNINGS_UPDATE_INTERVAL = 1000; // Update UI every second

// Add this interface near other interfaces
interface OfflineEarnings {
  lastActiveTimestamp: number;
  baseEarningRate: number;
}

// Add this constant near other constants
const getOfflineEarningsKey = (userId: number | string) => `offline_earnings_state_${userId}`;

// // Add this constant near other constants
// const TOTAL_EARNED_KEY = 'total_earned_state';

// Add these constants at the top
const LOCK_PERIOD_DAYS = 135;
const LOCK_PERIOD_MS = LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// Update the calculateStakingProgress function
const calculateStakingProgress = (depositDate: Date | string | null): number => {
  if (!depositDate) return 0;
  
  // Convert string to Date if necessary
  const startDate = typeof depositDate === 'string' ? new Date(depositDate) : depositDate;
  
  // Validate the date
  if (isNaN(startDate.getTime())) return 0;

  const now = Date.now();
  const startTime = startDate.getTime();
  const endTime = startTime + LOCK_PERIOD_MS;
  
  // Handle edge cases
  if (now >= endTime) return 100;
  if (now <= startTime) return 0;
  
  // Calculate progress
  const progress = ((now - startTime) / (endTime - startTime)) * 100;
  return Math.min(Math.max(progress, 0), 100); // Ensure between 0 and 100
};

// Add these helper functions
const saveOfflineEarnings = (userId: number | string, state: OfflineEarnings) => {
  localStorage.setItem(getOfflineEarningsKey(userId), JSON.stringify(state));
};

const loadOfflineEarnings = (userId: number | string): OfflineEarnings | null => {
  const stored = localStorage.getItem(getOfflineEarningsKey(userId));
  return stored ? JSON.parse(stored) : null;
};


// Add these constants at the top
// const USER_SESSION_KEY = 'userSession';
const EARNINGS_KEY_PREFIX = 'userEarnings_';
const LAST_SYNC_PREFIX = 'lastSync_';

// // Add session management functions
// const saveUserSession = (userId: number) => {
//   localStorage.setItem(USER_SESSION_KEY, userId.toString());
// };

// const getUserSession = (): number | null => {
//   const session = localStorage.getItem(USER_SESSION_KEY);
//   return session ? Number(session) : null;
// };

// const clearUserSession = () => {
//   const userId = getUserSession();
//   if (userId) {
//     localStorage.removeItem(USER_SESSION_KEY);
//     localStorage.removeItem(`${EARNINGS_KEY_PREFIX}${userId}`);
//     localStorage.removeItem(`${LAST_SYNC_PREFIX}${userId}`);
//   }
// };

// Update storage keys to be user-specific
const getUserEarningsKey = (userId: number | string) => `${EARNINGS_KEY_PREFIX}${userId}`;
const getUserSyncKey = (userId: number | string) => `${LAST_SYNC_PREFIX}${userId}`;

// Update syncEarningsToDatabase
const syncEarningsToDatabase = async (userId: number, telegramId: number | string, earnings: number) => {
  try {
    const lastSync = localStorage.getItem(getUserSyncKey(telegramId));
    const now = Date.now();
    
    if (!lastSync || (now - Number(lastSync)) > SYNC_INTERVAL) {
      await supabase
        .from('user_earnings')
        .upsert({
          user_id: userId,
          current_earnings: earnings,
          last_update: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      localStorage.setItem(getUserSyncKey(telegramId), now.toString());
    }
  } catch (error) {
    console.error('Silent sync error:', error);
  }
};


const IndexPageContent: FC = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [userReferralCode, setUserReferralCode] = useState<string>('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  // const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const { user, isLoading, error, updateUserData } = useAuth();
  const { lang, setLang } = useI18n();
  
  // Mining simulator states
  const [miningProgress, setMiningProgress] = useState(0);
  const [miningStatus, setMiningStatus] = useState('Initializing mining rig...');
  
  // Sponsor code gate states
  const [hasSponsor, setHasSponsor] = useState<boolean | null>(null);
  const [showSponsorGate, setShowSponsorGate] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  
  // Check if user has a sponsor
  const checkSponsorStatus = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 Checking sponsor status for user:', user.id);
      
      // Check if user is the first user (admin bypass)
      const { data: firstUser } = await supabase
        .from('users')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      console.log('👑 First user ID:', firstUser?.id, 'Current user ID:', user.id);
        
      // If this is the first user, bypass sponsor gate
      if (firstUser?.id === user.id) {
        console.log('✅ First user detected - bypassing sponsor gate');
        setHasSponsor(true);
        setShowSponsorGate(false);
        return;
      }
      
      // Check if user already has a sponsor (from start parameters or manual entry)
      const { data: referralData } = await supabase
        .from('referrals')
        .select('sponsor_id')
        .eq('referred_id', user.id)
        .maybeSingle();
        
       console.log('📊 Referral data:', referralData);
       console.log('👤 User sponsor_id:', user.sponsor_id);
         
       // Check if user has sponsor from referrals table
       const hasSponsorFromReferrals = !!referralData?.sponsor_id;
       
       // Check if user has sponsor_id set in users table
       const hasSponsorFromUser = !!user.sponsor_id;
       
       // User has a sponsor if either referrals table OR users table has sponsor info
       const hasSponsorStatus = hasSponsorFromReferrals || hasSponsorFromUser;
      
      console.log('🔍 Sponsor status check:', {
        hasSponsorFromReferrals,
        hasSponsorFromUser,
        hasSponsorStatus,
        willShowGate: !hasSponsorStatus
      });
      
      setHasSponsor(hasSponsorStatus);
      setShowSponsorGate(!hasSponsorStatus);
      
       // If user has sponsor_id but no referral record, create it
       if (hasSponsorFromUser && !hasSponsorFromReferrals && user.sponsor_id) {
         console.log('📝 Creating missing referral record for sponsor_id:', user.sponsor_id);
         try {
           await supabase
             .from('referrals')
             .insert({
               sponsor_id: user.sponsor_id,
               referred_id: user.id,
               status: 'active',
               created_at: new Date().toISOString()
             });
           console.log('✅ Referral record created');
         } catch (error) {
           console.error('❌ Error creating referral record:', error);
         }
       }
    } catch (error) {
      console.error('❌ Error checking sponsor status:', error);
      // On error, show sponsor gate to ensure user can still enter
      setHasSponsor(false);
      setShowSponsorGate(true);
    }
  };

  // Apply sponsor code function
  const handleApplySponsorCode = async (sponsorCode: string) => {
    if (!user?.id || !sponsorCode.trim()) return;
    
    try {
      setIsApplying(true);
      
      if (sponsorCode === String(user.telegram_id) || sponsorCode === String(user.id)) {
        showSnackbar({
          message: 'Invalid Code',
          description: 'You cannot use your own sponsor code.'
        });
        return;
      }
      
      // Check if user already has a sponsor
      const { data: existing } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', user.id)
        .maybeSingle();
        
      if (existing) {
        showSnackbar({
          message: 'Sponsor Already Assigned',
          description: 'You already have a sponsor assigned to your account.'
        });
        return;
      }
      
      // Handle default codes for first user
      if (sponsorCode.toLowerCase() === 'admin' || sponsorCode.toLowerCase() === 'system' || sponsorCode.toLowerCase() === 'default') {
        // Check if this user is the first user in the system
        const { data: totalUsers } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true });
          
        const { data: firstUser } = await supabase
          .from('users')
          .select('id, username, telegram_id, sponsor_code')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
          
        // If this user is the first user, bypass the sponsor gate
        if (totalUsers?.length === 1 || firstUser?.id === user.id) {
          // Generate admin sponsor code if not already set
          if (!user.sponsor_code || !user.sponsor_code.startsWith('ADMIN-')) {
            const defaultSponsorCode = `ADMIN-${user.id.toString().padStart(4, '0')}`;
            
            // Update the user with the default sponsor code
            const { error: updateCodeError } = await supabase
              .from('users')
              .update({ sponsor_code: defaultSponsorCode })
              .eq('id', user.id);
              
            if (updateCodeError) {
              console.error('Error setting default sponsor code:', updateCodeError);
              showSnackbar({
                message: 'Setup Error',
                description: 'Error setting up default sponsor code. Please try again.'
              });
              return;
            }
            
            // Update local user state
            if (updateUserData) {
              updateUserData({ sponsor_code: defaultSponsorCode });
            }
            
            showSnackbar({
              message: 'Admin Setup Complete',
              description: `Admin sponsor code generated: ${defaultSponsorCode}`
            });
          }
          
          // Bypass sponsor gate for first user
          setHasSponsor(true);
          setShowSponsorGate(false);
          setIsApplying(false);
          return;
        } else {
          showSnackbar({
            message: 'Access Denied',
            description: 'Default codes are only available for the first user.'
          });
          return;
        }
      }
      
      // Handle first user's own admin sponsor code
      if (sponsorCode.startsWith('ADMIN-')) {
        // Check if this user is the first user
        const { data: firstUser } = await supabase
          .from('users')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
          
        if (firstUser?.id === user.id) {
          // Allow first user to use their own admin code to bypass
          setHasSponsor(true);
          setShowSponsorGate(false);
          setIsApplying(false);
          showSnackbar({
            message: 'Welcome, Admin!',
            description: 'You have successfully bypassed the sponsor gate.'
          });
          return;
        } else {
          showSnackbar({
            message: 'Access Denied',
            description: 'Admin codes are only available for the first user.'
          });
          return;
        }
      }
      
      // Validate sponsor code
      const codeNum = Number(sponsorCode);
      if (isNaN(codeNum)) {
        showSnackbar({
          message: 'Invalid Code Format',
          description: 'Please enter a valid numeric sponsor code.'
        });
        return;
      }
      
      // Find sponsor by telegram_id or user_id
      const { data: sponsor, error: sponsorError } = await supabase
        .from('users')
        .select('id, username, telegram_id, sponsor_code')
        .or(`telegram_id.eq.${codeNum},id.eq.${codeNum}`)
        .maybeSingle();
        
      if (sponsorError || !sponsor) {
        showSnackbar({
          message: 'Sponsor Not Found',
          description: 'Please check the sponsor code and try again.'
        });
        return;
      }
      
      // Check if trying to use own code
      if (sponsor.id === user.id) {
        showSnackbar({
          message: 'Invalid Code',
          description: 'You cannot use your own sponsor code.'
        });
        return;
      }
      
      // Check if sponsor is trying to refer themselves
      const { data: reverseCheck } = await supabase
        .from('referrals')
        .select('*')
        .eq('sponsor_id', user.id)
        .eq('referred_id', sponsor.id)
        .maybeSingle();
        
      if (reverseCheck) {
        showSnackbar({
          message: 'Circular Reference',
          description: 'Cannot create circular referral relationship.'
        });
        return;
      }
      
      // Create referral relationship
      const { error: insertErr } = await supabase
        .from('referrals')
        .insert({ 
          sponsor_id: sponsor.id, 
          referred_id: user.id, 
          status: 'active',
          created_at: new Date().toISOString()
        });
        
      if (insertErr) {
        console.error('Insert error:', insertErr);
        throw insertErr;
      }
      
      // Update user's sponsor_id in users table
      const { error: updateErr } = await supabase
        .from('users')
        .update({ sponsor_id: sponsor.id })
        .eq('id', user.id);
        
      if (updateErr) {
        console.error('Update error:', updateErr);
        // Don't throw here, referral was created successfully
      }
      
      // Update local user state
      if (updateUserData) {
        updateUserData({ sponsor_id: sponsor.id });
      }
      
      // Update sponsor's direct_referrals count
      const { error: bumpDirectError } = await supabase
        .from('users')
        .update({ direct_referrals: (sponsor as any).direct_referrals + 1 })
        .eq('id', sponsor.id);
        
      if (bumpDirectError) {
        console.warn('Failed to bump direct_referrals (non-fatal):', bumpDirectError?.message);
      }
      
      showSnackbar({
        message: 'Successfully Joined Team!',
        description: `You have joined ${sponsor.username}'s team!`
      });
      checkSponsorStatus(); // Check sponsor status
      setShowSponsorGate(false); // Hide the gate
      
    } catch (e) {
      console.error(e);
      showSnackbar({
        message: 'Failed to Apply Code',
        description: 'There was an error processing your sponsor code. Please try again.'
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Set user referral code when user data is available
  useEffect(() => {
    if (user?.id) {
      setUserReferralCode(String(user.telegram_id || user.id));
      checkSponsorStatus();
      
      // Fallback: If sponsor status check takes too long or fails, show sponsor gate
      const fallbackTimer = setTimeout(() => {
        if (hasSponsor === null) {
          console.log('⚠️ Sponsor status check timeout - showing sponsor gate as fallback');
          setHasSponsor(false);
          setShowSponsorGate(true);
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [user?.id, user?.telegram_id, hasSponsor]);
  // const userAddress = useTonAddress();
  const [, setUserFriendlyAddress] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  // const isWalletConnected = tonConnectUI.connected;
  const [, setHasStaked] = useState(() => {
    return Boolean(user?.balance && user.balance >= 1);
  });

  const [isStakingCompleted, setIsStakingCompleted] = useState(false);

  useEffect(() => {
    if (user) {
      setIsStakingCompleted(localStorage.getItem(`isStakingCompleted_${user.telegram_id}`) === 'true');
    }
  }, [user]);

  // Update useEffect that watches user balance
  useEffect(() => {
    if (user?.balance && user.balance >= 1 && !isStakingCompleted) {
      setHasStaked(true);
      setIsStakingCompleted(true);
      if (user) {
        localStorage.setItem(`isStakingCompleted_${user.telegram_id}`, 'true');
      }
    }
  }, [user, isStakingCompleted]);

  
  useEffect(() => {
    if (tonConnectUI.account) {
      const rawAddress = tonConnectUI.account.address;
      const friendlyAddress = toUserFriendlyAddress(rawAddress);
      setUserFriendlyAddress(friendlyAddress);
    }
  }, [tonConnectUI]);

  const [activeCard] = useState<CardType>('stats');
  const [currentROI, ] = useState<number>(0.0306); // 3.06% daily to match modal calculation
  const [tonPrice, setTonPrice] = useState(0);
  const [, setTonPriceChange] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Add state for activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  // const [withdrawals, setWithdrawals] = useState<Array<{ id: number; amount: number; status: string; created_at: string; }>>([]);
  // const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);

  const [depositStatus, setDepositStatus] = useState('idle');

  // Add these state variables near the top with other state declarations
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [, setIsLoadingBalance] = useState(true);

  // Add these state variables
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarDescription, setSnackbarDescription] = useState('');
  const snackbarTimeoutRef = useRef<NodeJS.Timeout>();

  // Add this state for custom amount
  const [customAmount, setCustomAmount] = useState('');

  // Update the earning system in the IndexPage component
  const [earningState, setEarningState] = useState<LocalEarningState>({
    lastUpdate: Date.now(),
    currentEarnings: 0,
    baseEarningRate: 0,
    isActive: false,
  });

  // Estimated daily earnings based on current per-second rate
  // const estimatedDailyTapps = useMemo(() => {
  //   return Math.max(0, earningState.baseEarningRate * 86400);
  // }, [earningState.baseEarningRate]);

  // Add these state variables to your component
const [showNFTMinterModal, setShowNFTMinterModal] = useState(false);
const [nftMintStatus, setNftMintStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
const [hasNFTPass, setHasNFTPass] = useState(false);

useEffect(() => {
  if (user) {
    setHasNFTPass(localStorage.getItem(`hasClaimedNFTPass_${user.telegram_id}`) === 'true');
  }
}, [user]);

// Add this function to handle NFT minting success
const handleNFTMintSuccess = async (): Promise<void> => {
  setHasNFTPass(true);
  if (user) {
    localStorage.setItem(`hasClaimedNFTPass_${user.telegram_id}`, 'true');
  }
  
  // Close the modal after successful mint
  setShowNFTMinterModal(false);
  
  // Show success message
  showSnackbar({
    message: 'NFT Minted Successfully',
    description: 'You have earned 25,000 TAPPS JETTONS!'
  });
};

  // const handleSetPayoutWallet = async (walletAddress: string) => {
  //   try {
  //     // Show loading snackbar
  //     showSnackbar({
  //       message: 'Updating Wallet',
  //       description: 'Setting your payout wallet address...'
  //     });
  
  //     // Update the user's payout wallet in the database
  //     const { error } = await supabase
  //       .from('users')
  //       .update({ payout_wallet: walletAddress })
  //       .eq('id', user?.id);
  
  //     if (error) throw error;
  
  //     // Update local user state
  //     if (user) {
  //       updateUserData({
  //         ...user,
  //         payout_wallet: walletAddress
  //       });
  //     }
  
  //     // Show success message
  //     showSnackbar({
  //       message: 'Wallet Updated',
  //       description: 'Your payout wallet has been successfully set.'
  //     });
  
  //     return true;
  //   } catch (error) {
  //     console.error('Failed to set payout wallet:', error);
  //     showSnackbar({
  //       message: 'Update Failed',
  //       description: 'There was an error setting your payout wallet. Please try again.'
  //     });
  //     throw error;
  //   }
  // };

  // Add function to save earning state to localStorage
  const saveEarningState = (userId: number | string, state: LocalEarningState) => {
    try {
      localStorage.setItem(getEarningsStorageKey(userId), JSON.stringify(state));
    } catch (error) {
      console.error('Error saving earning state:', error);
    }
  };


  // Add these states at the top of your component
// const [isClaimingReward, setIsClaimingReward] = useState(false);
const [isDepositing, setIsDepositing] = useState(false);

useEffect(() => {
  if (user) {
    // setHasClaimedReward(localStorage.getItem(`hasClaimedWalletReward_${user.telegram_id}`) === 'true');
  }
}, [user]);

// Function to handle claiming rewards
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
//       description: 'You have received 10,000 TAPPS JETTONS'
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

// // Function to update user balance in the database
// const updateUserBalance = async (userId: string, newBalance: number) => {
//   try {
//     const { error } = await supabase
//       .from('users')
//       .update({ total_sbt: newBalance })
//       .eq('id', userId);
      
//     if (error) {
//       console.error('Error updating user balance:', error);
//       throw error;
//     }
    
//     return true;
//   } catch (error) {
//     console.error('Failed to update user balance:', error);
//     return false;
//   }
// };

  // Add this state near other state declarations
// const [isClaimingEarnings, setIsClaimingEarnings] = useState(false);

// Add these constants near other constants
const getClaimCooldownKey = (userId: number | string) => `claim_cooldown_${userId}`;
// const CLAIM_COOLDOWN_DURATION = 1800; // 30 minutes in seconds

// Update state for cooldown
const [claimCooldown, setClaimCooldown] = useState(0);

// Add effect to handle cooldown timer and persistence
useEffect(() => {
  if (!user) return;
  const CLAIM_COOLDOWN_KEY = getClaimCooldownKey(user.telegram_id);
  // Load saved cooldown on mount
  const loadCooldown = () => {
    try {
      const savedCooldownEnd = localStorage.getItem(CLAIM_COOLDOWN_KEY);
      if (savedCooldownEnd) {
        const endTime = parseInt(savedCooldownEnd, 10);
        const now = Math.floor(Date.now() / 1000);
        const remainingTime = Math.max(0, endTime - now);
        
        // Only set cooldown if there's actual time remaining
        if (remainingTime > 0) {
          setClaimCooldown(remainingTime);
          return true;
        } else {
          // Clean up expired cooldown
          localStorage.removeItem(CLAIM_COOLDOWN_KEY);
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cooldown:', error);
      return false;
    }
  };
  
  // Initial load
  loadCooldown();
  
  // Set up timer only if cooldown is active
  let timer: NodeJS.Timeout | null = null;
  
  if (claimCooldown > 0) {
    // Save end time to localStorage (only on initial set, not every tick)
    if (!localStorage.getItem(CLAIM_COOLDOWN_KEY)) {
      const endTime = Math.floor(Date.now() / 1000) + claimCooldown;
      localStorage.setItem(CLAIM_COOLDOWN_KEY, endTime.toString());
    }
    
    // Update every second
    timer = setInterval(() => {
      setClaimCooldown(prev => {
        const newValue = Math.max(0, prev - 1);
        if (newValue === 0) {
          // Clear from localStorage when done
          localStorage.removeItem(CLAIM_COOLDOWN_KEY);
          // Play a sound or show notification that claiming is available again
          showSnackbar({
            message: 'Claim Available',
            description: 'You can now claim your earnings again!'
          });
        }
        return newValue;
      });
    }, 1000);
  }
  
  // Handle visibility change (tab focus/blur)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Recalculate cooldown when tab becomes visible again
      loadCooldown();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Cleanup
  return () => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [claimCooldown]);

// Helper function to format time as mm:ss or hh:mm:ss for longer durations
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

// Add this handler function
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
//       description: `Added ${earningState.currentEarnings.toFixed(8)} TON + ${novaAmount.toFixed(8)} TAPPS`
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

// Modify this effect to only show notification but not auto-expand
useEffect(() => {
  if (user?.total_withdrawn && user.total_withdrawn >= 1) {
    // We'll just update the UI to show notification, but won't auto-expand
    // The card will remain collapsed until user clicks
  }
}, [user?.total_withdrawn]);

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




// Add this state variable with your other state declarations
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


  // // Add function to load earning state from localStorage
  // const loadEarningState = (): LocalEarningState | null => {
  //   try {
  //     const stored = localStorage.getItem(EARNINGS_STORAGE_KEY);
  //     if (stored) {
  //       const parsed = JSON.parse(stored);
  //       // Validate the loaded state
  //       if (parsed && typeof parsed === 'object' && 
  //           'lastUpdate' in parsed && 'currentEarnings' in parsed && 
  //           'baseEarningRate' in parsed && 'isActive' in parsed) {
  //         return parsed;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error loading earning state:', error);
  //   }
  //   return null;
  // };

  // Update earnings effect
  useEffect(() => {
    if (!user?.id || !user.balance) return;

    // // Save user session
    // saveUserSession(user.id);

    // Load saved earnings from localStorage with user-specific key
    const savedEarnings = localStorage.getItem(getUserEarningsKey(user.telegram_id));
    const initialEarnings = savedEarnings ? JSON.parse(savedEarnings) : {
      currentEarnings: 0,
      lastUpdate: Date.now(),
      baseEarningRate: calculateEarningRate(user.balance, currentROI),
      isActive: user.balance > 0
    };

    setEarningState(initialEarnings);

    const earningsInterval = setInterval(() => {
      setEarningState(prevState => {
        const now = Date.now();
        const secondsElapsed = (now - prevState.lastUpdate) / 1000;
        const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
        const newState = {
          ...prevState,
          lastUpdate: now,
          currentEarnings: newEarnings
        };
        
        // Save to user-specific localStorage key
        localStorage.setItem(getUserEarningsKey(user.telegram_id!), JSON.stringify(newState));
        
        // Stealth sync to database
        syncEarningsToDatabase(user.id!, user.telegram_id!, newEarnings);
        
        return newState;
      });
    }, EARNINGS_UPDATE_INTERVAL);

    return () => {
      clearInterval(earningsInterval);
      // Save final state before unmounting
      const finalState = earningState;
      localStorage.setItem(getUserEarningsKey(user.telegram_id), JSON.stringify(finalState));
      
      // Final sync with server using IIFE
      (async () => {
        try {
          await supabase
            .from('user_earnings')
            .upsert({
              user_id: user.id,
              current_earnings: finalState.currentEarnings,
              last_update: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          console.log('Final earnings sync completed');
        } catch (err) {
          console.error('Error in final earnings sync:', err);
        }
      })();
    };
  }, [user?.id, user?.balance, currentROI]);

  // Add this utility function
  const showSnackbar = ({ message, description = '', duration = SNACKBAR_DURATION }: SnackbarConfig) => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }

    setSnackbarMessage(message);
    setSnackbarDescription(description);
    setSnackbarVisible(true);

    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarVisible(false);
    }, duration);
  };

  // Refresh user after reward claims (updates ArcadeMiningUI props immediately)
  // const handleRewardClaimed = async (amount: number) => {
  //   try {
  //     if (!user?.id) return;
  //     const { data: updatedUser } = await supabase
  //       .from('users')
  //       .select('*')
  //       .eq('id', user.id)
  //       .single();
  //     if (updatedUser) {
  //       updateUserData(updatedUser);
  //       showSnackbar({
  //         message: 'Balance Updated',
  //         description: `+${amount.toLocaleString()} TAPPS added to your airdrop balance.`
  //       });
  //     }
  //   } catch (err) {
  //     console.error('Failed to refresh user after claim:', err);
  //   }
  // };

  // Add this effect to fetch and update the wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!tonConnectUI.account) {
        setWalletBalance('0');
        setIsLoadingBalance(false);
        return;
      }

      try {
        const balance = await tonweb.getBalance(tonConnectUI.account.address);
        const balanceInTON = fromNano(balance);
        setWalletBalance(balanceInTON);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setWalletBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();
    // Update balance every 30 seconds
    const intervalId = setInterval(fetchWalletBalance, 30000);

    return () => clearInterval(intervalId);
  }, [tonConnectUI]);

// Network power calculation (total staked amount)
const calculateNetworkPower = async (): Promise<number> => {
  try {
    const { data } = await supabase
      .from('users')
      .select('balance')
      .gt('balance', 0);
    
    return data?.reduce((total, user) => total + (user.balance || 0), 0) || 1;
  } catch (error) {
    console.error('Error calculating network power:', error);
    return 1; // Fallback to prevent division by zero
  }
};

// Sustainable earning rate calculation matching whitepaper formula
const calculateEarningRate = async (
  balance: number, 
  _baseROI: number, 
  daysStaked: number = 0, 
  referralCount: number = 0
): Promise<number> => {
  // Get multipliers
  const timeMultiplier = getTimeMultiplier(daysStaked);
  const referralBoost = getReferralBoost(referralCount);
  
  // Calculate effective staking power
  const effectiveStakingPower = balance * timeMultiplier * referralBoost;
  
  // Get network power
  const networkPower = await calculateNetworkPower();
  
  // Daily emission cap (sustainable amount)
  const dailyEmission = 1000; // 1000 TAPPS per day total
  
  // Calculate daily reward using whitepaper formula
  const dailyReward = (effectiveStakingPower / networkPower) * dailyEmission;
  
  // Convert to per-second rate
  return dailyReward / 86400;
};

// Legacy function for backward compatibility (simplified)
const calculateEarningRateLegacy = (balance: number, baseROI: number, daysStaked: number = 0) => {
  // Use time-based multipliers to match modal calculation
  const timeMultiplier = getTimeMultiplier(daysStaked);
  const referralBoost = 1.0; // Default for users without referrals (can be enhanced later)
  
  const effectiveStakingPower = balance * timeMultiplier * referralBoost;
  const dailyReward = effectiveStakingPower * baseROI;
  
  return dailyReward / 86400; // Per second rate
};

// Clear old cached earning rates to prevent $43 rewards
const clearOldEarningCache = (userId: number | string) => {
  try {
    // Clear localStorage cache
    localStorage.removeItem(getUserEarningsKey(userId));
    localStorage.removeItem(getUserSyncKey(userId));
    localStorage.removeItem(getOfflineEarningsKey(userId));
    
    console.log('Cleared old earning cache for user:', userId);
  } catch (error) {
    console.error('Error clearing earning cache:', error);
  }
};

// Update handleDeposit to use proper number handling
const handleDeposit = async (amount: number) => {
  try {
    setIsDepositing(true);  // Set loading state
    
    // Validate amount
    if (amount < 1) {
      showSnackbar({ 
        message: 'Invalid Amount', 
        description: 'Minimum deposit amount is 1 TON' 
      });
      setIsDepositing(false);
      return;
    }

    // Enhanced wallet validation
    if (!tonConnectUI.account) {
      showSnackbar({ 
        message: 'Wallet Not Connected', 
        description: 'Please connect your TON wallet first' 
      });
      setIsDepositing(false);
      return;
    }

    // Validate user
    if (!user?.id) {
      showSnackbar({ 
        message: 'User Not Found', 
        description: 'Please try logging in again' 
      });
      setIsDepositing(false);
      return;
    }

    // Validate wallet address
    if (!tonConnectUI.account.address) {
      showSnackbar({ 
        message: 'Invalid Wallet', 
        description: 'Please reconnect your wallet' 
      });
      setIsDepositing(false);
      return;
    }

    // Check wallet balance with proper error handling
    try {
      const walletBalanceNum = Number(walletBalance);
      if (isNaN(walletBalanceNum)) {
        throw new Error('Invalid wallet balance');
      }
      
      if (walletBalanceNum < amount) {
        showSnackbar({
          message: 'Insufficient Balance',
          description: `Your wallet balance is ${walletBalanceNum.toFixed(2)} TON`
        });
        setIsDepositing(false);
        return;
      }
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      showSnackbar({
        message: 'Wallet Error',
        description: 'Unable to verify wallet balance. Please try again.'
      });
      setIsDepositing(false);
      return;
    }

    // Rest of the deposit logic remains the same...
    setDepositStatus('pending');
    const amountInNano = toNano(amount.toString());
    const depositId = await generateUniqueId();
    
    // Determine if this is a new user or a top-up
    const isNewUser = !user.balance || user.balance === 0;
    
    // Store current earnings state before deposit
    const previousEarnings = isNewUser ? 0 : Number(earningState.currentEarnings.toFixed(8));
    const previousState = {
      ...earningState,
      currentEarnings: previousEarnings,
      startDate: isNewUser ? Date.now() : earningState.startDate,
      lastUpdate: Date.now()
    };
    
    // Save current earning state
    saveEarningState(user.telegram_id, previousState);
    
    // Record pending deposit
    const { error: pendingError } = await supabase
      .from('deposits')
      .insert([{
        id: depositId,
        user_id: user.id,
        amount: amount,
        amount_nano: amountInNano.toString(),
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (pendingError) throw pendingError;

    // Create and send transaction
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60 * 20,
      messages: [
        {
          address: DEPOSIT_ADDRESS,
          amount: amountInNano.toString(),
        },
      ],
    };

    const result = await tonConnectUI.sendTransaction(transaction);

    if (result) {
      // Update deposit status
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ 
          status: 'confirmed',
          tx_hash: result.boc
        })
        .eq('id', depositId);

      if (updateError) throw updateError;

      // Update user balance using RPC
      const { error: balanceError } = await supabase.rpc('update_user_deposit', {
        p_user_id: user.id,
        p_amount: amount,
        p_deposit_id: depositId
      });

      if (balanceError) throw balanceError;

      // Clear old earning cache to prevent inflated rewards
      clearOldEarningCache(user.telegram_id);

      // Process referral rewards for staking
      await processReferralStakingRewards(user.id, amount);

      // Fetch updated user data
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedUser) {
        // Update user data in context
        updateUserData(updatedUser);

        // Calculate new base rate with updated balance (new users start at day 0)
        const newBaseEarningRate = calculateEarningRateLegacy(updatedUser.balance, currentROI, 0);
        
        // Set new state with preserved earnings for top-ups
        const newState = {
          ...previousState,
          baseEarningRate: newBaseEarningRate,
          isActive: true,
          currentEarnings: previousEarnings, // Preserve previous earnings for top-ups
          lastUpdate: Date.now()
        };

        setEarningState(newState);
        saveEarningState(user.telegram_id, newState);

        // Update earnings in database
        await supabase
          .from('user_earnings')
          .upsert({
            user_id: user.id,
            current_earnings: previousEarnings,
            last_update: new Date().toISOString(),
            start_date: isNewUser ? new Date().toISOString() : undefined // Only set start_date for new users
          }, {
            onConflict: 'user_id'
          });

        showSnackbar({ 
          message: isNewUser ? 'First Deposit Successful' : 'Top-up Successful', 
          description: isNewUser
            ? `Deposited ${amount.toFixed(2)} TON\nStaking journey begins!`
            : `Deposited ${amount.toFixed(2)} TON\nCurrent earnings preserved: ${previousEarnings.toFixed(8)} TON`
        });
      }

      setDepositStatus('success');
      setShowDepositModal(false);
    }
  } catch (error) {
    console.error('Deposit failed:', error);
    setDepositStatus('error');
    
    // Enhanced error handling
    let errorMessage = 'Please try again later';
    if (error instanceof Error) {
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in wallet';
      }
    }
    
    showSnackbar({ 
      message: 'Deposit Failed', 
      description: errorMessage 
    });
    
    // Restore previous state on error
    if (user) {
      const savedState = localStorage.getItem(getEarningsStorageKey(user.telegram_id));
      if (savedState) {
        setEarningState(JSON.parse(savedState));
      }
    }
  } finally {
    setCustomAmount('');
    setIsDepositing(false);
  }
};


  // // Add this function to format earnings display
  // const formatEarnings = (amount: number): string => {
  //   if (amount >= 1) {
  //     return amount.toFixed(7);
  //   } else {
  //     return amount.toFixed(7);
  //   }
  // };

  // // Update the earnings display in your JSX
  // const renderEarningsSection = () => (
  //   <div className="flex items-center gap-2">
  //     {user?.balance && user.balance > 0 ? (
  //       <>
  //         <div className="flex items-center gap-1.5">
  //           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
  //           <span className="text-xs text-blue-500">
  //             +{formatEarnings(earningState.baseEarningRate)} TON/sec
  //           </span>
  //         </div>
  //         <span className="text-xs text-white/40">
  //           ({(earningState.baseEarningRate * 86400).toFixed(6)} TON/day)
  //         </span>
  //       </>
  //     ) : (
  //       <span className="text-xs text-white/40">
  //         Deposit TON to start earning
  //       </span>
  //     )}
  //   </div>
  // );

  // Add effect to fetch and subscribe to activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user?.id) return;

      setIsLoadingActivities(true);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    // const fetchWithdrawals = async () => {
    //   if (!user?.id) return;

    //   setIsLoadingWithdrawals(true);
    //   try {
    //     const { data, error } = await supabase
    //       .from('withdrawals')
    //       .select('id, amount, status, created_at')
    //       .eq('user_id', user.id)
    //       .order('created_at', { ascending: false })
    //       .limit(5);

    //     if (error) throw error;
    //     setWithdrawals(data || []);
    //   } catch (error) {
    //     console.error('Error fetching withdrawals:', error);
    //   } finally {
    //     setIsLoadingWithdrawals(false);
    //   }
    // };

    // Fetch when activity card is active or when on home (embedded activity list)
    if (activeCard === 'activity' || currentTab === 'home') {
      fetchActivities();
      // fetchWithdrawals();

      // Set up real-time subscription for activities
      const activitiesSubscription = supabase
        .channel('activities-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities',
          filter: `user_id=eq.${user?.id}`
          },
          (payload) => {
            // Handle different types of changes
            if (payload.eventType === 'INSERT') {
              setActivities(prev => [payload.new as Activity, ...prev].slice(0, 10));
            } else if (payload.eventType === 'UPDATE') {
              setActivities(prev => 
                prev.map(activity => 
                  activity.id === payload.new.id ? payload.new as Activity : activity
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setActivities(prev => 
                prev.filter(activity => activity.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for withdrawals
      // const withdrawalsSubscription = supabase
      //   .channel('withdrawals-channel')
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: '*',
      //       schema: 'public',
      //       table: 'withdrawals',
      //       filter: `user_id=eq.${user?.id}`
      //     },
      //     (payload) => {
      //       // Handle different types of changes
      //       if (payload.eventType === 'INSERT') {
      //         setWithdrawals(prev => [payload.new as any, ...prev].slice(0, 5));
      //       } else if (payload.eventType === 'UPDATE') {
      //         setWithdrawals(prev => 
      //           prev.map(withdrawal => 
      //             withdrawal.id === payload.new.id ? payload.new as any : withdrawal
      //           )
      //         );
      //       } else if (payload.eventType === 'DELETE') {
      //         setWithdrawals(prev => 
      //           prev.filter(withdrawal => withdrawal.id !== payload.old.id)
      //         );
      //       }
      //     }
      //   )
      //   .subscribe();

        // Cleanup subscriptions
        return () => {
          supabase.removeChannel(activitiesSubscription);
          // supabase.removeChannel(withdrawalsSubscription);
        };
      }
    }, [user?.id, activeCard, currentTab]);

  // // Helper function to format date
  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return new Intl.DateTimeFormat('en-US', {
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   }).format(date);
  // };

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

  // // Activity card content
  // const getActivityIcon = (type: Activity['type']) => {
  //   switch (type) {
  //     case 'deposit':
  //       return <FaCoins className="w-4 h-4 text-blue-400" />;
  //     case 'withdrawal':
  //       return <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  //       </svg>;
  //     case 'stake':
  //       return <BiNetworkChart className="w-4 h-4 text-purple-400" />;
  //     case 'redeposit':
  //       return <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  //       </svg>;
  //     case 'nova_reward':
  //       return <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  //       </svg>;
  //     case 'nova_income':
  //       return <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  //       </svg>;
  //     case 'offline_reward':
  //       return <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  //       </svg>;
  //     case 'earnings_update':
  //       return <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  //       </svg>;
  //     case 'claim':
  //       return <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  //       </svg>;
  //     case 'transfer':
  //       return <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  //       </svg>;
  //     case 'reward':
  //       return <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  //       </svg>;
  //     case 'bonus':
  //       return <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  //       </svg>;
  //     default:
  //       return null;
  //   }
  // };

  // Add useEffect to fetch price
  useEffect(() => {
    const fetchTonPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        setTonPrice(data['the-open-network'].usd);
        setTonPriceChange(data['the-open-network'].usd_24h_change);
      } catch (error) {
        console.error('Error fetching TON price:', error);
      }
    };
    
    fetchTonPrice();
    const interval = setInterval(fetchTonPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && !isLoading && hasSponsor) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.telegram_id}`);
      const isNewUser = user.total_deposit === 0;

      if (!hasSeenOnboarding || isNewUser) {
        setShowOnboarding(true);
        const timer = setTimeout(() => {
          setShowOnboarding(false);
          localStorage.setItem(`onboarding_${user.telegram_id}`, 'true');
        }, 14000); // 2s loading + (4 steps × 3s)
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading, hasSponsor]);

  // Add this effect to handle offline earnings
  useEffect(() => {
    if (!user) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App became visible, calculate offline earnings
        const offlineState = loadOfflineEarnings(user.telegram_id);
        if (offlineState && earningState.isActive) {
          const now = Date.now();
          const secondsElapsed = (now - offlineState.lastActiveTimestamp) / 1000;
          const offlineEarnings = offlineState.baseEarningRate * secondsElapsed;

          if (offlineEarnings > 0) {
            setEarningState(prev => ({
              ...prev,
              currentEarnings: prev.currentEarnings + offlineEarnings,
              lastUpdate: now
            }));

            showSnackbar({
              message: 'Offline Earnings Added',
              description: `You earned ${offlineEarnings.toFixed(8)} TON while offline`
            });
          }
        }
      } else {
        // App is going to background, save current state
        if (earningState.isActive) {
          saveOfflineEarnings(user.telegram_id, {
            lastActiveTimestamp: Date.now(),
            baseEarningRate: earningState.baseEarningRate
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [earningState, user]);

  // Update the earning effect to include offline earnings
  useEffect(() => {
    if (!user?.id || !user.balance) return;

    const initializeEarningState = async () => {
      try {
        // Fetch current earnings from server
        const { data: serverData } = await supabase
          .from('user_earnings')
          .select('current_earnings, last_update, start_date')
          .eq('user_id', user.id)
          .single();

        const now = Date.now();
        const daysStaked = serverData ? Math.floor((now - new Date(serverData.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const newRate = calculateEarningRateLegacy(user.balance, currentROI, daysStaked);
        
        // Load saved earnings from localStorage
        const savedEarnings = localStorage.getItem(getEarningsStorageKey(user.telegram_id));
        const localEarnings = savedEarnings ? JSON.parse(savedEarnings).currentEarnings : 0;
        
        if (serverData) {
          const startDate = new Date(serverData.start_date).getTime();
          const lastUpdateTime = new Date(serverData.last_update).getTime();
          const secondsElapsed = (now - lastUpdateTime) / 1000;
          
          // Use the higher value between server and local storage to prevent resets
          const baseEarnings = Math.max(serverData.current_earnings, localEarnings);
          const accumulatedEarnings = (newRate * secondsElapsed) + baseEarnings;

          const newState = {
            lastUpdate: now,
            currentEarnings: accumulatedEarnings,
            baseEarningRate: newRate,
            isActive: user.balance > 0,
            startDate: startDate
          };
          
          setEarningState(newState);
          saveEarningState(user.telegram_id, newState);
          
          // Sync with server to ensure consistency
          await supabase
            .from('user_earnings')
            .upsert({
              user_id: user.id,
              current_earnings: accumulatedEarnings,
              last_update: new Date(now).toISOString(),
              start_date: new Date(startDate).toISOString()
            }, {
              onConflict: 'user_id'
            });

        } else {
          // Initialize new earning state, preserving any existing earnings
          const newState = {
            lastUpdate: now,
            currentEarnings: localEarnings, // Use any existing local earnings
            baseEarningRate: newRate,
            isActive: user.balance > 0,
            startDate: now
          };

          // Create initial server record with preserved earnings
          await supabase
            .from('user_earnings')
            .insert({
              user_id: user.id,
              current_earnings: localEarnings, // Preserve existing earnings
              last_update: new Date(now).toISOString(),
              start_date: new Date(now).toISOString()
            });

          setEarningState(newState);
          saveEarningState(user.telegram_id, newState);
        }

        // Set up periodic sync
        const syncInterval = setInterval(async () => {
          const currentState = JSON.parse(localStorage.getItem(getUserEarningsKey(user.telegram_id)) || '{}');
          if (currentState.currentEarnings) {
            await supabase
              .from('user_earnings')
              .upsert({
                user_id: user.id,
                current_earnings: currentState.currentEarnings,
                last_update: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });
          }
        }, EARNINGS_SYNC_INTERVAL);

        return () => clearInterval(syncInterval);

      } catch (error) {
        console.error('Error initializing earning state:', error);
      }
    };

    initializeEarningState();

    // Set up earnings calculation interval
    const earningsInterval = setInterval(() => {
      setEarningState(prevState => {
        const now = Date.now();
        const secondsElapsed = (now - prevState.lastUpdate) / 1000;
        const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
        const newState = {
          ...prevState,
          lastUpdate: now,
          currentEarnings: newEarnings
        };
        
        // Save to localStorage with user-specific key
        localStorage.setItem(getUserEarningsKey(user.telegram_id!), JSON.stringify(newState));
        
        return newState;
      });
    }, EARNINGS_UPDATE_INTERVAL);

    return () => {
      clearInterval(earningsInterval);
      // Save final state before unmounting
      const finalState = earningState;
      localStorage.setItem(getUserEarningsKey(user.telegram_id), JSON.stringify(finalState));
      
      // Final sync with server using IIFE
      (async () => {
        try {
          await supabase
            .from('user_earnings')
            .upsert({
              user_id: user.id,
              current_earnings: finalState.currentEarnings,
              last_update: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          console.log('Final earnings sync completed');
        } catch (err) {
          console.error('Error in final earnings sync:', err);
        }
      })();
    };
  }, [user?.id, user?.balance, currentROI]);

  // Add this state
  // const [showOfflineRewardsModal, setShowOfflineRewardsModal] = useState(false);
  // const [offlineRewardsAmount, setOfflineRewardsAmount] = useState(0);

  // Update these constants to be more precise
  // const OFFLINE_EARNINGS_KEY = 'offline_earnings_state';
  // const MINIMUM_OFFLINE_TIME = 5 * 60 * 1000; // 5 minutes minimum for offline rewards

  // Add this helper function to calculate offline earnings
  // const calculateOfflineEarnings = (
  //   lastActiveTime: number,
  //   baseRate: number,
  //   currentTime: number = Date.now()
  // ): number => {
  //   const timeDiff = currentTime - lastActiveTime;
  //   if (timeDiff < MINIMUM_OFFLINE_TIME) return 0;
    
  //   // Ensure we're using sustainable rates (max 1% daily)
  //   const maxSustainableRate = 0.01 / 86400; // 1% daily converted to per-second
  //   const actualRate = Math.min(baseRate, maxSustainableRate);
    
  //   return (actualRate * timeDiff) / 1000; // Convert to seconds
  // };

  // Update the offline earnings effect
  // useEffect(() => {
  //   if (!user?.id || !user.balance || !earningState.isActive) return;

  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible') {
  //       // Load offline state
  //       const offlineState = loadOfflineEarnings();
  //       if (offlineState) {
  //         const offlineEarnings = calculateOfflineEarnings(
  //           offlineState.lastActiveTimestamp,
  //           offlineState.baseEarningRate
  //         );

  //         if (offlineEarnings > 0) {
  //           console.log('Offline earnings calculated:', offlineEarnings);
  //           setOfflineRewardsAmount(offlineEarnings);
  //           setShowOfflineRewardsModal(true);
  //         }
  //         // Clear offline state after processing
  //         localStorage.removeItem(OFFLINE_EARNINGS_KEY);
  //       }
  //     } else {
  //       // Save current state when going offline
  //       saveOfflineEarnings({
  //         lastActiveTimestamp: Date.now(),
  //         baseEarningRate: earningState.baseEarningRate
  //       });
  //     }
  //   };

  //   // Also check for offline earnings on component mount
  //   const offlineState = loadOfflineEarnings();
  //   if (offlineState) {
  //     const offlineEarnings = calculateOfflineEarnings(
  //       offlineState.lastActiveTimestamp,
  //       offlineState.baseEarningRate
  //     );

  //     if (offlineEarnings > 0) {
  //       console.log('Initial offline earnings found:', offlineEarnings);
  //       setOfflineRewardsAmount(offlineEarnings);
  //       setShowOfflineRewardsModal(true);
  //       localStorage.removeItem(OFFLINE_EARNINGS_KEY);
  //     }
  //   }

  //   // Add visibility change listener
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
    
  //   // Save initial state
  //   saveOfflineEarnings({
  //     lastActiveTimestamp: Date.now(),
  //     baseEarningRate: earningState.baseEarningRate
  //   });

  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //   };
  // }, [user?.id, user?.balance, earningState.isActive, earningState.baseEarningRate]);

  // Update handleClaimOfflineRewards
  // const handleClaimOfflineRewards = async () => {
  //   if (!user?.id) return;

  //   try {
  //     const savedEarnings = localStorage.getItem(getUserEarningsKey(user.id));
  //     const currentEarnings = savedEarnings 
  //       ? JSON.parse(savedEarnings).currentEarnings 
  //       : 0;

  //     const newEarnings = currentEarnings + offlineRewardsAmount;
  //     const newNovaBalance = (user.total_sbt || 0) + (offlineRewardsAmount * 0.1);

  //     // Update local storage first with user-specific key
  //     const newEarningState = {
  //       ...earningState,
  //       currentEarnings: newEarnings,
  //       lastUpdate: Date.now()
  //     };
  //     localStorage.setItem(getUserEarningsKey(user.id), JSON.stringify(newEarningState));
  //     setEarningState(newEarningState);

  //     // Silent database updates
  //     await Promise.all([
  //       supabase
  //         .from('users')
  //         .update({ 
  //           total_sbt: newNovaBalance,
  //           total_earned: newEarnings
  //         })
  //         .eq('id', user.id),
        
  //       supabase
  //         .from('user_earnings')
  //         .upsert({
  //           user_id: user.id,
  //           current_earnings: newEarnings,
  //           last_update: new Date().toISOString()
  //         }, {
  //           onConflict: 'user_id'
  //         }),

  //       supabase
  //         .from('activities')
  //         .insert({
  //           user_id: user.id,
  //           type: 'nova_income',
  //           amount: offlineRewardsAmount,
  //           status: 'completed',
  //           created_at: new Date().toISOString()
  //         })
  //     ]);

  //     showSnackbar({
  //       message: 'Rewards Claimed',
  //       description: `Added ${offlineRewardsAmount.toFixed(8)} TON + ${(offlineRewardsAmount * 0.1).toFixed(8)} TAPPS`
  //     });

  //     setShowOfflineRewardsModal(false);
  //     setOfflineRewardsAmount(0);
  //   } catch (error) {
  //     console.error('Error claiming rewards:', error);
  //     showSnackbar({
  //       message: 'Claim Failed',
  //       description: 'Please try again later'
  //     });
  //   }
  // };

  // Add this state for live progress
  const [, setStakingProgress] = useState(0);

  // Add this effect for live progress updates
  useEffect(() => {
    if (user?.last_deposit_date) {
      setStakingProgress(calculateStakingProgress(user.last_deposit_date));
    }
  }, [user?.last_deposit_date]);

  // Add this helper function to calculate potential earnings
  // const calculatePotentialEarnings = (balance: number): number => {
  //   let totalEarnings = 0;
  //   let currentROI = 0.01; // Starting at 1%
    
  //   // Calculate for 100 days with ROI increasing every 5 days
  //   for (let day = 1; day <= 100; day++) {
  //     // Increase ROI by 0.5% every 5 days
  //     if (day % 5 === 0) {
  //       currentROI += 0.005; // Add 0.5%
  //     }
      
  //     // Add daily earnings
  //     totalEarnings += balance * currentROI;
  //   }
    
  //   return totalEarnings;
  // };

  // Add state
  // const [showWithdrawalInfo, setShowWithdrawalInfo] = useState(false);


  // Add new state variables at the top with other state declarations
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNewUser] = useState(false);
  const hasInitializedRef = useRef(false);

  // Professional loading sequence
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (isLoading) return;

    // Simple loading sequence
    const loadingSequence = [
      { status: 'Initializing system...', progress: 25 },
      { status: 'Connecting to blockchain...', progress: 50 },
      { status: 'Loading user data...', progress: 75 },
      { status: 'Ready to mine!', progress: 100 }
    ];

    let currentStep = 0;
    const loadingInterval = setInterval(() => {
      if (currentStep < loadingSequence.length) {
        setMiningStatus(loadingSequence[currentStep].status);
        setMiningProgress(loadingSequence[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(loadingInterval);
        setIsInitializing(false);
        hasInitializedRef.current = true;
      }
    }, 600);

    return () => clearInterval(loadingInterval);
  }, [isLoading]);

  // // Add this near the top of your component
  // const [countdown, setCountdown] = useState('');

  // useEffect(() => {
  //   const endDate = new Date('2025-04-10');
    
  //   const updateCountdown = () => {
  //     const now = new Date();
  //     const diff = endDate.getTime() - now.getTime();
      
  //     if (diff <= 0) {
  //       setCountdown('Offer ended');
  //       return;
  //     }

  //     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  //     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  //     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
  //     setCountdown(`${days}d ${hours}h ${minutes}m`);
  //   };

  //   updateCountdown();
  //   const timer = setInterval(updateCountdown, 60000);
  //   return () => clearInterval(timer);
  // }, []);

  // Update the earnings initialization effect
  useEffect(() => {
    if (!user?.id || !user.balance) {
      setIsInitializing(false);
      return;
    }

    const initializeEarningState = async () => {
      try {
        if (!hasInitializedRef.current) {
          setIsInitializing(true);
        }

        // Check if user exists in user_earnings
        const { data: serverData } = await supabase
          .from('user_earnings')
          .select('current_earnings, last_update, start_date')
          .eq('user_id', user.id)
          .single();

        const now = Date.now();
        const daysStaked = serverData ? Math.floor((now - new Date(serverData.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const newRate = calculateEarningRateLegacy(user.balance, currentROI, daysStaked);
        
        if (serverData) {
          // Existing user logic - preserve earnings on top-up
          const startDate = new Date(serverData.start_date).getTime();
          const lastUpdateTime = new Date(serverData.last_update).getTime();
          const secondsElapsed = (now - lastUpdateTime) / 1000;
          
          // Preserve existing earnings and add new accumulated earnings
          const baseEarnings = serverData.current_earnings || 0;
          const accumulatedEarnings = (newRate * secondsElapsed) + baseEarnings;

          // Update earnings state with preserved earnings
          setEarningState({
            lastUpdate: now,
            currentEarnings: accumulatedEarnings,
            baseEarningRate: newRate,
            isActive: user.balance > 0,
            startDate: startDate // Keep original start date
          });

          // Update database with new earnings
          await supabase
            .from('user_earnings')
            .update({
              current_earnings: accumulatedEarnings,
              last_update: new Date(now).toISOString()
              // Don't update start_date to preserve original staking start
            })
            .eq('user_id', user.id);

        } else {
          // New user logic - start with 0 earnings
          const newState = {
            lastUpdate: now,
            currentEarnings: 0,
            baseEarningRate: newRate,
            isActive: user.balance > 0,
            startDate: now
          };

          // Initialize new user in database
          await supabase
            .from('user_earnings')
            .insert({
              user_id: user.id,
              current_earnings: 0,
              last_update: new Date(now).toISOString(),
              start_date: new Date(now).toISOString()
            });

          setEarningState(newState);
        }
      } catch (error) {
        console.error('Error initializing earning state:', error);
      } finally {
        setIsInitializing(false);
        hasInitializedRef.current = true;
      }
    };

    initializeEarningState();
    
    // Set up earnings calculation interval
    const earningsInterval = setInterval(() => {
      setEarningState(prevState => {
        const now = Date.now();
        const secondsElapsed = (now - prevState.lastUpdate) / 1000;
        
        // Calculate days staked for time multiplier
        const daysStaked = prevState.startDate ? Math.floor((now - prevState.startDate) / (1000 * 60 * 60 * 24)) : 0;
        
        // Calculate new earnings based on current rate and elapsed time
        const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
        const newState = {
          ...prevState,
          lastUpdate: now,
          currentEarnings: newEarnings,
          baseEarningRate: calculateEarningRateLegacy(user.balance, currentROI, daysStaked) // Update rate based on new balance and time
        };
        
        // Save to localStorage
        localStorage.setItem(getUserEarningsKey(user.telegram_id), JSON.stringify(newState));
        
        return newState;
      });
    }, EARNINGS_UPDATE_INTERVAL);

    return () => clearInterval(earningsInterval);
  }, [user?.id, user?.balance, currentROI]);

  // Add state for managing withdrawal modal and loading state
  // const [isRestaking, setIsRestaking] = useState(false);

  // Update handleRestake function
  // const handleRestake = async () => {
  //   if (isRestaking) return; // Prevent double clicks
    
  //   try {
  //     setIsRestaking(true);
  //     const totalAmount = (user?.balance || 0) + earningState.currentEarnings;
      
  //     // Show loading snackbar
  //     showSnackbar({
  //       message: 'Processing Restake',
  //       description: 'Please wait while we process your request...'
  //     });

  //     const { error } = await supabase.rpc('update_user_restake', {
  //       p_user_id: user?.id,
  //       p_amount: totalAmount,
  //       p_deposit_date: new Date().toISOString()
  //     });

  //     if (error) throw error;

  //     // Reset earnings state
  //     setEarningState({
  //       lastUpdate: Date.now(),
  //       currentEarnings: 0,
  //       baseEarningRate: calculateEarningRateLegacy(totalAmount, currentROI, 0), // Restake starts at day 0
  //       isActive: true,
  //       startDate: Date.now()
  //     });

  //     // Update user data
  //     if (user) {
  //       updateUserData({
  //         ...user,
  //         balance: totalAmount,
  //         last_deposit_date: new Date().toISOString()
  //       });
  //     }

  //     // Show success message with more details
  //     showSnackbar({
  //       message: 'Restake Successful! 🎉',
  //       description: `Successfully restaked ${totalAmount.toFixed(2)} TON. Your new earnings rate has been updated.`
  //     });

  //     // Add activity record
  //     await supabase.from('activities').insert({
  //       user_id: user?.id,
  //       type: 'redeposit',
  //       amount: totalAmount,
  //       status: 'completed',
  //       created_at: new Date().toISOString()
  //     });

  //   } catch (error) {
  //     console.error('Restake failed:', error);
  //     showSnackbar({
  //       message: 'Restake Failed',
  //       description: 'There was an error processing your restake. Please try again later.'
  //     });
  //   } finally {
  //     setIsRestaking(false);
  //     setShowWithdrawalInfo(false);
  //   }
  // };

  useEffect(() => {
    if (user && !isLoading) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.telegram_id}`);
      const isNewUser = user.total_deposit === 0;

      if (!hasSeenOnboarding || isNewUser) {
        setShowOnboarding(true);
        const timer = setTimeout(() => {
          setShowOnboarding(false);
          localStorage.setItem(`onboarding_${user.telegram_id}`, 'true');
        }, 14000); // 2s loading + (4 steps × 3s)
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading]);

  const handleRewardClaimed = async (amount: number) => {
    try {
      if (!user?.id) return;
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (updatedUser) {
        updateUserData(updatedUser);
        showSnackbar({
          message: 'Balance Updated',
          description: `+${amount.toLocaleString()} TAPPS added to your airdrop balance.`
        });
      }
    } catch (err) {
      console.error('Failed to refresh user after claim:', err);
    }
  };


  // Add state for task completion
  // const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Add useEffect to check wallet connection status
  // useEffect(() => {
  //   if (tonConnectUI.connected && !completedTasks.includes('wallet')) {
  //     // Add wallet task to completed tasks
  //     setCompletedTasks(prev => [...prev, 'wallet']);
      
  //     // Show success message
  //     showSnackbar({
  //       message: 'Task Completed!',
  //       description: 'Wallet connection verified. +10,000 TAPPS JETTONS'
  //     });

  //     // Update task in database if needed
  //     if (user?.id) {
  //       supabase.from('user_tasks')
  //         .upsert({
  //           user_id: user.id,
  //           task_type: 'wallet_connection',
  //           completed_at: new Date().toISOString(),
  //           reward_amount: 10000
  //         })
  //         .then(result => {
  //           if (result.error) {
  //             console.error('Error recording task:', result.error);
  //           } else {
  //             console.log('Wallet task recorded');
  //           }
  //         });
  //     }
  //   }
  // }, [tonConnectUI.connected, user?.id]);

  // Add this useEffect to check staking completion
  useEffect(() => {
    // Check if user has staked enough and hasn't already claimed
    if (user?.balance && user.balance >= 1 && !isStakingCompleted) {
      // Mark as completed
      localStorage.setItem('hasCompletedStaking', 'true');
      setIsStakingCompleted(true);
      
      // Update user with NOVA tokens
      if (user) {
        const updatedUser = {
          ...user,
          total_sbt: (user.total_sbt || 0) + 10000
        };
        updateUserData(updatedUser);
      }
      
      // Add to activity log
      const newActivity: Activity = {
        id: Date.now().toString(),
        user_id: String(user?.id || ''),
        type: 'nova_reward',
        amount: 10000,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      
      setActivities(prev => [newActivity, ...prev]);
      
      // Show success message
      showSnackbar({
        message: 'Staking Task Completed!',
        description: 'You have received 10,000 TAPPS.'
      });
    }
  }, [user?.balance, isStakingCompleted, user]);

  // Update the main return statement to handle loading, new user, and no stake states
  if (isLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-green-900">
        <div className="text-center max-w-md mx-auto px-6">
          {/* RhizaCore Logo/Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-green-700 flex items-center justify-center border-4 border-green-300 shadow-2xl">
              <span className="text-3xl font-bold text-white">R</span>
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-green-300">RhizaCore Mine</h1>
              <p className="text-sm text-green-400">Decentralized Yield Protocol</p>
            </div>
          </div>
          {/* Simple Progress Bar */}
          <div className="mb-6">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 ease-out"
                style={{ width: `${miningProgress}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {miningProgress}% Complete
            </div>
          </div>
          {/* Status Message */}
          <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-green-400">System Status</span>
            </div>
            <p className="text-green-300 font-medium">{miningStatus}</p>
          </div>
          {/* Simple Loading Animation */}
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce" 
                  style={{ animationDelay: `${i * 0.2}s` }} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
        {/* Error message component */}
      </div>
    );
  }

  // Show onboarding for new users
  if (isNewUser && user) {
    return (
      <OnboardingScreen />
    );
  }

  // Show sponsor gate if user doesn't have a sponsor
  if (showSponsorGate && (hasSponsor === false || hasSponsor === null) && user) {
    return (
      <SponsorGate onApplyCode={handleApplySponsorCode} isLoading={isApplying} />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-green-400 font-mono antialiased mb-[3.7rem]">
      <div className="absolute inset-0 bg-grid-green-500/10 bg-grid-18 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0 scanline"></div>
      {!isLoading && user && showOnboarding && <OnboardingScreen />}
      {/* Header */}
      <div className="px-6 py-4 border-b border-green-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="User" className="w-10 h-10 rounded-full border-2 border-green-600/70" />
            ) : (
              <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center border-2 border-green-600/70 shadow-neon-green-sm">
                <span className="text-green-400 font-bold">{user?.username?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg text-shadow-green">{user?.username}</h3>
              <p className="text-green-500/80 text-sm">RZC Miner</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="sm:flex items-center gap-3 px-3 py-2 bg-green-900/50 rounded-xl border-2 border-green-700/50">
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as any)}
                className="bg-transparent text-green-300 text-sm font-medium border-none outline-none cursor-pointer"
              >
                <option value="en">🇺🇸 EN</option>
                <option value="es">🇪🇸 ES</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="de">🇩🇪 DE</option>
                <option value="pt">🇵🇹 PT</option>
                <option value="ru">🇷🇺 RU</option>
                <option value="tr">🇹🇷 TR</option>
                <option value="ar">🇸🇦 AR</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra Modern Main Content Area */}
      <div className="flex-1 relative">
        
        {/* Keep ArcadeMiningUI mounted; hide when not on Mining tab */}
        <div className={`relative space-y-6 p-custom px-6 pb-6 overflow-y-auto ${currentTab === 'home' ? '' : 'hidden'}`}>
          <ArcadeMiningUI
            balanceTon={user?.balance || 0}
            tonPrice={tonPrice || 0}
            currentEarningsTon={earningState?.currentEarnings || 0}
            isClaiming={false}
            claimCooldown={0}
            cooldownText={''}
            onClaim={() => {}}
            onOpenDeposit={() => setShowDepositModal(true)}
            potentialEarningsTon={0}
            airdropBalanceNova={0}
            totalWithdrawnTon={user?.total_withdrawn || 0}
            activities={activities}
            withdrawals={[]}
            isLoadingActivities={isLoadingActivities}
            userId={user?.id}
            userUsername={user?.username}
            referralCode={userReferralCode}
            estimatedDailyTapps={0}
            showSnackbar={showSnackbar}
          />
        </div>

        {currentTab === 'network' && (
          <div className="relative flex-1 p-6 p-custom sm:p-8 overflow-y-auto">
            <DappExplorer/>
          </div>
        )}

        {currentTab === 'whale' && (
          <div className="relative flex-1 p-6 p-custom sm:p-8 overflow-y-auto">
            <SettingsComponent/>
            </div>
        )}

        {currentTab === 'task' && (
          <div className="relative flex-1 p-6 p-custom sm:p-8 overflow-y-auto">
              <SocialTasks 
                showSnackbar={showSnackbar}
                userId={user?.id}
                onRewardClaimed={handleRewardClaimed}
              />
            </div>
        )}

        {currentTab === 'wallet' && (
          <div className="relative flex-1 p-6 p-custom sm:p-8 overflow-y-auto">
            <TonWallet/>
            </div>
        )}

        {currentTab === 'activity' && (
          <div className="relative flex-1 p-6 sm:p-8 overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-slate-100/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-50/30 to-transparent" />
            <div className="relative max-w-lg mx-auto space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-12 h-12 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded-2xl rotate-45 animate-pulse shadow-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 rounded-2xl shadow-lg border-2 border-white/50 backdrop-blur-sm">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</span>
                  </div>
                </div>
              </div>

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-blue-600 opacity-20"></div>
                  </div>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="group flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center border-2 border-blue-200/50 shadow-lg">
                          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold text-slate-800 capitalize">{activity.type.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-slate-500">{new Date(activity.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-800">{activity.amount?.toFixed ? activity.amount.toFixed(6) : activity.amount} {activity.type === 'nova_reward' ? 'NOVA' : 'TON'}</div>
                        <div className="text-sm text-slate-500 capitalize">{activity.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-slate-600 mb-2">No Recent Activity</p>
                  <p className="text-sm text-slate-500">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

                    </div>

      {/* Ultra Modern NFT Minter Modal */}
      {showNFTMinterModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
    <div className="bg-gradient-to-b from-white via-slate-50 to-white rounded-3xl w-full max-w-md border-2 border-white/60 shadow-2xl shadow-purple-500/20 overflow-hidden">
      {/* Modal header gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5"></div>
      <div className="relative p-6">
        {/* Ultra Modern Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/20 rounded-2xl rotate-45 animate-pulse shadow-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                      </div>
                      </div>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-2xl shadow-lg border-2 border-white/50 backdrop-blur-sm">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                NovaClub NFT Pass
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowNFTMinterModal(false);
              // Reset status if not successful
              if (nftMintStatus !== 'success') {
                setNftMintStatus('idle');
              }
            }}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg border-2 border-white/50"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
                    </div>
                    
        {/* NFT Minter Component */}
        <NFTMinter 
          onStatusChange={(status, hasMinted) => {
            // Update local status state
            setNftMintStatus(status);
            
            // If already minted, update state
            if (hasMinted && !hasNFTPass) {
              setHasNFTPass(true);
              localStorage.setItem('hasClaimedNFTPass', 'true');
            }
          }}
          onMintSuccess={handleNFTMintSuccess}
        />
      </div>
    </div>
  </div>
)}
             

       {/* Ultra Modern Deposit Modal */}
       {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
          <div className="bg-white w-full h-full max-w-none max-h-none shadow-2xl overflow-y-auto">
            {/* Modal background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20"></div>
            <div className="relative p-8 max-w-2xl mx-auto">
              {/* Ultra Modern Header */}
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {user?.balance && user.balance > 0 ? 'Add New Staking' : 'Deposit TON'}
                  </h2>
                    <p className="text-base text-gray-600 mt-2">
                    Stake TON to start earning TAPPS rewards
                  </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositStatus('idle');
                    setCustomAmount('');
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg border-2 border-white/50"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {depositStatus === 'pending' ? (
                <div className="text-center py-16">
                  <div className="relative mx-auto mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-600 opacity-20"></div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-2">Processing Deposit...</p>
                  <p className="text-base text-gray-600">Please wait while we confirm your transaction</p>
                </div>
              ) : (
                <>
                  {/* Ultra Modern Amount Display */}
                  <div className="mb-10 text-center">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-white/60 shadow-xl">
                      <div className="flex items-baseline justify-center gap-3 mb-4">
                        <span className="text-7xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {customAmount || '0'}
                        </span>
                        <span className="text-4xl font-semibold text-gray-600">TON</span>
                      </div>
                      <div className="bg-white/80 rounded-2xl p-4 border border-white/60 shadow-lg">
                        <p className="text-xl font-bold text-gray-800 mb-1">
                          ≈ {customAmount && parseFloat(customAmount) >= 1 
                            ? calculateTotalEarnings(parseFloat(customAmount)).toFixed(1) 
                            : '0'} TAPPS
                        </p>
                        <p className="text-sm text-gray-600">
                          Potential earnings over 135 days
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ultra Modern Quick Select Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 5, 10, 50, 100, 500].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setCustomAmount(amount.toString());
                        }}
                        className={`px-4 py-4 border-2 rounded-2xl transition-all duration-300 text-center group hover:scale-105 shadow-lg
                          ${customAmount === amount.toString() 
                            ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 text-blue-700 shadow-blue-200/50' 
                            : 'bg-white/80 hover:bg-white border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 shadow-gray-200/50'
                          }`}
                      >
                        <div className="space-y-2">
                          <div className="text-base font-bold">
                            {amount} TON
                          </div>
                          <div className={`text-sm font-semibold ${
                            customAmount === amount.toString() 
                              ? 'text-blue-700' 
                              : 'text-gray-600 group-hover:text-gray-700'
                          }`}>
                            ~{calculateTotalEarnings(amount).toFixed(1)} TAPPS
                          </div>
                          <div className={`text-xs font-medium ${
                            customAmount === amount.toString() 
                              ? 'text-blue-600' 
                              : 'text-gray-500 group-hover:text-gray-600'
                          }`}>
                            {((calculateTotalEarnings(amount) / amount) * 100).toFixed(0)}% ROI
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Ultra Modern Custom Amount Input */}
                  <div className="space-y-4 mb-8">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Enter custom amount"
                        min="0.1"
                        step="0.1"
                        value={customAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                            setCustomAmount(value);
                          }
                        }}
                        className="w-full px-6 py-4 bg-white/80 border-2 border-gray-200 rounded-2xl
                          text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500
                          focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 shadow-lg
                          text-lg font-semibold"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-base font-bold">
                        TON
                      </div>
                    </div>
                  </div>

                  {/* Ultra Modern Minimum Staking Info */}
                  <div className="flex justify-between items-center mb-8 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-2 border-white/60 shadow-lg">
                    <span className="text-base font-semibold text-gray-700">Minimum staking</span>
                    <span className="text-lg font-bold text-gray-900 bg-white/80 px-3 py-1 rounded-xl border border-white/60">1 TON</span>
                  </div>

                  {/* Ultra Modern Rewards Section */}
                  {customAmount && parseFloat(customAmount) >= 1 && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 mb-8 border-2 border-white/60 shadow-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-lg font-bold">B</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Potential Earnings</p>
                          <p className="text-xs text-gray-500">135 days</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {calculateTotalEarnings(parseFloat(customAmount)).toFixed(2)} TAPPS
                          </p>
                          <p className="text-xs text-green-600">
                            {((calculateTotalEarnings(parseFloat(customAmount)) / parseFloat(customAmount)) * 100).toFixed(1)}% ROI
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Daily (Day 1-7)</span>
                          <span className="text-green-600 font-medium">
                            +{(parseFloat(customAmount) * 0.0306).toFixed(4)} TAPPs
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Daily (Day 8-30)</span>
                          <span className="text-yellow-600 font-medium">
                            +{(parseFloat(customAmount) * 0.0306 * 1.1).toFixed(4)} TAPPs
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Daily (Day 31+)</span>
                          <span className="text-blue-600 font-medium">
                            +{(parseFloat(customAmount) * 0.0306 * 1.25).toFixed(4)} TAPPs
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-3">
                        Rewards are accrued in TAPPS tokens. Amounts are approximate and subject to change.
                      </p>
                    </div>
                  )}

                  {/* Deposit Button */}
                  <button
                    onClick={() => {
                      const amount = parseFloat(customAmount);
                      if (!isNaN(amount) && amount >= 1) {
                        handleDeposit(amount);
                      } else {
                        showSnackbar({
                          message: 'Invalid Amount',
                          description: 'Please enter a valid amount (minimum 1 TON).'
                        });
                      }
                    }}
                    disabled={!customAmount || parseFloat(customAmount) < 1}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-200
                      ${!customAmount || parseFloat(customAmount) < 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                      }`}
                  >
                    {isDepositing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Add Staking'
                    )}
                  </button>

                  {/* Info Footer */}
                  <p className="mt-4 text-center text-xs text-gray-500">
                    The deposit will be credited automatically, once the transaction is confirmed
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Withdrawal Info Modal
      <WithdrawalInfoModal
        isOpen={showWithdrawalInfo}
        onClose={() => {
          if (!isRestaking) {
            setShowWithdrawalInfo(false);
          }
        }}
        depositDate={user?.balance && user?.last_deposit_date ? new Date(user.last_deposit_date) : null}
        currentEarnings={earningState.currentEarnings}
        stakedAmount={user?.balance || 0}
        onRestake={handleRestake}
        onStake={() => {
          setShowWithdrawalInfo(false);
          setShowDepositModal(true);
        }}
        payoutWallet={user?.payout_wallet || null}
        onSetPayoutWallet={handleSetPayoutWallet}
      />

     
      <WithdrawModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        totalWithdrawnTon={Number(user?.total_withdrawn ?? 0)}
        onSuccess={() => {
          showSnackbar({
            message: 'Withdrawal Request Submitted!',
            description: 'Your withdrawal request has been submitted and will be processed by the admin team.'
          });
        }}
      /> 
      

      {/* Offline Rewards Modal
      {showOfflineRewardsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl border border-gray-100 p-6 max-w-md w-full shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Claim TAPPS Reward!</h3>
              <p className="text-gray-600">
                You've earned rewards while you were away:
              </p>
              <div className="text-3xl font-bold text-green-600">
                {offlineRewardsAmount.toFixed(8)} TAPPS
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOfflineRewardsModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200
                    font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClaimOfflineRewards}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700
                    font-medium transition-colors shadow-lg shadow-blue-600/30"
                >
                  Claim Rewards
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 border-t-2 border-green-700/50 backdrop-blur-sm safe-area-pb">
        <div className="max-w-lg mx-auto px-6 relative z-10">
          <div className="grid grid-cols-4 items-center py-3">
            {[
              { id: 'home', text: 'Mining', Icon: FaMagento, gradient: 'from-green-500 to-teal-500' },
              { id: 'wallet', text: 'Wallet', Icon: FaWallet, gradient: 'from-orange-500 to-red-500' },
              { id: 'task', text: 'Task', Icon: FaTasks, gradient: 'from-orange-500 to-red-500' },
              // { id: 'network', text: 'Dapp', Icon: FaNetworkWired, gradient: 'from-indigo-500 to-purple-500' },
              { id: 'whale', text: 'Settings', Icon: FaCogs, gradient: 'from-purple-500 to-pink-500' },
            ].map(({ id, text, Icon, gradient }) => (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                className={`group flex flex-col items-center py-2 w-full transition-all duration-300 relative ${
                  currentTab === id ? 'text-green-300' : 'text-gray-500 hover:text-green-400'
                }`}
              >
                {currentTab === id && (
                  <div className={`absolute inset-x-2 -top-1 h-1 bg-gradient-to-r ${gradient} rounded-full shadow-neon-green-sm`}></div>
                )}
                <div className={`relative p-3 rounded-2xl transition-all duration-300 ${currentTab === id ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <Icon size={24} className="transition-all duration-300" />
                </div>
                <span className={`text-xs font-bold tracking-wider transition-all duration-300 ${currentTab === id ? 'text-green-300' : 'text-gray-500 group-hover:text-green-400'}`}>
                  {text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* Add Snackbar component before closing div */}
        {isSnackbarVisible && (
          <Snackbar
            onClose={() => {
              setSnackbarVisible(false);
              if (snackbarTimeoutRef.current) {
                clearTimeout(snackbarTimeoutRef.current);
              }
            }}
            duration={SNACKBAR_DURATION}
            description={snackbarDescription}
            after={
              <Button 
                size="s" 
                onClick={() => {
                  setSnackbarVisible(false);
                  if (snackbarTimeoutRef.current) {
                    clearTimeout(snackbarTimeoutRef.current);
                  }
                }}
              >
                Close
              </Button>
            }
            className="snackbar-top"
          >
            {snackbarMessage}
          </Snackbar>
        )}
      </div>
  );
};

const calculateTotalEarnings = (amount: number): number => {
  let totalEarnings = 0;
  const baseROI = 0.0306; // 3.06% base daily rate for better returns
  
  // Calculate earnings for each day up to 135 days (lock period)
  for (let day = 1; day <= 135; day++) {
    // Get time multiplier based on days staked
    const timeMultiplier = getTimeMultiplier(day);
    
    // Calculate daily earnings with time multiplier
    const dailyEarnings = amount * baseROI * timeMultiplier;
    totalEarnings += dailyEarnings;
  }
  
  return totalEarnings;
};

const SYNC_INTERVAL = 60000; // Sync every minute

export const IndexPage: FC = () => {
  return (
    <I18nProvider>
      <IndexPageContent />
    </I18nProvider>
  );
};
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

// Function to calculate player level based on NOVA token balance (1 to 10 million range)
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