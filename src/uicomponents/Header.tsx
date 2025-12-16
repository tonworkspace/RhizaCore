import React from 'react';
import { UserProfile } from '../types';
import { Icons } from './Icons';

interface HeaderProps {
  user: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <div className="flex justify-between items-center p-4 bg-rzc-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rzc-dark border border-rzc-green flex items-center justify-center text-rzc-green font-bold shadow-[0_0_10px_rgba(74,222,128,0.2)]">
          {user.avatarLetter}
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-wide">{user.username}</span>
          <span className="text-rzc-green text-xs font-mono">{user.tag}</span>
        </div>
      </div>
      
      <button className="flex items-center gap-2 bg-rzc-dark border border-rzc-green/30 rounded-xl px-3 py-1.5 text-xs font-mono text-rzc-green hover:bg-rzc-green/10 transition-colors">
        <span>US EN</span>
        <Icons.Globe size={14} />
      </button>
    </div>
  );
};