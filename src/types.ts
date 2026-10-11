import type { EngineInputs } from './model/engine.js';

export type SectionId = 'predict' | 'provision' | 'counter' | 'review' | 'questions' | 'summary';
export type Setup = 'all_human' | 'mixed' | 'all_machine';

/* Pair similarity factors, each 0-100 where 100 = target and benchmark alike on that dimension. */
export interface SimilarityFactors {
  demographicFit: number;
  competitiveDensity: number;   // similarity of competitive conditions, not the amount of competition
  incomeLevel: number;
  urbanDensity: number;
}

/* Synthetic 0-100 market profile used only to derive pair similarity baselines. */
export interface MarketProfile {
  youthAffinity: number;
  competitiveIntensity: number;
  incomeLevel: number;
  urbanDensity: number;
}

export interface NewMarket {
  id: string;
  name: string;
  country: string;
  flag: string;
  defaultExistingMarketId: string;
  membershipAvailableDefault: boolean;
  profile: MarketProfile;
  cityTier: string;
  initialAppPreRegs: number;
  initialWaitlist: number;
  marketContext: string;
}

export interface ExistingMarket {
  id: string;
  name: string;
  country: string;
  flag: string;
  storeFormat: string;
  brandMaturityYears: number;
  profile: MarketProfile;
  notes: string;
}

export type Inputs = EngineInputs;

export interface ObservedWeek {
  week: number;
  cups: number;
  repeatShare: number;
  medianServeSec: number;
  milkWasteL: number;
  lostOrdersPerDay: number;
}

export interface Scenario {
  id: string;
  name: string;
  updatedAt: string;
  origin: 'assumptions' | 'observed';
  targetMarketId: string;
  benchmarkMarketId: string;
  factors: SimilarityFactors;
  inputs: Inputs;
  actuals: ObservedWeek[];   // Review: starts as the synthetic example, editable
  actualsSynthetic: boolean; // true until a user edits a cell
}
