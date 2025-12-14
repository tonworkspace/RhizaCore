import React, { useState, useEffect } from 'react';
import { User, Check, AlertCircle } from 'lucide-react';
import { useWalletAuth } from '../../contexts/AuthContext';
import { updateUserProfile, getUserByUsername } from '../../lib/supabaseClient';
import { initData, useSignal } from '@telegram-apps/sdk-react';

const UsernameSetup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const { user, walletAddress, updateUser, refreshUser } = useWalletAuth();
  const telegramData = useSignal(initData.state);

  useEffect(() => {
    if (telegramData?.user) {
      const telegramUser = telegramData.user;
      const suggestedUsername = telegramUser.username || `user_${telegramUser.id}`;
      setUsername(suggestedUsername.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      setDisplayName(telegramUser.firstName || telegramUser.lastName || suggestedUsername);
    }
  }, [telegramData]);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const existingUser = await getUserByUsername(usernameToCheck);
      setIsAvailable(!existingUser);
    } catch (error) {
      console.error('Error checking username:', error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric characters and underscores
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    
    // Debounce username check
    if (sanitized !== username) {
      setIsAvailable(null);
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !walletAddress || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const updatedUser = await updateUserProfile(walletAddress, {
        username,
        display_name: displayName || username,
      });

      updateUser(updatedUser);
      await refreshUser();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate key value')) {
        setError('This username is already taken. Please choose another.');
      } else {
        setError('Failed to set username. Please try again.');
      }
      console.error('Username setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.length >= 3 && isAvailable === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background particles effect to match ArcadeMiningUI */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/5 via-black to-green-900/5"></div>
        <div className="absolute inset-0 opacity-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-green-500/20 rounded-full animate-pulse"
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-400 mb-2">Choose your username</h1>
          <p className="text-green-300">This is how friends will find and pay you</p>
        </div>

        {/* Setup Form */}
        <div className="relative overflow-hidden rounded-2xl font-mono
                        bg-gradient-to-br from-black via-[#0a0a0f] to-black
                        border border-green-500/20
                        shadow-[0_0_30px_rgba(34,197,94,0.1)]
                        backdrop-blur-sm
                        p-6">
          {/* Corner accents */}
          <div className="pointer-events-none absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-green-500/40 rounded-tl-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
          <div className="pointer-events-none absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-green-500/40 rounded-tr-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
          <div className="pointer-events-none absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-green-500/40 rounded-bl-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
          <div className="pointer-events-none absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-green-500/40 rounded-br-lg shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-green-300 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-green-400 font-medium">@</span>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="yourusername"
                    className={`w-full px-4 py-3 bg-gray-900/50 border border-green-500/20 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-white pl-8 pr-10 ${
                      username.length >= 3
                        ? isAvailable === true
                          ? 'border-green-300 focus:ring-green-500'
                          : isAvailable === false
                          ? 'border-red-300 focus:ring-red-500'
                          : ''
                        : ''
                    }`}
                    maxLength={20}
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isChecking ? (
                      <div className="w-4 h-4 border-2 border-green-300 border-t-green-500 rounded-full animate-spin" />
                    ) : username.length >= 3 ? (
                      isAvailable === true ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : isAvailable === false ? (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      ) : null
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-green-400/60">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                  {username.length >= 3 && isAvailable === false && (
                    <p className="text-xs text-red-400">
                      This username is already taken
                    </p>
                  )}
                  {username.length >= 3 && isAvailable === true && (
                    <p className="text-xs text-green-400">
                      Username is available!
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-green-300 mb-2">
                  Display name (optional)
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-green-500/20 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-white"
                  maxLength={50}
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-green-400/60">
                  How your name appears to other users
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-4 focus:ring-green-500/30 shadow-lg w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Complete setup'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 relative overflow-hidden rounded-xl font-mono
                        bg-gradient-to-r from-gray-900/50 to-gray-800/50
                        border border-green-500/20
                        p-4">
          {/* Corner accents */}
          <div className="pointer-events-none absolute -top-2 -left-2 w-6 h-6 border-t border-l border-green-500/40 rounded-tl-lg"></div>
          <div className="pointer-events-none absolute -top-2 -right-2 w-6 h-6 border-t border-r border-green-500/40 rounded-tr-lg"></div>
          <div className="pointer-events-none absolute -bottom-2 -left-2 w-6 h-6 border-b border-l border-green-500/40 rounded-bl-lg"></div>
          <div className="pointer-events-none absolute -bottom-2 -right-2 w-6 h-6 border-b border-r border-green-500/40 rounded-br-lg"></div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-300">
                Your wallet address
              </h3>
              <p className="mt-1 text-sm text-green-400/80">
                {user?.wallet_address && (
                  <span className="font-mono text-xs break-all text-green-300">
                    {user.wallet_address}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetup;
