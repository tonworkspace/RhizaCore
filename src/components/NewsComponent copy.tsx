import React from 'react';

const NewsComponent: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
              <span className="text-xs font-semibold text-blue-700">TAPPs Token</span>
              <span className="text-[10px] text-blue-600">New Meme Era</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">🐸 TAPPs Token — The New Meme Era Begins!</h1>
            <p className="text-slate-700 text-sm md:text-base max-w-2xl">
              Introducing $TAPPs — the community-powered, multi-chain meme coin. We start on TON and expand to SUI, BSC, SOL, and ETH.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-w-[180px]">
            <a href="https://t.me/TAPPs_Chat" target="_blank" rel="noopener noreferrer" className="w-full text-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Join Telegram</a>
            <a href="https://x.com/TAPP_Whale" target="_blank" rel="noopener noreferrer" className="w-full text-center px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold border border-slate-200">Follow on X</a>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multi‑Chain</div>
            <div className="text-sm font-semibold text-slate-900">TON → SUI • BSC • SOL • ETH</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Community‑Powered</div>
            <div className="text-sm font-semibold text-slate-900">Meme-first culture • Whale circle</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Early Access</div>
            <div className="text-sm font-semibold text-slate-900">Buy & Sell Program before listing</div>
          </div>
        </div>
      </div>

      {/* Early Program */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">💎🔥 Early Buy & Sell Program</h2>
            <p className="text-sm text-slate-700 mt-1 max-w-3xl">
              Buy $TAPPs before it’s listed, hold strong to unlock early community benefits, and sell later once live on major DEXs. The earlier you buy, the bigger your upside at launch.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700 list-disc pl-5">
              <li>Buy before listing</li>
              <li>Hold for early perks</li>
              <li>Sell post‑launch on DEXs</li>
            </ul>
          </div>
          <div className="min-w-[180px]">
            <a href="https://t.me/TAPPs_Chat" target="_blank" rel="noopener noreferrer" className="w-full inline-block text-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Get Early Access</a>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🧭 TAPPs Roadmap</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-sm font-semibold text-slate-900">📍 Phase 1 — TON Launch (Now Live!)</div>
            <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
              <li>TAPPs Mining Goes Live</li>
              <li>Buy & Sell Program Starts</li>
              <li>Community Growth and Airdrop Events</li>
              <li>TAPPs Whale Community Activation</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-sm font-semibold text-slate-900">📍 Phase 2 — Multi‑Chain Expansion</div>
            <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
              <li>Bridge to SUI, BSC, SOL, and ETH</li>
              <li>Meme Marketing Campaign</li>
              <li>Partnerships with TON Projects</li>
              <li>Listings on Community DEXs</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-sm font-semibold text-slate-900">📍 Phase 3 — Ecosystem Utility</div>
            <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
              <li>TAPPs NFT Series Launch</li>
              <li>Meme‑to‑Earn Platform</li>
              <li>Staking & Rewards Integration</li>
              <li>Cross‑chain Mining Expansion</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-sm font-semibold text-slate-900">📍 Phase 4 — Global Recognition</div>
            <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
              <li>CEX Listings</li>
              <li>Worldwide Marketing Push</li>
              <li>Community Governance</li>
              <li>Meme Festival & TAPPs Merch</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Whitepaper Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-lg">🐳</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">TAPPs Whale Whitepaper</h2>
        </div>
        <p className="text-sm text-slate-700 mb-4">
          The Multichain Mining & Engagement Economy - Be Early. Be a Whale. Be TAPP'd In.
        </p>
        
        {/* Executive Summary */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Executive Summary</h3>
          <p className="text-sm text-blue-800 mb-3">
            TAPPs Whale represents a paradigm shift in token distribution—a multichain economy where mining becomes accessible, rewarding, and truly community-driven.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-lg font-bold text-blue-600">0% VC</div>
              <div className="text-xs text-slate-600">VC Allocation</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-lg font-bold text-blue-600">40%</div>
              <div className="text-xs text-slate-600">Community Mining</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-lg font-bold text-blue-600">Multi-chain</div>
              <div className="text-xs text-slate-600">TON + Expansion</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-lg font-bold text-blue-600">100%</div>
              <div className="text-xs text-slate-600">Transparent</div>
            </div>
          </div>
        </div>

        {/* Problem & Solution */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">🎯 Problem & Solution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <h4 className="text-sm font-semibold text-red-900 mb-2">❌ The Web3 Crisis</h4>
              <ul className="text-xs text-red-800 space-y-1">
                <li>• 60-80% tokens to VCs before public sale</li>
                <li>• Community gets minimal allocation at premium prices</li>
                <li>• Projects demand effort without proportional rewards</li>
                <li>• Hype-driven economics dominate fundamentals</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-2">✅ TAPPs Whale Solution</h4>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• Community-first mining with 0% VC allocation</li>
                <li>• Transparent staking mechanism with TON</li>
                <li>• Built-in referral and progressive reward system</li>
                <li>• Multichain architecture (TON → Solana → Base → BSC)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">⚙️ Technical Architecture</h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Mining Mechanism</h4>
            <p className="text-xs text-slate-700 mb-3">
              Non-custodial smart contract on TON Blockchain ensuring transparency and user control.
            </p>
            <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3">
              <div className="text-xs font-semibold text-slate-900 mb-1">Reward Formula:</div>
              <div className="text-xs text-slate-700 font-mono">
                Reward = (Effective Staking Power / Total Network Power) × Daily Emission
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Where Effective Staking Power = Staked TON × Time Multiplier × Referral Boost
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h5 className="text-xs font-semibold text-slate-900 mb-1">Time Multipliers</h5>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• 1-7 days: 1.0x base rate</li>
                  <li>• 8-30 days: 1.1x bonus multiplier</li>
                  <li>• 31+ days: 1.25x maximum multiplier</li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-slate-900 mb-1">Referral System</h5>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• Base referral: +5% mining power</li>
                  <li>• Tiered secondary: +2.5% each</li>
                  <li>• Maximum boost cap: 50% total</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tokenomics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">💰 Tokenomics & Economic Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Token Allocation</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                  <span className="text-xs font-medium text-slate-700">Mining Rewards</span>
                  <span className="text-xs font-bold text-blue-600">40%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                  <span className="text-xs font-medium text-slate-700">Liquidity & Listings</span>
                  <span className="text-xs font-bold text-blue-600">20%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                  <span className="text-xs font-medium text-slate-700">Ecosystem Development</span>
                  <span className="text-xs font-bold text-blue-600">15%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                  <span className="text-xs font-medium text-slate-700">Marketing & Growth</span>
                  <span className="text-xs font-bold text-blue-600">15%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                  <span className="text-xs font-medium text-slate-700">Treasury Reserve</span>
                  <span className="text-xs font-bold text-blue-600">10%</span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Token Specifications</h4>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-slate-900">1,000,000,000,000</div>
                  <div className="text-xs text-slate-600">Total Supply</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-slate-900">$TAPPs</div>
                  <div className="text-xs text-slate-600">Token Symbol</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-slate-900">18</div>
                  <div className="text-xs text-slate-600">Decimals</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-slate-900">TON</div>
                  <div className="text-xs text-slate-600">Primary Chain</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Governance */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">🔒 Security & Governance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Security Measures</h4>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• Smart Contract Audit by reputable security firm</li>
                <li>• Multi-signature Treasury management</li>
                <li>• Time-locked contract upgrades (72-hour notice)</li>
                <li>• Non-custodial user fund management</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Governance Model</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Community-driven decision making</li>
                <li>• Token holder voting rights</li>
                <li>• Transparent proposal and voting system</li>
                <li>• Progressive decentralization roadmap</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Community & Hashtags */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">🌊 Be Early. Be a Whale. Be TAPP'd In.</h3>
              <p className="text-sm text-slate-700 mt-1">Enter before market listing — don't wait for the hype, create it.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href="https://t.me/TAPPs_Chat" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Join Community</a>
              <a href="https://x.com/TAPP_Whale" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200">Follow on X</a>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600">
            <span className="font-semibold">Hashtags:</span> #TAPPsToken #TON #MemeCoin #CryptoLaunch #Web3 #TAPPsWhale
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsComponent;