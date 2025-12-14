import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Address, toNano } from "@ton/core";
import {
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Zap,
  Globe,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  PlusCircle,
  Wallet,
  X,
  AlertTriangle,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { JettonBalance } from "@ton-api/client";
import { SendJettonModal } from "./SendJettonModal";
// import { JettonDetailModal } from "./JettonDetailModal"; // Commented out as per original code
import { isValidAddress } from '../utility/address';
import { formatTonValue } from "../utility/format";
import { toDecimals } from "../utility/decimals";
import ta from "../utility/tonapi";
import { getJettonRegistryData, enhanceJettonData } from "../utils/jettonRegistry";

// Error boundary component for TonWallet - Themed
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
        <div className="w-full max-w-md mx-auto p-4">
           {/* Themed Error Display */}
           <div className="bg-red-900/50 border-2 border-red-600/70 rounded-2xl shadow-neon-red-light overflow-hidden p-6 text-center">
             <div className="w-16 h-16 bg-red-800/60 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-red-500/80">
               <AlertTriangle className="w-8 h-8 text-red-300" />
             </div>
             <h2 className="text-2xl font-bold text-red-300 mb-2">Wallet Error</h2>
             <p className="text-red-400/90 mb-6 text-sm">
               {this.state.error?.message || 'An unexpected error occurred.'}
             </p>
             <button
               onClick={() => window.location.reload()}
               className="px-6 py-2 bg-blue-900/50 border-2 border-blue-600/70 text-blue-300 rounded-lg hover:bg-blue-800/60 hover:border-blue-500 transition-colors font-semibold"
             >
               Refresh Page
             </button>
           </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const TonWallet = () => {
  const { t } = useI18n();
  // State hooks remain largely the same
  const [tonBalance, setTonBalance] = useState<string>("0.00");
  const [jettons, setJettons] = useState<JettonBalance[]>([]);
  const [selectedJetton, setSelectedJetton] = useState<JettonBalance | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  // const [isJettonDetailOpen, setIsJettonDetailOpen] = useState(false); // Commented out
  const [isSendJettonModalOpen, setIsSendJettonModalOpen] = useState(false);
  const [isLoadingTON, setIsLoadingTON] = useState(true);
  const [isLoadingJettons, setIsLoadingJettons] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [tonUsdPrice, setTonUsdPrice] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'amount'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showUnverifiedSection, setShowUnverifiedSection] = useState(false);

  // Notification states
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const connectedAddressString = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const connectedAddress = useMemo(() => {
    if (!connectedAddressString) return null;
    try {
      return isValidAddress(connectedAddressString) ? Address.parse(connectedAddressString) : null;
    } catch (error) {
      console.error('Error parsing address:', error);
      return null;
    }
  }, [connectedAddressString]);

  // Fetch TON balance (logic remains the same)
  useEffect(() => {
    if (!connectedAddress) { setTonBalance("0.00"); setIsLoadingTON(false); return; }
    setIsLoadingTON(true);
    ta.accounts.getAccount(connectedAddress)
      .then((info) => setTonBalance(formatTonValue(info.balance.toString())))
      .catch((e) => { console.error("Failed to fetch TON balance:", e); setTonBalance("0.00"); })
      .finally(() => setIsLoadingTON(false));
  }, [connectedAddress]);

  // Fetch jettons (logic remains the same)
  useEffect(() => {
    if (!connectedAddress) { setJettons([]); return; }
    setIsLoadingJettons(true);
    ta.accounts.getAccountJettonsBalances(connectedAddress)
      .then(balanceInfo => setJettons(balanceInfo.balances || []))
      .catch(error => { console.error('Error loading jettons:', error); setJettons([]); })
      .finally(() => setIsLoadingJettons(false));
  }, [connectedAddress]);

  // Fetch TON -> USD price (logic remains the same)
  useEffect(() => {
    let isCancelled = false;
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        if (!res.ok) return;
        const data = await res.json();
        const price = data?.['the-open-network']?.usd ?? 0;
        if (!isCancelled) setTonUsdPrice(Number(price) || 0);
      } catch (_) { /* ignore */ }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 60_000);
    return () => { isCancelled = true; clearInterval(id); };
  }, []);

  // Calculate portfolio value (logic remains the same)
  useEffect(() => {
    const tonAmount = parseFloat(tonBalance || '0');
    let totalValue = tonAmount * tonUsdPrice;
    jettons.forEach(jetton => {
      const registryData = getJettonRegistryData(jetton.jetton.address.toString());
      if (registryData?.verified && registryData.rateUsd > 0) {
        const jettonAmount = parseFloat(toDecimals(jetton.balance, jetton.jetton.decimals));
        totalValue += jettonAmount * registryData.rateUsd;
      }
    });
    setPortfolioValue(totalValue);
  }, [tonBalance, tonUsdPrice, jettons]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Refresh (logic remains the same)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (connectedAddress) {
        const [tonInfo, jettonInfo] = await Promise.all([
          ta.accounts.getAccount(connectedAddress),
          ta.accounts.getAccountJettonsBalances(connectedAddress)
        ]);
        setTonBalance(formatTonValue(tonInfo.balance.toString()));
        setJettons(jettonInfo.balances || []);
      }
    } catch (error) { console.error('Error refreshing data:', error); }
    finally { setIsRefreshing(false); }
  };

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    let assets: Array<{
      type: 'ton' | 'jetton';
      id: string;
      name: string;
      symbol: string;
      amount: number;
      usdValue: number;
      verified: boolean;
      image?: string;
      jetton?: any;
    }> = [];

    // Add TON
    const tonAmount = parseFloat(tonBalance || '0');
    const tonUsd = tonAmount * tonUsdPrice;
    assets.push({
      type: 'ton',
      id: 'ton',
      name: 'TON',
      symbol: 'TON',
      amount: tonAmount,
      usdValue: tonUsd,
      verified: true,
    });

    // Add jettons
    jettons.forEach((jetton) => {
      const registryData = getJettonRegistryData(jetton.jetton.address.toString());
      const enhancedJetton = enhanceJettonData(jetton, registryData || undefined);
      const jettonAmount = parseFloat(toDecimals(jetton.balance, jetton.jetton.decimals));
      const usdValue = registryData?.verified && registryData.rateUsd > 0 ? jettonAmount * registryData.rateUsd : 0;

      assets.push({
        type: 'jetton',
        id: jetton.jetton.address.toString(),
        name: enhancedJetton.jetton.name || 'Unknown',
        symbol: enhancedJetton.jetton.symbol || '?',
        amount: jettonAmount,
        usdValue,
        verified: enhancedJetton.jetton.verified || false,
        image: enhancedJetton.jetton.image,
        jetton: jetton,
      });
    });

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      assets = assets.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query) ||
        asset.id.toLowerCase().includes(query)
      );
    }

    // Filter by verification status
    if (filterVerified !== 'all') {
      assets = assets.filter(asset => asset.verified === (filterVerified === 'verified'));
    }

    // Sort assets
    assets.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'value':
          aValue = a.usdValue;
          bValue = b.usdValue;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return assets;
  }, [jettons, tonBalance, tonUsdPrice, debouncedSearchQuery, filterVerified, sortBy, sortOrder]);

  // Notification helpers
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Copy Address (logic remains the same)
  const handleCopyAddress = async () => {
    if (!connectedAddressString) return;
    try {
      await navigator.clipboard.writeText(connectedAddressString);
      showNotification('success', 'Address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy address:', err);
      showNotification('error', 'Failed to copy address');
    }
  };

  // Helper formatting functions (logic remains the same)
  const formatAddress = (address: string) => address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  const formatBalance = (balance: string, hide: boolean = false) => {
    if (hide) return '••••••';
    if (balance.startsWith('$')) return balance; // Keep USD values as is
    // Improved formatting for TON/Jettons to avoid potential BigInt issues with very large/small decimals
    try {
        const num = parseFloat(balance);
        if (isNaN(num)) return '0.00';
        // Adjust precision based on magnitude
        let options: Intl.NumberFormatOptions = { maximumFractionDigits: 6 };
        if (Math.abs(num) > 1000) options.maximumFractionDigits = 2;
        if (Math.abs(num) < 0.0001 && num !== 0) options.maximumFractionDigits = 8;

        return num.toLocaleString(undefined, options);
    } catch {
        return '0.00'; // Fallback
    }
  };


  // --- UI Rendering ---

  // Connect Wallet View - Themed
  if (!connectedAddress) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        {/* Adjusted to match ArcadeMiningUI style */}
        <div className="bg-gray-900/80 border-2 border-green-700/50 rounded-2xl shadow-neon-green-light overflow-hidden backdrop-blur-md">
          <div className="p-8 text-center">
             <div className="w-20 h-20 bg-green-900/50 rounded-2xl mx-auto mb-6 flex items-center justify-center border-2 border-green-600/70 shadow-lg shadow-green-500/30">
               <Wallet className="w-10 h-10 text-green-400" />
             </div>
             <h2 className="text-3xl font-bold text-green-300 mb-2">{t('connect_wallet_title')}</h2>
             <p className="text-green-400/80 mb-8 text-base">{t('connect_wallet_desc')}</p>

             <div className="relative group inline-block">
               {/* Button Styling needs to be handled via TonConnectUI configuration or CSS overrides if possible */}
               <TonConnectButton/>
             </div>
          </div>
          {/* Feature Section - Themed */}
          <div className="p-6 bg-gray-800/50 border-t border-green-700/50">
            <h3 className="text-lg font-bold text-green-300 mb-4 text-center">{t('wallet_features')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: t('feature_secure'), desc: "Your keys" },
                { icon: Zap, title: t('feature_fast'), desc: "Quick TXNs" },
                { icon: Globe, title: t('feature_ecosystem'), desc: "TON network" },
                { icon: Star, title: t('feature_jettons'), desc: "Token support" }
              ].map((feature, index) => (
                <div key={index} className="p-4 bg-gray-900/50 rounded-xl border border-green-800/40 hover:border-green-600/60 hover:bg-gray-800/70 transition-all duration-200">
                  <feature.icon className="w-6 h-6 text-green-400 mb-2" />
                  <h4 className="text-sm font-bold text-green-300 mb-1">{feature.title}</h4>
                  <p className="text-xs text-green-400/80">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Wallet View - Updated Design
  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent"></div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-lg transition-all duration-300 ${
          notification.type === 'success'
            ? 'bg-green-900/90 border-green-600/70 text-green-300'
            : notification.type === 'error'
              ? 'bg-red-900/90 border-red-600/70 text-red-300'
              : 'bg-blue-900/90 border-blue-600/70 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <Check className="w-4 h-4" />}
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            {notification.type === 'info' && <Shield className="w-4 h-4" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-1 z-10 pb-24">

        {/* Main Card */}
        <div className="border border-green-700/30 rounded-3xl shadow-neon-green-light overflow-hidden backdrop-blur-xl bg-slate-900/60 mb-6 mx-4 mt-6">
          <div className="p-6 border-b border-green-700/20 space-y-4">
            <div className="text-center">
              <h2 className="text-sm font-semibold text-green-400/90 tracking-widest uppercase mb-1">RhizaCore Wallet</h2>
              <p className="text-green-500/50 text-[10px]">TON Blockchain</p>
            </div>

            {/* Portfolio Value Display */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-green-300 tracking-tight">
                {formatBalance(`$${portfolioValue.toFixed(2)}`, hideBalances)}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-green-500/70">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_currentColor]"></div>
                <span>Total Portfolio Value</span>
              </div>
            </div>

            {/* Address Display */}
            {connectedAddressString && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors group cursor-pointer" onClick={handleCopyAddress}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_currentColor]"></div>
                  <button className="text-xs text-green-500/80 font-mono tracking-wide">
                    {formatAddress(connectedAddressString)}
                  </button>
                  <Copy className="w-3 h-3 text-green-700 group-hover:text-green-400 transition-colors" />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHideBalances(!hideBalances)}
                    className="p-2 bg-slate-800/40 hover:bg-slate-700/60 rounded-lg border border-white/5 text-slate-400 hover:text-green-400 transition-colors"
                  >
                    {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 bg-slate-800/40 hover:bg-slate-700/60 rounded-lg border border-white/5 text-slate-400 hover:text-green-400 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-5 bg-slate-900/30">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Buy', icon: PlusCircle, action: () => window.open('#', '_blank'), color: 'blue' },
                { label: 'Send', icon: ArrowUpRight, action: () => setIsSendModalOpen(true), color: 'yellow' },
                { label: 'Receive', icon: ArrowDownLeft, action: () => setIsReceiveModalOpen(true), color: 'green' },
                { label: 'Swap', icon: ArrowLeftRight, action: () => window.open('https://dedust.io', '_blank'), color: 'purple' },
              ].map(({ label, icon: Icon, action, color }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-${color}-500/30 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer active:scale-[0.95] group`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all duration-300`}>
                    <Icon className={`w-5 h-5 text-${color}-400`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
                </button>
              ))}
            </div>
          </div>

        {/* Assets List */}
        <div className="mb-4 flex items-center justify-between px-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Assets</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-all duration-200 ${
                showFilters
                  ? 'bg-green-900/50 border-green-600/70 text-green-300'
                  : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-700/60 hover:text-green-400'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="px-6 mb-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/60" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/40 border border-white/5 rounded-lg text-green-300 placeholder-green-500/60 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/50 text-sm"
              />
            </div>

            {/* Filter Controls */}
            <div className="bg-slate-800/40 rounded-lg border border-white/5 p-3 space-y-3">
              {/* Verification Filter */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-semibold">Filter by Status</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All Assets' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'unverified', label: 'Unverified' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilterVerified(option.value as any)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                        filterVerified === option.value
                          ? 'bg-green-900/50 border border-green-600/70 text-green-300'
                          : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-600/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-semibold">Sort by</label>
                <div className="flex gap-2">
                  {[
                    { value: 'value', label: 'Value' },
                    { value: 'name', label: 'Name' },
                    { value: 'amount', label: 'Amount' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                        sortBy === option.value
                          ? 'bg-green-900/50 border border-green-600/70 text-green-300'
                          : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-600/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-semibold">Order</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded text-xs font-medium text-slate-400 hover:bg-slate-600/50 transition-all duration-200"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-xs text-green-500/80">
              <span className="transition-all duration-300">
                {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} found
              </span>
              {debouncedSearchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-green-400 hover:text-green-300 underline transition-colors duration-200"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}

        {/* Assets List */}
        <div className="px-6 pb-6 max-h-[50vh] overflow-y-auto space-y-2.5">

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/60" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/60 border border-green-800/40 rounded-lg text-green-300 placeholder-green-500/60 focus:outline-none focus:border-green-600/70 focus:ring-1 focus:ring-green-500/50 text-sm"
              />
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-gray-800/40 rounded-lg border border-green-800/40 p-3 space-y-3">
                {/* Verification Filter */}
                <div>
                  <label className="block text-xs text-green-400/80 mb-2 font-semibold">Filter by Status</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'All Assets' },
                      { value: 'verified', label: 'Verified' },
                      { value: 'unverified', label: 'Unverified' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterVerified(option.value as any)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                          filterVerified === option.value
                            ? 'bg-green-900/50 border border-green-600/70 text-green-300'
                            : 'bg-gray-700/50 border border-gray-600/50 text-gray-400 hover:bg-gray-600/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-xs text-green-400/80 mb-2 font-semibold">Sort by</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'value', label: 'Value' },
                      { value: 'name', label: 'Name' },
                      { value: 'amount', label: 'Amount' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as any)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                          sortBy === option.value
                            ? 'bg-green-900/50 border border-green-600/70 text-green-300'
                            : 'bg-gray-700/50 border border-gray-600/50 text-gray-400 hover:bg-gray-600/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs text-green-400/80 mb-2 font-semibold">Order</label>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded text-xs font-medium text-gray-400 hover:bg-gray-600/50 transition-all duration-200"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="flex items-center justify-between text-xs text-green-500/80">
              <span className="transition-all duration-300">
                {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} found
              </span>
              {debouncedSearchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-green-400 hover:text-green-300 underline transition-colors duration-200"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* Filtered Asset List */}
          <div className="space-y-2">
            {/* Verified Assets Section */}
            <div>
              <h4 className="text-sm font-bold text-green-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Verified Assets
              </h4>
            </div>

            {isLoadingTON || isLoadingJettons ? (
              /* Loading Skeletons */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-gray-800/40 rounded-xl border border-green-800/40 animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700/50 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 bg-gray-700/50 rounded"></div>
                    <div className="h-3 w-12 bg-gray-700/50 rounded"></div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-4 w-16 bg-gray-700/50 rounded"></div>
                    <div className="h-3 w-10 bg-gray-700/50 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              /* Asset Items - Only show verified assets in main list when filtering is 'all' or 'verified' */
              <>
                {(filterVerified === 'all' || filterVerified === 'verified') && (
                  <>
                    {/* TON Native */}
                    {filteredAssets.filter(asset => asset.type === 'ton').map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-2xl border border-white/5 hover:border-green-500/30 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
                            <Wallet className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-slate-200 font-bold text-sm tracking-wide">{asset.name}</h4>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">Native</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {asset.verified && asset.usdValue > 0
                                ? `$${(asset.usdValue / asset.amount).toFixed(2)}`
                                : asset.verified ? 'Verified' : 'Unverified'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-200 font-bold text-sm tracking-wide">
                            {isLoadingTON ? <span className="animate-pulse">...</span> : formatBalance(asset.amount.toString(), hideBalances)}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            ${formatBalance(asset.usdValue.toFixed(2), hideBalances)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Jetton Assets */}
                    {filteredAssets.filter(asset => asset.type === 'jetton' && asset.verified).map((asset) => (
                      <div
                        key={asset.id}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-800/40 rounded-2xl border border-white/5 hover:border-green-500/30 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 bg-slate-700/40 rounded-xl flex items-center justify-center overflow-hidden border border-gray-600/50">
                            {asset.image ? (
                              <img
                                src={asset.image}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const symbol = asset.symbol?.[0] || '?';
                                  target.src = `https://placehold.co/40x40/1f2937/4ade80?text=${symbol}`;
                                }}
                              />
                            ) : (
                              <span className="text-green-400 font-bold text-lg">{asset.symbol?.[0] || '?'}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-green-300 font-bold text-sm">{asset.name}</h4>
                              {asset.verified && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                            </div>
                            <p className="text-xs text-green-500/80 font-medium">
                              {asset.verified && asset.usdValue > 0
                                ? `$${(asset.usdValue / asset.amount).toFixed(6)}`
                                : 'Verified'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-300 font-bold text-sm">
                            {formatBalance(asset.amount.toString(), hideBalances)}
                          </div>
                          <p className="text-xs text-green-500/80 font-medium">
                            ${formatBalance(asset.usdValue.toFixed(2), hideBalances)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Unverified Assets Section */}
                {(filterVerified === 'all' || filterVerified === 'unverified') && filteredAssets.filter(asset => !asset.verified).length > 0 && (
                  <div className="border-t border-slate-700/30 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <h4 className="text-sm font-bold text-orange-300 uppercase tracking-wider">Unverified Tokens</h4>
                        <span className="text-xs text-orange-400/80 bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-500/20">
                          {filteredAssets.filter(asset => !asset.verified).length}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowUnverifiedSection(!showUnverifiedSection)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/40 border border-white/5 text-slate-400 hover:bg-slate-700/60 hover:text-orange-400 transition-colors text-xs"
                      >
                        <span>{showUnverifiedSection ? 'Hide' : 'Show'}</span>
                        <svg className={`w-3 h-3 transition-transform ${showUnverifiedSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {showUnverifiedSection && (
                      <div className="space-y-2">
                        {filteredAssets.filter(asset => !asset.verified).map((asset) => (
                          <div
                            key={asset.id}
                            className="w-full flex items-center justify-between p-3.5 bg-slate-800/20 rounded-2xl border border-red-500/20 hover:border-red-500/30 hover:bg-slate-800/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 bg-slate-700/40 rounded-xl flex items-center justify-center overflow-hidden border border-red-500/20">
                                {asset.image ? (
                                  <img
                                    src={asset.image}
                                    alt={asset.name}
                                    className="w-full h-full object-cover opacity-50"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      const symbol = asset.symbol?.[0] || '?';
                                      target.src = `https://placehold.co/40x40/1f2937/dc2626?text=${symbol}`;
                                    }}
                                  />
                                ) : (
                                  <span className="text-red-400 font-bold text-lg">{asset.symbol?.[0] || '?'}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-red-300 font-bold text-sm">{asset.name}</h4>
                                  <X className="w-3.5 h-3.5 text-red-400" />
                                </div>
                                <p className="text-xs text-red-400/80 font-medium">Unverified • High Risk</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-red-300 font-bold text-sm">
                                {formatBalance(asset.amount.toString(), hideBalances)}
                              </div>
                              <p className="text-xs text-red-400/80 font-medium">
                                {asset.usdValue > 0 ? `$${formatBalance(asset.usdValue.toFixed(2), hideBalances)}` : 'No USD Value'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State - only show if no assets at all */}
                {filteredAssets.length === 0 && (
                  <div className="text-center py-8 animate-fade-in">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-green-800/40 animate-pulse">
                      <Search className="w-8 h-8 text-green-500/60" />
                    </div>
                    <h4 className="text-green-300 font-semibold mb-2 animate-fade-in animation-delay-100">No assets found</h4>
                    <p className="text-green-500/80 text-sm animate-fade-in animation-delay-200">
                      {debouncedSearchQuery ? 'Try adjusting your search or filters' : 'No assets match your current filters'}
                    </p>
                    {(debouncedSearchQuery || filterVerified !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterVerified('all');
                        }}
                        className="mt-3 px-4 py-2 bg-green-900/50 border border-green-600/70 rounded-lg text-green-300 hover:bg-green-800/60 transition-all duration-200 text-sm hover:scale-105 active:scale-95"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals - Need Theming */}

       {/* Send TON Modal - Themed */}
       {isSendModalOpen && connectedAddress && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsSendModalOpen(false)}>
           <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border-2 border-green-700/50 shadow-neon-green-light">
             {/* Themed Header */}
             <div className="p-4 border-b border-green-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-900/50 rounded-xl flex items-center justify-center border border-yellow-700/60"><ArrowUpRight className="w-5 h-5 text-yellow-400" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-green-300">{t('send_ton')}</h2>
                        <p className="text-xs text-green-500/80">{t('available')}: {tonBalance} TON</p>
                    </div>
                </div>
               <button onClick={() => setIsSendModalOpen(false)} className="text-gray-400 hover:text-green-300 p-1.5 hover:bg-gray-700/50 rounded-lg"><X className="w-5 h-5" /></button>
             </div>
             {/* Themed Form */}
             <form onSubmit={async (e) => { /* Submit logic remains same */
                 e.preventDefault();
                 const form = e.target as HTMLFormElement;
                 const address = (form.elements.namedItem('address') as HTMLInputElement).value;
                 const amount = (form.elements.namedItem('amount') as HTMLInputElement).value;
                 try {
                    if (!isValidAddress(address)) throw new Error("Invalid recipient address");
                    if (parseFloat(amount) <= 0) throw new Error("Invalid amount");
                    const transaction = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: address, amount: toNano(amount).toString() }] };
                    await tonConnectUI.sendTransaction(transaction);
                    setIsSendModalOpen(false);
                    showNotification('success', `Successfully sent ${amount} TON`);
                 } catch (error: any) {
                   console.error('Failed to send TON:', error);
                   showNotification('error', error.message || 'Failed to send TON');
                 }
             }}>
               <div className="p-4 space-y-4">
                 <div>
                   <label className="block text-xs text-green-400/80 mb-1.5 font-semibold">{t('recipient_address')}</label>
                   <input name="address" type="text" placeholder="Enter TON address (EQ... or UQ...)" className="w-full px-3 py-2 bg-gray-800/60 border border-green-800/40 rounded-lg text-green-300 placeholder-gray-500 focus:outline-none focus:border-green-600/70 focus:ring-1 focus:ring-green-500/50 text-sm" required />
                 </div>
                 <div>
                   <label className="block text-xs text-green-400/80 mb-1.5 font-semibold">{t('amount')}</label>
                   <div className="relative">
                     <input name="amount" type="number" step="0.000000001" min="0" placeholder="0.0" className="w-full px-3 py-2 bg-gray-800/60 border border-green-800/40 rounded-lg text-green-300 placeholder-gray-500 focus:outline-none focus:border-green-600/70 focus:ring-1 focus:ring-green-500/50 text-sm pr-16" required />
                     <button type="button" onClick={() => { (document.querySelector('input[name="amount"]') as HTMLInputElement).value = tonBalance; }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-yellow-400 hover:text-yellow-300 font-bold px-2 py-1 bg-yellow-900/50 rounded-md hover:bg-yellow-800/60 transition-all border border-yellow-700/60">{t('max')}</button>
                   </div>
                 </div>
               </div>
               {/* Themed Footer/Actions */}
               <div className="p-4 border-t border-green-700/50 bg-gray-800/40">
                 <div className="flex space-x-3">
                   <button type="button" onClick={() => setIsSendModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors text-sm font-semibold">{t('cancel')}</button>
                   <button type="submit" className="flex-1 px-4 py-2 bg-yellow-900/50 border border-yellow-700/60 rounded-lg text-yellow-300 hover:bg-yellow-800/60 hover:border-yellow-600/80 transition-colors text-sm font-bold flex items-center justify-center space-x-1.5">
                     <ArrowUpRight className="w-4 h-4" /><span>{t('send_ton')}</span>
                   </button>
                 </div>
               </div>
             </form>
           </div>
         </div>
       )}


      {/* Receive Modal - Themed */}
       {isReceiveModalOpen && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsReceiveModalOpen(false)}>
           <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border-2 border-green-700/50 shadow-neon-green-light">
             {/* Themed Header */}
             <div className="p-4 border-b border-green-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-900/50 rounded-xl flex items-center justify-center border border-green-700/60"><Download className="w-5 h-5 text-green-400" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-green-300">{t('receive_ton')}</h2>
                        <p className="text-xs text-green-500/80">{t('share_address')}</p>
                    </div>
                </div>
               <button onClick={() => setIsReceiveModalOpen(false)} className="text-gray-400 hover:text-green-300 p-1.5 hover:bg-gray-700/50 rounded-lg"><X className="w-5 h-5" /></button>
             </div>
             {/* Themed Content */}
             <div className="p-6 bg-gray-800/40">
               <div className="text-center">
                 {/* QR Code */}
                 <div className="bg-white p-3 rounded-lg mb-4 inline-block border-2 border-green-700/50 shadow-md">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${connectedAddressString}&bgcolor=111827&color=4ade80&qzone=1`} alt="Wallet Address QR" className="w-40 h-40"/>
                 </div>
                 {/* Address */}
                 <div className="bg-gray-900/60 rounded-lg p-3 border border-green-800/40 mb-4">
                  <p className="text-xs text-green-400/80 mb-1.5 font-semibold">{t('your_ton_address')}</p>
                   <div className="flex items-center gap-2 bg-gray-800/70 p-2 rounded border border-gray-700/50">
                     <p className="text-green-300 font-mono text-xs break-all flex-1">{connectedAddressString}</p>
                     <button onClick={handleCopyAddress} className="p-2 bg-green-900/50 hover:bg-green-800/60 rounded border border-green-700/60 transition-colors">
                       <Copy className="w-4 h-4 text-green-400" />
                     </button>
                   </div>
                 </div>
                 <p className="text-xs text-gray-400">Share this address or QR code to receive TON and Jettons.</p>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Send Jetton Modal */}
      {selectedJetton && connectedAddress && isSendJettonModalOpen && (
        <SendJettonModal
          jetton={selectedJetton}
          senderAddress={connectedAddress}
          onClose={() => { setSelectedJetton(null); setIsSendJettonModalOpen(false); }}
          // Apply similar theming within SendJettonModal component if needed
        />
      )}

    </div>
  );
};

// Export the wrapped component
const TonWalletWithErrorBoundary = () => (
  <TonWalletErrorBoundary>
    <TonWallet />
  </TonWalletErrorBoundary>
);

export default TonWalletWithErrorBoundary;
