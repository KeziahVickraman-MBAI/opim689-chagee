/* Types for engine.js (plain JS so Node and the worker share it). Results are loosely typed on purpose. */
export interface EngineInputs {
  baseCupsPerDay: number; signalStrength: number; uOverride: number | null; removeHype: boolean;
  hypeMultiplier: number; hypeWeeks: number; memberDataAvailable: boolean; preRegistrations: number; waitlist: number;
  overlapShare: number; conversionShare: number; cupsPerMemberWeek: number; memberUpliftPct: number; touristUpliftPct: number;
  milkPerCup: number; milkShelfLife: number; milkWasteCost: number; stockoutCost: number; stockHorizonDays: number;
  plannedOrderDays: number; provisionBasis: 'steady' | 'opening';
  surge: 'none' | 'moderate' | 'large'; wage: number; machineMonth: number; lostCost: number; coordHuman: number; coordMixed: number;
  newShare: number; newSpeed: number; flex: number; attendant: number; margin: number; targetWait: number;
  standardSetup: SetupKey; selectedSetup: SetupKey | 'cheapest'; openingsPerYear: number; volumeLo: number; volumeHi: number;
}
type Ctx = { Sim: any; A: any; D: any };   // sim.js and the JSON files are untyped vendored inputs

/* ---------- result types ---------- */
export type SetupKey = 'all_human' | 'mixed' | 'all_machine';
export interface Band { u: number; base: number; low: number; high: number; width: number; removeHype: boolean }
export interface WeekBand { week: number; hype: boolean; base: number; low: number; high: number }
export interface PredictResult {
  baseCupsPerDay: number; memberUpliftCupsPerDay: number; touristCupsPerDay: number; steadyCupsPerDay: number;
  u: number; uSource: 'observed' | 'signal' | 'no_signal'; signalEffective: number; coverage: number; z: number; uNone: number; uStrong: number;
  steady: Band; opening: Band; handed: Band; weeks: WeekBand[];
  uniqueMembers: number; memberImpliedWeek: number | null; hypeMultiplier: number; hypeWeeks: number;
}
export interface OrderCost { litres: number; days: number; waste: number; shortage: number; total: number }
export interface ProvisionResult {
  horizon: number; daily: number; basis: 'steady' | 'opening'; u: number; flags: string[];
  twoWeek: { days: number; deliveries: number; baseLitres: number; highLitres: number; lowLitres: number };
  buffer: { litres: number; shareOfBase: number };
  milkPerCup: number; wasteCost: number; stockoutCost: number; criticalRatio: number; shortCostPerLitre: number;
  recommended: OrderCost & { wasteLitres: number; shortCups: number };
  planned: OrderCost; naive: OrderCost; noSignalBest: { litres: number; total: number }; baseLitres: number;
  milkTrigger: { kind: 'value' | 'none_in_range'; value: number; range: [number, number]; stockoutCost: number; milkPerCup: number };
  curve: { litres: number; waste: number; shortage: number; total: number }[];
}
export interface SetupResult {
  costPerCup: number; perCup: { machine: number; labour: number; lost: number }; lostShare: number; peakLostShare: number;
  cupsServedPerDay: number; labourHoursPerDay: number; machineBusy: number | null; machineUnits: number; peakStaff: number;
  peakUtilisation: number; capacityPerHour: number; peakArrivalsPerHour: number;
  serve: { median: number; p90: number; make: number; servedPerHour: number; ordersPerHour: number; lostShare: number };
}
export interface CounterResult {
  u: number; surge: string; draws: number; seeds: number; tol: number;
  setups: Record<SetupKey, SetupResult>;
  verdict: { winner: SetupKey; runnerUp: SetupKey; order: SetupKey[]; margin: number; tie: boolean };
}
export interface ThresholdRow {
  lever: string; label: string; unit: string; now: number; kind: 'value' | 'none_in_range'; x: number | null;
  step: boolean; range: [number, number]; source: 'precomputed' | 'live'; draws: number;
}
export interface VolumeRow { cupsPerDay: number; all_human: { cost: number }; mixed: { cost: number }; all_machine: { cost: number } }
export interface VolumeCurveResult { source: 'precomputed' | 'live'; rows: VolumeRow[] }
export interface BenefitResult {
  days: number; standard: SetupKey;
  recurring: { selected: SetupKey; perCup: number; perStoreYear: number; cupsPerDay: number; withinTolerance: boolean; tol: number } | null;
  pipeline: { source: 'precomputed' | 'live'; lo: number; hi: number; openings: number; total: number;
              bars: { cupsPerDay: number; share: number; openings: number; perOpening: number; total: number; cheapest: SetupKey }[] } | null;
  oneTime: { perOpeningVsNaive: number; perOpeningSignal: number; openings: number } | null;
}
export interface ActualsSummary { weeksUsed: number; steadyCupsPerDay: number; observedU: number; repeatShare: number; medianServeSec: number; milkWasteLPerWeek: number; lostOrdersPerDay: number }
export interface ModelFacts {
  week5: { tolerancePct: number; gaps: number[]; pass: boolean }; replicaCapacity: Record<string, number>;
  tieTolerance: number; draws: number; liveDraws: number; seed: number; generated: string; fx: number; currency: string; status: string;
}

export const SETUPS: SetupKey[];
export const SETUP_LABEL: Record<string, string>;
export const SURGES: string[];
export const COUNTER_KEYS: string[];
export const THRESHOLD_LEVERS: { lever: string; label: string; unit: string }[];
export const SYNTHETIC_ACTUALS: { label: string; weeks: any[]; observedInputs: { wage: number; machineMonth: number; newShare: number; milkWasteCost: number } };
export function defaultInputs(A: any): EngineInputs;
export function inputMeta(A: any): Record<string, { label: string; unit: string; range: number[]; step: number; source?: string; rationale?: string; usd?: number }>;
export function steadyCupsPerDay(s: EngineInputs): number;
export function paramsFor(ctx: Ctx, s: EngineInputs): any;
export function counterAtDeckDefaults(A: any, s: EngineInputs, o?: { ignoreVolume?: boolean; ignoreU?: boolean }): boolean;
export function bandU(ctx: { A: any; Sim?: any; D?: any }, s: EngineInputs): number;
export function predict(ctx: Ctx, s: EngineInputs): PredictResult;
export function provision(ctx: Ctx, s: EngineInputs, pr?: PredictResult): ProvisionResult;
export function counter(ctx: Ctx, s: EngineInputs, o?: { draws?: number }): CounterResult;
export function thresholds(ctx: Ctx, s: EngineInputs, a: SetupKey, b: SetupKey): ThresholdRow[];
export function volumeCurve(ctx: Ctx, s: EngineInputs): VolumeCurveResult;
export function benefit(ctx: Ctx, s: EngineInputs, parts: { pr: PredictResult; prov: ProvisionResult | null; ctr: CounterResult | null; vc: VolumeCurveResult | null }): BenefitResult;
export function summariseActuals(rows: { week: number; cups: number; repeatShare: number; medianServeSec: number; milkWasteL: number; lostOrdersPerDay: number }[], hypeWeeks: number): ActualsSummary | null;
export function modelFacts(ctx: { A: any; D: any }): ModelFacts;
export interface StaffingRow { peakStaff: number; labourHoursPerDay: number; machineUnits: number }
export interface ComparisonSide { steadyCupsPerDay: number; u: number; low: number; high: number; milkLitres: number; stockCost: number; staffing: Record<SetupKey, StaffingRow> }
export function staffingPlan(ctx: Ctx, s: EngineInputs): Record<SetupKey, StaffingRow>;
export function membershipComparison(ctx: Ctx, s: EngineInputs): { with: ComparisonSide | null; without: ComparisonSide; active: boolean };
export function observedBandPrefill(ctx: { A: any }, observedU: number): number;
