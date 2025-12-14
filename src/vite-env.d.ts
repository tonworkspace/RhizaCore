/// <reference types="vite/client" />

declare module '@particle-network/universal-account-sdk' {
  export enum CHAIN_ID {
    ETHEREUM_MAINNET = 1,
    BASE_MAINNET = 8453,
    ARBITRUM_MAINNET_ONE = 42161,
    OPTIMISM_MAINNET = 10,
    LINEA_MAINNET = 59144,
    BSC_MAINNET = 56,
    POLYGON_MAINNET = 137,
    AVALANCHE_MAINNET = 43114,
    BLAST_MAINNET = 81457,
    MANTA_MAINNET = 169,
    MODE_MAINNET = 34443,
    SONIC_MAINNET = 146,
    CONFLUX_ESPACE_MAINNET = 1030,
    BERACHAIN_MAINNET = 80094,
    MERLIN_MAINNET = 4200,
    SOLANA_MAINNET = 101
  }
  export enum SUPPORTED_TOKEN_TYPE {
    ETH = "eth",
    USDT = "usdt",
    USDC = "usdc",
    BTC = "btc",
    BNB = "bnb",
    SOL = "sol"
  }
  export interface IAssetsResponse {
    assets: any[];
    totalAmountInUSD: number;
  }
  export class UniversalAccount {
    constructor(config: any);
    getPrimaryAssets(): Promise<IAssetsResponse>;
    getSmartAccountOptions(): Promise<any>;
    createUniversalTransaction(payload: any): Promise<any>;
    sendTransaction(transaction: any, signature: string): Promise<any>;
    createBuyTransaction(payload: any): Promise<any>;
  }
}
