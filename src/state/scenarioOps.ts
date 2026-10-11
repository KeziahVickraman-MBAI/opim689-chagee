/* Pure scenario operations, shared by the React store (scenarios.ts) and the Node tests (tests/*.test.ts).
 * `base` is defaultInputs(assumptions.json), passed in so this file has no bundler-only imports. */
import { SYNTHETIC_ACTUALS } from '../model/engine.js';
import { NEW_MARKETS, findTarget, findBenchmark, pairBaseline } from '../data/markets.ts';
import type { Inputs, NewMarket, Scenario } from '../types.ts';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

/* Deck defaults with the target market's member counts. A market without member data starts with no signal. */
export function marketInputs(base: Inputs, m: NewMarket): Inputs {
  return { ...base, memberDataAvailable: m.membershipAvailableDefault, preRegistrations: m.initialAppPreRegs, waitlist: m.initialWaitlist };
}

export function newScenario(base: Inputs, m: NewMarket = NEW_MARKETS[0], name?: string): Scenario {
  const benchmark = findBenchmark(m.defaultExistingMarketId);
  return {
    id: uid(),
    name: name || `${m.name.split(' (')[0]} · reference store`,
    updatedAt: now(),
    origin: 'assumptions',
    targetMarketId: m.id,
    benchmarkMarketId: benchmark.id,
    factors: pairBaseline(m, benchmark),
    inputs: marketInputs(base, m),
    actuals: SYNTHETIC_ACTUALS.weeks.map(w => ({ ...w })),
    actualsSynthetic: true,
  };
}

/* New target: its default benchmark, that pair's baseline factors, and the target's member counts. */
export function withTargetMarket(sc: Scenario, m: NewMarket): Partial<Scenario> {
  const benchmark = findBenchmark(m.defaultExistingMarketId);
  return {
    targetMarketId: m.id,
    benchmarkMarketId: benchmark.id,
    factors: pairBaseline(m, benchmark),
    inputs: { ...sc.inputs, memberDataAvailable: m.membershipAvailableDefault, preRegistrations: m.initialAppPreRegs, waitlist: m.initialWaitlist },
  };
}

/* New benchmark: the factors reload to the new pair's baseline (edits to the old pair's factors do not carry over). */
export function withBenchmark(sc: Scenario, benchmarkId: string): Partial<Scenario> {
  const benchmark = findBenchmark(benchmarkId);
  return { benchmarkMarketId: benchmark.id, factors: pairBaseline(findTarget(sc.targetMarketId), benchmark) };
}

/* Reset factors: the CURRENTLY selected pair's baseline. */
export function withFactorsReset(sc: Scenario): Partial<Scenario> {
  return { factors: pairBaseline(findTarget(sc.targetMarketId), findBenchmark(sc.benchmarkMarketId)) };
}

/* Reset scenario: deck defaults for its target market (and that market's default benchmark); keeps id and name. */
export function resetScenario(base: Inputs, sc: Scenario): Scenario {
  return { ...newScenario(base, findTarget(sc.targetMarketId), sc.name), id: sc.id };
}

/* Which inputs differ from the deck defaults for this market: drives the data-status pill. */
export function changedInputs(base: Inputs, sc: Scenario): (keyof Inputs)[] {
  const d = marketInputs(base, findTarget(sc.targetMarketId));
  return (Object.keys(d) as (keyof Inputs)[]).filter(k => {
    const a = d[k], b = sc.inputs[k];
    return typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a)) : a !== b;
  });
}
