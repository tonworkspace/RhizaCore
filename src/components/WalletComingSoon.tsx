import React from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  Wallet,
  Clock,
  Sparkles,
  // Zap,
  // Shield,
  // Globe,
  // Star,
  ArrowRight
} from 'lucide-react';

const WalletComingSoon: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-md mx-auto p-2">
      <div className="border-0 border-green-700/50 rounded-2xl shadow-neon-green-light overflow-hidden backdrop-blur-md">
        {/* Main Content */}
        <div className="p-8 text-center">
          {/* Animated Icon Container */}
          <div className="relative w-24 h-24 bg-green-900/50 rounded-2xl mx-auto mb-6 flex items-center justify-center border-2 border-green-600/70 shadow-lg shadow-green-500/30 animate-pulse">
            <Wallet className="w-12 h-12 text-green-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-ping" />
            </div>
          </div>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/50 border border-yellow-700/60 rounded-full mb-4">
            <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-yellow-300 font-bold text-sm uppercase tracking-wider">
              {t('coming_soon')}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-green-300 mb-3">
            {t('wallet_coming_soon_title')}
          </h2>

          {/* Description */}
          <p className="text-green-400/80 mb-8 text-base leading-relaxed px-2">
            {t('wallet_coming_soon_desc')}
          </p>

          {/* Animated Arrow */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 text-green-400 animate-bounce">
              <span className="text-sm font-semibold">{t('stay_tuned')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

       
        {/* Progress Indicator */}
        <div className="p-4 bg-gray-800/30 border-t border-green-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-green-400/80 font-semibold">{t('development_progress')}</span>
            <span className="text-xs text-green-300 font-bold">{t('in_progress')}</span>
          </div>
          <div className="w-full bg-gray-900/60 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-600 via-green-500 to-green-400 rounded-full animate-pulse" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletComingSoon;

