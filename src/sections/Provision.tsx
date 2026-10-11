import React from 'react';
import { A } from '../model/ctx';
import { inputMeta } from '../model/engine.js';
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

  return (
    <div className="space-y-6">
      <DecisionFrame
        gate="Gate 2 · Provision" when="Before the first stock order" who="Supply chain / planning, from the market-entry team's band"
        decision="How much fresh milk does the store open with?"
        inputs={<>Demand band from Predict (±{pct(pr.u, 1)}), milk per cup, shelf life, stock horizon, waste cost and shortage cost.</>}
        suggests={<>Order <b className="text-white">{int(rec.litres)} L</b> of fresh milk for {p.horizon} days, about {num(rec.days, 1)} days of {p.basis === 'steady' ? 'steady' : 'opening'} demand.
          Expected cost {sgd0(rec.total)} (waste {sgd0(rec.waste)} + shortage {sgd0(rec.shortage)}).</>}
        checks={[
          'Milk costs and recipe are generic, not Chagee figures.',
          `Horizon is capped at the ${i.milkShelfLife}-day shelf life; replenishment is not modelled.`,
          'Default sizes on steady demand; the opening weeks run hotter.',
          'Order tea and packaging separately (shelf-stable, not optimised here).',
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
          <Stat label="80% band" value={`${int(p.twoWeek.lowLitres)}–${int(p.twoWeek.highLitres)} L`} sub={`±${pct(pr.u, 1)} of the base`} />
          <Stat label="Deliveries" value={`${p.twoWeek.deliveries} × every ${p.horizon} days`} sub={`horizon ${p.horizon} d, shelf life ${i.milkShelfLife} d`} />
          <Stat label="First delivery" value={`${int(rec.litres)} L`} sub="the recommended opening order above" />
        </div>
        <p className="text-sm text-[#2D496E] mt-3">
          Fresh dairy is bought across staggered deliveries, not held at opening: milk keeps about {i.milkShelfLife} days, so holding two weeks' supply at once would expire.
          Only the first delivery is optimised here; size each later delivery on the sales seen so far.
          {p.basis === 'steady' && pr.hypeWeeks > 0 ? ' This total includes the opening hype, while the first order above is sized on steady demand (switch the basis to compare).' : ''}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card kicker="Kept separate from dairy" title="Shelf-stable tea and packaging">
          <p className="text-sm text-[#2D496E]">Tea leaves, cups, seals and straws keep for months, so expiry risk is low and the milk calculation does not apply.
            A simple cover is the high end of the band for the first order cycle:</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Stat label="Cups to cover, 4 weeks" value={int(pr.weeks.slice(0, 4).reduce((a, w) => a + w.high, 0))} sub="sum of weekly high, hype included" />
            <Stat label="Cups to cover, 2 weeks" value={int(pr.weeks.slice(0, 2).reduce((a, w) => a + w.high, 0))} sub="if resupply is fortnightly" />
          </div>
          <Flag tone="info" className="mt-3">Missing data: grams of tea and packaging units per cup are not in assumptions.json, so this prototype gives cups to cover, not kilograms or units.</Flag>
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
