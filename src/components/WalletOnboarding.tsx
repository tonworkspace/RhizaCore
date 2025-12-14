import React, { useState } from 'react';
import { AuthProvider, useWalletAuth } from '@/contexts/AuthContext';
// import LoginForm from '@/components/auth/LoginForm';
import UsernameSetup from '@/components/auth/UsernameSetup';
import Layout from '@/components/ui/Layout';
import BalanceDisplay from '@/components/payments/BalanceDisplay';
import UserSearch from '@/components/users/UserSearch';
import SendPayment, { type PaymentData } from '@/components/payments/SendPayment';
import PaymentConfirm from '@/components/payments/PaymentConfirm';
import TransactionHistory from '@/components/transactions/TransactionHistory';
import { type User } from '@/lib/rhizacoreClient';
import EnhancedLoginForm from './auth/EnhancedLoginForm';

type PaymentFlow = 'search' | 'form' | 'confirm';

const WalletOnboardingContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useWalletAuth();
  const [currentTab, setCurrentTab] = useState<'home' | 'send' | 'activity' | 'search' | 'profile'>('home');
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>('search');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  if (isLoading) {
    return (
      <Layout currentTab="home" onTabChange={() => {}}>
        <div className="flex items-center justify-center bg-gradient-to-br from-black via-[#0a0a0f] to-black">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-green-400">Loading wallet...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <EnhancedLoginForm />;
  }

  if (!user?.username) {
    return <UsernameSetup />;
  }

  const handleUserSelectForPayment = (selectedUser: User) => {
    setSelectedRecipient(selectedUser);
    setPaymentFlow('form');
  };

  const handlePaymentConfirm = (data: PaymentData) => {
    setPaymentData(data);
    setPaymentFlow('confirm');
  };

  const handlePaymentSuccess = () => {
    setCurrentTab('home');
    setPaymentFlow('search');
    setSelectedRecipient(null);
    setPaymentData(null);
  };

  const handleBackToSearch = () => {
    setPaymentFlow('search');
    setSelectedRecipient(null);
    setPaymentData(null);
  };

  const handleBackToForm = () => {
    setPaymentFlow('form');
    setPaymentData(null);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <div>
            <BalanceDisplay />
            {/* <TransactionHistory /> */}
          </div>
        );
      
      case 'send':
        if (paymentFlow === 'search') {
          return (
            <div className="p-4 space-y-6">
              <div className="venmo-card">
                <h2 className="text-lg font-semibold text-green-400 mb-4">Send Payment</h2>
                <UserSearch 
                  showPayButton={true}
                  onUserSelect={handleUserSelectForPayment}
                />
              </div>
            </div>
          );
        } else if (paymentFlow === 'form' && selectedRecipient) {
          return (
            <SendPayment
              recipient={selectedRecipient}
              onBack={handleBackToSearch}
              onPaymentConfirm={handlePaymentConfirm}
            />
          );
        } else if (paymentFlow === 'confirm' && paymentData) {
          return (
            <PaymentConfirm
              paymentData={paymentData}
              onBack={handleBackToForm}
              onSuccess={handlePaymentSuccess}
            />
          );
        }
        return null;
      
      case 'activity':
        return (
          <div className="p-4 space-y-6">
            <TransactionHistory />
          </div>
        );
      
      case 'search':
        return (
          <div className="p-4 space-y-6">
            <div className="venmo-card">
              <h2 className="text-lg font-semibold text-green-400 mb-4">Find Users</h2>
              <UserSearch 
                onUserSelect={(selectedUser) => {
                  setSelectedRecipient(selectedUser);
                  setCurrentTab('send');
                  setPaymentFlow('form');
                }}
              />
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="p-4 space-y-6">
            <div className="venmo-card">
              <h2 className="text-lg font-semibold text-green-400 mb-4">Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-500/20">
                    {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-green-400">
                      {user.display_name || user.username}
                    </h3>
                    <p className="text-green-300">@{user.username}</p>
                    <p className="text-sm text-green-200">{user.email}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-green-500/20">
                  <h4 className="text-sm font-medium text-green-300 mb-2">Wallet Address</h4>
                  <p className="text-xs font-mono text-green-200 break-all bg-gray-900/50 p-3 rounded-lg border border-green-500/20">
                    {user.wallet_address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleTabChange = (tab: 'home' | 'send' | 'activity' | 'search' | 'profile') => {
    setCurrentTab(tab);
    // Reset payment flow when changing tabs
    if (tab !== 'send') {
      setPaymentFlow('search');
      setSelectedRecipient(null);
      setPaymentData(null);
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={handleTabChange}>
      {renderTabContent()}
    </Layout>
  );
};

function WalletOnboarding() {
  return (
    <AuthProvider>
      <WalletOnboardingContent />
    </AuthProvider>
  );
}


export default WalletOnboarding;
export { WalletOnboarding };