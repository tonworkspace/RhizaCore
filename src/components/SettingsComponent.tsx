import React, { useState, useEffect } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { getTONBalance } from '../services/TONAPIService';
import {
  User,
  Wallet,
  LogOut,
  ChevronRight,
  Copy,
  Check,
  HelpCircle,
  Users,
  FileText,
  Globe,
  Bell,
  Volume2,
  Vibrate, // Represents haptics
  Send, // For Telegram
  ShieldCheck, // For Terms
  Power,
  RefreshCw, // Fallback icon
  ExternalLink,
  Zap,
  X // Replacing deprecated Twitter icon
} from 'lucide-react';

// --- Icons Wrapper for Consistency ---
const Icons = {
  User,
  Wallet,
  Logout: LogOut,
  ChevronRight,
  Copy,
  Check,
  Help: HelpCircle,
  Community: Users,
  File: FileText,
  Language: Globe,
  Notification: Bell,
  Sound: Volume2,
  Haptic: Vibrate,
  Twitter: X, // Using X instead of deprecated Twitter
  Telegram: Send,
  Terms: ShieldCheck,
  Power,
  Refresh: RefreshCw,
  ExternalLink,
  Zap
};

// --- Helper Functions ---
const formatAddress = (address: string | null | undefined) => {
  if (!address) return 'N/A';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// --- Reusable Setting Item Component ---
interface SettingItemProps {
  icon: any;
  label: string;
  value?: string;
  type?: 'arrow' | 'toggle' | 'link';
  onClick?: () => void;
  active?: boolean;
  href?: string;
  className?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, label, value, type = 'arrow', onClick, active, href, className }) => {
  const content = (
    <div 
      onClick={type !== 'link' ? onClick : undefined}
      className={`flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl mb-3 hover:bg-white/5 transition-all cursor-pointer group hover:border-green-500/20 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-black/40 text-gray-400 border border-white/5 group-hover:text-green-400 group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
          <Icon size={18} />
        </div>
        <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{label}</span>
      </div>

      {type === 'toggle' && (
        <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${active ? 'bg-green-500' : 'bg-zinc-700'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-1'}`}></div>
        </div>
      )}

      {type === 'arrow' && (
        <div className="flex items-center gap-2">
          {value && <span className="text-xs text-gray-500 font-mono">{value}</span>}
          <Icons.ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
      )}
      
      {type === 'link' && (
         <Icons.ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
      )}
    </div>
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : content;
};

