import { useEffect, useState, useMemo } from 'react';
import { supabase, gmpSystem } from '@/lib/supabaseClient';
import useAuth from '@/hooks/useAuth';
import { FaTrophy, FaCoins, } from 'react-icons/fa';
import { getTONPrice } from '@/lib/api';

interface GMPEntry {
  position: number | undefined;  // Allow undefined for position
  username: string;
  pool_share: number;
  expected_reward: number;
  total_sbt: number;
  total_earned?: number;  // Add this field for earnings
  isGap?: boolean;
}

interface PoolStats {
  totalPool: number;
  totalParticipants: number;
  lastDistribution: string;
}

interface UserEntry {
  username: string;
  total_sbt: number;
  total_earned?: number;  // Add this field
  id: string;
  isGap?: boolean;
  position?: number;
}

const GMPLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GMPEntry[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalPool: 0,
    totalParticipants: 0,
    lastDistribution: ''
  });
  const [userStats, setUserStats] = useState({
    position: '-',
    shares: 0,
    reward: 0,
    totalShares: 0,
    poolSize: 0
  });
  const [, setTonPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'sbt' | 'earnings'>('earnings'); // Default to earnings

  // Add caching mechanism
  const cacheKey = useMemo(() => `gmp_data_${user?.id}`, [user?.id]);
  const cacheDuration = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const fetchGMPData = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheDuration) {
            setEntries(data.entries);
            setUserStats(data.userStats);
            setTonPrice(data.tonPrice);
            setPoolStats(data.poolStats);
            setIsLoading(false);
            return;
          }
        }

        // Fetch data in parallel
        const [price, poolStatsData, leaderboardData, userRankData] = await Promise.all([
          getTONPrice(),
          gmpSystem.getPoolStats(),
          supabase
            .from('users')
            .select('username, total_sbt, total_earned, id')  // Add total_earned to the query
            .gt(sortBy === 'sbt' ? 'total_sbt' : 'total_earned', 0)  // Filter based on sort
            .order(sortBy === 'sbt' ? 'total_sbt' : 'total_earned', { ascending: false })  // Order based on sort
            .limit(500),
          // Fetch user's rank specifically if they're not in top 500
          user?.username ? supabase.rpc(
            sortBy === 'sbt' ? 'get_user_rank' : 'get_user_earnings_rank', 
            { p_username: user.username }
          ) : Promise.resolve(null)
        ]);

        setTonPrice(price);

        // Updated validation to match the actual data structure
        const poolStats = Array.isArray(poolStatsData) ? poolStatsData[0] : poolStatsData;
        
        setPoolStats({
          totalPool: poolStats.pool_size || 0,
          totalParticipants: poolStats.active_users || 0,
          lastDistribution: poolStats.last_distribution || ''
        });

        if (leaderboardData.error) {
          throw leaderboardData.error;
        }

        const users = (leaderboardData.data || []) as UserEntry[];
        let userRank = null;
        
        // If user exists but not in top entries, add them to the list
        if (user?.username && userRankData) {
          const userInList = users.some(u => u.username === user.username);
          if (!userInList) {
            const { data: userData } = await supabase
              .from('users')
              .select('username, total_sbt, id')
              .eq('username', user.username)
              .single();
              
            if (userData) {
              const { data: rankData } = await supabase.rpc(
                sortBy === 'sbt' ? 'get_user_rank' : 'get_user_earnings_rank', 
                { p_username: user.username }
              );
              userRank = rankData as number;

              users.push({
                ...userData,
                position: userRank,
                isGap: true
              });
              // Sort again to maintain order
              users.sort((a, b) => (b.total_sbt || 0) - (a.total_sbt || 0));
            }
          }
        }

        // Calculate total SBT and user stats
        const totalSBT = users.reduce((sum, user) => sum + (Number(user.total_sbt) || 0), 0);

        // Format leaderboard entries
        const formattedEntries = users.map((entry, index) => {
          const userSBT = Number(entry.total_sbt) || 0;
          const userEarned = Number(entry.total_earned) || 0;
          const reward = totalSBT > 0 ? (userSBT / totalSBT) * poolStats.pool_size : 0;

          return {
            position: entry.isGap ? entry.position : index + 1,
            username: entry.username || 'Anonymous',
            pool_share: userSBT,
            total_sbt: userSBT,
            total_earned: userEarned,
            expected_reward: reward,
            isGap: entry.isGap
          };
        });

        setEntries(formattedEntries);

        // Set user stats if user exists and maintain previous stats if not found
        if (user?.id) {
          const userEntry = formattedEntries.find(e => e.username === user.username);
          setUserStats(prevStats => ({
            position: userEntry?.position?.toString() || prevStats.position || '-',
            shares: userEntry?.total_sbt || prevStats.shares || 0,
            reward: userEntry?.expected_reward || prevStats.reward || 0,
            totalShares: totalSBT,
            poolSize: poolStats.pool_size || 0
          }));
        }

        // Cache the results
        localStorage.setItem(cacheKey, JSON.stringify({
          data: {
            entries: formattedEntries,
            userStats: userStats,
            tonPrice: price,
            poolStats: {
              totalPool: poolStats.pool_size || 0,
              totalParticipants: poolStats.active_users || 0,
              lastDistribution: poolStats.last_distribution || ''
            }
          },
          timestamp: Date.now()
        }));

      } catch (error) {
        console.error('Error fetching GMP data:', error);
        setError('Failed to load GMP data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGMPData();

    // Set up auto-refresh interval
    const refreshInterval = setInterval(fetchGMPData, cacheDuration);
    return () => clearInterval(refreshInterval);
  }, [user, cacheKey, sortBy]);

  // Add error boundary
  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-white';
    }
  };

  return (
    <div className=" rounded-xl p-2 flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* Stats Cards - Mobile Friendly */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
        {/* Rank Card */}
        <div className="relative bg-gradient-to-br from-black/40 to-black/20 rounded-xl p-3 sm:p-3.5 border border-white/[0.08] overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center sm:block">
            <div className="flex items-center gap-2 mb-0 sm:mb-2 flex-1">
              <div className="bg-yellow-400/10 p-1.5 rounded-lg">
                <FaTrophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              </div>
              <span className="text-xs sm:text-[13px] text-gray-400 font-medium">Your Rank</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-white text-right sm:text-left">
              #{userStats.position}
              <span className="text-[10px] sm:text-xs text-gray-500 ml-1">/ {poolStats.totalParticipants}</span>
            </p>
          </div>
        </div>

        {/* Shares Card */}
        <div className="relative bg-gradient-to-br from-black/40 to-black/20 rounded-xl p-3 sm:p-3.5 border border-white/[0.08] overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center sm:block">
            <div className="flex items-center gap-2 mb-0 sm:mb-2 flex-1">
              <div className="bg-blue-400/10 p-1.5 rounded-lg">
                <FaCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              </div>
              <span className="text-xs sm:text-[13px] text-gray-400 font-medium">Nova Tokens</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-white text-right sm:text-left">
              {userStats.shares?.toLocaleString()}
              <span className="text-[10px] sm:text-xs text-gray-500 ml-1">tokens</span>
            </p>
          </div>
        </div>

        {/* Players Card */}
        <div className="relative bg-gradient-to-br from-black/40 to-black/20 rounded-xl p-3 sm:p-3.5 border border-white/[0.08] overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center sm:block">
            <div className="flex items-center gap-2 mb-0 sm:mb-2 flex-1">
              <div className="bg-purple-400/10 p-1.5 rounded-lg">
                <span className="text-base sm:text-lg">👥</span>
              </div>
              <span className="text-xs sm:text-[13px] text-gray-400 font-medium">Novators</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-white text-right sm:text-left">
              {poolStats.totalParticipants?.toLocaleString()}
              <span className="text-[10px] sm:text-xs text-gray-500 ml-1">active</span>
            </p>
          </div>
        </div>
      </div>
      {/* Compact Sort Controls */}
      <div className="flex justify-center mb-3">
        <div className="bg-black/30 p-1 rounded-lg border border-white/5">
          <button 
            className={`text-sm px-4 py-1.5 rounded-md transition-all font-medium ${
              sortBy === 'earnings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white/80'
            }`}
            onClick={() => setSortBy('earnings')}
          >
            Earnings
          </button>
          <button 
            className={`text-sm px-4 py-1.5 rounded-md transition-all font-medium ${
              sortBy === 'sbt' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white/80'
            }`}
            onClick={() => setSortBy('sbt')}
          >
            Nova Tokens
          </button>
        </div>
      </div>

      {/* Compact Leaderboard */}
      <div className="bg-black/30 rounded-lg overflow-hidden flex-1 flex flex-col border border-white/5">
        <div className="grid grid-cols-12 text-xs text-gray-400 px-3 py-2 border-b border-white/10 bg-black/20">
          <div className="col-span-2">Rank</div>
          <div className="col-span-6">Player</div>
          <div className="col-span-4 text-right">
            {sortBy === 'sbt' ? 'Nova Tokens' : 'Earnings'}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {entries.map((entry, index) => {
            const showGapIndicator = index > 0 && entry.isGap;
            const isCurrentUser = user?.username === entry.username;
            const displayValue = sortBy === 'sbt' ? entry.total_sbt : entry.total_earned;
            
            return (
              <div key={`${entry.username}-${entry.position}`}>
                {showGapIndicator && (
                  <div className="px-3 py-1 text-[10px] text-gray-500 text-center bg-white/[0.02]">•••</div>
                )}
                <div 
                  className={`grid grid-cols-12 text-xs px-3 py-2 ${
                    isCurrentUser ? 'bg-white/10' : index % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className={`col-span-2 ${getPositionColor(entry.position || 0)}`}>
                    {entry.position && entry.position <= 3 
                      ? ['👑', '🥈', '🥉'][entry.position - 1]
                      : entry.position}
                  </div>
                  <div className="col-span-6 flex items-center gap-1.5 truncate">
                    <span className="truncate">{entry.username}</span>
                    {isCurrentUser && (
                      <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="col-span-4 text-right">
                    {displayValue?.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to get week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function(): number {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default GMPLeaderboard;