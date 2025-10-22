import React, { useState } from 'react';
import { Search, Compass, ImageIcon, TrendingUp, Filter } from 'lucide-react';

// Placeholder data for dApps
const dappData = [
  { id: 1, name: 'DeDust', category: 'DeFi', description: 'Decentralized exchange on TON.', icon: <TrendingUp className="w-6 h-6 text-blue-400" />, url: 'https://dedust.io/' , tags: ['Swap', 'Liquidity']},
  { id: 2, name: 'Ston.fi', category: 'DeFi', description: 'AMM DEX for the TON blockchain.', icon: <TrendingUp className="w-6 h-6 text-purple-400" />, url: 'https://ston.fi/' , tags: ['Swap', 'Farming']},
  { id: 5, name: 'TON DNS', category: 'Utility', description: 'Decentralized domain name service.', icon: <Compass className="w-6 h-6 text-orange-400" />, url: 'https://dns.ton.org/', tags: ['Domains', 'Identity'] },
  { id: 6, name: 'Getgems', category: 'NFTs', description: 'Popular NFT marketplace on TON.', icon: <ImageIcon className="w-6 h-6 text-pink-400" />, url: 'https://getgems.io/', tags: ['Marketplace', 'Art'] },
];

const categories = ['All', 'Featured', 'DeFi', 'Games', 'NFTs', 'Utility'];

const DappExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredDapps = dappData.filter(dapp => {
    const matchesCategory = selectedCategory === 'All' || dapp.category === selectedCategory || (selectedCategory === 'Featured' && [1, 3, 6].includes(dapp.id)); // Example featured IDs
    const matchesSearch = dapp.name.toLowerCase().includes(searchTerm.toLowerCase()) || dapp.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-md mx-auto p-4 font-mono text-green-400 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-green-300">dApp Explorer</h2>
        {/* Placeholder for potential filter button */}
        <button className="p-2 bg-gray-800/50 hover:bg-gray-700/60 rounded-xl border border-green-800/40 text-green-400 transition-colors">
            <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search dApps..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800/60 border border-green-800/40 rounded-lg text-green-300 placeholder-gray-500 focus:outline-none focus:border-green-600/70 focus:ring-1 focus:ring-green-500/50 text-sm"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border
              ${selectedCategory === category
                ? 'bg-green-900/70 text-green-300 border-green-700/60 shadow-neon-green-sm'
                : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-700/60 hover:text-green-400 hover:border-green-800/50'
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* dApp List */}
      <div className="space-y-3">
        {filteredDapps.length > 0 ? (
          filteredDapps.map((dapp) => (
            <a
              key={dapp.id}
              href={dapp.url}
              target="_blank" // Open in new tab/webview context
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-xl border border-green-800/40 hover:bg-gray-700/50 hover:border-green-600/60 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-700/50 border border-gray-600/50 group-hover:scale-105 transition-transform`}>
                {dapp.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-green-300 font-bold text-sm">{dapp.name}</h4>
                <p className="text-xs text-green-500/80 font-medium truncate">{dapp.description}</p>
                 {/* Tags */}
                 {dapp.tags && dapp.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {dapp.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-700/60 text-gray-300 px-1.5 py-0.5 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                 )}
              </div>
              {/* Optional: Arrow or indicator */}
              <Compass className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
            </a>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <Compass className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            No dApps found matching your criteria.
          </div>
        )}
      </div>

       {/* Footer/Disclaimer */}
       <p className="text-center text-xs text-gray-500 pt-4">
           External dApps are not affiliated with RhizaCore. Use at your own risk.
       </p>
    </div>
  );
};

export default DappExplorer;
