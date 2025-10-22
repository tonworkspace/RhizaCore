import React, { useState } from 'react';
import useAuth from '@/hooks/useAuth';

const TokenLaunchpad: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'tokenomics'>('roadmap');

  return (
    <div className="p-4 rounded-3xl">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 animate-pulse">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 
              bg-clip-text text-transparent">💎 NOVA TOKEN 💎</span>
          </div>
          <p className="text-slate-600 text-base font-medium">The future of mining on Telegram</p>
        </div>

        {/* Token Stats Card */}
        <div className="relative overflow-hidden mb-6">
          {/* Multi-layer animated background matching navbar */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/5 to-cyan-500/8 animate-gradient"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-50/20"></div>
          
          {/* Subtle border glow matching navbar */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/10 to-cyan-400/20 blur-sm -z-10"></div>
          
          {/* Main content container with navbar styling */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl shadow-blue-500/20 p-6 
            hover:bg-white/95 transition-all duration-300">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50 shadow-lg">
                <p className="text-slate-600 text-sm mb-2 font-medium">Your Nova Tokens</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                  {user?.total_sbt?.toLocaleString() || '0'} NOVA
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-green-200/50 shadow-lg">
                <p className="text-slate-600 text-sm mb-2 font-medium">Target Market Cap</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center">
                  2.5M
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-purple-200/50 shadow-lg">
                <p className="text-slate-600 text-sm mb-2 font-medium">Total Supply</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                  100M NOVA
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-cyan-200/50 shadow-lg">
                <p className="text-slate-600 text-sm mb-2 font-medium">Network</p>
                <p className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                  TON
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 shadow-lg col-span-2">
                <p className="text-slate-600 text-sm mb-2 font-medium">Contract Address</p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                  <span className="truncate">EQAz-pzFbiv4pw_nPh-8Z9eimuaDJEnZhCVWfZPGOdB8TlfS</span>
                  <button 
                    className="text-blue-500 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-50"
                    onClick={() => navigator.clipboard.writeText('EQAz-pzFbiv4pw_nPh-8Z9eimuaDJEnZhCVWfZPGOdB8TlfS')}
                  >
                    📋
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Roadmap & Tokenomics Card */}
        <div className="relative overflow-hidden">
          {/* Multi-layer animated background matching navbar */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/5 to-cyan-500/8 animate-gradient"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-50/20"></div>
          
          {/* Subtle border glow matching navbar */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/10 to-cyan-400/20 blur-sm -z-10"></div>
          
          {/* Main content container with navbar styling */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl shadow-blue-500/20 p-6 
            hover:bg-white/95 transition-all duration-300">
            
            {/* Tab Navigation - Made more touch-friendly */}
            <div className="flex w-full gap-3 mb-8">
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`flex-1 py-4 rounded-2xl transition-all transform active:scale-95 ${
                  activeTab === 'roadmap'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/50 text-slate-600 hover:bg-white/70 border border-slate-200'
                }`}
              >
                <span className="text-sm font-medium">🎮 Product</span>
              </button>
              <button
                onClick={() => setActiveTab('tokenomics')}
                className={`flex-1 py-4 rounded-2xl transition-all transform active:scale-95 ${
                  activeTab === 'tokenomics'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/50 text-slate-600 hover:bg-white/70 border border-slate-200'
                }`}
              >
                <span className="text-sm font-medium">💎 Tokenomics</span>
              </button>
            </div>

            {/* Content */}
            {activeTab === 'roadmap' ? (
              <div className="relative pl-8 space-y-8 before:absolute before:left-4 before:top-4 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-blue-500 before:to-purple-400/20">
                {[
                  { 
                    phase: 'Launch', 
                    date: 'Q1 2025', 
                    icon: '🚀', 
                    active: true,
                    description: 'Initial launch of Nova Token with core features including mining mechanics, basic staking functionality, and community governance structure. Introduction of the Nova ecosystem on Telegram.'
                  },
                  { 
                    phase: 'Expansion', 
                    date: 'Q2 2025', 
                    icon: '🌱',
                    active: true,
                    description: 'Rolling out advanced staking tiers, implementing the referral program, and introducing daily/weekly missions. Launch of the Nova marketplace for digital assets.'
                  },
                  { 
                    phase: 'Ecosystem', 
                    date: 'Q3 2025', 
                    icon: '🌐',
                    description: 'Major exchange listings for NOVA token, expanded utility within the app including governance voting, fee discounts, and exclusive features. Partnership program launch.'
                  },
                  { 
                    phase: 'Integration', 
                    date: 'Q4 2025', 
                    icon: '🔗',
                    description: 'Deep integration with TON blockchain ecosystem, cross-chain bridges, and advanced DeFi features. Launch of Nova SDK for third-party developers.'
                  },
                  { 
                    phase: 'Scaling', 
                    date: 'Q1 2026', 
                    icon: '📈',
                    description: 'Global expansion initiatives, institutional partnerships, enhanced security features, and launch of the Nova DAO. Implementation of layer-2 scaling solutions.'
                  }
                ].map((milestone, index) => (
                  <div key={index} className="relative group">
                    <div className={`absolute left-[-32px] top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg
                      ${milestone.active 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/50 animate-pulse' 
                        : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}>
                      <span className="text-sm">{milestone.icon}</span>
                    </div>
                    <div className="transform transition-all duration-300 group-hover:scale-102 group-hover:translate-x-2">
                      <h4 className="text-slate-800 text-base font-semibold flex items-center gap-3">
                        <span className="text-blue-600 font-bold">{milestone.date}</span> 
                        <span className="text-slate-400">-</span> 
                        <span>{milestone.phase}</span>
                      </h4>
                      <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/50 hover:border-blue-300/50 transition-all shadow-lg">
                  <h4 className="text-slate-800 text-lg font-semibold mb-6 flex items-center gap-3">
                    <span className="text-blue-600 text-xl">📊</span> Token Distribution
                  </h4>
                  {[
                    { label: 'Community Mining', value: '40%', color: 'from-blue-500 to-blue-600' },
                    { label: 'Staking Rewards', value: '30%', color: 'from-purple-500 to-purple-600' },
                    { label: 'Team & Development', value: '20%', color: 'from-green-500 to-green-600' },
                    { label: 'Marketing', value: '10%', color: 'from-orange-500 to-orange-600' }
                  ].map((item, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-600 text-sm font-medium">{item.label}</span>
                        <span className="text-slate-800 text-sm font-bold">{item.value}</span>
                      </div>
                      <div className="h-3 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full shadow-lg`}
                          style={{ width: item.value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-200/50 hover:border-purple-300/50 transition-all shadow-lg">
                  <h4 className="text-slate-800 text-lg font-semibold mb-6 flex items-center gap-3">
                    <span className="text-purple-600 text-xl">⚡</span> Token Utility
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: '🏛️', text: 'Governance voting rights' },
                      { icon: '💰', text: 'Platform fee discounts' },
                      { icon: '🎯', text: 'Exclusive feature access' },
                      { icon: '⭐', text: 'Staking rewards boost' }
                    ].map((benefit, index) => (
                      <div key={index} 
                        className="bg-white/70 p-4 rounded-xl hover:bg-white/80 transition-all shadow-md border border-slate-200/50">
                        <div className="text-2xl mb-2">{benefit.icon}</div>
                        <div className="text-sm text-slate-700 font-medium">{benefit.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenLaunchpad; 