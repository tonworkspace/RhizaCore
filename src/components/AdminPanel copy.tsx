import React, { useState, useEffect } from 'react';
import AdminAutoActivation from './AdminAutoActivation';
import AdminSetup from './AdminSetup';
import { AdminAuthService } from '../services/AdminAuthService';
import { useAuth } from '../hooks/useAuth';

interface AdminPanelProps {
  showSnackbar?: (data: { message: string; description?: string; type?: 'success' | 'error' | 'info' }) => void;
}

interface AdminCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverColor: string;
  action: () => void;
  available: boolean;
  badge?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ showSnackbar }) => {
  const [showAutoActivation, setShowAutoActivation] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLevel, setAdminLevel] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      // Convert user ID to integer for the admin service
      const userId = parseInt(user.id);
      const adminStatus = await AdminAuthService.checkAdminStatus(userId);
      setIsAdmin(adminStatus.isAdmin);
      setAdminLevel(adminStatus.adminLevel || '');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Define admin cards with enhanced structure
  const adminCards: AdminCard[] = [
    {
      id: 'auto-activation',
      title: 'Auto User Activation',
      description: 'Activate user wallets instantly without payment processing. Perfect for testing and special cases.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
      action: () => setShowAutoActivation(true),
      available: true,
      badge: 'Active'
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Comprehensive user account management, profile editing, and support request handling.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      hoverColor: 'hover:bg-green-500/20',
      action: () => showSnackbar?.({ message: 'Coming Soon', description: 'User management panel will be available in next update', type: 'info' }),
      available: false,
      badge: 'Soon'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Real-time system analytics, user statistics, performance metrics, and detailed reports.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
      action: () => showSnackbar?.({ message: 'Coming Soon', description: 'Analytics dashboard will be available in next update', type: 'info' }),
      available: false,
      badge: 'Soon'
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system parameters, update application settings, and manage global configurations.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      hoverColor: 'hover:bg-orange-500/20',
      action: () => showSnackbar?.({ message: 'Coming Soon', description: 'System settings panel will be available in next update', type: 'info' }),
      available: false,
      badge: 'Soon'
    },
    {
      id: 'database-tools',
      title: 'Database Tools',
      description: 'Database maintenance, schema migrations, data management, and backup operations.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      hoverColor: 'hover:bg-red-500/20',
      action: () => showSnackbar?.({ message: 'Coming Soon', description: 'Database tools will be available in next update', type: 'info' }),
      available: false,
      badge: 'Soon'
    },
    {
      id: 'support-tools',
      title: 'Support Center',
      description: 'Customer support tools, ticket management, live chat, and user assistance features.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      hoverColor: 'hover:bg-yellow-500/20',
      action: () => showSnackbar?.({ message: 'Coming Soon', description: 'Support tools will be available in next update', type: 'info' }),
      available: false,
      badge: 'Soon'
    }
  ];

  // Filter cards based on search and category
  const filteredCards = adminCards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'available' && card.available) ||
                           (selectedCategory === 'coming-soon' && !card.available);
    return matchesSearch && matchesCategory;
  });

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Tools', count: adminCards.length },
    { id: 'available', label: 'Available', count: adminCards.filter(c => c.available).length },
    { id: 'coming-soon', label: 'Coming Soon', count: adminCards.filter(c => !c.available).length }
  ];

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <div className="p-4 sm:p-6 bg-[#050505] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Checking Admin Access</h3>
          <p className="text-zinc-400 text-sm">Verifying your admin permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 bg-[#050505] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            You don't have admin privileges to access this panel. Contact your system administrator or set up the admin system.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowAdminSetup(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
            >
              Setup Admin System
            </button>
            <p className="text-xs text-zinc-500">
              If you believe this is an error, check your environment variables or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#050505] min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Panel</h1>
                  <p className="text-zinc-400 text-sm">
                    Welcome, {adminLevel === 'super' ? 'Super Admin' : 'Admin'} • User ID: {user?.id}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                adminLevel === 'super' 
                  ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-400 border-red-500/20' 
                  : 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-400 border-blue-500/20'
              }`}>
                {adminLevel === 'super' ? 'SUPER ADMIN' : 'ADMIN'}
              </div>
              <button
                onClick={() => setShowAdminSetup(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-sm transition-all duration-200 border border-white/5 hover:border-white/10"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Admin Setup
              </button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search admin tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {category.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-zinc-500'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {filteredCards.map((card, index) => (
            <div
              key={card.id}
              className={`group relative bg-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${card.hoverColor} ${
                !card.available ? 'opacity-75' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Badge */}
              {card.badge && (
                <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold ${
                  card.available 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                }`}>
                  {card.badge}
                </div>
              )}
              
              {/* Icon */}
              <div className={`w-14 h-14 ${card.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${card.color}`}>
                {card.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-200">
                {card.title}
              </h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed line-clamp-3">
                {card.description}
              </p>
              
              {/* Action Button */}
              <button
                onClick={card.action}
                disabled={!card.available}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 transform ${
                  card.available
                    ? `${card.color.replace('text-', 'bg-').replace('-400', '-600')} hover:${card.color.replace('text-', 'bg-').replace('-400', '-500')} text-white hover:scale-105 shadow-lg hover:shadow-xl`
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {card.available ? 'Open Tool' : 'Coming Soon'}
              </button>
              
              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No tools found</h3>
            <p className="text-zinc-400 mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Quick Stats Dashboard */}
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">System Overview</h2>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live Data
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: 'Total Users', value: '-', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Active Today', value: '-', color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Pending Tasks', value: '-', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'System Health', value: '98%', color: 'text-purple-400', bg: 'bg-purple-500/10' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value === '-' ? '•' : stat.value}
                  </div>
                </div>
                <div className="text-sm text-zinc-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-center text-xs text-zinc-600">
              Real-time statistics will be available when analytics module is implemented
            </p>
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