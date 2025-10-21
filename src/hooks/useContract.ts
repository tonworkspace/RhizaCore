import { Address, beginCell, toNano } from 'ton-core';
import { TonClient } from 'ton';
import { TonConnectUI } from '@tonconnect/ui';
import { Blockchain } from "@ton/sandbox";

// Define types for our miner stats
interface MinerStats {
  name: string;
  level: number;
  levelTitle: string;
  miningRate: number;
  pickaxePower: number;
  minerals: number;
  maxStorage: number;
}

// Define type for level requirements
interface LevelRequirement {
  nextLevel: number;
  cost: string;
  costString: string;
}

// Define operation codes for contract interactions
const OP_CODES = {
  MINE: 1,
  UPGRADE_MINER: 2,
  SELL_MINERALS: 3,
  SET_MINER_NAME: 4,
  UPGRADE_STORAGE: 5,
  UPGRADE_PICKAXE: 6,
  COLLECT: 7,
  UPDATE_COMMISSION: 8
};

// Network configuration
const isMainnet = false; // You can toggle this for testing

// Contract addresses for different networks
const MAINNET_CONTRACT_ADDRESS = 'EQA...'; // Replace with your mainnet contract address
const TESTNET_CONTRACT_ADDRESS = 'EQDVgXOZeAz9Py5vQmXmRHH09tgy3nWPwh7fALJ1qkYSSyIz'; // Replace with your testnet contract address

// API keys for different networks
const MAINNET_API_KEY = '509fc324e5a26df719b2e637cad9f34fd7c3576455b707522ce8319d8b450441';
const TESTNET_API_KEY = 'bb31868e5cf6529efb16bcf547beb3c534a28d1e139bd63356fd936c168fe662';

export class MiningGameClient {
  private client!: TonClient; // Add definite assignment assertion
  private isTestnet: boolean;
  private blockchain?: Blockchain; // Add sandbox blockchain instance

  constructor(forceTestnet = false, useSandbox = false) {
    // Allow forcing testnet mode regardless of isMainnet setting
    this.isTestnet = forceTestnet ? true : !isMainnet;
    
    if (useSandbox) {
      // Initialize sandbox blockchain (async, will be set later)
      this.initSandbox();
    } else {
      this.client = new TonClient({
        endpoint: !this.isTestnet 
          ? 'https://toncenter.com/api/v2/jsonRPC'
          : 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: !this.isTestnet ? MAINNET_API_KEY : TESTNET_API_KEY
      });
    }
  }

  // Initialize sandbox blockchain
  private async initSandbox() {
    this.blockchain = await Blockchain.create();
    // You might want to deploy your contract to the sandbox here
    // or provide a method to do so
  }

  // Check if using sandbox
  isUsingSandbox(): boolean {
    return !!this.blockchain;
  }

  // Get contract address
  getAddress(): Address {
    const address = this.isTestnet 
      ? TESTNET_CONTRACT_ADDRESS 
      : MAINNET_CONTRACT_ADDRESS;
    
    return Address.parse(address);
  }

  // Get network name
  getNetworkName(): string {
    return this.isTestnet ? 'Testnet' : 'Mainnet';
  }
  
  // Is using testnet?
  isUsingTestnet(): boolean {
    return this.isTestnet;
  }
  
  // Is using mainnet?
  isUsingMainnet(): boolean {
    return !this.isTestnet;
  }

  // Get miner stats
  async getMinerStats(): Promise<MinerStats> {
    if (this.blockchain) {
      // Use sandbox blockchain for testing
      // You'll need to implement sandbox-specific logic here
      // This is a placeholder implementation
      return {
        name: "Sandbox Miner",
        level: 1,
        levelTitle: "Novice",
        miningRate: 10,
        pickaxePower: 1,
        minerals: 0,
        maxStorage: 100
      };
    }
    
    const result = await this.client.callGetMethod(
      this.getAddress(),
      'miner_stats'
    );
    
    // Parse the result based on your contract's return structure
    const stack = result.stack;
    return {
      name: stack.readString(), // String
      level: stack.readNumber(), // Int
      levelTitle: stack.readString(), // String
      miningRate: stack.readNumber(), // Int
      pickaxePower: stack.readNumber(), // Int
      minerals: stack.readNumber(), // Int
      maxStorage: stack.readNumber() // Int
    };
  }

  // Get next level requirements
  async getNextLevelRequirement(): Promise<LevelRequirement> {
    const result = await this.client.runMethod(
      this.getAddress(),
      'next_level_requirement'
    );
    
    const stack = result.stack;
    return {
      nextLevel: stack.readNumber(),
      cost: stack.readBigNumber().toString(),
      costString: stack.readString()
    };
  }

  // Get total minerals (including uncollected)
  async getTotalMinerals(): Promise<number> {
    const result = await this.client.runMethod(
      this.getAddress(),
      'total_minerals'
    );
    return result.stack.readNumber();
  }

  // Get collected minerals only
  async getCollectedMinerals(): Promise<number> {
    const result = await this.client.runMethod(
      this.getAddress(),
      'collected_minerals'
    );
    return result.stack.readNumber();
  }

  // Get uncollected minerals
  async getUncollectedMinerals(): Promise<number> {
    const result = await this.client.runMethod(
      this.getAddress(),
      'uncollected_minerals'
    );
    return result.stack.readNumber();
  }

  // Get storage capacity
  async getStorageCapacity(): Promise<number> {
    const result = await this.client.runMethod(
      this.getAddress(),
      'storage_capacity'
    );
    return result.stack.readNumber();
  }

  // Get storage fullness percentage
  async getStorageFullness(): Promise<number> {
    const result = await this.client.runMethod(
      this.getAddress(),
      'storage_fullness'
    );
    return result.stack.readNumber();
  }

  // Mine manually
  async mine(connector: TonConnectUI): Promise<any> {
    if (this.blockchain) {
      // Sandbox implementation
      console.log("Mining in sandbox mode");
      // Implement sandbox-specific mining logic
      return { success: true, sandbox: true };
    }
    
    const message = beginCell()
      .storeUint(OP_CODES.MINE, 32) // op code for mine
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60, // Valid for 60 seconds
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano('0.50').toString(), // 0.50 TON for mining
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }

  // Upgrade miner
  async upgradeMiner(connector: TonConnectUI, level: number): Promise<any> {
    let upgradeCost: string;
    switch(level) {
      case 1: upgradeCost = '0.2'; break;
      case 2: upgradeCost = '0.5'; break;
      case 3: upgradeCost = '1.0'; break;
      case 4: upgradeCost = '2.0'; break;
      default: upgradeCost = '5.0';
    }
    
    const message = beginCell()
      .storeUint(OP_CODES.UPGRADE_MINER, 32) // op code for upgrade_miner
      .storeUint(level, 8) // Store the target level
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano(upgradeCost).toString(),
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }

  // Sell minerals
  async sellMinerals(connector: TonConnectUI): Promise<any> {
    const message = beginCell()
      .storeUint(OP_CODES.SELL_MINERALS, 32) // op code for sell
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano('0.50').toString(),
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }

  // Set miner name
  async setMinerName(connector: TonConnectUI, name: string): Promise<any> {
    const message = beginCell()
      .storeUint(OP_CODES.SET_MINER_NAME, 32) // op code for set_name
      .storeStringTail(name)
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano('0.50').toString(),
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }

  // Upgrade storage
  async upgradeStorage(connector: TonConnectUI): Promise<any> {
    const message = beginCell()
      .storeUint(OP_CODES.UPGRADE_STORAGE, 32) // op code for upgrade_storage
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano('0.1').toString(), // 0.1 TON for storage upgrade
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }

  // Upgrade pickaxe
  async upgradePickaxe(connector: TonConnectUI): Promise<any> {
    const message = beginCell()
      .storeUint(OP_CODES.UPGRADE_PICKAXE, 32) // op code for upgrade_pickaxe
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano('0.1').toString(), // 0.1 TON for pickaxe upgrade
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }

  // Collect idle minerals
  async collectMinerals(connector: TonConnectUI): Promise<any> {
    const message = beginCell()
      .storeUint(OP_CODES.COLLECT, 32) // op code for collect
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano('0.50').toString(),
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }

  // Update commission rate (owner only)
  async updateCommission(connector: TonConnectUI, rate: number): Promise<any> {
    const message = beginCell()
      .storeUint(OP_CODES.UPDATE_COMMISSION, 32) // op code for update_commission
      .storeUint(rate, 8) // Store the new rate (0-30)
      .endCell();
      
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: this.getAddress().toString(),
          amount: toNano('0.50').toString(),
          payload: message.toBoc().toString('base64')
        }
      ]
    };
    
    return connector.sendTransaction(transaction);
  }
}