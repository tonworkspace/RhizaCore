import { FC } from 'react';
import { NFTMinter } from '@/components/NFTMinter';

const TaskCenter: FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900">NFT Minter</span>
          <span className="text-xs text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">Mint your SBT</span>
        </div>
      </div>

      {/* NFT Mint Section */}
      <div className="relative p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <NFTMinter />
      </div>
    </div>
  );
};

export default TaskCenter;