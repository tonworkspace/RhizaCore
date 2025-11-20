import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface DailyRewardStatus {
  can_claim: boolean;
  current_streak: number;
  longest_streak: number;
  total_days_claimed: number;
  next_claim_time: string;
  last_claim_date: string | null;
  next_reward_amount: number;
}

interface DailyRewardCardProps {
  userId?: number;
  onRewardClaimed?: (amount: number) => void;
  showSnackbar?: (data: { message: string; description?: string }) => void;
  variant?: 'default' | 'compact' | 'mini';
}

export default function DailyRewardCard({ userId, onRewardClaimed, showSnackbar, variant = 'default' }: DailyRewardCardProps) {
  const [rewardStatus, setRewardStatus] = useState<DailyRewardStatus | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Load daily reward status
  useEffect(() => {
    if (!userId) return;
    
    const loadRewardStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_daily_reward_status', {
          p_user_id: userId
        });
        
        if (error) {
          console.error('Error loading daily reward status:', error);
          showSnackbar?.({
            message: '⚠️ Error',
            description: 'Failed to load daily reward status. Please refresh.'
          });
          return;
        }
        
        // Handle JSON response - Supabase RPC may return JSON as string or object
        let statusData = data;
        if (typeof data === 'string') {
          try {
            statusData = JSON.parse(data);
          } catch (parseError) {
            console.error('Error parsing daily reward status:', parseError);
            return;
          }
        }
        
        // Validate the response structure
        if (statusData && typeof statusData === 'object') {
          setRewardStatus(statusData as DailyRewardStatus);
        } else {
          console.error('Invalid daily reward status format:', statusData);
        }
      } catch (error) {
        console.error('Error loading daily reward status:', error);
        showSnackbar?.({
          message: '⚠️ Error',
          description: 'Failed to load daily reward status. Please try again.'
        });
      }
    };

    loadRewardStatus();
    
    // Update every minute to refresh countdown
    const interval = setInterval(loadRewardStatus, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Update countdown timer
  useEffect(() => {
    if (!rewardStatus?.next_claim_time) {
      setTimeUntilNext('');
      return;
    }

    const updateCountdown = () => {
      try {
        const now = new Date();
        // Handle both string and Date object formats
        const nextClaimStr = rewardStatus.next_claim_time;
        const nextClaim = typeof nextClaimStr === 'string' 
          ? new Date(nextClaimStr)
          : new Date(nextClaimStr);
        
        // Check if date is valid
        if (isNaN(nextClaim.getTime())) {
          console.error('Invalid next_claim_time:', nextClaimStr);
          setTimeUntilNext('Invalid time');
          return;
        }

        const diff = nextClaim.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeUntilNext('Ready to claim!');
          // If ready to claim, refresh the status
          if (rewardStatus && !rewardStatus.can_claim) {
            // Trigger a refresh by calling the load function
            const loadRewardStatus = async () => {
              try {
                const { data, error } = await supabase.rpc('get_daily_reward_status', {
                  p_user_id: userId
                });
                if (!error && data) {
                  let statusData = data;
                  if (typeof data === 'string') {
                    statusData = JSON.parse(data);
                  }
                  if (statusData && typeof statusData === 'object') {
                    setRewardStatus(statusData as DailyRewardStatus);
                  }
                }
              } catch (e) {
                console.error('Error refreshing reward status:', e);
              }
            };
            loadRewardStatus();
          }
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeUntilNext(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } catch (error) {
        console.error('Error updating countdown:', error);
        setTimeUntilNext('Error');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [rewardStatus?.next_claim_time, rewardStatus?.can_claim, userId]);

  const handleClaimReward = async () => {
    if (!userId || isClaiming || !rewardStatus?.can_claim) return;

    setIsClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error claiming daily reward:', error);
        showSnackbar?.({
          message: '❌ Error',
          description: error.message || 'Failed to claim daily reward. Please try again.'
        });
        setIsClaiming(false);
        return;
      }

      // Handle JSON response - Supabase RPC may return JSON as string or object
      let claimData = data;
      if (typeof data === 'string') {
        try {
          claimData = JSON.parse(data);
        } catch (parseError) {
          console.error('Error parsing claim response:', parseError);
          showSnackbar?.({
            message: '❌ Error',
            description: 'Invalid response from server. Please try again.'
          });
          setIsClaiming(false);
          return;
        }
      }

      if (claimData && claimData.success) {
        // Step 1: Show celebration immediately
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);

        // Step 2: Trigger reward callback first (for balance updates)
        if (onRewardClaimed && claimData.reward_amount) {
          onRewardClaimed(claimData.reward_amount);
        }

        // Step 3: Optimistically update UI with server response data
        const todayDate = new Date().toISOString().split('T')[0];
        setRewardStatus(prev => {
          if (!prev) return null;
          
          const newStreak = claimData.streak_count || 1;
          const newLongestStreak = Math.max(prev.longest_streak, newStreak);
          
          return {
            ...prev,
            can_claim: false,
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            total_days_claimed: prev.total_days_claimed + 1,
            last_claim_date: todayDate,
            next_claim_time: claimData.next_claim_time || prev.next_claim_time,
            next_reward_amount: prev.next_reward_amount // Will be updated by refresh
          };
        });

        // Step 4: Show success message
        showSnackbar?.({
          message: '🎉 Daily Reward Claimed!',
          description: `You earned ${(claimData.reward_amount || 0).toLocaleString()} RZC! Streak: ${claimData.streak_count || 1} days`
        });

        // Step 5: Refresh status from server to get accurate next_claim_time and next_reward_amount
        // This ensures the UI matches the database state exactly
        try {
          const { data: statusData, error: statusError } = await supabase.rpc('get_daily_reward_status', {
            p_user_id: userId
          });
          
          if (!statusError && statusData) {
            // Handle JSON response
            let refreshedStatus = statusData;
            if (typeof statusData === 'string') {
              try {
                refreshedStatus = JSON.parse(statusData);
              } catch (parseError) {
                console.error('Error parsing refreshed status:', parseError);
                // Continue with optimistic update if parse fails
              }
            }
            
            if (refreshedStatus && typeof refreshedStatus === 'object') {
              setRewardStatus(refreshedStatus as DailyRewardStatus);
            }
          } else if (statusError) {
            console.error('Error refreshing status after claim:', statusError);
            // Don't show error to user - claim was successful, just refresh failed
          }
        } catch (e) {
          console.error('Failed to refresh daily reward status after claim:', e);
          // Don't show error to user - claim was successful, just refresh failed
        }

        // Step 6: Update user's last_update timestamp (non-critical, don't block on this)
        (async () => {
          try {
            const { error } = await supabase
              .from('users')
              .update({ last_update: new Date().toISOString() })
              .eq('id', userId);
            if (error) {
              console.error('Failed to update users.last_update:', error);
            }
          } catch (e) {
            console.error('Failed to update users.last_update:', e);
          }
        })();
      } else {
        // Claim failed or already claimed
        showSnackbar?.({
          message: '⚠️ Already Claimed',
          description: claimData?.message || 'Daily reward already claimed today!'
        });
      }
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      showSnackbar?.({
        message: '❌ Error',
        description: 'Failed to claim daily reward. Please try again.'
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 21) return '🔥🔥';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '✨';
    return '🌟';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-red-500';
    if (streak >= 21) return 'text-orange-500';
    if (streak >= 14) return 'text-yellow-500';
    if (streak >= 7) return 'text-blue-500';
    if (streak >= 3) return 'text-green-500';
    return 'text-gray-500';
  };

  const getMultiplierText = (streak: number) => {
    if (streak >= 30) return '3.0x MEGA BONUS!';
    if (streak >= 21) return '2.5x SUPER BONUS!';
    if (streak >= 14) return '2.0x BIG BONUS!';
    if (streak >= 7) return '1.5x BONUS!';
    return '1.0x BASE REWARD';
  };

  // Mini variant - extremely compact
  if (variant === 'mini') {
    if (!rewardStatus) {
      return (
      <div className="relative p-4 rounded-lg bg-white border-2 border-slate-300 shadow-sm" style={{borderImage: 'linear-gradient(90deg, #e2e8f0, #cbd5e1, #94a3b8, #cbd5e1, #e2e8f0) 1'}}>
          <div className="h-16 bg-slate-200 rounded"></div>
        </div>
      );
    }

    return (
      <div className="relative p-4 rounded-lg bg-white border-2 border-slate-300 shadow-sm" style={{borderImage: 'linear-gradient(90deg, #e2e8f0, #cbd5e1, #94a3b8, #cbd5e1, #e2e8f0) 1'}}>
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50">
            <div className="absolute top-0 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-bounce delay-0"></div>
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-red-400 rounded-full animate-bounce delay-100"></div>
            <div className="absolute top-0 left-3/4 w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-200"></div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs">🎁</span>
              </div>
              <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${rewardStatus.can_claim ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Daily Reward</div>
              <div className="text-xs text-slate-500">{getStreakEmoji(rewardStatus.current_streak)} {rewardStatus.current_streak} streak</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900">
              {rewardStatus.can_claim ? rewardStatus.next_reward_amount.toLocaleString() : '1,000'}
            </div>
            <div className="text-xs text-blue-600">RZC</div>
          </div>
        </div>

        {rewardStatus.can_claim ? (
          <button
            onClick={handleClaimReward}
            disabled={isClaiming}
            className="w-full mt-2 py-1.5 px-2 rounded text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50 transition-all duration-200"
          >
            {isClaiming ? 'Claiming...' : '🎁 CLAIM'}
          </button>
        ) : (
          <div className="mt-2 text-center">
            <div className="text-xs font-semibold text-slate-600">Next: {timeUntilNext}</div>
          </div>
        )}
      </div>
    );
  }

  if (!rewardStatus) {
    return (
      <div className="relative">
        <div className="relative p-3 rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse">
          <div className="h-24 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-0"></div>
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-red-400 rounded-full animate-bounce delay-100"></div>
          <div className="absolute top-0 left-3/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
          <div className="absolute top-0 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-bounce delay-300"></div>
          <div className="absolute top-0 left-2/3 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-400"></div>
        </div>
      )}

<div className="relative p-4 rounded-lg bg-white border-2 border-slate-300 shadow-sm" style={{borderImage: 'linear-gradient(90deg, #e2e8f0, #cbd5e1, #94a3b8, #cbd5e1, #e2e8f0) 1'}}>
        
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                <span className="text-lg">🎁</span>
              </div>
              <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border border-white ${rewardStatus.can_claim ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Daily Bonus</div>
              <div className="text-sm font-bold text-slate-900">Free RZC</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-base font-bold ${getStreakColor(rewardStatus.current_streak)}`}>
              {getStreakEmoji(rewardStatus.current_streak)} {rewardStatus.current_streak}
            </div>
            <div className="text-xs text-slate-500">Day Streak</div>
          </div>
        </div>

        {/* Compact Progress & Reward */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-700">30-Day Challenge</span>
            <span className="text-xs text-slate-500">{rewardStatus.total_days_claimed}/30</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min((rewardStatus.total_days_claimed / 30) * 100, 100)}%` }}
            ></div>
          </div>
          
          {/* Inline Reward Display */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-lg font-black text-slate-900">
                {rewardStatus.can_claim ? rewardStatus.next_reward_amount.toLocaleString() : '1,000'}
              </div>
              <div className="text-xs font-bold text-blue-600">RZC</div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-semibold ${rewardStatus.current_streak >= 7 ? 'text-green-600' : 'text-slate-600'}`}>
                {getMultiplierText(rewardStatus.current_streak)}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Claim Button or Countdown */}
        {/* <div className="mb-3">
          {rewardStatus.can_claim ? (
            <button
              onClick={handleClaimReward}
              disabled={isClaiming}
              className="w-full py-2.5 px-3 rounded-lg font-bold text-white transition-all duration-200 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
            >
              {isClaiming ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Claiming...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>🎁</span>
                  <span>CLAIM REWARD</span>
                  <span>🎁</span>
                </div>
              )}
            </button>
          ) : (
            <div className="w-full py-2.5 px-3 rounded-lg bg-slate-100 border border-slate-200">
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-600 mb-1">Next Reward In:</div>
                <div className="text-base font-bold text-slate-900 font-mono">{timeUntilNext}</div>
                <div className="text-xs text-slate-500">Continue your streak!</div>
              </div>
            </div>
          )}
        </div> */}

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-semibold uppercase">Best</div>
            <div className="text-sm font-bold text-orange-600">{rewardStatus.longest_streak}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-semibold uppercase">Total</div>
            <div className="text-sm font-bold text-blue-600">{rewardStatus.total_days_claimed}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-semibold uppercase">Days Left</div>
            <div className="text-sm font-bold text-purple-600">{30 - rewardStatus.total_days_claimed}</div>
          </div>
        </div>

        {/* Compact Motivational Message */}
        <div className="text-center">
          {rewardStatus.current_streak === 0 && (
            <div className="text-xs text-slate-600">🌟 Start your streak today!</div>
          )}
          {rewardStatus.current_streak >= 1 && rewardStatus.current_streak < 7 && (
            <div className="text-xs text-blue-600 font-semibold">⚡ 7 days = 1.5x bonus!</div>
          )}
          {rewardStatus.current_streak >= 7 && rewardStatus.current_streak < 14 && (
            <div className="text-xs text-green-600 font-semibold">🔥 14 days = 2.0x bonus!</div>
          )}
          {rewardStatus.current_streak >= 14 && rewardStatus.current_streak < 21 && (
            <div className="text-xs text-yellow-600 font-semibold">🔥🔥 21 days = 2.5x bonus!</div>
          )}
          {rewardStatus.current_streak >= 21 && rewardStatus.current_streak < 30 && (
            <div className="text-xs text-orange-600 font-semibold">🔥🔥🔥 30 days = 3.0x MEGA!</div>
          )}
          {rewardStatus.current_streak >= 30 && (
            <div className="text-xs text-red-600 font-bold animate-pulse">🏆 MEGA LEGEND!</div>
          )}
        </div>
      </div>
    </div>
  );
}

