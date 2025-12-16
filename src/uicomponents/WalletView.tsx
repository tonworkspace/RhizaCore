import React from 'react';
import { MiningState } from '../types';
import { Icons } from './Icons';

interface WalletViewProps {
  state: MiningState;
}

export const WalletView: React.FC<WalletViewProps> = ({ state }) => {
  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto custom-scrollbar">
      <h1 className="text-xl font-bold text-white tracking-wider mb-6">Assets</h1>

      {/* Main Card */}
      <div className="w-full bg-gradient-to-br from-rzc-dark to-[#050a05] border border-rzc-green/20 rounded-2xl p-6 relative overflow-hidden shadow-lg mb-6 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rzc-green/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-rzc-green/10 transition-colors"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-400 text-xs font-mono uppercase tracking-widest">Total Balance</span>
            <div className="bg-rzc-green/10 p-1.5 rounded-lg text-rzc-green">
              <Icons.Wallet size={16} />
            </div>
          </div>
          
          <div className="text-3xl font-bold text-white font-mono mb-1">
            {state.balance.toFixed(2)} <span className="text-sm text-rzc-green">RZC</span>
          </div>
          <div className="text-gray-500 text-xs font-mono">
            ≈ ${(state.balance * 0.0025).toFixed(2)} USD
          </div>

          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-white text-black py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              <Icons.Receive size={16} />
              Deposit
            </button>
            <button className="flex-1 bg-white/10 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-colors">
              <Icons.Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-6">
         <div className="bg-rzc-dark border border-white/5 rounded-xl p-4">
             <div className="flex items-center gap-2 mb-2 text-gray-400">
                 <Icons.Mining size={14} />
                 <span className="text-xs font-bold">Mining</span>
             </div>
             <div className="text-white font-mono font-bold">{state.miningBalance.toFixed(4)}</div>
             <div className="text-[10px] text-gray-500">Unverified</div>
         </div>
         <div className="bg-rzc-dark border border-white/5 rounded-xl p-4">
             <div className="flex items-center gap-2 mb-2 text-purple-400">
                 <Icons.Rank size={14} />
                 <span className="text-xs font-bold">Verified</span>
             </div>
             <div className="text-white font-mono font-bold">{state.validatedBalance.toFixed(4)}</div>
             <div className="text-[10px] text-gray-500">On-chain</div>
         </div>
      </div>

      {/* Connect Wallet Prompt */}
      <div className="bg-rzc-green/5 border border-dashed border-rzc-green/30 rounded-xl p-4 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rzc-green/10 flex items-center justify-center text-rzc-green">
                  <Icons.Card size={20} />
              </div>
              <div className="flex flex-col">
                  <span className="text-white text-sm font-bold">Connect TON Wallet</span>
                  <span className="text-gray-500 text-[10px]">To withdraw verified assets</span>
              </div>
          </div>
          <button className="px-3 py-1.5 bg-rzc-green text-black text-xs font-bold rounded-lg hover:bg-rzc-green-dim transition-colors">
              Connect
          </button>
      </div>

      {/* History Placeholder */}
      <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm">History</h3>
              <button className="text-rzc-green text-xs">View All</button>
          </div>
          
          <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rzc-green/20 flex items-center justify-center text-rzc-green">
                              <Icons.Mining size={14} />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-white text-xs font-bold">Daily Mining Reward</span>
                              <span className="text-gray-500 text-[10px]">Today, 12:00 PM</span>
                          </div>
                      </div>
                      <span className="text-rzc-green font-mono text-sm font-bold">+240.50</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};