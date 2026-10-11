/* engine.js - the app's single calculation layer.
 *
 * Every modelled number comes from the deck's model (vendor/sim.js) and its inputs (vendor/assumptions.json,
 * vendor/data.json). This file maps a scenario onto sim.js parameters and reads results back. Its own arithmetic
 * is limited to unit conversions, the two-week procurement total, the observed-band floor, benefit annualisation
 * and summarising entered actuals; it adds no forecasting, costing or optimisation model. App-only inputs (member
 * counts, conversion, member uplift, tourist add-on) are labelled as such and default to values that leave the
 * deck's numbers unchanged.
 *
 * Pure functions, plain JS: the React app, the Web Worker and scripts/validate.mjs all import this file.
 * ctx = { Sim, A, D }: Sim = window/globalThis.ChageeSim, A = assumptions.json, D = data.json.
 */

export const SETUPS = ["all_human", "mixed", "all_machine"];
export const SETUP_LABEL = { all_human: "All-human", mixed: "Mixed", all_machine: "All-machine" };
export const SURGES = ["none", "moderate", "large"];

const v = (A, sec, key) => A[sec][key].value;
const rng = (A, sec, key) => A[sec][key].range;

/* ---------------- scenario ---------------- */

/* Inputs that move the counter model. Used to key worker results and to detect "deck defaults". */
export const COUNTER_KEYS = ["surge", "wage", "machineMonth", "lostCost", "coordHuman", "coordMixed", "newShare",
  "newSpeed", "flex", "attendant", "margin", "targetWait"];

export function defaultInputs(A) {
  return {
    // Predict
    baseCupsPerDay: v(A, "store", "cups_per_store_per_year") / v(A, "store", "open_days_per_year"),
    signalStrength: v(A, "predict", "signal_strength_default"),
    uOverride: null,                 // set only by "apply observed inputs" in Review
    removeHype: v(A, "predict_toggles", "remove_hype_default"),
    hypeMultiplier: v(A, "demand", "opening_hype_multiplier"),
    hypeWeeks: v(A, "demand", "opening_hype_weeks"),
    memberDataAvailable: true,
    preRegistrations: 0,
    waitlist: 0,
    overlapShare: 0.4,               // app assumption: share of waitlist sign-ups already pre-registered
    conversionShare: 0.1,            // app assumption: unique members who become steady weekly buyers
    cupsPerMemberWeek: 1,            // app assumption
    memberUpliftPct: 0,              // app assumption, default 0 so the deck's base is unchanged
    touristUpliftPct: 0,             // app assumption: the deck names this blind spot but does not model it
    // Provision
    milkPerCup: v(A, "provision", "milk_litres_per_cup"),
    milkShelfLife: v(A, "provision", "milk_shelf_life_days"),
    milkWasteCost: v(A, "provision", "milk_waste_cost_per_litre"),
    stockoutCost: v(A, "provision", "stockout_cost_per_cup"),
    stockHorizonDays: v(A, "provision", "milk_shelf_life_days"),
    plannedOrderDays: v(A, "provision", "opening_stock_days"),
    provisionBasis: "steady",        // "steady" (deck default: hype removed) or "opening" (hype included)
    // Counter
    surge: v(A, "surge", "surge_default"),
    wage: v(A, "costs", "labour_cost_per_hour"),
    machineMonth: v(A, "costs", "machine_cost_per_unit_per_month"),
    lostCost: v(A, "costs", "lost_order_cost"),
    coordHuman: v(A, "people", "coordination_loss_human"),
    coordMixed: v(A, "people", "coordination_loss_mixed"),
    newShare: v(A, "people", "new_staff_share"),
    newSpeed: v(A, "people", "new_staff_relative_speed"),
    flex: v(A, "people", "staffing_flexibility"),
    attendant: v(A, "people", "all_machine_attendant_per_open_hour"),
    margin: v(A, "costs", "capacity_safety_margin"),
    targetWait: v(A, "service", "target_wait_minutes"),
    // Review and benefit
    standardSetup: "mixed",          // deck comparator: Chagee's semi-automated counter, modelled as mixed
    selectedSetup: "cheapest",
    openingsPerYear: v(A, "benefit", "overseas_stores_per_year"),
    volumeLo: rng(A, "store", "cups_per_store_per_year")[0] / v(A, "store", "open_days_per_year"),
    volumeHi: rng(A, "store", "cups_per_store_per_year")[1] / v(A, "store", "open_days_per_year"),
  };
}

