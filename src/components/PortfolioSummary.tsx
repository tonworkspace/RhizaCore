import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioSummaryProps {
  totalValue: number;
  hideBalances: boolean;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ totalValue, hideBalances }) => {
  const formatValue = (value: number) => {
    if (hideBalances) return '••••••';
    return value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value.toFixed(2)}`;
  };

  return (
    <div className="text-center">
      <p className="text-sm text-green-500/80 mb-1">Total Portfolio Value</p>
      <div className="text-3xl font-bold text-green-300 mb-2">
        {formatValue(totalValue)}
      </div>
      <div className="flex items-center justify-center gap-2">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400">+2.5% (24h)</span>
      </div>
    </div>
  );
};

export default PortfolioSummary;
