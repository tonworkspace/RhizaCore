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
  const [accumulatedRZC, setAccumulatedRZC] = useState(0);
  const [claimableRZC, setClaimableRZC] = useState(0);
  
  // Mining rate: 1 RZC per day (0.00001157 RZC per second)
  const RZC_PER_DAY = 1;
  const RZC_PER_SECOND = RZC_PER_DAY / (24 * 60 * 60);
  
  const canClaim = (accumulatedRZC > 0 || claimableRZC > 0) && !isClaiming && claimCooldown <= 0;

  // LocalStorage keys for persistent mining data
  const getMiningDataKey = (userId: number) => `mining_data_${userId}`;
  const getClaimableKey = (userId: number) => `claimable_rzc_${userId}`;

  // Save mining data to localStorage
  const saveMiningData = (userId: number, startTime: Date, accumulated: number) => {
    const miningData = {
      startTime: startTime.toISOString(),
      accumulatedRZC: accumulated,
      lastUpdate: Date.now()
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
          accumulatedRZC: parsed.accumulatedRZC || 0,
          lastUpdate: parsed.lastUpdate || Date.now()
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

    // Load claimable RZC
    const savedClaimable = loadClaimableRZC(userId);
    setClaimableRZC(savedClaimable);

    // Load mining data and auto-resume mining
    const miningData = loadMiningData(userId);
    if (miningData) {
      const now = new Date();
      const timeDiff = (now.getTime() - miningData.startTime.getTime()) / 1000;
      const earnedRZC = timeDiff * RZC_PER_SECOND;
      const totalAccumulated = miningData.accumulatedRZC + earnedRZC;

      setMiningStartTime(miningData.startTime);
      setAccumulatedRZC(totalAccumulated);
      setIsMining(true);

      // Save updated data
      saveMiningData(userId, miningData.startTime, totalAccumulated);
    } else {
      // Auto-start mining if no data exists (ultimate idle mining)
      const now = new Date();
      setIsMining(true);
      setMiningStartTime(now);
      setAccumulatedRZC(0);
      saveMiningData(userId, now, 0);
    }
  }, [userId, RZC_PER_SECOND]);

  // Calculate accumulated RZC based on mining time
  useEffect(() => {
    let miningInterval: NodeJS.Timeout;

    if (isMining && miningStartTime && userId) {
      // Update accumulated RZC every second
      miningInterval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = (now.getTime() - miningStartTime.getTime()) / 1000;
        const earnedRZC = elapsedSeconds * RZC_PER_SECOND;
        setAccumulatedRZC(earnedRZC);

        // Save mining data every 10 seconds
        if (Math.floor(elapsedSeconds) % 10 === 0) {
          saveMiningData(userId, miningStartTime, earnedRZC);
        }
      }, 1000);
    }

    return () => {
      if (miningInterval) {
        clearInterval(miningInterval);
      }
    };
  }, [isMining, miningStartTime, RZC_PER_SECOND, userId]);

  // Start mining function
  const startMining = () => {
    if (!userId) return;

    // If already mining, don't reset
    if (isMining) return;

    const now = new Date();
    setIsMining(true);
    setMiningStartTime(now);
    setAccumulatedRZC(0);
    
    // Save initial mining data
    saveMiningData(userId, now, 0);
  };

  // Stop mining function
  const stopMining = () => {
    if (!userId) return;

    setIsMining(false);
    setMiningStartTime(null);

    // Save accumulated RZC as claimable
    if (accumulatedRZC > 0) {
      const newClaimable = claimableRZC + accumulatedRZC;
      setClaimableRZC(newClaimable);
      saveClaimableRZC(userId, newClaimable);
      setAccumulatedRZC(0);
    }
  };

  // Claim rewards function
  const claimRewards = async () => {
    if (!userId || (!accumulatedRZC && !claimableRZC)) return;

    const totalToClaim = accumulatedRZC + claimableRZC;
    
    try {
      // Call the existing claim function which should update totalWithdrawnTon
      await onClaim();
      
      // Clear accumulated and claimable RZC
      setAccumulatedRZC(0);
      setClaimableRZC(0);
      saveClaimableRZC(userId, 0);

      // Clear mining data since we claimed everything
      if (isMining) {
        setIsMining(false);
        setMiningStartTime(null);
        localStorage.removeItem(getMiningDataKey(userId));
      }

      // Show success message
      showSnackbar?.({
        message: 'RZC Claimed Successfully!',
        description: `You claimed ${totalToClaim.toFixed(6)} RZC`
      });
    } catch (error) {
      console.error('Error claiming rewards:', error);
      showSnackbar?.({
        message: 'Claim Failed',
        description: 'Please try again later'
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Pi-style Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">RZC Wallet</h3>
              <p className="text-white/80 text-sm">Mine & Earn RZC</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${isMining ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
        </div>
      </div>

      {/* Wallet Content */}
      <div className="p-6">
        {/* Balance Display */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {isMining ? accumulatedRZC.toFixed(6) : (claimableRZC > 0 ? claimableRZC.toFixed(6) : '0.000000')}
          </div>
          <div className="text-gray-600 font-medium">RZC</div>
          <div className="text-sm text-gray-500">
            ≈ ${((isMining ? accumulatedRZC : claimableRZC) * (tonPrice || 0)).toFixed(4)} USD
          </div>
        </div>

        {/* Mining Status */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMining ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-medium text-gray-700">
                {isMining ? 'Mining Active' : 'Mining Stopped'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {RZC_PER_DAY} RZC/day
            </div>
          </div>
          
          {isMining && (
            <div className="text-xs text-gray-500">
              Earning {RZC_PER_SECOND.toFixed(8)} RZC per second
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canClaim ? (
            <button
              onClick={claimRewards}
              disabled={isClaiming || claimCooldown > 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : claimCooldown > 0 ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{cooldownText}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Claim RZC</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={isMining ? stopMining : startMining}
              className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${
                isMining
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isMining ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Stop Mining</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                  </svg>
                  <span>Start Mining</span>
                </>
              )}
            </button>
          )}

          {/* Withdrawal Button */}
          {totalWithdrawnTon > 0 && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!withdrawalEligibility.canWithdraw}
              className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${
                withdrawalEligibility.canWithdraw
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span>
                {withdrawalEligibility.canWithdraw 
                  ? 'Withdraw RZC'
                  : withdrawalEligibility.hasPendingWithdrawal
                  ? 'Processing...'
                  : `Cooldown (${withdrawalEligibility.daysUntilWithdrawal}d)`
                }
              </span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{totalWithdrawnTon.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Total Claimed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{Number(airdropBalanceNova ?? 0).toFixed(2)}</div>
            <div className="text-xs text-gray-600">Airdrop</div>
          </div>
        </div>
      </div>

          {activeTab === 'activity' && (
            <div className="mt-4 mb-4 space-y-4">
              {/* Withdrawal Activity Summary */}
              {props.withdrawals && props.withdrawals.length > 0 && (
                <div className="backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">Withdrawal Activity</div>
                      <div className="text-sm text-blue-600 font-medium">Your withdrawal history</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-white/70 rounded-xl p-4 border border-blue-200/50 shadow-md">
                      <div className="text-xl font-bold text-emerald-600">
                        {props.withdrawals.filter(w => w.status === 'COMPLETED').length}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Completed</div>
                    </div>
                    <div className="text-center bg-white/70 rounded-xl p-4 border border-amber-200/50 shadow-md">
                      <div className="text-xl font-bold text-amber-600">
                        {props.withdrawals.filter(w => w.status === 'PENDING').length}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Pending</div>
                    </div>
                    <div className="text-center bg-white/70 rounded-xl p-4 border border-slate-200/50 shadow-md">
                      <div className="text-xl font-bold text-slate-600">
                        {props.withdrawals.reduce((sum, w) => sum + (w.status === 'COMPLETED' ? w.amount : 0), 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Total Paid</div>
                    </div>
                  </div>
                </div>
              )}

              {props.isLoadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Regular Activities */}
                  {props.activities && props.activities.length > 0 && props.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-md hover:shadow-lg transition-all">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-base text-slate-900 capitalize font-semibold">{a.type.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-slate-600">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{typeof a.amount === 'number' ? a.amount.toFixed(6) : a.amount} {a.type === 'nova_reward' ? 'RZC' : 'TON'}</div>
                      <div className="text-sm text-slate-600 font-medium">{a.status}</div>
                    </div>
                  </div>
                  ))}

                  {/* Withdrawal Activities Header */}
                  {props.withdrawals && props.withdrawals.length > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                        </div>
                        <div className="text-sm font-bold text-slate-800">Recent Withdrawals</div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {props.withdrawals.length} total
                      </div>
                    </div>
                  )}

                  {/* Enhanced Withdrawal Activities */}
                  {props.withdrawals && props.withdrawals.length > 0 && props.withdrawals.slice(0, 5).map((w) => (
                    <div key={`withdrawal-${w.id}`} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                      w.status === 'PENDING' ? 'bg-amber-50/50 border-amber-200/50 backdrop-blur-sm' :
                      w.status === 'COMPLETED' ? 'bg-emerald-50/50 border-emerald-200/50 backdrop-blur-sm' :
                      w.status === 'FAILED' ? 'bg-red-50/50 border-red-200/50 backdrop-blur-sm' :
                      'bg-slate-50/50 border-slate-200/50 backdrop-blur-sm'
                    }`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                        w.status === 'PENDING' ? 'bg-gradient-to-br from-amber-500/30 to-yellow-500/20' :
                        w.status === 'COMPLETED' ? 'bg-gradient-to-br from-emerald-500/30 to-green-500/20' :
                        w.status === 'FAILED' ? 'bg-gradient-to-br from-red-500/30 to-pink-500/20' :
                        'bg-gradient-to-br from-slate-500/30 to-gray-500/20'
                      }`}>
                        {w.status === 'PENDING' ? (
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : w.status === 'COMPLETED' ? (
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : w.status === 'FAILED' ? (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-semibold text-slate-900">
                            {w.status === 'PENDING' ? 'Withdrawal Pending' :
                             w.status === 'COMPLETED' ? 'Withdrawal Completed' :
                             w.status === 'FAILED' ? 'Withdrawal Failed' :
                             'Withdrawal Request'}
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            w.status === 'PENDING' ? 'bg-amber-500 animate-pulse' :
                            w.status === 'COMPLETED' ? 'bg-emerald-500' :
                            w.status === 'FAILED' ? 'bg-red-500' :
                            'bg-slate-500'
                          }`} />
                        </div>
                        <div className="text-xs text-slate-500 mb-1">
                          {new Date(w.created_at).toLocaleString()}
                        </div>
                        {w.status === 'COMPLETED' && (
                          <div className="text-xs text-emerald-600 font-medium">
                            ✓ Sent to your wallet
                          </div>
                        )}
                        {w.status === 'PENDING' && (
                          <div className="text-xs text-amber-600 font-medium">
                            ⏳ Processing on blockchain
                          </div>
                        )}
                        {w.status === 'FAILED' && (
                          <div className="text-xs text-red-600 font-medium">
                            ✗ Transaction failed
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 mb-1">
                          {w.amount.toFixed(6)} RZC
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          w.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          w.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {w.status}
                        </div>
                        {w.status === 'COMPLETED' && (
                          <div className="text-xs text-slate-500 mt-1">
                            ID: #{w.id}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* View All Withdrawals Button */}
                  {props.withdrawals && props.withdrawals.length > 5 && (
                    <div className="text-center pt-2">
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                        View All {props.withdrawals.length} Withdrawals
                      </button>
                    </div>
                  )}

                  {/* No activities message */}
                  {(!props.activities || props.activities.length === 0) && (!props.withdrawals || props.withdrawals.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="text-slate-500 font-medium mb-1">No Recent Activity</div>
                      <div className="text-xs text-slate-400">Your RZC mining and withdrawal activities will appear here</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'referral' && (
            <div className="mt-4 mb-4 space-y-4">
              {/* Upline Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Your Upline</div>
                    <div className="text-xs text-blue-600">Sponsor Information</div>
                  </div>
                </div>

                {sponsorInfo ? (
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {sponsorInfo.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-slate-900 font-semibold text-lg">{sponsorInfo.username}</div>
                        <div className="text-sm text-slate-600">Sponsor Code: <span className="font-mono font-bold text-blue-600">{sponsorInfo.code}</span></div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 font-medium">Active Sponsor</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-slate-600 font-medium">No Sponsor</div>
                      <div className="text-xs text-slate-500">You joined without a sponsor code</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Your Sponsor Code */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-slate-700">Your Sponsor Code</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-slate-300">
                    <span className="text-lg font-bold text-green-600 font-mono">{ referralCode || sponsorCode || 'Loading...'}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralCode || sponsorCode);
                        showSnackbar?.({
                          message: 'Sponsor code copied!',
                          description: 'Code has been copied to your clipboard'
                        });
                      } catch (error) {
                        showSnackbar?.({
                          message: 'Failed to copy code',
                          description: 'Please try again or copy manually'
                        });
                      }
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-2">Share this code to earn referral rewards</div>
              </div>

              {/* Network Stats */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-slate-700">Network Statistics</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-green-600">{referralStats.active}</div>
                    <div className="text-xs text-slate-500 font-medium">Active Team</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">{referralStats.total}</div>
                    <div className="text-xs text-slate-500 font-medium">Total Referrals</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Mining status prompt */}
          {!isMining && (
            <div className="mb-6">
              <div className="relative w-full px-5 py-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">

                <div className="relative flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-emerald-800 text-sm font-medium">Ready to start mining RZC</div>
                    <div className="text-emerald-600 text-xs">Earn {RZC_PER_DAY} RZC per day - Click START to begin</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mining progress indicator */}

        </div>
  );
}


