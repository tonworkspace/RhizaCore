import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createOrUpdateUser, getUserByWalletAddress } from '@/lib/supabaseClient';
import { sendLoginCode, verifyLoginCode } from '@/lib/thirdwebAPI';
import { initData, useSignal } from '@telegram-apps/sdk-react';

// --- Constants & Config (From Source 1) ---
const EARNINGS_VALIDATION = {
  MAX_DAILY_EARNING: 1000,
  MAX_TOTAL_EARNING: 1000000,
  SYNC_INTERVAL: 60000, // 1 minute
  RATE_LIMIT_WINDOW: 3600000,
  MAX_SYNCS_PER_WINDOW: 12,
};

const EARNINGS_UPDATE_INTERVAL = 1000;
const EARNINGS_KEY_PREFIX = 'userEarnings_';
const OFFLINE_EARNINGS_PREFIX = 'offline_earnings_state_';

// --- Interfaces ---

export interface AuthUser {
  id: number;
  telegram_id?: number; // Optional now
  wallet_address: string;
  username?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;

  // Game & Economy Properties
  balance: number;
  total_earned: number;
  total_deposit: number;
  total_withdrawn: number;
  team_volume: number;
  rank: string;
  login_streak: number;
  last_login_date: string;
  last_active: string;
  is_active: boolean;
  sponsor_id?: number;
  sponsor_code?: string;
  direct_referrals: number;
  available_earnings?: number;
  reinvestment_balance?: number;
  last_deposit_date?: string;

  // Relations
  referrer?: {
    username: string;
    rank: string;
  };

  // Telegram-specific properties
  first_name?: string;
  last_name?: string;
  language_code?: string;
  photoUrl?: string;

