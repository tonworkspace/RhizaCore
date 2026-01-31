import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icons } from '../uicomponents/Icons';

interface AdminSetupProps {
  onClose?: () => void;
  showSnackbar?: (data: { message: string; description?: string; type?: 'success' | 'error' | 'info' }) => void;
}

interface SetupMethod {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const AdminSetup: React.FC<AdminSetupProps> = ({ onClose, showSnackbar }) => {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  // Form states
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [adminLevel, setAdminLevel] = useState<'super' | 'admin'>('super');

  const setupMethods: SetupMethod[] = [
    {
      id: 'user_id',
      title: 'By User ID',
      description: 'Set admin using database user ID',
      icon: Icons.User
    },
    {
      id: 'username',
      title: 'By Username',
      description: 'Set admin using username',
      icon: Icons.User
    },
    {
      id: 'telegram_id',
      title: 'By Telegram ID',
      description: 'Set admin using Telegram ID',
      icon: Icons.Telegram
    },
    {
      id: 'env_vars',
      title: 'Environment Variables',
      description: 'Configure via environment variables',
      icon: Icons.Settings
    }
  ];

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin initialization:', error);
        setIsInitialized(false);
        return;
      }

      setIsInitialized(data && data.length > 0);
    } catch (error) {
      console.error('Error checking initialization:', error);
      setIsInitialized(false);
    }
  };

  const handleInitializeByUserId = async () => {
    if (!userId) {
      showSnackbar?.({ message: 'Error', description: 'Please enter a user ID (UUID)', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('initialize_admin_system', {
        p_first_admin_user_id: userId, // UUID string
        p_admin_level: adminLevel
      });

      if (error) {
        showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
        return;
      }

      if (data.success) {
        showSnackbar?.({ 
          message: 'Success', 
          description: `Admin system initialized with user ID ${userId}`, 
          type: 'success' 
        });
        setIsInitialized(true);
        setUserId('');
      } else {
        showSnackbar?.({ message: 'Error', description: data.error, type: 'error' });
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeByUsername = async () => {
    if (!username) {
      showSnackbar?.({ message: 'Error', description: 'Please enter an email address', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // First get user ID from email (Supabase uses email for auth)
      const { data: userData, error: userError } = await supabase.rpc('get_user_id_by_email', {
        p_email: username // Using username field for email input
      });

      if (userError || !userData) {
        showSnackbar?.({ message: 'Error', description: 'User not found with that email', type: 'error' });
        return;
      }

      const { data, error } = await supabase.rpc('initialize_admin_system', {
        p_first_admin_user_id: userData,
        p_admin_level: adminLevel
      });

      if (error) {
        showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
        return;
      }

      if (data.success) {
        showSnackbar?.({ 
          message: 'Success', 
          description: `Admin system initialized for user ${username}`, 
          type: 'success' 
        });
        setIsInitialized(true);
        setUsername('');
      } else {
        showSnackbar?.({ message: 'Error', description: data.error, type: 'error' });
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeByTelegramId = async () => {
    if (!telegramId) {
      showSnackbar?.({ message: 'Error', description: 'Please enter a Telegram ID', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // First get user ID from telegram ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', parseInt(telegramId))
        .single();

      if (userError || !userData) {
        showSnackbar?.({ message: 'Error', description: 'User not found', type: 'error' });
        return;
      }

      const { data, error } = await supabase.rpc('initialize_admin_system', {
        p_first_admin_user_id: userData.id,
        p_admin_level: adminLevel
      });

      if (error) {
        showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
        return;
      }

      if (data.success) {
        showSnackbar?.({ 
          message: 'Success', 
          description: `Admin system initialized for Telegram ID ${telegramId}`, 
          type: 'success' 
        });
        setIsInitialized(true);
        setTelegramId('');
      } else {
        showSnackbar?.({ message: 'Error', description: data.error, type: 'error' });
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderMethodForm = () => {
    switch (selectedMethod) {
      case 'user_id':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">User ID</label>
              <input
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Enter user ID..."
              />
            </div>
            <button
              onClick={handleInitializeByUserId}
              disabled={loading || !userId}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
            >
              {loading ? 'Initializing...' : 'Initialize Admin System'}
            </button>
          </div>
        );

      case 'username':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Enter username..."
              />
            </div>
            <button
              onClick={handleInitializeByUsername}
              disabled={loading || !username}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
            >
              {loading ? 'Initializing...' : 'Initialize Admin System'}
            </button>
          </div>
        );

      case 'telegram_id':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Telegram ID</label>
              <input
                type="number"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Enter Telegram ID..."
              />
            </div>
            <button
              onClick={handleInitializeByTelegramId}
              disabled={loading || !telegramId}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
            >
              {loading ? 'Initializing...' : 'Initialize Admin System'}
            </button>
          </div>
        );

      case 'env_vars':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <h4 className="text-yellow-400 font-semibold mb-2">Environment Variables Setup</h4>
              <div className="text-sm text-zinc-300 space-y-2">
                <p>Add these environment variables to your .env file:</p>
                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs">
                  <div className="text-green-400"># Super Admin User IDs (comma-separated)</div>
                  <div>VITE_SUPER_ADMIN_IDS=1,2,3</div>
                  <div className="text-green-400 mt-2"># Super Admin Telegram IDs (comma-separated)</div>
                  <div>VITE_SUPER_ADMIN_TELEGRAM_IDS=123456789,987654321</div>
                </div>
                <p className="text-yellow-300">
                  Users with these IDs will automatically have super admin privileges without database setup.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isInitialized === null) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Checking admin system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-[#050505] border border-white/10 rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Admin System Setup</h2>
              <p className="text-zinc-500 text-sm mt-1">
                {isInitialized ? 'Admin system is initialized' : 'Initialize the admin system'}
              </p>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="p-6 border-b border-white/5">
          <div className={`flex items-center gap-3 p-4 rounded-2xl ${
            isInitialized 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-yellow-500/10 border border-yellow-500/20'
          }`}>
            {isInitialized ? (
              <>
                <Icons.Check size={20} className="text-green-400" />
                <div>
                  <div className="text-green-400 font-semibold">Admin System Initialized</div>
                  <div className="text-sm text-zinc-400">Admin users can now access the admin panel</div>
                </div>
              </>
            ) : (
              <>
                <Icons.Bell size={20} className="text-yellow-400" />
                <div>
                  <div className="text-yellow-400 font-semibold">Admin System Not Initialized</div>
                  <div className="text-sm text-zinc-400">Set up the first admin user to get started</div>
                </div>
              </>
            )}
          </div>
        </div>

        {!isInitialized && (
          <>
            {/* Admin Level Selection */}
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Admin Level</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAdminLevel('super')}
                  className={`p-4 rounded-xl border transition-colors ${
                    adminLevel === 'super'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold">Super Admin</div>
                  <div className="text-xs opacity-70">Full system access</div>
                </button>
                <button
                  onClick={() => setAdminLevel('admin')}
                  className={`p-4 rounded-xl border transition-colors ${
                    adminLevel === 'admin'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold">Admin</div>
                  <div className="text-xs opacity-70">Limited access</div>
                </button>
              </div>
            </div>

            {/* Setup Methods */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Setup Method</h3>
              
              {!selectedMethod ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {setupMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className="p-4 bg-white/[0.02] border border-white/10 rounded-xl hover:border-white/20 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon size={20} className="text-blue-400" />
                          <span className="font-semibold text-white">{method.title}</span>
                        </div>
                        <p className="text-sm text-zinc-400">{method.description}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setSelectedMethod('')}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Icons.ChevronRight size={16} className="text-zinc-400 rotate-180" />
                    </button>
                    <h4 className="text-white font-semibold">
                      {setupMethods.find(m => m.id === selectedMethod)?.title}
                    </h4>
                  </div>
                  
                  {renderMethodForm()}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-blue-500/5">
          <div className="flex items-center gap-3 text-blue-400 text-sm">
            <Icons.Bell size={16} />
            <span>
              {isInitialized 
                ? 'Admin system is ready. You can now manage users through the admin panel.'
                : 'Choose a setup method to create the first admin user and initialize the system.'
              }
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSetup;