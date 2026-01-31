import React, { useState, useMemo, useEffect } from 'react';
import { useTonConnectUI, TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { toNano, Address } from '@ton/core';
import { Icons } from '../uicomponents/Icons';
import { SnackbarData } from '../types';
import { TOKEN_SEED_PRICE, CURRENT_TON_NETWORK, MIN_TON_SWAP, MIN_RZC_SWAP } from '../constants';
import { addRZCFromDEXPurchase } from '../lib/supabaseClient';
import { getJettonTransaction } from '../utils/jetton-transfer';
import { toDecimals } from '../utility/decimals';
import ta from "../utility/tonapi";

interface DexUIProps {
  tonPrice: number;
  tonAddress?: string | null;
  showSnackbar?: (data: SnackbarData) => void;
  walletActivated: boolean;
  onActivateWallet?: () => void;
  onSwapComplete?: () => void;
  userId?: number; // Add userId prop
}

// USDT contract address on TON
const USDT_JETTON_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

// Payment method types for DEX
type PaymentMethod = 'TON' | 'USDT';

const DexUI: React.FC<DexUIProps> = ({
  tonPrice,
  tonAddress,
  showSnackbar,
  walletActivated,
  onActivateWallet,
  onSwapComplete,
  userId
}) => {
  const [sellAmount, setSellAmount] = useState<string>('0.1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReverse, setIsReverse] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TON');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');

  // TON Connect hooks
  const [tonConnectUI] = useTonConnectUI();
  const connectedTonAddress = useTonAddress();
  
  // Use the directly connected address as fallback
  const currentTonAddress = tonAddress || connectedTonAddress;

  // Exchange rate logic
  // If isReverse is true: Selling RZC for TON/USDT
  // RZC is $0.10, TON is $5.42, USDT is $1.00
  const exchangeRateToTon = tonPrice / TOKEN_SEED_PRICE; // 1 TON = 54.2 RZC
  const exchangeRateToUsdt = 1.0 / TOKEN_SEED_PRICE; // 1 USDT = 10 RZC

  const buyAmount = useMemo(() => {
    const val = parseFloat(sellAmount) || 0;
    if (isReverse) {
      // Selling RZC for TON/USDT
      return paymentMethod === 'TON' ? val / exchangeRateToTon : val / exchangeRateToUsdt;
    } else {
      // Buying RZC with TON/USDT
      return paymentMethod === 'TON' ? val * exchangeRateToTon : val * exchangeRateToUsdt;
    }
  }, [sellAmount, isReverse, paymentMethod, exchangeRateToTon, exchangeRateToUsdt]);

  // Fetch USDT balance when wallet connects
  useEffect(() => {
    const fetchUsdtBalance = async () => {
      if (!currentTonAddress) {
        setUsdtBalance('0');
        return;
      }

      try {
        const connectedAddress = Address.parse(currentTonAddress);
        const balanceInfo = await ta.accounts.getAccountJettonsBalances(connectedAddress);
        
        // Find USDT balance
        const usdtJetton = balanceInfo.balances?.find(
          jetton => jetton.jetton.address.toString() === USDT_JETTON_ADDRESS
        );
        
        if (usdtJetton) {
          const balance = toDecimals(usdtJetton.balance, usdtJetton.jetton.decimals);
          setUsdtBalance(balance);
        } else {
          setUsdtBalance('0');
        }
      } catch (error) {
        console.error('Failed to fetch USDT balance:', error);
        setUsdtBalance('0');
      }
    };

    fetchUsdtBalance();
  }, [currentTonAddress]);

  const handleSwap = async () => {
    if (!walletActivated) {
      showSnackbar?.({ 
        message: 'Wallet Not Activated', 
        description: 'Please activate your RhizaCore wallet first to access the DEX', 
        type: 'error' 
      });
      onActivateWallet?.();
      return;
    }

    if (!currentTonAddress) {
      showSnackbar?.({ 
        message: 'Wallet Not Connected', 
        description: 'Please connect your TON wallet to execute swaps', 
        type: 'error' 
      });
      return;
    }

    const sellAmountNum = parseFloat(sellAmount) || 0;
    if (sellAmountNum <= 0) {
      showSnackbar?.({ 
        message: 'Invalid Amount', 
        description: 'Please enter a valid amount to swap', 
        type: 'error' 
      });
      return;
    }

    // Check minimum swap amounts
    const minAmount = isReverse ? MIN_RZC_SWAP : (paymentMethod === 'TON' ? MIN_TON_SWAP : 1); // 1 USDT minimum
    const tokenSymbol = isReverse ? 'RZC' : paymentMethod;
    
    if (sellAmountNum < minAmount) {
      showSnackbar?.({ 
        message: 'Minimum Swap Amount', 
        description: `Minimum swap amount is ${minAmount} ${tokenSymbol}. Please enter a larger amount.`, 
        type: 'error' 
      });
      return;
    }

    // Check balance for selected payment method
    if (!isReverse && paymentMethod === 'USDT') {
      const availableUsdt = parseFloat(usdtBalance);
      if (availableUsdt < sellAmountNum) {
        showSnackbar?.({
          message: 'Insufficient USDT Balance',
          description: `You need ${sellAmountNum.toFixed(2)} USDT but only have ${availableUsdt.toFixed(2)} USDT`,
          type: 'error'
        });
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      // For TON/USDT → RZC swaps, we need to send payment to the treasury
      // For RZC → TON/USDT swaps, this would be handled differently (not implemented in this demo)
      if (!isReverse) {
        // Selling TON/USDT for RZC
        const swapAmount = sellAmountNum;
        const receiveAmount = buyAmount;
        
        if (paymentMethod === 'TON') {
          // TON → RZC swap
          const tonAmount = swapAmount;
          const protocolFee = 0.001; // 0.001 TON protocol fee
          const totalTonRequired = tonAmount + protocolFee;

          // Create TON transaction
          const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // Valid for 10 minutes
            messages: [
              {
                address: CURRENT_TON_NETWORK.DEPOSIT_ADDRESS, // DEX treasury address
                amount: toNano(totalTonRequired).toString(), // Amount in nanotons
              }
            ]
          };

          showSnackbar?.({
            message: 'DEX Transaction Initiated',
            description: `Preparing to swap ${tonAmount.toFixed(4)} TON for ${receiveAmount.toFixed(2)} RZC`,
            type: 'info'
          });

          console.log('Sending TON transaction:', {
            address: CURRENT_TON_NETWORK.DEPOSIT_ADDRESS,
            amount: totalTonRequired,
            amountNano: toNano(totalTonRequired).toString(),
            validUntil: Math.floor(Date.now() / 1000) + 600
          });

          // Send transaction through TON Connect
          const result = await tonConnectUI.sendTransaction(transaction);
          
          console.log('Transaction result:', result);
          
          // Check if transaction was sent successfully
          if (result && result.boc) {
            // Transaction was successfully sent to the blockchain
            showSnackbar?.({
              message: 'Swap Transaction Sent',
              description: `Transaction submitted! Swapping ${tonAmount.toFixed(4)} TON for ${receiveAmount.toFixed(2)} RZC`,
              type: 'success'
            });
            
            // Add RZC to user's airdrop balance if userId is provided
            if (userId) {
              try {
                const addRZCResult = await addRZCFromDEXPurchase(
                  userId,
                  receiveAmount,
                  tonAmount,
                  result.boc // Use the transaction BOC as hash reference
                );
                
                if (addRZCResult.success) {
                  console.log('Successfully added RZC to airdrop balance:', addRZCResult.newBalance);
                  
                  // Trigger wallet refresh if available
                  if (typeof window !== 'undefined' && window.refreshWalletBalance) {
                    await window.refreshWalletBalance();
                  }
                  
                  showSnackbar?.({
                    message: 'RZC Added to Wallet',
                    description: `${receiveAmount.toFixed(2)} RZC has been added to your wallet balance`,
                    type: 'success'
                  });
                } else {
                  console.error('Failed to add RZC to airdrop balance:', addRZCResult.error);
                  showSnackbar?.({
                    message: 'Balance Update Failed',
                    description: 'Transaction completed but balance update failed. Contact support if needed.',
                    type: 'error'
                  });
                }
              } catch (error) {
                console.error('Error adding RZC to balance:', error);
                showSnackbar?.({
                  message: 'Balance Update Error',
                  description: 'Transaction completed but balance update failed. Contact support if needed.',
                  type: 'error'
                });
              }
            }
            
            // Reset form
            setSellAmount('0.1');
            onSwapComplete?.();
          } else {
            // Transaction was not properly sent
            console.error('Transaction result missing boc:', result);
            showSnackbar?.({
              message: 'Transaction Failed',
              description: 'Transaction was not properly submitted. Please check your wallet and try again.',
              type: 'error'
            });
          }
        } else {
          // USDT → RZC swap
          const usdtAmount = swapAmount;
          
          // Create USDT jetton transaction
          const connectedAddress = Address.parse(currentTonAddress);
          const balanceInfo = await ta.accounts.getAccountJettonsBalances(connectedAddress);
          
          // Find USDT jetton
          const usdtJetton = balanceInfo.balances?.find(
            jetton => jetton.jetton.address.toString() === USDT_JETTON_ADDRESS
          );
          
          if (!usdtJetton) {
            throw new Error('USDT jetton not found in wallet');
          }

          const transaction = getJettonTransaction(
            usdtJetton,
            usdtAmount.toString(),
            CURRENT_TON_NETWORK.DEPOSIT_ADDRESS,
            connectedAddress
          );

          showSnackbar?.({
            message: 'DEX Transaction Initiated',
            description: `Preparing to swap ${usdtAmount.toFixed(2)} USDT for ${receiveAmount.toFixed(2)} RZC`,
            type: 'info'
          });

          console.log('Sending USDT transaction:', {
            address: CURRENT_TON_NETWORK.DEPOSIT_ADDRESS,
            amount: usdtAmount,
            jettonAddress: USDT_JETTON_ADDRESS
          });

          // Send transaction through TON Connect
          const result = await tonConnectUI.sendTransaction(transaction);
          
          console.log('Transaction result:', result);
          
          // Check if transaction was sent successfully
          if (result && result.boc) {
            // Transaction was successfully sent to the blockchain
            showSnackbar?.({
              message: 'Swap Transaction Sent',
              description: `Transaction submitted! Swapping ${usdtAmount.toFixed(2)} USDT for ${receiveAmount.toFixed(2)} RZC`,
              type: 'success'
            });
            
            // Add RZC to user's airdrop balance if userId is provided
            if (userId) {
              try {
                const addRZCResult = await addRZCFromDEXPurchase(
                  userId,
                  receiveAmount,
                  usdtAmount, // Use USDT amount as cost
                  result.boc // Use the transaction BOC as hash reference
                );
                
                if (addRZCResult.success) {
                  console.log('Successfully added RZC to airdrop balance:', addRZCResult.newBalance);
                  
                  // Trigger wallet refresh if available
                  if (typeof window !== 'undefined' && window.refreshWalletBalance) {
                    await window.refreshWalletBalance();
                  }
                  
                  showSnackbar?.({
                    message: 'RZC Added to Wallet',
                    description: `${receiveAmount.toFixed(2)} RZC has been added to your wallet balance`,
                    type: 'success'
                  });
                } else {
                  console.error('Failed to add RZC to airdrop balance:', addRZCResult.error);
                  showSnackbar?.({
                    message: 'Balance Update Failed',
                    description: 'Transaction completed but balance update failed. Contact support if needed.',
                    type: 'error'
                  });
                }
              } catch (error) {
                console.error('Error adding RZC to balance:', error);
                showSnackbar?.({
                  message: 'Balance Update Error',
                  description: 'Transaction completed but balance update failed. Contact support if needed.',
                  type: 'error'
                });
              }
            }
            
            // Reset form
            setSellAmount('0.1');
            onSwapComplete?.();
          } else {
            // Transaction was not properly sent
            console.error('Transaction result missing boc:', result);
            showSnackbar?.({
              message: 'Transaction Failed',
              description: 'Transaction was not properly submitted. Please check your wallet and try again.',
              type: 'error'
            });
          }
        }
      } else {
        // RZC → TON/USDT swap (not fully implemented - would require RZC balance check)
        showSnackbar?.({
          message: `RZC → ${paymentMethod} Swaps Coming Soon`,
          description: `RZC to ${paymentMethod} swaps will be available after mainnet launch`,
          type: 'info'
        });
      }
      
    } catch (error: any) {
      console.error('Swap transaction failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Handle different error types
      if (error.message?.includes('insufficient') || error.code === 'INSUFFICIENT_FUNDS') {
        showSnackbar?.({
          message: 'Insufficient Balance',
          description: `You don't have enough ${isReverse ? 'RZC' : 'TON'} to complete this swap`,
          type: 'error'
        });
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled') || error.code === 'USER_REJECTED') {
        showSnackbar?.({
          message: 'Swap Cancelled',
          description: 'Transaction was cancelled by user',
          type: 'info'
        });
      } else if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
        showSnackbar?.({
          message: 'Transaction Timeout',
          description: 'Transaction timed out. Please try again.',
          type: 'error'
        });
      } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        showSnackbar?.({
          message: 'Network Error',
          description: 'Network connection issue. Please check your connection and try again.',
          type: 'error'
        });
      } else {
        showSnackbar?.({
          message: 'Swap Failed',
          description: `Transaction failed: ${error.message || 'Unknown error'}. Please try again.`,
          type: 'error'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 pt-2 pb-32 animate-in fade-in duration-500">
      {/* Compact DEX Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-500 text-[8px] font-black uppercase tracking-[0.3em]">Neural Exchange</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
          <span className="text-zinc-600 text-[8px] font-mono">0.1% Fee</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tighter text-white">Liquidity Gateway</h2>
        
        {/* Payment Method Selector */}
        <div className="mt-3">
          <div className="flex bg-zinc-900/60 border border-white/5 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setPaymentMethod('TON')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                paymentMethod === 'TON' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icons.Energy size={12} />
              TON
            </button>
            <button
              onClick={() => setPaymentMethod('USDT')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                paymentMethod === 'USDT' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icons.Store size={12} />
              USDT
            </button>
          </div>
          
          {/* Balance Display */}
          {currentTonAddress && (
            <div className="mt-2 px-2">
              <div className="text-[7px] text-zinc-600 font-bold uppercase tracking-wider">
                Available: {paymentMethod === 'TON' ? '12.45 TON' : `${parseFloat(usdtBalance).toFixed(2)} USDT`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Swap Card */}
      <div className="bg-[#080808] border border-white/5 rounded-2xl p-4 shadow-2xl space-y-1 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
            backgroundSize: '15px 15px' 
          }} 
        />

        {/* Compact Sell Field */}
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl relative z-10 transition-all focus-within:border-blue-500/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Pay</span>
            {currentTonAddress && (
              <span className="text-zinc-600 text-[8px] font-mono">
                {isReverse ? '1,250.00' : (paymentMethod === 'TON' ? '12.45' : parseFloat(usdtBalance).toFixed(2))}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <input 
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="bg-transparent text-white font-mono text-2xl outline-none w-full"
              placeholder="0.00"
              min={isReverse ? MIN_RZC_SWAP : (paymentMethod === 'TON' ? MIN_TON_SWAP : 1)}
              step={isReverse ? "1" : (paymentMethod === 'TON' ? "0.1" : "1")}
            />
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-1 rounded-lg">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                isReverse ? 'bg-blue-600' : (paymentMethod === 'TON' ? 'bg-blue-400' : 'bg-green-500')
              }`}>
                <Icons.Energy size={8} className="text-white" />
              </div>
              <span className="text-white font-bold text-xs tracking-tighter">
                {isReverse ? 'RZC' : paymentMethod}
              </span>
            </div>
          </div>
          
          {/* Minimum swap hint */}
          <div className="mt-1.5 px-1">
            <p className="text-zinc-600 text-[7px] font-bold uppercase tracking-wider italic">
              * Minimum swap: {isReverse ? MIN_RZC_SWAP : (paymentMethod === 'TON' ? MIN_TON_SWAP : 1)} {isReverse ? 'RZC' : paymentMethod}
            </p>
          </div>
        </div>

        {/* Compact Swap Toggle */}
        <div className="flex justify-center -my-1 relative z-20">
          <button 
            onClick={() => setIsReverse(!isReverse)}
            className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-lg flex items-center justify-center text-white hover:border-blue-500 transition-colors shadow-xl active:scale-90"
          >
            <Icons.Swap size={14} />
          </button>
        </div>

        {/* Compact Buy Field */}
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Receive</span>
            <span className="text-green-500 text-[7px] font-mono">&lt;0.01% Impact</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-zinc-400 font-mono text-2xl overflow-hidden truncate">
              {buyAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-1 rounded-lg">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                !isReverse ? 'bg-blue-600' : (paymentMethod === 'TON' ? 'bg-blue-400' : 'bg-green-500')
              }`}>
                <Icons.Energy size={8} className="text-white" />
              </div>
              <span className="text-white font-bold text-xs tracking-tighter">
                {!isReverse ? 'RZC' : paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="pt-2 px-1 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-zinc-600 text-[7px] font-black uppercase tracking-widest">Rate</span>
            <span className="text-zinc-400 text-[7px] font-mono font-bold">
              1 {isReverse ? 'RZC' : paymentMethod} = {
                isReverse 
                  ? (paymentMethod === 'TON' ? (1/exchangeRateToTon).toFixed(4) : (1/exchangeRateToUsdt).toFixed(2))
                  : (paymentMethod === 'TON' ? exchangeRateToTon.toFixed(2) : exchangeRateToUsdt.toFixed(2))
              } {isReverse ? paymentMethod : 'RZC'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-600 text-[7px] font-black uppercase tracking-widest">Route</span>
            <span className="text-zinc-600 text-[7px] font-mono">Genesis Pool v2</span>
          </div>
        </div>
      </div>

      {/* Compact Performance & Action */}
      <div className="mt-4 space-y-3">
        {/* Mini Performance Row */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <Icons.Trending size={12} className="text-green-500" />
            </div>
            <div>
              <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">24h</div>
              <div className="text-white font-mono font-bold text-xs">+14.2%</div>
            </div>
          </div>
          <div className="h-6 w-16">
            <svg viewBox="0 0 100 24" className="w-full h-full">
              <path 
                d="M0 20 Q 15 22, 25 12 T 50 8 T 75 14 T 100 4" 
                fill="none" 
                stroke="#22c55e" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
              />
            </svg>
          </div>
        </div>

        {/* Compact Action Button */}
        {!walletActivated ? (
          <button 
            onClick={onActivateWallet}
            className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Icons.Lock size={16} />
            Activate Required
          </button>
        ) : !currentTonAddress ? (
          <div className="space-y-2">
            <TonConnectButton className="ton-connect-dex-button" />
            <div className="flex items-center justify-center gap-1.5">
              <Icons.Lock size={8} className="text-blue-500" />
              <p className="text-zinc-600 text-[7px] font-bold uppercase tracking-[0.15em] text-center">
                Connect TON Wallet for Swaps
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleSwap}
            disabled={
              isProcessing || 
              !sellAmount || 
              parseFloat(sellAmount) <= 0 || 
              parseFloat(sellAmount) < (isReverse ? MIN_RZC_SWAP : (paymentMethod === 'TON' ? MIN_TON_SWAP : 1)) ||
              (isReverse && parseFloat(sellAmount) > 1250) ||
              (!isReverse && paymentMethod === 'USDT' && parseFloat(sellAmount) > parseFloat(usdtBalance))
            }
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icons.Swap size={16} />
                {isReverse ? `RZC → ${paymentMethod} (Soon)` : `Execute Swap`}
              </>
            )}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-zinc-700 text-[6px] leading-relaxed font-black uppercase tracking-[0.15em] px-4">
        Instant liquidity via Genesis Oracle sync
      </p>

      <style dangerouslySetInnerHTML={{ __html: `
        .h-12 { 
          height: 3rem; 
        }
        
        /* TON Connect DEX Button Styling */
        .ton-connect-dex-button {
          --tc-bg-color: #2563eb;
          --tc-bg-color-hover: #1d4ed8;
          --tc-text-color: #ffffff;
          --tc-border-radius: 0.75rem;
          --tc-font-size: 10px;
          --tc-font-weight: 900;
          --tc-padding: 12px 24px;
          --tc-min-height: 48px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        
        .ton-connect-dex-button button {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
          border: 1px solid rgba(37, 99, 235, 0.2) !important;
          color: white !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          padding: 12px 24px !important;
          border-radius: 0.75rem !important;
          min-height: 48px !important;
          transition: all 0.2s ease !important;
          white-space: nowrap !important;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.3em !important;
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 0 auto !important;
        }
        
        .ton-connect-dex-button button:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 15px 40px rgba(37, 99, 235, 0.4) !important;
        }

        .ton-connect-dex-button button:active {
          transform: scale(0.98) !important;
        }
      `}} />
    </div>
  );
};

export default DexUI;