import {
  SimilarityFactors,
  NewMarket,
  ExistingMarket,
  MembershipSignals,
  Scenario,
  ForecastPoint,
  RecommendedOutputs
} from '../types';
import { FACTOR_CONFIGS } from '../data/markets';

/**
 * Calculates weighted similarity score (0 to 100)
 */
export function calculateSimilarityScore(factors: SimilarityFactors): number {
  let score = 0;
  for (const config of FACTOR_CONFIGS) {
    score += factors[config.id as keyof SimilarityFactors] * config.weight;
  }
  return Math.round(score * 10) / 10;
}

/**
 * Calculates early membership signal composite index (0 to 1)
 */
export function calculateMembershipSignalIndex(signals: MembershipSignals): {
  signalIndex: number;
  demandUpliftPct: number;
  uncertaintyReductionPct: number;
} {
  if (!signals.dataAvailable) {
    return {
      signalIndex: 0,
      demandUpliftPct: 0,
      uncertaintyReductionPct: 0
    };
  }

  // Normalized component ratios
  const appRatio = Math.min(Math.max(signals.appPreRegistrations / 50000, 0), 1);
  const socialRatio = Math.min(Math.max(signals.socialInterestScore / 100, 0), 1);
  const waitlistRatio = Math.min(Math.max(signals.waitlistSignups / 25000, 0), 1);

  // Composite signal index: 45% app pre-regs, 25% social interest, 30% VIP waitlist
  const signalIndex = appRatio * 0.45 + socialRatio * 0.25 + waitlistRatio * 0.30;

  // Demand uplift: up to +28% volume increase based on pre-committed audience
  const demandUpliftPct = Math.round(signalIndex * 28 * 10) / 10;

  // Uncertainty reduction: shrinks uncertainty spread by up to 48%
  const uncertaintyReductionPct = Math.round(signalIndex * 48 * 10) / 10;

  return {
    signalIndex,
    demandUpliftPct,
    uncertaintyReductionPct
  };
}

/**
 * Generates 12-week forecast trajectory with upper/lower bounds
 */
