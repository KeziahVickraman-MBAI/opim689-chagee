import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Copy } from 'lucide-react';
import { A } from '../model/ctx';
import { inputMeta, observedBandPrefill, summariseActuals, SYNTHETIC_ACTUALS, SETUP_LABEL, SETUPS } from '../model/engine.js';
import type { ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import type { ObservedWeek } from '../types';
import type { SetupKey } from '../model/engine.js';
import { Card, DecisionFrame, Explain, Flag, NumberField, Slider, Stale, StatusBadge, Stat, int, pct, num, sgd, sgd0, sgdK, secToMin } from '../ui/kit';
import { ForecastChart, PipelineChart } from '../ui/charts';

const META = inputMeta(A);
const CELL_LABEL: Record<string, string> = { cups: 'cups sold that week', repeatShare: 'repeat-customer share, percent', medianServeSec: 'median time to serve, seconds',
  milkWasteL: 'milk wasted, litres', lostOrdersPerDay: 'lost orders per day' };
const U_STRONG = A.demand.uncertainty_strong_signal.value;

export const Review: React.FC<{ store: ScenarioStore; an: Analysis }> = ({ store, an }) => {
  const { active: sc, setInput, update } = store;
  const i = sc.inputs, pr = an.pr, prov = an.prov, c = an.counter.data;
  const bn = an.benefit.data, bs = an.benefit.status;
  const obs = useMemo(() => summariseActuals(sc.actuals, i.hypeWeeks), [sc.actuals, i.hypeWeeks]);
  const used = c ? (i.selectedSetup === 'cheapest' ? c.verdict.winner : i.selectedSetup) : null;

  // Observed inputs to apply: prefilled from the record, editable before rerunning.
  const prefill = () => ({
    steady: obs ? Math.round(obs.steadyCupsPerDay) : Math.round(pr.steadyCupsPerDay),
    u: obs ? +observedBandPrefill({ A }, obs.observedU).toFixed(3) : pr.u,
    ...SYNTHETIC_ACTUALS.observedInputs,
  });
  const [form, setForm] = useState(prefill);
  useEffect(() => setForm(prefill()), [obs?.steadyCupsPerDay, obs?.observedU]); // eslint-disable-line react-hooks/exhaustive-deps

  const editCell = (week: number, k: keyof ObservedWeek, v: number) =>
    update(s => ({ actuals: s.actuals.map(r => (r.week === week ? { ...r, [k]: v } : r)), actualsSynthetic: false }));

  const applyObserved = () => store.duplicate(`${sc.name.replace(/ · observed$/, '')} · observed`, {
    origin: 'observed',
    inputs: {
      ...i,
      baseCupsPerDay: form.steady, memberUpliftPct: 0, touristUpliftPct: 0, uOverride: form.u, removeHype: true,
      wage: form.wage, machineMonth: form.machineMonth, newShare: form.newShare, milkWasteCost: form.milkWasteCost,
    },
  });

  // Model expectations for the comparison row.
  const modelServe = c && used ? c.setups[used].serve.median : null;
  const modelLostDay = c && used ? c.setups[used].lostShare * pr.steadyCupsPerDay : null;
  const modelWasteWeek = prov.recommended.wasteLitres * 7 / prov.horizon;

  return (
    <div className="space-y-6">
      <DecisionFrame
        gate="Gate 4 · Review" when="After opening" who="Operations, market-entry leads"
        decision="Was the forecast right, and should the counter or stock policy change now that steady demand is known?"
        inputs={<>Observed weekly cups, repeat share, service times, milk waste and lost orders (synthetic here); the same model, rerun on observed inputs.</>}
        status={an.counter.status}
        suggests={obs ? <>Steady demand observed at <b className="text-white">{int(obs.steadyCupsPerDay)} cups/day</b> vs {int(pr.steadyCupsPerDay)} forecast
          ({obs.steadyCupsPerDay >= pr.steady.low / 7 && obs.steadyCupsPerDay <= pr.steady.high / 7 ? 'inside' : 'outside'} the band). Rerun the counter on it before adding machines.</> : 'Enter post-hype weeks to compare.'}
        checks={[
          'Use post-hype weeks only; opening crowds are not steady demand.',
          'A few weeks of one store understate uncertainty; keep a floor on the band.',
          'Observed service times test the staffing approximation; large gaps mean recalibrate.',
          'There is no live data connection; values are entered by hand.',
        ]}
      />

      <Card kicker="Forecast versus actual" title="First eight weeks after opening"
        right={<div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${sc.actualsSynthetic ? 'bg-[#FDF5E1] text-[#7A5A0E] border border-[#EAD8AC]' : 'bg-[#EEF4FD] text-[#2D496E] border border-[#CADCF5]'}`}>
            {sc.actualsSynthetic ? 'Synthetic example' : 'Edited by user · not live data'}
          </span>
          <button onClick={() => update({ actuals: SYNTHETIC_ACTUALS.weeks.map(w => ({ ...w })), actualsSynthetic: true })}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0047BA] hover:underline"><RotateCcw className="w-3.5 h-3.5" />Restore example</button>
        </div>}>
        {sc.actualsSynthetic && <Flag className="mb-3">{SYNTHETIC_ACTUALS.label}. Edit any cell to enter your own observations.</Flag>}
        <ForecastChart weeks={pr.weeks.slice(0, 8)} perDay={false} coverage={pr.coverage} u={pr.u} actuals={sc.actuals}
          bandNote={`Forecast from scenario “${sc.name}”, compared with ${sc.actualsSynthetic ? 'synthetic' : 'entered'} weekly cups`} />
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-[#6B7C99] border-b border-[#ECE5D3]">
              <th className="py-1 pr-2">Week</th><th className="pr-2">Cups/week</th><th className="pr-2">Forecast base (band)</th><th className="pr-2">Repeat share</th>
              <th className="pr-2">Median serve (s)</th><th className="pr-2">Milk waste (L)</th><th>Lost orders/day</th>
            </tr></thead>
            <tbody>
              {sc.actuals.map(r => {
                const f = pr.weeks[r.week - 1], inside = f && r.cups >= f.low && r.cups <= f.high;
                const cell = (k: keyof ObservedWeek, step: number, scale = 1) => (
                  <input type="number" aria-label={`Week ${r.week}: ${CELL_LABEL[k]}`} value={+(r[k] * scale).toFixed(2)} step={step} min={0}
                    onChange={e => { const x = parseFloat(e.target.value); if (Number.isFinite(x)) editCell(r.week, k, x / scale); }}
                    className="w-20 rounded border border-[#E3DCC8] px-1.5 py-0.5 tabular-nums bg-white" />
                );
                return (
                  <tr key={r.week} className="border-b border-[#F3EEE2]">
                    <td className="py-1 pr-2 font-semibold">W{r.week}{r.week <= i.hypeWeeks && <span className="text-[#7A5A0E]"> hype</span>}</td>
                    <td className="pr-2">{cell('cups', 10)}</td>
                    <td className={`pr-2 tabular-nums ${f ? (inside ? 'text-[#0B6B60]' : 'text-[#9B2C1F]') : ''}`}>{f ? `${int(f.base)} (${int(f.low)}–${int(f.high)}) ${inside ? '✓ inside' : '✗ outside'}` : '—'}</td>
                    <td className="pr-2">{cell('repeatShare', 1, 100)}<span className="text-[#6B7C99]"> %</span></td>
                    <td className="pr-2">{cell('medianServeSec', 1)}</td>
                    <td className="pr-2">{cell('milkWasteL', 1)}</td>
                    <td>{cell('lostOrdersPerDay', 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {obs && (
        <Card kicker="Observed vs model" title={`Post-hype weeks (${obs.weeksUsed} used)`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Steady demand" value={`${int(obs.steadyCupsPerDay)} cups/day`} sub={`forecast ${int(pr.steadyCupsPerDay)} (${pct(obs.steadyCupsPerDay / pr.steadyCupsPerDay - 1)} difference)`} />
            <Stat label="Repeat share" value={pct(obs.repeatShare)} sub="the proxy the forecast lacked before opening" />
            <Stat label="Median time to serve" value={secToMin(obs.medianServeSec)} sub={modelServe ? `model ${secToMin(modelServe)} (${SETUP_LABEL[used!]}, ${i.surge} surge, peak hour)` : 'model computing'} />
            <Stat label="Milk waste" value={`${int(obs.milkWasteLPerWeek)} L/week`} sub={`model expects about ${int(modelWasteWeek)} L/week at the recommended order`} />
            <Stat label="Lost orders" value={`${num(obs.lostOrdersPerDay, 1)}/day`} sub={modelLostDay != null ? `model ${num(modelLostDay, 1)}/day (queue balking only)` : 'model computing'} />
          </div>
          <div className="mt-4 rounded-xl border border-[#ECE5D3] bg-[#FBF8F1] p-4">
            <h4 className="text-sm font-bold text-[#0A2146]">Update the scenario with observed inputs and rerun the same model</h4>
            <p className="text-xs text-[#5B6E8C] mb-3">Creates a copy named "… · observed" so the pre-opening scenario stays for comparison. Member uplift and tourist add-on are reset, because the observed volume already includes them.</p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <NumberField label="Steady demand" unit="cups/day" value={form.steady} min={1} onChange={x => setForm(f => ({ ...f, steady: x }))} />
              <NumberField label="Band half-width" unit="share" value={form.u} step={0.01} min={0} max={0.6} onChange={x => setForm(f => ({ ...f, u: x }))} />
              <NumberField label="Wage" unit="SGD/h" value={form.wage} step={0.01} min={0} onChange={x => setForm(f => ({ ...f, wage: x }))} />
              <NumberField label="Machine cost" unit="SGD/unit/month" value={form.machineMonth} step={1} min={0} onChange={x => setForm(f => ({ ...f, machineMonth: x }))} />
              <NumberField label="New staff share" unit="share" value={form.newShare} step={0.05} min={0} max={1} onChange={x => setForm(f => ({ ...f, newShare: x }))} />
              <NumberField label="Milk waste cost" unit="SGD/L" value={form.milkWasteCost} step={0.01} min={0} onChange={x => setForm(f => ({ ...f, milkWasteCost: x }))} />
            </div>
            {obs && <p className="text-[11px] text-[#5B6E8C] mt-2">Observed week-to-week spread is ±{pct(obs.observedU, 1)} (80% half-width). The band is pre-filled at no less than the strong-signal width (±{pct(U_STRONG)}), because a few weeks at one store understate uncertainty.</p>}
            <button onClick={applyObserved} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#0A2558] text-white hover:bg-[#13357A]">
              <Copy className="w-4 h-4" />Rerun as “{sc.name.replace(/ · observed$/, '')} · observed”
            </button>
          </div>
        </Card>
      )}

      {/* ---------------- benefit ---------------- */}
      <Card kicker="Benefit" title="Illustrative avoided cost" right={<StatusBadge status={bs} />}>
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <label className="text-xs font-semibold text-[#0A2146]">Standard counter (comparator)
            <select value={i.standardSetup} onChange={e => setInput('standardSetup', e.target.value as SetupKey)} className="mt-1 w-full rounded-lg border border-[#D9D1BC] bg-white px-2 py-1.5 text-sm font-normal">
              {SETUPS.map(k => <option key={k} value={k}>{SETUP_LABEL[k]}{k === 'mixed' ? ' (modelled as Chagee’s semi-automated counter)' : ''}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#0A2146]">Selected strategy for this store
            <select value={i.selectedSetup} onChange={e => setInput('selectedSetup', e.target.value as SetupKey | 'cheapest')} className="mt-1 w-full rounded-lg border border-[#D9D1BC] bg-white px-2 py-1.5 text-sm font-normal">
              <option value="cheapest">Cheapest at current inputs{c ? ` (${SETUP_LABEL[c.verdict.winner]})` : ''}</option>
              {SETUPS.map(k => <option key={k} value={k}>{SETUP_LABEL[k]}</option>)}
            </select>
          </label>
        </div>

        <Stale status={bs}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-[#E3DCC8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">Recurring · this store · per year</div>
              {bn.recurring && c ? <>
                <div className="text-2xl font-bold text-[#0A2146] mt-1">{bn.recurring.withinTolerance ? 'Within tie tolerance' : sgd0(bn.recurring.perStoreYear)}</div>
                <p className="text-xs text-[#3E5375] mt-1">
                  {SETUP_LABEL[bn.standard]} {sgd(c.setups[bn.standard].costPerCup, 3)} − {SETUP_LABEL[bn.recurring.selected]} {sgd(c.setups[bn.recurring.selected].costPerCup, 3)} = {sgd(bn.recurring.perCup, 3)} a cup
                  × {int(bn.recurring.cupsPerDay)} cups/day × {bn.days} open days.
                </p>
                {bn.recurring.withinTolerance && <p className="text-xs text-[#7A5A0E] mt-1">The gap is under {sgd(bn.recurring.tol)} a cup: not distinguishable from zero in this model.</p>}
                {bn.recurring.perCup < -1e-9 && <p className="text-xs text-[#9B2C1F] mt-1">Negative: the selected counter costs more than the standard at these inputs.</p>}
              </> : <p className="text-sm text-[#5B6E8C] mt-1">Waiting for the cost model.</p>}
            </div>
            <div className="rounded-xl border border-[#E3DCC8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">Recurring · opening pipeline · per year</div>
              {bn.pipeline ? <>
                <div className="text-2xl font-bold text-[#0A2146] mt-1">{sgdK(bn.pipeline.total)}</div>
                <p className="text-xs text-[#3E5375] mt-1">{int(bn.pipeline.openings)} openings a year spread evenly over {int(bn.pipeline.lo)}–{int(bn.pipeline.hi)} cups/day, each opening its cheapest counter instead of the {SETUP_LABEL[bn.standard].toLowerCase()} standard.</p>
                <p className="text-[11px] text-[#5B6E8C] mt-1">Curve: {bn.pipeline.source === 'precomputed' ? 'deck data.json (inputs at deck defaults)' : 'recomputed at this scenario\'s inputs'}.</p>
              </> : <p className="text-sm text-[#5B6E8C] mt-1">Computing the volume curve…</p>}
            </div>
            <div className="rounded-xl border border-[#E3DCC8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">One-time · opening stock</div>
              {bn.oneTime && <>
              <div className="text-2xl font-bold text-[#0A2146] mt-1">{sgd0(bn.oneTime.perOpeningVsNaive)} <span className="text-xs font-normal text-[#5B6E8C]">per opening</span></div>
              <p className="text-xs text-[#3E5375] mt-1">Recommended milk order vs ordering the base forecast, at this band. × {int(bn.oneTime.openings)} openings = {sgdK(bn.oneTime.perOpeningVsNaive * bn.oneTime.openings)}.</p>
              <p className="text-xs text-[#3E5375] mt-1">Value of the pre-launch signal (deck's stock term): {sgd0(bn.oneTime.perOpeningSignal)} per opening, {sgdK(bn.oneTime.perOpeningSignal * bn.oneTime.openings)} across openings, only if the signal narrows the band as assumed.</p></>}
            </div>
          </div>
          {bn.pipeline && <div className="mt-4"><PipelineChart bars={bn.pipeline.bars} standard={bn.standard} lo={bn.pipeline.lo} hi={bn.pipeline.hi} /></div>}
          <div className="grid gap-4 md:grid-cols-3 mt-3">
            <Slider meta={META.openingsPerYear} value={i.openingsPerYear} onChange={x => setInput('openingsPerYear', x)} format={x => int(x)} />
            <Slider meta={META.volumeLo} value={i.volumeLo} onChange={x => setInput('volumeLo', Math.min(x, i.volumeHi))} format={x => int(x)} />
            <Slider meta={META.volumeHi} value={i.volumeHi} onChange={x => setInput('volumeHi', Math.max(x, i.volumeLo))} format={x => int(x)} />
          </div>
        </Stale>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          <Explain title="Annualisation basis and what is not counted">
            <p><b>Recurring:</b> cost-per-cup difference (labour + machines + lost sales, ratio of sums over {A.simulation.monte_carlo_draws.value} simulated stores) × steady cups/day × {bn.days} open days a year.
              Steady demand only: opening-hype weeks, ramp-up and price changes are excluded.</p>
            <p><b>Pipeline:</b> openings are spread evenly over the volume range; each point on the 13-point volume grid stands for volumes within half a step of it (deck rule). The cheapest counter is chosen per volume.</p>
            <p><b>One-time:</b> the opening milk order only. It is not added to the recurring figures because it happens once per store.</p>
            <p>A modelled avoided cost against a named standard, not a demonstrated saving against Chagee's current practice.</p>
          </Explain>
          <Explain title="Why there is no operating break-even or payback figure">
            <p><b>Operating break-even</b> (when weekly sales margin covers weekly running costs, and later when cumulative operating profit turns positive) needs a
              target-market rent, local wages for the whole store, a menu price and a gross margin. None of these are in assumptions.json, so the prototype does not invent them.</p>
            <p><b>Investment payback</b> would further need startup investment: fit-out, equipment, deposits and franchise fees. Operating break-even excludes all of
              these, so it is never a payback period.</p>
            <p>The earlier prototype reported a break-even week from synthetic revenue and 92% of a benchmark's costs; it was removed rather than relabelled.
              What this page reports instead is a cost difference between counters, which needs no revenue figure.</p>
          </Explain>
        </div>
      </Card>
    </div>
  );
};
