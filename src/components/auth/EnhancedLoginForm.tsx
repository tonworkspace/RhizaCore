import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ConnectButton, useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { client, bscTestnet } from '@/lib/client';

const EnhancedLoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // const [authMethod, setAuthMethod] = useState<'wallet'>('wallet');
  // const [guestAccount, setGuestAccount] = useState(null);

  const { loginWithWallet } = useAuth();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();

  // Handle wallet connection changes
  useEffect(() => {
    if (activeAccount && activeAccount.address) {
      // Wallet connected successfully, proceed with login
      loginWithWallet(activeAccount.address)
        .then(() => {
          // Login successful
        })
        .catch((error) => {
          setError(error.message || 'Failed to complete wallet login');
        });
    }
  }, [activeAccount, loginWithWallet]);

  // Handle wallet connection
  const handleWalletConnect = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (activeAccount && activeWallet) {
        // Wallet already connected, proceed with login
        await loginWithWallet(activeAccount.address);
      }
      // If no wallet connected, the ConnectButton will handle the connection
    } catch (error) {
      setError('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {/* Background particles effect */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-black to-green-900/10"></div>
        <div className="absolute inset-0 opacity-15">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-green-500/30 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg rounded-full bg-gradient-to-br from-green-600 to-green-500">
            <img src='https://rhizacore.xyz/shield.png' alt="RhizaCore" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-green-400 mb-2">RhizaCore Wallet</h1>
          <p className="text-green-300">Secure Web3 Authentication</p>
        </div>

        {/* Login Form */}
        <div className="relative overflow-hidden rounded-2xl font-mono
                        bg-gradient-to-br from-black via-[#0a0a0f] to-black
                        border border-green-500/30
                        shadow-[0_0_40px_rgba(34,197,94,0.15)]
                        backdrop-blur-sm
                        p-8">
          {/* Corner accents */}
          <div className="pointer-events-none absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-green-500/40 rounded-tl-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>
          <div className="pointer-events-none absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-green-500/40 rounded-tr-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>
          <div className="pointer-events-none absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-green-500/40 rounded-bl-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>
          <div className="pointer-events-none absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-green-500/40 rounded-br-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>

          {/* Animated border */}
          <div className="absolute inset-0.5 bg-gradient-to-r from-transparent via-green-500/10 to-transparent rounded-2xl blur-sm animate-pulse"></div>

          <div className="space-y-6 relative z-10">
            <div>
              <h2 className="text-xl font-semibold text-green-300 mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-green-400/80 text-sm mb-6">
                Securely connect using your preferred wallet provider
              </p>
            </div>

            <div className="space-y-4">
              {/* Wallet Connection Button */}
              <div className="w-full flex items-center justify-center">
                <ConnectButton
                  client={client}
                  chain={bscTestnet}
                  appMetadata={{
                    name: "RhizaCore",
                    url: "https://rhizacore.xyz",
                    logoUrl: "https://rhizacore.com/shield.png",
                  }}
                  connectButton={{"label":"Login to RhizaCore"}}
                  connectModal={{
                    size: "wide",
                    showThirdwebBranding: false,
                    title: "Connect Smart Wallet to RhizaCore"
                  }}
                  onConnect={() => handleWalletConnect()}
                />
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-green-400">Connecting wallet...</span>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 transition-all duration-300">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Security features */}
              <div className="mt-6 pt-4 border-t border-green-500/20">
                <div className="space-y-2">
                  <div className="flex items-center text-green-400/80 text-xs">
                    <svg className="w-3 h-3 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    End-to-end encrypted
                  </div>
                  <div className="flex items-center text-green-400/80 text-xs">
                    <svg className="w-3 h-3 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                    </svg>
                    Non-custodial authentication
                  </div>
                  <div className="flex items-center text-green-400/80 text-xs">
                    <svg className="w-3 h-3 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    No personal data stored
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-green-400/60 text-sm">
            Powered by{' '}
            <a href="https://rhizacore.xyz" className="text-green-300 hover:underline font-medium">
              RhizaCore AI
            </a>
          </p>
          <p className="text-green-400/40 text-xs mt-1">
            © {new Date().getFullYear()} RhizaCore. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginForm;