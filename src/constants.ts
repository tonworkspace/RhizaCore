import { Token } from './types';
import { ChainType } from './components/ChainSelector';

export const MOCK_TOKENS: Token[] = [
  {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    balance: 1250.75,
    price: 2.45,
    change24h: 2.45,
    icon: '💎',
    chain: ChainType.TON,
    verified: true
  },
  {
    id: 'usdt',
    name: 'Tether USD',
    symbol: 'USDT',
    balance: 500.00,
    price: 1.00,
    change24h: -0.01,
    icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    chain: ChainType.TON,
    verified: true
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    balance: 750.25,
    price: 1.00,
    change24h: 0.02,
    icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    chain: ChainType.TON,
    verified: true
  },
  {
    id: 'not',
    name: 'Notcoin',
    symbol: 'NOT',
    balance: 10000.00,
    price: 0.012,
    change24h: -5.23,
    icon: 'https://assets.coingecko.com/coins/images/33453/small/Notcoin.png',
    chain: ChainType.TON,
    verified: true
  },
  {
    id: 'jwallet',
    name: 'JWallet',
    symbol: 'JW',
    balance: 2500.50,
    price: 0.85,
    change24h: 12.34,
    chain: ChainType.TON,
    verified: false
  }
];