/* Input metadata: label, unit, range and provenance. Ranges come from assumptions.json where it has one. */
export function inputMeta(A) {
  const days = v(A, "store", "open_days_per_year"), cpy = rng(A, "store", "cups_per_store_per_year");
  const src = (sec, key) => ({ source: `assumptions.json ${sec}.${key}`, rationale: A[sec][key].rationale, usd: A[sec][key].value_usd });
  const app = note => ({ source: "app assumption (not in assumptions.json)", rationale: note });
  return {
    baseCupsPerDay: { label: "Base steady demand", unit: "cups/day", range: [cpy[0] / days, cpy[1] / days], step: 1, ...src("store", "cups_per_store_per_year") },
    signalStrength: { label: "Assumed signal strength", unit: "0 = none, 1 = strong", range: rng(A, "predict", "signal_strength_default"), step: 0.05, ...src("predict", "signal_strength_default") },
    hypeMultiplier: { label: "Opening hype", unit: "× steady demand", range: rng(A, "demand", "opening_hype_multiplier"), step: 0.05, ...src("demand", "opening_hype_multiplier") },
    hypeWeeks: { label: "Hype lasts", unit: "weeks", range: rng(A, "demand", "opening_hype_weeks"), step: 1, ...src("demand", "opening_hype_weeks") },
    overlapShare: { label: "Waitlist already pre-registered", unit: "share", range: [0, 1], step: 0.05, ...app("Removes people counted in both lists.") },
    conversionShare: { label: "Members who become steady buyers", unit: "share of unique members", range: [0, 0.5], step: 0.01, ...app("Sign-ups are interest, not purchases. Needs a proxy from existing markets.") },
    cupsPerMemberWeek: { label: "Cups per converted member", unit: "cups/week", range: [0.25, 4], step: 0.25, ...app("Needs repeat-rate data from existing stores.") },
    memberUpliftPct: { label: "Demand uplift from member signal", unit: "% of base", range: [-30, 30], step: 1, ...app("Default 0: the deck uses the signal to narrow the band, not to raise demand.") },
    touristUpliftPct: { label: "Tourist and non-member demand", unit: "% added to base", range: [0, 50], step: 1, ...app("The deck names this blind spot and does not model it.") },
    milkPerCup: { label: "Milk per cup", unit: "L/cup", range: rng(A, "provision", "milk_litres_per_cup"), step: 0.01, ...src("provision", "milk_litres_per_cup") },
    milkShelfLife: { label: "Milk shelf life", unit: "days", range: rng(A, "provision", "milk_shelf_life_days"), step: 1, ...src("provision", "milk_shelf_life_days") },
    milkWasteCost: { label: "Waste cost", unit: "SGD per litre expired", range: rng(A, "provision", "milk_waste_cost_per_litre"), step: 0.01, ...src("provision", "milk_waste_cost_per_litre") },
    stockoutCost: { label: "Shortage cost", unit: "SGD per cup not served", range: rng(A, "provision", "stockout_cost_per_cup"), step: 0.01, ...src("provision", "stockout_cost_per_cup") },
    stockHorizonDays: { label: "Stock horizon (until the next milk delivery)", unit: "days", range: [1, v(A, "provision", "milk_shelf_life_days")], step: 1, source: "assumptions.json provision.milk_shelf_life_days (default horizon)", rationale: "The deck's opening order covers one shelf life. Replenishment within the horizon is not modelled." },
    plannedOrderDays: { label: "Your planned order", unit: "days of base demand", range: rng(A, "provision", "opening_stock_days"), step: 1, ...src("provision", "opening_stock_days") },
    wage: { label: "Wage, fully loaded", unit: "SGD per hour worked", range: rng(A, "costs", "labour_cost_per_hour"), step: 0.01, ...src("costs", "labour_cost_per_hour") },
    machineMonth: { label: "Machine cost", unit: "SGD per station unit per month", range: rng(A, "costs", "machine_cost_per_unit_per_month"), step: 1, ...src("costs", "machine_cost_per_unit_per_month") },
    lostCost: { label: "Lost-order cost", unit: "SGD per order", range: rng(A, "costs", "lost_order_cost"), step: 0.01, ...src("costs", "lost_order_cost") },
    coordHuman: { label: "Coordination, all-human", unit: "× pooled speed", range: rng(A, "people", "coordination_loss_human"), step: 0.01, ...src("people", "coordination_loss_human") },
    coordMixed: { label: "Coordination, mixed", unit: "× pooled speed", range: rng(A, "people", "coordination_loss_mixed"), step: 0.01, ...src("people", "coordination_loss_mixed") },
    newShare: { label: "New staff share", unit: "share of roster", range: rng(A, "people", "new_staff_share"), step: 0.05, ...src("people", "new_staff_share") },
    newSpeed: { label: "New staff speed", unit: "× average", range: rng(A, "people", "new_staff_relative_speed"), step: 0.05, ...src("people", "new_staff_relative_speed") },
    flex: { label: "Roster flexibility after opening", unit: "share of gap closed", range: rng(A, "people", "staffing_flexibility"), step: 0.05, ...src("people", "staffing_flexibility") },
    attendant: { label: "All-machine attendants", unit: "workers per open hour", range: rng(A, "people", "all_machine_attendant_per_open_hour"), step: 0.5, ...src("people", "all_machine_attendant_per_open_hour") },
    margin: { label: "Capacity safety margin", unit: "× forecast peak", range: rng(A, "costs", "capacity_safety_margin"), step: 0.05, ...src("costs", "capacity_safety_margin") },
    targetWait: { label: "Longest wait before an order is lost", unit: "minutes", range: rng(A, "service", "target_wait_minutes"), step: 0.5, ...src("service", "target_wait_minutes") },
    openingsPerYear: { label: "Overseas openings a year", unit: "stores/year", range: rng(A, "benefit", "overseas_stores_per_year"), step: 1, ...src("benefit", "overseas_stores_per_year") },
    volumeLo: { label: "Opening volumes: lowest", unit: "cups/day", range: [cpy[0] / days, cpy[1] / days], step: 1, ...src("store", "cups_per_store_per_year") },
    volumeHi: { label: "Opening volumes: highest", unit: "cups/day", range: [cpy[0] / days, cpy[1] / days], step: 1, ...src("store", "cups_per_store_per_year") },
  };
}

/* ---------------- parameters ---------------- */

export function steadyCupsPerDay(s) {
  const member = s.memberDataAvailable ? 1 + s.memberUpliftPct / 100 : 1;
  return s.baseCupsPerDay * member * (1 + s.touristUpliftPct / 100);
}

/* sim.js parameters for a scenario: the deck's params(A), with the scenario's editable inputs laid over. */
export function paramsFor({ Sim, A }, s) {
  const P = Sim.params(A);
  return {
    ...P,
    cupsYear: steadyCupsPerDay(s) * P.days,
    hype: s.hypeMultiplier,
    wage: s.wage, machineMonth: s.machineMonth, lostCost: s.lostCost,
    coord: { all_human: s.coordHuman, mixed: s.coordMixed },
    newShare: s.newShare, newSpeed: s.newSpeed, flex: s.flex, attendant: s.attendant,
    margin: s.margin, targetWait: s.targetWait,
    milkPerCup: s.milkPerCup, wasteCost: s.milkWasteCost, shelfLife: s.milkShelfLife, stockoutCost: s.stockoutCost,
  };
}

const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/* True when every input that moves the counter model equals assumptions.json, so data.json applies as is. */
export function counterAtDeckDefaults(A, s, { ignoreVolume = false, ignoreU = false } = {}) {
  const d = defaultInputs(A), dem = (x) => ({ cpd: steadyCupsPerDay(x), u: bandU({ Sim: null, A }, x) });
  if (!COUNTER_KEYS.every(k => (typeof d[k] === "number" ? near(d[k], s[k]) : d[k] === s[k]))) return false;
  const a = dem(s), b = dem(d);
  return (ignoreVolume || near(a.cpd, b.cpd)) && (ignoreU || near(a.u, b.u));
}

