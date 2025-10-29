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
  AlertTriangle // Import AlertTriangle for error
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [tonUsdPrice, setTonUsdPrice] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Handle Copy Address (logic remains the same)
  const handleCopyAddress = async () => {
    if (!connectedAddressString) return;
    try {
      await navigator.clipboard.writeText(connectedAddressString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) { console.error('Failed to copy address:', err); }
  };

  // Helper formatting functions (logic remains the same)
  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
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
               <TonConnectButton className="relative !min-h-[52px] !px-8 !py-3 !bg-green-600 !text-white !rounded-xl hover:!bg-green-700 transition-colors" />
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

  // Main Wallet View - Themed
  return (
    <div className="w-full max-w-md mx-auto p-2 font-mono"> {/* Added font-mono */}
       {/* Use themed container */}
      <div className="bg-gray-900/80 border-2 border-green-700/50 rounded-2xl shadow-neon-green-light overflow-hidden backdrop-blur-md">
         {/* Top Section: Balance & Address */}
        <div className="p-6 border-b border-green-700/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-medium text-green-400/80">{t('rhiza_mini_wallet')}</h2>
               {/* Themed Balance Display */}
              <div className="mt-2 text-5xl font-bold text-green-300 tracking-tight">
                {formatBalance(`$${portfolioValue.toFixed(2)}`, hideBalances)}
              </div>
               {/* Themed Address Display */}
              <p className="mt-1 text-sm text-green-500/80">{formatAddress(connectedAddressString)}</p>
            </div>
            {/* Control Buttons - Themed */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2.5 bg-gray-800/50 hover:bg-gray-700/60 rounded-xl transition-colors border border-green-800/40 text-green-400"
                title={hideBalances ? 'Show balances' : 'Hide balances'}
              >
                {hideBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-gray-800/50 hover:bg-gray-700/60 rounded-xl transition-colors border border-green-800/40 text-green-400 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Row - Themed */}
        <div className="px-4 py-4 border-b border-green-700/50">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Buy', icon: PlusCircle, action: () => window.open('#', '_blank'), color: 'blue' },
              { label: 'Send', icon: ArrowUpRight, action: () => setIsSendModalOpen(true), color: 'yellow' },
              { label: 'Receive', icon: ArrowDownLeft, action: () => setIsReceiveModalOpen(true), color: 'green' },
              { label: 'Swap', icon: ArrowLeftRight, action: () => window.open('https://dedust.io', '_blank'), color: 'purple' },
            ].map(({ label, icon: Icon, action, color }) => (
              <button
                key={label}
                onClick={action}
                 // Themed Action Buttons
                 className={`flex flex-col items-center gap-1.5 py-3 rounded-xl bg-${color}-900/50 border border-${color}-700/60 text-${color}-300 hover:bg-${color}-800/70 hover:border-${color}-500/80 transition-all duration-200 hover:shadow-neon-${color}-sm`}
               >
                 <div className={`w-8 h-8 rounded-lg bg-${color}-800/40 flex items-center justify-center`}>
                   <Icon className={`w-4 h-4 text-${color}-300`} />
                 </div>
                 <span className="text-[10px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Assets List - Themed */}
        <div className="px-4 py-4 max-h-[40vh] overflow-y-auto"> {/* Added max-height and overflow */}
          <h3 className="text-sm font-bold text-green-300 mb-3 uppercase tracking-wider px-2">{t('assets')}</h3>
          <div className="space-y-2">
            {/* TON Balance Item - Themed */}
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-green-800/40 hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                 {/* Themed Icon Container */}
                <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center border border-blue-700/60">
                  {/* Using Wallet icon for TON */}
                  <Wallet className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-green-300 font-bold text-sm">TON</h4>
                  <p className="text-xs text-green-500/80 font-medium">${(tonUsdPrice || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-300 font-bold text-sm">
                  {isLoadingTON ? '...' : formatBalance(tonBalance, hideBalances)}
                </div>
                <p className="text-xs text-green-500/80 font-medium">${formatBalance((parseFloat(tonBalance || '0') * (tonUsdPrice || 0)).toFixed(2), hideBalances)}</p>
              </div>
            </div>

            {/* Jetton List - Themed */}
            {isLoadingJettons ? (
              <div className="space-y-2">
                 {/* Themed Loading Skeleton */}
                {[1, 2].map((i) => (
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
                ))}
              </div>
            ) : (
              jettons.map((jetton) => {
                const registryData = getJettonRegistryData(jetton.jetton.address.toString());
                const enhancedJetton = enhanceJettonData(jetton, registryData || undefined);
                const jettonAmount = parseFloat(toDecimals(jetton.balance, jetton.jetton.decimals));
                const usdValue = registryData?.verified && registryData.rateUsd > 0 ? jettonAmount * registryData.rateUsd : 0;

                return (
                  // Themed Jetton Item
                  <button
                    key={jetton.jetton.address.toString()}
                    // onClick={() => handleJettonClick(jetton)} // Uncomment if detail view is needed
                    className="w-full flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-green-800/40 hover:bg-gray-700/50 transition-colors duration-200 text-left group"
                  >
                    <div className="flex items-center gap-3">
                       {/* Themed Icon Container */}
                      <div className="w-10 h-10 bg-gray-700/40 rounded-xl flex items-center justify-center overflow-hidden border border-gray-600/50">
                        {enhancedJetton.jetton.image ? (
                          <img
                            src={enhancedJetton.jetton.image} alt={enhancedJetton.jetton.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/1f2937/4ade80?text=${enhancedJetton.jetton.symbol?.[0] || '?'}` }} // Themed Placeholder
                          />
                        ) : (
                          <span className="text-green-400 font-bold text-lg">{enhancedJetton.jetton.symbol?.[0] || '?'}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-green-300 font-bold text-sm">{enhancedJetton.jetton.name}</h4>
                          {enhancedJetton.jetton.verified && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="text-xs text-green-500/80 font-medium">
                          {enhancedJetton.jetton.verified ? `$${(registryData?.rateUsd || 0).toFixed(6)}` : 'Unverified'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-300 font-bold text-sm">
                        {formatBalance(toDecimals(jetton.balance, jetton.jetton.decimals), hideBalances)}
                      </div>
                      <p className="text-xs text-green-500/80 font-medium">${formatBalance(usdValue.toFixed(2), hideBalances)}</p>
                    </div>
                  </button>
                );
              })
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
                    // Optionally show success snackbar here
                 } catch (error: any) { console.error('Failed to send TON:', error); /* Show error snackbar */ }
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
                       {copySuccess ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-green-400" />}
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
