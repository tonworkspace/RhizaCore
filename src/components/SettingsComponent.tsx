import React from 'react';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth provides user details
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import {
    User,
    Wallet,
    LogOut,
    ChevronRight,
    Copy,
    Check,
    HelpCircle,
    Users,
    FileText
} from 'lucide-react';
import { useState } from 'react';

// Helper function to format address
const formatAddress = (address: string | null | undefined) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const SettingsComponent: React.FC = () => {
    const { user } = useAuth(); // Get user data
    const [tonConnectUI] = useTonConnectUI();
    const connectedAddressString = useTonAddress();
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyAddress = async () => {
        if (!connectedAddressString) return;
        try {
            await navigator.clipboard.writeText(connectedAddressString);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy address:', err);
            // Optionally show an error snackbar
        }
    };

    const handleDisconnect = async () => {
        try {
            await tonConnectUI.disconnect();
            // Optionally clear local session data or trigger a state update
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    // Placeholder functions for actions
    const handleChangeTheme = () => console.log("Theme change clicked");
    const handleNotificationToggle = () => console.log("Notification toggle clicked");
    const handleChangeLanguage = () => console.log("Language change clicked");

    return (
        <div className="w-full max-w-md mx-auto p-4 font-mono text-green-400 space-y-5">
            {/* Header */}
            <h2 className="text-xl font-bold text-green-300 text-center mb-4">Settings</h2>

            {/* User Profile Section */}
            <div className="bg-gray-800/50 border border-green-800/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 border-b border-green-700/30 pb-3 mb-3">
                    <User className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-green-300">Profile</h3>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-green-300 font-medium">{user?.username || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-green-300 font-medium font-mono text-xs">{user?.id || 'N/A'}</span>
                </div>
                 {/* Optionally display Telegram ID if available */}
                 {user?.telegram_id && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Telegram ID:</span>
                        <span className="text-green-300 font-medium">{user.telegram_id}</span>
                    </div>
                 )}
            </div>

            {/* Wallet Section */}
            <div className="bg-gray-800/50 border border-green-800/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 border-b border-green-700/30 pb-3 mb-3">
                    <Wallet className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-green-300">Wallet</h3>
                </div>
                {connectedAddressString ? (
                    <>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-green-400 font-medium">Connected</span>
                        </div>
                        <div className="flex justify-between items-center text-sm gap-2">
                            <span className="text-gray-400">Address:</span>
                            <div className="flex items-center gap-1.5 bg-gray-700/50 px-2 py-1 rounded border border-gray-600/50">
                                <span className="text-green-300 font-mono text-xs">{formatAddress(connectedAddressString)}</span>
                                <button onClick={handleCopyAddress} className="text-gray-400 hover:text-green-300">
                                    {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="w-full mt-2 px-4 py-2 bg-red-900/50 border border-red-700/60 rounded-lg text-red-300 hover:bg-red-800/60 hover:border-red-600/80 transition-colors text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                            <LogOut size={16} />
                            Disconnect Wallet
                        </button>
                    </>
                ) : (
                    <div className="text-center space-y-3">
                        <p className="text-sm text-gray-400">Wallet not connected.</p>
                         {/* Consider adding the TonConnectButton here for easy connection */}
                         {/* <TonConnectButton /> */}
                         <button
                           onClick={() => tonConnectUI?.openModal()} // Example: Trigger connection modal
                           className="w-full px-4 py-2 bg-blue-900/50 border border-blue-700/60 rounded-lg text-blue-300 hover:bg-blue-800/60 hover:border-blue-600/80 transition-colors text-sm font-semibold flex items-center justify-center gap-1.5"
                         >
                            <Wallet size={16} />
                            Connect Wallet
                         </button>
                    </div>
                )}
            </div>

            {/* App Settings Section (Placeholders) */}
            <div className="bg-gray-800/50 border border-green-800/40 rounded-lg p-4 space-y-1">
                 <div className="flex items-center gap-3 border-b border-green-700/30 pb-3 mb-3">
                    {/* Placeholder Icon */}
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <h3 className="text-lg font-semibold text-green-300">App Settings</h3>
                </div>
                 {/* Theme (Placeholder) */}
                 <button onClick={handleChangeTheme} className="w-full flex justify-between items-center text-sm py-2 px-1 hover:bg-gray-700/50 rounded transition-colors disabled:opacity-50" disabled>
                     <span className="text-gray-300">Theme</span>
                     <div className="flex items-center gap-2">
                         <span className="text-green-400">Dark Mode</span>
                         <ChevronRight className="w-4 h-4 text-gray-500" />
                     </div>
                 </button>
                 {/* Notifications (Placeholder Toggle) */}
                 <div className="w-full flex justify-between items-center text-sm py-2 px-1">
                     <span className="text-gray-300">Notifications</span>
                     {/* Basic Toggle Placeholder */}
                     <button onClick={handleNotificationToggle} className="relative inline-flex items-center h-5 rounded-full w-9 transition-colors bg-gray-600 focus:outline-none disabled:opacity-50" disabled>
                         <span className="inline-block w-3 h-3 transform bg-white rounded-full transition-transform translate-x-1" /> {/* Example 'off' state */}
                     </button>
                 </div>
                 {/* Language (Placeholder) */}
                 <button onClick={handleChangeLanguage} className="w-full flex justify-between items-center text-sm py-2 px-1 hover:bg-gray-700/50 rounded transition-colors disabled:opacity-50" disabled>
                     <span className="text-gray-300">Language</span>
                     <div className="flex items-center gap-2">
                         <span className="text-green-400">English</span>
                         <ChevronRight className="w-4 h-4 text-gray-500" />
                     </div>
                 </button>
            </div>

             {/* Support & Community Section */}
             <div className="bg-gray-800/50 border border-green-800/40 rounded-lg p-4 space-y-1">
                 <div className="flex items-center gap-3 border-b border-green-700/30 pb-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-green-300">Support & Info</h3>
                </div>
                 {/* Link Items */}
                 {[
                    { label: 'Help Center', icon: HelpCircle, url: '#' }, // Replace # with actual URL
                    { label: 'Community Chat', icon: Users, url: 'https://t.me/Tapps_chat' }, // Example URL
                    { label: 'Documentation', icon: FileText, url: '#' } // Replace #
                 ].map(item => (
                    <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer" className="w-full flex justify-between items-center text-sm py-2 px-1 hover:bg-gray-700/50 rounded transition-colors group">
                        <div className="flex items-center gap-2">
                             <item.icon className="w-4 h-4 text-gray-400 group-hover:text-green-300 transition-colors" />
                            <span className="text-gray-300 group-hover:text-green-300 transition-colors">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
                    </a>
                 ))}
             </div>

              {/* Version Info */}
              <p className="text-center text-xs text-gray-500 pt-2">
                RhizaCore v1.0.0 (Beta)
              </p>
        </div>
    );
};

export default SettingsComponent;