/* ---------------- Predict ---------------- */

/* Band half-width u: sim.js band() rule (straight line between the no-signal and strong-signal widths). */
export function bandU({ A }, s) {
  if (s.uOverride != null) return s.uOverride;
  const sig = s.memberDataAvailable ? s.signalStrength : 0;
  const uNone = v(A, "demand", "uncertainty_no_signal"), uStrong = v(A, "demand", "uncertainty_strong_signal");
  return uNone - sig * (uNone - uStrong);
}

export function predict(ctx, s) {
  const { Sim, A } = ctx, P = paramsFor(ctx, s);
  const sig = s.memberDataAvailable ? s.signalStrength : 0;
  const u = bandU(ctx, s);
  // sim.js band() when the band comes from the signal; the same arithmetic when it comes from observed data.
  const mk = removeHype => s.uOverride == null ? Sim.band(P, sig, removeHype) : (() => {
    const base = 7 * Sim.dailyBase(P) * (removeHype ? 1 : P.hype);
    return { u, base, low: base * (1 - u), high: base * (1 + u), width: 2 * u * base, removeHype };
  })();
  const steady = mk(true), opening = mk(false);
  const handed = s.removeHype ? steady : opening;
  const uniqueMembers = s.preRegistrations + s.waitlist * (1 - s.overlapShare);
  const memberImpliedWeek = s.memberDataAvailable ? uniqueMembers * s.conversionShare * s.cupsPerMemberWeek : null;
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const b = i < s.hypeWeeks ? opening : steady;
    return { week: i + 1, hype: i < s.hypeWeeks, base: b.base, low: b.low, high: b.high };
  });
  const z = Sim.normInv(0.5 + P.coverage / 2);
  return {
    baseCupsPerDay: s.baseCupsPerDay,
    memberUpliftCupsPerDay: s.memberDataAvailable ? s.baseCupsPerDay * s.memberUpliftPct / 100 : 0,
    touristCupsPerDay: steadyCupsPerDay(s) - s.baseCupsPerDay * (s.memberDataAvailable ? 1 + s.memberUpliftPct / 100 : 1),
    steadyCupsPerDay: steadyCupsPerDay(s),
    u, uSource: s.uOverride != null ? "observed" : s.memberDataAvailable ? "signal" : "no_signal",
    signalEffective: sig, coverage: P.coverage, z,
    uNone: P.uNone, uStrong: P.uStrong,
    steady, opening, handed, weeks,
    uniqueMembers, memberImpliedWeek,
    hypeMultiplier: P.hype, hypeWeeks: s.hypeWeeks,
  };
}

/* ---------------- Provision ---------------- */

