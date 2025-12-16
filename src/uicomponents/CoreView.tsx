import React, { useState } from 'react';
import { MiningState } from '../types';
import { Icons } from './Icons';

interface CoreViewProps {
  state: MiningState;
  onPurchase: (cost: number, type: string) => boolean;
}

type CoreTab = 'Upgrades' | 'NFT' | 'Chance';

export const CoreView: React.FC<CoreViewProps> = ({ state, onPurchase }) => {
  const [activeTab, setActiveTab] = useState<CoreTab>('Upgrades');
  const [minting, setMinting] = useState(false);

  // Mock Data
  const upgrades = [
    { id: 1, name: 'Quantum Core v1', cost: 5000, rate: '+5%', level: 1, icon: 'Chip' },
    { id: 2, name: 'Neural Link', cost: 15000, rate: '+12%', level: 0, icon: 'Energy' },
    { id: 3, name: 'Cryo Cooling', cost: 45000, rate: '+25%', level: 0, icon: 'Fire' },
  ];

  const handleBuy = (item: any) => {
    if (state.balance >= item.cost) {
      onPurchase(item.cost, 'upgrade');
      // In a real app, we'd update the item level state here
    }
  };

  const handleMint = () => {
    if (state.balance >= 50000) {
      setMinting(true);
      setTimeout(() => {
        onPurchase(50000, 'nft');
        setMinting(false);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
           <h1 className="text-xl font-bold text-white tracking-wider">Core Mainframe</h1>
           <p className="text-gray-400 text-xs mt-1 font-mono">
             Balance: <span className="text-rzc-green">{state.balance.toFixed(0)} RZC</span>
           </p>
        </div>
        <div className="flex bg-rzc-dark rounded-xl p-1 border border-white/5">
           {(['Upgrades', 'NFT', 'Chance'] as CoreTab[]).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                 activeTab === tab ? 'bg-rzc-green text-black' : 'text-gray-400 hover:text-white'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'Upgrades' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-rzc-green/10 to-transparent border border-rzc-green/20 rounded-2xl flex items-center gap-4">
             <div className="w-12 h-12 bg-rzc-green/20 rounded-full flex items-center justify-center text-rzc-green animate-pulse-glow">
                <Icons.Chip size={24} />
             </div>
             <div>
                <h3 className="text-white font-bold text-sm">Node Overclocking</h3>
                <p className="text-gray-400 text-[10px]">Purchase cores to permanently boost mining rate.</p>
             </div>
          </div>

          <div className="grid gap-3">
             {upgrades.map(item => {
               const canAfford = state.balance >= item.cost;
               const Icon = Icons[item.icon as keyof typeof Icons] || Icons.Core;

               return (
                 <div key={item.id} className="bg-rzc-dark border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#050a05] rounded-xl flex items-center justify-center text-gray-300 border border-white/5">
                            <Icon size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-white font-bold text-sm">{item.name}</h4>
                                <span className="text-[9px] bg-rzc-green/10 text-rzc-green px-1.5 py-0.5 rounded font-mono">Lvl {item.level}</span>
                            </div>
                            <div className="text-rzc-green text-xs font-mono mt-0.5">{item.rate} Output</div>
                        </div>
                    </div>
                    
                    <button 
                       onClick={() => handleBuy(item)}
                       disabled={!canAfford}
                       className={`px-4 py-2 rounded-xl text-xs font-bold flex flex-col items-center min-w-[80px] transition-all
                          ${canAfford 
                              ? 'bg-white text-black hover:bg-rzc-green hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]' 
                              : 'bg-white/5 text-gray-500 cursor-not-allowed'
                          }`}
                    >
                       <span>Buy</span>
                       <span className="text-[9px] opacity-80">{item.cost > 1000 ? `${item.cost/1000}K` : item.cost}</span>
                    </button>
                 </div>
               )
             })}
          </div>
        </div>
      )}

      {activeTab === 'NFT' && (
        <div className="flex flex-col items-center">
            <div className="w-full relative aspect-square bg-gradient-to-b from-rzc-dark to-black rounded-3xl border border-rzc-green/20 overflow-hidden mb-6 group">
                {/* Visual Placeholder for NFT */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icons.NFT size={80} className="text-rzc-green/20 group-hover:text-rzc-green/40 transition-all duration-700 scale-110 group-hover:scale-125 group-hover:rotate-12" />
                </div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <h2 className="text-2xl font-bold text-white font-mono">Genesis Key</h2>
                    <p className="text-gray-400 text-xs mt-1">Tier 1 • Network Validator Access</p>
                </div>
                
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-rzc-green/30 text-rzc-green text-xs font-mono">
                    450 / 1000 Minted
                </div>
            </div>

            <div className="w-full bg-rzc-dark border border-white/5 rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-xs">Mint Price</span>
                    <span className="text-white font-bold text-lg font-mono">50,000 RZC</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-xs">Utility</span>
                    <span className="text-rzc-green text-xs font-bold">+100% Boost & Airdrop Multiplier</span>
                </div>
                <button 
                    onClick={handleMint}
                    disabled={state.balance < 50000 || minting}
                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2
                        ${state.balance >= 50000 
                            ? 'bg-rzc-green text-black shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:scale-[1.02]' 
                            : 'bg-white/10 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {minting ? (
                        <>
                           <Icons.Settings className="animate-spin" size={16} /> PROCESSING
                        </>
                    ) : (
                        <>
                           <Icons.Mint size={16} /> MINT KEY
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {activeTab === 'Chance' && (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-900/20 to-rzc-dark border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Icons.Chance size={100} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">System Override</h3>
                <p className="text-gray-400 text-xs max-w-[70%] mb-6">
                    Attempt to breach the Rhiza firewall. High risk, massive RZC rewards.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-rzc-black border border-purple-500/30 rounded-xl p-4 hover:border-purple-500 hover:bg-purple-500/10 transition-all group">
                        <div className="text-purple-400 text-xs font-bold mb-1 group-hover:text-purple-300">LOW SEC</div>
                        <div className="text-white font-mono text-lg font-bold">2x</div>
                        <div className="text-[9px] text-gray-500 mt-1">Cost: 1,000 RZC</div>
                    </button>
                    <button className="bg-rzc-black border border-red-500/30 rounded-xl p-4 hover:border-red-500 hover:bg-red-500/10 transition-all group">
                        <div className="text-red-400 text-xs font-bold mb-1 group-hover:text-red-300">HIGH SEC</div>
                        <div className="text-white font-mono text-lg font-bold">10x</div>
                        <div className="text-[9px] text-gray-500 mt-1">Cost: 5,000 RZC</div>
                    </button>
                </div>
            </div>

            <div className="bg-rzc-dark border border-white/5 rounded-2xl p-5 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                        <Icons.Lock size={18} className="text-gray-500" />
                    </div>
                    <div>
                        <h4 className="text-gray-300 font-bold text-sm">Staking Pool</h4>
                        <p className="text-gray-600 text-[10px]">Coming soon in Phase 2</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};