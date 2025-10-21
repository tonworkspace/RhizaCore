import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Update {
  id: number;
  title: string;
  message: string;
  icon: string;
  link?: string;
  linkText?: string;
  type: 'event' | 'earnings' | 'promotion' | 'news';
}

interface DailyUpdateCardProps {
  earningState: {
    currentEarnings: number;
    baseEarningRate: number;
  };
}

export const DailyUpdateCard: React.FC<DailyUpdateCardProps> = ({ earningState }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Dynamic updates based on user state and current promotions
  const updates: Update[] = [
    {
      id: 1,
      title: "Daily Earnings",
      message: user?.balance 
        ? `🎉 You've earned ${earningState.currentEarnings.toFixed(4)} TON today!`
        : "Start staking now and earn daily TON rewards!",
      icon: "💰",
      type: "earnings"
    },
    
    {
      id: 2,
      title: "Weekly Challenge",
      message: "Join our weekly giveaway challenge! Top stakers win bonus rewards.",
      icon: "🏆",
      link: "https://stakenova.medium.com/stakenova-referral-challenge-your-chance-to-win-500-ton-ee3918304391",
      linkText: "Win 500 TON",
      type: "promotion"
    },
    {
      id: 3,
      title: "Community Update",
      message: "Join our growing community of Novators on Telegram!",
      icon: "📢",
      link: "https://t.me/StakeNova_Channel/41",
      linkText: "Join Novators",
      type: "news"
    },
    {
      id: 4,
      title: "ROI Boost Event",
      message: "Stake more than 1000 TON to unlock premium ROI rates!",
      icon: "⚡",
      type: "event"
    },
    {
      id: 5,
      title: "Weekly Payout",
      message: user?.balance 
        ? `🎉 You've received ${user?.payout_balance?.toFixed(4)} TON from weekly payout! so far!`
        : "Start staking now to get your weekly payout!",
      icon: "💰",
      type: "earnings"
    }
  ];

  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % updates.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, updates.length]);

  const currentUpdate = updates[currentIndex];

  const getTypeStyles = (type: string) => {
    const styles = {
      event: "from-violet-500 via-purple-500 to-pink-500",
      earnings: "from-emerald-400 via-green-500 to-teal-600",
      promotion: "from-blue-400 via-indigo-500 to-purple-600",
      news: "from-orange-400 via-amber-500 to-red-600"
    };
    return styles[type as keyof typeof styles] || "from-blue-500 to-indigo-500";
  };

  return (
    <div className="relative p-4 rounded-lg bg-black/40 border border-green-500/30 backdrop-blur-md 
      hover:border-green-400/40 transition-all duration-300 group">
      {/* Animated Corner Decorations */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400/50 
        group-hover:border-green-400/80 transition-colors duration-300" />
      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400/50 
        group-hover:border-green-400/80 transition-colors duration-300" />
      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400/50 
        group-hover:border-green-400/80 transition-colors duration-300" />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400/50 
        group-hover:border-green-400/80 transition-colors duration-300" />
      
      {/* Header with Type Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${getTypeStyles(currentUpdate.type)} 
            shadow-lg shadow-current/30 animate-pulse`} />
          <span className="text-sm font-medium text-white/90 tracking-wide">{currentUpdate.title}</span>
        </div>
        <div className="flex gap-1.5">
          {updates.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsAutoPlay(false);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 transform hover:scale-125 ${
                idx === currentIndex 
                  ? `bg-gradient-to-r ${getTypeStyles(currentUpdate.type)} shadow-lg shadow-current/30` 
                  : 'bg-white/30 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Message Content */}
      <div className="min-h-[60px] transform transition-all duration-500 ease-out">
        <div className="flex items-start gap-4">
          <span className="text-3xl animate-bounce-subtle">{currentUpdate.icon}</span>
          <div className="flex-1">
            <p className="text-xl bg-gradient-to-r from-white/90 to-white/70 bg-clip-text text-transparent 
              font-medium leading-relaxed tracking-wide animate-fade-in">
              {currentUpdate.message}
            </p>
            <div className="h-0.5 w-[40%] bg-gradient-to-r from-white/20 to-transparent mt-2 
              opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      {currentUpdate.link && (
        <div className="mt-5 w-full relative" >
          <a
            href={currentUpdate.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full px-4 py-2.5 text-sm font-medium text-center text-white rounded-md 
              transition-all duration-300 cursor-pointer bg-gradient-to-r ${getTypeStyles(currentUpdate.type)} 
              opacity-90 hover:opacity-100 hover:shadow-lg hover:shadow-current/20 
              transform hover:-translate-y-0.5 relative overflow-hidden`}
            style={{ zIndex: 50 }}
            onClick={(e) => {
              console.log('Button clicked');
              e.stopPropagation();
            }}
          >
            {currentUpdate.linkText}
          </a>
        </div>
      )}

      {/* Auto-play Toggle */}
      <button
        onClick={() => setIsAutoPlay(!isAutoPlay)}
        className="absolute top-3 right-3 text-white/50 hover:text-white/80 
          transition-colors duration-300 transform hover:scale-110"
      >
        {isAutoPlay ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default DailyUpdateCard; 