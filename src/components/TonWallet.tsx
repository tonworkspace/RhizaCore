import React, { useState, useEffect, useMemo } from 'react';
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
  X
} from 'lucide-react';
import { JettonBalance } from "@ton-api/client";
import { SendJettonModal } from "./SendJettonModal";
// import { JettonDetailModal } from "./JettonDetailModal";
import { isValidAddress } from '../utility/address';
import { formatTonValue, formatTokenAmount } from "../utility/format";
import { toDecimals } from "../utility/decimals";
import ta from "../utility/tonapi";
import { getJettonRegistryData, enhanceJettonData } from "../utils/jettonRegistry";

// Error boundary component for TonWallet
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
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-8 text-center bg-gradient-to-b from-gray-50 to-white">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-red-500/30">
                <X className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Wallet Error</h2>
              <p className="text-gray-600 mb-8 text-base">
                {this.state.error?.message || 'An unexpected error occurred with the wallet component.'}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const TonWallet = () => {
  // Simplified single-view wallet UI
  const [tonBalance, setTonBalance] = useState<string>("0.00");
  const [jettons, setJettons] = useState<JettonBalance[]>([]);
  const [selectedJetton, setSelectedJetton] = useState<JettonBalance | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  // const [isJettonDetailOpen, setIsJettonDetailOpen] = useState(false);
  const [isSendJettonModalOpen, setIsSendJettonModalOpen] = useState(false);
  const [isLoadingTON, setIsLoadingTON] = useState(true);
  const [isLoadingJettons, setIsLoadingJettons] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  // Removed search/filter for compact UI
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [tonUsdPrice, setTonUsdPrice] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const connectedAddressString = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const connectedAddress = useMemo(() => {
    if (!connectedAddressString) return null;
    try {
      return isValidAddress(connectedAddressString)
        ? Address.parse(connectedAddressString)
        : null;
    } catch (error) {
      console.error('Error parsing address:', error);
      return null;
    }
  }, [connectedAddressString]);

  // Fetch TON balance
  useEffect(() => {
    if (!connectedAddress) {
      setTonBalance("0.00");
      setIsLoadingTON(false);
      return;
    }

    setIsLoadingTON(true);
    ta.accounts
      .getAccount(connectedAddress)
      .then((info) => {
        const balance = formatTonValue(info.balance.toString());
        setTonBalance(balance);
      })
      .catch((e) => {
        console.error("Failed to fetch TON balance:", e);
        setTonBalance("0.00");
      })
      .finally(() => {
        setIsLoadingTON(false);
      });
  }, [connectedAddress]);

  // Fetch jettons
  useEffect(() => {
    if (!connectedAddress) {
      setJettons([]);
      return;
    }

    setIsLoadingJettons(true);
    ta.accounts.getAccountJettonsBalances(connectedAddress)
      .then(balanceInfo => {
        setJettons(balanceInfo.balances || []);
      })
      .catch(error => {
        console.error('Error loading jettons:', error);
        setJettons([]);
      })
      .finally(() => {
        setIsLoadingJettons(false);
      });
  }, [connectedAddress]);

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
      } catch (_) {
        // ignore
      }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 60_000);
    return () => { isCancelled = true; clearInterval(id); };
  }, []);

  // Calculate portfolio value (TON + verified jettons, USD)
  useEffect(() => {
    const tonAmount = parseFloat(tonBalance || '0');
    let totalValue = tonAmount * tonUsdPrice;
    
    // Add verified jetton values
    jettons.forEach(jetton => {
      const registryData = getJettonRegistryData(jetton.jetton.address.toString());
      if (registryData?.verified && registryData.rateUsd > 0) {
        const jettonAmount = parseFloat(toDecimals(jetton.balance, jetton.jetton.decimals));
        totalValue += jettonAmount * registryData.rateUsd;
      }
    });
    
    setPortfolioValue(totalValue);
  }, [tonBalance, tonUsdPrice, jettons]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh TON balance
      if (connectedAddress) {
        const info = await ta.accounts.getAccount(connectedAddress);
        setTonBalance(formatTonValue(info.balance.toString()));
      }
      
      // Refresh jettons
      if (connectedAddress) {
        const balanceInfo = await ta.accounts.getAccountJettonsBalances(connectedAddress);
        setJettons(balanceInfo.balances || []);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyAddress = async () => {
    if (!connectedAddressString) return;
    
    try {
      await navigator.clipboard.writeText(connectedAddressString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // const handleJettonClick = (jetton: JettonBalance) => {
  //   setSelectedJetton(jetton);
  //   setIsJettonDetailOpen(true);
  // };

  // const handleReceiveFromDetail = () => {
  //   setIsReceiveModalOpen(true);
  // };

  // const handleSendFromDetail = (jetton: JettonBalance) => {
  //   setSelectedJetton(jetton);
  //   setIsJettonDetailOpen(false);
  //   setIsSendJettonModalOpen(true);
  // };

  // Directly show all jettons in list
  const allJettons = jettons;

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string, hide: boolean = false) => {
    if (hide) return '••••••';
    if (balance.startsWith('$')) return balance;
    const [i, f = ''] = balance.split('.');
    const reconstructed = BigInt(i + (f ? f : ''));
    const decimals = f.length;
    return formatTokenAmount(reconstructed, decimals, { maxDecimals: 6, trimInsignificant: true, smartCompactWords: true });
  };

  if (!connectedAddress) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-8 text-center bg-gradient-to-b from-gray-50 to-white">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-8 text-base">Connect your TON wallet to manage your digital assets</p>

            <div className="relative group inline-block">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <TonConnectButton className="relative !min-h-[52px] !px-8 !py-3" />
            </div>
          </div>

          <div className="p-8 bg-white border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Wallet Features</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Secure", desc: "Your keys, your crypto" },
                { icon: Zap, title: "Fast", desc: "Lightning quick" },
                { icon: Globe, title: "Multi-chain", desc: "TON ecosystem" },
                { icon: Star, title: "Jettons", desc: "Token management" }
              ].map((feature, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <feature.icon className="w-7 h-7 text-blue-500 mb-3" />
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-xs text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-2">
      <div className="rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-medium text-gray-600">TAPPs Wallet</h2>
              <div className="mt-3 text-5xl font-bold text-black tracking-tight">
                {formatBalance(`$${portfolioValue.toFixed(2)}`, hideBalances)}
              </div>
              <p className="mt-2 text-sm text-gray-500 font-mono">{formatAddress(connectedAddressString)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                title={hideBalances ? 'Show balances' : 'Hide balances'}
              >
                {hideBalances ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => window.open('#', '_blank')}
              className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-gray-900 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium">Buy</span>
            </button>
            <button
              onClick={() => setIsSendModalOpen(true)}
              className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-gray-900 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium">Send</span>
            </button>
            <button
              onClick={() => setIsReceiveModalOpen(true)}
              className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-gray-900 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium">Receive</span>
            </button>
            <button
              onClick={() => window.open('https://dedust.io', '_blank')}
              className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-gray-900 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium">Swap</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Assets</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold">TON</h4>
                  <p className="text-xs text-gray-500 font-medium">${(tonUsdPrice || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-900 font-bold">
                  {isLoadingTON ? '...' : formatBalance(tonBalance, hideBalances)}
                </div>
                <p className="text-xs text-gray-500 font-medium">${(parseFloat(tonBalance || '0') * (tonUsdPrice || 0)).toFixed(2)}</p>
              </div>
            </div>

            {isLoadingJettons ? (
              <div className="space-y-2.5">
                {[1,2,3].map((i) => (
                  <div key={i} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 animate-pulse">
                    <div className="h-5 w-28 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              allJettons.map((jetton) => {
                const registryData = getJettonRegistryData(jetton.jetton.address.toString());
                const enhancedJetton = enhanceJettonData(jetton, registryData || undefined);
                const jettonAmount = parseFloat(toDecimals(jetton.balance, jetton.jetton.decimals));
                const usdValue = registryData?.verified && registryData.rateUsd > 0 
                  ? jettonAmount * registryData.rateUsd 
                  : 0;

                return (
                  <button
                    key={jetton.jetton.address.toString()}
                    // onClick={() => handleJettonClick(jetton)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
                        {enhancedJetton.jetton.image ? (
                          <img
                            src={enhancedJetton.jetton.image}
                            alt={enhancedJetton.jetton.name}
                            className="w-8 h-8 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/32/6366f1/ffffff?text=${enhancedJetton.jetton.symbol?.[0] || '?'}`
                            }}
                          />
                        ) : (
                          <span className="text-blue-600 font-bold text-lg">{enhancedJetton.jetton.symbol?.[0] || '?'}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-gray-900 font-bold">{enhancedJetton.jetton.name}</h4>
                          {enhancedJetton.jetton.verified && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {enhancedJetton.jetton.verified ? 
                            `Verified • $${(registryData?.rateUsd || 0).toFixed(6)}` : 
                            'Unverified Token'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-bold">
                        {formatBalance(toDecimals(jetton.balance, jetton.jetton.decimals), hideBalances)}
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        ${usdValue.toFixed(2)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Send TON Modal */}
      {isSendModalOpen && connectedAddress && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setIsSendModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-gray-200 shadow-2xl">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Send TON</h2>
                    <p className="text-sm text-gray-600">Available: {tonBalance} TON</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSendModalOpen(false)}
                  className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const address = (form.elements.namedItem('address') as HTMLInputElement).value;
              const amount = (form.elements.namedItem('amount') as HTMLInputElement).value;
              
              try {
                const transaction = {
                  validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
                  messages: [
                    {
                      address: address,
                      amount: toNano(amount).toString(),
                    },
                  ],
                };

                await tonConnectUI.sendTransaction(transaction);
                setIsSendModalOpen(false);
              } catch (error) {
                console.error('Failed to send TON:', error);
              }
            }}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2 font-bold">
                    Recipient Address
                  </label>
                  <input
                    name="address"
                    type="text"
                    placeholder="Enter TON address"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2 font-bold">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      name="amount"
                      type="number"
                      step="0.000000001"
                      min="0"
                      placeholder="0.0"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                          input.value = tonBalance;
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsSendModalOpen(false)}
                    className="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 transition-all duration-200 text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-xl text-white text-sm font-bold flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg shadow-blue-500/30"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Send TON</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jetton Detail Modal */}
      {/* {selectedJetton && isJettonDetailOpen && (
        <JettonDetailModal
          jetton={selectedJetton}
          onClose={() => {
            setIsJettonDetailOpen(false);
            setSelectedJetton(null);
          }}
          onSend={handleSendFromDetail}
          onReceive={handleReceiveFromDetail}
        />
      )} */}

      {/* Send Jetton Modal */}
      {selectedJetton && connectedAddress && isSendJettonModalOpen && (
        <SendJettonModal
          jetton={selectedJetton}
          senderAddress={connectedAddress}
          onClose={() => {
            setSelectedJetton(null);
            setIsSendJettonModalOpen(false);
          }}
        />
      )}

      {/* Receive Modal */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setIsReceiveModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-gray-200 shadow-2xl">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Receive TON</h2>
                    <p className="text-sm text-gray-600">Share your address to receive funds</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-white">
              <div className="text-center">
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl mb-6 inline-block border-2 border-gray-200 shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${connectedAddressString}`}
                    alt="Wallet Address QR Code"
                    className="w-40 h-40"
                  />
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-200 mb-6">
                  <p className="text-sm text-gray-600 mb-3 font-bold">Your TON Address</p>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-200">
                    <p className="text-gray-900 font-mono text-xs break-all flex-1">{connectedAddressString}</p>
                    <button
                      onClick={handleCopyAddress}
                      className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      {copySuccess ? (
                        <Check className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Share this address to receive TON and other tokens in your wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
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