import { useState, useEffect, useCallback, useMemo } from 'react';
import { initData, useSignal } from '@telegram-apps/sdk-react';
import { supabase, reconcileUserBalance } from '@/lib/supabaseClient';
import type { User } from '@/lib/supabaseClient';

export interface AuthUser extends User {
  // Extended user properties
  total_earned?: number;
  login_streak: number;
  last_login_date: string;
  has_nft?: boolean;
  referrer_username?: string;
  referrer_rank?: string;
  sponsor_id?: number;
  sponsor_code?: string;
  total_sbt?: number;
  claimed_milestones?: number[];
  photoUrl?: string;
  team_volume: number;
  expected_rank_bonus?: number;
  available_earnings?: number;
  direct_referrals: number;
  referrer?: {
    username: string;
    rank: string;
  };
  stake_date?: string;
  current_stake_date?: string;
  whitelisted_wallet?: string;
  last_deposit_time: string | null;
  last_deposit_date?: string;
  payout_wallet?: string;
  pending_withdrawal?: boolean;
  pending_withdrawal_id?: number;
  payout_balance?: number;
  total_payout?: number;
}

// Update validation constants
const EARNINGS_VALIDATION = {
  MAX_DAILY_EARNING: 1000, // Maximum TON per day
  MAX_TOTAL_EARNING: 1000000, // Maximum total TON
  SYNC_INTERVAL: 300000, // 5 minutes (300000ms)
  RATE_LIMIT_WINDOW: 3600000, // 1 hour window
  MAX_SYNCS_PER_WINDOW: 12, // Max 12 syncs per hour
  MAX_EARNING_DAYS: 100, // Maximum days for earning
  EARNINGS_TIMEOUT: 8640000000, // 100 days in milliseconds
};

// Add sync tracking
let lastSyncTime = 0;
let syncCount = 0;
let lastSyncReset = Date.now();

// Update the sync function with better rate limiting
const syncEarnings = async (userId: number, earnings: number): Promise<boolean> => {
  try {
    const now = Date.now();

    // Reset sync count if window has passed
    if (now - lastSyncReset >= EARNINGS_VALIDATION.RATE_LIMIT_WINDOW) {
      syncCount = 0;
      lastSyncReset = now;
    }

    // Check rate limits
    if (
      now - lastSyncTime < EARNINGS_VALIDATION.SYNC_INTERVAL ||
      syncCount >= EARNINGS_VALIDATION.MAX_SYNCS_PER_WINDOW
    ) {
      console.debug('Rate limit reached, skipping sync');
      return false;
    }

    // Update sync tracking
    lastSyncTime = now;
    syncCount++;

    // Update earnings directly without stake validation
    const { error } = await supabase
      .from('users')
      .update({ 
        total_earned: earnings,
        last_sync: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Sync error:', error);
    return false;
  }
};

// Simplify validation function to remove stake-related checks
const validateAndSyncData = async (userId: number) => {
  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('total_earned, last_sync')
      .eq('id', userId)
      .single();

    if (!dbUser) return 0;

    // Use simple validation against max total earnings
    const validatedEarnings = Math.min(
      dbUser.total_earned,
      EARNINGS_VALIDATION.MAX_TOTAL_EARNING
    );

    await syncEarnings(userId, validatedEarnings);
    return validatedEarnings;
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  
  const telegramData = useSignal(initData.state);

  // Add sync interval state
  const [, setSyncInterval] = useState<NodeJS.Timeout | null>(null);

  const initializeAuth = useCallback(async () => {
    console.time('useAuth.initializeAuth');
    if (!telegramData?.user) {
      setError('Please open this app in Telegram');
      setIsLoading(false);
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
        setUser({
          ...newUser,
          login_streak: 0,
          last_login_date: new Date().toISOString()
        });
        
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
        setUser({
          ...existingUser,
          login_streak: existingUser.login_streak || 0,
          last_login_date: existingUser.last_login_date || new Date().toISOString()
        });
      }

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      console.timeEnd('useAuth.initializeAuth');
    }
  }, [telegramData]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Real-time subscription to user changes
  useEffect(() => {
    if (!user?.telegram_id) return;

    const subscription = supabase
      .channel(`public:users:telegram_id=eq.${user.telegram_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `telegram_id=eq.${user.telegram_id}`
      }, async (payload) => {
        if (payload.new) {
          // Fetch fresh user data without trying to join the referrer
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', user.telegram_id)
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
            setUser(authUser);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.telegram_id]);

  const updateUserData = useCallback(async (updatedData: Partial<AuthUser>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setDebounceTimer(setTimeout(async () => {
      try {
        if (!user?.id) throw new Error('No user ID found');

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
          .eq('id', user.id)
          .select('*')
          .single();

        if (error) throw error;

        // If we need sponsor info, fetch it separately
        let sponsorInfo = user.referrer;
        if (updatedUser.sponsor_id && (!sponsorInfo || updatedUser.sponsor_id !== user.sponsor_id)) {
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

        setUser(prev => ({
          ...prev,
          ...updatedUser,
          referrer: sponsorInfo,
          referrer_username: sponsorInfo?.username,
          referrer_rank: sponsorInfo?.rank,
          lastUpdate: new Date().toISOString()
        }));

      } catch (error) {
        console.error('Update failed:', error);
      }
    }, 500));
  }, [user?.id, debounceTimer]);

  const logout = useCallback(() => {
    console.log('Logging out user:', user?.telegram_id);

    // Clear all authentication state
    setUser(null);
    setIsLoading(false);
    setError(null);

    // Clear any pending operations
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    // Clean up local storage
    localStorage.removeItem('userSession');
    localStorage.removeItem('authToken');

    // Log the logout event
    console.log('User logged out successfully');
  }, [user, debounceTimer]);

  // Update sync interval
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(async () => {
        const success = await syncEarnings(user.id, currentEarnings);
        if (!success) {
          // Reset to last valid state
          const validatedEarnings = await validateAndSyncData(user.id);
          if (validatedEarnings !== null) {
            setCurrentEarnings(validatedEarnings);
          }
        }
      }, 5 * 60 * 1000);

      setSyncInterval(interval);
      return () => clearInterval(interval);
    }
  }, [user?.id, currentEarnings]);


  // Update the useEffect to handle earnings updates more efficiently
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    let syncTimeout: NodeJS.Timeout | null = null;

    const handleEarningsUpdate = async () => {
      if (!isMounted) return;

      try {
        const success = await syncEarnings(user.id, currentEarnings);
        
        if (!success && isMounted) {
          // If sync fails, validate and reset to last known good state
          const { data: lastValidState } = await supabase
            .from('users')
            .select('total_earned')
            .eq('id', user.id)
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
  }, [user?.id, currentEarnings]);

  // Add periodic balance check
  useEffect(() => {
    if (!user?.id) return;

    const checkBalance = async () => {
      await reconcileUserBalance(user.id);
    };

    // Check balance every hour
    const interval = setInterval(checkBalance, 60 * 60 * 1000);
    
    // Initial check
    checkBalance();

    return () => clearInterval(interval);
  }, [user?.id]);

  return useMemo(() => ({
    user,
    isLoading,
    error,
    updateUserData,
    logout,
    telegramUser: telegramData?.user,
    currentEarnings,
    setCurrentEarnings
  }), [user, isLoading, error, updateUserData, logout, telegramData, currentEarnings]);
};

// function getPreviousDay(date: string): string {
//   const d = new Date(date);
//   d.setDate(d.getDate() - 1);
//   return d.toISOString().split('T')[0];
// }
export default useAuth;