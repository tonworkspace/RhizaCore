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
  potentialEarningsTon: number;
  airdropBalanceNova: number;
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
    potentialEarningsTon,
    airdropBalanceNova,
  } = props;

  const canClaim = !isClaiming && currentEarningsTon > 0 && claimCooldown <= 0;

  return (
    <div className="relative overflow-visible">
      {/* Scene container */}
      <div className="relative p-5 rounded-2xl bg-gradient-to-b from-[#0B0E14] to-[#151827] border border-cyan-400/20 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.08)]">
        {/* Grid + glow */}
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:20px_20px] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />

        {/* Decorative corners */}
        <div className="absolute -top-px -left-px w-16 h-16">
          <div className="absolute top-0 left-0 w-[2px] h-10 bg-gradient-to-b from-cyan-400/70 to-transparent" />
          <div className="absolute top-0 left-0 h-[2px] w-10 bg-gradient-to-r from-cyan-400/70 to-transparent" />
        </div>
        <div className="absolute -top-px -right-px w-16 h-16">
          <div className="absolute top-0 right-0 w-[2px] h-10 bg-gradient-to-b from-cyan-400/70 to-transparent" />
          <div className="absolute top-0 right-0 h-[2px] w-10 bg-gradient-to-l from-cyan-400/70 to-transparent" />
        </div>
        <div className="absolute -bottom-px -left-px w-16 h-16">
          <div className="absolute bottom-0 left-0 w-[2px] h-10 bg-gradient-to-t from-cyan-400/70 to-transparent" />
          <div className="absolute bottom-0 left-0 h-[2px] w-10 bg-gradient-to-r from-cyan-400/70 to-transparent" />
        </div>
        <div className="absolute -bottom-px -right-px w-16 h-16">
          <div className="absolute bottom-0 right-0 w-[2px] h-10 bg-gradient-to-t from-cyan-400/70 to-transparent" />
          <div className="absolute bottom-0 right-0 h-[2px] w-10 bg-gradient-to-l from-cyan-400/70 to-transparent" />
        </div>

        {/* Header / Wallet stats */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center ring-1 ring-cyan-400/20">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-white/50">My Stake</div>
              <div className="text-xl font-semibold text-white">
                {balanceTon?.toFixed(2) || '0.00'} <span className="text-white/60 text-sm">TON</span>
              </div>
            </div>
          </div>
          <button
            onClick={onOpenDeposit}
            className="group flex items-center gap-2 px-3 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:animate-ping" />
            <span className="text-xs font-medium text-cyan-300">Top Up</span>
          </button>
        </div>

        {/* Scene: mine pit with animated sparkles */}
        <div className="relative z-10 rounded-xl border border-white/5 bg-gradient-to-b from-[#0D111C] to-[#111525] px-4 py-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 left-1/3 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 right-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* Mine rig */}
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-28 mb-4">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 ring-1 ring-cyan-400/20" />
              <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-20 h-20 rounded-full bg-cyan-400/15 ring-1 ring-cyan-300/20 animate-[spin_6s_linear_infinite]" />
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-24 h-2 bg-cyan-400/40 rounded-full animate-pulse" />
              <div className="absolute left-2 right-2 bottom-3 h-3 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-[progress_2.2s_ease_infinite]" style={{ width: '60%' }} />
              </div>
            </div>

            {/* Claim button as primary action */}
            <button
              onClick={onClaim}
              disabled={!canClaim}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 relative overflow-hidden
                ${canClaim ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-white/50 cursor-not-allowed'}`}
            >
              <div className="relative flex items-center gap-2">
                {isClaiming ? (
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Claim Rewards</span>
                  </>
                )}
              </div>
            </button>

            {/* Current earnings */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">{currentEarningsTon.toFixed(4)}</span>
              <span className="text-white/60">TON</span>
              <div className="ml-2 rounded px-2 py-0.5 bg-white/5 text-xs text-white/50">
                ≈ ${(currentEarningsTon * tonPrice).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
            <div className="text-xs text-white/60 mb-1">Mining Potential</div>
            <div className="text-base font-semibold text-cyan-300">{potentialEarningsTon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON</div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="text-xs text-white/60 mb-1">Airdrop Balance</div>
            <div className="text-base font-semibold text-purple-300">{Number(airdropBalanceNova ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TAPPS</div>
          </div>
        </div>
      </div>

      <style>
        {`@keyframes progress { 0%{transform:translateX(-60%)} 50%{transform:translateX(-10%)} 100%{transform:translateX(40%)} }`}
      </style>
    </div>
  );
}


