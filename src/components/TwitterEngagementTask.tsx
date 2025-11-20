import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface TwitterTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  engagement_type: 'like' | 'retweet' | 'reply' | 'follow';
  tweet_url: string;
  isCompleted: boolean;
  completedAt?: string;
}

interface TwitterEngagementTaskProps {
  userId?: number;
  onRewardClaimed?: (amount: number) => void;
  showSnackbar?: (data: { message: string; description?: string }) => void;
}

export default function TwitterEngagementTask({ userId, onRewardClaimed, showSnackbar }: TwitterEngagementTaskProps) {
  const [tasks, setTasks] = useState<TwitterTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingTasks, setClaimingTasks] = useState<Set<string>>(new Set());
  const [validatingTasks, setValidatingTasks] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  

  // Sample Twitter engagement tasks
  const getTwitterTasks = (): TwitterTask[] => [
    {
      id: 'twitter_like_1',
      title: 'Like Our Latest Tweet',
      description: 'Show some love! Like our latest tweet about RZC and earn 10 RZC tokens.',
      reward: 10,
      engagement_type: 'like',
      tweet_url: 'https://x.com/TAPPs_WHALE/status/1977881526143418805',
      isCompleted: false
    },
    {
      id: 'twitter_retweet_1',
      title: 'Retweet TAPPS News',
      description: 'Help spread the word! Retweet our latest RZC announcement and earn 10 RZC tokens.',
      reward: 10,
      engagement_type: 'retweet',
      tweet_url: 'https://x.com/TAPPs_WHALE/status/1977881526143418805',
      isCompleted: false
    },
    {
      id: 'twitter_reply_1',
      title: 'Reply with Your Thoughts',
      description: 'Share your thoughts! Reply to our latest tweet and earn 10 RZC tokens.',
      reward: 10,
      engagement_type: 'reply',
      tweet_url: 'https://x.com/TAPPs_WHALE/status/1977881526143418805',
      isCompleted: false
    },
    {
      id: 'twitter_follow_1',
      title: 'Follow TAPPS on Twitter',
      description: 'Stay updated! Follow our Twitter account for the latest news and earn 10 RZC tokens.',
      reward: 10,
      engagement_type: 'follow',
      tweet_url: 'https://x.com/TAPPs_WHALE',
      isCompleted: false
    }
  ];

  // Load completed tasks
  useEffect(() => {
    const loadCompletedTasks = async () => {
      if (!userId) {
        setTasks(getTwitterTasks());
        setIsLoading(false);
        return;
      }

      try {
        // Get completed Twitter engagement tasks
        const { data: completedTasks, error } = await supabase
          .from('twitter_engagement_tasks')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading completed Twitter tasks:', error);
        }

        const completedTaskIds = new Set(completedTasks?.map(task => `${task.engagement_type}_${task.tweet_url}`) || []);
        
        const allTasks = getTwitterTasks().map(task => ({
          ...task,
          isCompleted: completedTaskIds.has(`${task.engagement_type}_${task.tweet_url}`),
          completedAt: completedTasks?.find(ct => ct.engagement_type === task.engagement_type)?.completed_at
        }));

        setTasks(allTasks);
      } catch (error) {
        console.error('Error loading Twitter tasks:', error);
        setTasks(getTwitterTasks());
      } finally {
        setIsLoading(false);
      }
    };

    loadCompletedTasks();
  }, [userId]);

  const handleTaskCompletion = async (task: TwitterTask) => {
    if (!userId) {
      showSnackbar?.({ message: 'Authentication Required', description: 'Please log in to claim rewards.' });
      return;
    }
    if (claimingTasks.has(task.id) || task.isCompleted) return;
    if (!validatingTasks[task.id] || (timers[task.id] ?? 0) > 0) return;

    setClaimingTasks(prev => new Set(prev).add(task.id));
    
    try {
      const { data, error } = await supabase.rpc('complete_twitter_engagement', {
        p_user_id: userId,
        p_tweet_url: task.tweet_url,
        p_engagement_type: task.engagement_type
      });

      if (error) {
        console.error('Error completing Twitter engagement:', error);
        showSnackbar?.({
          message: '❌ Error',
          description: 'Failed to complete Twitter engagement. Please try again.'
        });
        return;
      }

      if (data.success) {

        // Update local state
        setTasks(prev => prev.map(t =>
          t.id === task.id ? {
            ...t,
            isCompleted: true,
            completedAt: new Date().toISOString()
          } : t
        ));

        // Trigger reward callback
        if (onRewardClaimed) {
          onRewardClaimed(data.reward_amount);
        }

        showSnackbar?.({
          message: '🎉 Twitter Engagement Complete!',
          description: `You earned ${data.reward_amount} RZC tokens!`
        });
      } else {
        showSnackbar?.({
          message: '⚠️ Already Completed',
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error completing Twitter engagement:', error);
      showSnackbar?.({
        message: '❌ Error',
        description: 'Failed to complete Twitter engagement. Please try again.'
      });
    } finally {
      setClaimingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const getEngagementIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'retweet': return '🔄';
      case 'reply': return '💬';
      case 'follow': return '👥';
      default: return '🐦';
    }
  };

  const getEngagementColor = (type: string) => {
    switch (type) {
      case 'like': return 'bg-red-500 hover:bg-red-600';
      case 'retweet': return 'bg-green-500 hover:bg-green-600';
      case 'reply': return 'bg-blue-500 hover:bg-blue-600';
      case 'follow': return 'bg-purple-500 hover:bg-purple-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  const openTwitterLink = (task: TwitterTask) => {
    window.open(task.tweet_url, '_blank', 'noopener,noreferrer');
    // Start validation countdown similar to SocialTasks
    setValidatingTasks(prev => ({ ...prev, [task.id]: true }));
    setTimers(prev => ({ ...prev, [task.id]: 20 }));
  };

  // Tick down active validation timers
  useEffect(() => {
    const active = Object.entries(timers).filter(([_, t]) => t > 0);
    if (active.length === 0) return;
    const interval = setInterval(() => {
      setTimers(prev => {
        const next: Record<string, number> = { ...prev };
        for (const [key, value] of Object.entries(prev)) {
          if (value > 0) next[key] = value - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timers]);

  if (isLoading) {
    return (
      <div className="relative overflow-visible">
        <div className="relative p-4 rounded-15 bg-white border-2 border-slate-300 shadow-sm animate-pulse">
          <div className="h-40 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-visible">
<div className="relative p-4 rounded-lg bg-white border-2 border-slate-300 shadow-sm" style={{borderImage: 'linear-gradient(90deg, #e2e8f0, #cbd5e1, #94a3b8, #cbd5e1, #e2e8f0) 1'}}>
{/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-blue-600/10 text-blue-700 flex items-center justify-center">
              <span className="text-lg">✖︎</span>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">Twitter Engagement</div>
              <div className="text-base sm:text-lg font-semibold text-slate-900">Earn 10 RZC per action</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Completed</span>
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md bg-green-50 text-green-700 border border-green-200">
              {tasks.filter(t => t.isCompleted).length}/{tasks.length}
            </span>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={`relative p-3 sm:p-4 rounded-lg border transition-colors ${
                task.isCompleted 
                  ? 'bg-green-50/60 border-green-200' 
                  : 'bg-slate-50 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 w-9 h-9 rounded-md flex items-center justify-center ${
                    task.isCompleted ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`} aria-hidden="true">
                    <span className="text-base">
                      {task.isCompleted ? '✓' : getEngagementIcon(task.engagement_type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm sm:text-[15px] truncate ${
                      task.isCompleted ? 'text-green-700' : 'text-slate-900'
                    }`}>
                      {task.title}
                    </div>
                    <div className="text-[12px] text-slate-600 mt-0.5 line-clamp-2">
                      {task.description}
                    </div>
                    {task.isCompleted && task.completedAt && (
                      <div className="text-[11px] text-green-600 mt-1 font-medium">
                        Completed {new Date(task.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center sm:items-end gap-3 sm:gap-2 sm:ml-auto w-full sm:w-auto">
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200 w-fit">
                    {task.reward} RZC
                  </span>

                  {task.isCompleted ? (
                    <div className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-semibold border border-green-200 w-full sm:w-auto justify-center">
                      Completed
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => openTwitterLink(task)}
                        className="w-full sm:w-auto px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold border border-slate-200 transition-colors"
                        aria-label={`Open Twitter link for ${task.title}`}
                      >
                        Open Twitter
                      </button>
                      <button
                        onClick={() => handleTaskCompletion(task)}
                        disabled={claimingTasks.has(task.id) || !validatingTasks[task.id] || (timers[task.id] ?? 0) > 0}
                        className={`w-full sm:w-auto px-3 py-2 rounded-md text-xs font-semibold transition-colors border ${
                          claimingTasks.has(task.id)
                            ? 'bg-slate-400 text-white cursor-not-allowed border-slate-400'
                            : !validatingTasks[task.id]
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            : (timers[task.id] ?? 0) > 0
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : `${getEngagementColor(task.engagement_type)} text-white border-transparent`
                        }`}
                        aria-label={`Claim reward for ${task.title}`}
                      >
                        {claimingTasks.has(task.id) ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                            <span>Claiming</span>
                          </div>
                        ) : !validatingTasks[task.id] ? (
                          'Pending'
                        ) : (timers[task.id] ?? 0) > 0 ? (
                          <span className="tabular-nums">{timers[task.id]}s</span>
                        ) : (
                          'Claim Reward'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Guide */}
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[12px] text-slate-700 space-y-1">
            <div>1) Open the tweet or profile</div>
            <div>2) Complete the action (like, retweet, reply, follow)</div>
            <div>3) Return and claim your reward</div>
          </div>
        </div>
      </div>
    </div>
  );
}
