import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export enum ChainType {
  TON = 'ton',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana'
}

interface ChainInfo {
  id: ChainType;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  connected: boolean;
}

interface ChainSelectorProps {
  chains: ChainInfo[];
  selectedChain: ChainType;
  onChainSelect: (chain: ChainType) => void;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ chains, selectedChain, onChainSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedChainInfo = chains.find(c => c.id === selectedChain) || chains[0];

  return (
    <div className="relative">
      <button
        className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-green-800/40 hover:border-green-600/60 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedChainInfo.icon}</span>
          <div className="text-left">
            <div className="text-green-300 font-bold">{selectedChainInfo.name}</div>
            <div className="text-xs text-green-500/80">
              {selectedChainInfo.connected ? 'Connected' : 'Not Connected'}
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-green-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-green-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/90 border border-green-700/50 rounded-xl shadow-neon-green-light backdrop-blur-md z-10">
          {chains.map((chain) => (
            <button
              key={chain.id}
              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl ${
                chain.id === selectedChain ? 'bg-green-900/30 border-l-4 border-green-400' : ''
              }`}
              onClick={() => {
                onChainSelect(chain.id);
                setIsOpen(false);
              }}
            >
              <span className="text-xl">{chain.icon}</span>
              <div>
                <div className={`font-bold ${chain.id === selectedChain ? 'text-green-300' : 'text-green-400'}`}>
                  {chain.name}
                </div>
                <div className="text-xs text-green-500/80">
                  {chain.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChainSelector;
