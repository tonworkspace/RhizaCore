import React, { useState, useEffect, useMemo } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { Address, toNano } from "@ton/core";
import { JettonBalance } from "@ton-api/client";



import {

  Wallet,

  Copy,

  Check,

  Eye,

  EyeOff,

  RefreshCw,

  Shield,

  ArrowUpRight,

  ArrowDownLeft,

  ArrowLeftRight,

  PlusCircle,

  AlertTriangle,

  X

} from 'lucide-react';
import { isValidAddress } from '../utility/address';
import { toDecimals } from "../utility/decimals";
import ta from "../utility/tonapi";
import { getJettonRegistryData, enhanceJettonData } from "../utils/jettonRegistry";

import PortfolioSummary from './PortfolioSummary';
import WalletActions from './WalletActions';
import ReceiveModal from './ReceiveModal';
import TokenDetail from './TokenDetail';
import BottomNav from './BottomNav';
import { Token, TabView } from '../types';

interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  connected: boolean;
  balance: string;
  usdValue: number;
  address?: string;
}

// Mock Utilities

const formatTonValue = (val: string | number) => (Number(val) / 1e9).toFixed(2);

// Error boundary component

class WalletErrorBoundary extends React.Component<

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

    console.error('Wallet error:', error, errorInfo);

  }

  render() {

    if (this.state.hasError) {

      return (

        <div className="w-full max-w-md mx-auto p-4 flex items-center justify-center min-h-screen">

          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl shadow-neon-red-light overflow-hidden p-6 text-center backdrop-blur-xl">

            <div className="w-16 h-16 bg-red-800/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-red-500/50">

              <AlertTriangle className="w-8 h-8 text-red-400" />

            </div>

            <h2 className="text-xl font-bold text-red-300 mb-2">Wallet Error</h2>

            <p className="text-red-400/80 mb-6 text-sm">

              {this.state.error?.message || 'An unexpected error occurred.'}

            </p>

            <button

              onClick={() => window.location.reload()}

              className="px-6 py-2 bg-red-500/10 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/20 transition-colors font-semibold"

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

const WalletUI: React.FC = () => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>('wallet');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Real Wallet State
  const [tonBalance, setTonBalance] = useState<string>("0.00");
  const [jettons, setJettons] = useState<JettonBalance[]>([]);
  const [isLoadingTON, setIsLoadingTON] = useState(true);
  const [isLoadingJettons, setIsLoadingJettons] = useState(false);
  const [tonUsdPrice, setTonUsdPrice] = useState<number>(0);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);

  // TON Connect
  const connectedTonAddressString = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const connectedTonAddress = useMemo(() => {
    if (!connectedTonAddressString) return null;
    try {
      return isValidAddress(connectedTonAddressString) ? Address.parse(connectedTonAddressString) : null;
    } catch (error) {
      console.error('Error parsing address:', error);
      return null;
    }
  }, [connectedTonAddressString]);

  // Fetch TON balance
  useEffect(() => {
    if (!connectedTonAddress) {
      setTonBalance("0.00");
      setIsLoadingTON(false);
      return;
    }
    setIsLoadingTON(true);
    ta.accounts.getAccount(connectedTonAddress)
      .then((info) => setTonBalance(formatTonValue(info.balance.toString())))
      .catch((e) => { console.error("Failed to fetch TON balance:", e); setTonBalance("0.00"); })
      .finally(() => setIsLoadingTON(false));
  }, [connectedTonAddress]);

  // Fetch jettons
  useEffect(() => {
    if (!connectedTonAddress) {
      setJettons([]);
      return;
    }
    setIsLoadingJettons(true);
    ta.accounts.getAccountJettonsBalances(connectedTonAddress)
      .then(balanceInfo => setJettons(balanceInfo.balances || []))
      .catch(error => { console.error('Error loading jettons:', error); setJettons([]); })
      .finally(() => setIsLoadingJettons(false));
  }, [connectedTonAddress]);

  // Fetch TON -> USD price
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

  // Calculate portfolio value
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

  const selectedChainInfo: ChainInfo = {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    icon: '💎',
    color: 'blue',
    connected: !!connectedTonAddress,
    balance: formatTonValue(tonBalance),
    usdValue: portfolioValue,
    address: connectedTonAddressString
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (connectedTonAddress) {
        const [tonInfo, jettonInfo] = await Promise.all([
          ta.accounts.getAccount(connectedTonAddress),
          ta.accounts.getAccountJettonsBalances(connectedTonAddress)
        ]);
        setTonBalance(formatTonValue(tonInfo.balance.toString()));
        setJettons(jettonInfo.balances || []);
      }
    } catch (error) { console.error('Error refreshing data:', error); }
    finally { setIsRefreshing(false); }
  };

  const handleCopyAddress = async () => {

    const address = selectedChainInfo.address;

    if (!address) return;

    try {

      await navigator.clipboard.writeText(address);

      setCopySuccess(true);

      setTimeout(() => setCopySuccess(false), 2000);

    } catch (err) { console.error('Failed to copy address:', err); }

  };

  const formatAddress = (address: string) => address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';

  const formatBalance = (balance: string | number, hide: boolean = false) => {

    if (hide) return '••••••';

    return typeof balance === 'number' ? balance.toLocaleString(undefined, { maximumFractionDigits: 4 }) : balance;

  };

  const handleSend = () => setIsSendModalOpen(true);

  const handleReceive = () => setShowReceiveModal(true);

  const handleSwap = () => window.open('https://dedust.io', '_blank');

  const handleBuy = () => window.open('https://wallet.ton.org', '_blank');

  // Connect Wallet View
  if (!connectedTonAddress) {
    return (
      <div className="w-full max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="rounded-2xl shadow-neon-green-light overflow-hidden backdrop-blur-md">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-900/50 rounded-2xl mx-auto mb-6 flex items-center justify-center border-2 border-green-600/70 shadow-lg shadow-green-500/30">
              <Wallet className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-green-300 mb-2">Connect Your Wallet</h2>
            <p className="text-green-400/80 mb-8 text-base">Connect your TON wallet to start managing your RhizaCore assets</p>

            <div className="relative group inline-block">
              {/* TON Connect Button */}
              <TonConnectButton />
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Secure", desc: "Non-custodial" },
                { icon: PlusCircle, title: "Native", desc: "RhizaCore tokens" },
                { icon: ArrowUpRight, title: "Send", desc: "Transfer assets" },
                { icon: ArrowDownLeft, title: "Receive", desc: "Accept payments" }
              ].map((feature, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-xl border border-green-800/40 hover:border-green-600/60 transition-all duration-200">
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

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden">

      {/* Background Ambience */}


      {/* Header */}
      <div className="flex-1 z-10 pb-24">

        {/* Main Card */}

        <div className="border border-green-700/30 rounded-3xl shadow-neon-green-light overflow-hidden backdrop-blur-xl bg-slate-900/60 mb-6">

          <div className="p-6 border-b border-green-700/20 space-y-4">

            <div className="text-center">

              <h2 className="text-sm font-semibold text-green-400/90 tracking-widest uppercase mb-1">RhizaCore Native</h2>

              <p className="text-green-500/50 text-[10px]">Decentralized Gateway</p>

            </div>

            <PortfolioSummary

              totalValue={portfolioValue}

              hideBalances={hideBalances}

            />

            {selectedChainInfo.address && (

              <div className="flex items-center justify-between mt-2">

                <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors group cursor-pointer" onClick={handleCopyAddress}>

                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_currentColor]"></div>

                  <button className="text-xs text-green-500/80 font-mono tracking-wide">

                    {formatAddress(selectedChainInfo.address)}

                  </button>

                  {copySuccess ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-green-700 group-hover:text-green-400 transition-colors" />}

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

            <WalletActions actions={[

              { label: 'Buy', icon: PlusCircle, action: handleBuy, color: 'blue' },

              { label: 'Send', icon: ArrowUpRight, action: handleSend, color: 'yellow' },

              { label: 'Receive', icon: ArrowDownLeft, action: handleReceive, color: 'green' },

              { label: 'Swap', icon: ArrowLeftRight, action: handleSwap, color: 'purple' },

            ]} />

          </div>

        </div>

        {/* Assets List */}

        <div className="mb-2 flex items-center justify-between px-2">

             <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Assets</h3>

             <span className="text-xs text-slate-500">View All</span>

        </div>



        <div className="space-y-2.5">

          {/* TON Native */}

          <div className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-2xl border border-white/5 hover:border-green-500/30 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer active:scale-[0.99]">

            <div className="flex items-center gap-3.5">

              <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]">

                <Wallet className="w-6 h-6 text-blue-400" />

              </div>

              <div>

                <div className="flex items-center gap-1.5">

                   <h4 className="text-slate-200 font-bold text-sm tracking-wide">TON</h4>

                   <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">Native</span>

                </div>

                <p className="text-xs text-slate-500 font-medium mt-0.5">${tonUsdPrice.toFixed(2)}</p>

              </div>

            </div>

            <div className="text-right">

              <div className="text-slate-200 font-bold text-sm tracking-wide">

                {isLoadingTON ? <span className="animate-pulse">...</span> : formatBalance(formatTonValue(tonBalance), hideBalances)}

              </div>

              <p className="text-xs text-slate-500 font-medium mt-0.5">

                ${formatBalance((parseFloat(formatTonValue(tonBalance)) * tonUsdPrice).toFixed(2), hideBalances)}

              </p>

            </div>

          </div>

          {/* Jettons List */}

          {isLoadingJettons ? (

            <div className="space-y-2">

              {[1, 2, 3].map((i) => (

                <div key={i} className="p-3.5 bg-slate-800/20 rounded-2xl border border-white/5 animate-pulse flex items-center gap-3">

                  <div className="w-11 h-11 bg-slate-700/30 rounded-xl"></div>

                  <div className="flex-1 space-y-2">

                    <div className="h-4 w-20 bg-slate-700/30 rounded"></div>

                    <div className="h-3 w-12 bg-slate-700/30 rounded"></div>

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
                  <div
                    key={jetton.jetton.address.toString()}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-800/40 rounded-2xl border border-white/5 hover:border-green-500/30 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-slate-700/40 rounded-xl flex items-center justify-center overflow-hidden border border-gray-600/50">
                        {enhancedJetton.jetton.image ? (
                          <img
                            src={enhancedJetton.jetton.image}
                            alt={enhancedJetton.jetton.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/40x40/1f2937/4ade80?text=${enhancedJetton.jetton.symbol?.[0] || '?'}`;
                            }}
                          />
                        ) : (
                          <span className="text-green-400 font-bold text-lg">
                            {enhancedJetton.jetton.symbol?.[0] || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-green-300 font-bold text-sm">{enhancedJetton.jetton.name}</h4>
                          {enhancedJetton.jetton.verified && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="text-xs text-green-500/80 font-medium">
                          {enhancedJetton.jetton.verified ? `$${registryData?.rateUsd?.toFixed(6) || '0'}` : 'Unverified'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-300 font-bold text-sm">
                        {formatBalance(toDecimals(jetton.balance, jetton.jetton.decimals), hideBalances)}
                      </div>
                      <p className="text-xs text-green-500/80 font-medium">
                        ${formatBalance(usdValue.toFixed(2), hideBalances)}
                      </p>
                    </div>
                  </div>
                );
              })

          )}

        </div>

      </div>

      <BottomNav currentTab={activeTab} setTab={setActiveTab} />



      {/* Modals */}

      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        address={connectedTonAddressString}
      />

      {/* Send TON Modal */}
      {isSendModalOpen && connectedTonAddress && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsSendModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border-2 border-green-700/50 shadow-neon-green-light">
            <div className="p-4 border-b border-green-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-900/50 rounded-xl flex items-center justify-center border border-yellow-700/60">
                  <ArrowUpRight className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-green-300">Send TON</h2>
                  <p className="text-xs text-green-500/80">Available: {tonBalance} TON</p>
                </div>
              </div>
              <button onClick={() => setIsSendModalOpen(false)} className="text-gray-400 hover:text-green-300 p-1.5 hover:bg-gray-700/50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
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
              } catch (error: any) {
                console.error('Failed to send TON:', error);
                alert('Failed to send TON: ' + error.message);
              }
            }}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-green-400/80 mb-1.5 font-semibold">Recipient Address</label>
                  <input name="address" type="text" placeholder="Enter TON address (EQ... or UQ...)" className="w-full px-3 py-2 bg-gray-800/60 border border-green-800/40 rounded-lg text-green-300 placeholder-gray-500 focus:outline-none focus:border-green-600/70 focus:ring-1 focus:ring-green-500/50 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-green-400/80 mb-1.5 font-semibold">Amount</label>
                  <div className="relative">
                    <input name="amount" type="number" step="0.000000001" min="0" placeholder="0.0" className="w-full px-3 py-2 bg-gray-800/60 border border-green-800/40 rounded-lg text-green-300 placeholder-gray-500 focus:outline-none focus:border-green-600/70 focus:ring-1 focus:ring-green-500/50 text-sm pr-16" required />
                    <button type="button" onClick={() => { (document.querySelector('input[name="amount"]') as HTMLInputElement).value = tonBalance; }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-yellow-400 hover:text-yellow-300 font-bold px-2 py-1 bg-yellow-900/50 rounded-md hover:bg-yellow-800/60 transition-all border border-yellow-700/60">MAX</button>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-green-700/50 bg-gray-800/40">
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setIsSendModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors text-sm font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-yellow-900/50 border border-yellow-700/60 rounded-lg text-yellow-300 hover:bg-yellow-800/60 hover:border-yellow-600/80 transition-colors text-sm font-bold flex items-center justify-center space-x-1.5">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Send TON</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedToken && (

          <TokenDetail

              token={selectedToken}

              onBack={() => setSelectedToken(null)}

          />

      )}

    </div>

  );

};

const WalletUIWithErrorBoundary = () => (

  <WalletErrorBoundary>

    <WalletUI />

  </WalletErrorBoundary>

);

export default WalletUIWithErrorBoundary;
