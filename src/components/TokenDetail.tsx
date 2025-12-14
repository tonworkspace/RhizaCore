import React from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Copy, Check } from 'lucide-react';
import { Token } from '../types';

interface TokenDetailProps {
  token: Token;
  onBack: () => void;
}

const TokenDetail: React.FC<TokenDetailProps> = ({ token, onBack }) => {
  const usdValue = token.balance * token.price;
  const isPositiveChange = token.change24h >= 0;

  const handleCopyAddress = async () => {
    // Mock contract address - in real app this would come from token data
    const mockContractAddress = `EQ${Math.random().toString(36).substr(2, 9)}`;
    try {
      await navigator.clipboard.writeText(mockContractAddress);
      // Could add copy success state here
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
              {token.icon ? (
                <img
                  src={token.icon}
                  alt={token.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400 font-bold">
                  {token.symbol[0]}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{token.name}</h1>
              <p className="text-sm text-slate-400">{token.symbol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Balance Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-400">Balance</p>
            <div className="text-3xl font-bold text-white">
              {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token.symbol}
            </div>
            <div className="text-lg text-slate-300">
              ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Price Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Current Price</p>
              <p className="text-lg font-semibold text-white">${token.price.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">24h Change</p>
              <div className={`flex items-center gap-1 ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {isPositiveChange ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">{isPositiveChange ? '+' : ''}{token.change24h.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Token Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Token Information</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Network</span>
              <span className="text-white font-medium">{token.chain}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  token.verified
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {token.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors">
            Send {token.symbol}
          </button>
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors">
            Swap {token.symbol}
          </button>
          <button
            onClick={handleCopyAddress}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Contract Address
          </button>
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenDetail;
