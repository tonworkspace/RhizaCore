import { useState, useEffect } from 'react';
import { supabase, ensureUserHasSponsorCode, checkWeeklyWithdrawalEligibility } from '../lib/supabaseClient';
import { WithdrawModal } from './WithdrawModal';

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
    balanceTon,
    tonPrice,
    currentEarningsTon,
    isClaiming,
    claimCooldown,
    cooldownText,
    onClaim,
    onOpenDeposit,
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

  const isStaked = Number(balanceTon) > 0;
  const canClaim = isStaked && !isClaiming && currentEarningsTon > 0 && claimCooldown <= 0;

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

  return (
    <div className="relative overflow-visible">
      
      <div className="relative p-4 rounded-lg bg-white border-2 border-slate-300 shadow-sm" style={{borderImage: 'linear-gradient(90deg, #e2e8f0, #cbd5e1, #94a3b8, #cbd5e1, #e2e8f0) 1'}}>
        <div className="relative">
          {/* Compact Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${isStaked ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase">MINING POWER</div>
                <div className="text-lg font-bold text-slate-900">
                  {balanceTon?.toFixed(2) || '0.00'} <span className="text-slate-600 text-base font-medium">TON</span>
                </div>
              </div>
            </div>
            {isStaked ? (
                 <button
                 onClick={onOpenDeposit}
                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors duration-200"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 </svg>
                 <span className="text-sm font-semibold">TOP UP</span>
               </button>
                ) : (
                  <button
                  onClick={onOpenDeposit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-semibold">START</span>
                </button>
                )}
          </div>

          {/* Compact Tabs */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex p-1 rounded-lg bg-slate-100">
              <button
                onClick={() => setActiveTab('mining')}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${activeTab === 'mining' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Mining
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${activeTab === 'activity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Activity
              </button>
              {/* <button
                onClick={() => setActiveTab('referral')}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${activeTab === 'referral' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Upline
              </button> */}
            </div>
          </div>

          {/* Compact Earnings Display */}
          {activeTab === 'mining' && (
          <div className="flex items-center justify-center py-4">
            <div className="relative w-40 h-40">
              {/* Simple rings */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
              <div className="absolute inset-2 rounded-full border border-blue-200" />
              
              {/* Clean background */}
              <div className="absolute inset-0 rounded-full bg-slate-50" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-slate-900 text-2xl font-black mb-1 tracking-tight">
                  {currentEarningsTon.toFixed(6)}
                </div>
                <div className="text-blue-600 text-sm font-bold mb-1 tracking-wider">
                  TAPps
                </div>
                <div className="text-emerald-600 text-sm font-semibold">
                  ≈ ${(currentEarningsTon * tonPrice).toFixed(4)}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isStaked ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <div className={`text-xs font-bold tracking-wide ${isStaked ? 'text-emerald-600' : 'text-slate-500'}`}>{isStaked ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'activity' && (
            <div className="mt-4 mb-4 space-y-4">
              {/* Withdrawal Activity Summary */}
              {props.withdrawals && props.withdrawals.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Withdrawal Activity</div>
                      <div className="text-xs text-blue-600">Your withdrawal history</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-lg font-bold text-emerald-600">
                        {props.withdrawals.filter(w => w.status === 'COMPLETED').length}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Completed</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-lg font-bold text-amber-600">
                        {props.withdrawals.filter(w => w.status === 'PENDING').length}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Pending</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-lg font-bold text-slate-600">
                        {props.withdrawals.reduce((sum, w) => sum + (w.status === 'COMPLETED' ? w.amount : 0), 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Total Paid</div>
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
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-900 capitalize font-medium">{a.type.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{typeof a.amount === 'number' ? a.amount.toFixed(6) : a.amount} {a.type === 'nova_reward' ? 'TAPPS' : 'TON'}</div>
                      <div className="text-xs text-slate-500">{a.status}</div>
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
                    <div key={`withdrawal-${w.id}`} className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                      w.status === 'PENDING' ? 'bg-amber-50 border-amber-200' :
                      w.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' :
                      w.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                      'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        w.status === 'PENDING' ? 'bg-amber-100' :
                        w.status === 'COMPLETED' ? 'bg-emerald-100' :
                        w.status === 'FAILED' ? 'bg-red-100' :
                        'bg-slate-100'
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
                          {w.amount.toFixed(6)} TAPPs
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
                      <div className="text-xs text-slate-400">Your mining and withdrawal activities will appear here</div>
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
          {/* Not staked prompt */}
          {!isStaked && (
            <div className="mb-6">
              <div className="relative w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="relative flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-slate-800 text-sm font-medium">Deposit TON to start mining</div>
                    <div className="text-slate-600 text-xs">Stake TON to activate real-time earnings</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          

          {/* Professional Stats Grid */}
          <div className={`grid ${typeof estimatedDailyTapps === 'number' ? 'grid-cols-3' : 'grid-cols-3'} gap-4 mb-6`}>
            {/* Claimable Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="text-xs text-blue-600 font-semibold tracking-wide uppercase mb-1">Claimable</div>
                <div className="text-slate-900 font-bold text-lg leading-tight">
                  {totalWithdrawnTon.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </div>
                <div className="text-blue-500 text-xs font-medium">TAPps</div>
              </div>
            </div>
            
            {/* Airdrop Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <div className="text-xs text-purple-600 font-semibold tracking-wide uppercase mb-1">Airdrop</div>
                <div className="text-slate-900 font-bold text-lg leading-tight">
                  {Number(airdropBalanceNova ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-purple-500 text-xs font-medium">TAPps</div>
              </div>
            </div>
            
            {/* Withdrawal Status Card */}
            {/* <div className={`group relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 ${
              withdrawalEligibility.canWithdraw 
                ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50' 
                : withdrawalEligibility.hasPendingWithdrawal
                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200/50'
                : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/50'
            }`}>
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                withdrawalEligibility.canWithdraw 
                  ? 'bg-gradient-to-br from-emerald-500/5 to-green-500/5' 
                  : withdrawalEligibility.hasPendingWithdrawal
                  ? 'bg-gradient-to-br from-amber-500/5 to-yellow-500/5'
                  : 'bg-gradient-to-br from-orange-500/5 to-red-500/5'
              }`} />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    withdrawalEligibility.canWithdraw 
                      ? 'bg-emerald-100' 
                      : withdrawalEligibility.hasPendingWithdrawal
                      ? 'bg-amber-100'
                      : 'bg-orange-100'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      withdrawalEligibility.canWithdraw 
                        ? 'text-emerald-600' 
                        : withdrawalEligibility.hasPendingWithdrawal
                        ? 'text-amber-600'
                        : 'text-orange-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                  </div>
                <div className={`w-2 h-2 rounded-full ${
                    withdrawalEligibility.canWithdraw 
                      ? 'bg-emerald-500 animate-pulse' 
                      : withdrawalEligibility.hasPendingWithdrawal
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-orange-500'
                  }`} />
                </div>
                <div className={`text-xs font-semibold tracking-wide uppercase mb-1 ${
                  withdrawalEligibility.canWithdraw 
                    ? 'text-emerald-600' 
                    : withdrawalEligibility.hasPendingWithdrawal
                    ? 'text-amber-600'
                    : 'text-orange-600'
                }`}>
                {withdrawalEligibility.canWithdraw 
                  ? 'Available' 
                  : withdrawalEligibility.hasPendingWithdrawal
                  ? 'Pending'
                  : 'Cooldown'
                }
              </div>
                <div className={`font-bold text-lg leading-tight ${
                withdrawalEligibility.canWithdraw 
                    ? 'text-emerald-700' 
                  : withdrawalEligibility.hasPendingWithdrawal
                    ? 'text-amber-700'
                  : 'text-orange-700'
              }`}>
                {withdrawalEligibility.canWithdraw 
                  ? 'Ready' 
                  : withdrawalEligibility.hasPendingWithdrawal
                  ? 'Processing'
                  : `${withdrawalEligibility.daysUntilWithdrawal}d`
                }
              </div>
                <div className="text-slate-500 text-xs font-medium">Weekly</div>
            </div>
            </div> */}

            {/* Estimated Daily Card */}
            {typeof estimatedDailyTapps === 'number' && (
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold tracking-wide uppercase mb-1">Est. Daily</div>
                  <div className="text-slate-900 font-bold text-lg leading-tight">
                  {estimatedDailyTapps.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-slate-500 text-xs font-medium">TAPps/day</div>
                </div>
              </div>
            )}
          </div>

          {/* Compact Action Buttons */}
          <div className="space-y-2">
          <button
              onClick={isStaked ? onClaim : onOpenDeposit}
              disabled={isStaked ? !canClaim : false}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                (isStaked && canClaim) 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {isStaked ? (
                  isClaiming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
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
                      <span>Claim Rewards</span>
                    </>
                  )
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Deposit to Start Mining</span>
                  </>
                )}
              </div>
            </button>

            {/* Decentralized Withdrawal Button */}
            {isStaked && totalWithdrawnTon > 0 && (
              <div className="relative">
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!withdrawalEligibility.canWithdraw}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 relative overflow-hidden ${
                  withdrawalEligibility.canWithdraw
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : withdrawalEligibility.hasPendingWithdrawal
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-2 border-amber-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-2 border-orange-200 cursor-not-allowed'
                  }`}
                >
                  {/* Blockchain-style background pattern */}
                  {withdrawalEligibility.canWithdraw && (
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse" />
                    </div>
                  )}
                  
                  <div className="relative flex items-center justify-center gap-3">
                    {/* Blockchain/Network Icon */}
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                      <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                    
                    {/* Main Icon */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                    
                    {/* Text */}
                    <span className="font-bold tracking-wide">
                    {withdrawalEligibility.canWithdraw 
                        ? 'DeFi Withdraw' 
                      : withdrawalEligibility.hasPendingWithdrawal
                        ? 'Processing on Chain'
                        : `Cooldown (${withdrawalEligibility.daysUntilWithdrawal}d)`
                    }
                  </span>
                    
                    {/* Status Indicator */}
                    {withdrawalEligibility.canWithdraw && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-xs font-medium opacity-90">LIVE</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Decentralized badge */}
                  {withdrawalEligibility.canWithdraw && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      DeFi
                </div>
                  )}
              </button>
                
                {/* Additional info for pending/cooldown states */}
                {!withdrawalEligibility.canWithdraw && (
                  <div className="mt-2 text-center">
                    <div className="text-xs text-slate-500 font-medium">
                      {withdrawalEligibility.hasPendingWithdrawal 
                        ? 'Transaction pending on blockchain' 
                        : 'Next withdrawal available in'
                      }
                    </div>
                    {!withdrawalEligibility.hasPendingWithdrawal && (
                      <div className="text-xs text-slate-400 mt-1">
                        {withdrawalEligibility.daysUntilWithdrawal} days
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact Footer Info */}
          <div className="mt-4">
            <div className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-bold">Real-time Mining</div>
                  <div className="text-slate-600 text-xs font-semibold">Calculated every second</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        totalWithdrawnTon={totalWithdrawnTon}
        onSuccess={() => {
          // Refresh withdrawal eligibility after successful withdrawal
          checkWithdrawalEligibility();
          showSnackbar?.({
            message: 'Withdrawal submitted successfully!',
            description: 'Your withdrawal request has been processed'
          });
        }}
      />
    </div>
  );
}


