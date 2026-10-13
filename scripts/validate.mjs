/* validate.mjs - checks that the app's engine reproduces the deck's model and handles edge cases honestly.
 * Run: npm run validate            (optionally DECK=/path/to/chagee-deck to also hash-compare the vendored files)
 */
import { createRequire } from "module";
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const V = path.join(here, "../src/model/vendor");
await import(path.join(V, "sim.js"));
const Sim = globalThis.ChageeSim;
const req = createRequire(import.meta.url);
const A = req(path.join(V, "assumptions.json")), D = req(path.join(V, "data.json"));
const E = await import(path.join(here, "../src/model/engine.js"));
const ctx = { Sim, A, D };

let fails = 0, passes = 0;
const ok = (name, cond, detail = "") => { cond ? passes++ : fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const f = (x, d = 4) => (typeof x === "number" ? x.toFixed(d) : String(x));

/* 1. vendored files are the deck's, unchanged */
const DECK = process.env.DECK || path.join(here, "../../../chagee-deck");
const files = [["sim.js", "sim/sim.js"], ["store.js", "sim/store.js"], ["assumptions.json", "assumptions.json"], ["data.json", "deck/build/data.json"]];
if (existsSync(DECK)) {
  for (const [mine, theirs] of files) {
    const h = p => createHash("sha256").update(readFileSync(p)).digest("hex");
    ok(`vendored ${mine} identical to deck ${theirs}`, h(path.join(V, mine)) === h(path.join(DECK, theirs)));
  }
} else console.log(`SKIP  deck repository not found at ${DECK}; vendored files not hash-checked`);

/* 2. defaults match the supplied model */
const s0 = E.defaultInputs(A), P = Sim.params(A);
const pr = E.predict(ctx, s0);
ok("default band equals data.json defaults.band", ["u", "base", "low", "high"].every(k => close(pr.handed[k], D.defaults.band[k])),
   `±${f(pr.u * 100, 1)}%, ${f(pr.handed.low, 0)}–${f(pr.handed.base, 0)}–${f(pr.handed.high, 0)} cups/week`);
const pv = E.provision(ctx, s0, pr);
ok("default best milk order equals data.json provision.def", close(pv.recommended.days, D.provision.def.optDays) && close(pv.recommended.total, D.provision.def.optTotal),
   `${f(pv.recommended.litres, 0)} L, expected cost S$${f(pv.recommended.total, 2)}`);
ok("default planned order (7 days) equals data.json provision.def.total", close(pv.planned.total, D.provision.def.total));
ok("no-signal best order equals data.json provision.none.optTotal", close(pv.noSignalBest.total, D.provision.none.optTotal));
ok("critical ratio = stockout/(stockout+waste) per litre", close(pv.criticalRatio, D.provision.def.criticalRatio), f(pv.criticalRatio, 3));
const ct = E.counter(ctx, s0);
const live = Sim.runPoint(P, Sim.defaultU(P), P.surgeDefault, P.seed, P.draws);
ok("default counter costs equal sim.runPoint at deck defaults", E.SETUPS.every(k => close(ct.setups[k].costPerCup, live[k].costPerCup)),
   E.SETUPS.map(k => `${k} S$${f(ct.setups[k].costPerCup)}`).join(", "));
ok("default all-human vs mixed gap equals deck tornado base", close(ct.setups.mixed.costPerCup - ct.setups.all_human.costPerCup, D.tornado.base), `S$${f(D.tornado.base)}`);
ok("default verdict: all-human, not a tie (gap > S$0.01)", ct.verdict.winner === "all_human" && !ct.verdict.tie, `margin S$${f(ct.verdict.margin)}`);
ok("default service times equal data.json store.moderate", E.SETUPS.every(k => close(ct.setups[k].serve.median, D.store.moderate[k].median) && close(ct.setups[k].serve.p90, D.store.moderate[k].p90)));
ok("default peak utilisation equals data.json util.moderate", E.SETUPS.every(k => close(ct.setups[k].peakUtilisation, D.util.moderate[k].utilisation)));
const th = E.thresholds(ctx, s0, ct.verdict.winner, ct.verdict.runnerUp);
ok("default thresholds come from data.json breakEven", th.every(t => t.source === "precomputed"));
const wageBE = th.find(t => t.lever === "wage");
ok("wage threshold reproduces with full draws", close(Sim.breakEven(P, "wage", "all_human", "mixed").x, wageBE.x), `S$${f(wageBE.x, 2)}/hour`);
const vc = E.volumeCurve(ctx, s0);
const bn = E.benefit(ctx, s0, { pr, prov: pv, ctr: ct, vc });
// deck build_deck.py benefit_values(): bn_counter and bn_stock
const rows = D.volumeCurve, days = 360, best = r => Math.min(...E.SETUPS.map(k => r[k].cost));
const lo = rows[0].cupsPerDay, hi = rows[rows.length - 1].cupsPerDay, step = rows[1].cupsPerDay - lo;
const deckCounter = 200 * rows.reduce((a, r) => a + (Math.min(hi, r.cupsPerDay + step / 2) - Math.max(lo, r.cupsPerDay - step / 2)) / (hi - lo) * (r.mixed.cost - best(r)) * r.cupsPerDay * days, 0);
ok("pipeline avoided cost equals deck bn_counter", close(bn.pipeline.total, deckCounter), `S$${f(bn.pipeline.total / 1e6, 3)}m/year`);
ok("one-time signal stock term equals deck bn_stock", close(bn.oneTime.perOpeningSignal * bn.oneTime.openings, 200 * (D.provision.none.optTotal - D.provision.def.optTotal)),
   `S$${f(bn.oneTime.perOpeningSignal * 200 / 1e3, 1)}k one-time`);

/* 2b. Appendix A4 business case reproduces deck/revenue_cost.md (deck c92cfd6) */
const bc = E.businessCase(ctx, s0, bn);
ok("A4: counter saving per store-year S$2,277 and stock S$370 per opening", Math.round(bc.perStore) === 2277 && Math.round(bc.perOpen) === 370,
   `S$${f(bc.perStore, 0)} · S$${f(bc.perOpen, 0)}`);
ok("A4: 5-year cumulative net S$289k, payback in year 5", Math.round(bc.cum / 1e3) === 289 && bc.payback === 5, `S$${f(bc.cum / 1e3, 1)}k, year ${bc.payback}`);
ok("A4: year 1 total cost S$1,518k, benefit S$302k", Math.round(bc.years[0].cost / 1e3) === 1518 && Math.round(bc.years[0].benefit / 1e3) === 302);
const sens = E.businessSensitivity(ctx, s0, bn).map(r => Math.round(r.cum / 1e3));
ok("A4: sensitivity cases match (289, -465, -2558, -1493 S$k)", JSON.stringify(sens) === JSON.stringify([289, -465, -2558, -1493]), sens.join(", "));

/* 3. combined inputs drive the verdict (no "any threshold crossed" rule) */
const sHi = { ...s0, wage: 16.5 };                    // past the one-variable wage threshold (~S$15.97)
const sLo = { ...s0, wage: 16.5, machineMonth: 2200 };  // same wage, but a dearer machine
const cHi = E.counter(ctx, sHi), cLo = E.counter(ctx, sLo);
ok("wage past its one-variable threshold flips verdict to mixed (other inputs at default)", cHi.verdict.winner === "mixed", `margin S$${f(cHi.verdict.margin)}`);
ok("wage still past its threshold, dearer machine: joint verdict stays all-human (an 'any trigger crossed' rule would say mixed)",
   cLo.verdict.winner === "all_human", `${cLo.verdict.winner} by S$${f(cLo.verdict.margin)}`);

/* 4. ties and absent crossovers */
const tieCase = (() => { // bisection on wage for a near-zero gap
  let a = 15.06, b = 16.5;
  for (let i = 0; i < 20; i++) { const m = (a + b) / 2, c = E.counter(ctx, { ...s0, wage: m }, { draws: 100 }); if (c.setups.mixed.costPerCup < c.setups.all_human.costPerCup) b = m; else a = m; }
  return E.counter(ctx, { ...s0, wage: (a + b) / 2 }, { draws: 100 });
})();
ok("near the wage threshold the verdict is a tie", tieCase.verdict.tie, `margin S$${f(tieCase.verdict.margin)} < S$${tieCase.tol}`);
const none = th.filter(t => t.kind === "none_in_range");
ok("levers with no crossover report none_in_range and no value", none.length > 0 && none.every(t => t.x === null), none.map(t => t.lever).join(", "));

/* 5. units and conversions */
ok("base cups/day = cups_per_store_per_year / open_days_per_year", close(s0.baseCupsPerDay, 200000 / 360), f(s0.baseCupsPerDay, 2));
ok("weekly band base = 7 × daily", close(pr.steady.base, 7 * pr.steadyCupsPerDay));
ok("litres = days × cups/day × L/cup", close(pv.recommended.litres, pv.recommended.days * pv.daily * pv.milkPerCup));
ok("USD-approved costs converted at fx", close(A.costs.machine_cost_per_unit_per_month.value, A.costs.machine_cost_per_unit_per_month.value_usd * A._meta.fx_sgd_per_usd.value),
   `${A.costs.machine_cost_per_unit_per_month.value_usd} USD × ${A._meta.fx_sgd_per_usd.value} = S$${A.costs.machine_cost_per_unit_per_month.value}`);
ok("per-cup components sum to cost per cup", E.SETUPS.every(k => { const c = ct.setups[k]; return close(c.perCup.machine + c.perCup.labour + c.perCup.lost, c.costPerCup); }));

/* 6. honest handling of missing data and bad horizons */
const pvH = E.provision(ctx, { ...s0, stockHorizonDays: 12 }, pr);
ok("stock horizon beyond shelf life is capped and flagged", pvH.horizon === s0.milkShelfLife && pvH.flags.some(x => x.includes("Replenishment is not modelled")));
const noSig = E.predict(ctx, { ...s0, memberDataAvailable: false });
ok("no member data -> no-signal band, uplift ignored", close(noSig.u, A.demand.uncertainty_no_signal.value) && noSig.memberImpliedWeek === null);
const ov = E.predict(ctx, { ...s0, preRegistrations: 1000, waitlist: 1000, overlapShare: 0.5 });
ok("waitlist overlap removes double-counted people", ov.uniqueMembers === 1500);
ok("member counts do not change the forecast unless an uplift is set", close(ov.steadyCupsPerDay, s0.baseCupsPerDay));

/* 7. linkage: upstream change moves every downstream output */
const s2 = { ...s0, baseCupsPerDay: 700 };
const pr2 = E.predict(ctx, s2), pv2 = E.provision(ctx, s2, pr2), ct2 = E.counter(ctx, s2, { draws: 100 });
ok("raising forecast volume raises milk order and counter volume",
   pv2.recommended.litres > pv.recommended.litres && ct2.setups.mixed.cupsServedPerDay > ct.setups.mixed.cupsServedPerDay);
const sm = E.summariseActuals(E.SYNTHETIC_ACTUALS.weeks, s0.hypeWeeks);
ok("synthetic actuals summarise to model inputs (post-hype weeks only)", sm.weeksUsed === 6, `${f(sm.steadyCupsPerDay, 0)} cups/day, observed ±${f(sm.observedU * 100, 1)}%`);

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