export function provision(ctx, s, pr = predict(ctx, s)) {
  const { Sim } = ctx, P0 = paramsFor(ctx, s);
  const flags = [];
  let H = s.stockHorizonDays;
  if (H > s.milkShelfLife) {
    flags.push(`The stock horizon (${H} days) is longer than the milk shelf life (${s.milkShelfLife} days). Replenishment is not modelled, so the horizon is capped at the shelf life.`);
    H = s.milkShelfLife;
  }
  // sim.provision() sizes one order for one shelf life (P.shelfLife). A shorter horizon is passed in its place:
  // milk left when the next delivery arrives is counted as waste (no carry-over is modelled).
  const P = { ...P0, shelfLife: H };
  const daily = s.provisionBasis === "opening" ? pr.steadyCupsPerDay * P.hype : pr.steadyCupsPerDay;
  if (s.provisionBasis === "steady" && pr.hypeWeeks * 7 >= 1)
    flags.push(`Sized on steady demand (the deck's default). The first ${H} days fall inside the ${pr.hypeWeeks}-week opening hype, when demand is modelled at ${P.hype.toFixed(2)}× steady.`);
  if (s.plannedOrderDays > s.milkShelfLife)
    flags.push(`Your planned order covers ${s.plannedOrderDays} days of demand but milk keeps ${s.milkShelfLife} days.`);
  const u = pr.u;
  const r = Sim.provision(P, u, s.plannedOrderDays, daily);
  const L = d => d * daily * P.milkPerCup;                              // days of demand -> litres
  const naive = r.curve(H);                                            // "order the base forecast" for the horizon
  const none = Sim.provision(P, P.uNone, H, daily);                    // same order rule with no pre-launch signal
  const maxL = Math.max(L(2 * H), L(r.optDays) * 1.25, L(s.plannedOrderDays) * 1.1);
  const curve = Array.from({ length: 61 }, (_, i) => {
    const litres = maxL * i / 60, c = r.curve(litres / (daily * P.milkPerCup));
    return { litres, waste: c.waste, shortage: c.stockout, total: c.waste + c.stockout };
  });
  // Two-week procurement requirement: forecast milk over days 1-14 (hype days at the hype multiplier, then steady),
  // bought across ceil(14 / H) staggered deliveries. Arithmetic on the forecast only; the newsvendor sizes the
  // first delivery alone, and later deliveries should be re-sized on observed sales.
  const dayCups = d => pr.steadyCupsPerDay * (d < pr.hypeWeeks * 7 ? P.hype : 1);
  const twoWeekCups = Array.from({ length: 14 }, (_, d) => dayCups(d)).reduce((a, b) => a + b, 0);
  const twoWeek = { days: 14, deliveries: Math.ceil(14 / H), baseLitres: twoWeekCups * P.milkPerCup,
                    highLitres: twoWeekCups * (1 + u) * P.milkPerCup, lowLitres: twoWeekCups * Math.max(0, 1 - u) * P.milkPerCup };
  return {
    horizon: H, daily, basis: s.provisionBasis, u, flags, twoWeek,
    buffer: { litres: L(r.optDays) - L(H), shareOfBase: r.optDays / H - 1 },
    milkPerCup: P.milkPerCup, wasteCost: P.wasteCost, stockoutCost: P.stockoutCost,
    criticalRatio: r.criticalRatio,
    shortCostPerLitre: P.stockoutCost / P.milkPerCup,
    recommended: { litres: L(r.optDays), days: r.optDays, waste: r.optWaste, shortage: r.optStockout, total: r.optTotal,
                   wasteLitres: r.optWaste / P.wasteCost, shortCups: r.optStockout / P.stockoutCost },
    planned: { litres: L(s.plannedOrderDays), days: s.plannedOrderDays, waste: r.waste, shortage: r.stockout, total: r.total },
    naive: { litres: L(H), days: H, waste: naive.waste, shortage: naive.stockout, total: naive.waste + naive.stockout },
    noSignalBest: { litres: L(none.optDays), total: none.optTotal },
    baseLitres: L(H),
    milkTrigger: Sim.milkTrigger(P),
    curve,
  };
}

/* ---------------- Counter (heavy: run in the worker) ---------------- */

export function counter(ctx, s, { draws } = {}) {
  const { Sim, A } = ctx, P = paramsFor(ctx, s), u = bandU(ctx, s), surge = s.surge;
  const N = draws || P.draws, TOL = P.breakeven.tol_cost_sgd_per_cup;
  const r = Sim.runPoint(P, u, surge, P.seed, N);
  const util = Sim.peakUtilisation(P, surge);
  const seeds = v(A, "validation", "crossover_stability").seeds;
  const setups = {};
  for (const k of SETUPS) {
    const st = Sim.serveTimes(P, k, { surge, seeds });
    const pl = Sim.plan(P, k);
    setups[k] = {
      costPerCup: r[k].costPerCup, perCup: r[k].perCup, lostShare: r[k].lostShare, peakLostShare: r[k].peakLostShare,
      cupsServedPerDay: r[k].cupsPerDay, labourHoursPerDay: r[k].labourHoursPerDay, machineBusy: r[k].machineBusy,
      machineUnits: pl.machineUnits, peakStaff: util[k].staff,
      peakUtilisation: util[k].utilisation, capacityPerHour: util[k].capacityPerMin * 60, peakArrivalsPerHour: util[k].arrivalPerMin * 60,
      serve: { median: st.median, p90: st.p90, make: st.make, servedPerHour: st.servedPerHour, ordersPerHour: st.ordersPerHour, lostShare: st.lostShare },
    };
  }
  const order = [...SETUPS].sort((a, b) => setups[a].costPerCup - setups[b].costPerCup);
  const margin = setups[order[1]].costPerCup - setups[order[0]].costPerCup;
  return { u, surge, draws: N, seeds, tol: TOL, setups, verdict: { winner: order[0], runnerUp: order[1], order, margin, tie: margin < TOL } };
}

/* One-variable thresholds: where the runner-up overtakes the winner, every other input held at the scenario.
 * At deck defaults the precomputed data.json values (full draws) are used; otherwise sim.breakEven with
 * simulation.live_draws, as the deck's "Your market" panel does. */
export const THRESHOLD_LEVERS = [
  { lever: "cupsPerDay", label: "Steady volume", unit: "cups/day" },
  { lever: "wage", label: "Wage", unit: "SGD/hour" },
  { lever: "machineMonth", label: "Machine cost", unit: "SGD/unit/month" },
  { lever: "u", label: "Forecast band half-width", unit: "share of base" },
  { lever: "coordHuman", label: "Coordination, all-human", unit: "×" },
  { lever: "coordMixed", label: "Coordination, mixed", unit: "×" },
  { lever: "newShare", label: "New staff share", unit: "share" },
  { lever: "machineMult", label: "Machine station time", unit: "× default" },
];

export function thresholds(ctx, s, a, b) {
  const { Sim, A, D } = ctx, P = paramsFor(ctx, s), u = bandU(ctx, s);
  const live = v(A, "simulation", "live_draws");
  const atDefaults = counterAtDeckDefaults(A, s);
  const now = { u, cupsPerDay: steadyCupsPerDay(s), wage: s.wage, machineMonth: s.machineMonth, coordHuman: s.coordHuman,
                coordMixed: s.coordMixed, newShare: s.newShare, machineMult: 1 };
  return THRESHOLD_LEVERS.map(L => {
    const pre = atDefaults && D.breakEven.find(r => r.lever === L.lever && ((r.a === a && r.b === b) || (r.a === b && r.b === a)));
    const r = pre || Sim.breakEven(P, L.lever, a, b, { u, surge: s.surge, draws: live });
    return { ...L, now: now[L.lever], kind: r.kind, x: r.kind === "value" ? r.x : null, step: !!r.step, range: r.range,
             source: pre ? "precomputed" : "live", draws: pre ? P.draws : live };
  });
}

/* Cost per cup across opening volumes (the deck's volumeCurve grid), at the scenario's other inputs. */
export function volumeCurve(ctx, s) {
  const { Sim, A, D } = ctx;
  if (counterAtDeckDefaults(A, s, { ignoreVolume: true })) return { source: "precomputed", rows: D.volumeCurve };
  const P0 = paramsFor(ctx, s), u = bandU(ctx, s);
  const rows = D.volumeCurve.map(row => {
    const r = Sim.runPoint({ ...P0, cupsYear: row.cupsPerDay * P0.days }, u, s.surge, P0.seed, P0.draws);
    return { cupsPerDay: row.cupsPerDay, ...Object.fromEntries(SETUPS.map(k => [k, { cost: r[k].costPerCup, lostShare: r[k].lostShare }])) };
  });
  return { source: "live", rows };
}

/* ---------------- Predict: with / without the member signal ----------------
 * Same scenario twice, once as entered and once with member data switched off (no-signal band, no member uplift).
 * Staffing is the planned roster from sim.js plan(): sized on the forecast peak x safety margin, before demand is
 * known. It depends on volume, not on band width, so it moves only if a member uplift is set. */
