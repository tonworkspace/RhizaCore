export interface User {
  balance: number;
  total_earned: number;
  last_claim_time: number;
}

export type TopTab = 'Mining' | 'Boost' | 'Rank';

export interface MiningState {
  balance: number;
  miningRatePerHour: number;
  isMining: boolean;
  sessionStartTime: number;
  miningBalance: number;
  validatedBalance: number;
}