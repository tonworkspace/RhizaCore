// import { ConnectButton, useActiveAccount, useActiveWallet } from 'thirdweb/react';
// import { client } from '@/lib/client';
// import { defineChain } from 'thirdweb/chains';
// import { inAppWallet, smartWallet } from 'thirdweb/wallets';
// import { useState, useEffect } from 'react';
// import { useAuth } from '@/hooks/useAuth';
// import { supabase } from '@/lib/supabaseClient';

// // Persistent login storage key
// const PERSISTENT_LOGIN_KEY = 'rhizacore_wallet_persistent_login';

// // Smart Wallet Configuration
// const SMART_WALLET_FACTORY_ADDRESS = "0x3b6e802B9B661d9d206cc0619F4227a652358Fc3";
// const chain = defineChain(97);

// const WalletOnboarding: React.FC = () => {
//   const [authStep, setAuthStep] = useState<'initial' | 'connecting' | 'connected' | 'error'>('initial');
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
//   const [showSocialOptions, setShowSocialOptions] = useState(false);
//   const [walletAddress, setWalletAddress] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [persistentLogin, setPersistentLogin] = useState<boolean>(false);

//   const account = useActiveAccount();
//   const wallet = useActiveWallet();
//   const { user, updateUserData } = useAuth();

//   // Check connection status and persistent login
//   useEffect(() => {
//     checkPersistentLogin();

//     if (account && wallet) {
//       setAuthStep('connected');
//       setWalletAddress(account.address);
//     } else if (authStep !== 'initial') {
//       setAuthStep('initial');
//     }
//   }, [account, wallet, authStep]);

//   const handleConnectSuccess = async (address: string) => {
//     setIsLoading(true);
//     setErrorMessage(null);

//     try {
//       // Update user's wallet address in database
//       if (user && user.id) {
//         await updateUserData({ wallet_address: address });
//         await supabase
//           .from('users')
//           .update({ wallet_address: address })
//           .eq('id', user.id);
//       }

//       // Set persistent login if enabled
//       if (persistentLogin) {
//         localStorage.setItem(PERSISTENT_LOGIN_KEY, 'true');
//         localStorage.setItem('rhizacore_wallet_address', address);
//       }

//       setWalletAddress(address);
//       setAuthStep('connected');
//     } catch (error) {
//       console.error('Failed to update wallet address:', error);
//       setErrorMessage('Failed to complete wallet setup. Please try again.');
//       setAuthStep('error');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

//   const handleDisconnect = async () => {
//     setShowDisconnectConfirm(false);

//     try {
//       // Clear persistent login
//       localStorage.removeItem(PERSISTENT_LOGIN_KEY);
//       localStorage.removeItem('rhizacore_wallet_address');
//       setPersistentLogin(false);

//       // Disconnect from thirdweb wallet if connected and has an active account
//       if (wallet && account) {
//         try {
//           await wallet.disconnect();
//         } catch (disconnectError) {
//           console.warn('Wallet disconnect failed, but continuing with cleanup:', disconnectError);
//           // Continue with cleanup even if wallet disconnect fails
//         }
//       }

//       // Reset all state
//       setAuthStep('initial');
//       setWalletAddress(null);
//       setErrorMessage(null);

//       // Show success feedback
//       setAuthStep('initial');
//       setTimeout(() => {
//         // Optional: Show a toast or notification that disconnect was successful
//       }, 500);

//     } catch (error) {
//       console.error('Error during disconnect:', error);
//       setErrorMessage('Failed to disconnect. Please try again.');
//       setAuthStep('error');
//     }
//   };

//   const confirmDisconnect = () => {
//     setShowDisconnectConfirm(true);
//   };

//   const cancelDisconnect = () => {
//     setShowDisconnectConfirm(false);
//   };


//   // Check for persistent login and auto-connect if wallet address is saved
//   const checkPersistentLogin = () => {
//     const savedLogin = localStorage.getItem(PERSISTENT_LOGIN_KEY);
//     const savedAddress = localStorage.getItem('rhizacore_wallet_address');

//     if (savedLogin === 'true' && savedAddress) {
//       setPersistentLogin(true);
//       setWalletAddress(savedAddress);

//       // Check if the wallet is still connected
//       if (account && account.address === savedAddress) {
//         setAuthStep('connected');
//       }
//     }
//   };

//   const handleRecoveryOption = () => {
//     setShowRecoveryOptions(!showRecoveryOptions);
//     setShowSocialOptions(false);
//   };

//   const handleSocialOption = () => {
//     setShowSocialOptions(!showSocialOptions);
//     setShowRecoveryOptions(false);
//   };

//   const handleRetry = () => {
//     setAuthStep('initial');
//     setErrorMessage(null);
//   };

//   const wallets = [
//     inAppWallet({
//       auth: {
//         options: ["guest"],
//       },
//     }),
//   ];

//   return (
//     <div className="w-full max-w-md mx-auto p-6 space-y-6">
//       <div className="text-center mb-6">
//         <h2 className="text-2xl font-bold text-white mb-2">Web3 Wallet Setup</h2>
//         <p className="text-gray-300 text-sm">Connect your wallet to access all features</p>
//       </div>