export function generateForecast(
  newMarket: NewMarket,
  existingMarket: ExistingMarket,
  similarityScore: number,
  membershipSignals: MembershipSignals,
  scenario: Scenario
): {
  points: ForecastPoint[];
  outputs: RecommendedOutputs;
  baseUncertaintyPct: number;
  netUncertaintyPct: number;
  demandMultiplier: number;
} {
  const { demandUpliftPct, uncertaintyReductionPct } = calculateMembershipSignalIndex(membershipSignals);

  // Scenario multipliers
  let scenarioMultiplier = 1.0;
  if (scenario === 'conservative') {
    scenarioMultiplier = 0.84;
  } else if (scenario === 'aggressive') {
    scenarioMultiplier = 1.22;
  }

  // Baseline volume derived from mature existing market, adjusted by similarity score
  // Similarity 100% -> 95% of mature market volume in base case; Similarity 50% -> 60%
  const similarityScale = 0.35 + (similarityScore / 100) * 0.65;
  const upliftMultiplier = 1 + demandUpliftPct / 100;
  const netDemandMultiplier = similarityScale * upliftMultiplier * scenarioMultiplier;

  // Base weekly reference volume (cups/week)
  const baseWeeklyRunRate = Math.round(existingMarket.matureWeeklyCups * netDemandMultiplier);

  // Uncertainty calculation:
  // Lower similarity = wider uncertainty band.
  // Similarity 100% -> base uncertainty ~ 14%
  // Similarity 50%  -> base uncertainty ~ 36%
  // Similarity 20%  -> base uncertainty ~ 50%
  const baseUncertaintyPct = Math.max(12, Math.round((105 - similarityScore) * 0.44));

  // If membership signal is active, uncertainty is tightened
  const netUncertaintyPct = Math.max(
    8,
    Math.round(baseUncertaintyPct * (1 - uncertaintyReductionPct / 100))
  );

  // Weekly seasonal launch curve:
  // Week 1: Opening Hype (blind box / 1-for-1 milk tea promotions) -> 1.38x
  // Week 2: Strong momentum -> 1.24x
  // Week 3: Post-promo cooldown -> 0.94x
  // Week 4: Stabilization bottom -> 0.88x
  // Week 5: Baseline adoption -> 0.92x
  // Week 6-12: Organic word-of-mouth & mobile app repeat cadence climbing -> 0.96x to 1.15x
  const weeklyMultipliers = [
    1.38, 1.24, 0.94, 0.88, 0.92, 0.96, 1.00, 1.04, 1.08, 1.11, 1.14, 1.17
  ];

  const ticketPrice = newMarket.typicalTicketUSD;
  const fixedWeeklyOperatingCost = existingMarket.operatingCostWeeklyUSD * 0.92; // local adjusted
  const grossMargin = 0.68; // 68% gross margin, typical for premium freshly steeped tea

  const points: ForecastPoint[] = [];
  let cumulativeRevenue = 0;
  let cumulativeCost = 0;
  let breakEvenWeek = 13; // beyond 12 weeks default

  for (let i = 0; i < 12; i++) {
    const weekNum = i + 1;
    const weekCurve = weeklyMultipliers[i];
    const baseVolume = Math.round(baseWeeklyRunRate * weekCurve);

    // As weeks progress, uncertainty band gently expands due to time horizon
    const timeHorizonDrift = 1 + (i * 0.015);
    const effectiveUncertainty = (netUncertaintyPct / 100) * timeHorizonDrift;

    const upperBound = Math.round(baseVolume * (1 + effectiveUncertainty));
    const lowerBound = Math.round(baseVolume * (1 - effectiveUncertainty));

    const weeklyRevenue = Math.round(baseVolume * ticketPrice);
    const variableCogs = weeklyRevenue * (1 - grossMargin);
    const totalWeeklyCost = Math.round(fixedWeeklyOperatingCost + variableCogs);

    cumulativeRevenue += weeklyRevenue;
    cumulativeCost += totalWeeklyCost;

    const isBreakEven = cumulativeRevenue >= cumulativeCost;
    if (isBreakEven && breakEvenWeek === 13) {
      breakEvenWeek = weekNum;
    }

    points.push({
      week: weekNum,
      label: `Wk ${weekNum}`,
      baseVolume,
      upperBound,
      lowerBound,
      weeklyRevenue,
      cumulativeRevenue,
      cumulativeCost,
      isBreakEven
    });
  }

  // Compute recommended outputs based on opening weeks (Week 1 & 2 demand peak)
  const openingTwoWeeksDemand = points[0].baseVolume + points[1].baseVolume;
  const bufferPercentage = scenario === 'aggressive' ? 25 : scenario === 'conservative' ? 12 : 18;
  const budgetedCupsWithBuffer = Math.round(openingTwoWeeksDemand * (1 + bufferPercentage / 100));

  // Inventory formulas:
  // - Premium loose-leaf tea: 18.5g per cup
  // - Fresh milk / dairy: 165 ml (0.165 L) per cup
  // - Custom insulated double-wall cups, seals, & straws: 1:1 + 10% packaging reserve
  const teaLeavesKg = Math.round((budgetedCupsWithBuffer * 0.0185) * 10) / 10;
  const dairyLiters = Math.round(budgetedCupsWithBuffer * 0.165);
  const cupsAndStrawsUnits = Math.round(budgetedCupsWithBuffer * 1.10);

  // Staffing formulas for opening week:
  // High-volume Asian tea stores run 2-3 shifts per day (morning prep, rush, evening close).
  // A peak barista makes ~32 drinks/hour during 4 peak hours.
  const peakDayVolume = Math.round(points[0].baseVolume / 7 * 1.35); // weekend peak
  const peakHourVolume = Math.round(peakDayVolume / 6); // rush hour peak
  const peakBaristasPerShift = Math.max(4, Math.ceil(peakHourVolume / 32));
  const prepAndLeadCount = 3; // Shift manager, stock/tea leaf stewart, QC lead
  const totalOpeningStaff = Math.max(8, Math.ceil(peakBaristasPerShift * 2.2 + prepAndLeadCount));
  const estimatedShiftHoursWeekly = totalOpeningStaff * 38;

  // First month volume (weeks 1 to 4)
  const projectedFirstMonthCups = points.slice(0, 4).reduce((sum, p) => sum + p.baseVolume, 0);

  // Approximate break-even weekly volume required
  const breakEvenUnitsPerWeek = Math.round(fixedWeeklyOperatingCost / (ticketPrice * grossMargin));

  const outputs: RecommendedOutputs = {
    inventory: {
      teaLeavesKg,
      dairyLiters,
      cupsAndStrawsUnits,
      bufferPercentage
    },
    staffing: {
      totalOpeningStaff,
      peakBaristasPerShift,
      prepAndLeadCount,
      estimatedShiftHoursWeekly
    },
    financials: {
      breakEvenWeek,
      breakEvenUnits: breakEvenUnitsPerWeek,
      projectedFirstMonthCups,
      uncertaintyBandwidthPct: netUncertaintyPct
    }
  };

  return {
    points,
    outputs,
    baseUncertaintyPct,
    netUncertaintyPct,
    demandMultiplier: netDemandMultiplier
  };
}
