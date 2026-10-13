# Chagee Expansion Lab

An illustrative, client-side prototype for deciding how a new overseas tea store opens. It uses synthetic data and
illustrative assumptions in SGD, and it is not affiliated with Chagee.

It follows the latest deck (`opim639-chagee-deck`, commit recorded in `src/model/vendor/source.json`). An **Overview**
(the deck's Context slide) frames one new store with no local sales history and separates three layers: the proposed AI
(not built here), what this prototype calculates, and who decides. Four gates then share one scenario:

| Gate | When | Decision |
|---|---|---|
| **1 · Predict** | Before committing the site | Steady demand and its band; market matching; member signal |
| **2 · Provision** | Before the first stock order | Whole-store opening inventory plan (qualitative); fresh-milk worked example (steady and opening-surge orders) |
| **3 · Counter** | Before fit-out | All-human, mixed or all-machine counter |
| **4 · Review** | After opening | Forecast vs actual; updated scenario vs original plan; illustrative avoided cost; Appendix A4 business case |

The secondary sections are a printable **Decision summary** and **Validation questions**, the discussion guide for the
industry conversation with Lee Yen.

## Setup and commands

Requires Node 22.18 or later (the tests use Node's built-in TypeScript type stripping).

```sh
npm install
npm run dev          # http://localhost:3000
npm run build        # production build to dist/
npm run typecheck    # tsc --noEmit
npm test             # focused tests (tests/model.test.ts), Node's built-in runner
npm run validate     # checks the engine reproduces the deck model (scripts/validate.mjs)
npm run sync-model   # re-copy the deck model files from ../../chagee-deck (read-only there)
```

The repository also contains `bun.lock` from its original setup; npm does not read it.

## How it is built

- `src/model/vendor/` holds the deck's `sim.js`, `store.js`, `assumptions.json` and `data.json`, copied unchanged.
  `source.json` records the deck commit they came from.
- `src/model/engine.js` is the only calculation layer. It maps a scenario onto `sim.js` and reads results back.
  The app, the Web Worker (`src/model/worker.ts`, which runs the counter model off the main thread) and the
  tests all import it.
- `src/content/deck.ts` carries the deck's wording (team roles, the "where AI enters" steps, the inventory plan matrix,
  claims not made) so the app and slides say the same thing.
- `src/data/markets.ts` holds synthetic market profiles and the market-pair similarity functions.
  `src/state/scenarioOps.ts` holds the pure scenario operations (change market, reset), and `src/state/scenarios.ts` wraps them with localStorage persistence.
- There is no backend, no authentication, no AI service and no live data. Scenarios are saved only in this browser.

## Model assumptions

**Synthetic inputs** (invented and editable in the app):
- **Market profiles.** Each target and benchmark market has four 0–100 scores. A pair's baseline similarity factor is `100 − 2 × |target − benchmark|`, clamped to 0–100. Each factor measures how alike the two markets are. For competitive density, a gap in either direction lowers the score, so more competition is not treated as better.
  Changing either market reloads that pair's baseline. "Reset to pair baseline" restores the selected pair.
- **Similarity index.** A weighted sum of the factors (30/25/25/20). It is a heuristic for choosing a benchmark, not a probability or accuracy measure, and it changes no model number.
- **Member signal.** Pre-registrations and waitlist counts, with overlap removed, give unique members. Conversion and cups per member give a member-implied demand, shown as a cross-check only.
  Signal strength (0–1) narrows the band along an assumed straight line, from ±50% with no signal to a floor of ±15%. Member uplift (−30% to +30%, default 0) and a tourist add-on (default 0) are the only ways member data or tourists change demand.
  All of these are illustrative assumptions, not validated statistical effects.
- **Post-opening record** in Review: an invented eight-week example, editable.

**Fixed model assumptions** come from the deck's `assumptions.json` and are not editable here. They include open hours,
the hourly demand curve, station times, an 80% band coverage, surge multipliers, 500 Monte Carlo draws (seed 639), a
tie tolerance of S$0.01 a cup, and FX of 1.2725 SGD/USD for costs first approved in USD.

**Calculated outputs:**
- **Demand.** Steady demand is base × (1 + uplift) × (1 + tourist add-on). The 80% band is a constant ±u of each week's base; the model does not widen it over the 12 weeks.
- **Opening milk order.** A newsvendor order covering one delivery horizon (no longer than shelf life). The order sits at the cost-ratio quantile of demand, (shortage cost per litre) ÷ (shortage + waste cost per litre). The buffer above the base follows from that ratio and the band width; there is no separate scenario buffer.
- **Two-week procurement requirement.** Forecast milk for days 1–14 (hype included), bought across staggered deliveries rather than held at opening. Only the first delivery is optimised.
- **Counter.** Cost per cup (labour + machines + lost sales) for each setup, using all inputs together. Inside S$0.01 a cup the result is "Too close to call".
  One-variable thresholds are sensitivities with other inputs held. "No crossover in tested range" is reported rather than invented.
- **Inventory plan.** Forecast cups → product mix → recipes → deliveries, and a qualitative plan for tea, milk and alternatives, other ingredients and packaging. Only fresh milk is quantified.
- **A4 business case.** Five years of modelled benefit (counter saving per store-year × store-years, plus the fresh-milk signal saving per opening) against the approved, illustrative cost of building and running the gates (`business_case` in `assumptions.json`), with the deck's three stress cases. At the defaults it reproduces the deck: payback in year 5, about S$289k ahead.
- **Avoided cost.** Recurring: the gap in cost per cup against a named standard counter (default mixed) × steady cups/day × 360 open days. One-time: the opening-stock benefit, shown separately.

## Limitations

- All inputs are illustrative or synthetic; none are Chagee figures. Costs use a Singapore reference; other markets need local costs converted to SGD.
- Band narrowing with signal, member uplift and conversion are assumptions to back-test, not estimates.
- Tourist and non-app demand is not modelled unless an add-on is entered.
- The staffing model (a pooled bucket brigade) misses its own Week 5 validation (a 4.7–6.8% gap against a ±3% tolerance). Machine breakdowns are not modelled. The default verdict is close (about S$0.02 a cup).
- Within the horizon, milk replenishment is not modelled; deliveries after the first are not optimised.
- Only fresh milk is quantified; tea, other ingredients and packaging have no quantities or savings, and inventory and counter are not optimised together.
- The A4 business case is a payback for the initiative on illustrative costs, not a payback for Chagee or for a store, and contains no sales revenue.
- No store operating break-even and no store investment payback are computed. Either would need target-market rent, wages, prices and margins (not in `assumptions.json`); payback would also need fit-out, equipment and deposits. The earlier prototype's break-even week was removed rather than relabelled.
- Live thresholds away from the defaults use 20 simulated stores and are estimates.
