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
    if (!telegramData?.user) {
      setError('Please open this app in Telegram');
      setIsLoading(false);
      return;
    }

    try {
      const telegramUser = telegramData.user;
      const telegramId = String(telegramUser.id);

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
        .single();

      // Handle user creation if needed
      if (fetchError && fetchError.code === 'PGRST116') { // No rows found
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

        // Create new user with better error handling
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([newUserData])
          .select(`
            *,
            referrer:users!referrer_id(
              username,
              rank
            )
          `)
          .single();

        if (createError) {
          console.error('Detailed create error:', {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint
          });
          throw new Error(`Failed to create new user: ${createError.message}`);
        }

        if (!newUser) {
          throw new Error('No user data returned after creation');
        }

        // Set the newly created user
        setUser({
          ...newUser,
          login_streak: 0,
          last_login_date: new Date().toISOString()
        });
        
      } else if (fetchError) {
        // Handle other fetch errors
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
          // Fetch fresh user data with referrer info
          const { data } = await supabase
            .from('users')
            .select(`
              *,
              referrer:users!users_referrer_id_fkey (
                username,
                rank
              )
            `)
            .eq('telegram_id', user.telegram_id)
            .single();

          if (data) {
            const authUser: AuthUser = {
              ...data,
              referrer_username: data.referrer?.username,
              referrer_rank: data.referrer?.rank,
              login_streak: data.login_streak || 0,
              last_login_date: data.last_login_date
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

        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(updatedData)
          .eq('id', user.id)
          .select(`
            *,
            referrer:users(
              username,
              rank
            )
          `)
          .single();

        if (error) throw error;

        setUser(prev => ({
          ...prev,
          ...updatedUser,
          lastUpdate: new Date().toISOString()
        }));

      } catch (error) {
        console.error('Update failed:', error);
      }
    }, 500));
  }, [user?.id, debounceTimer]);

  const logout = useCallback(() => {
    console.log('Logging out user:', user?.telegram_id);
    setUser(null);
  }, [user]);

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