export function staffingPlan(ctx, s) {
  const { Sim } = ctx, P = paramsFor(ctx, s);
  return Object.fromEntries(SETUPS.map(k => {
    const pl = Sim.plan(P, k);
    const hours = k === "all_machine" ? P.attendant * P.hours : pl.rosterPlan.reduce((a, b) => a + b, 0);
    return [k, { peakStaff: k === "all_machine" ? P.attendant : Math.max(...pl.rosterPlan), labourHoursPerDay: hours, machineUnits: pl.machineUnits }];
  }));
}

export function membershipComparison(ctx, s) {
  const run = x => { const pr = predict(ctx, x), pv = provision(ctx, x, pr);
    return { steadyCupsPerDay: pr.steadyCupsPerDay, u: pr.u, low: pr.steady.low / 7, high: pr.steady.high / 7,
             milkLitres: pv.recommended.litres, stockCost: pv.recommended.total, staffing: staffingPlan(ctx, x) }; };
  const without = run({ ...s, memberDataAvailable: false, uOverride: null });
  const withSignal = s.memberDataAvailable ? run({ ...s, uOverride: null }) : null;
  return { with: withSignal, without, active: !!s.memberDataAvailable };
}

/* ---------------- Review: benefit ---------------- */

export function benefit(ctx, s, { pr, prov, ctr, vc }) {
  const { A } = ctx, days = v(A, "store", "open_days_per_year"), cpd = pr.steadyCupsPerDay;
  const out = { days, standard: s.standardSetup, recurring: null, pipeline: null, oneTime: null };
  if (ctr) {
    const sel = s.selectedSetup === "cheapest" ? ctr.verdict.winner : s.selectedSetup;
    const diff = ctr.setups[s.standardSetup].costPerCup - ctr.setups[sel].costPerCup;
    out.recurring = { selected: sel, perCup: diff, perStoreYear: diff * cpd * days, cupsPerDay: cpd,
                      withinTolerance: Math.abs(diff) < ctr.tol, tol: ctr.tol };
  }
  if (vc) {
    // Deck rule (build_deck.py benefit_values): openings spread evenly over [lo, hi]; each curve point stands for
    // the volumes within half a step of it; per opening = (standard - cheapest) cost per cup x cups/day x open days.
    const rows = vc.rows, step = rows[1].cupsPerDay - rows[0].cupsPerDay;
    const V0 = rows[0].cupsPerDay, V1 = rows[rows.length - 1].cupsPerDay;
    const lo = Math.max(V0, Math.min(s.volumeLo, s.volumeHi)), hi = Math.min(V1, Math.max(s.volumeLo, s.volumeHi));
    const best = r => Math.min(...SETUPS.map(k => r[k].cost));
    const frac = r => {
      if (hi <= lo) return Math.abs(r.cupsPerDay - lo) <= step / 2 ? 1 : 0;
      const a = Math.max(lo, r.cupsPerDay - step / 2), b = Math.min(hi, r.cupsPerDay + step / 2);
      return Math.max(0, b - a) / (hi - lo);
    };
    const bars = rows.map(r => {
      const f = frac(r), perOpening = (r[s.standardSetup].cost - best(r)) * r.cupsPerDay * days;
      const cheapest = SETUPS.reduce((x, k) => (r[k].cost < r[x].cost ? k : x));
      return { cupsPerDay: r.cupsPerDay, share: f, openings: s.openingsPerYear * f, perOpening, total: s.openingsPerYear * f * perOpening, cheapest };
    });
    out.pipeline = { source: vc.source, lo, hi, openings: s.openingsPerYear, bars, total: bars.reduce((a, b) => a + b.total, 0) };
  }
  if (prov) {
    out.oneTime = {
      perOpeningVsNaive: prov.naive.total - prov.recommended.total,
      perOpeningSignal: prov.noSignalBest.total - prov.recommended.total,
      openings: s.openingsPerYear,
    };
  }
  return out;
}

/* ---------------- Review: synthetic post-opening example ----------------
 * A fixed, made-up eight-week record for one store. Not model output, not Chagee data. It exists to show
 * what the Review gate compares; users replace it with their own observations. */
