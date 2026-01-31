import React, { useState, useMemo } from 'react';
import { useTonConnectUI, TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { toNano } from '@ton/core';
import { Icons } from '../uicomponents/Icons';
import { SnackbarData } from '../types';
import { CURRENT_TON_NETWORK } from '../constants';
import DexUI from './DexUI';

interface Pack {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  benefits: { label: string; icon: keyof typeof Icons }[];
  boostLabel: string;
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Custom';
}

const ACQUISITION_PACKS: Pack[] = [
  {
    id: 'starter',
    name: 'Micro',
    amount: 1,
    bonus: 0,
    benefits: [
      { label: 'Cloud Mining', icon: 'Energy' },
      { label: 'Airdrop Sync', icon: 'Energy' },
      { label: 'Member Role', icon: 'Rank' },
      { label: 'Fast Setup', icon: 'Check' }
    ],
    boostLabel: 'Standard Speed',
    rarity: 'Common'
  },
  {
    id: 'pro',
    name: 'Power',
    amount: 2500,
    bonus: 5,
    benefits: [
      { label: '+5% Speed', icon: 'Boost' },
      { label: 'DAO Voting', icon: 'Rank' },
      { label: 'Priority Sync', icon: 'Energy' },
      { label: 'Pro Support', icon: 'Telegram' }
    ],
    boostLabel: '1.05x Boost',
    rarity: 'Rare'
  },
  {
    id: 'genesis',
    name: 'Titan',
    amount: 10000,
    bonus: 15,
    benefits: [
      { label: '+15% Speed', icon: 'Boost' },
      { label: 'Veto Rights', icon: 'Lock' },
      { label: 'Genesis NFT', icon: 'NFT' },
      { label: 'VIP Status', icon: 'Rank' }
    ],
    boostLabel: '1.15x Max Boost',
    rarity: 'Legendary'
  },
];

interface StoreUIProps {
  tonPrice: number;
  tonAddress?: string | null;
  showSnackbar?: (data: SnackbarData) => void;
  onPurchaseComplete?: () => void;
  walletActivated?: boolean;
  onActivateWallet?: () => void;
}

// Use the main deposit address from constants
const RHIZACORE_TREASURY_ADDRESS = CURRENT_TON_NETWORK.DEPOSIT_ADDRESS;

const StoreUI: React.FC<StoreUIProps> = ({
  tonPrice,
  tonAddress,
  showSnackbar,
  onPurchaseComplete,
  walletActivated = false,
  onActivateWallet
}) => {
  const [customAmountStr, setCustomAmountStr] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeframe, setTimeframe] = useState<'ALPHA' | 'BETA' | 'LAUNCH'>('LAUNCH');
  const [activeTab, setActiveTab] = useState<'store' | 'dex'>('dex');
  
  // TON Connect hooks
  const [tonConnectUI] = useTonConnectUI();
  const connectedTonAddress = useTonAddress();
  
  // Use the directly connected address as fallback
  const currentTonAddress = tonAddress || connectedTonAddress;

  const finalAmount = useMemo(() => {
    return Math.max(0, parseFloat(customAmountStr) || 0);
  }, [customAmountStr]);

  const currentPack = useMemo(() => {
    const bonus = finalAmount >= 10000 ? 15 : finalAmount >= 2500 ? 5 : 0;
    const boostLabel = (1 + bonus / 100).toFixed(2) + 'x Speed';
    const sourceBenefits = bonus >= 15 ? ACQUISITION_PACKS[2].benefits : bonus >= 5 ? ACQUISITION_PACKS[1].benefits : ACQUISITION_PACKS[0].benefits;
    const rarity = bonus >= 15 ? 'Legendary' : bonus >= 5 ? 'Rare' : 'Custom';

    return {
      id: 'custom',
      name: 'Custom',
      amount: finalAmount,
      bonus,
      benefits: sourceBenefits,
      boostLabel,
      rarity: rarity as 'Legendary' | 'Rare' | 'Custom'
    };
  }, [finalAmount]);

  const costUsd = finalAmount * 0.10;
  const costTon = costUsd / tonPrice;
  const totalRZC = finalAmount * (1 + currentPack.bonus / 100);

  const chartPath = useMemo(() => {
    const pointsCount = 40;
    const width = 400;
    const points = [];
    const growthMult = timeframe === 'ALPHA' ? 1.4 : timeframe === 'BETA' ? 2.5 : 4.5;

    for (let i = 0; i < pointsCount; i++) {
      const x = (i / (pointsCount - 1)) * width;
      const normalizedX = i / (pointsCount - 1);
      // Curve starts at a fixed base y (100) representing $0.10
      const progress = Math.pow(normalizedX, 2); 
      const yValue = 100 - (progress * 85 * (growthMult / 4.5)); 
      const noise = (Math.random() - 0.5) * 1.5;
      points.push({ x, y: yValue + noise });
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i-1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      path += ` C ${cp1x} ${prev.y}, ${cp1x} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  }, [timeframe]);

  const projectedValue = useMemo(() => {
    if (timeframe === 'ALPHA') return 0.14;
    if (timeframe === 'BETA') return 0.25;
    return 0.45;
  }, [timeframe]);

  const handlePurchase = async () => {
    if (!walletActivated) {
      showSnackbar?.({ 
        message: 'Wallet Not Activated', 
        description: 'Please activate your RhizaCore wallet first to access the marketplace', 
        type: 'error' 
      });
      return;
    }

    if (!currentTonAddress) {
      showSnackbar?.({ 
        message: 'Wallet Not Linked', 
        description: 'Please connect your TON wallet to purchase RZC tokens', 
        type: 'error' 
      });
      return;
    }

    if (finalAmount < 1) {
      showSnackbar?.({ 
        message: 'Minimum Required', 
        description: 'Protocol allocation requires at least 1 RZC.', 
        type: 'error' 
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create TON transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // Valid for 10 minutes
        messages: [
          {
            address: RHIZACORE_TREASURY_ADDRESS, // Treasury address for RZC token sales
            amount: toNano(costTon).toString(), // Amount in nanotons
          }
        ]
      };

      showSnackbar?.({
        message: 'Protocol Transaction Initiated',
        description: `Acquiring ${totalRZC.toLocaleString()} RZC tokens for ${costTon.toFixed(4)} TON`,
        type: 'info'
      });

      // Send transaction through TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        showSnackbar?.({
          message: 'Assets Acquired',
          description: `Purchase of ${totalRZC.toLocaleString()} RZC tokens finalized.`,
          type: 'success'
        });
        
        onPurchaseComplete?.();
      }
      
    } catch (error: any) {
      console.error('Purchase transaction failed:', error);
      
      // Handle different error types
      if (error.message?.includes('insufficient')) {
        showSnackbar?.({
          message: 'Insufficient Protocol Balance',
          description: 'You don\'t have enough TON to complete this acquisition',
          type: 'error'
        });
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        showSnackbar?.({
          message: 'Transaction Cancelled',
          description: 'Protocol acquisition cancelled by user',
          type: 'info'
        });
      } else {
        showSnackbar?.({
          message: 'Acquisition Failed',
          description: 'An error occurred while processing your purchase. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const theme = currentPack.rarity === 'Legendary' ? 'yellow' : currentPack.rarity === 'Rare' ? 'green' : 'blue';

  return (
    <div className="relative flex flex-col h-full">
      
      {/* Tab Navigation */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex bg-zinc-900/60 border border-white/5 rounded-2xl p-1 shadow-inner">
          
          <button
            onClick={() => setActiveTab('dex')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'dex' 
                ? 'bg-white text-black shadow-lg' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icons.Swap size={14} />
            Neural
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'store' 
                ? 'bg-white text-black shadow-lg' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icons.Store size={14} />
            Protocol
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'dex' ? (
        <DexUI 
          tonPrice={tonPrice}
          showSnackbar={showSnackbar}
          walletActivated={walletActivated}
          onActivateWallet={onActivateWallet}
        />
      ) : (
        <>
          {/* Wallet Activation Lock Overlay */}
          {!walletActivated && (
            <div className="absolute inset-0 z-[300] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
              <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-20 h-20 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <Icons.Lock size={32} className="text-zinc-500" />
                </div>
                
                <h1 className="text-4xl font-bold tracking-tighter mb-4 text-center text-white">Protocol Store</h1>
                <p className="text-zinc-400 text-lg mb-10 text-center">Access restricted. Activate your RhizaCore wallet to unlock the marketplace.</p>
                
                <button 
                  onClick={onActivateWallet}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-3xl font-bold text-lg shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Activate Wallet
                </button>
                
                <p className="mt-8 text-xs text-zinc-600 uppercase tracking-widest font-bold text-center">Navigate to Wallet → Activate Protocol</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2 pb-32 animate-in fade-in duration-500">
        {/* 📈 COMPACT TOKEN SALE PROJECTION CHART */}
        <div className="mb-4">
          <div className="bg-[#080808] border border-white/5 rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{ 
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
                backgroundSize: '15px 15px' 
              }} 
            />
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-zinc-500 text-[7px] font-black uppercase tracking-[0.3em]">
                    Market Growth
                  </span>
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-white text-2xl font-bold font-mono tracking-tight">
                      ${projectedValue.toFixed(2)}
                    </h2>
                    <span className="text-green-500 text-[10px] font-bold font-mono">
                      +{((projectedValue/0.10 - 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-zinc-600 text-[6px] font-black uppercase tracking-widest mt-0.5">
                    Base: $0.10/RZC
                  </span>
                </div>
              </div>
              
              <div className="flex bg-black/60 rounded-lg p-0.5 border border-white/5 shadow-inner">
                {(['ALPHA', 'BETA', 'LAUNCH'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-2 py-1 rounded-md text-[6px] font-black tracking-widest transition-all ${
                      timeframe === t 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-20 w-full relative mb-3">
              {/* Start Marker */}
              <div className="absolute left-0 bottom-[12px] w-1.5 h-1.5 bg-white rounded-full border border-black z-20" />
              
              {/* Target Marker */}
              <div 
                className="absolute right-0 w-2 h-2 bg-green-500 rounded-full blur-[3px] animate-pulse z-20"
                style={{ 
                  top: timeframe === 'ALPHA' ? '65%' : timeframe === 'BETA' ? '40%' : '12%' 
                }}
              />

              <svg viewBox="0 0 400 80" className="w-full h-full overflow-visible drop-shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                <defs>
                  <linearGradient id="projFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Baseline at $0.10 */}
                <line x1="0" y1="65" x2="400" y2="65" stroke="white" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3" />
                
                <path 
                  d={chartPath.replace(/120/g, '80')} 
                  fill="none" 
                  stroke="#22c55e" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  className="animate-chart-draw" 
                />
                <path 
                  d={`${chartPath.replace(/120/g, '80')} L 400 80 L 0 80 Z`} 
                  fill="url(#projFill)" 
                />
              </svg>
            </div>

            <div className="flex justify-between text-zinc-600 text-[9px] font-black uppercase tracking-widest border-t border-white/5 pt-2 relative z-10 font-mono">
              <div className="flex flex-col">
                <span className="opacity-50">Seed</span>
                <span className="text-white">$0.10</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="opacity-50">Target</span>
                <span className="text-green-500">{(projectedValue/0.10).toFixed(1)}x</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="opacity-50">Cap</span>
                <span className="text-white">$2.5M</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Protocol Allocation */}
        <div className="mb-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-white text-black text-[7px] font-black flex items-center justify-center rounded-full">1</span>
            <h3 className="text-white text-[8px] font-black uppercase tracking-widest">Protocol Allocation</h3>
          </div>
          
          {/* Compact Wallet Status */}
          {currentTonAddress && (
            <div className="hidden mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-500 text-[7px] font-bold uppercase tracking-wider">Connected</span>
              </div>
              <p className="text-green-400 text-[8px] font-mono mt-0.5 truncate">
                {currentTonAddress.slice(0, 8)}...{currentTonAddress.slice(-6)}
              </p>
            </div>
          )}
          
          <div className="relative">
            <input
              type="number"
              value={customAmountStr}
              onChange={(e) => setCustomAmountStr(e.target.value)}
              placeholder="0.00"
              className={`w-full h-12 bg-white/[0.02] border rounded-xl px-4 text-white font-mono text-xl outline-none transition-all shadow-inner border-blue-500 ring-2 ring-blue-500/10 focus:ring-opacity-40`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">RZC</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
          </div>
          
          <p className="mt-1.5 text-[7px] text-zinc-600 font-bold uppercase tracking-wider px-1 italic">
            * Locked at $0.10 seed price
          </p>
        </div>

        {/* Compact Settlement */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-white text-black text-[7px] font-black flex items-center justify-center rounded-full">2</span>
            <h3 className="text-white text-[8px] font-black uppercase tracking-widest">Settlement</h3>
          </div>
          
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">TON Cost</span>
              <div className="text-right">
                <div className="text-white font-mono font-bold text-lg">{costTon.toFixed(3)} TON</div>
                <div className="text-zinc-600 font-mono text-[8px] font-bold">≈ ${costUsd.toFixed(2)} USD</div>
              </div>
            </div>
            
            <div className="h-px bg-white/5" />
            
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">RZC Yield</span>
              <span className={`font-mono font-bold text-lg ${
                theme === 'yellow' ? 'text-yellow-500' : theme === 'green' ? 'text-green-500' : 'text-blue-500'
              }`}>
                +{totalRZC.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Action Buttons */}
        {!walletActivated ? (
          <div className="space-y-3 mb-6">
            <button 
              onClick={onActivateWallet}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Icons.Lock size={16} strokeWidth={3} />
              Activate Required
            </button>
            <div className="flex items-center justify-center gap-1.5">
              <Icons.Lock size={8} className="text-red-500" />
              <p className="text-zinc-600 text-[7px] font-bold uppercase tracking-[0.15em] text-center">
                Wallet Activation Required
              </p>
            </div>
          </div>
        ) : !currentTonAddress ? (
          <div className="space-y-3 mb-6">
            <div className="flex justify-center items-center w-full">
              <TonConnectButton className="ton-connect-store-button-compact" />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Icons.Lock size={8} className="text-red-500" />
              <p className="text-zinc-600 text-[7px] font-bold uppercase tracking-[0.15em] text-center">
                Connect TON Wallet
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={handlePurchase}
            disabled={isProcessing || finalAmount <= 0 || !walletActivated}
            className={`group relative w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 overflow-hidden ${
              theme === 'blue' ? 'bg-blue-600 text-white' : 
              theme === 'yellow' ? 'bg-yellow-500 text-black' : 
              'bg-green-600 text-white'
            }`}
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r ${
              theme === 'blue' ? 'from-blue-400 to-blue-600' : 
              theme === 'yellow' ? 'from-yellow-300 to-yellow-500' : 
              'from-green-400 to-green-600'
            }`} />
            
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isProcessing ? (
                <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                  theme === 'yellow' ? 'border-black/20 border-t-black' : 'border-white/20 border-t-white'
                }`} />
              ) : (
                <>
                  <Icons.Store size={16} strokeWidth={3} />
                  Finalize Acquisition
                </>
              )}
            </span>
          </button>
        )}

        <div className="mt-4 text-center px-6">
          <p className="text-zinc-700 text-[6px] leading-relaxed font-black uppercase tracking-[0.15em]">
            TON signature appended to Genesis ledger as Validator Node
          </p>
        </div>
      </div>
      </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes chart-draw {
          from { stroke-dasharray: 600; stroke-dashoffset: 600; }
          to { stroke-dasharray: 600; stroke-dashoffset: 0; }
        }
        .animate-chart-draw {
          stroke-dasharray: 600;
          animation: chart-draw 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar { 
          display: none; 
        }
        .no-scrollbar { 
          -ms-overflow-style: none; 
          scrollbar-width: none;
          scroll-behavior: smooth;
        }
        .h-18 { 
          height: 4.5rem; 
        }
        
        /* Compact TON Connect Button Styling */
        .ton-connect-store-button-compact {
          --tc-bg-color: #16a34a;
          --tc-bg-color-hover: #15803d;
          --tc-text-color: #ffffff;
          --tc-border-radius: 0.75rem;
          --tc-font-size: 10px;
          --tc-font-weight: 900;
          --tc-padding: 12px 24px;
          --tc-min-height: 48px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        
        .ton-connect-store-button-compact button {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
          border: 1px solid rgba(34, 197, 94, 0.2) !important;
          color: white !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          padding: 12px 24px !important;
          border-radius: 0.75rem !important;
          min-height: 48px !important;
          transition: all 0.2s ease !important;
          white-space: nowrap !important;
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.3em !important;
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 0 auto !important;
        }
        
        .ton-connect-store-button-compact button:hover {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 15px 40px rgba(34, 197, 94, 0.4) !important;
        }

        .ton-connect-store-button-compact button:active {
          transform: scale(0.98) !important;
        }
        
        /* Original TON Connect Button Styling */
        .ton-connect-store-button {
          --tc-bg-color: #16a34a;
          --tc-bg-color-hover: #15803d;
          --tc-text-color: #ffffff;
          --tc-border-radius: 2rem;
          --tc-font-size: 10px;
          --tc-font-weight: 900;
          --tc-padding: 18px 32px;
          --tc-min-height: 72px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        
        .ton-connect-store-button button {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
          border: 1px solid rgba(34, 197, 94, 0.2) !important;
          color: white !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          padding: 18px 32px !important;
          border-radius: 2rem !important;
          min-height: 72px !important;
          transition: all 0.2s ease !important;
          white-space: nowrap !important;
          box-shadow: 0 20px 60px rgba(34, 197, 94, 0.3) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.3em !important;
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 0 auto !important;
        }
        
        .ton-connect-store-button button:hover {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 25px 70px rgba(34, 197, 94, 0.4) !important;
        }

        .ton-connect-store-button button:active {
          transform: scale(0.98) !important;
        }
      `}} />
      
      {/* Scroll fade indicator at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default StoreUI;