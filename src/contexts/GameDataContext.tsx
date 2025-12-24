import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GameDataContextType {
  claimedRZC: number;
  accumulatedRZC: number;
  isMining: boolean;
  miningBalance: number;
  updateClaimedRZC: (balance: number) => void;
  updateMiningBalance: (balance: number) => void;
  setIsMining: (mining: boolean) => void;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

export const GameDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [claimedRZC, setClaimedRZC] = useState<number>(0);
  const [accumulatedRZC] = useState<number>(0);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [miningBalance, setMiningBalance] = useState<number>(0);

  const updateClaimedRZC = (balance: number) => {
    setClaimedRZC(balance);
  };

  const updateMiningBalance = (balance: number) => {
    setMiningBalance(balance);
  };

  return (
    <GameDataContext.Provider value={{ claimedRZC, accumulatedRZC: accumulatedRZC, isMining, miningBalance, updateClaimedRZC, updateMiningBalance, setIsMining }}>
      {children}
    </GameDataContext.Provider>
  );
};

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
};