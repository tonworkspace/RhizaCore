import React, { useState, useEffect } from 'react';
import { useTonConnectUI, TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { toNano, Address } from '@ton/core';
import { Icons } from '../uicomponents/Icons';
import { getJettonTransaction } from '../utils/jetton-transfer';
// import { getJettonRegistryData } from '../utils/jettonRegistry';
import { toDecimals } from '../utility/decimals';
import ta from "../utility/tonapi";

interface SnackbarData {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface SaleProps {
  tonPrice: number;
  tonAddress?: string | null;
  showSnackbar?: (data: SnackbarData) => void;
  onClose: () => void;
}

// Payment method types
type PaymentMethod = 'TON' | 'USDT';

// USDT contract address on TON
const USDT_JETTON_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

// TODO: Replace with actual RhizaCore treasury/sale contract address
const RHIZACORE_TREASURY_ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

const RhizaCoreSaleComponent: React.FC<SaleProps> = ({ tonPrice, tonAddress, showSnackbar, onClose }) => {
  const [amount, setAmount] = useState('100');
  const [isBuying, setIsBuying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TON');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [tonConnectUI] = useTonConnectUI();
  
  // Get the current wallet address directly from TON Connect
  const connectedTonAddress = useTonAddress();
  
  // Use the directly connected address as fallback
  const currentTonAddress = tonAddress || connectedTonAddress;
  
  // Constants
  const RZC_PRICE_USD = 0.1; // $0.1 per RZC token
  const tonPricePerRZC = RZC_PRICE_USD / tonPrice; // TON needed per RZC
  const usdtPricePerRZC = RZC_PRICE_USD; // USDT needed per RZC (1:1 with USD)
  
  // Calculations
  const rzcAmount = parseFloat(amount) || 0;
  const tonRequired = rzcAmount * tonPricePerRZC;
  const usdtRequired = rzcAmount * usdtPricePerRZC;
  const usdValue = rzcAmount * RZC_PRICE_USD;

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

  const handleBuy = async () => {
    if (!currentTonAddress) {
      showSnackbar?.({
        message: 'Protocol Gateway Restricted',
        description: 'Please connect your TON wallet to purchase RhizaCore tokens',
        type: 'error'
      });
      return;
    }

    if (rzcAmount <= 0) {
      showSnackbar?.({
        message: 'Invalid Volume',
        description: 'Please enter a valid purchase amount',
        type: 'error'
      });
      return;
    }

    // Check balance for selected payment method
    if (paymentMethod === 'USDT') {
      const availableUsdt = parseFloat(usdtBalance);
      if (availableUsdt < usdtRequired) {
        showSnackbar?.({
          message: 'Insufficient USDT Balance',
          description: `You need ${usdtRequired.toFixed(2)} USDT but only have ${availableUsdt.toFixed(2)} USDT`,
          type: 'error'
        });
        return;
      }
    }

    setIsBuying(true);
    
    try {
      let transaction;
      
      if (paymentMethod === 'TON') {
        // Create TON transaction
        transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600, // Valid for 10 minutes
          messages: [
            {
              address: RHIZACORE_TREASURY_ADDRESS, // Treasury address for RZC token sales
              amount: toNano(tonRequired).toString(), // Amount in nanotons
            }
          ]
        };

        showSnackbar?.({
          message: 'Protocol Transaction Initiated',
          description: `Acquiring ${rzcAmount.toLocaleString()} RZC nodes for ${tonRequired.toFixed(4)} TON`,
          type: 'info'
        });
      } else {
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

        transaction = getJettonTransaction(
          usdtJetton,
          usdtRequired.toString(),
          RHIZACORE_TREASURY_ADDRESS,
          connectedAddress
        );

        showSnackbar?.({
          message: 'Protocol Transaction Initiated',
          description: `Acquiring ${rzcAmount.toLocaleString()} RZC nodes for ${usdtRequired.toFixed(2)} USDT`,
          type: 'info'
        });
      }

      // Send transaction through TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        showSnackbar?.({
          message: 'Assets Acquired',
          description: `Purchase of ${rzcAmount.toLocaleString()} RZC nodes finalized.`,
          type: 'success'
        });
        
        onClose();
      }
      
    } catch (error: any) {
      console.error('Purchase transaction failed:', error);
      
      // Handle different error types
      if (error.message?.includes('insufficient')) {
        showSnackbar?.({
          message: 'Insufficient Protocol Balance',
          description: `You don't have enough ${paymentMethod} to complete this acquisition`,
          type: 'error'
        });
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        showSnackbar?.({
          message: 'Transaction Cancelled',
          description: 'Protocol acquisition cancelled by user',
          type: 'info'
        });
      } else {
        showSnackbar?.({
          message: 'Acquisition Failed',
          description: 'An error occurred while processing your purchase. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setIsBuying(false);
    }
  };

  const getPaymentAmount = () => {
    if (paymentMethod === 'TON') {
      return `${tonRequired.toFixed(4)} TON`;
    } else {
      return `${usdtRequired.toFixed(2)} USDT`;
    }
  };

  const getAvailableBalance = () => {
    if (paymentMethod === 'USDT') {
      return `${parseFloat(usdtBalance).toFixed(2)} USDT`;
    }
    return 'TON Balance'; // TON balance would need to be fetched separately
  };

  const hasInsufficientBalance = () => {
    if (paymentMethod === 'USDT') {
      return parseFloat(usdtBalance) < usdtRequired;
    }
    return false; // We don't check TON balance here, let the transaction fail naturally
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={onClose}></div>
      
      {/* Mobile: Account for bottom nav (88px) + safe area, Desktop: Center normally */}
      <div className="bg-[#0a0a0a] border border-white/[0.1] rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 w-full max-w-sm relative z-10 shadow-[0_60px_120px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300 mb-24 sm:mb-0">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-zinc-600 hover:text-white transition-colors p-2 bg-white/5 rounded-xl hover:bg-white/10"
        >
          <Icons.X size={16} />
        </button>

        {/* Header - Compact */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4 mx-auto border border-green-500/20 shadow-inner">
            <Icons.Store size={24} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Market Egress</h2>
          <p className="text-zinc-500 text-[10px] sm:text-[11px] leading-relaxed px-2">
            Direct acquisition gateway for native RhizaCore (RZC) protocol assets.
          </p>
          
          <div className="flex items-start gap-3 bg-white/[0.03] p-4 rounded-xl text-left border border-white/5 mt-4 shadow-inner">
            <Icons.Bell size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-[9px] sm:text-[10px] text-zinc-500 leading-relaxed font-medium italic">
              Assets acquired here contribute directly to your node rank and governance voting power during the Pre-Mainnet phase.
            </p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-5">
          <label className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.2em] mb-3 block">
            Payment Method
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('TON')}
              className={`flex-1 p-3 rounded-xl border transition-all ${
                paymentMethod === 'TON'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/[0.02] border-white/10 text-zinc-500 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  T
                </div>
                <span className="text-xs font-bold">TON</span>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod('USDT')}
              className={`flex-1 p-3 rounded-xl border transition-all ${
                paymentMethod === 'USDT'
                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                  : 'bg-white/[0.02] border-white/10 text-zinc-500 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                  ₮
                </div>
                <span className="text-xs font-bold">USDT</span>
              </div>
            </button>
          </div>
          
          {/* Balance Display */}
          {currentTonAddress && paymentMethod === 'USDT' && (
            <div className="mt-2 text-center">
              <span className="text-[8px] text-zinc-600 uppercase tracking-widest">
                Available: {getAvailableBalance()}
              </span>
            </div>
          )}
        </div>

        {/* Purchase Form - Compact */}
        <div className="space-y-5 mb-6">
          {/* Amount Input - Smaller */}
          <div className="relative">
            <label className="absolute -top-1.5 left-4 px-2 bg-[#0a0a0a] text-zinc-500 text-[8px] font-bold uppercase tracking-[0.2em] z-10">
              Purchase Volume
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-14 sm:h-16 bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 sm:px-6 text-white text-xl sm:text-2xl font-mono focus:border-green-500/50 outline-none transition-all shadow-inner"
                placeholder="0"
              />
              <span className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-green-500 font-bold font-mono text-sm">
                RZC
              </span>
            </div>
          </div>

          {/* Purchase Summary - Compact */}
          <div className="bg-zinc-900/40 rounded-xl p-4 sm:p-5 border border-white/[0.05] shadow-inner backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
                Protocol Cost
              </span>
              <div className="text-right">
                <div className={`text-white font-bold text-lg sm:text-xl font-mono tracking-tighter ${
                  hasInsufficientBalance() ? 'text-red-400' : ''
                }`}>
                  {getPaymentAmount()}
                </div>
                <div className="text-zinc-600 text-[8px] font-mono mt-0.5 uppercase tracking-widest">
                  ≈ ${usdValue.toFixed(2)} USD
                </div>
              </div>
            </div>
            
            <div className="h-px bg-white/[0.03] w-full"></div>
            
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
                Fixed Valuation
              </span>
              <span className="text-green-500 font-bold font-mono text-xs">
                $0.10 / RZC UNIT
              </span>
            </div>

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance() && (
              <>
                <div className="h-px bg-red-500/20 w-full"></div>
                <div className="flex items-center gap-2 text-red-400">
                  <Icons.Bell size={12} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">
                    Insufficient {paymentMethod} Balance
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Purchase Button - Compact */}
        {!currentTonAddress ? (
          <div className="space-y-4">
            <div className="text-center flex items-center justify-center">
              <TonConnectButton className="ton-connect-protocol-modal-mobile" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Icons.Lock size={10} className="text-red-500" />
              <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-[0.15em]">
                Protocol Gateway Restricted: Link TON Signature
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleBuy}
            disabled={isBuying || parseFloat(amount) <= 0 || hasInsufficientBalance()}
            className="w-full h-14 sm:h-16 bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-bold rounded-xl shadow-[0_15px_40px_rgba(34,197,94,0.2)] transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 border border-green-500/20 disabled:cursor-not-allowed"
          >
            {isBuying ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Icons.Store size={18} />
                <span className="uppercase tracking-[0.2em] text-[9px] sm:text-[10px]">
                  {hasInsufficientBalance() ? 'Insufficient Balance' : 'Finalize Acquisition'}
                </span>
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Custom styles for TonConnect button - Mobile optimized */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .ton-connect-protocol-modal-mobile {
            --tc-bg-color: #16a34a;
            --tc-bg-color-hover: #15803d;
            --tc-text-color: #ffffff;
            --tc-border-radius: 12px;
            --tc-font-size: 10px;
            --tc-font-weight: 700;
            --tc-padding: 12px 24px;
            --tc-min-height: 48px;
          }
          
          .ton-connect-protocol-modal-mobile button {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
            border: 1px solid rgba(34, 197, 94, 0.2) !important;
            color: white !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            padding: 12px 24px !important;
            border-radius: 12px !important;
            min-height: 48px !important;
            transition: all 0.2s ease !important;
            white-space: nowrap !important;
            box-shadow: 0 15px 40px rgba(34, 197, 94, 0.2) !important;
            text-transform: uppercase !important;
            letter-spacing: 0.2em !important;
          }
          
          .ton-connect-protocol-modal-mobile button:hover {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 20px 50px rgba(34, 197, 94, 0.3) !important;
          }

          .ton-connect-protocol-modal-mobile button:active {
            transform: scale(0.98) !important;
          }

          @media (max-width: 640px) {
            .ton-connect-protocol-modal-mobile {
              --tc-font-size: 9px;
              --tc-padding: 10px 20px;
              --tc-min-height: 44px;
            }
            
            .ton-connect-protocol-modal-mobile button {
              font-size: 9px !important;
              padding: 10px 20px !important;
              min-height: 44px !important;
              letter-spacing: 0.15em !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default RhizaCoreSaleComponent;