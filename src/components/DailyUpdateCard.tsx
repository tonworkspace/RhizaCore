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
    <div className="relative overflow-hidden">
      {/* Multi-layer animated background matching navbar */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/5 to-cyan-500/8 animate-gradient"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-50/20"></div>
      
      {/* Subtle border glow matching navbar */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/10 to-cyan-400/20 blur-sm -z-10"></div>
      
      {/* Main content container with navbar styling */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl shadow-blue-500/20 p-6 
        hover:bg-white/95 transition-all duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-2xl rotate-45 animate-pulse shadow-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FaRocket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-400/30 shadow-lg">
              <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">Daily Update</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Daily Earnings */}
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-600 font-medium">Daily Earnings</span>
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {calculateDailyEarnings().toFixed(6)} TON
            </div>
          </div>

          {/* Time Active */}
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-green-200/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaClock className="w-5 h-5 text-green-600" />
              <span className="text-sm text-slate-600 font-medium">Time Active</span>
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatDuration(earningState.startDate)}
            </div>
          </div>
        </div>

        {/* Earnings Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 font-medium">Earnings Progress</span>
            <span className="text-slate-800 font-semibold">
              {((earningState.currentEarnings / (calculateDailyEarnings() * 100)) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="relative h-3 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg"
              initial={{ width: "0%" }}
              animate={{ 
                width: `${(earningState.currentEarnings / (calculateDailyEarnings() * 100)) * 100}%` 
              }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Earnings are calculated in real-time</span>
        </div>
      </div>
    </div>
  );
}; 