import React, { useState, useEffect } from "react";
// Import Particle Auth hooks and provider
import {
  useEthereum,
  useSolana,
  useConnect,
  useAuthCore,
} from "@particle-network/authkit";

// Import Telegram SDK
import WebApp from "@twa-dev/sdk";
import { SmartAccount } from "@particle-network/aa";
import { BaseSepolia, EthereumSepolia } from "@particle-network/chains";
import { ethers, Eip1193Provider, Interface, parseEther, toBeHex } from "ethers"; // Eip1193Provider is the interface for the injected BrowserProvider
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  type IAssetsResponse,
  UniversalAccount,
} from "@particle-network/universal-account-sdk";

// Import icons from lucide-react
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  PlusCircle,
  Wallet,
  X,
  AlertTriangle,
  Send,
  FileSignature,
  RadioReceiver,
  Settings,
  LogOut
} from 'lucide-react';

// UI component to display links to the Particle sites
import TxNotification from "./TxNotification";

// Import the utility functions
import { formatBalance, truncateAddress } from "../utils/utils";

// Error boundary component for Wallet - Themed and Telegram-aware
class WalletErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Wallet error:', error, errorInfo);
  }

  handleRefresh = () => {
    // Check if we're in a Telegram Mini App context
    if (window.Telegram?.WebApp) {
      window.location.reload();
    } else {
      window.location.reload();
    }
  };

  handleClose = () => {
    // Check if we're in a Telegram Mini App context
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      window.close();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md mx-auto p-4">
           {/* Themed Error Display */}
           <div className="bg-red-900/50 border-2 border-red-600/70 rounded-2xl shadow-neon-red-light overflow-hidden p-6 text-center">
             <div className="w-16 h-16 bg-red-800/60 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-red-500/80">
               <AlertTriangle className="w-8 h-8 text-red-300" />
             </div>
             <h2 className="text-2xl font-bold text-red-300 mb-2">Wallet Error</h2>
             <p className="text-red-400/90 mb-6 text-sm">
               {this.state.error?.message || 'An unexpected error occurred.'}
             </p>
             <div className="flex gap-3 justify-center">
             <button
                 onClick={this.handleRefresh}
                 className="px-4 py-2 bg-blue-900/50 border-2 border-blue-600/70 text-blue-300 rounded-lg hover:bg-blue-800/60 hover:border-blue-500 transition-colors font-semibold"
               >
                 Refresh
               </button>
               <button
                 onClick={this.handleClose}
                 className="px-4 py-2 bg-red-900/50 border-2 border-red-600/70 text-red-300 rounded-lg hover:bg-red-800/60 hover:border-red-500 transition-colors font-semibold"
               >
                 Close
             </button>
             </div>
           </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const RhizaCoreAIComingSoon: React.FC = () => {
  // Hooks to manage logins, data display, and transactions
  const { connect, disconnect, connectionStatus, connected } = useConnect();
  const { address: ethereumAddress, provider, chainInfo, signMessage, switchChain } = useEthereum();
  const { address } = useSolana();
  const {
    userInfo, // Standard user info, null is returned if not connected
    openAccountAndSecurity,
} = useAuthCore();

  // Telegram SDK
  const isTelegram = typeof window !== 'undefined' && window.Telegram?.WebApp;

  // Wallet UI State
  const [balance, setBalance] = useState<string>("0.00");
  const [solanaBalance, setSolanaBalance] = useState<string>("0.00");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ethers");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [smartAddress, setSmartAddress] = useState<string>("");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [isLoadingSolanaBalance, setIsLoadingSolanaBalance] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [hideBalances, setHideBalances] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showSend, setShowSend] = useState<boolean>(false);
  const [showReceive, setShowReceive] = useState<boolean>(false);
  const [showSign, setShowSign] = useState<boolean>(false);
  const [showCrossChain, setShowCrossChain] = useState<boolean>(false);
  const [showBatchTx, setShowBatchTx] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showChainSwitch, setShowChainSwitch] = useState<boolean>(false);

  // Cross-chain state
  const [selectedChain, setSelectedChain] = useState<string>(CHAIN_ID.BASE_MAINNET.toString());
  const [destinationChain, setDestinationChain] = useState<string>(CHAIN_ID.ETHEREUM_MAINNET.toString());
  const [bridgeAmount, setBridgeAmount] = useState<string>("0.01");

  // Batch transaction state
  const [batchTransactions, setBatchTransactions] = useState<Array<{
    to: string;
    value: string;
    data?: string;
  }>>([{ to: "", value: "0.001", data: "" }]);

  // Multi-chain balances
  const [multiChainBalances, setMultiChainBalances] = useState<{
    [chainId: string]: { balance: string; symbol: string; }
  }>({});

  // Universal Account states
  const [transactionUrl, setTransactionUrl] = useState<string>("");
  const [universalAccount, setUniversalAccount] = useState<UniversalAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState({
    ownerAddress: "",
    evmSmartAccount: "",
    solanaSmartAccount: "",
  });
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(null);

  // Create provider instance with ethers V6
  // use new ethers.providers.Web3Provider(provider, "any"); for Ethers V5
  const ethersProvider = new ethers.BrowserProvider(
    provider as Eip1193Provider,
    "any"
  );

  // Effect to Expand Viewport (Telegram Mini App)
  useEffect(() => {
    if (isTelegram) {
      WebApp.expand();
    }
  }, [isTelegram]);

  // Auto-connect on mount if not connected
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      connect({});
    }
  }, [connectionStatus, connect]);

  // Fetch the balance when userInfo or chainInfo changes
  useEffect(() => {
    if (userInfo) {
      fetchBalance();
    }
  }, [userInfo, chainInfo]);

  // Initialize Smart Account
  useEffect(() => {
    if (provider) {
      try {
        const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '03d95eaa-1827-4a77-b48b-7a843b58ad4b';
        const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY || 'cBrWkx5HLafxEdQ9NVrFGUXA9zYQ38bYOL1JhVd4';
        const appId = process.env.NEXT_PUBLIC_APP_ID || 'cbaa01ef-7f6a-462b-9f22-26e83a3ffdde';

        const smartAccountInstance = new SmartAccount(provider, {
          projectId,
          clientKey,
          appId,
          aaOptions: {
            accountContracts: {
              SIMPLE: [
                {
                  version: "2.0.0",
                  chainIds: [EthereumSepolia.id, BaseSepolia.id],
                },
              ],
            },
          },
        });
        setSmartAccount(smartAccountInstance);
      } catch (error) {
        console.error("Failed to initialize smart account:", error);
      }
    }
  }, [provider]);

  // Fetch Smart Wallet Address
  useEffect(() => {
    const fetchAddress = async () => {
      if (smartAccount) {
        try {
          const smartWalletAddress = await smartAccount.getAddress();
          setSmartAddress(smartWalletAddress);
        } catch (error) {
          console.error("Failed to fetch smart wallet address:", error);
        }
      }
    };
    fetchAddress();
  }, [smartAccount]);

  // Initialize UniversalAccount
  useEffect(() => {
    if (connected && ethereumAddress) {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '03d95eaa-1827-4a77-b48b-7a843b58ad4b';
      const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY || 'cBrWkx5HLafxEdQ9NVrFGUXA9zYQ38bYOL1JhVd4';
      const appId = process.env.NEXT_PUBLIC_APP_ID || 'cbaa01ef-7f6a-462b-9f22-26e83a3ffdde';

      const ua = new UniversalAccount({
        projectId,
        projectClientKey: clientKey,
        projectAppUuid: appId,
        ownerAddress: ethereumAddress,
        tradeConfig: {
          slippageBps: 100,
          universalGas: true,
        },
      });
      console.log("UniversalAccount initialized:", ua);
      setUniversalAccount(ua);
    } else {
      setUniversalAccount(null);
    }
  }, [connected, ethereumAddress]);

  // Fetch Smart Account Addresses
  useEffect(() => {
    if (!universalAccount || !ethereumAddress) return;
    const fetchSmartAccountAddresses = async () => {
      const options = await universalAccount.getSmartAccountOptions();
      setAccountInfo({
        ownerAddress: ethereumAddress,
        evmSmartAccount: options.smartAccountAddress || "",
        solanaSmartAccount: options.solanaSmartAccountAddress || "",
      });
      console.log("Smart Account Options:", options);
    };
    fetchSmartAccountAddresses();
  }, [universalAccount, ethereumAddress]);

  // Fetch Primary Assets
  useEffect(() => {
    if (!universalAccount || !ethereumAddress) return;
    const fetchPrimaryAssets = async () => {
      const assets = await universalAccount.getPrimaryAssets();
      setPrimaryAssets(assets);
    };
    fetchPrimaryAssets();
  }, [universalAccount, ethereumAddress]);

  // Initialize multi-chain balances
  useEffect(() => {
    if (universalAccount && ethereumAddress) {
      fetchMultiChainBalances();
    }
  }, [universalAccount, ethereumAddress]);

  // Fetch Solana balance when address changes
  useEffect(() => {
    if (accountInfo.solanaSmartAccount || address) {
      fetchSolanaBalance();
    }
  }, [accountInfo.solanaSmartAccount, address]);

  // Copy address to clipboard
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Telegram-specific handlers
  // const handleOpenWallet = () => {
  //   openWallet({
  //     windowSize: "large",
  //     topMenuType: "close",
  //   });
  // };

  const handleLogout = () => {
    localStorage.clear();
    if (isTelegram) {
      WebApp.close();
    }
  };

  const handleAccountAndSecurity = () => {
    openAccountAndSecurity();
  };

  // Chain switching configuration (similar to provided code)
  const supportedChains = [
    { name: "EthereumSepolia", id: 11155111, fullname: "Ethereum Sepolia" },
    { name: "BaseSepolia", id: 84532, fullname: "Base Sepolia" },
  ];

  // Chain switching handler
  const handleChainSwitch = (key: string) => {
    if (key && switchChain) {
      const chainId = Number(key.split("-")[1]);
      switchChain(chainId);
    }
  };

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings && !(event.target as Element).closest('.settings-menu')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  // Fetch the user's balance in Ether
  const fetchBalance = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingBalance(true);
    }
    try {
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      const balanceResponse = await ethersProvider.getBalance(address);
      const balanceInEther = ethers.formatEther(balanceResponse);
      const fixedBalance = formatBalance(balanceInEther);

      setBalance(fixedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
    } finally {
      setIsLoadingBalance(false);
      setIsRefreshing(false);
    }
  };

  // Refresh balance with loading indicator
  const refreshBalance = async () => {
    setIsRefreshing(true);
    await fetchBalance(false);
    await fetchSolanaBalance(false);
  };

  // Fetch Solana balance
  const fetchSolanaBalance = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingSolanaBalance(true);
    }

    const solanaAddress = accountInfo.solanaSmartAccount || address;
    if (!solanaAddress) {
      setIsLoadingSolanaBalance(false);
      return;
    }

    // List of reliable Solana RPC endpoints to try in order
    const rpcEndpoints = [
      "https://mainnet.helius-rpc.com/?api-key=demo", // Helius (rate-limited demo)
      "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy (rate-limited demo)
      "https://api.mainnet-beta.solana.com", // Official Solana RPC
      "https://solana-api.projectserum.com", // Project Serum
      "https://rpc.ankr.com/solana" // Ankr
    ];

    let lastError: any = null;

    for (const endpoint of rpcEndpoints) {
      try {
        // Create connection to Solana mainnet with current endpoint
        const connection = new Connection(endpoint, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });

        // Convert address to PublicKey
        const publicKey = new PublicKey(solanaAddress);

        // Get balance in lamports with timeout
        const balance = await connection.getBalance(publicKey);

        // Convert to SOL
        const solBalance = balance / LAMPORTS_PER_SOL;
        setSolanaBalance(solBalance.toFixed(4));
        return; // Success, exit the loop

      } catch (error) {
        console.warn(`Failed to fetch Solana balance from ${endpoint}:`, error);
        lastError = error;
        continue; // Try next endpoint
      }
    }

    // If all endpoints failed, log the last error
    console.error("Error fetching Solana balance from all endpoints:", lastError);
    setSolanaBalance("0.0000");

    setIsLoadingSolanaBalance(false);
  };

  const handleLogin = async () => {
    if (!connected) {
      await connect({});
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  // Execute an Ethereum transaction
  // Simple transfer in this example
  const executeTxEvm = async () => {
    setIsSending(true);
    const signer = await ethersProvider.getSigner();
    const tx = {
      to: recipientAddress,
      value: ethers.parseEther("0.01"),
      data: "0x", // data is needed only when interacting with smart contracts. 0x equals to zero and it's here for demonstration only
    };

    try {
      const txResponse = await signer.sendTransaction(tx);
      const txReceipt = await txResponse.wait();
      if (txReceipt) {
        setTransactionHash(txReceipt.hash);
      } else {
        console.error("Transaction receipt is null");
      }
    } catch (error) {
      console.error("Error executing EVM transaction:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Sign a message using ethers as provider
  const signMessageEthers = async () => {
    const signer = await ethersProvider.getSigner();
    const signerAddress = await signer.getAddress();
    const message = "Gm Particle! Signing with ethers.";

    try {
      const result = await signMessage(message);
      alert(`Signed Message: ${result} by address ${signerAddress}.`);
    } catch (error: any) {
      alert(`Error with code ${error.code}: ${error.message}`);
      console.error("personal_sign", error);
    }
  };

  // Sign message using Particle Auth Natively
  const signMessageParticle = async () => {
    const message = "Gm Particle! Signing with Particle Auth.";

    try {
      const result = await signMessage(message);
      alert(`Signed Message: ${result} by address ${ethereumAddress}.`);
    } catch (error: any) {
      alert(`Error with code ${error.code}: ${error.message}`);
      console.error("personal_sign", error);
    }
  };

  // Send Cross-chain Transaction
  const handleTransaction = async () => {
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }
    const contractAddress = "0x14dcD77D7C9DA51b83c9F0383a995c40432a4578";
    const interf = new Interface(["function checkIn() public payable"]);
    const transaction = await universalAccount.createUniversalTransaction({
      chainId: CHAIN_ID.BASE_MAINNET,
      expectTokens: [
        {
          type: SUPPORTED_TOKEN_TYPE.ETH,
          amount: "0.0000001",
        },
      ],
      transactions: [
        {
          to: contractAddress,
          data: interf.encodeFunctionData("checkIn"),
          value: toBeHex(parseEther("0.0000001")),
        },
      ],
    });
    const signature = await provider.signMessage(transaction.rootHash);
    const sendResult = await universalAccount.sendTransaction(
      transaction,
      signature
    );
    setTransactionUrl(
      `https://universalx.app/activity/details?id=${sendResult.transactionId}`
    );
  };

  // Send USDT Transfer Transaction
  const handleTransferTransaction = async () => {
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }
    const transaction = await universalAccount.createBuyTransaction({
      token: {
        chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      },
      amountInUSD: "1",
    });
    const signature = await provider.signMessage(transaction.rootHash);
    const sendResult = await universalAccount.sendTransaction(
      transaction,
      signature
    );
    console.log("Transaction sent:", sendResult);
    setTransactionUrl(
      `https://universalx.app/activity/details?id=${sendResult.transactionId}`
    );
  };

  // Cross-chain Bridge Transaction
  const handleCrossChainBridge = async () => {
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }

    const transaction = await universalAccount.createUniversalTransaction({
      chainId: parseInt(destinationChain),
      expectTokens: [
        {
          type: SUPPORTED_TOKEN_TYPE.ETH,
          amount: bridgeAmount,
        },
      ],
      transactions: [
        {
          to: accountInfo.evmSmartAccount || ethereumAddress,
          data: "0x",
          value: toBeHex(parseEther(bridgeAmount)),
        },
      ],
    });

    const signature = await provider.signMessage(transaction.rootHash);
    const sendResult = await universalAccount.sendTransaction(
      transaction,
      signature
    );

    setTransactionUrl(
      `https://universalx.app/activity/details?id=${sendResult.transactionId}`
    );
  };

  // Batch Transaction
  const handleBatchTransaction = async () => {
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }

    const transactions = batchTransactions
      .filter(tx => tx.to && tx.value)
      .map(tx => ({
        to: tx.to,
        data: tx.data || "0x",
        value: toBeHex(parseEther(tx.value)),
      }));

    if (transactions.length === 0) return;

    const transaction = await universalAccount.createUniversalTransaction({
      chainId: parseInt(selectedChain),
      expectTokens: transactions.map(() => ({
        type: SUPPORTED_TOKEN_TYPE.ETH,
        amount: "0.0001",
      })),
      transactions,
    });

    const signature = await provider.signMessage(transaction.rootHash);
    const sendResult = await universalAccount.sendTransaction(
      transaction,
      signature
    );

    setTransactionUrl(
      `https://universalx.app/activity/details?id=${sendResult.transactionId}`
    );
  };

  // Add transaction to batch
  const addBatchTransaction = () => {
    setBatchTransactions([...batchTransactions, { to: "", value: "0.001", data: "" }]);
  };

  // Remove transaction from batch
  const removeBatchTransaction = (index: number) => {
    setBatchTransactions(batchTransactions.filter((_, i) => i !== index));
  };

  // Update batch transaction
  const updateBatchTransaction = (index: number, field: string, value: string) => {
    const updated = [...batchTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setBatchTransactions(updated);
  };

  // Fetch Multi-Chain Balances
  const fetchMultiChainBalances = async () => {
    if (!universalAccount || !ethereumAddress) return;

    const chains = [
      CHAIN_ID.ETHEREUM_MAINNET,
      CHAIN_ID.BASE_MAINNET,
      CHAIN_ID.ARBITRUM_MAINNET_ONE,
      CHAIN_ID.POLYGON_MAINNET,
    ];

    const balances: { [chainId: string]: { balance: string; symbol: string; } } = {};

    for (const chainId of chains) {
      try {
        // This would require additional API calls to get balances on different chains
        // For now, we'll show placeholder
        balances[chainId] = {
          balance: "0.00",
          symbol: "ETH"
        };
      } catch (error) {
        console.error(`Failed to fetch balance for chain ${chainId}:`, error);
      }
    }

    setMultiChainBalances(balances);
  };

  // Switch Network (Account Abstraction)
  // const switchNetwork = async (chainId: number) => {
  //   if (!provider) return;

  //   try {
  //     // Use the provider's request method to switch chains
  //     await provider.request({
  //       method: 'wallet_switchEthereumChain',
  //       params: [{ chainId: `0x${chainId.toString(16)}` }],
  //     });
  //     console.log(`Switched to chain ${chainId}`);
  //   } catch (error) {
  //     console.error("Failed to switch network:", error);
  //     // If the chain is not added to MetaMask, try to add it
  //     if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
  //       try {
  //         await provider.request({
  //           method: 'wallet_addEthereumChain',
  //           params: [{
  //             chainId: `0x${chainId.toString(16)}`,
  //             chainName: chainId === 1 ? 'Ethereum' : chainId === 8453 ? 'Base' : 'Unknown',
  //             rpcUrls: chainId === 1 ? ['https://mainnet.infura.io/v3/'] : chainId === 8453 ? ['https://mainnet.base.org'] : [],
  //             nativeCurrency: {
  //               name: 'ETH',
  //               symbol: 'ETH',
  //               decimals: 18,
  //             },
  //           }],
  //         });
  //       } catch (addError) {
  //         console.error("Failed to add network:", addError);
  //       }
  //     }
  //   }
  // };

  // The UI
  return (
    <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Telegram Header Controls */}
          {isTelegram && (
            <div className="absolute right-4 top-4 flex gap-3 z-10">
              <button
                className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-neon-purple hover:shadow-neon-purple-light transition-all"
                title="Open Wallet"
              >
                <Wallet className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-neon-purple hover:shadow-neon-purple-light transition-all"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {showSettings && (
                  <div className="settings-menu absolute right-0 mt-2 w-48 bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-neon-purple-light backdrop-blur-sm overflow-hidden z-20">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          handleAccountAndSecurity();
                          setShowSettings(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Account & Security
                      </button>
                      <button
                        onClick={() => {
                          setShowChainSwitch(true);
                          setShowSettings(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Switch Network
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowSettings(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl shadow-neon-purple-light overflow-hidden p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 shadow-neon-green' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                <span className="text-sm font-medium text-gray-300 capitalize">{connectionStatus}</span>
              </div>
              <div className="text-xs text-gray-500">Particle Network</div>
            </div>
        </div>

        {connectionStatus !== 'connected' ? (
            /* Loading/Connection Screen */
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl shadow-neon-purple-light overflow-hidden p-8 text-center backdrop-blur-sm">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full mx-auto mb-6 flex items-center justify-center shadow-neon-purple">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">RhizaCore Wallet</h1>

              {connectionStatus === 'connecting' && (
                <div className="text-gray-400 mb-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Connecting Wallet...
                </div>
              )}

              {connectionStatus === 'disconnected' && (
                <>
                  <p className="text-gray-400 mb-8">Connect your wallet to get started</p>
                  <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-purple hover:shadow-neon-purple-light flex items-center justify-center gap-3"
                  >
                    <Zap className="w-5 h-5" />
                    Sign in with Particle
                  </button>
                </>
              )}

              {/* Telegram-specific close button */}
              {isTelegram && connectionStatus === 'disconnected' && (
                <button
                  onClick={() => WebApp.close()}
                  className="mt-4 px-6 py-2 bg-red-900/50 border-2 border-red-600/70 text-red-300 rounded-lg hover:bg-red-800/60 hover:border-red-500 transition-colors font-semibold"
                >
                  Close App
                </button>
              )}
            </div>
        ) : (
            /* Main EVM Wallet */
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl shadow-neon-purple-light overflow-hidden backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center shadow-neon-purple">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">RhizaCore Wallet</h2>
                    <p className="text-xs text-gray-400">{chainInfo.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-2 bg-red-900/50 border border-red-600/70 text-red-300 rounded-lg hover:bg-red-800/60 hover:border-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Address Display */}
              <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/30 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Smart Account Address</p>
                    <p className="text-sm font-mono text-white truncate">
                      {truncateAddress(smartAddress || ethereumAddress || "")}
                    </p>
                  </div>
                  <button
                    onClick={() => copyAddress(smartAddress || ethereumAddress || "")}
                    className="ml-2 p-2 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors"
                  >
                    {copySuccess ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Smart Account Status */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Smart Account Status</div>
                <div className="text-white font-medium">
                  Deployed: {smartAccount ? 'Checking...' : 'Not Available'}
                </div>
              </div>

              {/* Balance Display */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Balance</span>
                  <button
                    onClick={refreshBalance}
                    disabled={isRefreshing}
                    className="p-1 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  {isLoadingBalance ? (
                    <div className="h-8 bg-gray-700/50 rounded animate-pulse w-24"></div>
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {balance}
                    </span>
                  )}
                  <span className="text-lg text-gray-400">{chainInfo.nativeCurrency.symbol}</span>
                </div>
              </div>

              {/* Chain Selection */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Network</div>
                <select
                  value={`${chainInfo.name}-${chainInfo.id}`}
                  onChange={(e) => handleChainSwitch(e.target.value)}
                  className="w-full p-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:border-green-500/50 focus:outline-none transition-colors"
                >
                  {supportedChains.map((chain) => (
                    <option
                      key={`${chain.fullname}-${chain.id}`}
                      value={`${chain.fullname}-${chain.id}`}
                    >
                      {chain.fullname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Send Transaction */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Recipient Address (0x...)"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full p-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none transition-colors"
                />
                <button
                  onClick={executeTxEvm}
                  disabled={!recipientAddress || isSending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50 shadow-neon-blue hover:shadow-neon-blue-light flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send 0.01 {chainInfo.nativeCurrency.symbol}
                    </>
                  )}
                </button>
                {transactionHash && (
                  <TxNotification hash={transactionHash} blockExplorerUrl={chainInfo.blockExplorers?.default.url || ""} />
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

// Wrap the component with error boundary for export
const RhizaCoreWallet = () => (
  <WalletErrorBoundary>
    <RhizaCoreAIComingSoon />
  </WalletErrorBoundary>
);

export default RhizaCoreWallet;

