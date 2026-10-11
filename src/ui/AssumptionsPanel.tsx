/* What the numbers rest on, in three groups: synthetic inputs (editable, invented), fixed model assumptions
 * (assumptions.json, not editable here) and calculated outputs (current scenario). */
import React from 'react';
import { A, D } from '../model/ctx';
import { modelFacts, SETUP_LABEL } from '../model/engine.js';
import { FACTOR_CONFIGS, similarityIndex } from '../data/markets';
import type { ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import { int, num, pct, sgd, sgd0, sgdK } from './kit';

const FACTS = modelFacts({ A, D });
const v = (sec: string, key: string) => (A as any)[sec][key].value;

const Col: React.FC<{ title: string; note: string; rows: [string, React.ReactNode][] }> = ({ title, note, rows }) => (
  <div className="min-w-0">
    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2146]">{title}</h4>
    <p className="text-[11px] text-[#5B6E8C] mb-2">{note}</p>
    <dl className="text-xs grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
      {rows.map(([k, val]) => (
        <React.Fragment key={k}><dt className="text-[#3E5375]">{k}</dt><dd className="text-right tabular-nums font-semibold text-[#0A2146]">{val}</dd></React.Fragment>
      ))}
    </dl>
  </div>
);

export const AssumptionsPanel: React.FC<{ store: ScenarioStore; an: Analysis }> = ({ store, an }) => {
  const sc = store.active, i = sc.inputs, pr = an.pr, p = an.prov, c = an.counter.data, bn = an.benefit.data;
  const hourly: number[] = v('store', 'hourly_demand_share');
  const human: Record<string, number> = v('stations', 'human_seconds_per_cup'), machine: Record<string, number> = v('stations', 'machine_seconds_per_cup');
  const surge: Record<string, number> = v('surge', 'surge_multiplier');
  return (
    <details className="mt-8 rounded-2xl border border-[#E3DCC8] bg-white print:hidden">
      <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-[#0A2146]">
        Assumptions panel: synthetic inputs · fixed model assumptions · calculated outputs
      </summary>
      <div className="grid gap-6 md:grid-cols-3 px-5 pb-5">
        <Col title="Synthetic inputs" note="Invented for illustration and editable in the app. Not Chagee data." rows={[
          ['Market pair', `${store.targetMarket.name.split(' (')[0]} vs ${store.benchmarkMarket.name.split(' (')[0]}`],
          ...FACTOR_CONFIGS.map(f => [f.name, sc.factors[f.id]] as [string, React.ReactNode]),
          ['Pre-registrations · waitlist', i.memberDataAvailable ? `${int(i.preRegistrations)} · ${int(i.waitlist)}` : 'no member data'],
          ['Overlap · conversion', `${pct(i.overlapShare)} · ${pct(i.conversionShare)}`],
          ['Member uplift · tourist add-on', `${i.memberUpliftPct}% · ${i.touristUpliftPct}%`],
          ['Signal strength (band narrowing)', i.memberDataAvailable ? pct(i.signalStrength) : 'n/a'],
          ['Post-opening record', sc.actualsSynthetic ? 'synthetic example' : 'entered by user'],
        ]} />
        <Col title="Fixed model assumptions" note="From the deck's assumptions.json; illustrative, not editable here." rows={[
          ['Open hours · days a year', `${v('store', 'open_hours_per_day')} h · ${v('store', 'open_days_per_year')} d`],
          ['Peak hour share of the day', pct(Math.max(...hourly))],
          ['Band coverage', `${pct(v('demand', 'band_coverage'))} interval`],
          ['Band: no signal → floor', `±${pct(v('demand', 'uncertainty_no_signal'))} → ±${pct(v('demand', 'uncertainty_strong_signal'))}`],
          ['Surge multipliers (2 busiest hours)', Object.values(surge).map(x => `×${x}`).join(' / ')],
          ['Human seconds per cup (6 stations)', `${Object.values(human).reduce((a, b) => a + b, 0)} s`],
          ['Slowest machine station', `${Math.max(...Object.values(machine))} s per unit`],
          ['Monte Carlo draws · seed', `${v('simulation', 'monte_carlo_draws')} · ${v('simulation', 'base_seed')}`],
          ['Tie tolerance', `${sgd(FACTS.tieTolerance)} a cup`],
          ['FX for USD-approved costs', `${FACTS.fx} SGD/USD`],
        ]} />
        <Col title="Calculated outputs" note="Recomputed from the two columns on the left for this scenario." rows={[
          ['Similarity (heuristic index)', `${num(similarityIndex(sc.factors), 1)} / 100`],
          ['Steady demand', `${int(pr.steadyCupsPerDay)} cups/day`],
          ['Band applied', `±${pct(pr.u, 1)} (${int(pr.steady.low / 7)}–${int(pr.steady.high / 7)}/day)`],
          ['Opening milk order', `${int(p.recommended.litres)} L · ${sgd0(p.recommended.total)} expected`],
          ['Two-week milk requirement', `${int(p.twoWeek.baseLitres)} L in ${p.twoWeek.deliveries} deliveries`],
          ['Counter verdict', c ? (c.verdict.tie ? 'Too close to call' : `${SETUP_LABEL[c.verdict.winner]} by ${sgd(c.verdict.margin, 3)}/cup`) : 'computing'],
          ['Avoided cost, pipeline', bn.pipeline ? `${sgdK(bn.pipeline.total)}/yr` : 'computing'],
        ]} />
      </div>
    </details>
  );
};