  // Game-specific properties
  has_nft?: boolean;
  referrer_username?: string;
  referrer_rank?: string;
  total_sbt?: number;
  claimed_milestones?: number[];
  expected_rank_bonus?: number;
  stake_date?: string;
  current_stake_date?: string;
  whitelisted_wallet?: string;
  last_deposit_time: string | null;
  payout_wallet?: string;
  pending_withdrawal?: boolean;
  pending_withdrawal_id?: number;
  payout_balance?: number;
  total_payout?: number;
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

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: string | null;
  walletAddress: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, code: string) => Promise<void>;
  loginWithWallet: (walletAddress: string) => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateUserData: (updatedData: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;

  // Game Specific Exports
  currentEarnings: number;
  setCurrentEarnings: (amount: number) => void;
  applySponsorCode: (code: string) => Promise<{ success: boolean; message: string }>;
  telegramUser: any;
  
  // Expose earning helper and state logic so UI components can reset/modify
  earningState: LocalEarningState;
  setEarningState: React.Dispatch<React.SetStateAction<LocalEarningState>>;
  calculateEarningRateLegacy: (balance: number, baseROI?: number, daysStaked?: number) => number;
  getUserEarningsKey: (key: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useWalletAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Helper Functions ---

// Time-based multipliers
const getTimeMultiplier = (daysStaked: number): number => {
  if (daysStaked <= 7) return 1.0;
  if (daysStaked <= 30) return 1.1;
  return 1.25;
};

// Calculate earning rate
const calculateEarningRateLegacy = (balance: number, baseROI: number = 0.0306, daysStaked: number = 0) => {
  const timeMultiplier = getTimeMultiplier(daysStaked);
  const referralBoost = 1.0; 
  const effectiveStakingPower = balance * timeMultiplier * referralBoost;
  const dailyReward = effectiveStakingPower * baseROI;
  return dailyReward / 86400; // Per second rate
};

// Local Storage Helpers
const getUserEarningsKey = (wallet: string) => `${EARNINGS_KEY_PREFIX}${wallet}`;
const getOfflineEarningsKey = (wallet: string) => `${OFFLINE_EARNINGS_PREFIX}${wallet}`;

const saveOfflineEarnings = (wallet: string, state: OfflineEarnings) => {
  localStorage.setItem(getOfflineEarningsKey(wallet), JSON.stringify(state));
};

const loadOfflineEarnings = (wallet: string): OfflineEarnings | null => {
  const stored = localStorage.getItem(getOfflineEarningsKey(wallet));
  return stored ? JSON.parse(stored) : null;
};

// --- Sync Logic ---
let lastSyncTime = 0;
let syncCount = 0;
let lastSyncReset = Date.now();

const syncEarnings = async (userId: number, earnings: number): Promise<boolean> => {
  try {
    const now = Date.now();
    if (now - lastSyncReset >= EARNINGS_VALIDATION.RATE_LIMIT_WINDOW) {
      syncCount = 0;
      lastSyncReset = now;
    }

    if (now - lastSyncTime < EARNINGS_VALIDATION.SYNC_INTERVAL || syncCount >= EARNINGS_VALIDATION.MAX_SYNCS_PER_WINDOW) {
      console.debug('Rate limit reached, skipping sync');
      return false;
    }

    lastSyncTime = now;
    syncCount++;

    // Update user_earnings table (preferred) or users table
    const { error } = await supabase
      .from('user_earnings')
      .upsert({ 
        user_id: userId,
        current_earnings: earnings,
        last_update: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Also update main user record for redundancy if needed
    if (!error) {
       await supabase.from('users').update({ total_earned: earnings }).eq('id', userId);
    }

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    return false;
  }
};

// --- Provider Component ---

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
    walletAddress: null,
  });

  // Game States
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [earningState, setEarningState] = useState<LocalEarningState>({
    lastUpdate: Date.now(),
    currentEarnings: 0,
    baseEarningRate: 0,
    isActive: false,
  });

  const telegramData = useSignal(initData.state);

  // --- Initialization ---

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let activeUser: AuthUser | null = null;
        let activeToken: string | null = null;
        let activeWallet: string | null = null;

        // 1. Primary Auth: Wallet (localStorage)
        const storedToken = localStorage.getItem('thirdweb_token');
        const storedWalletAddress = localStorage.getItem('wallet_address');

        if (storedToken && storedWalletAddress) {
          const user = await getUserByWalletAddress(storedWalletAddress); // Returns AuthUser (casted)

          if (user) {
            activeUser = user as AuthUser;
            activeToken = storedToken;
            activeWallet = storedWalletAddress;
          } else {
            localStorage.removeItem('thirdweb_token');
            localStorage.removeItem('wallet_address');
          }
        }

        // 2. Secondary Auth: Telegram
        // This ensures that even if wallet auth is primary, we validate against the current Telegram user
        // and load the correct game data if possible, or fallback to Telegram-based login if wallet fails.
        if (telegramData?.user) {
          const tgUser = telegramData.user;
          const tgId = String(tgUser.id);
          const startParamRaw = telegramData.startParam as unknown as string | undefined;

          if (activeUser) {
             // User exists via Wallet -> Check/Update Telegram ID
             if (String(activeUser.telegram_id) !== tgId) {
                // If the authenticated user's telegram_id doesn't match the current Telegram session,
                // we attempt to update it. This links the wallet user to this Telegram account.
                // Note: We might want to check for duplicates here, but for now we assume linking.
                const { error: updateError } = await supabase
                   .from('users')
                   .update({ telegram_id: tgId })
                   .eq('id', activeUser.id);
                
                if (!updateError) {
                   activeUser.telegram_id = parseInt(tgId);
                   // Also refresh the user object to be sure
                   activeUser = { ...activeUser, telegram_id: parseInt(tgId) };
                }
             }
          } else {
             // No Wallet User -> Try to Login/Create via Telegram ID
             // (Logic ported from useAuth to ensure game data loads)
             
             // A. Try to fetch existing user by telegram_id
             const { data: existingUser } = await supabase
                .from('users')
                .select(`*, referrer:users!referrer_id(username, rank)`)
                .eq('telegram_id', tgId)
                .maybeSingle();

             if (existingUser) {
                activeUser = existingUser as AuthUser;
                // Update activity
                await supabase.from('users').update({
                   last_active: new Date().toISOString(),
                   last_login_date: new Date().toISOString()
                }).eq('id', existingUser.id);
             } else {
                // B. Create New User
                const newUserData = {
                   telegram_id: tgId,
                   username: tgUser.username || `user_${tgId}`,
                   first_name: tgUser.firstName || null,
                   last_name: tgUser.lastName || null,
                   language_code: tgUser.languageCode || null,
                   wallet_address: '',
                   balance: 0,
                   total_deposit: 0,
                   total_withdrawn: 0,
                   total_earned: 0,
                   team_volume: 0,
                   direct_referrals: 0,
                   rank: 'Novice',
                   last_active: new Date().toISOString(),
                   login_streak: 0,
                   last_login_date: new Date().toISOString(),
                   is_active: true,
                   stake: 0,
                   total_sbt: 0,
                   available_balance: 0,
                   reinvestment_balance: 0
                };

                let createdUser = null;
                const { data: newUser, error: createError } = await supabase
                   .from('users')
                   .upsert(newUserData, { onConflict: 'telegram_id' })
                   .select(`*, referrer:users!referrer_id(username, rank)`)
                   .single();

                if (createError && (createError.code === '23505' || createError.message.includes('duplicate'))) {
                    // Race condition handling
                    const { data: retryUser } = await supabase
                        .from('users')
                        .select(`*, referrer:users!referrer_id(username, rank)`)
                        .eq('telegram_id', tgId)
                        .single();
                    createdUser = retryUser;
                } else {
                    createdUser = newUser;
                }
                
                if (createdUser) {
                   activeUser = createdUser as AuthUser;
                   
                   // Handle Referral
                   if (startParamRaw) {
                      const startParam = startParamRaw.trim();
                      const referrerTgId = parseInt(startParam, 10);
                      if (!isNaN(referrerTgId) && String(referrerTgId) !== tgId) {
                         const { data: referrer } = await supabase
                            .from('users')
                            .select('id, telegram_id, direct_referrals')
                            .eq('telegram_id', String(referrerTgId))
                            .single();
                         
                         if (referrer) {
                            // Update User Sponsor
                            await supabase.from('users').update({ sponsor_id: referrer.id }).eq('id', createdUser.id);
                            // Insert Referral
                            const { error: refError } = await supabase.from('referrals').insert({
                               sponsor_id: referrer.id,
                               referred_id: createdUser.id,
                               status: 'active'
                            });
                            if (!refError) {
                               await supabase.from('users').update({ direct_referrals: (referrer.direct_referrals || 0) + 1 }).eq('id', referrer.id);
                            }
                            
                            // Reload user to get updated referrer info if needed
                            const { data: refreshedUser } = await supabase
                                .from('users')
                                .select(`*, referrer:users!referrer_id(username, rank)`)
                                .eq('id', createdUser.id)
                                .single();
                             if (refreshedUser) {
                                 activeUser = refreshedUser as AuthUser;
                             }
                         }
                      }
                   }
                }
             }
          }
        }

        if (activeUser) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: activeUser,
            token: activeToken,
            walletAddress: activeWallet,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }

      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('thirdweb_token');
        localStorage.removeItem('wallet_address');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [telegramData]);

  // --- Real-time Subscription ---
  useEffect(() => {
    if (!authState.user?.id) return;

    const subscription = supabase
      .channel(`public:users:id=eq.${authState.user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${authState.user.id}`
      }, async (payload) => {
        if (payload.new) {
          // Merge updates into current user state
          setAuthState(prev => ({
            ...prev,
            user: prev.user ? { ...prev.user, ...(payload.new as Partial<AuthUser>) } : null
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [authState.user?.id]);

  // --- Auth Actions ---

  const sendCode = async (email: string) => {
    try {
      await sendLoginCode(email);
    } catch (error) {
      console.error('Failed to send login code:', error);
      throw error;
    }
  };

  const login = async (email: string, code: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const authResult = await verifyLoginCode(email, code);
      const { token, walletAddress, isNewUser } = authResult;

      localStorage.setItem('thirdweb_token', token);
      localStorage.setItem('wallet_address', walletAddress);

      let user: AuthUser;
      if (isNewUser) {
        user = (await createOrUpdateUser(email, walletAddress)) as AuthUser;
      } else {
        const existingUser = await getUserByWalletAddress(walletAddress);
        if (existingUser) {
          user = existingUser as AuthUser;
        } else {
          user = (await createOrUpdateUser(email, walletAddress)) as AuthUser;
        }
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        token,
        walletAddress,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const loginWithWallet = async (walletAddress: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const token = `wallet_token_${walletAddress}_${Date.now()}`;

      localStorage.setItem('thirdweb_token', token);
      localStorage.setItem('wallet_address', walletAddress);

      let user: AuthUser;
      const existingUser = await getUserByWalletAddress(walletAddress);

      if (existingUser) {
        user = existingUser as AuthUser;
      } else {
        // Provide dummy email for wallet-only users if schema requires it, or update createOrUpdateUser to handle optional email
        user = (await createOrUpdateUser(`${walletAddress}@wallet.user`, walletAddress)) as AuthUser;
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        token,
        walletAddress,
      });
    } catch (error) {
      console.error('Wallet login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    // Save final earnings before logout
    if (authState.user && earningState.currentEarnings > 0) {
       syncEarnings(authState.user.id, earningState.currentEarnings);
    }

    localStorage.removeItem('thirdweb_token');
    localStorage.removeItem('wallet_address');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      walletAddress: null,
    });
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  // Add debounce timer state for updateUserData
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const updateUserData = useCallback(async (updatedData: Partial<AuthUser>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setDebounceTimer(setTimeout(async () => {
      try {
        if (!authState.user?.id) throw new Error('No user ID found');

        // Remove referrer property to avoid issues with the update
        const { referrer, ...dataToUpdate } = updatedData;

        // Map camelCase client fields to snake_case DB columns
        const payload: Record<string, any> = { ...dataToUpdate };
        if (Object.prototype.hasOwnProperty.call(payload, 'lastUpdate')) {
          payload.last_update = payload.lastUpdate;
          delete payload.lastUpdate;
        }

        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', authState.user.id)
          .select('*')
          .single();

        if (error) throw error;

        // If we need sponsor info, fetch it separately
        let sponsorInfo = authState.user?.referrer;
        if (updatedUser.sponsor_id && (!sponsorInfo || updatedUser.sponsor_id !== authState.user?.sponsor_id)) {
          const { data: sponsorData } = await supabase
            .from('users')
            .select('username, rank')
            .eq('id', updatedUser.sponsor_id)
            .single();
          
          if (sponsorData) {
            sponsorInfo = {
              username: sponsorData.username,
              rank: sponsorData.rank
            };
          }
        }

        setAuthState(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            ...updatedUser,
            referrer: sponsorInfo,
            referrer_username: sponsorInfo?.username,
            referrer_rank: sponsorInfo?.rank,
            lastUpdate: new Date().toISOString()
          } : null
        }));

      } catch (error) {
        console.error('Update failed:', error);
      }
    }, 500));
  }, [authState.user?.id, debounceTimer]);

  const refreshUser = async () => {
    if (!authState.walletAddress) return;
    try {
      const user = await getUserByWalletAddress(authState.walletAddress);
      if (user) {
        setAuthState(prev => ({ ...prev, user: user as AuthUser }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // --- Mining & Earnings Logic ---

  // 1. Initialize Earnings State from DB + LocalStorage
  useEffect(() => {
    if (!authState.user?.id || !authState.user.balance) return;

    const initializeEarningState = async () => {
      try {
        const { data: serverData } = await supabase
          .from('user_earnings')
          .select('current_earnings, last_update, start_date')
          .eq('user_id', authState.user!.id)
          .single();

        const now = Date.now();
        const daysStaked = serverData ? Math.floor((now - new Date(serverData.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        // Use default ROI or fetch from constants
        const newRate = calculateEarningRateLegacy(authState.user!.balance, 0.0306, daysStaked);

        const savedEarnings = localStorage.getItem(getUserEarningsKey(authState.walletAddress || `tg_${authState.user!.id}`));
        const localEarnings = savedEarnings ? JSON.parse(savedEarnings).currentEarnings : 0;

        let initialState: LocalEarningState;

        if (serverData) {
          const lastUpdateTime = new Date(serverData.last_update).getTime();
          const secondsElapsed = (now - lastUpdateTime) / 1000;
          const baseEarnings = Math.max(serverData.current_earnings, localEarnings);
          const accumulatedEarnings = (newRate * secondsElapsed) + baseEarnings;

          initialState = {
            lastUpdate: now,
            currentEarnings: accumulatedEarnings,
            baseEarningRate: newRate,
            isActive: authState.user!.balance > 0,
            startDate: new Date(serverData.start_date).getTime()
          };
        } else {
          initialState = {
            lastUpdate: now,
            currentEarnings: localEarnings,
            baseEarningRate: newRate,
            isActive: authState.user!.balance > 0,
            startDate: now
          };

          // Init record in DB
          await supabase.from('user_earnings').insert({
             user_id: authState.user!.id,
             current_earnings: 0,
             last_update: new Date().toISOString(),
             start_date: new Date().toISOString()
          });
        }

        setEarningState(initialState);
        setCurrentEarnings(initialState.currentEarnings);

      } catch (error) {
        console.error('Error initializing earning state:', error);
      }
    };

    initializeEarningState();
  }, [authState.user?.id, authState.user?.balance]);

  // 2. Main Earning Interval (The Ticker)
  useEffect(() => {
    if (!authState.user?.id || !authState.user.balance) return;

    const interval = setInterval(() => {
      setEarningState(prev => {
        const now = Date.now();
        const secondsElapsed = (now - prev.lastUpdate) / 1000;

        // Dynamic Rate Recalculation based on days
        const daysStaked = prev.startDate ? Math.floor((now - prev.startDate) / (1000 * 60 * 60 * 24)) : 0;
        const currentRate = calculateEarningRateLegacy(authState.user!.balance, 0.0306, daysStaked);

        const newEarnings = prev.currentEarnings + (currentRate * secondsElapsed);

        const newState = {
          ...prev,
          lastUpdate: now,
          currentEarnings: newEarnings,
          baseEarningRate: currentRate
        };

        // Local Persistence
        const key = authState.walletAddress || `tg_${authState.user!.id}`;
        localStorage.setItem(getUserEarningsKey(key), JSON.stringify(newState));

        setCurrentEarnings(newEarnings);
        return newState;
      });
    }, EARNINGS_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [authState.user?.id, authState.user?.balance]);

  // 3. Periodic Sync to DB
  useEffect(() => {
    if (!authState.user?.id) return;

    const interval = setInterval(async () => {
      await syncEarnings(authState.user!.id, currentEarnings);
    }, EARNINGS_VALIDATION.SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [authState.user?.id, currentEarnings]);

  // 4. Offline Earnings & Visibility
  useEffect(() => {
    if (!authState.user) return;
    const key = authState.walletAddress || `tg_${authState.user!.id}`;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const offlineState = loadOfflineEarnings(key);
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
            setCurrentEarnings(prev => prev + offlineEarnings);
            console.log(`Earned ${offlineEarnings} while offline`);
          }
        }
      } else {
        if (earningState.isActive) {
          saveOfflineEarnings(key, {
            lastActiveTimestamp: Date.now(),
            baseEarningRate: earningState.baseEarningRate
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [earningState, authState.user]);

  // --- Referral Logic ---

  const applySponsorCode = async (sponsorCode: string): Promise<{ success: boolean; message: string }> => {
    if (!authState.user?.id || !sponsorCode.trim()) {
        return { success: false, message: 'Invalid data' };
    }

    try {
        // 1. Validation
        if (sponsorCode === String(authState.user.id)) {
            return { success: false, message: 'Cannot use own code' };
        }

        // Check if already has referral
        const { data: existing } = await supabase
            .from('referrals')
            .select('*')
            .eq('referred_id', authState.user.id)
            .maybeSingle();

        if (existing) {
            return { success: false, message: 'You already have a sponsor.' };
        }

        // 2. Find Sponsor (Search by ID, code, or username if needed)
        // Assuming code is user ID or generated code string.
        // Adjust logic based on your exact code generation strategy.
        const { data: sponsor } = await supabase
            .from('users')
            .select('id, username')
            .or(`id.eq.${sponsorCode},sponsor_code.eq.${sponsorCode}`) // Requires casting if ID is number and code is string in DB
            .maybeSingle();

        if (!sponsor) {
            return { success: false, message: 'Sponsor not found' };
        }

        // 3. Create Referral
        const { error: insertErr } = await supabase.from('referrals').insert({
            sponsor_id: sponsor.id,
            referred_id: authState.user.id,
            status: 'active',
            created_at: new Date().toISOString()
        });

        if (insertErr) throw insertErr;

        // 4. Update User
        await supabase.from('users').update({ sponsor_id: sponsor.id }).eq('id', authState.user.id);

        // 5. Update local state
        refreshUser();

        return { success: true, message: `Joined ${sponsor.username}'s team!` };

    } catch (error) {
        console.error('Apply code error:', error);
        return { success: false, message: 'Failed to apply code' };
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    loginWithWallet,
    sendCode,
    logout,
    updateUser,
    updateUserData,
    refreshUser,
    currentEarnings,
    setCurrentEarnings,
    applySponsorCode,
    telegramUser: telegramData?.user,
    earningState,
    setEarningState,
    calculateEarningRateLegacy,
    getUserEarningsKey
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;