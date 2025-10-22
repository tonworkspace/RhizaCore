import { useState, useEffect } from 'react';
import { supabase, ensureUserHasSponsorCode } from '../lib/supabaseClient';

// Assuming these types are defined elsewhere, or I'd need to add them.
// For this example, I'll add placeholder types for missing ones.
interface SponsorInfo {
  username: string;
  code: string;
}

interface ReferralStats {
  active: number;
  total: number;
}

// interface WithdrawalEligibility {
//   canWithdraw: boolean;
//   hasPendingWithdrawal: boolean;
//   daysUntilWithdrawal: number;
// }

interface ArcadeMiningUIProps {
  balanceTon: number;
  tonPrice: number;
  currentEarningsTon: number;
  isClaiming: boolean;
  claimCooldown: number;
  cooldownText: string;
  onClaim: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw?: () => void;
  potentialEarningsTon: number;
  airdropBalanceNova: number;
  totalWithdrawnTon: number;
  activities?: Array<{ id: string; type: string; amount: number; status: string; created_at: string; }>;
  withdrawals?: Array<{ id: number; amount: number; status: string; created_at: string; }>;
  isLoadingActivities?: boolean;
  userId?: number;
  userUsername?: string;
  referralCode?: string;
  estimatedDailyTapps?: number;
  showSnackbar?: (data: { message: string; description?: string }) => void;
}

