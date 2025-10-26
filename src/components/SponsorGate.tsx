import { FC, useState } from 'react';

interface SponsorGateProps {
  onApplyCode: (code: string) => Promise<void>;
  isLoading: boolean;
}

export const SponsorGate: FC<SponsorGateProps> = ({ onApplyCode, isLoading }) => {
  const [sponsorCode, setSponsorCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sponsorCode.trim()) {
      onApplyCode(sponsorCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 p-8 rounded-2xl bg-gray-800 border-2 border-green-700/50 shadow-neon-green-light transform transition-all duration-300 scale-100">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center mx-auto border-2 border-green-600/70 animate-pulse">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-300 mb-3 text-shadow-green">ACCESS RESTRICTED</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              A sponsor code is required to access the mining protocol. Please enter a valid code to proceed.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                value={sponsorCode}
                onChange={(e) => setSponsorCode(e.target.value)}
                placeholder="ENTER SPONSOR CODE"
                className="flex-1 px-4 py-3 rounded-lg border-2 border-green-700/50 bg-gray-900 text-green-300 text-sm font-mono tracking-widest outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-neon-green"
              disabled={isLoading || !sponsorCode.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  VERIFYING...
                </>
              ) : (
                'UNLOCK PROTOCOL'
              )}
            </button>
          </form>
          <div className="text-xs text-gray-500">
            <p>Don't have a code? Join our <a href="https://t.me/Tapps_chat" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Telegram community</a> to find a sponsor.</p>
          </div>
        </div>
      </div>
    </div>
  );
};