/* Focused tests: market pairs and reset, inactive signals, ordering, uncertainty floors, break-even calculations.
 * Run: npm test  (Node's built-in runner; Node >= 22.6 strips the TypeScript types, no extra dependencies). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import '../src/model/vendor/sim.js';
import * as E from '../src/model/engine.js';
import { NEW_MARKETS, EXISTING_MARKETS, FACTOR_CONFIGS, pairBaseline, similarityIndex, findTarget, findBenchmark } from '../src/data/markets.ts';
import * as Ops from '../src/state/scenarioOps.ts';

const req = createRequire(import.meta.url);
const A = req('../src/model/vendor/assumptions.json'), D = req('../src/model/vendor/data.json');
const Sim = (globalThis as any).ChageeSim;
const ctx = { Sim, A, D };
const BASE = E.defaultInputs(A);
const seoul = findTarget('seoul'), manila = findTarget('manila');
const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

/* ---------------- market pairs and reset ---------------- */
test('similarity depends on both markets of the pair', () => {
  const a = pairBaseline(seoul, findBenchmark('singapore')), b = pairBaseline(seoul, findBenchmark('shanghai'));
  assert.notDeepEqual(a, b);
  assert.notEqual(similarityIndex(a), similarityIndex(pairBaseline(manila, findBenchmark('singapore'))));
  for (const t of NEW_MARKETS) for (const m of EXISTING_MARKETS) {
    const f = pairBaseline(t, m);
    for (const c of FACTOR_CONFIGS) assert.ok(f[c.id] >= 0 && f[c.id] <= 100, `${t.id}/${m.id} ${c.id}`);
  }
});

test('competitive density scores closeness: more or less competition by the same gap scores the same', () => {
  const bench = findBenchmark('kuala-lumpur'), k = bench.profile.competitiveIntensity;
  const more = { ...seoul, profile: { ...seoul.profile, competitiveIntensity: k + 10 } };
  const less = { ...seoul, profile: { ...seoul.profile, competitiveIntensity: k - 10 } };
  assert.equal(pairBaseline(more, bench).competitiveDensity, pairBaseline(less, bench).competitiveDensity);
  assert.equal(pairBaseline({ ...seoul, profile: { ...seoul.profile, competitiveIntensity: k } }, bench).competitiveDensity, 100);
});

test('changing the target loads its default benchmark and that pair baseline', () => {
  const sc = Ops.newScenario(BASE, seoul);
  const next = { ...sc, ...Ops.withTargetMarket(sc, manila) };
  assert.equal(next.benchmarkMarketId, manila.defaultExistingMarketId);
  assert.deepEqual(next.factors, pairBaseline(manila, findBenchmark(manila.defaultExistingMarketId)));
  assert.equal(next.inputs.memberDataAvailable, manila.membershipAvailableDefault);
  assert.equal(next.inputs.preRegistrations, manila.initialAppPreRegs);
});

test('changing the benchmark reloads the new pair baseline, discarding edits to the old pair', () => {
  const sc = { ...Ops.newScenario(BASE, seoul), factors: { demographicFit: 1, competitiveDensity: 2, incomeLevel: 3, urbanDensity: 4 } };
  const next = { ...sc, ...Ops.withBenchmark(sc, 'bangkok') };
  assert.equal(next.benchmarkMarketId, 'bangkok');
  assert.deepEqual(next.factors, pairBaseline(seoul, findBenchmark('bangkok')));
});

test('reset factors restores the selected pair, not the target default pair', () => {
  let sc = Ops.newScenario(BASE, seoul);
  sc = { ...sc, ...Ops.withBenchmark(sc, 'shanghai') };
  sc = { ...sc, factors: { ...sc.factors, incomeLevel: 5 } };
  const reset = { ...sc, ...Ops.withFactorsReset(sc) };
  assert.deepEqual(reset.factors, pairBaseline(seoul, findBenchmark('shanghai')));
  assert.notDeepEqual(reset.factors, pairBaseline(seoul, findBenchmark(seoul.defaultExistingMarketId)));
});

test('reset scenario keeps id and name and restores deck defaults', () => {
  const fresh = Ops.newScenario(BASE, seoul, 'My store');
  const sc = { ...fresh, inputs: { ...fresh.inputs, wage: 20, baseCupsPerDay: 700 } };
  const r = Ops.resetScenario(BASE, sc);
  assert.equal(r.id, sc.id); assert.equal(r.name, 'My store');
  assert.equal(r.inputs.wage, BASE.wage); assert.equal(r.inputs.baseCupsPerDay, BASE.baseCupsPerDay);
  assert.deepEqual(Ops.changedInputs(BASE, r), []);
  assert.deepEqual(Ops.changedInputs(BASE, sc).sort(), ['baseCupsPerDay', 'wage']);
});

