import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '@/hooks/useAuth'
import { GiTrophyCup } from 'react-icons/gi'
import { MdDiamond } from 'react-icons/md'
import ReferralContest from './ReferralContest'
// import { novatoken } from '@/images' // Removed as we're using RZC now

// Update the interface to match your table structure
interface ReferralWithUsers {
  id: number;
  sponsor_id: number;
  referred_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  level: number;
  sponsor: {
    username: string;
    telegram_id: number;
  };
  referred: {
    username: string;
    telegram_id: number;
    total_earned: number;
    total_deposit: number;
    rank: string;
    is_premium: boolean;
  };
  sbt_amount: number;
  total_sbt_earned: number;
}


type SponsorDataFromDB = {
  sponsor_id: number;
  sponsor: {
    username: string;
    total_earned: number;
    total_deposit: number;
    rank: string;
  } | null;
  status: string;
}

interface SponsorStat {
  sponsor_id: number;
  username: string;
  referral_count: number;
  active_referrals: number;
  total_earned: number;
  total_deposit: number;
  rank: string;
}


// Update the constant
const ACTIVE_REFERRAL_REWARD =50; // 1000 RZC per active referral

// Add proper type for tree state
interface TreeUser {
  id: number;
  username: string;
  created_at: string;
  is_active: boolean;
  is_premium: boolean;
}


interface TreeData {
  upline: TreeUser | null;
  downline: TreeUser[];
}

type ReferralWithUser = {
  referred: {
    id: number;
    username: string;
    created_at: string;
    is_active: boolean;
    is_premium: boolean;
  }
}

// Add this helper function near the top of the file
const isRecentlyJoined = (dateString: string): boolean => {
  const joinDate = new Date(dateString);
  const now = new Date();
  const daysDifference = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDifference <= 7; // Consider users joined within last 7 days as recent
};

