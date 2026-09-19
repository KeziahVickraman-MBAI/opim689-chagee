export type Scenario = 'conservative' | 'base' | 'aggressive';

export type TabId = 'market-entry' | 'demand-forecast' | 'membership-signal';

export interface SimilarityFactors {
  demographicFit: number;      // 0 - 100
  competitiveDensity: number;  // 0 - 100 (e.g. density index / saturation level)
  incomeLevel: number;         // 0 - 100 (economic purchasing power proximity)
  urbanDensity: number;        // 0 - 100 (foot traffic & mall/transit density)
}

export interface NewMarket {
  id: string;
  name: string;
  country: string;
  flag: string;
  defaultExistingMarketId: string;
  membershipAvailableDefault: boolean;
  baselineFactors: SimilarityFactors;
  cityTier: string;
  typicalTicketUSD: number;
  initialAppPreRegs: number;
  initialSocialScore: number;
  initialWaitlist: number;
  marketContext: string;
}

export interface ExistingMarket {
  id: string;
  name: string;
  country: string;
  flag: string;
  matureWeeklyCups: number;
  avgTicketUSD: number;
  storeFormat: string;
  operatingCostWeeklyUSD: number;
  brandMaturityYears: number;
  notes: string;
}

export interface MembershipSignals {
  dataAvailable: boolean;
  appPreRegistrations: number; // e.g. 0 to 50,000
  socialInterestScore: number; // 0 to 100
  waitlistSignups: number;     // 0 to 25,000
}

export interface ForecastPoint {
  week: number;
  label: string;
  baseVolume: number;
  upperBound: number;
  lowerBound: number;
  weeklyRevenue: number;
  cumulativeRevenue: number;
  cumulativeCost: number;
  isBreakEven: boolean;
}

export interface RecommendedOutputs {
  inventory: {
    teaLeavesKg: number;
    dairyLiters: number;
    cupsAndStrawsUnits: number;
    bufferPercentage: number;
  };
  staffing: {
    totalOpeningStaff: number;
    peakBaristasPerShift: number;
    prepAndLeadCount: number;
    estimatedShiftHoursWeekly: number;
  };
  financials: {
    breakEvenWeek: number; // 1-12 or 13 (beyond 12 weeks)
    breakEvenUnits: number;
    projectedFirstMonthCups: number;
    uncertaintyBandwidthPct: number;
  };
}
