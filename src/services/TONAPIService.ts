import { supabase } from '../lib/supabaseClient';

// Network configuration
const MAINNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';
const TESTNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';

// API Keys for both networks
const MAINNET_API_KEY = '26197ebc36a041a5546d69739da830635ed339c0d8274bdd72027ccbff4f4234';
const TESTNET_API_KEY = 'd682d9b65115976e52f63713d6dd59567e47eaaa1dc6067fe8a89d537dd29c2c';

// Network selection - can be toggled for testing
const isMainnet = true; // Set to false for testnet

// Derived constants
const DEPOSIT_ADDRESS = isMainnet ? MAINNET_DEPOSIT_ADDRESS : TESTNET_DEPOSIT_ADDRESS;
const API_KEY = isMainnet ? MAINNET_API_KEY : TESTNET_API_KEY;
const NETWORK_NAME = isMainnet ? 'Mainnet' : 'Testnet';
const API_ENDPOINT = isMainnet 
  ? 'https://toncenter.com/api/v2/jsonRPC'
  : 'https://testnet.toncenter.com/api/v2/jsonRPC';

// Types
export interface TONTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  fee: string;
  timestamp: number;
  confirmed: boolean;
}

export interface DepositRecord {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  transaction_hash?: string;
  created_at: string;
  confirmed_at?: string;
}

// Initialize TonWeb (you'll need to install tonweb: npm install tonweb)
let tonweb: any = null;

const initializeTonWeb = async () => {
  if (tonweb) return tonweb;
  
  try {
    // Dynamic import to avoid SSR issues
    const TonWeb = (await import('tonweb')).default;
    
    tonweb = isMainnet 
      ? new TonWeb(new TonWeb.HttpProvider(API_ENDPOINT, { apiKey: API_KEY }))
      : new TonWeb(new TonWeb.HttpProvider(API_ENDPOINT, { apiKey: API_KEY }));
    
    return tonweb;
  } catch (error) {
    console.error('Failed to initialize TonWeb:', error);
    throw new Error('TON API initialization failed');
  }
};

// Helper function to generate unique deposit ID
const generateUniqueId = async (): Promise<number> => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    // Generate a random ID between 1 and 999999
    const id = Math.floor(Math.random() * 999999) + 1;
    
    // Check if ID exists
    const { error } = await supabase
      .from('deposits')
      .select('id')
      .eq('id', id)
      .single();
    
    if (error && error.code === 'PGRST116') {  // No rows returned
      return id;  // Return as number
    }
    
    attempts++;
  }
  
  throw new Error('Could not generate unique deposit ID');
};

// Get account balance
export const getTONBalance = async (address: string): Promise<number> => {
  try {
    const tonWebInstance = await initializeTonWeb();
    const balance = await tonWebInstance.getBalance(address);
    return parseFloat(tonWebInstance.utils.fromNano(balance));
  } catch (error) {
    console.error('Error fetching TON balance:', error);
    throw new Error('Failed to fetch TON balance');
  }
};

// Get transaction history
export const getTransactionHistory = async (
  address: string, 
  limit: number = 10
): Promise<TONTransaction[]> => {
  try {
    const tonWebInstance = await initializeTonWeb();
    const transactions = await tonWebInstance.getTransactions(address, limit);
    
    return transactions.map((tx: any) => ({
      hash: tx.transaction_id.hash,
      from: tx.in_msg?.source || '',
      to: tx.in_msg?.destination || address,
      value: tonWebInstance.utils.fromNano(tx.in_msg?.value || '0'),
      fee: tonWebInstance.utils.fromNano(tx.fee || '0'),
      timestamp: tx.utime * 1000,
      confirmed: true
    }));
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw new Error('Failed to fetch transaction history');
  }
};

// Monitor deposits to the deposit address
export const monitorDeposits = async (): Promise<TONTransaction[]> => {
  try {
    const transactions = await getTransactionHistory(DEPOSIT_ADDRESS, 50);
    
    // Filter for incoming transactions only
    const deposits = transactions.filter(tx => 
      tx.to === DEPOSIT_ADDRESS && 
      parseFloat(tx.value) > 0
    );
    
    return deposits;
  } catch (error) {
    console.error('Error monitoring deposits:', error);
    throw new Error('Failed to monitor deposits');
  }
};

// Create a deposit record
export const createDepositRecord = async (
  userId: number, 
  amount: number
): Promise<DepositRecord> => {
  try {
    const uniqueId = await generateUniqueId();
    
    const { data, error } = await supabase
      .from('deposits')
      .insert({
        id: uniqueId,
        user_id: userId,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating deposit record:', error);
    throw new Error('Failed to create deposit record');
  }
};

// Update deposit status
export const updateDepositStatus = async (
  depositId: number,
  status: 'confirmed' | 'failed',
  transactionHash?: string
): Promise<void> => {
  try {
    const updateData: any = {
      status,
      ...(status === 'confirmed' && { confirmed_at: new Date().toISOString() }),
      ...(transactionHash && { transaction_hash: transactionHash })
    };
    
    const { error } = await supabase
      .from('deposits')
      .update(updateData)
      .eq('id', depositId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating deposit status:', error);
    throw new Error('Failed to update deposit status');
  }
};

// Get user deposits
export const getUserDeposits = async (userId: number): Promise<DepositRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user deposits:', error);
    throw new Error('Failed to fetch user deposits');
  }
};

// Validate TON address format
export const isValidTONAddress = (address: string): boolean => {
  try {
    // Basic TON address validation
    // TON addresses are typically 48 characters long and start with UQ or EQ
    const tonAddressRegex = /^[UE]Q[A-Za-z0-9_-]{46}$/;
    return tonAddressRegex.test(address);
  } catch (error) {
    return false;
  }
};

// Get network info
export const getNetworkInfo = () => ({
  isMainnet,
  networkName: NETWORK_NAME,
  depositAddress: DEPOSIT_ADDRESS,
  apiEndpoint: API_ENDPOINT
});

// Process pending deposits (to be called periodically)
export const processPendingDeposits = async (): Promise<void> => {
  try {
    // Get all pending deposits
    const { data: pendingDeposits, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    if (!pendingDeposits || pendingDeposits.length === 0) return;
    
    // Get recent transactions to the deposit address
    const recentTransactions = await monitorDeposits();
    
    // Match pending deposits with confirmed transactions
    for (const deposit of pendingDeposits) {
      const matchingTx = recentTransactions.find(tx => 
        parseFloat(tx.value) === deposit.amount &&
        tx.timestamp > new Date(deposit.created_at).getTime()
      );
      
      if (matchingTx) {
        await updateDepositStatus(deposit.id, 'confirmed', matchingTx.hash);
        
        // Update user's TON balance using RPC
        const { error: balanceError } = await supabase
          .rpc('increment_ton_balance', {
            user_id: deposit.user_id,
            amount: deposit.amount
          });
        
        if (balanceError) {
          console.error('Error updating user balance:', balanceError);
        }
      }
    }
  } catch (error) {
    console.error('Error processing pending deposits:', error);
  }
};

// Export configuration for use in components
export const TON_CONFIG = {
  DEPOSIT_ADDRESS,
  NETWORK_NAME,
  isMainnet,
  generateUniqueId
};

export default {
  getTONBalance,
  getTransactionHistory,
  monitorDeposits,
  createDepositRecord,
  updateDepositStatus,
  getUserDeposits,
  isValidTONAddress,
  getNetworkInfo,
  processPendingDeposits,
  TON_CONFIG
};