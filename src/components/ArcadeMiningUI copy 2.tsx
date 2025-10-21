// import React from 'react';
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

  const isStaked = Number(balanceTon) > 0;
  const canClaim = isStaked && !isClaiming && currentEarningsTon > 0 && claimCooldown <= 0;

  return (
    <div className="relative overflow-visible">
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-[#0A0A0F] via-[#0F0F1A] to-[#151923] border border-white/10 shadow-2xl backdrop-blur-sm">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        
        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center ring-2 ring-cyan-400/30 shadow-lg">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0A0A0F] ${isStaked ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
              </div>
              <div>
                <div className="text-xs text-white/60 font-medium tracking-wide uppercase">My Stake</div>
                <div className="text-xl font-bold text-white">
                  {balanceTon?.toFixed(2) || '0.00'} <span className="text-white/60 text-lg">TON</span>
                </div>
                {isStaked ? (
                  <div className="text-xs text-green-400 font-medium">Active Mining</div>
                ) : (
                  <div className="text-xs text-white/50 font-medium">Not Mining</div>
                )}
              </div>
            </div>
            <button
              onClick={onOpenDeposit}
              className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
              <span className="text-sm font-semibold text-cyan-300">Deposit</span>
              <svg className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Earnings Display */}
          <div className="flex items-center justify-center py-6">
            <div className="relative w-48 h-48">
              {/* Outer rings */}
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-3 rounded-full border border-white/5" />
              <div className="absolute inset-6 rounded-full border border-cyan-500/20" />
              
              {/* Animated gradient background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent" />
              
              {/* Pulsing effect */}
              <div className={`absolute inset-2 rounded-full ${isStaked ? 'bg-cyan-500/5 animate-pulse' : 'bg-white/5'}`} />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-white text-2xl font-bold mb-1">
                  {currentEarningsTon.toFixed(6)}
                </div>
                <div className="text-cyan-300 text-sm font-semibold tracking-wide mb-1">
                  NOVATON
                </div>
                <div className="text-green-400 text-xs font-medium">
                  ≈ ${(currentEarningsTon * tonPrice).toFixed(2)}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isStaked ? 'bg-green-400 animate-pulse' : 'bg-white/40'}`} />
                  <div className={`text-xs ${isStaked ? 'text-green-400' : 'text-white/60'}`}>{isStaked ? 'Mining' : 'Not Mining'}</div>
                </div>
              </div>
            </div>
          </div>
          {/* Not staked prompt */}
          {!isStaked && (
            <div className="mb-6">
              <div className="relative w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/80 text-sm font-medium">Deposit TON to start mining</div>
                    <div className="text-white/60 text-xs">Stake TON to activate real-time earnings</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="group relative rounded-2xl p-4 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/10">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="text-xs text-white/60 font-medium tracking-wide uppercase mb-2">Claimable</div>
                <div className="text-green-400 font-bold text-sm">
                  {totalWithdrawnTon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-white/60 text-xs">NTON</div>
              </div>
            </div>
            
          
            
            <div className="group relative rounded-2xl p-4 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-emerald-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-400/10">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="text-xs text-white/60 font-medium tracking-wide uppercase mb-2">Airdrop</div>
                <div className="text-emerald-300 font-bold text-sm">
                  {Number(airdropBalanceNova ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-white/60 text-xs">NTON</div>
              </div>
            </div>
            
            <div className="group relative rounded-2xl p-4 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-purple-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-400/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="text-xs text-white/60 font-medium tracking-wide uppercase mb-2">Potential</div>
                <div className="text-purple-300 font-bold text-sm">
                  {potentialEarningsTon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-white/60 text-xs">NTON</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
          <button
              onClick={isStaked ? onClaim : onOpenDeposit}
              disabled={isStaked ? !canClaim : false}
              className={`group w-full px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02]
                ${(isStaked && canClaim) 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105' 
                  : 'bg-white/5 text-white/50 ' + (isStaked ? 'cursor-not-allowed' : 'cursor-pointer') + ' border border-white/10'
                }`}
            >
              {/* Animated background */}
              {(isStaked && canClaim) && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              )}
              
              <div className="relative flex items-center gap-3">
                {isStaked ? (
                  isClaiming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className={`group w-full px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                isStaked && onOpenWithdraw && totalWithdrawnTon > 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02]'
                  : 'bg-white/5 text-white/50 cursor-not-allowed border border-white/10'
              }`}
            >
              <svg className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span>Withdraw TON</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-6">
            <div className="relative w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white/80 text-sm font-medium">Real-time Mining</div>
                  <div className="text-white/60 text-xs">Calculated and compounded every second</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


