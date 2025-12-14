export type TabView = 'wallet' | 'swap' | 'earn' | 'profile';

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
