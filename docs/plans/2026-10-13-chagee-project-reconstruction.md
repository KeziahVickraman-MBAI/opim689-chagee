# Chagee Expansion Lab: reconstructed project plan

**Date:** 13 October 2026  
**Purpose:** Reconstruct how the project reached its current form and provide a plan for completing its classroom explanation and validation.  
**Status:** Retrospective reconstruction from the conversation and current source files, followed by proposed next steps. This is not a claim that every decision below was part of the original plan. No implementation changes are authorized by this document.

## 1. Goal and central argument

Help a new overseas store make opening decisions before local sales history exists: estimate demand, plan inventory, compare counter configurations, and revise the plan after opening.

The presentation should answer:

> What should this store prepare before opening, what evidence supports those choices, and is the decision-support initiative worth building?

The scope is the whole store. The numerical demonstration is narrower: an assumed demand range, one fresh-milk ordering example, and a counter simulation. Tea, other ingredients, and packaging are included in the planning framework but do not yet have quantified order recommendations or savings.

The intended conclusion is a conditional case for a pilot. The prototype does not establish site viability, demonstrate forecasting accuracy, or justify an equipment purchase on its own.

## 2. How we got here

### Stage 1: a cold-start forecasting prototype

The initial app paired a target market with an existing market, displayed a similarity score, generated a 12-week forecast, and added membership signals. It produced inventory, staffing, and break-even outputs using synthetic assumptions.

The first review exposed a gap between the labels and the calculations. Similarity did not depend on the selected benchmark; the payback label excluded startup investment; membership uplift and uncertainty reduction were assumed rather than estimated. Precise-looking numbers could therefore imply more evidence than existed.

**Planning lesson:** distinguish synthetic inputs, assumed relationships, calculated outputs, and empirically validated results.

### Stage 2: a shared model and four decision gates

The app was reorganized into Predict, Provision, Counter, and Review, using a calculation layer derived from the deck model. The earlier break-even output was removed. The new structure connected planning inputs with operational choices and added scenario comparison, model limitations, and a printable summary.

**Planning lesson:** organize around decisions, not separate collections of charts.

### Stage 3: explain the work to a classmate

The audience review found that the charts were easier to follow than the AI contribution. A demand interval alone did not explain what anyone should do. The presentation was reframed around one store without local sales history, with a decision, action, evidence, trade-off, and limitation at each gate.

The proposed AI was separated from the implemented prototype. Class concepts were highlighted with definitions and the decisions they inform, rather than presented as unexplained technical labels.

**Planning lesson:** explain the operational choice before the formula.

### Stage 4: broaden inventory beyond milk

Milk had become the apparent scope of inventory planning, while several slides emphasized bucket brigade. The narrative was broadened to tea leaves, fresh milk and alternatives, other ingredients, and packaging. Milk became one worked example because its perishability makes over-ordering and under-ordering costs visible.

The missing connection was added:

**Forecast cups → product mix → recipes and materials → deliveries and stock.**

**Planning lesson:** explain the full system while being precise about which part has actually been modeled.

### Stage 5: test whether the initiative is worth building

The business case added the cost of developing, integrating, maintaining, and operating the four gates. Benefits were separated into recurring counter savings and one-time fresh-milk opening-stock savings.

The illustrative base case recovers cumulative costs only in Year 5; the documented stress cases fail to recover costs within five years.

**Planning lesson:** gross savings are not the same as net value. The economic question must be part of the conclusion, not just a large benefit headline.

## 3. What the solution is—and what is implemented

**Proposed forecasting capability:** learn from comparable stores and use pre-launch signals as additional evidence or cross-checks, with performance evaluated on past openings. The exact learning method, features, and validation design remain to be selected.

**Implemented prototype:** assumed demand ranges, a fresh-milk inventory calculation, a counter simulation, and scenario comparisons. There is no trained forecasting model or live Chagee data feed.

**Human responsibility:** confirm local assumptions, interpret operational constraints, approve orders, and choose whether to pilot or commit to equipment.

Optimization and simulation are useful parts of the proposed decision-support system. They should not be presented as proof that an AI forecasting model has already been built or validated.

## 4. The four gates

### Predict: choose planning assumptions

**Decision:** What demand should inventory and counter planning assume?

Use comparable-store evidence to establish a base and plausible range. Sign-ups are interest, not purchases; overlapping audiences and conversion must be considered. In the prototype, the relationship between signal strength and range width is assumed.

The range should lead to action: test inventory consequences and counter rankings under plausible demand levels. If an important decision changes across that range, identify which data would reduce the uncertainty before committing.

Do not describe the range as a demonstrated accuracy level. Do not use it alone to approve a site.

### Provision: build the whole inventory plan

