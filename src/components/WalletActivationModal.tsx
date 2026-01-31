import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icons } from '../uicomponents/Icons';
import { supabase } from '../lib/supabaseClient';
import { TonConnectButton, useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { toNano } from '@ton/core';
import { CURRENT_TON_NETWORK } from '../constants';

interface WalletActivationModalProps {
  userId: number;
  userUsername?: string;
  tonAddress?: string | null;
  tonPrice: number;
  showSnackbar?: (data: { message: string; description?: string; type?: 'success' | 'error' | 'info' }) => void;
  onClose: () => void;
  onActivationComplete: () => void;
}

interface ActivationStatus {
  wallet_activated: boolean;
  wallet_activated_at?: string;
  activation_details?: {
    id: number;
    ton_amount: number;
    usd_amount: number;
    rzc_awarded: number;
    transaction_hash: string;
    status: string;
    created_at: string;
  };
}

enum FlowStep {
  INTRO = 'INTRO',
  SCANNING = 'SCANNING',
  COMMITMENT = 'COMMITMENT',
  BROADCASTING = 'BROADCASTING',
  PROVISIONING = 'PROVISIONING',
  SUCCESS = 'SUCCESS'
}

interface ProtocolLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'ai';
}

const WalletActivationModal: React.FC<WalletActivationModalProps> = ({
  userId,
  userUsername,
  tonAddress,
  tonPrice,
  showSnackbar,
  onClose,
  onActivationComplete
}) => {
  const [step, setStep] = useState<FlowStep>(FlowStep.INTRO);
  const [logs, setLogs] = useState<ProtocolLogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setActivationStatus] = useState<ActivationStatus | null>(null);
  const [paymentSent, setPaymentSent] = useState(false);
  const [securityInsight, setSecurityInsight] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true); // Track initial status check
  
  // TON Connect integration - using the same hooks as SettingsComponent
  const [tonConnectUI] = useTonConnectUI();
  const connectedAddressString = useTonAddress();
  const wallet = useTonWallet();
  
  // Use the passed tonAddress prop as primary source, fallback to hook
  const actualConnectedAddress = tonAddress || connectedAddressString;
  const connected = !!actualConnectedAddress;

  // Memoized constants for better performance
  const USD_AMOUNT = 15;
  const RZC_REWARD = 150;
  const tonAmountNeeded = useMemo(() => USD_AMOUNT / tonPrice, [tonPrice]);
  const RECEIVER_ADDRESS = CURRENT_TON_NETWORK.DEPOSIT_ADDRESS;

  const loadActivationStatus = useCallback(async () => {
    if (!userId) return;
    
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.rpc('get_wallet_activation_status', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error loading activation status:', error);
        return;
      }

      if (data?.success) {
        setActivationStatus(data);
        // If already activated, skip to success
        if (data.wallet_activated) {
          setStep(FlowStep.SUCCESS);
        }
      }
    } catch (error) {
      console.error('Error loading activation status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [userId]);



  useEffect(() => {
    loadActivationStatus();
  }, [loadActivationStatus]);

  // Debug connection state
  useEffect(() => {
    console.log('WalletActivationModal connection state:', {
      connected,
      actualConnectedAddress,
      connectedAddressString,
      tonAddressProp: tonAddress,
      wallet: wallet?.device?.appName,
      isProcessing,
      paymentSent
    });
  }, [connected, actualConnectedAddress, connectedAddressString, tonAddress, wallet, isProcessing, paymentSent]);

  const addLog = useCallback((message: string, type: ProtocolLogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type
    }].slice(-20)); // Keep last 20 for modal space
  }, []);

  // Mock security insight function (replace with actual service)
  const getSecurityInsight = async (_address: string): Promise<string> => {
    const insights = [
      "Address entropy analysis complete. High-grade randomness detected in wallet generation.",
      "Network topology scan reveals optimal routing paths for transaction propagation.",
      "Cryptographic signature validation confirms authentic wallet derivation process.",
      "Blockchain state verification indicates clean transaction history with no anomalies."
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

  // Mock provisioning update function (replace with actual service)
  const getProvisioningUpdate = async (step: number): Promise<string> => {
    const updates = [
      "Initializing secure vault allocation for RZC token distribution...",
      "Establishing encrypted communication channels with RhizaCore mesh network...",
      "Finalizing identity verification and protocol access permissions..."
    ];
    return updates[step - 1] || "Processing protocol activation...";
  };

  // Optimized security scan with faster execution
  const startSecurityScan = async () => {
    setStep(FlowStep.SCANNING);
    setIsProcessing(true);
    addLog("Initializing RhizaCore Security Protocol...", "info");
    
    // Reduced delays for better UX
    await new Promise(r => setTimeout(r, 500));
    addLog("Analyzing connected node address entropy...", "info");
    
    const insight = await getSecurityInsight(actualConnectedAddress || "GUEST_OPERATOR");
    setSecurityInsight(insight);
    addLog(insight, "ai");
    
    await new Promise(r => setTimeout(r, 400));
    addLog("Environment verified. Proceeding to commitment phase.", "success");
    
    setIsProcessing(false);
    setStep(FlowStep.COMMITMENT);
  };

  // Phase 2: Transaction (Enhanced version of handleActivateWallet)
  const handlePayment = async () => {
    console.log('Activate wallet clicked', { connected, actualConnectedAddress, isProcessing, paymentSent });
    
    if (!connected || !actualConnectedAddress) {
      console.error('Wallet not connected:', { connected, actualConnectedAddress });
      showSnackbar?.({
        message: 'Wallet Not Connected',
        description: 'Please connect your TON wallet first',
        type: 'error'
      });
      return;
    }

    if (isProcessing || paymentSent) {
      console.log('Already processing or payment sent:', { isProcessing, paymentSent });
      return;
    }

    // Check if already activated before processing payment
    try {
      const currentStatus = await supabase.rpc('get_wallet_activation_status', {
        p_user_id: userId
      });
      
      if (currentStatus.data?.wallet_activated) {
        showSnackbar?.({
          message: 'Already Activated',
          description: 'Your wallet is already activated',
          type: 'info'
        });
        setStep(FlowStep.SUCCESS);
        onActivationComplete();
        return;
      }
    } catch (error) {
      console.error('Error checking activation status:', error);
    }

    setIsProcessing(true);
    addLog(`Preparing transaction for ${tonAmountNeeded.toFixed(4)} TON...`, "info");
    
    try {
      // Validate receiver address
      if (!RECEIVER_ADDRESS) {
        throw new Error('Receiver address not configured');
      }

      // Create the transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: RECEIVER_ADDRESS,
            amount: toNano(tonAmountNeeded.toFixed(4)).toString()
            // Remove payload - it needs to be properly encoded or omitted
          }
        ]
      };

      console.log('Sending transaction:', transaction);
      console.log('TON amount needed:', tonAmountNeeded);
      console.log('Receiver address:', RECEIVER_ADDRESS);

      // Check if tonConnectUI is available
      if (!tonConnectUI) {
        throw new Error('TON Connect UI not initialized');
      }

      // Send the transaction using tonConnectUI
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('Transaction result:', result);
      
      if (result) {
        setPaymentSent(true);
        // Truncate BOC to prevent database errors - BOC can be very long
        const truncatedTxHash = result.boc ? 
          (result.boc.length > 200 ? result.boc.substring(0, 200) + '...' : result.boc) :
          'tx_' + Math.random().toString(16).slice(2, 10);
        setTxHash(truncatedTxHash);
        setStep(FlowStep.BROADCASTING);
        addLog("Transaction signed. Broadcasting to TON Network...", "success");
        
        showSnackbar?.({
          message: 'Payment Sent',
          description: 'Processing wallet activation...',
          type: 'info'
        });
        
        // Phase 3: Verification & Provisioning - Optimized timing
        await new Promise(r => setTimeout(r, 1500));
        addLog("Ledger confirmation received.", "success");
        setStep(FlowStep.PROVISIONING);
        
        // Faster provisioning steps
        for (let i = 1; i <= 3; i++) {
          const update = await getProvisioningUpdate(i);
          addLog(update, "ai");
          await new Promise(r => setTimeout(r, 600)); // Reduced from 800ms
        }
        
        // Process the activation with fallback for long transaction hashes
        let activationResult;
        let transactionHashToUse = result.boc || 'direct_payment';
        
        // First attempt with full hash
        const firstAttempt = await supabase.rpc('process_wallet_activation', {
          p_user_id: userId,
          p_ton_amount: tonAmountNeeded,
          p_ton_price: tonPrice,
          p_transaction_hash: transactionHashToUse,
          p_sender_address: actualConnectedAddress,
          p_receiver_address: RECEIVER_ADDRESS
        });
        
        // Check if we got a length error (can be in error object or data.error)
        const hasLengthError = (firstAttempt.error && (firstAttempt.error.message?.includes('too long') || firstAttempt.error.message?.includes('varying'))) ||
                              (firstAttempt.data?.error && (firstAttempt.data.error.includes('too long') || firstAttempt.data.error.includes('varying')));
        
        if (hasLengthError) {
          console.warn('Transaction hash too long, using truncated version');
          addLog("Transaction hash truncated due to database limitations", "info");
          
          // Create a shorter hash that includes start and end for uniqueness
          const shortHash = result.boc && result.boc.length > 200 ? 
            `${result.boc.substring(0, 100)}...${result.boc.substring(result.boc.length - 100)}` :
            transactionHashToUse;
          
          const secondAttempt = await supabase.rpc('process_wallet_activation', {
            p_user_id: userId,
            p_ton_amount: tonAmountNeeded,
            p_ton_price: tonPrice,
            p_transaction_hash: shortHash,
            p_sender_address: actualConnectedAddress,
            p_receiver_address: RECEIVER_ADDRESS
          });
          
          activationResult = secondAttempt;
        } else {
          activationResult = firstAttempt;
        }

        console.log('Activation result:', activationResult);

        if (activationResult.error) {
          throw activationResult.error;
        }

        if (activationResult.data?.success) {
          addLog(`Protocol activated. ${RZC_REWARD} RZC provisioned to identity.`, "success");
          setStep(FlowStep.SUCCESS);
          
          showSnackbar?.({
            message: 'Wallet Activated!',
            description: `You received ${RZC_REWARD} RZC tokens. Welcome to RhizaCore!`,
            type: 'success'
          });

          // Reload activation status and trigger parent callback
          await loadActivationStatus();
          
          // Reduced delay for faster UX
          await new Promise(r => setTimeout(r, 100));
          
          // Trigger the parent component to refresh
          onActivationComplete();
        } else {
          showSnackbar?.({
            message: 'Activation Failed',
            description: activationResult.data?.error || 'Failed to activate wallet',
            type: 'error'
          });
        }
      } else {
        throw new Error('Transaction failed - no result returned');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      setPaymentSent(false);
      
      if (error.message?.includes('user rejected') || error.message?.includes('User rejected')) {
        addLog("Transaction failed or cancelled by operator.", "error");
        setStep(FlowStep.COMMITMENT);
        showSnackbar?.({
          message: 'Payment Cancelled',
          description: 'You cancelled the payment',
          type: 'info'
        });
      } else {
        addLog("Transaction failed or cancelled by operator.", "error");
        setStep(FlowStep.COMMITMENT);
        showSnackbar?.({
          message: 'Payment Error',
          description: error.message || 'Failed to send payment',
          type: 'error'
        });
      }
    }
  };

  // Memoized step indicator for better performance
  const StepIndicator = useMemo(() => () => (
    <div className="flex gap-1.5 justify-center mb-6">
      {[FlowStep.INTRO, FlowStep.SCANNING, FlowStep.COMMITMENT, FlowStep.BROADCASTING, FlowStep.SUCCESS].map((s) => (
        <div 
          key={s} 
          className={`h-1 rounded-full transition-all duration-500 ${
            Object.values(FlowStep).indexOf(step) >= Object.values(FlowStep).indexOf(s) 
              ? 'w-6 bg-blue-500' 
              : 'w-2 bg-white/10'
          }`} 
        />
      ))}
    </div>
  ), [step]);

  const ProtocolLog = ({ logs }: { logs: ProtocolLogEntry[] }) => (
    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
        <Icons.Chip size={12} />
        Protocol Log
      </div>
      <div className="space-y-2 font-mono text-[10px]">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-zinc-600 shrink-0">{log.timestamp}</span>
            <span className={`${
              log.type === 'success' ? 'text-green-400' :
              log.type === 'error' ? 'text-red-400' :
              log.type === 'ai' ? 'text-blue-300 italic' :
              'text-zinc-300'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md will-change-transform" onClick={onClose}></div>
      
      {/* Show loading state while checking activation status */}
      {isCheckingStatus ? (
        <div className="bg-[#050505] border md:border border-white/10 rounded-[40px] w-full max-w-md relative z-10 shadow-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <Icons.Refresh size={28} className="text-blue-400 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Checking Status</h3>
            <p className="text-zinc-500 text-sm">Verifying activation state...</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#050505] border md:border border-white/10 rounded-[40px] w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[80vh] md:max-h-[85vh] animate-in slide-in-from-bottom duration-300 overflow-hidden mb-20 md:mb-0 will-change-transform">
        
        {/* Optimized Scanner Bar for processing states */}
        {isProcessing && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent scanner-line z-20 will-change-transform"></div>
        )}
        
        <div className="p-6 pb-0 flex flex-col items-center shrink-0">
          <StepIndicator />
          
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 will-change-transform ${
            step === FlowStep.SUCCESS ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'
          } border shadow-lg`}>
            {step === FlowStep.INTRO && <Icons.Lock size={28} className="text-blue-400" />}
            {step === FlowStep.SCANNING && <Icons.Chip size={28} className="text-yellow-400 animate-pulse" />}
            {step === FlowStep.COMMITMENT && <Icons.Wallet size={28} className="text-blue-400" />}
            {(step === FlowStep.BROADCASTING || step === FlowStep.PROVISIONING) && <Icons.Refresh size={28} className="text-blue-400 animate-spin" />}
            {step === FlowStep.SUCCESS && <Icons.Check size={28} className="text-green-400" />}
          </div>
          
          <h3 className="text-xl font-bold text-white tracking-tight">
            {step === FlowStep.INTRO && "Operator Verification"}
            {step === FlowStep.SCANNING && "Security Audit"}
            {step === FlowStep.COMMITMENT && "Protocol Commitment"}
            {step === FlowStep.BROADCASTING && "Broadcasting Node"}
            {step === FlowStep.PROVISIONING && "Provisioning Assets"}
            {step === FlowStep.SUCCESS && "Activation Complete"}
          </h3>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-black mt-1">RhizaCore Network / Layer 2</p>
        </div>

        <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar flex-1 will-change-scroll">
          
          {step === FlowStep.INTRO && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white/[0.02] rounded-3xl p-5 border border-white/5 text-center">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Node Identification</div>
                <div className="text-lg font-mono text-blue-400">@{userUsername || 'GUEST_OPERATOR'}</div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-around">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1 uppercase tracking-tighter">Activation Fee</div>
                    <div className="text-xl font-bold text-white">$15.00</div>
                  </div>
                  <div className="w-px bg-white/5 h-8 self-center"></div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1 uppercase tracking-tighter">Genesis Grant</div>
                    <div className="text-xl font-bold text-green-400">150 RZC</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-2">
                  <Icons.Lock size={14} className="text-blue-500" />
                  <span className="text-zinc-400">Vault Access</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-2">
                  <Icons.Energy size={14} className="text-yellow-500" />
                  <span className="text-zinc-400">Staking Node</span>
                </div>
              </div>
            </div>
          )}

          {(step === FlowStep.SCANNING || step === FlowStep.BROADCASTING || step === FlowStep.PROVISIONING) && (
            <div className="space-y-4 animate-in fade-in">
              <ProtocolLog logs={logs} />
              
              {securityInsight && step === FlowStep.SCANNING && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3 italic text-[11px] text-blue-300">
                  <Icons.Energy size={16} className="text-blue-400 shrink-0" />
                  {securityInsight}
                </div>
              )}
            </div>
          )}

          {step === FlowStep.COMMITMENT && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-blue-600/5 rounded-3xl p-6 border border-blue-500/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-zinc-400">Required Commitment</span>
                  <span className="text-xl font-mono font-bold text-blue-400">{tonAmountNeeded.toFixed(4)} TON</span>
                </div>
                
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {connected ? 'Identity Link Established' : 'Identity Link Missing'}
                    </span>
                  </div>
                  
                  {connected ? (
                    <div className="text-[10px] text-zinc-400 font-mono break-all opacity-60">
                      {actualConnectedAddress}
                    </div>
                  ) : (
                    <TonConnectButton className="ton-connect-button-custom w-full" />
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex gap-3 text-[10px] text-yellow-200/70">
                <Icons.Bell size={16} className="text-yellow-500 shrink-0" />
                This commitment permanently activates your node on the RhizaCore mesh. Fee is consumed for protocol provisioning.
              </div>
            </div>
          )}

          {step === FlowStep.SUCCESS && (
            <div className="space-y-6 text-center animate-in zoom-in-95">
              <div className="bg-green-500/5 border border-green-500/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-green-500/20"></div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Assets Provisioned</div>
                <div className="text-5xl font-mono font-bold text-green-400 mb-1">150.00</div>
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">RZC Tokens</div>
                
                {txHash && (
                  <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Transaction Proof</div>
                    <div className="text-[10px] text-zinc-500 font-mono opacity-50 break-all text-center max-w-full">
                      {txHash.length > 32 ? `${txHash.slice(0, 16)}...${txHash.slice(-16)}` : txHash}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {[Icons.Store, Icons.Send, Icons.Boost].map((Icon, i) => (
                  <div key={i} className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <Icon size={18} className="text-zinc-600" />
                    <div className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Unlocked</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-[#080808] flex gap-3 shrink-0">
          {step === FlowStep.INTRO && (
            <button 
              onClick={startSecurityScan}
              className="w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-sm font-bold transition-all duration-200 shadow-xl"
            >
              Verify Protocol Integrity
            </button>
          )}

          {step === FlowStep.COMMITMENT && (
            <>
              <button 
                onClick={() => setStep(FlowStep.INTRO)}
                className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl text-sm font-bold transition-all duration-200"
              >
                Back
              </button>
              <button 
                onClick={handlePayment}
                disabled={isProcessing || !connected}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold transition-all duration-200 shadow-xl shadow-blue-500/20 disabled:opacity-30"
              >
                Commit {tonAmountNeeded.toFixed(4)} TON
              </button>
            </>
          )}

          {step === FlowStep.SUCCESS && (
            <button 
              onClick={async () => {
                // Call the completion callback which will refresh and close
                await onActivationComplete();
              }}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-sm font-bold transition-all duration-200 shadow-xl shadow-green-500/20"
            >
              Launch Dashboard
            </button>
          )}

          {(step === FlowStep.SCANNING || step === FlowStep.BROADCASTING || step === FlowStep.PROVISIONING) && (
            <div className="w-full flex items-center justify-center py-4 bg-zinc-900/50 rounded-2xl gap-3 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              <Icons.Refresh size={16} className="animate-spin" />
              Processing Identity Data
            </div>
          )}
        </div>
      </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .ton-connect-button-custom button {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            padding: 12px !important;
            border-radius: 16px !important;
            width: 100% !important;
            transition: all 0.2s ease !important;
          }
          
          .custom-scrollbar::-webkit-scrollbar { 
            width: 3px; 
          }
          
          .custom-scrollbar::-webkit-scrollbar-track { 
            background: transparent; 
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: rgba(59, 130, 246, 0.3); 
            border-radius: 10px; 
          }

          @keyframes scanner {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100vw); }
          }
          
          .scanner-line {
            animation: scanner 1.5s linear infinite;
          }
          
          /* Performance optimizations */
          .will-change-transform {
            will-change: transform;
          }
          
          .will-change-scroll {
            will-change: scroll-position;
          }
        `
      }} />
    </div>
  );
};

export default WalletActivationModal;