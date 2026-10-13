import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Copy } from 'lucide-react';
import { A, ctx } from '../model/ctx';
import { inputMeta, observedBandPrefill, summariseActuals, SYNTHETIC_ACTUALS, SETUP_LABEL, SETUPS, predict, provision, businessCase, businessSensitivity } from '../model/engine.js';
import type { ScenarioStore } from '../state/scenarios';
import { cachedCounter, type Analysis } from '../state/analysis';
import type { ObservedWeek } from '../types';
import type { SetupKey, BusinessYear, CounterResult } from '../model/engine.js';
import { Card, DecisionFrame, Explain, Flag, NumberField, Slider, Stale, StatusBadge, Stat, int, pct, num, sgd, sgd0, sgdK, sgdThousands, secToMin } from '../ui/kit';
import { ForecastChart, PipelineChart } from '../ui/charts';

const META = inputMeta(A);
const CELL_LABEL: Record<string, string> = { cups: 'cups sold that week', repeatShare: 'repeat-customer share, percent', medianServeSec: 'median time to serve, seconds',
  milkWasteL: 'milk wasted, litres', lostOrdersPerDay: 'lost orders per day' };
const U_STRONG = A.demand.uncertainty_strong_signal.value;
const verdictLabel = (c: CounterResult) => (c.verdict.tie ? `Too close to call (${SETUP_LABEL[c.verdict.winner]} vs ${SETUP_LABEL[c.verdict.runnerUp]})`
  : `${SETUP_LABEL[c.verdict.winner]}, by ${sgd(c.verdict.margin, 3)} a cup`);

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
    basedOn: sc.basedOn ?? sc.id,
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

  // Review compares an observed scenario with the plan it was created from.
  const orig = useMemo(() => {
    const o = sc.basedOn ? store.scenarios.find(x => x.id === sc.basedOn) : undefined;
    if (!o) return null;
    const opr = predict(ctx, o.inputs);
    return { sc: o, pr: opr, prov: provision(ctx, o.inputs, opr), ctr: cachedCounter(o.inputs) };
  }, [sc.basedOn, store.scenarios, an.counter.data]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Appendix A4, from this scenario's benefit.
  const bc = useMemo(() => businessCase(ctx, i, bn), [i, bn]);
  const sens = useMemo(() => businessSensitivity(ctx, i, bn), [i, bn]);

  return (
    <div className="space-y-6">
      <DecisionFrame
        gate="Gate 4 · Review" when="After opening" roles={['ops', 'entry', 'supply', 'format']} status={an.counter.status}
        decision="After real sales arrive, does the plan still hold?"
        evidence={[
          ['Feeds the model', 'steady sales · wage · machine quote · milk costs'],
          ['Check by hand', 'service times · lost orders · waste and stockouts of every item vs plan'],
          ['Observed steady sales', obs ? `${int(obs.steadyCupsPerDay)} cups/day vs ${int(pr.steadyCupsPerDay)} planned` : 'enter post-hype weeks'],
        ]}
        action={<>Create an updated scenario using observed inputs and compare it with the original plan.
          {obs ? <> Observed steady demand is {obs.steadyCupsPerDay >= pr.steady.low / 7 && obs.steadyCupsPerDay <= pr.steady.high / 7 ? 'inside' : 'outside'} the planned range.</> : ''}</>}
        tradeoff="Change too early and you chase the opening hype; change too late and the store keeps the wrong stock or counter."
        limitation="Rerunning the model does not validate it, and a new result does not by itself prove that machines should be added. There is no live data connection: values are entered by hand."
        actions={[
          ['ops', `After the first ${i.hypeWeeks} weeks, record steady sales, waste, stockouts of every item, service times and lost orders.`],
          ['entry', 'Revise the demand estimate from post-hype sales and enter it, with the latest wage and machine quote, as the updated scenario.'],
          ['supply', 'Compare milk waste and shortages with the worked example and other stockouts with the opening list; update inputs only for a known reason.'],
          ['format', 'Change the counter only if the full updated comparison changes, not because one threshold was crossed.'],
        ]}
        calc={[
          'Post-hype sales: revise the demand estimate. Feeds the model (steady cups per day).',
          'Waste and stockouts: reassess the ordering assumptions. Diagnostic: milk against the expected waste and shortage; other items against the opening list (not modelled).',
          'Service times and lost orders: check whether the service model matches reality. Diagnostic only: the model contains no measured service times.',
          'Updated wages and machine quotes: rerun the counter comparison. Feeds the model directly.',
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

      {orig && (
        <Card kicker="Review" title="Updated scenario versus the original plan">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Updated scenario compared with the original plan</caption>
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-[#6B7C99] border-b border-[#ECE5D3]">
                <th scope="col" className="py-1.5 pr-3">Output</th><th scope="col" className="pr-3">Original plan · {orig.sc.name}</th><th scope="col">Updated · {sc.name}</th>
              </tr></thead>
              <tbody>
                {([
                  ['Steady demand', `${int(orig.pr.steadyCupsPerDay)} cups/day`, `${int(pr.steadyCupsPerDay)} cups/day`],
                  ['Demand range (80%)', `±${pct(orig.pr.u, 1)} · ${int(orig.pr.steady.low / 7)}–${int(orig.pr.steady.high / 7)}/day`, `±${pct(pr.u, 1)} · ${int(pr.steady.low / 7)}–${int(pr.steady.high / 7)}/day`],
                  ['First fresh-milk delivery', `${int(orig.prov.recommended.litres)} L`, `${int(prov.recommended.litres)} L`],
                  ['Wage · machine quote', `${sgd(orig.sc.inputs.wage)}/h · ${sgd0(orig.sc.inputs.machineMonth)}`, `${sgd(i.wage)}/h · ${sgd0(i.machineMonth)}`],
                  ['Counter verdict', orig.ctr ? verdictLabel(orig.ctr) : 'open the original scenario once to compute it', c ? verdictLabel(c) : 'computing…'],
                ] as [string, string, string][]).map(([k, a, b]) => (
                  <tr key={k} className="border-b border-[#F3EEE2]"><th scope="row" className="py-1.5 pr-3 text-left font-semibold text-[#0A2146]">{k}</th>
                    <td className="pr-3 tabular-nums">{a}</td><td className={`tabular-nums ${a !== b ? 'font-semibold text-[#0A2146]' : ''}`}>{b}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#5B6E8C] mt-2">
            {orig.ctr && c ? (orig.ctr.verdict.winner === c.verdict.winner && orig.ctr.verdict.tie === c.verdict.tie
              ? 'The full comparison gives the same counter as the original plan: no change to the counter is indicated.'
              : 'The full comparison now favours a different counter (or a tie). Treat it as a candidate to pilot, not proof: rerunning the model does not validate it.')
              : 'Both scenarios use the same model; only the entered inputs differ.'}
          </p>
        </Card>
      )}

      {/* ---------------- benefit ---------------- */}
      <Card kicker="Benefit" title="Illustrative avoided cost: what choosing per store is worth (quantified part only)" right={<StatusBadge status={bs} />}>
        <p className="text-sm text-[#2D496E] -mt-2 mb-3">Comparison: a {SETUP_LABEL[i.standardSetup].toLowerCase()} counter at every opening versus choosing each store&rsquo;s counter for its modelled conditions.
          The quantified inventory benefit covers the fresh-milk example only; benefits for tea, other ingredients and packaging have not been estimated.</p>
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
          <Explain title="Store break-even versus the A4 business case">
            <p><b>Store operating break-even</b> (weekly sales margin covering weekly running costs, then cumulative operating profit turning positive) is not computed.
              It would need a target-market rent, wages for the whole store, a menu price and a gross margin, none of which are in assumptions.json.
              A store <b>investment payback</b> would further need fit-out, equipment, deposits and franchise fees.</p>
            <p>The <b>A4 business case</b> below is different: it sets the modelled avoided cost of the four gates against the approved, illustrative cost of building and running them.
              It is a payback for the initiative, not for a store, and it contains no sales revenue.</p>
          </Explain>
        </div>
      </Card>

      <Card kicker="Appendix A4 · revenue and cost analysis" title="Business case for the four gates (illustrative)" right={<StatusBadge status={bs} />}>
        {bc ? (
          <Stale status={bs}>
            <p className="text-sm text-[#2D496E] -mt-2 mb-3">
              Over {bc.years.length} years the modelled savings {bc.payback
                ? <>cover the cost of building and running the gates in <b>year {bc.payback}</b>, leaving about <b>{sgdThousands(bc.cum)}</b> ahead.</>
                : <>do not cover the cost of building and running the gates: about <b>{sgdThousands(-bc.cum)}</b> short after year {bc.years.length}.</>}
              {' '}The benefit is the modelled avoided cost above (counter plus fresh-milk stock), not sales revenue and not a payback for a store.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs tabular-nums min-w-[640px]">
                <caption className="sr-only">Five-year revenue and cost table, SGD</caption>
                <thead><tr className="text-right text-[10.5px] uppercase tracking-wide text-[#6B7C99] border-b border-[#ECE5D3]">
                  <th scope="col" className="py-1.5 pr-3 text-left">SGD</th>{bc.years.map(y => <th key={y.year} scope="col" className="pr-3">Year {y.year}</th>)}
                </tr></thead>
                <tbody>
                  {([
                    ['Store-years using the gates', (y: BusinessYear) => int(y.storeYears), false],
                    ['Counter saving (recurring)', (y: BusinessYear) => sgdThousands(y.counter), false],
                    ['Fresh-milk opening stock (once per opening)', (y: BusinessYear) => sgdThousands(y.stock), false],
                    ['Total benefit', (y: BusinessYear) => sgdThousands(y.benefit), true],
                    ['Build the four gates', (y: BusinessYear) => (y.build ? sgdThousands(y.build) : '–'), false],
                    ['Data integration and set-up', (y: BusinessYear) => (y.integ ? sgdThousands(y.integ) : '–'), false],
                    ['Maintenance team', (y: BusinessYear) => sgdThousands(y.maint), false],
                    ['Platform and licences', (y: BusinessYear) => sgdThousands(y.platform), false],
                    ['Gate 4 reviews', (y: BusinessYear) => sgdThousands(y.review), false],
                    ['Total cost', (y: BusinessYear) => sgdThousands(y.cost), true],
                    ['Net benefit', (y: BusinessYear) => sgdThousands(y.net), true],
                    ['Cumulative net', (y: BusinessYear) => sgdThousands(y.cum), true],
                  ] as [string, (y: BusinessYear) => string, boolean][]).map(([k, f, strong]) => (
                    <tr key={k} className={`border-b border-[#F3EEE2] ${strong ? 'font-semibold text-[#0A2146]' : ''}`}>
                      <th scope="row" className="py-1 pr-3 text-left font-[inherit]">{k}</th>{bc.years.map(y => <td key={y.year} className="pr-3 text-right">{f(y)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2146] mb-1">Stress cases</h4>
                <table className="w-full text-xs tabular-nums">
                  <caption className="sr-only">Business case sensitivity</caption>
                  <thead><tr className="text-left text-[10.5px] uppercase text-[#6B7C99] border-b border-[#ECE5D3]"><th scope="col" className="py-1">Case</th><th scope="col" className="text-right pr-3">Cumulative net, year {bc.years.length}</th><th scope="col">Payback</th></tr></thead>
                  <tbody>{sens.map(r => r && (
                    <tr key={r.label} className="border-b border-[#F3EEE2]"><th scope="row" className="py-1 text-left font-normal">{r.label}</th>
                      <td className={`text-right pr-3 ${r.cum < 0 ? 'text-[#9B2C1F]' : ''}`}>{sgdThousands(r.cum)}</td><td>{r.payback ? `year ${r.payback}` : `not within ${bc.years.length} years`}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <Explain title="How it is calculated and what it rests on">
                <p>Counter saving per store-year = {sgd0(bc.perStore)}: the yearly cost of the {SETUP_LABEL[i.standardSetup].toLowerCase()} standard above the cheapest counter, averaged over openings spread across the volume range above. It recurs.</p>
                <p>Fresh-milk stock = {sgd0(bc.perOpen)} per opening, once: the best first order with no signal minus with the signal. It holds only if sign-ups narrow the range as assumed. No other inventory is estimated.</p>
                <p>Store-years: earlier openings trade all year, new ones half a year. Openings held flat at {int(i.openingsPerYear)} a year.</p>
                <p>Costs (assumptions.json business_case, approved, illustrative): build {A.business_case.build_people.value} people × {A.business_case.build_months.value} months × {bc.mday} days × {sgd0(bc.rate)}/day = {sgdThousands(bc.build)}; integration {sgdThousands(bc.integ)} once;
                  maintenance {A.business_case.maintenance_people.value} people = {sgdThousands(bc.maint)} a year; platform {sgd0(A.business_case.platform_per_store_month.value)} per store-month; one analyst day per opening for Review.</p>
                <p>Thin: payback, if any, arrives late, and the stress cases show it rests on the per-store counter saving, which a pilot with real Chagee data should test first.</p>
              </Explain>
            </div>
          </Stale>
        ) : <p className="text-sm text-[#5B6E8C]">Waiting for the volume curve…</p>}
      </Card>
    </div>
  );
};
