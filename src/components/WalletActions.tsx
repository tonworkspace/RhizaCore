import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface WalletAction {
  label: string;
  icon: LucideIcon;
  action: () => void;
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'red';
}

interface WalletActionsProps {
  actions: WalletAction[];
}

const colorClasses = {
  blue: 'bg-blue-900/50 border-blue-600/70 hover:bg-blue-800/60 text-blue-300',
  yellow: 'bg-yellow-900/50 border-yellow-600/70 hover:bg-yellow-800/60 text-yellow-300',
  green: 'bg-green-900/50 border-green-600/70 hover:bg-green-800/60 text-green-300',
  purple: 'bg-purple-900/50 border-purple-600/70 hover:bg-purple-800/60 text-purple-300',
  red: 'bg-red-900/50 border-red-600/70 hover:bg-red-800/60 text-red-300',
};

const WalletActions: React.FC<WalletActionsProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`p-4 rounded-xl border-2 transition-colors font-semibold text-sm ${colorClasses[action.color]}`}
        >
          <action.icon className="w-5 h-5 mx-auto mb-2" />
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default WalletActions;
