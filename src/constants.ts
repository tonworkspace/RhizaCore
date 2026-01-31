import { Token } from './types';
import { ChainType } from './components/ChainSelector';

// TON Network Configuration
export const TON_NETWORK = {
  MAINNET: {
    DEPOSIT_ADDRESS: 'UQDck6IU82sfLqAD1el005JcqzPwC8JSgLfOGsF_IUCyEf96',
    API_KEY: '26197ebc36a041a5546d69739da830635ed339c0d8274bdd72027ccbff4f4234',
    API_ENDPOINT: 'https://toncenter.com/api/v2/jsonRPC',
    NAME: 'Mainnet'
  },
  TESTNET: {
    DEPOSIT_ADDRESS: 'UQDck6IU82sfLqAD1el005JcqzPwC8JSgLfOGsF_IUCyEf96',
    API_KEY: 'd682d9b65115976e52f63713d6dd59567e47eaaa1dc6067fe8a89d537dd29c2c',
    API_ENDPOINT: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    NAME: 'Testnet'
  }
};

// Current network selection (toggle for testing)
export const IS_MAINNET = true;
export const CURRENT_TON_NETWORK = IS_MAINNET ? TON_NETWORK.MAINNET : TON_NETWORK.TESTNET;

// Token pricing constants
export const INITIAL_TON_PRICE = 5.42;
export const TOKEN_SEED_PRICE = 0.10;

// DEX minimum swap amounts
export const MIN_TON_SWAP = 0.1; // Minimum 0.1 TON for swaps
export const MIN_RZC_SWAP = 10;  // Minimum 10 RZC for swaps

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
  }
];
