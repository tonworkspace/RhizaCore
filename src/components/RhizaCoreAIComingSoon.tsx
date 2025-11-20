import React from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  Brain,
  Clock,
  Sparkles,
  Zap,
  Wallet,
  Shield,
  Bot,
  Rocket,
  Infinity,
  TrendingUp
} from 'lucide-react';

const RhizaCoreAIComingSoon: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-md mx-auto p-2">
      {/* Hero Section with Glassmorphic Design */}
      <div className="relative overflow-hidden">
        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-green-400/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Animated Border Glow */}
        {/* <div className="absolute inset-0 rounded-2xl border-2 border-green-400/20 animate-pulse pointer-events-none"></div> */}

        <div className="relative z-10">
          {/* Hero Header */}
          <div className="p-8 text-center">
            {/* Evolution Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-green-500/40 rounded-full mb-4 backdrop-blur-md bg-black/20 shadow-lg shadow-green-500/20">
              <Rocket className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-green-300 font-bold text-xs uppercase tracking-wider">
                {t('ai_evolution_badge')}
              </span>
            </div>

            {/* Main Icon with Enhanced Animation */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-2xl animate-pulse"></div>
              <div className="relative w-full h-full rounded-2xl flex items-center justify-center border-2 border-green-500/50 shadow-2xl shadow-green-500/40 backdrop-blur-md bg-black/10">
                <div className="relative">
                  <Brain className="w-14 h-14 text-green-400 animate-pulse drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <Wallet className="w-7 h-7 text-green-300 absolute -bottom-1 -right-1 animate-bounce drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-green-400 animate-ping drop-shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
                </div>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-green-300 via-emerald-300 to-green-300 bg-clip-text text-transparent animate-gradient">
              {t('ai_hero_title')}
            </h1>

            {/* Tagline */}
            <p className="text-lg font-bold text-green-200 mb-2">
              {t('ai_tagline')}
            </p>

            {/* Description */}
            <p className="text-green-300/90 mb-6 text-sm leading-relaxed px-2">
              {t('ai_hero_desc')}
            </p>
          </div>

          {/* Key Value Propositions */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Infinity, label: t('ai_stat_autonomous'), value: '100%' },
                { icon: Zap, label: t('ai_stat_speed'), value: '0.1s' },
                { icon: Shield, label: t('ai_stat_secure'), value: '99.9%' }
              ].map((stat, index) => (
                <div key={index} className="text-center p-3 rounded-xl border border-green-500/40 backdrop-blur-md bg-black/10 shadow-lg shadow-green-500/10">
                  <stat.icon className="w-5 h-5 text-green-400 mx-auto mb-1 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <div className="text-lg font-bold text-green-300 drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]">{stat.value}</div>
                  <div className="text-xs text-green-400/90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Features Section */}
      <div className="relative mt-4 p-6 rounded-2xl">
        {/* Animated Border Glow */}
        
        <div className="relative text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-green-500/40 rounded-full mb-3 backdrop-blur-md bg-black/20 shadow-lg shadow-green-500/20">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold text-green-300 uppercase tracking-wider">
              {t('ai_revolutionary_features')}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-green-300 mb-2 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
            {t('ai_features_title')}
          </h3>
          <p className="text-sm text-green-400/90">
            {t('ai_features_subtitle')}
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-4 mb-6">
          {[
            { 
              icon: Bot, 
              title: t('ai_feature_agent'), 
              desc: t('ai_feature_agent_desc'),
              border: 'border-green-500/40',
              shadow: 'shadow-green-500/20'
            },
            { 
              icon: Wallet, 
              title: t('ai_feature_wallet'), 
              desc: t('ai_feature_wallet_desc'),
              border: 'border-emerald-500/40',
              shadow: 'shadow-emerald-500/20'
            },
            { 
              icon: Shield, 
              title: t('ai_feature_secure'), 
              desc: t('ai_feature_secure_desc'),
              border: 'border-green-500/40',
              shadow: 'shadow-green-500/20'
            },
            { 
              icon: Zap, 
              title: t('ai_feature_automated'), 
              desc: t('ai_feature_automated_desc'),
              border: 'border-yellow-500/40',
              shadow: 'shadow-yellow-500/20'
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className={`relative p-4 rounded-xl border-2 ${feature.border} ${feature.shadow} hover:scale-105 transition-all duration-300 group backdrop-blur-md bg-black/10 shadow-lg`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 border border-green-500/40 group-hover:border-green-400/60 transition-colors backdrop-blur-sm bg-black/20">
                  <feature.icon className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
                <h4 className="text-sm font-bold text-green-300 mb-1.5 drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]">{feature.title}</h4>
                <p className="text-xs text-green-400/90 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="relative text-center p-4 rounded-xl border border-green-500/40 backdrop-blur-md bg-black/10 shadow-lg shadow-green-500/20">
          <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
            <Clock className="w-4 h-4 text-green-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-sm font-semibold drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]">{t('ai_launch_soon')}</span>
          </div>
          <p className="text-xs text-green-400/90">
            {t('ai_launch_desc')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RhizaCoreAIComingSoon;

