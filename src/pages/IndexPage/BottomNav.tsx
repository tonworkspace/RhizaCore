import React from 'react';
import { BottomTab } from '../../types';
import { Icons } from './Icons';

interface BottomNavProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: BottomTab; icon: any; label: string }[] = [
    { id: 'Mining', icon: Icons.Mining, label: 'Node' },
    { id: 'Task', icon: Icons.Task, label: 'Task' },
    { id: 'Wallet', icon: Icons.Wallet, label: 'Wallet' },
    { id: 'Core', icon: Icons.Core, label: 'Core' },
    { id: 'More', icon: Icons.More, label: 'More' },
  ];

  return (
    <div className="absolute bottom-6 left-4 right-4 h-16 bg-[#0a120a]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-between px-2 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="relative w-14 h-full flex flex-col items-center justify-center group"
          >
            <div className={`
                flex items-center justify-center transition-all duration-300 ease-out
                ${isActive 
                  ? 'w-12 h-12 bg-rzc-green text-black rounded-xl -translate-y-5 shadow-[0_4px_15px_rgba(74,222,128,0.4)] border-4 border-rzc-black rotate-3' 
                  : 'w-10 h-10 text-gray-500 group-hover:text-gray-300'
                }
            `}>
              <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            
            {/* Label only visible when not active or hover? simplified to just active hidden for clean look or always visible below */}
            <span className={`
                absolute bottom-1 text-[9px] font-medium tracking-wider transition-all duration-300
                ${isActive ? 'opacity-100 translate-y-0 text-rzc-green font-bold' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 text-gray-400'}
            `}>
              {item.label}
            </span>
            
            {/* Active Indicator Dot below */}
            {isActive && (
                <div className="absolute -bottom-2 w-8 h-1 bg-rzc-green/50 blur-sm rounded-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};