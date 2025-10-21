import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Task {
  id: number;
  platform: string;
  action: string;
  reward: number;
  link: string;
  isCompleted: boolean;
  validationTimer?: number;
  description: string;
  completedAt?: string;
  rewardClaimed?: boolean;
}

interface Props {
  showSnackbar: (config: { message: string; description?: string }) => void;
  userId?: number;
  onRewardClaimed?: (amount: number) => void;
}

const SocialTasks = ({ showSnackbar, userId, onRewardClaimed }: Props) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [validatingTasks, setValidatingTasks] = useState<{ [key: number]: boolean }>({});
  const [timers, setTimers] = useState<{ [key: number]: number }>({});
  const [, setConfetti] = useState<number | null>(null);
  const [isClaimingAllRewards, setIsClaimingAllRewards] = useState(false);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const [hasClaimedAllRewards, setHasClaimedAllRewards] = useState(false);
  const [compact] = useState(false);

  // Load user's completed tasks from database
  useEffect(() => {
    const loadUserTasks = async () => {
      if (!userId) {
        // Set default tasks without database loading
        setTasks(getDefaultTasks());
        setTimeout(() => setIsInitialLoading(false), 1000);
        return;
      }

      try {
        // Get user's completed tasks
        const { data: completedTasks, error } = await supabase
          .from('completed_tasks')
          .select('task_id, completed_at, reward_claimed')
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading completed tasks:', error);
        }

        // Map completed tasks to our task structure
        const completedTaskIds = new Set(completedTasks?.map(ct => ct.task_id) || []);
        const completedTaskDetails = new Map(completedTasks?.map(ct => [ct.task_id, ct]) || []);

        // Check if user has claimed the bonus (task_id: -1)
        const hasClaimedBonus = completedTaskIds.has(-1);

        const defaultTasks = getDefaultTasks();
        const tasksWithCompletion = defaultTasks.map(task => {
          const isCompleted = completedTaskIds.has(task.id);
          const taskDetails = completedTaskDetails.get(task.id);
          
          return {
            ...task,
            isCompleted,
            completedAt: taskDetails?.completed_at,
            rewardClaimed: taskDetails?.reward_claimed || false
          };
        });

        setTasks(tasksWithCompletion);
        setHasClaimedAllRewards(hasClaimedBonus);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks(getDefaultTasks());
      } finally {
        setTimeout(() => setIsInitialLoading(false), 1000);
      }
    };

    loadUserTasks();
  }, [userId]);

  const getDefaultTasks = (): Task[] => [
    {
      id: 1,
      platform: 'Telegram',
      action: 'Join TAPPS Telegram Group',
      reward: 10000,
      link: 'https://t.me/TAPPs_Chat',
      isCompleted: false,
      description: 'Join our vibrant community and stay updated with the latest news!',
      rewardClaimed: false
    },
    {
      id: 2,
      platform: 'Telegram',
      action: 'Join TAPPS Telegram Channel',
      reward: 10000,
      link: 'https://t.me/TAPPs_News',
      isCompleted: false,
      description: 'Stay connected with official announcements and updates!',
      rewardClaimed: false
    },
    {
      id: 3,
      platform: 'Twitter',
      action: 'Follow TAPPS Whale on X/Twitter',
      reward: 15000,
      link: 'https://x.com/TAPPs_Whale',
      isCompleted: false,
      description: 'Follow us on X for the latest news, updates, and community discussions!',
      rewardClaimed: false
    },
    {
      id: 4,
      platform: 'Facebook',
      action: 'Like TAPPS Whale Facebook Page',
      reward: 10000,
      link: 'https://web.facebook.com/TAPPsWeb3',
      isCompleted: false,
      description: 'Show your support by liking our Facebook page and joining our community!',
      rewardClaimed: false
    },
    // {
    //   id: 5,
    //   platform: 'Discord',
    //   action: 'Join TAPPS Discord Server',
    //   reward: 12000,
    //   link: 'https://discord.gg/tapps',
    //   isCompleted: false,
    //   description: 'Connect with fellow TAPPS community members on Discord!',
    //   rewardClaimed: false
    // }
  ];

  useEffect(() => {
    if (tasks.length > 0) {
      const allCompleted = tasks.every(task => task.isCompleted);
      setAllTasksCompleted(allCompleted);
    }
  }, [tasks]);

  useEffect(() => {
    const activeTimers = Object.entries(timers).filter(([_, time]) => time > 0);
    const intervalIds = activeTimers.map(([taskId, _]) => {
      const timer = setInterval(() => {
        setTimers(prev => {
          const newTime = (prev[Number(taskId)] || 0) - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            return { ...prev, [taskId]: 0 };
          }
          return { ...prev, [taskId]: newTime };
        });
      }, 1000);
      return timer;
    });
    return () => {
      intervalIds.forEach(id => clearInterval(id));
    };
  }, [timers]);

  const handleTaskCompletion = async (taskId: number) => {
    if (!userId) {
      showSnackbar({
        message: 'Authentication Required',
        description: 'Please log in to claim rewards.'
      });
      return;
    }

    setLoading(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Save to database
      const { error: dbError } = await supabase
        .from('completed_tasks')
        .insert({
          user_id: userId,
          task_id: taskId,
          completed_at: new Date().toISOString(),
          status: 'COMPLETED',
          reward_claimed: true
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save task completion');
      }

      // Update user's airdrop balance
      const { error: balanceError } = await supabase.rpc('increment_sbt', {
        user_id: userId,
        amount: task.reward
      });

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        // Don't throw error here, just log it
      }

      // Update local state
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { 
          ...t, 
          isCompleted: true, 
          rewardClaimed: true,
          completedAt: new Date().toISOString()
        } : t
      ));

      // Trigger reward callback
      if (onRewardClaimed) {
        onRewardClaimed(task.reward);
      }

      setConfetti(taskId);
      setTimeout(() => setConfetti(null), 3000);

      showSnackbar({
        message: '🎉 Task Completed!',
        description: `You earned ${task.reward.toLocaleString()} TAPPS tokens! Check your airdrop balance.`
      });
    } catch (error) {
      console.error('Error completing task:', error);
      showSnackbar({
        message: '❌ Error',
        description: 'Failed to complete task. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const startTaskValidation = (taskId: number) => {
    setValidatingTasks(prev => ({ ...prev, [taskId]: true }));
    setTimers(prev => ({ ...prev, [taskId]: 30 }));
  };

  const getPlatformIcon = (platform: string) => {
    const iconClass = "w-5 h-5";
    switch (platform.toLowerCase()) {
      case 'telegram':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.326.016.094.036.308.02.475z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'discord':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const handleClaimAllRewards = async () => {
    if (!allTasksCompleted || hasClaimedAllRewards || !userId) return;
    
    setIsClaimingAllRewards(true);
    try {
      const bonusAmount = 25000;
      
      // Update user's airdrop balance with bonus
      const { error: balanceError } = await supabase.rpc('increment_sbt', {
        user_id: userId,
        amount: bonusAmount
      });

      if (balanceError) {
        console.error('Bonus balance update error:', balanceError);
        throw new Error('Failed to update bonus balance');
      }

      // Save the bonus claim status to database
      const { error: claimError } = await supabase
        .from('completed_tasks')
        .insert({
          user_id: userId,
          task_id: -1, // Special ID for "claim all rewards" bonus
          completed_at: new Date().toISOString(),
          status: 'COMPLETED',
          reward_claimed: true
        });

      if (claimError) {
        console.error('Error saving bonus claim:', claimError);
        // Don't throw error here, just log it
      }

      // Trigger reward callback
      if (onRewardClaimed) {
        onRewardClaimed(bonusAmount);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setConfetti(-1);
      setTimeout(() => setConfetti(null), 5000);
      
      showSnackbar({
        message: '🎊 All Tasks Completed!',
        description: `Congratulations! You earned a bonus of ${bonusAmount.toLocaleString()} TAPPS tokens!`
      });
      setHasClaimedAllRewards(true);
    } catch (error) {
      console.error('Error claiming all rewards:', error);
      showSnackbar({
        message: '❌ Error',
        description: 'Failed to claim bonus reward. Please try again.'
      });
    } finally {
      setIsClaimingAllRewards(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-6 bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl p-5 border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse"></div>
                <div className="flex gap-2 mt-4">
                  <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className={compact ? "space-y-3" : "space-y-6"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Social Engagement</h3>
              <p className="text-sm text-gray-600">Complete social tasks to earn TAPPS rewards.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {allTasksCompleted && !hasClaimedAllRewards && (
              <button
                onClick={handleClaimAllRewards}
                disabled={isClaimingAllRewards}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-colors"
              >
                {isClaimingAllRewards ? 'Claiming...' : 'Claim 25K Bonus'}
              </button>
            )}
            {/* <button
              onClick={() => setCompact(v => !v)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
            >
              {compact ? 'Expand' : 'Compact'}
            </button> */}
          </div>
        </div>

        {allTasksCompleted && !hasClaimedAllRewards && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">Bonus Available!</h4>
                <p className="text-xs text-gray-600">Claim your 25,000 TAPPs bonus for completing all tasks</p>
              </div>
            </div>
          </div>
        )}

        {allTasksCompleted && hasClaimedAllRewards && !compact && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">All Tasks Completed!</h4>
                <p className="text-xs text-gray-600">You've claimed your 25,000 TAPPS bonus reward.</p>
              </div>
            </div>
          </div>
        )}

        {tasks.filter(t => !t.isCompleted).length > 0 && !compact && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Boost Your Earnings</h4>
                <p className="text-xs text-gray-600">Complete {tasks.filter(t => !t.isCompleted).length} more task{tasks.filter(t => !t.isCompleted).length !== 1 ? 's' : ''} to unlock bonus rewards</p>
              </div>
            </div>
          </div>
        )}

        <div className={compact ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={compact
                ? "flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-colors"
                : "relative rounded-xl p-5 border border-gray-200 bg-white hover:border-gray-300 transition-colors shadow-sm"
              }
            >
              {compact ? (
                <>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.isCompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      {getPlatformIcon(task.platform)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{task.action}</div>
                      <div className="text-xs text-gray-500">{task.platform}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 whitespace-nowrap font-medium">
                      +{task.reward.toLocaleString()}
                    </span>
                    {task.isCompleted ? (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 font-medium">
                        Done
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={task.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => startTaskValidation(task.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs border border-blue-200 font-medium transition-colors"
                        >
                          Visit
                        </a>
                        <button
                          onClick={() => handleTaskCompletion(task.id)}
                          disabled={loading || !validatingTasks[task.id] || timers[task.id] > 0}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            validatingTasks[task.id] && timers[task.id] > 0
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : validatingTasks[task.id]
                              ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          {loading ? 'Verifying' : (validatingTasks[task.id] && timers[task.id] > 0) ? `${timers[task.id]}s` : validatingTasks[task.id] ? 'Claim' : 'Pending'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${task.isCompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {getPlatformIcon(task.platform)}
                      </div>
                      <span className="text-base font-semibold text-gray-900">{task.platform}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-100">
                      <span className="text-sm font-semibold text-green-700">+{task.reward.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-gray-900 font-medium mb-2">{task.action}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.isCompleted ? (
                        <button disabled className="w-full px-4 py-2.5 rounded-lg bg-green-50 text-green-700 border border-green-100 font-medium flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </button>
                      ) : (
                        <>
                          <a
                            href={task.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => startTaskValidation(task.id)}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <span>Visit {task.platform}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleTaskCompletion(task.id)}
                            disabled={loading || !validatingTasks[task.id] || timers[task.id] > 0}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                              validatingTasks[task.id] && timers[task.id] > 0
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                : validatingTasks[task.id]
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                <span>Verifying</span>
                              </>
                            ) : validatingTasks[task.id] && timers[task.id] > 0 ? (
                              <>
                                <span>Checking</span>
                                <span className="tabular-nums">{timers[task.id]}s</span>
                              </>
                            ) : validatingTasks[task.id] ? (
                              <span>Claim Reward</span>
                            ) : (
                              <span>Not Claimed</span>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className={compact ? "p-3 rounded-xl border border-gray-200 bg-gray-50" : "p-4 bg-gray-50 rounded-xl border border-gray-200"}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Task Progress</span>
            <span className="text-sm font-semibold text-gray-900">{tasks.filter(t => t.isCompleted).length}/{tasks.length} Completed</span>
          </div>
          <div className={compact ? "h-1.5 bg-gray-200 rounded-full overflow-hidden" : "relative h-2 bg-gray-200 rounded-full overflow-hidden"}>
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${(tasks.filter(t => t.isCompleted).length / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialTasks;
