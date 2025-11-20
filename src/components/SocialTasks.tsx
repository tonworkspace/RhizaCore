import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Target,
  Flame,
  Award,
  CalendarCheck,
  Check,
  ArrowRight,
  Loader2,
  Gift,
  Send,
  Heart,
  Repeat2,
  MessageCircle,
  UserPlus,
} from 'lucide-react';

// --- Interface Definitions ---
interface Task {
   id: string;
   title: string;
   description: string;
   reward: number;
   type: 'daily_login' | 'twitter_like' | 'twitter_retweet' | 'twitter_comment' | 'twitter_follow' | 'telegram' | 'telegram_community' | 'welcome_bonus' | 'email_verification' | 'facebook' | 'referral_contest';
   status: 'available' | 'completed' | 'claimed';
   icon: string;
   action?: string;
   link?: string;
   currentStreak?: number;
   nextPotentialStreak?: number;
}

interface Props {
  showSnackbar: (config: { message: string; description?: string }) => void;
  userId?: number;
  onRewardClaimed?: (amount: number) => void;
  onNavigateToReferralContest?: () => void;
}

// interface UserBalanceData {
//   balance: number;
//   last_daily_claim_date: string | null;
//   daily_streak_count: number;
// }

const WELCOME_BONUS_AMOUNT = 500;

// X (Twitter) intent links for engagement tasks
// Replace with your tweet ID and handle
const X_TWEET_ID = '1986012576761745602';
const X_HANDLE = 'RhizaCore';

const getXIntentLink = (type: 'like' | 'retweet' | 'comment'): string => {
  if (!X_TWEET_ID) return `https://x.com/${X_HANDLE}`;
  if (type === 'like') return `https://twitter.com/intent/like?tweet_id=${X_TWEET_ID}`;
  if (type === 'retweet') return `https://twitter.com/intent/retweet?tweet_id=${X_TWEET_ID}`;
  return `https://twitter.com/intent/tweet?in_reply_to=${X_TWEET_ID}`;
};

// Helper function to get social task icon component and styling
const getSocialTaskIcon = (type: string) => {
  switch (type) {
    case 'telegram':
    case 'telegram_community':
      return {
        icon: Send,
        bgColor: 'bg-[#0088cc]',
        iconColor: 'text-white',
      };
    case 'twitter_like':
    case 'twitter_retweet':
    case 'twitter_comment':
    case 'twitter_follow':
      return {
        icon: type === 'twitter_like' ? Heart : type === 'twitter_retweet' ? Repeat2 : type === 'twitter_comment' ? MessageCircle : UserPlus,
        bgColor: 'bg-black',
        iconColor: 'text-white',
      };
    case 'facebook':
      return {
        icon: UserPlus,
        bgColor: 'bg-[#1877F2]',
        iconColor: 'text-white',
      };
    default:
      return {
        icon: Gift,
        bgColor: 'bg-green-500/20',
        iconColor: 'text-green-400',
      };
  }
};

// Helper function to check if task is a social task
const isSocialTask = (type: string): boolean => {
  return ['telegram', 'telegram_community', 'twitter_like', 'twitter_retweet', 'twitter_comment', 'twitter_follow', 'facebook'].includes(type);
};

// --- Helper Functions for Streak Logic ---
const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getRewardByStreak = (streak: number): number => {
  // Weekly cycling reward system
  if (streak === 7) return 10000;   // Week 1 milestone
  if (streak === 14) return 15000;  // Week 2 milestone
  if (streak === 21) return 20000;  // Week 3 milestone
  if (streak === 28) return 25000;  // Week 4 milestone
  return 500; // Daily reward for non-milestone days
};

const clampStreakValue = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(30, Math.round(value)));
};

const getDaysSinceDate = (dateString: string | null | undefined): number | null => {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((todayUTC - targetUTC) / (1000 * 60 * 60 * 24));
};

const getGraceAllowance = (streak: number): number => {
  if (streak >= 21) return 2;
  if (streak >= 7) return 1;
  return 0;
};

const calculateSmartStreak = (currentStreak: number, daysSinceLastClaim: number | null): number => {
  const baseStreak = currentStreak || 0;

  // First-time claim
  if (daysSinceLastClaim === null) {
    return clampStreakValue(baseStreak === 0 ? 1 : baseStreak + 1);
  }

  // Already claimed today or future date - return current streak
  if (daysSinceLastClaim <= 0) {
    return clampStreakValue(baseStreak);
  }

  // Consecutive day
  if (daysSinceLastClaim === 1) {
    return clampStreakValue(baseStreak + 1);
  }

  // Missed days logic
  const missedDays = daysSinceLastClaim - 1;
  const graceAllowance = getGraceAllowance(baseStreak);

  // Grace window: allow limited skips with small penalty
  if (missedDays <= graceAllowance) {
    return clampStreakValue(Math.max(1, baseStreak - missedDays));
  }

  // Outside grace: decay streak but don't fully reset
  const penalty = missedDays - graceAllowance;
  const decayed = Math.max(1, Math.floor(baseStreak * Math.pow(0.85, penalty)));
  return clampStreakValue(decayed);
};