**Decision:** What must be available on opening day, what arrives in the first delivery, and what is replenished later?

- Tea leaves: recipe requirements, quality and usable life, supplier lead time, minimum orders, and storage.
- Fresh milk and alternatives: product mix, recipe quantities, chilled storage, expiry, and delivery frequency.
- Other ingredients: item-specific usage, shelf life, and supplier constraints.
- Cups, seals/lids, and packaging: order formats, availability, lead time, minimum orders, and storage.

Ingredient requirements start with forecast quantities by drink multiplied by the amount per recipe. Purchase orders account for usable stock, incoming deliveries, expected losses, and supplier constraints. Replenishment should use inventory position, including incoming stock and outstanding commitments, rather than ignoring orders already placed.

The fresh-milk example applies **newsvendor logic**: balance the cost of leftovers against the cost of running short. It sizes one delivery, not the whole replenishment system. Opening-surge and steady-demand cases must be clearly separated. A fixed milk quantity per cup is a simplifying assumption, not a complete menu recipe model.

### Counter: shortlist a setup for validation

**Decision:** Which configuration deserves a pilot under the store's demand and local costs?

Compare all-human, mixed, and all-machine setups using cost and service outputs together. **Bucket brigade**, **bottleneck**, and **capacity utilization** explain mechanisms; they are not the entire project.

Faster service can coexist with higher cost per cup when equipment is underused. One-variable thresholds identify sensitive assumptions; they are not independent rules to switch equipment when any threshold is crossed.

The staffing approximation misses its stated calibration tolerance, and the default cost gap is small. Keep the recommendation conditional on measured staffing and service performance.

### Review: learn from operations

**Decision:** Does the original plan still hold after observing sales, stockouts, waste, and service performance?

Record observations from opening day, then distinguish opening hype from subsequent demand. Sales are not necessarily unconstrained demand: stockouts, queues, and lost orders can suppress sales.

Compare revised inputs with the actual saved plan. If the tool compares against defaults, label that comparison a reference case. Rerunning the model does not validate its structure.

## 5. Main discussion point: revenue and cost structure

### 5.1 Frame the economic question correctly

> Does the modeled avoided cost cover the cost of building and running the decision-support initiative?

This follows the structure of a revenue-and-cost analysis, but the benefit side is **avoided cost, not sales revenue**. The current model does not estimate incremental beverage revenue. It also does not demonstrate a causal saving from AI.

Do not add a separate lost-sales recovery benefit without reconciling it with the lost-order cost already included in the counter model.

### 5.2 Benefit structure

**Recurring counter benefit:** compare a mixed counter at every opening with choosing the modeled least-cost setup at each store's conditions. The current calculation averages over an assumed distribution of opening volumes.

- Approximately S$2,277 per store-year.
- Approximately S$455k for 200 stores operating for a full year.
- This is a modeled difference against a named comparator, not measured savings against Chagee's actual practice.

**One-time fresh-milk benefit:** compare the expected cost of the best first order with no signal against the best first order under the assumed narrower range.

- Approximately S$370 per opening, or S$74k across 200 openings.
- Applies once per opening, not every year for the same store.
- Depends on signal-driven range narrowing working as assumed.
- No quantified benefit for tea, other ingredients, or packaging.

Use unrounded model outputs for calculations; rounded figures above are for explanation.

### 5.3 Cost structure

Do not equate one-time with fixed and recurring with variable. Timing and cost behavior are different dimensions.

**One-time development and integration costs:**

- Build: 4 people × 6 months × 21 working days × S$1,000 per person-day = S$504k.
- Data integration and setup: S$250k.
- Total: S$754k in Year 1.

**Recurring fixed cost within the assumed scale:**

- Maintenance team: 2 people × 12 months × 21 days × S$1,000 = S$504k per year.
- This does not vary with store count in the current calculation, although scaling could require additional staff in practice.

**Recurring costs linked to activity:**

- Platform and licences: S$50 per active store-month, or S$600 per store-year.
- Review: one analyst day at S$1,000 per new opening; S$200k per year at 200 openings.

These are illustrative project assumptions, not vendor quotes or verified Chagee costs. The source labels them approved on 13 October 2026; that status does not make them empirical estimates.

### 5.4 Cohorts and timing

The model assumes 200 new openings each year and half a trading year for a store in its opening year. Store-years therefore grow from 100 to 300, 500, 700, and 900. Counter benefits and platform costs accumulate across cohorts. Milk opening-stock benefits and review costs apply to each new cohort only.

The S$455k headline describes 200 full store-years. Year 1 recognizes about S$228k of counter benefit because the model assumes half-year operation.

