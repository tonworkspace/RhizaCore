import { useState } from 'react';
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
  isLoadingActivities?: boolean;
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
    onOpenWithdraw,
    airdropBalanceNova,
    potentialEarningsTon,
    totalWithdrawnTon,
  } = props;

  const [activeTab, setActiveTab] = useState<'mining' | 'activity'>('mining');

  const isStaked = Number(balanceTon) > 0;
  const canClaim = isStaked && !isClaiming && currentEarningsTon > 0 && claimCooldown <= 0;

  return (
    <div className="relative overflow-visible">
      <div className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Clean, minimal background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 via-transparent to-blue-50/20 rounded-2xl" />
        
        <div className="relative">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isStaked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">My Stake</div>
                <div className="text-xl font-semibold text-slate-900">
                  {balanceTon?.toFixed(2) || '0.00'} <span className="text-slate-600 text-lg">TON</span>
                </div>
                {isStaked ? (
                  <div className="text-xs text-emerald-600 font-medium">Active Mining</div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium">Not Mining</div>
                )}
              </div>
            </div>
            <button
              onClick={onOpenDeposit}
              className="group relative flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl border-0 text-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-semibold">Deposit</span>
            </button>
          </div>

          {/* Internal Tabs */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex p-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab('mining')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'mining' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'}`}
              >
                Mining
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'activity' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'}`}
              >
                Activity
              </button>
            </div>
          </div>

          {/* Earnings Display */}
          {activeTab === 'mining' && (
          <div className="flex items-center justify-center py-8">
            <div className="relative w-52 h-52">
              {/* Outer rings with enhanced styling */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-200 shadow-sm" />
              <div className="absolute inset-3 rounded-full border border-slate-100" />
              <div className="absolute inset-6 rounded-full border-2 border-blue-300 shadow-sm" />
              
              {/* Enhanced background with gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-50 via-white to-blue-50/60" />
              
              {/* Status indicator with pulse animation */}
              <div className={`absolute inset-2 rounded-full ${isStaked ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-slate-50'} shadow-inner`} />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-slate-900 text-3xl font-bold mb-1 tracking-tight">
                  {currentEarningsTon.toFixed(6)}
                </div>
                <div className="text-blue-600 text-sm font-semibold tracking-wider mb-1 uppercase">
                  NOVATON
                </div>
                <div className="text-emerald-600 text-sm font-semibold">
                  ≈ ${(currentEarningsTon * tonPrice).toFixed(2)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isStaked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'} shadow-sm`} />
                  <div className={`text-sm font-medium ${isStaked ? 'text-emerald-600' : 'text-slate-500'}`}>{isStaked ? 'Active Mining' : 'Not Mining'}</div>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'activity' && (
            <div className="mt-4 mb-4 space-y-3">
              {props.isLoadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : props.activities && props.activities.length > 0 ? (
                props.activities.slice(0, 10).map((a) => (
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
                      <div className="text-sm font-semibold text-slate-900">{typeof a.amount === 'number' ? a.amount.toFixed(6) : a.amount} {a.type === 'nova_reward' ? 'NOVA' : 'TON'}</div>
                      <div className="text-xs text-slate-500">{a.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">No recent activity</div>
              )}
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
          

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="group relative rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 hover:border-emerald-300 transition-all duration-200 hover:shadow-md hover:scale-105">
              <div className="relative">
                <div className="text-xs text-emerald-600 font-semibold tracking-wide uppercase mb-2">Claimable</div>
                <div className="text-emerald-700 font-bold text-lg">
                  {totalWithdrawnTon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-emerald-600 text-xs font-medium">NTON</div>
              </div>
            </div>
            
            <div className="group relative rounded-xl p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md hover:scale-105">
              <div className="relative">
                <div className="text-xs text-blue-600 font-semibold tracking-wide uppercase mb-2">Airdrop</div>
                <div className="text-blue-700 font-bold text-lg">
                  {Number(airdropBalanceNova ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-blue-600 text-xs font-medium">NTON</div>
              </div>
            </div>
            
            <div className="group relative rounded-xl p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md hover:scale-105">
              <div className="relative">
                <div className="text-xs text-purple-600 font-semibold tracking-wide uppercase mb-2">Potential</div>
                <div className="text-purple-700 font-bold text-lg">
                  {potentialEarningsTon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-purple-600 text-xs font-medium">NTON</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
          <button
              onClick={isStaked ? onClaim : onOpenDeposit}
              disabled={isStaked ? !canClaim : false}
              className={`group w-full px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200
                ${(isStaked && canClaim) 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 ' + (isStaked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-200 hover:text-slate-600')
                }`}
            >
              <div className="relative flex items-center gap-3">
                {isStaked ? (
                  isClaiming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      <span>Claiming...</span>
                    </>
                  ) : claimCooldown > 0 ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{cooldownText}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Claim Rewards</span>
                    </>
                  )
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Deposit to Start Mining</span>
                  </>
                )}
              </div>
            </button>
           
            <button
              onClick={onOpenWithdraw}
              disabled={!isStaked || !onOpenWithdraw || totalWithdrawnTon <= 0}
              className={`group w-full px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200 ${
                isStaked && onOpenWithdraw && totalWithdrawnTon > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span>Withdraw TON</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-8">
            <div className="relative w-full px-6 py-5 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 border border-slate-200 shadow-sm">
              <div className="relative flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-semibold">Real-time Mining</div>
                  <div className="text-slate-600 text-xs font-medium">Calculated and compounded every second</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


