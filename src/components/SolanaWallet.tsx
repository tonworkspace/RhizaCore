import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/components/I18nProvider';
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
  AlertTriangle
} from 'lucide-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Error boundary component for SolanaWallet - Themed
class SolanaWalletErrorBoundary extends React.Component<
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
    console.error('SolanaWallet error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md mx-auto p-4">
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

const SolanaWallet = () => {
  const { t } = useI18n();
  const { publicKey, connected, sendTransaction } = useWallet();

  const [solBalance, setSolBalance] = useState<string>("0.00");
  const [isLoadingSOL, setIsLoadingSOL] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Solana connection
  const connection = useMemo(() => new Connection('https://api.mainnet-beta.solana.com'), []);

  const connectedAddressString = useMemo(() => {
    return publicKey ? publicKey.toBase58() : null;
  }, [publicKey]);

  // Fetch SOL balance
  useEffect(() => {
    if (!publicKey) {
      setSolBalance("0.00");
      setIsLoadingSOL(false);
      return;
    }
    setIsLoadingSOL(true);
    connection.getBalance(publicKey)
      .then((balance) => setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4)))
      .catch((e) => {
        console.error("Failed to fetch SOL balance:", e);
        setSolBalance("0.00");
      })
      .finally(() => setIsLoadingSOL(false));
  }, [publicKey, connection]);

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (publicKey) {
        const balance = await connection.getBalance(publicKey);
        setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Copy Address
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

  // Helper formatting functions
  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const formatBalance = (balance: string, hide: boolean = false) => {
    if (hide) return '••••••';
    try {
      const num = parseFloat(balance);
      if (isNaN(num)) return '0.00';
      return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
    } catch {
      return '0.00';
    }
  };

  // Connect Wallet View - Themed
  if (!connected) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-gray-900/80 border-2 border-purple-700/50 rounded-2xl shadow-neon-purple-light overflow-hidden backdrop-blur-md">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-purple-900/50 rounded-2xl mx-auto mb-6 flex items-center justify-center border-2 border-purple-600/70 shadow-lg shadow-purple-500/30">
              <Wallet className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-purple-300 mb-2">{t('connect_wallet_title') || 'Connect Wallet'}</h2>
            <p className="text-purple-400/80 mb-8 text-base">{t('connect_wallet_desc') || 'Connect your Solana wallet to get started'}</p>

            <div className="relative group inline-block">
              <WalletMultiButton className="!bg-purple-900/50 !border-2 !border-purple-600/70 !text-purple-300 hover:!bg-purple-800/60 hover:!border-purple-500 !transition-colors !rounded-lg !font-semibold !px-6 !py-3" />
            </div>
          </div>
          <div className="p-6 bg-gray-800/50 border-t border-purple-700/50">
            <h3 className="text-lg font-bold text-purple-300 mb-4 text-center">{t('wallet_features') || 'Features'}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: 'Secure', desc: "Your keys" },
                { icon: Zap, title: 'Fast', desc: "Quick TXNs" },
                { icon: Globe, title: 'Ecosystem', desc: "Solana network" },
                { icon: Star, title: 'Tokens', desc: "SPL support" }
              ].map((feature, index) => (
                <div key={index} className="p-4 bg-gray-900/50 rounded-xl border border-purple-800/40 hover:border-purple-600/60 hover:bg-gray-800/70 transition-all duration-200">
                  <feature.icon className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="text-sm font-bold text-purple-300 mb-1">{feature.title}</h4>
                  <p className="text-xs text-purple-400/80">{feature.desc}</p>
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
    <div className="w-full max-w-md mx-auto p-2 font-mono">
      <div className="bg-gray-900/80 border-2 border-purple-700/50 rounded-2xl shadow-neon-purple-light overflow-hidden backdrop-blur-md">
        <div className="p-6 border-b border-purple-700/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-medium text-purple-400/80">RhizaCore Solana Wallet</h2>
              <div className="mt-2 text-5xl font-bold text-purple-300 tracking-tight">
                {formatBalance(`${parseFloat(solBalance) * 200}`, hideBalances)} {/* Approximate USD value */}
              </div>
              <p className="mt-1 text-sm text-purple-500/80">{formatAddress(connectedAddressString || '')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2.5 bg-gray-800/50 hover:bg-gray-700/60 rounded-xl transition-colors border border-purple-800/40 text-purple-400"
                title={hideBalances ? 'Show balances' : 'Hide balances'}
              >
                {hideBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-gray-800/50 hover:bg-gray-700/60 rounded-xl transition-colors border border-purple-800/40 text-purple-400 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-purple-700/50">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Buy', icon: PlusCircle, action: () => window.open('https://jup.ag', '_blank'), color: 'blue' },
              { label: 'Send', icon: ArrowUpRight, action: () => {}, color: 'yellow' },
              { label: 'Receive', icon: ArrowDownLeft, action: () => {}, color: 'green' },
              { label: 'Swap', icon: ArrowLeftRight, action: () => window.open('https://jup.ag', '_blank'), color: 'purple' },
            ].map(({ label, icon: Icon, action, color }) => (
              <button
                key={label}
                onClick={action}
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

        <div className="px-4 py-4 max-h-[40vh] overflow-y-auto">
          <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider px-2">Assets</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-purple-800/40 hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center border border-purple-700/60">
                  <Wallet className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-purple-300 font-bold text-sm">SOL</h4>
                  <p className="text-xs text-purple-500/80 font-medium">$200.00</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-purple-300 font-bold text-sm">
                  {isLoadingSOL ? '...' : formatBalance(solBalance, hideBalances)}
                </div>
                <p className="text-xs text-purple-500/80 font-medium">${formatBalance((parseFloat(solBalance || '0') * 200).toFixed(2), hideBalances)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receive Modal - Themed */}
      <ReceiveModal
        isOpen={false}
        onClose={() => {}}
        address={connectedAddressString || ''}
        copySuccess={copySuccess}
        onCopy={handleCopyAddress}
      />
    </div>
  );
};

// Receive Modal Component
const ReceiveModal = ({
  isOpen,
  onClose,
  address,
  copySuccess,
  onCopy
}: {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  copySuccess: boolean;
  onCopy: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border-2 border-purple-700/50 shadow-neon-purple-light">
        <div className="p-4 border-b border-purple-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/50 rounded-xl flex items-center justify-center border border-green-700/60">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-300">Receive SOL</h2>
              <p className="text-xs text-purple-500/80">Share this address or QR code to receive SOL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-purple-300 p-1.5 hover:bg-gray-700/50 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 bg-gray-800/40">
          <div className="text-center">
            <div className="bg-white p-3 rounded-lg mb-4 inline-block border-2 border-purple-700/50 shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${address}&bgcolor=111827&color=9333ea&qzone=1`}
                alt="Wallet Address QR"
                className="w-40 h-40"
              />
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-purple-800/40 mb-4">
              <p className="text-xs text-purple-400/80 mb-1.5 font-semibold">Your Solana Address</p>
              <div className="flex items-center gap-2 bg-gray-800/70 p-2 rounded border border-gray-700/50">
                <p className="text-purple-300 font-mono text-xs break-all flex-1">{address}</p>
                <button onClick={onCopy} className="p-2 bg-purple-900/50 hover:bg-purple-800/60 rounded border border-purple-700/60 transition-colors">
                  {copySuccess ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">Share this address or QR code to receive SOL and SPL tokens.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the wrapped component
const SolanaWalletWithErrorBoundary = () => (
  <SolanaWalletErrorBoundary>
    <SolanaWallet />
  </SolanaWalletErrorBoundary>
);

export default SolanaWalletWithErrorBoundary;