import React, { useState, useEffect } from 'react';
import AdminAutoActivation from './AdminAutoActivation';
import AdminSetup from './AdminSetup';
import { AdminAuthService } from '../services/AdminAuthService';
import { useAuth } from '../hooks/useAuth';

interface AdminPanelProps {
  showSnackbar?: (data: { message: string; description?: string; type?: 'success' | 'error' | 'info' }) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ showSnackbar }) => {
  const [showAutoActivation, setShowAutoActivation] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLevel, setAdminLevel] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }

    try {
      const userId = parseInt(user.id);
      const adminStatus = await AdminAuthService.checkAdminStatus(userId);
      setIsAdmin(adminStatus.isAdmin);
      setAdminLevel(adminStatus.adminLevel || '');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <div className="p-4 bg-[#050505] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-400 text-sm">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="p-4 bg-[#050505] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-zinc-400 mb-4 text-sm">
            You don't have admin privileges. Contact your administrator or set up the admin system.
          </p>
          <button
            onClick={() => setShowAdminSetup(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Setup Admin System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#050505] min-h-screen">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-zinc-400 text-xs">
                {adminLevel === 'super' ? 'Super Admin' : 'Admin'} • ID: {user?.id}
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          {/* Auto Activation - Primary Action */}
          <button
            onClick={() => setShowAutoActivation(true)}
            className="w-full p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-medium">Auto User Activation</h3>
                <p className="text-zinc-400 text-sm">Activate wallets instantly</p>
              </div>
              <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                Active
              </div>
            </div>
          </button>

          {/* Admin Setup */}
          <button
            onClick={() => setShowAdminSetup(true)}
            className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-medium">Admin Setup</h3>
                <p className="text-zinc-400 text-sm">Configure admin system</p>
              </div>
            </div>
          </button>
        </div>

        {/* Coming Soon Tools */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Coming Soon</h2>
          <div className="space-y-2">
            {[
              { name: 'User Management', icon: '👥' },
              { name: 'Analytics', icon: '📊' },
              { name: 'Database Tools', icon: '🗄️' },
              { name: 'Support Center', icon: '🎧' }
            ].map((tool, index) => (
              <button
                key={index}
                onClick={() => showSnackbar?.({ message: 'Coming Soon', description: `${tool.name} will be available in next update`, type: 'info' })}
                className="w-full p-3 bg-white/[0.02] border border-white/5 rounded-lg transition-colors hover:bg-white/[0.05] group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg">{tool.icon}</div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white text-sm font-medium">{tool.name}</h3>
                  </div>
                  <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                    Soon
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-medium">System Status</h2>
            <div className="flex items-center gap-1 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Online
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Users', value: '-' },
              { label: 'Active', value: '-' },
              { label: 'Tasks', value: '-' },
              { label: 'Health', value: '98%' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-2 bg-white/[0.02] rounded-lg">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAutoActivation && (
        <AdminAutoActivation
          onClose={() => setShowAutoActivation(false)}
          showSnackbar={showSnackbar}
        />
      )}
      {showAdminSetup && (
        <AdminSetup
          onClose={() => setShowAdminSetup(false)}
          showSnackbar={showSnackbar}
        />
      )}
    </div>
  );
};

export default AdminPanel;