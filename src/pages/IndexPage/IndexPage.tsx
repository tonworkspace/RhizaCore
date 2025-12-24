import { useTonConnectUI } from '@tonconnect/ui-react';
import { toUserFriendlyAddress } from '@tonconnect/sdk';
import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { Snackbar, Button } from '@telegram-apps/telegram-ui';

// Local Component Imports
import { Header } from '@/uicomponents/Header';
import { I18nProvider } from '@/components/I18nProvider';
import { BottomNav } from '@/uicomponents/BottomNav';
// import { Onboarding } from '@/uicomponents/Onboarding';
// import { Icons } from '@/uicomponents/Icons';
import { OnboardingScreen } from './OnboardingScreen';
import { SponsorGate } from '@/components/SponsorGate';
// import { NFTMinter } from '@/components/NFTMinter';
import ArcadeMiningUI, { ArcadeMiningUIHandle } from '@/components/ArcadeMiningUI';

// Logic & Hooks Imports
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { BottomTab } from '@/utils/types';
import SocialTasks from '@/components/SocialTasks';
// import TonWallet from '@/components/TonWallet';
import ReferralSystem from '@/components/ReferralSystem';
import SettingsComponent from '@/components/SettingsComponent';
import NativeWalletUI from '@/components/NativeWalletUI';

type CardType = 'stats' | 'activity' | 'community';

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
  | 'top_up';

interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  amount: number;
  status: string;
  created_at: string;
}

interface SnackbarConfig {
  message: string;
  description?: string;
  duration?: number;
}

interface LocalEarningState {
  lastUpdate: number;
  currentEarnings: number;
  baseEarningRate: number;
  isActive: boolean;
  startDate?: number;
}

interface OfflineEarnings {
  lastActiveTimestamp: number;
  baseEarningRate: number;
}

// --- Constants & Configuration ---
const SNACKBAR_DURATION = 5000;
const EARNINGS_SYNC_INTERVAL = 60000;
const EARNINGS_UPDATE_INTERVAL = 1000;
// const LOCK_PERIOD_DAYS = 135;
// const LOCK_PERIOD_MS = LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000;
const EARNINGS_KEY_PREFIX = 'userEarnings_';
const LAST_SYNC_PREFIX = 'lastSync_';
const SYNC_INTERVAL = 60000;

// --- Helper Functions (Pure) ---

const getEarningsStorageKey = (userId: number | string) => `userEarnings_${userId}`;
const getOfflineEarningsKey = (userId: number | string) => `offline_earnings_state_${userId}`;
const getUserEarningsKey = (userId: number | string) => `${EARNINGS_KEY_PREFIX}${userId}`;
const getUserSyncKey = (userId: number | string) => `${LAST_SYNC_PREFIX}${userId}`;
const getClaimCooldownKey = (userId: number | string) => `claim_cooldown_${userId}`;

const getTimeMultiplier = (daysStaked: number): number => {
  if (daysStaked <= 7) return 1.0;
  if (daysStaked <= 30) return 1.1;
  return 1.25;
};

// const getReferralBoost = (referralCount: number): number => {
//   const baseBoost = Math.min(referralCount * 0.05, 0.5);
//   return 1 + baseBoost;
// };

// const calculateStakingProgress = (depositDate: Date | string | null): number => {
//   if (!depositDate) return 0;
//   const startDate = typeof depositDate === 'string' ? new Date(depositDate) : depositDate;
//   if (isNaN(startDate.getTime())) return 0;

//   const now = Date.now();
//   const startTime = startDate.getTime();
//   const endTime = startTime + LOCK_PERIOD_MS;
  
//   if (now >= endTime) return 100;
//   if (now <= startTime) return 0;
  
//   const progress = ((now - startTime) / (endTime - startTime)) * 100;
//   return Math.min(Math.max(progress, 0), 100);
// };

// const generateUniqueId = async () => {
//   let attempts = 0;
//   const maxAttempts = 5;
//   while (attempts < maxAttempts) {
//     const id = Math.floor(Math.random() * 999999) + 1;
//     const { error } = await supabase
//       .from('deposits')
//       .select('id')
//       .eq('id', id)
//       .single();
//     if (error && error.code === 'PGRST116') {
//       return id;
//     }
//     attempts++;
//   }
//   throw new Error('Could not generate unique deposit ID');
// };

// const calculateNetworkPower = async (): Promise<number> => {
//   try {
//     const { data } = await supabase.from('users').select('balance').gt('balance', 0);
//     return data?.reduce((total, user) => total + (user.balance || 0), 0) || 1;
//   } catch (error) {
//     console.error('Error calculating network power:', error);
//     return 1;
//   }
// };

// Legacy/Simple calculator for local state
const calculateEarningRateLegacy = (balance: number, baseROI: number, daysStaked: number = 0) => {
  const timeMultiplier = getTimeMultiplier(daysStaked);
  const referralBoost = 1.0;
  const effectiveStakingPower = balance * timeMultiplier * referralBoost;
  const dailyReward = effectiveStakingPower * baseROI;
  return dailyReward / 86400;
};

const saveOfflineEarnings = (userId: number | string, state: OfflineEarnings) => {
  localStorage.setItem(getOfflineEarningsKey(userId), JSON.stringify(state));
};

const loadOfflineEarnings = (userId: number | string): OfflineEarnings | null => {
  const stored = localStorage.getItem(getOfflineEarningsKey(userId));
  return stored ? JSON.parse(stored) : null;
};

const syncEarningsToDatabase = async (userId: number, telegramId: number | string, earnings: number) => {
  try {
    const lastSync = localStorage.getItem(getUserSyncKey(telegramId));
    const now = Date.now();
    
    if (!lastSync || (now - Number(lastSync)) > SYNC_INTERVAL) {
      await supabase.from('user_earnings').upsert({
          user_id: userId,
          current_earnings: earnings,
          last_update: new Date().toISOString()
        }, { onConflict: 'user_id' });
      localStorage.setItem(getUserSyncKey(telegramId), now.toString());
    }
  } catch (error) {
    console.error('Silent sync error:', error);
  }
};

// const clearOldEarningCache = (userId: number | string) => {
//   try {
//     localStorage.removeItem(getUserEarningsKey(userId));
//     localStorage.removeItem(getUserSyncKey(userId));
//     localStorage.removeItem(getOfflineEarningsKey(userId));
//   } catch (error) {
//     console.error('Error clearing earning cache:', error);
//   }
// };


// --- Main Component ---

const IndexPageContent: FC = () => {
  // 1. Hooks & Basic State
  const { user, isLoading, error, updateUserData } = useAuth();
  const [tonConnectUI] = useTonConnectUI();
  
  // Navigation State
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('Mining');
  // const [activeTopTab, setActiveTopTab] = useState<TopTab>('Mining');
  const [activeCard] = useState<CardType>('stats');
  
  // // Data State
  // const [miningState, setMiningState] = useState<MiningState>(INITIAL_STATE);
  // const [walletBalance, setWalletBalance] = useState<string>('0');
  const [userFriendlyAddress, setUserFriendlyAddress] = useState<string | null>(null);
  const [tonPrice, setTonPrice] = useState(0);
  const [, setTonPriceChange] = useState(0);
  const [currentROI] = useState<number>(0.0306);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Interaction State
  const [showOnboarding, setShowOnboarding] = useState(false);
  // const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSponsorGate, setShowSponsorGate] = useState(false);
  const [hasSponsor, setHasSponsor] = useState<boolean | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  // const [isDepositing, setIsDepositing] = useState(false);
  // const [depositStatus, setDepositStatus] = useState('idle');
  // const [customAmount, setCustomAmount] = useState('');
  const [userReferralCode, setUserReferralCode] = useState<string>('');
  // const [showReferralContest, setShowReferralContest] = useState(false);

  // Mining/Loading State
  const [miningProgress, setMiningProgress] = useState(0);
  const [, setMiningStatus] = useState('Initializing mining rig...');
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitializedRef = useRef(false);
  
  // Rewards & Staking
  // const [, setHasStaked] = useState(false);
  // const [isStakingCompleted, setIsStakingCompleted] = useState(false);
  // const [stakingProgress, setStakingProgress] = useState(0);
  const [claimCooldown, setClaimCooldown] = useState(0);
  
  // NFT
  // const [showNFTMinterModal, setShowNFTMinterModal] = useState(false);
  // const [hasNFTPass, setHasNFTPass] = useState(false);
  
  // Snackbar
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarDescription, setSnackbarDescription] = useState('');
  const snackbarTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Refs
  const arcadeRef = useRef<ArcadeMiningUIHandle>(null);

  // Earning State
  const [earningState, setEarningState] = useState<LocalEarningState>({
    lastUpdate: Date.now(),
    currentEarnings: 0,
    baseEarningRate: 0,
    isActive: false,
  });

  // --- Utility Functions (Inside Component) ---

  const showSnackbar = useCallback(({ message, description = '', duration = SNACKBAR_DURATION }: SnackbarConfig) => {
    if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);
    setSnackbarMessage(message);
    setSnackbarDescription(description);
    setSnackbarVisible(true);
    snackbarTimeoutRef.current = setTimeout(() => setSnackbarVisible(false), duration);
  }, []);

  const saveEarningState = (userId: number | string, state: LocalEarningState) => {
    try {
      localStorage.setItem(getEarningsStorageKey(userId), JSON.stringify(state));
    } catch (error) {
      console.error('Error saving earning state:', error);
    }
  };

  // --- Handlers ---

  const checkSponsorStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: firstUser } = await supabase.from('users').select('id').order('created_at', { ascending: true }).limit(1).single();
      
      if (firstUser?.id === user.id) {
        setHasSponsor(true);
        setShowSponsorGate(false);
        return;
      }
      
      const { data: referralData } = await supabase.from('referrals').select('sponsor_id').eq('referred_id', user.id).maybeSingle();
      const hasSponsorStatus = !!referralData?.sponsor_id || !!user.sponsor_id;
      
      setHasSponsor(hasSponsorStatus);
      setShowSponsorGate(!hasSponsorStatus);

      // Auto-fix if missing record
      if (user.sponsor_id && !referralData?.sponsor_id) {
         await supabase.from('referrals').insert({
            sponsor_id: user.sponsor_id,
            referred_id: user.id,
            status: 'active',
            created_at: new Date().toISOString()
         });
      }

    } catch (error) {
      console.error('Error checking sponsor:', error);
      setHasSponsor(false);
      setShowSponsorGate(true);
    }
  }, [user?.id, user?.sponsor_id]);

  const handleApplySponsorCode = useCallback(async (sponsorCode: string) => {
    if (!user?.id || !sponsorCode.trim()) return;
    try {
      setIsApplying(true);
      
      // Basic validation logic
      const codeNum = Number(sponsorCode);
      if (isNaN(codeNum)) {
         showSnackbar({ message: 'Invalid Code', description: 'Must be numeric.' });
         return;
      }
      
      // Perform DB Lookup
      const { data: sponsor } = await supabase.from('users').select('id, username').or(`telegram_id.eq.${codeNum},id.eq.${codeNum}`).maybeSingle();
      
      if (!sponsor || sponsor.id === user.id) {
          showSnackbar({ message: 'Invalid Sponsor', description: 'Cannot find user or self-referral.' });
          return;
      }

      await supabase.from('referrals').insert({ sponsor_id: sponsor.id, referred_id: user.id, status: 'active', created_at: new Date().toISOString() });
      await supabase.from('users').update({ sponsor_id: sponsor.id }).eq('id', user.id);
      
      // Update local user data
      if (updateUserData) {
        updateUserData({ sponsor_id: sponsor.id });
      }
      
      showSnackbar({ message: 'Joined Team!', description: `Joined ${sponsor.username}'s team!` });
      setHasSponsor(true);
      setShowSponsorGate(false);

    } catch (e) {
      console.error(e);
      showSnackbar({ message: 'Error', description: 'Failed to apply code.' });
    } finally {
      setIsApplying(false);
    }
  }, [user?.id, updateUserData, showSnackbar]);

  // 1. Loading Sequence
  useEffect(() => {
    if (hasInitializedRef.current || isLoading) return;

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

  // 2. User Data & Staking Status
  useEffect(() => {
    if (user) {
      // Set staking completion
      // const storedCompletion = localStorage.getItem(`isStakingCompleted_${user.telegram_id}`) === 'true';
      // setIsStakingCompleted(storedCompletion);
      
      // if (user.balance && user.balance >= 1 && !storedCompletion) {
      //   setHasStaked(true);
      //   setIsStakingCompleted(true);
      //   localStorage.setItem(`isStakingCompleted_${user.telegram_id}`, 'true');
      // }

      // Check NFT pass
      // setHasNFTPass(localStorage.getItem(`hasClaimedNFTPass_${user.telegram_id}`) === 'true');
      
      // Update staking progress
      // if (user.last_deposit_date) {
      //   setStakingProgress(calculateStakingProgress(user.last_deposit_date));
      // }

      // Set Referral Code
      setUserReferralCode(String(user.telegram_id || user.id));
      
      // Check Sponsor Status
      checkSponsorStatus();
    }
  }, [user, checkSponsorStatus]);

  // 3. Wallet Address
  useEffect(() => {
    if (tonConnectUI.account) {
      const rawAddress = tonConnectUI.account.address;
      setUserFriendlyAddress(toUserFriendlyAddress(rawAddress));
    } else {
      setUserFriendlyAddress(null);
    }
  }, [tonConnectUI.account]);

  // 4. Wallet Balance Polling
  // useEffect(() => {
  //   const fetchWalletBalance = async () => {
  //     if (!tonConnectUI.account) {
  //       setWalletBalance('0');
  //       return;
  //     }
  //     try {
  //       const balance = await tonweb.getBalance(tonConnectUI.account.address);
  //       setWalletBalance(fromNano(balance));
  //     } catch (error) {
  //       console.error('Error fetching wallet balance:', error);
  //       setWalletBalance('0');
  //     }
  //   };
  //   fetchWalletBalance();
  //   const intervalId = setInterval(fetchWalletBalance, 30000);
  //   return () => clearInterval(intervalId);
  // }, [tonConnectUI]);

  // 5. TON Price Polling
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
    const interval = setInterval(fetchTonPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // 6. Activities Fetching & Subscription
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user?.id) return;
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
      }
    };

    if (activeCard === 'activity' || activeBottomTab === 'Mining') {
      fetchActivities();
      const activitiesSubscription = supabase
        .channel('activities-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'activities', filter: `user_id=eq.${user?.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setActivities(prev => [payload.new as Activity, ...prev].slice(0, 10));
            } else if (payload.eventType === 'UPDATE') {
              setActivities(prev => prev.map(a => a.id === payload.new.id ? payload.new as Activity : a));
            } else if (payload.eventType === 'DELETE') {
              setActivities(prev => prev.filter(a => a.id !== payload.old.id));
            }
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(activitiesSubscription); };
    }
  }, [user?.id, activeCard, activeBottomTab]);

  // 7. Onboarding & Sponsor Fallback
  useEffect(() => {
    if (user?.id) {
        const fallbackTimer = setTimeout(() => {
            if (hasSponsor === null) {
              setHasSponsor(false);
              setShowSponsorGate(true);
            }
        }, 5000);

        if (!isLoading && hasSponsor) {
            const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${user.telegram_id}`);
            const isNewUser = user.total_deposit === 0;
            
            // Show onboarding for new users or returning users who haven't seen the latest version
            if (!hasSeenOnboarding || (isNewUser && !hasSeenOnboarding)) {
              setShowOnboarding(true);
              const timer = setTimeout(() => {
                setShowOnboarding(false);
                // Fallback in case onboarding doesn't close itself
                if (!localStorage.getItem(`onboarding_seen_${user.telegram_id}`)) {
                  localStorage.setItem(`onboarding_seen_${user.telegram_id}`, 'true');
                }
              }, isNewUser ? 20000 : 12000); // Longer timeout for new users
              return () => {
                  clearTimeout(timer);
                  clearTimeout(fallbackTimer);
              }
            }
        } else if (!isLoading && hasSponsor === false) {
            setShowSponsorGate(true);
        }
        return () => clearTimeout(fallbackTimer);
    }
  }, [user, isLoading, hasSponsor]);

  // 8. Claim Cooldown Logic
  useEffect(() => {
    if (!user) return;
    const CLAIM_COOLDOWN_KEY = getClaimCooldownKey(user.telegram_id);
    
    // Load initial
    const savedCooldownEnd = localStorage.getItem(CLAIM_COOLDOWN_KEY);
    if (savedCooldownEnd) {
      const remaining = Math.max(0, parseInt(savedCooldownEnd, 10) - Math.floor(Date.now() / 1000));
      if (remaining > 0) setClaimCooldown(remaining);
      else localStorage.removeItem(CLAIM_COOLDOWN_KEY);
    }

    let timer: NodeJS.Timeout | null = null;
    if (claimCooldown > 0) {
      if (!localStorage.getItem(CLAIM_COOLDOWN_KEY)) {
        localStorage.setItem(CLAIM_COOLDOWN_KEY, (Math.floor(Date.now() / 1000) + claimCooldown).toString());
      }
      timer = setInterval(() => {
        setClaimCooldown(prev => {
          const nv = Math.max(0, prev - 1);
          if (nv === 0) {
            localStorage.removeItem(CLAIM_COOLDOWN_KEY);
            showSnackbar({ message: 'Claim Available', description: 'You can now claim your earnings again!' });
          }
          return nv;
        });
      }, 1000);
    }

    // Visibility Handler for Cooldown
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            const end = localStorage.getItem(CLAIM_COOLDOWN_KEY);
            if (end) {
                const remaining = Math.max(0, parseInt(end, 10) - Math.floor(Date.now() / 1000));
                setClaimCooldown(remaining);
            }
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        if (timer) clearInterval(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [claimCooldown, user]);

  // 9. CORE EARNINGS LOGIC (Consolidated)
  useEffect(() => {
    if (!user?.id || !user.balance) return;

    // A. Initialization
    const initializeEarningState = async () => {
      try {
        const { data: serverData } = await supabase
          .from('user_earnings')
          .select('current_earnings, last_update, start_date')
          .eq('user_id', user.id)
          .single();

        const now = Date.now();
        const daysStaked = serverData ? Math.floor((now - new Date(serverData.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const newRate = calculateEarningRateLegacy(user.balance, currentROI, daysStaked);
        
        const savedEarnings = localStorage.getItem(getUserEarningsKey(user.telegram_id));
        const localEarnings = savedEarnings ? JSON.parse(savedEarnings).currentEarnings : 0;
        
        let newState: LocalEarningState;

        if (serverData) {
          const startDate = new Date(serverData.start_date).getTime();
          const lastUpdateTime = new Date(serverData.last_update).getTime();
          const secondsElapsed = (now - lastUpdateTime) / 1000;
          const baseEarnings = Math.max(serverData.current_earnings, localEarnings);
          const accumulatedEarnings = (newRate * secondsElapsed) + baseEarnings;

          newState = {
            lastUpdate: now,
            currentEarnings: accumulatedEarnings,
            baseEarningRate: newRate,
            isActive: user.balance > 0,
            startDate: startDate
          };
          
          // Sync update back to server
          await supabase.from('user_earnings').upsert({
            user_id: user.id,
            current_earnings: accumulatedEarnings,
            last_update: new Date(now).toISOString(),
            start_date: new Date(startDate).toISOString()
          }, { onConflict: 'user_id' });

        } else {
          // Initialize New User
          newState = {
            lastUpdate: now,
            currentEarnings: localEarnings,
            baseEarningRate: newRate,
            isActive: user.balance > 0,
            startDate: now
          };
          
          await supabase.from('user_earnings').insert({
            user_id: user.id,
            current_earnings: localEarnings,
            last_update: new Date(now).toISOString(),
            start_date: new Date(now).toISOString()
          });
        }

        setEarningState(newState);
        saveEarningState(user.telegram_id, newState);

      } catch (error) {
        console.error('Error initializing earning state:', error);
      }
    };

    if (hasInitializedRef.current) {
        // Only run initialization once per session/user load
        initializeEarningState();
    }

    // B. Interval Updates (The Ticker)
    const earningsInterval = setInterval(() => {
      setEarningState(prevState => {
        const now = Date.now();
        const secondsElapsed = (now - prevState.lastUpdate) / 1000;
        const daysStaked = prevState.startDate ? Math.floor((now - prevState.startDate) / (1000 * 60 * 60 * 24)) : 0;
        const newRate = calculateEarningRateLegacy(user.balance, currentROI, daysStaked);

        const newEarnings = prevState.currentEarnings + (prevState.baseEarningRate * secondsElapsed);
        
        const newState = {
          ...prevState,
          lastUpdate: now,
          currentEarnings: newEarnings,
          baseEarningRate: newRate
        };
        
        localStorage.setItem(getUserEarningsKey(user.telegram_id), JSON.stringify(newState));
        return newState;
      });
    }, EARNINGS_UPDATE_INTERVAL);

    // C. Background Sync
    const syncInterval = setInterval(async () => {
        const currentState = JSON.parse(localStorage.getItem(getUserEarningsKey(user.telegram_id)) || '{}');
        if (currentState.currentEarnings) {
             syncEarningsToDatabase(user.id, user.telegram_id, currentState.currentEarnings);
        }
    }, EARNINGS_SYNC_INTERVAL);

    // D. Offline Logic (Visibility)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
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
                        description: `You earned ${offlineEarnings.toFixed(8)} RZC while offline`
                    });
                }
            }
        } else {
            // Going background
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
      clearInterval(earningsInterval);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Final save on unmount
      const finalState = earningState;
      localStorage.setItem(getUserEarningsKey(user.telegram_id), JSON.stringify(finalState));
      syncEarningsToDatabase(user.id, user.telegram_id, finalState.currentEarnings);
    };
  }, [user?.id, user?.balance, currentROI]);

  // Immediate balance refresh for SocialTasks
 const handleRewardClaimed = async (_amount: number) => {
  if (arcadeRef.current && typeof arcadeRef.current.refreshBalance === 'function') {
    arcadeRef.current.refreshBalance();
  }
};


  // const handlePurchase = (cost: number, type: string): boolean => {
  //   if (miningState.balance >= cost) {
  //     setMiningState(prev => {
  //       let newRate = prev.miningRatePerHour;
  //       if (type === 'upgrade') newRate += 50;
  //       else if (type === 'nft') newRate += 500;
        
  //       return { ...prev, balance: prev.balance - cost, miningRatePerHour: newRate };
  //     });
  //     return true;
  //   }
  //   return false;
  // };

  // --- Rendering ---

  // Comprehensive loading state that covers all loading conditions
  if (isLoading || isInitializing || !user || hasSponsor === null) {
    const getLoadingMessage = () => {
      if (isLoading) return 'Authenticating...';
      if (isInitializing) return 'Initializing system...';
      if (!user) return 'Loading user data...';
      if (hasSponsor === null) return 'Checking sponsor status...';
      return 'Loading...';
    };

    const getLoadingProgress = () => {
      if (isLoading) return 20;
      if (isInitializing) return miningProgress;
      if (!user) return 60;
      if (hasSponsor === null) return 80;
      return 100;
    };

    return (
      <div className="fixed inset-0 flex flex-col items-start justify-end pb-24 h-screen w-screen p-8 bg-black font-mono text-xs z-50">
        {/* User status indicator */}
        <div className="absolute top-6 right-6 text-rzc-green/60 text-xs font-mono">
          SYSTEM_LOADING
        </div>
        
        {/* Loading sequence */}
        <div className="text-rzc-green/80 mb-2 animate-fadeIn">
          <span className="mr-2 opacity-50">{`>`}</span>
          {getLoadingMessage()}
        </div>
        
        {/* Progress indicator */}
        <div className="text-rzc-green/60 mb-2 text-xs">
          <span className="mr-2 opacity-50">{`>`}</span>
          Progress: {getLoadingProgress()}% Complete
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-md mb-4">
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rzc-green to-green-400 transition-all duration-500 ease-out"
              style={{ width: `${getLoadingProgress()}%` }}
            />
          </div>
        </div>
        
        {/* Animated cursor */}
        <div className="text-rzc-green animate-pulse">_</div>
        
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-5" 
             style={{ 
               backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', 
               backgroundSize: '30px 30px' 
             }}>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F] text-white">
            <p>Error loading application. Please reload.</p>
        </div>
    );
  }

  // Show onboarding for new users
  if (showOnboarding && user) {
     return <OnboardingScreen />;
  }

  // Show sponsor gate if user doesn't have a sponsor
  if (showSponsorGate && user) {
    return (
      <SponsorGate
        onApplyCode={handleApplySponsorCode}
        isLoading={isApplying}
      />
    );
  }

  const renderContent = () => {
    switch (activeBottomTab) {
      case 'Mining':
        return (
          <ArcadeMiningUI
          ref={arcadeRef}
          balanceTon={user?.balance || 0}
          tonPrice={tonPrice || 0}
          currentEarningsTon={earningState?.currentEarnings || 0}
          isClaiming={false}
          claimCooldown={0}
          cooldownText={''}
          onClaim={() => {}}
          // onOpenDeposit={[]}
          potentialEarningsTon={0}
          airdropBalanceNova={0}
          totalWithdrawnTon={user?.total_withdrawn || 0}
          activities={activities}
          withdrawals={[]}
          // isLoadingActivities={isLoadingActivities}
          userId={user?.id}
          userUsername={user?.username}
          referralCode={userReferralCode}
          estimatedDailyTapps={0}
          showSnackbar={showSnackbar}
        />
        );
      case 'Task':
        return <SocialTasks 
        showSnackbar={showSnackbar}
        userId={user?.id}
        onRewardClaimed={handleRewardClaimed}
        // onNavigateToReferralContest={() => setShowReferralContest(true)}
      />;
      case 'Wallet':
        return <NativeWalletUI
                ref={arcadeRef}
          balanceTon={user?.balance || 0}
          tonPrice={tonPrice || 0}
          currentEarningsTon={earningState?.currentEarnings || 0}
          isClaiming={false}
          claimCooldown={0}
          cooldownText={''}
          onClaim={() => {}}
          // onOpenDeposit={[]}
          potentialEarningsTon={0}
          airdropBalanceNova={0}
          totalWithdrawnTon={user?.total_withdrawn || 0}
          activities={activities}
          withdrawals={[]}
          // isLoadingActivities={isLoadingActivities}
          userId={user?.id}
          userUsername={user?.username}
          referralCode={userReferralCode}
          estimatedDailyTapps={0}
          showSnackbar={showSnackbar}
          tonAddress={userFriendlyAddress}
        />;
      
        case 'Friends':
          return <ReferralSystem />;
          
        case 'Core':
        return <ReferralSystem />;

      case 'More':
        return (
          <SettingsComponent/>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-black">
      <div className="w-full max-w-md h-[100dvh] bg-rzc-black relative shadow-2xl overflow-hidden flex flex-col">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-5" 
             style={{ 
               backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>

        <>
        <Header/>
            
            <main className="flex-1 overflow-hidden relative z-10">
              {renderContent()}
            </main>
            
            <BottomNav activeTab={activeBottomTab} onTabChange={setActiveBottomTab} />
        </>

        {/* Snackbar Container */}
        {isSnackbarVisible && (
            <Snackbar
                onClose={() => setSnackbarVisible(false)}
                duration={SNACKBAR_DURATION}
                description={snackbarDescription}
                after={<Button size="s" onClick={() => setSnackbarVisible(false)}>Close</Button>}
                className="snackbar-top"
            >
                {snackbarMessage}
            </Snackbar>
        )}
      </div>
      
    </div>
  );
};

export const IndexPage: FC = () => {
  return (
    <I18nProvider>
      <IndexPageContent />
    </I18nProvider>
  );
};