import React, { useState, useEffect } from 'react';
import { AutoActivationService, autoActivationHelpers, type ActivationStats } from '../services/AutoActivationService';

interface AdminAutoActivationProps {
  onClose?: () => void;
  showSnackbar?: (data: { message: string; description?: string; type?: 'success' | 'error' | 'info' }) => void;
}

const AdminAutoActivation: React.FC<AdminAutoActivationProps> = ({ onClose, showSnackbar }) => {
  const [stats, setStats] = useState<ActivationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  
  // Form states
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [userIds, setUserIds] = useState('');
  const [reason, setReason] = useState('Manual admin activation');
  const [rzcAmount, setRzcAmount] = useState(150);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statsData = await AutoActivationService.getActivationStats();
    setStats(statsData);
  };

  const handleSingleActivation = async () => {
    if (!userId) {
      showSnackbar?.({ message: 'Error', description: 'Please enter a user ID', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await AutoActivationService.activateUserById(parseInt(userId), reason, rzcAmount);
      
      if (result.success) {
        showSnackbar?.({ 
          message: 'Success', 
          description: `User ${result.username || userId} activated successfully`, 
          type: 'success' 
        });
        setUserId('');
        await loadStats();
      } else {
        showSnackbar?.({ message: 'Error', description: result.error, type: 'error' });
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameActivation = async () => {
    if (!username) {
      showSnackbar?.({ message: 'Error', description: 'Please enter a username', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await AutoActivationService.activateUserByUsername(username, reason, rzcAmount);
      
      if (result.success) {
        showSnackbar?.({ 
          message: 'Success', 
          description: `User ${username} activated successfully`, 
          type: 'success' 
        });
        setUsername('');
        await loadStats();
      } else {
        showSnackbar?.({ message: 'Error', description: result.error, type: 'error' });
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramActivation = async () => {
    if (!telegramId) {
      showSnackbar?.({ message: 'Error', description: 'Please enter a Telegram ID', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await AutoActivationService.activateUserByTelegramId(parseInt(telegramId), reason, rzcAmount);
      
      if (result.success) {
        showSnackbar?.({ 
          message: 'Success', 
          description: `User with Telegram ID ${telegramId} activated successfully`, 
          type: 'success' 
        });
        setTelegramId('');
        await loadStats();
      } else {
        showSnackbar?.({ message: 'Error', description: result.error, type: 'error' });
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkActivation = async () => {
    if (!userIds) {
      showSnackbar?.({ message: 'Error', description: 'Please enter user IDs', type: 'error' });
      return;
    }

    const ids = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length === 0) {
      showSnackbar?.({ message: 'Error', description: 'Please enter valid user IDs', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await AutoActivationService.bulkActivateUsers(ids, reason, rzcAmount);
      
      showSnackbar?.({ 
        message: 'Bulk Activation Complete', 
        description: `${result.success_count} users activated, ${result.error_count} errors`, 
        type: result.success_count > 0 ? 'success' : 'error' 
      });
      
      if (result.success_count > 0) {
        setUserIds('');
        await loadStats();
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickActions = async (action: string) => {
    setLoading(true);
    try {
      let result;
      
      switch (action) {
        case 'test_users':
          result = await autoActivationHelpers.activateTestUsers();
          break;
        case 'recent_users':
          result = await autoActivationHelpers.activateRecentUsers();
          break;
        case 'today_users':
          result = await autoActivationHelpers.activateTodayUsers();
          break;
        default:
          return;
      }

      showSnackbar?.({ 
        message: 'Quick Action Complete', 
        description: `${result.success_count} users activated, ${result.error_count} errors`, 
        type: result.success_count > 0 ? 'success' : 'info' 
      });
      
      if (result.success_count > 0) {
        await loadStats();
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewUsers = async (criteria: { usernamePattern?: string; createdAfter?: Date }) => {
    setLoading(true);
    try {
      const preview = await AutoActivationService.previewActivationCandidates(criteria);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-[#050505] border border-white/10 rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Auto User Activation</h2>
              <p className="text-zinc-500 text-sm mt-1">Admin panel for user wallet activation</p>
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

        {/* Stats */}
        {stats && (
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Current Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                <div className="text-2xl font-bold text-white">{stats.total_users}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Users</div>
              </div>
              <div className="bg-green-500/5 rounded-2xl p-4 border border-green-500/20">
                <div className="text-2xl font-bold text-green-400">{stats.activated_users}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Activated</div>
              </div>
              <div className="bg-yellow-500/5 rounded-2xl p-4 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-400">{stats.pending_users}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400">{stats.activation_rate}%</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Common Settings */}
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Activation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Activation reason..."
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">RZC Amount</label>
              <input
                type="number"
                value={rzcAmount}
                onChange={(e) => setRzcAmount(parseInt(e.target.value) || 150)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="150"
              />
            </div>
          </div>
        </div>

        {/* Individual Activation Methods */}
        <div className="p-6 space-y-6">
          
          {/* Single User by ID */}
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
            <h4 className="text-white font-semibold mb-3">Activate by User ID</h4>
            <div className="flex gap-3">
              <input
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Enter user ID..."
              />
              <button
                onClick={handleSingleActivation}
                disabled={loading || !userId}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                Activate
              </button>
            </div>
          </div>

          {/* By Username */}
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
            <h4 className="text-white font-semibold mb-3">Activate by Username</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Enter username..."
              />
              <button
                onClick={handleUsernameActivation}
                disabled={loading || !username}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                Activate
              </button>
            </div>
          </div>

          {/* By Telegram ID */}
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
            <h4 className="text-white font-semibold mb-3">Activate by Telegram ID</h4>
            <div className="flex gap-3">
              <input
                type="number"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Enter Telegram ID..."
              />
              <button
                onClick={handleTelegramActivation}
                disabled={loading || !telegramId}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                Activate
              </button>
            </div>
          </div>

          {/* Bulk Activation */}
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
            <h4 className="text-white font-semibold mb-3">Bulk Activate by IDs</h4>
            <div className="space-y-3">
              <textarea
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 h-20 resize-none"
                placeholder="Enter user IDs separated by commas (e.g., 123, 124, 125)..."
              />
              <button
                onClick={handleBulkActivation}
                disabled={loading || !userIds}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                Bulk Activate
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
            <h4 className="text-white font-semibold mb-3">Quick Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => handleQuickActions('test_users')}
                disabled={loading}
                className="py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                Activate Test Users
              </button>
              <button
                onClick={() => handleQuickActions('today_users')}
                disabled={loading}
                className="py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                Activate Today's Users
              </button>
              <button
                onClick={() => handleQuickActions('recent_users')}
                disabled={loading}
                className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                Activate Recent Users
              </button>
            </div>
            
            {/* Preview Actions */}
            <div className="border-t border-white/5 pt-4">
              <h5 className="text-sm text-zinc-400 mb-3">Preview Before Activation</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handlePreviewUsers({ usernamePattern: 'test' })}
                  disabled={loading}
                  className="py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                  Preview Test Users
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    handlePreviewUsers({ createdAfter: today });
                  }}
                  disabled={loading}
                  className="py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                  Preview Today's Users
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-red-500/5">
          <div className="flex items-center gap-3 text-red-400 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Admin functions - Use with caution. All activations are logged and irreversible.</span>
          </div>
        </div>

      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowPreview(false)}></div>
          <div className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-4xl relative z-10 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Preview Users for Activation</h3>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {previewData && previewData.length > 0 ? (
                <>
                  <div className="mb-4 text-sm text-zinc-400">
                    Found {previewData.length} users that would be activated:
                  </div>
                  <div className="space-y-2">
                    {previewData.map((user) => (
                      <div key={user.user_id} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-zinc-500">ID</div>
                            <div className="text-white font-mono">{user.user_id}</div>
                          </div>
                          <div>
                            <div className="text-zinc-500">Username</div>
                            <div className="text-white">{user.username}</div>
                          </div>
                          <div>
                            <div className="text-zinc-500">Display Name</div>
                            <div className="text-white">{user.display_name || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-zinc-500">Created</div>
                            <div className="text-white">{new Date(user.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  No users found matching the criteria.
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-semibold transition-colors"
              >
                Close Preview
              </button>
              {previewData && previewData.length > 0 && (
                <button
                  onClick={() => {
                    // This would trigger the actual activation
                    setShowPreview(false);
                    showSnackbar?.({ 
                      message: 'Feature Coming Soon', 
                      description: 'Direct activation from preview will be added in next update', 
                      type: 'info' 
                    });
                  }}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-colors"
                >
                  Activate {previewData.length} Users
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAutoActivation;