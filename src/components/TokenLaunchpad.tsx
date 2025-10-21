import React, { useState } from 'react';
import useAuth from '@/hooks/useAuth';

const TokenLaunchpad: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'tokenomics'>('roadmap');

  return (
    <div className="p-2  rounded-lg">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-2 animate-pulse">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 
              bg-clip-text text-transparent">💎 NOVA TOKEN 💎</span>
          </div>
          <p className="text-gray-400 text-sm">The future of mining on Telegram</p>
        </div>

        {/* Token Stats Card */}
        <div className="relative p-4 rounded-xl border border-blue-500/20 bg-black/30 backdrop-blur-sm shadow-lg rounded-xl p-4">
          {/* Animated Corner Decorations */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400/50" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400/50" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400/50" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400/50" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Your Nova Tokens</p>
              <p className="text-xl font-bold text-white flex items-center">
                {user?.total_sbt?.toLocaleString() || '0'} NOVA
              </p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Target Market Cap</p>
              <p className="text-xl font-bold text-white flex items-center">
                 2.5M
              </p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Total Supply</p>
              <p className="text-xl font-bold text-white flex items-center">
                100M NOVA
              </p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Network</p>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                TON
                
              </p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg col-span-2">
              <p className="text-gray-400 text-xs mb-1">Contract Address</p>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                <span className="truncate">EQAz-pzFbiv4pw_nPh-8Z9eimuaDJEnZhCVWfZPGOdB8TlfS</span>
                <button 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={() => navigator.clipboard.writeText('EQAz-pzFbiv4pw_nPh-8Z9eimuaDJEnZhCVWfZPGOdB8TlfS')}
                >
                  📋
                </button>
              </p>
            </div>
          </div>
        </div>
        {/* Roadmap & Tokenomics Card */}
        <div className="relative p-4 rounded-xl border border-blue-500/20 bg-black/30 backdrop-blur-sm shadow-lg rounded-xl p-4 mt-4">
          {/* Animated Corner Decorations */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400/50" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400/50" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400/50" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400/50" />
          
          {/* Tab Navigation - Made more touch-friendly */}
          <div className="flex w-full gap-2 mb-6">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex-1 py-3 rounded-xl transition-all transform active:scale-95 ${
                activeTab === 'roadmap'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70'
              }`}
            >
              <span className="text-sm font-medium">🎮 Product</span>
            </button>
            <button
              onClick={() => setActiveTab('tokenomics')}
              className={`flex-1 py-3 rounded-xl transition-all transform active:scale-95 ${
                activeTab === 'tokenomics'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70'
              }`}
            >
              <span className="text-sm font-medium">💎 Tokenomics</span>
            </button>
          </div>

          {/* Content */}
          {activeTab === 'roadmap' ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:to-blue-400/20">
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
                  <div className={`absolute left-[-24px] top-0 w-5 h-5 rounded-full flex items-center justify-center
                    ${milestone.active 
                      ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse' 
                      : 'bg-gray-700 group-hover:bg-gray-600'
                    }`}>
                    <span className="text-xs">{milestone.icon}</span>
                  </div>
                  <div className="transform transition-all duration-300 group-hover:scale-102 group-hover:translate-x-1">
                    <h4 className="text-white text-sm font-medium flex items-center gap-2">
                      <span className="text-blue-400">{milestone.date}</span> 
                      <span className="text-gray-300">-</span> 
                      <span>{milestone.phase}</span>
                    </h4>
                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-xl border border-blue-500/10 hover:border-blue-500/20 transition-all">
                <h4 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
                  <span className="text-blue-400">📊</span> Token Distribution
                </h4>
                {[
                  { label: 'Community Mining', value: '40%', color: 'from-blue-400' },
                  { label: 'Staking Rewards', value: '30%', color: 'from-blue-500' },
                  { label: 'Team & Development', value: '20%', color: 'from-blue-600' },
                  { label: 'Marketing', value: '10%', color: 'from-blue-700' }
                ].map((item, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400 text-xs">{item.label}</span>
                      <span className="text-white text-xs">{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color} to-transparent rounded-full`}
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-xl border border-blue-500/10 hover:border-blue-500/20 transition-all">
                <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                  <span className="text-blue-400">⚡</span> Token Utility
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '🏛️', text: 'Governance voting rights' },
                    { icon: '💰', text: 'Platform fee discounts' },
                    { icon: '🎯', text: 'Exclusive feature access' },
                    { icon: '⭐', text: 'Staking rewards boost' }
                  ].map((benefit, index) => (
                    <div key={index} 
                      className="bg-gray-700/30 p-3 rounded-lg hover:bg-gray-700/40 transition-all">
                      <div className="text-lg mb-1">{benefit.icon}</div>
                      <div className="text-xs text-gray-300">{benefit.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenLaunchpad; 