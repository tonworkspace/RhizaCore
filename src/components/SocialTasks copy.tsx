import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  CalendarCheck,
  Check,
  Loader2,
  Gift,
  Send,
  Heart,
  Repeat2,
  MessageCircle,
  UserPlus,
  Users,
  Twitter,
  Flame
} from 'lucide-react';

// --- Interface Definitions ---
interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'daily_login' | 'twitter_like' | 'twitter_retweet' | 'twitter_comment' | 'twitter_follow' | 'telegram' | 'telegram_community' | 'welcome_bonus' | 'email_verification' | 'facebook' | 'referral_contest';
  status: 'available' | 'completed' | 'claimed';
  icon: any; // Lucide Icon component
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

// --- Configuration ---
const WELCOME_BONUS_AMOUNT = 500;
const X_TWEET_ID = '1986012576761745602';
const X_HANDLE = 'RhizaCore';

// --- Logic Helpers ---
const getXIntentLink = (type: 'like' | 'retweet' | 'comment'): string => {
  if (!X_TWEET_ID) return `https://x.com/${X_HANDLE}`;
  if (type === 'like') return `https://twitter.com/intent/like?tweet_id=${X_TWEET_ID}`;
  if (type === 'retweet') return `https://twitter.com/intent/retweet?tweet_id=${X_TWEET_ID}`;
  return `https://twitter.com/intent/tweet?in_reply_to=${X_TWEET_ID}`;
};

const getRewardByStreak = (streak: number): number => {
  if (streak % 7 === 0) return 10000;
  return 500;
};

const clampStreakValue = (value: number): number => Math.max(1, Math.min(30, Math.round(value || 1)));

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getDaysSinceDate = (dateString: string | null | undefined): number | null => {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((todayUTC - targetUTC) / (1000 * 60 * 60 * 24));
};

const calculateSmartStreak = (currentStreak: number, daysSinceLastClaim: number | null): number => {
  const baseStreak = currentStreak || 0;
  if (daysSinceLastClaim === null) return clampStreakValue(baseStreak === 0 ? 1 : baseStreak + 1);
  if (daysSinceLastClaim <= 0) return clampStreakValue(baseStreak);
  if (daysSinceLastClaim === 1) return clampStreakValue(baseStreak + 1);
  
  const missedDays = daysSinceLastClaim - 1;
  const graceAllowance = baseStreak >= 21 ? 2 : baseStreak >= 7 ? 1 : 0;
  
  if (missedDays <= graceAllowance) return clampStreakValue(Math.max(1, baseStreak - missedDays));
  
  const penalty = missedDays - graceAllowance;
  const decayed = Math.max(1, Math.floor(baseStreak * Math.pow(0.85, penalty)));
  return clampStreakValue(decayed);
};

const isSocialTask = (type: string): boolean => {
  return ['telegram', 'telegram_community', 'twitter_like', 'twitter_retweet', 'twitter_comment', 'twitter_follow', 'facebook'].includes(type);
};

// --- API Functions ---
const claimDailyLoginReward = async (userId: number) => {
  const todayDateString = getTodayDateString();
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('last_daily_claim_date, daily_streak_count')
    .eq('id', userId)
    .single();

  if (fetchError || !userData) throw new Error(fetchError?.message || 'User data not found.');

  const { last_daily_claim_date, daily_streak_count } = userData;
  const baseStreak = daily_streak_count || 0;
  const daysSinceLastClaim = last_daily_claim_date ? getDaysSinceDate(last_daily_claim_date) : null;

  if (daysSinceLastClaim !== null && daysSinceLastClaim <= 0) throw new Error('Already claimed today');

  const newStreak = calculateSmartStreak(baseStreak, daysSinceLastClaim);
  const reward = getRewardByStreak(newStreak);

  const { error: updateError } = await supabase
    .from('users')
    .update({ daily_streak_count: newStreak, last_daily_claim_date: todayDateString })
    .eq('id', userId);

  if (updateError) throw updateError;

  await supabase.from('activities').insert({
    user_id: userId,
    type: 'rzc_claim',
    amount: reward,
    status: 'completed',
    created_at: new Date().toISOString()
  });

  const dailyClaimedKey = `daily_claimed_${userId}_${todayDateString}`;
  localStorage.setItem(dailyClaimedKey, 'true');

  return { reward, newStreak };
};