// --- Supabase Interaction Functions ---
const claimDailyLoginReward = async (userId: number) => {
  try {
    const todayDateString = getTodayDateString();

    // 1. Fetch current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('last_daily_claim_date, daily_streak_count')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      throw new Error(fetchError?.message || 'User data not found.');
    }

    const { last_daily_claim_date, daily_streak_count } = userData;
    const baseStreak = daily_streak_count || 0;
    const daysSinceLastClaim = last_daily_claim_date ? getDaysSinceDate(last_daily_claim_date) : null;

    if (daysSinceLastClaim !== null && daysSinceLastClaim <= 0) {
      throw new Error('Already claimed today');
    }

    const newStreak = calculateSmartStreak(baseStreak, daysSinceLastClaim);

    const reward = getRewardByStreak(newStreak);

    // 2. Update streak and claim date
    const { error: updateError } = await supabase
      .from('users')
      .update({
        daily_streak_count: newStreak,
        last_daily_claim_date: todayDateString
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 3. Create activity record for RZC claim
    const { error: activityError } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim',
      amount: reward,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (activityError) {
      console.error('Activity record error:', activityError);
      // Don't throw error here, just log it
    }

    // 4. Set localStorage to prevent multiple claims
    const dailyClaimedKey = `daily_claimed_${userId}_${todayDateString}`;
    localStorage.setItem(dailyClaimedKey, 'true');

    return { reward, newStreak };

  } catch (error) {
    console.error('Error claiming daily login:', error);
    throw error;
  }
};

const SocialTasks = ({ showSnackbar, userId, onRewardClaimed, onNavigateToReferralContest }: Props) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ last_daily_claim_date: string | null; daily_streak_count: number } | null>(null);
  const [verificationClicks, setVerificationClicks] = useState<{ [key: string]: number }>({});
  const [requiredClicks, setRequiredClicks] = useState<{ [key: string]: number }>({});
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [userReferralCount, setUserReferralCount] = useState<number>(0);
  const componentRef = useRef<HTMLDivElement>(null);

  // Define available tasks
  const availableTasks: Task[] = [
    {
      id: 'referral_contest',
      title: 'Join Referral Contest',
      description: 'Participate in our referral contest! Invite friends and climb the leaderboard for exclusive rewards',
      reward: 1000,
      type: 'referral_contest',
      status: 'available',
      icon: '🏆',
      action: 'Join Contest'
    },
    {
      id: 'welcome_bonus',
      title: 'Welcome Bonus',
      description: 'Claim your one-time 500 RZC welcome bonus',
      reward: WELCOME_BONUS_AMOUNT,
      type: 'welcome_bonus',
      status: 'available',
      icon: '🎁',
      action: 'Claim'
    },
    {
      id: 'email_verification',
      title: 'Verify Email Address',
      description: 'Submit your email address to verify your account and claim 500 RZC',
      reward: 500,
      type: 'email_verification',
      status: 'available',
      icon: '📧',
      action: 'Verify Email'
    },
    {
      id: 'daily_login',
      title: 'Daily Login Streak',
      description: 'Visit the app daily to maintain your mining streak',
      reward: 10,
      type: 'daily_login',
      status: 'available',
      icon: '🔥'
    },
    {
      id: 'twitter_like',
      title: 'Like Our Post',
      description: 'Show some love! Like our latest post on X (Twitter) and get rewarded',
      reward: 500,
      type: 'twitter_like',
      status: 'available',
      icon: '❤️',
      action: 'Like & Verify',
      link: getXIntentLink('like')
    },
    {
      id: 'twitter_retweet',
      title: 'Share with Friends',
      description: 'Help us grow! Retweet our post to spread the word and earn rewards',
      reward: 500,
      type: 'twitter_retweet',
      status: 'available',
      icon: '🔁',
      action: 'Retweet & Verify',
      link: getXIntentLink('retweet')
    },
    {
      id: 'twitter_comment',
      title: 'Join the Conversation',
      description: 'Share your thoughts! Leave a comment on our post and get rewarded',
      reward: 500,
      type: 'twitter_comment',
      status: 'available',
      icon: '💬',
      action: 'Comment & Verify',
      link: getXIntentLink('comment')
    },
    {
      id: 'twitter_follow',
      title: 'Follow for Updates',
      description: 'Stay connected! Follow @RhizaCore for the latest news and updates',
      reward: 500,
      type: 'twitter_follow',
      status: 'available',
      icon: '🐦',
      action: 'Follow & Verify',
      link: `https://x.com/${X_HANDLE}`
    },
    {
      id: 'telegram',
      title: 'Join Telegram Channel',
      description: 'Be part of the conversation! Join our Telegram channel for discussions',
      reward: 500,
      type: 'telegram',
      status: 'available',
      icon: '✈️',
      action: 'Join & Verify',
      link: 'https://t.me/RhizaCoreNews'
    },
    {
      id: 'telegram_community',
      title: 'Join Telegram Discussion',
      description: 'Connect with fellow members! Join our Telegram community group for networking',
      reward: 500,
      type: 'telegram_community',
      status: 'available',
      icon: '👥',
      action: 'Join & Verify',
      link: 'https://t.me/RhizaCore'
    },
    {
      id: 'facebook',
      title: 'Like Facebook Page',
      description: 'Show your support! Like our Facebook page and join our community',
      reward: 500,
      type: 'facebook',
      status: 'available',
      icon: '👍',
      action: 'Like & Verify',
      link: 'https://web.facebook.com/RhizaCore'
    }
  ];

  useEffect(() => {
    if (userId) {
      loadTaskStatus();
      // Fetch user referral count
      const fetchReferralCount = async () => {
        try {
          const { data, error } = await supabase
            .from('referrals')
            .select('id', { count: 'exact' })
            .eq('sponsor_id', userId)
            .eq('status', 'active');
          
          if (!error && data) {
            setUserReferralCount(data.length || 0);
          }
        } catch (error) {
          console.error('Error fetching referral count:', error);
        }
      };
      fetchReferralCount();
    }
  }, [userId]);

  // Animation optimization: Prevent initial render animations and manage remount state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup animation properties on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (componentRef.current) {
        const element = componentRef.current;
        element.style.willChange = 'auto';
      }
    };
  }, []);

  // Force animation reset on component remount to prevent glitches
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [userId]);

  // Generate random verification clicks for social tasks
  const generateRequiredClicks = (taskId: string): number => {
    const seed = taskId + userId + getTodayDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Generate random number between 3-5
    return Math.abs(hash % 3) + 3;
  };

  const loadTaskStatus = async () => {
    if (!userId) {
      setTasks([]);
      setUserData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const todayDateString = getTodayDateString();
      const tasksDataKey = `daily_tasks_${userId}`;
      const storedTasks = localStorage.getItem(tasksDataKey);
      const tasksData = storedTasks ? JSON.parse(storedTasks) : {};
      const welcomeBonusKey = `welcome_bonus_granted_${userId}`;
      const welcomeBonusGranted = localStorage.getItem(welcomeBonusKey) === 'true';
      const emailVerificationKey = `email_verified_${userId}`;
      const emailVerified = localStorage.getItem(emailVerificationKey) === 'true';
      const referralContestKey = `referral_contest_joined_${userId}`;
      const referralContestJoined = localStorage.getItem(referralContestKey) === 'true';
      const dailyClaimedKey = `daily_claimed_${userId}_${todayDateString}`;
      const hasClaimedToday = localStorage.getItem(dailyClaimedKey) === 'true';

      // Initialize required clicks for social tasks
      const newRequiredClicks: { [key: string]: number } = {};
      availableTasks.forEach(task => {
        if (task.type !== 'daily_login' && task.type !== 'welcome_bonus' && task.type !== 'email_verification') {
          newRequiredClicks[task.id] = generateRequiredClicks(task.id);
        }
      });
      setRequiredClicks(newRequiredClicks);

      // Get completed tasks from database
      const { data: completedTasks } = await supabase
        .from('completed_tasks')
        .select('task_id, completed_at, reward_claimed')
        .eq('user_id', userId);

      const completedTaskIds = new Set(completedTasks?.map(ct => String(ct.task_id)) || []);

      const { data: userDataResponse } = await supabase
        .from('users')
        .select('last_daily_claim_date, daily_streak_count')
        .eq('id', userId)
        .single();

      setUserData(userDataResponse);

      const updatedTasks = availableTasks.map(task => {
        let status: 'available' | 'completed' | 'claimed' = 'available';
        let currentStreak: number = 0;
        let dynamicReward: number = task.reward;

        // Welcome bonus can be claimed only once
        if (task.type === 'welcome_bonus') {
          status = welcomeBonusGranted ? 'claimed' : 'available';
          return { ...task, status };
        }

        // Email verification can be completed only once
        if (task.type === 'email_verification') {
          status = emailVerified ? 'claimed' : 'available';
          return { ...task, status };
        }

        // Referral contest can be joined only once
        if (task.type === 'referral_contest') {
          status = referralContestJoined ? 'claimed' : 'available';
          return { ...task, status };
        }

        if (task.type === 'daily_login' && userDataResponse) {
          const lastClaimedDate = userDataResponse.last_daily_claim_date;
          currentStreak = userDataResponse.daily_streak_count || 0;
          const daysSinceLastClaim = getDaysSinceDate(lastClaimedDate);
          const alreadyClaimed = (lastClaimedDate === todayDateString) || hasClaimedToday;
          let nextPotentialStreak = currentStreak || 1;

          if (alreadyClaimed) {
            status = 'claimed';
            dynamicReward = getRewardByStreak(Math.max(currentStreak || 1, 1));
          } else {
            nextPotentialStreak = calculateSmartStreak(currentStreak, daysSinceLastClaim);
            dynamicReward = getRewardByStreak(nextPotentialStreak);
            status = 'available';
          }

          return {
            ...task,
            status,
            reward: dynamicReward,
            currentStreak,
            nextPotentialStreak,
            description: `Smart streaks use adaptive grace days—claim now to keep momentum and unlock milestone boosts.`
          };
        }

        // For social tasks, check stored status in localStorage and database
        if (isSocialTask(task.type)) {
          const isVerified = tasksData[`${task.type}_verified`] || completedTaskIds.has(task.id);
          status = isVerified ? 'claimed' : 'available';
        }

        return { ...task, status };
      });

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks(availableTasks);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification click for social tasks
  const handleVerificationClick = async (task: Task) => {
    if (task.status === 'claimed') return;

    const currentClicks = verificationClicks[task.id] || 0;
    const required = requiredClicks[task.id] || 3;

    // Prioritize opening the task link first
    if (task.link) {
      window.open(task.link, '_blank');
    }

    // Always increment click count
    const newClicks = currentClicks + 1;
    if (newClicks >= required) {
      // Enough clicks, proceed with verification
      await verifySocialTask(task);
    } else {
      // Increment click count
      setVerificationClicks(prev => ({
        ...prev,
        [task.id]: newClicks
      }));
    }
  };

  // Verify and award social task
  const verifySocialTask = async (task: Task) => {
    if (!userId) return;

    const tasksDataKey = `daily_tasks_${userId}`;
    const storedTasks = localStorage.getItem(tasksDataKey);
    const tasksData = storedTasks ? JSON.parse(storedTasks) : {};

    try {
      if (tasksData[`${task.type}_verified`]) {
        await loadTaskStatus();
        return;
      }

      // Save to completed_tasks table
      const taskIdMap: { [key: string]: number } = {
        'twitter_like': 3,
        'twitter_retweet': 4,
        'twitter_comment': 5,
        'twitter_follow': 6,
        'telegram': 1,
        'telegram_community': 2,
        'facebook': 7
      };

      const taskId = taskIdMap[task.type] || 0;

      if (taskId > 0) {
        const { error: dbError } = await supabase
          .from('completed_tasks')
          .upsert({
            user_id: userId,
            task_id: taskId,
            completed_at: new Date().toISOString(),
            status: 'COMPLETED',
            reward_claimed: true
          }, {
            onConflict: 'user_id,task_id'
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }
      }

      // Add the reward to the user's validated RZC balance by creating a claim activity
      const { error: rzcError } = await supabase.from('activities').insert({
        user_id: userId,
        type: 'rzc_claim',
        amount: task.reward,
        status: 'completed',
        created_at: new Date().toISOString()
      });

      if (rzcError) {
        console.error('RZC Balance update error:', rzcError);
        throw new Error('Failed to update RZC balance');
      }

      tasksData[`${task.type}_verified`] = true;
      localStorage.setItem(tasksDataKey, JSON.stringify(tasksData));

      // Reset verification clicks for this task
      setVerificationClicks(prev => ({
        ...prev,
        [task.id]: 0
      }));

      // Trigger reward callback
      if (onRewardClaimed) {
        onRewardClaimed(task.reward);
      }

      showSnackbar({
        message: '🎉 Task Completed!',
        description: `You earned ${task.reward.toLocaleString()} RZC! Check your airdrop balance.`
      });

      await loadTaskStatus();
    } catch (e) {
      console.error('Social verification failed:', e);
      showSnackbar({
        message: '❌ Error',
        description: 'Failed to verify task. Please try again.'
      });
    }
  };

  const handleClaimTask = async (task: Task) => {
    if (task.status === 'claimed' || isClaiming === task.id) return;

    // Special handling for referral contest - navigate instead of claiming
    if (task.type === 'referral_contest') {
      if (onNavigateToReferralContest) {
        onNavigateToReferralContest();
      }
      return;
    }

    setIsClaiming(task.id);
    setLoadingStates(prev => ({ ...prev, [task.id]: true }));

    try {
      if (task.type === 'daily_login') {
        const result = await claimDailyLoginReward(userId!);
        
        // Trigger reward callback
        if (onRewardClaimed) {
          onRewardClaimed(result.reward);
        }

        showSnackbar({
          message: '🔥 Daily Check-in!',
          description: `You earned ${result.reward.toLocaleString()} RZC! Streak: ${result.newStreak} days`
        });
      } else if (task.type === 'welcome_bonus') {
        const welcomeBonusKey = `welcome_bonus_granted_${userId}`;
        const alreadyGranted = localStorage.getItem(welcomeBonusKey) === 'true';

        if (alreadyGranted) {
          await loadTaskStatus();
          return;
        }

        // Add the reward to the user's validated RZC balance by creating a claim activity
        const { error: rzcError } = await supabase.from('activities').insert({
          user_id: userId,
          type: 'rzc_claim',
          amount: WELCOME_BONUS_AMOUNT,
          status: 'completed',
          created_at: new Date().toISOString()
        });

        if (rzcError) {
          console.error('RZC Balance update error:', rzcError);
          throw new Error('Failed to update RZC balance');
        }

        // Save to completed_tasks table (task_id: -1 for welcome bonus)
        const { error: dbError } = await supabase
          .from('completed_tasks')
          .insert({
            user_id: userId,
            task_id: -1,
            completed_at: new Date().toISOString(),
            status: 'COMPLETED',
            reward_claimed: true
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }

        localStorage.setItem(welcomeBonusKey, 'true');

        // Trigger reward callback
        if (onRewardClaimed) {
          onRewardClaimed(WELCOME_BONUS_AMOUNT);
        }

        showSnackbar({
          message: '🎁 Welcome Bonus!',
          description: `You earned ${WELCOME_BONUS_AMOUNT.toLocaleString()} RZC!`
        });
      } else if (task.type === 'email_verification') {
        const emailVerificationKey = `email_verified_${userId}`;
        const alreadyVerified = localStorage.getItem(emailVerificationKey) === 'true';

        if (alreadyVerified) {
          await loadTaskStatus();
          return;
        }

        const email = emailInput.trim();
        if (!email || !email.includes('@') || !email.includes('.')) {
          showSnackbar({
            message: '❌ Invalid Email',
            description: 'Please enter a valid email address.'
          });
          return;
        }

        // Add the reward to the user's validated RZC balance by creating a claim activity
        const { error: rzcError } = await supabase.from('activities').insert({
          user_id: userId,
          type: 'rzc_claim',
          amount: 5000,
          status: 'completed',
          created_at: new Date().toISOString()
        });

        if (rzcError) {
          console.error('RZC Balance update error:', rzcError);
          throw new Error('Failed to update RZC balance');
        }

        // Update user email
        const { error: updateErr } = await supabase
          .from('users')
          .update({ email: email })
          .eq('id', userId)
          .select();

        if (updateErr) {
          console.error('Email update error:', updateErr);
        }

        localStorage.setItem(emailVerificationKey, 'true');
        setEmailInput('');
        setShowEmailForm(prev => ({ ...prev, [task.id]: false }));

        // Trigger reward callback
        if (onRewardClaimed) {
          onRewardClaimed(5000);
        }

        showSnackbar({
          message: '📧 Email Verified!',
          description: 'You earned 500 RZC for verifying your email!'
        });
      } else if (
        task.type === 'twitter_like' ||
        task.type === 'twitter_retweet' ||
        task.type === 'twitter_comment' ||
        task.type === 'twitter_follow' ||
        task.type === 'telegram' ||
        task.type === 'telegram_community' ||
        task.type === 'facebook'
      ) {
        await handleVerificationClick(task);
      } else {
        setIsClaiming(null);
        return;
      }

      await loadTaskStatus();
    } catch (error) {
      console.error('Error claiming task:', error);
      showSnackbar({
        message: '❌ Error',
        description: (error as Error).message || 'Failed to claim task. Please try again.'
      });
    } finally {
      setIsClaiming(null);
      setLoadingStates(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const getStatusText = (status: string, action?: string) => {
    switch (status) {
      case 'claimed':
        return 'Claimed';
      case 'available':
      case 'completed':
        return action || 'Verify';
      default:
        return 'Verify';
    }
  };

  // Memoize tasks to separate daily login from others and sort by completion status
  const { dailyLoginTask, otherTasks } = useMemo(() => {
    const dailyLoginTask = tasks.find(t => t.type === 'daily_login');
    const otherTasks = tasks
      .filter(t => t.type !== 'daily_login')
      .sort((a, b) => {
        // Sort by status: available/completed first, claimed last
        const statusOrder = { 'available': 0, 'completed': 1, 'claimed': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
    return { dailyLoginTask, otherTasks };
  }, [tasks]);

  const currentStreak = dailyLoginTask?.currentStreak ?? 0;
  const isClaimedToday = dailyLoginTask?.status === 'claimed';
  const projectedStreak = dailyLoginTask?.nextPotentialStreak ?? Math.max(1, currentStreak || 1);
  const nextStreakDay = isClaimedToday ? currentStreak : projectedStreak;
  const streakWillDrop = !isClaimedToday && projectedStreak < currentStreak;
  const projectedDelta = streakWillDrop ? currentStreak - projectedStreak : 0;
  const progressSource = isClaimedToday ? currentStreak : projectedStreak;
  const maxStreakDisplay = 7; // We are showing a 7-day progress
  const displayStreak = currentStreak % maxStreakDisplay; // What to show on the 7-day bar

  // Calculate next milestone and progress
  const getNextMilestone = (streak: number): number => {
    if (streak < 7) return 7;
    if (streak < 14) return 14;
    if (streak < 21) return 21;
    if (streak < 28) return 28;
    return 30; // Max streak
  };

  const nextMilestone = getNextMilestone(currentStreak);
  const daysToNextMilestone = nextMilestone - currentStreak;
  const progressToNextMilestone = Math.min(100, (progressSource / nextMilestone) * 100);

  return (
    <div
      key={animationKey}
      ref={componentRef}
      className={`space-y-3 font-mono ${isInitialRender ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ease-out`}
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* Header Card - Always show */}
      <div className="w-full max-w-md mx-auto">
        <div className="relative overflow-hidden rounded-2xl font-mono
                        bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
                        border border-slate-700/50
                        shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)]
                        backdrop-blur-xl
                        p-5
                        transition-all duration-500 ease-out
                        hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(34,197,94,0.2),0_0_20px_rgba(34,197,94,0.1)]
                        hover:border-slate-600/60
                        hover:scale-[1.01]"
             style={{
               willChange: 'transform, box-shadow, border-color',
               transform: 'translateZ(0)',
               backfaceVisibility: 'hidden'
             }}>
          {/* Professional corner accents */}
          <div className="pointer-events-none absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-slate-600/60 rounded-tl-lg"></div>
          <div className="pointer-events-none absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-slate-600/60 rounded-tr-lg"></div>
          <div className="pointer-events-none absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-slate-600/60 rounded-bl-lg"></div>
          <div className="pointer-events-none absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-slate-600/60 rounded-br-lg"></div>

          {/* Subtle inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 rounded-2xl pointer-events-none"></div>
          <div className="relative z-10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 flex-shrink-0">
              <Gift className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-0.5">Daily Tasks</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Complete community tasks to earn RZC rewards and qualify for airdrop!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {/* Daily Login Skeleton */}
          <div className="relative overflow-hidden rounded-2xl font-mono bg-gradient-to-br from-black via-[#0a0a0f] to-black border border-green-400/20 shadow-[0_0_30px_rgba(34,197,94,0.1)] p-4">
            <div className="animate-pulse space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-green-500/10 rounded w-3/4"></div>
                  <div className="h-3 bg-green-500/10 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-28 h-28 bg-green-500/10 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-green-500/10 rounded w-full"></div>
                <div className="h-3 bg-green-500/10 rounded w-3/4"></div>
                <div className="flex justify-between gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex-1 h-8 bg-green-500/10 rounded-md"></div>
                  ))}
                </div>
              </div>
              <div className="h-10 bg-green-500/10 rounded-lg"></div>
            </div>
          </div>

          {/* Task Skeletons */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl font-mono bg-gradient-to-br from-black via-[#0a0a0f] to-black border border-green-400/20 shadow-[0_0_30px_rgba(34,197,94,0.1)] p-3">
              <div className="animate-pulse flex items-start gap-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-green-500/10 rounded w-3/4"></div>
                  <div className="h-3 bg-green-500/10 rounded w-full"></div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-8 bg-green-500/10 rounded-lg flex-1"></div>
                    <div className="h-6 bg-green-500/10 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Daily Check-in Card --- */}
      {dailyLoginTask && !isLoading && (
        <div className="relative overflow-hidden rounded-2xl font-mono
                        bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
                        border border-slate-700/50
                        shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)]
                        backdrop-blur-xl
                        p-5
                        transition-all duration-500 ease-out
                        hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(34,197,94,0.2),0_0_20px_rgba(34,197,94,0.1)]
                        hover:border-slate-600/60
                        hover:scale-[1.01]"
             style={{
               willChange: 'transform, box-shadow, border-color',
               transform: 'translateZ(0)',
               backfaceVisibility: 'hidden'
             }}>

          {/* Professional corner accents */}
          <div className="pointer-events-none absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-slate-600/60 rounded-tl-lg"></div>
          <div className="pointer-events-none absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-slate-600/60 rounded-tr-lg"></div>
          <div className="pointer-events-none absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-slate-600/60 rounded-bl-lg"></div>
          <div className="pointer-events-none absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-slate-600/60 rounded-br-lg"></div>

          {/* Subtle inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 rounded-2xl pointer-events-none"></div>
          
          {/* Header */}
          <div className="relative z-10 flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 flex-shrink-0">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white mb-0.5">Daily Check-in Task</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {dailyLoginTask.description}
              </p>
            </div>
          </div>
          
          {!isClaimedToday && (
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <span>Current streak:</span>
                <span className="text-white font-semibold">{currentStreak}d</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Next claim:</span>
                <span className={`font-semibold ${streakWillDrop ? 'text-yellow-300' : 'text-green-300'}`}>
                  {projectedStreak}d
                </span>
              </div>
            </div>
          )}

          {streakWillDrop && projectedDelta > 0 && (
            <div className="text-[10px] text-yellow-300 text-center mb-2">
              Missed {projectedDelta} day{projectedDelta === 1 ? '' : 's'} — streak will adjust to {projectedStreak}d.
            </div>
          )}

          {/* Streak Circle */}
          <div className="flex justify-center mb-3">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-green-500/10"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-green-400"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="283"
                  strokeDashoffset={isClaimedToday ? 0 : 283 - (283 * (displayStreak / maxStreakDisplay))}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease-out',
                    willChange: 'stroke-dashoffset'
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-white">
                <Flame className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold mt-0.5">{currentStreak}</span>
                <span className="text-[10px] text-gray-400">Days</span>
              </div>
            </div>
          </div>

          {/* Last Claim Date */}
          {isClaimedToday && userData?.last_daily_claim_date && (
            <div className="text-center mb-2">
              <span className="text-[10px] text-gray-400">
                Last claimed: {new Date(userData.last_daily_claim_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
          
          {/* Challenge Progress */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="text-xs font-semibold text-white">Challenge Progress</h3>
              <span className="text-[10px] font-semibold text-green-400">{currentStreak} / {nextMilestone}</span>
            </div>
            <div className="mb-1.5">
              <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                <span>Day {nextMilestone}</span>
                <span>{daysToNextMilestone} left</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(progressToNextMilestone, 100)}%`,
                    willChange: 'width'
                  }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between gap-1">
              {[...Array(maxStreakDisplay)].map((_, i) => {
                const weekStart = Math.floor((currentStreak - 1) / 7) * 7;
                const day = weekStart + i + 1;
                const isCompleted = day <= currentStreak;
                const isCurrent = day === currentStreak + 1 && !isClaimedToday;
                const isMilestone = day % 7 === 0 && day > 0;
                
                return (
                  <div
                    key={day}
                    className={`flex-1 flex flex-col items-center gap-0.5 p-1 rounded-md transition-all duration-300 ease-out
                                  ${isCompleted ? 'bg-green-500/20 border border-green-500/30' : ''}
                                  ${isCurrent ? 'bg-green-500/10 border border-green-500' : ''}
                                  ${isMilestone && isCompleted ? 'ring-2 ring-yellow-400/50' : ''}
                                  ${!isCompleted && !isCurrent ? 'bg-black/20 border border-gray-700/50' : ''}
                                `}
                        style={{
                          willChange: 'transform, background-color, border-color',
                          transform: 'translateZ(0)',
                          backfaceVisibility: 'hidden'
                        }}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px]
                                    ${isCompleted ? 'bg-green-500 text-black' : ''}
                                    ${isCurrent ? 'bg-green-400 text-black' : ''}
                                    ${isMilestone && isCompleted ? 'bg-yellow-500 text-black' : ''}
                                    ${!isCompleted && !isCurrent ? 'bg-gray-700/50 text-gray-400' : ''}
                                  `}>
                      {day}
                    </div>
                    <span className={`text-[8px] font-medium leading-tight
                                      ${isCompleted ? 'text-green-400' : ''}
                                      ${isCurrent ? 'text-green-300' : ''}
                                      ${isMilestone && isCompleted ? 'text-yellow-400' : ''}
                                      ${!isCompleted && !isCurrent ? 'text-gray-500' : ''}
                                    `}>
                      Day {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Reward */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-gray-700/50 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-400" />
              <span className="text-xs font-semibold text-white">Reward</span>
            </div>
            <span className="text-sm font-bold text-green-400">{dailyLoginTask.reward} RZC</span>
          </div>
          
          {/* Action Button */}
          <button
            onClick={() => handleClaimTask(dailyLoginTask)}
            disabled={isClaimedToday || isClaiming === dailyLoginTask.id}
            className={`w-full px-3 py-2.5 text-sm font-bold rounded-lg
                         border-2 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300/40
                         flex items-center justify-center gap-2 shadow-lg
                         ${isClaimedToday
                           ? 'bg-green-500/15 text-green-300 border-green-500/25 cursor-not-allowed'
                           : 'bg-gradient-to-r from-green-500/20 via-green-400/20 to-emerald-500/20 border-green-400 text-green-300 hover:from-green-500/30 hover:via-green-400/30 hover:to-emerald-500/30 hover:border-green-300 hover:scale-[1.02]'
                         }
                         ${!isClaimedToday ? 'hover:shadow-xl' : ''}`}
            style={{
              willChange: 'transform, background-color, border-color, box-shadow',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            aria-label={`${getStatusText(dailyLoginTask.status, 'Check in')} for Day ${nextStreakDay}`}
          >
            {isClaiming === dailyLoginTask.id ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isClaimedToday ? (
              <>
                <Check className="w-4 h-4" />
                <span>Checked in</span>
              </>
            ) : (
              <>
                <CalendarCheck className="w-4 h-4" />
                <span>Check in Day {nextStreakDay}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
      
      {/* --- Other Tasks --- */}
      {otherTasks.length > 0 && !isLoading && (
        <div className="space-y-0">
          <div className="space-y-2" role="list" aria-label="Additional daily tasks list">
            {otherTasks.map((task) => {
              // Special rendering for referral contest
              if (task.type === 'referral_contest') {
                return (
                  <div
                    key={task.id}
                    className="relative overflow-hidden rounded-2xl font-mono
                                bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
                                border border-purple-500/30
                                shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)]
                                backdrop-blur-xl
                                p-6
                                transition-all duration-500 ease-out
                                hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(147,51,234,0.2),0_0_20px_rgba(147,51,234,0.1)]
                                hover:border-purple-500/50
                                hover:scale-[1.01]">
                    {/* Corner accents */}
                    <div className="pointer-events-none absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-purple-500/40 rounded-tl-lg shadow-[0_0_10px_rgba(147,51,234,0.3)]"></div>
                    <div className="pointer-events-none absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-purple-500/40 rounded-tr-lg shadow-[0_0_10px_rgba(147,51,234,0.3)]"></div>
                    <div className="pointer-events-none absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-purple-500/40 rounded-bl-lg shadow-[0_0_10px_rgba(147,51,234,0.3)]"></div>
                    <div className="pointer-events-none absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg shadow-[0_0_10px_rgba(147,51,234,0.3)]"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Join Referral Contest</h3>
                            <p className="text-sm text-gray-400">Compete for exclusive rewards</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">Prize Pool</div>
                          <div className="text-lg font-bold text-purple-400">10,000 RZC</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="text-xs text-gray-400 mb-1">Your Position</div>
                            <div className="text-lg font-bold text-purple-300">#{userReferralCount > 0 ? Math.floor(Math.random() * 100) + 1 : 'N/A'}</div>
                          </div>
                          <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="text-xs text-gray-400 mb-1">Time Left</div>
                            <div className="text-lg font-bold text-purple-300">7d 12h</div>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            if (onNavigateToReferralContest) {
                              onNavigateToReferralContest();
                            }
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                          Join Contest & Invite Friends
                        </button>

                        <div className="text-xs text-gray-500 text-center">
                          Build your team and climb the leaderboard for amazing rewards!
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const isSocial = isSocialTask(task.type);
              const socialIcon = isSocial ? getSocialTaskIcon(task.type) : null;
              const IconComponent = socialIcon?.icon;
              const hasVerificationProgress = task.type !== 'daily_login' && task.type !== 'welcome_bonus' && task.type !== 'email_verification' && verificationClicks[task.id] > 0 && verificationClicks[task.id] < (requiredClicks[task.id] || 3);
              const isCompleted = verificationClicks[task.id] >= (requiredClicks[task.id] || 3);
              
              // Determine button text
              const getButtonText = () => {
                if (task.status === 'claimed') return 'Claimed';
                if (isClaiming === task.id) return 'Processing...';
                if (isCompleted) return 'Task Completed! 🎉';
                if (hasVerificationProgress) return 'Verify Task Again →';
                if (isSocial) return 'Perform task now →';
                const actionText = task.action || 'Claim';
                return `${actionText} →`;
              };

              // Determine button color for social tasks
              const getButtonStyle = () => {
                if (task.status === 'claimed') {
                  return 'bg-green-500/15 text-green-300 border-green-500/25 cursor-not-allowed';
                }
                if (isSocial) {
                  // Orange/gold for social tasks
                  if (hasVerificationProgress) {
                    return 'bg-gradient-to-r from-orange-500/90 via-orange-400/90 to-amber-500/90 border-orange-400 text-white hover:from-orange-500 hover:via-orange-400 hover:to-amber-500 hover:scale-[1.02] animate-pulse';
                  }
                  return 'bg-gradient-to-r from-orange-500/90 via-orange-400/90 to-amber-500/90 border-orange-400 text-white hover:from-orange-500 hover:via-orange-400 hover:to-amber-500 hover:scale-[1.02]';
                }
                // Green for non-social tasks
                return 'bg-gradient-to-r from-green-500/90 via-green-400/90 to-emerald-500/90 border-green-400 text-black hover:from-green-500 hover:via-green-400 hover:to-emerald-500 hover:scale-[1.02] font-bold';
              };

              if (isSocial) {
                // New Social Task Layout
                return (
                  <div
                    key={task.id}
                    className={`relative overflow-hidden rounded-2xl font-mono
                                bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
                                border border-slate-700/50
                                shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)]
                                backdrop-blur-xl
                                p-4
                                transition-all duration-500 ease-out
                                hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(34,197,94,0.2),0_0_20px_rgba(34,197,94,0.1)]
                                hover:border-slate-600/60
                                hover:scale-[1.02]
                                ${task.status === 'claimed' ? 'opacity-60 hover:opacity-75' : ''}`}
                    style={{
                      willChange: 'transform, box-shadow, border-color',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden'
                    }}
                    role="listitem"
                  >
                    {/* Professional corner accents */}
                    <div className="pointer-events-none absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-slate-600/60 rounded-tl-lg"></div>
                    <div className="pointer-events-none absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-slate-600/60 rounded-tr-lg"></div>
                    <div className="pointer-events-none absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-slate-600/60 rounded-bl-lg"></div>
                    <div className="pointer-events-none absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-slate-600/60 rounded-br-lg"></div>

                    {/* Subtle inner glow for active tasks */}
                    {task.status !== 'claimed' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 rounded-2xl pointer-events-none"></div>
                    )}
                    
                    <div className="relative flex items-start gap-3">
                      {/* Social Icon - Square with rounded corners, colored background */}
                      {IconComponent && (
                        <div className={`flex-shrink-0 w-12 h-12 ${socialIcon.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
                          <IconComponent className={`w-6 h-6 ${socialIcon.iconColor}`} />
                        </div>
                      )}
                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Description */}
                        <h4 className="text-sm font-bold text-white mb-0.5 leading-tight">{task.title}</h4>
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{task.description}</p>
                        {/* Button and Reward Row */}
                        <div className="flex items-center gap-2">
                          {/* Action Button */}
                          <button
                            onClick={() => {
                              if (task.type === 'email_verification' && task.status !== 'claimed') {
                                setShowEmailForm(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                              } else {
                                handleClaimTask(task);
                              }
                            }}
                            disabled={task.status === 'claimed' || isClaiming === task.id}
                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg
                                       border-2 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/40
                                       flex items-center justify-center gap-1.5
                                       ${getButtonStyle()}
                                       shadow-md
                                       ${task.status !== 'claimed' ? 'hover:shadow-lg' : ''}`}
                            style={{
                              willChange: 'transform, background-color, border-color, box-shadow',
                              transform: 'translateZ(0)',
                              backfaceVisibility: 'hidden'
                            }}
                            aria-label={`${getButtonText()} ${task.title}`}
                          >
                            {isClaiming === task.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <span>{getButtonText()}</span>
                            )}
                          </button>
                          {/* Reward Display */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-base font-bold text-white leading-tight">+{task.reward}</div>
                            <div className="text-[10px] font-medium text-gray-400">RZC</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Improved layout for non-social tasks (welcome bonus, email verification)
                return (
                  <div
                    key={task.id}
                    className={`relative overflow-hidden rounded-2xl font-mono
                                bg-gradient-to-br from-black via-[#0a0a0f] to-black
                                border border-green-400/20
                                shadow-[0_0_30px_rgba(34,197,94,0.1)]
                                backdrop-blur-sm
                                p-3
                                transition-all duration-300 ease-out
                                hover:shadow-[0_0_40px_rgba(34,197,94,0.15)]
                                hover:border-green-400/30
                                ${task.status === 'claimed' ? 'opacity-75' : ''}`}
                    style={{
                      willChange: 'transform, box-shadow, border-color',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden'
                    }}
                    role="listitem"
                  >
                    {/* Corner accents with glow */}
                    <div className="pointer-events-none absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-green-400/40 rounded-tl-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                    <div className="pointer-events-none absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-green-400/40 rounded-br-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                    
                    <div className="relative flex items-start gap-3">
                      {/* Task Icon - Larger with green theme */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/40 flex items-center justify-center text-xl shadow-lg">
                        {task.icon}
                      </div>
                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Description */}
                        <h4 className="text-sm font-bold text-white mb-0.5 leading-tight">{task.title}</h4>
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{task.description}</p>
                        {/* Button and Reward Row */}
                        <div className="flex items-center gap-2">
                          {/* Action Button */}
                          <button
                            onClick={() => {
                              if (task.type === 'email_verification' && task.status !== 'claimed') {
                                setShowEmailForm(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                              } else {
                                handleClaimTask(task);
                              }
                            }}
                            disabled={task.status === 'claimed' || isClaiming === task.id}
                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg
                                       border-2 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300/40
                                       flex items-center justify-center gap-1.5
                                       ${getButtonStyle()}
                                       shadow-md
                                       ${task.status !== 'claimed' ? 'hover:shadow-lg' : ''}`}
                            style={{
                              willChange: 'transform, background-color, border-color, box-shadow',
                              transform: 'translateZ(0)',
                              backfaceVisibility: 'hidden'
                            }}
                            aria-label={`${getStatusText(task.status, task.action)} ${task.title}`}
                          >
                            {loadingStates[task.id] || isClaiming === task.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : task.status === 'claimed' ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Claimed</span>
                              </>
                            ) : (
                              <span>{getButtonText()}</span>
                            )}
                          </button>
                          {/* Reward Display */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-base font-bold text-white leading-tight">+{task.reward}</div>
                            <div className="text-[10px] font-medium text-gray-400">RZC</div>
                          </div>
                        </div>
                        {/* Email Form for Email Verification Task */}
                        {task.type === 'email_verification' && showEmailForm[task.id] && task.status !== 'claimed' && (
                          <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-black/60 via-gray-900/60 to-black/60 border border-green-400/40 shadow-lg backdrop-blur-sm">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-[10px] font-medium text-green-300">Enter your email to verify</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="email"
                                  value={emailInput}
                                  onChange={(e) => setEmailInput(e.target.value)}
                                  placeholder="your.email@example.com"
                                  className="w-full px-3 py-2 text-xs bg-black/70 border border-green-400/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition-all duration-200"
                                />
                                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                                  <svg className="w-3.5 h-3.5 text-green-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleClaimTask(task)}
                                  disabled={!emailInput.trim() || isClaiming === task.id}
                                  className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-black hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                  style={{
                                    willChange: 'transform, background-color, box-shadow',
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden'
                                  }}
                                >
                                  {isClaiming === task.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Verifying...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>Verify & Claim</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowEmailForm(prev => ({ ...prev, [task.id]: false }));
                                    setEmailInput('');
                                  }}
                                  className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-700/60 text-gray-300 hover:bg-gray-600/70 hover:text-white transition-all duration-200 ease-out border border-gray-600/40"
                                  style={{
                                    willChange: 'transform, background-color, color',
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Info Banner */}
      {!isLoading && (
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-400/20">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-[10px] font-medium text-green-300 mb-0.5">Task Rewards & Streaks</p>
              <p className="text-[9px] text-green-300/70">
                Complete daily login to build your streak. Reach a 30-day streak for the maximum reward!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialTasks;