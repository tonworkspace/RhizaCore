import React from 'react';
import { Wallet, ArrowLeftRight, TrendingUp, User } from 'lucide-react';
import { TabView } from '../types';

interface BottomNavProps {
  currentTab: TabView;
  setTab: (tab: TabView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setTab }) => {
  const tabs: { id: TabView; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'swap', label: 'Swap', icon: ArrowLeftRight },
    { id: 'earn', label: 'Earn', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 px-4 py-2">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