/* ---------------- inactive signals ---------------- */
test('inactive member signal: no-signal band, uplift and member counts ignored', () => {
  const s = { ...BASE, memberDataAvailable: false, signalStrength: 1, memberUpliftPct: 20, preRegistrations: 50000 };
  const pr = E.predict(ctx, s);
  assert.equal(pr.u, A.demand.uncertainty_no_signal.value);
  assert.equal(pr.steadyCupsPerDay, BASE.baseCupsPerDay);
  assert.equal(pr.memberImpliedWeek, null);
  assert.equal(pr.uSource, 'no_signal');
  const cmp = E.membershipComparison(ctx, s);
  assert.equal(cmp.with, null); assert.equal(cmp.active, false);
});

test('with/without comparison: same pair and scenario, only the signal differs', () => {
  const s = { ...BASE, memberDataAvailable: true };
  const cmp = E.membershipComparison(ctx, s);
  assert.ok(cmp.with);
  assert.equal(cmp.with!.steadyCupsPerDay, cmp.without.steadyCupsPerDay);   // uplift defaults to 0
  assert.ok(cmp.with!.u < cmp.without.u);
  assert.ok(cmp.with!.stockCost < cmp.without.stockCost);
  assert.deepEqual(cmp.with!.staffing, cmp.without.staffing);              // staffing sized on volume, not band
  // Rosters are whole workers: a small uplift may not add anyone, a large one does; it never removes staff.
  const small = E.membershipComparison(ctx, { ...s, memberUpliftPct: 20 });
  assert.ok(small.with!.staffing.all_human.labourHoursPerDay >= small.without.staffing.all_human.labourHoursPerDay);
  const big = E.membershipComparison(ctx, { ...s, baseCupsPerDay: 800, memberUpliftPct: 30 });
  assert.ok(big.with!.staffing.all_human.labourHoursPerDay > big.without.staffing.all_human.labourHoursPerDay);
});

test('member counts alone never change the forecast; overlap removes double counting', () => {
  const pr = E.predict(ctx, { ...BASE, preRegistrations: 1000, waitlist: 1000, overlapShare: 0.5 });
  assert.equal(pr.uniqueMembers, 1500);
  assert.equal(pr.steadyCupsPerDay, BASE.baseCupsPerDay);
});

/* ---------------- ordering ---------------- */
test('band ordering: low <= base <= high every week; hype weeks above steady weeks', () => {
  for (const sig of [0, 0.5, 1]) {
    const pr = E.predict(ctx, { ...BASE, signalStrength: sig });
    for (const w of pr.weeks) assert.ok(w.low <= w.base && w.base <= w.high);
    assert.ok(pr.weeks[0].base > pr.weeks[pr.hypeWeeks].base);
  }
});

test('stronger signal never widens the band', () => {
  let prev = Infinity;
  for (let sig = 0; sig <= 1.0001; sig += 0.1) { const u = E.bandU(ctx, { ...BASE, signalStrength: sig }); assert.ok(u <= prev + 1e-12); prev = u; }
});

test('counter verdict lists setups cheapest first, margin = runner-up minus winner', () => {
  const c = E.counter(ctx, BASE, { draws: 60 });
  const costs = c.verdict.order.map(k => c.setups[k].costPerCup);
  for (let i = 1; i < costs.length; i++) assert.ok(costs[i - 1] <= costs[i]);
  assert.ok(close(c.verdict.margin, costs[1] - costs[0]));
  assert.equal(c.verdict.tie, c.verdict.margin < A.validation.breakeven.value.tol_cost_sgd_per_cup);
});

/* ---------------- uncertainty floors ---------------- */
test('band half-width never falls below the strong-signal floor', () => {
  const floor = A.demand.uncertainty_strong_signal.value;
  for (const sig of [0, 0.25, 0.5, 0.75, 1]) assert.ok(E.bandU(ctx, { ...BASE, signalStrength: sig }) >= floor - 1e-12);
  assert.ok(close(E.bandU(ctx, { ...BASE, signalStrength: 1 }), floor));
});

