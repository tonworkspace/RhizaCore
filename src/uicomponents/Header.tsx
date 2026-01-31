import React from 'react';
import { Icons } from '@/components/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useI18n, LangCode } from '@/components/I18nProvider';

interface HeaderProps {
  user?: {
    username?: string;
    avatarLetter?: string;
    tag?: string;
    photoUrl?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { lang, setLang } = useI18n();
  const { user: authUser, telegramUser } = useAuth();

  // Use auth user if no user prop provided
  const displayUser = user || {
    username: authUser?.username || telegramUser?.username,
    photoUrl: authUser?.photoUrl || telegramUser?.photoUrl,
    tag: 'RZC Miner'
  };

  return (
    <div className="flex justify-between items-center p-4 bg-rzc-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
      <div className="flex items-center gap-3">
        {displayUser?.photoUrl ? (
          <img
            src={displayUser.photoUrl}
            alt="User Avatar"
            className="w-10 h-10 rounded-full border border-rzc-green shadow-[0_0_10px_rgba(74,222,128,0.2)]"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-rzc-dark border border-rzc-green flex items-center justify-center text-rzc-green font-bold shadow-[0_0_10px_rgba(74,222,128,0.2)]">
            {displayUser?.username?.[0]?.toUpperCase() || displayUser?.avatarLetter || 'U'}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-wide">{displayUser?.username || 'User'}</span>
          <span className="text-rzc-green text-xs font-mono">{displayUser?.tag || 'RZC Miner'}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Development Mode Indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-xs font-mono font-bold">DEV</span>
          </div>
        )}
        
        <button className="flex items-center gap-1 bg-rzc-dark border border-rzc-green/30 rounded-xl px-3 py-1.5 text-xs font-mono text-rzc-green hover:bg-rzc-green/10 transition-colors">
        <Icons.Globe size={14} />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="bg-transparent text-green-300 text-sm font-medium border-none outline-none cursor-pointer"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
            <option value="pt">PT</option>
            <option value="ru">RU</option>
            <option value="tr">TR</option>
            <option value="ar">AR</option>
          </select>
        </button>
      </div>
    </div>
  );
};