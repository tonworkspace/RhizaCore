import React, { FC, useState, useEffect } from 'react';
import { FaRocket, FaChartLine, FaUsers, FaGem, FaPlay, FaGamepad } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStep {
  icon: JSX.Element;
  title: string;
  description: string;
  color: string;
  bgPattern: string;
}

export const OnboardingScreen: FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const steps: OnboardingStep[] = [
    {
      icon: <FaRocket className="w-12 h-12" />,
      title: `Welcome to TAPPS Mine${user?.first_name ? ` ${user.first_name}` : ''}!`,
      description: "Start your mining adventure and earn TAPPS tokens",
      color: "from-blue-500 to-blue-700",
      bgPattern: "bg-blue-500/10"
    },
    {
      icon: <FaChartLine className="w-12 h-12" />,
      title: "Level Up Your Earnings",
      description: "Watch your TAPPS tokens grow with every mining session",
      color: "from-blue-600 to-blue-800",
      bgPattern: "bg-blue-600/10"
    },
    {
      icon: <FaUsers className="w-12 h-12" />,
      title: "Build Your Mining Team",
      description: "Invite friends and unlock team bonuses together",
      color: "from-blue-700 to-blue-900",
      bgPattern: "bg-blue-700/10"
    },
    {
      icon: <FaGem className="w-12 h-12" />,
      title: "Unlock Epic Rewards",
      description: "Complete quests and claim legendary bonuses",
      color: "from-blue-800 to-indigo-900",
      bgPattern: "bg-blue-800/10"
    }
  ];

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setGameStarted(true);
      setTimeout(() => setShouldShow(false), 1000);
    }
  };

  const handleSkip = () => {
    setGameStarted(true);
    setTimeout(() => setShouldShow(false), 1000);
  };


  useEffect(() => {
    if (!user) return;

    const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.id}`);
    if (!hasSeenOnboarding && user.total_deposit === 0) {
      setShouldShow(true);
      localStorage.setItem(`onboarding_${user.id}`, 'true');
    }

    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, [user]);

  useEffect(() => {
    if (loading || !autoAdvance) return;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 3000);

    return () => clearInterval(stepInterval);
  }, [loading, steps.length, autoAdvance]);

  useEffect(() => {
    const handleUserInteraction = () => {
      setAutoAdvance(false);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  if (!user || !shouldShow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative max-w-lg w-full px-8 py-12 rounded-3xl bg-white/95 backdrop-blur-md border-4 border-blue-500 shadow-2xl pixel-corners">
        {/* Game-style header */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold border-2 border-blue-800 shadow-lg">
            🎮 TAPPS MINING GAME
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 animate-pulse p-2 border-4 border-blue-300">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <FaGamepad className="w-16 h-16 text-blue-600 animate-bounce" />
                </div>
              </div>
              {/* Spinning rings */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-300 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-3xl font-black text-blue-900 mb-2">
                {user?.total_deposit === 0 ? '🎮 INITIALIZING GAME' : '🎮 WELCOME BACK, MINER!'}
              </h2>
              <p className="text-lg text-blue-700 font-semibold">
                {user?.total_deposit === 0
                  ? 'Setting up your mining adventure...'
                  : 'Loading your mining dashboard...'}
              </p>
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : gameStarted ? (
          <div className="text-center animate-fadeIn">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-blue-700 p-2 border-4 border-blue-300 mb-8">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <FaPlay className="w-16 h-16 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-blue-900 mb-4">🎮 GAME STARTED!</h2>
            <p className="text-xl text-blue-700 font-semibold mb-8">Your mining adventure begins now!</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div key={currentStep} className="text-center">
            {/* Game-style step indicator */}
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full border-2 border-blue-300">
                <span className="text-blue-800 font-bold text-sm">LEVEL {currentStep + 1} / {steps.length}</span>
              </div>
            </div>

            {/* Icon with game-style border */}
            <div className="relative mb-8">
              <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-r ${steps[currentStep].color} p-2 border-4 border-blue-300 shadow-2xl`}>
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  {React.cloneElement(steps[currentStep].icon as React.ReactElement, {
                    className: 'w-16 h-16 text-blue-600'
                  })}
                </div>
              </div>
              {/* Glow effect */}
              <div className={`absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r ${steps[currentStep].color} opacity-30 blur-xl animate-pulse`} />
            </div>

            <h2 className="text-3xl font-black text-blue-900 mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-lg text-blue-700 font-semibold mb-8 px-4 leading-relaxed">
              {steps[currentStep].description}
            </p>

            {/* Game-style progress dots */}
            <div className="flex justify-center gap-3 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentStep 
                      ? 'w-8 bg-blue-600 border-2 border-blue-800'
                      : index < currentStep
                      ? 'w-3 bg-blue-400 border-2 border-blue-600'
                      : 'w-3 bg-blue-200 border-2 border-blue-300 hover:bg-blue-300'
                  }`}
                  onClick={() => {
                    setCurrentStep(index);
                    setAutoAdvance(false);
                  }}
                />
              ))}
            </div>

            {/* Game-style buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleSkip}
                className="order-2 sm:order-1 px-8 py-4 text-base font-bold text-blue-600 hover:text-blue-800 transition-colors rounded-xl border-2 border-blue-300 hover:border-blue-400 bg-white hover:bg-blue-50 transform hover:-translate-y-1 transition-all"
              >
                ⏭️ Skip Tutorial
              </button>
              <button
                onClick={handleContinue}
                className={`order-1 sm:order-2 px-8 py-4 rounded-xl bg-gradient-to-r ${steps[currentStep].color} text-white font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-blue-800`}
              >
                {currentStep === steps.length - 1 ? '🚀 START MINING' : '▶️ Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 