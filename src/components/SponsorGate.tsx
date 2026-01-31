import React, { useState, useEffect } from 'react';
import { Icons } from '../uicomponents/Icons';

interface SponsorGateProps {
  onApplyCode: (code: string) => Promise<void>;
  isLoading: boolean;
}

export const SponsorGate: React.FC<SponsorGateProps> = ({ onApplyCode, isLoading }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'granted' | 'denied'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const initialLogs = [
      "ESTABLISHING_ENCRYPTED_TUNNEL...",
      "LOCAL_NODE_ID: 0x8F392A",
      "STATUS: RESTRICTED_ACCESS",
      "AWAITING_SPONSOR_GATE_CODE..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < initialLogs.length) {
        setLogs(prev => [...prev, initialLogs[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Update status based on isLoading prop
  useEffect(() => {
    if (isLoading) {
      setStatus('scanning');
    } else if (status === 'scanning') {
      // Reset to idle when loading stops (unless we're in granted/denied state)
      setStatus('idle');
    }
  }, [isLoading, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || isLoading) return;

    setLogs(prev => [...prev, `VERIFYING_SPONSOR_CODE: ${code}...`]);
    
    try {
      await onApplyCode(code.trim());
      // If we reach here, the validation was successful
      setStatus('granted');
      setLogs(prev => [...prev, "SPONSOR_CODE_VALIDATED_SUCCESS", "BIOMETRIC_HANDSHAKE_INITIATED"]);
    } catch (error) {
      // Handle different error types
      setStatus('denied');
      setGlitch(true);
      
      if (error instanceof Error) {
        if (error.message === 'Invalid code format') {
          setLogs(prev => [...prev, "ERROR: INVALID_FORMAT_NUMERIC_REQUIRED", "ACCESS_DENIED_BY_PROTOCOL"]);
        } else if (error.message === 'Invalid sponsor') {
          setLogs(prev => [...prev, "ERROR: SPONSOR_NOT_FOUND", "ACCESS_DENIED_BY_PROTOCOL"]);
        } else {
          setLogs(prev => [...prev, "ERROR: SYSTEM_FAILURE", "ACCESS_DENIED_BY_PROTOCOL"]);
        }
      } else {
        setLogs(prev => [...prev, "ERROR: UNKNOWN_FAILURE", "ACCESS_DENIED_BY_PROTOCOL"]);
      }
      
      setTimeout(() => {
        setGlitch(false);
        setStatus('idle');
        setCode('');
      }, 1500);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col h-screen w-screen bg-black relative overflow-hidden p-8 font-mono ${glitch ? 'animate-pulse' : ''}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="h-full w-full" style={{ 
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', 
          backgroundSize: '100% 2px, 3px 100%' 
        }}></div>
      </div>

      {/* Scanline Animation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-rzc-green/10 animate-[scan_4s_linear_infinite] pointer-events-none z-50"></div>

      <div className="flex-1 flex flex-col justify-center items-center relative z-10 max-w-sm mx-auto w-full">
        {/* Security Icon */}
        <div className={`w-20 h-20 rounded-3xl mb-8 flex items-center justify-center transition-all duration-500 border-2 ${
          status === 'granted' 
            ? 'bg-rzc-green/20 border-rzc-green text-rzc-green shadow-[0_0_30px_rgba(74,222,128,0.4)]' 
            : status === 'denied' 
            ? 'bg-red-500/20 border-red-500 text-red-500 animate-bounce' 
            : 'bg-white/5 border-white/10 text-gray-500'
        }`}>
          {status === 'granted' ? (
            <Icons.Check size={40} />
          ) : status === 'denied' ? (
            <Icons.Lock size={40} />
          ) : (
            <Icons.Power size={40} />
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tighter uppercase">Sponsor_Gate</h1>
        <p className="text-[10px] text-gray-500 mb-8 uppercase tracking-[0.3em]">Phase 1 Sponsor Authorization Required</p>

        {/* Terminal Logs */}
        <div className="w-full bg-black/60 border border-white/5 rounded-xl p-4 mb-8 min-h-[120px] text-[9px] leading-relaxed shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className={`flex gap-2 ${
              (log || '').includes('ERROR') ? 'text-red-500' : 
              (log || '').includes('VALIDATED') ? 'text-rzc-green' : 
              'text-rzc-green/60'
            }`}>
              <span className="opacity-40">[{i.toString().padStart(2, '0')}]</span>
              <span>{log}</span>
            </div>
          ))}
          {status === 'idle' && (
            <div className="text-rzc-green animate-pulse mt-1">
              {`> `}AWAITING_SPONSOR_HASH_
            </div>
          )}
        </div>

        {/* Access Form */}
        {status === 'granted' ? (
          <div className="flex flex-col items-center animate-in zoom-in">
            <div className="w-16 h-16 border-2 border-rzc-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-rzc-green text-[10px] font-bold uppercase tracking-widest">Biometric Syncing...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="ENTER_SPONSOR_CODE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                className="w-full bg-rzc-dark/80 border border-white/10 rounded-2xl px-6 py-4 text-white text-center font-mono text-sm tracking-widest outline-none focus:border-rzc-green transition-all group-hover:border-white/20"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-rzc-green">
                {isLoading ? (
                  <Icons.Refresh className="animate-spin" size={16} />
                ) : (
                  <Icons.ChevronRight size={16} />
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!code || isLoading}
              className={`w-full py-4 rounded-2xl font-bold text-[11px] tracking-[0.3em] uppercase transition-all ${
                code && !isLoading
                  ? 'bg-white text-black hover:bg-rzc-green shadow-xl active:scale-95'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'VERIFYING...' : 'Validate Sponsor'}
            </button>
          </form>
        )}

        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-[9px] text-gray-600 uppercase tracking-widest">Don't have a sponsor code?</p>
          <div className="flex gap-6">
            <button className="text-[10px] text-gray-400 hover:text-rzc-green transition-colors border-b border-white/5 pb-1">
              GET_CODE_TELEGRAM
            </button>
            <button className="text-[10px] text-gray-400 hover:text-rzc-green transition-colors border-b border-white/5 pb-1">
              X_COMMUNITY
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}} />
    </div>
  );
};