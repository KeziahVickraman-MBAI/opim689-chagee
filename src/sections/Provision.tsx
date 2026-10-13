import React, { useMemo } from 'react';
import { A, ctx } from '../model/ctx';
import { inputMeta, provision } from '../model/engine.js';
import { INVENTORY_CHAIN, INVENTORY_COLS, INVENTORY_MATRIX, INVENTORY_NOTE } from '../content/deck';
import type { ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import { Card, DecisionFrame, Explain, Flag, Segmented, Slider, Stat, int, pct, num, sgd, sgd0, INK, GOLD, MUTED, COMPONENT_COLOR } from '../ui/kit';
import { CostCurveChart, Legend } from '../ui/charts';

const META = inputMeta(A);

export const Provision: React.FC<{ store: ScenarioStore; an: Analysis }> = ({ store, an }) => {
  const { active: sc, setInput } = store;
  const i = sc.inputs, p = an.prov, pr = an.pr;
  const rec = p.recommended;
  const horizonCups = p.daily * p.horizon;
  // Both sizings shown together, as on the deck: steady demand, and the opening surge this first delivery falls inside.
  const steady = useMemo(() => provision(ctx, { ...i, provisionBasis: 'steady' }, pr), [i, pr]);
  const surge = useMemo(() => provision(ctx, { ...i, provisionBasis: 'opening' }, pr), [i, pr]);
  const inSurge = pr.hypeWeeks * 7 >= p.horizon;
  const shortShare = 1 - p.criticalRatio, topDays = p.horizon * (1 + pr.u);

  return (
    <div className="space-y-6">
      <DecisionFrame
        gate="Gate 2 · Provision" when="Before the first stock order" roles={['supply', 'entry']}
        decision="What must be on hand on opening day, what should the first delivery bring, and what is replenished later?"
        evidence={[['Quantified here', 'fresh milk only'], ['Needs Chagee data', 'menu mix · recipes · lead times · minimum orders']]}
        action="Build the opening list item by item from the demand range: tea, milk and alternatives, other ingredients, cups, lids and packaging. Size fresh milk with the worked example below."
        tradeoff="Too little of any one item stops sales. Too much ties up cash and storage, and perishables expire or lose quality."
        limitation="No quantities for tea, other ingredients or packaging: their inputs are not in the sources. Inventory and counter are not optimised together."
        actions={[
          ['supply', 'Collect recipes, the expected menu mix, and each supplier’s lead time and minimum order for the market.'],
          ['supply', 'Draft the opening list: requirement = forecast drinks × amount per drink, net of stock on hand and deliveries already due.'],
          ['entry', 'Send any change to the demand range, including expected opening hype; supply chain recomputes the list.'],
          ['ops', 'Count stock at opening and log stockouts of every item for Review.'],
        ]}
        calc={[
          'Ingredient requirement = forecast drink quantities × ingredient amount per drink.',
          'Purchase order = requirement over the cover period − usable stock − deliveries already due + expected losses, rounded to the supplier’s minimum and delivery days.',
          'Reorder point: reorder when stock falls to the usage expected during the lead time, plus safety stock for demand above that. Explained here; not implemented in the prototype.',
          'Implemented in the prototype: the first fresh-milk delivery only (worked example below).',
        ]}
      />

      <Card kicker="Provision · whole store" title="From forecast to purchase order">
        <ol className="grid gap-2 sm:grid-cols-4">
          {INVENTORY_CHAIN.map(([t, d], k) => (
            <li key={t} className="rounded-xl bg-[#FBF8F1] border border-[#ECE5D3] p-3">
              <div className="text-[11px] font-bold text-[#8A6715]">{k + 1}</div>
              <div className="text-sm font-bold text-[#0A2146]">{t}</div>
              <p className="text-xs text-[#3E5375] mt-1">{d}</p>
            </li>
          ))}
        </ol>
        <h4 className="mt-5 mb-2 text-sm font-bold text-[#0A2146]">Opening plan by category: qualitative, no quantities</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <caption className="sr-only">Opening inventory plan by category</caption>
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-[#6B7C99] border-b border-[#ECE5D3]">
              {INVENTORY_COLS.map(c => <th key={c} scope="col" className="py-1.5 pr-3 align-bottom">{c}</th>)}
            </tr></thead>
            <tbody>
              {INVENTORY_MATRIX.map(r => (
                <tr key={r[0]} className="border-b border-[#F3EEE2] align-top">
                  {r.map((c, k) => k ? <td key={k} className="py-1.5 pr-3 text-[#2D496E]">{c}</td> : <th key={k} scope="row" className="py-1.5 pr-3 text-left font-semibold text-[#0A2146]">{c}</th>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#5B6E8C] mt-2">{INVENTORY_NOTE}</p>
        <Flag tone="info" className="mt-3">
          <b>Materials and capacity.</b> A forecast becomes sales only if the store has both. Enough milk is not enough if tea or cups run out, and enough ingredients
          are not enough if the counter cannot serve customers. Both use the Predict range; the prototype does not optimise them together.
        </Flag>
      </Card>

      <div className="pt-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">Provision · worked example</div>
        <h2 className="font-display text-xl font-bold text-[#0A2146]">Worked example: choosing the first fresh-milk delivery</h2>
        <p className="text-sm text-[#2D496E] mt-1">The whole-store plan includes many materials. Fresh milk demonstrates the ordering trade-off because unused stock can expire quickly.
          Simplification: every cup uses {num(i.milkPerCup, 2)} L; real recipes differ.</p>
      </div>

      <DecisionFrame
        gate="Gate 2 · Provision · fresh milk" when="Before the first stock order" roles={['supply', 'entry']}
        decision="How much fresh milk should the first delivery bring?"
        evidence={[
          ['Short vs waste, per L', `${sgd(p.shortCostPerLitre)} vs ${sgd(p.wasteCost)}`],
          ['Order covers', `${pct(p.criticalRatio)} of outcomes`],
          ['Expected waste', `${int(steady.recommended.wasteLitres)} L`],
          ['Expected shortage', `${int(steady.recommended.shortCups)} cups`],
        ]}
        action={<>Steady demand: about <b className="text-white">{int(steady.recommended.litres)} L</b> for the first {steady.horizon} days.
          {inSurge ? <> If the expected opening surge is real, about <b className="text-white">{int(surge.recommended.litres)} L</b>: this delivery falls inside it.</> : ''}</>}
        tradeoff={`Order less: more missed cups at ${sgd(p.stockoutCost)} each. Order more: more milk thrown away at ${sgd(p.wasteCost)} a litre. A shortage costs more, so the order sits above base demand.`}
        limitation={`Sizes one delivery of one item; it does not optimise the whole inventory. Still runs short in about ${pct(shortShare)} of outcomes. Generic milk costs, one amount per cup.`}
        actions={[
          ['entry', 'Say whether the opening surge is expected; size the first delivery on it if so.'],
          ['supply', 'Place the first delivery at the suggested order, not at the base forecast or the top of the range.'],
          ['ops', 'From the second delivery on, order on actual sales; log waste and shortages for Review.'],
        ]}
        calc={[
          `Newsvendor logic: order up to the point where the chance of running short equals waste cost ÷ (shortage + waste cost) per litre = ${sgd(p.wasteCost)} ÷ (${sgd(p.shortCostPerLitre)} + ${sgd(p.wasteCost)}), so the order covers about ${pct(p.criticalRatio)} of outcomes.`,
          `Shortage cost per litre = ${sgd(p.stockoutCost)} per missed cup ÷ ${num(p.milkPerCup, 2)} L per cup, the same for every drink (a simplification).`,
          `The best order is ${num(steady.recommended.days, 1)} days of the demand it is sized on, just above the top of the ${pct(pr.coverage)} range (${num(topDays, 1)} days), because a shortage costs far more than waste.`,
          `Surge: opening demand is assumed ×${num(pr.hypeMultiplier, 2)} steady demand for ${pr.hypeWeeks} weeks${inSurge ? `, longer than this ${p.horizon}-day delivery, so the same calculation on surge demand gives the larger order` : ''}.`,
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card kicker="Opening fresh-milk order" title="Expected cost by order size">
          <CostCurveChart curve={p.curve} marks={[
            { litres: rec.litres, total: rec.total, label: `Recommended ${int(rec.litres)} L`, color: '#0B6B60' },
            { litres: p.naive.litres, total: p.naive.total, label: `Base forecast ${int(p.naive.litres)} L`, color: MUTED },
            ...(Math.abs(p.planned.litres - p.naive.litres) > 1 ? [{ litres: p.planned.litres, total: p.planned.total, label: `Your plan ${int(p.planned.litres)} L`, color: GOLD }] : []),
          ]} />
          <Legend items={[
            { label: 'Total expected cost', color: INK },
            { label: 'Expected waste cost', color: COMPONENT_COLOR.labour, dash: '6 4' },
            { label: 'Expected shortage cost', color: COMPONENT_COLOR.lost, dash: '2 3' },
          ]} />
          <p className="mt-3 text-sm text-[#2D496E] bg-[#FBF8F1] border border-[#ECE5D3] rounded-lg p-3">
            <b>The rule:</b> keep ordering milk until the expected waste cost of one more litre equals the shortage cost it avoids.
            A litre short loses {sgd(p.shortCostPerLitre)} of sales ({sgd(p.stockoutCost)} a cup ÷ {num(p.milkPerCup, 2)} L a cup); a spare litre wastes {sgd(p.wasteCost)}.
            So order up to the {pct(p.criticalRatio)} point of demand, above the base forecast.
          </p>
          <p className="mt-2 text-xs text-[#3E5375]">
            <b>Where the buffer comes from.</b> The order sits {int(p.buffer.litres)} L ({pct(p.buffer.shareOfBase)}) above the base forecast for the horizon.
            The cost ratio decides <i>where</i> in the band to order (the {pct(p.criticalRatio)} point); the forecast uncertainty (±{pct(pr.u, 1)}) decides
            how many litres that point is above the base. There is no separate scenario buffer: a wider band raises the buffer, a cheaper shortage lowers it.
            Expected shortage is not zero: about {int(rec.shortCups)} cups are still expected to be missed at this order.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#0A2146]">Size the order on:</span>
            <Segmented label="Demand basis for the order" value={i.provisionBasis} onChange={v => setInput('provisionBasis', v)}
              options={[{ v: 'steady', t: 'Steady demand (deck default)' }, { v: 'opening', t: `Opening weeks (×${num(pr.hypeMultiplier, 2)} hype)` }]} />
            <span className="text-xs text-[#5B6E8C]">{int(p.daily)} cups/day × {p.horizon} days = {int(horizonCups)} cups at the base.</span>
          </div>
          {p.flags.map((f: string) => <Flag key={f} className="mt-2">{f}</Flag>)}
        </Card>

        <div className="space-y-4 min-w-0">
          <Card kicker="Recommendation" title={`${int(rec.litres)} L of fresh milk`}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Stat strong={p.basis === 'steady'} label="Steady demand" value={`${int(steady.recommended.litres)} L`} sub={`expected cost ${sgd0(steady.recommended.total)}`} />
              <Stat strong={p.basis === 'opening'} label="Opening surge" value={`${int(surge.recommended.litres)} L`} sub={`×${num(pr.hypeMultiplier, 2)} demand · ${sgd0(surge.recommended.total)}`} />
            </div>
            <p className="text-[11px] text-[#5B6E8C] mb-2">Figures below and the chart: {p.basis === 'steady' ? 'steady demand' : 'opening surge'} (switch with “Size the order on”).</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat strong label="Total expected cost" value={sgd0(rec.total)} sub="waste + shortage, SGD" />
              <Stat label="vs ordering the base" value={sgd0(p.naive.total - rec.total)} sub={`saved; base order costs ${sgd0(p.naive.total)}`} />
              <Stat label="Expected waste" value={sgd0(rec.waste)} sub={`about ${int(rec.wasteLitres)} L expire`} />
              <Stat label="Expected shortage" value={sgd0(rec.shortage)} sub={`about ${int(rec.shortCups)} cups missed`} />
            </div>
            {Math.abs(p.planned.litres - p.naive.litres) > 1 && (
              <p className="text-xs text-[#5B6E8C] mt-2">Your planned {int(p.planned.litres)} L: expected cost {sgd0(p.planned.total)} ({sgd0(p.planned.waste)} waste, {sgd0(p.planned.shortage)} shortage).</p>
            )}
            <p className="text-xs text-[#5B6E8C] mt-2">With no pre-launch signal (±{pct(pr.uNone)}) the best order would cost {sgd0(p.noSignalBest.total)}: a narrower band lowers the cost of even the best order.</p>
            <p className="text-xs text-[#5B6E8C] mt-1">
              {p.milkTrigger.kind === 'value'
                ? `Order at or below the base forecast only if waste costs over ${sgd(p.milkTrigger.value)} a litre.`
                : `Ordering above the base holds across the tested waste-cost range (${sgd(p.milkTrigger.range[0])}–${sgd(p.milkTrigger.range[1])}/L); the flip point, ${sgd(p.milkTrigger.value)}/L, is outside it.`}
            </p>
          </Card>

          <Card kicker="Inputs" title="Milk and costs">
            <div className="space-y-3">
              <Slider meta={META.milkPerCup} value={i.milkPerCup} onChange={x => setInput('milkPerCup', x)} />
              <Slider meta={META.milkShelfLife} value={i.milkShelfLife} onChange={x => setInput('milkShelfLife', x)} />
              <Slider meta={{ ...META.stockHorizonDays, range: [1, Math.max(i.milkShelfLife, i.stockHorizonDays)] }}
                value={i.stockHorizonDays} onChange={x => setInput('stockHorizonDays', x)}
                hint={i.stockHorizonDays > i.milkShelfLife ? 'Beyond shelf life: capped (see flag).' : undefined} />
              <Slider meta={META.milkWasteCost} value={i.milkWasteCost} onChange={x => setInput('milkWasteCost', x)} format={x => sgd(x)} />
              <Slider meta={META.stockoutCost} value={i.stockoutCost} onChange={x => setInput('stockoutCost', x)} format={x => sgd(x)} />
              <Slider meta={META.plannedOrderDays} value={i.plannedOrderDays} onChange={x => setInput('plannedOrderDays', x)} />
            </div>
          </Card>
        </div>
      </div>

      <Card kicker="Planning figure, not an order" title="Two-Week Procurement Requirement: fresh milk">
        <div className="grid gap-2 sm:grid-cols-4">
          <Stat strong label="Base, first 14 days" value={`${int(p.twoWeek.baseLitres)} L`} sub={`forecast incl. ${pr.hypeWeeks}-week hype × ${num(p.milkPerCup, 2)} L/cup`} />
          <Stat label={`${pct(pr.coverage)} band`} value={`${int(p.twoWeek.lowLitres)}–${int(p.twoWeek.highLitres)} L`} sub={`±${pct(pr.u, 1)} of the base`} />
          <Stat label="Deliveries" value={`${p.twoWeek.deliveries} × every ${p.horizon} days`} sub={`horizon ${p.horizon} d, shelf life ${i.milkShelfLife} d`} />
          <Stat label="First delivery" value={`${int(rec.litres)} L`} sub="the recommended opening order above" />
        </div>
        <p className="text-sm text-[#2D496E] mt-3">
          Fresh dairy is bought across staggered deliveries, not held at opening: milk keeps about {i.milkShelfLife} days, so holding two weeks' supply at once would expire.
          Only the first delivery is optimised here; from the second delivery on, order on actual sales and log waste and shortages for Review.
          {p.basis === 'steady' && pr.hypeWeeks > 0 ? ' This total includes the opening hype, while the first order above is sized on steady demand (switch the basis to compare).' : ''}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card kicker="Not quantified here" title="Tea, other ingredients and packaging">
          <p className="text-sm text-[#2D496E]">These are planned qualitatively in the table above. Tea keeps longer than milk but still has lead times, minimum orders and quality
            that fades, so it is not risk-free. Packaging is easy to forget: no cup or seal, no sale.</p>
          <Flag tone="info" className="mt-3">Missing data: recipes, menu mix, lead times, shelf lives and minimum orders are not in the sources, so the prototype shows no quantities and no savings for these items.</Flag>
        </Card>
        <Explain title="Method (sim.js provision): newsvendor on fresh milk">
          <p>Demand over the horizon is drawn 500 times from the band: litres = horizon × cups/day × m × L/cup, with m = max(0, 1 + u·z/1.2816).</p>
          <p>For any order q: expected waste = mean of max(0, q − demand) × waste cost per litre; expected shortage = mean of max(0, demand − q) ÷ L/cup × shortage cost per cup.</p>
          <p>The recommended q is the critical-ratio quantile of demand: ratio = (shortage cost per litre) ÷ (shortage cost per litre + waste cost per litre) = {pct(p.criticalRatio, 1)}.</p>
          <p>Horizon: the deck's order covers one shelf life. A shorter horizon (days until the next delivery) counts milk left at the next delivery as waste;
            a longer one is capped, because carrying stock past expiry or modelling replenishment is outside the model.</p>
        </Explain>
      </div>
    </div>
  );
};
