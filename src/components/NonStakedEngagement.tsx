import { FC, useState, useEffect } from 'react';
import { FaRocket, FaGem, FaUsers, FaChartLine, FaGift, FaStar, FaCoins, FaWallet } from 'react-icons/fa';
import { MdTrendingUp } from 'react-icons/md';

interface NonStakedEngagementProps {
  onStartStaking: () => void;
  airdropBalance?: number;
  showSnackbar?: (data: { message: string; description?: string }) => void;
}

export const NonStakedEngagement: FC<NonStakedEngagementProps> = ({ 
  onStartStaking, 
  airdropBalance = 0,
  showSnackbar 
}) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  // const [showCommunityModal, setShowCommunityModal] = useState(false);

  const stakingTips = [
    {
      icon: <FaRocket className="w-5 h-5 text-blue-500" />,
      title: "Stake to Mine",
      description: "Deposit TON to activate real-time RZC mining and start earning rewards.",
      benefit: "1-5% daily returns"
    },
    {
      icon: <FaGem className="w-5 h-5 text-purple-500" />,
      title: "Compound Growth",
      description: "Your staked TON generates RZC that can be reinvested for exponential growth.",
      benefit: "Up to 500% returns"
    },
    {
      icon: <FaUsers className="w-5 h-5 text-green-500" />,
      title: "Referral Rewards",
      description: "Earn additional RZC by referring friends to join the mining ecosystem.",
      benefit: "5% referral bonus"
    },
    {
      icon: <FaChartLine className="w-5 h-5 text-orange-500" />,
      title: "Real-time Mining",
      description: "Watch your RZC balance grow in real-time with our advanced mining algorithm.",
      benefit: "Live earnings tracking"
    }
  ];

  const miningBenefits = [
    {
      icon: <FaCoins className="w-6 h-6 text-yellow-500" />,
      title: "Daily Mining",
      description: "Earn 1-5% daily RZC on your staked TON",
      amount: "1-5% daily",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <MdTrendingUp className="w-6 h-6 text-green-500" />,
      title: "Compound Growth",
      description: "Reinvest RZC to accelerate your mining power",
      amount: "Up to 500% returns",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <FaGift className="w-6 h-6 text-purple-500" />,
      title: "Bonus Rewards",
      description: "Unlock special bonuses and airdrops for active miners",
      amount: "Exclusive airdrops",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <FaStar className="w-6 h-6 text-blue-500" />,
      title: "VIP Access",
      description: "Get early access to new features and premium content",
      amount: "VIP privileges",
      color: "from-blue-400 to-cyan-500"
    }
  ];

  // const communityBenefits = [
  //   {
  //     title: "Telegram Community",
  //     description: "Join our active Telegram group with 10,000+ members",
  //     icon: "💬",
  //     action: "Join Now"
  //   },
  //   {
  //     title: "Twitter Updates",
  //     description: "Follow us for the latest news and announcements",
  //     icon: "🐦",
  //     action: "Follow"
  //   },
  //   {
  //     title: "Discord Server",
  //     description: "Connect with developers and get technical support",
  //     icon: "🎮",
  //     action: "Join Discord"
  //   },
  //   {
  //     title: "Weekly AMAs",
  //     description: "Participate in weekly Ask Me Anything sessions",
  //     icon: "🎤",
  //     action: "Join AMA"
  //   }
  // ];

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % stakingTips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartStaking = () => {
    if (airdropBalance < 1) {
      showSnackbar?.({
        message: "Insufficient Balance",
        description: "You need at least 1 RZC to start staking. Complete tasks to earn more!"
      });
      return;
    }
    onStartStaking();
  };

  return (
    <div className="relative overflow-visible">
      <div className="relative p-4 rounded-lg bg-white border-2 border-slate-300 shadow-sm" style={{borderImage: 'linear-gradient(90deg, #e2e8f0, #cbd5e1, #94a3b8, #cbd5e1, #e2e8f0) 1'}}>
        <div className="relative">
          {/* Compact Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white bg-slate-400" />
            </div>
            <div>
                <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase">MINING POWER</div>
                <div className="text-lg font-bold text-slate-900">
                  0.00 <span className="text-slate-600 text-base font-medium">TON</span>
                </div>
              </div>
            </div>
            <button
              onClick={onStartStaking}
              disabled={airdropBalance < 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
                airdropBalance >= 1 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-semibold">
                {airdropBalance >= 1 ? 'START MINING' : 'EARN RZC'}
              </span>
            </button>
        </div>
        
          {/* Compact Tabs */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex p-1 rounded-lg bg-slate-100">
              <button
                className="px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200 bg-white text-slate-900 shadow-sm"
              >
                Mining
              </button>
              <button
                onClick={() => setShowBenefitsModal(true)}
                className="px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200 text-slate-600 hover:text-slate-800"
              >
                Benefits
              </button>
            </div>
          </div>

          {/* Compact Mining Display */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-40 h-40">
              {/* Simple rings */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
              <div className="absolute inset-2 rounded-full border border-blue-200" />
              
              {/* Clean background */}
              <div className="absolute inset-0 rounded-full bg-slate-50" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-slate-900 text-2xl font-black mb-1 tracking-tight">
                0.000000
                </div>
                <div className="text-blue-600 text-sm font-bold mb-1 tracking-wider">
                  RZC
                </div>
                <div className="text-slate-500 text-sm font-semibold">
                  Start Mining
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <div className="text-xs font-bold tracking-wide text-slate-500">Inactive</div>
                </div>
              </div>
            </div>
      </div>

      {/* Rotating Tips */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 mb-4 text-white">
            <div className="flex items-center gap-3">
          {stakingTips[currentTip].icon}
          <div className="flex-1">
                <div className="text-sm font-bold mb-1">{stakingTips[currentTip].title}</div>
                <div className="text-xs opacity-90 mb-2">{stakingTips[currentTip].description}</div>
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full inline-block">
              💡 {stakingTips[currentTip].benefit}
            </div>
          </div>
        </div>
            <div className="flex gap-1 mt-3">
          {stakingTips.map((_, index) => (
            <div
              key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                index === currentTip ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

          {/* Professional Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Balance Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FaWallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div className="text-xs text-blue-600 font-semibold tracking-wide uppercase mb-1">Balance</div>
                <div className="text-slate-900 font-bold text-lg leading-tight">
                  {airdropBalance.toFixed(6)}
                </div>
                <div className="text-blue-500 text-xs font-medium">RZC</div>
              </div>
            </div>
            
            {/* Mining Status Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                </div>
                <div className="text-xs text-slate-600 font-semibold tracking-wide uppercase mb-1">Status</div>
                <div className="text-slate-900 font-bold text-lg leading-tight">
                  {airdropBalance >= 1 ? 'Ready' : 'Inactive'}
                </div>
                <div className="text-slate-500 text-xs font-medium">Mining</div>
              </div>
            </div>
          </div>

          {/* Primary Mining Action Button */}
          <div className="mb-4">
            <button
              onClick={handleStartStaking}
              disabled={airdropBalance < 1}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 relative overflow-hidden ${
                airdropBalance >= 1
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                  : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed'
              }`}
            >
              {/* Animated background for active state */}
              {airdropBalance >= 1 && (
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse" />
                </div>
              )}
              
              <div className="relative flex items-center justify-center gap-3">
                {/* Mining Icon */}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                  <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>
                
                {/* Main Icon */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                
                {/* Text */}
                <span className="font-bold tracking-wide">
                  {airdropBalance >= 1 ? 'Start Mining RZC' : 'Earn RZC to Start Mining'}
                </span>
                
                {/* Status Indicator */}
                {airdropBalance >= 1 && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-medium opacity-90">READY</span>
                  </div>
                )}
              </div>
              
              {/* Mining badge */}
              {airdropBalance >= 1 && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  MINE
                </div>
              )}
            </button>
      </div>

          {/* Secondary Action Buttons */}


          {/* Compact Footer Info */}
          <div className="mt-4">
            <div className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-bold">Stake to Mine</div>
                  <div className="text-slate-600 text-xs font-semibold">Deposit TON to activate mining</div>
                </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Modal */}
      {showBenefitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Mining Benefits</h3>
              <button
                onClick={() => setShowBenefitsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {miningBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  {benefit.icon}
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-sm">{benefit.title}</div>
                    <div className="text-xs text-slate-600">{benefit.description}</div>
                  </div>
                  <div className={`bg-gradient-to-r ${benefit.color} text-white px-3 py-1.5 rounded-full text-xs font-semibold`}>
                    {benefit.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Community Modal */}
      {/* {showCommunityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Join Our Community</h3>
              <button
                onClick={() => setShowCommunityModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {communityBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-2xl">{benefit.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-sm">{benefit.title}</div>
                    <div className="text-xs text-slate-600">{benefit.description}</div>
                  </div>
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                    {benefit.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default NonStakedEngagement;
