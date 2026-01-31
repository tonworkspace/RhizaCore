import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icons } from '../uicomponents/Icons';

// --- Interface Definitions ---
interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: 'Protocol' | 'Mainnet' | 'Ecosystem';
  difficulty?: 'Legendary' | 'Epic' | 'Rare';
  status: 'available' | 'completed';
  actionLabel: string;
  type: 'daily_login' | 'twitter_like' | 'twitter_retweet' | 'twitter_comment' | 'twitter_follow' | 'telegram' | 'telegram_community' | 'welcome_bonus' | 'email_verification' | 'facebook' | 'referral_contest';
  link?: string;
  currentStreak?: number;
  nextPotentialStreak?: number;
}

interface QuestComponentProps {
  quests: Quest[];
  onVerify: (questId: string) => void;
  isVerifyingId: string | null;
  showEmailForm: { [key: string]: boolean };
  emailInput: string;
  onEmailInputChange: (value: string) => void;
  onEmailSubmit: (quest: Quest) => void;
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

const QuestComponent: React.FC<QuestComponentProps> = ({ 
  quests, 
  onVerify, 
  isVerifyingId,
  showEmailForm,
  emailInput,
  onEmailInputChange,
  onEmailSubmit
}) => {
  const [filter, setFilter] = useState<'All' | 'Protocol' | 'Mainnet' | 'Ecosystem'>('All');

  const filteredQuests = quests.filter(q => filter === 'All' || q.category === filter);
  const completedCount = quests.filter(q => q.status === 'completed').length;
  const totalReward = quests.reduce((acc, q) => acc + (q.status === 'completed' ? q.reward : 0), 0);

  const getDifficultyStyles = (difficulty?: string) => {
    switch (difficulty) {
      case 'Legendary': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
      case 'Epic': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Rare': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-white/5 text-zinc-500 border-white/5';
    }
  };

  const getCategoryIcon = (category?: string, completed?: boolean) => {
    if (completed) return <Icons.Check size={20} strokeWidth={3} />;
    switch (category) {
      case 'Mainnet': return <Icons.Energy size={20} />;
      case 'Protocol': return <Icons.Energy size={20} />;
      case 'Ecosystem': return <Icons.Users size={20} />;
      default: return <Icons.Task size={20} />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Mainnet': return 'text-blue-400 bg-blue-500/10';
      case 'Protocol': return 'text-orange-400 bg-orange-500/10';
      case 'Ecosystem': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-zinc-500 bg-white/5';
    }
  };

  return (
    <div className="flex flex-col px-6 pb-32 animate-in fade-in duration-700">
      {/* Protocol Mastery Header */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-7 mb-8 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icons.Task size={14} className="text-green-500" />
              <span className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.3em]">Operational Readiness</span>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Quest Protocol</h2>
          </div>
          <div className="text-right">
            <div className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest mb-1">Total Yield</div>
            <div className="text-white font-mono font-bold text-lg">
              {totalReward.toLocaleString()} <span className="text-green-500 font-sans text-xs">RZC</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest">Mainnet Node Integration</span>
            <span className="text-green-500 text-[10px] font-black font-mono">
              {Math.round((completedCount / (quests.length || 1)) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-1000" 
              style={{ width: `${(completedCount / (quests.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
        {(['All', 'Protocol', 'Mainnet', 'Ecosystem'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 h-10 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              filter === cat 
                ? 'bg-white text-black border-white' 
                : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Quest Grid */}
      <div className="space-y-4">
        {filteredQuests.map((q) => (
          <div 
            key={q.id} 
            className={`bg-zinc-900/30 border rounded-[2rem] p-5 flex flex-col gap-5 relative overflow-hidden group transition-all duration-500 ${
              q.status === 'completed' 
                ? 'border-green-500/20 bg-green-500/[0.02]' 
                : 'border-white/5 hover:border-white/10 hover:bg-zinc-900/50'
            }`}
          >
            <div className="flex items-start gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500 ${
                q.status === 'completed' 
                  ? 'bg-green-500/10 text-green-500' 
                  : getCategoryColor(q.category)
              }`}>
                {getCategoryIcon(q.category, q.status === 'completed')}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="text-white text-[14px] font-bold tracking-tight truncate">{q.title}</h3>
                  {q.difficulty && (
                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${getDifficultyStyles(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-2">{q.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-1 relative z-10">
              <div className="flex flex-col">
                <span className="text-zinc-600 text-[7px] font-black uppercase tracking-widest">Protocol Reward</span>
                <span className="text-green-500 font-mono text-sm font-bold">+{q.reward} RZC</span>
              </div>

              {q.status !== 'completed' ? (
                <button 
                  onClick={() => onVerify(q.id)}
                  disabled={isVerifyingId === q.id}
                  className="h-11 px-6 bg-white/[0.03] hover:bg-white/[0.08] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-white/5 active:scale-95 disabled:opacity-50"
                >
                  {isVerifyingId === q.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icons.Energy size={14} className="text-yellow-500" />
                      {q.type === 'email_verification' && showEmailForm[q.id] ? 'Close' : q.actionLabel}
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-green-500/40 text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-green-500/5 rounded-xl border border-green-500/10">
                  <Icons.Check size={12} strokeWidth={3} />
                  Signature Logged
                </div>
              )}
            </div>

            {/* Email Form for Email Verification Quest */}
            {q.type === 'email_verification' && showEmailForm[q.id] && q.status !== 'completed' && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                    Protocol Email Address
                  </label>
                  <input 
                    type="email" 
                    value={emailInput}
                    onChange={(e) => onEmailInputChange(e.target.value)}
                    placeholder="Enter your email address..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-400/50 focus:bg-zinc-900/70 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEmailSubmit(q)}
                    disabled={isVerifyingId === q.id || !emailInput.includes('@')}
                    className="flex-1 h-11 bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    {isVerifyingId === q.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icons.Check size={12} />
                        Verify Email
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => onVerify(q.id)}
                    className="px-4 h-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredQuests.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-zinc-900/50 rounded-3xl flex items-center justify-center text-zinc-700 mx-auto mb-4 border border-white/5">
              <Icons.Task size={24} />
            </div>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sector Data Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};
interface Props {
  showSnackbar: (config: { message: string; description?: string }) => void;
  userId?: number;
  onRewardClaimed?: (amount: number) => void;
  onNavigateToReferralContest?: () => void;
}

const SocialTasks = ({ showSnackbar, userId, onRewardClaimed, onNavigateToReferralContest }: Props) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);
  const [verificationClicks, setVerificationClicks] = useState<{ [key: string]: number }>({});
  const [requiredClicks, setRequiredClicks] = useState<{ [key: string]: number }>({});
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const availableQuests: Quest[] = [
    { 
      id: 'referral_contest', 
      title: 'Join Referral Contest', 
      description: 'Invite friends & climb leaderboard', 
      reward: 10, 
      category: 'Ecosystem',
      difficulty: 'Epic',
      type: 'referral_contest', 
      status: 'available', 
      actionLabel: 'Join' 
    },
    { 
      id: 'welcome_bonus', 
      title: 'Welcome Bonus', 
      description: 'Claim your starter RZC', 
      reward: WELCOME_BONUS_AMOUNT, 
      category: 'Protocol',
      difficulty: 'Rare',
      type: 'welcome_bonus', 
      status: 'available', 
      actionLabel: 'Claim' 
    },
    { 
      id: 'email_verification', 
      title: 'Verify Email', 
      description: 'Secure your account', 
      reward: 10, 
      category: 'Protocol',
      difficulty: 'Rare',
      type: 'email_verification', 
      status: 'available', 
      actionLabel: 'Verify' 
    },
    { 
      id: 'daily_login', 
      title: 'Daily Mining Streak', 
      description: 'Keep streak for bonuses', 
      reward: 10, 
      category: 'Mainnet',
      difficulty: 'Legendary',
      type: 'daily_login', 
      status: 'available', 
      actionLabel: 'Claim' 
    },
    { 
      id: 'twitter_like', 
      title: 'Like on X', 
      description: 'Like our latest post', 
      reward: 10, 
      category: 'Ecosystem',
      type: 'twitter_like', 
      status: 'available', 
      actionLabel: 'Like',
      link: getXIntentLink('like') 
    },
    { 
      id: 'twitter_retweet', 
      title: 'Retweet', 
      description: 'Spread the word', 
      reward: 10, 
      category: 'Ecosystem',
      type: 'twitter_retweet', 
      status: 'available', 
      actionLabel: 'Retweet',
      link: getXIntentLink('retweet') 
    },
    { 
      id: 'twitter_comment', 
      title: 'Comment on X', 
      description: 'Join the discussion', 
      reward: 10, 
      category: 'Ecosystem',
      type: 'twitter_comment', 
      status: 'available', 
      actionLabel: 'Comment',
      link: getXIntentLink('comment') 
    },
    { 
      id: 'twitter_follow', 
      title: 'Follow RhizaCore', 
      description: 'Stay updated', 
      reward: 10, 
      category: 'Ecosystem',
      type: 'twitter_follow', 
      status: 'available', 
      actionLabel: 'Follow',
      link: `https://x.com/${X_HANDLE}` 
    },
    { 
      id: 'telegram', 
      title: 'Telegram Channel', 
      description: 'Join for news', 
      reward: 10, 
      category: 'Ecosystem',
      type: 'telegram', 
      status: 'available', 
      actionLabel: 'Join',
      link: 'https://t.me/RhizaCoreNews' 
    },
    { 
      id: 'telegram_community', 
      title: 'Telegram Group', 
      description: 'Join community chat', 
      reward: 10, 
      category: 'Ecosystem',
      type: 'telegram_community', 
      status: 'available', 
      actionLabel: 'Join',
      link: 'https://t.me/RhizaCore' 
    },
    { 
      id: 'facebook', 
      title: 'Facebook Page', 
      description: 'Like our page', 
      reward: 10, 
      category: 'Ecosystem',
      type: 'facebook', 
      status: 'available', 
      actionLabel: 'Like',
      link: 'https://web.facebook.com/RhizaCore' 
    }
  ];

  useEffect(() => {
    if (userId) loadQuestStatus();
  }, [userId]);

  const loadQuestStatus = async () => {
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
      availableQuests.forEach(quest => {
         if (['daily_login', 'welcome_bonus', 'email_verification'].indexOf(quest.type) === -1) {
             const seed = quest.id + userId + todayDateString;
             let hash = 0;
             for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
             newRequiredClicks[quest.id] = Math.abs(hash % 3) + 3; 
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

      const updatedQuests: Quest[] = availableQuests.map(quest => {
        if (quest.type === 'welcome_bonus') {
            return { ...quest, status: welcomeBonusGranted ? 'completed' : 'available' };
        }
        if (quest.type === 'email_verification') {
            return { ...quest, status: emailVerified ? 'completed' : 'available' };
        }
        if (quest.type === 'referral_contest') {
            return { ...quest, status: referralContestJoined ? 'completed' : 'available' };
        }
        
        if (quest.type === 'daily_login' && userDataResponse) {
             const currentStreak = userDataResponse.daily_streak_count || 0;
             const daysSinceLastClaim = getDaysSinceDate(userDataResponse.last_daily_claim_date);
             const alreadyClaimed = (userDataResponse.last_daily_claim_date === todayDateString) || hasClaimedToday;
             
             let status: 'available' | 'completed' = 'available';
             let dynamicReward = quest.reward;
             
             if (alreadyClaimed) {
                 status = 'completed';
                 dynamicReward = getRewardByStreak(Math.max(currentStreak, 1));
             } else {
                 const nextStreak = calculateSmartStreak(currentStreak, daysSinceLastClaim);
                 dynamicReward = getRewardByStreak(nextStreak);
             }
             
             return {
                 ...quest,
                 status: status as 'available' | 'completed',
                 reward: dynamicReward,
                 currentStreak: currentStreak,
                 nextPotentialStreak: alreadyClaimed ? currentStreak : calculateSmartStreak(currentStreak, daysSinceLastClaim)
             };
        }

        if (isSocialTask(quest.type)) {
            const isVerified = tasksData[`${quest.type}_verified`] || completedTaskIds.has(quest.id);
            return { ...quest, status: isVerified ? 'completed' : 'available' };
        }

        return { ...quest, status: 'available' };
      });

      setQuests(updatedQuests.sort((a, b) => {
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

  const handleVerificationClick = async (quest: Quest) => {
    if (quest.status === 'completed') return;
    
    if (quest.link && verificationClicks[quest.id] !== -1) {
        window.open(quest.link, '_blank');
    }

    const currentClicks = verificationClicks[quest.id] || 0;
    const required = requiredClicks[quest.id] || 3;
    const newClicks = currentClicks + 1;

    setVerificationClicks(prev => ({ ...prev, [quest.id]: newClicks }));

    if (newClicks >= required) {
        await verifySocialQuest(quest);
    }
  };

  const verifySocialQuest = async (quest: Quest) => {
    try {
        const taskIdMap: { [key: string]: number } = { 
          'twitter_like': 3, 
          'twitter_retweet': 4, 
          'twitter_comment': 5, 
          'twitter_follow': 6, 
          'telegram': 1, 
          'telegram_community': 2, 
          'facebook': 7 
        };
        const taskId = taskIdMap[quest.type] || 0;

        if (taskId > 0) {
            await supabase.from('completed_tasks').upsert({ 
              user_id: userId, 
              task_id: taskId, 
              completed_at: new Date().toISOString(), 
              status: 'COMPLETED', 
              reward_claimed: true 
            }, { onConflict: 'user_id,task_id' });
        }
        
        await supabase.from('activities').insert({ 
          user_id: userId, 
          type: 'rzc_claim', 
          amount: quest.reward, 
          status: 'completed' 
        });

        const tasksDataKey = `daily_tasks_${userId}`;
        const stored = localStorage.getItem(tasksDataKey);
        const data = stored ? JSON.parse(stored) : {};
        data[`${quest.type}_verified`] = true;
        localStorage.setItem(tasksDataKey, JSON.stringify(data));

        if (onRewardClaimed) onRewardClaimed(quest.reward);
        showSnackbar({ message: 'Task Completed!', description: `Earned ${quest.reward} RZC` });
        
        await loadQuestStatus();
        setVerificationClicks(prev => ({...prev, [quest.id]: 0}));
    } catch (e) {
        console.error(e);
        showSnackbar({ message: 'Error', description: 'Failed to verify' });
    }
  };

  const handleQuestAction = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status === 'completed') return;
    
    if (quest.type === 'referral_contest') {
        onNavigateToReferralContest?.();
        return;
    }
    if (quest.type === 'email_verification') {
        setShowEmailForm(prev => ({ ...prev, [quest.id]: !prev[quest.id] }));
        return;
    }

    setIsVerifyingId(questId);

    try {
        if (quest.type === 'daily_login') {
            const res = await claimDailyLoginReward(userId!);
            if (onRewardClaimed) onRewardClaimed(res.reward);
            showSnackbar({ message: 'Daily Check-in!', description: `Streak: ${res.newStreak} days` });
            await loadQuestStatus();
        } else if (quest.type === 'welcome_bonus') {
            localStorage.setItem(`welcome_bonus_granted_${userId}`, 'true');
            await supabase.from('activities').insert({ 
              user_id: userId, 
              type: 'rzc_claim', 
              amount: quest.reward, 
              status: 'completed' 
            });
            if (onRewardClaimed) onRewardClaimed(quest.reward);
            showSnackbar({ message: 'Welcome Bonus!', description: `Earned ${quest.reward} RZC` });
            await loadQuestStatus();
        } else if (isSocialTask(quest.type)) {
            await handleVerificationClick(quest);
        }
    } catch (e: any) {
        showSnackbar({ message: 'Error', description: e.message });
    } finally {
        setIsVerifyingId(null);
    }
  };

  const handleEmailSubmit = async (quest: Quest) => {
      if (!emailInput.includes('@')) {
          showSnackbar({message: 'Invalid Email', description: 'Please enter a valid email address'});
          return;
      }
      
      setIsVerifyingId(quest.id);
      try {
          await supabase.from('users').update({ email: emailInput }).eq('id', userId);
          await supabase.from('activities').insert({ 
            user_id: userId, 
            type: 'rzc_claim', 
            amount: quest.reward, 
            status: 'completed' 
          });
          localStorage.setItem(`email_verified_${userId}`, 'true');
          if (onRewardClaimed) onRewardClaimed(quest.reward);
          showSnackbar({ message: 'Email Verified!', description: `Earned ${quest.reward} RZC` });
          setEmailInput('');
          setShowEmailForm(prev => ({ ...prev, [quest.id]: false }));
          await loadQuestStatus();
      } catch (e) { 
        console.error(e);
        showSnackbar({ message: 'Error', description: 'Failed to verify email' });
      } finally { 
        setIsVerifyingId(null); 
      }
  };

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="w-8 h-8 border-2 border-green-400/20 border-t-green-400 rounded-full animate-spin mb-2" />
              <span className="text-xs">Loading missions...</span>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto no-scrollbar">
      <QuestComponent 
        quests={quests}
        onVerify={handleQuestAction}
        isVerifyingId={isVerifyingId}
        showEmailForm={showEmailForm}
        emailInput={emailInput}
        onEmailInputChange={setEmailInput}
        onEmailSubmit={handleEmailSubmit}
      />
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .animate-in {
          animation: fadeIn 0.7s ease-out;
        }
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.7s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default SocialTasks;

export { QuestComponent };