//       {authStep === 'initial' && (
//         <div className="space-y-4">
//           <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl shadow-lg">
//             <center>
//             <ConnectButton
//               client={client}
//               accountAbstraction={{
//                 chain: defineChain(97),
//                 sponsorGas: true,
//               }}
//               connectModal={{
//                 showThirdwebBranding: false,
//                 size: "wide",
//                 title: "Connect Wallet",
//                 welcomeScreen: {
//                   title: "Welcome to RhizaCore",
//                   subtitle: "Connect your wallet to get started",
//                   img: {
//                     src: "https://rhizacore.xyz/shield.png",
//                     width: 200,
//                     height: 200
//                   }
//                 }
//               }}
//               theme="dark"
//               connectButton={{
//                 label: "Connect Wallet",
//                 className: "w-full bg-white text-black hover:bg-gray-100 transition-colors"
//               }}
//               onConnect={() => account && handleConnectSuccess(account.address)}
//             />
//             </center>

//             <div className="mt-4 text-center">
//               <button
//                 onClick={handleSocialOption}
//                 className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center mx-auto"
//               >
//                 <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                   <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
//                   <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
//                 </svg>
//                 More connection options
//               </button>
//             </div>

//             <div className="mt-4 text-center">
//               <button
//                 onClick={handleRecoveryOption}
//                 className="text-gray-400 hover:text-gray-300 text-sm"
//               >
//                 Having trouble? Recovery options
//               </button>
//             </div>

//             {/* Persistent Login Toggle */}
//             <div className="mt-4 flex items-center justify-center">
//               <label className="flex items-center cursor-pointer">
//                 <div className="relative">
//                   <input
//                     type="checkbox"
//                     className="sr-only"
//                     checked={persistentLogin}
//                     onChange={() => setPersistentLogin(!persistentLogin)}
//                   />
//                   <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
//                   <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${persistentLogin ? 'transform translate-x-full' : ''}`}></div>
//                 </div>
//                 <div className="ml-3">
//                   <span className="text-gray-300 text-sm">Stay logged in</span>
//                 </div>
//               </label>
//             </div>
//           </div>
//         </div>
//       )}

//       {authStep === 'connected' && walletAddress && (
//         <div className="bg-green-900/50 border border-green-500 p-6 rounded-xl text-center">
//           <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h3 className="text-white text-xl font-semibold mb-2">Wallet Connected!</h3>
//           <div className="bg-gray-800 px-3 py-2 rounded-lg mb-4 break-all">
//             <span className="text-gray-300 text-sm">{walletAddress}</span>
//           </div>


//           <p className="text-green-400 text-sm mb-4">Your wallet is ready to use</p>

//           {/* Persistent Login Status */}
//           {persistentLogin && (
//             <div className="flex items-center justify-center mb-4">
//               <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
//               <span className="text-green-400 text-xs">Stay logged in: Enabled</span>
//             </div>
//           )}

//           {/* Smart Wallet Indicator */}
//           <div className="bg-purple-900/50 border border-purple-500 px-3 py-2 rounded-lg mb-4 inline-block">
//             <div className="flex items-center justify-center space-x-2">
//               <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
//               <span className="text-purple-300 text-xs font-medium">
//                 🔐 Smart Wallet: Account Abstraction Enabled
//               </span>
//             </div>
//             <span className="text-xs text-purple-400 block mt-1">
//               Gasless transactions • Enhanced security
//             </span>
//           </div>

//           {/* Chain Switcher - Disabled for now due to type issues */}
//           <div className="flex justify-center space-x-2 mb-4">
//             <button
//               className="bg-gray-600 text-white px-3 py-1 rounded text-sm cursor-not-allowed"
//               disabled
//             >
//               BSC Testnet (Active)
//             </button>
//           </div>

//           <button
//             onClick={confirmDisconnect}
//             className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
//           >
//             Disconnect Wallet
//           </button>
//         </div>
//       )}

//       {authStep === 'error' && (
//         <div className="bg-red-900/50 border border-red-500 p-6 rounded-xl text-center">
//           <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h3 className="text-white text-xl font-semibold mb-2">Connection Failed</h3>
//           {errorMessage && (
//             <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
//           )}
//           <button
//             onClick={handleRetry}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       )}

//       {isLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-gray-900 p-6 rounded-xl text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
//             <p className="text-white">Completing wallet setup...</p>
//           </div>
//         </div>
//       )}

//       {/* Disconnect Confirmation Dialog */}
//       {showDisconnectConfirm && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
//           <div className="bg-gray-900 p-6 rounded-xl text-center max-w-sm mx-4">
//             <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
//               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//             <h3 className="text-white text-lg font-semibold mb-2">Disconnect Wallet?</h3>
//             <p className="text-gray-300 text-sm mb-6">
//               Are you sure you want to disconnect your wallet? You'll need to reconnect to access all features.
//             </p>
//             <div className="flex space-x-3">
//               <button
//                 onClick={cancelDisconnect}
//                 className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDisconnect}
//                 className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
//               >
//                 Disconnect
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WalletOnboarding;

