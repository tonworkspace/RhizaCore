import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initData, useSignal } from '@telegram-apps/sdk-react';
import { supabase, reconcileUserBalance, createOrUpdateUser, getUserByWalletAddress } from '@/lib/supabaseClient';
import { sendLoginCode, verifyLoginCode } from '@/lib/thirdwebAPI';

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

// --- Constants & Config (From AuthContext) ---

const EARNINGS_VALIDATION = {
  MAX_DAILY_EARNING: 1000,
  MAX_TOTAL_EARNING: 1000000,
  SYNC_INTERVAL: 60000, // 1 minute
  RATE_LIMIT_WINDOW: 3600000,
  MAX_SYNCS_PER_WINDOW: 12,
};

const EARNINGS_UPDATE_INTERVAL = 1000;
const EARNINGS_KEY_PREFIX = 'userEarnings_';
const LAST_SYNC_PREFIX = 'lastSync_';
const OFFLINE_EARNINGS_PREFIX = 'offline_earnings_state_';

// --- Additional Interfaces ---

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

// EARNINGS_VALIDATION is defined above

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

export const useAuth = () => {
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

  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const telegramData = useSignal(initData.state);

  // Add sync interval state
  const [, setSyncInterval] = useState<NodeJS.Timeout | null>(null);

  const initializeAuth = useCallback(async () => {
    console.time('useAuth.initializeAuth');
    if (!telegramData?.user) {
      setError('Please open this app in Telegram');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const telegramUser = telegramData.user;
      const telegramId = String(telegramUser.id);
      const startParamRaw = telegramData.startParam as unknown as string | undefined;

      console.time('useAuth.fetchExistingUser');
      // First attempt to get existing user with better error handling
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select(`
          *,
          referrer:users!referrer_id(
            username,
            rank
          )
        `)
        .eq('telegram_id', telegramId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors
      console.timeEnd('useAuth.fetchExistingUser');

      // Handle user creation if needed - only if user truly doesn't exist
      if (!existingUser && (!fetchError || fetchError.code === 'PGRST116')) { // User doesn't exist
        console.time('useAuth.doubleCheckUser');
        // Double-check if user actually exists to prevent duplicates
        const { data: doubleCheckUser, } = await supabase
          .from('users')
          .select('id, telegram_id')
          .eq('telegram_id', telegramId)
          .maybeSingle();
        console.timeEnd('useAuth.doubleCheckUser');

        if (doubleCheckUser) {
          console.log('User already exists, fetching full data for telegram_id:', telegramId);
          console.time('useAuth.fetchFullUser');
          // User exists, fetch full data
          const { data: fullUser, error: fullFetchError } = await supabase
            .from('users')
            .select(`
              *,
              referrer:users!referrer_id(
                username,
                rank
              )
            `)
            .eq('telegram_id', telegramId)
            .single();
          console.timeEnd('useAuth.fetchFullUser');

          if (fullFetchError) {
            console.error('Error fetching existing user:', fullFetchError);
            throw new Error(`Failed to fetch existing user: ${fullFetchError.message}`);
          }

          return fullUser;
        }

        console.log('Creating new user for telegram_id:', telegramId);
        
        // Add more detailed logging
        const newUserData = {
          telegram_id: telegramId,
          username: telegramUser.username || `user_${telegramId}`,
          first_name: telegramUser.firstName || null,
          last_name: telegramUser.lastName || null,
          language_code: telegramUser.languageCode || null,
          wallet_address: '', // Empty string as default
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

        console.log('Attempting to create user with data:', newUserData);

        console.time('useAuth.createUser');
        // Create new user idempotently using upsert on telegram_id
        let newUser: any = null;
        const { data: upsertUser, error: upsertError } = await supabase
          .from('users')
          .upsert(newUserData, { onConflict: 'telegram_id' })
          .select(`
            *,
            referrer:users!referrer_id(
              username,
              rank
            )
          `)
          .single();
        console.timeEnd('useAuth.createUser');

        if (upsertError) {
          // If race caused duplicate, fetch existing user instead of failing
          const isDup = (upsertError as any)?.code === '23505' || (upsertError.message || '').toLowerCase().includes('duplicate key');
          if (isDup) {
            const { data: fetchedExisting, error: fetchExistingErr } = await supabase
              .from('users')
              .select(`
                *,
                referrer:users!referrer_id(
                  username,
                  rank
                )
              `)
              .eq('telegram_id', telegramId)
              .single();
            if (!fetchExistingErr && fetchedExisting) {
              newUser = fetchedExisting;
            } else {
              console.error('Duplicate detected but failed to fetch existing user:', fetchExistingErr);
              throw new Error('Failed to create or fetch existing user after duplicate.');
            }
          } else {
            console.error('Detailed create error:', {
              code: upsertError.code,
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint
            });
            throw new Error(`Failed to create new user: ${upsertError.message}`);
          }
        } else {
          newUser = upsertUser;
        }

        if (!newUser) {
          throw new Error('No user data returned after creation');
        }

        // Handle referral attribution via Telegram start_param
        console.time('useAuth.referralProcessing');
        try {
          const startParam = startParamRaw?.trim();
          const parsedReferrerTgId = startParam ? parseInt(startParam, 10) : NaN;
          const isNumericStartParam = !isNaN(parsedReferrerTgId) && parsedReferrerTgId > 0;

          if (isNumericStartParam) {
            if (String(parsedReferrerTgId) !== telegramId) {
              console.time('useAuth.findReferrer');
              // Find referrer by telegram_id
              const { data: referrerUser, error: referrerFetchError } = await supabase
                .from('users')
                .select('id, telegram_id, direct_referrals')
                .eq('telegram_id', String(parsedReferrerTgId))
                .single();
              console.timeEnd('useAuth.findReferrer');

              if (!referrerFetchError && referrerUser?.id) {
                // Set referrer on the new user if not already set
                const { data: updatedNewUser, error: setReferrerError } = await supabase
                  .from('users')
                  .update({ sponsor_id: referrerUser.id })
                  .eq('id', newUser.id)
                  .select('*')
                  .single();

                if (setReferrerError) {
                  console.error('Failed to set referrer_id on new user:', setReferrerError);
                } else {
                  // Create referral record (idempotent-ish: rely on uniqueness at app logic level)
                  // Ensure we only count referral once
                  const { data: existingReferral } = await supabase
                    .from('referrals')
                    .select('id')
                    .eq('sponsor_id', referrerUser.id)
                    .eq('referred_id', newUser.id)
                    .maybeSingle();

                  if (!existingReferral) {
                    const { error: insertReferralError } = await supabase
                      .from('referrals')
                      .insert([{ sponsor_id: referrerUser.id, referred_id: newUser.id, status: 'active' }]);

                    if (insertReferralError) {
                      // Check for duplicate key error (race condition or unique constraint violation)
                      const isDupReferral = (insertReferralError as any)?.code === '23505' || 
                                           (insertReferralError.message || '').toLowerCase().includes('duplicate') ||
                                           (insertReferralError.message || '').toLowerCase().includes('unique');
                      if (!isDupReferral) {
                        console.error('Failed to insert referral row:', insertReferralError);
                      } else {
                        // Duplicate detected - this is OK, just log it
                        console.info('Duplicate referral prevented:', { sponsor_id: referrerUser.id, referred_id: newUser.id });
                      }
                    } else {
                      // Increase direct_referrals count only when a new referral row was created
                      const currentDirect = (referrerUser as any)?.direct_referrals ?? 0;
                      const { error: bumpDirectError } = await supabase
                        .from('users')
                        .update({ direct_referrals: currentDirect + 1 })
                        .eq('id', referrerUser.id);
                      if (bumpDirectError) {
                        // Non-fatal; often handled elsewhere via triggers or backend
                        console.warn('Failed to bump direct_referrals (non-fatal):', bumpDirectError?.message);
                      }
                    }
                  }

                  // Replace newUser with updated one including referrer_id
                  if (updatedNewUser) {
                    Object.assign(newUser, updatedNewUser);
                  }
                }
              }
            } else {
              console.info('Start param equals user telegram id; skipping self-referral.');
            }
          } else if (startParam) {
            // Here you could support non-numeric campaign codes in the future
            console.info('Non-numeric start_param detected; referral attribution skipped for now:', startParam);
          }
        } catch (referralErr) {
          console.error('Referral attribution via start_param failed:', referralErr);
        }
        console.timeEnd('useAuth.referralProcessing');

        // Set the newly created user
        const storedToken = localStorage.getItem('thirdweb_token');
        setAuthState({
          isAuthenticated: !!storedToken,
          isLoading: false,
          user: {
            ...newUser,
            login_streak: 0,
            last_login_date: new Date().toISOString()
          },
          token: null,
          walletAddress: null,
        });
        if (!storedToken) {
          setError('Please connect your wallet to authenticate');
        }
        
      } else if (fetchError && fetchError.code !== 'PGRST116') {
        // Handle other fetch errors (not "no rows found")
        console.error('Error fetching user:', fetchError);
        throw new Error('Failed to fetch user data');
      } else if (existingUser) {
        // Update last active timestamp and login date for existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            last_active: new Date().toISOString(),
            last_login_date: new Date().toISOString()
          })
          .eq('telegram_id', telegramId);

        if (updateError) {
          console.error('Failed to update user timestamps:', updateError);
        }

        // Set the existing user
        const storedToken = localStorage.getItem('thirdweb_token');
        setAuthState({
          isAuthenticated: !!storedToken,
          isLoading: false,
          user: {
            ...existingUser,
            login_streak: existingUser.login_streak || 0,
            last_login_date: existingUser.last_login_date || new Date().toISOString()
          },
          token: null,
          walletAddress: null,
        });
        if (!storedToken) {
          setError('Please connect your wallet to authenticate');
        }
      }

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } finally {
      console.timeEnd('useAuth.initializeAuth');
    }
  }, [telegramData]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Real-time subscription to user changes
  useEffect(() => {
    if (!authState.user?.telegram_id) return;

    const subscription = supabase
      .channel(`public:users:telegram_id=eq.${authState.user.telegram_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `telegram_id=eq.${authState.user.telegram_id}`
      }, async (payload) => {
        if (payload.new) {
          // Fetch fresh user data without trying to join the referrer
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', authState.user!.telegram_id)
            .single();

          if (data) {
            // If we need sponsor info, fetch it separately if sponsor_id exists
            let sponsorInfo = null;
            if (data.sponsor_id) {
              const { data: sponsorData } = await supabase
                .from('users')
                .select('username, rank')
                .eq('id', data.sponsor_id)
                .single();

              if (sponsorData) {
                sponsorInfo = {
                  username: sponsorData.username,
                  rank: sponsorData.rank
                };
              }
            }

            const authUser: AuthUser = {
              ...data,
              referrer_username: sponsorInfo?.username,
              referrer_rank: sponsorInfo?.rank,
              login_streak: data.login_streak || 0,
              last_login_date: data.last_login_date,
              referrer: sponsorInfo
            };
            setAuthState(prev => ({ ...prev, user: authUser }));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [authState.user?.telegram_id]);

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
          .eq('id', authState.user!.id)
          .select('*')
          .single();

        if (error) throw error;

        // If we need sponsor info, fetch it separately
        let sponsorInfo = authState.user.referrer;
        if (updatedUser.sponsor_id && (!sponsorInfo || updatedUser.sponsor_id !== authState.user.sponsor_id)) {
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

  const logout = useCallback(() => {
    console.log('Logging out user:', authState.user?.telegram_id);

    // Save final earnings before logout
    if (authState.user && earningState.currentEarnings > 0) {
       syncEarnings(authState.user!.id, earningState.currentEarnings);
    }

    // Clear all authentication state
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      walletAddress: null,
    });
    setError(null);

    // Clear any pending operations
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    // Clean up local storage
    localStorage.removeItem('userSession');
    localStorage.removeItem('authToken');
    localStorage.removeItem('thirdweb_token');
    localStorage.removeItem('wallet_address');

    // Log the logout event
    console.log('User logged out successfully');
  }, [authState.user, earningState.currentEarnings, debounceTimer]);

  // Update sync interval
  useEffect(() => {
    if (authState.user?.id) {
      const interval = setInterval(async () => {
        const success = await syncEarnings(authState.user!.id, currentEarnings);
        if (!success) {
          // Reset to last valid state
          const { data: lastValidState } = await supabase
            .from('users')
            .select('total_earned')
            .eq('id', authState.user!.id)
            .single();

          if (lastValidState) {
            setCurrentEarnings(lastValidState.total_earned);
          }
        }
      }, 5 * 60 * 1000);

      setSyncInterval(interval);
      return () => clearInterval(interval);
    }
  }, [authState.user?.id, currentEarnings]);


  // Update the useEffect to handle earnings updates more efficiently
  useEffect(() => {
    if (!authState.user?.id) return;

    let isMounted = true;
    let syncTimeout: NodeJS.Timeout | null = null;

    const handleEarningsUpdate = async () => {
      if (!isMounted) return;

      try {
        const success = await syncEarnings(authState.user!.id, currentEarnings);

        if (!success && isMounted) {
          // If sync fails, validate and reset to last known good state
          const { data: lastValidState } = await supabase
            .from('users')
            .select('total_earned')
            .eq('id', authState.user!.id)
            .single();

          if (lastValidState && isMounted) {
            setCurrentEarnings(lastValidState.total_earned);
          }
        }
      } catch (error) {
        console.error('Error updating earnings:', error);
      }

      // Schedule next sync if component is still mounted
      if (isMounted) {
        syncTimeout = setTimeout(
          handleEarningsUpdate,
          EARNINGS_VALIDATION.SYNC_INTERVAL
        );
      }
    };

    // Initial sync
    handleEarningsUpdate();

    // Cleanup
    return () => {
      isMounted = false;
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [authState.user?.id, currentEarnings]);

  // Add periodic balance check
  useEffect(() => {
    if (!authState.user?.id) return;

    const checkBalance = async () => {
      await reconcileUserBalance(authState.user!.id);
    };

    // Check balance every hour
    const interval = setInterval(checkBalance, 60 * 60 * 1000);

    // Initial check
    checkBalance();

    return () => clearInterval(interval);
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

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        token,
        walletAddress,
      }));
      setError(null);
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

  const updateUser = (updates: Partial<AuthUser>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

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

  // --- Referral Logic ---

  const applySponsorCode = async (sponsorCode: string): Promise<{ success: boolean; message: string }> => {
    if (!authState.user?.id || !sponsorCode.trim()) {
        return { success: false, message: 'Invalid data' };
    }

    try {
        // 1. Validation
        if (sponsorCode === String(authState.user!.id)) {
            return { success: false, message: 'Cannot use own code' };
        }

        // Check if already has referral
        const { data: existing } = await supabase
            .from('referrals')
            .select('*')
            .eq('referred_id', authState.user!.id)
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
        await supabase.from('users').update({ sponsor_id: sponsor.id }).eq('id', authState.user!.id);

        // 5. Update local state
        refreshUser();

        return { success: true, message: `Joined ${sponsor.username}'s team!` };

    } catch (error) {
        console.error('Apply code error:', error);
        return { success: false, message: 'Failed to apply code' };
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

        const savedEarnings = localStorage.getItem(getUserEarningsKey(authState.walletAddress!));
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
        if (authState.walletAddress) {
          localStorage.setItem(getUserEarningsKey(authState.walletAddress), JSON.stringify(newState));
        }

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
    if (!authState.user || !authState.walletAddress) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const offlineState = loadOfflineEarnings(authState.walletAddress!);
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
          saveOfflineEarnings(authState.walletAddress!, {
            lastActiveTimestamp: Date.now(),
            baseEarningRate: earningState.baseEarningRate
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [earningState, authState.user]);

  return useMemo(() => ({
    ...authState,
    error,
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
  }), [authState, error, login, loginWithWallet, sendCode, logout, updateUser, updateUserData, refreshUser, currentEarnings, applySponsorCode, telegramData]);
};

// function getPreviousDay(date: string): string {
//   const d = new Date(date);
//   d.setDate(d.getDate() - 1);
//   return d.toISOString().split('T')[0];
// }
export default useAuth;