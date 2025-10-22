import { useState, useEffect } from 'react';
import { supabase, ensureUserHasSponsorCode, checkWeeklyWithdrawalEligibility } from '../lib/supabaseClient';

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
    cooldownText,
    onClaim,
    // onOpenWithdraw,
    airdropBalanceNova,
    // potentialEarningsTon,
    totalWithdrawnTon,
    userId,
    userUsername,
    referralCode,
    estimatedDailyTapps,
    showSnackbar,
  } = props;

  const [activeTab, setActiveTab] = useState<'mining' | 'activity' | 'referral'>('mining');
  const [sponsorCode, setSponsorCode] = useState<string>('');
  const [sponsorInfo, setSponsorInfo] = useState<{username: string, code: string} | null>(null);
  const [referralStats, setReferralStats] = useState<{active: number, total: number}>({active: 0, total: 0});
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalEligibility, setWithdrawalEligibility] = useState<{
    canWithdraw: boolean;
    nextWithdrawalDate: Date | null;
    daysUntilWithdrawal: number;
    hasPendingWithdrawal: boolean;
    pendingWithdrawalId?: number;
  }>({ canWithdraw: false, nextWithdrawalDate: null, daysUntilWithdrawal: 0, hasPendingWithdrawal: false });

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
  const checkWithdrawalEligibility = async () => {
    if (!userId) return;
    
    try {
      const eligibility = await checkWeeklyWithdrawalEligibility(userId);
      setWithdrawalEligibility(eligibility);
    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error);
    }
  };

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
  useEffect(() => {
    checkWithdrawalEligibility();
  }, [userId]);

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
  }, [isMining, miningStartTime, miningSessionEndTime, RZC_PER_SECOND, userId, claimableRZC]);

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

  return (
    <div className="bg-gray-900 text-green-400 font-mono rounded-2xl shadow-lg border border-green-700 overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-green-500/10 bg-grid-18 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0 scanline"></div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-green-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center border-2 border-green-600/70 shadow-neon-green-sm">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-shadow-green">RZC Mining Core</h3>
              <p className="text-green-500/80 text-sm">Decentralized Yield Protocol</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${isMining ? 'bg-green-400 shadow-neon-green' : 'bg-gray-600'} animate-pulse`} />
        </div>
      </div>

      {/* Wallet Content */}
      <div className="p-6 relative z-10">
        {/* Futuristic Display */}
        <div className="bg-black/50 rounded-lg p-6 mb-6 border-2 border-green-700/50 shadow-neon-green-lg text-center backdrop-blur-sm">
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${isMining ? 'bg-green-900/50 border-2 border-green-500 animate-pulse-slow' : 'bg-gray-800/50 border-2 border-gray-600'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isMining ? 'bg-green-700/60 border-2 border-green-400' : 'bg-gray-700/60 border-2 border-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full ${isMining ? 'bg-green-400 shadow-neon-green' : 'bg-gray-600'}`} />
            </div>
          </div>

          <div className="text-5xl font-bold text-green-300 text-shadow-green tracking-wider mb-2">
            {(isMining ? accumulatedRZC : claimableRZC).toFixed(6)}
          </div>
          <div className="text-green-500/80 font-medium">RZC Balance</div>
          <div className="text-sm text-green-600/70">
            ≈ ${((isMining ? accumulatedRZC : claimableRZC) * tonPrice).toFixed(4)} USD
          </div>
        </div>

        {/* Mining Status */}
        <div className="bg-black/30 rounded-lg p-4 mb-6 border border-green-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              <span className="font-medium text-green-300">
                {isMining ? 'SYSTEM ONLINE' : 'SYSTEM STANDBY'}
              </span>
            </div>
            <div className="text-sm text-green-500/80">
              {RZC_PER_DAY} RZC/24h
            </div>
          </div>
          
          {isMining && (
            <div className="text-xs text-green-400/70 h-4">
              SESSION ENDS IN: {sessionCountdown}
            </div>
          )}
          {!isMining && (
             <div className="text-xs text-gray-500 h-4">
              SESSION INACTIVE
            </div>
          )}
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
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                <span>SESSION ACTIVE</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>INITIATE MINING SEQUENCE</span>
              </>
            )}
          </button>

          {canClaim && (
            <button
              onClick={claimRewards}
              disabled={isClaiming || claimCooldown > 0}
              className="w-full bg-yellow-900/50 border-2 border-yellow-600/70 text-yellow-300 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2
              hover:bg-yellow-800/60 hover:border-yellow-500 hover:shadow-neon-yellow
              disabled:bg-gray-800/50 disabled:border-gray-700 disabled:text-gray-500"
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <span>CLAIMING...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span>CLAIM {claimableRZC.toFixed(2)} RZC</span>
                </>
              )}
            </button>
          )}

          {/* Withdrawal Button */}
          {totalWithdrawnTon > 0 && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!withdrawalEligibility.canWithdraw}
              className="w-full bg-purple-900/50 border-2 border-purple-600/70 text-purple-300 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2
              hover:bg-purple-800/60 hover:border-purple-500 hover:shadow-neon-purple
              disabled:bg-gray-800/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>
                {withdrawalEligibility.canWithdraw 
                  ? 'ACCESS VAULT'
                  : withdrawalEligibility.hasPendingWithdrawal
                  ? 'PROCESSING...'
                  : `COOLDOWN (${withdrawalEligibility.daysUntilWithdrawal}d)`
                }
              </span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-lg p-3 text-center border border-green-800/50">
            <div className="text-lg font-bold text-green-300 text-shadow-green">{totalWithdrawnTon.toFixed(2)}</div>
            <div className="text-xs text-green-500/80">Total Claimed</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center border border-green-800/50">
            <div className="text-lg font-bold text-green-300 text-shadow-green">{Number(airdropBalanceNova ?? 0).toFixed(2)}</div>
            <div className="text-xs text-green-500/80">Airdrop</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-black/30 border-t border-green-700/50">
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
      <div className="p-6 bg-black/30">
        {activeTab === 'mining' && (
          <div className="text-center text-gray-500">
            <p>Mining dashboard is shown above.</p>
            <p>Switch tabs to see activity and network stats.</p>
          </div>
        )}

        {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Withdrawal Activity Summary */}
              {props.withdrawals && props.withdrawals.length > 0 && (
                <div className="bg-black/30 rounded-lg p-4 border border-green-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center border border-green-700/50">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-10v10M9 3h6m-6 18h6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-base font-bold text-green-300">Withdrawal Activity</div>
                      <div className="text-sm text-green-500/80">Your withdrawal history</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-black/20 rounded-md p-3 border border-green-900">
                      <div className="text-xl font-bold text-green-300">
                        {props.withdrawals.filter(w => w.status === 'COMPLETED').length}
                      </div>
                      <div className="text-xs text-green-500/70">Completed</div>
                    </div>
                    <div className="text-center bg-black/20 rounded-md p-3 border border-green-900">
                      <div className="text-xl font-bold text-yellow-400">
                        {props.withdrawals.filter(w => w.status === 'PENDING').length}
                      </div>
                      <div className="text-xs text-green-500/70">Pending</div>
                    </div>
                    <div className="text-center bg-black/20 rounded-md p-3 border border-green-900">
                      <div className="text-xl font-bold text-green-300">
                        {props.withdrawals.reduce((sum, w) => sum + (w.status === 'COMPLETED' ? w.amount : 0), 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-green-500/70">Total Paid</div>
                    </div>
                  </div>
                </div>
              )}

              {props.isLoadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Regular Activities */}
                  {props.activities && props.activities.length > 0 && props.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-3 bg-black/20 rounded-lg border border-green-800/50">
                    <div className="w-10 h-10 rounded-lg bg-green-900/50 flex items-center justify-center border border-green-700/50">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-base text-green-300 capitalize font-semibold">{a.type.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-green-500/70">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-300">{typeof a.amount === 'number' ? a.amount.toFixed(6) : a.amount} {a.type === 'nova_reward' ? 'RZC' : 'TON'}</div>
                      <div className="text-sm text-green-500/70 font-medium">{a.status}</div>
                    </div>
                  </div>
                  ))}

                  {/* Withdrawal Activities Header */}
                  {props.withdrawals && props.withdrawals.length > 0 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm font-bold text-green-300">Recent Withdrawals</div>
                      <div className="text-xs text-green-500/70">{props.withdrawals.length} total</div>
                    </div>
                  )}

                  {/* Enhanced Withdrawal Activities */}
                  {props.withdrawals && props.withdrawals.length > 0 && props.withdrawals.slice(0, 5).map((w) => (
                    <div key={`withdrawal-${w.id}`} className={`flex items-center gap-4 p-4 rounded-lg border ${
                      w.status === 'PENDING' ? 'bg-yellow-900/20 border-yellow-700/50' :
                      w.status === 'COMPLETED' ? 'bg-green-900/20 border-green-700/50' :
                      w.status === 'FAILED' ? 'bg-red-900/20 border-red-700/50' :
                      'bg-gray-800/20 border-gray-700/50'
                    }`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${
                        w.status === 'PENDING' ? 'bg-yellow-900/50 border-yellow-600/70' :
                        w.status === 'COMPLETED' ? 'bg-green-900/50 border-green-600/70' :
                        w.status === 'FAILED' ? 'bg-red-900/50 border-red-600/70' :
                        'bg-gray-800/50 border-gray-600/70'
                      }`}>
                        {w.status === 'PENDING' ? (
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : w.status === 'COMPLETED' ? (
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : w.status === 'FAILED' ? (
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-green-300">
                          { w.status === 'PENDING' ? 'Withdrawal Pending' :
                            w.status === 'COMPLETED' ? 'Withdrawal Completed' :
                            w.status === 'FAILED' ? 'Withdrawal Failed' :
                            'Withdrawal Request'}
                        </div>
                        <div className="text-xs text-green-500/70 mb-1">
                          {new Date(w.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-300 mb-1">
                          {w.amount.toFixed(6)} RZC
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-md ${
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
                    <div className="text-center pt-2">
                      <button className="text-xs text-green-400 hover:text-green-300 font-medium px-3 py-2 rounded-lg hover:bg-green-800/50 transition-colors">
                        View All {props.withdrawals.length} Withdrawals
                      </button>
                    </div>
                  )}

                  {/* No activities message */}
                  {(!props.activities || props.activities.length === 0) && (!props.withdrawals || props.withdrawals.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed border-green-800/50 rounded-lg">
                      <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-700/50">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="text-green-400 font-medium mb-1">No Recent Activity</div>
                      <div className="text-xs text-green-500/70">Your mining and withdrawal activities will appear here</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'referral' && (
            <div className="space-y-4">
              {/* Upline Information */}
              <div className="bg-black/30 rounded-lg p-4 border border-green-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-900/50 rounded-lg flex items-center justify-center border border-green-700/50">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-300">Your Upline</div>
                    <div className="text-xs text-green-500/80">Sponsor Information</div>
                  </div>
                </div>

                {sponsorInfo ? (
                  <div className="bg-black/20 rounded-lg p-3 border border-green-900">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-800/50 rounded-full flex items-center justify-center border-2 border-green-600/70">
                        <span className="text-green-200 font-bold text-lg">
                          {sponsorInfo.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-green-200 font-semibold text-lg">{sponsorInfo.username}</div>
                        <div className="text-sm text-green-400/80">Sponsor Code: <span className="font-mono font-bold text-green-300">{sponsorInfo.code}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/20 rounded-lg p-3 border-2 border-dashed border-green-800/50 text-center py-4">
                    <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-green-700/50">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-green-400 font-medium">No Sponsor</div>
                    <div className="text-xs text-green-500/70">You joined without a sponsor code</div>
                  </div>
                )}
              </div>

              {/* Your Sponsor Code */}
              <div className="bg-black/30 rounded-lg p-4 border border-green-800/50">
                <div className="text-sm font-bold text-green-300 mb-2">Your Sponsor Code</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/50 rounded-md px-3 py-2 border border-green-700/50">
                    <span className="text-lg font-bold text-green-200 font-mono tracking-widest">{ referralCode || sponsorCode || '...'}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralCode || sponsorCode);
                        showSnackbar?.({ message: 'Sponsor code copied!' });
                      } catch (error) {
                        showSnackbar?.({ message: 'Failed to copy code' });
                      }
                    }}
                    className="px-4 py-2 bg-green-600/80 text-white rounded-md text-sm hover:bg-green-500/80 transition-colors border border-green-500/80"
                  >
                    Copy
                  </button>
                </div>
                <div className="text-xs text-green-500/70 mt-2">Share this code to earn referral rewards</div>
              </div>

              {/* Network Stats */}
              <div className="bg-black/30 rounded-lg p-4 border border-green-800/50">
                <div className="text-sm font-bold text-green-300 mb-3">Network Statistics</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-black/20 rounded-md p-3 border border-green-900">
                    <div className="text-2xl font-bold text-green-300">{referralStats.active}</div>
                    <div className="text-xs text-green-500/70">Active Team</div>
                  </div>
                  <div className="text-center bg-black/20 rounded-md p-3 border border-green-900">
                    <div className="text-2xl font-bold text-green-300">{referralStats.total}</div>
                    <div className="text-xs text-green-500/70">Total Referrals</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}