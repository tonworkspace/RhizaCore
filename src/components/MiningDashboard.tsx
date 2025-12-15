import React, { useState, useEffect, useRef } from 'react';
import { TopTab, MiningState } from '../types';
import { Icons } from './Icons';
import { getMiningOptimizationTip } from '../services/geminiService';

interface MiningDashboardProps {
  state: MiningState;
  activeTopTab: TopTab;
  onTabChange: (tab: TopTab) => void;
  boostContent?: React.ReactNode;
  rankContent?: React.ReactNode;
  referralLink?: string;
  onCopyReferral?: () => void;
}

export const MiningDashboard: React.FC<MiningDashboardProps> = ({
  state,
  activeTopTab,
  onTabChange,
  boostContent,
  rankContent,
  referralLink = "https://t.me/rhizacore_bot?startapp=...",
  onCopyReferral
}) => {
  const [displayBalance, setDisplayBalance] = useState(state.balance);
  const [sessionString, setSessionString] = useState("00h 00m 00s");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  // Sync display balance if state balance changes significantly (e.g. initial load or claim)
  useEffect(() => {
    // If the difference is large (more than 1 minute of mining), sync it.
    // Or just sync it always if we want to trust the parent more.
    // For smooth animation, we trust local increment, but we need a baseline.
    // Let's just update it if it deviates too much or if we are not mining?
    // actually, let's just sync it. The parent should control the source of truth.
    // But if we sync every render, the animation frame is useless.
    // We only sync if the passed balance is significantly different from what we expect,
    // OR we rely on the parent to update state.balance periodically.

    // Simple approach: Sync on mount and when state.balance changes abruptly (e.g. claim).
    // To detect "abrupt" change, we can compare with current displayBalance.
    if (Math.abs(state.balance - displayBalance) > 0.01) {
        setDisplayBalance(state.balance);
    }
  }, [state.balance]);

  // Animation frame loop for smooth number incrementing
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      // Calculate increment based on per-hour rate: rate / 3600000 * deltaTime (ms)
      const increment = (state.miningRatePerHour / 3600000) * deltaTime;
      if (state.isMining) {
        setDisplayBalance(prev => prev + increment);
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [state.isMining, state.miningRatePerHour]);

  // Session timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, now - state.sessionStartTime);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setSessionString(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.sessionStartTime]);

  const handleCopy = () => {
    if (onCopyReferral) {
        onCopyReferral();
    } else {
        navigator.clipboard.writeText(referralLink);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleBoost = async () => {
    if (optimizing) return;
    setOptimizing(true);
    setSystemMessage("Establishing uplink with Core AI...");

    // Simulate slight delay for effect
    await new Promise(r => setTimeout(r, 800));

    const tip = await getMiningOptimizationTip();
    setSystemMessage(tip);
    setOptimizing(false);

    setTimeout(() => setSystemMessage(null), 5000);
  };

  return (
    <div className="flex flex-col h-full w-full pb-24 overflow-y-auto custom-scrollbar">

      {/* Top Tabs */}
      <div className="mx-4 mt-2 bg-rzc-gray/30 rounded-2xl p-1 flex justify-between items-center border border-white/5 backdrop-blur-sm">
        {(['Mining', 'Boost', 'Rank'] as TopTab[]).map((tab) => {
           const Icon = tab === 'Mining' ? Icons.Energy : (tab === 'Boost' ? Icons.Boost : Icons.Rank);
           const isActive = activeTopTab === tab;
           return (
            <button
              key={tab}
              onClick={() => {
                  onTabChange(tab);
                  if (tab === 'Boost') handleBoost();
              }}
              className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-rzc-dark text-rzc-green shadow-lg border border-rzc-green/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab}
            </button>
           );
        })}
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center mt-6 px-4">
        {/* Shared Header (optional, or specific to Mining) */}
        {activeTopTab === 'Mining' && (
            <>
                <h1 className="text-xl font-bold text-white tracking-wider mb-2">RhizaCore AI Nodes</h1>
                <p className="text-gray-400 text-xs text-center max-w-xs leading-relaxed mb-6">
                Track your RZC airdrop earnings and claim your rewards! Share your referral link to earn more.
                </p>
            </>
        )}

        {/* System Message Overlay */}
        {systemMessage && (
            <div className="mb-4 w-full bg-rzc-green/10 border border-rzc-green/50 text-rzc-green px-4 py-2 rounded text-xs font-mono text-center animate-pulse">
                {'>'} {systemMessage}
            </div>
        )}

        {activeTopTab === 'Mining' ? (
            <>
                {/* Referral Link */}
                <div className="w-full flex gap-3 mb-8">
                <div className="flex-1 bg-rzc-dark border border-rzc-gray rounded-xl flex items-center px-4 py-3 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rzc-green"></div>
                    <Icons.Energy size={16} className="text-rzc-green mr-3 flex-shrink-0" />
                    <span className="text-gray-300 text-xs truncate font-mono">
                    {referralLink}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className={`w-12 h-full rounded-xl flex items-center justify-center border transition-all ${
                        copyFeedback
                        ? 'bg-rzc-green text-black border-rzc-green'
                        : 'bg-rzc-green/10 text-rzc-green border-rzc-green/30 hover:bg-rzc-green/20'
                    }`}
                >
                    <Icons.Copy size={20} />
                </button>
                </div>

                {/* THE CORE (Centerpiece) */}
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    {/* Background Rings */}
                    <div className="absolute w-full h-full rounded-full border border-rzc-green/10"></div>
                    <div className="absolute w-[90%] h-[90%] rounded-full border border-rzc-green/5 animate-spin-slow border-dashed"></div>

                    {/* Glow Effect */}
                    <div className="absolute w-48 h-48 rounded-full bg-rzc-green/5 blur-3xl animate-pulse-glow"></div>

                    {/* Main Circle */}
                    <div className="relative w-56 h-56 rounded-full border-2 border-rzc-green/40 bg-gradient-to-b from-rzc-dark to-black flex flex-col items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.15)] z-10 backdrop-blur-sm">

                        {/* Active Indicator Dot */}
                        {state.isMining && (
                            <div className="absolute top-8 right-10 w-3 h-3 bg-rzc-green rounded-full shadow-[0_0_10px_#4ade80] animate-pulse"></div>
                        )}

                        <div className="text-3xl font-bold text-rzc-green font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                        {displayBalance.toFixed(4)}
                        </div>

                        <div className="mt-2 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                        {state.isMining ? 'Mining Active' : 'System Standby'}
                        </div>
                        <div className="text-rzc-green/80 text-[10px] font-mono mt-0.5">
                        +{state.miningRatePerHour.toFixed(4)}/hr
                        </div>
                    </div>
                </div>

                {/* Balance Labels */}
                <div className="text-center mb-6">
                    <h3 className="text-rzc-green font-medium tracking-wide">Rhizacore Balance</h3>
                    <p className="text-gray-500 font-mono text-xs mt-1">Session: {sessionString}</p>
                </div>

                {/* Stats Card */}
                <div className="w-full bg-rzc-dark border border-rzc-gray rounded-2xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-rzc-green text-sm font-medium">Mining:</span>
                        <span className="text-white font-mono font-bold">{state.miningBalance.toFixed(6)} RZC</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-purple-400 text-sm font-medium">Validated:</span>
                        <span className="text-white font-mono font-bold">{state.validatedBalance.toFixed(6)} RZC</span>
                    </div>
                </div>

                {/* Action Button */}
                <button disabled className={`w-1/2 bg-rzc-dark/50 border border-rzc-gray/50 text-gray-500 py-3 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-6 ${state.isMining ? 'cursor-not-allowed' : ''}`}>
                    <div className={`w-2 h-2 rounded-full bg-rzc-green ${state.isMining ? 'animate-pulse' : ''}`}></div>
                    {state.isMining ? 'MINING IN PROGRESS' : 'READY TO MINE'}
                </button>

                {/* Footer Stats */}
                <div className="flex items-center justify-between w-full px-2 text-[10px] font-mono text-gray-400 font-bold tracking-tight">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-rzc-green">
                            <div className="w-1.5 h-1.5 rounded-full bg-rzc-green"></div>
                            SYSTEM ONLINE
                        </div>
                        <span className="bg-rzc-green/10 px-1.5 py-0.5 rounded text-rzc-green">48H</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-orange-900/20 px-2 py-0.5 rounded border border-orange-500/20">
                            <Icons.Fire size={10} className="text-orange-500" />
                            <span className="text-orange-400">1d</span>
                        </div>

                        <div className="flex items-center gap-1">
                        <span>{state.miningRatePerHour.toFixed(1)} RZC/24h</span>
                        <span className="bg-yellow-500/10 text-yellow-500 px-1 rounded text-[9px] border border-yellow-500/20">+25%</span>
                        </div>
                    </div>
                </div>
            </>
        ) : activeTopTab === 'Boost' ? (
            <div className="w-full animate-fade-in">
                {boostContent}
            </div>
        ) : activeTopTab === 'Rank' ? (
            <div className="w-full animate-fade-in">
                {rankContent}
            </div>
        ) : null}
      </div>
    </div>
  );
};