// A compact, arcade-style mining UI that preserves existing actions
export default function ArcadeMiningUI(props: ArcadeMiningUIProps) {
  const {
    tonPrice,
    isClaiming,
    claimCooldown,
    // cooldownText,
    onClaim,
    // onOpenWithdraw,
    // airdropBalanceNova,
    // potentialEarningsTon,
    // totalWithdrawnTon,
    userId,
    userUsername,
    referralCode,
    // estimatedDailyTapps,
    showSnackbar,
  } = props;

  const [activeTab, setActiveTab] = useState<'mining' | 'activity' | 'referral'>('mining');
  const [sponsorCode, setSponsorCode] = useState<string | null>(null); // Added type
  const [sponsorInfo, setSponsorInfo] = useState<SponsorInfo | null>(null); // Added state
  const [referralStats, setReferralStats] = useState<ReferralStats>({ active: 0, total: 0 }); // Added state
  // const [showWithdrawModal, setShowWithdrawModal] = useState(false); // Added state
  // const [withdrawalEligibility, setWithdrawalEligibility] = useState<WithdrawalEligibility>({
  //   canWithdraw: false,
  //   hasPendingWithdrawal: false,
  //   daysUntilWithdrawal: 0,
  // }); // Added state

  // Free mining - no staking required
  const [isMining, setIsMining] = useState(false);
  const [miningStartTime, setMiningStartTime] = useState<Date | null>(null);
  const [miningSessionEndTime, setMiningSessionEndTime] = useState<Date | null>(null);
  const [sessionCountdown, setSessionCountdown] = useState('');
  const [accumulatedRZC, setAccumulatedRZC] = useState(0);
  const [claimableRZC, setClaimableRZC] = useState(0);

  // Mining rate: 1 RZC per day (0.00001157 RZC per second)
  const RZC_PER_DAY = 1;
  const RZC_PER_SECOND = RZC_PER_DAY / (24 * 60 * 60);

  const canClaim = claimableRZC > 0 && !isClaiming && claimCooldown <= 0;

  // LocalStorage keys for persistent mining data
  const getMiningDataKey = (userId: number) => `mining_data_${userId}`;
  const getClaimableKey = (userId: number) => `claimable_rzc_${userId}`;

  // Save mining data to localStorage
  const saveMiningData = (userId: number, startTime: Date | null, endTime: Date | null, accumulated: number) => {
    if (!startTime || !endTime) {
      localStorage.removeItem(getMiningDataKey(userId));
      return;
    }
    const miningData = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      accumulatedRZC: accumulated,
    };
    localStorage.setItem(getMiningDataKey(userId), JSON.stringify(miningData));
  };

  // Load mining data from localStorage
  const loadMiningData = (userId: number) => {
    try {
      const data = localStorage.getItem(getMiningDataKey(userId));
      if (data) {
        const parsed = JSON.parse(data);
        return {
          startTime: new Date(parsed.startTime),
          endTime: new Date(parsed.endTime),
          accumulatedRZC: parsed.accumulatedRZC || 0,
        };
      }
    } catch (error) {
      console.error('Error loading mining data:', error);
    }
    return null;
  };

  // Save claimable RZC to localStorage
  const saveClaimableRZC = (userId: number, amount: number) => {
    localStorage.setItem(getClaimableKey(userId), amount.toString());
  };

  // Load claimable RZC from localStorage
  const loadClaimableRZC = (userId: number) => {
    try {
      const data = localStorage.getItem(getClaimableKey(userId));
      return data ? parseFloat(data) : 0;
    } catch (error) {
      console.error('Error loading claimable RZC:', error);
      return 0;
    }
  };

  // Check withdrawal eligibility
  // const checkWithdrawalEligibility = async () => {
  //   if (!userId) return;

  //   try {
  //     // Using the imported function
  //     const eligibility = await checkWeeklyWithdrawalEligibility(userId);
  //     setWithdrawalEligibility(eligibility);
  //   } catch (error) {
  //     console.error('Error checking withdrawal eligibility:', error);
  //   }
  // };


  // Load referral data
  useEffect(() => {
    const loadReferralData = async () => {
      if (!userId) return;

      try {
        // Get user's sponsor code
        const code = await ensureUserHasSponsorCode(userId, userUsername);
        setSponsorCode(code);

        // Get sponsor information
        const { data: user } = await supabase
          .from('users')
          .select('sponsor_id, sponsor:users!referrer_id(username, sponsor_code)')
          .eq('id', userId)
          .single();

        if (user?.sponsor) {
          const sponsorData = Array.isArray(user.sponsor) ? user.sponsor[0] : user.sponsor;
          if (sponsorData && sponsorData.username) {
            setSponsorInfo({
              username: sponsorData.username,
              code: sponsorData.sponsor_code || 'N/A'
            });
          }
        }

        // Get referral stats
        const { data: referrals } = await supabase
          .from('referrals')
          .select('status')
          .eq('sponsor_id', userId);

        if (referrals) {
          const active = referrals.filter(r => r.status === 'active').length;
          setReferralStats({ active, total: referrals.length });
        }
      } catch (error) {
        console.error('Error loading referral data:', error);
      }
    };

    loadReferralData();
  }, [userId, userUsername]);

  // Check withdrawal eligibility on component mount and when userId changes
  // useEffect(() => {
  //   checkWithdrawalEligibility();
  // }, [userId]);

  // Load persistent mining data on component mount
  useEffect(() => {
    if (!userId) return;

    const savedClaimable = loadClaimableRZC(userId);
    setClaimableRZC(savedClaimable);

    const miningData = loadMiningData(userId);
    if (miningData && miningData.startTime && miningData.endTime) {
      const now = new Date();
      if (now >= miningData.endTime) {
        // Session expired, move rewards to claimable
        const finalAccumulated = RZC_PER_DAY;
        const newClaimable = savedClaimable + finalAccumulated;
        setClaimableRZC(newClaimable);
        saveClaimableRZC(userId, newClaimable);
        saveMiningData(userId, null, null, 0); // Clear mining session
      } else {
        // Session active, resume tracking
        setMiningStartTime(miningData.startTime);
        setMiningSessionEndTime(miningData.endTime);
        setIsMining(true);
      }
    }
  }, [userId]);

  // Calculate accumulated RZC based on mining time
  useEffect(() => {
    let miningInterval: NodeJS.Timeout;

    if (isMining && miningStartTime && miningSessionEndTime && userId) {
      miningInterval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = (now.getTime() - miningStartTime.getTime()) / 1000;
        const remainingSeconds = (miningSessionEndTime.getTime() - now.getTime()) / 1000;

        if (remainingSeconds <= 0) {
          setIsMining(false);
          setMiningStartTime(null);
          setMiningSessionEndTime(null);
          setAccumulatedRZC(0);

          const newClaimable = claimableRZC + RZC_PER_DAY;
          setClaimableRZC(newClaimable);
          saveClaimableRZC(userId, newClaimable);
          saveMiningData(userId, null, null, 0);

          showSnackbar?.({
            message: 'Mining session complete!',
            description: `You earned 1 RZC. Ready to claim.`
          });

          clearInterval(miningInterval);
        } else {
          const hours = Math.floor(remainingSeconds / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = Math.floor(remainingSeconds % 60);
          setSessionCountdown(`${hours}h ${minutes}m ${seconds}s`);

          const earnedRZC = elapsedSeconds * RZC_PER_SECOND;
          setAccumulatedRZC(earnedRZC > RZC_PER_DAY ? RZC_PER_DAY : earnedRZC);
        }
      }, 1000);
    }

    return () => {
      if (miningInterval) {
        clearInterval(miningInterval);
      }
    };
  }, [isMining, miningStartTime, miningSessionEndTime, RZC_PER_SECOND, userId, claimableRZC, showSnackbar]); // Added showSnackbar to dependencies

  // Start mining function
  const startMining = () => {
    if (!userId || isMining) return;

    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    setIsMining(true);
    setMiningStartTime(now);
    setMiningSessionEndTime(endTime);
    setAccumulatedRZC(0);

    saveMiningData(userId, now, endTime, 0);
  };

  // Claim rewards function
  const claimRewards = async () => {
    if (!userId || claimableRZC <= 0) return;

    try {
      await onClaim(); // This should handle the Supabase call

      showSnackbar?.({
        message: 'RZC Claimed Successfully!',
        description: `You claimed ${claimableRZC.toFixed(6)} RZC`
      });

      setClaimableRZC(0);
      saveClaimableRZC(userId, 0);
    } catch (error) {
      console.error('Error claiming rewards:', error);
      showSnackbar?.({
        message: 'Claim Failed',
        description: 'An error occurred while claiming your RZC.'
      });
    }
  };

  // Helper function to get icon for activity
  const getActivityIcon = (type: string) => {
    if (type.includes('withdrawal')) return 'Vault'; // Placeholder for icon component
    if (type.includes('nova_reward') || type.includes('claim')) return 'Star'; // Placeholder
    return 'Activity'; // Placeholder
  };

  // Helper function to get icon for withdrawal
  const getWithdrawalIcon = (status: string) => {
    if (status === 'PENDING') return 'Pending'; // Placeholder
    if (status === 'COMPLETED') return 'Completed'; // Placeholder
    if (status === 'FAILED') return 'Failed'; // Placeholder
    return 'Info'; // Placeholder
  };


  return (
    <div className="w-full max-w-md mx-auto bg-gray-900/80 border-2 border-green-700/50 rounded-2xl shadow-neon-green-light overflow-hidden flex flex-col backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-green-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-900/50 border-2 border-green-600/70 flex items-center justify-center">
            {/* Placeholder for an icon */}
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-300">RZC Mining Core</h2>
            <p className="text-xs text-green-500">Decentralized Yield Protocol</p>
          </div>
        </div>
        <div className="w-3 h-3 rounded-full ${isMining ? 'bg-green-400 shadow-neon-green' : 'bg-gray-600'} animate-pulse" />
      </div>

      {/* Wallet Content */}
      <div className="p-4 space-y-4">
        {/* Futuristic Display */}
        <div className="text-center p-4 rounded-lg bg-gray-800/50 border border-green-800/30">
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${isMining ? 'bg-green-900/50 border-2 border-green-500 animate-pulse-slow' : 'bg-gray-800/50 border-2 border-gray-600'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isMining ? 'bg-green-700/60 border-2 border-green-400' : 'bg-gray-700/60 border-2 border-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full ${isMining ? 'bg-green-400 shadow-neon-green' : 'bg-gray-600'}`} />
            </div>
          </div>

          <h3 className="text-4xl font-bold text-green-300 tabular-nums">
            {(isMining ? accumulatedRZC : claimableRZC).toFixed(6)}
          </h3>
          <p className="text-sm font-medium text-green-500 mb-2">RZC Balance</p>
          <p className="text-xs text-gray-400 tabular-nums">
            ≈ ${((isMining ? accumulatedRZC : claimableRZC) * tonPrice).toFixed(4)} USD
          </p>
        </div>

        {/* Mining Status */}
        <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <div className={`w-2.5 h-2.5 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              <span className={isMining ? 'text-green-400' : 'text-gray-400'}>
                {isMining ? 'SYSTEM ONLINE' : 'SYSTEM STANDBY'}
              </span>
            </div>
            <span className="text-green-400 font-semibold">{RZC_PER_DAY} RZC/24h</span>
          </div>
          <div className="text-center text-xs text-gray-400 font-mono h-4">
            {isMining && (
              <span>SESSION ENDS IN: {sessionCountdown}</span>
            )}
            {!isMining && (
              <span>SESSION INACTIVE</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={startMining}
            disabled={isMining}
            className="w-full bg-green-900/50 border-2 border-green-600/70 text-green-300 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2
              hover:bg-green-800/60 hover:border-green-500 hover:shadow-neon-green
              disabled:bg-gray-800/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {isMining ? (
              <>
                {/* Placeholder for an icon */}
                <span className="text-sm">SESSION ACTIVE</span>
              </>
            ) : (
              <>
                {/* Placeholder for an icon */}
                <span className="text-sm">INITIATE MINING SEQUENCE</span>
              </>
            )}
          </button>

          {canClaim && (
            <button
              onClick={claimRewards}
              disabled={isClaiming || claimCooldown > 0}
              className={`w-full bg-yellow-900/50 border-2 border-yellow-600/70 text-yellow-300 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2
              hover:bg-yellow-800/60 hover:border-yellow-500 hover:shadow-neon-yellow
              disabled:bg-gray-800/50 disabled:border-gray-700 disabled:text-gray-500 ${canClaim ? 'animate-glow' : ''}`}
            >
              {isClaiming ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3 text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing Claim...</span>
                </>
              ) : (
                <>
                  {/* Placeholder for claim icon */}
                  <span>CLAIM {claimableRZC.toFixed(2)} RZC</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats */}
        {/* <div className="flex gap-4">
          <div className="flex-1 text-center bg-gray-800/50 border border-green-800/30 rounded-lg p-3">
            <p className="text-xl font-bold text-green-300 tabular-nums">{totalWithdrawnTon.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Total Claimed</p>
          </div>
          <div className="flex-1 text-center bg-gray-800/50 border border-green-800/30 rounded-lg p-3">
            <p className="text-xl font-bold text-green-300 tabular-nums">{Number(airdropBalanceNova ?? 0).toFixed(2)}</p>
            <p className="text-xs text-gray-400">Airdrop</p>
          </div>
        </div> */}
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-900/50 border-t-2 border-green-700/50">
        <button
          onClick={() => setActiveTab('mining')}
          className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${activeTab === 'mining' ? 'bg-green-900/70 text-green-300 shadow-neon-green-inset' : 'text-gray-500 hover:bg-gray-800/50'}`}
        >
          MINING
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-l border-r border-green-700/50 ${activeTab === 'activity' ? 'bg-green-900/70 text-green-300 shadow-neon-green-inset' : 'text-gray-500 hover:bg-gray-800/50'}`}
        >
          ACTIVITY
        </button>
        <button
          onClick={() => setActiveTab('referral')}
          className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${activeTab === 'referral' ? 'bg-green-900/70 text-green-300 shadow-neon-green-inset' : 'text-gray-500 hover:bg-gray-800/50'}`}
        >
          NETWORK
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/30 min-h-[200px]">
        
        {/* ================================================================== */}
        {/* == MODIFIED MINING TAB CONTENT == */}
        {/* ================================================================== */}
        {activeTab === 'mining' && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-green-300 mb-3 text-center">Mining Upgrades</h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Placeholder Upgrade Card 1 */}
              <div className="bg-gray-800/70 border border-green-700/50 p-3 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-green-400">Mining Rig Mk. II</h4>
                  <p className="text-sm text-gray-400">Increases mining rate by 25%.</p>
                </div>
                <button 
                  className="bg-green-900/50 border-2 border-green-600/70 text-green-300 font-semibold py-2 px-3 rounded-lg text-sm whitespace-nowrap hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled
                >
                  10 RZC
                </button>
              </div>
              
              {/* Placeholder Upgrade Card 2 */}
              <div className="bg-gray-800/70 border border-green-700/50 p-3 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-green-400">Extended Session</h4>
                  <p className="text-sm text-gray-400">Allows mining for 48 hours.</p>
                </div>
                <button 
                  className="bg-green-900/50 border-2 border-green-600/70 text-green-300 font-semibold py-2 px-3 rounded-lg text-sm whitespace-nowrap hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled
                >
                  5 RZC
                </button>
              </div>
            </div>
            <p className="text-center text-gray-500 text-xs mt-4">More upgrades coming soon!</p>
          </div>
        )}
        {/* ================================================================== */}
        {/* == END OF MODIFIED MINING TAB CONTENT == */}
        {/* ================================================================== */}

        {activeTab === 'activity' && (
          <div className="p-4 space-y-4">
            {/* Withdrawal Activity Summary */}
            {props.withdrawals && props.withdrawals.length > 0 && (
              <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-green-300">Withdrawal Activity</h4>
                    <p className="text-xs text-gray-400">Your withdrawal history</p>
                  </div>
                  {/* Placeholder for icon */}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-400">{props.withdrawals.filter(w => w.status === 'COMPLETED').length}</p>
                    <p className="text-xs text-gray-400">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-400">{props.withdrawals.filter(w => w.status === 'PENDING').length}</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-300">{props.withdrawals.reduce((sum, w) => sum + (w.status === 'COMPLETED' ? w.amount : 0), 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Total Paid</p>
                  </div>
                </div>
              </div>
            )}

            {props.isLoadingActivities ? (
              <div className="flex justify-center items-center h-24">
                {/* Placeholder for loading spinner */}
                <span className="text-gray-400">Loading Activities...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Regular Activities */}
                {props.activities && props.activities.length > 0 && props.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-800/40 border border-gray-700/50 rounded-lg">
                    {/* Placeholder for icon */}
                    <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center text-green-400">
                      <span>{getActivityIcon(a.type)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold capitalize text-gray-200">{a.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-300">{typeof a.amount === 'number' ? a.amount.toFixed(6) : a.amount} {a.type === 'nova_reward' ? 'RZC' : 'TON'}</p>
                      <p className="text-xs text-gray-400 capitalize">{a.status}</p>
                    </div>
                  </div>
                ))}

                {/* Withdrawal Activities Header */}
                {props.withdrawals && props.withdrawals.length > 0 && (
                  <div className="flex justify-between items-baseline pt-2">
                    <h4 className="font-semibold text-gray-300">Recent Withdrawals</h4>
                    <p className="text-xs text-gray-500">{props.withdrawals.length} total</p>
                  </div>
                )}

                {/* Enhanced Withdrawal Activities */}
                {props.withdrawals && props.withdrawals.length > 0 && props.withdrawals.slice(0, 5).map((w) => (
                  <div key={`withdrawal-${w.id}`} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    w.status === 'PENDING' ? 'bg-yellow-900/20 border-yellow-700/50' :
                    w.status === 'COMPLETED' ? 'bg-green-900/20 border-green-700/50' :
                    w.status === 'FAILED' ? 'bg-red-900/20 border-red-700/50' :
                    'bg-gray-800/20 border-gray-700/50'
                  }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${
                      w.status === 'PENDING' ? 'bg-yellow-900/50 border-yellow-600/70 text-yellow-300' :
                      w.status === 'COMPLETED' ? 'bg-green-900/50 border-green-600/70 text-green-300' :
                      w.status === 'FAILED' ? 'bg-red-900/50 border-red-600/70 text-red-300' :
                      'bg-gray-800/50 border-gray-600/70 text-gray-300'
                    }`}>
                      {/* Placeholder for icon */}
                      <span>{getWithdrawalIcon(w.status)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-200">
                        { w.status === 'PENDING' ? 'Withdrawal Pending' :
                          w.status === 'COMPLETED' ? 'Withdrawal Completed' :
                          w.status === 'FAILED' ? 'Withdrawal Failed' :
                          'Withdrawal Request'}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-200">{w.amount.toFixed(6)} RZC</p>
                      <div className={`text-xs font-semibold px-2 py-0.5 rounded-md inline-block mt-1 ${
                        w.status === 'PENDING' ? 'bg-yellow-800/50 text-yellow-300' :
                        w.status === 'COMPLETED' ? 'bg-green-800/50 text-green-300' :
                        w.status === 'FAILED' ? 'bg-red-800/50 text-red-300' :
                        'bg-gray-700/50 text-gray-300'
                      }`}>
                        {w.status}
                      </div>
                    </div>
                  </div>
                ))}

                {/* View All Withdrawals Button */}
                {props.withdrawals && props.withdrawals.length > 5 && (
                  <div className="pt-2">
                    {/* Placeholder for "View All" button */}
                    <button className="w-full text-sm text-green-400 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 border border-green-800/30">
                      View All Activity
                    </button>
                  </div>
                )}

                {/* No activities message */}
                {(!props.activities || props.activities.length === 0) && (!props.withdrawals || props.withdrawals.length === 0) && (
                  <div className="text-center py-10">
                    {/* Placeholder for empty state icon */}
                    <h4 className="font-semibold text-gray-400">No Recent Activity</h4>
                    <p className="text-sm text-gray-500">Your mining and withdrawal activities will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="p-4 space-y-4">
            {/* Upline Information */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-green-300">Your Upline</h4>
                  <p className="text-xs text-gray-400">Sponsor Information</p>
                </div>
                {/* Placeholder for icon */}
              </div>

              {sponsorInfo ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 border-2 border-green-600/70 flex items-center justify-center text-green-300 font-bold text-lg">
                    {sponsorInfo.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200">{sponsorInfo.username}</p>
                    <p className="text-xs text-gray-400 font-mono">Sponsor Code: {sponsorInfo.code}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">
                  <p className="font-semibold">No Sponsor</p>
                  <p className="text-xs">You joined without a sponsor code</p>
                </div>
              )}
            </div>

            {/* Your Sponsor Code */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-2">Your Sponsor Code</p>
              <div className="flex justify-center items-center gap-2 bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                <span className="text-lg font-bold text-green-300 font-mono tracking-wider">
                  { referralCode || sponsorCode || '...'}
                </span>
                <button
                  onClick={async () => {
                    try {
                      const codeToCopy = referralCode || sponsorCode;
                      if (!codeToCopy) throw new Error("No code to copy");
                      await navigator.clipboard.writeText(codeToCopy);
                      showSnackbar?.({ message: 'Sponsor code copied!' });
                    } catch (error) {
                      showSnackbar?.({ message: 'Failed to copy code' });
                    }
                  }}
                  className="px-3 py-1.5 bg-green-600/80 text-white rounded-md text-sm font-semibold hover:bg-green-500/80 transition-colors border border-green-500/80"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Share this code to earn referral rewards</p>
            </div>

            {/* Network Stats */}
            <div className="bg-gray-800/50 border border-green-800/30 rounded-lg p-4">
              <h4 className="font-semibold text-green-300 mb-3 text-center">Network Statistics</h4>
              <div className="flex gap-4">
                <div className="flex-1 text-center bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                  <p className="text-2xl font-bold text-green-400">{referralStats.active}</p>
                  <p className="text-xs text-gray-400">Active Team</p>
                </div>
                <div className="flex-1 text-center bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                  <p className="text-2xl font-bold text-gray-300">{referralStats.total}</p>
                  <p className="text-xs text-gray-400">Total Referrals</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}