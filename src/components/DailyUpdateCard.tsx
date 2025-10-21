import React from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaClock, FaRocket } from 'react-icons/fa';

interface DailyUpdateCardProps {
  earningState: {
    currentEarnings: number;
    baseEarningRate: number;
    startDate: number;
  };
}

export const DailyUpdateCard: React.FC<DailyUpdateCardProps> = ({ earningState }) => {
  const calculateDailyEarnings = () => {
    return earningState.baseEarningRate * 86400; // Daily rate (24h * 60m * 60s)
  };

  const formatDuration = (startDate: number) => {
    const now = Date.now();
    const diff = now - startDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="relative p-4 rounded-lg bg-black/30 border border-green-500/20 backdrop-blur-sm">
      {/* Animated Corner Decorations */}
      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-green-400/50" />
      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-green-400/50" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-green-400/50" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-green-400/50" />
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-green/[0.02] bg-[length:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-lg rotate-45 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FaRocket className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="pixel-corners bg-[#2a2f4c] px-3 py-1">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Daily Update</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Daily Earnings */}
          <div className="pixel-corners bg-black/30 p-3 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Daily Earnings</span>
            </div>
            <div className="text-lg font-medium text-blue-400">
              {calculateDailyEarnings().toFixed(6)} TON
            </div>
          </div>

          {/* Time Active */}
          <div className="pixel-corners bg-black/30 p-3 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FaClock className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/60">Time Active</span>
            </div>
            <div className="text-lg font-medium text-green-400">
              {formatDuration(earningState.startDate)}
            </div>
          </div>
        </div>

        {/* Earnings Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-white/60">Earnings Progress</span>
            <span className="text-white/80">
              {((earningState.currentEarnings / (calculateDailyEarnings() * 100)) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="relative h-2 bg-blue-900/20 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-grid-blue/[0.05] bg-[length:8px_8px]" />
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ 
                width: `${(earningState.currentEarnings / (calculateDailyEarnings() * 100)) * 100}%` 
              }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Earnings are calculated in real-time</span>
        </div>
      </div>
    </div>
  );
}; 