The projection assumes continued operation and persistence of the savings. Explicitly discuss rollout timing, closures, adoption, and whether stores would otherwise adjust their counters without this initiative. Reconcile the six-month build-and-pilot period with when benefits begin; the half-year convention alone does not establish readiness for all openings.

### 5.5 Current results

Recomputed from the current builder and model data for this document:

- Five-year benefit: approximately S$6.063m.
- Five-year cost: S$5.774m.
- Five-year cumulative net benefit: approximately S$289k.
- Annual net benefit, Years 1–5: approximately −S$1.216m, −S$127k, +S$209k, +S$544k, and +S$879k.
- Cumulative recovery occurs in Year 5; positive annual net benefit begins in Year 3.

This is an **undiscounted** projection. It is not a net-present-value result, store investment payback, or evidence that the initiative will deliver these savings.

Sensitivity results after five years:

- One-time costs doubled: approximately S$465k short.
- Counter benefit halved: approximately S$2.558m short.
- Openings reduced to 100 per year: approximately S$1.493m short.

None of those stress cases recovers cumulative costs within five years. The key validation target is the counter saving, because that recurring benefit drives the projection.

### 5.6 Suggested classroom talking point

> “We have not modeled new sales revenue. We compare two avoided costs—counter operating cost and the first milk order—with the cost of building and running the tools. Maintenance is a recurring fixed cost; platform and review costs scale with stores and openings. At our assumptions, cumulative costs are recovered only in Year 5, with about S$289k remaining, and all three stress cases fail to recover costs within five years. That supports a limited pilot to test the savings, not an immediate rollout.”

## 6. Revised assessment and remaining decisions

The narrative is now coherent. The whole-store inventory framework and narrow milk example fit together, and the economic section explains why gross benefit is insufficient.

The current source still needs consistency work:

1. Three counter slides remain on the main path. Combine the mechanism and store-replica explanation, retaining a separate counter decision slide; move extra detail to the appendix.
2. Replace “Install the setup” with a pilot recommendation wherever the model limitation says installation is not yet justified.
3. Qualify the uncertainty finding to the assumed signal range and tested comparison; the wider sensitivity analysis includes a counter crossover.
4. Present fixed sourcing as a modeling boundary, not a verified fact about every overseas store.
5. Interpret sales alongside stockouts and lost orders, including legitimate zero-sales periods.
6. Relabel the deck's default comparison as a reference case unless it preserves earlier planning inputs.
7. Align the React app with the deck's broader scope. The app still centers Provision on milk and frames Predict partly around site commitment.
8. Correct the generated economic explanation's classification of all recurring costs as variable.

## 7. Proposed completion plan

**First: resolve the narrative.** Agree the main-slide order and retain one clear action at each gate. Acceptance: a classmate can distinguish whole-store scope, implemented calculations, and proposed capabilities without narration.

**Second: reconcile recommendations.** Audit visible text, expanded actions, speaker notes, claims, and Q&A for the same qualifications. Acceptance: no installation instruction contradicts a pilot-only conclusion; defaults are not called saved plans.

**Third: validate the business case.** Confirm cost responsibilities, check for overlap between maintenance and review effort, specify rollout dates, and assess whether savings persist across cohorts. Acceptance: every line has a unit, timing, comparator, and assumption; no unmeasured benefits are added.

**Fourth: collect pilot evidence.** Obtain menu mix, recipes, supplier lead times, usable lives, staffing, machine quotes, and observed service data. Back-test forecasts on held-out openings and compare stock and counter outcomes with a defined baseline. Set success criteria before observing pilot results.

**Fifth: synchronize and verify artifacts.** Update the app wording after the narrative is settled. Rebuild the deck from its source, check interactions and static print output, and rehearse the speaking path. Passing rendering or parity checks is not model validation.

## 8. Source and artifact map

- [Deck builder](/Users/keziah/Desktop/chagee-deck/deck/build_deck.py): narrative, gates, slide order, generated claims, and business-case calculations.
- Deck interactions: `/Users/keziah/Desktop/chagee-deck/deck/deck.js`.
- Assumptions: `/Users/keziah/Desktop/chagee-deck/assumptions.json`.
- Model outputs: `/Users/keziah/Desktop/chagee-deck/deck/build/data.json`.
- Generated business explanation: `/Users/keziah/Desktop/chagee-deck/deck/revenue_cost.md`; change its builder rather than editing the generated file.
- Generated claim ledger: `/Users/keziah/Desktop/chagee-deck/deck/claims.md`.
- App calculations and gate sections: `src/model/engine.js` and `src/sections/` in the app repository.

This document reports the current model and the review history. External company claims and course-topic attributions were not independently reverified for this reconstruction. Model values and proposed next steps should not be confused with observed Chagee results.
