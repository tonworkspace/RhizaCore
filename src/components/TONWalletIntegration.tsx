import React, { useState } from 'react';
import { useTON } from '../hooks/useTON';
import { Icons } from './Icon';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

interface TONWalletIntegrationProps {
  userId: number;
  userAddress?: string;
  showSnackbar?: (data: { message: string; description?: string }) => void;
}

const TONWalletIntegration: React.FC<TONWalletIntegrationProps> = ({
  userId,
  userAddress,
  showSnackbar
}) => {
  const [showTONDetails, setShowTONDetails] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const connectedAddress = useTonAddress();
  
  const {
    balance,
    isLoading,
    error,
    deposits,
    networkInfo,
    refreshBalance,
    createDeposit
  } = useTON(userId, userAddress);

  const isWalletConnected = !!connectedAddress;

  const handleQuickDeposit = async (amount: number) => {
    const deposit = await createDeposit(amount);
    if (deposit) {
      showSnackbar?.({
        message: 'Deposit Created',
        description: `Send ${amount} TON to: ${networkInfo.depositAddress.slice(0, 12)}...`
      });
    }
  };

  const copyDepositAddress = async () => {
    try {
      await navigator.clipboard.writeText(networkInfo.depositAddress);
      showSnackbar?.({
        message: 'Address Copied',
        description: 'Deposit address copied to clipboard'
      });
    } catch (err) {
      showSnackbar?.({
        message: 'Copy Failed',
        description: 'Failed to copy address'
      });
    }
  };

  const pendingDeposits = deposits.filter(d => d.status === 'pending');

  return (
    <div className="space-y-4">
      {/* TON Connect Integration */}
      {!isWalletConnected && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icons.Wallet size={24} className="text-blue-400" />
          </div>
          <h4 className="text-white font-bold text-sm mb-2">Connect TON Wallet</h4>
          <p className="text-gray-400 text-xs mb-4">
            Connect your TON wallet for direct deposits and enhanced features
          </p>
          <TonConnectButton 
            style={{
              width: '100%',
              maxWidth: '250px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0088cc, #0066aa)',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              margin: '0 auto'
            }}
          />
        </div>
      )}

      {/* Connected Wallet Info */}
      {isWalletConnected && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <Icons.Wallet size={16} className="text-green-400" />
            </div>
            <div>
              <h4 className="text-green-400 font-bold text-sm">Wallet Connected</h4>
              <p className="text-green-300 text-xs font-mono">
                {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-8)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => tonConnectUI.disconnect()}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-2 px-3 rounded-lg transition-colors text-xs"
            >
              Disconnect
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(connectedAddress)}
              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold py-2 px-3 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <Icons.Copy size={12} />
              Copy Address
            </button>
          </div>
        </div>
      )}

      {/* TON Balance Card */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 font-bold text-sm">💎</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">TON Balance</h3>
              <p className="text-gray-400 text-xs">{networkInfo.networkName}</p>
            </div>
          </div>
          <button
            onClick={refreshBalance}
            disabled={isLoading}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Icons.Refresh size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className="text-white text-2xl font-bold">
            {balance.toFixed(4)}
          </span>
          <span className="text-blue-400 text-sm font-bold mb-1">TON</span>
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowTONDetails(!showTONDetails)}
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold py-2 px-3 rounded-lg transition-colors text-xs"
          >
            {showTONDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={() => handleQuickDeposit(1)}
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs"
          >
            Quick Deposit
          </button>
        </div>
      </div>

      {/* Pending Deposits Alert */}
      {pendingDeposits.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Clock size={14} className="text-orange-400" />
            <span className="text-orange-400 text-xs font-bold">
              {pendingDeposits.length} Pending Deposit{pendingDeposits.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-orange-300 text-xs">
            Send TON to the deposit address to complete your deposits.
          </p>
        </div>
      )}

      {/* TON Details Panel */}
      {showTONDetails && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
          <div>
            <h4 className="text-white font-bold text-sm mb-2">Network Information</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-white">{networkInfo.networkName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className={networkInfo.isMainnet ? 'text-green-400' : 'text-orange-400'}>
                  {networkInfo.isMainnet ? 'Mainnet' : 'Testnet'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-2">Deposit Address</h4>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2">
                <p className="text-white text-xs font-mono break-all">
                  {networkInfo.depositAddress}
                </p>
              </div>
              <button
                onClick={copyDepositAddress}
                className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-lg transition-colors"
              >
                <Icons.Copy size={14} />
              </button>
            </div>
          </div>

          {/* Quick Deposit Amounts */}
          <div>
            <h4 className="text-white font-bold text-sm mb-2">Quick Deposit</h4>
            <div className="grid grid-cols-3 gap-2">
              {[0.1, 0.5, 1.0].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickDeposit(amount)}
                  className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold py-2 px-3 rounded-lg transition-colors text-xs"
                >
                  {amount} TON
                </button>
              ))}
            </div>
          </div>

          {/* Recent Deposits */}
          {deposits.length > 0 && (
            <div>
              <h4 className="text-white font-bold text-sm mb-2">Recent Deposits</h4>
              <div className="space-y-2">
                {deposits.slice(0, 3).map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        deposit.status === 'confirmed' ? 'bg-green-500' :
                        deposit.status === 'pending' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-gray-400 text-xs">ID: {deposit.id}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xs font-bold">{deposit.amount} TON</p>
                      <p className={`text-xs uppercase ${
                        deposit.status === 'confirmed' ? 'text-green-400' :
                        deposit.status === 'pending' ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {deposit.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TONWalletIntegration;