test('observed band is floored at the strong-signal width', () => {
  const floor = A.demand.uncertainty_strong_signal.value;
  assert.equal(E.observedBandPrefill(ctx, 0.04), floor);
  assert.equal(E.observedBandPrefill(ctx, 0.3), 0.3);
});

test('demand and stock quantities stay non-negative even with a very wide band', () => {
  const pv = E.provision(ctx, { ...BASE, uOverride: 1.2 });
  assert.ok(pv.twoWeek.lowLitres >= 0);
  assert.ok(pv.curve.every((c: any) => c.waste >= 0 && c.shortage >= 0));
});

/* ---------------- break-even calculations ---------------- */
test('one-variable wage break-even: verdict flips across it, other inputs held', () => {
  const be = D.breakEven.find((r: any) => r.lever === 'wage' && r.a === 'all_human' && r.b === 'mixed');
  assert.equal(be.kind, 'value');
  assert.equal(E.counter(ctx, { ...BASE, wage: be.x - 0.3 }).verdict.winner, 'all_human');
  assert.equal(E.counter(ctx, { ...BASE, wage: be.x + 0.5 }).verdict.winner, 'mixed');
});

test('milk break-even (order at the base) = shortage cost per cup / litres per cup, outside the tested range', () => {
  const pv = E.provision(ctx, BASE);
  assert.ok(close(pv.milkTrigger.value, BASE.stockoutCost / BASE.milkPerCup));
  assert.equal(pv.milkTrigger.kind, 'none_in_range');
  assert.ok(close(pv.criticalRatio, (BASE.stockoutCost / BASE.milkPerCup) / (BASE.stockoutCost / BASE.milkPerCup + BASE.milkWasteCost)));
});

test('buffer above base and two-week procurement arithmetic', () => {
  const pv = E.provision(ctx, BASE), pr = E.predict(ctx, BASE);
  assert.ok(close(pv.buffer.litres, pv.recommended.litres - pv.naive.litres));
  assert.ok(pv.buffer.litres > 0);                                   // shortage costs more than waste
  const hypeDays = pr.hypeWeeks * 7, cpd = pr.steadyCupsPerDay;
  const cups = cpd * (Math.min(14, hypeDays) * pr.hypeMultiplier + Math.max(0, 14 - hypeDays));
  assert.ok(close(pv.twoWeek.baseLitres, cups * BASE.milkPerCup));
  assert.equal(pv.twoWeek.deliveries, Math.ceil(14 / pv.horizon));
});

test('recurring avoided cost = cost-per-cup gap x cups/day x open days, flagged inside the tie tolerance', () => {
  const pr = E.predict(ctx, BASE), prov = E.provision(ctx, BASE, pr), ctr = E.counter(ctx, BASE, { draws: 60 });
  const bn = E.benefit(ctx, BASE, { pr, prov, ctr, vc: null });
  const gap = ctr.setups.mixed.costPerCup - ctr.setups[ctr.verdict.winner].costPerCup;
  assert.ok(bn.recurring);
  assert.ok(close(bn.recurring.perStoreYear, gap * pr.steadyCupsPerDay * A.store.open_days_per_year.value));
  assert.equal(bn.recurring.withinTolerance, Math.abs(gap) < ctr.tol);
});

/* ---------------- Appendix A4 business case ---------------- */
test('A4 business case: payback is the first year cumulative net turns non-negative; stress cases move it as expected', () => {
  const pr = E.predict(ctx, BASE), prov = E.provision(ctx, BASE, pr);
  const bn = E.benefit(ctx, BASE, { pr, prov, ctr: null, vc: { source: 'precomputed', rows: D.volumeCurve } });
  const bc = E.businessCase(ctx, BASE, bn)!;
  const first = bc.years.find(y => y.cum >= 0);
  assert.equal(bc.payback, first ? first.year : null);
  for (let k = 1; k < bc.years.length; k++) assert.ok(close(bc.years[k].cum, bc.years[k - 1].cum + bc.years[k].net));
  const dbl = E.businessCase(ctx, BASE, bn, { oneTimeMult: 2 })!;
  assert.ok(close(bc.cum - dbl.cum, bc.build + bc.integ));                 // one-time costs hit year 1 only
  const half = E.businessCase(ctx, BASE, bn, { savingMult: 0.5 })!;
  const counter = bc.years.reduce((a, y) => a + y.counter, 0);
  assert.ok(close(bc.cum - half.cum, counter / 2));
  assert.equal(E.businessCase(ctx, BASE, { ...bn, pipeline: null }), null); // no curve, no business case
});