const SocialTasks = ({ showSnackbar, userId, onRewardClaimed, onNavigateToReferralContest }: Props) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [verificationClicks, setVerificationClicks] = useState<{ [key: string]: number }>({});
  const [requiredClicks, setRequiredClicks] = useState<{ [key: string]: number }>({});
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const availableTasks: Task[] = [
    { id: 'referral_contest', title: 'Join Referral Contest', description: 'Invite friends & climb leaderboard', reward: 1000, type: 'referral_contest', status: 'available', icon: Users, action: 'Join' },
    { id: 'welcome_bonus', title: 'Welcome Bonus', description: 'Claim your starter RZC', reward: WELCOME_BONUS_AMOUNT, type: 'welcome_bonus', status: 'available', icon: Gift, action: 'Claim' },
    { id: 'email_verification', title: 'Verify Email', description: 'Secure your account', reward: 500, type: 'email_verification', status: 'available', icon: Send, action: 'Verify' },
    { id: 'daily_login', title: 'Daily Mining Streak', description: 'Keep streak for bonuses', reward: 10, type: 'daily_login', status: 'available', icon: Flame },
    { id: 'twitter_like', title: 'Like on X', description: 'Like our latest post', reward: 500, type: 'twitter_like', status: 'available', icon: Heart, link: getXIntentLink('like') },
    { id: 'twitter_retweet', title: 'Retweet', description: 'Spread the word', reward: 500, type: 'twitter_retweet', status: 'available', icon: Repeat2, link: getXIntentLink('retweet') },
    { id: 'twitter_comment', title: 'Comment on X', description: 'Join the discussion', reward: 500, type: 'twitter_comment', status: 'available', icon: MessageCircle, link: getXIntentLink('comment') },
    { id: 'twitter_follow', title: 'Follow RhizaCore', description: 'Stay updated', reward: 500, type: 'twitter_follow', status: 'available', icon: Twitter, link: `https://x.com/${X_HANDLE}` },
    { id: 'telegram', title: 'Telegram Channel', description: 'Join for news', reward: 500, type: 'telegram', status: 'available', icon: Send, link: 'https://t.me/RhizaCoreNews' },
    { id: 'telegram_community', title: 'Telegram Group', description: 'Join community chat', reward: 500, type: 'telegram_community', status: 'available', icon: Users, link: 'https://t.me/RhizaCore' },
    { id: 'facebook', title: 'Facebook Page', description: 'Like our page', reward: 500, type: 'facebook', status: 'available', icon: UserPlus, link: 'https://web.facebook.com/RhizaCore' }
  ];

  useEffect(() => {
    if (userId) loadTaskStatus();
  }, [userId]);

  const loadTaskStatus = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const todayDateString = getTodayDateString();
      const tasksDataKey = `daily_tasks_${userId}`;
      const storedTasks = localStorage.getItem(tasksDataKey);
      const tasksData = storedTasks ? JSON.parse(storedTasks) : {};
      const welcomeBonusGranted = localStorage.getItem(`welcome_bonus_granted_${userId}`) === 'true';
      const emailVerified = localStorage.getItem(`email_verified_${userId}`) === 'true';
      const referralContestJoined = localStorage.getItem(`referral_contest_joined_${userId}`) === 'true';
      const hasClaimedToday = localStorage.getItem(`daily_claimed_${userId}_${todayDateString}`) === 'true';

      const newRequiredClicks: { [key: string]: number } = {};
      availableTasks.forEach(task => {
         if (['daily_login', 'welcome_bonus', 'email_verification'].indexOf(task.type) === -1) {
             const seed = task.id + userId + todayDateString;
             let hash = 0;
             for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
             newRequiredClicks[task.id] = Math.abs(hash % 3) + 3; 
         }
      });
      setRequiredClicks(newRequiredClicks);

      const { data: completedTasks } = await supabase
        .from('completed_tasks')
        .select('task_id')
        .eq('user_id', userId);
      
      const completedTaskIds = new Set(completedTasks?.map(ct => String(ct.task_id)) || []);

      const { data: userDataResponse } = await supabase
        .from('users')
        .select('last_daily_claim_date, daily_streak_count')
        .eq('id', userId)
        .single();

      const updatedTasks: Task[] = availableTasks.map(task => {
        if (task.type === 'welcome_bonus') {
            return { ...task, status: welcomeBonusGranted ? 'claimed' : 'available' };
        }
        if (task.type === 'email_verification') {
            return { ...task, status: emailVerified ? 'claimed' : 'available' };
        }
        if (task.type === 'referral_contest') {
            return { ...task, status: referralContestJoined ? 'claimed' : 'available' };
        }
        
        if (task.type === 'daily_login' && userDataResponse) {
             const currentStreak = userDataResponse.daily_streak_count || 0;
             const daysSinceLastClaim = getDaysSinceDate(userDataResponse.last_daily_claim_date);
             const alreadyClaimed = (userDataResponse.last_daily_claim_date === todayDateString) || hasClaimedToday;
             
             let status: 'available' | 'claimed' = 'available';
             let dynamicReward = task.reward;
             
             if (alreadyClaimed) {
                 status = 'claimed';
                 dynamicReward = getRewardByStreak(Math.max(currentStreak, 1));
             } else {
                 const nextStreak = calculateSmartStreak(currentStreak, daysSinceLastClaim);
                 dynamicReward = getRewardByStreak(nextStreak);
             }
             
             return {
                 ...task,
                 status: status as 'available' | 'claimed',
                 reward: dynamicReward,
                 currentStreak: currentStreak,
                 nextPotentialStreak: alreadyClaimed ? currentStreak : calculateSmartStreak(currentStreak, daysSinceLastClaim)
             };
        }

        if (isSocialTask(task.type)) {
            const isVerified = tasksData[`${task.type}_verified`] || completedTaskIds.has(task.id);
            return { ...task, status: isVerified ? 'claimed' : 'available' };
        }

        return { ...task, status: 'available' };
      });

      setTasks(updatedTasks.sort((a, b) => {
          const scoreA = a.status === 'available' ? 0 : 1;
          const scoreB = b.status === 'available' ? 0 : 1;
          return scoreA - scoreB;
      }));

    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerificationClick = async (task: Task) => {
    if (task.status === 'claimed') return;
    
    if (task.link && verificationClicks[task.id] !== -1) {
        window.open(task.link, '_blank');
    }

    const currentClicks = verificationClicks[task.id] || 0;
    const required = requiredClicks[task.id] || 3;
    const newClicks = currentClicks + 1;

    setVerificationClicks(prev => ({ ...prev, [task.id]: newClicks }));

    if (newClicks >= required) {
        await verifySocialTask(task);
    }
  };

  const verifySocialTask = async (task: Task) => {
    try {
        const taskIdMap: { [key: string]: number } = { 'twitter_like': 3, 'twitter_retweet': 4, 'twitter_comment': 5, 'twitter_follow': 6, 'telegram': 1, 'telegram_community': 2, 'facebook': 7 };
        const taskId = taskIdMap[task.type] || 0;

        if (taskId > 0) {
            await supabase.from('completed_tasks').upsert({ user_id: userId, task_id: taskId, completed_at: new Date().toISOString(), status: 'COMPLETED', reward_claimed: true }, { onConflict: 'user_id,task_id' });
        }
        
        await supabase.from('activities').insert({ user_id: userId, type: 'rzc_claim', amount: task.reward, status: 'completed' });

        const tasksDataKey = `daily_tasks_${userId}`;
        const stored = localStorage.getItem(tasksDataKey);
        const data = stored ? JSON.parse(stored) : {};
        data[`${task.type}_verified`] = true;
        localStorage.setItem(tasksDataKey, JSON.stringify(data));

        if (onRewardClaimed) onRewardClaimed(task.reward);
        showSnackbar({ message: 'Task Completed!', description: `Earned ${task.reward} RZC` });
        
        await loadTaskStatus();
        setVerificationClicks(prev => ({...prev, [task.id]: 0}));
    } catch (e) {
        console.error(e);
        showSnackbar({ message: 'Error', description: 'Failed to verify' });
    }
  };

  const handleAction = async (task: Task) => {
      if (task.status === 'claimed') return;
      if (task.type === 'referral_contest') {
          onNavigateToReferralContest?.();
          return;
      }
      if (task.type === 'email_verification') {
          setShowEmailForm(prev => ({ ...prev, [task.id]: !prev[task.id] }));
          return;
      }

      setIsClaiming(task.id);

      try {
          if (task.type === 'daily_login') {
              const res = await claimDailyLoginReward(userId!);
              if (onRewardClaimed) onRewardClaimed(res.reward);
              showSnackbar({ message: 'Daily Check-in!', description: `Streak: ${res.newStreak} days` });
              await loadTaskStatus();
          } else if (task.type === 'welcome_bonus') {
              localStorage.setItem(`welcome_bonus_granted_${userId}`, 'true');
              await supabase.from('activities').insert({ user_id: userId, type: 'rzc_claim', amount: task.reward, status: 'completed' });
              if (onRewardClaimed) onRewardClaimed(task.reward);
              showSnackbar({ message: 'Welcome Bonus!', description: `Earned ${task.reward} RZC` });
              await loadTaskStatus();
          } else if (isSocialTask(task.type)) {
              await handleVerificationClick(task);
          }
      } catch (e: any) {
          showSnackbar({ message: 'Error', description: e.message });
      } finally {
          setIsClaiming(null);
      }
  };

  const handleEmailSubmit = async (task: Task) => {
      if (!emailInput.includes('@')) return showSnackbar({message: 'Invalid Email'});
      setIsClaiming(task.id);
      try {
          await supabase.from('users').update({ email: emailInput }).eq('id', userId);
          await supabase.from('activities').insert({ user_id: userId, type: 'rzc_claim', amount: 5000, status: 'completed' });
          localStorage.setItem(`email_verified_${userId}`, 'true');
          if (onRewardClaimed) onRewardClaimed(5000);
          showSnackbar({ message: 'Email Verified!', description: 'Earned 5000 RZC' });
          setEmailInput('');
          setShowEmailForm(prev => ({ ...prev, [task.id]: false }));
          await loadTaskStatus();
      } catch (e) { console.error(e); }
      finally { setIsClaiming(null); }
  }

  const DailyCheckInStrip = () => {
    const dailyTask = tasks.find(t => t.type === 'daily_login');
    const currentStreak = dailyTask?.currentStreak || 0;
    const isClaimedToday = dailyTask?.status === 'claimed';
    
    const windowStart = Math.floor((currentStreak > 0 ? currentStreak - 1 : 0) / 7) * 7 + 1;
    const days = Array.from({ length: 7 }, (_, i) => windowStart + i);

    return (
      <div className="mb-8 w-full">
        <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <CalendarCheck size={16} className="text-green-400" />
                Daily Login
            </h2>
            <span className="text-gray-500 text-[10px] font-mono">
                Streak: <span className="text-green-400">{currentStreak} Days</span>
            </span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x w-full">
            {days.map((day) => {
                const isCompleted = day <= currentStreak;
                const isNextToClaim = day === currentStreak + 1 && !isClaimedToday;
                const isJustClaimed = day === currentStreak && isClaimedToday;
                const isActive = isNextToClaim || isJustClaimed;
                const isFuture = day > currentStreak + (isClaimedToday ? 0 : 1);
                
                const reward = getRewardByStreak(day);

                return (
                    <div 
                        key={day}
                        onClick={() => {
                            if (isNextToClaim && dailyTask) handleAction(dailyTask);
                        }}
                        className={`
                            min-w-[50px] flex-1 h-20 rounded-xl flex flex-col items-center justify-center border transition-all relative overflow-hidden snap-center cursor-pointer
                            ${isCompleted && !isJustClaimed ? 'bg-green-400/10 border-green-400/30' : ''}
                            ${isActive ? 'bg-green-400 text-black border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)] scale-105 z-10' : ''}
                            ${isFuture ? 'bg-zinc-900 border-white/5 opacity-60' : ''}
                        `}
                    >
                         {(isCompleted && !isJustClaimed) && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                 <Check size={20} className="text-green-400" />
                             </div>
                         )}
                         {isClaiming === dailyTask?.id && isNextToClaim && (
                             <div className="absolute inset-0 flex items-center justify-center bg-green-500">
                                 <Loader2 size={20} className="animate-spin text-black" />
                             </div>
                         )}
                         
                         <span className={`text-[10px] font-bold mb-1 ${isActive ? 'text-black' : 'text-gray-400'}`}>Day {day}</span>
                         <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                             {reward >= 1000 ? `${reward/1000}K` : reward}
                         </span>
                    </div>
                )
            })}
        </div>
      </div>
    );
  };

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-green-400" />
              <span className="text-xs">Loading missions...</span>
          </div>
      );
  }

  const listTasks = tasks.filter(t => t.type !== 'daily_login');

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar">
      <h1 className="text-xl font-bold text-white tracking-wider mb-1">Missions</h1>
      <p className="text-gray-400 text-xs mb-6">Complete tasks to upgrade your node's hashing power.</p>

      <DailyCheckInStrip />

      <h2 className="text-white font-bold text-sm mb-3 px-1">Active Tasks</h2>
      <div className="space-y-3">
        {listTasks.map((task) => {
            const Icon = task.icon;
            const isCompleted = task.status === 'claimed';
            const isProcessing = isClaiming === task.id;
            
            let btnText = 'Start';
            let btnStyle = 'bg-white/10 text-white hover:bg-white/20';
            
            const clicks = verificationClicks[task.id] || 0;
            const req = requiredClicks[task.id] || 0;
            
            if (isCompleted) {
                btnText = 'Done';
                btnStyle = 'bg-transparent text-gray-500 cursor-default border border-transparent';
            } else if (task.type === 'email_verification' && showEmailForm[task.id]) {
                btnText = 'Close';
            } else if (isSocialTask(task.type)) {
                if (clicks > 0 && clicks < req) {
                     btnText = 'Verify';
                     btnStyle = 'bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500/30';
                } else if (clicks >= req) {
                     btnText = 'Claim';
                     btnStyle = 'bg-green-400 text-black hover:bg-green-500 shadow-[0_0_10px_rgba(74,222,128,0.2)]';
                } else {
                     btnText = 'Start';
                }
            } else {
                btnText = task.action || 'Claim';
                if (btnText === 'Claim' || btnText === 'Verify') {
                    btnStyle = 'bg-green-400 text-black hover:bg-green-500';
                }
            }

            return (
                <div key={task.id} className="flex flex-col gap-2 p-3 rounded-2xl border border-white/5 bg-zinc-900 transition-all hover:border-green-400/30">
                    <div className={`flex items-center justify-between ${isCompleted ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${btnText === 'Claim' ? 'bg-green-400/20 text-green-400' : 'bg-white/5 text-white'}`}>
                                {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-white text-xs font-bold truncate pr-2">{task.title}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-green-400 font-mono text-xs font-bold">+{task.reward.toLocaleString()} RZC</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleAction(task)}
                            disabled={isCompleted || isProcessing}
                            className={`
                                px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[80px] flex items-center justify-center
                                ${btnStyle}
                            `}
                        >
                            {isProcessing ? (
                                <Loader2 className="animate-spin" size={14} />
                            ) : (
                                btnText
                            )}
                        </button>
                    </div>

                    {task.type === 'email_verification' && showEmailForm[task.id] && !isCompleted && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex gap-2">
                             <input 
                                type="email" 
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="Enter email..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-green-400"
                             />
                             <button 
                                onClick={() => handleEmailSubmit(task)}
                                className="bg-green-400 text-black text-xs font-bold px-3 rounded-lg"
                             >
                                 Submit
                             </button>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SocialTasks;