import { useState, useEffect, useCallback } from 'react';
import TONAPIService, { TONTransaction, DepositRecord } from '../services/TONAPIService';

interface UseTONReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  transactions: TONTransaction[];
  deposits: DepositRecord[];
  networkInfo: {
    isMainnet: boolean;
    networkName: string;
    depositAddress: string;
  };
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshDeposits: () => Promise<void>;
  createDeposit: (amount: number) => Promise<DepositRecord | null>;
  validateAddress: (address: string) => boolean;
}

export const useTON = (userId?: number, userAddress?: string): UseTONReturn => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TONTransaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);

  const networkInfo = TONAPIService.getNetworkInfo();

  const refreshBalance = useCallback(async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newBalance = await TONAPIService.getTONBalance(userAddress);
      setBalance(newBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  const refreshTransactions = useCallback(async () => {
    if (!userAddress) return;
    
    try {
      const txHistory = await TONAPIService.getTransactionHistory(userAddress, 20);
      setTransactions(txHistory);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  }, [userAddress]);

  const refreshDeposits = useCallback(async () => {
    if (!userId) return;
    
    try {
      const userDeposits = await TONAPIService.getUserDeposits(userId);
      setDeposits(userDeposits);
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    }
  }, [userId]);

  const createDeposit = useCallback(async (amount: number): Promise<DepositRecord | null> => {
    if (!userId) return null;
    
    try {
      const deposit = await TONAPIService.createDepositRecord(userId, amount);
      await refreshDeposits(); // Refresh the deposits list
      return deposit;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deposit');
      return null;
    }
  }, [userId, refreshDeposits]);

  const validateAddress = useCallback((address: string): boolean => {
    return TONAPIService.isValidTONAddress(address);
  }, []);

  // Initial data loading
  useEffect(() => {
    if (userAddress) {
      refreshBalance();
      refreshTransactions();
    }
  }, [userAddress, refreshBalance, refreshTransactions]);

  useEffect(() => {
    if (userId) {
      refreshDeposits();
    }
  }, [userId, refreshDeposits]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!userAddress) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [userAddress, refreshBalance]);

  return {
    balance,
    isLoading,
    error,
    transactions,
    deposits,
    networkInfo,
    refreshBalance,
    refreshTransactions,
    refreshDeposits,
    createDeposit,
    validateAddress
  };
};

export default useTON;