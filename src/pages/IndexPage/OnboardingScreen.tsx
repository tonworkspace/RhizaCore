import { FC, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Icons } from '@/uicomponents/Icons';

export const OnboardingScreen: FC = () => {
  const { user } = useAuth();
  const [bootStep, setBootStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Determine if user is new or returning
  const isNewUser = user?.total_deposit === 0;
  const userName = user?.first_name || user?.username || 'Miner';

  const bootSequence = [
    "Initializing RhizaCore Kernel...",
    "Loading Neural Interfaces...",
    "Verifying Cryptographic Keys...",
    "Establishing Uplink to Mainframe...",
    isNewUser ? "Welcome Protocol Activated." : "Welcome Back Protocol Activated.",
    "Connection Secure."
  ];

  const tutorialSteps = isNewUser ? [
    {
      title: `Welcome ${userName}!`,
      description: "Welcome to RhizaCore Mine! Your journey into decentralized mining begins now. Let's get you started.",
      icon: Icons.Mining,
      color: "text-rzc-green"
    },
    {
      title: "Activate Your Node",
      description: "Your device acts as a neural node. Keep mining sessions active to earn RZC tokens continuously.",
      icon: Icons.Mining,
      color: "text-rzc-green"
    },
    {
      title: "Complete Missions",
      description: "Boost your earnings by completing daily tasks, social quests, and partner missions for extra rewards.",
      icon: Icons.Task,
      color: "text-purple-400"
    },
    {
      title: "Build Your Network",
      description: "Invite friends to join your mining network and unlock powerful referral bonuses together.",
      icon: Icons.Users,
      color: "text-blue-400"
    },
    {
      title: "Upgrade Hardware",
      description: "Reinvest your RZC into Core upgrades and NFTs to permanently increase your mining hashrate.",
      icon: Icons.Core,
      color: "text-orange-400"
    }
  ] : [
    {
      title: `Welcome Back ${userName}!`,
      description: "Your mining node is ready to resume operations. Let's check what's new in your dashboard.",
      icon: Icons.Mining,
      color: "text-rzc-green"
    },
    {
      title: "Enhanced Features",
      description: "Discover new missions, improved rewards, and upgraded mining capabilities in this update.",
      icon: Icons.Task,
      color: "text-purple-400"
    },
    {
      title: "Network Growth",
      description: "Your referral network continues to grow. Check your latest bonuses and team performance.",
      icon: Icons.Users,
      color: "text-blue-400"
    }
  ];

  useEffect(() => {
    if (bootStep < bootSequence.length) {
      const timeout = setTimeout(() => {
        setBootStep(prev => prev + 1);
      }, 600); // Speed of typing lines
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setShowTutorial(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [bootStep]);

  const handleNext = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      setIsComplete(true);
      // Mark onboarding as seen for this user
      if (user?.telegram_id) {
        localStorage.setItem(`onboarding_seen_${user.telegram_id}`, 'true');
        localStorage.setItem(`onboarding_completed_${user.telegram_id}`, new Date().toISOString());
      }
      // Auto-close after showing completion
      setTimeout(() => {
        // Parent component will handle closing
      }, 2000);
    }
  };

  const handleSkip = () => {
    setIsComplete(true);
    // Mark as skipped but seen
    if (user?.telegram_id) {
      localStorage.setItem(`onboarding_seen_${user.telegram_id}`, 'true');
      localStorage.setItem(`onboarding_skipped_${user.telegram_id}`, 'true');
    }
    // Auto-close after showing completion
    setTimeout(() => {
      // Parent component will handle closing
    }, 1000);
  };

  if (!user) return null;

  // Show completion screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 flex flex-col h-screen w-screen relative overflow-hidden bg-black z-50">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', 
               backgroundSize: '30px 30px' 
             }}>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 text-center">
          {/* Success Icon */}
          <div className="w-32 h-32 bg-rzc-dark border border-white/10 rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative group">
            <div className="absolute inset-0 rounded-[2rem] opacity-20 blur-xl bg-rzc-green"></div>
            <Icons.Power size={48} className="text-rzc-green drop-shadow-lg transition-all duration-500 transform scale-110 animate-pulse" />
            
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-white/20"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-white/20"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-white/20"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-white/20"></div>
          </div>

          <h2 className="text-3xl font-bold text-rzc-green mb-4 tracking-tight">
            {isNewUser ? '⛏️ SYSTEM INITIALIZED' : '⛏️ WELCOME BACK'}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-[320px] mb-8">
            {isNewUser 
              ? 'Your mining node is now active and ready to earn RZC tokens!'
              : 'Your mining operations are resuming. Happy mining!'
            }
          </p>

          {/* Loading indicator */}
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-rzc-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showTutorial) {
    const currentSlide = tutorialSteps[tutorialStep];
    const Icon = currentSlide.icon;
    const isLastStep = tutorialStep === tutorialSteps.length - 1;

    return (
      <div className="fixed inset-0 flex flex-col h-screen w-screen relative overflow-hidden bg-black z-50">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', 
               backgroundSize: '30px 30px' 
             }}>
        </div>

        {/* Top Skip Button - Only show for new users */}
        {isNewUser && (
          <div className="absolute top-6 right-6 z-20">
            <button onClick={handleSkip} className="text-gray-500 text-xs font-mono hover:text-white transition-colors">
              SKIP_INTRO
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 text-center">
          {/* Animated Icon Circle */}
          <div className={`w-32 h-32 bg-rzc-dark border border-white/10 rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative group`}>
            <div className={`absolute inset-0 rounded-[2rem] opacity-20 blur-xl ${currentSlide.color.replace('text-', 'bg-')}`}></div>
            <Icon size={48} className={`${currentSlide.color} drop-shadow-lg transition-all duration-500 transform scale-110`} />
            
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-white/20"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-white/20"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-white/20"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-white/20"></div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">{currentSlide.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-[320px]">
            {currentSlide.description}
          </p>
        </div>

        {/* Bottom Controls */}
        <div className="p-8 pb-12 w-full z-10">
          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {tutorialSteps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === tutorialStep 
                  ? 'w-6 bg-rzc-green' 
                  : 'w-1.5 bg-white/20'
                }`} 
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
              isLastStep 
                ? 'bg-rzc-green text-black hover:bg-rzc-green-dim shadow-[0_0_20px_rgba(74,222,128,0.3)]' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {isLastStep ? (
              <>
                {isNewUser ? '⛏️ START MINING' : '⛏️ CONTINUE MINING'} <Icons.Power size={18} />
              </>
            ) : (
              'NEXT STEP'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-start justify-end pb-24 h-screen w-screen p-8 bg-black font-mono text-xs z-50">
      {/* User status indicator */}
      <div className="absolute top-6 right-6 text-rzc-green/60 text-xs font-mono">
        {isNewUser ? 'NEW_USER_DETECTED' : 'RETURNING_USER_DETECTED'}
      </div>
      
      {bootSequence.slice(0, bootStep).map((line, index) => (
        <div key={index} className="text-rzc-green/80 mb-2 animate-fadeIn">
          <span className="mr-2 opacity-50">{`>`}</span>
          {line}
        </div>
      ))}
      <div className="text-rzc-green animate-pulse">_</div>
    </div>
  );
}; 