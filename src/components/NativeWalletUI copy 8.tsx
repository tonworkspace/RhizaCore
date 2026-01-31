import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  supabase,
  ensureUserHasSponsorCode,
  getUserAirdropBalance,
  unstakeAirdropBalance,
  createAirdropWithdrawal,
  sendRZCToUser,
  getUserTransferHistory,
  searchUsersForTransfer,
  getUserRZCBalance,
  initializeFreeMiningPeriod,
  canUserUnstake,
  getUserStakingLocksSummary,
  checkWalletActivation,
  AirdropBalance,
  UserTransfer,
  UserSearchResult,
} from '../lib/supabaseClient';
import { Icons } from '../uicomponents/Icons';
import RhizaCoreSaleComponent from './RhizaCoreSaleComponent';
import StakingComponent from './StakingComponent';
import WalletActivationModal from './WalletActivationModal';
import { useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { getTONBalance } from '../services/TONAPIService';
import qr from 'qr';

// Define SnackbarData type locally since it's not in supabaseClient
interface SnackbarData {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

// --- CONSTANTS ---
const CARD_GRADIENT = "bg-gradient-to-br from-zinc-900/40 via-zinc-800/30 to-zinc-900/50 border border-white/[0.08] backdrop-blur-xl";
const GLASS_EFFECT = "bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm";

// --- TYPES & INTERFACES ---

interface ArcadeMiningUIProps {
  balanceTon: number;
  tonPrice: number;
  userId?: number;
  userUsername?: string;
  referralCode?: string;
  showSnackbar?: (data: SnackbarData) => void;
  tonAddress?: string | null;
  totalEarnedRZC?: number;
  onWalletActivationChange?: (activated: boolean) => void;
}

export type ArcadeMiningUIHandle = {
  refreshBalance: () => Promise<void> | void;
};

// --- COMPACT HELPER COMPONENTS ---

const CompactAction = ({ icon: Icon, label, onClick, disabled, variant = "green", badge }: any) => {
  const themes = {
    green: "from-green-600/80 to-green-800/80 hover:from-green-500/90 hover:to-green-700/90",
    zinc: "from-zinc-700/80 to-zinc-900/80 hover:from-zinc-600/90 hover:to-zinc-800/90",
    blue: "from-blue-600/80 to-blue-800/80 hover:from-blue-500/90 hover:to-blue-700/90"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="relative flex flex-col items-center gap-1.5 group outline-none transition-all flex-1 min-w-0"
    >
      <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300
        ${disabled 
          ? 'bg-zinc-900/50 text-zinc-700 border border-white/5 opacity-40' 
          : `bg-gradient-to-br ${themes[variant as keyof typeof themes]} text-white border border-white/10 shadow-lg hover:scale-105 active:scale-95`
        }
      `}>
        <Icon size={18} strokeWidth={1.8} />
        {badge && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
        )}
      </div>
      <span className={`text-[8px] font-bold uppercase tracking-[0.2em] transition-colors leading-none ${
        disabled ? 'text-zinc-800' : 'text-zinc-500 group-hover:text-green-400'
      }`}>
        {label}
      </span>
    </button>
  );
};

const RegistryItem = ({ tx, currentUserId }: { tx: UserTransfer; currentUserId: number }) => {
  const isOutgoing = tx.from_user_id === currentUserId;
  const otherUser = isOutgoing ? tx.to_user : tx.from_user;
  
  return (
    <div className={`${GLASS_EFFECT} p-4 rounded-2xl flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
          isOutgoing ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
        }`}>
          {isOutgoing ? <Icons.Send size={14} /> : <Icons.Copy size={14} />}
        </div>
        <div>
          <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">
            {isOutgoing ? 'Sent to' : 'Received from'}
          </div>
          <div className="text-sm font-bold text-white">
            @{otherUser?.username || otherUser?.display_name || `User${isOutgoing ? tx.to_user_id : tx.from_user_id}`}
          </div>
          <div className="text-[8px] text-zinc-600 font-mono">
            {new Date(tx.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className={`text-sm font-bold font-mono ${
        isOutgoing ? 'text-red-400' : 'text-green-400'
      }`}>
        {isOutgoing ? '-' : '+'}{tx.amount.toFixed(2)} RZC
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }: { activity: { id: string; type: string; amount: number; status: string; created_at: string; } }) => {
  const getActivityIcon = (type: string) => {
    if (type.includes('airdrop_balance_claim')) {
      return <Icons.Wallet size={14} className="text-purple-400" />;
    }
    if (type.includes('airdrop_balance_reclaim')) {
      return <Icons.Copy size={14} className="text-orange-400" />;
    }
    if (type.includes('airdrop_withdrawal_request')) {
      return <Icons.Send size={14} className="text-blue-400" />;
    }
    if (type.includes('airdrop_balance_stake')) {
      return <Icons.Boost size={14} className="text-green-400" />;
    }
    if (type.includes('airdrop_balance_unstake')) {
      return <Icons.Boost size={14} className="text-yellow-400" />;
    }
    if (type.includes('squad_mining_claim')) {
      return <Icons.Users size={14} className="text-green-400" />;
    }
    if (type.includes('rzc_send')) {
      return <Icons.Send size={14} className="text-red-400" />;
    }
    if (type.includes('rzc_receive')) {
      return <Icons.Copy size={14} className="text-green-400" />;
    }
    if (type.includes('mining_start')) {
      return <Icons.Energy size={14} className="text-green-400" />;
    }
    if (type.includes('mining_complete')) {
      return <Icons.Check size={14} className="text-green-400" />;
    }
    return <Icons.History size={14} className="text-gray-400" />;
  };

  const getActivityLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'airdrop_balance_claim': 'Airdrop Claim',
      'airdrop_balance_reclaim': 'Airdrop Reclaim',
      'airdrop_withdrawal_request': 'Withdrawal',
      'airdrop_balance_stake': 'Staking',
      'airdrop_balance_unstake': 'Unstaking',
      'squad_mining_claim': 'Squad Rewards',
      'rzc_send': 'RZC Sent',
      'rzc_receive': 'RZC Received',
      'mining_start': 'Mining Started',
      'mining_complete': 'Mining Complete'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`${GLASS_EFFECT} p-4 rounded-2xl flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
          {getActivityIcon(activity.type)}
        </div>
        <div>
          <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">
            {getActivityLabel(activity.type)}
          </div>
          <div className="text-sm font-bold text-white">
            {activity.amount > 0 ? `${activity.amount.toFixed(4)} RZC` : 'System Action'}
          </div>
          <div className="text-[8px] text-zinc-600 font-mono">
            {new Date(activity.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className={`text-[8px] font-bold uppercase px-2 py-1 rounded ${
        activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
        activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
        activity.status === 'failed' ? 'bg-red-500/20 text-red-400' :
        'bg-gray-500/20 text-gray-400'
      }`}>
        {activity.status}
      </div>
    </div>
  );
};

const NativeWalletUI = forwardRef<ArcadeMiningUIHandle, ArcadeMiningUIProps>(function WalletUI(props, ref) {
  const {
    userId = 123456,
    userUsername = 'RhizaUser',
    tonAddress,
    tonPrice,
    showSnackbar,
    totalEarnedRZC = 0,
    onWalletActivationChange,
  } = props;

  // TON Connect integration - get real connection state
  const connectedAddressFromHook = useTonAddress();
  const wallet = useTonWallet();
  const connected = !!(tonAddress || connectedAddressFromHook);
  const actualTonAddress = tonAddress || connectedAddressFromHook;

  // Debug connection state
  useEffect(() => {
    console.log('NativeWalletUI connection state:', {
      tonAddressProp: tonAddress,
      connectedAddressFromHook,
      connected,
      actualTonAddress,
      wallet: wallet?.device?.appName
    });
  }, [tonAddress, connectedAddressFromHook, connected, actualTonAddress, wallet]);

  // --- STATE ---
  const [sponsorCode, setSponsorCode] = useState<string | null>(null);
  const [totalEarnedRZCState, setTotalEarnedRZC] = useState(0);
  const [airdropBalance, setAirdropBalance] = useState<AirdropBalance | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'history'>('assets');
  const [stakingLocksSummary, setStakingLocksSummary] = useState<any>(null);
  const [walletActivated, setWalletActivated] = useState<boolean>(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ton');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  // Network options for the selector
  const networkOptions = [
    { id: 'ton', name: 'TON', status: 'Active', color: 'blue' },
    { id: 'base', name: 'BASE', status: 'Coming Soon', color: 'purple' },
    { id: 'ethereum', name: 'Ethereum', status: 'Coming Soon', color: 'gray' },
    { id: 'polygon', name: 'Polygon', status: 'Coming Soon', color: 'purple' },
    { id: 'bsc', name: 'BSC', status: 'Coming Soon', color: 'yellow' },
  ];
  

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveTab, setReceiveTab] = useState<'identity' | 'address'>('identity');
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [isProcessingUnstake, setIsProcessingUnstake] = useState(false);
  const [isProcessingSend, setIsProcessingSend] = useState(false);
  
  // Send/Search form state
  const [sendAmount, setSendAmount] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserSearchResult | null>(null);
  const [transferHistory, setTransferHistory] = useState<UserTransfer[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('ethereum');
  const [activities, setActivities] = useState<Array<{ id: string; type: string; amount: number; status: string; created_at: string; }>>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  const currentTotalEarned = totalEarnedRZC || totalEarnedRZCState;

  // --- LOGIC ---
  const loadWalletActivationStatus = async () => {
    if (!userId) return;
    
    try {
      const status = await checkWalletActivation(userId);
      setWalletActivated(status.wallet_activated);
      onWalletActivationChange?.(status.wallet_activated);
    } catch (error) {
      console.error('Error loading wallet activation status:', error);
    }
  };

  // Fetch wallet balance when connected
  const fetchWalletBalance = async () => {
    if (!actualTonAddress) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await getTONBalance(actualTonAddress);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Effect to fetch balance when wallet connects
  useEffect(() => {
    if (actualTonAddress) {
      fetchWalletBalance();
    } else {
      setWalletBalance(0);
    }
  }, [actualTonAddress]);

  const loadAirdropBalance = async () => {
    if (!userId) return;
    
    try {
      const balanceResult = await getUserAirdropBalance(userId);
      if (balanceResult.success && balanceResult.balance) {
        setAirdropBalance(balanceResult.balance);
      }
    } catch (error) {
      console.error('Error loading airdrop balance:', error);
    }
  };

  const loadStakingLocksSummary = async () => {
    if (!userId) return;
    
    try {
      const summary = await getUserStakingLocksSummary(userId);
      setStakingLocksSummary(summary);
    } catch (error) {
      console.error('Error loading staking locks summary:', error);
    }
  };

  const handleWithdrawFromAirdrop = async () => {
    if (!userId || !withdrawAmount || !withdrawAddress) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsProcessingWithdraw(true);
    try {
      const result = await createAirdropWithdrawal(userId, amount, withdrawAddress, 'ton');
      
      if (result.success) {
        // Record activity for withdrawal
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'airdrop_withdrawal_request',
          amount: amount,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        
        showSnackbar?.({ 
          message: 'Egress Protocol Initialized', 
          description: `Transfer pending verification.`, 
          type: 'success' 
        });
        
        await loadAirdropBalance();
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawAddress('');
        loadActivities(); // Refresh activities
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  // Peer-to-peer Send
  const handleSendRZC = async () => {
    if (!userId || !selectedRecipient || !sendAmount) return;
    
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsProcessingSend(true);
    try {
      const result = await sendRZCToUser(userId, selectedRecipient.id, amount, sendMessage);
      
      if (result.success) {
        // Record activity for sending RZC
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'rzc_send',
          amount: amount,
          status: 'completed',
          metadata: { recipient_id: selectedRecipient.id, recipient_username: selectedRecipient.username },
          created_at: new Date().toISOString()
        });
        
        showSnackbar?.({
          message: 'Dispatch Successful',
          description: `Transferred ${amount.toFixed(4)} RZC to @${selectedRecipient.username}.`,
          type: 'success'
        });
        
        await loadAirdropBalance();
        loadHistory();
        loadActivities(); // Refresh activities
        setShowSendModal(false);
        setSendAmount('');
        setSendMessage('');
        setSelectedRecipient(null);
      } else {
        showSnackbar?.({ message: 'Dispatch Failed', description: result.error, type: 'error' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingSend(false);
    }
  };

  const loadHistory = async () => {
    if (!userId) return;
    const history = await getUserTransferHistory(userId);
    setTransferHistory(history);
  };

  const loadActivities = async () => {
    if (!userId) return;
    
    setIsLoadingActivities(true);
    try {
      const { data: activitiesData, error } = await supabase
        .from('activities')
        .select('id, type, amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading activities:', error);
        return;
      }

      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleUnstakeAirdropBalance = async () => {
    if (!userId) return;
    
    setIsProcessingUnstake(true);
    try {
      // First check if user can unstake based on lock periods
      const stakingAmount = airdropBalance?.staked_balance || 0;
      const canUnstakeCheck = await canUserUnstake(userId, stakingAmount);
      
      if (!canUnstakeCheck.canUnstake) {
        // Show detailed lock information
        showSnackbar?.({ 
          message: 'Unstaking Blocked', 
          description: `${canUnstakeCheck.lockedAmount.toLocaleString()} RZC is still locked by staking periods. Available to unstake: ${canUnstakeCheck.availableAmount.toLocaleString()} RZC`, 
          type: 'error' 
        });
        
        setShowUnstakeModal(false);
        return;
      }
      
      const result = await unstakeAirdropBalance(userId);
      
      if (result.success) {
        // Record activity for unstaking
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'airdrop_balance_unstake',
          amount: result.unstakedAmount || 0,
          status: 'completed',
          created_at: new Date().toISOString()
        });
        
        showSnackbar?.({ 
          message: 'Unstake Complete', 
          description: `${result.unstakedAmount?.toFixed(4)} RZC returned to available balance.`, 
          type: 'success' 
        });
        
        await loadAirdropBalance();
        await loadStakingLocksSummary();
        setShowUnstakeModal(false);
        loadActivities(); // Refresh activities
      } else {
        showSnackbar?.({ 
          message: 'Unstake Failed', 
          description: result.error || 'Failed to unstake balance', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Unstaking error:', error);
      showSnackbar?.({ 
        message: 'Unstake Error', 
        description: 'An unexpected error occurred', 
        type: 'error' 
      });
    } finally {
      setIsProcessingUnstake(false);
    }
  };

  const handleCopyTonAddress = async (address?: string) => {
    const addressToCopy = address || actualTonAddress;
    if (!addressToCopy) return;
    try {
      await navigator.clipboard.writeText(addressToCopy);
      showSnackbar?.({ message: 'Encrypted Copy', description: 'Network address copied.' });
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const generateQRCode = (address: string) => {
    try {
      const qrSvg = qr(address, 'svg', { 
        border: 2,
        scale: 8
      });
      setQrCodeSvg(qrSvg);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeSvg('');
    }
  };

  const handleShowReceiveModal = () => {
    // Start with Identity tab by default
    setReceiveTab('identity');
    
    // Generate QR code if TON address is available
    if (actualTonAddress) {
      generateQRCode(actualTonAddress);
    }
    
    setShowReceiveModal(true);
  };

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNetworkDropdown) {
        const target = event.target as Element;
        if (!target.closest('.network-dropdown-container')) {
          setShowNetworkDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNetworkDropdown]);

  useEffect(() => {
    if (userSearchQuery.trim().length >= 2) {
      const runSearch = async () => {
        const res = await searchUsersForTransfer(userSearchQuery, userId!);
        setSearchResults(res);
      };
      const delay = setTimeout(runSearch, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [userSearchQuery, userId]);

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
      await loadWalletActivationStatus();
      await initializeFreeMiningPeriod(userId);
      const code = await ensureUserHasSponsorCode(userId, userUsername);
      setSponsorCode(code);

      await loadAirdropBalance();
      loadHistory();
      loadActivities();
      await loadStakingLocksSummary();

      const rzcBalance = await getUserRZCBalance(userId);
      setTotalEarnedRZC(rzcBalance.totalEarned);
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [userId, userUsername]);

  // Add effect to reload activation status when modal closes
  useEffect(() => {
    if (!showActivationModal && userId) {
      // Reload activation status when modal is closed
      loadWalletActivationStatus();
    }
  }, [showActivationModal, userId]);

  useImperativeHandle(ref, () => ({
    refreshBalance: async () => {
      if(!userId) return;
      await loadWalletActivationStatus();
      const bal = await getUserRZCBalance(userId);
      setTotalEarnedRZC(bal.totalEarned);
      await loadAirdropBalance();
      await loadStakingLocksSummary();
    }
  }));

  // Expose refresh function globally for squad mining integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshWalletBalance = async () => {
        if (!userId) return;
        await loadWalletActivationStatus();
        const bal = await getUserRZCBalance(userId);
        setTotalEarnedRZC(bal.totalEarned);
        await loadAirdropBalance();
        await loadStakingLocksSummary();
        loadActivities(); // Also refresh activities to show new squad mining claims
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshWalletBalance;
      }
    };
  }, [userId]);

  const sequenceItems = [
    { 
      label: 'Asset Verification', 
      sub: 'Pool Integrity', 
      done: currentTotalEarned > 0, 
      icon: Icons.Energy, 
      explain: 'We audit the tokens earned in your virtual mining pool to confirm they are ready for network migration.' 
    },
    { 
      label: 'Secure Migration', 
      sub: 'Hub Deployment', 
      done: (airdropBalance?.total_claimed_to_airdrop || 0) > 0, 
      icon: Icons.Wallet, 
      explain: 'Establishes a permanent link between your cloud earnings and your private on-chain distribution hub.' 
    },
    { 
      label: 'Network Identity', 
      sub: 'Protocol Auth', 
      done: !!sponsorCode, 
      icon: Icons.Rank, 
      explain: 'Initializes your encrypted signature within the RhizaCore network, enabling verified node participation.' 
    },
    { 
      label: 'Stake Commitment', 
      sub: 'Validator Yield', 
      done: (airdropBalance?.staked_balance || 0) > 0, 
      icon: Icons.Boost, 
      explain: 'Secures 70% of hub assets in the validator pool for 5 years minimum to generate recurring network rewards and protocol equity.' 
    },
    { 
      label: 'Ecosystem Access', 
      sub: 'Market Entry', 
      done: (airdropBalance?.staked_balance || 0) > 0, 
      icon: Icons.Store, 
      explain: 'Unlocks priority access to the decentralized marketplace for RZC asset acquisitions and ecosystem participation.' 
    }
  ];

  const readinessProgress = sequenceItems.filter(item => item.done).length;

  return (
    <div className="flex flex-col h-full w-full bg-[#020202] text-white overflow-y-auto custom-scrollbar pb-20 font-sans selection:bg-green-500/30 relative">
      
      {/* Wallet Lock Overlay */}
      {!walletActivated && (
        <div className="absolute inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Icons.Lock size={32} className="text-zinc-500" />
            </div>
            
            <h1 className="text-4xl font-bold tracking-tighter mb-4 text-center">RhizaCore Wallet</h1>
            <p className="text-zinc-400 text-lg mb-10 text-center">Your node is currently inactive. Complete the activation protocol to unlock the ecosystem.</p>
            
            <button 
              onClick={() => setShowActivationModal(true)}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-3xl font-bold text-lg shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Activate Protocol
            </button>
            
            <p className="mt-8 text-xs text-zinc-600 uppercase tracking-widest font-bold text-center">Requires: 15 USD in TON</p>
          </div>
        </div>
      )}
      
      {/* Wallet Activation Modal */}
      {showActivationModal && (
        <WalletActivationModal
          userId={userId}
          userUsername={userUsername}
          tonAddress={actualTonAddress}
          tonPrice={tonPrice}
          showSnackbar={showSnackbar}
          onClose={() => setShowActivationModal(false)}
          onActivationComplete={async () => {
            // Reload all wallet data after activation
            await loadWalletActivationStatus();
            await loadAirdropBalance();
            await loadStakingLocksSummary();
            loadActivities();
            
            // Close the modal
            setShowActivationModal(false);
          }}
        />
      )}
      
      {/* Compact Header */}
       <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-green-400 shadow-inner">
            <Icons.Rank size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white leading-none mb-1">RhizaCore Wallet</div>
            <div className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">Secure Assets v4.0</div>
          </div>
        </div>
        
        {/* Network Selector Dropdown */}
        <div className="relative network-dropdown-container">
          <button
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)] ${
              selectedNetwork === 'ton' ? 'bg-blue-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-300">
              {networkOptions.find(n => n.id === selectedNetwork)?.name || 'TON'}
            </span>
            <Icons.Copy size={10} className={`text-zinc-600 group-hover:text-zinc-400 transition-transform ${
              showNetworkDropdown ? 'rotate-180' : ''
            }`} />
          </button>
          
          {/* Network Dropdown */}
          {showNetworkDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              {networkOptions.map((network) => (
                <button
                  key={network.id}
                  onClick={() => {
                    setSelectedNetwork(network.id);
                    setShowNetworkDropdown(false);
                  }}
                  disabled={network.status !== 'Active'}
                  className={`w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between group ${
                    network.status !== 'Active' ? 'opacity-50 cursor-not-allowed' : ''
                  } ${selectedNetwork === network.id ? 'bg-white/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      network.color === 'blue' ? 'bg-blue-500' :
                      network.color === 'purple' ? 'bg-purple-500' :
                      network.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    } ${network.status === 'Active' ? 'animate-pulse' : ''}`}></div>
                    <div>
                      <div className="text-white text-sm font-medium">{network.name}</div>
                      <div className={`text-xs ${
                        network.status === 'Active' ? 'text-green-400' : 'text-zinc-500'
                      }`}>
                        {network.status}
                      </div>
                    </div>
                  </div>
                  {selectedNetwork === network.id && (
                    <Icons.Check size={14} className="text-green-400" />
                  )}
                </button>
              ))}
              
              <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                <div className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold text-center">
                  More networks launching Q2 2026
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Balance Section */}
      <section className="px-6 mb-6">
        <div className={`${CARD_GRADIENT} rounded-[32px] p-6 relative overflow-hidden group`}>
          {/* Animated Card Decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-[60px] group-hover:bg-green-500/15 transition-all duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Wallet Balance</span>
              <Icons.Energy size={16} className="text-zinc-700" />
            </div>
            
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-4xl font-mono font-bold tracking-tighter text-white">
                {airdropBalance?.available_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || '0.00'}
              </span>
              <span className="text-green-500 font-black text-lg">RZC</span>
            </div>
            
            <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-6">
              ≈ {((airdropBalance?.available_balance || 0) * 0.082).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900"></div>
                  </div>
                ))}
                <div className="w-5 h-5 rounded-full border-2 border-[#050505] bg-zinc-900 flex items-center justify-center text-[7px] font-bold text-zinc-500">+4</div>
              </div>
              <div className="text-[7px] font-black uppercase tracking-widest text-zinc-700">Secured by RhizaNet</div>
            </div>
          </div>
        </div>

        {/* Compact Wallet Address */}
        {actualTonAddress && (
          <div className="hidden mt-3">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 flex items-center justify-between hover:border-green-500/20 transition-all group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Icons.Wallet size={12} className="text-green-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">Address</span>
                  <span className="text-zinc-300 font-mono text-[10px] truncate">
                    {actualTonAddress.slice(0, 12)}...{actualTonAddress.slice(-8)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleCopyTonAddress(actualTonAddress)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors text-zinc-600 hover:text-white"
              >
                <Icons.Copy size={14} />
              </button>
            </div>
          </div>
        )}

        {/* TON Balance Display */}
        {actualTonAddress && (
          <div className=" hidden mt-3">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Icons.Energy size={12} className="text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">TON Balance</span>
                  <span className="text-blue-400 font-mono text-[12px] font-bold">
                    {isLoadingBalance ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      `${walletBalance.toFixed(4)} TON`
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[8px] text-zinc-600 font-mono">
                  ≈ ${(walletBalance * tonPrice).toFixed(2)}
                </div>
                <button
                  onClick={fetchWalletBalance}
                  className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                  disabled={isLoadingBalance}
                >
                  <Icons.Refresh size={12} className={isLoadingBalance ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Compact Actions Grid */}
      <div className="flex justify-between gap-3 px-6 mb-6">
        <CompactAction 
          icon={Icons.Send} 
          label="Send" 
          disabled={!walletActivated || !airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
          onClick={() => setShowSendModal(true)} 
        />
        <CompactAction 
          icon={Icons.Copy} 
          label="Receive" 
          disabled={!walletActivated}
          onClick={handleShowReceiveModal} 
          variant="zinc" 
        />
        <CompactAction 
          icon={Icons.Store}
          label="Market" 
          disabled={!walletActivated || !airdropBalance || (airdropBalance.staked_balance || 0) <= 0} 
          onClick={() => setShowSaleModal(true)} 
          variant={(walletActivated && airdropBalance && (airdropBalance.staked_balance || 0) > 0) ? "green" : "zinc"}
          badge={(walletActivated && airdropBalance && (airdropBalance.staked_balance || 0) > 0)}
        />
        <CompactAction 
          icon={Icons.Boost}
          label="Stake" 
          disabled={!walletActivated || !airdropBalance || (airdropBalance.available_balance || 0) <= 0} 
          onClick={() => setShowStakeModal(true)}
          variant="blue"
        />
      </div>

      {/* Tab Modal Section */}
      <section className="px-6 mb-6">
        <div className="flex items-center gap-6 mb-5 px-1 border-b border-white/[0.04]">
          <button 
            onClick={() => setActiveTab('assets')}
            className={`pb-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${
              activeTab === 'assets' ? 'text-green-500' : 'text-zinc-500'
            }`}
          >
            Assets
            {activeTab === 'assets' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${
              activeTab === 'history' ? 'text-green-500' : 'text-zinc-500'
            }`}
          >
            History
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            )}
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'assets' ? (
            <>
              <div className={`${GLASS_EFFECT} p-5 rounded-[24px] mb-4 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center justify-center text-green-400">
                    <Icons.Wallet size={18} />
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Wallet Balance</div>
                    <div className="text-sm font-mono font-bold text-white">
                      {airdropBalance ? (airdropBalance.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'} RZC
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-500/10 text-green-400 text-[8px] font-black uppercase tracking-widest rounded-lg">
                  Available
                </div>
              </div>

              {/* TON Balance Card */}
              {actualTonAddress && (
                <div className={`${GLASS_EFFECT} p-5 rounded-[24px] mb-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                      <Icons.Energy size={18} />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">TON Balance</div>
                      <div className="text-sm font-mono font-bold text-white">
                        {isLoadingBalance ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                            <span>Loading...</span>
                          </div>
                        ) : (
                          `${walletBalance.toFixed(4)} TON`
                        )}
                      </div>
                      <div className="text-[8px] text-zinc-600 font-mono mt-1">
                        ≈ ${(walletBalance * tonPrice).toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-lg">
                      Native
                    </div>
                    <button
                      onClick={fetchWalletBalance}
                      className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                      disabled={isLoadingBalance}
                    >
                      <Icons.Refresh size={12} className={isLoadingBalance ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              )}

              {airdropBalance && airdropBalance.staked_balance > 0 && (
                <div className={`${GLASS_EFFECT} p-5 rounded-[24px] mb-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                      <Icons.Boost size={18} />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Staked Balance</div>
                      <div className="text-sm font-mono font-bold text-white">
                        {(airdropBalance.staked_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} RZC
                      </div>
                      {stakingLocksSummary && stakingLocksSummary.activeLocks > 0 && (
                        <div className="text-[8px] text-zinc-500 mt-1">
                          {stakingLocksSummary.totalLocked > 0 && (
                            <span className="text-red-400">
                              {stakingLocksSummary.totalLocked.toLocaleString()} locked
                            </span>
                          )}
                          {stakingLocksSummary.totalLocked > 0 && stakingLocksSummary.totalUnlocked > 0 && (
                            <span className="text-zinc-600"> • </span>
                          )}
                          {stakingLocksSummary.totalUnlocked > 0 && (
                            <span className="text-green-400">
                              {stakingLocksSummary.totalUnlocked.toLocaleString()} unlocked
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-blue-400 animate-pulse">
                      <Icons.Check size={12} />
                      <span className="text-[8px] font-black uppercase">Staking</span>
                    </div>
                    <button
                      onClick={() => setShowUnstakeModal(true)}
                      disabled={stakingLocksSummary && stakingLocksSummary.totalUnlocked <= 0}
                      className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-colors border ${
                        stakingLocksSummary && stakingLocksSummary.totalUnlocked <= 0
                          ? 'bg-zinc-800/50 text-zinc-600 border-zinc-700/50 cursor-not-allowed'
                          : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                      }`}
                    >
                      {stakingLocksSummary && stakingLocksSummary.totalUnlocked <= 0 ? 'Locked' : 'Unstake'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {/* Show Activities */}
              {isLoadingActivities ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-2"></div>
                  <div className="text-zinc-600 text-[8px] uppercase font-bold tracking-widest">Loading Activities</div>
                </div>
              ) : activities.length > 0 ? (
                <>
                  <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">Recent Activities</div>
                  {activities.slice(0, 10).map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </>
              ) : null}
              
              {/* Show Transfer History */}
              {transferHistory.length > 0 ? (
                <>
                  <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 mt-4">Transfer History</div>
                  {transferHistory.map(tx => (
                    <RegistryItem key={tx.id} tx={tx} currentUserId={userId} />
                  ))}
                </>
              ) : null}
              
              {/* Empty State */}
              {!isLoadingActivities && activities.length === 0 && transferHistory.length === 0 && (
                <div className="py-12 text-center text-zinc-800 text-[10px] font-black uppercase tracking-[0.5em] italic">
                  No activity recorded
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* TON Gateway Preview */}
      {actualTonAddress && (
        <section className="px-6 mb-6">
          <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Icons.Energy size={14} />
              </div>
              <div>
                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">TON Gateway Link</div>
                <div className="text-[10px] font-mono text-zinc-400">{actualTonAddress.slice(0, 10)}...{actualTonAddress.slice(-6)}</div>
              </div>
            </div>
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(actualTonAddress); 
                showSnackbar?.({ message: 'Address Copied', type: 'info' }); 
              }} 
              className="p-2 text-zinc-600 hover:text-white transition-colors"
            >
              <Icons.Copy size={14} />
            </button>
          </div>
        </section>
      )}

      {/* Enhanced Professional Onboarding Tutorial */}
      <div className="hidden px-6 mb-6">
        <div className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/[0.12] rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/2 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            {/* Professional Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  readinessProgress === 5 
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30' 
                    : 'bg-gradient-to-br from-white/10 to-white/5 text-zinc-400 border border-white/10'
                }`}>
                  {readinessProgress === 5 ? (
                    <Icons.Check size={20} strokeWidth={2.5} />
                  ) : (
                    <Icons.Energy size={20} strokeWidth={2} />
                  )}
                </div>
                <div>
                  <h4 className="text-white text-lg font-bold tracking-tight">
                    {readinessProgress === 5 ? 'Protocol Ready!' : 'Network Onboarding'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                      {readinessProgress}/5 Protocols Active
                    </span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
                    <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">
                      {Math.round((readinessProgress / 5) * 100)}% Complete
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Progress Ring */}
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background ring */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="2"
                  />
                  {/* Progress ring with gradient */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="2.5"
                    strokeDasharray={`${(readinessProgress / 5) * 100}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: readinessProgress === 5 ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'none'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold transition-colors duration-500 ${
                    readinessProgress === 5 ? 'text-green-400' : 'text-white'
                  }`}>
                    {Math.round((readinessProgress / 5) * 100)}%
                  </span>
                </div>
                
                {/* SVG Gradient Definition */}
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Enhanced Steps Grid */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {sequenceItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                    item.done 
                      ? 'bg-gradient-to-r from-green-500/8 to-green-600/5 border border-green-500/20' 
                      : 'bg-white/[0.02] border border-white/[0.06] opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    item.done 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-white/10 text-zinc-600 border border-white/10'
                  }`}>
                    {item.done ? (
                      <Icons.Check size={16} strokeWidth={2.5} />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold transition-colors duration-300 ${
                        item.done ? 'text-white' : 'text-zinc-500'
                      }`}>
                        {item.label}
                      </span>
                      {item.done && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                      )}
                    </div>
                    <span className={`text-xs transition-colors duration-300 ${
                      item.done ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>
                      {item.sub}
                    </span>
                  </div>
                  
                  <div className={`transition-all duration-300 ${
                    item.done ? 'opacity-100' : 'opacity-30'
                  }`}>
                    <item.icon size={16} className={item.done ? 'text-green-400' : 'text-zinc-600'} />
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Next Step Guide */}
            {readinessProgress < 5 && (
              <div className="p-4 bg-gradient-to-r from-blue-500/8 to-purple-500/8 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Icons.Energy size={12} className="text-blue-400" />
                  </div>
                  <span className="text-blue-300 text-sm font-bold">Next Protocol</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {(() => {
                    const nextStep = sequenceItems.find(item => !item.done);
                    if (!nextStep) return "All protocols activated!";
                    
                    switch (nextStep.label) {
                      case 'Asset Verification':
                        return 'Initialize your mining session to begin earning RZC tokens and verify your first assets.';
                      case 'Secure Migration':
                        return 'Click "Manage" on your wallet balance to migrate earned tokens to your secure hub.';
                      case 'Network Identity':
                        return 'Your unique sponsor code will be automatically generated upon first interaction.';
                      case 'Stake Commitment':
                        return 'Use the "Stake" button to lock 70% of your tokens for 5 years and start earning validator rewards.';
                      case 'Ecosystem Access':
                        return 'Complete staking to unlock priority access to the RhizaCore marketplace.';
                      default:
                        return 'Continue following the protocol sequence above to complete onboarding.';
                    }
                  })()}
                </p>
              </div>
            )}

            {/* Completion Celebration */}
            {readinessProgress === 5 && (
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-green-500/30 flex items-center justify-center">
                    <Icons.Check size={12} className="text-green-400" />
                  </div>
                  <span className="text-green-300 text-sm font-bold">Protocol Complete</span>
                  <div className="flex-1"></div>
                  <div className="flex -space-x-1">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
                    ))}
                  </div>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Your wallet is fully integrated with the RhizaCore network. All protocols are active and you have complete access to the ecosystem, including staking rewards, governance participation, and marketplace priority access.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
          
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
            {/* Compact Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icons.Send size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">External Transfer</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Withdraw RZC to external wallet
              </p>
            </div>

            {/* Compact Balance Display */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Available</div>
              <div className="text-green-400 font-bold text-2xl font-mono">
                {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
              </div>
              <div className="text-[9px] text-zinc-600 font-mono mt-1">RZC</div>
            </div>

            {/* Compact Form */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
                  Amount
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0000"
                  step="0.0001"
                  min="0"
                  max={airdropBalance?.available_balance || 0}
                  className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-green-500/50 focus:outline-none pr-16"
                />
                <button
                  onClick={() => setWithdrawAmount((airdropBalance?.available_balance || 0).toString())}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400 text-[8px] font-bold uppercase tracking-widest hover:text-green-300"
                >
                  MAX
                </button>
              </div>
              
              <div className="relative">
                <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
                  Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
                  Network
                </label>
                <select
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm focus:border-green-500/50 focus:outline-none"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="bsc">BSC</option>
                </select>
              </div>
            </div>

            {/* Smart Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                  setWithdrawAddress('');
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleWithdrawFromAirdrop}
                disabled={isProcessingWithdraw || !withdrawAmount || !withdrawAddress}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {isProcessingWithdraw ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing</span>
                  </div>
                ) : (
                  'Withdraw'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* StakingComponent */}
      {showStakeModal && (
        <StakingComponent
          userId={userId}
          airdropBalance={airdropBalance}
          onClose={() => setShowStakeModal(false)}
          onStakeComplete={() => {
            loadAirdropBalance();
            loadStakingLocksSummary();
            loadActivities();
          }}
          showSnackbar={showSnackbar}
        />
      )}

      {/* RhizaCore Sale Component */}
      {showSaleModal && (
        <RhizaCoreSaleComponent
          tonPrice={tonPrice}
          tonAddress={actualTonAddress}
          showSnackbar={showSnackbar}
          onClose={() => setShowSaleModal(false)}
        />
      )}

      {/* Compact Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-sm" onClick={() => setShowSendModal(false)}></div>
          
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
            {/* Compact Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icons.Send size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Send RZC</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transfer to username or Telegram ID
              </p>
            </div>

            {/* Compact Balance Display */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Available</div>
              <div className="text-green-400 font-bold text-2xl font-mono">
                {airdropBalance ? (airdropBalance.available_balance || 0).toFixed(4) : '0.0000'}
              </div>
              <div className="text-[9px] text-zinc-600 font-mono mt-1">RZC</div>
            </div>

            {/* Compact Send Form */}
            <div className="space-y-4 mb-6">
              {/* Recipient Search */}
              <div className="relative">
                <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
                  Recipient
                </label>
                {selectedRecipient ? (
                  <div className="h-12 bg-white/[0.04] border border-green-500/30 rounded-2xl px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 text-xs font-bold">
                          {(selectedRecipient.username || selectedRecipient.display_name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="text-white text-sm font-medium">
                        @{selectedRecipient.username || selectedRecipient.display_name || 'Unknown'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRecipient(null);
                        setUserSearchQuery('');
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <Icons.Copy size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search username or ID..."
                      className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl max-h-32 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSelectedRecipient(user);
                              setUserSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="w-full p-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                          >
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-400 text-xs font-bold">
                                {(user.username || user.display_name || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">
                                @{user.username || user.display_name || 'Unknown'}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {user.telegram_id ? `Telegram: ${user.telegram_id}` : `ID: ${user.id}`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Amount */}
              <div className="relative">
                <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
                  Amount
                </label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0000"
                  step="0.0001"
                  min="0"
                  max={airdropBalance?.available_balance || 0}
                  className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm font-mono placeholder-gray-500 focus:border-green-500/50 focus:outline-none pr-16"
                />
                <button
                  onClick={() => setSendAmount((airdropBalance?.available_balance || 0).toString())}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400 text-[8px] font-bold uppercase tracking-widest hover:text-green-300"
                >
                  MAX
                </button>
              </div>

              {/* Message */}
              <div className="relative">
                <label className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-widest z-10">
                  Message (Optional)
                </label>
                <input
                  type="text"
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  placeholder="Add a message..."
                  maxLength={100}
                  className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-white text-sm placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Smart Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowSendModal(false);
                  setSendAmount('');
                  setSendMessage('');
                  setSelectedRecipient(null);
                  setUserSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendRZC}
                disabled={isProcessingSend || !selectedRecipient || !sendAmount}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {isProcessingSend ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending</span>
                  </div>
                ) : (
                  'Send RZC'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Unstake Modal - Protocol Style with Lock Enforcement */}
      {showUnstakeModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-400">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setShowUnstakeModal(false)}></div>
          
          <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-3xl">
            {/* Protocol-themed Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/10 text-yellow-400 shadow-inner">
                <Icons.Boost size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Unstake RZC</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Return staked tokens to available balance</p>
            </div>

            {/* Professional Balance Breakdown */}
            <div className="bg-zinc-900/40 rounded-2xl p-6 border border-white/[0.05] space-y-4 mb-6 shadow-inner">
              <div className="text-center mb-4">
                <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-2">Currently Staked</div>
                <div className="text-yellow-400 text-2xl font-bold font-mono">
                  {airdropBalance ? (airdropBalance.staked_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'} RZC
                </div>
              </div>
              
              {/* Lock Status Information */}
              {stakingLocksSummary && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Total Locked</span>
                    <span className="text-red-400 font-bold font-mono text-sm">
                      {stakingLocksSummary.totalLocked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RZC
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Available to Unstake</span>
                    <span className="text-green-500 font-bold font-mono text-sm">
                      {stakingLocksSummary.totalUnlocked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RZC
                    </span>
                  </div>
                  <div className="h-px bg-white/[0.03] w-full"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Active Locks</span>
                    <span className="text-white font-bold text-sm">
                      {stakingLocksSummary.activeLocks}
                    </span>
                  </div>
                  
                  {stakingLocksSummary.nextUnlockDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Next Unlock</span>
                      <span className="text-blue-400 font-bold text-sm">
                        {new Date(stakingLocksSummary.nextUnlockDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Lock Details */}
              {stakingLocksSummary && stakingLocksSummary.lockDetails.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest mb-2">Lock Details</div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {stakingLocksSummary.lockDetails.map((lock: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        lock.isLocked 
                          ? 'bg-red-500/5 border-red-500/20' 
                          : 'bg-green-500/5 border-green-500/20'
                      }`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white text-xs font-bold">
                            {lock.amount.toLocaleString()} RZC
                          </span>
                          <span className={`text-xs font-bold ${
                            lock.isLocked ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {lock.timeRemaining}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 text-[8px]">
                            {lock.lockPeriodYears}y @ {lock.apyRate}% APY
                          </span>
                          <span className="text-zinc-400 text-[8px]">
                            {new Date(lock.unlockDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Warning for locked tokens */}
              {stakingLocksSummary && stakingLocksSummary.totalLocked > 0 && (
                <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icons.Lock size={12} className="text-red-400" />
                    <span className="text-red-300 text-xs font-bold">Lock Period Active</span>
                  </div>
                  <div className="text-zinc-400 text-xs">
                    {stakingLocksSummary.totalLocked.toLocaleString()} RZC is locked and cannot be unstaked until the lock period expires. 
                    Only {stakingLocksSummary.totalUnlocked.toLocaleString()} RZC is available for unstaking.
                  </div>
                </div>
              )}
              
              {/* Success message for unlocked tokens */}
              {stakingLocksSummary && stakingLocksSummary.totalUnlocked > 0 && (
                <div className="mt-4 p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icons.Check size={12} className="text-green-400" />
                    <span className="text-green-300 text-xs font-bold">Available for Unstaking</span>
                  </div>
                  <div className="text-zinc-400 text-xs">
                    {stakingLocksSummary.totalUnlocked.toLocaleString()} RZC has completed its lock period and can be unstaked immediately.
                  </div>
                </div>
              )}
            </div>

            {/* Protocol Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowUnstakeModal(false)} 
                className="flex-1 h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnstakeAirdropBalance} 
                disabled={
                  isProcessingUnstake || 
                  !airdropBalance || 
                  (airdropBalance.staked_balance || 0) <= 0 ||
                  (stakingLocksSummary && stakingLocksSummary.totalUnlocked <= 0)
                } 
                className="flex-1 h-12 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessingUnstake ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Unstaking...</span>
                  </div>
                ) : stakingLocksSummary && stakingLocksSummary.totalUnlocked > 0 ? (
                  `Unstake ${stakingLocksSummary.totalUnlocked.toLocaleString()}`
                ) : (
                  'All Tokens Locked'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Tabbed Receive Modal - Identity & Address */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 pb-24 md:pb-4 animate-in fade-in slide-in-from-bottom-8 md:zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowReceiveModal(false)}></div>
          
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
            {/* Header
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10">
                <Icons.Copy size={20} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Receive</h3>
              <p className="text-zinc-500 text-sm">Share your payment details</p>
            </div> */}

            {/* Tab Navigation */}
            <div className="flex bg-zinc-900/50 rounded-2xl p-1 mb-6">
              <button
                onClick={() => setReceiveTab('identity')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  receiveTab === 'identity'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icons.Rank size={16} />
                  <span>Identity</span>
                </div>
              </button>
              <button
                onClick={() => setReceiveTab('address')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  receiveTab === 'address'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icons.Wallet size={16} />
                  <span>Address</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="mb-6">
              {receiveTab === 'identity' ? (
                /* RZC Protocol Identity Tab */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                      <Icons.Rank size={32} className="text-green-400" />
                    </div>
                    <div className="text-green-400 text-lg font-bold mb-1">RZC Protocol</div>
                    <div className="text-zinc-400 text-sm">Network Identity</div>
                  </div>

                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Username</span>
                      <span className="text-white font-mono text-lg">@{userUsername}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">User ID</span>
                      <span className="text-green-400 font-mono text-lg">#{userId}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`@${userUsername} #${userId}`);
                      showSnackbar?.({ message: 'RZC Identity Copied', description: 'Share this for RZC transfers' });
                    }}
                    className="w-full py-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-2xl text-green-400 font-bold transition-all flex items-center justify-center gap-3"
                  >
                    <Icons.Copy size={18} />
                    Copy RZC Identity
                  </button>

                  <div className="text-center text-zinc-500 text-xs">
                    Share your username and ID for RZC Protocol transfers
                  </div>
                </div>
              ) : (
                /* TON Address Tab */
                <div className="space-y-4">
                  {actualTonAddress ? (
                    <>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                          <Icons.Wallet size={32} className="text-blue-400" />
                        </div>
                        <div className="text-blue-400 text-lg font-bold mb-1">TON Wallet</div>
                        <div className="text-zinc-400 text-sm">{wallet?.device?.appName || 'Connected'}</div>
                      </div>

                      {/* QR Code */}
                      <div className="bg-white p-4 rounded-2xl mx-auto w-fit">
                        {qrCodeSvg ? (
                          <div 
                            className="w-32 h-32"
                            dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                          />
                        ) : (
                          <div className="w-32 h-32 bg-zinc-100 rounded-xl flex items-center justify-center">
                            <div className="text-zinc-600 text-xs">Loading...</div>
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                        <div className="text-zinc-400 text-xs mb-2 uppercase tracking-wider">TON Address</div>
                        <div className="text-white font-mono text-sm break-all leading-relaxed mb-3">
                          {actualTonAddress}
                        </div>
                        <button
                          onClick={() => handleCopyTonAddress(actualTonAddress)}
                          className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Icons.Copy size={16} />
                          Copy Address
                        </button>
                      </div>

                      <div className="text-center text-zinc-500 text-xs">
                        Scan QR code or copy address for TON payments
                      </div>
                    </>
                  ) : (
                    /* No Wallet Connected */
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icons.Wallet size={24} className="text-zinc-600" />
                      </div>
                      <div className="text-white font-bold mb-2">No TON Wallet</div>
                      <div className="text-zinc-500 text-sm mb-4">Connect your wallet to receive TON</div>
                      <div className="text-zinc-600 text-xs">Use the Identity tab for RZC transfers</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setShowReceiveModal(false)} 
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom styles for TonConnectButton */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .ton-connect-button-custom {
            --tc-bg-color: #3b82f6;
            --tc-bg-color-hover: #2563eb;
            --tc-text-color: #ffffff;
            --tc-border-radius: 8px;
            --tc-font-size: 12px;
            --tc-font-weight: 600;
            --tc-padding: 8px 16px;
            --tc-min-height: 32px;
          }
          
          .ton-connect-button-custom button {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            border: 1px solid rgba(59, 130, 246, 0.3) !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            padding: 8px 16px !important;
            border-radius: 8px !important;
            min-height: 32px !important;
            transition: all 0.2s ease !important;
            white-space: nowrap !important;
          }
          
          .ton-connect-button-custom button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
          }

          /* Disconnect button styling */
          .ton-connect-button-custom button[data-tc-connected="true"] {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
            border: 1px solid rgba(239, 68, 68, 0.3) !important;
          }
          
          .ton-connect-button-custom button[data-tc-connected="true"]:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
          }

          /* Enhanced shadow for protocol modals */
          .shadow-3xl {
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 1), 0 0 40px -10px rgba(34, 197, 94, 0.05);
          }

          /* Custom scrollbar for protocol modals */
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(34, 197, 94, 0.3);
            border-radius: 2px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 197, 94, 0.5);
          }

          /* Shimmer animation for progress bar */
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `
      }} />
    </div>
  );
});

export default NativeWalletUI;