const SettingsComponent: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [tonConnectUI] = useTonConnectUI();
  const connectedAddressString = useTonAddress();
  const wallet = useTonWallet();
  
  // --- State ---
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [preferSquadUI, setPreferSquadUI] = useState(() => {
    try {
      const saved = localStorage.getItem('prefer_squad_ui');
      return saved !== null ? JSON.parse(saved) : true; // Default to SquadUI
    } catch {
      return true;
    }
  });
  // const [soundEnabled, setSoundEnabled] = useState(true);
  // const [hapticEnabled, setHapticEnabled] = useState(true);

  // Language Logic
  const supportedLanguages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' },
  ];
  
  const detectedLang = (typeof navigator !== 'undefined' ? navigator.language?.slice(0,2) : 'en') || 'en';
  const [language, setLanguage] = useState<string>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('app_language') : null;
    return saved || (supportedLanguages.some(l => l.code === detectedLang) ? detectedLang : 'en');
  });
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // --- Handlers ---
  const handleCopyAddress = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      // Show copy alert
      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 3000);
    } catch (err) { console.error('Copy failed', err); }
  };

  const handleDisconnect = async () => {
    try { 
      await tonConnectUI.disconnect();
      setWalletBalance(0);
    } 
    catch (error) { console.error('Failed to disconnect:', error); }
  };

  const handleConnect = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Failed to open connect modal:', error);
    }
  };

  // Fetch wallet balance when connected
  const fetchWalletBalance = async () => {
    if (!connectedAddressString) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await getTONBalance(connectedAddressString);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Effect to fetch balance when wallet connects
  useEffect(() => {
    if (connectedAddressString) {
      fetchWalletBalance();
    } else {
      setWalletBalance(0);
    }
  }, [connectedAddressString]);

  const handleChangeLanguage = () => {
    setIsLanguageModalOpen(true);
  };
  
  const handleSelectLanguage = (langCode: string) => {
    setLanguage(langCode);
    setIsLanguageModalOpen(false);
    try { localStorage.setItem('app_language_user_set', '1'); } catch {}
  };

  const toggleUIPreference = () => {
    const newPreference = !preferSquadUI;
    setPreferSquadUI(newPreference);
    try {
      localStorage.setItem('prefer_squad_ui', JSON.stringify(newPreference));
      // Dispatch event for components to listen to
      window.dispatchEvent(new CustomEvent('app:ui-preference-change', { 
        detail: { preferSquadUI: newPreference } 
      }));
    } catch (error) {
      console.error('Failed to save UI preference:', error);
    }
  };

  // // Toggle handlers that persist to local storage (optional enhancement)
  // const toggleSound = () => {
  //     setSoundEnabled(!soundEnabled);
  //     // localStorage.setItem('sound_enabled', String(!soundEnabled)); 
  // };

  // const toggleHaptics = () => {
  //     setHapticEnabled(!hapticEnabled);
  //     // localStorage.setItem('haptic_enabled', String(!hapticEnabled));
  // };

  useEffect(() => {
    try {
      localStorage.setItem('app_language', language);
      // Dispatch event for I18nProvider to listen to if it doesn't poll localStorage
      window.dispatchEvent(new CustomEvent('app:language-change', { detail: { language } }));
    } catch {}
  }, [language]);

  // Derived Values
  const currentLangLabel = supportedLanguages.find(l => l.code === language)?.label || 'English';
  // Fallback for avatar letter
  const avatarLetter = user?.username ? user.username[0].toUpperCase() : 'U';
  // Mock rank or derive if you have it in user object
  // const userRank = (user as any)?.rank || 'NOVICE'; 

  return (
    <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar relative text-white">
      
      {/* Header */}
      <h1 className="text-xl font-bold text-white tracking-wider mb-6">{t('settings_title') || 'System Settings'}</h1>

      {/* Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#050a05] border border-green-500/20 mb-8 flex items-center gap-5 relative group shadow-lg">
         {/* Background Glow */}
         <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-green-500/15 transition-colors duration-500 -mr-10 -mt-10"></div>
         
         {/* Avatar */}
         <div className="relative z-10 flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-green-500/30 flex items-center justify-center text-green-400 text-2xl font-bold shadow-[0_0_20px_rgba(74,222,128,0.15)] group-hover:scale-105 transition-transform duration-300">
               {avatarLetter}
            </div>
            {/* Online Dot */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            </div>
         </div>
         
         {/* User Info */}
         <div className="z-10 flex-1 min-w-0">
             <h2 className="text-lg font-bold text-white truncate">{user?.username || 'Anonymous Node'}</h2>
             <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[12px] font-bold text-green-400 tracking-wide font-mono">
                  {formatAddress(connectedAddressString)}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">| {user?.telegram_id ? `ID: ${user.telegram_id}` : 'GUEST'}</span>
             </div>
         </div>
         
         {/* Copy ID Button */}
         <div className="z-10 flex-shrink-0">
             <button 
                onClick={() => handleCopyAddress(user?.id?.toString() || '')}
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    copySuccess 
                    ? 'bg-green-500 text-black border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
                    : 'bg-white/5 text-gray-400 hover:text-white border-white/10 hover:bg-white/10'
                }`}
             >
                 {copySuccess ? <Icons.Check size={18} /> : <Icons.Copy size={18} />}
             </button>
         </div>
      </div>

      {/* Wallet Section */}
      <div className="mb-8">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-2">{t('wallet') || 'Wallet Connection'}</h3>
          
          {connectedAddressString ? (
              <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-4 relative overflow-hidden group">
                  {/* Subtle pulsing background for connected state */}
                  <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20">
                              <Icons.Wallet size={20} />
                          </div>
                          <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                TON Connected
                                {wallet && (
                                  <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                    {wallet.device.appName}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-green-400/70 font-mono">{formatAddress(connectedAddressString)}</div>
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                <span>Balance:</span>
                                {isLoadingBalance ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-green-400 rounded-full animate-spin"></div>
                                ) : (
                                  <span className="text-white font-mono">{walletBalance.toFixed(4)} TON</span>
                                )}
                                <button
                                  onClick={fetchWalletBalance}
                                  className="text-gray-400 hover:text-green-400 transition-colors"
                                  disabled={isLoadingBalance}
                                >
                                  <Icons.Refresh size={12} className={isLoadingBalance ? 'animate-spin' : ''} />
                                </button>
                              </div>
                          </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="px-2 py-1 bg-green-500/20 rounded text-[9px] font-bold text-green-400 border border-green-500/20">
                            ACTIVE
                        </div>
                        <button 
                          onClick={() => handleCopyAddress(connectedAddressString)}
                          className={`p-1.5 rounded-lg border transition-all ${
                              copySuccess 
                              ? 'bg-green-500 text-black border-green-500' 
                              : 'bg-white/5 text-gray-400 hover:text-white border-white/10 hover:bg-white/10'
                          }`}
                        >
                            {copySuccess ? <Icons.Check size={12} /> : <Icons.Copy size={12} />}
                        </button>
                      </div>
                  </div>
                  
                  <div className="flex gap-0 relative z-10">
                    <button 
                      onClick={handleDisconnect}
                      className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Icons.Logout size={14} />
                        {t('disconnect_wallet') || 'Disconnect'}
                    </button>
                    
                  </div>
              </div>
          ) : (
              <div className="space-y-4">
                {/* Connect Button Card */}
                <div className="bg-zinc-900 border border-white/5 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center relative group hover:bg-zinc-800/50 hover:border-green-500/30 transition-all">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-gray-500 mb-3 group-hover:text-green-400 group-hover:bg-green-500/10 transition-colors">
                        <Icons.Wallet size={24} />
                    </div>
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white mb-2">{t('connect_wallet') || 'Connect TON Wallet'}</span>
                    <span className="text-xs text-gray-600 mb-4 text-center">Access deposits, withdrawals & direct payments</span>
                    
                    {/* TON Connect Button */}
                    {/* <div className="w-full max-w-xs">
                      <TonConnectButton 
                        className="ton-connect-button-custom"
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #0088cc, #0066aa)',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    </div>
                     */}
                    {/* Alternative Connect Button */}
                    <button
                      onClick={handleConnect}
                      className="mt-3 w-full max-w-xs py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-xl text-green-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Icons.Zap size={14} />
                        Alternative Connect
                    </button>
                </div>

                {/* Wallet Benefits */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
                    <Icons.Zap size={16} />
                    Wallet Benefits
                  </h4>
                  <ul className="text-blue-300 text-xs space-y-1">
                    <li>• Direct TON deposits and payments</li>
                    <li>• Instant RZC token transfers</li>
                    <li>• Secure transaction signing</li>
                    <li>• Access to premium features</li>
                  </ul>
                </div>

                {/* Supported Wallets */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="text-white text-sm font-bold mb-2">Supported Wallets</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Tonkeeper', 'TON Wallet', 'OpenMask', 'MyTonWallet'].map((walletName) => (
                      <span key={walletName} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                        {walletName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
          )}
      </div>

      {/* General Settings */}
      <div className="mb-6">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-2">{t('app_settings') || 'Configuration'}</h3>
          
          <SettingItem 
            icon={Icons.Language} 
            label={t('language') || 'Language'}
            value={currentLangLabel}
            onClick={handleChangeLanguage}
          />
      </div>

      {/* UI Settings */}
      <div className="mb-6">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-2">Interface Setup</h3>
          
          <div className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl mb-3 hover:bg-white/5 transition-all group hover:border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/40 text-gray-400 border border-white/5 group-hover:text-green-400 group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
                <Icons.Power size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors block">Default Squad Interface</span>
                <span className="text-xs text-gray-500">Use modern SquadUI by default</span>
              </div>
            </div>
            <div 
              onClick={toggleUIPreference}
              className={`w-11 h-6 rounded-full relative transition-colors duration-300 cursor-pointer ${preferSquadUI ? 'bg-green-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${preferSquadUI ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </div>
          </div>

          {/* UI Preference Description */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 mb-3">
            <div className="flex items-start gap-2">
              <div className="text-blue-400 mt-0.5">
                <Icons.Help size={14} />
              </div>
              <div className="text-xs text-gray-400 leading-relaxed">
                {preferSquadUI ? (
                  <>
                    <span className="text-green-400 font-bold">SquadUI Active:</span> Modern interface with enhanced visuals, 
                    alerts, and improved user experience. Switch to Classic UI anytime via the toggle button.
                  </>
                ) : (
                  <>
                    <span className="text-blue-400 font-bold">Classic UI Active:</span> Traditional interface with 
                    familiar layout. Switch to SquadUI anytime for enhanced features and modern design.
                  </>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* Community Links */}
      <div className="mb-6">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-2">Network Uplink</h3>
          <SettingItem icon={Icons.Telegram} label="RhizaCore Channel" type="link" href="https://t.me/RhizaCoreNews" />
          <SettingItem icon={Icons.Community} label="Community Chat" type="link" href="https://t.me/RhizaCore" />
          <SettingItem icon={Icons.Twitter} label="Follow on X" type="link" href="https://x.com/RhizaCore" />
      </div>

       {/* Support */}
      <div className="mb-8">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-2">Database</h3>
          <SettingItem icon={Icons.File} label="Whitepaper v1.0" type="link" href="https://drive.google.com/file/d/1jm3d7oES1YblsPP6UKHDt_EV7NR7joSq/view?usp=sharing" />
          <SettingItem icon={Icons.Terms} label="Website" type="link" href="https://rhizacore.xyz" />
      </div>

      {/* Footer */}
      <div className="text-center mt-auto mb-4 opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-gray-500 text-[10px] font-mono tracking-widest">RHIZACORE NODE v1.0.0</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
             <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
             <p className="text-green-500/60 text-[9px] font-bold tracking-wider">SYSTEM OPERATIONAL</p>
          </div>
      </div>

      {/* Language Selection Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-6 w-full max-w-md relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Icons.ChevronRight size={20} className="transform rotate-45 text-gray-400" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 text-center">{t('select_language') || 'Select Language'}</h3>

            <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
              {supportedLanguages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                    language === lang.code
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-zinc-800 hover:bg-zinc-700/50 border border-white/5'
                  }`}
                >
                  <span className={`text-sm font-medium transition-colors ${
                    language === lang.code ? 'text-green-400' : 'text-gray-300 hover:text-white'
                  }`}>
                    {lang.label}
                  </span>
                  {language === lang.code && (
                    <Icons.Check size={18} className="text-green-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Copy Alert Notification */}
      {showCopyAlert && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center shadow-lg border border-green-400/30 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-center gap-2">
              <Icons.Check size={16} />
              <span className="text-sm font-bold">User ID Copied!</span>
            </div>
            <p className="text-xs opacity-90 mt-1">Your unique identifier has been copied</p>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Animation for copy alert */
        @keyframes slide-in-from-top-4 {
          from {
            transform: translateY(-1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top-4 {
          animation-name: slide-in-from-top-4;
        }
        
        .duration-300 {
          animation-duration: 300ms;
        }

        /* Custom TON Connect Button Styles */
        .ton-connect-button-custom {
          transition: all 0.2s ease !important;
        }
        
        .ton-connect-button-custom:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3) !important;
          background: linear-gradient(135deg, #0099dd, #0077bb) !important;
        }
        
        .ton-connect-button-custom:active {
          transform: translateY(0) !important;
        }

        /* Override TON Connect default styles */
        tc-root {
          --tc-bg-color: transparent;
          --tc-accent: #22c55e;
          --tc-connect-button-background: linear-gradient(135deg, #0088cc, #0066aa);
          --tc-connect-button-background-hover: linear-gradient(135deg, #0099dd, #0077bb);
          --tc-border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default SettingsComponent;