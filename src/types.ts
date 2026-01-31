export interface SnackbarData {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export type TabView = 'wallet' | 'swap' | 'earn' | 'profile';

export interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  price: number;
  change24h: number;
  icon: string;
  chain: any;
  verified: boolean;
}

export type BottomTab = 'Mining' | 'Task' | 'Wallet' | 'Friends' | 'More';

export type TopTab = 'Mining' | 'Boost' | 'Rank';

export interface MiningState {
  balance: number;
  miningBalance: number;
  validatedBalance: number;
  isMining: boolean;
  miningRatePerHour: number;
  sessionStartTime: number;
}