const ReferralSystem = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [allSponsorStats, setAllSponsorStats] = useState<SponsorStat[]>([]);
  const [userReferralCount, setUserReferralCount] = useState<number>(0);
  const [userActiveReferrals, setUserActiveReferrals] = useState<number>(0);


  // Add a new state for user's referrals
  const [userReferrals, setUserReferrals] = useState<ReferralWithUsers[]>([]);

  // Add state for active tab
  const [activeTab, setActiveTab] = useState<'my-referrals' | 'statistics'>('my-referrals');

  // Add state for showing all referrals modal
  const [showAllReferrals, setShowAllReferrals] = useState<boolean>(false);

  // Add state for showing referral contest
  const [showReferralContest, setShowReferralContest] = useState<boolean>(false);

  // Simple snackbar function for ReferralContest
  const showSnackbar = (config: { message: string; description?: string }) => {
    // You can integrate with your existing notification system here
    console.log('Snackbar:', config.message, config.description);
    // For now, we'll just log it. You can replace this with your actual snackbar implementation
    if (typeof window !== 'undefined' && (window as any).showSnackbar) {
      (window as any).showSnackbar(config);
    }
  };

  // Add new state for active referral rewards
  const [activeReferralReward, setActiveReferralReward] = useState<number>(0);

  // Add state for duplicate detection and removal
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isClearingDuplicates, setIsClearingDuplicates] = useState(false);

  const [tree, setTree] = useState<TreeData>({ upline: null, downline: [] });

  const [isTreeLoading, setIsTreeLoading] = useState(false);



  const loadTree = async () => {
    if (!user?.id) return;
    setIsTreeLoading(true);
    try {
      const data = await getReferralTree(user.id);
      setTree(data);
    } catch (error) {
      console.error('Error loading referral tree:', error);
    } finally {
      setIsTreeLoading(false);
    }
  };



  useEffect(() => {
    loadTree();
  }, [user?.id]);


  useEffect(() => {
    if (!user?.id) return;
    const subscription = supabase
      .channel('referral_tree_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `referral_id=eq.${user.id}`
        },
        loadTree
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);


  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Starting loadData function");
        // First get the total count of all referrals
        const { error: countError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Get current user's referral count if user exists
        if (user?.id) {
          console.log("Attempting to get user referrals in loadData for user ID:", user.id);
          const { data: userReferrals, error: userRefError } = await supabase
            .from('referrals')
            .select('id, status')
            .eq('sponsor_id', user.id);
            
          if (userRefError) {
            console.error("Error fetching user referrals in loadData:", userRefError);
          }
          
          if (!userRefError && userReferrals) {
            console.log("User referrals found in loadData:", userReferrals.length);
            setUserReferralCount(userReferrals.length);
            setUserActiveReferrals(userReferrals.filter(r => r.status === 'active').length);
          } else {
            console.log("No user referrals found in loadData");
          }
        } else {
          console.log("No user ID available in loadData");
        }

        // Get sponsor stats with counts
        const { data: sponsorStatsData } = await supabase
          .from('referrals')
          .select(`
            sponsor_id,
            sponsor:users!sponsor_id(
              username,
              total_earned,
              total_deposit,
              rank
            ),
            status
          `) as { data: SponsorDataFromDB[] | null, error: any };

        if (!sponsorStatsData) return { data: [] };
        const counts = sponsorStatsData.reduce((acc: { [key: string]: any }, curr) => {
          const id = curr.sponsor_id;
          if (!acc[id]) {
            acc[id] = {
              sponsor_id: id,
              username: curr.sponsor?.username,
              referral_count: 0,
              active_referrals: 0,
              total_earned: curr.sponsor?.total_earned || 0,
              total_deposit: curr.sponsor?.total_deposit || 0,
              rank: curr.sponsor?.rank || 'RZC_INITIATE'
            };
          }
          acc[id].referral_count++;
          if (curr.status === 'active') {
            acc[id].active_referrals++;
          }
          return acc;
        }, {});
        
        const sponsorStats = Object.values(counts);
        setAllSponsorStats(sponsorStats);
      } catch (err) {
        console.error('Error in loadData:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('referrals_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'referrals'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);


  // Update the reward calculation function
  const calculateActiveReferralReward = (referrals: ReferralWithUsers[]): number => {
    return referrals.reduce((total, referral) => {
      if (referral.status === 'active') {
        // Premium users give 2000 TAPPS, others give 1000 TAPPS
        return total + (referral.referred?.is_premium ? 2000 : ACTIVE_REFERRAL_REWARD);
      }
      return total;
    }, 0);
  };

  

  // Update the updateReferralStats function
  const updateReferralStats = (referrals: ReferralWithUsers[]) => {
    const activeCount = referrals.filter(r => r.status === 'active').length;
    setUserReferralCount(referrals.length);
    setUserActiveReferrals(activeCount);
    
    // Calculate reward based on premium status
    const reward = calculateActiveReferralReward(referrals);
    setActiveReferralReward(reward);
  };

  // Function to detect duplicate referrals
  const checkForDuplicates = async () => {
    if (!user?.id) return;
    
    setIsCheckingDuplicates(true);
    try {
      // Get all referrals where user is sponsor
      const { data: allReferrals, error } = await supabase
        .from('referrals')
        .select('id, sponsor_id, referred_id, created_at')
        .eq('sponsor_id', user.id);

      if (error) {
        console.error('Error checking for duplicates:', error);
        showSnackbar({
          message: 'Error',
          description: 'Failed to check for duplicate referrals.'
        });
        return;
      }

      if (!allReferrals || allReferrals.length === 0) {
        setDuplicateCount(0);
        return;
      }

      // Group by sponsor_id and referred_id to find duplicates
      const referralMap = new Map<string, Array<{ id: number; created_at: string }>>();
      
      allReferrals.forEach((ref) => {
        const key = `${ref.sponsor_id}_${ref.referred_id}`;
        if (!referralMap.has(key)) {
          referralMap.set(key, []);
        }
        referralMap.get(key)!.push({ id: ref.id, created_at: ref.created_at });
      });

      // Count duplicates (entries with more than 1 referral)
      let duplicates = 0;
      referralMap.forEach((entries) => {
        if (entries.length > 1) {
          duplicates += entries.length - 1; // Keep one, remove the rest
        }
      });

      setDuplicateCount(duplicates);

      if (duplicates > 0) {
        showSnackbar({
          message: 'Duplicates Found',
          description: `Found ${duplicates} duplicate referral${duplicates > 1 ? 's' : ''}. Click "Clear Duplicates" to remove them.`
        });
      } else {
        showSnackbar({
          message: 'No Duplicates',
          description: 'All referral entries are unique.'
        });
      }
    } catch (err) {
      console.error('Error in checkForDuplicates:', err);
      showSnackbar({
        message: 'Error',
        description: 'Failed to check for duplicates.'
      });
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Function to remove duplicate referrals (keeping the oldest one)
  const clearDuplicateReferrals = async () => {
    if (!user?.id || duplicateCount === 0) return;
    
    if (!confirm(`Are you sure you want to remove ${duplicateCount} duplicate referral${duplicateCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setIsClearingDuplicates(true);
    try {
      // Get all referrals where user is sponsor
      const { data: allReferrals, error: fetchError } = await supabase
        .from('referrals')
        .select('id, sponsor_id, referred_id, created_at')
        .eq('sponsor_id', user.id)
        .order('created_at', { ascending: true }); // Oldest first

      if (fetchError) {
        console.error('Error fetching referrals for cleanup:', fetchError);
        showSnackbar({
          message: 'Error',
          description: 'Failed to fetch referrals for cleanup.'
        });
        return;
      }

      if (!allReferrals || allReferrals.length === 0) {
        setDuplicateCount(0);
        return;
      }

      // Group by sponsor_id and referred_id
      const referralMap = new Map<string, Array<{ id: number; created_at: string }>>();
      
      allReferrals.forEach((ref) => {
        const key = `${ref.sponsor_id}_${ref.referred_id}`;
        if (!referralMap.has(key)) {
          referralMap.set(key, []);
        }
        referralMap.get(key)!.push({ id: ref.id, created_at: ref.created_at });
      });

      // Collect IDs to delete (all except the first/oldest one for each pair)
      const idsToDelete: number[] = [];
      referralMap.forEach((entries) => {
        if (entries.length > 1) {
          // Keep the first one (oldest), delete the rest
          const duplicates = entries.slice(1);
          idsToDelete.push(...duplicates.map(e => e.id));
        }
      });

      if (idsToDelete.length === 0) {
        setDuplicateCount(0);
        showSnackbar({
          message: 'No Duplicates',
          description: 'No duplicates found to remove.'
        });
        return;
      }

      // Delete duplicate entries
      const { error: deleteError } = await supabase
        .from('referrals')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting duplicates:', deleteError);
        showSnackbar({
          message: 'Error',
          description: 'Failed to remove duplicate referrals.'
        });
        return;
      }

      const removedCount = idsToDelete.length;
      setDuplicateCount(0);
      
      // Reload referrals after cleanup
      await loadUserReferrals();
      await loadTree();
      
      // Reload user referral counts
      if (user?.id) {
        const { data: userReferrals } = await supabase
          .from('referrals')
          .select('id, status')
          .eq('sponsor_id', user.id);
        
        if (userReferrals) {
          setUserReferralCount(userReferrals.length);
          setUserActiveReferrals(userReferrals.filter(r => r.status === 'active').length);
        }
      }

      showSnackbar({
        message: 'Success',
        description: `Removed ${removedCount} duplicate referral${removedCount > 1 ? 's' : ''}.`
      });
    } catch (err) {
      console.error('Error in clearDuplicateReferrals:', err);
      showSnackbar({
        message: 'Error',
        description: 'Failed to clear duplicate referrals.'
      });
    } finally {
      setIsClearingDuplicates(false);
    }
  };

  // Update loadUserReferrals to include SBT token tracking
  const loadUserReferrals = async () => {
    if (!user?.id) {
      console.log("No user ID available in loadUserReferrals");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          sponsor:users!sponsor_id(
            username,
            telegram_id
          ),
          referred:users!referred_id(
            username,
            telegram_id,
            total_earned,
            total_deposit,
            rank,
            is_premium,
            is_active
          ),
          sbt_amount,
          total_sbt_earned
        `)
        .eq('sponsor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        throw error;
      }

      console.log("Fetched referrals:", data);
      setUserReferrals(data || []);
      updateReferralStats(data || []);

    } catch (err) {
      console.error('Error in loadUserReferrals:', err);
    }
  };

  // Call this function when the component loads
  useEffect(() => {
    if (user?.id) {
      console.log("Calling loadUserReferrals from useEffect for user ID:", user.id);
      loadUserReferrals();
    } else {
      console.log("No user ID available in loadUserReferrals useEffect");
    }
  }, [user?.id]);


  
  // Function to get upline/downline
  const getReferralTree = async (userId: number): Promise<TreeData> => {
    try {
      console.log('getReferralTree called for userId:', userId);

      // Get upline (who referred you) - first check referrals table, then fallback to users table
      let sponsorId = null;

      // Check referrals table first
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('sponsor_id')
        .eq('referred_id', userId)
        .maybeSingle();

      console.log('Referral data lookup result:', { referralData, referralError });

      if (referralData?.sponsor_id) {
        sponsorId = referralData.sponsor_id;
        console.log('Found sponsor from referrals table:', sponsorId);
      } else {
        // Fallback: check if sponsor_id is set directly on users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('sponsor_id')
          .eq('id', userId)
          .maybeSingle();

        console.log('User data lookup result:', { userData, userError });

        if (userData?.sponsor_id) {
          sponsorId = userData.sponsor_id;
          console.log('Found sponsor from users table:', sponsorId);
        }
      }

      let uplineData = null;
      if (sponsorId) {
        const { data: upline, error: uplineError } = await supabase
          .from('users')
          .select('id, username, created_at, is_active, is_premium')
          .eq('id', sponsorId)
          .single();

        console.log('Upline data lookup result:', { upline, uplineError });

        if (upline && !uplineError) {
          uplineData = upline;
        } else {
          console.error('Failed to fetch upline data:', uplineError);
        }
      } else {
        console.log('No sponsor ID found for user:', userId);
      }

      // Get downline (people you referred)
      const { data: downline, error: downlineError } = await supabase
        .from('referrals')
        .select(`
          referred:users!referred_id(
            id,
            username,
            created_at,
            is_active,
            is_premium
          )
        `)
        .eq('sponsor_id', userId)
        .order('created_at', { ascending: false }) as { data: ReferralWithUser[] | null, error: any };

      console.log('Downline data lookup result:', { downline: downline?.length || 0, downlineError });

      return {
        upline: uplineData,
        downline: (downline || []).map(({ referred }) => ({
          id: referred.id,
          username: referred.username,
          created_at: referred.created_at,
          is_active: referred.is_active,
          is_premium: referred.is_premium
        }))
      };
    } catch (error) {
      console.error('Error in getReferralTree:', error);
      return { upline: null, downline: [] };
    }
  };

  // Update the formatDate function to include "time ago" for recent joins
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

      if (diffDays === 0) {
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return `${diffMinutes} minutes ago`;
        }
        return `${diffHours} hours ago`;
      }
      if (diffDays < 7) {
        return `${diffDays} days ago`;
      }
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto relative overflow-hidden flex flex-col sm:max-w-lg md:max-w-xl">
        {/* Tab Navigation Skeleton */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center justify-center gap-1 p-1.5 bg-gray-900/60 rounded-2xl border border-gray-700/60 backdrop-blur-md">
            <div className="px-4 py-2.5 text-sm rounded-xl bg-gray-800/60 animate-pulse">
              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="px-4 py-2.5 text-sm rounded-xl bg-gray-800/60 animate-pulse">
              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeletons */}
        <div className="flex flex-col gap-3 sm:gap-4 font-mono">
          {/* Referral Contest Skeleton */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-700/60 backdrop-blur-md">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gray-800/50 rounded-xl animate-pulse">
                  <div className="h-3 w-12 bg-gray-600 rounded mb-2"></div>
                  <div className="h-6 w-8 bg-gray-600 rounded"></div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl animate-pulse">
                  <div className="h-3 w-16 bg-gray-600 rounded mb-2"></div>
                  <div className="h-6 w-6 bg-gray-600 rounded"></div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl animate-pulse">
                  <div className="h-3 w-14 bg-gray-600 rounded mb-2"></div>
                  <div className="h-6 w-10 bg-gray-600 rounded"></div>
                </div>
              </div>
              <div className="h-12 w-full bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Network Section Skeleton */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-700/60 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {/* Upline Skeleton */}
              <div>
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-6 w-24 bg-gray-700 rounded mb-1"></div>
                      <div className="h-4 w-16 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Downline Skeleton */}
              <div>
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-3"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-6 w-20 bg-gray-700 rounded mb-1"></div>
                            <div className="h-4 w-14 bg-gray-600 rounded"></div>
                          </div>
                        </div>
                        <div className="h-6 w-16 bg-gray-700 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative overflow-hidden flex flex-col sm:max-w-lg md:max-w-xl">
      {/* Enhanced Background with Gradient */}

      {/* Enhanced Tab Navigation */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-center gap-1 p-1.5 bg-gray-900/60 rounded-2xl border border-gray-700/60 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <button
            onClick={() => setActiveTab('my-referrals')}
            className={`relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 overflow-hidden ${
              activeTab === 'my-referrals'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white border border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.4)] transform scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:shadow-[0_0_10px_rgba(75,85,99,0.2)]'
            }`}
          >
            {activeTab === 'my-referrals' && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent animate-pulse"></div>
            )}
            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="relative z-10">My Network</span>
          </button>

          <button
            onClick={() => setActiveTab('statistics')}
            className={`relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 overflow-hidden ${
              activeTab === 'statistics'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.4)] transform scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60 hover:shadow-[0_0_10px_rgba(75,85,99,0.2)]'
            }`}
          >
            {activeTab === 'statistics' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
            )}
            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="relative z-10">Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Main Container - Simplified & Well Scaled */}
      <div className="relative shadow-lg overflow-hidden">

        {/* Header - Simplified */}


      {/* Wallet Content */}
      <div className="flex flex-col gap-3 sm:gap-4 font-mono">

      {activeTab === 'my-referrals' ? (
        <>
          {showReferralContest ? (
            <div className="space-y-4">
              {/* Back Button */}
              <button
                onClick={() => setShowReferralContest(false)}
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Back to My Network</span>
              </button>
              <ReferralContest
                showSnackbar={showSnackbar}
                onClose={() => setShowReferralContest(false)}
              />
            </div>
          ) : (
            <>

          {/* Enhanced Referral Contest Card */}
          <div className="relative overflow-hidden rounded-2xl font-mono p-4 text-center bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-orange-500/10 border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.2)] backdrop-blur-md">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-yellow-500/5 to-orange-500/5 animate-pulse"></div>

            {/* Enhanced Corner accents */}
            <div className="pointer-events-none absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-orange-400/60 rounded-tl-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]"></div>
            <div className="pointer-events-none absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-orange-400/60 rounded-tr-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]"></div>
            <div className="pointer-events-none absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-orange-400/60 rounded-bl-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]"></div>
            <div className="pointer-events-none absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-orange-400/60 rounded-br-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-400/40 shadow-lg">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">🏆 Referral Contest</h3>
                  <p className="text-orange-300/80 text-xs">Win exclusive rewards!</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-300 bg-gray-800/30 rounded-lg p-3 border border-gray-600/30">
                  🔥 Compete for exclusive rewards! Top referrers win special prizes and bonuses.
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300">
                    <div className="text-xs text-blue-300/80 mb-1 font-semibold">Your Rank</div>
                    <div className="text-lg font-bold text-blue-400">#{userReferralCount > 0 ? Math.floor(Math.random() * 50) + 1 : 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-400/30 hover:border-green-400/50 transition-all duration-300">
                    <div className="text-xs text-green-300/80 mb-1 font-semibold">Active Refs</div>
                    <div className="text-lg font-bold text-green-400">{userActiveReferrals}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
                    <div className="text-xs text-purple-300/80 mb-1 font-semibold">RZC Earned</div>
                    <div className="text-lg font-bold text-purple-400">{activeReferralReward.toLocaleString()}</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowReferralContest(true)}
                  className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 hover:from-orange-500 hover:via-orange-400 hover:to-yellow-400 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] transform hover:scale-105">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span>Join Contest</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span>Contest ends in 7 days • Invite more friends to climb the ranks!</span>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Network Section */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-700/60 backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.15)] overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 border border-green-400/30">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">🌐 Your Network</h2>
                </div>
                
                {/* Duplicate Management Buttons */}
                <div className="flex items-center gap-2">
                  {duplicateCount > 0 && (
                    <div className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-400/30 text-xs font-semibold">
                      {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''}
                    </div>
                  )}
                  <button
                    onClick={checkForDuplicates}
                    disabled={isCheckingDuplicates || isClearingDuplicates}
                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-400/30 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    title="Check for duplicate referrals"
                  >
                    {isCheckingDuplicates ? (
                      <>
                        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        Checking...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Check
                      </>
                    )}
                  </button>
                  {duplicateCount > 0 && (
                    <button
                      onClick={clearDuplicateReferrals}
                      disabled={isClearingDuplicates || isCheckingDuplicates}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-400/30 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      title="Remove duplicate referrals"
                    >
                      {isClearingDuplicates ? (
                        <>
                          <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          Clearing...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isTreeLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Upline Section */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <span className="text-blue-400">👆</span>
                      Your Sponsor
                    </h4>
                    {tree.upline ? (
                      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-blue-400/30 shadow-lg">
                            <span className="text-white font-bold text-base">
                              {tree.upline.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-semibold text-base">{tree.upline.username}</p>
                              {isRecentlyJoined(tree.upline.created_at) && (
                                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-400/30">
                                  New
                                </span>
                              )}
                              {tree.upline.is_premium && (
                                <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-full flex items-center gap-1 border border-yellow-400/30">
                                  <MdDiamond className="w-3 h-3 text-yellow-400" />
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              Joined {formatDate(tree.upline.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
                        <div className="text-3xl mb-2">🔗</div>
                        <p className="text-gray-400 text-sm">No sponsor yet</p>
                        <p className="text-xs text-gray-500 mt-1">Use a sponsor code to join a team</p>
                      </div>
                    )}
                  </div>

                  {/* Downline Section */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="text-green-400">👇</span>
                        Your Team ({tree.downline.length})
                      </h4>
                    </div>

                    {tree.downline.length > 0 ? (
                      <div className="space-y-2">
                        {tree.downline.slice(0, 5).map((user) => (
                          <div key={user.id} className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300 hover:shadow-[0_0_15px_rgba(75,85,99,0.2)]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center border-2 border-green-400/30 shadow-lg">
                                  <span className="text-white font-bold text-base">
                                    {user.username?.[0]?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-white font-semibold text-base">{user.username}</p>
                                    {isRecentlyJoined(user.created_at) && (
                                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-400/30">
                                        New
                                      </span>
                                    )}
                                    {user.is_premium && (
                                      <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-full flex items-center gap-1 border border-yellow-400/30">
                                        <MdDiamond className="w-3 h-3 text-yellow-400" />
                                        Premium
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400">
                                    Joined {formatDate(user.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className={`px-3 py-1.5 rounded-full border text-xs font-bold ${
                                user.is_active ? 'bg-green-500/20 text-green-400 border-green-400/30' : 'bg-gray-700/50 text-gray-400 border-gray-600/50'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </div>
                            </div>
                          </div>
                        ))}

                        {tree.downline.length > 5 && (
                          <div className="text-center mt-4">
                            <button
                              onClick={() => setShowAllReferrals(true)}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <span>See all {tree.downline.length} team members</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/50">
                        <div className="text-4xl mb-3">🎯</div>
                        <p className="text-gray-300 text-sm font-medium">Share your sponsor link to build your team!</p>
                        <p className="text-xs text-gray-500 mt-2">Earn RZC rewards for each active member</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
            </>
          )}
          </>
      ) : (
        // Statistics Tab Content
        <>
          {showReferralContest ? (
            <div className="space-y-4">
              {/* Back Button */}
              <button
                onClick={() => setShowReferralContest(false)}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Back to Leaderboard</span>
              </button>
              <ReferralContest
                showSnackbar={showSnackbar}
                onClose={() => setShowReferralContest(false)}
              />
            </div>
          ) : (
            <>
          {/* Enhanced Leaderboard Header */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-700/60 backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.15)] overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5"></div>

            <div className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20 border border-green-400/30">
                      <GiTrophyCup className="text-green-400 text-2xl" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30">
                        <span className="text-sm font-semibold text-green-400">🏆 Global Leaders</span>
                        <span className="text-xs text-green-300">Top Sponsors</span>
                      </div>
                      <h1 className="text-xl md:text-2xl font-extrabold text-white mt-2">RhizaCore Champions</h1>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm max-w-2xl">
                    🌟 See the top performing sponsors worldwide. Build your team and climb the ranks to earn exclusive rewards!
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 shadow-lg">
                    <div className="text-center">
                      <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Total Sponsors</div>
                      <div className="text-2xl font-bold text-green-300">{allSponsorStats.length.toLocaleString()}</div>
                      <div className="text-xs text-green-400/80 mt-1">Active Leaders</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-800/50 border border-gray-600/50">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400 font-medium">Live Rankings</span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Leaderboard */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-gray-700/60 backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.15)] overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-400/30">
                    <GiTrophyCup className="text-yellow-400 text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Top Sponsors</h2>
                    <p className="text-sm text-gray-400">Ranked by active team size</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Showing top 10</div>
                </div>
              </div>

              {/* Mobile View (Enhanced Card Layout) */}
              <div className="md:hidden space-y-3">
                {allSponsorStats
                  .sort((a, b) => b.active_referrals - a.active_referrals)
                  .slice(0, 10)
                  .map((sponsor, index) => {
                    const isTopThree = index < 3;
                    const rankNumber = index + 1;

                    return (
                      <div
                        key={sponsor.sponsor_id}
                        className={`relative p-4 rounded-xl border transition-all duration-300 overflow-hidden ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border-yellow-400/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-600/50 to-gray-700/50 border-gray-500/50 shadow-[0_0_15px_rgba(75,85,99,0.2)]'
                            : index === 2
                            ? 'bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-orange-400/40 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                            : 'bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 hover:border-gray-500/70'
                        }`}
                      >
                        {/* Animated background for top players */}
                        {isTopThree && (
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 animate-pulse"></div>
                        )}

                        <div className="relative z-10 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                            'bg-gradient-to-br from-gray-600 to-gray-800 text-white'
                          }`}>
                            {index < 3 ? (
                              <span className="text-xl">
                                {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="text-sm font-mono">{rankNumber}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-bold text-lg ${
                                isTopThree ? 'text-yellow-300' : 'text-white'
                              }`}>
                                {sponsor.username}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full border font-semibold ${
                                sponsor.active_referrals > 0
                                  ? 'bg-green-500/20 text-green-400 border-green-400/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                              }`}>
                                {sponsor.active_referrals > 0 ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Active Team Size:</span>
                              <span className={`font-bold text-lg ${
                                isTopThree ? 'text-yellow-300' : 'text-green-400'
                              }`}>
                                {sponsor.active_referrals}
                              </span>
                            </div>
                            {/* {sponsor.rank && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30">
                                  {sponsor.rank}
                                </span>
                              </div>
                            )} */}
                          </div>
                        </div>

                        {/* Achievement indicator for top players */}
                        {isTopThree && (
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center">
                              <span className="text-yellow-400 text-xs">⭐</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Desktop View (Enhanced Table Layout) */}
              <div className="hidden md:block">
                <div className="overflow-hidden rounded-xl border border-gray-600/50">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-b border-gray-600/50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-20">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Sponsor</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Team Size</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSponsorStats
                        .sort((a, b) => b.active_referrals - a.active_referrals)
                        .slice(0, 10)
                        .map((sponsor, index) => {
                          const isTopThree = index < 3;
                          return (
                            <tr
                              key={sponsor.sponsor_id}
                              className={`border-b border-gray-700/30 last:border-0 transition-all duration-300 hover:bg-gray-800/40 ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5' :
                                index === 1 ? 'bg-gradient-to-r from-gray-600/20 to-gray-700/20' :
                                index === 2 ? 'bg-gradient-to-r from-orange-500/10 to-orange-500/5' : ''
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  {index < 3 ? (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                                      <span className="text-xl">
                                        {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    isTopThree ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' :
                                    'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                                  }`}>
                                    {sponsor.username?.[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <span className={`font-semibold ${
                                      isTopThree ? 'text-yellow-300' : 'text-white'
                                    }`}>
                                      {sponsor.username}
                                    </span>
                                    {sponsor.rank && (
                                      <div className="mt-1">
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-400/30">
                                          {sponsor.rank}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`font-bold text-lg ${
                                  isTopThree ? 'text-yellow-300' : 'text-green-400'
                                }`}>
                                  {sponsor.active_referrals}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`px-3 py-1 text-xs rounded-full border font-semibold ${
                                  sponsor.active_referrals > 0
                                    ? 'bg-green-500/20 text-green-400 border-green-400/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                                }`}>
                                  {sponsor.active_referrals > 0 ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </>
      )}

        </div>
      </div>

      {/* Modal for All Team Members */}
      {showAllReferrals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative rounded-2xl bg-gray-900 border border-gray-700 shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Your Team Members</h3>
                <p className="text-sm text-gray-400">All {userReferrals.length} team members</p>
              </div>
              <button
                onClick={() => setShowAllReferrals(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {userReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 relative border border-green-400/30">
                        {referral.referred?.username?.charAt(0).toUpperCase() || '?'}
                        {referral.referred?.is_premium && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg border border-yellow-300/50">
                            <MdDiamond className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          {referral.referred?.username || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {referral.referred?.username ? (
                            <a
                              href={`https://t.me/${referral.referred.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300"
                            >
                              View Profile
                            </a>
                          ) : 'No Telegram ID'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-full border ${
                        referral.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border-green-400/30'
                          : 'bg-gray-700/50 text-gray-400 border-gray-600/50'
                      }`}>
                        <span className="text-xs font-bold">
                          {referral.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {referral.referred?.is_premium && (
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-3 py-1.5 rounded-full border border-yellow-400/30">
                          <span className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                            <MdDiamond className="w-3 h-3 text-yellow-400" />
                            Premium
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSystem;