import React, { useState, useEffect, useMemo } from 'react';
// import { useI18n } from '@/components/I18nProvider'; // Assumes you have this
import { useGameData } from '@/contexts/GameDataContext';
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Address, toNano } from "@ton/core";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  ArrowDownLeft,
  Wallet,
  X,
  AlertTriangle,
  Search,
  CreditCard,
  Pickaxe,
  Trophy,
  History,
  Send,
  Loader2
} from 'lucide-react';
import { JettonBalance } from "@ton-api/client";
import { isValidAddress } from '../utility/address';
import { formatTonValue } from "../utility/format";
import { toDecimals } from "../utility/decimals";
import ta from "../utility/tonapi";
import { getJettonRegistryData, enhanceJettonData } from "../utils/jettonRegistry";
import { getJettonTransaction } from '@/utils/jetton-transfer';

// SendJettonModal Component
interface SendJettonModalProps {
  jetton: JettonBalance;
  senderAddress: Address;
  onClose: () => void;
}

const SendJettonModal = ({
  jetton,
  senderAddress,
  onClose,
}: SendJettonModalProps) => {
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [tonConnectUI] = useTonConnectUI();

  const handleSubmit = () => {
    try {
      const transaction = getJettonTransaction(
        jetton,
        amount,
        recipientAddress,
        senderAddress
      );

      tonConnectUI
        .sendTransaction(transaction)
        .then(() => {
          setError(null);
          onClose();
        })
        .catch((e) => setError(e.message || "Transaction failed"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 pointer-events-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Send {jetton.jetton.name}</h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="space-y-4">
          <div className="bg-black/50 p-3 rounded-xl border border-white/5">
            <label className="text-xs text-gray-500 mb-1 block">Recipient Address</label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter recipient address"
              className="w-full bg-transparent text-white text-sm outline-none font-mono"
              required
            />
          </div>
          <div className="bg-black/50 p-3 rounded-xl border border-white/5 relative">
            <label className="text-xs text-gray-500 mb-1 block">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter the amount (up to ${toDecimals(
                jetton.balance,
                jetton.jetton.decimals
              )})`}
              className="w-full bg-transparent text-white text-lg font-mono outline-none"
              required
            />
          </div>
          <button onClick={handleSubmit} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 mt-2">Confirm Send</button>
        </div>
      </div>
    </div>
  );
};

// --- Icon Mapping to match new design ---
const Icons = {
  Wallet,
  Receive: ArrowDownLeft,
  Send: Send, // Lucide Send
  Mining: Pickaxe,
  Rank: Trophy,
  Card: CreditCard,
  History: History,
  Copy: Copy,
  Refresh: RefreshCw
};

// --- Error Boundary ---
class TonWalletErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TonWallet error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md mx-auto p-6 bg-red-950/30 border border-red-500/50 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-300 mb-2">Wallet Error</h2>
          <p className="text-red-400/80 text-sm mb-4">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-900/50 rounded-lg text-red-200 text-sm">Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TonWallet = () => {
  // const { t } = useI18n();
  const { claimedRZC, miningBalance } = useGameData();
  const [tonBalance, setTonBalance] = useState<string>("0.00");
  const [jettons, setJettons] = useState<JettonBalance[]>([]);
  const [selectedJetton, setSelectedJetton] = useState<JettonBalance | null>(null);
   
  // Modals
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isSendJettonModalOpen, setIsSendJettonModalOpen] = useState(false);
   
  // Loading & State
  const [isLoadingTON, setIsLoadingTON] = useState(true);
  // const [isLoadingJettons, setIsLoadingJettons] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  // const [verifiedValue, setVerifiedValue] = useState<number>(0);
  // const [unverifiedValue, setUnverifiedValue] = useState<number>(0);
  const [tonUsdPrice, setTonUsdPrice] = useState<number>(0.1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
   
  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const connectedAddressString = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const connectedAddress = useMemo(() => {
    if (!connectedAddressString) return null;
    try {
      return isValidAddress(connectedAddressString) ? Address.parse(connectedAddressString) : null;
    } catch { return null; }
  }, [connectedAddressString]);

  // --- Data Fetching ---

  useEffect(() => {
    if (!connectedAddress) { setTonBalance("0.00"); setIsLoadingTON(false); return; }
    setIsLoadingTON(true);
    ta.accounts.getAccount(connectedAddress)
      .then((info) => setTonBalance(formatTonValue(info.balance.toString())))
      .catch((e) => { console.error(e); setTonBalance("0.00"); })
      .finally(() => setIsLoadingTON(false));
  }, [connectedAddress]);

  useEffect(() => {
    if (!connectedAddress) { setJettons([]); return; }
    // setIsLoadingJettons(true);
    ta.accounts.getAccountJettonsBalances(connectedAddress)
      .then(balanceInfo => setJettons(balanceInfo.balances || []))
      .catch(console.error)
      // .finally(() => setIsLoadingJettons(false));
  }, [connectedAddress]);

  useEffect(() => {
    // Set the pegged price for TON and RZC
    setTonUsdPrice(0.1);
  }, []);

  // --- Calculations ---

  useEffect(() => {
    const tonAmount = parseFloat(tonBalance || '0');
    let total = tonAmount * tonUsdPrice;
    let verified = total; // Start with TON as verified
    let unverified = 0;

    jettons.forEach(jetton => {
      const registryData = getJettonRegistryData(jetton.jetton.address.toString());
      const amount = parseFloat(toDecimals(jetton.balance, jetton.jetton.decimals));
      
      // Calculate Value if price exists
      if (registryData?.rateUsd) {
        const val = amount * registryData.rateUsd;
        total += val;
        if (registryData.verified) verified += val;
        else unverified += val; // Has price but not verified
      } else {
        // No price data, treat as unverified/mining asset
         unverified += 0; 
      }
    });

    setPortfolioValue(total);
    // setVerifiedValue(verified);
    // setUnverifiedValue(unverified);
  }, [tonBalance, tonUsdPrice, jettons]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Handlers ---

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (connectedAddress) {
      await Promise.all([
        ta.accounts.getAccount(connectedAddress).then(i => setTonBalance(formatTonValue(i.balance.toString()))),
        ta.accounts.getAccountJettonsBalances(connectedAddress).then(i => setJettons(i.balances || []))
      ]);
    }
    setIsRefreshing(false);
  };

  const handleCopyAddress = async () => {
    if (!connectedAddressString) return;
    await navigator.clipboard.writeText(connectedAddressString);
    setNotification({ type: 'success', message: 'Address copied!' });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDisplayBalance = (bal: string | number) => {
    if (hideBalances) return '••••';
    if (typeof bal === 'number') return bal.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return bal;
  };

  const filteredAssets = useMemo(() => {
    let assets = [] as Array<{
      id: string;
      type: string;
      name: string;
      symbol: string;
      amount: number;
      usd: number;
      verified: boolean;
      image: string;
      raw?: JettonBalance;
    }>;
    
    // Add TON
    const tonAmt = parseFloat(tonBalance || '0');
    assets.push({
      id: 'ton', type: 'ton', name: 'TON', symbol: 'TON', amount: tonAmt,
      usd: tonAmt * tonUsdPrice, verified: true, image: 'https://ton.org/download/ton_symbol.png'
    });

    // Add RZC with pegged price
    assets.push({
      id: 'rzc', type: 'rzc', name: 'RhizaCore', symbol: 'RZC', amount: claimedRZC,
      usd: claimedRZC * 0.1, verified: true, image: 'https://rhizacore.xyz/logo.png'
    });

    // Add Jettons
    jettons.forEach(j => {
      const reg = getJettonRegistryData(j.jetton.address.toString());
      const enhanced = enhanceJettonData(j, reg || undefined);
      const amt = parseFloat(toDecimals(j.balance, j.jetton.decimals));
      assets.push({
        id: j.jetton.address.toString(),
        type: 'jetton',
        name: enhanced.jetton.name,
        symbol: enhanced.jetton.symbol,
        amount: amt,
        usd: (reg?.rateUsd || 0) * amt,
        verified: enhanced.jetton.verified || false,
        image: enhanced.jetton.image,
        raw: j
      });
    });

    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      assets = assets.filter(a => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    }

    // Sort: High value first
    return assets.sort((a, b) => b.usd - a.usd);
  }, [jettons, tonBalance, tonUsdPrice, debouncedSearchQuery]);

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto scrollbar relative min-h-screen">
      
      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-900/90 border border-green-500/50 rounded-full text-green-200 text-sm backdrop-blur-md flex items-center gap-2 shadow-lg animate-fade-in-down">
          <Check size={14} /> {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white tracking-wider">Wallet</h1>
        <div className="flex gap-2">
            <button onClick={() => setHideBalances(!hideBalances)} className="p-2 bg-zinc-900 rounded-lg text-gray-400 hover:text-white transition-colors">
                {hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button onClick={handleRefresh} className={`p-2 bg-zinc-900 rounded-lg text-gray-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}>
                <Icons.Refresh size={18} />
            </button>
        </div>
      </div>

      

      {/* Main Card */}
      <div className="w-full bg-gradient-to-br from-zinc-900 to-[#050a05] border border-green-500/20 rounded-3xl p-6 relative shadow-lg mb-6 group">
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full -mr-12 -mt-12 blur-3xl group-hover:bg-green-500/15 transition-colors duration-500"></div>
        
        <div className="relative z-10">
          {/* <div className="flex justify-between items-start mb-2">
            <span className="text-gray-400 text-xs font-mono uppercase tracking-widest">Total Balance</span>
            <div className="bg-green-500/10 p-2 rounded-xl text-green-400 border border-green-500/20">
              <Icons.Wallet size={18} />
            </div>
          </div> */}
          
          <div className="text-4xl font-bold text-white font-mono mb-1 tracking-tighter">
          {claimedRZC.toFixed(2)} <span className="text-sm text-rzc-green">RZC</span>
          </div>
          <div className="text-gray-500 text-xs font-mono">
            ≈ ${(claimedRZC * 0.1).toFixed(2)}
          </div>
          {/* <div className="text-gray-500 text-xs font-mono">
            ≈  ${formatDisplayBalance(portfolioValue)}
          </div> */}


          {connectedAddressString && (
             <div onClick={handleCopyAddress} className="flex items-center gap-2 cursor-pointer group/addr w-fit">
                <span className="text-gray-500 text-xs font-mono group-hover/addr:text-green-400 transition-colors">
                    {connectedAddressString.slice(0, 4)}...{connectedAddressString.slice(-4)}
                </span>
                <Icons.Copy size={10} className="text-gray-600 group-hover/addr:text-green-400" />
             </div>
          )}
          
          {/* Game Data Section */}
        
          {/* <div className="flex gap-3 mt-8">
            <button 
                onClick={() => setIsReceiveModalOpen(true)}
                disabled={!connectedAddress}
                className="flex-1 bg-white text-black py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.Receive size={16} />
              Deposit
            </button>
            <button 
                onClick={() => setIsSendModalOpen(true)}
                disabled={!connectedAddress}
                className="flex-1 bg-white/5 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.Send size={16} />
              Send
            </button>
          </div> */}
        </div>
      </div>

      {/* Breakdown Grid */}
      {/* <div className="grid grid-cols-2 gap-3 mb-6">
         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:border-green-500/20 transition-colors">
             <div className="flex items-center gap-2 mb-2 text-purple-400">
                 <Icons.Rank size={14} />
                 <span className="text-xs font-bold">Verified</span>
             </div>
             <div className="text-white font-mono font-bold text-lg">${formatDisplayBalance(verifiedValue)}</div>
             <div className="text-[10px] text-gray-500 mt-1">On-chain Assets</div>
         </div>
         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:border-green-500/20 transition-colors">
             <div className="flex items-center gap-2 mb-2 text-gray-400">
                 <Icons.Mining size={14} />
                 <span className="text-xs font-bold">Unverified</span>
             </div>
             <div className="text-white font-mono font-bold text-lg">${formatDisplayBalance(unverifiedValue)}</div>
             <div className="text-[10px] text-gray-500 mt-1">High Risk / Mining</div>
         </div>
      </div> */}

      <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1 text-purple-400">
                <Icons.Rank size={14} />
                <span className="text-xs font-bold">Claimable RZC</span>
              </div>
              <div className="text-white font-mono font-bold text-lg">{claimedRZC.toFixed(4)}</div>
              <div className="text-[10px] text-gray-500 mt-1">Validated Balance</div>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1 text-gray-400">
                <Icons.Mining size={14} />
                <span className="text-xs font-bold">Locked Balance</span>
              </div>
              <div className="text-white font-mono font-bold text-lg">{miningBalance.toFixed(4)}</div>
              <div className="text-[10px] text-gray-500 mt-1">Accumulated RZC</div>
            </div>
          </div>


      {/* Connect Wallet Prompt */}
      {!connectedAddress && (
          <div className="bg-green-500/5 border border-dashed border-green-500/30 rounded-2xl p-4 flex items-center justify-between mb-8 animate-pulse">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <Icons.Card size={20} />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-white text-sm font-bold">Connect TON Wallet</span>
                      <span className="text-gray-500 text-[10px]">To withdraw assets</span>
                  </div>
              </div>
              <div className="relative">
                 {/* TonConnectButton wrapper to style it or just place it here */}
                 <TonConnectButton className="custom-ton-connect" />
              </div>
          </div>
      )}

      {/* Assets List */}
      <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm">Assets & History</h3>
              <div className="relative w-32">
                  <Search className="absolute left-2 top-1.5 text-gray-500 w-3 h-3" />
                  <input 
                    type="text" 
                    placeholder="Search" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 pl-7 pr-2 text-xs text-white focus:outline-none focus:border-green-500/50"
                  />
              </div>
          </div>
          
          <div className="space-y-3 pb-6">
              {isLoadingTON ? (
                  <div className="flex justify-center py-4"><Loader2 className="animate-spin text-green-400" /></div>
              ) : filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex justify-between items-center p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800 hover:border-white/10 transition-colors group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border border-white/10">
                                  {asset.image ? (
                                      <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover" />
                                  ) : (
                                      <span className="text-xs font-bold text-white">{asset.symbol?.[0]}</span>
                                  )}
                              </div>
                              <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                      <span className="text-white text-sm font-bold">{asset.name}</span>
                                      {asset.verified && <Shield size={10} className="text-blue-400" />}
                                  </div>
                                  <span className="text-gray-500 text-[10px] font-mono">
                                      {formatDisplayBalance(asset.amount)} {asset.symbol}
                                  </span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="text-right">
                                  <div className="text-white font-mono text-sm font-bold">
                                      ${formatDisplayBalance(asset.usd)}
                                  </div>
                                  <div className="text-[10px] text-green-400 group-hover:translate-x-1 transition-transform">
                                      {asset.id === 'ton' ? 'Native' : 'Jetton'}
                                  </div>
                              </div>
                              {asset.type !== 'ton' && asset.raw && (
                                  <button
                                      onClick={() => {
                                          setSelectedJetton(asset.raw || null);
                                          setIsSendJettonModalOpen(true);
                                      }}
                                      className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
                                  >
                                      <Icons.Send size={16} />
                                  </button>
                              )}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="text-center text-gray-500 text-xs py-4">No assets found</div>
              )}
          </div>
      </div>
      
      {/* Send TON Modal */}
      {isSendModalOpen && connectedAddress && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={() => setIsSendModalOpen(false)} />
             <div className="relative w-full max-w-md bg-zinc-900 border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 pointer-events-auto animate-slide-up">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-lg font-bold text-white">Send TON</h2>
                     <button onClick={() => setIsSendModalOpen(false)}><X className="text-gray-400" /></button>
                 </div>
                 {/* Reusing logic from original, stripping old styling */}
                 <form onSubmit={async (e) => {
                     e.preventDefault();
                     const form = e.target as HTMLFormElement;
                     const addr = (form.elements.namedItem('address') as HTMLInputElement).value;
                     const amt = (form.elements.namedItem('amount') as HTMLInputElement).value;
                     try {
                         if (!isValidAddress(addr)) throw new Error("Invalid address");
                         const transaction = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: addr, amount: toNano(amt).toString() }] };
                         await tonConnectUI.sendTransaction(transaction);
                         setIsSendModalOpen(false);
                         setNotification({ type: 'success', message: 'Transaction Sent' });
                     } catch(err: any) { setNotification({ type: 'error', message: err.message }); }
                 }}>
                     <div className="space-y-4">
                         <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                            <label className="text-xs text-gray-500 mb-1 block">Recipient</label>
                            <input name="address" placeholder="EQ..." className="w-full bg-transparent text-white text-sm outline-none font-mono" required />
                         </div>
                         <div className="bg-black/50 p-3 rounded-xl border border-white/5 relative">
                            <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                            <input name="amount" type="number" step="0.000000001" placeholder="0.00" className="w-full bg-transparent text-white text-lg font-mono outline-none" required />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                Available: {tonBalance}
                            </div>
                         </div>
                         <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 mt-2">Confirm Send</button>
                     </div>
                 </form>
             </div>
        </div>
      )}

      {/* Receive Modal */}
      {isReceiveModalOpen && connectedAddressString && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsReceiveModalOpen(false)} />
             <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center animate-scale-in">
                 <h2 className="text-xl font-bold text-white mb-2">Receive Assets</h2>
                 <p className="text-gray-500 text-xs mb-6">Scan to deposit TON or Jettons</p>
                 
                 <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${connectedAddressString}`} alt="QR" className="w-48 h-48 mix-blend-multiply" />
                 </div>

                 <div onClick={handleCopyAddress} className="bg-black/50 border border-white/10 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-green-500/30 transition-colors">
                     <span className="text-gray-300 font-mono text-xs truncate mr-2">{connectedAddressString}</span>
                     <Icons.Copy size={14} className="text-green-400 shrink-0" />
                 </div>
             </div>
         </div>
      )}

      {/* Jetton Send Modal Wrapper */}
      {selectedJetton && isSendJettonModalOpen && (
          <div className="fixed inset-0 z-[100]">
             {/* Render the actual SendJettonModal here, ensuring it has similar styling */}
             <SendJettonModal 
                jetton={selectedJetton} 
                senderAddress={connectedAddress!} 
                onClose={() => setIsSendJettonModalOpen(false)} 
             />
          </div>
      )}

      {/* Styles for scrollbar hiding */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const TonWalletWithErrorBoundary = () => (
  <TonWalletErrorBoundary>
    <TonWallet />
  </TonWalletErrorBoundary>
);

export default TonWalletWithErrorBoundary;