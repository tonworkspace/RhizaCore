export type TabView = 'wallet' | 'swap' | 'earn' | 'profile';

export type BottomTab = 'Mining' | 'Task' | 'Wallet' | 'Core' | 'More';

export type ChainType = 'ton' | 'ethereum' | 'solana';

export interface ChainInfo {
  id: ChainType;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  connected: boolean;
  balance: string;
  usdValue: number;
  address?: string;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  price: number;
  change24h: number;
  icon?: string;
  chain: ChainType;
  verified: boolean;
}

export interface WalletState {
  address: string | null;
  totalBalanceUsd: number;
  isConnected: boolean;
  chain: ChainType;
}



export type TopTab = 'Mining' | 'Boost' | 'Rank' | 'Activity';

export interface MiningState {
  isMining: boolean;
  // Balances
  balance: number; // Total available (claimable + accumulated)
  miningBalance: number; // Currently accumulating in session
  validatedBalance: number; // Already claimed/safe
  // Rates & Time
  miningRatePerHour: number;
  sessionStartTime: number; // Timestamp
  sessionEndTime: number; // Timestamp
  // Limits
  maxSessionDuration: number; // e.g., 24 or 48 hours
  // User Info
  referralCode: string | null;
  streak: number;
}

export interface MiningActions {
  startMining: () => Promise<void>;
  claimRewards: () => Promise<void>;
  purchaseUpgrade: (type: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
}