export const SYNTHETIC_ACTUALS = {
  label: "Synthetic example: invented for illustration, not observed data",
  weeks: [
    { week: 1, cups: 5710, repeatShare: 0.18, medianServeSec: 205, milkWasteL: 31, lostOrdersPerDay: 41 },
    { week: 2, cups: 5040, repeatShare: 0.27, medianServeSec: 182, milkWasteL: 44, lostOrdersPerDay: 27 },
    { week: 3, cups: 3820, repeatShare: 0.39, medianServeSec: 151, milkWasteL: 96, lostOrdersPerDay: 9 },
    { week: 4, cups: 3610, repeatShare: 0.44, medianServeSec: 146, milkWasteL: 72, lostOrdersPerDay: 7 },
    { week: 5, cups: 3540, repeatShare: 0.47, medianServeSec: 143, milkWasteL: 58, lostOrdersPerDay: 6 },
    { week: 6, cups: 3480, repeatShare: 0.49, medianServeSec: 140, milkWasteL: 51, lostOrdersPerDay: 6 },
    { week: 7, cups: 3590, repeatShare: 0.50, medianServeSec: 144, milkWasteL: 49, lostOrdersPerDay: 7 },
    { week: 8, cups: 3450, repeatShare: 0.51, medianServeSec: 139, milkWasteL: 47, lostOrdersPerDay: 6 },
  ],
  // Inputs a store would measure or confirm after opening (also synthetic here).
  observedInputs: { wage: 15.4, machineMonth: 1908.75, newShare: 0.35, milkWasteCost: 2.55 },
};

/* Summarise post-hype weeks into the inputs the model takes. */
export function summariseActuals(rows, hypeWeeks) {
  const post = rows.filter(r => r.week > hypeWeeks && r.cups > 0);
  if (!post.length) return null;
  const mean = post.reduce((a, r) => a + r.cups, 0) / post.length;
  const sd = Math.sqrt(post.reduce((a, r) => a + (r.cups - mean) ** 2, 0) / Math.max(1, post.length - 1));
  return {
    weeksUsed: post.length,
    steadyCupsPerDay: mean / 7,
    // Spread of weekly volume, expressed as the 80% half-width the model uses (z = 1.2816). A short record
    // understates store-to-store uncertainty, so treat this as a floor, not a calibrated band.
    observedU: (1.2815515655446004 * sd) / mean,
    repeatShare: post.reduce((a, r) => a + r.repeatShare, 0) / post.length,
    medianServeSec: post.reduce((a, r) => a + r.medianServeSec, 0) / post.length,
    milkWasteLPerWeek: post.reduce((a, r) => a + r.milkWasteL, 0) / post.length,
    lostOrdersPerDay: post.reduce((a, r) => a + r.lostOrdersPerDay, 0) / post.length,
  };
}

/* Band to carry forward from observed weeks: never narrower than the strong-signal floor, because a few weeks at
 * one store measure week-to-week noise, not the uncertainty about a store's level. */
export function observedBandPrefill({ A }, observedU) {
  return Math.max(observedU, v(A, "demand", "uncertainty_strong_signal"));
}

/* ---------------- model and validation facts shown beside the recommendation ---------------- */
export function modelFacts({ A, D }) {
  const W = v(A, "validation", "week5_comparison");
  return {
    week5: { tolerancePct: W.tolerance_pct, gaps: D.week5.map(w => w.gapPct), pass: D.week5Pass },
    replicaCapacity: Object.fromEntries(Object.entries(D.storeCap).map(([k, c]) => [k, c.replica / c.nominal])),
    tieTolerance: v(A, "validation", "breakeven").tol_cost_sgd_per_cup,
    draws: v(A, "simulation", "monte_carlo_draws"),
    liveDraws: v(A, "simulation", "live_draws"),
    seed: v(A, "simulation", "base_seed"),
    generated: D.generated,
    fx: A._meta.fx_sgd_per_usd.value,
    currency: A._meta.currency,
    status: A._meta.status,
  };
}
